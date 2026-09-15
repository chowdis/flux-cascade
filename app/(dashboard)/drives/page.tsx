import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { EfficiencyChart } from "@/components/charts/EfficiencyChart";
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

  return (
    <div>
      <PageHeader
        title="Drives"
        description="Recent trips and driving efficiency vs. rated range."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
      </div>

      <div className="mt-4">
        <Card title="Distance vs. rated range used (weekly)">
          <EfficiencyChart data={trend} />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent trips">
          <div className="space-y-3">
            {drives.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="text-foreground">
                    {d.startAddress ?? "Unknown"} → {d.endAddress ?? "Unknown"}
                  </div>
                  <div className="text-xs text-muted">
                    {format(new Date(d.startDate), "MMM d, HH:mm")} ·{" "}
                    {d.durationMin ?? 0} min
                    {d.speedMaxKph !== null && ` · ${d.speedMaxKph} km/h max`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground">
                    {d.distanceKm?.toFixed(1) ?? "--"} km
                  </div>
                  {d.startBatteryLevel !== null &&
                    d.endBatteryLevel !== null && (
                      <div className="text-xs text-muted">
                        {d.startBatteryLevel}% → {d.endBatteryLevel}%
                      </div>
                    )}
                </div>
              </div>
            ))}
            {drives.length === 0 && (
              <p className="text-sm text-muted">No drives recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
