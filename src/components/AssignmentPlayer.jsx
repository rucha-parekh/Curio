import { useEffect, useMemo, useState } from "react";
import { useStore, assignmentById, answerQuestion, submitAssignment, noteHint, rewardImprovement, track } from "../lib/store.js";
import { isCorrect, answerText, submissionScore, hasAnswer, STARS } from "../lib/grading.js";
import { cheerFor, notYet, questionIntro, fresh } from "../lib/coach.js";
import { useBuddy } from "./BuddyFloat.jsx";
import Buddy from "./Buddy.jsx";
import { Button, Feedback, Pill, COURSE_BG, courseById, fmtDue, StarCount, Sparkle, ReadAloud } from "./ui.jsx";

export default function AssignmentPlayer({ assignmentId }) {
  const s = useStore();
  const a = assignmentById(assignmentId, s);
  const sub = s.submissions[assignmentId];
  const [practice, setPractice] = useState(false);
  const [celebrate, setCelebrate] = useState(null);

  if (!a) return <p>We couldn't find that assignment. <a href="#student-assignments" className="underline">See all assignments</a></p>;
  const c = courseById(a.courseId);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <a href={`#course-${a.courseId}`} className="inline-flex min-h-11 items-center gap-2 font-bold text-ink-2 no-underline hover:text-ink">← {c.name}</a>
      <header className={`pastel rounded-[32px] p-5 sm:p-6 ${COURSE_BG[c.color]}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="white">{c.icon} {c.name}</Pill>
          <Pill tone="white">{fmtDue(a.due)}</Pill>
          {a.owner && <Pill tone="white">My practice</Pill>}
        </div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{a.title}</h1>
        {a.description && <p className="muted">{a.description}</p>}
      </header>
      {a.video?.url && <VideoBlock video={a.video} />}
      {a.passage && (
        <section className="rounded-[28px] bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">Read this first</h2>
            <ReadAloud text={a.passage} />
          </div>
          <p className="mt-1 text-lg">{a.passage}</p>
        </section>
      )}
      {celebrate ? (
        <Celebrate a={a} stars={celebrate.stars} practice={celebrate.practice} onBack={() => { setCelebrate(null); setPractice(false); }} />
      ) : sub?.submittedAt && !practice ? (
        <Review a={a} sub={sub} onPractice={() => setPractice(true)} />
      ) : (
        <Player key={practice ? "practice" : "real"} a={a} sub={practice ? null : sub} practice={practice} onFinished={(stars) => setCelebrate({ stars, practice })} />
      )}
    </div>
  );
}

/** Same shuffle every time for a question, and never already in the right order. */
function shuffled(list, seedText) {
  let seed = [...seedText].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 233280, 7);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === list[i])) out.push(out.shift());
  return out;
}

function startValue(q) {
  if (q.type === "order") return shuffled(q.items, q.id + q.prompt);
  if (q.type === "match") return q.pairs.map(() => "");
  if (q.type === "slider") {
    const step = Number(q.step) || 1;
    const mid = Math.round((Number(q.min) + Number(q.max)) / 2 / step) * step;
    return mid === Number(q.answer) ? Number(q.min) : mid;
  }
  return "";
}

function Player({ a, sub, practice, onFinished }) {
  const { setView, say, open } = useBuddy();
  const answers = practice ? {} : sub?.answers || {};
  const firstOpen = a.questions.findIndex((q) => !answers[q.id]?.correct);
  const [idx, setIdx] = useState(firstOpen === -1 ? a.questions.length : firstOpen);
  const [local, setLocal] = useState({}); // practice-mode answers
  const q = a.questions[idx];
  const state = practice ? local[q?.id] : answers[q?.id];
  const [value, setValue] = useState(() => (q ? (state?.correct ? state.value : startValue(q)) : ""));
  const [fb, setFb] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [inRow, setInRow] = useState(0);

  useEffect(() => {
    setView({ page: "assignment", courseId: a.courseId, assignmentId: a.id, question: q, lastAnswer: state?.value != null ? displayValue(q, state.value) : undefined, lastCorrect: state?.correct });
    if (q) track(`Working on ${a.title} (question ${idx + 1} of ${a.questions.length})`, "assignment");
  }, [a, q, idx, state, setView]);

  // A short, useful line when a new question appears (puzzles, halfway, last one).
  useEffect(() => {
    const line = q && questionIntro(q, idx, a.questions.length);
    if (!line) return;
    const t = setTimeout(() => say(line, "talk", 6000), 1200);
    return () => clearTimeout(t);
  }, [idx, q, a.questions.length, say]);

  function check() {
    if (!hasAnswer(q, value)) return;
    let correct, tries, starsEarned = 0;
    if (practice) {
      correct = isCorrect(q, value);
      const prev = local[q.id] || { tries: 0 };
      tries = prev.tries + 1;
      setLocal({ ...local, [q.id]: { value, correct, tries } });
    } else {
      ({ correct, starsEarned, tries } = answerQuestion(a.id, q, value));
    }
    if (correct) {
      const row = tries === 1 ? inRow + 1 : 0;
      setInRow(row);
      setFb({ tone: "good", title: fresh(["Yes! Nailed it.", "Great thinking!", "That's it! 🎉", "Brain power!", "Spot on!"]), body: q.explanation, stars: starsEarned, comeback: tries > 1 });
      say(cheerFor({ tries, streak: row }), "cheer", 4500, { shout: true });
    } else {
      setInRow(0);
      setFb({ tone: "nudge", title: fresh(["Not quite. Try again!", "Almost! Have another go.", "Good try! Look again.", "Not yet. You're getting closer!"]), body: "Your buddy has a tip for you. 👉" });
      say(notYet(q, tries, value), "sad", 12000, { action: { label: "Help me more", ask: "Can you help me with the next step?" } });
    }
  }

  function next() {
    const nq = a.questions[idx + 1];
    setFb(null);
    setValue(nq ? startValue(nq) : "");
    setShowHint(false);
    setIdx(idx + 1);
  }

  const total = a.questions.length;
  const allCorrect = a.questions.every((x) => (practice ? local[x.id] : answers[x.id])?.correct);

  if (idx >= total) {
    return (
      <section className="rounded-[32px] bg-card p-6 text-center sm:p-10">
        <h2 className="font-display text-3xl">All questions answered!</h2>
        <p className="mt-2 text-ink-2">{practice ? "Nice practice run. Let's see if you beat your score!" : a.owner ? "Save your score?" : `Ready to hand it in to ${courseById(a.courseId).teacher}?`}</p>
        <Button
          className="mt-5"
          disabled={!allCorrect}
          onClick={() => {
            if (!practice) return onFinished(submitAssignment(a));
            const firstTries = a.questions.filter((x) => local[x.id]?.tries === 1).length;
            onFinished(rewardImprovement(a, firstTries));
          }}
        >
          {practice ? "Finish practice" : a.owner ? "Save my score" : "Turn it in"}
        </Button>
      </section>
    );
  }

  const readText = () => `${q.prompt}. ${q.type === "mc" ? q.options.map((o, i) => `${"ABCDE"[i]}: ${o}.`).join(" ") : q.type === "tf" ? "True or false?" : q.type === "order" ? `Put in order: ${value.join(". ")}.` : q.type === "match" ? `Match: ${q.pairs.map((p) => p[0]).join(", ")}.` : ""}`;

  return (
    <section className="relative rounded-[32px] bg-card p-5 sm:p-8" aria-labelledby="q-prompt">
      {/* The study buddy glides over to sit here, beside the question. */}
      <div id="buddy-dock" aria-hidden="true" className="pointer-events-none absolute right-0 top-16 h-0 w-0" />
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink-2">Question {idx + 1} of {total}{practice && " · practice"}</p>
        {/* Done = filled dot, now = long pill, to do = hollow ring. Shape tells them apart, not just colour. */}
        <ol className="flex items-center gap-1.5" aria-hidden="true">
          {a.questions.map((x, i) => {
            const st = practice ? local[x.id] : answers[x.id];
            return <li key={x.id} className={`h-3 rounded-full ${st?.correct ? "w-3 bg-mint-2" : i === idx ? "w-7 bg-lilac-2" : "w-3 border-2 border-ink-2/50"}`} />;
          })}
        </ol>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h2 id="q-prompt" className="font-display text-2xl leading-snug sm:text-3xl">{q.prompt}</h2>
        <ReadAloud text={readText} compact label="Read the question aloud" />
      </div>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!state?.correct) check();
        }}
      >
        <AnswerInput q={q} value={value} onChange={(v) => { setValue(v); setFb(null); }} locked={!!state?.correct} />
        {!state?.correct && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" disabled={!hasAnswer(q, value)}>Check</Button>
            {q.hint && (
              <Button
                variant="soft"
                onClick={() => {
                  if (!showHint && !practice) {
                    noteHint(a.id);
                    say(fresh([`Asking for help is a superpower! 🦸 +${STARS.askHelp} stars`, `Smart move! Hints help you learn. +${STARS.askHelp} stars 💡`]), "wow", 3500);
                  }
                  setShowHint(true);
                }}
              >
                💡 Hint
              </Button>
            )}
            <Button variant="ghost" onClick={() => open("Can you help me think through this question? Don't tell me the answer.")}>Ask my buddy</Button>
          </div>
        )}
      </form>
      {showHint && !state?.correct && <p className="pop mt-4 rounded-3xl bg-butter p-4 font-semibold text-pastel-ink">💡 {q.hint}</p>}
      {fb && (
        <Feedback tone={fb.tone} title={`${fb.tone === "good" ? "✓" : "✗"} ${fb.title}`}>
          {fb.comeback && <p className="font-bold">You kept trying until you got it. That's real learning! 💪</p>}
          {fb.body && <p>{fb.body}</p>}
          {fb.stars > 0 && <p className="mt-1 font-bold">+<StarCount n={fb.stars} /></p>}
        </Feedback>
      )}
      {state?.correct && (
        <Button className="mt-5" onClick={next}>{idx + 1 < total ? "Next question" : "Finish"}</Button>
      )}
    </section>
  );
}

function AnswerInput({ q, value, onChange, locked }) {
  if (q.type === "order") return <OrderInput q={q} value={value} onChange={onChange} locked={locked} />;
  if (q.type === "match") return <MatchInput q={q} value={value} onChange={onChange} locked={locked} />;
  if (q.type === "slider") return <SliderInput q={q} value={value} onChange={onChange} locked={locked} />;
  if (q.type === "mc" || q.type === "tf") {
    const opts = q.type === "tf" ? [["true", "True"], ["false", "False"]] : q.options.map((o, i) => [String(i), o]);
    return (
      <fieldset disabled={locked}>
        <legend className="sr-only">Choose an answer</legend>
        <div className={`grid gap-3 ${q.type === "tf" ? "grid-cols-2" : "sm:grid-cols-2"}`}>
          {opts.map(([v, label], i) => {
            const on = String(value) === v;
            return (
              <label key={v} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-3xl border-[3px] px-4 py-3 text-lg font-bold transition ${on ? "border-ink bg-nudge-bg" : "border-line hover:border-lilac-2"}`}>
                <input type="radio" name={`ans-${q.id}`} value={v} checked={on} onChange={() => onChange(q.type === "tf" ? v : Number(v))} className="sr-only" />
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${on ? "bg-brand text-on-brand" : "bg-soft"}`} aria-hidden="true">{q.type === "tf" ? (v === "true" ? "✓" : "✗") : "ABCDE"[i]}</span>
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }
  return (
    <>
      <label htmlFor={`a-${q.id}`} className="block font-bold">Your answer</label>
      <input id={`a-${q.id}`} value={value} disabled={locked} onChange={(e) => onChange(e.target.value)} autoComplete="off" className="mt-2 min-h-14 w-full max-w-sm rounded-full border-[3px] border-line bg-card px-5 text-xl text-ink focus:border-lilac-2" />
    </>
  );
}

/** Drag the cards, or use the arrow buttons (works with keyboard and screen readers). */
function OrderInput({ q, value, onChange, locked }) {
  const [said, setSaid] = useState("");
  const [drag, setDrag] = useState(null);
  const move = (from, to) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setSaid(`${item} moved to position ${to + 1} of ${next.length}.`);
  };
  return (
    <div>
      <p className="font-bold text-ink-2">{locked ? "Your order:" : "Drag the cards, or use the arrows. First at the top."}</p>
      <ol className="mt-2 space-y-2">
        {value.map((item, i) => (
          <li
            key={item}
            draggable={!locked}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag != null) move(drag, i);
              setDrag(null);
            }}
            className={`flex min-h-14 items-center gap-3 rounded-3xl border-[3px] bg-card px-3 py-2 text-lg font-bold ${drag === i ? "border-lilac-2 opacity-60" : "border-line"} ${locked ? "" : "cursor-grab"}`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-sm" aria-hidden="true">{i + 1}</span>
            <span className="flex-1">{item}</span>
            {!locked && (
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move "${item}" up`} className="grid h-11 w-11 place-items-center rounded-full bg-soft text-xl hover:bg-line disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Move "${item}" down`} className="grid h-11 w-11 place-items-center rounded-full bg-soft text-xl hover:bg-line disabled:opacity-30">↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{said}</p>
    </div>
  );
}

