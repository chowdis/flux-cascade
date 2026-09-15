export function DistanceBar({ km, maxKm }: { km: number; maxKm: number }) {
  const pct = maxKm > 0 ? Math.min(100, (km / maxKm) * 100) : 0;

  return (
    <div className="w-full min-w-[100px]">
      <div className="text-sm font-semibold text-foreground">
        {km.toFixed(1)} <span className="text-xs font-normal text-muted">km</span>
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
