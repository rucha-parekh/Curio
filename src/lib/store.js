// One small app store kept in localStorage. The student, teacher and parent sites all read it,
// so a teacher's new assignment shows up for the student straight away (same browser).
import { useSyncExternalStore } from "react";
import { SEED_ASSIGNMENTS, SEED_ANNOUNCEMENTS, SEED_GOALS, STREAK_FREEZE, makeClassmates, daysFromNow } from "./seed.js";
import { isCorrect, STARS, submissionScore, statusOf, average } from "./grading.js";
import { dayKey, streakInfo, daysNeedingFreeze, restDaysThisWeek, weeklyActivity } from "./streak.js";

const KEY = "ql2:state";
const VERSION = 3;

// muted: the buddy's voice and sounds. voice: "girl" or "boy".
const A11Y = { dyslexia: false, colorSafe: false, reduceMotion: false, muted: false, voice: "girl" };
const EFFORT = { attempts: 0, solved: 0, comebacks: 0, helpAsked: 0, improved: 0 };
const progressDefaults = () => ({ activeDays: [], frozenDays: [], restDates: [], restWeekdays: [0, 6], freezes: 2, bestStreak: 0, effort: { ...EFFORT }, seenBadges: [] });

function fresh() {
  return {
    version: VERSION,
    student: null,
    customAssignments: [],
    dueOverrides: {},
    announcements: [],
    submissions: {},
    activity: null,
    activityLog: [],
    buddyChat: [],
    textSize: 0,
    a11y: { ...A11Y },
    classGoals: [],
    goalContrib: {},
    parent: null,
    contactMessages: [],
  };
}

/** Older saves don't have streaks, goals or settings yet: fill them in instead of wiping progress. */
function withDefaults(s) {
  const f = fresh();
  return {
    ...f,
    ...s,
    a11y: { ...A11Y, ...s.a11y },
    student: s.student && { ...progressDefaults(), ...s.student, effort: { ...EFFORT, ...s.student.effort } },
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.version === VERSION) return withDefaults(s);
  } catch {
    /* ignore */
  }
  return fresh();
}

let state = load();
const listeners = new Set();
const classmates = makeClassmates();

function emit() {
  for (const l of listeners) l();
}
export function setState(fn) {
  state = typeof fn === "function" ? fn(state) : fn;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep going in memory */
  }
  emit();
}
export function getState() {
  return state;
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });
}
export function useStore(select = (s) => s) {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state),
  );
}
export function resetDemo() {
  setState(fresh());
}

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

export function allAssignments(s = state) {
  return [...SEED_ASSIGNMENTS, ...s.customAssignments]
    .filter((a) => !a.owner || a.owner === "me")
    .map((a) => (s.dueOverrides[a.id] ? { ...a, due: s.dueOverrides[a.id] } : a));
}
export function assignmentById(id, s = state) {
  return allAssignments(s).find((a) => a.id === id);
}
export function announcementsFor(courseId, s = state) {
  return [...s.announcements, ...SEED_ANNOUNCEMENTS]
    .filter((a) => !courseId || a.courseId === courseId || a.courseId === "all")
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}
export function getClassmates() {
  return classmates;
}

/** Live student's results in the same shape as classmates' results. */
export function myResults(s = state) {
  const out = {};
  for (const a of allAssignments(s)) {
    const sub = s.submissions[a.id];
    const sc = submissionScore(sub, a);
    if (sc && !a.owner) out[a.id] = { ...sc, late: !!sub.late, submittedAt: sub.submittedAt, minutes: sub.minutes || 0, hintsUsed: sub.hintsUsed || 0 };
  }
  return out;
}

export function courseGrade(results, courseId, assignments = allAssignments()) {
  return average(assignments.filter((a) => a.courseId === courseId && !a.owner).map((a) => results[a.id]));
}

/** Everyone in class (classmates + the live student) as one list for the teacher and leaderboard. */
export function classRoster(s = state) {
  const list = classmates.map((c) => ({ ...c, live: false }));
  if (s.student) {
    const mins = s.activity ? Math.round((Date.now() - s.activity.at) / 60000) : 9999;
    list.push({
      id: "me",
      name: s.student.name,
      buddy: s.student.buddy,
      results: myResults(s),
      minutesAgo: mins,
      doing: s.activity && mins < 20 ? { label: s.activity.label } : null,
      stars: s.student.stars,
      weekStars: s.student.weekStars || 0,
      buddyChats: s.buddyChat.filter((m) => m.role === "student").length,
      streakDays: streakInfo(s.student).current,
      weekly: weeklyActivity(s.student),
      live: true,
    });
  }
  return list;
}

