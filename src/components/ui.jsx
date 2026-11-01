// Shared building blocks: big friendly buttons, pastel cards, doodles, read-aloud and display settings.
import { useEffect, useRef, useState } from "react";
import { COURSES } from "../lib/seed.js";
import { canSpeak, speak, stopSpeaking, VOICES } from "../lib/speech.js";
import { useStore, getState, setTextSize, setA11y } from "../lib/store.js";

/** Girl / Boy voice switch for the study buddy. */
export function VoicePicker({ className = "" }) {
  const voice = useStore((s) => s.a11y.voice);
  return (
    <div role="radiogroup" aria-label="Buddy voice" className={`flex gap-1 rounded-full bg-soft p-1 ${className}`}>
      {Object.entries(VOICES).map(([id, v]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={voice === id}
          onClick={() => {
            setA11y({ voice: id, muted: false });
            speak(id === "boy" ? "Hey! This is my boy voice." : "Hi! This is my girl voice.", { voice: id });
          }}
          className={`min-h-9 rounded-full px-3 text-sm font-bold ${voice === id ? "bg-brand text-on-brand" : "text-ink"}`}
        >
          {id === "boy" ? "👦" : "👧"} {v.label}
        </button>
      ))}
    </div>
  );
}

export const COURSE_BG = { lilac: "bg-lilac", mint: "bg-mint", peach: "bg-peach", lagune: "bg-lagune", butter: "bg-butter", nectarine: "bg-nectarine" };
export const courseById = (id) => COURSES.find((c) => c.id === id);

export function Button({ variant = "primary", className = "", ...props }) {
  const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-brand text-on-brand hover:opacity-90",
    soft: "bg-soft text-ink hover:bg-line",
    outline: "border-2 border-ink/80 bg-transparent text-ink hover:bg-soft",
    pastel: "bg-butter text-pastel-ink hover:brightness-95",
    ghost: "text-ink hover:bg-soft px-4",
  };
  return <button type="button" className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", as: Tag = "section", ...props }) {
  return <Tag className={`rounded-[28px] bg-card p-5 sm:p-6 ${className}`} {...props} />;
}

export function Title({ children, script, as: Tag = "h1", className = "" }) {
  return (
    <Tag className={`font-display leading-[1.05] ${Tag === "h1" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"} ${className}`}>
      {children}
      {script && <span className="block font-hand text-[1.15em] font-bold leading-[.9] text-ink-2">{script}</span>}
    </Tag>
  );
}

export function Pill({ tone = "soft", children, className = "" }) {
  const t = {
    soft: "bg-soft text-ink",
    good: "bg-good-bg text-good",
    nudge: "bg-nudge-bg text-nudge",
    warn: "bg-butter text-pastel-ink",
    late: "bg-nectarine text-pastel-ink",
    white: "bg-white/80 text-pastel-ink",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold ${t[tone]} ${className}`}>{children}</span>;
}

export function Feedback({ tone, title, children }) {
  return (
    <div role="status" className={`pop mt-4 rounded-3xl p-4 ${tone === "good" ? "bg-good-bg" : "bg-nudge-bg"}`}>
      <p className={`font-display text-lg ${tone === "good" ? "text-good" : "text-nudge"}`}>{title}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x.id === value);
            if (e.key === "ArrowRight") onChange(tabs[(i + 1) % tabs.length].id);
            if (e.key === "ArrowLeft") onChange(tabs[(i - 1 + tabs.length) % tabs.length].id);
          }}
          className={`min-h-11 rounded-full px-5 font-bold transition ${value === t.id ? "bg-brand text-on-brand" : "bg-card text-ink hover:bg-soft"}`}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Doodles from the inspiration boards: a squiggle line and a chunky asterisk-flower. */
export function Squiggle({ className = "", color = "var(--mint-2)" }) {
  return (
    <svg className={className} viewBox="0 0 200 40" fill="none" aria-hidden="true">
      <path d="M4 26 C 24 2, 40 2, 52 22 S 84 40, 100 20 S 132 0, 148 20 S 180 38, 196 14" stroke={color} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
export function Blob({ className = "", color = "var(--lilac-2)" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M30 4c4 0 5 9 9 10s11-5 14-2-3 10-1 14 10 6 9 10-10 3-12 7 3 11-1 13-9-5-13-5-9 7-13 5-1-9-4-13-12-3-12-7 8-6 9-10-5-11-2-14 10 2 14 1 7-9 11-9z" fill={color} />
    </svg>
  );
}
export function Sparkle({ className = "", color = "var(--peach)" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2 C22 14 26 18 38 20 C26 22 22 26 20 38 C18 26 14 22 2 20 C14 18 18 14 20 2Z" fill={color} />
    </svg>
  );
}

export function StarCount({ n, className = "" }) {
  return (
    <span className={`tabular inline-flex items-center gap-1 font-bold ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="#FFD23F" stroke="#E0A800" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      {n}
      <span className="sr-only"> stars</span>
    </span>
  );
}

