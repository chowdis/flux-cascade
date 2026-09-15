"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TempEfficiencyBucket } from "@/lib/queries/tempEfficiency";

export function TempEfficiencyChart({ data }: { data: TempEfficiencyBucket[] }) {
  const chartData = data.map((d) => ({
    label: d.label,
    ratio: Number(d.ratio.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          domain={[0, "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [value, "vs. rated range"]}
        />
        <ReferenceLine y={1} stroke="#8a94a6" strokeDasharray="4 3" />
        <Bar dataKey="ratio" radius={[4, 4, 0, 0]} barSize={40}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.ratio >= 1 ? "#34d399" : "#f87171"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
