// Class metrics for the teacher and parent sites. Works on classmates + the live student alike.
import { COURSES, SEED_ASSIGNMENTS } from "../../lib/seed.js";
import { allAssignments, classRoster, courseGrade } from "../../lib/store.js";
import { percent } from "../../lib/grading.js";

export function teacherAssignments(s) {
  return allAssignments(s).filter((a) => !a.owner);
}

export function studentStats(r, assignments) {
  const now = Date.now();
  const assigned = assignments.filter((a) => a.due);
  const done = assigned.filter((a) => r.results[a.id]);
  const pastDue = assigned.filter((a) => new Date(a.due).getTime() < now);
  const missing = pastDue.filter((a) => !r.results[a.id]);
  const late = done.filter((a) => r.results[a.id].late);
  const graded = Object.values(r.results);
  const avg = graded.length ? Math.round(graded.reduce((s, x) => s + percent(x.correct, x.total), 0) / graded.length) : null;
  const byCourse = Object.fromEntries(COURSES.map((c) => [c.id, courseGrade(r.results, c.id, assignments)]));
  const minutes = graded.reduce((s, x) => s + (x.minutes || 0), 0);
  const hints = graded.reduce((s, x) => s + (x.hintsUsed || 0), 0);
  const completion = assigned.length ? percent(done.length, assigned.length) : 0;
  const status = r.minutesAgo < 20 ? "active" : r.minutesAgo < 24 * 60 ? "today" : "away";
  const needsHelp = (avg != null && avg < 70) || missing.length >= 2;
  return { avg, byCourse, done: done.length, assigned: assigned.length, missing: missing.length, late: late.length, minutes, hints, completion, status, needsHelp };
}

export function classOverview(s) {
  const assignments = teacherAssignments(s);
  const roster = classRoster(s).map((r) => ({ ...r, stats: studentStats(r, assignments) }));
  const avgs = roster.map((r) => r.stats.avg).filter((x) => x != null);
  const classAvg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
  const totalDone = roster.reduce((a, r) => a + r.stats.done, 0);
  const totalLate = roster.reduce((a, r) => a + r.stats.late, 0);
  const onTime = totalDone ? percent(totalDone - totalLate, totalDone) : 0;
  const missing = roster.reduce((a, r) => a + r.stats.missing, 0);
  const active = roster.filter((r) => r.stats.status === "active");
  const courseAvgs = COURSES.map((c) => {
    const v = roster.map((r) => r.stats.byCourse[c.id]).filter((x) => x != null);
    return { ...c, avg: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null };
  });
  const perAssignment = assignments.map((a) => {
    const res = roster.map((r) => r.results[a.id]).filter(Boolean);
    return { a, submitted: res.length, total: roster.length, avg: res.length ? Math.round(res.reduce((x, y) => x + percent(y.correct, y.total), 0) / res.length) : null };
  });
  return { roster, classAvg, onTime, missing, active, courseAvgs, perAssignment, assignments };
}

export const isSeed = (id) => SEED_ASSIGNMENTS.some((a) => a.id === id);

// ---------------------------------------------------------------------------
// Families: strengths, gaps and alerts for one child
// ---------------------------------------------------------------------------

/** Subjects and topics the child is strong in, and ones to work on. */
export function strengthsAndGaps(r, assignments) {
  const st = studentStats(r, assignments);
  const now = Date.now();
  const strengths = [], gaps = [];
  for (const c of COURSES) {
    const avg = st.byCourse[c.id];
    const mine = assignments.filter((a) => a.courseId === c.id);
    const topics = mine.map((a) => ({ a, x: r.results[a.id] })).filter(({ x }) => x);
    const missing = mine.filter((a) => a.due && new Date(a.due).getTime() < now && !r.results[a.id]);
    const strongTopics = topics.filter(({ x }) => percent(x.correct, x.total) >= 90).map(({ a }) => a.title);
    const weakTopics = topics.filter(({ x }) => percent(x.correct, x.total) < 70).map(({ a }) => a.title);
    if (avg != null && avg >= 85) strengths.push({ course: c, avg, topics: strongTopics });
    if ((avg != null && avg < 75) || weakTopics.length || missing.length) gaps.push({ course: c, avg, topics: weakTopics, missing: missing.map((a) => a.title) });
  }
  return { strengths, gaps };
}

/**
 * Alerts for families: engagement drops and repeated struggle. Each is { tone: "warn" | "info", title, body }.
 * For the live student we can see exact days and tries; for demo classmates we use their summary numbers.
 */
export function familyAlerts(r, assignments, s) {
  const st = studentStats(r, assignments);
  const out = [];
  const days = Math.floor(r.minutesAgo / 1440);
  if (days >= 3) out.push({ tone: "warn", kind: "engagement", title: `No activity for ${days} days`, body: "A short check-in about school this week could help. Even 10 minutes of practice keeps the streak alive." });
  else if (r.live && r.weekly && r.weekly.lastWeek >= 3 && r.weekly.thisWeek <= r.weekly.lastWeek / 2) out.push({ tone: "warn", kind: "engagement", title: "Less active than last week", body: `${r.weekly.thisWeek} learning day${r.weekly.thisWeek === 1 ? "" : "s"} this week, down from ${r.weekly.lastWeek}. Rest days are fine, but it may be worth asking how things are going.` });
  else if (!r.live && r.streakDays === 0 && r.minutesAgo > 1440) out.push({ tone: "info", kind: "engagement", title: "Activity has dipped", body: "Hasn't practised since yesterday. A gentle reminder might help." });
  if (st.missing) out.push({ tone: "warn", kind: "missing", title: `${st.missing} missing assignment${st.missing === 1 ? "" : "s"}`, body: "Teachers still accept late work. Late hand-ins still count." });

  const low = COURSES.filter((c) => st.byCourse[c.id] != null && st.byCourse[c.id] < 70);
  const lowTopics = Object.entries(r.results).filter(([, x]) => percent(x.correct, x.total) < 60);
  if (low.length || lowTopics.length >= 2) {
    out.push({ tone: "warn", kind: "struggle", title: `Finding ${low.length ? low.map((c) => c.name).join(" and ") : "a few topics"} tricky`, body: `${lowTopics.length} assignment${lowTopics.length === 1 ? "" : "s"} under 60% on the first try. Check the strengths and gaps below for things to try at home.` });
  }
  if (r.live && s) {
    const hard = assignments.flatMap((a) => a.questions.filter((q) => (s.submissions[a.id]?.answers[q.id]?.tries || 0) >= 3).map(() => a.title));
    if (hard.length >= 2) out.push({ tone: "info", kind: "struggle", title: `Needed 3+ tries on ${hard.length} questions`, body: `Kept trying until they got it, which is great effort! Most were in: ${[...new Set(hard)].join(", ")}.` });
  }
  return out;
}

/** Who finished an assignment and when, for the teacher's class page. */
export function completionFor(a, roster) {
  const now = Date.now();
  return roster
    .map((r) => {
      const x = r.results[a.id];
      const status = x ? (x.late ? "late" : "done") : a.due && new Date(a.due).getTime() < now ? "missing" : "notyet";
      return { r, x, status, at: x?.submittedAt };
    })
    .sort((p, q) => (p.at && q.at ? new Date(q.at) - new Date(p.at) : p.at ? -1 : q.at ? 1 : p.r.name.localeCompare(q.r.name)));
}
