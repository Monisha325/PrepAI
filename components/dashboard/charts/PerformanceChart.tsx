"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { week: "Wk 1", score: 42, questions: 6 },
  { week: "Wk 2", score: 58, questions: 12 },
  { week: "Wk 3", score: 53, questions: 9 },
  { week: "Wk 4", score: 67, questions: 15 },
  { week: "Wk 5", score: 74, questions: 22 },
  { week: "Wk 6", score: 81, questions: 18 },
  { week: "Wk 7", score: 88, questions: 26 },
];

type Mode = "score" | "questions";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  mode: Mode;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, mode, isDark }: CustomTooltipProps) {
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
      <p className="mb-1 font-medium opacity-60">{label}</p>
      <p className="font-semibold text-indigo-400">
        {mode === "score" ? `${payload[0].value}%` : `${payload[0].value} questions`}
      </p>
    </div>
  );
}

interface PerformanceChartProps {
  mode?: Mode;
}

export function PerformanceChart({ mode = "score" }: PerformanceChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";
  const gradientId = `perf-gradient-${mode}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={mode === "score" ? [0, 100] : ["auto", "auto"]}
          tickFormatter={(v) => (mode === "score" ? `${v}` : `${v}`)}
        />
        <Tooltip
          content={<CustomTooltip mode={mode} isDark={isDark} />}
          cursor={{ stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey={mode}
          stroke="#6366f1"
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ fill: "#6366f1", strokeWidth: 0, r: 3 }}
          activeDot={{ fill: "#6366f1", strokeWidth: 0, r: 5 }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
