import { useEffect, useState } from "react";
import { COURSES } from "../../lib/seed.js";
import { useStore, allAssignments, addPersonalPractice, track } from "../../lib/store.js";
import { statusOf } from "../../lib/grading.js";
import { useBuddy } from "../../components/BuddyFloat.jsx";
import { Tabs } from "../../components/ui.jsx";
import UploadQuestions from "../../components/UploadQuestions.jsx";
import { AssignmentList } from "./Course.jsx";
import { go } from "../../App.jsx";

export default function Assignments() {
  const s = useStore();
  const [filter, setFilter] = useState("todo");
  const { setView } = useBuddy();
  useEffect(() => {
    setView({ page: "assignments" });
    track("Looking at assignments", "assignments");
  }, [setView]);

  const all = allAssignments(s);
  const groups = {
    todo: all.filter((a) => !a.owner && ["todo", "started", "missing"].includes(statusOf(a, s.submissions[a.id]))),
    done: all.filter((a) => !a.owner && ["done", "late"].includes(statusOf(a, s.submissions[a.id]))),
    mine: all.filter((a) => a.owner),
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl">
        Assignments
        <span className="ml-2 font-hand text-[1.1em] text-ink-2">one at a time</span>
      </h1>
      <Tabs
        label="Show"
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: "todo", label: "To do", count: groups.todo.length },
          { id: "done", label: "Done", count: groups.done.length },
          { id: "mine", label: "My practice", count: groups.mine.length },
        ]}
      />
      <AssignmentList items={groups[filter]} subs={s.submissions} showCourse />

      <section aria-labelledby="up-h" className="space-y-3 pt-4">
        <h2 id="up-h" className="font-display text-2xl">
          Practice from your own file
          <span className="block font-hand text-[1.15em] text-ink-2">study sheet → quiz</span>
        </h2>
        <UploadQuestions
          onReady={(r) => {
            const id = `mine-${Date.now().toString(36)}`;
            addPersonalPractice({ id, courseId: r.courseId || COURSES[0].id, title: r.title, description: r.fileName ? `Made from ${r.fileName}` : "Made from your notes", due: null, questions: r.questions, source: r.source });
            go(`do-${id}`);
          }}
        />
      </section>
    </div>
  );
}
