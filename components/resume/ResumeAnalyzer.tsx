"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResumeAnalysisResult, SectionScore, Suggestion } from "@/app/api/analyze-resume/route";

// ─── Scan history (localStorage) ─────────────────────────────────────────────

const HISTORY_KEY = "prepai_resume_scans";

interface HistoryEntry {
  filename: string;
  atsScore: number;
  grade: string;
  extractedRole: string;
  scannedAt: string;
  result: ResumeAnalysisResult & { filename: string };
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToHistory(result: ResumeAnalysisResult & { filename: string }) {
  try {
    const existing = loadHistory();
    const entry: HistoryEntry = {
      filename: result.filename,
      atsScore: result.atsScore,
      grade: result.grade,
      extractedRole: result.extractedRole,
      scannedAt: new Date().toISOString(),
      result,
    };
    const updated = [entry, ...existing].slice(0, 6);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function gradeConfig(score: number) {
  if (score >= 85) return { label: "ATS Friendly",  textCls: "text-emerald-400", ring: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20", badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" };
  if (score >= 70) return { label: "Good",          textCls: "text-blue-400",   ring: "#3b82f6", bg: "bg-blue-500/10",    border: "border-blue-500/20",   badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-400" };
  if (score >= 55) return { label: "Needs Work",    textCls: "text-amber-400",  ring: "#f59e0b", bg: "bg-amber-500/10",   border: "border-amber-500/20",  badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400" };
  return             { label: "Poor ATS Match", textCls: "text-red-400",    ring: "#ef4444", bg: "bg-red-500/10",     border: "border-red-500/20",    badgeBg: "bg-red-500/10 border-red-500/30 text-red-400" };
}

function sectionColor(score: number) {
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-400" };
  if (score >= 60) return { bar: "bg-amber-500",   text: "text-amber-400" };
  return                  { bar: "bg-red-500",     text: "text-red-400" };
}

function suggestionConfig(severity: Suggestion["severity"]) {
  if (severity === "high")   return { icon: AlertCircle,   color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" };
  if (severity === "medium") return { icon: Lightbulb,     color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" };
  return                            { icon: CheckCircle2,  color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" };
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

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="144" height="144" className="-rotate-90" aria-hidden>
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted/20" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black tabular-nums" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ATS Score</span>
      </div>
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  isAnalyzing,
}: {
  onFile: (f: File) => void;
  isAnalyzing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.name.toLowerCase().endsWith(".pdf")) return;
      onFile(f);
    },
    [onFile],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !isAnalyzing && inputRef.current?.click()}
      className={`group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-200 ${
        dragging
          ? "border-indigo-500 bg-indigo-500/8 scale-[1.01]"
          : isAnalyzing
          ? "cursor-not-allowed border-border bg-muted/20 opacity-60"
          : "border-border bg-card hover:border-indigo-500/50 hover:bg-indigo-500/4"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        disabled={isAnalyzing}
      />

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragging ? "bg-indigo-600" : "bg-indigo-500/10 group-hover:bg-indigo-500/20"}`}>
        {isAnalyzing ? (
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        ) : (
          <Upload className={`h-6 w-6 transition-colors ${dragging ? "text-white" : "text-indigo-400"}`} />
        )}
      </div>

      <div className="text-center px-4">
        <p className="text-sm font-semibold text-foreground">
          {isAnalyzing ? "Analyzing your resume…" : dragging ? "Release to analyze" : "Drop your PDF resume here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isAnalyzing ? "Parsing PDF and running AI analysis…" : "or click to browse · PDF only · Max 5 MB"}
        </p>
      </div>

      {!isAnalyzing && (
        <Button size="sm" className="bg-indigo-600 px-6 text-xs hover:bg-indigo-500" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Choose PDF
        </Button>
      )}

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-xs text-indigo-400">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Analyzing with AI…
        </div>
      )}
    </div>
  );
}

// ─── Analysis result ──────────────────────────────────────────────────────────

function AnalysisReport({
  result,
  onNewScan,
}: {
  result: ResumeAnalysisResult & { filename: string };
  onNewScan: () => void;
}) {
  const g = gradeConfig(result.atsScore);

  return (
    <div className="space-y-5">
      {/* Top strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{result.extractedName !== "Unknown" ? result.extractedName : result.filename}</h2>
            <Badge variant="outline" className={`text-xs font-semibold ${g.badgeBg}`}>
              {g.label}
            </Badge>
          </div>
          {result.extractedRole && (
            <p className="mt-0.5 text-sm text-muted-foreground">{result.extractedRole}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onNewScan} className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          Analyze New Resume
        </Button>
      </div>

      {/* Score + skills */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Score ring */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6">
          <ScoreRing score={result.atsScore} color={g.ring} />
          <p className="text-xs text-muted-foreground text-center leading-relaxed">{result.summary.slice(0, 120)}…</p>
        </div>

        {/* Skills */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Detected Skills</h3>
            <p className="text-xs text-muted-foreground">{result.skills.length} skills extracted from your resume</p>
          </div>
          <div className="flex flex-wrap gap-1.5 p-5">
            {[...new Set(result.skills)].map((s) => (
              <span key={s} className="rounded-full border border-indigo-500/20 bg-indigo-500/8 px-2.5 py-0.5 text-[11px] font-medium text-indigo-400">
                {s}
              </span>
            ))}
            {result.skills.length === 0 && (
              <p className="text-xs text-muted-foreground">No skills detected. Make sure your resume has a dedicated skills section.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section breakdown + Keywords */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sections */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Section Breakdown</h3>
            <p className="text-xs text-muted-foreground">ATS score per resume section</p>
          </div>
          <div className="space-y-4 p-5">
            {result.sectionScores.map((s: SectionScore) => {
              const sc = sectionColor(s.score);
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className={`font-bold tabular-nums ${sc.text}`}>{s.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div className={`h-full rounded-full ${sc.bar} transition-all duration-700`} style={{ width: `${s.score}%` }} />
                  </div>
                  {s.feedback && (
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{s.feedback}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keywords */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Keyword Analysis</h3>
            <p className="text-xs text-muted-foreground">
              {result.matchedKeywords.length} matched · {result.missingKeywords.length} missing
            </p>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Matched Keywords
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                    <Tag className="h-2.5 w-2.5" />{k}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-red-400">
                <XCircle className="h-3.5 w-3.5" />
                Missing Keywords
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/8 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                    <Tag className="h-2.5 w-2.5" />{k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-foreground">Improvement Suggestions</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">AI-generated recommendations ranked by impact</p>
        </div>
        <div className="divide-y divide-border">
          {result.suggestions.map((s: Suggestion, i) => {
            const cfg = suggestionConfig(s.severity);
            return (
              <div key={i} className="flex gap-3.5 px-5 py-4 transition-colors hover:bg-muted/30">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{s.title}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      s.severity === "high" ? "bg-red-500/10 text-red-400" :
                      s.severity === "medium" ? "bg-amber-500/10 text-amber-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {s.severity}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
                <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Full summary */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <div>
            <p className="mb-1 text-xs font-semibold text-indigo-400">AI Assessment</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{result.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scan history sidebar ─────────────────────────────────────────────────────

function ScanHistory({ onRestore }: { onRestore: (r: HistoryEntry["result"]) => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function remove(idx: number) {
    const updated = history.filter((_, i) => i !== idx);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  if (!history.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Scan History</h3>
          <p className="text-xs text-muted-foreground">Previous analyses</p>
        </div>
        <button onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
          className="text-[11px] text-muted-foreground hover:text-red-400 transition-colors">
          Clear all
        </button>
      </div>
      <div className="divide-y divide-border">
        {history.map((h, i) => {
          const g = gradeConfig(h.atsScore);
          return (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                <FileText className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{h.filename}</p>
                <p className="text-[10px] text-muted-foreground">{h.extractedRole || "Unknown role"}</p>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />{timeAgo(h.scannedAt)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className={`rounded-lg border px-2 py-0.5 text-xs font-bold tabular-nums ${g.badgeBg}`}>
                  {h.atsScore}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => onRestore(h.result)} title="Restore this analysis"
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-indigo-400 transition-colors">
                    <TrendingUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(i)} title="Remove"
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResumeAnalyzer() {
  const [jobTitle, setJobTitle] = useState("");
  const [state, setState] = useState<"idle" | "analyzing" | "result">("idle");
  const [result, setResult] = useState<(ResumeAnalysisResult & { filename: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0); // force history re-render

  async function handleFile(file: File) {
    setError(null);
    setState("analyzing");

    const form = new FormData();
    form.append("file", file);
    form.append("jobTitle", jobTitle);

    try {
      const res = await fetch("/api/analyze-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      const r = data as ResumeAnalysisResult & { filename: string };
      setResult(r);
      setState("result");
      saveToHistory(r);
      setHistoryKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("idle");
    }
  }

  function reset() {
    setState("idle");
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resume ATS Analyzer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your PDF resume and get instant ATS compatibility insights, keyword gaps, and AI-powered improvement tips.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-xs font-medium text-indigo-400">
          <Sparkles className="h-3 w-3" />
          AI-Powered
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-3">
          {/* Job title input (always visible) */}
          {state !== "result" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Target Role <span className="font-normal text-muted-foreground">(optional)</span></h3>
                <p className="text-xs text-muted-foreground">Improves keyword analysis relevance</p>
              </div>
              <div className="p-5">
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer, Data Scientist, Product Manager"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>
          )}

          {/* Upload zone */}
          {state !== "result" && (
            <UploadZone onFile={handleFile} isAnalyzing={state === "analyzing"} />
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">Analysis failed</p>
                <p className="mt-0.5 text-xs text-red-400/80">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {state === "result" && result && (
            <AnalysisReport result={result} onNewScan={reset} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Tips card */}
          {state !== "result" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">How it works</h3>
              </div>
              <div className="space-y-4 p-5">
                {[
                  { n: "1", title: "Upload your PDF", desc: "Drag & drop or click to browse. Text-based PDFs work best." },
                  { n: "2", title: "Set your target role", desc: "Adding a job title improves keyword gap analysis accuracy." },
                  { n: "3", title: "Get your ATS score", desc: "AI analyzes 7 resume sections and scores each one." },
                  { n: "4", title: "Fix the gaps", desc: "Follow the prioritized suggestions to boost your score." },
                ].map((t) => (
                  <div key={t.n} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{t.n}</div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan history */}
          <ScanHistory
            key={historyKey}
            onRestore={(r) => { setResult(r); setState("result"); setError(null); }}
          />
        </div>
      </div>
    </div>
  );
}
