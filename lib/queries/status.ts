import { pool, toNum } from "@/lib/db";
import { formatLocationLine, formatCityLine, type AddressRow } from "@/lib/address";

export interface VehicleStatus {
  state: string;
  since: string | null;
  batteryLevel: number | null;
  idealRangeKm: number | null;
  ratedRangeKm: number | null;
  odometerKm: number | null;
  latitude: number | null;
  longitude: number | null;
  outsideTempC: number | null;
  isClimateOn: boolean | null;
  activeCharge: {
    startDate: string;
    energyAdded: number | null;
    address: string | null;
  } | null;
  activeDrive: {
    startDate: string;
    address: string | null;
  } | null;
}

// A charging session still genuinely in progress logs a new `charges`
// sample roughly once a minute; if the most recent one is older than this,
// treat the session as not actually active regardless of what its (never
// properly closed) row claims — see the proof-of-currency note below.
const STALE_CHARGE_THRESHOLD_MS = 30 * 60 * 1000;

// A car actively driving logs a new position roughly every 10-30 seconds.
// If the single most recent position on record is older than this, it's
// not live telemetry any more (the car likely went to sleep, or TeslaMate
// stopped hearing from it) and can't be used to prove a still-open drive
// row is actually still happening right now.
const STALE_POSITION_THRESHOLD_MS = 15 * 60 * 1000;

// How far back to look for actual movement (positions.speed > 0) under an
// open drive before concluding it isn't really ongoing — see the note
// below on why fresh telemetry alone isn't proof of a live drive.
const RECENT_MOVEMENT_WINDOW_MINUTES = 10;

// TeslaMate's `addresses.display_name` is the full raw reverse-geocoded
// string (street, city, state, postal code, country) — too much for a
// one-line status line. Build the same short "street, city/state" line
// used on the Charging/Drives pages instead, from the individual columns.
function formatSingleLine(a: AddressRow): string | null {
  const line = [formatLocationLine(a), formatCityLine(a)]
    .filter(Boolean)
    .join(", ");
  return line || null;
}

/**
 * TeslaMate has no single "current status" table. This assembles one from:
 *  - `states`: the latest activity state — only ever online/asleep/offline,
 *    never "driving"/"charging" (that's derived below).
 *  - `positions`: the latest telemetry snapshot, including which drive (if
 *    any) it's currently attributed to.
 *  - `charging_processes` / `drives`: whichever has an open (end_date is
 *    null) row, to know if the car is actively charging or driving right
 *    now.
 *
 * An open `drives`/`charging_processes` row isn't proof the car is *currently*
 * driving/charging on its own — if TeslaMate loses its connection mid-session
 * (restart, network blip) the row can be left open indefinitely, with no
 * further telemetry ever attributed to it. So "active" additionally requires:
 *  - the car's actual state is `online` (it can't be driving/charging while
 *    asleep or offline, whatever a stale open row claims);
 *  - for a drive specifically: the single most recent position is both
 *    attributed to that exact drive AND itself less than 15 minutes old
 *    (rules out a drive with nothing newer ever logged since it really
 *    ended — e.g. the car went straight to sleep); AND one of the
 *    positions logged for that drive in the last 10 minutes actually shows
 *    movement (speed > 0). That second check turned out to matter in
 *    practice: TeslaMate can keep a drive open and keep attributing fresh,
 *    perfectly-recent positions to it — with drive_id matching and
 *    everything — even though the car is just sitting there, if it never
 *    saw the "drive ended" transition. Fresh telemetry alone isn't proof
 *    of an ongoing drive; actual recent motion is; and
 *  - for a charge specifically, its most recent `charges` sample (or, if
 *    charging just started and no sample has landed yet, its start_date) is
 *    within the last half hour — a charge can legitimately run for hours
 *    (an overnight AC session), so only the *last-seen-recently* check can
 *    tell current from stale, not how long ago it started.
 *
 * Column names match TeslaMate's schema as of ~1.28-1.32. If your instance is on a
 * different version and a query errors, check `\d positions` etc. in psql and adjust.
 */
export async function getVehicleStatus(
  carId: number
): Promise<VehicleStatus | null> {
  const [stateRes, posRes, chargeRes, driveRes] = await Promise.all([
    pool.query(
      `select state, start_date
       from states
       where car_id = $1
       order by start_date desc
       limit 1`,
      [carId]
    ),
    pool.query(
      `select date, battery_level, ideal_battery_range_km, rated_battery_range_km,
              odometer, latitude, longitude, outside_temp, is_climate_on, drive_id
       from positions
       where car_id = $1
       order by date desc
       limit 1`,
      [carId]
    ),
    pool.query(
      `select cp.start_date, cp.charge_energy_added,
              a.name, a.house_number, a.road, a.city, a.county, a.state,
              latest.last_sample_date
       from charging_processes cp
       left join addresses a on a.id = cp.address_id
       left join lateral (
         select max(c.date) as last_sample_date
         from charges c
         where c.charging_process_id = cp.id
       ) latest on true
       where cp.car_id = $1 and cp.end_date is null
       order by cp.start_date desc
       limit 1`,
      [carId]
    ),
    pool.query(
      `select d.id, d.start_date,
              a.name, a.house_number, a.road, a.city, a.county, a.state,
              recent.max_speed
       from drives d
       left join addresses a on a.id = d.start_address_id
       left join lateral (
         select max(p2.speed) as max_speed
         from positions p2
         where p2.drive_id = d.id
           and p2.date > now() - interval '${RECENT_MOVEMENT_WINDOW_MINUTES} minutes'
       ) recent on true
       where d.car_id = $1 and d.end_date is null
       order by d.start_date desc
       limit 1`,
      [carId]
    ),
  ]);

  const s = stateRes.rows[0];
  const p = posRes.rows[0];
  if (!s && !p) return null;

  const isOnline = s?.state === "online";

  const cRow = chargeRes.rows[0];
  const chargeReferenceDate = cRow?.last_sample_date ?? cRow?.start_date ?? null;
  const isChargeCurrent =
    chargeReferenceDate !== null &&
    Date.now() - new Date(chargeReferenceDate).getTime() < STALE_CHARGE_THRESHOLD_MS;
  const c = isOnline && cRow && isChargeCurrent ? cRow : undefined;

  const isPositionRecent =
    p?.date !== undefined &&
    Date.now() - new Date(p.date).getTime() < STALE_POSITION_THRESHOLD_MS;

  const dRow = driveRes.rows[0];
  const hasRecentMovement = toNum(dRow?.max_speed) !== null && (toNum(dRow?.max_speed) as number) > 0;
  const d =
    isOnline &&
    isPositionRecent &&
    hasRecentMovement &&
    dRow &&
    dRow.id === p?.drive_id
      ? dRow
      : undefined;

  return {
    state: s?.state ?? "unknown",
    since: s?.start_date ?? null,
    batteryLevel: p?.battery_level ?? null,
    idealRangeKm: toNum(p?.ideal_battery_range_km),
    ratedRangeKm: toNum(p?.rated_battery_range_km),
    odometerKm: toNum(p?.odometer),
    latitude: toNum(p?.latitude),
    longitude: toNum(p?.longitude),
    outsideTempC: toNum(p?.outside_temp),
    isClimateOn: p?.is_climate_on ?? null,
    activeCharge: c
      ? {
          startDate: c.start_date,
          energyAdded: toNum(c.charge_energy_added),
          address: formatSingleLine(c),
        }
      : null,
    activeDrive: d
      ? {
          startDate: d.start_date,
          address: formatSingleLine(d),
        }
      : null,
  };
}
