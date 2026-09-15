import { pool, toNum } from "@/lib/db";

export interface WeekSummary {
  distanceKm: number;
  drives: number;
  energyAddedKwh: number;
  chargingCost: number;
  chargingSessions: number;
}

export async function getWeekSummary(carId: number): Promise<WeekSummary> {
  const [driveResult, chargeResult] = await Promise.all([
    pool.query(
      `select coalesce(sum(distance), 0) as distance_km, count(*) as drives
       from drives
       where car_id = $1
         and end_date is not null
         and distance > 0.5
         and start_date > now() - interval '7 days'`,
      [carId]
    ),
    pool.query(
      `select coalesce(sum(charge_energy_added), 0) as energy_kwh,
              coalesce(sum(cost), 0) as cost,
              count(*) as sessions
       from charging_processes
       where car_id = $1
         and end_date is not null
         and start_date > now() - interval '7 days'`,
      [carId]
    ),
  ]);

  return {
    distanceKm: toNum(driveResult.rows[0]?.distance_km) ?? 0,
    drives: Number(driveResult.rows[0]?.drives ?? 0),
    energyAddedKwh: toNum(chargeResult.rows[0]?.energy_kwh) ?? 0,
    chargingCost: toNum(chargeResult.rows[0]?.cost) ?? 0,
    chargingSessions: Number(chargeResult.rows[0]?.sessions ?? 0),
  };
}
