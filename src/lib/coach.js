// What the study buddy says on its own: greetings, cheers, gentle "not yet"s, and real step-by-step
// help for the question on screen. It never states the answer. Lines rotate so it doesn't repeat itself.
import { parseNumber } from "./grading.js";

const recent = [];
/** Random pick that avoids the last few lines used anywhere. */
export function fresh(list) {
  const unused = list.filter((x) => !recent.includes(x));
  const pool = unused.length ? unused : list;
  const v = pool[Math.floor(Math.random() * pool.length)];
  recent.push(v);
  if (recent.length > 12) recent.shift();
  return v;
}

export function partOfDay(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return { word: "evening", emoji: "🌙" };
  if (h < 12) return { word: "morning", emoji: "☀️" };
  if (h < 17) return { word: "afternoon", emoji: "🌤️" };
  return { word: "evening", emoji: "🌙" };
}
export function greeting(name, date = new Date()) {
  const p = partOfDay(date);
  return `Good ${p.word}, ${name}! ${p.emoji}`;
}

export const CHEERS = ["YESSS! 🎉", "BOOM! Nailed it! 💥", "WOOHOO! 🙌", "You're on FIRE! 🔥", "BRAIN POWER! 🧠⚡", "GENIUS MOVE! ✨", "High five! ✋ You got it!", "THAT'S IT! 🥳", "Look at you GO! 🚀"];
const COMEBACKS = ["You didn't give up and you GOT IT! 💪", "See? Trying again WORKS! 🦘", "That's what learning looks like! 🌱", "Mistake → fixed! That's brain growth! 🧠", "Persistence pays off! 🏆"];
const OOPS = ["Oh no, not quite 🥺", "Hmm, not yet!", "Ooh, so close!", "Not this time…", "Almost there!"];
const KEEP_GOING = ["Mistakes help your brain grow. 🌱", "You can totally do this. 💜", "Every try teaches you something.", "Let's figure it out together.", "Take a breath. You've got this."];

export function cheerFor({ tries = 1, streak = 0 }) {
  if (tries > 1) return fresh(COMEBACKS);
  if (streak >= 3 && streak % 3 === 0) return `${streak} in a row! 🔥🔥🔥`;
  return fresh(CHEERS);
}

