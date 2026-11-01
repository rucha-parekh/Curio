import { Logo } from "../Landing.jsx";
import { A11yMenu } from "../../components/ui.jsx";
import TeacherHome from "./TeacherHome.jsx";
import ClassPage from "./ClassPage.jsx";
import Students, { StudentDetail } from "./Students.jsx";
import TeacherAssignments from "./TeacherAssignments.jsx";
import Announcements from "./Announcements.jsx";

const NAV = [
  { hash: "teacher", label: "Classes" },
  { hash: "teacher-students", label: "Students" },
  { hash: "teacher-assignments", label: "Assignments" },
  { hash: "teacher-announcements", label: "Announcements" },
];

export default function TeacherApp({ route }) {
  let page = <TeacherHome />;
  let active = "teacher";
  if (route.startsWith("teacher-class-")) page = <ClassPage key={route} courseId={route.slice(14)} />;
  else if (route.startsWith("teacher-student-")) (page = <StudentDetail id={route.slice(16)} />), (active = "teacher-students");
  else if (route === "teacher-students") (page = <Students />), (active = route);
  else if (route.startsWith("teacher-assignments") || route === "teacher-new") (page = <TeacherAssignments creating={route === "teacher-new"} />), (active = "teacher-assignments");
  else if (route === "teacher-announcements") (page = <Announcements />), (active = route);

  return (
    <>
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-5">
          <Logo sub="teachers" />
          <nav aria-label="Teacher" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {NAV.map((n) => (
              <a key={n.hash} href={`#${n.hash}`} aria-current={active === n.hash ? "page" : undefined} className={`flex min-h-11 items-center whitespace-nowrap rounded-full px-4 font-bold no-underline ${active === n.hash ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-soft hover:text-ink"}`}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-2 md:inline">Ms. Rivera · Class 7B</span>
            <A11yMenu />
            <a href="#start" className="text-sm font-bold text-ink-2 underline">Switch</a>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 outline-none sm:px-5 sm:py-8">
        {page}
      </main>
    </>
  );
}
