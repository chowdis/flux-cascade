import { pool, toNum } from "@/lib/db";
import type { HistogramBucket } from "@/lib/histogram";

export const SOC_BANDS = ["below20", "20to50", "50to80", "80to100"] as const;
export type SocBand = (typeof SOC_BANDS)[number];

export interface SocBandHours {
  band: SocBand;
  hours: number;
}

/**
 * How much *time* (not how many sessions) the battery actually spends in
 * each state-of-charge band — the exposure that's understood to drive
 * degradation, as opposed to a snapshot at the start/end of a drive or
 * charge. Built the same way as the vampire-drain query (drain.ts): pairs
 * consecutive `positions` samples with LAG and attributes the gap between
 * them to the earlier sample's battery level. Gaps over 6h are dropped —
 * the car was very likely offline/out of range, not actually sitting at
 * that charge level the whole time.
 *
 * Unlike the drive-timing bucketing in drivingHabits.ts, band membership
 * here depends only on battery_level, not on local time-of-day, so doing
 * this bucketing in SQL (rather than pulling every raw sample into Node)
 * has no timezone pitfall.
 */
export async function getSocBandHours(
  carId: number,
  days = 90
): Promise<SocBandHours[]> {
  const { rows } = await pool.query(
    `with p as (
       select date, battery_level,
              lag(date) over (order by date) as prev_date,
              lag(battery_level) over (order by date) as prev_battery_level
       from positions
       where car_id = $1
         and date > now() - ($2 || ' days')::interval - interval '1 day'
     ),
     intervals as (
       select
         prev_battery_level as battery_level,
         extract(epoch from (date - prev_date)) / 3600.0 as hours
       from p
       where prev_date is not null
         and prev_battery_level is not null
         and date - prev_date between interval '1 minute' and interval '6 hours'
         and date > now() - ($2 || ' days')::interval
     )
     select
       case
         when battery_level < 20 then 'below20'
         when battery_level < 50 then '20to50'
         when battery_level < 80 then '50to80'
         else '80to100'
       end as band,
       sum(hours) as hours
     from intervals
     group by 1`,
    [carId, days]
  );

  const byBand = new Map(rows.map((r) => [r.band as SocBand, toNum(r.hours) ?? 0]));
  return SOC_BANDS.map((band) => ({ band, hours: byBand.get(band) ?? 0 }));
}

export interface SocSample {
  batteryLevel: number | null;
}

/** Battery level at the start of each completed charging session. */
export async function getChargeStartSoc(
  carId: number,
  days = 90
): Promise<SocSample[]> {
  const { rows } = await pool.query(
    `select start_battery_level as battery_level
     from charging_processes
     where car_id = $1
       and end_date is not null
       and start_date > now() - ($2 || ' days')::interval`,
    [carId, days]
  );
  return rows.map((r) => ({ batteryLevel: r.battery_level }));
}

/** Battery level at the end of each completed charging session. */
export async function getChargeEndSoc(
  carId: number,
  days = 90
): Promise<SocSample[]> {
  const { rows } = await pool.query(
    `select end_battery_level as battery_level
     from charging_processes
     where car_id = $1
       and end_date is not null
       and start_date > now() - ($2 || ' days')::interval`,
    [carId, days]
  );
  return rows.map((r) => ({ batteryLevel: r.battery_level }));
}

/** Battery level at the start of each drive (joins to `positions` — `drives`
 * itself has no battery-level column, same as getDrives in drives.ts). */
export async function getDriveStartSoc(
  carId: number,
  days = 90
): Promise<SocSample[]> {
  const { rows } = await pool.query(
    `select sp.battery_level as battery_level
     from drives d
     join positions sp on sp.id = d.start_position_id
     where d.car_id = $1
       and d.end_date is not null
       and d.distance > 0.5
       and d.start_date > now() - ($2 || ' days')::interval`,
    [carId, days]
  );
  return rows.map((r) => ({ batteryLevel: r.battery_level }));
}

// ---------------------------------------------------------------------------
// Pure, DB-free helpers.
// ---------------------------------------------------------------------------

const PERCENT_BUCKET_LABELS = [
  "0-10", "10-20", "20-30", "30-40", "40-50",
  "50-60", "60-70", "70-80", "80-90", "90-100",
];

/** Buckets 0-100 values into ten 10-point-wide bands, 100 itself landing in "90-100". */
export function buildPercentHistogram(samples: SocSample[]): HistogramBucket[] {
  const buckets = PERCENT_BUCKET_LABELS.map((label) => ({ label, count: 0 }));
  for (const s of samples) {
    if (s.batteryLevel === null) continue;
    const idx = Math.min(9, Math.floor(s.batteryLevel / 10));
    if (idx >= 0) buckets[idx].count += 1;
  }
  return buckets;
}

export function shareBelow(samples: SocSample[], threshold: number): number {
  const withValue = samples.filter((s) => s.batteryLevel !== null);
  if (withValue.length === 0) return 0;
  const below = withValue.filter((s) => (s.batteryLevel as number) < threshold);
  return (below.length / withValue.length) * 100;
}

export function shareAtOrAbove(samples: SocSample[], threshold: number): number {
  const withValue = samples.filter((s) => s.batteryLevel !== null);
  if (withValue.length === 0) return 0;
  const above = withValue.filter((s) => (s.batteryLevel as number) >= threshold);
  return (above.length / withValue.length) * 100;
}

export function average(samples: SocSample[]): number | null {
  const withValue = samples
    .map((s) => s.batteryLevel)
    .filter((v): v is number => v !== null);
  if (withValue.length === 0) return null;
  return withValue.reduce((sum, v) => sum + v, 0) / withValue.length;
}
