// Streak calendar and class goal cards. States use icons and words, never colour alone.
import { lastWeek } from "../lib/streak.js";
import { GOAL_METRICS } from "../lib/seed.js";
import { Meter, courseById } from "./ui.jsx";

const DAY = {
  done: { icon: "🔥", label: "learned", cls: "bg-butter text-pastel-ink" },
  frozen: { icon: "🧊", label: "streak freeze", cls: "bg-sky text-pastel-ink" },
  rest: { icon: "😴", label: "rest day", cls: "bg-soft" },
  today: { icon: "✨", label: "today, still open", cls: "border-2 border-dashed border-lilac-2" },
  missed: { icon: "·", label: "missed", cls: "bg-soft text-ink-2" },
};

export function WeekStrip({ student }) {
  const days = lastWeek(student);
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Your last 7 days">
      {days.map((d) => {
        const t = DAY[d.state];
        return (
          <li key={d.key} className="flex flex-col items-center gap-1">
            <span className={`grid h-10 w-10 place-items-center rounded-2xl text-lg ${t.cls}`} aria-hidden="true">{t.icon}</span>
            <span className="text-xs font-bold text-ink-2">{d.label}</span>
            <span className="sr-only">{d.label}: {t.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function GoalCard({ goal, showCourse = true, action }) {
  const c = goal.courseId !== "all" && courseById(goal.courseId);
  return (
    <li className="rounded-3xl bg-soft p-4">
      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-2">
        {showCourse && <span>{c ? `${c.icon} ${c.name}` : "🏫 Whole class"}</span>}
        {goal.done && <span className="rounded-full bg-good-bg px-2 text-good">✓ Reached!</span>}
        {action}
      </p>
      <p className="font-display text-lg leading-tight">{goal.title}</p>
      <Meter className="mt-2" value={goal.progress} max={goal.target} label={goal.title} />
      <p className="tabular mt-1 flex flex-wrap justify-between gap-2 text-sm">
        <span><b>{goal.progress}</b> / {goal.target} {GOAL_METRICS[goal.metric]} ({goal.pct}%)</span>
        {goal.mine > 0 && <span className="font-bold">You added {goal.mine} 🤝</span>}
      </p>
      <p className="mt-1 text-sm">Reward: <b>{goal.reward}</b></p>
    </li>
  );
}
