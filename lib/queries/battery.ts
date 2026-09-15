import { pool } from "@/lib/db";

export interface BatteryHealthPoint {
  month: string;
  estRatedRangeAt100Km: number;
}

/**
 * TeslaMate doesn't store a "battery health %" directly. This approximates
 * degradation the same way the community Grafana battery-health panel does:
 * normalize each observed rated range to what it would be at 100% charge
 * (rated_range / battery_level * 100), then take the best (highest) such
 * estimate per month. Comparing the first available month to the most recent
 * gives a rough degradation trend, not a lab-accurate figure.
 */
export async function getBatteryHealthTrend(
  carId: number
): Promise<BatteryHealthPoint[]> {
  const { rows } = await pool.query(
    `select date_trunc('month', date) as month,
            max(rated_battery_range_km / (battery_level::float / 100)) as est_range_100
     from positions
     where car_id = $1
       and battery_level between 50 and 100
       and rated_battery_range_km is not null
     group by 1
     order by 1`,
    [carId]
  );
  return rows.map((r) => ({
    month: r.month,
    estRatedRangeAt100Km: Number(r.est_range_100),
  }));
}
