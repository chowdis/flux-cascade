"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ElevationPoint } from "@/lib/queries/elevation";

export function ElevationChart({ points }: { points: ElevationPoint[] }) {
  const chartData = points.map((p) => ({
    distanceKm: Number(p.distanceKm.toFixed(1)),
    elevationM: Math.round(p.elevationM),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a35" vertical={false} />
        <XAxis
          dataKey="distanceKm"
          type="number"
          domain={["dataMin", "dataMax"]}
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} km`}
        />
        <YAxis
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={["auto", "auto"]}
          tickFormatter={(v) => `${v}m`}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => `${v} km into trip`}
          formatter={(value) => [`${value} m`, "Elevation"]}
        />
        <Area
          type="monotone"
          dataKey="elevationM"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#elevationGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
