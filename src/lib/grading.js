// Answer checking and grades. Pure functions (tested in grading.test.js).
import { SEED_ASSIGNMENTS } from "./seed.js";

/** Turns "$30", "2 1/4", "9/4", "2.25", "25%" into a number, or null. */
export function parseNumber(raw) {
  let s = String(raw ?? "").toLowerCase().trim();
  if (!s) return null;
  s = s.replace(/,/g, "").replace(/\band\b/g, " ").replace(/[$%°c]/g, " ").replace(/\s+/g, " ").trim();
  let m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[3]) ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
  m = s.match(/^(-?\d*\.?\d+)\s*\/\s*(\d*\.?\d+)$/);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : null;
  if (/^-?\d*\.?\d+$/.test(s)) return Number(s);
  return null;
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** True if the student's answer is right. Short answers forgive small spelling slips. */
export function isCorrect(q, value) {
  if (value == null || value === "") return false;
  if (q.type === "mc") return Number(value) === Number(q.answer);
  if (q.type === "tf") return String(value) === String(q.answer);
  if (q.type === "order") return Array.isArray(value) && value.length === q.items.length && value.every((v, i) => v === q.items[i]);
  if (q.type === "match") return Array.isArray(value) && q.pairs.every(([, right], i) => value[i] === right);
  if (q.type === "slider") return Math.abs(Number(value) - Number(q.answer)) <= Number(q.tolerance || 0) + 1e-9;
  const goods = [q.answer, ...(q.accept || [])];
  const n = parseNumber(value);
  if (n != null && goods.some((g) => parseNumber(g) != null && Math.abs(parseNumber(g) - n) < 0.006)) return true;
  const v = norm(value);
  if (!v) return false;
  return goods.some((g) => {
    const t = norm(g);
    if (!t || parseNumber(g) != null) return false;
    if (v === t) return true;
    return t.length >= 5 && editDistance(v, t) <= (t.length >= 9 ? 2 : 1);
  });
}

export function answerText(q) {
  if (q.type === "mc") return q.options[q.answer];
  if (q.type === "tf") return q.answer ? "True" : "False";
  if (q.type === "order") return q.items.join(" → ");
  if (q.type === "match") return q.pairs.map(([l, r]) => `${l} → ${r}`).join("; ");
  return String(q.answer);
}

/** Question types. order / match / slider are the interactive ones. */
export const QUESTION_TYPES = { mc: "Multiple choice", short: "Short answer", tf: "True / false", order: "Put in order", match: "Matching", slider: "Number line" };

/** True once the student has given something that can be checked. */
export function hasAnswer(q, value) {
  if (value == null || value === "") return false;
  if (q.type === "match") return Array.isArray(value) && value.length === q.pairs.length && value.every(Boolean);
  return true;
}

/** Stars: learning effort, not speed. Asking for help and beating your own score earn stars too. */
export const STARS = { firstTry: 10, afterRetry: 5, finished: 20, onTime: 10, askHelp: 2, improved: 15, badge: 10 };

export function percent(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}

export function letter(pct) {
  if (pct == null) return "–";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "R";
}

/** Grade for one submission: questions right on the first try, out of total. */
export function submissionScore(sub, assignment) {
  if (!sub?.submittedAt) return null;
  const total = assignment.questions.length;
  const correct = assignment.questions.filter((q) => sub.answers?.[q.id]?.firstTry).length;
  return { correct, total, pct: percent(correct, total) };
}

export function statusOf(assignment, sub, now = Date.now()) {
  if (sub?.submittedAt) return sub.late ? "late" : "done";
  if (!assignment.due) return sub?.startedAt ? "started" : "practice";
  if (new Date(assignment.due).getTime() < now) return "missing";
  return sub?.startedAt ? "started" : "todo";
}

/** Average % over a list of {correct,total}. */
export function average(results) {
  const r = results.filter(Boolean);
  if (!r.length) return null;
  return Math.round(r.reduce((s, x) => s + percent(x.correct, x.total), 0) / r.length);
}

export const SEED_IDS = new Set(SEED_ASSIGNMENTS.map((a) => a.id));
