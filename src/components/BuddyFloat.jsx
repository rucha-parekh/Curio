import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Buddy from "./Buddy.jsx";
import { BUDDIES } from "../lib/seed.js";
import { askBuddy, buddyNudge, aiAvailable } from "../lib/ai.js";
import { greeting, attentionLine, fresh } from "../lib/coach.js";
import { earnedBadges } from "../lib/badges.js";
import { streakInfo } from "../lib/streak.js";
import { speak, stopSpeaking } from "../lib/speech.js";
import { playSfx } from "../lib/sfx.js";
import { STARS } from "../lib/grading.js";
import { useStore, getState, addBuddyMessage, applyStreakFreezes, markBadgesSeen, setA11y } from "../lib/store.js";
import { ReadAloud, VoicePicker } from "./ui.jsx";

const Ctx = createContext({ setView: () => {}, say: () => {}, open: () => {} });
export const useBuddy = () => useContext(Ctx);

// Each mood has a body animation. Hearts float up when the buddy is happy.
const ANIM = { cheer: "buddy-cheer", wow: "buddy-cheer", sad: "buddy-sad", wave: "buddy-attention", twirl: "buddy-twirl" };
const SFX = { cheer: "cheer", wow: "cheer", sad: "sad", wave: "wave" };
const BUDDY_W = 86; // button around a 78px buddy
const BUDDY_H = 104;
// Quiet for this long → the buddy waves to get attention. Then waits longer each time, and gives up after the last.
const IDLE_STEPS = [45_000, 90_000, 180_000];

/** Wrap the student site. Pages call setView({...}) so the buddy knows what's on screen. */
export function BuddyProvider({ children }) {
  const [view, setViewState] = useState({ page: "home" });
  const [bubble, setBubble] = useState(null);
  const [anim, setAnim] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const timer = useRef(null);
  const moodTimer = useRef(null);
  const voiceTimer = useRef(null);
  const quietUntil = useRef(0); // greeting time: page nudges wait
  const viewRef = useRef(view);
  const panelRef = useRef(panelOpen);
  viewRef.current = view;
  panelRef.current = panelOpen;

  /** Sound effect for the mood, then the buddy says the line out loud (unless muted). */
  const voiceLine = useCallback((text, sfx) => {
    const { muted, voice } = getState().a11y;
    clearTimeout(voiceTimer.current);
    if (muted) return;
    if (sfx) playSfx(sfx);
    voiceTimer.current = setTimeout(
      () => speak(text, { voice, onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) }),
      sfx === "twirl" ? 1100 : sfx === "cheer" || sfx === "badge" ? 450 : 250,
    );
  }, []);

  /** say(text, mood, ms, { shout, action: {label, href} | {label, ask}, anim, hearts, sfx }) */
  const say = useCallback((text, mood = "talk", ms = 7000, opts = {}) => {
    if (!text) return;
    clearTimeout(timer.current);
    clearTimeout(moodTimer.current);
    const key = `${Date.now()}-${Math.random()}`;
    setBubble({ text, mood, key, shout: !!opts.shout, action: opts.action, hearts: opts.hearts ?? (mood === "cheer" || mood === "wow") });
    const cls = ANIM[opts.anim || mood];
    setAnim(cls ? { cls, key } : null);
    // A little sad for a moment, then back to helping.
    if (mood === "sad") moodTimer.current = setTimeout(() => setBubble((b) => (b?.key === key ? { ...b, mood: "talk" } : b)), 2200);
    timer.current = setTimeout(() => setBubble(null), ms);
    voiceLine(text, opts.sfx || (opts.anim === "twirl" ? "twirl" : SFX[mood] || "pop"));
  }, [voiceLine]);
  const setView = useCallback((v) => setViewState((old) => (JSON.stringify(old) === JSON.stringify(v) ? old : v)), []);
  const open = useCallback((question) => {
    setBubble(null);
    setPanelOpen(true);
    if (question) setPendingAsk({ text: question, key: Date.now() });
  }, []);

  // Signing in: twirl, say good morning/afternoon/evening, and share streak news.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const freeze = applyStreakFreezes();
    const st = getState().student;
    const streak = streakInfo(st).current;
    const news = freeze.used
      ? `Your streak freeze 🧊 saved your ${freeze.saved}-day streak!`
      : freeze.broken
        ? "New day, fresh start! 🌱 Let's begin a new streak together."
        : streak >= 2
          ? `${streak}-day streak! 🔥 Let's keep it going!`
          : fresh(["Ready to learn something cool?", "Let's make today awesome!", "I missed you! 💖"]);
    quietUntil.current = Date.now() + 7500;
    say(`${greeting(st.name)} ${news}`, "cheer", 8000, { anim: "twirl", hearts: true });
  }, [say]);

  // Say something small when the student lands on a new page.
  const lastPage = useRef(null);
  useEffect(() => {
    const k = `${view.page}:${view.courseId || ""}:${view.assignmentId || ""}`;
    if (lastPage.current === k) return;
    lastPage.current = k;
    if (Date.now() >= quietUntil.current) setBubble(null);
    const t = setTimeout(() => {
      if (Date.now() < quietUntil.current) return;
      const n = buddyNudge(view);
      if (n) say(n.text, "talk", 7000, { action: n.action });
    }, 900);
    return () => clearTimeout(t);
  }, [view, say]);

  // New badge? Celebrate it (after the greeting is done).
  const student = useStore((s) => s.student);
  useEffect(() => {
    const s = getState();
    const fresh = earnedBadges(s).filter((b) => !s.student.seenBadges.includes(b.id));
    if (!fresh.length) return;
    const t = setTimeout(() => {
      markBadgesSeen(fresh.map((b) => b.id));
      say(`NEW BADGE! ${fresh.map((b) => `${b.icon} ${b.name}`).join(", ")}! +${STARS.badge * fresh.length} stars`, "cheer", 7000, { shout: true, sfx: "badge", action: { label: "See my badges →", href: "#student-badges" } });
    }, Math.max(1600, quietUntil.current - Date.now()));
    return () => clearTimeout(t);
  }, [student, say]);

  // Gone quiet? Wave and try to get the student's attention, with something useful to do.
  useEffect(() => {
    let last = Date.now();
    let step = 0;
    const poke = () => {
      last = Date.now();
      step = 0;
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    const iv = setInterval(() => {
      if (document.hidden || panelRef.current || step >= IDLE_STEPS.length || Date.now() - last < IDLE_STEPS[step]) return;
      const v = viewRef.current;
      const onQuestion = v.page === "assignment" && v.question;
      const action = onQuestion ? { label: "Yes, help me!", ask: "I'm stuck. Can you give me the first step?" } : buddyNudge({ page: "home" })?.action;
      say(attentionLine(v, getState().student?.name || "friend", step), "wave", 10000, { action });
      step++;
      last = Date.now();
    }, 3000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, poke));
      clearInterval(iv);
    };
  }, [say]);

  return (
    <Ctx.Provider value={{ setView, say, open, view, voiceLine }}>
      {children}
      <BuddyFloat
        view={view}
        bubble={bubble}
        anim={anim}
        speaking={speaking}
        onCloseBubble={() => {
          setBubble(null);
          stopSpeaking();
        }}
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        pendingAsk={pendingAsk}
        open={open}
      />
    </Ctx.Provider>
  );
}

