import { Card } from "@/components/StatCard";
import type { ChargerTypeBreakdown } from "@/lib/queries/chargerType";

/**
 * Per charger type: what share of your energy came from it, what share of
 * your cost, and the effective $/kWh — the gap between the energy bar and
 * the cost bar is the tell (e.g. Supercharging is usually a bigger slice
 * of cost than of energy, home charging the reverse).
 */
export function ChargingMixCard({ types }: { types: ChargerTypeBreakdown[] }) {
  const totalEnergy = Math.max(
    1,
    types.reduce((sum, t) => sum + t.energyKwh, 0)
  );
  const totalCost = Math.max(
    1,
    types.reduce((sum, t) => sum + t.cost, 0)
  );

  return (
    <Card title="Charging mix: cost vs. energy share">
      {types.length === 0 ? (
        <p className="text-sm text-muted">No charging sessions yet.</p>
      ) : (
        <div className="space-y-5">
          {types.map((t) => {
            const energyPct = (t.energyKwh / totalEnergy) * 100;
            const costPct = (t.cost / totalCost) * 100;
            const perKwh = t.energyKwh > 0 ? t.cost / t.energyKwh : null;
            return (
              <div key={t.chargerType}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {t.chargerType}
                  </span>
                  <span className="text-xs text-muted">
                    {perKwh !== null && perKwh > 0
                      ? `$${perKwh.toFixed(2)}/kWh avg`
                      : "free"}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <MixBar
                    label="Energy"
                    pct={energyPct}
                    valueLabel={`${t.energyKwh.toFixed(0)} kWh`}
                    colorClass="bg-accent"
                  />
                  <MixBar
                    label="Cost"
                    pct={costPct}
                    valueLabel={`$${t.cost.toFixed(2)}`}
                    colorClass="bg-accent-2"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function MixBar({
  label,
  pct,
  valueLabel,
  colorClass,
}: {
  label: string;
  pct: number;
  valueLabel: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, transition: "width 0.4s ease" }}
        />
      </div>
      <span className="w-20 shrink-0 text-right text-xs text-muted">
        {valueLabel}
      </span>
    </div>
  );
}
