import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { ChargingCostChart } from "@/components/charts/ChargingCostChart";
import { ChargingCurveChart } from "@/components/charts/ChargingCurveChart";
import { GasSavingsCard } from "@/components/GasSavingsCard";
import { EnergyBar } from "@/components/visual/EnergyBar";
import { SocBar } from "@/components/visual/SocBar";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import {
  getChargingByLocation,
  getChargingSessions,
  getMonthlyChargingSummary,
  getMostRecentChargingCurve,
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

  const [summary, sessions, locations, totalDistanceKm, chargeCurve] =
    await Promise.all([
      getMonthlyChargingSummary(car.id),
      getChargingSessions(car.id, 25),
      getChargingByLocation(car.id),
      getTotalDistanceKm(car.id, 12),
      getMostRecentChargingCurve(car.id),
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

      {chargeCurve && chargeCurve.points.length > 1 && (
        <div className="mt-4">
          <Card title="Charging curve (most recent session)">
            <ChargingCurveChart points={chargeCurve.points} />
          </Card>
        </div>
      )}

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
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">No charging sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium">Charge</th>
                    <th className="pb-2 text-right font-medium">Energy</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 align-top text-foreground">
                        {format(new Date(s.startDate), "MMM d, yyyy · HH:mm")}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="text-foreground">{s.locationLine}</div>
                        {s.cityLine && (
                          <div className="text-xs text-muted">{s.cityLine}</div>
                        )}
                      </td>
                      <td className="w-44 py-3 pr-4 align-middle">
                        <SocBar
                          startPct={s.startBatteryLevel}
                          endPct={s.endBatteryLevel}
                        />
                      </td>
                      <td className="py-3 align-middle">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-base font-semibold text-foreground">
                            {s.energyAddedKwh?.toFixed(1) ?? "--"}
                            <span className="ml-1 text-xs font-normal text-muted">
                              kWh
                            </span>
                          </div>
                          {s.cost !== null && s.cost > 0 && (
                            <span className="rounded-full bg-accent-2/15 px-2.5 py-1 text-xs font-medium text-accent-2">
                              ${s.cost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
