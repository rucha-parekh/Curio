import { useState } from "react";
import { Logo } from "../Landing.jsx";
import Buddy from "../../components/Buddy.jsx";
import { COURSES, OFFLINE_IDEAS } from "../../lib/seed.js";
import { useStore, classRoster, allAssignments, announcementsFor, createParent, linkChild, unlinkChild, linkCode } from "../../lib/store.js";
import { letter } from "../../lib/grading.js";
import { streakInfo } from "../../lib/streak.js";
import { COURSE_BG, Pill, Button, fmtDue, ago, courseById, A11yMenu, ReadAloud } from "../../components/ui.jsx";
import { studentStats, strengthsAndGaps, familyAlerts } from "../teacher/metrics.js";

export default function ParentApp() {
  const s = useStore();
  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 pt-5">
        <Logo sub="families" />
        <div className="flex items-center gap-3">
          {s.parent && <span className="hidden text-sm text-ink-2 sm:inline">{s.parent.name}'s family account</span>}
          <A11yMenu />
          <a href="#start" className="text-sm font-bold text-ink-2 underline">Switch</a>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl space-y-6 px-5 py-8 outline-none">
        {s.parent ? <Family /> : <SignUp />}
        <p className="text-center text-sm text-ink-2">We only keep your child's first name, class work and grades. No ads, and we never sell data.</p>
      </main>
    </>
  );
}

/** Codes a demo visitor can try: the student signed in on this browser, plus two classmates. */
function demoCodes(s) {
  const roster = classRoster(s);
  return [roster.find((r) => r.live), roster[0], roster[1]].filter(Boolean).map((r) => ({ name: r.live ? `${r.name} (signed in on the student site)` : r.name, code: linkCode(r) }));
}

function SignUp() {
  const s = useStore();
  const [name, setName] = useState("");
  return (
    <form
      className="pastel rounded-[32px] bg-peach p-6 sm:p-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) createParent(name.trim());
      }}
    >
      <h1 className="font-display text-4xl sm:text-5xl">
        Welcome to Curio!
        <span className="block font-hand text-[1.2em]">let's set up your family account</span>
      </h1>
      <label htmlFor="pname" className="mt-6 block font-bold">Your first name</label>
      <input id="pname" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="mt-2 min-h-12 w-full max-w-xs rounded-full border-0 bg-white/85 px-5 text-lg text-[#241f3a]" />
      <p className="muted mt-2 text-sm">Next you'll link your child (or children) with the code from their Badges page.</p>
      <Button type="submit" className="mt-6" disabled={!name.trim()}>Create account</Button>
      <p className="muted mt-6 text-sm">Demo codes: {demoCodes(s).map((d) => `${d.name}: ${d.code}`).join(" · ")}</p>
    </form>
  );
}

function LinkForm({ onLinked }) {
  const s = useStore();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const id = linkChild(code);
        if (!id) return setErr("That code doesn't match a student. Check the code on your child's Badges page.");
        setErr("");
        setCode("");
        onLinked(id);
      }}
    >
      <label className="flex flex-col font-bold">
        Child's link code
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. AVA-1234" className="mt-1 min-h-12 rounded-full border-2 border-line bg-card px-4 font-normal uppercase text-ink" />
      </label>
      <Button type="submit" disabled={!code.trim()}>Link child</Button>
      {err && <p role="alert" className="w-full font-bold text-nudge">{err}</p>}
      <p className="w-full text-sm text-ink-2">Demo codes: {demoCodes(s).map((d) => `${d.name}: ${d.code}`).join(" · ")}</p>
    </form>
  );
}

