import { pool, toNum } from "@/lib/db";

interface AddressRow {
  name: string | null;
  house_number: string | null;
  road: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
}

// Deliberately excludes postcode/country — just the street and city/state,
// which is what people actually want to glance at in these lists.
function formatLocationLine(a: AddressRow): string {
  if (a.road) return [a.house_number, a.road].filter(Boolean).join(" ");
  return a.name ?? "Unknown location";
}

function formatCityLine(a: AddressRow): string {
  return [a.city ?? a.county, a.state].filter(Boolean).join(", ");
}

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
