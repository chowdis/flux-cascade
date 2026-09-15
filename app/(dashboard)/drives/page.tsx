import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { EfficiencyChart } from "@/components/charts/EfficiencyChart";
import { DistanceBar } from "@/components/visual/DistanceBar";
import { SocBar } from "@/components/visual/SocBar";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getDrives, getEfficiencyTrend } from "@/lib/queries/drives";
import { format } from "date-fns";

export default async function DrivesPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const [drives, trend] = await Promise.all([
    getDrives(car.id, 25),
    getEfficiencyTrend(car.id),
  ]);

  const totalDistance = drives.reduce((sum, d) => sum + (d.distanceKm ?? 0), 0);
  const totalDrives = drives.length;
  const avgSpeed =
    drives.length > 0
      ? drives.reduce((sum, d) => sum + (d.speedMaxKph ?? 0), 0) /
        drives.length
      : 0;
  const maxDistance = Math.max(1, ...drives.map((d) => d.distanceKm ?? 0));
  const totalAscent = drives.reduce((sum, d) => sum + (d.ascentM ?? 0), 0);
  const totalDescent = drives.reduce((sum, d) => sum + (d.descentM ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Drives"
        description="Recent trips and driving efficiency vs. rated range."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Drives shown" value={String(totalDrives)} />
        <StatCard
          label="Distance shown"
          value={`${totalDistance.toFixed(0)} km`}
        />
        <StatCard
          label="Avg top speed"
          value={avgSpeed > 0 ? `${avgSpeed.toFixed(0)} km/h` : "--"}
          accent
        />
        <StatCard
          label="Total climbed"
          value={`${totalAscent.toLocaleString()} m`}
        />
        <StatCard
          label="Total descended"
          value={`${totalDescent.toLocaleString()} m`}
        />
      </div>

      <div className="mt-4">
        <Card title="Distance vs. rated range used (weekly)">
          <EfficiencyChart data={trend} />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent trips">
          {drives.length === 0 ? (
            <p className="text-sm text-muted">No drives recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Start address</th>
                    <th className="pb-2 font-medium">Destination address</th>
                    <th className="pb-2 font-medium">Distance</th>
                    <th className="pb-2 font-medium">Battery used</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map((d) => (
                    <tr key={d.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 align-top text-foreground">
                        {format(new Date(d.startDate), "MMM d, yyyy · HH:mm")}
                        <div className="text-xs text-muted">
                          {d.durationMin ?? 0} min
                          {d.speedMaxKph !== null && ` · ${d.speedMaxKph} km/h max`}
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="text-foreground">{d.startLocationLine}</div>
                        {d.startCityLine && (
                          <div className="text-xs text-muted">{d.startCityLine}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="text-foreground">{d.endLocationLine}</div>
                        {d.endCityLine && (
                          <div className="text-xs text-muted">{d.endCityLine}</div>
                        )}
                      </td>
                      <td className="w-32 py-3 pr-4 align-middle">
                        <DistanceBar km={d.distanceKm ?? 0} maxKm={maxDistance} />
                      </td>
                      <td className="w-36 py-3 align-middle">
                        <SocBar
                          startPct={d.startBatteryLevel}
                          endPct={d.endBatteryLevel}
                          tone="used"
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
    </div>
  );
}