/** Class goals: the teacher's plus the demo ones, with progress (demo class + the live student). */
export function classGoals(s = state, courseId) {
  return [...s.classGoals, ...SEED_GOALS]
    .filter((g) => !courseId || g.courseId === courseId || g.courseId === "all")
    .map((g) => {
      const mine = s.goalContrib[g.id] || 0;
      const progress = Math.min(g.target, g.base + mine);
      return { ...g, mine, progress, pct: Math.round((progress / g.target) * 100), done: progress >= g.target };
    });
}
function contribute(s, metric, courseId, n = 1) {
  const out = { ...s.goalContrib };
  for (const g of [...s.classGoals, ...SEED_GOALS]) if (g.metric === metric && (g.courseId === "all" || g.courseId === courseId)) out[g.id] = (out[g.id] || 0) + n;
  return out;
}

/** Parent link code for a student, e.g. "AVA-4821". Families type it to link a child. */
export function linkCode(r) {
  let h = 7;
  for (const ch of `${r.id}:${r.name}`) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return `${r.name.toUpperCase()}-${1000 + h}`;
}

// ---------------------------------------------------------------------------
// Student actions
// ---------------------------------------------------------------------------

export function createStudent(name, buddy) {
  setState((s) => ({
    ...s,
    student: {
      name, buddy, stars: 120, weekStars: 40, owned: ["party-hat"], equipped: { hat: "party-hat" }, friends: ["c0", "c2", "c5", "c8"], myNotes: {},
      ...progressDefaults(),
      // A short streak and the badges from the two finished assignments, so the demo has something to show.
      activeDays: [dayKey(new Date(daysFromNow(-2))), dayKey(new Date(daysFromNow(-1)))],
      bestStreak: 2,
      seenBadges: ["first-turnin", "perfect", "squad"],
    },
    // Two earlier assignments are already done so Grades has something to show.
    submissions: {
      "english-main-idea": seededSub(SEED_ASSIGNMENTS.find((a) => a.id === "english-main-idea"), 4),
      "social-maps": seededSub(SEED_ASSIGNMENTS.find((a) => a.id === "social-maps"), 5),
    },
  }));
}
function seededSub(a, right) {
  const answers = {};
  a.questions.forEach((q, i) => {
    answers[q.id] = { value: q.answer, correct: true, firstTry: i < right, tries: i < right ? 1 : 2 };
  });
  return { answers, startedAt: daysFromNow(-6), submittedAt: daysFromNow(-5), late: false, minutes: 9, hintsUsed: 1, starsEarned: 60 };
}

/** Marks today as a learning day, updates the best streak, and gives a streak freeze every 7 days. */
function withActivity(st, today = dayKey()) {
  if (st.activeDays.includes(today)) return st;
  const next = { ...st, activeDays: [...st.activeDays, today].slice(-120) };
  const { current } = streakInfo(next, today);
  const freeze = current > 0 && current % 7 === 0 ? 1 : 0;
  return { ...next, bestStreak: Math.max(st.bestStreak || 0, current), freezes: Math.min(STREAK_FREEZE.max, st.freezes + freeze) };
}

export function track(label, page) {
  setState((s) => ({
    ...s,
    activity: { label, page, at: Date.now() },
    activityLog: s.activity?.label === label ? s.activityLog : [{ label, at: Date.now() }, ...s.activityLog].slice(0, 30),
  }));
}

/** Records an answer. Returns { correct, starsEarned, tries }. */
export function answerQuestion(assignmentId, q, value) {
  let result;
  setState((s) => {
    const sub = s.submissions[assignmentId] || { answers: {}, startedAt: new Date().toISOString(), hintsUsed: 0 };
    const prev = sub.answers[q.id] || { tries: 0 };
    if (prev.correct) {
      result = { correct: true, starsEarned: 0, tries: prev.tries };
      return s;
    }
    const correct = isCorrect(q, value);
    const tries = prev.tries + 1;
    const firstTry = correct && tries === 1;
    const practiceRepeat = !!sub.submittedAt; // re-doing a finished assignment earns nothing
    const starsEarned = correct && !practiceRepeat ? (firstTry ? STARS.firstTry : STARS.afterRetry) : 0;
    result = { correct, starsEarned, tries };
    const e = s.student.effort;
    const effort = { ...e, attempts: e.attempts + 1, solved: e.solved + (correct ? 1 : 0), comebacks: e.comebacks + (correct && tries > 1 ? 1 : 0) };
    const courseId = assignmentById(assignmentId, s)?.courseId;
    return {
      ...s,
      student: withActivity({ ...s.student, effort, stars: s.student.stars + starsEarned, weekStars: (s.student.weekStars || 0) + starsEarned }),
      submissions: { ...s.submissions, [assignmentId]: { ...sub, answers: { ...sub.answers, [q.id]: { value, correct, firstTry: prev.firstTry || firstTry, tries } } } },
      goalContrib: correct && !practiceRepeat ? contribute(s, "answers", courseId) : s.goalContrib,
    };
  });
  return result;
}

