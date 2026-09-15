"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import type { WeeklyEfficiency } from "@/lib/queries/drives";

/**
 * TeslaMate doesn't record actual energy consumed per drive, only rated-range
 * consumed. So instead of inventing a Wh/km conversion, this plots distance
 * driven against rated-range used per week, plus their ratio: a ratio of 1.0
 * means you drove exactly as efficiently as Tesla's rated range assumes;
 * above 1.0 is better than rated, below is worse (cold weather, highway
 * speeds, etc).
 */
export function EfficiencyChart({ data }: { data: WeeklyEfficiency[] }) {
  const chartData = data
    .filter((d) => d.rangeUsedKm > 0)
    .map((d) => ({
      label: format(new Date(d.week), "MMM d"),
      distanceKm: Math.round(d.distanceKm),
      rangeUsedKm: Math.round(d.rangeUsedKm),
      ratio: d.distanceKm / d.rangeUsedKm,
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a35" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="km"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <YAxis
          yAxisId="ratio"
          orientation="right"
          domain={[0, 2]}
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => {
            if (name === "ratio")
              return [Number(value).toFixed(2), "vs. rated range"];
            if (name === "distanceKm") return [`${value} km`, "Driven"];
            return [`${value} km`, "Rated range used"];
          }}
        />
        <Bar
          yAxisId="km"
          dataKey="distanceKm"
          name="distanceKm"
          fill="#22d3ee"
          radius={[4, 4, 0, 0]}
          barSize={14}
        />
        <Bar
          yAxisId="km"
          dataKey="rangeUsedKm"
          name="rangeUsedKm"
          fill="#232a35"
          radius={[4, 4, 0, 0]}
          barSize={14}
        />
        <Line
          yAxisId="ratio"
          dataKey="ratio"
          name="ratio"
          stroke="#34d399"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
