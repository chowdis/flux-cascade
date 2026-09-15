import { pool, toNum } from "@/lib/db";

export interface Drive {
  id: number;
  startDate: string;
  endDate: string | null;
  distanceKm: number | null;
  durationMin: number | null;
  startAddress: string | null;
  endAddress: string | null;
  startBatteryLevel: number | null;
  endBatteryLevel: number | null;
  speedMaxKph: number | null;
  rangeUsedKm: number | null;
  consumptionWhPerKm: number | null;
}

export async function getDrives(carId: number, limit = 50): Promise<Drive[]> {
  // `drives` has no battery-level columns of its own — it links to the
  // positions at the start/end of the trip via start_position_id /
  // end_position_id, and battery_level lives on `positions`.
  const { rows } = await pool.query(
    `select d.id, d.start_date, d.end_date, d.distance, d.duration_min,
            sa.display_name as start_address, ea.display_name as end_address,
            sp.battery_level as start_battery_level,
            ep.battery_level as end_battery_level,
            d.speed_max,
            (d.start_ideal_range_km - d.end_ideal_range_km) as range_used_km
     from drives d
     left join addresses sa on sa.id = d.start_address_id
     left join addresses ea on ea.id = d.end_address_id
     left join positions sp on sp.id = d.start_position_id
     left join positions ep on ep.id = d.end_position_id
     where d.car_id = $1 and d.end_date is not null and d.distance > 0.5
     order by d.start_date desc
     limit $2`,
    [carId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    distanceKm: toNum(r.distance),
    durationMin: r.duration_min,
    startAddress: r.start_address,
    endAddress: r.end_address,
    startBatteryLevel: r.start_battery_level,
    endBatteryLevel: r.end_battery_level,
    speedMaxKph: r.speed_max,
    rangeUsedKm: toNum(r.range_used_km),
    // Rough Wh/km: range used (km of *rated* range) has no fixed kWh/km factor,
    // so we approximate using the car's stored efficiency where available at
    // render time; fall back to null and let the UI show "--".
    consumptionWhPerKm: null,
  }));
}

export interface WeeklyEfficiency {
  week: string;
  distanceKm: number;
  rangeUsedKm: number;
}

export async function getEfficiencyTrend(
  carId: number,
  months = 6
): Promise<WeeklyEfficiency[]> {
  const { rows } = await pool.query(
    `select date_trunc('week', start_date) as week,
            sum(distance) as distance_km,
            sum(start_ideal_range_km - end_ideal_range_km) as range_used_km
     from drives
     where car_id = $1
       and end_date is not null
       and distance > 0.5
       and start_date > now() - ($2 || ' months')::interval
     group by 1
     order by 1`,
    [carId, months]
  );
  return rows.map((r) => ({
    week: r.week,
    distanceKm: Number(r.distance_km),
    rangeUsedKm: Number(r.range_used_km),
  }));
}
