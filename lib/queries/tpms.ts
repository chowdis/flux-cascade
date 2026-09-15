import { pool, toNum } from "@/lib/db";

export interface TpmsPoint {
  day: string;
  fl: number | null;
  fr: number | null;
  rl: number | null;
  rr: number | null;
}

export async function getTpmsTrend(
  carId: number,
  days = 90
): Promise<TpmsPoint[]> {
  const { rows } = await pool.query(
    `select date_trunc('day', date) as day,
            avg(tpms_pressure_fl) as fl,
            avg(tpms_pressure_fr) as fr,
            avg(tpms_pressure_rl) as rl,
            avg(tpms_pressure_rr) as rr
     from positions
     where car_id = $1
       and date > now() - ($2 || ' days')::interval
       and (tpms_pressure_fl is not null or tpms_pressure_fr is not null
            or tpms_pressure_rl is not null or tpms_pressure_rr is not null)
     group by 1
     order by 1`,
    [carId, days]
  );
  return rows.map((r) => ({
    day: r.day,
    fl: toNum(r.fl),
    fr: toNum(r.fr),
    rl: toNum(r.rl),
    rr: toNum(r.rr),
  }));
}
