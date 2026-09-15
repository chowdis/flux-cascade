"use client";

import { useState } from "react";
import { Card } from "@/components/StatCard";

const KM_PER_MILE = 1.609344;

export function GasSavingsCard({
  totalDistanceKm,
  totalChargingCost,
}: {
  totalDistanceKm: number;
  totalChargingCost: number;
}) {
  const [mpg, setMpg] = useState(28);
  const [gasPrice, setGasPrice] = useState(3.5);

  const miles = totalDistanceKm / KM_PER_MILE;
  const equivalentGasCost = mpg > 0 ? (miles / mpg) * gasPrice : 0;
  const savings = equivalentGasCost - totalChargingCost;

  return (
    <Card title="Cost vs. an equivalent gas car">
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          Comparable MPG
          <input
            type="number"
            min={1}
            step={1}
            value={mpg}
            onChange={(e) => setMpg(Number(e.target.value) || 0)}
            className="mt-1 block w-24 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="text-xs text-muted">
          Gas price ($/gal)
          <input
            type="number"
            min={0}
            step={0.1}
            value={gasPrice}
            onChange={(e) => setGasPrice(Number(e.target.value) || 0)}
            className="mt-1 block w-24 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-muted">Distance driven</div>
          <div className="mt-1 text-foreground">{miles.toFixed(0)} mi</div>
        </div>
        <div>
          <div className="text-xs text-muted">Would&apos;ve cost in gas</div>
          <div className="mt-1 text-foreground">
            ${equivalentGasCost.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">Estimated savings</div>
          <div
            className={`mt-1 font-medium ${savings >= 0 ? "text-accent-2" : "text-danger"}`}
          >
            {savings >= 0 ? "+" : ""}
            ${savings.toFixed(2)}
          </div>
        </div>
      </div>
    </Card>
  );
}
