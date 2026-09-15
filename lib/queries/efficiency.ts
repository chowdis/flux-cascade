import { pool, toNum } from "@/lib/db";

export interface EfficiencyStats {
  whPerKm: number | null;
  totalKwh: number;
  totalKm: number;
}

/**
 * Real-world efficiency = energy added while charging / distance driven,
 * over the same window. This uses actually-measured columns (charging
 * kWh, drive km) rather than trying to convert TeslaMate's "rated range
 * used" into Wh/km, which has no fixed, reliable conversion factor.
 * It's an approximation — charging losses and energy used while parked
 * (climate, vampire drain) are folded in too — but it's what most EV
 * efficiency trackers use, and it's grounded in real numbers rather than
 * an assumed constant.
 */
export async function getAverageEfficiency(
  carId: number,
  days = 30
): Promise<EfficiencyStats> {
  const { rows } = await pool.query(
    `select
       (select coalesce(sum(charge_energy_added), 0)
        from charging_processes
        where car_id = $1 and end_date is not null
          and start_date > now() - ($2 || ' days')::interval) as kwh,
       (select coalesce(sum(distance), 0)
        from drives
        where car_id = $1 and end_date is not null
          and start_date > now() - ($2 || ' days')::interval) as km`,
    [carId, days]
  );

  const totalKwh = toNum(rows[0]?.kwh) ?? 0;
  const totalKm = toNum(rows[0]?.km) ?? 0;
  const whPerKm = totalKm > 0 ? (totalKwh * 1000) / totalKm : null;

  return { whPerKm, totalKwh, totalKm };
}
