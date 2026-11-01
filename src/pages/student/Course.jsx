import { useEffect, useState } from "react";
import { NOTES } from "../../lib/seed.js";
import { useStore, allAssignments, announcementsFor, myResults, courseGrade, saveMyNote, addPersonalPractice, track } from "../../lib/store.js";
import { statusOf, submissionScore, letter } from "../../lib/grading.js";
import { useBuddy } from "../../components/BuddyFloat.jsx";
import { COURSE_BG, Pill, Tabs, fmtDue, ago, courseById, Sparkle, ReadAloud } from "../../components/ui.jsx";
import UploadQuestions from "../../components/UploadQuestions.jsx";
import { go } from "../../App.jsx";

export const STATUS = {
  todo: { tone: "soft", label: "To do" },
  started: { tone: "warn", label: "Started" },
  done: { tone: "good", label: "Done" },
  late: { tone: "good", label: "Done (late)" },
  missing: { tone: "late", label: "Missing" },
  practice: { tone: "nudge", label: "Practice" },
};

export default function Course({ courseId }) {
  const c = courseById(courseId);
  const s = useStore();
  const [tab, setTab] = useState("assignments");
  const { setView } = useBuddy();
  useEffect(() => {
    if (!c) return;
    setView({ page: "course", courseId });
    track(`Looking at ${c.name}`, "course");
  }, [c, courseId, setView]);

  if (!c) return <p>We couldn't find that class. <a href="#student" className="underline">Go home</a></p>;

  const list = allAssignments(s).filter((a) => a.courseId === courseId);
  const anns = announcementsFor(courseId, s);
  const results = myResults(s);
  const avg = courseGrade(results, courseId);

  return (
    <div className="space-y-6">
      <a href="#student" className="inline-flex min-h-11 items-center gap-2 font-bold text-ink-2 no-underline hover:text-ink">← All classes</a>
      <header className={`pastel relative overflow-hidden rounded-[32px] p-6 sm:p-8 ${COURSE_BG[c.color]}`}>
        <Sparkle className="absolute right-6 top-6 h-12 w-12" color="rgba(255,255,255,.75)" />
        <span className="text-5xl" aria-hidden="true">{c.icon}</span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{c.name}</h1>
        <p className="font-hand text-3xl font-bold leading-none">with {c.teacher}</p>
        <p className="muted mt-2">{c.blurb}</p>
      </header>

      <Tabs
        label={`${c.name} sections`}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "assignments", label: "Assignments", count: list.filter((a) => ["todo", "started", "missing"].includes(statusOf(a, s.submissions[a.id]))).length || null },
          { id: "announcements", label: "Announcements" },
          { id: "grades", label: "Grades" },
          { id: "notes", label: "Notes" },
        ]}
      />

      <div role="tabpanel" aria-label={tab}>
        {tab === "assignments" && (
          <div className="space-y-5">
            <AssignmentList items={list} subs={s.submissions} />
            <details className="group rounded-[28px] bg-card p-5 sm:p-6">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-display text-xl">
                Make practice from my own notes
                <span className="grid h-9 w-9 place-items-center rounded-full bg-soft transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-1 text-ink-2">Upload a PDF or Word file (like a study sheet) and get practice questions from it.</p>
              <div className="mt-4">
                <UploadQuestions
                  compact
                  courseId={courseId}
                  cta="Make practice questions"
                  onReady={(r) => {
                    const id = `mine-${Date.now().toString(36)}`;
                    addPersonalPractice({ id, courseId, title: r.title, description: r.fileName ? `Made from ${r.fileName}` : "Made from your notes", due: null, questions: r.questions, source: r.source });
                    go(`do-${id}`);
                  }}
                />
              </div>
            </details>
          </div>
        )}

        {tab === "announcements" && (
          <ul className="space-y-3">
            {anns.length === 0 && <li className="rounded-[28px] bg-card p-5 text-ink-2">No announcements yet.</li>}
            {anns.map((a) => (
              <li key={a.id} className="rounded-[28px] bg-card p-5">
                <p className="flex items-center justify-between gap-2 text-sm text-ink-2">{a.from} · {ago(a.at)}<ReadAloud text={`${a.title}. ${a.body}`} compact label={`Read "${a.title}" aloud`} /></p>
                <h3 className="font-display text-xl">{a.title}</h3>
                <p className="mt-1">{a.body}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "grades" && (
          <div className="grid gap-5 md:grid-cols-[16rem_1fr]">
            <div className="pastel rounded-[28px] bg-butter p-6 text-center">
              <p className="font-bold">Class average</p>
              <p className="font-display text-6xl">{avg == null ? "–" : `${avg}%`}</p>
              <p className="font-hand text-3xl font-bold">{avg == null ? "nothing graded yet" : letter(avg) === "A" ? "amazing!" : "keep it up!"}</p>
            </div>
            <ul className="divide-y divide-line rounded-[28px] bg-card px-5">
              {list.filter((a) => !a.owner).map((a) => {
                const sc = submissionScore(s.submissions[a.id], a);
                const st = statusOf(a, s.submissions[a.id]);
                return (
                  <li key={a.id} className="flex min-h-16 items-center justify-between gap-3 py-3">
                    <span>
                      <span className="block font-bold">{a.title}</span>
                      <span className="text-sm text-ink-2">{fmtDue(a.due)}</span>
                    </span>
                    {sc ? <span className="tabular font-display text-xl">{sc.correct}/{sc.total} <span className="text-base text-ink-2">({sc.pct}%)</span></span> : <Pill tone={STATUS[st].tone}>{STATUS[st].label}</Pill>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "notes" && (
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-[28px] bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl">Class notes</h3>
                  <p className="text-sm text-ink-2">From {c.teacher}</p>
                </div>
                <ReadAloud text={(NOTES[courseId] || []).join(" ")} label="Read notes" />
              </div>
              <ul className="mt-3 space-y-2">
                {(NOTES[courseId] || []).map((n) => (
                  <li key={n} className="flex gap-2"><span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-lilac-2" aria-hidden="true" />{n}</li>
                ))}
              </ul>
            </section>
            <section className="pastel rounded-[28px] bg-butter p-5 sm:p-6">
              <label htmlFor="mynotes" className="font-display text-xl">My notes</label>
              <p className="muted text-sm">Saved automatically. Only you can see these.</p>
              <textarea id="mynotes" rows={9} defaultValue={s.student.myNotes[courseId] || ""} onChange={(e) => saveMyNote(courseId, e.target.value)} className="mt-3 w-full rounded-3xl border-0 bg-white/80 p-4 font-hand text-2xl leading-snug text-[#241f3a]" placeholder="Write anything you want to remember…" />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export function AssignmentList({ items, subs, showCourse = false }) {
  if (!items.length) return <p className="rounded-[28px] bg-card p-5 text-ink-2">No assignments here yet.</p>;
  const order = { missing: 0, started: 1, todo: 2, practice: 3, late: 4, done: 5 };
  const sorted = [...items].sort((a, b) => order[statusOf(a, subs[a.id])] - order[statusOf(b, subs[b.id])] || new Date(a.due || 8e15) - new Date(b.due || 8e15));
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sorted.map((a) => {
        const st = statusOf(a, subs[a.id]);
        const c = courseById(a.courseId);
        const sc = submissionScore(subs[a.id], a);
        return (
          <li key={a.id}>
            <a href={`#do-${a.id}`} className="flex h-full min-h-28 flex-col gap-2 rounded-[28px] bg-card p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-18px_rgba(36,31,58,.5)]">
              <span className="flex flex-wrap items-center gap-2">
                <Pill tone={STATUS[st].tone}>{STATUS[st].label}</Pill>
                {showCourse && <Pill tone="soft">{c.icon} {c.name}</Pill>}
                {a.owner && <Pill tone="nudge">My practice</Pill>}
              </span>
              <span className="font-display text-xl leading-tight">{a.title}</span>
              <span className="mt-auto flex justify-between gap-2 text-sm text-ink-2">
                <span>{a.questions.length} questions · {fmtDue(a.due)}</span>
                {sc && <span className="tabular font-bold text-ink">{sc.correct}/{sc.total}</span>}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
