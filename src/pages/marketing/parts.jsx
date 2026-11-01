// Pieces shared by the marketing pages.
import Buddy from "../../components/Buddy.jsx";
import { TESTIMONIALS, LOGOS } from "../../lib/marketing.js";

const BUDDY_FOR = ["nova", "zip", "kiko", "bao", "nova"];
const CARD_BG = ["bg-lilac", "bg-mint", "bg-butter", "bg-peach", "bg-lagune"];

export function SectionTitle({ id, children, script, sub }) {
  return (
    <div className="space-y-1">
      <h2 id={id} className="font-display text-3xl sm:text-4xl">
        {children}
        {script && <span className="ml-2 font-hand text-[1.15em] text-ink-2">{script}</span>}
      </h2>
      {sub && <p className="max-w-2xl text-ink-2">{sub}</p>}
    </div>
  );
}

/** Sample testimonials, to be replaced with real ones. Each card shows a visible "Sample" tag until then. */
export function Testimonials({ limit = TESTIMONIALS.length }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TESTIMONIALS.slice(0, limit).map((t, i) => (
        <li key={t.name} className={`pastel flex flex-col gap-3 rounded-[28px] p-5 ${CARD_BG[i % CARD_BG.length]}`}>
          <span className="w-fit rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">Sample</span>
          <blockquote className="flex-1 text-lg leading-snug">“{t.quote}”</blockquote>
          <p className="flex items-center gap-2">
            <span className="rounded-full bg-white/70"><Buddy id={BUDDY_FOR[i % BUDDY_FOR.length]} size={34} /></span>
            <span><b>{t.name}</b><span className="muted block text-sm">{t.role}</span></span>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Invented placeholder institutions drawn as monograms. Never real schools' names or logos. */
export function LogoWall() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" aria-label="Schools using Curio (placeholder logos)">
      {LOGOS.map((l) => (
        <li key={l.name} className="flex flex-col items-center gap-1.5 rounded-3xl bg-card p-3 text-center">
          <LogoMark {...l} />
          <span className="text-xs font-bold leading-tight text-ink-2">{l.name}</span>
        </li>
      ))}
    </ul>
  );
}

function LogoMark({ mark, color, shape }) {
  const bg = { circle: <circle cx="24" cy="24" r="22" fill={color} />, square: <rect x="3" y="3" width="42" height="42" rx="11" fill={color} />, shield: <path d="M24 2l20 7v13c0 12-9 21-20 24C13 43 4 34 4 22V9z" fill={color} /> }[shape];
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      {bg}
      <text x="24" y="29.5" textAnchor="middle" fontFamily="Fredoka, Nunito, sans-serif" fontWeight="600" fontSize="15" fill="#241f3a">{mark}</text>
    </svg>
  );
}
