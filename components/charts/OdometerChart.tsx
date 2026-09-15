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
import { format } from "date-fns";
import type { OdometerPoint } from "@/lib/queries/odometer";

export function OdometerChart({ data }: { data: OdometerPoint[] }) {
  const chartData = data.map((d) => ({
    label: format(new Date(d.week), "MMM yyyy"),
    odometerKm: Math.round(d.odometerKm),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="odoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a35" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />
        <YAxis
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toLocaleString()} km`, "Odometer"]}
        />
        <Area
          type="monotone"
          dataKey="odometerKm"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#odoGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
