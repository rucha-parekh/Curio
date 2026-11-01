import { useEffect, useState } from "react";
import Buddy, { ItemPreview } from "../../components/Buddy.jsx";
import { useBuddy } from "../../components/BuddyFloat.jsx";
import { BUDDIES, SHOP_ITEMS, STREAK_FREEZE } from "../../lib/seed.js";
import { useStore, buyItem, toggleEquip, setBuddy, buyFreeze, track } from "../../lib/store.js";
import { Tabs, StarCount, Button } from "../../components/ui.jsx";

const SLOTS = [
  { id: "all", label: "All" },
  { id: "hat", label: "Hats" },
  { id: "face", label: "Glasses" },
  { id: "neck", label: "Neck" },
  { id: "extra", label: "Fun" },
];

export default function Shop() {
  const st = useStore((s) => s.student);
  const [slot, setSlot] = useState("all");
  const { setView, say } = useBuddy();
  useEffect(() => {
    setView({ page: "shop" });
    track("In the shop", "shop");
  }, [setView]);

  const items = SHOP_ITEMS.filter((i) => slot === "all" || i.slot === slot);
  const buddy = BUDDIES.find((b) => b.id === st.buddy);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl">
        Shop
        <span className="ml-2 font-hand text-[1.1em] text-ink-2">& dress up</span>
      </h1>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <section aria-label="Your buddy" className="pastel self-start rounded-[32px] bg-lilac p-5 text-center lg:sticky lg:top-4">
          <div className="mx-auto w-fit rounded-full bg-white/60 p-4">
            <Buddy id={st.buddy} equipped={st.equipped} size={150} title={`${buddy.name} wearing your items`} />
          </div>
          <p className="mt-2 font-display text-2xl">{buddy.name}</p>
          <p className="muted">You have <StarCount n={st.stars} /></p>
          <fieldset className="mt-4">
            <legend className="text-sm font-bold">Switch buddy (free)</legend>
            <div className="mt-2 flex justify-center gap-1.5">
              {BUDDIES.map((b) => (
                <button key={b.id} type="button" onClick={() => setBuddy(b.id)} aria-pressed={st.buddy === b.id} aria-label={b.name} className={`rounded-2xl p-1 ${st.buddy === b.id ? "bg-white ring-2 ring-[#241f3a]" : "bg-white/50 hover:bg-white/80"}`}>
                  <Buddy id={b.id} size={46} />
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section aria-labelledby="items-h">
          <h2 id="items-h" className="sr-only">Items</h2>
          <Tabs label="Item type" value={slot} onChange={setSlot} tabs={SLOTS} />
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => {
              const owned = st.owned.includes(it.id);
              const wearing = st.equipped[it.slot] === it.id;
              const afford = st.stars >= it.price;
              return (
                <li key={it.id} className={`flex flex-col items-center rounded-[28px] bg-card p-4 text-center ${wearing ? "ring-[3px] ring-lilac-2" : ""}`}>
                  <div className="grid h-20 w-full place-items-center rounded-2xl bg-[#f4f0ff]"><ItemPreview id={it.id} size={64} /></div>
                  <p className="mt-2 font-bold">{it.name}</p>
                  {owned ? (
                    <Button variant={wearing ? "soft" : "primary"} className="mt-2 min-h-11 w-full" onClick={() => toggleEquip(it)}>{wearing ? "Take off" : "Wear"}</Button>
                  ) : (
                    <Button
                      variant="pastel"
                      className="mt-2 min-h-11 w-full"
                      disabled={!afford}
                      onClick={() => {
                        buyItem(it);
                        say(`Ooh, ${it.name.toLowerCase()}! I love it! 😍`, "wow", 3500);
                      }}
                      aria-label={`Buy ${it.name} for ${it.price} stars`}
                    >
                      <StarCount n={it.price} />
                    </Button>
                  )}
                  {!owned && !afford && <p className="mt-1 text-xs text-ink-2">Need {it.price - st.stars} more</p>}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-[28px] bg-card p-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sky text-4xl" aria-hidden="true">🧊</span>
            <div className="min-w-40 flex-1">
              <p className="font-bold">Streak freeze</p>
              <p className="text-sm text-ink-2">Covers a missed school day so your streak doesn't break. You have {st.freezes} (max {STREAK_FREEZE.max}).</p>
            </div>
            <Button variant="pastel" className="min-h-11" disabled={st.stars < STREAK_FREEZE.price || st.freezes >= STREAK_FREEZE.max} onClick={() => { buyFreeze(); say("Streak freeze ready! 🧊 Your streak is extra safe now.", "wow", 3500); }} aria-label={`Buy a streak freeze for ${STREAK_FREEZE.price} stars`}>
              <StarCount n={STREAK_FREEZE.price} />
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-2">Earn stars by answering questions, finishing assignments, asking for help, beating your own score and earning badges. Stars can't be bought with money.</p>
        </section>
      </div>
    </div>
  );
}
