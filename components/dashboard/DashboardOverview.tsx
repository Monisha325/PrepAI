"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Flame,
  LayoutDashboard,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Video,
} from "lucide-react";

// ── Storage keys ──────────────────────────────────────────────────────────────

const EVALS_KEY   = "prepai_evaluations";
const MOCK_KEY    = "prepai_mock_sessions";
const JOBS_KEY    = "prepai_jobs";
const SCANS_KEY   = "prepai_resume_scans";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Eval        { overallScore: number; answeredAt: string; answer: string; summary: string; }
interface MockSession { id: string; type: string; role: string; avgScore: number; questionCount: number; completedAt: string; }
type JobStatus = "Wishlist" | "Applied" | "Interview" | "Offer" | "Rejected";
interface Job         { id: string; company: string; role: string; status: JobStatus; addedAt: string; }
interface ResumeScan  { filename: string; atsScore: number; grade: string; extractedRole: string; scannedAt: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calculateStreak(evals: Eval[]): number {
  if (!evals.length) return 0;
  const dates = new Set(evals.map((e) => new Date(e.answeredAt).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

function scoreChip(score: number) {
  if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 65) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

const JOB_STATUS_CLS: Record<JobStatus, string> = {
  Wishlist: "bg-muted text-muted-foreground border-border",
  Applied:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Interview:"bg-amber-500/10 text-amber-400 border-amber-500/20",
  Offer:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ── Shared card shell ─────────────────────────────────────────────────────────

function CardShell({
  title, href, linkLabel, children,
}: {
  title: string; href: string; linkLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          {linkLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function MiniEmpty({
  icon: Icon, label, cta, href,
}: {
  icon: React.ComponentType<{ className?: string }>; label: string; cta: string; href: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        <Plus className="h-3 w-3" /> {cta}
      </Link>
    </div>
  );
}

// ── Full onboarding empty state ───────────────────────────────────────────────

function FullEmptyState() {
  const actions = [
    {
      title: "Start Practicing",
      desc:  "Answer AI-generated questions for your target role and company.",
      icon:  Sparkles,
      color: "text-indigo-400",
      bg:    "bg-indigo-500/10",
      glow:  "hover:border-indigo-500/40 group-hover:shadow-indigo-500/10",
      href:  "/dashboard/practice",
    },
    {
      title: "Upload Resume",
      desc:  "Get an ATS compatibility score and actionable improvement feedback.",
      icon:  FileText,
      color: "text-emerald-400",
      bg:    "bg-emerald-500/10",
      glow:  "hover:border-emerald-500/40 group-hover:shadow-emerald-500/10",
      href:  "/dashboard/resume",
    },
    {
      title: "Track Applications",
      desc:  "Log job applications and follow your pipeline from wishlist to offer.",
      icon:  Briefcase,
      color: "text-amber-400",
      bg:    "bg-amber-500/10",
      glow:  "hover:border-amber-500/40 group-hover:shadow-amber-500/10",
      href:  "/dashboard/jobs",
    },
    {
      title: "Mock Interview",
      desc:  "Simulate a full interview with AI questions and instant scoring.",
      icon:  Video,
      color: "text-violet-400",
      bg:    "bg-violet-500/10",
      glow:  "hover:border-violet-500/40 group-hover:shadow-violet-500/10",
      href:  "/dashboard/mock",
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Your workspace is ready</h3>
        <p className="text-sm text-muted-foreground">
          Choose where to start — your progress will appear here automatically.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${a.glow}`}
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${a.bg}`}>
              <a.icon className={`h-4 w-4 ${a.color}`} />
            </div>
            <div>
              <p className="mb-0.5 text-sm font-semibold text-foreground">{a.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
            </div>
            <span className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold ${a.color} transition-all group-hover:gap-1.5`}>
              Get started <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardOverview() {
  const [evals,       setEvals]       = useState<Eval[]>([]);
  const [mockSessions,setMockSessions]= useState<MockSession[]>([]);
  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [scans,       setScans]       = useState<ResumeScan[]>([]);
  const [loaded,      setLoaded]      = useState(false);

  useEffect(() => {
    setEvals(load<Eval>(EVALS_KEY));
    setMockSessions(load<MockSession>(MOCK_KEY));
    setJobs(load<Job>(JOBS_KEY));
    setScans(load<ResumeScan>(SCANS_KEY));
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyData =
    evals.length > 0 || mockSessions.length > 0 || jobs.length > 0 || scans.length > 0;

  if (!hasAnyData) return <FullEmptyState />;

  // Stats
  const totalEvals  = evals.length;
  const avgScore    = totalEvals
    ? Math.round(evals.reduce((sum, e) => sum + e.overallScore, 0) / totalEvals)
    : null;
  const streak      = calculateStreak(evals);
  const activeJobs  = jobs.filter((j) => j.status !== "Offer" && j.status !== "Rejected").length;

  const statCards = [
    {
      label: "Questions Answered",
      value: String(totalEvals),
      icon:  Target,
      color: "text-indigo-400",
      bg:    "bg-indigo-500/10",
      border:"border-indigo-500/20",
    },
    {
      label: "Avg Score",
      value: avgScore !== null ? `${avgScore}%` : "—",
      icon:  TrendingUp,
      color: "text-emerald-400",
      bg:    "bg-emerald-500/10",
      border:"border-emerald-500/20",
    },
    {
      label: "Day Streak",
      value: String(streak),
      icon:  Flame,
      color: "text-amber-400",
      bg:    "bg-amber-500/10",
      border:"border-amber-500/20",
    },
    {
      label: "Active Applications",
      value: String(activeJobs),
      icon:  Briefcase,
      color: "text-violet-400",
      bg:    "bg-violet-500/10",
      border:"border-violet-500/20",
    },
  ];

  // Sorted slices for each card
  const recentEvals = [...evals]
    .sort((a, b) => new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime())
    .slice(0, 4);
  const recentMock = [...mockSessions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 4);
  const recentScans = [...scans]
    .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-2xl border ${s.border} bg-card p-4 lg:p-5`}
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mb-0.5 text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── 2-col activity grid ── */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Recent Practice */}
        <CardShell title="Recent Practice" href="/dashboard/practice" linkLabel="Practice">
          {recentEvals.length === 0 ? (
            <MiniEmpty
              icon={Sparkles}
              label="No practice answers yet."
              cta="Start Practice"
              href="/dashboard/practice"
            />
          ) : (
            <div className="divide-y divide-border">
              {recentEvals.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {e.answer.slice(0, 72)}{e.answer.length > 72 ? "…" : ""}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {e.summary?.slice(0, 64) ?? ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${scoreChip(e.overallScore)}`}>
                      {e.overallScore}%
                    </span>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(e.answeredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        {/* Job Applications */}
        <CardShell title="Job Applications" href="/dashboard/jobs" linkLabel="Job Tracker">
          {recentJobs.length === 0 ? (
            <MiniEmpty
              icon={Briefcase}
              label="No applications tracked yet."
              cta="Add Application"
              href="/dashboard/jobs"
            />
          ) : (
            <div className="divide-y divide-border">
              {recentJobs.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{j.company}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{j.role}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${JOB_STATUS_CLS[j.status]}`}>
                      {j.status}
                    </span>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(j.addedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        {/* Mock Interviews */}
        <CardShell title="Mock Interviews" href="/dashboard/mock" linkLabel="Mock Interview">
          {recentMock.length === 0 ? (
            <MiniEmpty
              icon={Video}
              label="No mock interviews completed yet."
              cta="Start Interview"
              href="/dashboard/mock"
            />
          ) : (
            <div className="divide-y divide-border">
              {recentMock.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {m.role || "General Interview"}
                    </p>
                    <p className="text-[11px] capitalize text-muted-foreground">
                      {m.type} · {m.questionCount} question{m.questionCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${scoreChip(m.avgScore)}`}>
                      {m.avgScore}%
                    </span>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(m.completedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        {/* Resume Scans */}
        <CardShell title="Resume Scans" href="/dashboard/resume" linkLabel="Analyzer">
          {recentScans.length === 0 ? (
            <MiniEmpty
              icon={FileText}
              label="No resumes analyzed yet."
              cta="Upload Resume"
              href="/dashboard/resume"
            />
          ) : (
            <div className="divide-y divide-border">
              {recentScans.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {s.extractedRole || s.filename}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.filename}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${scoreChip(s.atsScore)}`}>
                      {s.atsScore}%
                    </span>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(s.scannedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardShell>
      </div>
    </div>
  );
}
