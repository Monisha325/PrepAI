"use client";

import { useEffect, useState } from "react";
import { Clock, RotateCcw, Trash2 } from "lucide-react";
import type { GenerateResponse } from "@/app/api/generate-questions/route";

export type StoredSession = Omit<GenerateResponse, "questions"> & {
  questions: Array<{ id: string; type: string; difficulty: string; text: string; hint: string; order: number }>;
};

const STORAGE_KEY = "prepai_sessions";
const MAX_STORED = 10;

export function saveSession(session: GenerateResponse) {
  try {
    const existing = loadSessions();
    const updated = [session, ...existing.filter((s) => s.sessionId !== session.sessionId)].slice(
      0,
      MAX_STORED,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

const TYPE_COLORS: Record<string, string> = {
  technical:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  coding:     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  behavioral: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  hr:         "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  technical: "Technical", coding: "Coding", behavioral: "Behavioral", hr: "HR",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  onRestore: (session: StoredSession) => void;
}

export function SessionHistory({ onRestore }: Props) {
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  function remove(sessionId: string | null) {
    const updated = sessions.filter((s) => s.sessionId !== sessionId);
    setSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  if (!sessions.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Sessions</h3>
          <p className="text-xs text-muted-foreground">Saved on this device</p>
        </div>
        <button
          onClick={() => { clearSessions(); setSessions([]); }}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
          Clear all
        </button>
      </div>

      <div className="divide-y divide-border">
        {sessions.map((s) => (
          <div
            key={s.sessionId ?? s.createdAt}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{s.role}</p>
              <p className="text-xs text-muted-foreground">{s.experience}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {s.interviewTypes.map((t) => (
                  <span
                    key={t}
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[t] ?? ""}`}
                  >
                    {TYPE_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(s.createdAt)}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {s.questions.length}q
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onRestore(s)}
                  title="Restore this session"
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-400"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={() => remove(s.sessionId)}
                  title="Delete this session"
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
