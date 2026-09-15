import { pool, toNum } from "@/lib/db";

export interface DrivePath {
  driveId: number;
  points: [number, number][];
}

export async function getRecentDrivePaths(
  carId: number,
  driveLimit = 15
): Promise<DrivePath[]> {
  const { rows } = await pool.query(
    `select p.drive_id, p.latitude, p.longitude
     from positions p
     where p.car_id = $1
       and p.drive_id in (
         select id from drives
         where car_id = $1 and end_date is not null and distance > 0.5
         order by start_date desc
         limit $2
       )
     order by p.drive_id, p.date`,
    [carId, driveLimit]
  );

  const byDrive = new Map<number, [number, number][]>();
  for (const r of rows) {
    const lat = toNum(r.latitude);
    const lng = toNum(r.longitude);
    if (lat === null || lng === null) continue;
    if (!byDrive.has(r.drive_id)) byDrive.set(r.drive_id, []);
    byDrive.get(r.drive_id)!.push([lat, lng]);
  }

  return Array.from(byDrive.entries()).map(([driveId, points]) => ({
    driveId,
    points,
  }));
}
