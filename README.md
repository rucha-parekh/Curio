# Curio

A kid-friendly learning site for Grades 6-8, with three separate sites behind one landing page:

- **Students**: classes, assignments, friends & leaderboard, shop, and a floating study buddy.
- **Teachers**: every student's progress, grades and activity, plus assignments, deadlines and announcements.
- **Parents**: their child's grades, what's due, and news from teachers.

## Run it

```sh
npm install
npm run dev          # http://localhost:5173
npm test
npm run build:single # one self-contained index.html in dist-single/
```

Everything is stored in the browser (`localStorage`), so the three sites share data when opened in the same browser. Open a second tab to see a teacher's assignment appear for the student.

## Marketing pages

| Route | Page |
| --- | --- |
| `#` or `#home` | Home: hero, features for students / teachers / families, how it works, accessibility, testimonials, logos, call to action |
| `#pricing` | Free Classroom plan, School (2-month free trial), Campus (custom), monthly/yearly switch, student-count estimator, comparison table, add-ons, discounts, FAQ |
| `#about` | Inspiration, founders, journey, values, testimonials, logo wall |
| `#contact` (`#contact-school`, `#contact-campus` pre-pick a plan) | Validated contact form saved in this browser (no backend yet), email with copy button, demo and trial cards |
| `#start` | The "Who's here today?" role chooser (Sign in) |

Where the content lives: prices, limits and the comparison table in `src/lib/plans.js` (prices are proposals); founders, journey, values, **sample** testimonials and **placeholder** logos in `src/lib/marketing.js`; form rules in `src/lib/contact.js`. Anything in [brackets] still needs filling in. Testimonials show a visible "Sample" tag and the logos are invented institutions until real ones (with permission) replace them.

## Student site (`#student`)

| Tab | What's on it |
| --- | --- |
| Home | Class cards at the top (click to open), then the next 3 things due. Nothing else. |
| Class page | Four tabs for that subject: Assignments, Announcements, Grades, Notes (teacher notes + the student's own notes). |
| Assignments | To do / Done / My practice, and "Practice from your own file". |
| Badges | Daily streak with a 7-day calendar, streak freezes 🧊, weekly rest days and one extra day off a week (rest never breaks a streak), effort vs accuracy, badges (streak, effort, accuracy, teamwork), class goals, and the family link code. |
| Friends | Leaderboard, friends list, and a squad challenge (you + friends earn stars together). |
| Shop | Shop and wardrobe merged: buy items with stars, wear or take them off, switch buddy for free. |

**Assignments actually work.** One question at a time, instant feedback, hints, unlimited retries, then "Turn it in". The grade counts questions right on the first try. Done work can be reviewed and practised again.

**Upload a PDF or Word file** (or paste text) and you get real questions from it. In the published claude.ai version, Claude writes the questions. Without AI, a built-in generator makes fill-in-the-blank, multiple-choice and true/false questions from the document's own sentences. Files are read in the browser and never uploaded.

**Study buddy.** It floats in the corner. It only speaks in a small bubble when it has something to say (what's due, encouragement after an answer, a hint offer), and opens a chat when tapped. Before every reply it gets a summary of what's on the student's screen, their unfinished work and due dates, recent announcements, the class notes, and the current question. It gives hints, not answers. Hiding the answer is enforced in code too, not only in the prompt.

**Buddy personality.** Twirls in on sign-in with good morning/afternoon/evening and streak news. Cheers loudly with floating hearts when you get it right, looks a little sad (worried brows, a tear) when you don't, then gives step-by-step help for the question on screen: key words → the teacher's hint → a bigger nudge (crosses off a wrong option, "too high / too low", the first step of an ordering puzzle). Never the answer. Lines rotate so it doesn't repeat itself. If you go quiet it waves to get your attention, with something useful to do.

**Voice and sound.** The buddy talks out loud in a girl or boy voice (picked at sign-up, changeable in the chat header or the Aa Display menu) and plays little sound effects for each mood: a cheer, a sad "aww", a boop-boop for attention, a whoosh on sign-in, a sparkle for badges. Its mouth moves while it talks. A mute button sits next to the buddy at all times. Uses the browser's own speech and Web Audio, so no audio is downloaded or sent anywhere. Browsers only allow sound after the first tap or key press, so a greeting on a fresh page load is spoken as soon as the student touches the page.

**Beside the question.** On an assignment the buddy glides from the corner to sit next to the question card and talks to you there. On narrow screens with no room beside the card it stays in the corner.

**Effort rewards.** Stars for asking for a hint (+2), getting it right after a mistake (+5), beating your own score in practice (+15) and each new badge (+10).

Buddies are original characters: Nova (pop star), Captain Zip (superhero), Kiko (skater) and Bao (panda). Shop items fit all four.

## Teacher site (`#teacher`)

- **Classes** (home): one card per subject taught to Class 7B. Below it, the class at a glance (unchanged).
- **Class page** (`#teacher-class-<subject>`): current and past assignments (each expands to show who finished, when, and their score), a "Who's done" grid of students × assignments with hand-in date and time, **+ New assignment**, the student list, and class goals.
- **New assignment**: multiple choice, short answer, true/false, plus interactive questions: put in order (drag or arrow buttons), matching, and number line. Optional video (YouTube or file): captions are switched on and a transcript is required. Or generate questions from a PDF/Word file.
- **Students**, **Assignments**, **Announcements**: as before.

## Parent site (`#parent`)

Family account linked to one or more children with each child's code (shown on the student's Badges page). Per child: alerts (engagement drop, missing work, repeated struggle), grades, strengths and gaps with offline activities to try at home, effort, what's coming up and teacher news.

## Accessibility

The **Aa Display** menu on every site: text size, dyslexia-friendly font (uses OpenDyslexic if installed, otherwise Verdana-style with wider spacing), colour-blind-safe palette (blue/orange), read buddy messages aloud, and less motion. Read-aloud buttons on questions, passages, notes, announcements, transcripts and buddy messages (browser text-to-speech). Status is always shown with icons or words, not colour alone. Every control, including the order and matching questions, works from the keyboard.

## AI

| Where it runs | How the buddy and question generator reach Claude |
| --- | --- |
| Published claude.ai page | The `sample` capability, on the viewer's own Claude account. No key needed. |
| Your own hosting | `server/ai-proxy.js` holds `AI_API_KEY` on the server. Set `VITE_AI_PROXY_URL` to point the app at it. |
| No AI | The scripted buddy and the built-in question generator. |

## Files

```
src/lib/seed.js            courses, assignments (real questions), notes, announcements, shop items, 24 classmates
src/lib/store.js           shared state and every student/teacher action
src/lib/grading.js         answer checking (fractions, spelling slips), stars, grades
src/lib/ai.js              buddy chat + context, question generation, answer guard, scripted fallback
src/lib/questionGen.js     built-in question generator
src/lib/fileText.js        PDF/Word/text reading (loads pdf.js / mammoth on demand)
src/components/            Buddy (characters + items), BuddyFloat, AssignmentPlayer, UploadQuestions, ui
src/pages/Landing.jsx      "Who's here today?" role chooser
src/pages/student/         StudentApp, Home, Course, Assignments, Friends, Shop
src/pages/teacher/         TeacherApp, Overview, Students (+ detail), TeacherAssignments, Announcements, metrics
src/pages/parent/          ParentApp
```

Removed on purpose: Brightspace connection, calendar import, student "add assignment", focus blocks, goals, and grades on the home page.
