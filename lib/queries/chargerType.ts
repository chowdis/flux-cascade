import { pool, toNum } from "@/lib/db";

export interface ChargerTypeBreakdown {
  chargerType: string;
  sessions: number;
  energyKwh: number;
  cost: number;
  avgMaxPowerKw: number;
}

/**
 * Classifies each charging session by charger type using the `charges`
 * per-minute samples (charging_processes itself has no charger-type info).
 * A session's samples should agree on fast_charger_present/brand, so this
 * just takes any() / max() across them rather than picking one row.
 */
export async function getChargingByType(
  carId: number
): Promise<ChargerTypeBreakdown[]> {
  const { rows } = await pool.query(
    `with session_type as (
       select cp.id,
              cp.charge_energy_added,
              cp.cost,
              bool_or(c.fast_charger_present) as fast_charger_present,
              max(c.fast_charger_brand) as fast_charger_brand,
              max(c.charger_power) as max_power_kw
       from charging_processes cp
       join charges c on c.charging_process_id = cp.id
       where cp.car_id = $1 and cp.end_date is not null
       group by cp.id, cp.charge_energy_added, cp.cost
     )
     select
       case
         when fast_charger_present and fast_charger_brand ilike '%tesla%' then 'Supercharger'
         when fast_charger_present then coalesce(fast_charger_brand, 'DC Fast Charging')
         else 'Home / AC Charging'
       end as charger_type,
       count(*) as sessions,
       coalesce(sum(charge_energy_added), 0) as energy_kwh,
       coalesce(sum(cost), 0) as cost,
       coalesce(avg(max_power_kw), 0) as avg_max_power_kw
     from session_type
     group by 1
     order by energy_kwh desc`,
    [carId]
  );
  return rows.map((r) => ({
    chargerType: r.charger_type,
    sessions: Number(r.sessions),
    energyKwh: toNum(r.energy_kwh) ?? 0,
    cost: toNum(r.cost) ?? 0,
    avgMaxPowerKw: toNum(r.avg_max_power_kw) ?? 0,
  }));
}
