import { pool, toNum } from "@/lib/db";

// `states.state` is one of exactly online | offline | asleep — activity
// like driving/charging is tracked separately (drives / charging_processes),
// not as a `states` value.
export type CarState = "online" | "offline" | "asleep";

export interface UptimeSummary {
  state: CarState;
  hours: number;
}

export async function getUptimeSummary(
  carId: number,
  days = 30
): Promise<UptimeSummary[]> {
  const { rows } = await pool.query(
    `select state,
            sum(extract(epoch from (coalesce(end_date, now()) - start_date))) / 3600.0 as hours
     from states
     where car_id = $1
       and coalesce(end_date, now()) > now() - ($2 || ' days')::interval
     group by state`,
    [carId, days]
  );
  return rows.map((r) => ({
    state: r.state,
    hours: toNum(r.hours) ?? 0,
  }));
}

export interface DailyStateBreakdown {
  day: string;
  state: CarState;
  hours: number;
}

/**
 * Hours spent in each state per calendar day, for a stacked chart. Splits
 * each `states` row (which can span multiple days) across the days it
 * overlaps using interval intersection against a generated day series.
 */
export async function getDailyStateBreakdown(
  carId: number,
  days = 14
): Promise<DailyStateBreakdown[]> {
  const { rows } = await pool.query(
    `with days as (
       select generate_series(
         date_trunc('day', now() - ($2 || ' days')::interval),
         date_trunc('day', now()),
         interval '1 day'
       ) as day
     ),
     s as (
       select state, start_date, coalesce(end_date, now()) as end_date
       from states
       where car_id = $1
         and coalesce(end_date, now()) > now() - ($2 || ' days')::interval
     )
     select d.day, s.state,
            sum(extract(epoch from (
              least(s.end_date, d.day + interval '1 day') - greatest(s.start_date, d.day)
            )) / 3600.0) as hours
     from days d
     join s on s.start_date < d.day + interval '1 day' and s.end_date > d.day
     group by d.day, s.state
     order by d.day`,
    [carId, days]
  );
  return rows.map((r) => ({
    day: r.day,
    state: r.state,
    hours: toNum(r.hours) ?? 0,
  }));
}
