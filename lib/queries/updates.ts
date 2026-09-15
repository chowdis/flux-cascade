import { pool } from "@/lib/db";

export interface SoftwareUpdate {
  version: string | null;
  startDate: string;
  endDate: string | null;
}

export async function getUpdateHistory(
  carId: number,
  limit = 30
): Promise<SoftwareUpdate[]> {
  const { rows } = await pool.query(
    `select version, start_date, end_date
     from updates
     where car_id = $1
     order by start_date desc
     limit $2`,
    [carId, limit]
  );
  return rows.map((r) => ({
    version: r.version,
    startDate: r.start_date,
    endDate: r.end_date,
  }));
}
