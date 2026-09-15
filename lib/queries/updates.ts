import { pool } from "@/lib/db";

export interface SoftwareUpdate {
  version: string | null;
  startDate: string;
  endDate: string | null;
  /** Days since the previous update started — null for the earliest one on record. */
  daysSincePrevious: number | null;
}

export async function getUpdateHistory(
  carId: number,
  limit = 50
): Promise<SoftwareUpdate[]> {
  const { rows } = await pool.query(
    `select version, start_date, end_date
     from updates
     where car_id = $1
     order by start_date asc
     limit $2`,
    [carId, limit]
  );

  let prevDate: Date | null = null;
  const chronological = rows.map((r) => {
    const startDate = new Date(r.start_date);
    const daysSincePrevious = prevDate
      ? Math.round((startDate.getTime() - prevDate.getTime()) / 86_400_000)
      : null;
    prevDate = startDate;
    return {
      version: r.version,
      startDate: r.start_date,
      endDate: r.end_date,
      daysSincePrevious,
    };
  });

  return chronological.reverse(); // newest first, for display
}
