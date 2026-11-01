import { useEffect, useState } from "react";
import { Logo } from "../Landing.jsx";
import { A11yMenu } from "../../components/ui.jsx";
import Home from "./Home.jsx";
import Pricing from "./Pricing.jsx";
import Contact from "./Contact.jsx";
import About from "./About.jsx";

const NAV = [
  { hash: "home", label: "Home" },
  { hash: "pricing", label: "Pricing" },
  { hash: "about", label: "About" },
  { hash: "contact", label: "Contact" },
];

/** Marketing routes: "" or "home", "pricing", "about", "contact" (also "contact-school" etc. to pre-pick a plan). */
export const isMarketingRoute = (r) => r === "" || r === "home" || r === "pricing" || r === "about" || r.startsWith("contact");

export default function MarketingSite({ route }) {
  const active = route.startsWith("contact") ? "contact" : route || "home";
  const page = { home: <Home />, pricing: <Pricing />, about: <About />, contact: <Contact route={route} /> }[active];
  return (
    <div className="flex min-h-full flex-col overflow-x-hidden">
      <Header active={active} />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 outline-none sm:px-5">
        {page}
      </main>
      <Footer />
    </div>
  );
}

function Header({ active }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [active]);
  const link = (n, extra = "") => (
    <a key={n.hash} href={`#${n.hash}`} aria-current={active === n.hash ? "page" : undefined} className={`flex min-h-11 items-center rounded-full px-4 font-bold no-underline ${active === n.hash ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-soft hover:text-ink"} ${extra}`}>
      {n.label}
    </a>
  );
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-5">
      <div className="flex items-center gap-3 rounded-full bg-card py-2 pl-4 pr-2">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden gap-1 md:flex">{NAV.map((n) => link(n))}</nav>
        <div className="ml-auto flex items-center gap-2">
          <A11yMenu />
          <a href="#start" className="hidden min-h-11 items-center rounded-full bg-brand px-5 font-bold text-on-brand no-underline sm:inline-flex">Sign in</a>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-soft md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /> : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="pop mt-2 grid gap-1 rounded-[24px] bg-card p-2 md:hidden">
          {NAV.map((n) => link(n))}
          <a href="#start" className="flex min-h-11 items-center rounded-full bg-brand px-4 font-bold text-on-brand no-underline">Sign in</a>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1fr_auto] sm:px-5">
        <div className="space-y-2">
          <Logo />
          <p className="font-hand text-2xl font-bold text-ink-2">Built by learners, for learners.</p>
          <p className="text-sm text-ink-2">No ads. We never sell student data.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-5 gap-y-2">
          {NAV.map((n) => <a key={n.hash} href={`#${n.hash}`} className="min-h-11 py-2 font-bold text-ink-2 hover:text-ink">{n.label}</a>)}
          <a href="#start" className="min-h-11 py-2 font-bold text-ink-2 hover:text-ink">Sign in</a>
        </nav>
        <p className="text-sm text-ink-2 sm:col-span-2">© {new Date().getFullYear()} Curio</p>
      </div>
    </footer>
  );
}
