import { PageHeader, Card } from "@/components/StatCard";
import { TpmsChart } from "@/components/charts/TpmsChart";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getTpmsTrend } from "@/lib/queries/tpms";

export default async function TpmsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const trend = await getTpmsTrend(car.id, 90);

  return (
    <div>
      <PageHeader
        title="Tire Pressure"
        description="Tire pressure trend over the last 90 days."
      />
      <Card title="Tire pressure by wheel">
        {trend.length > 0 ? (
          <>
            <TpmsChart data={trend} />
            <p className="mt-3 text-xs text-muted">
              Most Tesla models recommend a cold tire pressure around 42 psi
              — check your driver-side door jamb sticker for your exact
              car&apos;s spec.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            No tire pressure data recorded yet.
          </p>
        )}
      </Card>
    </div>
  );
}
