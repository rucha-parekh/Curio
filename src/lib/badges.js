// Milestone badges. Effort badges (trying, improving, asking for help) sit next to accuracy ones
// so a student who is still learning earns as much as one who already knows the work.
import { allAssignments } from "./store.js";
import { submissionScore } from "./grading.js";

export const BADGE_KINDS = { streak: "Streaks", effort: "Effort", accuracy: "Accuracy", team: "Teamwork" };

export const BADGES = [
  { id: "streak-3", kind: "streak", icon: "🔥", name: "Warming up", desc: "3-day streak", test: (c) => c.bestStreak >= 3 },
  { id: "streak-7", kind: "streak", icon: "🌟", name: "On a roll", desc: "7-day streak", test: (c) => c.bestStreak >= 7 },
  { id: "streak-14", kind: "streak", icon: "🚀", name: "Unstoppable", desc: "14-day streak", test: (c) => c.bestStreak >= 14 },
  { id: "streak-30", kind: "streak", icon: "👑", name: "Legend", desc: "30-day streak", test: (c) => c.bestStreak >= 30 },
  { id: "rested", kind: "streak", icon: "😴", name: "Balanced", desc: "Took a rest day. Rest is part of learning!", test: (c) => c.restTaken >= 1 },
  { id: "keep-trying", kind: "effort", icon: "💪", name: "Never give up", desc: "Tried 25 answers", test: (c) => c.attempts >= 25 },
  { id: "bounce-back", kind: "effort", icon: "🦘", name: "Bounce back", desc: "Got 5 questions right after a wrong try", test: (c) => c.comebacks >= 5 },
  { id: "brave-ask", kind: "effort", icon: "🙋", name: "Brave asker", desc: "Asked for help 3 times", test: (c) => c.helpAsked >= 3 },
  { id: "level-up", kind: "effort", icon: "📈", name: "Level up", desc: "Beat your own score on a practice run", test: (c) => c.improved >= 1 },
  { id: "first-turnin", kind: "accuracy", icon: "📬", name: "First hand-in", desc: "Turned in an assignment", test: (c) => c.turnedIn >= 1 },
  { id: "bookworm", kind: "accuracy", icon: "📚", name: "Bookworm", desc: "Turned in 5 assignments", test: (c) => c.turnedIn >= 5 },
  { id: "perfect", kind: "accuracy", icon: "💯", name: "Perfect run", desc: "Every question right on the first try", test: (c) => c.perfect >= 1 },
  { id: "brain-gym", kind: "accuracy", icon: "🧠", name: "Brain gym", desc: "50 questions solved", test: (c) => c.solved >= 50 },
  { id: "team-player", kind: "team", icon: "🤝", name: "Team player", desc: "Added 10 answers to a class goal", test: (c) => c.goalHelp >= 10 },
  { id: "squad", kind: "team", icon: "🫶", name: "Squad up", desc: "Have 3 or more friends", test: (c) => c.friends >= 3 },
];

export function badgeCounts(s) {
  const st = s.student;
  const e = st.effort || {};
  const graded = allAssignments(s).filter((a) => !a.owner).map((a) => submissionScore(s.submissions[a.id], a)).filter(Boolean);
  return {
    bestStreak: st.bestStreak || 0,
    restTaken: (st.restDates || []).length,
    attempts: e.attempts || 0,
    comebacks: e.comebacks || 0,
    helpAsked: e.helpAsked || 0,
    improved: e.improved || 0,
    solved: e.solved || 0,
    turnedIn: graded.length,
    perfect: graded.filter((g) => g.pct === 100).length,
    goalHelp: Object.values(s.goalContrib || {}).reduce((a, b) => a + b, 0),
    friends: (st.friends || []).length,
  };
}

export function earnedBadges(s) {
  if (!s.student) return [];
  const c = badgeCounts(s);
  return BADGES.filter((b) => b.test(c));
}
