import { useState } from "react";
import { Logo } from "../Landing.jsx";
import Buddy from "../../components/Buddy.jsx";
import { BuddyProvider } from "../../components/BuddyFloat.jsx";
import { Button, StarCount, A11yMenu, VoicePicker } from "../../components/ui.jsx";
import { BUDDIES } from "../../lib/seed.js";
import { useStore, createStudent } from "../../lib/store.js";
import { streakInfo } from "../../lib/streak.js";
import Badges from "./Badges.jsx";
import Home from "./Home.jsx";
import Course from "./Course.jsx";
import Assignments from "./Assignments.jsx";
import Friends from "./Friends.jsx";
import Shop from "./Shop.jsx";
import AssignmentPlayer from "../../components/AssignmentPlayer.jsx";

const NAV = [
  { hash: "student", label: "Home" },
  { hash: "student-assignments", label: "Assignments" },
  { hash: "student-badges", label: "Badges" },
  { hash: "student-friends", label: "Friends" },
  { hash: "student-shop", label: "Shop" },
];

export default function StudentApp({ route }) {
  const student = useStore((s) => s.student);
  if (!student) return <Onboarding />;
  const streak = streakInfo(student).current;

  let page;
  let active = "student";
  if (route.startsWith("course-")) page = <Course courseId={route.slice(7)} />;
  else if (route.startsWith("do-")) page = <AssignmentPlayer assignmentId={route.slice(3)} />;
  else if (route === "student-assignments") (page = <Assignments />), (active = route);
  else if (route === "student-badges") (page = <Badges />), (active = route);
  else if (route === "student-friends") (page = <Friends />), (active = route);
  else if (route === "student-shop") (page = <Shop />), (active = route);
  else page = <Home />;

  return (
    <BuddyProvider>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 pt-4 sm:px-5">
        <Logo />
        <nav aria-label="Student" className="order-3 flex w-full gap-1 overflow-x-auto rounded-full bg-card p-1 sm:order-none sm:w-auto">
          {NAV.map((n) => (
            <a key={n.hash} href={`#${n.hash}`} aria-current={active === n.hash ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[0.95rem] font-bold no-underline sm:flex-none sm:px-4 sm:text-base ${active === n.hash ? "bg-brand text-on-brand" : "text-ink-2 hover:text-ink"}`}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a href="#student-badges" className="rounded-full bg-card px-3 py-1.5 font-bold no-underline" aria-label={`${streak}-day streak. Open badges and streaks`}>
            🔥 <span className="tabular">{streak}</span>
          </a>
          <a href="#student-shop" className="rounded-full bg-card px-3 py-1.5 no-underline" aria-label={`${student.stars} stars. Open the shop`}>
            <StarCount n={student.stars} />
          </a>
          <A11yMenu />
          <a href="#start" className="hidden text-sm font-bold text-ink-2 underline sm:inline">Switch</a>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-36 pt-6 outline-none sm:px-5">
        {page}
      </main>
    </BuddyProvider>
  );
}

function Onboarding() {
  const [name, setName] = useState("");
  const [buddy, setBuddy] = useState("nova");
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-8 outline-none">
      <Logo />
      <form
        className="mt-8 rounded-[32px] bg-card p-6 sm:p-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (name) createStudent(name, buddy);
        }}
      >
        <h1 className="font-display text-4xl sm:text-5xl">
          Welcome!
          <span className="block font-hand text-[1.2em] text-ink-2">let's set you up</span>
        </h1>
        <label htmlFor="sname" className="mt-6 block font-bold">What should we call you?</label>
        <input id="sname" value={name} maxLength={16} onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\u00C0-\u024F-]/g, ""))} placeholder="First name or nickname" className="mt-2 min-h-12 w-full max-w-xs rounded-full border-2 border-line bg-card px-5 text-lg text-ink placeholder:text-ink-2" />
        <p className="mt-1 text-sm text-ink-2">Just one word. No last names.</p>

        <fieldset className="mt-8">
          <legend className="font-bold">Pick your study buddy</legend>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BUDDIES.map((b, i) => (
              <label key={b.id} className={`pastel flex cursor-pointer flex-col items-center rounded-[28px] p-3 text-center transition ${["bg-lilac", "bg-sky", "bg-peach", "bg-mint"][i]} ${buddy === b.id ? "ring-4 ring-[#241f3a]" : "opacity-90 hover:opacity-100"}`}>
                <input type="radio" name="buddy" value={b.id} checked={buddy === b.id} onChange={() => setBuddy(b.id)} className="sr-only" />
                <Buddy id={b.id} size={92} mood={buddy === b.id ? "talk" : "happy"} />
                <span className="font-display text-lg">{b.name}</span>
                <span className="muted text-sm">{b.vibe}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-6">
          <p className="font-bold">Pick a voice for your buddy</p>
          <p className="text-sm text-ink-2">Tap to hear it. You can change it or mute your buddy any time.</p>
          <VoicePicker className="mt-2 w-fit" />
        </div>
        <Button type="submit" className="mt-8" disabled={!name}>Let's go</Button>
      </form>
    </main>
  );
}
