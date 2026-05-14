"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DimensionPoint {
  name: string;
  score: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: DimensionPoint }[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, isDark }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, color } = payload[0].payload;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-xl"
      style={{
        background: isDark ? "#1c1c1e" : "#ffffff",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        color: isDark ? "#f4f4f5" : "#18181b",
      }}
    >
      <p className="mb-0.5 font-medium opacity-60">{name}</p>
      <p className="font-bold" style={{ color }}>{payload[0].value}%</p>
    </div>
  );
}

interface Props {
  data: DimensionPoint[];
}

const SAMPLE: DimensionPoint[] = [
  { name: "Technical", score: 68, color: "#6366f1" },
  { name: "Communication", score: 74, color: "#3b82f6" },
  { name: "Relevance", score: 81, color: "#10b981" },
  { name: "Confidence", score: 62, color: "#f59e0b" },
];

export function DimensionBarChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const chartData = data.length ? data : SAMPLE;
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={({ x, y, payload }) => (
            <text x={x} y={y} dy={4} textAnchor="end" fill={tickColor} fontSize={11}>
              {payload.value}
            </text>
          )}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: "transparent" }} />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} animationDuration={900} animationEasing="ease-out">
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
