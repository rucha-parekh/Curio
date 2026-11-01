import { useState } from "react";
import { COURSES } from "../../lib/seed.js";
import { useStore, getState } from "../../lib/store.js";
import { percent, letter } from "../../lib/grading.js";
import Buddy from "../../components/Buddy.jsx";
import { Pill, courseById, fmtDue, ago, COURSE_BG } from "../../components/ui.jsx";
import { classOverview } from "./metrics.js";

const lastSeen = (m) => (m < 2 ? "now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`);

export default function Students() {
  const s = useStore();
  const { roster } = classOverview(s);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: 1 });
  const val = {
    name: (r) => r.name,
    avg: (r) => r.stats.avg ?? -1,
    done: (r) => r.stats.completion,
    missing: (r) => r.stats.missing,
    seen: (r) => r.minutesAgo,
    stars: (r) => r.stars,
  };
  const rows = roster
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const x = val[sort.key](a), y = val[sort.key](b);
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });
  const H = (props) => <SortHeader {...props} sort={sort} setSort={setSort} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl">Students <span className="font-hand text-[1.15em] text-ink-2">{roster.length} in class</span></h1>
        <label className="flex flex-col text-sm font-bold">
          Find a student
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 min-h-11 rounded-full border-2 border-line bg-card px-4 text-base text-ink" />
        </label>
      </div>
      <div className="overflow-x-auto rounded-[28px] bg-card p-3 sm:p-5">
        <table className="w-full min-w-[56rem] text-left">
          <thead className="text-sm text-ink-2">
            <tr>
              <H k="name">Student</H>
              <H k="avg">Average</H>
              {COURSES.map((c) => <th key={c.id} className="py-2 font-bold">{c.name}</th>)}
              <H k="done">Done</H>
              <H k="missing">Missing</H>
              <H k="seen">Last seen</H>
              <th className="py-2 font-bold">Now doing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-soft">
                <td className="py-2">
                  <a href={`#teacher-student-${r.id}`} className="flex min-h-11 items-center gap-2 font-bold no-underline">
                    <Buddy id={r.buddy} size={30} />
                    {r.name}
                    {r.live && <Pill tone="good">live</Pill>}
                  </a>
                </td>
                <td className="tabular font-bold">{r.stats.avg == null ? "–" : `${r.stats.avg}%`}</td>
                {COURSES.map((c) => <td key={c.id} className="tabular">{r.stats.byCourse[c.id] == null ? "–" : `${r.stats.byCourse[c.id]}%`}</td>)}
                <td className="tabular">{r.stats.done}/{r.stats.assigned}</td>
                <td>{r.stats.missing ? <Pill tone="late">{r.stats.missing}</Pill> : <span className="text-ink-2">0</span>}</td>
                <td className="text-sm">
                  <span className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full ${r.stats.status === "active" ? "bg-mint-2" : r.stats.status === "today" ? "bg-peach" : "bg-line"}`} aria-hidden="true" />
                  {lastSeen(r.minutesAgo)}
                </td>
                <td className="max-w-56 truncate text-sm text-ink-2">{r.doing?.label || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({ k, children, sort, setSort }) {
  return (
    <th className="py-2 font-bold" aria-sort={sort.key === k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
      <button type="button" className="min-h-10 rounded-lg px-1 hover:bg-soft" onClick={() => setSort({ key: k, dir: sort.key === k ? -sort.dir : 1 })}>
        {children}{sort.key === k ? (sort.dir > 0 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}

export function StudentDetail({ id }) {
  const s = useStore();
  const { roster, assignments } = classOverview(s);
  const r = roster.find((x) => x.id === id);
  if (!r) return <p>Student not found. <a href="#teacher-students" className="underline">Back to students</a></p>;
  const st = r.stats;
  const activity = r.live
    ? getState().activityLog.slice(0, 8).map((a) => ({ label: a.label, when: ago(new Date(a.at).toISOString()) }))
    : [
        ...(r.doing ? [{ label: r.doing.label, when: lastSeen(r.minutesAgo) }] : []),
        ...Object.entries(r.results)
          .sort((a, b) => new Date(b[1].submittedAt) - new Date(a[1].submittedAt))
          .slice(0, 5)
          .map(([aid, x]) => ({ label: `Turned in ${assignments.find((a) => a.id === aid)?.title}: ${x.correct}/${x.total}`, when: ago(x.submittedAt) })),
      ];

  return (
    <div className="space-y-6">
      <a href="#teacher-students" className="inline-flex min-h-11 items-center font-bold text-ink-2 no-underline">← All students</a>
      <header className="pastel flex flex-wrap items-center gap-5 rounded-[32px] bg-lilac p-6">
        <div className="rounded-full bg-white/60 p-2"><Buddy id={r.buddy} size={72} /></div>
        <div className="flex-1">
          <h1 className="font-display text-4xl">{r.name}</h1>
          <p className="muted">{r.doing?.label || `Last seen ${lastSeen(r.minutesAgo)}`}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Average</p>
          <p className="tabular font-display text-5xl">{st.avg == null ? "–" : `${st.avg}%`}</p>
          <p className="font-hand text-2xl font-bold">{letter(st.avg)}</p>
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          ["Handed in", `${st.done}/${st.assigned}`],
          ["Missing", st.missing],
          ["Late", st.late],
          ["Time on work", `${st.minutes} min`],
          ["Hints used", st.hints],
          ["Buddy chats", r.buddyChats],
        ].map(([k, v]) => (
          <li key={k} className="rounded-3xl bg-card p-4">
            <p className="text-sm font-bold text-ink-2">{k}</p>
            <p className="tabular font-display text-2xl">{v}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="g-h" className="rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="g-h" className="font-display text-2xl">Grades</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {COURSES.map((c) => (
              <div key={c.id} className={`pastel rounded-3xl p-3 ${COURSE_BG[c.color]}`}>
                <p className="text-sm font-bold">{c.name}</p>
                <p className="tabular font-display text-2xl">{st.byCourse[c.id] == null ? "–" : `${st.byCourse[c.id]}%`}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left">
              <thead className="text-sm text-ink-2"><tr><th className="py-2">Assignment</th><th>Due</th><th>Status</th><th>Score</th><th>Hints</th></tr></thead>
              <tbody className="divide-y divide-line">
                {assignments.map((a) => {
                  const x = r.results[a.id];
                  const past = a.due && new Date(a.due) < new Date();
                  return (
                    <tr key={a.id}>
                      <td className="py-2.5"><span className="font-bold">{a.title}</span><span className="block text-sm text-ink-2">{courseById(a.courseId).name}</span></td>
                      <td className="text-sm">{fmtDue(a.due).replace(/^(Was due|Due) /, "")}</td>
                      <td>{x ? <Pill tone="good">{x.late ? "Late" : "Done"}</Pill> : past ? <Pill tone="late">Missing</Pill> : <Pill>Not yet</Pill>}</td>
                      <td className="tabular font-bold">{x ? `${x.correct}/${x.total} (${percent(x.correct, x.total)}%)` : "–"}</td>
                      <td className="tabular">{x ? x.hintsUsed : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section aria-labelledby="act-h" className="self-start rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="act-h" className="font-display text-2xl">Recent activity</h2>
          <ul className="mt-3 space-y-3">
            {activity.length === 0 && <li className="text-ink-2">No activity yet.</li>}
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-lilac-2" aria-hidden="true" />
                <span><span className="block">{a.label}</span><span className="text-sm text-ink-2">{a.when}</span></span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
