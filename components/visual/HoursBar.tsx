export function HoursBar({ hours, maxHours }: { hours: number; maxHours: number }) {
  const pct = maxHours > 0 ? Math.min(100, (hours / maxHours) * 100) : 0;

  return (
    <div className="w-full min-w-[140px]">
      <span className="text-sm font-semibold text-foreground">
        {hours.toFixed(0)}h
      </span>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%`, transition: "width 0.4s ease" }}
        />
      </div>
    </div>
  );
}
