"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface TypeSlice {
  name: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string; payload: TypeSlice }[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, isDark }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, color, value } = payload[0].payload;
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
      <p className="font-bold" style={{ color }}>{value} session{value !== 1 ? "s" : ""}</p>
    </div>
  );
}

interface Props {
  data: TypeSlice[];
}

const SAMPLE: TypeSlice[] = [
  { name: "Technical",  value: 8,  color: "#6366f1" },
  { name: "Coding",     value: 5,  color: "#8b5cf6" },
  { name: "Behavioral", value: 4,  color: "#10b981" },
  { name: "HR",         value: 2,  color: "#f59e0b" },
];

export function TypeDonutChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const chartData = data.length ? data : SAMPLE;
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="72%"
            paddingAngle={3}
            dataKey="value"
            animationDuration={900}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.88} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground">Sessions</span>
      </div>
    </div>
  );
}
