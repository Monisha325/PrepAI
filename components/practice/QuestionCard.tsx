"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Lightbulb,
  MessageSquarePlus,
} from "lucide-react";
import type { GeneratedQuestion } from "@/app/api/generate-questions/route";
import { AnswerEvaluator } from "@/components/practice/AnswerEvaluator";
import { getQuestionEvaluation } from "@/lib/evaluation-store";

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

function scoreBadgeClass(score: number) {
  if (score >= 85) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  if (score >= 70) return "bg-blue-500/15 text-blue-400 border-blue-500/25";
  if (score >= 55) return "bg-amber-500/15 text-amber-400 border-amber-500/25";
  return "bg-red-500/15 text-red-400 border-red-500/25";
}

interface Props {
  question: GeneratedQuestion;
  index: number;
  role: string;
  experience: string;
  sessionKey: string;
  onScoreUpdate?: () => void;
}

export function QuestionCard({ question, index, role, experience, sessionKey, onScoreUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Load stored score on mount
  useEffect(() => {
    const stored = getQuestionEvaluation(sessionKey, question.id);
    if (stored) setScore(stored.overallScore);
  }, [sessionKey, question.id]);

  const handleEvaluated = useCallback(
    (s: number) => {
      setScore(s);
      onScoreUpdate?.();
    },
    [onScoreUpdate],
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(question.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const type = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.technical;
  const diffCls = DIFF_CONFIG[question.difficulty] ?? DIFF_CONFIG.Medium;
  const isAnswered = score !== null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-md ${
        isAnswered ? "border-indigo-500/20" : "border-border"
      }`}
    >
      {/* ── Card header ── */}
      <div
        className={`group flex cursor-pointer items-start gap-3 px-5 py-4 ${
          answering ? "bg-indigo-500/5" : isAnswered ? "bg-indigo-500/3" : ""
        }`}
        onClick={() => {
          if (!answering) setExpanded((v) => !v);
        }}
      >
        {/* Number / check */}
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
            isAnswered
              ? "bg-indigo-600 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isAnswered ? <Check className="h-3.5 w-3.5" /> : index}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${type.bg} ${type.border} ${type.color}`}
            >
              {type.label}
            </span>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${diffCls}`}>
              {question.difficulty}
            </span>
            {isAnswered && (
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tabular-nums ${scoreBadgeClass(score!)}`}
              >
                {score}/100
              </span>
            )}
          </div>
          <p
            className={`text-sm leading-relaxed text-foreground ${
              !expanded && !answering ? "line-clamp-2" : ""
            }`}
          >
            {question.text}
          </p>
        </div>

        {/* Action buttons */}
        <div className="ml-2 flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAnswering((v) => !v);
              if (!answering) setExpanded(false);
            }}
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all ${
              answering
                ? "bg-indigo-600 text-white"
                : isAnswered
                ? "bg-indigo-500/10 text-indigo-400 opacity-100 hover:bg-indigo-500/20"
                : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-indigo-500/10 hover:text-indigo-400"
            }`}
            title={isAnswered ? "Edit answer" : "Answer this question"}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            {answering ? "Answering" : isAnswered ? "Retry" : "Answer"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
            title="Copy question"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {!answering && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>

      {/* ── Hint section ── */}
      {expanded && !answering && (
        <div className={`border-t ${type.border} ${type.bg} px-5 py-4`}>
          <div className="flex items-start gap-2.5">
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${type.bg}`}>
              <Lightbulb className={`h-3 w-3 ${type.color}`} />
            </div>
            <div>
              <p className={`mb-1 text-xs font-semibold ${type.color}`}>Key points to cover</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{question.hint}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline evaluator ── */}
      {answering && (
        <div className="border-t border-indigo-500/20 p-4">
          <AnswerEvaluator
            question={question}
            role={role}
            experience={experience}
            sessionKey={sessionKey}
            onClose={() => setAnswering(false)}
            onEvaluated={handleEvaluated}
          />
        </div>
      )}
    </div>
  );
}