function MatchInput({ q, value, onChange, locked }) {
  const rights = useMemo(() => shuffled(q.pairs.map((p) => p[1]), q.id), [q]);
  return (
    <fieldset disabled={locked}>
      <legend className="font-bold text-ink-2">Pick the partner for each one.</legend>
      <ul className="mt-2 space-y-2">
        {q.pairs.map(([left], i) => (
          <li key={i} className={`flex flex-wrap items-center gap-3 rounded-3xl border-[3px] p-3 ${value[i] ? "border-lilac-2" : "border-line"}`}>
            <span className="min-w-28 flex-1 text-lg font-bold">{left}</span>
            <span aria-hidden="true" className="text-xl">→</span>
            <label className="sr-only" htmlFor={`m-${q.id}-${i}`}>Partner for {left}</label>
            <select
              id={`m-${q.id}-${i}`}
              value={value[i] || ""}
              onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
              className="min-h-12 min-w-44 rounded-full border-2 border-line bg-card px-4 text-ink"
            >
              <option value="">Choose…</option>
              {rights.map((r) => <option key={r} value={r}>{r}{value.includes(r) && value[i] !== r ? " (used)" : ""}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function SliderInput({ q, value, onChange, locked }) {
  const min = Number(q.min), max = Number(q.max), step = Number(q.step) || 1;
  const v = value === "" ? min : Number(value);
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((min + ((max - min) * i) / 4) / step) * step);
  return (
    <div className="max-w-xl">
      <p className="tabular text-center font-display text-5xl" aria-hidden="true">{v}{q.unit || ""}</p>
      <label htmlFor={`s-${q.id}`} className="sr-only">Your answer, from {min} to {max}</label>
      <input
        id={`s-${q.id}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        disabled={locked}
        aria-valuetext={`${v}${q.unit || ""}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-3 w-full cursor-pointer accent-[var(--lilac-2)]"
      />
      <div className="tabular mt-1 flex justify-between text-sm text-ink-2" aria-hidden="true">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
      {!locked && (
        <div className="mt-2 flex justify-center gap-2">
          <button type="button" onClick={() => onChange(Math.max(min, v - step))} aria-label={`Down ${step}`} className="h-11 rounded-full bg-soft px-4 font-bold">− {step}</button>
          <button type="button" onClick={() => onChange(Math.min(max, v + step))} aria-label={`Up ${step}`} className="h-11 rounded-full bg-soft px-4 font-bold">+ {step}</button>
        </div>
      )}
    </div>
  );
}

export function youTubeId(url) {
  return String(url || "").match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] || null;
}

/** Every video has captions switched on and a full transcript underneath. */
function VideoBlock({ video }) {
  const yt = youTubeId(video.url);
  return (
    <section className="rounded-[28px] bg-card p-5" aria-labelledby="vid-h">
      <h2 id="vid-h" className="font-display text-lg">Watch this first</h2>
      <div className="mt-2 aspect-video overflow-hidden rounded-2xl bg-soft">
        {yt ? (
          <iframe title={video.title || "Lesson video"} src={`https://www.youtube-nocookie.com/embed/${yt}?cc_load_policy=1&cc_lang_pref=en&hl=en`} allow="encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
        ) : (
          <video controls preload="metadata" className="h-full w-full" src={video.url}>
            {video.captionsUrl && <track kind="captions" src={video.captionsUrl} srcLang="en" label="English" default />}
          </video>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-2">Captions are on. Prefer reading? The full transcript is below.</p>
      <details className="group mt-2 rounded-2xl bg-soft p-3">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 font-bold">
          Transcript
          <span aria-hidden="true" className="transition group-open:rotate-45">+</span>
        </summary>
        <div className="mt-2"><ReadAloud text={video.transcript} label="Read transcript aloud" /></div>
        <p className="mt-2 whitespace-pre-wrap">{video.transcript}</p>
      </details>
    </section>
  );
}

function Celebrate({ a, stars, practice, onBack }) {
  const { say } = useBuddy();
  useEffect(() => {
    say(practice ? (stars > 0 ? "NEW PERSONAL BEST! 📈🎉" : "Practice makes progress! 🌟") : "YOU DID IT! I'm SO proud of you! 🎉", "cheer", 5000, { shout: true });
  }, [practice, stars, say]);
  return (
    <section className="pop rounded-[32px] bg-card p-6 text-center sm:p-10">
      <div className="relative mx-auto w-fit">
        <Sparkle className="absolute -left-10 top-0 h-10 w-10" color="var(--peach)" />
        <Sparkle className="absolute -right-10 top-10 h-8 w-8" color="var(--mint-2)" />
        <BuddyCheer />
      </div>
      <h2 className="mt-3 font-display text-4xl">{practice ? (stars > 0 ? "You beat your score!" : "Practice done!") : a.owner ? "Score saved!" : "Turned in!"}</h2>
      {!practice && stars > 0 && <p className="mt-2 text-lg">You earned <StarCount n={stars} /> for finishing{a.due && new Date(a.due) > new Date() ? ", with an on-time bonus" : ""}.</p>}
      {practice && stars > 0 && <p className="mt-2 text-lg">More right on the first try than before. Improvement bonus: <StarCount n={stars} /></p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onBack}>See my results</Button>
        <Button variant="soft" onClick={() => (window.location.hash = "student")}>Back home</Button>
      </div>
    </section>
  );
}

function Review({ a, sub, onPractice }) {
  const sc = submissionScore(sub, a);
  const { setView } = useBuddy();
  useEffect(() => {
    setView({ page: "review", courseId: a.courseId, assignmentId: a.id });
  }, [a, setView]);
  return (
    <section className="space-y-4">
      <div className="pastel flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-mint p-5">
        <div>
          <p className="font-bold">{a.owner ? "Your score" : "Your grade"}</p>
          <p className="font-display text-4xl tabular">{sc.correct}/{sc.total} <span className="text-2xl">({sc.pct}%)</span></p>
          <p className="muted text-sm">Counts questions right on the first try. {sub.late ? "Turned in late." : ""}</p>
          {!a.owner && sc.correct < sc.total && <p className="muted text-sm font-bold">Beat it in practice for a +{STARS.improved} star improvement bonus!</p>}
        </div>
        <Button variant="primary" onClick={onPractice}>Practice again</Button>
      </div>
      <ol className="space-y-3">
        {a.questions.map((q, i) => {
          const r = sub.answers[q.id];
          return (
            <li key={q.id} className="rounded-[28px] bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-ink-2">
                Question {i + 1}
                {r?.firstTry ? <Pill tone="good">First try ✓</Pill> : <Pill tone="nudge">Got there in {r?.tries || "?"} tries 💪</Pill>}
              </p>
              <p className="mt-1 font-bold">{q.prompt}</p>
              <p className="mt-1">Answer: <span className="font-bold">{answerText(q)}</span></p>
              {q.explanation && <p className="mt-1 text-ink-2">{q.explanation}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function BuddyCheer() {
  const student = useStore((s) => s.student);
  return <span className="wiggle inline-block"><Buddy id={student.buddy} equipped={student.equipped} mood="cheer" size={120} /></span>;
}

function displayValue(q, v) {
  if (q.type === "mc") return q.options[Number(v)];
  if (q.type === "tf") return v === "true" || v === true ? "True" : "False";
  if (q.type === "order") return v.join(" → ");
  if (q.type === "match") return q.pairs.map(([l], i) => `${l} → ${v[i] || "?"}`).join("; ");
  return v;
}

export { STARS };
