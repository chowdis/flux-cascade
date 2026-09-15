import { pool, toNum } from "@/lib/db";
import { getTimeByLocation } from "@/lib/queries/locations";

export interface YearInReview {
  distanceKm: number;
  drives: number;
  energyKwh: number;
  chargingCost: number;
  chargingSessions: number;
  longestDriveKm: number;
  longestDriveDate: string | null;
  topLocationName: string | null;
  topLocationHours: number | null;
}

export async function getYearInReview(
  carId: number,
  months = 12
): Promise<YearInReview> {
  const [driveResult, chargeResult, longestResult, topLocations] =
    await Promise.all([
      pool.query(
        `select coalesce(sum(distance), 0) as distance_km, count(*) as drives
         from drives
         where car_id = $1
           and end_date is not null
           and distance > 0.5
           and start_date > now() - ($2 || ' months')::interval`,
        [carId, months]
      ),
      pool.query(
        `select coalesce(sum(charge_energy_added), 0) as energy_kwh,
                coalesce(sum(cost), 0) as cost,
                count(*) as sessions
         from charging_processes
         where car_id = $1
           and end_date is not null
           and start_date > now() - ($2 || ' months')::interval`,
        [carId, months]
      ),
      pool.query(
        `select distance, start_date
         from drives
         where car_id = $1
           and end_date is not null
           and start_date > now() - ($2 || ' months')::interval
         order by distance desc
         limit 1`,
        [carId, months]
      ),
      // Reuses the same pairing logic as the Idle & Sleep "time by
      // location" card, just over a ~year-long window instead of 30 days.
      getTimeByLocation(carId, months * 31),
    ]);

  const top = topLocations[0];

  return {
    distanceKm: toNum(driveResult.rows[0]?.distance_km) ?? 0,
    drives: Number(driveResult.rows[0]?.drives ?? 0),
    energyKwh: toNum(chargeResult.rows[0]?.energy_kwh) ?? 0,
    chargingCost: toNum(chargeResult.rows[0]?.cost) ?? 0,
    chargingSessions: Number(chargeResult.rows[0]?.sessions ?? 0),
    longestDriveKm: toNum(longestResult.rows[0]?.distance) ?? 0,
    longestDriveDate: longestResult.rows[0]?.start_date ?? null,
    topLocationName: top?.name ?? null,
    topLocationHours: top?.hours ?? null,
  };
}
