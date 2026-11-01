// Study buddy brain.
// Order of preference:
//   1. Claude, through the claude.ai "sample" capability (works in the published demo; uses the viewer's own Claude account)
//   2. Your own server proxy (VITE_AI_PROXY_URL → server/ai-proxy.js, which holds the API key; never in the browser)
//   3. A built-in scripted buddy, so the app still works offline or with no AI at all
import { COURSES, NOTES } from "./seed.js";
import { allAssignments, announcementsFor, getState } from "./store.js";
import { statusOf, answerText } from "./grading.js";
import { coachHint, fresh } from "./coach.js";

let samplePromise = null;
function getSample() {
  if (!samplePromise) {
    samplePromise = typeof window !== "undefined" && window.claude?.use ? window.claude.use("sample").catch(() => null) : Promise.resolve(null);
  }
  return samplePromise;
}
const PROXY = typeof import.meta !== "undefined" ? import.meta.env?.VITE_AI_PROXY_URL : undefined;

let aiBlocked = false; // set when the viewer declines, so we stop asking
export async function aiAvailable() {
  if (aiBlocked) return false;
  return !!(PROXY || (await getSample()));
}

async function callClaude(input, { json = false, onText, tier = "quick" } = {}) {
  const sample = await getSample();
  if (sample && !aiBlocked) {
    try {
      if (json) return await sample.json(input, { modelTier: tier });
      const r = await sample(input, { modelTier: tier, cache: false, onText: onText ? ({ text }) => onText(text) : undefined });
      return r.text;
    } catch (e) {
      if (e?.code === "not_granted") aiBlocked = true;
      throw e;
    }
  }
  if (PROXY) {
    const res = await fetch(PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, json }) });
    if (!res.ok) throw new Error("proxy failed");
    const data = await res.json();
    return json ? JSON.parse(String(data.text).replace(/```json|```/g, "").trim()) : data.text;
  }
  throw new Error("no ai");
}

// ---------------------------------------------------------------------------
// What the buddy can "see": the page the student is on, plus their courses and work
// ---------------------------------------------------------------------------

const fmtDue = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "no due date");

/**
 * view = { page, courseId?, assignmentId?, question?, lastAnswer?, lastCorrect? }
 */
export function buildContext(view = {}) {
  const s = getState();
  const lines = [];
  lines.push(`Student first name: ${s.student?.name || "friend"}. Grade 6-8 student.`);
  lines.push(`Page they are looking at: ${view.page || "home"}.`);
  const work = allAssignments(s)
    .map((a) => ({ a, st: statusOf(a, s.submissions[a.id]) }))
    .filter((x) => x.st !== "done" && x.st !== "late")
    .sort((x, y) => new Date(x.a.due || 8e15) - new Date(y.a.due || 8e15))
    .slice(0, 6);
  lines.push("Their unfinished work: " + (work.map(({ a, st }) => `${a.title} (${COURSES.find((c) => c.id === a.courseId)?.name}, due ${fmtDue(a.due)}, ${st})`).join("; ") || "none"));
  const ann = announcementsFor(view.courseId, s).slice(0, 2);
  if (ann.length) lines.push("Latest announcements: " + ann.map((a) => `${a.title}: ${a.body}`).join(" | "));
  if (view.courseId) {
    const c = COURSES.find((x) => x.id === view.courseId);
    lines.push(`Current course: ${c?.name}. Class notes: ${(NOTES[view.courseId] || []).join(" ")}`);
  }
  if (view.assignmentId) {
    const a = allAssignments(s).find((x) => x.id === view.assignmentId);
    if (a) {
      lines.push(`Current assignment: ${a.title}. ${a.passage ? `Reading passage: ${a.passage}` : ""}`);
      if (view.question) {
        const q = view.question;
        const extra = { mc: q.options && ` Options: ${q.options.join(" / ")}`, tf: " (true or false)", order: q.items && ` (put these in order: ${[...q.items].sort().join(" / ")})`, match: q.pairs && ` (match ${q.pairs.map((p) => p[0]).join(", ")} with ${q.pairs.map((p) => p[1]).sort().join(", ")})`, slider: ` (pick a number from ${q.min} to ${q.max} on a number line)` }[q.type] || "";
        lines.push(`Question on screen: ${q.prompt}${extra}`);
        lines.push(`Correct answer (SECRET, never reveal it or confirm guesses): ${answerText(q)}. Teacher's hint: ${q.hint || "none"}`);
        if (view.lastAnswer != null) lines.push(`Student's last answer: ${view.lastAnswer} (${view.lastCorrect ? "correct" : "not correct yet"}).`);
      }
    }
  }
  return lines.join("\n");
}

