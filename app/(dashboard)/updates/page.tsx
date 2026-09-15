import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getUpdateHistory } from "@/lib/queries/updates";
import { format, formatDistanceToNow } from "date-fns";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const updates = await getUpdateHistory(car.id);
  const current = updates.find((u) => u.endDate) ?? updates[0];

  return (
    <div>
      <PageHeader
        title="Software Updates"
        description="Firmware version history for this vehicle."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Current version"
          value={current?.version ?? "--"}
          accent
        />
        <StatCard
          label="Installed"
          value={
            current
              ? formatDistanceToNow(new Date(current.startDate), {
                  addSuffix: true,
                })
              : "--"
          }
        />
        <StatCard label="Updates recorded" value={String(updates.length)} />
      </div>

      <div className="mt-4">
        <Card title="Update history">
          <div className="space-y-3">
            {updates.map((u, i) => (
              <div
                key={`${u.startDate}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="text-foreground">
                    {u.version ?? "Unknown version"}
                  </div>
                  <div className="text-xs text-muted">
                    {format(new Date(u.startDate), "MMM d, yyyy · HH:mm")}
                    {!u.endDate && " · installing…"}
                  </div>
                </div>
              </div>
            ))}
            {updates.length === 0 && (
              <p className="text-sm text-muted">
                No software updates recorded yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
