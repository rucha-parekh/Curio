import { useStore } from "../../lib/store.js";
import Buddy from "../../components/Buddy.jsx";
import { COURSE_BG, Pill, courseById, fmtDue } from "../../components/ui.jsx";
import { classOverview } from "./metrics.js";

export default function Overview() {
  const s = useStore();
  const o = classOverview(s);
  const attention = o.roster.filter((r) => r.stats.needsHelp).sort((a, b) => (a.stats.avg ?? 0) - (b.stats.avg ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-3xl">
          Class 7B
          <span className="ml-2 font-hand text-[1.15em] text-ink-2">at a glance</span>
        </h2>
        <a href="#teacher-new" className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-bold text-on-brand no-underline">+ New assignment</a>
      </div>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile bg="bg-lilac" label="Class average" value={o.classAvg == null ? "–" : `${o.classAvg}%`} />
        <Tile bg="bg-mint" label="Handed in on time" value={`${o.onTime}%`} />
        <Tile bg="bg-nectarine" label="Missing assignments" value={o.missing} />
        <Tile bg="bg-butter" label="Working right now" value={`${o.active.length} of ${o.roster.length}`} />
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="att-h" className="rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="att-h" className="font-display text-2xl">Needs a check-in</h2>
          <p className="text-sm text-ink-2">Average under 70%, or 2+ missing assignments.</p>
          <ul className="mt-3 divide-y divide-line">
            {attention.length === 0 && <li className="py-3 text-ink-2">Everyone's on track.</li>}
            {attention.map((r) => (
              <li key={r.id}>
                <a href={`#teacher-student-${r.id}`} className="flex min-h-14 items-center gap-3 py-2 no-underline hover:bg-soft">
                  <Buddy id={r.buddy} size={36} />
                  <span className="flex-1 font-bold">{r.name}{r.live && <Pill tone="good" className="ml-2">live</Pill>}</span>
                  <span className="tabular text-sm">{r.stats.avg ?? "–"}% avg</span>
                  {r.stats.missing > 0 && <Pill tone="late">{r.stats.missing} missing</Pill>}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="now-h" className="rounded-[28px] bg-card p-5 sm:p-6">
          <h2 id="now-h" className="font-display text-2xl">Right now</h2>
          <p className="text-sm text-ink-2">What students are working on (last 20 minutes).</p>
          <ul className="mt-3 divide-y divide-line">
            {o.active.length === 0 && <li className="py-3 text-ink-2">Nobody is online right now.</li>}
            {o.active.map((r) => (
              <li key={r.id}>
                <a href={`#teacher-student-${r.id}`} className="flex min-h-14 items-center gap-3 py-2 no-underline hover:bg-soft">
                  <Buddy id={r.buddy} size={36} />
                  <span className="w-20 shrink-0 font-bold">{r.name}</span>
                  <span className="flex-1 text-sm text-ink-2">{r.doing?.label || "Browsing"}{r.doing?.question && !r.doing.label.includes("question") ? ` · question ${r.doing.question}` : ""}</span>
                  {r.live && <Pill tone="good">live</Pill>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="ca-h" className="rounded-[28px] bg-card p-5 sm:p-6">
        <h2 id="ca-h" className="font-display text-2xl">By subject</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {o.courseAvgs.map((c) => (
            <li key={c.id} className={`pastel rounded-3xl p-4 ${COURSE_BG[c.color]}`}>
              <p className="font-bold">{c.icon} {c.name}</p>
              <p className="tabular font-display text-3xl">{c.avg == null ? "–" : `${c.avg}%`}</p>
              <div className="mt-2 h-2.5 rounded-full bg-white/60"><div className="h-full rounded-full bg-[#241f3a]" style={{ width: `${c.avg || 0}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pa-h" className="rounded-[28px] bg-card p-5 sm:p-6">
        <h2 id="pa-h" className="font-display text-2xl">Assignments</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
            <thead className="text-sm text-ink-2">
              <tr><th className="py-2 font-bold">Assignment</th><th className="font-bold">Due</th><th className="font-bold">Handed in</th><th className="font-bold">Average</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {o.perAssignment.sort((x, y) => new Date(x.a.due) - new Date(y.a.due)).map(({ a, submitted, total, avg }) => (
                <tr key={a.id}>
                  <td className="py-3"><span className="font-bold">{a.title}</span> <span className="text-sm text-ink-2">· {courseById(a.courseId).name}</span></td>
                  <td className="text-sm">{fmtDue(a.due).replace(/^Due /, "")}</td>
                  <td className="tabular">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-20 rounded-full bg-soft"><span className="block h-full rounded-full bg-mint-2" style={{ width: `${(submitted / total) * 100}%` }} /></span>
                      {submitted}/{total}
                    </span>
                  </td>
                  <td className="tabular font-bold">{avg == null ? "–" : `${avg}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ bg, label, value }) {
  return (
    <li className={`pastel rounded-[28px] p-5 ${bg}`}>
      <p className="font-bold">{label}</p>
      <p className="tabular font-display text-4xl">{value}</p>
    </li>
  );
}
