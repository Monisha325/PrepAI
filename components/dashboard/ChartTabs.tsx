"use client";

import { useState } from "react";
import { PerformanceChart } from "@/components/dashboard/charts/PerformanceChart";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "score", label: "Score %" },
  { key: "questions", label: "Questions" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function ChartTabs() {
  const [active, setActive] = useState<TabKey>("score");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                active === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px]">
        <PerformanceChart mode={active} />
      </div>
    </div>
  );
}
