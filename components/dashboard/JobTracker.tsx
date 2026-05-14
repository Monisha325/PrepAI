"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Trash2, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type JobStatus = "Wishlist" | "Applied" | "Interview" | "Offer" | "Rejected";

interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  location: string;
  notes: string;
  addedAt: string;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const JOBS_KEY = "prepai_jobs";

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: Job[]) {
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch {}
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUSES: JobStatus[] = ["Wishlist", "Applied", "Interview", "Offer", "Rejected"];

const STATUS_STYLES: Record<JobStatus, string> = {
  Wishlist: "bg-muted text-muted-foreground border-border",
  Applied: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Interview: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Offer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { company: "", role: "", status: "Applied" as JobStatus, location: "", notes: "" };

export function JobTracker() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<JobStatus | "All">("All");
  const [error, setError] = useState("");

  useEffect(() => {
    setJobs(loadJobs());
    setLoaded(true);
  }, []);

  function addJob() {
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required.");
      return;
    }
    const job: Job = {
      id: Date.now().toString(),
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      location: form.location.trim(),
      notes: form.notes.trim(),
      addedAt: new Date().toISOString(),
    };
    const updated = [job, ...jobs];
    setJobs(updated);
    saveJobs(updated);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setError("");
  }

  function deleteJob(id: string) {
    const updated = jobs.filter((j) => j.id !== id);
    setJobs(updated);
    saveJobs(updated);
  }

  function updateStatus(id: string, status: JobStatus) {
    const updated = jobs.map((j) => (j.id === id ? { ...j, status } : j));
    setJobs(updated);
    saveJobs(updated);
  }

  if (!loaded) return <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />;

  const filtered = filter === "All" ? jobs : jobs.filter((j) => j.status === filter);

  const counts: Record<string, number> = { All: jobs.length };
  for (const s of STATUSES) {
    counts[s] = jobs.filter((j) => j.status === s).length;
  }

  const inputCls =
    "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                filter === s
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
              {counts[s] > 0 && (
                <span className="ml-1.5 tabular-nums opacity-70">{counts[s]}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add Job
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-2xl border border-indigo-500/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Application</h3>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(""); }}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Google"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Role <span className="text-red-400">*</span>
              </label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Software Engineer"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
                className="flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:bg-muted/30"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Remote / New York"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Recruiter name, referral, next steps…"
                className={inputCls}
              />
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(""); }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={addJob}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Add Application
            </button>
          </div>
        </div>
      )}

      {/* Job list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {filter === "All" ? "No applications yet" : `No ${filter} applications`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filter === "All"
              ? "Track your job applications and interviews in one place."
              : `Switch to All to see your other applications.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="divide-y divide-border">
            {filtered.map((job) => (
              <div key={job.id} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{job.company}</p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <p className="text-sm text-muted-foreground">{job.role}</p>
                  </div>
                  {job.location && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{job.location}</p>
                  )}
                  {job.notes && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{job.notes}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <select
                    value={job.status}
                    onChange={(e) => updateStatus(job.id, e.target.value as JobStatus)}
                    className={`cursor-pointer rounded-lg border px-2 py-0.5 text-xs font-medium appearance-none focus:outline-none ${STATUS_STYLES[job.status]}`}
                    title="Change status"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(job.addedAt)}</span>
                </div>

                <button
                  onClick={() => deleteJob(job.id)}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress summary */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <div key={s} className={`rounded-xl border p-3 text-center ${STATUS_STYLES[s]}`}>
              <p className="text-lg font-black">{counts[s] ?? 0}</p>
              <p className="text-[11px] font-medium">{s}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
