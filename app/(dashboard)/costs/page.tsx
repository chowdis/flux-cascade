import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { CostPerKwhChart } from "@/components/charts/CostPerKwhChart";
import { CostPer100KmChart } from "@/components/charts/CostPer100KmChart";
import { ChargingMixCard } from "@/components/ChargingMixCard";
import { CumulativeSavingsCard } from "@/components/CumulativeSavingsCard";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getMonthlyCostRates } from "@/lib/queries/costs";
import { getChargingByType } from "@/lib/queries/chargerType";

export default async function CostsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const [rates, types] = await Promise.all([
    getMonthlyCostRates(car.id, 12),
    getChargingByType(car.id),
  ]);

  const totalCost = rates.reduce((sum, r) => sum + r.cost, 0);
  const totalEnergy = rates.reduce((sum, r) => sum + r.energyKwh, 0);
  const totalDistance = rates.reduce((sum, r) => sum + r.distanceKm, 0);
  const avgCostPerKwh = totalEnergy > 0 ? totalCost / totalEnergy : null;
  const avgCostPer100Km =
    totalDistance > 0 ? (totalCost / totalDistance) * 100 : null;

  return (
    <div>
      <PageHeader
        title="Charging Costs & Savings"
        description="What you're actually paying to charge, and how it stacks up against gas, over the last 12 months."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total spent (12mo)"
          value={`$${totalCost.toFixed(2)}`}
          accent
        />
        <StatCard
          label="Avg. cost / kWh"
          value={avgCostPerKwh !== null ? `$${avgCostPerKwh.toFixed(3)}` : "--"}
        />
        <StatCard
          label="Avg. cost / 100 km"
          value={
            avgCostPer100Km !== null ? `$${avgCostPer100Km.toFixed(2)}` : "--"
          }
        />
        <StatCard
          label="Energy added (12mo)"
          value={`${totalEnergy.toFixed(0)} kWh`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Cost per kWh over time">
          <CostPerKwhChart data={rates} />
        </Card>
        <Card title="Cost per 100 km over time">
          <CostPer100KmChart data={rates} />
        </Card>
      </div>

      <div className="mt-4">
        <ChargingMixCard types={types} />
      </div>

      <div className="mt-4">
        <CumulativeSavingsCard data={rates} />
      </div>
    </div>
  );
}
