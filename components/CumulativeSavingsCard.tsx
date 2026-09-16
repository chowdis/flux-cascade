"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { Card } from "@/components/StatCard";
import type { MonthlyCostRate } from "@/lib/queries/costs";

/**
 * A running total of what you've actually paid to charge against what the
 * same driving would've cost in an equivalent gas car, month by month.
 * The gap between the two lines *is* the savings — this is the trend
 * version of the single running total on the Charging page's gas-savings
 * card. Gas cost is intentionally muted/dashed rather than a second bright
 * hue: it's a hypothetical reference line, not a second real quantity.
 */
export function CumulativeSavingsCard({ data }: { data: MonthlyCostRate[] }) {
  const [litersPer100Km, setLitersPer100Km] = useState(8);
  const [gasPricePerLiter, setGasPricePerLiter] = useState(1.5);

  const { chartData, totalSaved } = useMemo(() => {
    const rows = data.reduce<
      { label: string; actual: number; gas: number }[]
    >((acc, d) => {
      const prev = acc[acc.length - 1];
      const actual = (prev?.actual ?? 0) + d.cost;
      const gas =
        (prev?.gas ?? 0) +
        (d.distanceKm / 100) * litersPer100Km * gasPricePerLiter;
      return [
        ...acc,
        {
          label: format(new Date(d.month), "MMM yy"),
          actual: Number(actual.toFixed(2)),
          gas: Number(gas.toFixed(2)),
        },
      ];
    }, []);
    const last = rows[rows.length - 1];
    return {
      chartData: rows,
      totalSaved: last ? last.gas - last.actual : 0,
    };
  }, [data, litersPer100Km, gasPricePerLiter]);

  return (
    <Card title="Cumulative cost vs. an equivalent gas car">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4">
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
        <div className="text-right">
          <div className="text-xs text-muted">Total saved</div>
          <div
            className={`text-lg font-semibold ${totalSaved >= 0 ? "text-accent-2" : "text-danger"}`}
          >
            {totalSaved >= 0 ? "+" : ""}
            ${totalSaved.toFixed(2)}
          </div>
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="text-sm text-muted">
          Not enough charging history yet to chart a trend.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a35" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#8a94a6"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8a94a6"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#1a2029",
                border: "1px solid #232a35",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}`,
                name === "actual" ? "Charging cost" : "Equivalent gas cost",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) =>
                value === "actual" ? "Charging cost" : "Equivalent gas cost"
              }
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="actual"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="gas"
              name="gas"
              stroke="#8a94a6"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
