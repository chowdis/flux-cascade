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
import type { HistogramBucket } from "@/lib/histogram";

/**
 * A single-series bucketed count chart — shared by the trip-length and
 * max-speed distributions on Driving Habits, since both are "how many
 * trips fell in this bucket" with just a different unit and color.
 */
export function HistogramChart({
  data,
  color = "#22d3ee",
  unit = "trips",
}: {
  data: HistogramBucket[];
  color?: string;
  unit?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <p className="text-sm text-muted">Not enough drives yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${value} ${unit}`, "Count"]}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