export function TextSizeToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-soft p-1" role="group" aria-label="Text size">
      {["Normal", "Large", "Extra large"].map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={value === i}
          aria-label={`${label} text`}
          title={`${label} text`}
          onClick={() => onChange(i)}
          className={`h-9 w-9 rounded-full font-display ${value === i ? "bg-card shadow-sm" : "text-ink-2"}`}
          style={{ fontSize: `${0.85 + i * 0.18}rem` }}
        >
          A
        </button>
      ))}
    </div>
  );
}

/** Speaker button. Reads `text` with the device's voice; press again to stop. */
export function ReadAloud({ text, label = "Read aloud", compact = false, className = "" }) {
  const [on, setOn] = useState(false);
  useEffect(() => () => on && stopSpeaking(), [on]);
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={compact ? (on ? "Stop reading" : label) : undefined}
      title={on ? "Stop reading" : label}
      onClick={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
        } else {
          setOn(true);
          speak(typeof text === "function" ? text() : text, { voice: getState().a11y.voice, onEnd: () => setOn(false) });
        }
      }}
      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full font-bold transition ${compact ? "h-10 w-10 justify-center" : "px-3.5 text-sm"} ${on ? "bg-brand text-on-brand" : "bg-soft text-ink hover:bg-line"} ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path d={on ? "M16 9l5 6M21 9l-5 6" : "M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      {!compact && (on ? "Stop" : label)}
    </button>
  );
}

/** "Aa" menu in every header: text size, dyslexia-friendly font, colour-safe palette, read-aloud, motion. */
export function A11yMenu() {
  const textSize = useStore((s) => s.textSize);
  const a = useStore((s) => s.a11y);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.open) return;
      if (e.type === "keydown" ? e.key === "Escape" : !ref.current.contains(e.target)) {
        ref.current.open = false;
        if (e.type === "keydown") ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  const toggles = [
    ["dyslexia", "Dyslexia-friendly font", "Rounder letters, more space between them"],
    ["colorSafe", "Colour-blind-safe colours", "Blue and orange instead of green and red"],
    ["reduceMotion", "Less motion", "Turns off bouncing and twirling"],
    ["muted", "Mute study buddy", "No talking or sound effects"],
  ];
  return (
    <details ref={ref} className="relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full bg-soft px-3.5 font-bold [&::-webkit-details-marker]:hidden" aria-label="Display and reading settings">
        <span className="font-display text-lg leading-none" aria-hidden="true">Aa</span>
        <span className="hidden text-sm lg:inline">Display</span>
      </summary>
      <div className="pop absolute right-0 z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-3 rounded-[24px] border border-line bg-card p-4 text-ink shadow-[0_20px_50px_-20px_rgba(36,31,58,.5)]">
        <div>
          <p className="text-sm font-bold">Text size</p>
          <div className="mt-1"><TextSizeToggle value={textSize} onChange={setTextSize} /></div>
        </div>
        {toggles.map(([k, label, help]) => (
          <label key={k} className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={!!a[k]} onChange={(e) => { setA11y({ [k]: e.target.checked }); if (k === "muted" && e.target.checked) stopSpeaking(); }} className="mt-1 h-5 w-5 shrink-0 accent-[var(--lilac-2)]" />
            <span><span className="block font-bold leading-tight">{label}</span><span className="text-sm text-ink-2">{help}</span></span>
          </label>
        ))}
        <div>
          <p className="text-sm font-bold">Buddy voice</p>
          <VoicePicker className="mt-1 w-fit" />
        </div>
        <p className="border-t border-line pt-2 text-xs text-ink-2">Keyboard: <kbd>Tab</kbd> to move, <kbd>Enter</kbd> or <kbd>Space</kbd> to choose, arrow keys in tabs and sliders, <kbd>Esc</kbd> to close.</p>
      </div>
    </details>
  );
}

/** Progress bar with the number written next to it (never colour alone). */
export function Meter({ value, max = 100, label, className = "", fill = "bg-mint-2", track = "bg-soft" }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className={className}>
      <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className={`h-3 overflow-hidden rounded-full ${track}`}>
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const fmtWhen = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

export const fmtDue = (iso) => {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const days = Math.round((new Date(d.toDateString()) - new Date(new Date().toDateString())) / 86400000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Was due yesterday";
  if (days < 0) return `Was due ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  if (days < 7) return `Due ${d.toLocaleDateString(undefined, { weekday: "long" })}`;
  return `Due ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};
export const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};