function Family() {
  const s = useStore();
  const roster = classRoster(s);
  const kids = s.parent.children.map((id) => roster.find((r) => r.id === id)).filter(Boolean);
  const [pick, setPick] = useState(kids[0]?.id);
  const child = kids.find((k) => k.id === pick) || kids[0];

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Hi {s.parent.name}!</h1>
        {kids.length > 0 && (
          <div role="tablist" aria-label="Your children" className="flex flex-wrap gap-2">
            {kids.map((k) => (
              <button key={k.id} role="tab" type="button" aria-selected={child.id === k.id} onClick={() => setPick(k.id)} className={`flex min-h-12 items-center gap-2 rounded-full py-1 pl-1 pr-4 font-bold ${child.id === k.id ? "bg-brand text-on-brand" : "bg-card"}`}>
                <span className="rounded-full bg-white/80"><Buddy id={k.buddy} size={34} /></span>
                {k.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <details className="rounded-[28px] bg-card p-5" open={kids.length === 0}>
        <summary className="min-h-11 cursor-pointer font-display text-xl">{kids.length ? "+ Link another child" : "Link your child"}</summary>
        <div className="mt-3"><LinkForm onLinked={setPick} /></div>
      </details>

      {child && <ChildView child={child} />}
    </>
  );
}

function ChildView({ child }) {
  const s = useStore();
  const assignments = allAssignments(s).filter((a) => !a.owner);
  const st = studentStats(child, assignments);
  const upcoming = assignments.filter((a) => a.due && new Date(a.due) > new Date() && !child.results[a.id]).sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 4);
  const missing = assignments.filter((a) => a.due && new Date(a.due) < new Date() && !child.results[a.id]);
  const news = announcementsFor(null, s).slice(0, 3);
  const alerts = familyAlerts(child, assignments, s);
  const { strengths, gaps } = strengthsAndGaps(child, assignments);
  const streak = child.live ? streakInfo(s.student).current : child.streakDays;
  const effort = child.live ? s.student.effort : null;

  return (
    <>
      <section className="pastel flex flex-wrap items-center gap-5 rounded-[32px] bg-peach p-6 sm:p-8">
        <div className="rounded-full bg-white/60 p-2"><Buddy id={child.buddy} size={80} equipped={child.live ? s.student.equipped : {}} /></div>
        <div className="flex-1">
          <h2 className="font-display text-4xl">{child.name}'s week</h2>
          <p className="muted">Class 7B · last active {child.minutesAgo < 2 ? "just now" : child.minutesAgo < 60 ? `${child.minutesAgo} min ago` : child.minutesAgo < 1440 ? `${Math.round(child.minutesAgo / 60)} h ago` : `${Math.round(child.minutesAgo / 1440)} days ago`} · 🔥 {streak}-day streak</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Overall</p>
          <p className="tabular font-display text-5xl">{st.avg == null ? "–" : `${st.avg}%`}</p>
        </div>
        <Button variant="ghost" className="w-full justify-end text-sm sm:w-auto" onClick={() => confirm(`Unlink ${child.name}?`) && unlinkChild(child.id)}>Unlink</Button>
      </section>

      <section aria-labelledby="al-h" className="rounded-[28px] bg-card p-5 sm:p-6">
        <h2 id="al-h" className="font-display text-2xl">Alerts</h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-ink-2">✓ Nothing to worry about right now. {child.name} is keeping up. 🎉</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className={`flex gap-3 rounded-3xl p-4 ${a.tone === "warn" ? "bg-butter text-pastel-ink" : "bg-nudge-bg"}`}>
                <span className="text-2xl" aria-hidden="true">{a.kind === "engagement" ? "📉" : a.kind === "missing" ? "📭" : "🧩"}</span>
                <span>
                  <span className="block font-bold">{a.tone === "warn" ? "Heads up: " : "Good to know: "}{a.title}</span>
                  <span className="text-sm">{a.body}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="gr-h">
        <h2 id="gr-h" className="font-display text-2xl">Grades</h2>
        <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          {COURSES.map((c) => (
            <li key={c.id} className={`pastel rounded-[28px] p-5 ${COURSE_BG[c.color]}`}>
              <p className="font-bold">{c.icon} {c.name}</p>
              <p className="tabular font-display text-4xl">{st.byCourse[c.id] == null ? "–" : `${st.byCourse[c.id]}%`}</p>
              <p className="font-hand text-2xl font-bold leading-none">{st.byCourse[c.id] == null ? "not graded yet" : letter(st.byCourse[c.id])}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sg-h" className="rounded-[28px] bg-card p-5 sm:p-6">
        <h2 id="sg-h" className="font-display text-2xl">Strengths and gaps</h2>
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="font-bold">💪 Doing great in</h3>
            {strengths.length === 0 ? <p className="text-ink-2">Not enough graded work yet. Strengths show up at 85% and above.</p> : (
              <ul className="mt-2 space-y-2">
                {strengths.map(({ course: c, avg, topics }) => (
                  <li key={c.id} className="rounded-3xl bg-good-bg p-3">
                    <p className="font-bold text-good">✓ {c.icon} {c.name} · {avg}%</p>
                    {topics.length > 0 && <p className="text-sm">Strong on: {topics.join(", ")}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-bold">🌱 Room to grow</h3>
            {gaps.length === 0 ? <p className="text-ink-2">No gaps right now. Keep it up!</p> : (
              <ul className="mt-2 space-y-2">
                {gaps.map(({ course: c, avg, topics, missing }) => (
                  <li key={c.id} className="rounded-3xl bg-nudge-bg p-3">
                    <p className="font-bold text-nudge">{c.icon} {c.name}{avg != null && ` · ${avg}%`}</p>
                    {topics.length > 0 && <p className="text-sm">Practise: {topics.join(", ")}</p>}
                    {missing.length > 0 && <p className="text-sm">Missing: {missing.join(", ")}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="pastel mt-5 rounded-3xl bg-mint p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl">Try at home, no screens 🏡</h3>
            <ReadAloud text={() => ideasFor(gaps, strengths).map((x) => x.idea).join(" ")} label="Read ideas" className="bg-white/70" />
          </div>
          <ul className="mt-2 space-y-2">
            {ideasFor(gaps, strengths).map(({ c, idea }) => (
              <li key={idea} className="flex gap-2"><span aria-hidden="true">{c.icon}</span><span>{idea}</span></li>
            ))}
          </ul>
        </div>
      </section>

      {effort && (
        <section aria-labelledby="ef-h" className="rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="ef-h" className="font-display text-2xl">Effort this term</h2>
          <p className="text-sm text-ink-2">Curio rewards trying, improving and asking for help, not only right answers.</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[["💪", "Answers tried", effort.attempts], ["🦘", "Comebacks after a mistake", effort.comebacks], ["🙋", "Asked for help", effort.helpAsked], ["📈", "Personal bests", effort.improved]].map(([icon, label, n]) => (
              <li key={label} className="rounded-3xl bg-soft p-3">
                <p className="tabular font-display text-3xl">{icon} {n}</p>
                <p className="text-sm font-bold">{label}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="due-h" className="rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="due-h" className="font-display text-2xl">Coming up</h2>
          {missing.length > 0 && <p className="mt-2 rounded-2xl bg-nectarine p-3 font-bold text-pastel-ink">✗ {missing.length} missing: {missing.map((a) => a.title).join(", ")}</p>}
          <ul className="mt-2 divide-y divide-line">
            {upcoming.length === 0 && <li className="py-3 text-ink-2">Nothing due right now.</li>}
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <span><span className="block font-bold">{a.title}</span><span className="text-sm text-ink-2">{courseById(a.courseId).name}</span></span>
                <Pill>{fmtDue(a.due)}</Pill>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="news-h" className="rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="news-h" className="font-display text-2xl">From the teachers</h2>
          <ul className="mt-2 space-y-3">
            {news.map((n) => (
              <li key={n.id}>
                <p className="flex items-center justify-between gap-2 font-bold">{n.title}<ReadAloud text={`${n.title}. ${n.body}`} compact label={`Read "${n.title}" aloud`} /></p>
                <p className="text-sm text-ink-2">{n.from} · {ago(n.at)}</p>
                <p>{n.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** Two ideas per gap subject; if there are no gaps, one idea per strength to keep things fun. */
function ideasFor(gaps, strengths) {
  const from = gaps.length ? gaps.map((g) => [g.course, 2]) : strengths.length ? strengths.map((x) => [x.course, 1]) : COURSES.slice(0, 2).map((c) => [c, 1]);
  return from.flatMap(([c, n]) => (OFFLINE_IDEAS[c.id] || []).slice(0, n).map((idea) => ({ c, idea }))).slice(0, 6);
}
