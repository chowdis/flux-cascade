import { getMonthlyChargingSummary } from "@/lib/queries/charging";
import { getMonthlyDistance } from "@/lib/queries/drives";

export interface MonthlyCostRate {
  month: string;
  cost: number;
  energyKwh: number;
  distanceKm: number;
  // Effective rate you're actually paying to charge this month.
  costPerKwh: number | null;
  // A fuel-cost-equivalent figure, blending home/DC/Supercharger sessions
  // together against however far the car actually went that month.
  costPer100Km: number | null;
}

function monthKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 7);
}

/**
 * Merges monthly charging cost/energy (`getMonthlyChargingSummary`) with
 * monthly distance driven (`getMonthlyDistance`) into one effective-rate
 * series. The two source queries can each have months the other doesn't —
 * a month with driving but no charging session, or vice versa — so this
 * unions the month keys rather than mapping over just one side; either
 * rate is null (not 0) for a month with no energy added or no distance,
 * so a chart can skip the point instead of drawing a misleading zero.
 */
export async function getMonthlyCostRates(
  carId: number,
  months = 12
): Promise<MonthlyCostRate[]> {
  const [charging, distance] = await Promise.all([
    getMonthlyChargingSummary(carId, months),
    getMonthlyDistance(carId, months),
  ]);

  const byMonth = new Map<
    string,
    { month: string | Date; cost: number; energyKwh: number; distanceKm: number }
  >();

  for (const c of charging) {
    byMonth.set(monthKey(c.month), {
      month: c.month,
      cost: c.cost,
      energyKwh: c.energyKwh,
      distanceKm: 0,
    });
  }
  for (const d of distance) {
    const key = monthKey(d.month);
    const existing = byMonth.get(key);
    if (existing) {
      existing.distanceKm = d.distanceKm;
    } else {
      byMonth.set(key, {
        month: d.month,
        cost: 0,
        energyKwh: 0,
        distanceKm: d.distanceKm,
      });
    }
  }

  return [...byMonth.values()]
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .map((m) => ({
      month: typeof m.month === "string" ? m.month : m.month.toISOString(),
      cost: m.cost,
      energyKwh: m.energyKwh,
      distanceKm: m.distanceKm,
      costPerKwh: m.energyKwh > 0 ? m.cost / m.energyKwh : null,
      costPer100Km: m.distanceKm > 0 ? (m.cost / m.distanceKm) * 100 : null,
    }));
}
