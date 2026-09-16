import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { DriveTimeHeatmap } from "@/components/DriveTimeHeatmap";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { WeekdayWeekendCard } from "@/components/WeekdayWeekendCard";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import {
  getDriveTimings,
  buildHourDayHeatmap,
  buildDistanceHistogram,
  buildSpeedHistogram,
  buildWeekdayWeekendSummary,
} from "@/lib/queries/drivingHabits";

const WINDOW_DAYS = 90;

export default async function DrivingHabitsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const timings = await getDriveTimings(car.id, WINDOW_DAYS);

  const heatmap = buildHourDayHeatmap(timings);
  const distanceHistogram = buildDistanceHistogram(timings);
  const speedHistogram = buildSpeedHistogram(timings);
  const weekdayWeekend = buildWeekdayWeekendSummary(timings, WINDOW_DAYS);

  const totalDrives = timings.length;
  const totalDistance = timings.reduce((sum, t) => sum + t.distanceKm, 0);
  const avgTripLength = totalDrives > 0 ? totalDistance / totalDrives : 0;
  const shortTrips = timings.filter((t) => t.distanceKm < 5).length;
  const shortTripShare = totalDrives > 0 ? (shortTrips / totalDrives) * 100 : 0;
  const avgDrivesPerDay = totalDrives / WINDOW_DAYS;

  return (
    <div>
      <PageHeader
        title="Driving Habits"
        description={`When, how far, and how fast you actually drive — last ${WINDOW_DAYS} days.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Drives" value={String(totalDrives)} />
        <StatCard label="Distance" value={`${totalDistance.toFixed(0)} km`} />
        <StatCard
          label="Avg. trip length"
          value={`${avgTripLength.toFixed(1)} km`}
          accent
        />
        <StatCard
          label="Short trips (<5km)"
          value={`${shortTripShare.toFixed(0)}%`}
        />
        <StatCard
          label="Avg. drives / day"
          value={avgDrivesPerDay.toFixed(2)}
        />
      </div>

      <div className="mt-4">
        <Card title="When you drive">
          {totalDrives === 0 ? (
            <p className="text-sm text-muted">No drives recorded yet.</p>
          ) : (
            <DriveTimeHeatmap data={heatmap} />
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Trip length distribution">
          <HistogramChart data={distanceHistogram} color="#22d3ee" unit="trips" />
        </Card>
        <Card title="Top speed reached, by trip">
          <HistogramChart data={speedHistogram} color="#34d399" unit="trips" />
        </Card>
      </div>

      <div className="mt-4">
        <WeekdayWeekendCard summary={weekdayWeekend} />
      </div>
    </div>
  );
}
