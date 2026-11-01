import Buddy from "../../components/Buddy.jsx";
import { Squiggle, Blob, Sparkle } from "../../components/ui.jsx";
import { TRIAL_MONTHS } from "../../lib/plans.js";
import { SectionTitle, Testimonials, LogoWall } from "./parts.jsx";

const AUDIENCES = [
  {
    title: "For students",
    script: "learn by doing",
    bg: "bg-lilac",
    buddy: "nova",
    points: [
      "A study buddy that coaches step by step and never gives the answer away",
      "It talks in a girl or boy voice, cheers when you're right and helps when you're not",
      "Daily streaks with rest days and streak freezes",
      "Badges and stars for trying, improving and asking for help",
      "Class goals and squad challenges with friends",
    ],
  },
  {
    title: "For teachers",
    script: "less admin",
    bg: "bg-mint",
    buddy: "zip",
    points: [
      "A page for every subject you teach",
      "See who's done each assignment, and when",
      "Interactive questions: put in order, matching and number line",
      "Turn a PDF or Word worksheet into a quiz in minutes",
      "A check-in list of students who need you",
    ],
  },
  {
    title: "For families",
    script: "no surprises",
    bg: "bg-peach",
    buddy: "bao",
    points: [
      "One account for all your children",
      "Early alerts if engagement drops or a topic gets tricky",
      "Strengths and gaps by subject",
      "Ideas to try at home, away from screens",
      "Grades, what's due and news from teachers",
    ],
  },
];

const STEPS = [
  { title: "Teacher posts", text: "Make an assignment with quick checks or interactive puzzles, or build one from a file." },
  { title: "Student learns with the buddy", text: "One question at a time, with hints, cheers and step-by-step help when they're stuck." },
  { title: "Family sees progress", text: "Grades, effort and gentle alerts, plus ideas to help at home." },
];

const ACCESS = [
  ["🔊", "Read-aloud", "Questions, notes and buddy messages, read out loud."],
  ["🔤", "Dyslexia-friendly text", "Rounder letters and more space between them."],
  ["🎨", "Colour-blind-safe", "Blue and orange instead of green and red, plus icons."],
  ["⌨️", "Keyboard friendly", "Every control works without a mouse, puzzles included."],
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="relative grid items-center gap-6 pt-6 md:grid-cols-[1.2fr_1fr] md:pt-12" aria-labelledby="hero-h">
        <div className="relative space-y-4">
          <Sparkle className="absolute -left-2 -top-6 h-10 w-10" color="var(--mint-2)" />
          <h1 id="hero-h" className="font-display text-5xl leading-[1] sm:text-7xl">
            Learning that
            <span className="block font-hand text-[1.25em] font-bold leading-[.95] text-lilac-2">feels like play</span>
          </h1>
          <Squiggle className="h-8 w-48" />
          <p className="max-w-md text-lg text-ink-2">Curio brings classes, homework and progress together for students, teachers and families, with a study buddy that coaches instead of giving answers.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#pricing" className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-bold text-on-brand no-underline">Start free</a>
            <a href="#student" className="inline-flex min-h-12 items-center rounded-full border-2 border-ink/80 px-6 font-bold text-ink no-underline hover:bg-soft">See it in action</a>
          </div>
        </div>
        <div className="relative mx-auto h-64 w-full max-w-sm sm:h-80" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 aspect-square h-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-butter" />
          <Blob className="absolute right-2 top-2 h-16 w-16" color="var(--lilac-2)" />
          <Sparkle className="absolute bottom-6 left-0 h-10 w-10" color="var(--peach)" />
          <div className="buddy-float absolute left-[8%] top-[18%]"><Buddy id="kiko" size={110} equipped={{ hat: "cap" }} mood="cheer" /></div>
          <div className="buddy-float absolute left-[38%] top-[4%]" style={{ animationDelay: ".6s" }}><Buddy id="nova" size={130} equipped={{ extra: "headphones" }} mood="talk" /></div>
          <div className="buddy-float absolute right-[4%] top-[26%]" style={{ animationDelay: "1.2s" }}><Buddy id="bao" size={104} equipped={{ hat: "flower-crown" }} mood="wave" /></div>
        </div>
      </section>

      <section aria-labelledby="who-h" className="space-y-5">
        <SectionTitle id="who-h" script="in one place">Made for everyone in the loop</SectionTitle>
        <ul className="grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <li key={a.title} className={`pastel relative flex flex-col gap-3 overflow-hidden rounded-[32px] p-6 ${a.bg}`}>
              <h3 className="font-display text-2xl leading-tight">{a.title}<span className="block font-hand text-3xl font-bold">{a.script}</span></h3>
              <ul className="space-y-2 pr-10">
                {a.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden="true">✓</span><span>{p}</span></li>)}
              </ul>
              <span className="absolute -bottom-3 -right-2" aria-hidden="true"><Buddy id={a.buddy} size={80} /></span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-h" className="space-y-5">
        <SectionTitle id="how-h" script="3 steps">How it works</SectionTitle>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-[28px] bg-card p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand font-display text-xl text-on-brand" aria-hidden="true">{i + 1}</span>
              <span><h3 className="font-display text-xl">{s.title}</h3><p className="text-ink-2">{s.text}</p></span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="acc-h" className="pastel rounded-[32px] bg-sky p-6 sm:p-8">
        <h2 id="acc-h" className="font-display text-3xl">Built for every learner<span className="ml-2 font-hand text-[1.15em]">on every plan</span></h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCESS.map(([icon, title, text]) => (
            <li key={title} className="rounded-3xl bg-white/75 p-4">
              <p className="text-3xl" aria-hidden="true">{icon}</p>
              <h3 className="font-display text-lg">{title}</h3>
              <p className="muted text-sm">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="love-h" className="space-y-5">
        <SectionTitle id="love-h" script="so far">What people are saying</SectionTitle>
        <Testimonials limit={3} />
        <LogoWall />
      </section>

      <section aria-labelledby="role-h" className="rounded-[32px] bg-card p-6">
        <h2 id="role-h" className="font-display text-2xl">Already using Curio?</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {[["student", "I'm a student", "bg-lilac"], ["teacher", "I'm a teacher", "bg-mint"], ["parent", "I'm a parent", "bg-peach"]].map(([h, label, bg]) => (
            <a key={h} href={`#${h}`} className={`pastel inline-flex min-h-12 items-center rounded-full px-6 font-bold no-underline ${bg}`}>{label} →</a>
          ))}
        </div>
      </section>

      <section aria-labelledby="cta-h" className="flex flex-wrap items-center justify-between gap-5 rounded-[32px] bg-brand p-6 text-on-brand sm:p-10">
        <div>
          <h2 id="cta-h" className="font-display text-3xl sm:text-4xl">Free for small classes.</h2>
          <p className="text-lg opacity-90">{TRIAL_MONTHS}-month free trial for schools. No credit card.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="#pricing" className="inline-flex min-h-12 items-center rounded-full bg-butter px-6 font-bold text-pastel-ink no-underline">See pricing</a>
          <a href="#contact-school" className="inline-flex min-h-12 items-center rounded-full border-2 border-current px-6 font-bold no-underline">Start a school trial</a>
        </div>
      </section>
    </div>
  );
}
