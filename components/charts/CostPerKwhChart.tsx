"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import type { MonthlyCostRate } from "@/lib/queries/costs";

export function CostPerKwhChart({ data }: { data: MonthlyCostRate[] }) {
  const chartData = data
    .filter((d) => d.costPerKwh !== null)
    .map((d) => ({
      label: format(new Date(d.month), "MMM yyyy"),
      value: Number((d.costPerKwh as number).toFixed(3)),
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted">No charging sessions yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
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
          domain={["auto", "auto"]}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`$${Number(value).toFixed(3)}/kWh`, "Effective rate"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ r: 3, fill: "#22d3ee" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
