import { useState } from "react";
import { GOAL_METRICS } from "../../lib/seed.js";
import { useStore, classGoals, addClassGoal, removeClassGoal } from "../../lib/store.js";
import Buddy from "../../components/Buddy.jsx";
import { GoalCard } from "../../components/Progress.jsx";
import { Button, Pill, Tabs, COURSE_BG, courseById, fmtDue, fmtWhen } from "../../components/ui.jsx";
import { AssignmentRows, Builder, StatusChip } from "./TeacherAssignments.jsx";
import { classOverview, completionFor } from "./metrics.js";

const lastSeen = (m) => (m < 2 ? "now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`);

/** One subject for Class 7B: what's assigned, who's done it and when, new work, the students, and class goals. */
export default function ClassPage({ courseId }) {
  const s = useStore();
  const c = courseById(courseId);
  const [tab, setTab] = useState("current");
  if (!c) return <p>Class not found. <a href="#teacher" className="underline">Back to classes</a></p>;

  const o = classOverview(s);
  const rows = o.perAssignment.filter(({ a }) => a.courseId === courseId).sort((x, y) => new Date(x.a.due) - new Date(y.a.due));
  const now = Date.now();
  const current = rows.filter(({ a }) => !a.due || new Date(a.due).getTime() >= now);
  const past = rows.filter(({ a }) => a.due && new Date(a.due).getTime() < now).reverse();
  const avg = o.courseAvgs.find((x) => x.id === courseId)?.avg;
  const handedIn = rows.reduce((n, r) => n + r.submitted, 0);
  const expected = rows.filter(({ a }) => a.due && new Date(a.due).getTime() < now).length * o.roster.length;

  return (
    <div className="space-y-6">
      <a href="#teacher" className="inline-flex min-h-11 items-center font-bold text-ink-2 no-underline">← All classes</a>
      <header className={`pastel flex flex-wrap items-center gap-5 rounded-[32px] p-6 ${COURSE_BG[c.color]}`}>
        <span className="text-5xl" aria-hidden="true">{c.icon}</span>
        <div className="flex-1">
          <h1 className="font-display text-4xl">{c.name}</h1>
          <p className="font-hand text-2xl font-bold leading-none">Class 7B · {o.roster.length} students</p>
          <p className="muted mt-1">{c.blurb}</p>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white/70 px-3 py-2"><dt className="text-xs font-bold">Average</dt><dd className="tabular font-display text-2xl">{avg == null ? "–" : `${avg}%`}</dd></div>
          <div className="rounded-2xl bg-white/70 px-3 py-2"><dt className="text-xs font-bold">Current</dt><dd className="tabular font-display text-2xl">{current.length}</dd></div>
          <div className="rounded-2xl bg-white/70 px-3 py-2"><dt className="text-xs font-bold">Past due in</dt><dd className="tabular font-display text-2xl">{expected ? `${Math.round((past.reduce((n, r) => n + r.submitted, 0) / expected) * 100)}%` : "–"}</dd></div>
        </dl>
      </header>

      <Tabs
        label={`${c.name} sections`}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "current", label: "Assignments", count: current.length },
          { id: "grid", label: "Who's done" },
          { id: "new", label: "+ New assignment" },
          { id: "students", label: "Students", count: o.roster.length },
          { id: "goals", label: "Class goals" },
        ]}
      />

      <div role="tabpanel" aria-label={tab}>
        {tab === "current" && (
          <div className="space-y-6">
            <section aria-labelledby="cur-h" className="space-y-3">
              <h2 id="cur-h" className="font-display text-2xl">Current assignments</h2>
              <AssignmentRows rows={current} roster={o.roster} showCourse={false} />
            </section>
            <section aria-labelledby="past-h" className="space-y-3">
              <h2 id="past-h" className="font-display text-2xl">Past assignments <span className="text-base text-ink-2">({handedIn} hand-ins in total)</span></h2>
              <AssignmentRows rows={past} roster={o.roster} showCourse={false} />
            </section>
          </div>
        )}
        {tab === "grid" && <CompletionGrid rows={rows} roster={o.roster} />}
        {tab === "new" && <Builder courseId={courseId} onDone={() => setTab("current")} />}
        {tab === "students" && <StudentList roster={o.roster} courseId={courseId} rows={rows} />}
        {tab === "goals" && <Goals courseId={courseId} />}
      </div>
    </div>
  );
}

