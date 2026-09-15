import { pool, toNum } from "@/lib/db";

export interface MonthlyRealEfficiency {
  month: string;
  distanceKm: number;
  energyKwh: number;
  whPerKm: number | null;
}

/**
 * "Real-world" efficiency: total energy added at the charger divided by
 * total distance driven, per calendar month — as opposed to the
 * rated-range-based estimate on `getEfficiencyTrend`, which TeslaMate can
 * compute per-drive but which is really "how close to Tesla's rated range
 * you drove", not actual Wh/km.
 *
 * This number runs a bit high vs. true vehicle consumption since it also
 * bakes in charging losses and vampire drain, and a given month's charging
 * doesn't line up 1:1 with that month's driving (you might charge on the
 * 1st for miles driven at the end of the previous month). Treat it as a
 * trend indicator, not a precise per-drive figure.
 */
export async function getRealEfficiencyTrend(
  carId: number,
  months = 12
): Promise<MonthlyRealEfficiency[]> {
  const [driveRows, chargeRows] = await Promise.all([
    pool.query(
      `select date_trunc('month', start_date) as month,
              coalesce(sum(distance), 0) as distance_km
       from drives
       where car_id = $1
         and end_date is not null
         and distance > 0.5
         and start_date > now() - ($2 || ' months')::interval
       group by 1
       order by 1`,
      [carId, months]
    ),
    pool.query(
      `select date_trunc('month', start_date) as month,
              coalesce(sum(charge_energy_added), 0) as energy_kwh
       from charging_processes
       where car_id = $1
         and end_date is not null
         and start_date > now() - ($2 || ' months')::interval
       group by 1
       order by 1`,
      [carId, months]
    ),
  ]);

  const byMonth = new Map<string, { distanceKm: number; energyKwh: number }>();
  for (const r of driveRows.rows) {
    const key = new Date(r.month).toISOString();
    byMonth.set(key, { distanceKm: toNum(r.distance_km) ?? 0, energyKwh: 0 });
  }
  for (const r of chargeRows.rows) {
    const key = new Date(r.month).toISOString();
    const entry = byMonth.get(key) ?? { distanceKm: 0, energyKwh: 0 };
    entry.energyKwh = toNum(r.energy_kwh) ?? 0;
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      distanceKm: v.distanceKm,
      energyKwh: v.energyKwh,
      whPerKm: v.distanceKm > 0 ? (v.energyKwh * 1000) / v.distanceKm : null,
    }));
}
