// Daily streaks that never punish rest. Pure functions on plain day keys ("2026-10-31").
// A day counts if the student learned something. Rest days and frozen days are skipped:
// they don't add to the streak, and they don't break it either.

const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
const parse = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (key, n) => {
  const d = parse(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sets(p) {
  const active = new Set(p.activeDays || []);
  const frozen = new Set(p.frozenDays || []);
  const restDates = new Set(p.restDates || []);
  const isRest = (k) => restDates.has(k) || (p.restWeekdays || []).includes(parse(k).getDay());
  return { active, frozen, isRest };
}

/** { current, activeToday, restToday }. Today still counts as "open" until it ends. */
export function streakInfo(p, today = dayKey()) {
  const { active, frozen, isRest } = sets(p);
  let current = 0;
  let k = active.has(today) ? today : addDays(today, -1);
  for (let i = 0; i < 400; i++, k = addDays(k, -1)) {
    if (active.has(k)) current++;
    else if (!frozen.has(k) && !isRest(k)) break;
  }
  return { current, activeToday: active.has(today), restToday: isRest(today) };
}

/** Missed school days since the last active day that a freeze would need to cover. */
export function daysNeedingFreeze(p, today = dayKey()) {
  const { active, frozen, isRest } = sets(p);
  const gaps = [];
  let k = addDays(today, -1);
  for (let i = 0; i < 30; i++, k = addDays(k, -1)) {
    if (active.has(k)) return gaps;
    if (!frozen.has(k) && !isRest(k)) gaps.push(k);
  }
  return []; // no earlier streak to save
}

/** Last 7 days (oldest first) for the little streak calendar. */
export function lastWeek(p, today = dayKey()) {
  const { active, frozen, isRest } = sets(p);
  return Array.from({ length: 7 }, (_, i) => {
    const k = addDays(today, i - 6);
    const state = active.has(k) ? "done" : frozen.has(k) ? "frozen" : isRest(k) ? "rest" : k === today ? "today" : "missed";
    return { key: k, label: WEEKDAYS[parse(k).getDay()], state };
  });
}

/** Rest days taken in the 7 days up to today (we allow one "day off" per week, on top of weekly rest days). */
export const restDaysThisWeek = (p, today = dayKey()) => (p.restDates || []).filter((k) => k <= today && k > addDays(today, -7)).length;

/** Active days in the last 7 days and the 7 before, for engagement alerts. */
export function weeklyActivity(p, today = dayKey()) {
  const active = new Set(p.activeDays || []);
  let thisWeek = 0, lastWeekCount = 0;
  for (let i = 0; i < 14; i++) if (active.has(addDays(today, -i))) i < 7 ? thisWeek++ : lastWeekCount++;
  return { thisWeek, lastWeek: lastWeekCount };
}