/** Students down the side, assignments across the top, and when each one was handed in. */
function CompletionGrid({ rows, roster }) {
  const people = [...roster].sort((a, b) => a.name.localeCompare(b.name));
  if (!rows.length) return <p className="rounded-[28px] bg-card p-5 text-ink-2">No assignments in this class yet.</p>;
  return (
    <section aria-labelledby="grid-h" className="rounded-[28px] bg-card p-3 sm:p-5">
      <h2 id="grid-h" className="px-2 font-display text-2xl">Who has completed what, and when</h2>
      <p className="px-2 text-sm text-ink-2">✓ done (with date and time) · ✓ late · ✗ missing · … not yet due</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="text-ink-2">
            <tr>
              <th scope="col" className="sticky left-0 bg-card py-2 pr-3 font-bold">Student</th>
              {rows.map(({ a }) => (
                <th key={a.id} scope="col" className="min-w-40 py-2 pr-3 align-bottom font-bold">
                  <span className="block text-ink">{a.title}</span>
                  <span className="font-normal">{fmtDue(a.due)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {people.map((r) => (
              <tr key={r.id} className="hover:bg-soft">
                <th scope="row" className="sticky left-0 bg-card py-2 pr-3">
                  <a href={`#teacher-student-${r.id}`} className="flex min-h-10 items-center gap-2 font-bold no-underline">
                    <Buddy id={r.buddy} size={24} />
                    {r.name}
                    {r.live && <Pill tone="good">live</Pill>}
                  </a>
                </th>
                {rows.map(({ a }) => {
                  const w = completionFor(a, [r])[0];
                  return (
                    <td key={a.id} className="py-2 pr-3">
                      <StatusChip status={w.status} />
                      {w.at && <span className="tabular mt-0.5 block text-xs text-ink-2">{fmtWhen(w.at)}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StudentList({ roster, courseId, rows }) {
  const [q, setQ] = useState("");
  const now = Date.now();
  const list = roster.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section aria-labelledby="sl-h" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="sl-h" className="font-display text-2xl">Students in this class</h2>
        <label className="flex flex-col text-sm font-bold">
          Find a student
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 min-h-11 rounded-full border-2 border-line bg-card px-4 text-base text-ink" />
        </label>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => {
          const grade = r.stats.byCourse[courseId];
          const done = rows.filter(({ a }) => r.results[a.id]).length;
          const missing = rows.filter(({ a }) => a.due && new Date(a.due).getTime() < now && !r.results[a.id]).length;
          return (
            <li key={r.id}>
              <a href={`#teacher-student-${r.id}`} className="flex items-center gap-3 rounded-[24px] bg-card p-3 no-underline transition hover:-translate-y-0.5">
                <Buddy id={r.buddy} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{r.name}{r.live && <Pill tone="good" className="ml-2">live</Pill>}</span>
                  <span className="text-sm text-ink-2">{done}/{rows.length} done · seen {lastSeen(r.minutesAgo)}</span>
                </span>
                <span className="text-right">
                  <span className="tabular block font-display text-xl">{grade == null ? "–" : `${grade}%`}</span>
                  {missing > 0 && <Pill tone="late">✗ {missing}</Pill>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Goals({ courseId }) {
  const s = useStore();
  const goals = classGoals(s, courseId);
  const [g, setG] = useState({ title: "", metric: "answers", target: 100, reward: "" });
  const ok = g.title.trim() && g.reward.trim() && Number(g.target) > 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="goals-h">
        <h2 id="goals-h" className="font-display text-2xl">Class goals</h2>
        <p className="text-sm text-ink-2">Shared goals the whole class works on together. Students see them on their home page and earn a Team player badge for helping.</p>
        <ul className="mt-3 space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} action={goal.from === "teacher" && <Button variant="ghost" className="ml-auto min-h-9 text-sm" onClick={() => removeClassGoal(goal.id)}>Remove</Button>} />
          ))}
        </ul>
      </section>
      <form
        className="pastel self-start rounded-[28px] bg-butter p-5"
        onSubmit={(e) => {
          e.preventDefault();
          addClassGoal({ courseId, title: g.title.trim(), metric: g.metric, target: Number(g.target), reward: g.reward.trim() });
          setG({ title: "", metric: "answers", target: 100, reward: "" });
        }}
      >
        <h3 className="font-display text-2xl">New class goal</h3>
        <label className="mt-3 block font-bold">Goal
          <input value={g.title} maxLength={60} onChange={(e) => setG({ ...g, title: e.target.value })} placeholder="e.g. Solve 300 fraction questions" className="mt-1 min-h-11 w-full rounded-full border-0 bg-white/85 px-4 font-normal text-[#241f3a]" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="font-bold">Count
            <select value={g.metric} onChange={(e) => setG({ ...g, metric: e.target.value })} className="mt-1 min-h-11 w-full rounded-full border-0 bg-white/85 px-3 font-normal text-[#241f3a]">
              {Object.entries(GOAL_METRICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="font-bold">Target
            <input type="number" min={1} value={g.target} onChange={(e) => setG({ ...g, target: e.target.value })} className="mt-1 min-h-11 w-full rounded-full border-0 bg-white/85 px-4 font-normal text-[#241f3a]" />
          </label>
        </div>
        <label className="mt-3 block font-bold">Class reward
          <input value={g.reward} maxLength={50} onChange={(e) => setG({ ...g, reward: e.target.value })} placeholder="e.g. 🎶 Music while we work" className="mt-1 min-h-11 w-full rounded-full border-0 bg-white/85 px-4 font-normal text-[#241f3a]" />
        </label>
        <Button type="submit" className="mt-4" disabled={!ok}>Add goal</Button>
      </form>
    </div>
  );
}
