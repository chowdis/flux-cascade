import { pool, toNum } from "@/lib/db";

export interface LocationTime {
  name: string;
  hours: number;
  visits: number;
}

/**
 * Time parked at each named geofence (Home, Work, etc. — as configured in
 * TeslaMate's Geo-fences settings). `drives` has no "currently parked at"
 * concept of its own, so this treats a drive's end_geofence as where the
 * car sits from that drive's end_date until the *next* drive's start_date
 * (via LEAD, computed over full history so date-filtering below doesn't
 * corrupt the pairing for rows near the filter boundary).
 *
 * Spans over 14 days are dropped — that's the car going properly offline
 * for an extended period (stored, in the shop, etc.) rather than a single
 * long parking session, and would otherwise dominate the total. Drives
 * that didn't end inside any configured geofence are excluded entirely
 * (inner join), since there's nothing meaningful to label them with.
 */
export async function getTimeByLocation(
  carId: number,
  days = 30
): Promise<LocationTime[]> {
  const { rows } = await pool.query(
    `with ordered as (
       select d.end_date, d.end_geofence_id,
              lead(d.start_date) over (order by d.start_date) as next_start_date
       from drives d
       where d.car_id = $1 and d.end_date is not null
     ),
     spans as (
       select end_geofence_id,
              coalesce(next_start_date, now()) - end_date as span
       from ordered
       where end_geofence_id is not null
         and end_date > now() - ($2 || ' days')::interval
         and coalesce(next_start_date, now()) - end_date < interval '14 days'
     )
     select g.name,
            sum(extract(epoch from span)) / 3600.0 as hours,
            count(*) as visits
     from spans s
     join geofences g on g.id = s.end_geofence_id
     group by g.name
     order by hours desc
     limit 8`,
    [carId, days]
  );
  return rows.map((r) => ({
    name: r.name,
    hours: toNum(r.hours) ?? 0,
    visits: Number(r.visits),
  }));
}
