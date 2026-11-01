// Contact form rules. Pure functions so they're easy to test.
export const ROLES = ["Teacher", "School leader", "University staff", "Parent", "Student", "Other"];
export const PLAN_CHOICES = [
  ["free", "Classroom (free)"],
  ["school", "School (2-month free trial)"],
  ["campus", "Campus"],
  ["unsure", "Not sure yet"],
];

export const emptyContact = (plan = "unsure") => ({ name: "", email: "", role: "", institution: "", students: "", plan, message: "" });

/** Returns { field: "what's wrong and how to fix it" } for every problem. Empty object = valid. */
export function validateContact(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter an email address like name@school.org.";
  if (!ROLES.includes(v.role)) e.role = "Choose the role that fits you best.";
  if (!v.institution.trim()) e.institution = "Enter your school or institution (or \"Home\" if you're a parent).";
  const n = Number(v.students);
  if (v.students === "" || !Number.isInteger(n) || n < 1 || n > 1_000_000) e.students = "Enter about how many students, as a whole number (1 or more).";
  if (!PLAN_CHOICES.some(([id]) => id === v.plan)) e.plan = "Choose a plan, or \"Not sure yet\".";
  if (v.message.trim().length < 10) e.message = "Tell us a little more (at least 10 characters).";
  return e;
}

/** "#contact-school" → "school" */
export function planFromRoute(route) {
  const id = String(route).replace(/^contact-?/, "");
  return PLAN_CHOICES.some(([p]) => p === id) ? id : "unsure";
}
