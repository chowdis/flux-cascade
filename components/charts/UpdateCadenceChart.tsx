"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import type { SoftwareUpdate } from "@/lib/queries/updates";

export function UpdateCadenceChart({ data }: { data: SoftwareUpdate[] }) {
  // Oldest -> newest, left to right, skipping the first entry (no gap yet).
  const chartData = [...data]
    .reverse()
    .filter((u): u is SoftwareUpdate & { daysSincePrevious: number } =>
      u.daysSincePrevious !== null
    )
    .map((u) => ({
      label: format(new Date(u.startDate), "MMM d"),
      days: u.daysSincePrevious,
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
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
          width={36}
          label={{
            value: "days",
            angle: -90,
            position: "insideLeft",
            fill: "#8a94a6",
            fontSize: 11,
          }}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${value} days`, "Since previous update"]}
        />
        <Bar dataKey="days" fill="#22d3ee" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
