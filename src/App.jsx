import { useEffect, useState } from "react";
import Landing from "./pages/Landing.jsx";
import StudentApp from "./pages/student/StudentApp.jsx";
import TeacherApp from "./pages/teacher/TeacherApp.jsx";
import ParentApp from "./pages/parent/ParentApp.jsx";
import MarketingSite, { isMarketingRoute } from "./pages/marketing/Site.jsx";
import { useStore } from "./lib/store.js";

// Plain #hash routes: "" / "home", "pricing", "about", "contact…" (marketing site), "start" (role chooser), "student…", "course-…", "do-…" (student site),
// "teacher…" (teacher site), "parent" (parent site).
const read = () => window.location.hash.replace(/^#/, "");
export function go(hash) {
  window.location.hash = hash;
}

export default function App() {
  const [route, setRoute] = useState(read);
  const textSize = useStore((s) => s.textSize);
  const a11y = useStore((s) => s.a11y);

  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.text = String(textSize || 0);
  }, [textSize]);
  useEffect(() => {
    const d = document.documentElement.dataset;
    const set = (k, on, v) => (on ? (d[k] = v) : delete d[k]);
    set("font", a11y.dyslexia, "dyslexic");
    set("cb", a11y.colorSafe, "1");
    set("motion", a11y.reduceMotion, "reduce");
  }, [a11y]);

  // "start" is the "Who's here today?" role chooser (Sign in). Anything unknown goes to the marketing home.
  const site = route.startsWith("teacher") ? "teacher" : route.startsWith("parent") ? "parent" : route.startsWith("student") || route.startsWith("course-") || route.startsWith("do-") ? "student" : route === "start" ? "landing" : "marketing";
  const page = site === "marketing" ? (isMarketingRoute(route) ? (route.startsWith("contact") ? "contact" : route || "home") : "home") : null;

  useEffect(() => {
    const marketing = { home: "Curio · Learning that feels like play", pricing: "Curio · Pricing", about: "Curio · About us", contact: "Curio · Contact" };
    document.title = page ? marketing[page] : { landing: "Curio · Sign in", student: "Curio for students", teacher: "Curio for teachers", parent: "Curio for families" }[site];
  }, [site, page]);

  return (
    <>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      {site === "marketing" && <MarketingSite route={isMarketingRoute(route) ? route : "home"} />}
      {site === "landing" && <Landing />}
      {site === "student" && <StudentApp route={route} />}
      {site === "teacher" && <TeacherApp route={route} />}
      {site === "parent" && <ParentApp />}
    </>
  );
}
