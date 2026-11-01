import { useState } from "react";
import { COURSES } from "../../lib/seed.js";
import { useStore, announcementsFor, sendAnnouncement } from "../../lib/store.js";
import { Button, Pill, ago, courseById } from "../../components/ui.jsx";

export default function Announcements() {
  const s = useStore();
  const [courseId, setCourseId] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const list = announcementsFor(null, s);

  return (
    <div className="grid gap-6 lg:grid-cols-[26rem_1fr]">
      <form
        className="pastel self-start rounded-[28px] bg-butter p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          sendAnnouncement({ courseId, title: title.trim(), body: body.trim(), from: "Ms. Rivera" });
          setTitle("");
          setBody("");
          setSent(true);
          setTimeout(() => setSent(false), 3000);
        }}
      >
        <h1 className="font-display text-3xl">New announcement</h1>
        <label className="mt-4 block font-bold" htmlFor="an-c">Send to</label>
        <select id="an-c" value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border-0 bg-white/85 px-4 text-[#241f3a]">
          <option value="all">All my classes</option>
          {COURSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="mt-4 block font-bold" htmlFor="an-t">Title</label>
        <input id="an-t" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-full border-0 bg-white/85 px-4 text-[#241f3a]" />
        <label className="mt-4 block font-bold" htmlFor="an-b">Message</label>
        <textarea id="an-b" rows={5} value={body} maxLength={500} onChange={(e) => setBody(e.target.value)} className="mt-1 w-full rounded-3xl border-0 bg-white/85 p-4 text-[#241f3a]" />
        <Button type="submit" className="mt-4" disabled={!title.trim() || !body.trim()}>Send announcement</Button>
        {sent && <p role="status" className="mt-3 font-bold">Sent! Students see it in their class page.</p>}
      </form>
      <section aria-labelledby="sent-h">
        <h2 id="sent-h" className="font-display text-2xl">Sent</h2>
        <ul className="mt-3 space-y-3">
          {list.map((a) => (
            <li key={a.id} className="rounded-[28px] bg-card p-5">
              <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
                <Pill>{a.courseId === "all" ? "All classes" : courseById(a.courseId)?.name}</Pill>
                {a.from} · {ago(a.at)}
              </p>
              <h3 className="mt-1 font-display text-xl">{a.title}</h3>
              <p>{a.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
