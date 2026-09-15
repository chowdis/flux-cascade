import { PageHeader, Card } from "@/components/StatCard";
import { TripsMap } from "@/components/TripsMap";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getRecentDrivePaths } from "@/lib/queries/tripmap";

export default async function TripsMapPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const paths = await getRecentDrivePaths(car.id, 15);

  return (
    <div>
      <PageHeader
        title="Trip Map"
        description="Routes from your most recent drives."
      />
      <Card>
        {paths.length > 0 ? (
          <TripsMap paths={paths} />
        ) : (
          <p className="text-sm text-muted">
            No recent drives with GPS data yet.
          </p>
        )}
      </Card>
    </div>
  );
}
