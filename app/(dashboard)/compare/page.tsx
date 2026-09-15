import { PageHeader, Card } from "@/components/StatCard";
import { getCars } from "@/lib/queries/cars";
import { getCarComparison, type CarComparisonStats } from "@/lib/queries/compare";
import { carLabel } from "@/lib/car";

const ROWS: {
  label: string;
  render: (s: CarComparisonStats) => string;
}[] = [
  {
    label: "Efficiency",
    render: (s) => (s.whPerKm !== null ? `${Math.round(s.whPerKm)} Wh/km` : "--"),
  },
  {
    label: "Distance (last 30 days)",
    render: (s) => `${s.distanceKm30d.toFixed(0)} km`,
  },
  {
    label: "Charging cost (last 30 days)",
    render: (s) => `$${s.chargingCost30d.toFixed(2)}`,
  },
  {
    label: "Est. rated range @ 100%",
    render: (s) =>
      s.latestBatteryHealthKm !== null
        ? `${Math.round(s.latestBatteryHealthKm)} km`
        : "--",
  },
];

export default async function ComparePage() {
  const cars = await getCars();
  if (cars.length === 0) return null;

  const stats = await getCarComparison(cars);

  return (
    <div>
      <PageHeader
        title="Compare Vehicles"
        description="Side-by-side stats across all your cars."
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Metric</th>
                {stats.map((s) => (
                  <th key={s.car.id} className="pb-2 font-medium">
                    {carLabel(s.car)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 text-muted">{row.label}</td>
                  {stats.map((s) => (
                    <td
                      key={s.car.id}
                      className="py-3 pr-4 font-medium text-foreground"
                    >
                      {row.render(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {cars.length < 2 && (
        <div className="mt-4">
          <Card>
            <p className="text-sm text-muted">
              You only have one vehicle registered — nothing to compare yet.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
