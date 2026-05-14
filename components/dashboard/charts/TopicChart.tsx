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

const data = [
  { name: "Arrays", pct: 88 },
  { name: "Trees/Graphs", pct: 65 },
  { name: "Dyn. Prog.", pct: 47 },
  { name: "Sys. Design", pct: 72 },
  { name: "SQL/DBs", pct: 81 },
  { name: "OS Concepts", pct: 54 },
];

const barColors = ["#6366f1", "#7c3aed", "#8b5cf6", "#6366f1", "#818cf8", "#a78bfa"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { name: string } }[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, isDark }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-xl"
      style={{
        background: isDark ? "#1c1c1e" : "#ffffff",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        color: isDark ? "#f4f4f5" : "#18181b",
      }}
    >
      <p className="mb-0.5 font-medium opacity-60">{payload[0].payload.name}</p>
      <p className="font-semibold text-indigo-400">{payload[0].value}%</p>
    </div>
  );
}

export function TopicChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
        barCategoryGap="30%"
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
            <text
              x={x}
              y={y}
              dy={4}
              textAnchor="end"
              fill={tickColor}
              fontSize={11}
            >
              {payload.value}
            </text>
          )}
          axisLine={false}
          tickLine={false}
          width={88}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: "transparent" }} />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} animationDuration={900} animationEasing="ease-out">
          {data.map((_, i) => (
            <Cell key={i} fill={barColors[i % barColors.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
