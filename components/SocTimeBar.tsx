import type { SocBandHours } from "@/lib/queries/batteryUsage";

const BAND_META: Record<
  string,
  { label: string; colorClass: string; dotClass: string }
> = {
  below20: { label: "Below 20%", colorClass: "bg-warning", dotClass: "bg-warning" },
  "20to50": { label: "20–50%", colorClass: "bg-accent-2", dotClass: "bg-accent-2" },
  "50to80": { label: "50–80%", colorClass: "bg-accent-2", dotClass: "bg-accent-2" },
  "80to100": { label: "80–100%", colorClass: "bg-warning", dotClass: "bg-warning" },
};

/**
 * One horizontal bar, split into the four state-of-charge bands by share of
 * time spent in each — a status encoding (amber = the extremes generally
 * considered harder on the battery, green = the 20-80% band generally
 * considered easier on it), not an identity palette, so it's fine that two
 * segments share a color; each segment is still labeled below, never
 * color-only. A thin surface-colored gap separates adjacent segments.
 */
export function SocTimeBar({ bands }: { bands: SocBandHours[] }) {
  const totalHours = bands.reduce((sum, b) => sum + b.hours, 0);

  if (totalHours === 0) {
    return <p className="text-sm text-muted">Not enough data yet.</p>;
  }

  return (
    <div>
      <div className="flex h-6 w-full gap-0.5 overflow-hidden rounded-md">
        {bands.map((b) => {
          const pct = (b.hours / totalHours) * 100;
          if (pct <= 0) return null;
          const meta = BAND_META[b.band];
          return (
            <div
              key={b.band}
              title={`${meta.label}: ${pct.toFixed(0)}% of time (${b.hours.toFixed(0)}h)`}
              className={`h-full ${meta.colorClass}`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {bands.map((b) => {
          const pct = (b.hours / totalHours) * 100;
          const meta = BAND_META[b.band];
          return (
            <div key={b.band} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dotClass}`} />
              <div className="text-xs">
                <div className="text-foreground">{meta.label}</div>
                <div className="text-muted">
                  {pct.toFixed(0)}% &middot; {b.hours.toFixed(0)}h
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
