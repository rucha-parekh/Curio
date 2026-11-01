import { useEffect, useState } from "react";
import Buddy from "../../components/Buddy.jsx";
import { Button } from "../../components/ui.jsx";
import { saveContactMessage } from "../../lib/store.js";
import { ROLES, PLAN_CHOICES, emptyContact, validateContact, planFromRoute } from "../../lib/contact.js";
import { CONTACT_EMAIL } from "../../lib/marketing.js";
import { TRIAL_MONTHS } from "../../lib/plans.js";

const field = "mt-1 block min-h-12 w-full rounded-full border-2 bg-card px-4 font-normal text-ink";

export default function Contact({ route }) {
  const [v, setV] = useState(() => emptyContact(planFromRoute(route)));
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null);
  const [copied, setCopied] = useState(false);

  // Coming from a pricing button (#contact-school) pre-picks that plan.
  useEffect(() => setV((x) => ({ ...x, plan: planFromRoute(route) })), [route]);

  const set = (k) => (e) => {
    setV({ ...v, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };
  const err = (k) => errors[k] && <p id={`${k}-err`} className="mt-1 text-sm font-bold text-nudge">⚠ {errors[k]}</p>;
  const a11y = (k) => ({ id: `c-${k}`, "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-err` : undefined, className: `${field} ${errors[k] ? "border-nudge" : "border-line"}` });

  function submit(e) {
    e.preventDefault();
    const found = validateContact(v);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return document.getElementById(`c-${first}`)?.focus();
    saveContactMessage({ ...v, students: Number(v.students) });
    setSent(v.name.trim().split(" ")[0]);
    setV(emptyContact(v.plan));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById("contact-email"));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
    }
  }

  return (
    <div className="space-y-8 pt-4">
      <header className="flex flex-wrap items-center gap-5">
        <Buddy id="bao" size={96} mood="wave" />
        <div>
          <h1 className="font-display text-5xl">Say hello<span className="ml-2 font-hand text-[1.1em] text-ink-2">we read everything</span></h1>
          <p className="text-lg text-ink-2">Questions, a demo, or a {TRIAL_MONTHS}-month school trial. A real person replies within 1 business day.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="form-h" className="rounded-[32px] bg-card p-5 sm:p-8">
          <h2 id="form-h" className="sr-only">Contact form</h2>
          {sent ? (
            <div role="status" className="pop space-y-3 text-center">
              <Buddy id="bao" size={110} mood="cheer" />
              <p className="font-display text-3xl">Thanks, {sent}! 🎉</p>
              <p className="text-lg text-ink-2">We've got your message. A person from our team will reply within 1 business day.</p>
              <Button variant="soft" onClick={() => setSent(null)}>Send another message</Button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <label className="font-bold">Name<input {...a11y("name")} value={v.name} onChange={set("name")} autoComplete="name" />{err("name")}</label>
              <label className="font-bold">Email<input {...a11y("email")} type="email" value={v.email} onChange={set("email")} autoComplete="email" />{err("email")}</label>
              <label className="font-bold">I'm a…
                <select {...a11y("role")} value={v.role} onChange={set("role")}>
                  <option value="">Choose one</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {err("role")}
              </label>
              <label className="font-bold">School or institution<input {...a11y("institution")} value={v.institution} onChange={set("institution")} autoComplete="organization" />{err("institution")}</label>
              <label className="font-bold">Number of students<input {...a11y("students")} type="number" min={1} inputMode="numeric" value={v.students} onChange={set("students")} />{err("students")}</label>
              <label className="font-bold">Plan you're interested in
                <select {...a11y("plan")} value={v.plan} onChange={set("plan")}>
                  {PLAN_CHOICES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
                {err("plan")}
              </label>
              <label className="font-bold sm:col-span-2">Message
                <textarea id="c-message" rows={5} value={v.message} onChange={set("message")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-err" : undefined} className={`mt-1 block w-full rounded-3xl border-2 bg-card p-4 font-normal text-ink ${errors.message ? "border-nudge" : "border-line"}`} />
                {err("message")}
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Send message</Button>
                <p className="mt-2 text-sm text-ink-2">We only use your details to reply. No mailing lists unless you ask.</p>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-4" aria-label="Other ways to reach us">
          <div className="rounded-[28px] bg-card p-5">
            <h2 className="font-display text-xl">Email us</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span id="contact-email" className="select-all break-all font-bold">{CONTACT_EMAIL}</span>
              <button type="button" onClick={copy} className="min-h-10 rounded-full bg-soft px-3 text-sm font-bold hover:bg-line">{copied ? "Copied ✓" : "Copy"}</button>
            </p>
          </div>
          <div className="pastel rounded-[28px] bg-mint p-5">
            <h2 className="font-display text-xl">Book a demo</h2>
            <p className="muted">A 20-minute walkthrough for your staff, with time for questions.</p>
            <button type="button" onClick={() => setV({ ...v, message: v.message || "We'd like to book a 20-minute demo for our staff." })} className="mt-3 min-h-11 rounded-full bg-white/80 px-4 font-bold">Ask for a demo</button>
          </div>
          <div className="pastel rounded-[28px] bg-lilac p-5">
            <h2 className="font-display text-xl">Start your {TRIAL_MONTHS}-month school trial</h2>
            <p className="muted">Every School feature, free. No credit card.</p>
            <button type="button" onClick={() => setV({ ...v, plan: "school" })} className="mt-3 min-h-11 rounded-full bg-white/80 px-4 font-bold">Choose the trial</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
