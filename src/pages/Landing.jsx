import Buddy from "../components/Buddy.jsx";
import { Squiggle, Blob, Sparkle } from "../components/ui.jsx";

const ROLES = [
  { id: "student", hash: "student", title: "I'm a student", script: "let's learn!", text: "Your classes, streaks, badges and a study buddy who cheers you on.", bg: "bg-lilac", buddy: "nova" },
  { id: "teacher", hash: "teacher", title: "I'm a teacher", script: "my classes", text: "Your subjects, who's done what and when, and quizzes with interactive questions.", bg: "bg-mint", buddy: "zip" },
  { id: "parent", hash: "parent", title: "I'm a parent", script: "my kids", text: "Link your children, see strengths and gaps, and get a heads-up when they need support.", bg: "bg-peach", buddy: "bao" },
];

export default function Landing() {
  return (
    <div className="min-h-full overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-5">
        <Logo />
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-5 pb-16 outline-none">
        <section className="relative grid items-center gap-6 pt-8 md:grid-cols-[1.2fr_1fr] md:pt-14">
          <div className="relative">
            <Sparkle className="absolute -left-2 -top-6 h-10 w-10" color="var(--mint-2)" />
            <h1 className="font-display text-5xl leading-[1] sm:text-7xl">
              Learning that
              <span className="block font-hand text-[1.25em] font-bold leading-[.95] text-lilac-2">feels like play</span>
            </h1>
            <Squiggle className="mt-2 h-8 w-48" />
            <p className="mt-4 max-w-md text-lg text-ink-2">Classes, homework and grades in one happy place, with a little study buddy who never lets you give up.</p>
          </div>
          <div className="relative mx-auto h-64 w-full max-w-sm sm:h-80" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 aspect-square h-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-butter" />
            <Blob className="absolute right-2 top-2 h-16 w-16" color="var(--lilac-2)" />
            <Sparkle className="absolute bottom-6 left-0 h-10 w-10" color="var(--peach)" />
            <div className="buddy-float absolute left-[8%] top-[18%]"><Buddy id="kiko" size={110} equipped={{ hat: "cap" }} /></div>
            <div className="buddy-float absolute left-[38%] top-[4%]" style={{ animationDelay: ".6s" }}><Buddy id="nova" size={130} equipped={{ extra: "headphones" }} mood="talk" /></div>
            <div className="buddy-float absolute right-[4%] top-[26%]" style={{ animationDelay: "1.2s" }}><Buddy id="bao" size={104} equipped={{ hat: "flower-crown" }} /></div>
          </div>
        </section>

        <section aria-labelledby="who" className="mt-10">
          <h2 id="who" className="font-display text-3xl sm:text-4xl">
            Who's here <span className="font-hand text-[1.2em] text-ink-2">today?</span>
          </h2>
          <ul className="mt-5 grid gap-5 md:grid-cols-3">
            {ROLES.map((r) => (
              <li key={r.id}>
                <a href={`#${r.hash}`} className={`pastel group relative flex h-full min-h-56 flex-col overflow-hidden rounded-[32px] ${r.bg} p-6 no-underline transition hover:-translate-y-1`}>
                  <span className="font-display text-3xl leading-tight">{r.title}</span>
                  <span className="font-hand text-3xl font-bold leading-none">{r.script}</span>
                  <span className="muted mt-3 max-w-[15rem]">{r.text}</span>
                  <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-[#241f3a] px-5 py-2.5 font-bold text-white">
                    Go
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13L13 3M6 3h7v7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  </span>
                  <span className="absolute -bottom-3 -right-2 transition group-hover:-translate-y-1" aria-hidden="true">
                    <Buddy id={r.buddy} size={96} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-10 text-center text-sm text-ink-2">No ads. We never sell student data. Demo data stays in this browser.</p>
      </main>
    </div>
  );
}

export function Logo({ sub }) {
  return (
    <a href="#" className="flex items-center gap-2 no-underline" aria-label="Curio home">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="13" fill="var(--lilac-2)" />
        <path d="M20 8 C21.5 16 24 18.5 32 20 C24 21.5 21.5 24 20 32 C18.5 24 16 21.5 8 20 C16 18.5 18.5 16 20 8Z" fill="#fff" />
      </svg>
      <span className="font-display text-xl">Curio{sub && <span className="ml-1.5 font-hand text-2xl text-ink-2">{sub}</span>}</span>
    </a>
  );
}