const HEARTS = [["💖", -40, "-20deg", 0], ["💕", 30, "15deg", 0.12], ["✨", -10, "0deg", 0.28], ["💗", 44, "25deg", 0.4], ["⭐", -30, "-12deg", 0.55], ["💖", 14, "10deg", 0.75]];
function Hearts() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {HEARTS.map(([e, dx, rot, delay], i) => (
        <span key={i} className="heart text-2xl" style={{ left: `${30 + (i % 3) * 14}%`, "--dx": `${dx}px`, "--rot": rot, animationDelay: `${delay}s` }}>{e}</span>
      ))}
    </span>
  );
}

/**
 * Where the buddy stands. On a question it glides next to the question card (the page puts an
 * element with id="buddy-dock" there). Anywhere else, or when there's no room, it sits in the corner.
 */
function useBuddySpot(page) {
  const [spot, setSpot] = useState(() => cornerSpot());
  useEffect(() => {
    let raf;
    const measure = () => {
      const el = page === "assignment" && document.getElementById("buddy-dock");
      let next = cornerSpot();
      if (el) {
        const r = el.getBoundingClientRect();
        const left = r.right + 10;
        const room = window.innerWidth - left;
        if (room >= BUDDY_W + 8 && r.bottom > 0 && r.top < window.innerHeight) {
          next = { left, top: Math.min(Math.max(r.top, 12), window.innerHeight - BUDDY_H - 12), docked: true, room };
        }
      }
      setSpot((s) => (s.left === next.left && Math.abs(s.top - next.top) < 1 && s.docked === next.docked ? s : next));
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [page]);
  return spot;
}
function cornerSpot() {
  if (typeof window === "undefined") return { left: 0, top: 0, docked: false };
  const pad = window.innerWidth >= 640 ? 20 : 12;
  return { left: window.innerWidth - BUDDY_W - pad, top: window.innerHeight - BUDDY_H - pad, docked: false };
}

function BuddyFloat({ view, bubble, anim, speaking, onCloseBubble, panelOpen, setPanelOpen, pendingAsk, open }) {
  const student = useStore((s) => s.student);
  const muted = useStore((s) => s.a11y.muted);
  const reduceMotion = useStore((s) => s.a11y.reduceMotion);
  const buddy = BUDDIES.find((b) => b.id === student?.buddy) || BUDDIES[0];
  const btnRef = useRef(null);
  const spot = useBuddySpot(view.page);
  const actionCls = "inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-sm font-bold text-on-brand no-underline";

  // Mouth moves while the buddy is talking out loud.
  const [flap, setFlap] = useState(false);
  useEffect(() => {
    if (!speaking) return setFlap(false);
    const iv = setInterval(() => setFlap((f) => !f), 170);
    return () => clearInterval(iv);
  }, [speaking]);
  const base = bubble ? bubble.mood : "happy";
  const mood = speaking && ["talk", "happy", "wow", "wave"].includes(base) ? (flap ? "talk" : "happy") : base;
  const bubbleWidth = spot.docked ? Math.max(170, Math.min(250, spot.room - 20)) : 250;

  return (
    <>
      {panelOpen && (
        <div className="pointer-events-none fixed bottom-0 right-0 z-50 p-3 sm:p-5" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <ChatPanel
            buddy={buddy}
            student={student}
            view={view}
            pendingAsk={pendingAsk}
            onClose={() => {
              setPanelOpen(false);
              btnRef.current?.focus();
            }}
          />
        </div>
      )}
      <div
        className="pointer-events-none fixed z-50"
        style={{ left: spot.left, top: spot.top, transition: reduceMotion ? "none" : "left .7s cubic-bezier(.3,1.25,.5,1), top .7s cubic-bezier(.3,1.25,.5,1)" }}
      >
        <div className="relative">
          {bubble && !panelOpen && (
            <div
              key={bubble.key}
              role="status"
              style={{ width: bubbleWidth }}
              className={`pointer-events-auto absolute p-3.5 pr-9 shadow-[0_10px_30px_-10px_rgba(36,31,58,.35)] ${spot.docked ? "left-1 top-full mt-1 rounded-3xl rounded-tl-md" : "bottom-full right-2 mb-1 rounded-3xl rounded-br-md"} ${bubble.shout ? "shout bg-butter font-display text-xl leading-tight text-pastel-ink" : "pop bg-card text-[0.95rem] font-semibold"}`}
            >
              {bubble.text}
              <span className="mt-2 flex flex-wrap items-center gap-2">
                {bubble.action?.href && <a href={bubble.action.href} onClick={onCloseBubble} className={actionCls}>{bubble.action.label}</a>}
                {bubble.action?.ask && <button type="button" onClick={() => open(bubble.action.ask)} className={actionCls}>{bubble.action.label}</button>}
                {muted && <ReadAloud text={bubble.text} compact label="Read this message aloud" />}
              </span>
              <button type="button" onClick={onCloseBubble} aria-label="Hide message" className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full opacity-70 hover:bg-soft hover:opacity-100">
                ×
              </button>
            </div>
          )}
          <button
            ref={btnRef}
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            aria-expanded={panelOpen}
            aria-label={`${panelOpen ? "Close" : "Open"} chat with ${buddy.name}, your study buddy`}
            className="pointer-events-auto relative block rounded-full p-1 transition hover:scale-105"
          >
            {bubble?.hearts && !panelOpen && <Hearts key={`hearts-${bubble.key}`} />}
            <span key={`anim-${anim?.key}`} className={`block ${anim?.cls || ""}`}>
              <span className={`block drop-shadow-[0_8px_10px_rgba(36,31,58,.25)] ${panelOpen ? "" : "buddy-float"}`}>
                <Buddy id={buddy.id} equipped={student?.equipped} mood={mood} size={78} />
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setA11y({ muted: !muted });
              if (!muted) stopSpeaking();
              else playSfx("pop");
            }}
            aria-pressed={muted}
            aria-label={muted ? `Unmute ${buddy.name}` : `Mute ${buddy.name}`}
            title={muted ? "Unmute" : "Mute"}
            className="pointer-events-auto absolute -left-2 bottom-0 grid h-9 w-9 place-items-center rounded-full border-2 border-line bg-card text-base shadow-sm hover:bg-soft"
          >
            <span aria-hidden="true">{muted ? "🔇" : speaking ? "🔊" : "🔈"}</span>
          </button>
        </div>
      </div>
    </>
  );
}

