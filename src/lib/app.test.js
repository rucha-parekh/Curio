import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isCorrect, parseNumber, hasAnswer, answerText, STARS } from "./grading.js";
import { SEED_ASSIGNMENTS } from "./seed.js";
import * as store from "./store.js";
import { scriptedReply, buildContext, validateQuestions, askBuddy } from "./ai.js";
import { localQuestions } from "./questionGen.js";
import { streakInfo, daysNeedingFreeze, dayKey, addDays } from "./streak.js";
import { earnedBadges } from "./badges.js";
import { coachHint, greeting } from "./coach.js";
import { speakable } from "./speech.js";
import { recommendPlan, estimateSchoolPrice, COMPARISON } from "./plans.js";
import { validateContact, emptyContact, planFromRoute } from "./contact.js";
import { classOverview, strengthsAndGaps, familyAlerts } from "../pages/teacher/metrics.js";

const cells = SEED_ASSIGNMENTS.find((a) => a.id === "science-cells");

beforeEach(() => {
  store.resetDemo();
  store.createStudent("Sam", "zip");
});

describe("answer checking", () => {
  it("handles numbers, fractions and money", () => {
    const q = SEED_ASSIGNMENTS[0].questions[0];
    expect(isCorrect(q, "2 1/4")).toBe(true);
    expect(isCorrect(q, "9/4")).toBe(true);
    expect(isCorrect(q, "2.25")).toBe(true);
    expect(isCorrect(q, "3 3/4")).toBe(false);
    expect(parseNumber("$30")).toBe(30);
  });
  it("forgives small spelling slips on word answers", () => {
    const q = cells.questions[3];
    expect(isCorrect(q, "mitocondria")).toBe(true);
    expect(isCorrect(q, "Mitochondria")).toBe(true);
    expect(isCorrect(q, "nucleus")).toBe(false);
  });
  it("checks multiple choice and true/false", () => {
    expect(isCorrect(cells.questions[0], 0)).toBe(true);
    expect(isCorrect(cells.questions[0], 1)).toBe(false);
    expect(isCorrect(cells.questions[2], "true")).toBe(true);
  });
});

describe("working assignments", () => {
  it("gives stars for first try and retries, then grades on first tries", () => {
    const start = store.getState().student.stars;
    expect(store.answerQuestion(cells.id, cells.questions[0], 2).correct).toBe(false);
    expect(store.answerQuestion(cells.id, cells.questions[0], 0).starsEarned).toBe(5);
    for (const q of cells.questions.slice(1)) expect(store.answerQuestion(cells.id, q, q.answer).starsEarned).toBe(10);
    const bonus = store.submitAssignment(cells);
    expect(bonus).toBe(30); // finished + on time
    expect(store.getState().student.stars).toBe(start + 5 + 40 + 30);
    expect(store.myResults()[cells.id]).toMatchObject({ correct: 4, total: 5 });
  });
  it("personal practice from a file gives no finishing bonus", () => {
    const qs = localQuestions(SAMPLE, 5);
    store.addPersonalPractice({ id: "mine-1", courseId: "science", title: "Practice", due: null, questions: qs });
    const a = store.assignmentById("mine-1");
    for (const q of a.questions) store.answerQuestion(a.id, q, q.answer);
    expect(store.submitAssignment(a)).toBe(0);
  });
});

describe("teacher → student", () => {
  it("published assignments and announcements reach the student", () => {
    store.publishAssignment({ id: "t-1", courseId: "math", title: "Teacher quiz", due: new Date(Date.now() + 864e5).toISOString(), questions: [{ id: "q1", type: "tf", prompt: "2+2=4", answer: true }] });
    store.sendAnnouncement({ courseId: "math", title: "Hello", body: "Quiz posted", from: "Ms. Rivera" });
    expect(store.allAssignments().some((a) => a.id === "t-1")).toBe(true);
    expect(store.announcementsFor("math")[0].title).toBe("Hello");
    expect(store.announcementsFor("science").some((a) => a.title === "Hello")).toBe(false);
  });
  it("teacher can move a deadline", () => {
    const iso = new Date(Date.now() + 10 * 864e5).toISOString();
    store.setDue("math-fractions", iso);
    expect(store.assignmentById("math-fractions").due).toBe(iso);
  });
  it("teacher sees every student with grades and metrics", () => {
    const o = classOverview(store.getState());
    expect(o.roster).toHaveLength(25);
    const me = o.roster.find((r) => r.live);
    expect(me.stats.byCourse.english).toBe(80);
    expect(me.stats).toHaveProperty("missing");
    expect(o.classAvg).toBeGreaterThan(0);
  });
});

