import type { EvaluationResult } from "@/app/api/evaluate-answer/route";

const STORE_KEY = "prepai_evaluations";

export interface StoredEvaluation extends EvaluationResult {
  questionId: string;
  sessionKey: string; // sessionId or createdAt
  answeredAt: string;
  answer: string;
}

function load(): StoredEvaluation[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(evals: StoredEvaluation[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(evals));
  } catch {}
}

export function saveEvaluation(
  sessionKey: string,
  questionId: string,
  answer: string,
  result: EvaluationResult,
) {
  const all = load();
  const entry: StoredEvaluation = {
    ...result,
    questionId,
    sessionKey,
    answer,
    answeredAt: new Date().toISOString(),
  };
  const updated = [
    entry,
    ...all.filter((e) => !(e.sessionKey === sessionKey && e.questionId === questionId)),
  ];
  save(updated.slice(0, 200));
}

export function getSessionEvaluations(sessionKey: string): StoredEvaluation[] {
  return load().filter((e) => e.sessionKey === sessionKey);
}

export function getQuestionEvaluation(
  sessionKey: string,
  questionId: string,
): StoredEvaluation | null {
  return (
    load().find((e) => e.sessionKey === sessionKey && e.questionId === questionId) ?? null
  );
}

export function getSessionAvgScore(sessionKey: string): number | null {
  const evals = getSessionEvaluations(sessionKey);
  if (!evals.length) return null;
  return Math.round(evals.reduce((s, e) => s + e.overallScore, 0) / evals.length);
}

export function clearSessionEvaluations(sessionKey: string) {
  save(load().filter((e) => e.sessionKey !== sessionKey));
}
