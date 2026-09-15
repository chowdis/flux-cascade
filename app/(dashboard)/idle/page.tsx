import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { UptimeChart } from "@/components/charts/UptimeChart";
import { DrainChart } from "@/components/charts/DrainChart";
import { HoursBar } from "@/components/visual/HoursBar";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getUptimeSummary, getDailyStateBreakdown } from "@/lib/queries/uptime";
import { getDailyDrain } from "@/lib/queries/drain";
import { getClimateOnHours, getBatteryHeaterHours } from "@/lib/queries/climate";
import { getTimeByLocation } from "@/lib/queries/locations";

export default async function IdlePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const [summary, breakdown, drain, climateHours, heaterHours, locationTime] =
    await Promise.all([
      getUptimeSummary(car.id, 30),
      getDailyStateBreakdown(car.id, 14),
      getDailyDrain(car.id, 30),
      getClimateOnHours(car.id, 30),
      getBatteryHeaterHours(car.id, 30),
      getTimeByLocation(car.id, 30),
    ]);

  const totalHours = summary.reduce((sum, s) => sum + s.hours, 0);
  const hoursByState = Object.fromEntries(summary.map((s) => [s.state, s.hours]));
  const pct = (h: number) => (totalHours > 0 ? (h / totalHours) * 100 : 0);

  const totalIdleHours = drain.reduce((sum, d) => sum + d.idleHours, 0);
  const totalBatteryDrop = drain.reduce((sum, d) => sum + d.batteryDropPct, 0);
  const avgDrainPerDay =
    totalIdleHours > 0 ? (totalBatteryDrop / totalIdleHours) * 24 : 0;

  return (
    <div>
      <PageHeader
        title="Idle & Sleep"
        description="Time spent online, asleep, or offline, and battery lost while parked (vampire drain) — last 30 days."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Asleep"
          value={`${pct(hoursByState.asleep ?? 0).toFixed(0)}%`}
          sub={`${(hoursByState.asleep ?? 0).toFixed(0)}h of last 30 days`}
          accent
        />
        <StatCard
          label="Online"
          value={`${pct(hoursByState.online ?? 0).toFixed(0)}%`}
          sub={`${(hoursByState.online ?? 0).toFixed(0)}h of last 30 days`}
        />
        <StatCard
          label="Offline"
          value={`${pct(hoursByState.offline ?? 0).toFixed(0)}%`}
          sub={`${(hoursByState.offline ?? 0).toFixed(0)}h of last 30 days`}
        />
        <StatCard
          label="Avg. vampire drain"
          value={`${avgDrainPerDay.toFixed(2)}%/day`}
          sub={
            totalIdleHours > 0
              ? `over ${totalIdleHours.toFixed(0)}h idle`
              : "not enough idle data yet"
          }
        />
        <StatCard
          label="Climate on"
          value={`${climateHours.toFixed(0)}h`}
          sub="last 30 days"
        />
        <StatCard
          label="Battery heater on"
          value={`${heaterHours.toFixed(0)}h`}
          sub="last 30 days"
        />
      </div>

      <div className="mt-4">
        <Card title="Online / asleep / offline, by day (last 14 days)">
          <UptimeChart data={breakdown} />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Battery lost while parked, by day (last 30 days)">
          <DrainChart data={drain} />
        </Card>
      </div>

      {locationTime.length > 0 && (
        <div className="mt-4">
          <Card title="Time parked by location (last 30 days)">
            <div className="space-y-4">
              {locationTime.map((loc) => (
                <div key={loc.name} className="flex items-center gap-4">
                  <div className="w-28 shrink-0 truncate text-sm text-foreground">
                    {loc.name}
                  </div>
                  <HoursBar
                    hours={loc.hours}
                    maxHours={locationTime[0].hours}
                  />
                  <div className="w-16 shrink-0 text-right text-xs text-muted">
                    {loc.visits} visit{loc.visits === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Based on named locations set up in TeslaMate&apos;s Geo-fences —
              stops that didn&apos;t end inside a geo-fence aren&apos;t
              included.
            </p>
          </Card>
        </div>
      )}

      <div className="mt-4">
        <Card>
          <p className="text-xs text-muted">
            &quot;Vampire drain&quot; pairs up consecutive parked telemetry
            readings (excluding drives and charging sessions) to measure
            battery lost while just sitting. A car that fails to fall asleep
            (low &quot;Asleep&quot; %) will usually show up here as
            higher-than-normal daily drain — Sentry Mode, cabin overheat
            protection, and some third-party apps polling the car too often
            are common causes.
          </p>
        </Card>
      </div>
    </div>
  );
}