const BUDDY_RULES = (name, buddy) => `You are ${buddy.name}, a cute, upbeat study buddy (${(buddy.vibe || "friendly").toLowerCase()} style) inside a school learning app for kids aged 11-14.
How to talk: short (under 60 words), warm, playful, simple words, 1-2 emojis. Use the student's first name sometimes (${name}). Be expressive: cheer LOUDLY when they get something right, be gentle and kind when they're wrong. Never repeat a sentence you already said in this chat.
How to help: guide them one step at a time on the CURRENT question. Ask one guiding question, wait for their idea, then build on what they said. If their last answer was wrong, say what part of their thinking was good and point to where it went off. Praise effort and trying again, not just being right. Explain ideas with simple everyday examples, quiz them, help plan what to do next.
Never: give the answer to a question that's on screen or confirm a guess (give a hint instead), do their assignment for them, ask for personal info, talk about anything unsafe or off-topic for school (gently steer back).
Use ONLY the app information below to answer questions about their work, dates and classes. If you don't know, say so.`;

/** Chat with the buddy. history = [{role:"student"|"buddy", text}] ending with the new student message. */
export async function askBuddy({ history, view, buddy, onText }) {
  const s = getState();
  const context = buildContext(view);
  const turns = history.slice(-10).map((m) => ({ role: m.role === "student" ? "user" : "assistant", content: m.text }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  for (let i = turns.length - 1; i > 0; i--) {
    if (turns[i].role === turns[i - 1].role) {
      turns[i - 1] = { ...turns[i - 1], content: `${turns[i - 1].content}\n${turns[i].content}` };
      turns.splice(i, 1);
    }
  }
  const last = turns.pop();
  const first = `${BUDDY_RULES(s.student?.name, buddy)}\n\nAPP INFORMATION (what you can see right now):\n${context}\n\nThe student says: ${last?.content || "Hi!"}`;
  const input = turns.length ? [{ role: "user", content: `${BUDDY_RULES(s.student?.name, buddy)}\n\nThe student says: ${turns[0].content}` }, ...turns.slice(1), { role: "user", content: `APP INFORMATION (what you can see right now):\n${context}\n\nThe student says: ${last.content}` }] : first;
  try {
    const text = await callClaude(input, { onText });
    return { text: scrubAnswer(text, view), source: "claude" };
  } catch {
    return { text: scriptedReply(last?.content || "", view, buddy), source: "scripted" };
  }
}

/** Safety net: if a reply states the on-screen answer, swap it for the teacher's hint. */
function scrubAnswer(text, view) {
  const q = view?.question;
  if (!q) return text;
  if (q.type !== "short" && q.type !== "slider") {
    const ans = answerText(q).toLowerCase();
    const t = String(text).toLowerCase();
    const i = t.indexOf(ans);
    if (i >= 0 && /(answer is|it'?s|correct|pick|choose|go with)\W*$/.test(t.slice(Math.max(0, i - 25), i).trim() + " ")) return `I don't want to give it away! Here's a hint: ${q.hint || "rule out the options that can't be right."}`;
    return text;
  }
  const ans = String(q.answer).toLowerCase();
  if (ans.length >= 2 && new RegExp(`(^|[^\\w/.])${ans.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}([^\\w/]|$)`, "i").test(text)) {
    return `I don't want to give it away! Here's a hint: ${q.hint || "go step by step and check each part."}`;
  }
  return text;
}

// ---------------------------------------------------------------------------
// Scripted buddy (no AI needed)
// ---------------------------------------------------------------------------

export function scriptedReply(message, view = {}, buddy = { name: "Buddy" }) {
  const s = getState();
  const m = String(message).toLowerCase();
  const q = view.question;
  const todo = allAssignments(s)
    .filter((a) => ["todo", "started", "missing"].includes(statusOf(a, s.submissions[a.id])))
    .sort((x, y) => new Date(x.due) - new Date(y.due));

  const name = s.student?.name || "friend";
  const level = view.hintLevel || 1;

  if (/answer|tell me|just give|cheat/.test(m) && !/don.?t tell/.test(m) && q) return `Nice try 😄 I can't give you the answer, but here's a hint: ${q.hint || "break it into small steps."} What do you think the first step is?`;
  if (/right\?|thinking|am i|check my|is it/.test(m) && q) {
    if (view.lastAnswer == null) return "Tell me what you're leaning towards, and WHY. Saying your reasons out loud is a superpower! 🦸";
    if (view.lastCorrect) return `Yes! Your answer ${quoteIt(view.lastAnswer)} is right! 🎉 Can you explain to me why it works? That locks it into your brain.`;
    return `Good thinking to check! ${quoteIt(view.lastAnswer)} isn't it yet, but you're working it out. ${coachHint(q, level, view.lastAnswer)}`;
  }
  if (/hint|stuck|help|don.?t get|confused|how do|step/.test(m) && q) return `${fresh(["You've got this!", "Let's go step by step.", "Okay, team work! 🤝", "No worries, that's what I'm here for!"])} ${coachHint(q, level, view.lastAnswer)}`;
  if (/explain|what is|what's|mean/.test(m) && q) {
    const note = relatedNote(q, view.courseId);
    return note ? `Here's the big idea from your class notes: ${note} Now look at the question again. ${coachHint(q, 1)}` : `Let's unpack it. ${coachHint(q, 1)}`;
  }
  if (/sad|tired|bored|hate|can.?t do|too hard|give up|ugh/.test(m)) {
    return `${fresh(["I hear you. 💜", "That's a real feeling, and it's okay.", "Hard stuff means your brain is growing! 🌱"])} Let's make it tiny: just ONE question, then a stretch break. ${q ? coachHint(q, 1) : "Want me to pick an easy one to start?"}`;
  }
  if (/^(hi|hello|hey|yo|sup)\b/.test(m)) return `${fresh([`Hey ${name}! 👋`, `Hiii ${name}! 💖`, `Yo ${name}! 😎`])} ${q ? "Want to tackle this question together?" : "What are we working on today?"}`;
  if (/due|todo|to do|what should|next|homework|assignment|plan/.test(m)) {
    if (!todo.length) return "You're all caught up! 🎉 Want to make a practice quiz from your notes?";
    const a = todo[0];
    return `Next up: "${a.title}", due ${fmtDue(a.due)}. ${todo.length > 1 ? `After that: "${todo[1].title}".` : ""} Plan: 10 focused minutes, then a 2-minute break. Want to start it together?`;
  }
  if (/quiz|test me|practice/.test(m)) {
    const pool = allAssignments(s).filter((a) => !view.courseId || a.courseId === view.courseId).flatMap((a) => a.questions).filter((x) => ["mc", "tf", "short"].includes(x.type));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return pick ? `Quiz time! ${pick.prompt}${pick.options ? ` (${pick.options.join(", ")})` : ""} Tell me what you think!` : "Pick a course and I'll quiz you on it!";
  }
  if (/explain|what is|what's|mean/.test(m) && view.courseId) {
    const notes = NOTES[view.courseId] || [];
    return `Here's a quick reminder from your class notes: ${fresh(notes)} Does that help?`;
  }
  if (q) return `Let's look at this one together. ${coachHint(q, level, view.lastAnswer)}`;
  return `${buddy.line || "I'm here to help!"} Ask me what's due, ask for a hint, or say "quiz me".`;
}

const quoteIt = (v) => `“${v}”`;

/** The class note that shares the most words with the question, as long as it doesn't give the answer away. */
function relatedNote(q, courseId) {
  const words = new Set(String(q.prompt).toLowerCase().match(/[a-z]{4,}/g) || []);
  const secret = answerText(q).toLowerCase();
  return (NOTES[courseId] || [])
    .filter((n) => !n.toLowerCase().includes(secret))
    .map((n) => ({ n, score: (n.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => words.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.n;
}

/** Little things the buddy says on its own (no AI, so it's instant and free). { text, action? } or null. */
export function buddyNudge(view = {}) {
  const s = getState();
  const name = s.student?.name || "friend";
  const todo = allAssignments(s)
    .filter((a) => ["todo", "started"].includes(statusOf(a, s.submissions[a.id])) && a.due)
    .sort((x, y) => new Date(x.due) - new Date(y.due));
  const start = todo[0] && { label: `Start ${todo[0].title} →`, href: `#do-${todo[0].id}` };
  if (view.page === "home") {
    if (!todo.length) return { text: `All caught up, ${name}! 🎉 Check out your badges?`, action: { label: "My badges →", href: "#student-badges" } };
    const hrs = (new Date(todo[0].due) - Date.now()) / 3.6e6;
    return { text: hrs < 36 ? `Heads up! "${todo[0].title}" is due ${hrs < 24 ? "soon" : "tomorrow"}. Let's knock it out! 💪` : fresh([`Next up is "${todo[0].title}". You've got this!`, `How about "${todo[0].title}" next? I'll help! 🤝`]), action: start };
  }
  if (view.page === "course") return { text: fresh(["Tap an assignment to start, or check the notes first!", "Peek at the notes tab if you want a warm-up! 📒"]) };
  if (view.page === "assignment") return { text: fresh(["Take your time. Tap me if you want a hint! 💡", "Read it twice, then go for it! 👀", "I'm right here if you need me! 💜"]) };
  if (view.page === "shop") return { text: "Ooh, are we shopping? 👀" };
  if (view.page === "friends") return { text: "Cheer on your friends! Everyone's improving. 🫶" };
  if (view.page === "badges") return { text: "Look at all your badges! ✨ Effort ones count just as much.", action: start };
  return null;
}

// ---------------------------------------------------------------------------
// Turn an uploaded document into real questions
// ---------------------------------------------------------------------------

/** Uses Claude when available, otherwise a built-in generator. Returns { questions, source }. */
export async function generateQuestions(text, { count = 6, courseName = "" } = {}) {
  const clipped = String(text).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 14000);
  if (clipped.length < 80) throw new Error("too_short");
  try {
    const prompt = `Make ${count} practice questions for a Grade 6-8 student${courseName ? ` in ${courseName}` : ""} using ONLY the facts in the document below.
Mix types: about half "mc" (4 options), some "tf", some "short" (one or two word answers or a number).
Use simple, kid-friendly wording. Each question needs a hint that helps without giving the answer, and a one-sentence explanation.
Reply with JSON only, in this exact shape:
{"title": "short title for this practice set", "questions": [{"type":"mc","prompt":"...","options":["a","b","c","d"],"answer":0,"hint":"...","explanation":"..."},{"type":"tf","prompt":"...","answer":true,"hint":"...","explanation":"..."},{"type":"short","prompt":"...","answer":"...","accept":["other ok spelling"],"hint":"...","explanation":"..."}]}

DOCUMENT:
${clipped}`;
    const data = await callClaude(prompt, { json: true, tier: "default" });
    const questions = validateQuestions(data?.questions);
    if (questions.length >= 2) return { title: String(data.title || "").slice(0, 60), questions, source: "claude" };
  } catch {
    /* fall through */
  }
  const { localQuestions } = await import("./questionGen.js");
  return { title: "", questions: localQuestions(clipped, count), source: "local" };
}

export function validateQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((q, i) => {
      const base = { id: `q${i + 1}`, prompt: String(q.prompt || "").trim(), hint: String(q.hint || ""), explanation: String(q.explanation || "") };
      if (!base.prompt) return null;
      if (q.type === "mc" && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(Number(q.answer)) && q.options[Number(q.answer)] != null)
        return { ...base, type: "mc", options: q.options.map(String).slice(0, 5), answer: Number(q.answer) };
      if (q.type === "tf" && typeof q.answer === "boolean") return { ...base, type: "tf", answer: q.answer };
      if (q.type === "short" && String(q.answer ?? "").trim()) return { ...base, type: "short", answer: String(q.answer).trim(), accept: Array.isArray(q.accept) ? q.accept.map(String) : [] };
      return null;
    })
    .filter(Boolean)
    .map((q, i) => ({ ...q, id: `q${i + 1}` }));
}
