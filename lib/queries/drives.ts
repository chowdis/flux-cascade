import { pool, toNum } from "@/lib/db";
import { formatLocationLine, formatCityLine } from "@/lib/address";

export interface Drive {
  id: number;
  startDate: string;
  endDate: string | null;
  distanceKm: number | null;
  durationMin: number | null;
  startLocationLine: string;
  startCityLine: string;
  endLocationLine: string;
  endCityLine: string;
  startBatteryLevel: number | null;
  endBatteryLevel: number | null;
  speedMaxKph: number | null;
  rangeUsedKm: number | null;
  consumptionWhPerKm: number | null;
  ascentM: number | null;
  descentM: number | null;
}

export async function getDrives(carId: number, limit = 50): Promise<Drive[]> {
  // `drives` has no battery-level columns of its own — it links to the
  // positions at the start/end of the trip via start_position_id /
  // end_position_id, and battery_level lives on `positions`.
  const { rows } = await pool.query(
    `select d.id, d.start_date, d.end_date, d.distance, d.duration_min,
            sa.name as start_name, sa.house_number as start_house_number,
            sa.road as start_road, sa.city as start_city,
            sa.county as start_county, sa.state as start_state,
            ea.name as end_name, ea.house_number as end_house_number,
            ea.road as end_road, ea.city as end_city,
            ea.county as end_county, ea.state as end_state,
            sp.battery_level as start_battery_level,
            ep.battery_level as end_battery_level,
            d.speed_max, d.ascent, d.descent,
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
    startLocationLine: formatLocationLine({
      name: r.start_name,
      house_number: r.start_house_number,
      road: r.start_road,
      city: r.start_city,
      county: r.start_county,
      state: r.start_state,
    }),
    startCityLine: formatCityLine({
      name: r.start_name,
      house_number: r.start_house_number,
      road: r.start_road,
      city: r.start_city,
      county: r.start_county,
      state: r.start_state,
    }),
    endLocationLine: formatLocationLine({
      name: r.end_name,
      house_number: r.end_house_number,
      road: r.end_road,
      city: r.end_city,
      county: r.end_county,
      state: r.end_state,
    }),
    endCityLine: formatCityLine({
      name: r.end_name,
      house_number: r.end_house_number,
      road: r.end_road,
      city: r.end_city,
      county: r.end_county,
      state: r.end_state,
    }),
    startBatteryLevel: r.start_battery_level,
    endBatteryLevel: r.end_battery_level,
    speedMaxKph: r.speed_max,
    rangeUsedKm: toNum(r.range_used_km),
    // Rough Wh/km: range used (km of *rated* range) has no fixed kWh/km factor,
    // so we approximate using the car's stored efficiency where available at
    // render time; fall back to null and let the UI show "--".
    consumptionWhPerKm: null,
    ascentM: r.ascent,
    descentM: r.descent,
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

export async function getTotalDistanceKm(
  carId: number,
  months = 12
): Promise<number> {
  const { rows } = await pool.query(
    `select coalesce(sum(distance), 0) as distance_km
     from drives
     where car_id = $1
       and end_date is not null
       and start_date > now() - ($2 || ' months')::interval`,
    [carId, months]
  );
  return toNum(rows[0]?.distance_km) ?? 0;
}