describe("study buddy", () => {
  it("sees the student's work and the question on screen", () => {
    const ctx = buildContext({ page: "assignment", courseId: "science", assignmentId: cells.id, question: cells.questions[0] });
    expect(ctx).toContain("Fraction Fix-Up");
    expect(ctx).toContain(cells.questions[0].prompt);
    expect(ctx).toMatch(/SECRET, never reveal/);
  });
  it("gives hints, not answers, when asked for the answer (no AI connected)", async () => {
    const q = cells.questions[3];
    const r = await askBuddy({ history: [{ role: "student", text: "just tell me the answer" }], view: { page: "assignment", assignmentId: cells.id, question: q }, buddy: { name: "Zip" } });
    expect(r.source).toBe("scripted");
    expect(r.text.toLowerCase()).not.toContain("mitochondria");
    expect(r.text).toContain(q.hint);
  });
  it("knows what's due", () => {
    expect(scriptedReply("what's due?", { page: "home" })).toMatch(/Next up/);
  });
});

const SAMPLE = `The water cycle describes how water moves around the Earth.
When the Sun heats water in oceans and lakes, it turns into water vapour through a process called evaporation.
As the vapour rises into the sky, it cools down and forms clouds through condensation.
When the drops in the clouds get heavy, they fall back to Earth as precipitation, such as rain or snow.
Water that soaks into the ground becomes groundwater, which plants use through their roots.
About 97 percent of Earth's water is salt water found in the oceans.`;

