import { useState } from "react";
import Buddy from "../../components/Buddy.jsx";
import { PLANS, COMPARISON, ADD_ONS, DISCOUNTS, TRIAL_MONTHS, SCHOOL_MIN_STUDENTS, recommendPlan, estimateSchoolPrice } from "../../lib/plans.js";
import { SectionTitle } from "./parts.jsx";

const FAQ = [
  ["What happens after the 2-month trial?", "We'll check in before it ends. If you do nothing, your school moves to the free Classroom plan and nothing is deleted. Choose School to keep every feature."],
  ["Do you sell student data?", "Never. There are no ads, we only collect a first name for students, and uploaded files are read on the device."],
  ["Can we change plans later?", "Yes, at any time. Moving up takes effect straight away, and moving down applies at your next billing date."],
  ["How do you count students?", "A student counts once they've signed in at least once in the billing period, no matter how many courses they're in. The School plan starts at 100 students."],
  ["Does the AI buddy give students the answers?", "No. It coaches step by step: key words first, then the teacher's hint, then a bigger nudge. Hiding the answer is enforced in code, not just in the instructions."],
  ["Are accessibility features extra?", "Never. Read-aloud, dyslexia-friendly text, colour-blind-safe colours and keyboard use come with every plan, including the free one."],
];

const money = (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  const [students, setStudents] = useState(250);
  const billing = yearly ? "yearly" : "monthly";
  const rec = recommendPlan(students);
  const est = estimateSchoolPrice(students, billing);
  const recPlan = PLANS.find((p) => p.id === rec);

  return (
    <div className="space-y-14">
      <header className="space-y-4 pt-4 text-center">
        <h1 className="font-display text-5xl sm:text-6xl">Simple pricing<span className="block font-hand text-[1.1em] text-lilac-2">for every size of class</span></h1>
        <p className="mx-auto max-w-xl text-lg text-ink-2">Start free with a small class. Try everything free for {TRIAL_MONTHS} months as a school. Talk to us when you're a whole campus.</p>
        <div className="flex items-center justify-center gap-3 font-bold">
          <span id="bill-m" className={yearly ? "text-ink-2" : ""}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            aria-labelledby="bill-m bill-y"
            onClick={() => setYearly(!yearly)}
            className={`relative h-9 w-16 rounded-full transition ${yearly ? "bg-brand" : "bg-line"}`}
          >
            <span className={`absolute top-1 h-7 w-7 rounded-full bg-card shadow transition-all ${yearly ? "left-8" : "left-1"}`} />
          </button>
          <span id="bill-y" className={yearly ? "" : "text-ink-2"}>Yearly <span className="rounded-full bg-good-bg px-2 py-0.5 text-sm text-good">2 months free</span></span>
        </div>
      </header>

      <section aria-label="Plans">
        <ul className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <li key={p.id} className={`relative flex flex-col gap-4 rounded-[32px] bg-card p-6 ${p.popular ? "ring-4 ring-lilac-2" : ""} ${rec === p.id ? "outline-dashed outline-2 outline-offset-4 outline-ink-2" : ""}`}>
              {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-lilac-2 px-3 py-1 text-sm font-bold text-[#241f3a]">★ Most popular</span>}
              <div className={`pastel rounded-3xl p-4 ${p.color}`}>
                <h2 className="font-display text-3xl">{p.name}</h2>
                <p className="muted">{p.tagline}</p>
                <p className="mt-3"><span className="tabular font-display text-5xl">{p.price[billing]}</span> <span className="font-bold">{p.price.note}{p.id === "school" ? (yearly ? " / year" : " / month") : ""}</span></p>
                {p.price.alt && <p className="muted text-sm">{p.price.alt[billing]}</p>}
              </div>
              <ul className="grid grid-cols-2 gap-2 text-sm font-bold">
                {Object.values(p.limits).map((l) => <li key={l} className="rounded-2xl bg-soft px-3 py-2">{l}</li>)}
              </ul>
              <ul className="flex-1 space-y-2">
                {p.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden="true" className="text-good">✓</span><span>{f}</span></li>)}
              </ul>
              <a href={p.cta.href} className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 font-bold no-underline ${p.popular ? "bg-brand text-on-brand" : "border-2 border-ink/80 text-ink hover:bg-soft"}`}>{p.cta.label}</a>
              {rec === p.id && <p className="text-center text-sm font-bold text-ink-2">Recommended for {Number(students).toLocaleString()} students</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="est-h" className="grid items-center gap-6 rounded-[32px] bg-card p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <h2 id="est-h" className="font-display text-3xl">How many students?</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="stu-range" className="sr-only">Number of students (slider)</label>
            <input id="stu-range" type="range" min={1} max={3000} step={1} value={Math.min(students, 3000)} onChange={(e) => setStudents(Number(e.target.value))} className="h-3 min-w-0 flex-1 accent-[var(--lilac-2)]" />
            <label htmlFor="stu-num" className="sr-only">Number of students</label>
            <input id="stu-num" type="number" min={1} value={students} onChange={(e) => setStudents(Math.max(0, Number(e.target.value) || 0))} className="tabular min-h-12 w-28 rounded-full border-2 border-line bg-card px-4 text-lg text-ink" />
          </div>
          <p aria-live="polite" className="text-lg">
            We recommend <b>{recPlan.name}</b>.{" "}
            {rec === "free" && "It's free forever."}
            {rec === "school" && <>Estimated <b className="tabular">{money(est.amount)}</b> per {est.per}{est.seats > students ? ` (minimum ${SCHOOL_MIN_STUDENTS} students)` : ""}, after a {TRIAL_MONTHS}-month free trial.</>}
            {rec === "campus" && "We'll put together a quote that fits your campus."}
          </p>
        </div>
        <a href={recPlan.cta.href} className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 font-bold text-on-brand no-underline">{recPlan.cta.label}</a>
      </section>

      <section aria-labelledby="trial-h" className="pastel flex flex-wrap items-center gap-5 rounded-[32px] bg-butter p-6 sm:p-8">
        <Buddy id="zip" size={90} mood="cheer" />
        <div className="min-w-0 flex-1">
          <h2 id="trial-h" className="font-display text-3xl">Try School free for {TRIAL_MONTHS} months.</h2>
          <p className="muted text-lg">No credit card. Cancel anytime. Bring your whole staff.</p>
        </div>
        <a href="#contact-school" className="inline-flex min-h-12 items-center rounded-full bg-[#241f3a] px-6 font-bold text-white no-underline">Start my school trial</a>
      </section>

      <section aria-labelledby="cmp-h" className="space-y-4">
        <SectionTitle id="cmp-h" sub="✓ means included and ✗ means not included. Accessibility features are on every plan.">Compare plans</SectionTitle>
        <div className="overflow-x-auto rounded-[28px] bg-card p-3 sm:p-5">
          <table className="w-full min-w-[40rem] text-left">
            <thead>
              <tr className="text-sm text-ink-2">
                <th scope="col" className="py-2 pr-3 font-bold">Feature</th>
                {PLANS.map((p) => <th key={p.id} scope="col" className="w-40 py-2 pr-3 font-display text-lg text-ink">{p.name}</th>)}
              </tr>
            </thead>
            {COMPARISON.map((g) => (
              <tbody key={g.group} className="divide-y divide-line">
                <tr><th colSpan={4} scope="colgroup" className="pt-5 pb-2 font-display text-xl">{g.group}</th></tr>
                {g.rows.map(([feature, ...vals]) => (
                  <tr key={feature}>
                    <th scope="row" className="py-2.5 pr-3 font-normal">{feature}</th>
                    {vals.map((v, i) => <td key={i} className="py-2.5 pr-3 text-sm"><Cell v={v} /></td>)}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="add-h" className="rounded-[28px] bg-card p-6">
          <h2 id="add-h" className="font-display text-2xl">Add-ons</h2>
          <ul className="mt-3 divide-y divide-line">
            {ADD_ONS.map((a) => (
              <li key={a.name} className="flex flex-wrap justify-between gap-2 py-3">
                <span><b>{a.name}</b><span className="block text-sm text-ink-2">{a.text}</span></span>
                <span className="tabular font-bold">{a.price}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="disc-h" className="rounded-[28px] bg-card p-6">
          <h2 id="disc-h" className="font-display text-2xl">Discounts</h2>
          <ul className="mt-3 divide-y divide-line">
            {DISCOUNTS.map((d) => (
              <li key={d.name} className="flex flex-wrap justify-between gap-2 py-3"><b>{d.name}</b><span className="rounded-full bg-good-bg px-3 font-bold text-good">{d.value}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="faq-h" className="space-y-4">
        <SectionTitle id="faq-h">Questions</SectionTitle>
        <div className="space-y-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-[24px] bg-card px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 font-display text-lg [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-soft transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="pb-4 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Cell({ v }) {
  if (v === true) return <span className="font-bold text-good"><span aria-hidden="true">✓ </span>Included</span>;
  if (v === false) return <span className="text-ink-2"><span aria-hidden="true">✗ </span>Not included</span>;
  return <span className="font-bold">{v}</span>;
}
