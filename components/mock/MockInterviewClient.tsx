"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { GeneratedQuestion } from "@/app/api/generate-questions/route";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuestionResult {
  questionText: string;
  answer: string;
  score: number;
  summary: string;
}

interface MockSessionRecord {
  id: string;
  type: string;
  role: string;
  avgScore: number;
  questionCount: number;
  completedAt: string;
}

type Stage = "select" | "generating" | "interview" | "evaluating" | "done";

// ── Storage ───────────────────────────────────────────────────────────────────

const MOCK_KEY = "prepai_mock_sessions";
const TIMER_SECONDS = 180;

function saveMockSession(s: MockSessionRecord) {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    const existing: MockSessionRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(MOCK_KEY, JSON.stringify([s, ...existing].slice(0, 10)));
  } catch {}
}

function loadMockSessions(): MockSessionRecord[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function deleteMockSession(id: string, current: MockSessionRecord[]): MockSessionRecord[] {
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXPERIENCE_OPTIONS = [
  "Entry Level (0-1 yr)",
  "Junior (1-3 yrs)",
  "Mid-Level (3-5 yrs)",
  "Senior (5-8 yrs)",
  "Staff/Principal (8+ yrs)",
];

function formatTimer(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_OPTS = [
  {
    id: "technical",
    label: "Technical",
    description: "DSA, problem-solving, and CS fundamentals.",
    icon: Brain,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    activeBorder: "border-indigo-500",
    activeRing: "ring-indigo-500/30",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    description: "STAR-method questions on leadership and teamwork.",
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    activeBorder: "border-emerald-500",
    activeRing: "ring-emerald-500/30",
  },
];

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : score >= 65
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>
      {score}%
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MockInterviewClient() {
  const [stage, setStage] = useState<Stage>("select");
  const [interviewType, setInterviewType] = useState("technical");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("Mid-Level (3-5 yrs)");
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timerSec, setTimerSec] = useState(TIMER_SECONDS);
  const [timeUp, setTimeUp] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);

  const [sessions, setSessions] = useState<MockSessionRecord[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  // Keep mutable refs so the timer callback can read current values
  const stageRef = useRef(stage);
  const answersRef = useRef(results);
  const answerRef = useRef(answer);
  const indexRef = useRef(currentIndex);
  const questionsRef = useRef(questions);

  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { answersRef.current = results; }, [results]);
  useEffect(() => { answerRef.current = answer; }, [answer]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  useEffect(() => {
    setSessions(loadMockSessions());
    setSessionsLoaded(true);
  }, []);

  // Timer — resets per question
  useEffect(() => {
    if (stage !== "interview") return;
    setTimerSec(TIMER_SECONDS);
    setTimeUp(false);

    const interval = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, currentIndex]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function startInterview() {
    if (!role.trim()) {
      setError("Please enter the role you are interviewing for.");
      return;
    }
    setError("");
    setStage("generating");

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.trim(),
          experience,
          skills: [],
          interviewTypes: [interviewType],
          countPerType: 5,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const qs: GeneratedQuestion[] = data.questions ?? [];
      if (!qs.length) throw new Error();

      setQuestions(qs);
      setCurrentIndex(0);
      setAnswer("");
      setResults([]);
      setStage("interview");
    } catch {
      setError("Failed to generate questions. Check your connection and try again.");
      setStage("select");
    }
  }

  async function submitAnswer() {
    if (stage !== "interview") return;
    const q = questions[currentIndex];
    const submitted = answer.trim() || "(no answer provided)";

    setStage("evaluating");

    let result: QuestionResult = {
      questionText: q.text,
      answer: submitted,
      score: 0,
      summary: "Evaluation unavailable.",
    };

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text,
          answer: submitted,
          questionType: q.type,
          difficulty: q.difficulty,
          role,
          experience,
        }),
      });
      if (res.ok) {
        const ev = await res.json();
        result = {
          questionText: q.text,
          answer: submitted,
          score: ev.overallScore ?? 0,
          summary: ev.summary ?? "",
        };
      }
    } catch {}

    const newResults = [...results, result];
    setResults(newResults);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer("");
      setStage("interview");
    } else {
      const avgScore = Math.round(
        newResults.reduce((s, r) => s + r.score, 0) / newResults.length
      );
      const record: MockSessionRecord = {
        id: Date.now().toString(),
        type: interviewType,
        role,
        avgScore,
        questionCount: questions.length,
        completedAt: new Date().toISOString(),
      };
      saveMockSession(record);
      setSessions((prev) => [record, ...prev].slice(0, 10));
      setStage("done");
    }
  }

  function resetInterview() {
    setStage("select");
    setAnswer("");
    setResults([]);
    setCurrentIndex(0);
    setError("");
    setTimeUp(false);
  }

  // ── Renders ────────────────────────────────────────────────────────────────

  const timerColor =
    timerSec > 60 ? "text-emerald-400" : timerSec > 30 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6">
      {/* ── Select stage ── */}
      {stage === "select" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">Configure Interview</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            5 AI-generated questions, 3 minutes each, with instant scoring.
          </p>

          <div className="space-y-5">
            {/* Type selection */}
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Interview Type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {TYPE_OPTS.map((t) => {
                  const active = interviewType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setInterviewType(t.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        active
                          ? `${t.activeBorder} ${t.bg} ring-2 ${t.activeRing}`
                          : `${t.border} hover:bg-muted`
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.bg}`}>
                        <t.icon className={`h-4 w-4 ${t.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Target Role <span className="text-red-400">*</span>
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startInterview()}
                placeholder="e.g. Senior Software Engineer"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:bg-muted/30"
              >
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              onClick={startInterview}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Start Interview
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Generating stage ── */}
      {stage === "generating" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Generating your questions…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tailoring 5 {interviewType} questions for {role}
            </p>
          </div>
        </div>
      )}

      {/* ── Interview stage ── */}
      {stage === "interview" && questions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          {/* Progress + timer */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < currentIndex
                      ? "bg-indigo-500"
                      : i === currentIndex
                      ? "bg-indigo-400"
                      : "bg-muted"
                  }`}
                  style={{ width: 32 }}
                />
              ))}
              <span className="shrink-0 text-xs text-muted-foreground">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${timerColor}`}>
              <Clock className="h-4 w-4" />
              {formatTimer(timerSec)}
            </div>
          </div>

          {timeUp && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400">
              Time&apos;s up — submit your current answer to continue.
            </div>
          )}

          {/* Question */}
          <div className="mb-4 rounded-xl bg-muted/60 p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Question {currentIndex + 1}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{questions[currentIndex].text}</p>
          </div>

          {/* Answer */}
          <div className="mb-4 space-y-1.5">
            <label className="text-xs font-medium text-foreground">Your Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={6}
              className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          <button
            onClick={submitAnswer}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            {currentIndex < questions.length - 1 ? "Submit & Next Question" : "Submit & Finish"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Evaluating stage ── */}
      {stage === "evaluating" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Evaluating your answer…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Question {results.length + 1} of {questions.length}
            </p>
          </div>
        </div>
      )}

      {/* ── Done stage ── */}
      {stage === "done" && results.length > 0 && (
        <div className="space-y-4">
          {/* Overall result */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Interview Complete</p>
                <p className="text-sm text-muted-foreground">
                  {role} · {interviewType}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-3xl font-black text-foreground">
                  {Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)}
                  <span className="text-lg text-muted-foreground">%</span>
                </p>
                <p className="text-xs text-muted-foreground">Overall Score</p>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Q{i + 1}: {r.questionText.slice(0, 80)}{r.questionText.length > 80 ? "…" : ""}
                    </p>
                    <ScoreBadge score={r.score} />
                  </div>
                  {r.summary && (
                    <p className="text-xs leading-relaxed text-muted-foreground">{r.summary}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={resetInterview}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                New Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session History ── */}
      {sessionsLoaded && sessions.length > 0 && (stage === "select" || stage === "done") && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Past Sessions</h3>
              <p className="text-xs text-muted-foreground">Saved on this device</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {sessions.map((s) => {
              const cls =
                s.avgScore >= 80
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : s.avgScore >= 65
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  : "text-red-400 bg-red-500/10 border-red-500/20";
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{s.role}</p>
                    <p className="text-xs text-muted-foreground capitalize">{s.type} · {s.questionCount}q</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>
                      {s.avgScore}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(s.completedAt)}</span>
                    <button
                      onClick={() => setSessions(deleteMockSession(s.id, sessions))}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Delete session"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
