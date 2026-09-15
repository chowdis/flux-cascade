import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { BatteryHealthChart } from "@/components/charts/BatteryHealthChart";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getBatteryHealthTrend } from "@/lib/queries/battery";

export default async function BatteryPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const trend = await getBatteryHealthTrend(car.id);

  const first = trend[0];
  const latest = trend[trend.length - 1];
  const degradationPct =
    first && latest
      ? ((first.estRatedRangeAt100Km - latest.estRatedRangeAt100Km) /
          first.estRatedRangeAt100Km) *
        100
      : null;

  return (
    <div>
      <PageHeader
        title="Battery Health"
        description="Estimated rated range at 100% charge, over time — a rough proxy for degradation."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Earliest estimate"
          value={
            first ? `${Math.round(first.estRatedRangeAt100Km)} km` : "--"
          }
        />
        <StatCard
          label="Latest estimate"
          value={
            latest ? `${Math.round(latest.estRatedRangeAt100Km)} km` : "--"
          }
          accent
        />
        <StatCard
          label="Change since first estimate"
          value={
            degradationPct !== null ? `${degradationPct.toFixed(1)}%` : "--"
          }
          sub={
            degradationPct !== null && degradationPct > 0
              ? "lower rated range"
              : degradationPct !== null
                ? "no measurable loss"
                : undefined
          }
        />
      </div>

      <div className="mt-4">
        <Card title="Estimated rated range @ 100% charge, by month">
          <BatteryHealthChart data={trend} />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <p className="text-xs text-muted">
            This isn&apos;t a lab-measured battery health percentage —
            TeslaMate doesn&apos;t record one. It normalizes each recorded
            rated range to what it would be at 100% charge, then takes the
            best estimate per month. Short-term noise (temperature, sensor
            calibration after a full charge) is normal; look at the
            multi-month trend rather than any single point.
          </p>
        </Card>
      </div>
    </div>
  );
}
