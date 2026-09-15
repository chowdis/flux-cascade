"use client";

import {
  Bar,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { format } from "date-fns";
import type { MonthlyChargingSummary } from "@/lib/queries/charging";

export function ChargingCostChart({
  data,
}: {
  data: MonthlyChargingSummary[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.month), "MMM yy"),
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
          yAxisId="energy"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <YAxis
          yAxisId="cost"
          orientation="right"
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
          formatter={(value, name) =>
            name === "cost"
              ? [`$${Number(value).toFixed(2)}`, "Cost"]
              : [`${Number(value).toFixed(1)} kWh`, "Energy added"]
          }
        />
        <Bar
          yAxisId="energy"
          dataKey="energyKwh"
          name="energyKwh"
          fill="#22d3ee"
          radius={[4, 4, 0, 0]}
          barSize={18}
        />
        <Line
          yAxisId="cost"
          dataKey="cost"
          name="cost"
          stroke="#34d399"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