describe("questions from uploaded files", () => {
  it("builds real, answerable questions without AI", () => {
    const qs = localQuestions(SAMPLE, 6);
    expect(qs.length).toBeGreaterThanOrEqual(4);
    for (const q of qs) {
      expect(isCorrect(q, q.type === "tf" ? String(q.answer) : q.answer)).toBe(true);
      if (q.type === "mc") expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
  it("throws away broken AI questions", () => {
    const qs = validateQuestions([
      { type: "mc", prompt: "ok?", options: ["a", "b"], answer: 1 },
      { type: "mc", prompt: "bad", options: ["a"], answer: 3 },
      { type: "short", prompt: "", answer: "x" },
      { type: "tf", prompt: "t", answer: true },
    ]);
    expect(qs.map((q) => q.type)).toEqual(["mc", "tf"]);
  });
});

const lab = SEED_ASSIGNMENTS.find((a) => a.id === "science-water-lab");

describe("interactive question types", () => {
  it("checks put-in-order, matching and number line", () => {
    const [order, match, slider] = lab.questions;
    expect(isCorrect(order, [...order.items])).toBe(true);
    expect(isCorrect(order, [...order.items].reverse())).toBe(false);
    expect(isCorrect(match, match.pairs.map((p) => p[1]))).toBe(true);
    expect(isCorrect(match, match.pairs.map((p) => p[1]).reverse())).toBe(false);
    expect(isCorrect(slider, 97)).toBe(true);
    expect(isCorrect(slider, 95)).toBe(true); // within ±2
    expect(isCorrect(slider, 90)).toBe(false);
    expect(hasAnswer(match, ["liquid → gas", "", "", ""])).toBe(false);
    expect(answerText(order)).toContain("→");
  });
  it("the demo class hasn't done the just-posted assignment", () => {
    expect(store.getClassmates().some((c) => c.results[lab.id])).toBe(false);
  });
});

describe("streaks", () => {
  const p = (o) => ({ activeDays: [], frozenDays: [], restDates: [], restWeekdays: [0, 6], ...o });
  // 2026-10-26 is a Monday.
  it("counts days in a row, and today stays open until it ends", () => {
    expect(streakInfo(p({ activeDays: ["2026-10-27", "2026-10-28", "2026-10-29"] }), "2026-10-30").current).toBe(3);
    expect(streakInfo(p({ activeDays: ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"] }), "2026-10-30").current).toBe(4);
  });
  it("rest days and frozen days never break a streak", () => {
    // Fri active, Sat+Sun rest, Mon active
    expect(streakInfo(p({ activeDays: ["2026-10-23", "2026-10-26"] }), "2026-10-26").current).toBe(2);
    // Tue missed but frozen
    expect(streakInfo(p({ activeDays: ["2026-10-26", "2026-10-28"], frozenDays: ["2026-10-27"] }), "2026-10-28").current).toBe(2);
    // Tue missed, no freeze: streak restarts
    expect(streakInfo(p({ activeDays: ["2026-10-26", "2026-10-28"] }), "2026-10-28").current).toBe(1);
  });
  it("finds the school days a freeze must cover, skipping rest days", () => {
    expect(daysNeedingFreeze(p({ activeDays: ["2026-10-22"] }), "2026-10-27")).toEqual(["2026-10-26", "2026-10-23"]);
  });
  it("spends freezes on sign-in, but only if there are enough", () => {
    const today = dayKey();
    store.setState((s) => ({ ...s, student: { ...s.student, restWeekdays: [], activeDays: [addDays(today, -3)], freezes: 2, frozenDays: [] } }));
    expect(store.applyStreakFreezes(today)).toMatchObject({ used: 2, saved: 1 });
    expect(store.getState().student.freezes).toBe(0);
    store.setState((s) => ({ ...s, student: { ...s.student, activeDays: [addDays(today, -5)], frozenDays: [], freezes: 1 } }));
    expect(store.applyStreakFreezes(today)).toMatchObject({ used: 0, broken: true });
    expect(store.getState().student.freezes).toBe(1);
  });
  it("answering marks today and one rest day a week is allowed", () => {
    expect(store.canRestToday(store.getState().student)).toBe(true);
    store.answerQuestion(cells.id, cells.questions[0], 0);
    expect(store.getState().student.activeDays).toContain(dayKey());
    expect(store.canRestToday(store.getState().student)).toBe(false); // already worked today
  });
});

describe("effort rewards and badges", () => {
  it("rewards asking for help, comebacks and beating your own score", () => {
    const st0 = store.getState().student;
    store.noteHint(cells.id);
    expect(store.getState().student.stars).toBe(st0.stars + STARS.askHelp);
    store.answerQuestion(cells.id, cells.questions[0], 1);
    store.answerQuestion(cells.id, cells.questions[0], 0);
    expect(store.getState().student.effort).toMatchObject({ helpAsked: 1, attempts: 2, solved: 1, comebacks: 1 });

    const done = store.assignmentById("english-main-idea"); // graded 4/5
    expect(store.rewardImprovement(done, 4)).toBe(0);
    expect(store.rewardImprovement(done, 5)).toBe(STARS.improved);
    expect(store.rewardImprovement(done, 5)).toBe(0); // only once per new best
  });
  it("earns effort and accuracy badges", () => {
    const ids = () => earnedBadges(store.getState()).map((b) => b.id);
    expect(ids()).toEqual(expect.arrayContaining(["first-turnin", "perfect"]));
    expect(ids()).not.toContain("brave-ask");
    for (let i = 0; i < 3; i++) store.noteHint(cells.id);
    expect(ids()).toContain("brave-ask");
  });
  it("solving questions moves the class goal", () => {
    const before = store.classGoals().find((g) => g.id === "goal-answers").progress;
    store.answerQuestion(cells.id, cells.questions[0], 0);
    expect(store.classGoals().find((g) => g.id === "goal-answers").progress).toBe(before + 1);
    store.addClassGoal({ courseId: "science", title: "Science squad", metric: "answers", target: 50, reward: "🎉" });
    expect(store.classGoals(undefined, "science").some((g) => g.title === "Science squad")).toBe(true);
    expect(store.classGoals(undefined, "math").some((g) => g.title === "Science squad")).toBe(false);
  });
});

describe("buddy coach", () => {
  it("talks by default in a girl voice, can switch to boy or be muted, and skips emojis when speaking", () => {
    expect(store.getState().a11y).toMatchObject({ muted: false, voice: "girl" });
    store.setA11y({ voice: "boy", muted: true });
    expect(store.getState().a11y).toMatchObject({ muted: true, voice: "boy" });
    expect(speakable("YESSS! 🎉 Heat → evaporation")).toBe("YESSS! Heat , then evaporation");
  });
  it("greets by time of day", () => {
    expect(greeting("Sam", new Date(2026, 9, 31, 8))).toMatch(/^Good morning, Sam/);
    expect(greeting("Sam", new Date(2026, 9, 31, 14))).toMatch(/^Good afternoon/);
    expect(greeting("Sam", new Date(2026, 9, 31, 20))).toMatch(/^Good evening/);
  });
  it("helps step by step without ever giving the answer", () => {
    for (const a of SEED_ASSIGNMENTS)
      for (const q of a.questions.filter((x) => ["mc", "short", "tf"].includes(x.type)))
        for (const level of [1, 2, 3]) {
          const secret = answerText(q).toLowerCase();
          if (secret.length < 3 || q.type === "tf") continue;
          expect(coachHint(q, level).toLowerCase()).not.toContain(secret);
        }
  });
  it("tells you if a number is too high or too low", () => {
    const hoodie = SEED_ASSIGNMENTS[0].questions[3]; // answer 30
    expect(coachHint(hoodie, 1, "40")).toMatch(/too high/);
    expect(coachHint(hoodie, 1, "10")).toMatch(/too low/);
  });
  it("doesn't scold you for asking it not to tell the answer", () => {
    const r = scriptedReply("Can you help me think through this question? Don't tell me the answer.", { page: "assignment", courseId: "science", question: cells.questions[0], hintLevel: 1 });
    expect(r).not.toMatch(/Nice try/);
    expect(r).toMatch(/Step 1/);
  });
});

describe("families", () => {
  it("links children by code and rejects wrong codes", () => {
    store.createParent("Jo");
    const ava = store.classRoster().find((r) => r.id === "c0");
    expect(store.linkChild("nope-0000")).toBeNull();
    expect(store.linkChild(store.linkCode(ava).toLowerCase())).toBe("c0");
    expect(store.linkChild(store.linkCode({ id: "me", name: "Sam" }))).toBe("me");
    expect(store.getState().parent.children).toEqual(["c0", "me"]);
  });
  it("shows strengths, gaps and alerts for engagement and struggle", () => {
    const assignments = store.allAssignments().filter((a) => !a.owner);
    const struggling = { id: "x", name: "Test", live: false, minutesAgo: 5 * 1440, streakDays: 0, results: { "math-fractions": { correct: 1, total: 5 }, "math-percents": { correct: 1, total: 4 }, "english-figurative": { correct: 5, total: 5 } } };
    const { strengths, gaps } = strengthsAndGaps(struggling, assignments);
    expect(strengths.map((x) => x.course.id)).toContain("english");
    expect(gaps.map((x) => x.course.id)).toContain("math");
    const kinds = familyAlerts(struggling, assignments).map((a) => a.kind);
    expect(kinds).toEqual(expect.arrayContaining(["engagement", "struggle"]));
  });
});

describe("pricing", () => {
  it("recommends a plan from the number of students", () => {
    expect(recommendPlan(12)).toBe("free");
    expect(recommendPlan(30)).toBe("free");
    expect(recommendPlan(31)).toBe("school");
    expect(recommendPlan(1000)).toBe("school");
    expect(recommendPlan(1001)).toBe("campus");
  });
  it("estimates the School price with a 100-student minimum and 2 months free yearly", () => {
    expect(estimateSchoolPrice(250, "yearly")).toEqual({ seats: 250, amount: 1250, per: "year" });
    expect(estimateSchoolPrice(250, "monthly")).toEqual({ seats: 250, amount: 125, per: "month" });
    expect(estimateSchoolPrice(40, "yearly").seats).toBe(100);
    // yearly costs 10 months of the monthly price
    expect(estimateSchoolPrice(500, "yearly").amount).toBe(estimateSchoolPrice(500, "monthly").amount * 10);
  });
  it("never puts accessibility behind a paywall", () => {
    const row = COMPARISON.flatMap((g) => g.rows).find((r) => /dyslexia/i.test(r[0]));
    expect(row.slice(1)).toEqual([true, true, true]);
  });
});

describe("contact form", () => {
  const good = { name: "Jo Lee", email: "jo@school.org", role: "Teacher", institution: "Northfield", students: "120", plan: "school", message: "We'd like a trial please." };
  it("accepts a complete message and explains every problem", () => {
    expect(validateContact(good)).toEqual({});
    const e = validateContact({ ...emptyContact(), email: "nope", students: "2.5", message: "hi" });
    expect(Object.keys(e).sort()).toEqual(["email", "institution", "message", "name", "role", "students"]);
    expect(e.email).toMatch(/name@school\.org/);
  });
  it("pre-picks the plan from the page link and saves messages locally", () => {
    expect(planFromRoute("contact-school")).toBe("school");
    expect(planFromRoute("contact")).toBe("unsure");
    expect(planFromRoute("contact-nonsense")).toBe("unsure");
    store.saveContactMessage(good);
    expect(store.getState().contactMessages[0]).toMatchObject({ name: "Jo Lee", plan: "school" });
  });
});

describe("removed on purpose", () => {
  const src = fs.readdirSync(path.resolve(__dirname, ".."), { recursive: true })
    .filter((f) => /\.(jsx?)$/.test(f) && !/\.test\./.test(f))
    .map((f) => fs.readFileSync(path.resolve(__dirname, "..", f), "utf8").toLowerCase())
    .join("\n");
  it("has no Brightspace, calendar import, focus blocks or goals", () => {
    expect(src).not.toMatch(/brightspace|\bical\b|focus block|my goals/);
  });
  it("never ships an API key", () => {
    expect(src).not.toMatch(/sk-ant-|x-api-key/);
  });
});
