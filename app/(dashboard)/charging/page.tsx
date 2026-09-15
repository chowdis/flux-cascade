import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { ChargingCostChart } from "@/components/charts/ChargingCostChart";
import { GasSavingsCard } from "@/components/GasSavingsCard";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import {
  getChargingByLocation,
  getChargingSessions,
  getMonthlyChargingSummary,
} from "@/lib/queries/charging";
import { getTotalDistanceKm } from "@/lib/queries/drives";
import { format } from "date-fns";

export default async function ChargingPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const [summary, sessions, locations, totalDistanceKm] = await Promise.all([
    getMonthlyChargingSummary(car.id),
    getChargingSessions(car.id, 25),
    getChargingByLocation(car.id),
    getTotalDistanceKm(car.id, 12),
  ]);

  const totalEnergy = summary.reduce((sum, m) => sum + m.energyKwh, 0);
  const totalCost = summary.reduce((sum, m) => sum + m.cost, 0);
  const totalSessions = summary.reduce((sum, m) => sum + m.sessions, 0);

  return (
    <div>
      <PageHeader
        title="Charging"
        description="Charging sessions, energy added, and cost over the last 12 months."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Sessions (12mo)" value={String(totalSessions)} />
        <StatCard
          label="Energy added"
          value={`${totalEnergy.toFixed(0)} kWh`}
        />
        <StatCard label="Total cost" value={`$${totalCost.toFixed(2)}`} accent />
        <StatCard
          label="Avg cost / session"
          value={
            totalSessions > 0
              ? `$${(totalCost / totalSessions).toFixed(2)}`
              : "--"
          }
        />
      </div>

      <div className="mt-4">
        <Card title="Energy added & cost by month">
          <ChargingCostChart data={summary} />
        </Card>
      </div>

      <div className="mt-4">
        <GasSavingsCard
          totalDistanceKm={totalDistanceKm}
          totalChargingCost={totalCost}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Top charging locations">
          <div className="space-y-3">
            {locations.map((loc) => (
              <div
                key={loc.address}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="text-foreground">{loc.address}</div>
                  <div className="text-xs text-muted">
                    {loc.sessions} sessions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground">
                    {loc.energyKwh.toFixed(0)} kWh
                  </div>
                  {loc.cost > 0 && (
                    <div className="text-xs text-muted">
                      ${loc.cost.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <p className="text-sm text-muted">No charging sessions yet.</p>
            )}
          </div>
        </Card>

        <Card title="Recent sessions">
          <div className="space-y-3">
            {sessions.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="text-foreground">
                    {format(new Date(s.startDate), "MMM d, HH:mm")}
                  </div>
                  <div className="text-xs text-muted">
                    {s.address ?? "Unknown location"} · {s.startBatteryLevel}%
                    → {s.endBatteryLevel}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground">
                    {s.energyAddedKwh?.toFixed(1) ?? "--"} kWh
                  </div>
                  {s.cost !== null && s.cost > 0 && (
                    <div className="text-xs text-muted">
                      ${s.cost.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-sm text-muted">No charging sessions yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
