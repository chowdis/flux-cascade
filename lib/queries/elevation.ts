import { pool, toNum } from "@/lib/db";

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
}

export interface DriveElevationProfile {
  driveId: number;
  startDate: string;
  distanceKm: number;
  ascentM: number | null;
  descentM: number | null;
  points: ElevationPoint[];
}

/**
 * Per-trip elevation curve for the most recent drives. `positions.elevation`
 * exists but there's no distance-along-route column, so this reconstructs
 * it with a running haversine distance between consecutive GPS points —
 * the same rough-but-good-enough approach the app already uses for map
 * polylines (TripsMap), just accumulated instead of just plotted.
 */
export async function getRecentElevationProfiles(
  carId: number,
  driveLimit = 15
): Promise<DriveElevationProfile[]> {
  const { rows } = await pool.query(
    `select p.drive_id, p.latitude, p.longitude, p.elevation, p.date,
            d.start_date, d.distance, d.ascent, d.descent
     from positions p
     join drives d on d.id = p.drive_id
     where p.car_id = $1
       and p.elevation is not null
       and p.drive_id in (
         select id from drives
         where car_id = $1 and end_date is not null and distance > 0.5
         order by start_date desc
         limit $2
       )
     order by p.drive_id, p.date`,
    [carId, driveLimit]
  );

  interface RawPoint {
    lat: number;
    lng: number;
    elevationM: number;
  }
  const byDrive = new Map<
    number,
    {
      startDate: string;
      distanceKm: number;
      ascentM: number | null;
      descentM: number | null;
      raw: RawPoint[];
    }
  >();

  for (const r of rows) {
    const lat = toNum(r.latitude);
    const lng = toNum(r.longitude);
    if (lat === null || lng === null) continue;
    if (!byDrive.has(r.drive_id)) {
      byDrive.set(r.drive_id, {
        startDate: r.start_date,
        distanceKm: toNum(r.distance) ?? 0,
        ascentM: r.ascent,
        descentM: r.descent,
        raw: [],
      });
    }
    byDrive.get(r.drive_id)!.raw.push({ lat, lng, elevationM: r.elevation });
  }

  return Array.from(byDrive.entries())
    .map(([driveId, d]) => {
      let cumKm = 0;
      const points: ElevationPoint[] = [];
      for (let i = 0; i < d.raw.length; i++) {
        if (i > 0) cumKm += haversineKm(d.raw[i - 1], d.raw[i]);
        points.push({ distanceKm: cumKm, elevationM: d.raw[i].elevationM });
      }
      return {
        driveId,
        startDate: d.startDate,
        distanceKm: d.distanceKm,
        ascentM: d.ascentM,
        descentM: d.descentM,
        points,
      };
    })
    .filter((d) => d.points.length > 1)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