/** Asking for a hint is brave: it counts as effort and earns a couple of stars. */
export function noteHint(assignmentId) {
  setState((s) => {
    const sub = s.submissions[assignmentId] || { answers: {}, startedAt: new Date().toISOString(), hintsUsed: 0 };
    const stars = sub.submittedAt ? 0 : STARS.askHelp;
    const e = s.student.effort;
    return {
      ...s,
      student: withActivity({ ...s.student, stars: s.student.stars + stars, weekStars: (s.student.weekStars || 0) + stars, effort: { ...e, helpAsked: e.helpAsked + 1 } }),
      submissions: { ...s.submissions, [assignmentId]: { ...sub, hintsUsed: (sub.hintsUsed || 0) + 1 } },
    };
  });
}

export function submitAssignment(assignment) {
  let earned = 0;
  setState((s) => {
    const sub = s.submissions[assignment.id];
    if (!sub || sub.submittedAt) return s;
    const now = Date.now();
    const late = assignment.due ? new Date(assignment.due).getTime() < now : false;
    earned = assignment.owner ? 0 : STARS.finished + (assignment.due && !late ? STARS.onTime : 0);
    const minutes = Math.max(1, Math.round((now - new Date(sub.startedAt).getTime()) / 60000));
    return {
      ...s,
      student: { ...s.student, stars: s.student.stars + earned, weekStars: (s.student.weekStars || 0) + earned },
      submissions: { ...s.submissions, [assignment.id]: { ...sub, submittedAt: new Date().toISOString(), late, minutes, starsEarned: earned } },
      goalContrib: assignment.owner ? s.goalContrib : contribute(s, "turnins", assignment.courseId),
    };
  });
  return earned;
}

/** A practice re-run that beats the graded score (and any earlier practice) earns an improvement bonus once per new best. */
export function rewardImprovement(assignment, firstTryCorrect) {
  let earned = 0;
  setState((s) => {
    const sub = s.submissions[assignment.id];
    if (!sub?.submittedAt || assignment.owner) return s;
    const best = Math.max(submissionScore(sub, assignment).correct, sub.bestPractice || 0);
    if (firstTryCorrect <= best) return s;
    earned = STARS.improved;
    const e = s.student.effort;
    return {
      ...s,
      student: { ...s.student, stars: s.student.stars + earned, weekStars: (s.student.weekStars || 0) + earned, effort: { ...e, improved: e.improved + 1 } },
      submissions: { ...s.submissions, [assignment.id]: { ...sub, bestPractice: firstTryCorrect } },
    };
  });
  return earned;
}

/** On sign-in: spend streak freezes on missed school days. Never takes a freeze it can't fully use. */
export function applyStreakFreezes(today = dayKey()) {
  const out = { used: 0, broken: false, saved: 0 };
  setState((s) => {
    if (!s.student) return s;
    const gaps = daysNeedingFreeze(s.student, today);
    if (!gaps.length) return s;
    if (gaps.length > s.student.freezes) {
      out.broken = !s.student.activeDays.includes(today);
      return s;
    }
    out.used = gaps.length;
    return { ...s, student: { ...s.student, freezes: s.student.freezes - gaps.length, frozenDays: [...s.student.frozenDays, ...gaps].slice(-60) } };
  });
  if (out.used) out.saved = streakInfo(getState().student, today).current;
  return out;
}
/** One extra "day off" a week, on top of the weekly rest days. Only before any work today. */
export function canRestToday(st, today = dayKey()) {
  return !!st && !st.activeDays.includes(today) && !st.restDates.includes(today) && restDaysThisWeek(st, today) < 1;
}
export function takeRestDay(today = dayKey()) {
  setState((s) => (canRestToday(s.student, today) ? { ...s, student: { ...s.student, restDates: [...s.student.restDates, today] } } : s));
}
export function toggleRestWeekday(d) {
  setState((s) => {
    const cur = s.student.restWeekdays;
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : cur.length >= 2 ? cur : [...cur, d];
    return { ...s, student: { ...s.student, restWeekdays: next } };
  });
}
export function buyFreeze() {
  setState((s) => {
    const st = s.student;
    if (st.stars < STREAK_FREEZE.price || st.freezes >= STREAK_FREEZE.max) return s;
    return { ...s, student: { ...st, stars: st.stars - STREAK_FREEZE.price, freezes: st.freezes + 1 } };
  });
}
/** New badges each give a few stars, once. */
export function markBadgesSeen(ids) {
  setState((s) => {
    const fresh = ids.filter((id) => !s.student.seenBadges.includes(id));
    if (!fresh.length) return s;
    const stars = fresh.length * STARS.badge;
    return { ...s, student: { ...s.student, seenBadges: [...s.student.seenBadges, ...fresh], stars: s.student.stars + stars, weekStars: (s.student.weekStars || 0) + stars } };
  });
}

