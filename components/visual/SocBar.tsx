export function SocBar({
  startPct,
  endPct,
}: {
  startPct: number | null;
  endPct: number | null;
}) {
  if (startPct === null || endPct === null) {
    return <div className="h-2 w-full rounded-full bg-surface-2" />;
  }

  const start = Math.max(0, Math.min(100, startPct));
  const end = Math.max(0, Math.min(100, endPct));

  return (
    <div className="w-full min-w-[120px]">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="absolute inset-y-0 rounded-full bg-accent-2"
          style={{ left: `${start}%`, width: `${Math.max(0, end - start)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{Math.round(start)}%</span>
        <span>{Math.round(end)}%</span>
      </div>
    </div>
  );
}
