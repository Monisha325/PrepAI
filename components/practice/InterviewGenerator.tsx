"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Code2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { SessionHistory, saveSession, type StoredSession } from "@/components/practice/SessionHistory";
import {
  getSessionEvaluations,
  getSessionAvgScore,
} from "@/lib/evaluation-store";
import type {
  GenerateRequestBody,
  GenerateResponse,
  GeneratedQuestion,
} from "@/app/api/generate-questions/route";

// ─── Config ───────────────────────────────────────────────────────────────────

const EXPERIENCE_OPTIONS = [
  { value: "Entry Level (0-1 yr)",     label: "Entry Level", sub: "0–1 yr" },
  { value: "Junior (1-3 yrs)",         label: "Junior",      sub: "1–3 yrs" },
  { value: "Mid-Level (3-5 yrs)",      label: "Mid-Level",   sub: "3–5 yrs" },
  { value: "Senior (5-8 yrs)",         label: "Senior",      sub: "5–8 yrs" },
  { value: "Staff/Principal (8+ yrs)", label: "Staff",       sub: "8+ yrs" },
];

const INTERVIEW_TYPES = [
  { id: "technical",  label: "Technical",  icon: Brain,         color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  activeBg: "bg-indigo-600",  activeText: "text-white" },
  { id: "coding",     label: "Coding",     icon: Code2,         color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  activeBg: "bg-violet-600",  activeText: "text-white" },
  { id: "behavioral", label: "Behavioral", icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", activeBg: "bg-emerald-600", activeText: "text-white" },
  { id: "hr",         label: "HR",         icon: Users,         color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   activeBg: "bg-amber-500",   activeText: "text-white" },
];

const COUNT_OPTIONS = [3, 5, 8, 10];
const TYPE_FILTER_LABELS: Record<string, string> = { all: "All", technical: "Technical", coding: "Coding", behavioral: "Behavioral", hr: "HR" };

const ROLE_SUGGESTIONS = [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Scientist", "DevOps Engineer",
  "Product Manager", "Machine Learning Engineer", "iOS Developer", "Android Developer",
];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Next.js", "Node.js", "Python", "Go", "Java",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GraphQL",
  "Vue.js", "Angular", "Spring Boot", "FastAPI", "TensorFlow", "System Design",
];

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-16 animate-pulse rounded-md bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="h-5 w-12 animate-pulse rounded-md bg-muted" style={{ animationDelay: `${i * 80 + 40}ms` }} />
              </div>
              <div className="h-4 w-full animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" style={{ animationDelay: `${i * 80 + 20}ms` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({
  tags, onAdd, onRemove, suggestions, placeholder,
}: {
  tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void;
  suggestions: string[]; placeholder: string;
}) {
  const [val, setVal] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(val.toLowerCase()) && !tags.includes(s));

  function add(tag: string) {
    const t = tag.trim();
    if (t && !tags.includes(t)) onAdd(t);
    setVal(""); setOpen(false); ref.current?.focus();
  }

  return (
    <div className="relative">
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
              {tag}
              <button onClick={() => onRemove(tag)} className="hover:text-indigo-300"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative flex items-center gap-2">
        <Input
          ref={ref} value={val}
          onChange={(e) => { setVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(val); }
            else if (e.key === "Backspace" && !val && tags.length) onRemove(tags[tags.length - 1]);
          }}
          placeholder={tags.length === 0 ? placeholder : "Add more…"}
          className="h-9 flex-1 text-sm"
        />
        {val && (
          <button onMouseDown={(e) => { e.preventDefault(); add(val); }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="p-1.5">
            {filtered.slice(0, 6).map((s) => (
              <button key={s} onMouseDown={(e) => { e.preventDefault(); add(s); }} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session stats panel ──────────────────────────────────────────────────────

function SessionStatsPanel({
  totalQuestions,
  answeredCount,
  avgScore,
}: {
  sessionKey?: string;
  totalQuestions: number;
  answeredCount: number;
  avgScore: number | null;
}) {
  if (answeredCount === 0) return null;

  const pct = Math.round((answeredCount / totalQuestions) * 100);
  const allDone = answeredCount === totalQuestions;

  function scoreColor(s: number) {
    if (s >= 85) return "text-emerald-400";
    if (s >= 70) return "text-blue-400";
    if (s >= 55) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <div className={`overflow-hidden rounded-2xl border bg-card ${allDone ? "border-emerald-500/25" : "border-indigo-500/20"}`}>
      <div className={`px-5 py-4 ${allDone ? "bg-emerald-500/5" : "bg-indigo-500/5"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {allDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Target className="h-5 w-5 text-indigo-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {allDone ? "Session Complete!" : "Session Progress"}
              </p>
              <p className="text-xs text-muted-foreground">
                {answeredCount} of {totalQuestions} questions answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {avgScore !== null && (
              <div className="text-right">
                <p className={`text-2xl font-black tabular-nums ${scoreColor(avgScore)}`}>{avgScore}</p>
                <p className="text-[10px] text-muted-foreground">avg score</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {allDone && (
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Great job! Review your feedback above to improve further.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ViewState = "form" | "generating" | "results";

export function InterviewGenerator() {
  // Form
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("Mid-Level (3-5 yrs)");
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["technical", "behavioral"]);
  const [countPerType, setCountPerType] = useState(5);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const roleRef = useRef<HTMLInputElement>(null);

  // Results
  const [view, setView] = useState<ViewState>("form");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Evaluation tracking
  const [answeredCount, setAnsweredCount] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  const sessionKey = result ? (result.sessionId ?? result.createdAt) : "";

  // Refresh evaluation stats from store
  const refreshStats = useCallback(() => {
    if (!sessionKey) return;
    const evals = getSessionEvaluations(sessionKey);
    setAnsweredCount(evals.length);
    setAvgScore(getSessionAvgScore(sessionKey));
  }, [sessionKey]);

  // Refresh stats when session key changes (new result loaded)
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const filteredRoleSuggestions = ROLE_SUGGESTIONS.filter((r) =>
    r.toLowerCase().includes(role.toLowerCase()),
  );

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((t) => t !== id) : prev) : [...prev, id],
    );
  }

  const filteredQuestions: GeneratedQuestion[] = result
    ? activeFilter === "all"
      ? result.questions
      : result.questions.filter((q) => q.type === activeFilter)
    : [];

  const typeCounts = result
    ? result.interviewTypes.reduce<Record<string, number>>((acc, type) => {
        acc[type] = result.questions.filter((q) => q.type === type).length;
        return acc;
      }, {})
    : {};

  async function generate(isRegenerate = false) {
    if (!role.trim()) { setError("Please enter a job role."); return; }
    setError(null);
    setView("generating");
    if (!isRegenerate) setResult(null);

    const body: GenerateRequestBody = {
      role: role.trim(), experience, skills, interviewTypes: selectedTypes, countPerType,
    };

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setResult(data as GenerateResponse);
      setActiveFilter("all");
      setView("results");
      setAnsweredCount(0);
      setAvgScore(null);
      saveSession(data as GenerateResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setView("form");
    }
  }

  function restoreSession(session: StoredSession) {
    setResult(session as GenerateResponse);
    setRole(session.role);
    setExperience(session.experience);
    setSkills(session.skills);
    setSelectedTypes(session.interviewTypes);
    setActiveFilter("all");
    setView("results");
    // stats will be loaded via the refreshStats effect
  }

  // ── Form / generating ─────────────────────────────────────────────────────

  if (view === "form" || (view === "generating" && !result)) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Practice Questions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about the role and we&apos;ll generate tailored interview questions using AI.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-xs font-medium text-indigo-400">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-3">
            <div className="border-b border-border px-6 py-5">
              <h2 className="text-sm font-semibold text-foreground">Configure Your Session</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Fill in the details to get targeted questions</p>
            </div>

            <div className="space-y-6 p-6">
              {/* Role */}
              <div className="relative space-y-1.5">
                <Label className="text-xs font-semibold">Job Role <span className="text-red-400">*</span></Label>
                <Input
                  ref={roleRef} value={role}
                  onChange={(e) => { setRole(e.target.value); setShowRoleSuggestions(true); }}
                  onFocus={() => setShowRoleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 150)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-10 text-sm"
                />
                {showRoleSuggestions && role && filteredRoleSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <div className="p-1.5">
                      {filteredRoleSuggestions.slice(0, 5).map((r) => (
                        <button key={r} onMouseDown={(e) => { e.preventDefault(); setRole(r); setShowRoleSuggestions(false); }}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted">
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Experience Level</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setExperience(opt.value)}
                      className={`rounded-xl border px-2 py-2 text-center transition-all ${experience === opt.value
                        ? "border-indigo-500/40 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}>
                      <p className="text-[11px] font-bold leading-tight">{opt.label}</p>
                      <p className={`text-[10px] ${experience === opt.value ? "text-indigo-200" : "text-muted-foreground"}`}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Key Skills
                  <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>
                </Label>
                <TagInput tags={skills} onAdd={(t) => setSkills((p) => [...p, t])} onRemove={(t) => setSkills((p) => p.filter((s) => s !== t))}
                  suggestions={SKILL_SUGGESTIONS} placeholder="Type a skill and press Enter" />
              </div>

              {/* Types */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Interview Types</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INTERVIEW_TYPES.map((t) => {
                    const active = selectedTypes.includes(t.id);
                    return (
                      <button key={t.id} onClick={() => toggleType(t.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all ${active
                          ? `${t.activeBg} ${t.activeText} border-transparent shadow-sm`
                          : `border-border bg-card ${t.color} hover:${t.bg}`
                        }`}>
                        <t.icon className="h-4 w-4" />
                        <span className="text-[11px] font-semibold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Questions per Type
                  <span className="ml-1.5 font-normal text-muted-foreground">= {selectedTypes.length * countPerType} total</span>
                </Label>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((c) => (
                    <button key={c} onClick={() => setCountPerType(c)}
                      className={`flex-1 rounded-xl border py-2 text-sm font-bold transition-all ${countPerType === c
                        ? "border-transparent bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={() => generate()}
                disabled={view === "generating" || !role.trim() || selectedTypes.length === 0}
                className="w-full bg-indigo-600 py-5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
              >
                {view === "generating" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating {selectedTypes.length * countPerType} questions…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate {selectedTypes.length * countPerType} Questions
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">How it works</h3>
              </div>
              <div className="space-y-4 p-5">
                {[
                  { step: "1", title: "Set your target role", desc: "Be specific — \"Senior React Engineer\" gets better results than \"Developer\"." },
                  { step: "2", title: "Add your skills", desc: "Questions will focus on your actual tech stack and areas you want to practice." },
                  { step: "3", title: "Answer & get evaluated", desc: "Click Answer on any card to type your response and get AI feedback instantly." },
                  { step: "4", title: "Track your progress", desc: "Scores are saved per session so you can see how you improve over time." },
                ].map((tip) => (
                  <div key={tip.step} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{tip.step}</div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <SessionHistory onRestore={restoreSession} />
          </div>
        </div>
      </div>
    );
  }

  // ── Generating skeleton ───────────────────────────────────────────────────

  if (view === "generating") {
    const total = selectedTypes.length * countPerType;
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
              <p className="text-sm font-semibold text-indigo-400">Generating questions…</p>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{role}</h1>
            <p className="text-sm text-muted-foreground">{experience} · {skills.slice(0, 3).join(", ")}{skills.length > 3 ? ` +${skills.length - 3}` : ""}</p>
          </div>
        </div>
        <LoadingSkeleton count={total} />
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────

  const availableFilters = ["all", ...selectedTypes];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{result!.role}</h1>
            <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs">
              {result!.questions.length} questions
            </Badge>
            {avgScore !== null && (
              <Badge
                variant="outline"
                className={`text-xs font-bold tabular-nums ${
                  avgScore >= 85 ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : avgScore >= 70 ? "border-blue-500/25 bg-blue-500/10 text-blue-400"
                  : avgScore >= 55 ? "border-amber-500/25 bg-amber-500/10 text-amber-400"
                  : "border-red-500/25 bg-red-500/10 text-red-400"
                }`}
              >
                Avg {avgScore}/100
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {result!.experience}
            {result!.skills.length > 0 && ` · ${result!.skills.slice(0, 4).join(", ")}${result!.skills.length > 4 ? ` +${result!.skills.length - 4}` : ""}`}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => { setView("form"); setError(null); }} className="gap-1.5 text-xs">
            New Session
          </Button>
          <Button size="sm" onClick={() => generate(true)} className="gap-1.5 bg-indigo-600 text-xs hover:bg-indigo-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Session stats */}
      <SessionStatsPanel
        sessionKey={sessionKey}
        totalQuestions={result!.questions.length}
        answeredCount={answeredCount}
        avgScore={avgScore}
      />

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {availableFilters.map((f) => {
          const typeConfig = INTERVIEW_TYPES.find((t) => t.id === f);
          const count = f === "all" ? result!.questions.length : (typeCounts[f] ?? 0);
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? typeConfig
                    ? `${typeConfig.activeBg} ${typeConfig.activeText} border-transparent shadow-sm`
                    : "bg-foreground text-background border-transparent"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {typeConfig && <typeConfig.icon className="h-3 w-3" />}
              {TYPE_FILTER_LABELS[f]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20" : "bg-muted"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Question list */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground">
            No questions for this filter.
          </div>
        ) : (
          filteredQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i + 1}
              role={result!.role}
              experience={result!.experience}
              sessionKey={sessionKey}
              onScoreUpdate={refreshStats}
            />
          ))
        )}
      </div>

      <SessionHistory onRestore={restoreSession} />
    </div>
  );
}