export function saveMyNote(courseId, text) {
  setState((s) => ({ ...s, student: { ...s.student, myNotes: { ...s.student.myNotes, [courseId]: text } } }));
}

export function buyItem(item) {
  setState((s) => {
    if (s.student.owned.includes(item.id) || s.student.stars < item.price) return s;
    return { ...s, student: { ...s.student, stars: s.student.stars - item.price, owned: [...s.student.owned, item.id], equipped: { ...s.student.equipped, [item.slot]: item.id } } };
  });
}
export function toggleEquip(item) {
  setState((s) => {
    const on = s.student.equipped[item.slot] === item.id;
    return { ...s, student: { ...s.student, equipped: { ...s.student.equipped, [item.slot]: on ? undefined : item.id } } };
  });
}
export function setBuddy(id) {
  setState((s) => ({ ...s, student: { ...s.student, buddy: id } }));
}
export function addFriend(id) {
  setState((s) => (s.student.friends.includes(id) ? s : { ...s, student: { ...s.student, friends: [...s.student.friends, id] } }));
}
export function removeFriend(id) {
  setState((s) => ({ ...s, student: { ...s.student, friends: s.student.friends.filter((f) => f !== id) } }));
}
export function addBuddyMessage(msg) {
  setState((s) => {
    const student = msg.role === "student" && s.student ? { ...s.student, effort: { ...s.student.effort, helpAsked: s.student.effort.helpAsked + 1 } } : s.student;
    return { ...s, student, buddyChat: [...s.buddyChat, { ...msg, at: Date.now() }].slice(-60) };
  });
}
export function addPersonalPractice(a) {
  setState((s) => ({ ...s, customAssignments: [...s.customAssignments, { ...a, owner: "me" }] }));
}

// ---------------------------------------------------------------------------
// Teacher actions
// ---------------------------------------------------------------------------

export function publishAssignment(a) {
  setState((s) => ({ ...s, customAssignments: [...s.customAssignments, { ...a, from: "teacher" }] }));
}
export function deleteAssignment(id) {
  setState((s) => ({ ...s, customAssignments: s.customAssignments.filter((a) => a.id !== id) }));
}
export function setDue(id, iso) {
  setState((s) => ({ ...s, dueOverrides: { ...s.dueOverrides, [id]: iso } }));
}
export function sendAnnouncement(a) {
  setState((s) => ({ ...s, announcements: [{ ...a, id: `ann-${Date.now()}`, at: new Date().toISOString() }, ...s.announcements] }));
}
/** The demo class has already made a start on a new goal (about a third). */
export function addClassGoal(g) {
  setState((s) => ({ ...s, classGoals: [{ ...g, id: `goal-${Date.now().toString(36)}`, base: Math.round(g.target * 0.35), createdAt: new Date().toISOString(), from: "teacher" }, ...s.classGoals] }));
}
export function removeClassGoal(id) {
  setState((s) => ({ ...s, classGoals: s.classGoals.filter((g) => g.id !== id) }));
}

// ---------------------------------------------------------------------------
// Families
// ---------------------------------------------------------------------------

export function createParent(name) {
  setState((s) => ({ ...s, parent: { name, children: [] } }));
}
/** Links a child by their code. Returns the child's id, or null if the code doesn't match anyone. */
export function linkChild(code) {
  const want = String(code).trim().toUpperCase();
  const child = classRoster(state).find((r) => linkCode(r) === want);
  if (!child) return null;
  setState((s) => (s.parent.children.includes(child.id) ? s : { ...s, parent: { ...s.parent, children: [...s.parent.children, child.id] } }));
  return child.id;
}
export function unlinkChild(id) {
  setState((s) => ({ ...s, parent: { ...s.parent, children: s.parent.children.filter((c) => c !== id) } }));
}

// ---------------------------------------------------------------------------
// Marketing site
// ---------------------------------------------------------------------------

/** No backend yet: contact messages are kept in this browser so the demo shows them as sent. */
export function saveContactMessage(msg) {
  setState((s) => ({ ...s, contactMessages: [{ ...msg, id: `msg-${Date.now()}`, at: new Date().toISOString() }, ...s.contactMessages].slice(0, 50) }));
}

// ---------------------------------------------------------------------------
// Display and reading settings (shared by all three sites)
// ---------------------------------------------------------------------------

export function setTextSize(n) {
  setState((s) => ({ ...s, textSize: n }));
}
export function setA11y(patch) {
  setState((s) => ({ ...s, a11y: { ...s.a11y, ...patch } }));
}

export { statusOf, submissionScore };
