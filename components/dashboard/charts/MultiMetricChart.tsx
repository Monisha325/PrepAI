"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { week: "W1", score: 45, questions: 8, interviews: 1 },
  { week: "W2", score: 52, questions: 14, interviews: 2 },
  { week: "W3", score: 58, questions: 10, interviews: 1 },
  { week: "W4", score: 61, questions: 18, interviews: 2 },
  { week: "W5", score: 67, questions: 22, interviews: 3 },
  { week: "W6", score: 71, questions: 16, interviews: 2 },
  { week: "W7", score: 74, questions: 24, interviews: 3 },
  { week: "W8", score: 78, questions: 20, interviews: 2 },
  { week: "W9", score: 76, questions: 28, interviews: 3 },
  { week: "W10", score: 81, questions: 24, interviews: 2 },
  { week: "W11", score: 84, questions: 32, interviews: 4 },
  { week: "W12", score: 88, questions: 28, interviews: 3 },
];

type Metric = "score" | "questions" | "interviews";

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const labels: Record<string, string> = {
    score: "Avg Score",
    questions: "Questions",
    interviews: "Interviews",
  };
  const units: Record<string, string> = { score: "%", questions: "", interviews: "" };
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-xl"
      style={{
        background: isDark ? "#1c1c1e" : "#ffffff",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        color: isDark ? "#f4f4f5" : "#18181b",
      }}
    >
      <p className="mb-1.5 font-semibold opacity-60">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="opacity-70">{labels[p.name] ?? p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.value}{units[p.name] ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  metrics?: Metric[];
}

export function MultiMetricChart({ metrics = ["score", "questions"] }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  const metricConfig = {
    score: { color: "#6366f1", gradientId: "score-grad" },
    questions: { color: "#10b981", gradientId: "questions-grad" },
    interviews: { color: "#8b5cf6", gradientId: "interviews-grad" },
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          {metrics.map((m) => (
            <linearGradient key={m} id={metricConfig[m].gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricConfig[m].color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={metricConfig[m].color} stopOpacity={0} />
            </linearGradient>
          ))}
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
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", strokeWidth: 1 }} />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          formatter={(value) => {
            const labels: Record<string, string> = { score: "Avg Score %", questions: "Questions", interviews: "Interviews" };
            return <span style={{ color: tickColor }}>{labels[value] ?? value}</span>;
          }}
        />
        {metrics.map((m) => (
          <Area
            key={m}
            type="monotone"
            dataKey={m}
            stroke={metricConfig[m].color}
            strokeWidth={2}
            fill={`url(#${metricConfig[m].gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: metricConfig[m].color, strokeWidth: 0 }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
