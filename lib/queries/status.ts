import { pool, toNum } from "@/lib/db";

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
 * driving/charging on its own — if TeslaMate loses its connection mid-drive
 * (restart, network blip) the row can be left open indefinitely, with no
 * further positions ever attributed to it. So "active" additionally requires:
 *  - the car's actual state is `online` (it can't be driving/charging while
 *    asleep or offline, whatever a stale open row claims), and
 *  - for a drive specifically, the single most recent position is attributed
 *    to that exact drive — i.e. there's live telemetry proving it's still
 *    the current one, not a leftover from months ago.
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
      `select battery_level, ideal_battery_range_km, rated_battery_range_km,
              odometer, latitude, longitude, outside_temp, is_climate_on, drive_id
       from positions
       where car_id = $1
       order by date desc
       limit 1`,
      [carId]
    ),
    pool.query(
      `select cp.start_date, cp.charge_energy_added, a.display_name as address
       from charging_processes cp
       left join addresses a on a.id = cp.address_id
       where cp.car_id = $1 and cp.end_date is null
       order by cp.start_date desc
       limit 1`,
      [carId]
    ),
    pool.query(
      `select d.id, d.start_date, a.display_name as address
       from drives d
       left join addresses a on a.id = d.start_address_id
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
  const c = isOnline ? chargeRes.rows[0] : undefined;
  const dRow = driveRes.rows[0];
  const d = isOnline && dRow && dRow.id === p?.drive_id ? dRow : undefined;

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
          address: c.address ?? null,
        }
      : null,
    activeDrive: d
      ? {
          startDate: d.start_date,
          address: d.address ?? null,
        }
      : null,
  };
}
