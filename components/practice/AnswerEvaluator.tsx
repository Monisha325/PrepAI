"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvaluateRequestBody, EvaluationResult } from "@/app/api/evaluate-answer/route";
import type { GeneratedQuestion } from "@/app/api/generate-questions/route";
import {
  getQuestionEvaluation,
  saveEvaluation,
  type StoredEvaluation,
} from "@/lib/evaluation-store";

// ─── Score ring ──────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  size = 96,
  strokeWidth = 7,
  color,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ─── Grade helper ─────────────────────────────────────────────────────────────

function grade(score: number) {
  if (score >= 85) return { label: "Excellent",   textCls: "text-emerald-400", ring: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (score >= 70) return { label: "Good",        textCls: "text-blue-400",   ring: "#3b82f6", bg: "bg-blue-500/10",    border: "border-blue-500/20" };
  if (score >= 55) return { label: "Fair",        textCls: "text-amber-400",  ring: "#f59e0b", bg: "bg-amber-500/10",   border: "border-amber-500/20" };
  return              { label: "Needs Work",  textCls: "text-red-400",    ring: "#ef4444", bg: "bg-red-500/10",     border: "border-red-500/20" };
}

// ─── Dimension config ─────────────────────────────────────────────────────────

const DIM_CONFIG: Record<string, { bar: string; text: string; icon: string }> = {
  technicalAccuracy: { bar: "bg-indigo-500",  text: "text-indigo-400",  icon: "⚙" },
  communication:     { bar: "bg-blue-500",    text: "text-blue-400",    icon: "💬" },
  relevance:         { bar: "bg-emerald-500", text: "text-emerald-400", icon: "🎯" },
  confidence:        { bar: "bg-amber-500",   text: "text-amber-400",   icon: "⚡" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DimensionRow({
  dimKey,
  label,
  score,
  feedback,
}: {
  dimKey: string;
  label: string;
  score: number;
  feedback: string;
}) {
  const cfg = DIM_CONFIG[dimKey] ?? DIM_CONFIG.technicalAccuracy;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className={`shrink-0 text-xs font-bold tabular-nums ${cfg.text}`}>{score}<span className="font-normal text-muted-foreground">/100</span></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full ${cfg.bar} transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{feedback}</p>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  question: GeneratedQuestion;
  role: string;
  experience: string;
  sessionKey: string;
  onClose: () => void;
  onEvaluated?: (score: number) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnswerEvaluator({ question, role, experience, sessionKey, onClose, onEvaluated }: Props) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"input" | "evaluating" | "result">("input");
  const [result, setResult] = useState<StoredEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load previously stored evaluation on mount
  useEffect(() => {
    const stored = getQuestionEvaluation(sessionKey, question.id);
    if (stored) {
      setAnswer(stored.answer);
      setResult(stored);
      setState("result");
    }
  }, [sessionKey, question.id]);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  async function evaluate() {
    if (!answer.trim()) return;
    setError(null);
    setState("evaluating");

    const body: EvaluateRequestBody = {
      question: question.text,
      answer: answer.trim(),
      questionType: question.type,
      difficulty: question.difficulty,
      role,
      experience,
      ...(question.dbId && { dbQuestionId: question.dbId }),
    };

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Evaluation failed");

      const evalResult = data as EvaluationResult;
      saveEvaluation(sessionKey, question.id, answer.trim(), evalResult);
      const stored = getQuestionEvaluation(sessionKey, question.id)!;
      setResult(stored);
      setState("result");
      onEvaluated?.(evalResult.overallScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("input");
    }
  }

  function retry() {
    setState("input");
    setResult(null);
    setError(null);
    setAnswer("");
  }

  const g = result ? grade(result.overallScore) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-card shadow-lg">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-indigo-500/8 to-transparent px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Evaluation</p>
            <p className="text-[11px] capitalize text-muted-foreground">
              {question.type} · {question.difficulty}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Question ── */}
      <div className="border-b border-border bg-muted/20 px-5 py-3.5">
        <p className="text-sm leading-relaxed text-foreground">{question.text}</p>
      </div>

      {/* ── Answer input ── */}
      {(state === "input" || state === "evaluating") && (
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Your Answer</label>
              <span
                className={`text-[11px] transition-colors ${
                  wordCount === 0
                    ? "text-muted-foreground"
                    : wordCount < 20
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {wordCount > 0 && `${wordCount} words`}
                {wordCount > 0 && wordCount < 20 && " · add more detail"}
              </span>
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={state === "evaluating"}
              placeholder="Answer as you would in a real interview. Be specific, use examples, and structure your response clearly."
              rows={7}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={evaluate}
            disabled={!answer.trim() || state === "evaluating"}
            className="w-full bg-indigo-600 py-5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
          >
            {state === "evaluating" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating your answer…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Evaluate My Answer
              </span>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            AI evaluation · Instant feedback
          </p>
        </div>
      )}

      {/* ── Results ── */}
      {state === "result" && result && g && (
        <div className="divide-y divide-border">
          {/* Overall score hero */}
          <div className={`flex items-center gap-5 px-5 py-5 ${g.bg} ${g.border} border-b`}>
            <div className="relative shrink-0">
              <ScoreRing score={result.overallScore} size={92} strokeWidth={7} color={g.ring} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black tabular-nums ${g.textCls}`}>{result.overallScore}</span>
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">score</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold ${g.textCls}`}>{g.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.summary}</p>
            </div>
          </div>

          {/* 4-dimension breakdown */}
          <div className="space-y-4 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Score Breakdown</p>
            {(Object.entries(result.dimensions) as [string, { label: string; score: number; feedback: string }][]).map(
              ([key, dim]) => (
                <DimensionRow key={key} dimKey={key} label={dim.label} score={dim.score} feedback={dim.feedback} />
              )
            )}
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="px-5 py-4">
              <div className="mb-2.5 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-xs font-semibold text-foreground">What you did well</p>
              </div>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div className="px-5 py-4">
              <div className="mb-2.5 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                <p className="text-xs font-semibold text-foreground">How to improve</p>
              </div>
              <ul className="space-y-1.5">
                {result.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interviewer hint */}
          <div className="bg-amber-500/5 px-5 py-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <div>
                <p className="mb-1 text-[11px] font-semibold text-amber-400">What interviewers expect</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{question.hint}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-5 py-4">
            <Button variant="outline" size="sm" onClick={retry} className="gap-1.5 text-xs">
              <Zap className="h-3 w-3" />
              Retry
            </Button>
            <Button size="sm" onClick={onClose} className="flex-1 bg-indigo-600 text-xs hover:bg-indigo-500">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
