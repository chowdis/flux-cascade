import { pool, toNum } from "@/lib/db";

export interface DailyDrain {
  day: string;
  idleHours: number;
  batteryDropPct: number;
  rangeDropKm: number;
}

/**
 * "Vampire drain": battery lost while parked and not charging. `positions`
 * has no charging_process_id column, so a position can't be excluded by a
 * simple flag — instead this pairs up consecutive positions (via LAG) where
 * neither is part of a drive, and throws out any pair whose time window
 * overlaps a charging session for this car.
 *
 * Pairs more than 12h apart are excluded too (the car likely went properly
 * offline/out of range rather than just idling — including a huge gap would
 * wildly overstate a single day's drain), and pairs under 15min are excluded
 * as noise from back-to-back telemetry pings.
 */
export async function getDailyDrain(
  carId: number,
  days = 30
): Promise<DailyDrain[]> {
  const { rows } = await pool.query(
    `with p as (
       select date, battery_level, rated_battery_range_km, drive_id,
              lag(date) over (order by date) as prev_date,
              lag(battery_level) over (order by date) as prev_battery_level,
              lag(rated_battery_range_km) over (order by date) as prev_range,
              lag(drive_id) over (order by date) as prev_drive_id
       from positions
       where car_id = $1
         and date > now() - ($2 || ' days')::interval - interval '1 day'
     ),
     idle as (
       select
         date_trunc('day', p.date) as day,
         extract(epoch from (p.date - p.prev_date)) / 3600.0 as hours,
         greatest(p.prev_battery_level - p.battery_level, 0) as battery_drop,
         greatest(p.prev_range - p.rated_battery_range_km, 0) as range_drop
       from p
       where p.drive_id is null
         and p.prev_drive_id is null
         and p.prev_date is not null
         and p.date - p.prev_date between interval '15 minutes' and interval '12 hours'
         and not exists (
           select 1 from charging_processes cp
           where cp.car_id = $1
             and cp.start_date < p.date
             and coalesce(cp.end_date, now()) > p.prev_date
         )
     )
     select day,
            sum(hours) as idle_hours,
            sum(battery_drop) as battery_drop_pct,
            sum(range_drop) as range_drop_km
     from idle
     where day > now() - ($2 || ' days')::interval
     group by day
     order by day`,
    [carId, days]
  );
  return rows.map((r) => ({
    day: r.day,
    idleHours: toNum(r.idle_hours) ?? 0,
    batteryDropPct: toNum(r.battery_drop_pct) ?? 0,
    rangeDropKm: toNum(r.range_drop_km) ?? 0,
  }));
}
