"use client";

import { useState } from "react";
import { MultiMetricChart } from "@/components/dashboard/charts/MultiMetricChart";

type Metric = "score" | "questions" | "interviews";

const options: { value: Metric[]; label: string }[] = [
  { value: ["score", "questions"], label: "Score & Questions" },
  { value: ["score", "interviews"], label: "Score & Interviews" },
  { value: ["score", "questions", "interviews"], label: "All Metrics" },
];

export function AnalyticsTabs() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selected === i
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="h-[240px]">
        <MultiMetricChart metrics={options[selected].value} />
      </div>
    </div>
  );
}
