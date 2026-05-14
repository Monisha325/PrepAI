"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  { skill: "Algorithms", score: 78 },
  { skill: "System Design", score: 54 },
  { skill: "Behavioral", score: 71 },
  { skill: "Communication", score: 67 },
  { skill: "Tech Knowledge", score: 84 },
  { skill: "Coding Speed", score: 62 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { skill: string } }[];
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
      <p className="mb-0.5 font-medium opacity-60">{payload[0].payload.skill}</p>
      <p className="font-semibold text-violet-400">{payload[0].value}%</p>
    </div>
  );
}

export function SkillRadar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <defs>
          <linearGradient id="radar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <PolarGrid stroke={gridColor} />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: tickColor, fontSize: 10.5, fontWeight: 500 }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        <Radar
          name="Skills"
          dataKey="score"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#radar-gradient)"
          dot={{ fill: "#8b5cf6", strokeWidth: 0, r: 3 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
