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
  { day: "Mon", sessions: 2, score: 74 },
  { day: "Tue", sessions: 1, score: 82 },
  { day: "Wed", sessions: 3, score: 71 },
  { day: "Thu", sessions: 0, score: 0 },
  { day: "Fri", sessions: 2, score: 78 },
  { day: "Sat", sessions: 1, score: 88 },
  { day: "Sun", sessions: 0, score: 0 },
];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { score: number } }[];
  label?: string;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const sessions = payload[0].value;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-xl"
      style={{
        background: isDark ? "#1c1c1e" : "#ffffff",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        color: isDark ? "#f4f4f5" : "#18181b",
      }}
    >
      <p className="mb-0.5 font-medium opacity-60">{label}</p>
      <p className="font-bold text-violet-400">
        {sessions} session{sessions !== 1 ? "s" : ""}
      </p>
      {sessions > 0 && (
        <p className="text-muted-foreground">Avg score: {payload[0].payload.score}%</p>
      )}
    </div>
  );
}

const today = new Date().getDay(); // 0 = Sun, 1 = Mon ...
const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayLabel = dayMap[today];

export function WeeklyActivityChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="sessions" radius={[4, 4, 0, 0]} animationDuration={800}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.day === todayLabel ? "#8b5cf6" : "#8b5cf630"}
              fillOpacity={entry.sessions === 0 ? 0.3 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
