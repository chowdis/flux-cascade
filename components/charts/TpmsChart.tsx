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
import type { TpmsPoint } from "@/lib/queries/tpms";

const COLORS = { fl: "#22d3ee", fr: "#34d399", rl: "#fbbf24", rr: "#f87171" };
const LABELS = {
  fl: "Front left",
  fr: "Front right",
  rl: "Rear left",
  rr: "Rear right",
};

export function TpmsChart({ data }: { data: TpmsPoint[] }) {
  const chartData = data.map((d) => ({
    label: format(new Date(d.day), "MMM d"),
    fl: d.fl !== null ? Number(d.fl.toFixed(2)) : null,
    fr: d.fr !== null ? Number(d.fr.toFixed(2)) : null,
    rl: d.rl !== null ? Number(d.rl.toFixed(2)) : null,
    rr: d.rr !== null ? Number(d.rr.toFixed(2)) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
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
          domain={["auto", "auto"]}
          label={{
            value: "bar",
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
            `${value} bar`,
            LABELS[name as keyof typeof LABELS],
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => LABELS[value as keyof typeof LABELS]}
        />
        {(["fl", "fr", "rl", "rr"] as const).map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={COLORS[key]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
