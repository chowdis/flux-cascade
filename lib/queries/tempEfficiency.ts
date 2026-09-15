import { pool, toNum } from "@/lib/db";

export interface TempEfficiencyBucket {
  label: string;
  minTemp: number;
  distanceKm: number;
  rangeUsedKm: number;
  /** distance actually driven / rated-range consumed — >1 is better than
   * rated, <1 worse. No fixed Wh/km conversion exists for TeslaMate's
   * data, so this ratio is the honest way to compare temperature buckets. */
  ratio: number;
}

export async function getEfficiencyByTemp(
  carId: number
): Promise<TempEfficiencyBucket[]> {
  const { rows } = await pool.query(
    `select
       case
         when outside_temp_avg < 0 then '< 0°C'
         when outside_temp_avg < 10 then '0-10°C'
         when outside_temp_avg < 20 then '10-20°C'
         when outside_temp_avg < 30 then '20-30°C'
         else '30°C+'
       end as bucket,
       min(outside_temp_avg) as bucket_min,
       sum(distance) as distance_km,
       sum(start_ideal_range_km - end_ideal_range_km) as range_used_km
     from drives
     where car_id = $1
       and end_date is not null
       and distance > 0.5
       and outside_temp_avg is not null
     group by 1
     order by min(outside_temp_avg)`,
    [carId]
  );
  return rows
    .map((r) => {
      const distanceKm = toNum(r.distance_km) ?? 0;
      const rangeUsedKm = toNum(r.range_used_km) ?? 0;
      return {
        label: r.bucket as string,
        minTemp: toNum(r.bucket_min) ?? 0,
        distanceKm,
        rangeUsedKm,
        ratio: rangeUsedKm > 0 ? distanceKm / rangeUsedKm : 0,
      };
    })
    .filter((b) => b.rangeUsedKm > 0);
}
