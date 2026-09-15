"use client";

import { useState } from "react";
import { Card } from "@/components/StatCard";

export function GasSavingsCard({
  totalDistanceKm,
  totalChargingCost,
}: {
  totalDistanceKm: number;
  totalChargingCost: number;
}) {
  const [litersPer100Km, setLitersPer100Km] = useState(8);
  const [gasPricePerLiter, setGasPricePerLiter] = useState(1.5);

  const equivalentGasCost =
    litersPer100Km > 0
      ? (totalDistanceKm / 100) * litersPer100Km * gasPricePerLiter
      : 0;
  const savings = equivalentGasCost - totalChargingCost;

  return (
    <Card title="Cost vs. an equivalent gas car">
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          Comparable consumption (L/100km)
          <input
            type="number"
            min={1}
            step={0.1}
            value={litersPer100Km}
            onChange={(e) => setLitersPer100Km(Number(e.target.value) || 0)}
            className="mt-1 block w-24 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="text-xs text-muted">
          Gas price ($/L)
          <input
            type="number"
            min={0}
            step={0.01}
            value={gasPricePerLiter}
            onChange={(e) => setGasPricePerLiter(Number(e.target.value) || 0)}
            className="mt-1 block w-24 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-muted">Distance driven</div>
          <div className="mt-1 text-foreground">
            {totalDistanceKm.toFixed(0)} km
          </div>
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
