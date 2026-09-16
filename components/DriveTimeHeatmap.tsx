import type { HeatmapData } from "@/lib/queries/drivingHabits";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_TICKS = new Set([0, 3, 6, 9, 12, 15, 18, 21]);
const LEGEND_STEPS = [0.15, 0.36, 0.57, 0.78, 1];

function formatHour(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

/**
 * When you actually start driving, by hour of day (columns) and day of
 * week (rows). Sequential single-hue shading (accent, light -> dark) by
 * drive count — a plain div grid rather than a recharts chart since
 * recharts has no heatmap primitive; native `title` tooltips cover the
 * per-cell detail without needing client-side interactivity.
 */
export function DriveTimeHeatmap({ data }: { data: HeatmapData }) {
  const { counts, maxCount } = data;

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="flex pl-10">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="flex-1 text-center text-[10px] text-muted">
                {HOUR_TICKS.has(hour) ? formatHour(hour) : ""}
              </div>
            ))}
          </div>
          {DAY_LABELS.map((label, dayIdx) => (
            <div key={label} className="mt-1 flex items-center">
              <div className="w-10 shrink-0 text-xs text-muted">{label}</div>
              <div className="flex flex-1 gap-[2px]">
                {counts[dayIdx].map((count, hour) => (
                  <div
                    key={hour}
                    title={`${label} ${formatHour(hour)}: ${count} drive${count === 1 ? "" : "s"}`}
                    className={`h-5 flex-1 rounded-sm ${count === 0 ? "bg-surface-2" : "bg-accent"}`}
                    style={
                      count === 0
                        ? undefined
                        : { opacity: 0.15 + (count / maxCount) * 0.85 }
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted">
        <span>Fewer</span>
        <div className="flex gap-[2px]">
          {LEGEND_STEPS.map((opacity) => (
            <div
              key={opacity}
              className="h-3 w-5 rounded-sm bg-accent"
              style={{ opacity }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
