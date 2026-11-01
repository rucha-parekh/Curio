import { useEffect } from "react";
import { COURSES } from "../../lib/seed.js";
import { useStore, allAssignments, classGoals, track } from "../../lib/store.js";
import { statusOf } from "../../lib/grading.js";
import { streakInfo } from "../../lib/streak.js";
import { greeting } from "../../lib/coach.js";
import { useBuddy } from "../../components/BuddyFloat.jsx";
import { WeekStrip, GoalCard } from "../../components/Progress.jsx";
import { COURSE_BG, Pill, fmtDue, courseById } from "../../components/ui.jsx";

export default function Home() {
  const s = useStore();
  const { setView } = useBuddy();
  useEffect(() => {
    setView({ page: "home" });
    track("On the home page", "home");
  }, [setView]);

  const work = allAssignments(s).map((a) => ({ a, st: statusOf(a, s.submissions[a.id]) }));
  const upcoming = work.filter((x) => ["todo", "started", "missing"].includes(x.st) && x.a.due).sort((x, y) => new Date(x.a.due) - new Date(y.a.due)).slice(0, 3);
  const streak = streakInfo(s.student);
  const goal = classGoals(s).find((g) => !g.done) || classGoals(s)[0];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl sm:text-5xl">
        {greeting(s.student.name).replace(/ \S+$/, "")}
        <span className="ml-2 font-hand text-[1.1em] text-ink-2">ready to learn?</span>
      </h1>

      <section aria-labelledby="courses-h">
        <h2 id="courses-h" className="sr-only">My classes</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((c) => {
            const todo = work.filter((x) => x.a.courseId === c.id && ["todo", "started", "missing"].includes(x.st)).length;
            return (
              <li key={c.id}>
                <a href={`#course-${c.id}`} className={`pastel group relative flex min-h-44 flex-col overflow-hidden rounded-[32px] p-5 no-underline transition hover:-translate-y-1 ${COURSE_BG[c.color]}`}>
                  <span className="flex items-start justify-between">
                    <span className="rounded-full bg-white/70 px-3 py-0.5 text-sm font-bold">{todo ? `${todo} to do` : "All done ✓"}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 transition group-hover:rotate-45" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="#241f3a" strokeWidth="2.2" strokeLinecap="round" /></svg>
                    </span>
                  </span>
                  <span className="mt-auto text-4xl" aria-hidden="true">{c.icon}</span>
                  <span className="font-display text-2xl leading-tight">{c.name}</span>
                  <span className="muted font-hand text-2xl font-bold leading-none">{c.teacher}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="next-h" className="rounded-[32px] bg-card p-5 sm:p-6">
        <h2 id="next-h" className="font-display text-2xl">Coming up</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-ink-2">Nothing due. Nice work! 🎉</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map(({ a, st }) => {
              const c = courseById(a.courseId);
              return (
                <li key={a.id}>
                  <a href={`#do-${a.id}`} className="flex min-h-16 items-center gap-4 py-3 no-underline">
                    <span className={`pastel grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${COURSE_BG[c.color]}`} aria-hidden="true">{c.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{a.title}</span>
                      <span className="text-sm text-ink-2">{c.name}</span>
                    </span>
                    <Pill tone={st === "missing" ? "late" : new Date(a.due) - Date.now() < 1.5 * 864e5 ? "warn" : "soft"}>{st === "started" ? "Keep going · " : ""}{fmtDue(a.due)}</Pill>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <a href="#student-badges" className="pastel block rounded-[32px] bg-butter p-5 no-underline transition hover:-translate-y-0.5 sm:p-6" aria-label={`${streak.current}-day streak. See badges and streaks`}>
          <p className="flex items-center justify-between font-display text-2xl">
            <span>🔥 {streak.current}-day streak</span>
            <span className="rounded-full bg-white/70 px-3 py-0.5 text-sm font-bold">🧊 {s.student.freezes}</span>
          </p>
          <p className="muted text-sm">{streak.activeToday ? "Today counts! ✓ Nice work." : streak.restToday ? "Rest day today 😴 Your streak is safe." : "One question today keeps it going."}</p>
          <div className="mt-3 rounded-3xl bg-white/70 p-2.5"><WeekStrip student={s.student} /></div>
        </a>
        <section aria-labelledby="goal-h" className="rounded-[32px] bg-card p-5 sm:p-6">
          <h2 id="goal-h" className="font-display text-2xl">Class goal 🤝</h2>
          <ul className="mt-2"><GoalCard goal={goal} /></ul>
        </section>
      </div>
    </div>
  );
}
