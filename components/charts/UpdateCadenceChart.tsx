"use client";

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
import type { SoftwareUpdate } from "@/lib/queries/updates";

export function UpdateCadenceChart({
  data,
  avgDays,
}: {
  data: SoftwareUpdate[];
  avgDays: number | null;
}) {
  // Oldest -> newest, left to right, skipping the first entry (no gap yet).
  const chartData = [...data]
    .reverse()
    .filter((u): u is SoftwareUpdate & { daysSincePrevious: number } =>
      u.daysSincePrevious !== null
    )
    .map((u) => ({
      label: format(new Date(u.startDate), "MMM d"),
      days: u.daysSincePrevious,
      // Same value repeated for every point, so it draws as a flat line.
      average: avgDays,
    }));

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
          formatter={(value, name) => [
            `${Number(value).toFixed(0)} days`,
            name === "average" ? "Average" : "Since previous update",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) =>
            value === "average" ? "Average" : "Days since previous"
          }
        />
        <Line
          type="monotone"
          dataKey="days"
          name="days"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        {avgDays !== null && (
          <Line
            type="monotone"
            dataKey="average"
            name="average"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
