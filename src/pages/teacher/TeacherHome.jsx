import { COURSES } from "../../lib/seed.js";
import { useStore } from "../../lib/store.js";
import { COURSE_BG } from "../../components/ui.jsx";
import { classOverview } from "./metrics.js";
import Overview from "./Overview.jsx";

/** Teacher landing: the subjects you teach to Class 7B first, then the class at a glance. */
export default function TeacherHome() {
  const s = useStore();
  const o = classOverview(s);
  const now = Date.now();
  return (
    <div className="space-y-8">
      <section aria-labelledby="classes-h">
        <h1 id="classes-h" className="font-display text-4xl">
          My classes
          <span className="ml-2 font-hand text-[1.15em] text-ink-2">Class 7B</span>
        </h1>
        <p className="text-ink-2">Pick a subject to see its assignments, who's done what, and to make new work.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((c) => {
            const rows = o.perAssignment.filter(({ a }) => a.courseId === c.id);
            const current = rows.filter(({ a }) => !a.due || new Date(a.due).getTime() >= now).length;
            const missing = o.roster.reduce((n, r) => n + rows.filter(({ a }) => a.due && new Date(a.due).getTime() < now && !r.results[a.id]).length, 0);
            const avg = o.courseAvgs.find((x) => x.id === c.id)?.avg;
            return (
              <li key={c.id}>
                <a href={`#teacher-class-${c.id}`} className={`pastel group flex min-h-48 flex-col rounded-[32px] p-5 no-underline transition hover:-translate-y-1 ${COURSE_BG[c.color]}`}>
                  <span className="flex items-start justify-between">
                    <span className="text-4xl" aria-hidden="true">{c.icon}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 transition group-hover:rotate-45" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="#241f3a" strokeWidth="2.2" strokeLinecap="round" /></svg>
                    </span>
                  </span>
                  <span className="mt-2 font-display text-2xl leading-tight">{c.name}</span>
                  <span className="muted font-bold">Class 7B · {o.roster.length} students</span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-3 text-sm font-bold">
                    <span className="rounded-full bg-white/70 px-2.5 py-0.5">{current} current</span>
                    <span className="rounded-full bg-white/70 px-2.5 py-0.5">avg {avg == null ? "–" : `${avg}%`}</span>
                    {missing > 0 && <span className="rounded-full bg-white/70 px-2.5 py-0.5">✗ {missing} missing</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
      <Overview />
    </div>
  );
}
