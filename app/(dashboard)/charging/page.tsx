import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { ChargingCostChart } from "@/components/charts/ChargingCostChart";
import { GasSavingsCard } from "@/components/GasSavingsCard";
import { EnergyBar } from "@/components/visual/EnergyBar";
import { SocBar } from "@/components/visual/SocBar";
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
  const maxLocationEnergy = Math.max(1, ...locations.map((l) => l.energyKwh));

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

      <div className="mt-4">
        <Card title="Top charging locations">
          {locations.length === 0 ? (
            <p className="text-sm text-muted">No charging sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium">City &amp; province</th>
                    <th className="pb-2 font-medium">Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, i) => (
                    <tr
                      key={`${loc.locationLine}-${i}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4 align-top">
                        <div className="text-foreground">{loc.locationLine}</div>
                        <div className="text-xs text-muted">
                          {loc.sessions} session{loc.sessions === 1 ? "" : "s"}
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top text-muted">
                        {loc.cityLine || "—"}
                      </td>
                      <td className="py-3 align-top">
                        <EnergyBar
                          kwh={loc.energyKwh}
                          maxKwh={maxLocationEnergy}
                          cost={loc.cost}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent sessions">
          <div className="divide-y divide-border/60">
            {sessions.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-1 gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center sm:gap-4"
              >
                <div>
                  <div className="text-sm text-foreground">
                    {format(new Date(s.startDate), "MMM d, yyyy · HH:mm")}
                  </div>
                  <div className="text-xs text-muted">
                    {s.locationLine}
                    {s.cityLine && ` · ${s.cityLine}`}
                  </div>
                </div>

                <SocBar startPct={s.startBatteryLevel} endPct={s.endBatteryLevel} />

                <div className="flex items-center gap-3 sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-semibold text-foreground">
                      {s.energyAddedKwh?.toFixed(1) ?? "--"}
                      <span className="ml-1 text-xs font-normal text-muted">
                        kWh
                      </span>
                    </div>
                  </div>
                  {s.cost !== null && s.cost > 0 && (
                    <span className="rounded-full bg-accent-2/15 px-2.5 py-1 text-xs font-medium text-accent-2">
                      ${s.cost.toFixed(2)}
                    </span>
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
