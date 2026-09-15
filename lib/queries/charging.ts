import { pool, toNum } from "@/lib/db";
import { formatLocationLine, formatCityLine } from "@/lib/address";

export interface ChargingSession {
  id: number;
  startDate: string;
  endDate: string | null;
  durationMin: number | null;
  energyAddedKwh: number | null;
  startBatteryLevel: number | null;
  endBatteryLevel: number | null;
  cost: number | null;
  locationLine: string;
  cityLine: string;
}

export async function getChargingSessions(
  carId: number,
  limit = 50
): Promise<ChargingSession[]> {
  const { rows } = await pool.query(
    `select cp.id, cp.start_date, cp.end_date, cp.duration_min,
            cp.charge_energy_added, cp.start_battery_level, cp.end_battery_level,
            cp.cost,
            a.name, a.house_number, a.road, a.city, a.county, a.state
     from charging_processes cp
     left join addresses a on a.id = cp.address_id
     where cp.car_id = $1 and cp.end_date is not null
     order by cp.start_date desc
     limit $2`,
    [carId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    durationMin: r.duration_min,
    energyAddedKwh: toNum(r.charge_energy_added),
    startBatteryLevel: r.start_battery_level,
    endBatteryLevel: r.end_battery_level,
    cost: toNum(r.cost),
    locationLine: formatLocationLine(r),
    cityLine: formatCityLine(r),
  }));
}

export interface MonthlyChargingSummary {
  month: string;
  energyKwh: number;
  cost: number;
  sessions: number;
}

export async function getMonthlyChargingSummary(
  carId: number,
  months = 12
): Promise<MonthlyChargingSummary[]> {
  const { rows } = await pool.query(
    `select date_trunc('month', start_date) as month,
            coalesce(sum(charge_energy_added), 0) as energy_kwh,
            coalesce(sum(cost), 0) as cost,
            count(*) as sessions
     from charging_processes
     where car_id = $1
       and end_date is not null
       and start_date > now() - ($2 || ' months')::interval
     group by 1
     order by 1`,
    [carId, months]
  );
  return rows.map((r) => ({
    month: r.month,
    energyKwh: Number(r.energy_kwh),
    cost: Number(r.cost),
    sessions: Number(r.sessions),
  }));
}

export interface ChargeCurvePoint {
  minutesElapsed: number;
  chargerPowerKw: number | null;
  batteryLevel: number | null;
}

export interface ChargeCurve {
  startDate: string;
  points: ChargeCurvePoint[];
}

/**
 * Per-minute samples (charger power, battery %) within the most recently
 * completed charging session — the `charges` table, not `charging_processes`
 * (that only has the session summary).
 */
export async function getMostRecentChargingCurve(
  carId: number
): Promise<ChargeCurve | null> {
  const { rows: processRows } = await pool.query(
    `select id, start_date
     from charging_processes
     where car_id = $1 and end_date is not null
     order by start_date desc
     limit 1`,
    [carId]
  );
  const process = processRows[0];
  if (!process) return null;

  const { rows } = await pool.query(
    `select date, charger_power, battery_level
     from charges
     where charging_process_id = $1
     order by date`,
    [process.id]
  );

  const startMs = new Date(process.start_date).getTime();
  const points = rows.map((r) => ({
    minutesElapsed: Math.round((new Date(r.date).getTime() - startMs) / 60_000),
    chargerPowerKw: r.charger_power,
    batteryLevel: r.battery_level,
  }));

  return { startDate: process.start_date, points };
}

export interface LocationBreakdown {
  locationLine: string;
  cityLine: string;
  sessions: number;
  energyKwh: number;
  cost: number;
}

export async function getChargingByLocation(
  carId: number
): Promise<LocationBreakdown[]> {
  const { rows } = await pool.query(
    `select a.name, a.house_number, a.road, a.city, a.county, a.state,
            count(*) as sessions,
            coalesce(sum(cp.charge_energy_added), 0) as energy_kwh,
            coalesce(sum(cp.cost), 0) as cost
     from charging_processes cp
     left join addresses a on a.id = cp.address_id
     where cp.car_id = $1 and cp.end_date is not null
     group by a.id
     order by energy_kwh desc
     limit 10`,
    [carId]
  );
  return rows.map((r) => ({
    locationLine: formatLocationLine(r),
    cityLine: formatCityLine(r),
    sessions: Number(r.sessions),
    energyKwh: Number(r.energy_kwh),
    cost: Number(r.cost),
  }));
}
