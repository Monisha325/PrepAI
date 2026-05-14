"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { session: "#1", score: 58, type: "Technical" },
  { session: "#2", score: 64, type: "Behavioral" },
  { session: "#3", score: 61, type: "System Design" },
  { session: "#4", score: 68, type: "Technical" },
  { session: "#5", score: 71, type: "Mixed" },
  { session: "#6", score: 76, type: "Behavioral" },
  { session: "#7", score: 74, type: "Technical" },
  { session: "#8", score: 82, type: "System Design" },
  { session: "#9", score: 85, type: "Mixed" },
  { session: "#10", score: 88, type: "Behavioral" },
];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { type: string } }[];
  label?: string;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: TooltipProps) {
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
      <p className="mb-0.5 font-medium opacity-60">
        {label} · {payload[0].payload.type}
      </p>
      <p className="font-bold text-indigo-400">{payload[0].value}%</p>
    </div>
  );
}

export function InterviewScoreChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";
  const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="session"
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[40, 100]}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", strokeWidth: 1 }} />
        <ReferenceLine
          y={avg}
          stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
          strokeDasharray="4 4"
          label={{ value: `Avg ${avg}%`, position: "right", fill: tickColor, fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }}
          activeDot={{ fill: "#6366f1", strokeWidth: 0, r: 6, filter: "url(#glow)" }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
