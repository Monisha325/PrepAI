"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ScoreTrendChart, type ScoreTrendPoint } from "@/components/dashboard/charts/ScoreTrendChart";
import { DimensionBarChart, type DimensionPoint } from "@/components/dashboard/charts/DimensionBarChart";
import { ActivityBarChart, type ActivityPoint } from "@/components/dashboard/charts/ActivityBarChart";
import { TypeDonutChart, type TypeSlice } from "@/components/dashboard/charts/TypeDonutChart";
import type { StoredEvaluation } from "@/lib/evaluation-store";
import type { StoredSession } from "@/components/practice/SessionHistory";
import type { AIInsight, InsightsResponse } from "@/app/api/analytics-insights/route";

// ─── localStorage helpers ──────────────────────────────────────────────────────

function loadEvaluations(): StoredEvaluation[] {
  try {
    const raw = localStorage.getItem("prepai_evaluations");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem("prepai_sessions");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Date utilities ────────────────────────────────────────────────────────────

function toDateKey(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function computeStreak(activeDateKeys: string[]): number {
  if (!activeDateKeys.length) return 0;
  const keys = new Set(activeDateKeys);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = 0;
  const startDay = keys.has(today) ? today : keys.has(yesterday) ? yesterday : null;
  if (!startDay) return 0;
  const d = new Date(startDay + "T12:00:00Z");
  while (keys.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Data derivation ───────────────────────────────────────────────────────────

type TimeRange = "7d" | "30d" | "all";

interface AnalyticsData {
  totalEvaluations: number;
  totalSessions: number;
  avgScore: number;
  bestScore: number;
  streak: number;
  activeDays: number;
  scoreTrend: ScoreTrendPoint[];
  scoreTrendDirection: "improving" | "declining" | "stable";
  dimensions: DimensionPoint[];
  dimensionMap: Record<string, number>;
  weakestDimension: string;
  strongestDimension: string;
  activityData: ActivityPoint[];
  typeDistribution: TypeSlice[];
  recentEvals: StoredEvaluation[];
  isRealData: boolean;
}

const DIM_META: Record<string, { name: string; color: string }> = {
  technicalAccuracy: { name: "Technical Accuracy", color: "#6366f1" },
  communication:     { name: "Communication",      color: "#3b82f6" },
  relevance:         { name: "Relevance",           color: "#10b981" },
  confidence:        { name: "Confidence",          color: "#f59e0b" },
};

const TYPE_COLORS: Record<string, string> = {
  technical:  "#6366f1",
  coding:     "#8b5cf6",
  behavioral: "#10b981",
  hr:         "#f59e0b",
};

const TYPE_LABELS: Record<string, string> = {
  technical: "Technical", coding: "Coding", behavioral: "Behavioral", hr: "HR",
};

function deriveData(evals: StoredEvaluation[], sessions: StoredSession[], range: TimeRange): AnalyticsData {
  const now = Date.now();
  const cutoff = range === "7d" ? now - 7 * 86400000
              : range === "30d" ? now - 30 * 86400000
              : 0;

  const filtered = evals.filter((e) => new Date(e.answeredAt).getTime() >= cutoff);

  const isRealData = filtered.length > 0;

  // Score stats
  const totalEvaluations = filtered.length;
  const avgScore = totalEvaluations
    ? Math.round(filtered.reduce((s, e) => s + e.overallScore, 0) / totalEvaluations)
    : 0;
  const bestScore = totalEvaluations ? Math.max(...filtered.map((e) => e.overallScore)) : 0;

  // Group by date
  const byDate = filtered.reduce<Record<string, StoredEvaluation[]>>((acc, e) => {
    const key = toDateKey(e.answeredAt);
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  const activeDateKeys = Object.keys(byDate);
  const activeDays = activeDateKeys.length;
  const streak = computeStreak(activeDateKeys);

  // Score trend: one point per active date, sorted
  const scoreTrend: ScoreTrendPoint[] = activeDateKeys
    .sort()
    .map((key) => {
      const dayEvals = byDate[key];
      return {
        date: formatShortDate(key),
        score: Math.round(dayEvals.reduce((s, e) => s + e.overallScore, 0) / dayEvals.length),
        count: dayEvals.length,
      };
    });

  // Score trend direction (compare first half vs second half)
  let scoreTrendDirection: "improving" | "declining" | "stable" = "stable";
  if (scoreTrend.length >= 4) {
    const mid = Math.floor(scoreTrend.length / 2);
    const firstHalf = scoreTrend.slice(0, mid).reduce((s, d) => s + d.score, 0) / mid;
    const secondHalf = scoreTrend.slice(mid).reduce((s, d) => s + d.score, 0) / (scoreTrend.length - mid);
    if (secondHalf - firstHalf > 5) scoreTrendDirection = "improving";
    else if (firstHalf - secondHalf > 5) scoreTrendDirection = "declining";
  }

  // Dimension averages
  const dimKeys = ["technicalAccuracy", "communication", "relevance", "confidence"] as const;
  const dimensionMap: Record<string, number> = {};
  const dimensions: DimensionPoint[] = dimKeys.map((key) => {
    const avg = totalEvaluations
      ? Math.round(filtered.reduce((s, e) => s + (e.dimensions[key]?.score ?? 0), 0) / totalEvaluations)
      : 0;
    dimensionMap[key] = avg;
    return { name: DIM_META[key].name, score: avg, color: DIM_META[key].color };
  });

  let weakestDimension = "technicalAccuracy";
  let strongestDimension = "technicalAccuracy";
  if (totalEvaluations) {
    weakestDimension = dimKeys.reduce((a, b) => dimensionMap[a] <= dimensionMap[b] ? a : b);
    strongestDimension = dimKeys.reduce((a, b) => dimensionMap[a] >= dimensionMap[b] ? a : b);
  }

  // Activity: last 14 days
  const todayKey = new Date().toISOString().slice(0, 10);
  const activityData: ActivityPoint[] = getLast14Days().map((dateKey) => ({
    date: formatShortDate(dateKey),
    count: byDate[dateKey]?.length ?? 0,
    isToday: dateKey === todayKey,
  }));

  // Session type distribution (not filtered by time for sessions)
  const typeCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    s.interviewTypes.forEach((t) => {
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    });
  });
  const typeDistribution: TypeSlice[] = Object.entries(typeCounts).map(([type, value]) => ({
    name: TYPE_LABELS[type] ?? type,
    value,
    color: TYPE_COLORS[type] ?? "#71717a",
  }));

  // Recent evaluations (last 10)
  const recentEvals = [...filtered].sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime()).slice(0, 10);

  return {
    totalEvaluations,
    totalSessions: sessions.length,
    avgScore,
    bestScore,
    streak,
    activeDays,
    scoreTrend,
    scoreTrendDirection,
    dimensions,
    dimensionMap,
    weakestDimension,
    strongestDimension,
    activityData,
    typeDistribution,
    recentEvals,
    isRealData,
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted/60 ${className}`} />;
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-56 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
        <BarChart3 className="h-7 w-7 text-indigo-400" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-base font-bold text-foreground">No analytics yet</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start practicing and evaluating your answers. Your progress will appear here automatically.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <a href="/dashboard/practice" className={buttonVariants({ variant: "default" }) + " bg-indigo-600 hover:bg-indigo-500"}>
          <Sparkles className="mr-1.5 h-4 w-4" />
          Start Practicing
        </a>
        <a href="/dashboard/evaluate" className={buttonVariants({ variant: "outline" })}>
          <Target className="mr-1.5 h-4 w-4" />
          Evaluate Answers
        </a>
      </div>
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 65 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>
      {score}%
    </span>
  );
}

// ─── AI Insights panel ────────────────────────────────────────────────────────

function insightConfig(priority: AIInsight["priority"]) {
  if (priority === "high") return { icon: AlertTriangle, iconCls: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
  if (priority === "medium") return { icon: Lightbulb, iconCls: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  return { icon: CheckCircle2, iconCls: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
}

function InsightsPanel({ data }: { data: AnalyticsData }) {
  const [insights, setInsights] = useState<AIInsight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchInsights = useCallback(async () => {
    const cacheKey = `prepai_insights_${data.avgScore}_${data.totalEvaluations}_${data.weakestDimension}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { setInsights(JSON.parse(cached)); return; }
    } catch {}

    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/analytics-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avgScore: data.avgScore,
          totalEvaluations: data.totalEvaluations,
          activeDays: data.activeDays,
          streak: data.streak,
          dimensions: {
            technicalAccuracy: data.dimensionMap.technicalAccuracy ?? 0,
            communication:     data.dimensionMap.communication ?? 0,
            relevance:         data.dimensionMap.relevance ?? 0,
            confidence:        data.dimensionMap.confidence ?? 0,
          },
          scoreTrend: data.scoreTrendDirection,
          weakestDimension: data.weakestDimension,
          strongestDimension: data.strongestDimension,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const result: InsightsResponse = await res.json();
      setInsights(result.insights);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(result.insights)); } catch {}
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (data.isRealData && data.totalEvaluations >= 2) {
      fetchInsights();
    }
  }, [data.isRealData, data.totalEvaluations, fetchInsights]);

  if (!data.isRealData || data.totalEvaluations < 2) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Coach Insights</h3>
            <p className="text-xs text-muted-foreground">Personalized recommendations based on your data</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-xs font-medium text-indigo-400">
          <Sparkles className="h-3 w-3" />
          AI Insights
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2.5 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          Generating personalized insights…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Could not load AI insights. Check your connection and try again.
          <button onClick={fetchInsights} className="ml-auto text-xs text-indigo-400 hover:underline">Retry</button>
        </div>
      )}

      {insights && (
        <div className="grid gap-0 sm:grid-cols-2">
          {insights.map((insight, i) => {
            const cfg = insightConfig(insight.priority);
            return (
              <div key={i} className={`flex gap-3.5 px-5 py-4 transition-colors hover:bg-muted/30 ${i % 2 === 0 && i < insights.length - 1 ? "sm:border-r sm:border-border" : ""} ${i < insights.length - 2 ? "border-b border-border" : ""}`}>
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <cfg.icon className={`h-3.5 w-3.5 ${cfg.iconCls}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      insight.priority === "high" ? "bg-red-500/10 text-red-400"
                      : insight.priority === "medium" ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                    }`}>{insight.priority}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
                  {insight.action && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-indigo-400">
                      <Zap className="mt-0.5 h-3 w-3 shrink-0" />
                      {insight.action}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Weak topics ──────────────────────────────────────────────────────────────

function WeakTopicsPanel({ dimensions }: { dimensions: DimensionPoint[] }) {
  const weak = dimensions.filter((d) => d.score > 0 && d.score < 65);
  if (!weak.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center gap-2.5 border-b border-amber-500/15 px-5 py-3.5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Weak Areas Detected</h3>
          <p className="text-xs text-muted-foreground">{weak.length} area{weak.length !== 1 ? "s" : ""} scoring below 65% — focus here for the biggest gains</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 p-5">
        {weak.map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded-xl border border-amber-500/15 bg-card px-4 py-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{d.name}</p>
              <p className="text-xs text-amber-400 font-bold">{d.score}% avg</p>
            </div>
            <a href="/dashboard/practice" className="ml-4 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
              Practice <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DbStreak { current: number; longest: number; lastActivity: string | null; }

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState<TimeRange>("30d");
  const [dbStreak, setDbStreak] = useState<DbStreak | null>(null);

  useEffect(() => {
    const evals = loadEvaluations();
    const sessions = loadSessions();
    setData(deriveData(evals, sessions, range));
    setLoading(false);
  }, [range]);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: DbStreak | null) => {
        if (s && typeof s.current === "number") setDbStreak(s);
      })
      .catch(() => {});
  }, []);

  if (loading) return <LoadingState />;

  const d = data!;
  const effectiveStreak = dbStreak?.current ?? d.streak;
  const effectiveData = dbStreak ? { ...d, streak: dbStreak.current } : d;

  const stats = [
    {
      label: "Total Sessions",
      value: d.totalSessions.toString(),
      sub: d.totalEvaluations > 0 ? `${d.totalEvaluations} answers` : "Start practicing",
      icon: BarChart3,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      label: "Avg Score",
      value: d.avgScore > 0 ? `${d.avgScore}%` : "—",
      sub: d.scoreTrendDirection === "improving" ? "↑ Improving" : d.scoreTrendDirection === "declining" ? "↓ Declining" : "Stable",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Best Score",
      value: d.bestScore > 0 ? `${d.bestScore}%` : "—",
      sub: d.totalEvaluations > 0 ? `of ${d.totalEvaluations} answers` : "No data yet",
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Streak",
      value: effectiveStreak > 0 ? `${effectiveStreak}d` : "—",
      sub: dbStreak?.longest ? `Best: ${dbStreak.longest}d` : d.activeDays > 0 ? `${d.activeDays} active day${d.activeDays !== 1 ? "s" : ""}` : "Practice daily",
      icon: Flame,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your progress, spot trends, and identify areas to improve.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {(["7d", "30d", "all"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                range === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All time" : r === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Sample data banner */}
      {!d.isRealData && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-3.5">
          <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-indigo-400">No practice data yet.</span>{" "}
            Charts show sample data.{" "}
            <a href="/dashboard/practice" className="text-indigo-400 underline-offset-2 hover:underline">Start practicing</a>
            {" "}and your real progress will appear here.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl border ${s.border} bg-card p-4 lg:p-5`}>
            <div className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full ${s.bg} blur-2xl opacity-50`} />
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              {!d.isRealData && <Badge variant="outline" className="text-[10px]">Sample</Badge>}
            </div>
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`mt-0.5 text-2xl font-black tracking-tight ${d.isRealData ? s.color : "text-muted-foreground/50"}`}>{s.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Empty state when really no data */}
      {!d.isRealData && d.totalSessions === 0 && (
        <EmptyState />
      )}

      {/* Charts row 1: Score trend + Dimension breakdown */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Score Trend</h3>
              <p className="text-xs text-muted-foreground">Daily average over selected period</p>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              d.scoreTrendDirection === "improving"
                ? "bg-emerald-500/10 text-emerald-400"
                : d.scoreTrendDirection === "declining"
                ? "bg-red-500/10 text-red-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {d.scoreTrendDirection === "improving" ? <TrendingUp className="h-3 w-3" /> : d.scoreTrendDirection === "declining" ? <TrendingDown className="h-3 w-3" /> : null}
              {d.isRealData ? d.scoreTrendDirection.charAt(0).toUpperCase() + d.scoreTrendDirection.slice(1) : "Sample"}
            </div>
          </div>
          <div className="h-[260px] p-4 pb-3">
            <ScoreTrendChart data={d.scoreTrend} avg={d.avgScore || undefined} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Skill Breakdown</h3>
              <p className="text-xs text-muted-foreground">4 evaluation dimensions</p>
            </div>
            {!d.isRealData && <Badge variant="outline" className="text-[10px]">Sample</Badge>}
          </div>
          <div className="h-[260px] px-2 py-4">
            <DimensionBarChart data={d.isRealData ? d.dimensions : []} />
          </div>
        </div>
      </div>

      {/* Weak topics alert */}
      {d.isRealData && <WeakTopicsPanel dimensions={d.dimensions} />}

      {/* Charts row 2: Activity + Type distribution */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Practice Consistency</h3>
              <p className="text-xs text-muted-foreground">Answers per day — last 14 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Today
            </div>
          </div>
          <div className="h-[200px] p-4 pb-3">
            <ActivityBarChart data={d.activityData} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Session Types</h3>
              <p className="text-xs text-muted-foreground">Interview type distribution</p>
            </div>
            {!d.isRealData && <Badge variant="outline" className="text-[10px]">Sample</Badge>}
          </div>
          <div className="h-[200px] px-4 py-3">
            <div className="flex h-full items-center gap-4">
              <div className="h-full flex-1">
                <TypeDonutChart data={d.typeDistribution} />
              </div>
              {/* Legend */}
              <div className="flex shrink-0 flex-col gap-2">
                {(d.typeDistribution.length ? d.typeDistribution : [
                  { name: "Technical", value: 8, color: "#6366f1" },
                  { name: "Coding", value: 5, color: "#8b5cf6" },
                  { name: "Behavioral", value: 4, color: "#10b981" },
                  { name: "HR", value: 2, color: "#f59e0b" },
                ]).map((t) => (
                  <div key={t.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
                    <span className="text-[11px] text-muted-foreground">{t.name}</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: t.color }}>{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <InsightsPanel data={effectiveData} />

      {/* Recent evaluations table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Evaluations</h3>
            <p className="text-xs text-muted-foreground">
              {d.isRealData ? `${d.recentEvals.length} most recent answers` : "Sample history"}
            </p>
          </div>
          {d.isRealData && d.totalEvaluations > 10 && (
            <span className="text-xs text-muted-foreground">Showing 10 of {d.totalEvaluations}</span>
          )}
        </div>

        {d.isRealData && d.recentEvals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No evaluations in this period.</p>
            <a href="/dashboard/evaluate" className={buttonVariants({ size: "sm", variant: "outline" })}>Start Evaluating</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Time</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Overall</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground hidden sm:table-cell">Technical</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground hidden sm:table-cell">Communication</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground hidden md:table-cell">Relevance</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground hidden md:table-cell">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(d.isRealData ? d.recentEvals : SAMPLE_EVALS).map((e, i) => (
                  <tr key={i} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {"answeredAt" in e ? timeAgo(e.answeredAt) : (e as { time: string }).time}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ScoreBadge score={e.overallScore} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground hidden sm:table-cell">
                      {e.dimensions.technicalAccuracy?.score ?? "—"}%
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground hidden sm:table-cell">
                      {e.dimensions.communication?.score ?? "—"}%
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground hidden md:table-cell">
                      {e.dimensions.relevance?.score ?? "—"}%
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground hidden md:table-cell">
                      {e.dimensions.confidence?.score ?? "—"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Sample row data for empty state table
const SAMPLE_EVALS = [
  { time: "2h ago",  overallScore: 83, dimensions: { technicalAccuracy: { score: 85 }, communication: { score: 80 }, relevance: { score: 88 }, confidence: { score: 79 } } },
  { time: "1d ago",  overallScore: 76, dimensions: { technicalAccuracy: { score: 72 }, communication: { score: 78 }, relevance: { score: 81 }, confidence: { score: 73 } } },
  { time: "2d ago",  overallScore: 68, dimensions: { technicalAccuracy: { score: 65 }, communication: { score: 70 }, relevance: { score: 72 }, confidence: { score: 65 } } },
  { time: "3d ago",  overallScore: 91, dimensions: { technicalAccuracy: { score: 93 }, communication: { score: 89 }, relevance: { score: 95 }, confidence: { score: 87 } } },
  { time: "5d ago",  overallScore: 72, dimensions: { technicalAccuracy: { score: 70 }, communication: { score: 74 }, relevance: { score: 75 }, confidence: { score: 69 } } },
] as unknown as StoredEvaluation[];
