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

export function CostPer100KmChart({ data }: { data: MonthlyCostRate[] }) {
  const chartData = data
    .filter((d) => d.costPer100Km !== null)
    .map((d) => ({
      label: format(new Date(d.month), "MMM yyyy"),
      value: Number((d.costPer100Km as number).toFixed(2)),
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted">Not enough data yet.</p>;
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
          formatter={(value) => [`$${Number(value).toFixed(2)}/100km`, "Cost per 100 km"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ r: 3, fill: "#34d399" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
