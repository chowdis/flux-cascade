const TONES = {
  gain: { fill: "bg-accent-2", arrow: "text-accent-2" },
  used: { fill: "bg-warning", arrow: "text-warning" },
} as const;

export function SocBar({
  startPct,
  endPct,
  tone = "gain",
}: {
  startPct: number | null;
  endPct: number | null;
  /** "gain" (green, e.g. charging) or "used" (amber, e.g. driving). */
  tone?: keyof typeof TONES;
}) {
  if (startPct === null || endPct === null) {
    return <div className="h-2 w-full rounded-full bg-surface-2" />;
  }

  const start = Math.max(0, Math.min(100, startPct));
  const end = Math.max(0, Math.min(100, endPct));
  const left = Math.min(start, end);
  const width = Math.abs(end - start);
  const { fill, arrow } = TONES[tone];

  return (
    <div className="w-full min-w-[120px]">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`absolute inset-y-0 rounded-full ${fill}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <div className="mt-1 text-center text-[11px] text-muted">
        {Math.round(start)}% <span className={arrow}>&rarr;</span>{" "}
        {Math.round(end)}%
      </div>
    </div>
  );
}
