import { pool } from "@/lib/db";

export interface SoftwareUpdate {
  version: string | null;
  startDate: string;
  endDate: string | null;
  /** Days since the previous update started — null for the earliest one on record. */
  daysSincePrevious: number | null;
}

// Tesla's raw car_version string sometimes trails a build hash after a
// space (e.g. "2026.32.1 a1b2c3d4e5f6") — only on some builds, which is
// why it shows up on some updates but not others. Keep just the version.
function formatVersion(raw: string | null): string | null {
  if (!raw) return raw;
  return raw.split(/\s+/)[0];
}

export async function getUpdateHistory(
  carId: number,
  limit = 50
): Promise<SoftwareUpdate[]> {
  // Get the most recent `limit` updates first (order by start_date DESC),
  // *then* re-sort that set chronologically for the day-gap calculation
  // below. Sorting ASC with a LIMIT up front (the original bug) returns
  // the OLDEST `limit` updates instead — invisible for a car with fewer
  // than `limit` updates on record, but silently wrong for a car with a
  // long history, like a 2019 Model 3 with years of accumulated updates.
  const { rows } = await pool.query(
    `select version, start_date, end_date
     from (
       select version, start_date, end_date
       from updates
       where car_id = $1
       order by start_date desc
       limit $2
     ) recent
     order by start_date asc`,
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
      version: formatVersion(r.version),
      startDate: r.start_date,
      endDate: r.end_date,
      daysSincePrevious,
    };
  });

  return chronological.reverse(); // newest first, for display
}
