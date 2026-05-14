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
  ReferenceLine,
} from "recharts";

export interface ScoreTrendPoint {
  date: string;
  score: number;
  count: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: ScoreTrendPoint }[];
  label?: string;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { count } = payload[0].payload;
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-xl"
      style={{
        background: isDark ? "#1c1c1e" : "#ffffff",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        color: isDark ? "#f4f4f5" : "#18181b",
      }}
    >
      <p className="mb-1 font-semibold opacity-60">{label}</p>
      <p className="font-bold text-indigo-400">{payload[0].value}%</p>
      <p className="mt-0.5 opacity-50">{count} answer{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

interface Props {
  data: ScoreTrendPoint[];
  avg?: number;
}

const SAMPLE: ScoreTrendPoint[] = [
  { date: "W1", score: 45, count: 2 },
  { date: "W2", score: 52, count: 3 },
  { date: "W3", score: 58, count: 2 },
  { date: "W4", score: 61, count: 4 },
  { date: "W5", score: 67, count: 3 },
  { date: "W6", score: 74, count: 5 },
  { date: "W7", score: 78, count: 4 },
  { date: "W8", score: 84, count: 6 },
];

export function ScoreTrendChart({ data, avg }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const chartData = data.length >= 2 ? data : SAMPLE;
  const avgLine = avg ?? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length);
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="score-trend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          content={<CustomTooltip isDark={isDark} />}
          cursor={{ stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", strokeWidth: 1 }}
        />
        <ReferenceLine
          y={avgLine}
          stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
          strokeDasharray="4 4"
          label={{ value: `Avg ${avgLine}%`, position: "insideTopRight", fill: tickColor, fontSize: 10 }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#score-trend-grad)"
          dot={{ fill: "#6366f1", strokeWidth: 0, r: 3.5 }}
          activeDot={{ fill: "#6366f1", strokeWidth: 0, r: 5 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
