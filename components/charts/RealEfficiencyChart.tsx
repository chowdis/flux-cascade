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
import type { MonthlyRealEfficiency } from "@/lib/queries/realEfficiency";

export function RealEfficiencyChart({ data }: { data: MonthlyRealEfficiency[] }) {
  const chartData = data
    .filter((d) => d.whPerKm !== null)
    .map((d) => ({
      label: format(new Date(d.month), "MMM yyyy"),
      whPerKm: Math.round(d.whPerKm as number),
    }));

  return (
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
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${value} Wh/km`, "Efficiency"]}
        />
        <Line
          type="monotone"
          dataKey="whPerKm"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ r: 3, fill: "#22d3ee" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
