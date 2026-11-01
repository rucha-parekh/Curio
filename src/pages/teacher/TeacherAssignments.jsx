import { useState } from "react";
import { COURSES } from "../../lib/seed.js";
import { useStore, publishAssignment, deleteAssignment, setDue } from "../../lib/store.js";
import { QUESTION_TYPES, percent } from "../../lib/grading.js";
import Buddy from "../../components/Buddy.jsx";
import { Button, Pill, courseById, COURSE_BG, fmtWhen } from "../../components/ui.jsx";
import UploadQuestions from "../../components/UploadQuestions.jsx";
import { youTubeId } from "../../components/AssignmentPlayer.jsx";
import { classOverview, isSeed, completionFor } from "./metrics.js";
import { go } from "../../App.jsx";

const toLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function TeacherAssignments({ creating }) {
  const s = useStore();
  const { perAssignment, roster } = classOverview(s);
  if (creating) return <Builder />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl">Assignments</h1>
        <a href="#teacher-new" className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-bold text-on-brand no-underline">+ New assignment</a>
      </div>
      <AssignmentRows rows={perAssignment.sort((x, y) => new Date(y.a.due) - new Date(x.a.due))} roster={roster} />
    </div>
  );
}

/** One card per assignment: hand-in rate, deadline, and a drop-down of who finished it and when. */
export function AssignmentRows({ rows, roster, showCourse = true }) {
  if (!rows.length) return <p className="rounded-[28px] bg-card p-5 text-ink-2">No assignments here yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map(({ a, submitted, total, avg }) => {
        const c = courseById(a.courseId);
        const who = completionFor(a, roster);
        return (
          <li key={a.id} className="rounded-[28px] bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`pastel grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${COURSE_BG[c.color]}`} aria-hidden="true">{c.icon}</span>
              <div className="min-w-48 flex-1">
                <p className="font-display text-xl leading-tight">{a.title}</p>
                <p className="text-sm text-ink-2">{showCourse && `${c.name} · `}{a.questions.length} questions{typesOf(a) && ` · ${typesOf(a)}`} {a.video?.url && "· 🎬 video"} {a.from === "teacher" && <Pill tone="nudge" className="ml-1">Yours</Pill>}</p>
              </div>
              <p className="tabular text-sm"><span className="font-bold">{submitted}/{total}</span> handed in · avg <span className="font-bold">{avg == null ? "–" : `${avg}%`}</span></p>
              <label className="text-sm font-bold">
                Deadline
                <input type="datetime-local" value={toLocal(a.due)} onChange={(e) => e.target.value && setDue(a.id, new Date(e.target.value).toISOString())} className="ml-2 min-h-11 rounded-full border-2 border-line bg-card px-3 text-ink" />
              </label>
              {!isSeed(a.id) && (
                <Button variant="ghost" className="min-h-11" onClick={() => confirm(`Delete "${a.title}"?`) && deleteAssignment(a.id)}>Delete</Button>
              )}
            </div>
            <details className="group mt-3 rounded-2xl bg-soft px-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold">
                Who's done and when
                <span className="text-sm font-normal text-ink-2">✓ {who.filter((w) => w.x).length} done · ✗ {who.filter((w) => w.status === "missing").length} missing · {who.filter((w) => w.status === "notyet").length} not yet <span aria-hidden="true" className="ml-1 inline-block transition group-open:rotate-45">+</span></span>
              </summary>
              <ul className="grid gap-x-6 pb-3 sm:grid-cols-2">
                {who.map(({ r, x, status, at }) => (
                  <li key={r.id} className="flex min-h-11 items-center gap-2 border-t border-line py-1.5">
                    <Buddy id={r.buddy} size={26} />
                    <a href={`#teacher-student-${r.id}`} className="flex-1 font-bold no-underline hover:underline">{r.name}{r.live && " (live)"}</a>
                    <StatusChip status={status} />
                    <span className="tabular w-36 text-right text-sm text-ink-2">{at ? fmtWhen(at) : "–"}</span>
                    <span className="tabular w-12 text-right text-sm font-bold">{x ? `${percent(x.correct, x.total)}%` : ""}</span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

const typesOf = (a) => [...new Set(a.questions.map((q) => q.type))].filter((t) => ["order", "match", "slider"].includes(t)).map((t) => QUESTION_TYPES[t]).join(", ");

/** Icon + word, so it reads the same for colour-blind teachers. */
export function StatusChip({ status }) {
  const m = { done: ["good", "✓ Done"], late: ["warn", "✓ Late"], missing: ["late", "✗ Missing"], notyet: ["soft", "… Not yet"] }[status];
  return <Pill tone={m[0]}>{m[1]}</Pill>;
}

const newId = () => `q${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
const blankQ = (type = "mc") => {
  const base = { id: newId(), type, prompt: "", hint: "", explanation: "" };
  if (type === "mc") return { ...base, options: ["", "", "", ""], answer: 0 };
  if (type === "tf") return { ...base, answer: true };
  if (type === "short") return { ...base, answer: "" };
  if (type === "order") return { ...base, items: ["", "", ""] };
  if (type === "match") return { ...base, pairs: [["", ""], ["", ""], ["", ""]] };
  return { ...base, min: 0, max: 100, step: 1, answer: 50, tolerance: 0, unit: "" };
};

const filled = (list) => list.every((x) => String(x).trim());
const unique = (list) => new Set(list.map((x) => String(x).trim().toLowerCase())).size === list.length;
/** Returns "" when the question is ready, or what's missing. */
export function questionProblem(q) {
  if (!q.prompt.trim()) return "Write the question.";
  if (q.type === "mc" && !filled(q.options)) return "Fill in every option.";
  if (q.type === "short" && !String(q.answer).trim()) return "Add the correct answer.";
  if (q.type === "order" && (q.items.length < 2 || !filled(q.items) || !unique(q.items))) return "Add at least 2 different steps.";
  if (q.type === "match" && (q.pairs.length < 2 || !filled(q.pairs.flat()) || !unique(q.pairs.map((p) => p[0])) || !unique(q.pairs.map((p) => p[1])))) return "Fill in at least 2 pairs, with no repeats on either side.";
  if (q.type === "slider") {
    const [min, max, step, ans] = [q.min, q.max, q.step, q.answer].map(Number);
    if (!(min < max) || !(step > 0) || !(ans >= min && ans <= max)) return "The answer must be between the start and the end, and the step must be above 0.";
  }
  return "";
}

const field = "mt-1 block min-h-11 w-full rounded-full border-2 border-line bg-card px-3 text-base font-normal text-ink";
const QUICK = ["mc", "short", "tf"];
const INTERACTIVE = ["order", "match", "slider"];

export function Builder({ courseId: fixedCourse, onDone }) {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(fixedCourse || COURSES[0].id);
  const [due, setDueLocal] = useState(() => toLocal(new Date(Date.now() + 3 * 864e5).setHours(21, 0, 0, 0)));
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [source, setSource] = useState(null);
  const [video, setVideo] = useState({ url: "", transcript: "", captionsUrl: "" });

  const Heading = fixedCourse ? "h2" : "h1"; // inside a class page, the page already has its h1
  const upd = (i, patch) => setQuestions(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const videoProblem = video.url.trim() && !video.transcript.trim() ? "Add a transcript for the video, so every student can follow it." : "";
  const valid = title.trim() && due && questions.length > 0 && questions.every((q) => !questionProblem(q)) && !videoProblem;

  return (
    <div className="space-y-6">
      {!fixedCourse && <a href="#teacher-assignments" className="inline-flex min-h-11 items-center font-bold text-ink-2 no-underline">← Assignments</a>}
      <Heading className={fixedCourse ? "font-display text-3xl" : "font-display text-4xl"}>New assignment{fixedCourse && ` for ${courseById(fixedCourse).name}`}</Heading>

      <section className="grid gap-4 rounded-[28px] bg-card p-5 sm:grid-cols-2 sm:p-6">
        <label className="font-bold sm:col-span-2">Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className="mt-1 block min-h-12 w-full rounded-full border-2 border-line bg-card px-4 font-normal text-ink" />
        </label>
        {!fixedCourse && (
          <label className="font-bold">Class
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 block min-h-12 w-full rounded-full border-2 border-line bg-card px-4 font-normal text-ink">
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <label className="font-bold">Deadline
          <input type="datetime-local" value={due} onChange={(e) => setDueLocal(e.target.value)} className="mt-1 block min-h-12 w-full rounded-full border-2 border-line bg-card px-4 font-normal text-ink" />
        </label>
        <label className="font-bold sm:col-span-2">Instructions for students (optional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={140} className="mt-1 block min-h-12 w-full rounded-full border-2 border-line bg-card px-4 font-normal text-ink" />
        </label>
      </section>

      <section aria-labelledby="gen-h" className="pastel rounded-[28px] bg-lilac p-5 sm:p-6">
        <h3 id="gen-h" className="font-display text-2xl">Make questions from a file</h3>
        <p className="muted">Upload a worksheet, chapter or notes (PDF or Word). You can edit every question before publishing.</p>
        <div className="mt-3 rounded-3xl bg-card p-4 text-ink">
          <UploadQuestions
            compact
            courseId={courseId}
            cta="Generate questions"
            onReady={(r) => {
              setQuestions([...questions, ...r.questions.map((q) => ({ ...q, id: newId() }))]);
              if (!title.trim()) setTitle(r.title.replace(/^Practice: /, ""));
              setSource(r.source);
            }}
          />
        </div>
        {source && <p className="mt-2 text-sm font-bold">{source === "claude" ? "Questions written by Claude from your file." : "Questions made by the built-in generator (AI not connected). Check them over."}</p>}
      </section>

      <section aria-labelledby="vid-h" className="rounded-[28px] bg-card p-5 sm:p-6">
        <h3 id="vid-h" className="font-display text-2xl">Add a video (optional)</h3>
        <p className="text-sm text-ink-2">YouTube link or a video file link. Captions are switched on for students, and a transcript is required so everyone can follow along.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Video link
            <input value={video.url} onChange={(e) => setVideo({ ...video, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className={field} />
          </label>
          {video.url.trim() && !youTubeId(video.url) && (
            <label className="text-sm font-bold">Captions file (.vtt, optional)
              <input value={video.captionsUrl} onChange={(e) => setVideo({ ...video, captionsUrl: e.target.value })} placeholder="https://…/captions.vtt" className={field} />
            </label>
          )}
          {video.url.trim() && (
            <label className="text-sm font-bold sm:col-span-2">Transcript (required)
              <textarea rows={4} value={video.transcript} onChange={(e) => setVideo({ ...video, transcript: e.target.value })} className="mt-1 block w-full rounded-2xl border-2 border-line bg-card p-3 text-base font-normal text-ink" />
            </label>
          )}
        </div>
        {videoProblem && <p role="alert" className="mt-2 font-bold text-nudge">{videoProblem}</p>}
      </section>

      <section aria-labelledby="qs-h" className="space-y-3">
        <h3 id="qs-h" className="font-display text-2xl">Questions ({questions.length})</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink-2">Quick check:</span>
          {QUICK.map((t) => <Button key={t} variant="soft" onClick={() => setQuestions([...questions, blankQ(t)])}>+ {QUESTION_TYPES[t]}</Button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink-2">Interactive:</span>
          {INTERACTIVE.map((t) => <Button key={t} variant="pastel" onClick={() => setQuestions([...questions, blankQ(t)])}>+ {{ order: "🧩", match: "🔗", slider: "🎚️" }[t]} {QUESTION_TYPES[t]}</Button>)}
        </div>
        {questions.length === 0 && <p className="rounded-[28px] bg-card p-5 text-ink-2">Generate questions from a file, or add your own.</p>}
        <ol className="space-y-3">
          {questions.map((q, i) => {
            const problem = questionProblem(q);
            return (
              <li key={q.id} className="rounded-[28px] bg-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{i + 1}. {QUESTION_TYPES[q.type]}{problem ? "" : " ✓"}</p>
                  <Button variant="ghost" className="min-h-10" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} aria-label={`Remove question ${i + 1}`}>Remove</Button>
                </div>
                <label className="mt-2 block text-sm font-bold">Question
                  <textarea rows={2} value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} className="mt-1 block w-full rounded-2xl border-2 border-line bg-card p-3 text-base font-normal text-ink" />
                </label>
                <QuestionEditor q={q} upd={(patch) => upd(i, patch)} />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="block text-sm font-bold">Hint for students (optional)
                    <input value={q.hint} onChange={(e) => upd(i, { hint: e.target.value })} className={field} />
                  </label>
                  <label className="block text-sm font-bold">Why it's right (shown after, optional)
                    <input value={q.explanation || ""} onChange={(e) => upd(i, { explanation: e.target.value })} className={field} />
                  </label>
                </div>
                {problem && q.prompt.trim() && <p className="mt-2 text-sm font-bold text-nudge">{problem}</p>}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={!valid}
          onClick={() => {
            const id = `t-${Date.now().toString(36)}`;
            const v = video.url.trim() ? { url: video.url.trim(), transcript: video.transcript.trim(), captionsUrl: video.captionsUrl.trim() || undefined } : undefined;
            publishAssignment({ id, courseId, title: title.trim(), description: description.trim(), due: new Date(due).toISOString(), video: v, questions: questions.map((q, i) => clean({ ...q, id: `q${i + 1}` })) });
            onDone ? onDone() : go("teacher-assignments");
          }}
        >
          Publish to students
        </Button>
        {!valid && <p className="text-sm text-ink-2">Add a title, a deadline and at least one finished question.</p>}
      </div>
    </div>
  );
}

/** Trims text and stores numbers as numbers before publishing. */
function clean(q) {
  const t = (x) => String(x).trim();
  if (q.type === "order") return { ...q, items: q.items.map(t) };
  if (q.type === "match") return { ...q, pairs: q.pairs.map(([l, r]) => [t(l), t(r)]) };
  if (q.type === "slider") return { ...q, min: Number(q.min), max: Number(q.max), step: Number(q.step), answer: Number(q.answer), tolerance: Number(q.tolerance) || 0, unit: t(q.unit || "") };
  return q;
}

function QuestionEditor({ q, upd }) {
  if (q.type === "mc") {
    return (
      <fieldset className="mt-2">
        <legend className="text-sm font-bold">Options (pick the right one)</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {q.options.map((o, k) => (
            <div key={k} className="flex items-center gap-2">
              <input type="radio" name={`c-${q.id}`} checked={q.answer === k} onChange={() => upd({ answer: k })} aria-label={`Option ${k + 1} is correct`} className="h-5 w-5 accent-[var(--mint-2)]" />
              <input value={o} onChange={(e) => upd({ options: q.options.map((x, m) => (m === k ? e.target.value : x)) })} aria-label={`Option ${k + 1}`} className="min-h-11 flex-1 rounded-full border-2 border-line bg-card px-3 text-ink" />
            </div>
          ))}
        </div>
      </fieldset>
    );
  }
  if (q.type === "tf") {
    return (
      <fieldset className="mt-2 flex gap-4">
        <legend className="text-sm font-bold">Correct answer</legend>
        {[true, false].map((v) => (
          <label key={String(v)} className="flex min-h-11 items-center gap-2"><input type="radio" checked={q.answer === v} onChange={() => upd({ answer: v })} className="h-5 w-5" />{v ? "True" : "False"}</label>
        ))}
      </fieldset>
    );
  }
  if (q.type === "short") {
    return (
      <label className="mt-2 block text-sm font-bold">Correct answer
        <input value={q.answer} onChange={(e) => upd({ answer: e.target.value })} className={`${field} max-w-sm`} />
        <span className="mt-1 block font-normal text-ink-2">Small spelling slips and equal numbers (9/4 = 2.25) are accepted automatically.</span>
      </label>
    );
  }
  if (q.type === "order") {
    return (
      <fieldset className="mt-2">
        <legend className="text-sm font-bold">Steps in the RIGHT order (students see them shuffled)</legend>
        <ol className="mt-1 space-y-2">
          {q.items.map((it, k) => (
            <li key={k} className="flex items-center gap-2">
              <span className="w-6 text-right font-bold">{k + 1}.</span>
              <input value={it} onChange={(e) => upd({ items: q.items.map((x, m) => (m === k ? e.target.value : x)) })} aria-label={`Step ${k + 1}`} className="min-h-11 flex-1 rounded-full border-2 border-line bg-card px-3 text-ink" />
              <button type="button" disabled={q.items.length <= 2} onClick={() => upd({ items: q.items.filter((_, m) => m !== k) })} aria-label={`Remove step ${k + 1}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft disabled:opacity-30">×</button>
            </li>
          ))}
        </ol>
        {q.items.length < 6 && <Button variant="ghost" className="mt-1 min-h-10" onClick={() => upd({ items: [...q.items, ""] })}>+ Add step</Button>}
      </fieldset>
    );
  }
  if (q.type === "match") {
    return (
      <fieldset className="mt-2">
        <legend className="text-sm font-bold">Pairs (students see the right side shuffled)</legend>
        <ul className="mt-1 space-y-2">
          {q.pairs.map(([l, r], k) => (
            <li key={k} className="flex flex-wrap items-center gap-2">
              <input value={l} onChange={(e) => upd({ pairs: q.pairs.map((p, m) => (m === k ? [e.target.value, p[1]] : p)) })} aria-label={`Pair ${k + 1}, left`} placeholder="Word" className="min-h-11 min-w-32 flex-1 rounded-full border-2 border-line bg-card px-3 text-ink" />
              <span aria-hidden="true">→</span>
              <input value={r} onChange={(e) => upd({ pairs: q.pairs.map((p, m) => (m === k ? [p[0], e.target.value] : p)) })} aria-label={`Pair ${k + 1}, right`} placeholder="Its match" className="min-h-11 min-w-32 flex-1 rounded-full border-2 border-line bg-card px-3 text-ink" />
              <button type="button" disabled={q.pairs.length <= 2} onClick={() => upd({ pairs: q.pairs.filter((_, m) => m !== k) })} aria-label={`Remove pair ${k + 1}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft disabled:opacity-30">×</button>
            </li>
          ))}
        </ul>
        {q.pairs.length < 6 && <Button variant="ghost" className="mt-1 min-h-10" onClick={() => upd({ pairs: [...q.pairs, ["", ""]] })}>+ Add pair</Button>}
      </fieldset>
    );
  }
  return (
    <fieldset className="mt-2">
      <legend className="text-sm font-bold">Number line</legend>
      <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-6">
        {[["min", "Starts at"], ["max", "Ends at"], ["step", "Step"], ["answer", "Correct answer"], ["tolerance", "Allow ±"]].map(([k, label]) => (
          <label key={k} className="text-sm font-bold">{label}
            <input type="number" value={q[k]} onChange={(e) => upd({ [k]: e.target.value })} className={field} />
          </label>
        ))}
        <label className="text-sm font-bold">Unit
          <input value={q.unit || ""} maxLength={6} onChange={(e) => upd({ unit: e.target.value })} placeholder="%, cm…" className={field} />
        </label>
      </div>
    </fieldset>
  );
}
