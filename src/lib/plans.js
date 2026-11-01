// Pricing plans for the marketing site. Every price and limit lives here so it can change in one place.
// NOTE: all prices are proposals to confirm before launch.

export const TRIAL_MONTHS = 2;
export const FREE_MAX_STUDENTS = 30;
export const SCHOOL_MAX_STUDENTS = 1000;
export const SCHOOL_MIN_STUDENTS = 100;

// Yearly billing = 10 months' price ("2 months free").
export const PRICES = {
  perStudentMonthly: 0.5, // School plan, per student per month, billed monthly
  perStudentYearly: 5, // School plan, per student per year
  perTeacherMonthly: 49, // School plan for small schools, per teacher per month
  perTeacherYearly: 490,
};

export const PLANS = [
  {
    id: "free",
    name: "Classroom",
    tagline: "Free forever for one teacher and a small class.",
    price: { monthly: "$0", yearly: "$0", note: "free forever" },
    cta: { label: "Start free", href: "#student" },
    color: "bg-mint",
    limits: { teachers: "1 teacher", students: `Up to ${FREE_MAX_STUDENTS} students`, courses: "3 courses", storage: "2 GB storage" },
    features: [
      "Study buddy with the built-in coach + 20 AI chat messages per student a month",
      "Streaks, badges and effort rewards",
      "Read-aloud and every accessibility feature",
      "Multiple choice, short answer and true/false",
      "Family view: grades and what's due",
      "Community help centre",
    ],
  },
  {
    id: "school",
    name: "School",
    tagline: "Everything Curio does, for a whole school.",
    popular: true,
    price: {
      monthly: `$${PRICES.perStudentMonthly.toFixed(2)}`,
      yearly: `$${PRICES.perStudentYearly}`,
      note: "per student",
      alt: { monthly: `or $${PRICES.perTeacherMonthly} per teacher a month`, yearly: `or $${PRICES.perTeacherYearly} per teacher a year` },
    },
    cta: { label: `Try free for ${TRIAL_MONTHS} months`, href: "#contact-school" },
    color: "bg-lilac",
    limits: { teachers: "Up to 40 teachers", students: `Up to ${SCHOOL_MAX_STUDENTS.toLocaleString()} students`, courses: "Unlimited courses", storage: "200 GB storage" },
    features: [
      "Unlimited AI buddy chat, girl and boy voices, hints that never give the answer",
      "All 6 question types, including put in order, matching and number line",
      "Quizzes from PDF or Word files, and video with captions and transcripts",
      "Class goals and squad challenges",
      "\"Who's done and when\" grid and per-student analytics",
      "Family alerts, strengths and gaps, and ideas to try at home",
      "CSV roster import and email support within 1 business day",
    ],
  },
  {
    id: "campus",
    name: "Campus",
    tagline: "For universities, districts and groups of schools.",
    price: { monthly: "Custom", yearly: "Custom", note: "talk to us" },
    cta: { label: "Talk to us", href: "#contact-campus" },
    color: "bg-peach",
    limits: { teachers: "Unlimited teachers", students: "Unlimited students", courses: "Unlimited courses", storage: "2 TB+ storage" },
    features: [
      "Single sign-on (Google, Microsoft, SAML)",
      "Connects to Canvas, Moodle and Google Classroom",
      "Admin dashboard across schools, departments or faculties",
      "Teaching-assistant and co-instructor roles, sections and bulk course setup",
      "Data residency options, a signed data agreement and a yearly accessibility report",
      "Your colours and logo, API access and data export",
      "A dedicated success manager, staff workshops and 99.9% uptime",
    ],
  },
];

/** Comparison table: [free, school, campus]. true = included, false = not included, text = detail. */
export const COMPARISON = [
  {
    group: "For students",
    rows: [
      ["Study buddy that coaches step by step", true, true, true],
      ["AI chat with the buddy", "20 messages / month", "Unlimited", "Unlimited"],
      ["Girl and boy buddy voices, sounds and emotions", true, true, true],
      ["Streaks with rest days and streak freezes", true, true, true],
      ["Badges and effort rewards", true, true, true],
      ["Class goals and squad challenges", false, true, true],
      ["Practice quizzes from their own notes", "3 a month", "Unlimited", "Unlimited"],
      ["Read-aloud, dyslexia font, colour-safe mode", true, true, true],
    ],
  },
  {
    group: "For teachers",
    rows: [
      ["Multiple choice, short answer, true/false", true, true, true],
      ["Interactive questions (order, matching, number line)", false, true, true],
      ["Quizzes generated from PDF or Word files", false, true, true],
      ["Video with captions and transcripts", false, true, true],
      ["\"Who's done and when\" grid", true, true, true],
      ["Per-student analytics and check-in list", false, true, true],
      ["Teaching assistants and co-instructors", false, false, true],
    ],
  },
  {
    group: "For families",
    rows: [
      ["Grades and what's due", true, true, true],
      ["Link several children to one account", false, true, true],
      ["Alerts for engagement drops and repeated struggle", false, true, true],
      ["Strengths, gaps and ideas to try at home", false, true, true],
    ],
  },
  {
    group: "For administrators",
    rows: [
      ["CSV roster import", false, true, true],
      ["Single sign-on", false, false, true],
      ["Canvas, Moodle and Google Classroom", false, false, true],
      ["Dashboard across schools or faculties", false, false, true],
      ["Data residency and signed data agreement", false, false, true],
      ["Custom branding and API", false, false, true],
    ],
  },
  {
    group: "Storage and limits",
    rows: [
      ["Teachers", "1", "Up to 40", "Unlimited"],
      ["Students", `Up to ${FREE_MAX_STUDENTS}`, `Up to ${SCHOOL_MAX_STUDENTS.toLocaleString()}`, "Unlimited"],
      ["Courses", "3", "Unlimited", "Unlimited"],
      ["Cloud storage", "2 GB", "200 GB", "2 TB+"],
    ],
  },
  {
    group: "Support",
    rows: [
      ["Help centre", true, true, true],
      ["Email support", false, "Within 1 business day", "Priority"],
      ["Dedicated success manager and staff workshops", false, false, true],
      ["Uptime commitment", false, false, "99.9%"],
    ],
  },
];

export const ADD_ONS = [
  { name: "Extra storage", price: "$10 per 100 GB a month", text: "For schools with lots of video lessons." },
  { name: "AI credit pack", price: "$5 per 500 messages", text: "More buddy chat for the free Classroom plan." },
  { name: "Staff training", price: "$300 per session", text: "A live 90-minute workshop for your teachers." },
];

export const DISCOUNTS = [
  { name: "Non-profits", value: "30% off" },
  { name: "Public schools", value: "20% off" },
  { name: "Student-run tutoring programmes", value: "Free School plan" },
];

/** Which plan fits a number of students. */
export function recommendPlan(students) {
  const n = Math.max(0, Math.round(Number(students) || 0));
  if (n <= FREE_MAX_STUDENTS) return "free";
  if (n <= SCHOOL_MAX_STUDENTS) return "school";
  return "campus";
}

/** Estimated School plan price for `students`, billed monthly or yearly. Counts at least the minimum seats. */
export function estimateSchoolPrice(students, billing = "yearly") {
  const seats = Math.max(SCHOOL_MIN_STUDENTS, Math.round(Number(students) || 0));
  return billing === "yearly"
    ? { seats, amount: seats * PRICES.perStudentYearly, per: "year" }
    : { seats, amount: Math.round(seats * PRICES.perStudentMonthly * 100) / 100, per: "month" };
}
