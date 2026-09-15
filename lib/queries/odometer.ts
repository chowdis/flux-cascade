import { pool, toNum } from "@/lib/db";

export interface OdometerPoint {
  week: string;
  odometerKm: number;
}

export async function getOdometerTrend(carId: number): Promise<OdometerPoint[]> {
  const { rows } = await pool.query(
    `select date_trunc('week', date) as week, max(odometer) as odometer_km
     from positions
     where car_id = $1
     group by 1
     order by 1`,
    [carId]
  );
  return rows.map((r) => ({
    week: r.week,
    odometerKm: toNum(r.odometer_km) ?? 0,
  }));
}
