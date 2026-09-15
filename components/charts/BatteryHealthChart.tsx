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
import type { BatteryHealthPoint } from "@/lib/queries/battery";

export function BatteryHealthChart({ data }: { data: BatteryHealthPoint[] }) {
  const chartData = data.map((d) => ({
    label: format(new Date(d.month), "MMM yy"),
    rangeKm: Math.round(d.estRatedRangeAt100Km),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="battGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={["dataMin - 20", "dataMax + 20"]}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${value} km`, "Est. rated range @ 100%"]}
        />
        <Area
          type="monotone"
          dataKey="rangeKm"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#battGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