const STOP = new Set("the a an and or but of to in on at for with by from as is are was were be this that these those it its which what when where why how does do did you your they their many much each other into than then there will would should could have has had".split(" "));
function keyWords(prompt) {
  return [...new Set(String(prompt).replace(/[^\w\s'-]/g, " ").split(/\s+/).filter((w) => w.length >= 5 && !STOP.has(w.toLowerCase())))].slice(0, 3);
}
const quote = (s) => `“${s}”`;

/**
 * Step-by-step help for the question on screen. level 1 = slow down and find the key words,
 * 2 = the teacher's hint, 3+ = a bigger nudge that still leaves the last step to the student.
 */
export function coachHint(q, level = 1, lastValue) {
  if (!q) return "Pick a question and I'll help you think it through!";
  const closer = closerLine(q, lastValue);
  if (level <= 1) {
    const kw = keyWords(q.prompt);
    const start = { order: "Find the thing that has to happen first.", match: "Start with the pair you're most sure about.", slider: "Make a rough guess first: is it closer to the start or the end?", tf: "Is there one word that could make it false?", mc: "Read every option before you pick.", short: "What is the question really asking for: a number, a word, a name?" }[q.type];
    return `${closer}Step 1: read it slowly.${kw.length ? ` The key words are ${kw.map(quote).join(", ")}.` : ""} ${start}`;
  }
  if (level === 2) return `${closer}Step 2: ${q.hint || "break it into smaller pieces and do one at a time."}`;
  return `${closer}Step 3: ${biggerNudge(q, lastValue)}`;
}

/** "Your answer is a bit too high", for number answers. Real feedback without the answer. */
function closerLine(q, lastValue) {
  if (lastValue == null || lastValue === "") return "";
  const ans = q.type === "slider" ? Number(q.answer) : q.type === "short" ? parseNumber(q.answer) : null;
  const v = q.type === "slider" ? Number(lastValue) : parseNumber(lastValue);
  if (ans == null || v == null || Number.isNaN(v) || Math.abs(v - ans) < 1e-9) return "";
  return `${v > ans ? "Your answer is too high" : "Your answer is too low"}${Math.abs(v - ans) <= Math.abs(ans) * 0.15 + (q.step || 0) * 3 ? ", but close!" : "."} `;
}

function biggerNudge(q, lastValue) {
  if (q.type === "mc") {
    const picked = pickedIndex(q, lastValue);
    const pickedWrong = picked >= 0 && picked !== q.answer;
    const wrong = q.options.map((o, i) => i).filter((i) => i !== q.answer && i !== picked);
    if (!wrong.length) return "You've already ruled one out, so there's only one left. Read it again: does it fit?";
    const cross = wrong[Math.floor(Math.random() * wrong.length)];
    const left = q.options.length - 1 - (pickedWrong ? 1 : 0);
    return `Cross off ${quote(q.options[cross])}. It can't be right.${pickedWrong ? ` And ${quote(q.options[picked])} is out too.` : ""} That leaves ${left} to choose from. Which one fits best?`;
  }
  if (q.type === "tf") return "Try to prove it wrong with one example. If you can't, it's probably true. If you can, it's false.";
  if (q.type === "order") return `Here's a free one: ${quote(q.items[0])} comes first. What has to happen right after that?`;
  if (q.type === "match") return `Here's one pair to get you going: ${quote(q.pairs[0][0])} goes with ${quote(q.pairs[0][1])}. Now try the rest.`;
  if (q.type === "slider") {
    const span = (Number(q.max) - Number(q.min)) * 0.15;
    const lo = Math.max(Number(q.min), Math.floor((Number(q.answer) - span) / 5) * 5);
    const hi = Math.min(Number(q.max), Math.ceil((Number(q.answer) + span) / 5) * 5);
    return `It's somewhere between ${lo} and ${hi}. Slide into that zone and think about which end it's nearer.`;
  }
  const ans = String(q.answer);
  if (parseNumber(ans) != null) return "Write down each step on paper. Do the first operation, then check if your number makes sense in real life.";
  return `The answer starts with ${quote(ans[0].toUpperCase())} and has ${ans.replace(/\s/g, "").length} letters.`;
}

/** The player passes the option index; the chat passes the option text. */
function pickedIndex(q, v) {
  if (v == null || v === "") return -1;
  if (typeof v === "number") return v;
  const i = q.options.indexOf(v);
  return i >= 0 ? i : /^\d+$/.test(v) ? Number(v) : -1;
}

/** After a wrong answer: a little sad, then actually helpful. */
export function notYet(q, tries, lastValue) {
  return `${fresh(OOPS)} ${fresh(KEEP_GOING)} ${coachHint(q, Math.min(tries, 3), lastValue)}`;
}

/** When a new question appears. Only speaks up when it's useful. */
export function questionIntro(q, idx, total) {
  if (q.type === "order") return "Ooh, a puzzle! 🧩 Use the arrow buttons to put these in order.";
  if (q.type === "match") return "Matching time! 🔗 Pick a partner for each one.";
  if (q.type === "slider") return "Slide the marker along the number line! 🎚️ Use the arrow keys for small steps.";
  if (idx === total - 1 && total > 1) return fresh(["Last one! 🏁 Finish strong!", "Final question! 🎯 You've got this!"]);
  if (idx === Math.floor(total / 2) && total > 3) return fresh(["Halfway there! 🎯", "Half done already! 🙌 Keep it up!"]);
  return null;
}

/** Tries to get the student's attention after they've gone quiet. */
export function attentionLine(view, name, nth = 0) {
  if (view.page === "assignment" && view.question) {
    return fresh([`Psst, ${name}! 👋 Stuck? I can give you the first step.`, `Hellooo! 🙋 Want to try this one together, ${name}?`, "Knock knock! 🚪 Need a tiny hint?"]);
  }
  if (nth > 0) return fresh([`Still there, ${name}? 👀 I miss you!`, `${name}? I'm getting lonely over here! 🥺`]);
  return fresh([`Hey ${name}! 👋 Want me to pick what to do next?`, `Psst! 👋 I've got an idea for what to do next, ${name}.`, "Yoo-hoo! 🎈 Ready for a quick win?"]);
}
