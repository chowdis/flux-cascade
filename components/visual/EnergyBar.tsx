export function EnergyBar({
  kwh,
  maxKwh,
  cost,
}: {
  kwh: number;
  maxKwh: number;
  cost?: number;
}) {
  const pct = maxKwh > 0 ? Math.min(100, (kwh / maxKwh) * 100) : 0;

  return (
    <div className="w-full min-w-[140px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          {kwh.toFixed(0)} kWh
        </span>
        {cost !== undefined && cost > 0 && (
          <span className="text-xs text-accent-2">${cost.toFixed(2)}</span>
        )}
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%`, transition: "width 0.4s ease" }}
        />
      </div>
    </div>
  );
}
