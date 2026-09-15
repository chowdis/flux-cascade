import { pool, toNum } from "@/lib/db";

/**
 * Total hours the climate system was on, over the given window. Same
 * LAG-window technique as vampire drain: pair up consecutive telemetry
 * readings and attribute the gap between them to climate-on time when the
 * earlier reading had climate on. Capped at 2h per gap to avoid a single
 * long outage/offline gap being misattributed as hours of climate use.
 */
export async function getClimateOnHours(
  carId: number,
  days = 30
): Promise<number> {
  const { rows } = await pool.query(
    `with p as (
       select date, is_climate_on,
              lag(date) over (order by date) as prev_date,
              lag(is_climate_on) over (order by date) as prev_climate_on
       from positions
       where car_id = $1
         and date > now() - ($2 || ' days')::interval - interval '1 day'
     )
     select coalesce(sum(extract(epoch from (date - prev_date)) / 3600.0), 0) as hours
     from p
     where prev_climate_on = true
       and prev_date is not null
       and date - prev_date between interval '0 seconds' and interval '2 hours'
       and date > now() - ($2 || ' days')::interval`,
    [carId, days]
  );
  return toNum(rows[0]?.hours) ?? 0;
}
