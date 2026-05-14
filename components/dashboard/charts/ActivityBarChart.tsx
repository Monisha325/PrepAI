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

export interface ActivityPoint {
  date: string;
  count: number;
  isToday?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  isDark: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
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
        {count} answer{count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

interface Props {
  data: ActivityPoint[];
}

export function ActivityBarChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#71717a" : "#9ca3af";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="22%">
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: tickColor, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={800}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isToday ? "#8b5cf6" : "#8b5cf6"}
              fillOpacity={entry.isToday ? 1 : entry.count === 0 ? 0.12 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
