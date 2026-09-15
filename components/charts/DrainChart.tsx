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
import type { DailyDrain } from "@/lib/queries/drain";

export function DrainChart({ data }: { data: DailyDrain[] }) {
  const chartData = data.map((d) => ({
    label: format(new Date(d.day), "MMM d"),
    batteryDropPct: Number(d.batteryDropPct.toFixed(2)),
    idleHours: Number(d.idleHours.toFixed(1)),
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
          yAxisId="pct"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <YAxis
          yAxisId="hours"
          orientation="right"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) =>
            name === "idleHours"
              ? [`${value}h`, "Idle time"]
              : [`${value}%`, "Battery lost"]
          }
        />
        <Bar
          yAxisId="pct"
          dataKey="batteryDropPct"
          name="batteryDropPct"
          fill="#f87171"
          radius={[4, 4, 0, 0]}
          barSize={16}
        />
        <Line
          yAxisId="hours"
          dataKey="idleHours"
          name="idleHours"
          stroke="#8a94a6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
