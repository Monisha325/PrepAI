"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const difficulties = ["Easy", "Medium", "Hard", "Mixed"];
const counts = [5, 10, 15, 20];

export function PracticeGenerator() {
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  function handleGenerate() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div className="space-y-5">
      {/* Topic */}
      <div className="space-y-1.5">
        <Label className="text-xs">Topic</Label>
        <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">All Topics</option>
          <option>Algorithms</option>
          <option>Data Structures</option>
          <option>System Design</option>
          <option>Trees &amp; Graphs</option>
          <option>SQL &amp; Databases</option>
          <option>JavaScript</option>
          <option>Behavioral</option>
          <option>Networking &amp; OS</option>
        </select>
      </div>

      {/* Difficulty */}
      <div className="space-y-1.5">
        <Label className="text-xs">Difficulty</Label>
        <div className="flex gap-1.5">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                difficulty === d
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Company focus */}
      <div className="space-y-1.5">
        <Label className="text-xs">Company Focus</Label>
        <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Any Company</option>
          <option>Google</option>
          <option>Meta</option>
          <option>Amazon</option>
          <option>Apple</option>
          <option>Netflix</option>
          <option>Microsoft</option>
          <option>Startups</option>
        </select>
      </div>

      {/* Question count */}
      <div className="space-y-1.5">
        <Label className="text-xs">Number of Questions</Label>
        <div className="flex gap-1.5">
          {counts.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                count === c
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-indigo-600 font-semibold hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Generate {count} Questions
          </span>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        AI-generated · Tailored to your profile
      </p>
    </div>
  );
}
