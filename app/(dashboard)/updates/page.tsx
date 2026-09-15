import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { UpdateCadenceChart } from "@/components/charts/UpdateCadenceChart";
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

  const gaps = updates
    .map((u) => u.daysSincePrevious)
    .filter((d): d is number => d !== null);
  const avgDays =
    gaps.length > 0 ? gaps.reduce((sum, d) => sum + d, 0) / gaps.length : null;

  return (
    <div>
      <PageHeader
        title="Software Updates"
        description="Firmware version history and how often this vehicle gets updated."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <StatCard
          label="Avg. time between updates"
          value={avgDays !== null ? `${avgDays.toFixed(0)} days` : "--"}
        />
        <StatCard label="Updates recorded" value={String(updates.length)} />
      </div>

      {gaps.length > 0 && (
        <div className="mt-4">
          <Card title="Days between updates">
            <UpdateCadenceChart data={updates} avgDays={avgDays} />
          </Card>
        </div>
      )}

      <div className="mt-4">
        <Card title="Update timeline">
          {updates.length === 0 ? (
            <p className="text-sm text-muted">
              No software updates recorded yet.
            </p>
          ) : (
            <ol>
              {updates.map((u, i) => {
                const isCurrent = current && u.startDate === current.startDate;
                const isLast = i === updates.length - 1;
                return (
                  <li key={`${u.startDate}-${i}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          "mt-1.5 h-3 w-3 shrink-0 rounded-full " +
                          (isCurrent
                            ? "bg-accent ring-4 ring-accent/20"
                            : "bg-surface-2 ring-2 ring-border")
                        }
                      />
                      {!isLast && (
                        <span className="w-px flex-1 bg-border" aria-hidden="true" />
                      )}
                    </div>
                    <div className={isLast ? "pb-0" : "pb-6"}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {u.version ?? "Unknown version"}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                            Current
                          </span>
                        )}
                        {!u.endDate && (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">
                            Installing…
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {format(new Date(u.startDate), "MMM d, yyyy · HH:mm")}
                        {u.daysSincePrevious !== null &&
                          ` · ${u.daysSincePrevious} day${u.daysSincePrevious === 1 ? "" : "s"} since previous update`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