function chips(view) {
  if (view.page === "assignment" && view.question) return ["Give me a hint", "Explain this to me", "Is my thinking right?"];
  if (view.page === "course") return ["Quiz me on this class", "Explain the notes", "What's due here?"];
  return ["What's due next?", "Help me plan my study time", "Quiz me"];
}

function ChatPanel({ buddy, student, view, pendingAsk, onClose }) {
  const chat = useStore((s) => s.buddyChat);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [smart, setSmart] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const levels = useRef({}); // how far into step-by-step help we are, per question
  const { voiceLine } = useBuddy();

  useEffect(() => {
    inputRef.current?.focus();
    aiAvailable().then(setSmart);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat.length, streaming]);

  const send = useCallback(
    async (text) => {
      const msg = text.trim().slice(0, 400);
      if (!msg || busy) return;
      setDraft("");
      addBuddyMessage({ role: "student", text: msg });
      setBusy(true);
      setStreaming("");
      // Each time they ask about the same question, the help goes one step further.
      const qid = view.question && `${view.assignmentId}:${view.question.id}`;
      const hintLevel = qid ? (levels.current[qid] = (levels.current[qid] || 0) + 1) : undefined;
      const history = [...chat, { role: "student", text: msg }];
      const r = await askBuddy({ history, view: { ...view, hintLevel }, buddy, onText: setStreaming });
      setStreaming("");
      setBusy(false);
      addBuddyMessage({ role: "buddy", text: r.text, source: r.source });
      if (r.source === "scripted") setSmart(false);
      voiceLine(r.text, "pop");
    },
    [busy, chat, view, buddy, voiceLine],
  );

  const lastAsk = useRef(null);
  useEffect(() => {
    if (pendingAsk && pendingAsk.key !== lastAsk.current) {
      lastAsk.current = pendingAsk.key;
      send(pendingAsk.text);
    }
  }, [pendingAsk, send]);

  return (
    <div role="dialog" aria-label={`Chat with ${buddy.name}`} className="pop pointer-events-auto flex h-[min(34rem,72vh)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] bg-card shadow-[0_20px_60px_-15px_rgba(36,31,58,.45)]">
      <div className="pastel flex items-center gap-3 bg-lilac px-4 py-3">
        <Buddy id={buddy.id} equipped={student?.equipped} size={44} mood={busy ? "talk" : "happy"} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight">{buddy.name}</p>
          <p className="muted text-xs">{smart === false ? "Simple mode (AI not connected)" : "Your study buddy · powered by Claude"}</p>
        </div>
        <VoicePicker className="bg-white/70" />
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-xl font-bold hover:bg-white">
          ×
        </button>
      </div>
      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-4" aria-live="polite">
        {chat.length === 0 && (
          <p className="rounded-3xl rounded-bl-md bg-soft p-3">
            {greeting(student?.name || "friend")} I'm {buddy.name}. {buddy.line} I can see your classes and assignments, so ask me anything about them. I'll help you step by step, but I won't just hand you the answer. 😉
          </p>
        )}
        {chat.map((m, i) => (
          <div key={i} className={`flex items-end gap-1.5 ${m.role === "student" ? "justify-end" : ""}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-3xl p-3 ${m.role === "student" ? "rounded-br-md bg-brand text-on-brand" : "rounded-bl-md bg-soft"}`}>
              <span className="sr-only">{m.role === "student" ? "You: " : `${buddy.name}: `}</span>
              {m.text}
            </p>
            {m.role === "buddy" && <ReadAloud text={m.text} compact label="Read this message aloud" />}
          </div>
        ))}
        {busy && <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-bl-md bg-soft p-3 text-ink-2">{streaming || "Thinking…"}</p>}
      </div>
      <div className="border-t border-line p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {chips(view).map((c) => (
            <button key={c} type="button" disabled={busy} onClick={() => send(c)} className="shrink-0 rounded-full bg-butter px-3 py-1.5 text-sm font-bold text-pastel-ink disabled:opacity-50">
              {c}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label htmlFor="buddy-input" className="sr-only">Message {buddy.name}</label>
          <input
            id="buddy-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your work…"
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-line bg-card px-4 text-ink placeholder:text-ink-2"
          />
          <button type="submit" disabled={busy || !draft.trim()} aria-label="Send" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-on-brand disabled:opacity-40">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
        <p className="mt-1.5 px-1 text-[11px] text-ink-2">Don't share your address, phone or passwords. Your teacher can see how much you use your buddy.</p>
      </div>
    </div>
  );
}
