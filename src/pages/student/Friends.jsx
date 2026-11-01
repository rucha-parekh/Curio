import { useEffect, useState } from "react";
import Buddy from "../../components/Buddy.jsx";
import { useBuddy } from "../../components/BuddyFloat.jsx";
import { useStore, classRoster, addFriend, removeFriend, track } from "../../lib/store.js";
import { Tabs, StarCount, Button } from "../../components/ui.jsx";

const SQUAD_TARGET = 600;

export default function Friends() {
  const s = useStore();
  const [scope, setScope] = useState("friends");
  const [q, setQ] = useState("");
  const { setView } = useBuddy();
  useEffect(() => {
    setView({ page: "friends" });
    track("Looking at friends", "friends");
  }, [setView]);

  const roster = classRoster(s);
  const friends = new Set(s.student.friends);
  const board = roster.filter((r) => scope === "class" || r.live || friends.has(r.id)).sort((a, b) => b.weekStars - a.weekStars);
  const squad = roster.filter((r) => r.live || friends.has(r.id)).sort((a, b) => b.weekStars - a.weekStars);
  const squadStars = squad.reduce((n, r) => n + r.weekStars, 0);
  const matches = q.trim() ? roster.filter((r) => !r.live && r.name.toLowerCase().startsWith(q.trim().toLowerCase())) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl">
        Friends
        <span className="ml-2 font-hand text-[1.1em] text-ink-2">& this week's stars</span>
      </h1>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="lb-h" className="rounded-[32px] bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="lb-h" className="font-display text-2xl">Leaderboard</h2>
            <Tabs label="Leaderboard" value={scope} onChange={setScope} tabs={[{ id: "friends", label: "Friends" }, { id: "class", label: "Class" }]} />
          </div>
          <p className="mt-1 text-sm text-ink-2">Stars earned this week from answering, finishing work and trying again. Resets every Monday.</p>
          <ol className="mt-4 space-y-2">
            {board.map((r, i) => (
              <li key={r.id} className={`flex min-h-14 items-center gap-3 rounded-3xl px-3 py-1.5 ${r.live ? "pastel bg-butter" : i < 3 ? "bg-soft" : ""}`}>
                <span className="tabular w-7 text-center font-display text-xl">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                <Buddy id={r.buddy} size={38} />
                <span className="flex-1 font-bold">{r.live ? `${r.name} (you)` : r.name}</span>
                <StarCount n={r.weekStars} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="fr-h" className="space-y-4">
          <div className="pastel rounded-[32px] bg-lagune p-5 sm:p-6" aria-labelledby="squad-h">
            <h2 id="squad-h" className="font-display text-2xl">Squad challenge 🫶</h2>
            <p className="muted text-sm">You and your friends: earn {SQUAD_TARGET} stars together this week. Everyone's stars count, so cheer each other on!</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/60" role="progressbar" aria-valuenow={squadStars} aria-valuemin={0} aria-valuemax={SQUAD_TARGET} aria-label="Squad challenge">
              <div className="h-full rounded-full bg-[#241f3a]" style={{ width: `${Math.min(100, (squadStars / SQUAD_TARGET) * 100)}%` }} />
            </div>
            <p className="tabular mt-1 text-sm font-bold">{squadStars >= SQUAD_TARGET ? "✓ Done! Squad goals! 🎉" : `${squadStars} / ${SQUAD_TARGET} stars`}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5 text-sm">
              {squad.map((r) => <li key={r.id} className="rounded-full bg-white/70 px-2.5 py-0.5 font-bold">{r.live ? "You" : r.name} +{r.weekStars}</li>)}
            </ul>
          </div>
          <div className="rounded-[32px] bg-card p-5 sm:p-6">
            <h2 id="fr-h" className="font-display text-2xl">My friends</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {roster.filter((r) => friends.has(r.id)).map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-3xl bg-soft p-2 pr-1">
                  <Buddy id={r.buddy} size={34} />
                  <span className="flex-1 truncate font-bold">{r.name}</span>
                  <button type="button" onClick={() => removeFriend(r.id)} aria-label={`Remove ${r.name}`} className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-card">×</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="pastel rounded-[32px] bg-mint p-5 sm:p-6">
            <label htmlFor="find" className="font-display text-xl">Add a classmate</label>
            <input id="find" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name" className="mt-2 min-h-12 w-full rounded-full border-0 bg-white/85 px-5 text-[#241f3a]" />
            <ul className="mt-2 space-y-1.5">
              {matches.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-3xl bg-white/70 p-1.5 pl-3">
                  <span className="flex-1 font-bold">{r.name}</span>
                  {friends.has(r.id) ? <span className="px-3 text-sm font-bold">Friends ✓</span> : <Button className="min-h-10 px-4" onClick={() => addFriend(r.id)}>Add</Button>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
