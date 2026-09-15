import type { Car } from "@/lib/car";
import { getAverageEfficiency } from "@/lib/queries/efficiency";
import { getTotalDistanceKm } from "@/lib/queries/drives";
import { getMonthlyChargingSummary } from "@/lib/queries/charging";
import { getBatteryHealthTrend } from "@/lib/queries/battery";

export interface CarComparisonStats {
  car: Car;
  whPerKm: number | null;
  distanceKm30d: number;
  chargingCost30d: number;
  latestBatteryHealthKm: number | null;
}

export async function getCarComparison(
  cars: Car[]
): Promise<CarComparisonStats[]> {
  return Promise.all(
    cars.map(async (car) => {
      const [efficiency, distanceKm30d, chargingSummary, batteryHealth] =
        await Promise.all([
          getAverageEfficiency(car.id, 30),
          getTotalDistanceKm(car.id, 1),
          getMonthlyChargingSummary(car.id, 1),
          getBatteryHealthTrend(car.id),
        ]);

      const chargingCost30d = chargingSummary.reduce((s, m) => s + m.cost, 0);
      const latestBatteryHealthKm =
        batteryHealth.length > 0
          ? batteryHealth[batteryHealth.length - 1].estRatedRangeAt100Km
          : null;

      return {
        car,
        whPerKm: efficiency.whPerKm,
        distanceKm30d,
        chargingCost30d,
        latestBatteryHealthKm,
      };
    })
  );
}
