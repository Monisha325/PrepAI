"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvaluateRequestBody, EvaluationResult } from "@/app/api/evaluate-answer/route";
import type { StoredSession } from "@/components/practice/SessionHistory";
import {
  getSessionEvaluations,
  getSessionAvgScore,
  saveEvaluation,
  getQuestionEvaluation,
  type StoredEvaluation,
} from "@/lib/evaluation-store";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const SESSION_KEY = "prepai_sessions";

function loadStoredSessions(): StoredSession[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function gradeInfo(score: number) {
  if (score >= 85) return { label: "Excellent",  textCls: "text-emerald-400", ring: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (score >= 70) return { label: "Good",       textCls: "text-blue-400",   ring: "#3b82f6", bg: "bg-blue-500/10",    border: "border-blue-500/20" };
  if (score >= 55) return { label: "Fair",       textCls: "text-amber-400",  ring: "#f59e0b", bg: "bg-amber-500/10",   border: "border-amber-500/20" };
  return             { label: "Needs Work", textCls: "text-red-400",    ring: "#ef4444", bg: "bg-red-500/10",     border: "border-red-500/20" };
}

function ScoreRing({ score, size = 80, sw = 7, color }: { score: number; size?: number; sw?: number; color: string }) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-muted/20" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  technical:  { label: "Technical",  color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/25" },
  coding:     { label: "Coding",     color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/25" },
  behavioral: { label: "Behavioral", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  hr:         { label: "HR",         color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
};

const DIFF_CONFIG: Record<string, string> = {
  Easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hard:   "text-red-400 bg-red-500/10 border-red-500/20",
};

const DIM_CONFIG: Record<string, { bar: string; text: string }> = {
  technicalAccuracy: { bar: "bg-indigo-500",  text: "text-indigo-400" },
  communication:     { bar: "bg-blue-500",    text: "text-blue-400" },
  relevance:         { bar: "bg-emerald-500", text: "text-emerald-400" },
  confidence:        { bar: "bg-amber-500",   text: "text-amber-400" },
};

// ─── Session picker ───────────────────────────────────────────────────────────

function SessionPicker({
  sessions,
  onSelect,
}: {
  sessions: StoredSession[];
  onSelect: (s: StoredSession) => void;
}) {
  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
          <Target className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Interview Practice Mode</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Answer questions one at a time in a focused interview simulation. Get AI evaluation on each answer.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">No sessions yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate questions in the{" "}
            <a href="/dashboard/practice" className="text-indigo-400 underline-offset-2 hover:underline">
              Practice
            </a>{" "}
            tab first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choose a session to practice
          </p>
          {sessions.map((s) => {
            const key = s.sessionId ?? s.createdAt;
            const evals = getSessionEvaluations(key);
            const avg = getSessionAvgScore(key);
            const g = avg !== null ? gradeInfo(avg) : null;

            return (
              <button
                key={key}
                onClick={() => onSelect(s)}
                className="w-full overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-indigo-500/30 hover:bg-indigo-500/3 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.experience}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.interviewTypes.map((t) => {
                        const cfg = TYPE_CONFIG[t];
                        return (
                          <span key={t} className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg?.bg} ${cfg?.border} ${cfg?.color}`}>
                            {cfg?.label ?? t}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <p className="text-xs text-muted-foreground">{timeAgo(s.createdAt)}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{s.questions.length}q</p>
                    {evals.length > 0 && avg !== null && g && (
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${g.bg} ${g.border} ${g.textCls}`}>
                        {evals.length}/{s.questions.length} · {avg}/100
                      </div>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Interview mode ───────────────────────────────────────────────────────────

function InterviewMode({
  session,
  onBack,
}: {
  session: StoredSession;
  onBack: () => void;
}) {
  const sessionKey = session.sessionId ?? session.createdAt;
  const questions = session.questions;

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"input" | "evaluating" | "result">("input");
  const [evalResult, setEvalResult] = useState<StoredEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const type = TYPE_CONFIG[q?.type ?? "technical"] ?? TYPE_CONFIG.technical;
  const diffCls = DIFF_CONFIG[q?.difficulty ?? "Medium"] ?? DIFF_CONFIG.Medium;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  // Load any stored eval for current question on mount / question change
  useEffect(() => {
    if (!q) return;
    const stored = getQuestionEvaluation(sessionKey, q.id);
    if (stored) {
      setAnswer(stored.answer);
      setEvalResult(stored);
      setState("result");
    } else {
      setAnswer("");
      setEvalResult(null);
      setState("input");
    }
    setError(null);
  }, [idx, q, sessionKey]);

  async function evaluate() {
    if (!answer.trim() || !q) return;
    setError(null);
    setState("evaluating");

    const body: EvaluateRequestBody = {
      question: q.text,
      answer: answer.trim(),
      questionType: q.type,
      difficulty: q.difficulty,
      role: session.role,
      experience: session.experience,
      ...(q.dbId && { dbQuestionId: q.dbId }),
    };

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Evaluation failed");

      saveEvaluation(sessionKey, q.id, answer.trim(), data as EvaluationResult);
      const stored = getQuestionEvaluation(sessionKey, q.id)!;
      setEvalResult(stored);
      setState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("input");
    }
  }

  function next() {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      setDone(true);
    }
  }

  function prev() {
    if (idx > 0) setIdx(idx - 1);
  }

  // ── Session summary ────────────────────────────────────────────────────────
  if (done) {
    const allEvals = getSessionEvaluations(sessionKey);
    const avg = getSessionAvgScore(sessionKey) ?? 0;
    const g = gradeInfo(avg);
    const dimKeys = ["technicalAccuracy", "communication", "relevance", "confidence"] as const;
    const dimAvgs = dimKeys.map((k) => {
      const scores = allEvals.map((e) => {
        if (k === "technicalAccuracy") return e.dimensions.technicalAccuracy.score;
        if (k === "communication") return e.dimensions.communication.score;
        if (k === "relevance") return e.dimensions.relevance.score;
        return e.dimensions.confidence.score;
      });
      const label = allEvals[0]?.dimensions[k]?.label ?? k;
      return { key: k, label, avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0 };
    });

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sessions
        </button>

        <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-card">
          <div className="bg-emerald-500/8 px-6 py-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <h2 className="text-xl font-bold text-foreground">Session Complete!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{session.role} · {allEvals.length}/{questions.length} answered</p>
          </div>

          {/* Overall score */}
          <div className="flex items-center gap-6 px-6 py-6 border-b border-border">
            <div className="relative shrink-0">
              <ScoreRing score={avg} size={100} sw={8} color={g.ring} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${g.textCls}`}>{avg}</span>
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">overall</span>
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold ${g.textCls}`}>{g.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Average score across {allEvals.length} evaluated question{allEvals.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Dimension averages */}
          <div className="space-y-4 px-6 py-5 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Average by Dimension</p>
            {dimAvgs.map(({ key, label, avg: dAvg }) => {
              const cfg = DIM_CONFIG[key] ?? DIM_CONFIG.technicalAccuracy;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className={`font-bold tabular-nums ${cfg.text}`}>{dAvg}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`} style={{ width: `${dAvg}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Per-question breakdown */}
          <div className="px-6 py-5 border-b border-border">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Question Breakdown</p>
            <div className="space-y-2">
              {questions.map((question, i) => {
                const ev = allEvals.find((e) => e.questionId === question.id);
                const qg = ev ? gradeInfo(ev.overallScore) : null;
                return (
                  <div key={question.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <p className="flex-1 min-w-0 truncate text-xs text-foreground">{question.text}</p>
                    {ev && qg ? (
                      <span className={`shrink-0 text-xs font-bold tabular-nums ${qg.textCls}`}>{ev.overallScore}</span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-muted-foreground">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => { setIdx(0); setDone(false); }} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Practice Again
            </Button>
            <Button size="sm" onClick={onBack} className="flex-1 bg-indigo-600 text-xs hover:bg-indigo-500">
              Back to Sessions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question view ─────────────────────────────────────────────────────────
  const g = evalResult ? gradeInfo(evalResult.overallScore) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Top nav */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Sessions
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {idx + 1} / {questions.length}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Session context */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 text-indigo-400" />
        <span className="font-medium text-foreground">{session.role}</span>
        <span>·</span>
        <span>{session.experience}</span>
      </div>

      {/* Question card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Question header */}
        <div className="border-b border-border px-6 py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${type.bg} ${type.border} ${type.color}`}>
              {type.label}
            </span>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${diffCls}`}>
              {q.difficulty}
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground font-medium">Q{idx + 1}</span>
          </div>
          <p className="text-base font-medium leading-relaxed text-foreground">{q.text}</p>
        </div>

        {/* Answer input */}
        {(state === "input" || state === "evaluating") && (
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Your Answer</label>
                <span className={`text-[11px] ${wordCount === 0 ? "text-muted-foreground" : wordCount < 20 ? "text-amber-400" : "text-emerald-400"}`}>
                  {wordCount > 0 && `${wordCount} words`}
                  {wordCount > 0 && wordCount < 20 && " · needs more detail"}
                </span>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={state === "evaluating"}
                placeholder="Speak as you would in a real interview. Be specific — give examples, mention trade-offs, and structure your response."
                rows={8}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Hint */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold text-amber-400">Hint</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{q.hint}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={evaluate}
              disabled={!answer.trim() || state === "evaluating"}
              className="w-full bg-indigo-600 py-5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
            >
              {state === "evaluating" ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Evaluating…</span>
              ) : (
                <span className="flex items-center gap-2"><Send className="h-4 w-4" />Submit & Evaluate</span>
              )}
            </Button>
          </div>
        )}

        {/* Evaluation result */}
        {state === "result" && evalResult && g && (
          <div className="divide-y divide-border">
            {/* Score hero */}
            <div className={`flex items-center gap-5 px-6 py-5 ${g.bg} ${g.border} border-b`}>
              <div className="relative shrink-0">
                <ScoreRing score={evalResult.overallScore} size={88} sw={7} color={g.ring} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black tabular-nums ${g.textCls}`}>{evalResult.overallScore}</span>
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">score</span>
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-base font-bold ${g.textCls}`}>{g.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{evalResult.summary}</p>
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-4 px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Score Breakdown</p>
              {(Object.entries(evalResult.dimensions) as [string, { label: string; score: number; feedback: string }][]).map(([key, dim]) => {
                const cfg = DIM_CONFIG[key] ?? DIM_CONFIG.technicalAccuracy;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{dim.label}</span>
                      <span className={`text-xs font-bold tabular-nums ${cfg.text}`}>{dim.score}<span className="font-normal text-muted-foreground">/100</span></span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                      <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`} style={{ width: `${dim.score}%` }} />
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{dim.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Strengths */}
            {evalResult.strengths.length > 0 && (
              <div className="px-6 py-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-xs font-semibold text-foreground">What you did well</p>
                </div>
                <ul className="space-y-1.5">
                  {evalResult.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {evalResult.improvements.length > 0 && (
              <div className="px-6 py-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                  <p className="text-xs font-semibold text-foreground">How to improve</p>
                </div>
                <ul className="space-y-1.5">
                  {evalResult.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center gap-2 px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => { setState("input"); setEvalResult(null); setAnswer(""); }} className="gap-1 text-xs">
                <Zap className="h-3 w-3" /> Retry
              </Button>
              <div className="flex-1" />
              {idx > 0 && (
                <Button variant="outline" size="sm" onClick={prev} className="gap-1 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> Prev
                </Button>
              )}
              <Button size="sm" onClick={next} className="gap-1 bg-indigo-600 text-xs hover:bg-indigo-500">
                {idx < questions.length - 1 ? (
                  <><span>Next</span><ArrowRight className="h-3.5 w-3.5" /></>
                ) : (
                  <><span>Finish</span><CheckCircle2 className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EvaluateHub root ─────────────────────────────────────────────────────────

function mergeWithDb(setter: React.Dispatch<React.SetStateAction<StoredSession[]>>) {
  fetch("/api/interview-sessions")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { sessions?: StoredSession[] } | null) => {
      if (!data?.sessions?.length) return;
      setter((prev) => {
        const localKeys = new Set(prev.map((s) => s.sessionId).filter(Boolean));
        const dbOnly = data.sessions!.filter((s) => s.sessionId && !localKeys.has(s.sessionId));
        if (!dbOnly.length) return prev;
        return [...prev, ...dbOnly].slice(0, 20);
      });
    })
    .catch(() => {});
}

export function EvaluateHub() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [selected, setSelected] = useState<StoredSession | null>(null);

  useEffect(() => {
    setSessions(loadStoredSessions());
    mergeWithDb(setSessions);
  }, []);

  if (selected) {
    return (
      <InterviewMode
        session={selected}
        onBack={() => {
          setSelected(null);
          setSessions(loadStoredSessions());
          mergeWithDb(setSessions);
        }}
      />
    );
  }

  return <SessionPicker sessions={sessions} onSelect={setSelected} />;
}
