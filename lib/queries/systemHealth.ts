import { pool, toNum } from "@/lib/db";

// Mirrors the exact thresholds getVehicleStatus (status.ts) uses to decide
// whether an open charging/drive row is trustworthy — so this page shows
// *why* Overview currently believes or disbelieves each one, not a
// different opinion about it.
const STALE_CHARGE_THRESHOLD_MS = 30 * 60 * 1000;
const STALE_POSITION_THRESHOLD_MS = 15 * 60 * 1000;
const RECENT_MOVEMENT_WINDOW_MINUTES = 10;

export interface LastTelemetry {
  lastPositionDate: string | null;
  lastState: string | null;
  lastStateDate: string | null;
}

export async function getLastTelemetry(carId: number): Promise<LastTelemetry> {
  const [posRes, stateRes] = await Promise.all([
    pool.query(
      `select date from positions where car_id = $1 order by date desc limit 1`,
      [carId]
    ),
    pool.query(
      `select state, start_date from states where car_id = $1 order by start_date desc limit 1`,
      [carId]
    ),
  ]);
  return {
    lastPositionDate: posRes.rows[0]?.date ?? null,
    lastState: stateRes.rows[0]?.state ?? null,
    lastStateDate: stateRes.rows[0]?.start_date ?? null,
  };
}

export interface OpenSession {
  type: "charge" | "drive";
  id: number;
  startDate: string;
  lastTelemetryDate: string | null;
  /** Whether this row currently passes the same checks Overview uses. */
  isCurrentlyTrusted: boolean;
}

/**
 * Every charging_processes/drives row for this car with no end_date —
 * normally at most one of each (the single "current" session), but a
 * connection loss can leave old ones stuck open forever, since nothing
 * ever comes back to close them. Overview only ever looks at the single
 * newest row of each type (order by start_date desc limit 1), so any
 * older ones here are pure historical debris it never shows — but they're
 * exactly the kind of thing worth knowing accumulated.
 */
export async function getOpenSessions(carId: number): Promise<OpenSession[]> {
  const [chargeRes, driveRes] = await Promise.all([
    pool.query(
      `select cp.id, cp.start_date, latest.last_sample_date
       from charging_processes cp
       left join lateral (
         select max(c.date) as last_sample_date
         from charges c
         where c.charging_process_id = cp.id
       ) latest on true
       where cp.car_id = $1 and cp.end_date is null
       order by cp.start_date desc`,
      [carId]
    ),
    pool.query(
      `select d.id, d.start_date,
              latest.last_position_date,
              recent.max_speed as recent_max_speed
       from drives d
       left join lateral (
         select max(p.date) as last_position_date
         from positions p
         where p.drive_id = d.id
       ) latest on true
       left join lateral (
         select max(p2.speed) as max_speed
         from positions p2
         where p2.drive_id = d.id
           and p2.date > now() - interval '${RECENT_MOVEMENT_WINDOW_MINUTES} minutes'
       ) recent on true
       where d.car_id = $1 and d.end_date is null
       order by d.start_date desc`,
      [carId]
    ),
  ]);

  const charges: OpenSession[] = chargeRes.rows.map((r) => {
    const referenceDate = r.last_sample_date ?? r.start_date;
    const isCurrentlyTrusted =
      referenceDate !== null &&
      Date.now() - new Date(referenceDate).getTime() < STALE_CHARGE_THRESHOLD_MS;
    return {
      type: "charge",
      id: r.id,
      startDate: r.start_date,
      lastTelemetryDate: r.last_sample_date ?? null,
      isCurrentlyTrusted,
    };
  });

  const drives: OpenSession[] = driveRes.rows.map((r) => {
    const isPositionRecent =
      r.last_position_date !== null &&
      Date.now() - new Date(r.last_position_date).getTime() < STALE_POSITION_THRESHOLD_MS;
    const hasRecentMovement =
      toNum(r.recent_max_speed) !== null && (toNum(r.recent_max_speed) as number) > 0;
    return {
      type: "drive",
      id: r.id,
      startDate: r.start_date,
      lastTelemetryDate: r.last_position_date ?? null,
      isCurrentlyTrusted: isPositionRecent && hasRecentMovement,
    };
  });

  return [...charges, ...drives].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

export interface LoggingGap {
  gapStart: string;
  gapEnd: string;
  hours: number;
}

/**
 * Gaps between consecutive `positions` samples wider than `thresholdHours`
 * — a car that's online should report roughly every few minutes even
 * parked, so a multi-hour silence usually means TeslaMate lost its
 * connection to the vehicle (or to Tesla's API) for a while. These gaps
 * are the most common *cause* of a stuck-open session: whatever was
 * happening when the connection dropped never gets a proper closing
 * telemetry sample.
 */
export async function getLoggingGaps(
  carId: number,
  days = 30,
  thresholdHours = 2
): Promise<LoggingGap[]> {
  const { rows } = await pool.query(
    `with p as (
       select date,
              lag(date) over (order by date) as prev_date
       from positions
       where car_id = $1
         and date > now() - ($2 || ' days')::interval - interval '1 day'
     )
     select prev_date as gap_start, date as gap_end,
            extract(epoch from (date - prev_date)) / 3600.0 as hours
     from p
     where prev_date is not null
       and date - prev_date > ($3 || ' hours')::interval
       and date > now() - ($2 || ' days')::interval
     order by date desc
     limit 20`,
    [carId, days, thresholdHours]
  );
  return rows.map((r) => ({
    gapStart: r.gap_start,
    gapEnd: r.gap_end,
    hours: toNum(r.hours) ?? 0,
  }));
}
