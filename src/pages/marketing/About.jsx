import Buddy from "../../components/Buddy.jsx";
import { Squiggle } from "../../components/ui.jsx";
import { FOUNDERS, UNIVERSITY, JOURNEY, VALUES } from "../../lib/marketing.js";
import { SectionTitle, Testimonials, LogoWall } from "./parts.jsx";

export default function About() {
  return (
    <div className="space-y-14 pt-4">
      <header className="space-y-3">
        <h1 className="font-display text-5xl sm:text-6xl">Built by learners<span className="block font-hand text-[1.1em] text-lilac-2">for learners</span></h1>
        <Squiggle className="h-8 w-48" />
      </header>

      <section aria-labelledby="why-h" className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 text-lg">
          <h2 id="why-h" className="font-display text-3xl">Why we made Curio</h2>
          <p>We remember being stuck on homework at the kitchen table with nobody to ask. Years later, as students again, we watched AI tools arrive that would happily hand over the answer, which feels like help but doesn't teach anything.</p>
          <p>So we set out to build the study buddy we wish we'd had: one that coaches step by step, cheers when you try, and stays kind when you get it wrong.</p>
          <p>We wanted streaks that never punish a rest day, rewards for effort and not just being right, and a design that works for every learner, including students with dyslexia or colour blindness.</p>
        </div>
        <div className="pastel relative grid place-items-center rounded-[32px] bg-butter p-6" aria-hidden="true">
          <div className="flex items-end gap-2">
            <Buddy id="kiko" size={90} mood="sad" />
            <span className="font-display text-4xl">→</span>
            <Buddy id="kiko" size={110} mood="cheer" />
          </div>
          <p className="mt-3 text-center font-hand text-3xl font-bold">stuck → "I got it!"</p>
        </div>
      </section>

      <section aria-labelledby="team-h" className="space-y-5">
        <SectionTitle id="team-h" sub={`We're students in the Master of Management in AI and Analytics programme at ${UNIVERSITY}. We're still learners ourselves, and that's the point.`}>The founders</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FOUNDERS.map((f, i) => (
            <li key={i} className="flex items-center gap-4 rounded-[28px] bg-card p-5">
              <span className="shrink-0 rounded-full bg-soft p-2"><Buddy id={f.buddy} size={64} /></span>
              <span>
                <span className="block font-display text-xl">{f.name}</span>
                <span className="block text-sm font-bold text-ink-2">{f.role}</span>
                <span className="block text-sm">{f.brings}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="journey-h" className="space-y-5">
        <SectionTitle id="journey-h" script="so far">Our journey</SectionTitle>
        <ol className="relative space-y-4 border-l-4 border-dashed border-lilac-2 pl-6">
          {JOURNEY.map((j) => (
            <li key={j.title} className="relative rounded-[24px] bg-card p-5">
              <span className="absolute -left-[2.15rem] top-6 h-4 w-4 rounded-full border-4 border-page bg-lilac-2" aria-hidden="true" />
              <p className="text-sm font-bold text-ink-2">{j.when}</p>
              <h3 className="font-display text-xl">{j.title}</h3>
              <p className="text-ink-2">{j.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="believe-h" className="space-y-5">
        <SectionTitle id="believe-h">What we believe</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-[24px] bg-card p-5">
              <p className="text-3xl" aria-hidden="true">{v.icon}</p>
              <h3 className="font-display text-lg leading-tight">{v.title}</h3>
              <p className="text-sm text-ink-2">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="say-h" className="space-y-5">
        <SectionTitle id="say-h">Kind words</SectionTitle>
        <Testimonials />
      </section>

      <section aria-labelledby="clients-h" className="space-y-5">
        <SectionTitle id="clients-h">Happy schools</SectionTitle>
        <LogoWall />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] bg-brand p-6 text-on-brand sm:p-8" aria-labelledby="join-h">
        <h2 id="join-h" className="font-display text-3xl">Want to learn alongside us?</h2>
        <div className="flex flex-wrap gap-3">
          <a href="#contact" className="inline-flex min-h-12 items-center rounded-full bg-butter px-6 font-bold text-pastel-ink no-underline">Get in touch</a>
          <a href="#pricing" className="inline-flex min-h-12 items-center rounded-full border-2 border-current px-6 font-bold no-underline">See pricing</a>
        </div>
      </section>
    </div>
  );
}
