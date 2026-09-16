import { Card } from "@/components/StatCard";
import type { WeekdayWeekendSummary } from "@/lib/queries/drivingHabits";

export function WeekdayWeekendCard({ summary }: { summary: WeekdayWeekendSummary }) {
  return (
    <Card title="Weekday vs. weekend">
      <div className="grid grid-cols-2 gap-6">
        <Group label="Weekday" group={summary.weekday} />
        <Group label="Weekend" group={summary.weekend} />
      </div>
    </Card>
  );
}

function Group({
  label,
  group,
}: {
  label: string;
  group: WeekdayWeekendSummary["weekday"];
}) {
  return (
    <div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Avg. distance / day" value={`${group.avgDistancePerDay.toFixed(1)} km`} />
        <Row label="Avg. drives / day" value={group.avgDrivesPerDay.toFixed(2)} />
        <Row label="Avg. trip length" value={`${group.avgTripLengthKm.toFixed(1)} km`} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
