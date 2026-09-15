"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import type { DailyStateBreakdown } from "@/lib/queries/uptime";

const STATE_COLOR: Record<string, string> = {
  online: "#22d3ee",
  asleep: "#34d399",
  offline: "#f87171",
};

const STATE_LABEL: Record<string, string> = {
  online: "Online",
  asleep: "Asleep",
  offline: "Offline",
};

interface DayRow {
  label: string;
  online?: number;
  asleep?: number;
  offline?: number;
}

export function UptimeChart({ data }: { data: DailyStateBreakdown[] }) {
  const byDay = new Map<string, DayRow>();
  for (const row of data) {
    const key = row.day;
    if (!byDay.has(key)) {
      byDay.set(key, { label: format(new Date(row.day), "MMM d") });
    }
    byDay.get(key)![row.state] = row.hours;
  }
  const chartData = Array.from(byDay.values());

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          width={32}
          label={{ value: "hours", angle: -90, position: "insideLeft", fill: "#8a94a6", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2029",
            border: "1px solid #232a35",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => [
            `${Number(value).toFixed(1)}h`,
            STATE_LABEL[name as string] ?? name,
          ]}
        />
        <Legend
          formatter={(value) => STATE_LABEL[value] ?? value}
          wrapperStyle={{ fontSize: 12 }}
        />
        {(["online", "asleep", "offline"] as const).map((state) => (
          <Bar
            key={state}
            dataKey={state}
            stackId="state"
            fill={STATE_COLOR[state]}
            radius={state === "online" ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
