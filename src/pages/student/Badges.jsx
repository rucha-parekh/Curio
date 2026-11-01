import { useEffect } from "react";
import { useBuddy } from "../../components/BuddyFloat.jsx";
import { WeekStrip, GoalCard } from "../../components/Progress.jsx";
import { Button, StarCount, Meter } from "../../components/ui.jsx";
import { useStore, classGoals, canRestToday, takeRestDay, toggleRestWeekday, buyFreeze, linkCode, track } from "../../lib/store.js";
import { streakInfo, WEEKDAYS } from "../../lib/streak.js";
import { BADGES, BADGE_KINDS, badgeCounts, earnedBadges } from "../../lib/badges.js";
import { STREAK_FREEZE } from "../../lib/seed.js";

export default function Badges() {
  const s = useStore();
  const st = s.student;
  const { setView, say } = useBuddy();
  useEffect(() => {
    setView({ page: "badges" });
    track("Looking at badges and streaks", "badges");
  }, [setView]);

  const streak = streakInfo(st);
  const earned = new Set(earnedBadges(s).map((b) => b.id));
  const c = badgeCounts(s);
  const e = st.effort;
  const accuracy = e.attempts ? Math.round((e.solved / e.attempts) * 100) : null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl">
        Badges
        <span className="ml-2 font-hand text-[1.1em] text-ink-2">& streaks</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="streak-h" className="pastel rounded-[32px] bg-butter p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="streak-h" className="font-display text-2xl">Daily streak</h2>
              <p className="font-display text-5xl tabular">🔥 {streak.current} <span className="text-2xl">day{streak.current === 1 ? "" : "s"}</span></p>
              <p className="muted text-sm">Best ever: {st.bestStreak} days. {streak.activeToday ? "Today counts! ✓" : streak.restToday ? "Today is a rest day. Enjoy it! 😴" : "Answer one question today to keep it going."}</p>
            </div>
            <p className="rounded-2xl bg-white/70 px-3 py-2 text-center font-bold">🧊 {st.freezes}<span className="block text-xs">freezes</span></p>
          </div>
          <div className="mt-4 rounded-3xl bg-white/70 p-3"><WeekStrip student={st} /></div>
          <p className="muted mt-3 text-sm">Missed a school day? A streak freeze 🧊 covers it automatically. You get a free one every 7 days in a row. Rest days 😴 never break your streak.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" disabled={!canRestToday(st)} onClick={() => { takeRestDay(); say("Rest is part of learning! 😴 Your streak is safe. See you tomorrow!", "happy-closed", 6000); }}>
              Take today off
            </Button>
            <Button variant="soft" className="bg-white/80" disabled={st.stars < STREAK_FREEZE.price || st.freezes >= STREAK_FREEZE.max} onClick={() => buyFreeze()} aria-label={`Buy a streak freeze for ${STREAK_FREEZE.price} stars`}>
              Buy 🧊 for <StarCount n={STREAK_FREEZE.price} />
            </Button>
          </div>
          <p className="muted mt-1 text-xs">One extra day off per week, before you start work that day.</p>
          <fieldset className="mt-4">
            <legend className="text-sm font-bold">My weekly rest days (up to 2)</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d, i) => {
                const on = st.restWeekdays.includes(i);
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => toggleRestWeekday(i)} className={`min-h-10 rounded-full px-3 text-sm font-bold ${on ? "bg-[#241f3a] text-white" : "bg-white/70"}`}>
                    {on && "😴 "}{d}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section aria-labelledby="effort-h" className="rounded-[32px] bg-card p-5 sm:p-6">
          <h2 id="effort-h" className="font-display text-2xl">Effort counts too</h2>
          <p className="text-sm text-ink-2">Stars come from trying, improving and asking for help, not just from being right.</p>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {[
              ["💪", "Answers tried", e.attempts],
              ["🦘", "Comebacks", e.comebacks, "right after a wrong try"],
              ["🙋", "Times you asked for help", e.helpAsked],
              ["📈", "Personal bests", e.improved],
            ].map(([icon, label, n, sub]) => (
              <li key={label} className="rounded-3xl bg-soft p-3">
                <p className="tabular font-display text-3xl">{icon} {n}</p>
                <p className="text-sm font-bold leading-tight">{label}</p>
                {sub && <p className="text-xs text-ink-2">{sub}</p>}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p className="flex justify-between text-sm font-bold"><span>🎯 Accuracy</span><span className="tabular">{accuracy == null ? "–" : `${accuracy}%`}</span></p>
            <Meter value={accuracy || 0} label="Accuracy" className="mt-1" />
            <p className="mt-1 text-xs text-ink-2">Questions solved out of answers tried. Both effort and accuracy grow your brain!</p>
          </div>
        </section>
      </div>

      <section aria-labelledby="badges-h" className="rounded-[32px] bg-card p-5 sm:p-6">
        <h2 id="badges-h" className="font-display text-2xl">My badges <span className="text-ink-2">{earned.size}/{BADGES.length}</span></h2>
        {Object.entries(BADGE_KINDS).map(([kind, label]) => (
          <div key={kind} className="mt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink-2">{label}</h3>
            <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BADGES.filter((b) => b.kind === kind).map((b) => {
                const has = earned.has(b.id);
                return (
                  <li key={b.id} className={`flex flex-col items-center rounded-3xl p-3 text-center ${has ? "pastel bg-lilac" : "border-2 border-dashed border-line"}`}>
                    <span className={`text-4xl ${has ? "" : "opacity-40 grayscale"}`} aria-hidden="true">{b.icon}</span>
                    <span className="font-bold leading-tight">{b.name}</span>
                    <span className={`text-xs ${has ? "muted" : "text-ink-2"}`}>{b.desc}</span>
                    <span className={`mt-1 text-xs font-bold ${has ? "" : "text-ink-2"}`}>{has ? "✓ Earned" : "🔒 Not yet"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="goals-h" className="rounded-[32px] bg-card p-5 sm:p-6">
        <h2 id="goals-h" className="font-display text-2xl">Class goals 🤝</h2>
        <p className="text-sm text-ink-2">Everyone in Class 7B works on these together. Every question you solve helps. You've added {c.goalHelp} so far.</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {classGoals(s).map((g) => <GoalCard key={g.id} goal={g} />)}
        </ul>
      </section>

      <p className="text-center text-sm text-ink-2">Your family link code: <b className="tabular">{linkCode({ id: "me", name: st.name })}</b>. A parent can type it on the family site to see your progress.</p>
    </div>
  );
}
