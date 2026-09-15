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
import type { ChargeCurvePoint } from "@/lib/queries/charging";

export function ChargingCurveChart({ points }: { points: ChargeCurvePoint[] }) {
  const data = points.map((p) => ({
    minute: p.minutesElapsed,
    power: p.chargerPowerKw,
    battery: p.batteryLevel,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a35" vertical={false} />
        <XAxis
          dataKey="minute"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{
            value: "minutes",
            position: "insideBottom",
            offset: -4,
            fill: "#8a94a6",
            fontSize: 11,
          }}
        />
        <YAxis
          yAxisId="power"
          stroke="#8a94a6"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={36}
          label={{
            value: "kW",
            angle: -90,
            position: "insideLeft",
            fill: "#8a94a6",
            fontSize: 11,
          }}
        />
        <YAxis
          yAxisId="battery"
          orientation="right"
          domain={[0, 100]}
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
            name === "power" ? [`${value} kW`, "Charger power"] : [`${value}%`, "Battery"]
          }
          labelFormatter={(minute) => `${minute} min`}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (value === "power" ? "Charger power" : "Battery %")}
        />
        <Line
          yAxisId="power"
          type="monotone"
          dataKey="power"
          name="power"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="battery"
          type="monotone"
          dataKey="battery"
          name="battery"
          stroke="#34d399"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
