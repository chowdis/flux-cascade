import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { SocTimeBar } from "@/components/SocTimeBar";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import {
  getSocBandHours,
  getChargeStartSoc,
  getChargeEndSoc,
  getDriveStartSoc,
  buildPercentHistogram,
  shareBelow,
  shareAtOrAbove,
  average,
} from "@/lib/queries/batteryUsage";

const WINDOW_DAYS = 90;

export default async function BatteryUsagePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const [socBands, chargeStart, chargeEnd, driveStart] = await Promise.all([
    getSocBandHours(car.id, WINDOW_DAYS),
    getChargeStartSoc(car.id, WINDOW_DAYS),
    getChargeEndSoc(car.id, WINDOW_DAYS),
    getDriveStartSoc(car.id, WINDOW_DAYS),
  ]);

  const avgChargeStart = average(chargeStart);
  const avgChargeEnd = average(chargeEnd);
  const endedAbove80 = shareAtOrAbove(chargeEnd, 80);
  const startedBelow20 = shareBelow(driveStart, 20);
  const timeAbove80 =
    socBands.reduce((sum, b) => sum + b.hours, 0) > 0
      ? (socBands
          .filter((b) => b.band === "80to100")
          .reduce((sum, b) => sum + b.hours, 0) /
          socBands.reduce((sum, b) => sum + b.hours, 0)) *
        100
      : 0;

  return (
    <div>
      <PageHeader
        title="Battery Usage Patterns"
        description={`How you actually charge and drain the battery day to day — last ${WINDOW_DAYS} days.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Avg. charge start"
          value={avgChargeStart !== null ? `${avgChargeStart.toFixed(0)}%` : "--"}
        />
        <StatCard
          label="Avg. charge end"
          value={avgChargeEnd !== null ? `${avgChargeEnd.toFixed(0)}%` : "--"}
          accent
        />
        <StatCard
          label="Sessions ending ≥80%"
          value={`${endedAbove80.toFixed(0)}%`}
        />
        <StatCard
          label="Drives starting <20%"
          value={`${startedBelow20.toFixed(0)}%`}
        />
        <StatCard
          label="Time spent above 80%"
          value={`${timeAbove80.toFixed(0)}%`}
        />
      </div>

      <div className="mt-4">
        <Card title="Time spent by state of charge">
          <SocTimeBar bands={socBands} />
          <p className="mt-4 text-xs text-muted">
            Time-weighted from raw telemetry, not just charge/drive
            start-and-end snapshots — a battery sitting at 95% for hours
            after a charge finishes counts here even though no drive or
            charge session captures it. Sustained time at the extremes
            (below 20%, above 80%) is generally considered harder on the
            battery than time in the middle; see{" "}
            <span className="text-foreground">Battery Health</span> for
            the actual degradation trend.
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Charge start SoC">
          <HistogramChart
            data={buildPercentHistogram(chargeStart)}
            color="#22d3ee"
            unit="sessions"
          />
        </Card>
        <Card title="Charge end SoC">
          <HistogramChart
            data={buildPercentHistogram(chargeEnd)}
            color="#34d399"
            unit="sessions"
          />
        </Card>
        <Card title="Drive start SoC">
          <HistogramChart
            data={buildPercentHistogram(driveStart)}
            color="#fbbf24"
            unit="drives"
          />
        </Card>
      </div>
    </div>
  );
}
