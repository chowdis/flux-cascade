import { pool, toNum } from "@/lib/db";

export interface DriveTiming {
  startDate: string;
  distanceKm: number;
  speedMaxKph: number | null;
}

/**
 * Raw per-drive rows for time-of-day/day-of-week and distribution
 * analysis. Deliberately returns raw timestamps rather than bucketing by
 * hour/day-of-week in SQL: TeslaMate's Postgres has no local timezone
 * configured (it stores and computes in UTC), while this app's Node
 * process already runs with a real local TZ set (see the Dockerfile's
 * tzdata note) and every other date on every page is formatted in Node
 * for that reason. Bucketing here in JS instead keeps that the one place
 * "local time" is decided, rather than re-deriving it in SQL and risking
 * the two disagreeing.
 */
export async function getDriveTimings(
  carId: number,
  days = 90
): Promise<DriveTiming[]> {
  const { rows } = await pool.query(
    `select start_date, distance, speed_max
     from drives
     where car_id = $1
       and end_date is not null
       and distance > 0.5
       and start_date > now() - ($2 || ' days')::interval
     order by start_date`,
    [carId, days]
  );
  return rows.map((r) => ({
    startDate: r.start_date,
    distanceKm: toNum(r.distance) ?? 0,
    speedMaxKph: r.speed_max,
  }));
}

// ---------------------------------------------------------------------------
// Pure, DB-free bucketing helpers. Only called from the (Server Component)
// page, but kept free of side effects and easy to unit-test in isolation.
// ---------------------------------------------------------------------------

export interface HeatmapData {
  /** counts[dayOfWeek 0-6 (Sun-Sat)][hour 0-23] = number of drives started then */
  counts: number[][];
  maxCount: number;
}

export function buildHourDayHeatmap(timings: DriveTiming[]): HeatmapData {
  const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const t of timings) {
    const d = new Date(t.startDate);
    counts[d.getDay()][d.getHours()] += 1;
  }
  const maxCount = Math.max(1, ...counts.flat());
  return { counts, maxCount };
}

export interface HistogramBucket {
  label: string;
  count: number;
}

const DISTANCE_BUCKETS: { max: number; label: string }[] = [
  { max: 2, label: "0-2" },
  { max: 5, label: "2-5" },
  { max: 10, label: "5-10" },
  { max: 20, label: "10-20" },
  { max: 50, label: "20-50" },
  { max: 100, label: "50-100" },
  { max: Infinity, label: "100+" },
];

export function buildDistanceHistogram(timings: DriveTiming[]): HistogramBucket[] {
  const buckets = DISTANCE_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const t of timings) {
    const idx = DISTANCE_BUCKETS.findIndex((b) => t.distanceKm <= b.max);
    buckets[idx === -1 ? buckets.length - 1 : idx].count += 1;
  }
  return buckets;
}

const SPEED_BUCKETS: { max: number; label: string }[] = [
  { max: 30, label: "0-30" },
  { max: 50, label: "30-50" },
  { max: 70, label: "50-70" },
  { max: 90, label: "70-90" },
  { max: 110, label: "90-110" },
  { max: Infinity, label: "110+" },
];

export function buildSpeedHistogram(timings: DriveTiming[]): HistogramBucket[] {
  const buckets = SPEED_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const t of timings) {
    if (t.speedMaxKph === null) continue;
    const speed = t.speedMaxKph;
    const idx = SPEED_BUCKETS.findIndex((b) => speed <= b.max);
    buckets[idx === -1 ? buckets.length - 1 : idx].count += 1;
  }
  return buckets;
}

export interface WeekdayWeekendGroup {
  drives: number;
  distanceKm: number;
  avgDistancePerDay: number;
  avgDrivesPerDay: number;
  avgTripLengthKm: number;
}

export interface WeekdayWeekendSummary {
  weekday: WeekdayWeekendGroup;
  weekend: WeekdayWeekendGroup;
}

function isWeekend(startDate: string): boolean {
  const dow = new Date(startDate).getDay();
  return dow === 0 || dow === 6;
}

/** Actual count of weekday vs. weekend calendar days in the trailing window, so
 * "avg per day" isn't skewed by the window simply containing more weekdays. */
function countWeekdayWeekendDays(windowDays: number): {
  weekdayDays: number;
  weekendDays: number;
} {
  const now = new Date();
  let weekdayDays = 0;
  let weekendDays = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekendDays++;
    else weekdayDays++;
  }
  return { weekdayDays, weekendDays };
}

function summarize(drives: DriveTiming[], dayCount: number): WeekdayWeekendGroup {
  const distanceKm = drives.reduce((sum, d) => sum + d.distanceKm, 0);
  return {
    drives: drives.length,
    distanceKm,
    avgDistancePerDay: dayCount > 0 ? distanceKm / dayCount : 0,
    avgDrivesPerDay: dayCount > 0 ? drives.length / dayCount : 0,
    avgTripLengthKm: drives.length > 0 ? distanceKm / drives.length : 0,
  };
}

export function buildWeekdayWeekendSummary(
  timings: DriveTiming[],
  windowDays: number
): WeekdayWeekendSummary {
  const { weekdayDays, weekendDays } = countWeekdayWeekendDays(windowDays);
  const weekday = timings.filter((t) => !isWeekend(t.startDate));
  const weekend = timings.filter((t) => isWeekend(t.startDate));
  return {
    weekday: summarize(weekday, weekdayDays),
    weekend: summarize(weekend, weekendDays),
  };
}
