// Demo content. Everything here is plain data, so a school can swap subjects or questions easily.
// Dates are relative to "today" so the demo always has things due soon.

const DAY = 86_400_000;
export const daysFromNow = (n, hour = 21) => {
  const d = new Date(Date.now() + n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const COURSES = [
  { id: "math", name: "Math", teacher: "Ms. Rivera", color: "lilac", icon: "🧮", blurb: "Fractions, ratios and percents" },
  { id: "science", name: "Science", teacher: "Mr. Okafor", color: "mint", icon: "🔬", blurb: "Cells and states of matter" },
  { id: "english", name: "English", teacher: "Ms. Chen", color: "peach", icon: "📚", blurb: "Figurative language and main ideas" },
  { id: "social", name: "Social Studies", teacher: "Mr. Haddad", color: "lagune", icon: "🌍", blurb: "Ancient Egypt and map skills" },
];

// Question types: "mc" (answer = option index), "tf" (answer = true/false), "short" (answer = text or number, accept = other OK answers)
export const SEED_ASSIGNMENTS = [
  {
    id: "math-fractions",
    courseId: "math",
    title: "Fraction Fix-Up",
    description: "Help the school market get its recipes and prices right.",
    due: daysFromNow(2),
    questions: [
      { id: "q1", type: "short", prompt: "A lemonade recipe needs 3/4 cup of syrup per pitcher. How many cups for 3 pitchers?", answer: "2 1/4", accept: ["9/4", "2.25"], hint: "3 pitchers means 3 groups of 3/4. Try multiplying only the top number by 3." , explanation: "3 × 3/4 = 9/4, which is 2 1/4 cups." },
      { id: "q2", type: "mc", prompt: "What is 2/3 + 1/4?", options: ["3/7", "11/12", "3/12", "8/12"], answer: 1, hint: "Thirds and fourths are different sizes. Turn both into twelfths first.", explanation: "2/3 = 8/12 and 1/4 = 3/12, so the total is 11/12." },
      { id: "q3", type: "short", prompt: "Trail mix uses nuts and raisins in a ratio of 3 to 2. If you use 12 cups of nuts, how many cups of raisins do you need?", answer: "8", hint: "How many times bigger is 12 than 3? Make the raisins that many times bigger too.", explanation: "12 ÷ 3 = 4, so 2 × 4 = 8 cups of raisins." },
      { id: "q4", type: "short", prompt: "A $40 hoodie is 25% off. What is the sale price in dollars?", answer: "30", hint: "First find 25% of $40 (that's a quarter). Then take it off the price.", explanation: "25% of 40 is 10. 40 − 10 = $30." },
      { id: "q5", type: "tf", prompt: "50% of 80 is the same as 1/2 of 80.", answer: true, hint: "What fraction is 50%?", explanation: "50% means 50 out of 100, which is 1/2. Both are 40." },
    ],
  },
  {
    id: "math-percents",
    courseId: "math",
    title: "Percent Power",
    description: "Quick practice with percents you see in real life.",
    due: daysFromNow(6),
    questions: [
      { id: "q1", type: "short", prompt: "What is 10% of 250?", answer: "25", hint: "To find 10%, divide by 10.", explanation: "250 ÷ 10 = 25." },
      { id: "q2", type: "short", prompt: "30 is what percent of 120? (Type just the number.)", answer: "25", accept: ["25%"], hint: "Write it as a fraction: 30/120. Simplify it, then turn it into a percent.", explanation: "30/120 = 1/4 = 25%." },
      { id: "q3", type: "mc", prompt: "Which of these is the biggest?", options: ["3/5", "0.58", "5/8", "59%"], answer: 2, hint: "Turn them all into decimals so you can compare.", explanation: "5/8 = 0.625, which is bigger than 0.6, 0.58 and 0.59." },
      { id: "q4", type: "tf", prompt: "If a price goes down 20% and then up 20%, it ends up back where it started.", answer: false, hint: "Try it with $100. What is 20% of the new, smaller price?", explanation: "$100 → $80 → $96. The 20% increase is on a smaller number." },
    ],
  },
  {
    id: "science-cells",
    courseId: "science",
    title: "Cells: The Building Blocks",
    description: "Check what you know before the microscope lab.",
    due: daysFromNow(1),
    questions: [
      { id: "q1", type: "mc", prompt: "Which part of the cell controls what the cell does?", options: ["Nucleus", "Cell wall", "Cytoplasm", "Vacuole"], answer: 0, hint: "Think of the cell's 'brain' or control centre.", explanation: "The nucleus holds the DNA and controls the cell's activities." },
      { id: "q2", type: "mc", prompt: "Which part do plant cells have that animal cells don't?", options: ["Mitochondria", "Cell membrane", "Chloroplasts", "Nucleus"], answer: 2, hint: "Plants make their own food from sunlight. Which part does that?", explanation: "Chloroplasts capture sunlight for photosynthesis. Animal cells don't have them." },
      { id: "q3", type: "tf", prompt: "All living things are made of cells.", answer: true, hint: "This is one of the main ideas of cell theory.", explanation: "Cell theory says every living thing is made of one or more cells." },
      { id: "q4", type: "short", prompt: "The ___ is known as the powerhouse of the cell.", answer: "mitochondria", accept: ["mitochondrion", "the mitochondria"], hint: "It releases energy from food. Its name starts with 'mito'.", explanation: "Mitochondria release energy from food for the cell to use." },
      { id: "q5", type: "mc", prompt: "Which tool would you use to see cells?", options: ["Telescope", "Microscope", "Periscope", "Thermometer"], answer: 1, hint: "'Micro' means very small.", explanation: "A microscope makes tiny things like cells look bigger." },
    ],
  },
  {
    id: "science-matter",
    courseId: "science",
    title: "States of Matter",
    description: "Solids, liquids, gases and how they change.",
    due: daysFromNow(5),
    questions: [
      { id: "q1", type: "tf", prompt: "Particles in a gas are closer together than particles in a solid.", answer: false, hint: "Picture a crowded hallway versus an empty gym.", explanation: "Solid particles are packed tightly. Gas particles are far apart and move freely." },
      { id: "q2", type: "mc", prompt: "When ice melts, it changes from…", options: ["solid to liquid", "liquid to gas", "gas to liquid", "liquid to solid"], answer: 0, hint: "Ice is frozen water. What is it before and after melting?", explanation: "Melting turns a solid into a liquid." },
      { id: "q3", type: "short", prompt: "At sea level, water boils at ___ °C.", answer: "100", hint: "It's a nice round number on the Celsius scale.", explanation: "Water boils at 100 °C at sea level." },
      { id: "q4", type: "mc", prompt: "Which one is an example of condensation?", options: ["A puddle drying up", "Fog on a cold bathroom mirror", "An ice cube melting", "Water freezing in a tray"], answer: 1, hint: "Condensation is gas turning back into liquid.", explanation: "Warm water vapour hits the cold mirror and turns into tiny drops." },
    ],
  },
  {
    id: "english-figurative",
    courseId: "english",
    title: "Figurative Language Hunt",
    description: "Spot the simile, metaphor and more.",
    due: daysFromNow(3),
    questions: [
      { id: "q1", type: "mc", prompt: "\"The classroom was a zoo.\" This is a…", options: ["Simile", "Metaphor", "Personification", "Alliteration"], answer: 1, hint: "Does it use 'like' or 'as'? Or does it say one thing IS another?", explanation: "It says the classroom IS a zoo, with no 'like' or 'as', so it's a metaphor." },
      { id: "q2", type: "mc", prompt: "\"The wind whispered through the trees.\" This is…", options: ["Simile", "Hyperbole", "Personification", "Onomatopoeia"], answer: 2, hint: "Can wind really whisper? Who usually whispers?", explanation: "Whispering is something people do, so giving it to the wind is personification." },
      { id: "q3", type: "tf", prompt: "A simile compares two things using 'like' or 'as'.", answer: true, hint: "Think of 'as brave as a lion'.", explanation: "Yes. 'As brave as a lion' is a simile." },
      { id: "q4", type: "mc", prompt: "\"Peter Piper picked a peck of pickled peppers.\" This is…", options: ["Metaphor", "Simile", "Hyperbole", "Alliteration"], answer: 3, hint: "Listen to the first sound of each word.", explanation: "Lots of words start with the same 'p' sound. That's alliteration." },
      { id: "q5", type: "short", prompt: "\"I've told you a million times!\" is an example of ___.", answer: "hyperbole", accept: ["exaggeration"], hint: "It's a huge exaggeration. The word starts with 'hyper'.", explanation: "Hyperbole is exaggerating on purpose for effect." },
    ],
  },
  {
    id: "english-main-idea",
    courseId: "english",
    title: "Main Idea Practice",
    description: "Read the short passage and find the main idea.",
    due: daysFromNow(-4),
    passage: "Sea otters hold hands while they sleep so they don't drift apart. They also wrap themselves in kelp to stay in place. These habits help otter families stay together in the moving ocean.",
    questions: [
      { id: "q1", type: "mc", prompt: "What is the main idea of the passage?", options: ["Kelp is a kind of seaweed", "Sea otters have ways to stay together while sleeping", "The ocean is always moving", "Otters are good swimmers"], answer: 1, hint: "Which answer do ALL the sentences support?", explanation: "Every sentence is about how otters stay together while they sleep." },
      { id: "q2", type: "tf", prompt: "A supporting detail is the same thing as the main idea.", answer: false, hint: "Details help explain the main idea.", explanation: "Details support the main idea. They aren't the main idea." },
      { id: "q3", type: "mc", prompt: "Which sentence is a supporting detail?", options: ["Sea otters are amazing", "They wrap themselves in kelp to stay in place", "This passage is about animals", "Otters live in the ocean"], answer: 1, hint: "Which one comes straight from the passage and backs up the main idea?", explanation: "Wrapping in kelp is one of the ways otters stay together." },
      { id: "q4", type: "short", prompt: "What do sea otters hold while they sleep?", answer: "hands", accept: ["each other's hands", "paws", "each other"], hint: "Look at the first sentence.", explanation: "They hold hands so they don't drift apart." },
      { id: "q5", type: "tf", prompt: "The title 'How Otters Stay Together' would fit this passage.", answer: true, hint: "Does the title match the main idea?", explanation: "Yes, it matches the main idea." },
    ],
  },
  {
    id: "social-egypt",
    courseId: "social",
    title: "Ancient Egypt Explorer",
    description: "Pyramids, pharaohs and the mighty Nile.",
    due: daysFromNow(4),
    questions: [
      { id: "q1", type: "mc", prompt: "Which river was the centre of life in ancient Egypt?", options: ["Amazon", "Nile", "Tigris", "Yangtze"], answer: 1, hint: "It's the longest river in Africa.", explanation: "The Nile gave Egypt water, food and travel routes." },
      { id: "q2", type: "tf", prompt: "The pyramids were built as tombs for pharaohs.", answer: true, hint: "What happened to pharaohs after they died?", explanation: "Pyramids were giant tombs to protect pharaohs in the afterlife." },
      { id: "q3", type: "mc", prompt: "What was the Egyptian writing system called?", options: ["Cuneiform", "Hieroglyphics", "Latin alphabet", "Braille"], answer: 1, hint: "It used little pictures for sounds and ideas.", explanation: "Hieroglyphics used picture symbols." },
      { id: "q4", type: "short", prompt: "The kings of ancient Egypt were called ___.", answer: "pharaohs", accept: ["pharaoh", "pharoahs", "pharoah"], hint: "You saw this word in question 2!", explanation: "Egyptian kings were called pharaohs." },
      { id: "q5", type: "mc", prompt: "Why was the Nile's yearly flood helpful?", options: ["It left rich soil for farming", "It kept enemies away", "It made the desert colder", "It built mountains"], answer: 0, hint: "Think about what farmers need.", explanation: "The flood left behind dark, rich soil, which was great for growing crops." },
    ],
  },
  {
    id: "social-maps",
    courseId: "social",
    title: "Map Skills",
    description: "Compass roses, keys and scales.",
    due: daysFromNow(-2),
    questions: [
      { id: "q1", type: "mc", prompt: "What does a map's legend (key) tell you?", options: ["Who drew the map", "What the symbols mean", "How old the map is", "The weather"], answer: 1, hint: "It helps you 'unlock' the symbols.", explanation: "The legend explains the map's symbols." },
      { id: "q2", type: "mc", prompt: "Which direction is opposite to east?", options: ["North", "South", "West", "Up"], answer: 2, hint: "Never Eat Soggy Waffles, going around.", explanation: "West is opposite east." },
      { id: "q3", type: "tf", prompt: "A map scale helps you work out real distances.", answer: true, hint: "1 cm might stand for 10 km.", explanation: "The scale links map distance to real distance." },
      { id: "q4", type: "short", prompt: "Lines that run east–west on a globe are lines of ___.", answer: "latitude", accept: ["lattitude"], hint: "Think 'ladder-tude': the rungs go across.", explanation: "Lines of latitude run east to west." },
      { id: "q5", type: "mc", prompt: "The equator divides Earth into…", options: ["East and West", "North and South", "Land and sea", "Day and night"], answer: 1, hint: "It wraps around the middle.", explanation: "The equator splits Earth into the Northern and Southern Hemispheres." },
    ],
  },
  // Just posted, so nobody in the demo class has done it yet. Shows the interactive question types.
  {
    id: "science-water-lab",
    courseId: "science",
    title: "Water Cycle Lab",
    description: "Drag, match and slide your way around the water cycle.",
    due: daysFromNow(7),
    postedToday: true,
    questions: [
      { id: "q1", type: "order", prompt: "Put the water cycle in order, starting with the Sun.", items: ["The Sun heats water in the ocean", "Water evaporates into vapour", "Vapour cools and condenses into clouds", "Rain or snow falls back down"], hint: "What has to happen before clouds can form?", explanation: "Heat → evaporation → condensation → precipitation, then it starts again." },
      { id: "q2", type: "match", prompt: "Match each change to what happens.", pairs: [["Evaporation", "liquid → gas"], ["Condensation", "gas → liquid"], ["Melting", "solid → liquid"], ["Freezing", "liquid → solid"]], hint: "'Con-dense' means to squeeze together. Which change brings particles closer?", explanation: "Evaporation and condensation are opposites, and so are melting and freezing." },
      { id: "q3", type: "slider", prompt: "About what percent of Earth's water is salt water?", min: 0, max: 100, step: 1, answer: 97, tolerance: 2, unit: "%", hint: "Think about how much of the planet is ocean. It's a LOT.", explanation: "About 97% is salt water in the oceans. Only about 3% is fresh water." },
      { id: "q4", type: "mc", prompt: "Which part of the water cycle makes puddles disappear on a sunny day?", options: ["Condensation", "Precipitation", "Evaporation", "Freezing"], answer: 2, hint: "The water goes up into the air. What's that change called?", explanation: "The Sun's heat turns the puddle into water vapour: evaporation." },
    ],
  },
];

export const NOTES = {
  math: [
    "Multiplying a fraction by a whole number: multiply the top number only. 3 × 2/5 = 6/5.",
    "Adding fractions: make the bottom numbers match first (common denominator), then add the tops.",
    "Ratios grow by multiplying both parts by the same number. 2:3 → 4:6 → 6:9.",
    "Percent means 'out of 100'. 25% = 25/100 = 1/4.",
    "Sale price = original price − discount. Find the discount first.",
  ],
  science: [
    "Cell theory: all living things are made of cells, and cells come from other cells.",
    "Nucleus = control centre. Mitochondria = release energy. Cell membrane = gatekeeper.",
    "Plant cells also have a cell wall and chloroplasts.",
    "Solids have tightly packed particles. Liquids flow. Gas particles spread far apart.",
    "Melting: solid → liquid. Evaporation: liquid → gas. Condensation: gas → liquid.",
  ],
  english: [
    "Simile: compares with 'like' or 'as' (fast as lightning).",
    "Metaphor: says one thing IS another (the room was an oven).",
    "Personification: gives human actions to non-human things (the sun smiled).",
    "Hyperbole: a big exaggeration (I'm so hungry I could eat a horse).",
    "Main idea = what the whole passage is mostly about. Details back it up.",
  ],
  social: [
    "The Nile River gave Egypt water, food, rich soil and a way to travel.",
    "Pharaohs were Egypt's kings. Pyramids were their tombs.",
    "Hieroglyphics = Egyptian picture writing, written on papyrus and walls.",
    "A map legend explains symbols. A compass rose shows directions.",
    "Latitude lines run east–west. Longitude lines run north–south.",
  ],
};

export const SEED_ANNOUNCEMENTS = [
  { id: "a1", courseId: "science", title: "Microscope lab tomorrow", body: "Bring a leaf from home if you can! We'll look at real plant cells. 🍃", at: daysFromNow(-0.2, 9), from: "Mr. Okafor" },
  { id: "a2", courseId: "math", title: "Fraction Fix-Up is up", body: "Take your time and use your study buddy if you get stuck. No rush, just do your best thinking.", at: daysFromNow(-1, 10), from: "Ms. Rivera" },
  { id: "a3", courseId: "english", title: "Book fair on Friday", body: "Our class visits the library book fair at 1:30. Bring a list of books you'd love to read.", at: daysFromNow(-1.5, 11), from: "Ms. Chen" },
  { id: "a4", courseId: "social", title: "Egypt projects", body: "Start thinking about your Egypt mini-project. You can build, draw, or write. We'll pick topics next week.", at: daysFromNow(-2, 12), from: "Mr. Haddad" },
];

export const SHOP_ITEMS = [
  { id: "party-hat", slot: "hat", name: "Party hat", price: 30 },
  { id: "cap", slot: "hat", name: "Cool cap", price: 40 },
  { id: "flower-crown", slot: "hat", name: "Flower crown", price: 50 },
  { id: "bunny-ears", slot: "hat", name: "Bunny ears", price: 60 },
  { id: "crown", slot: "hat", name: "Gold crown", price: 90 },
  { id: "round-specs", slot: "face", name: "Round specs", price: 30 },
  { id: "star-shades", slot: "face", name: "Star shades", price: 45 },
  { id: "heart-glasses", slot: "face", name: "Heart glasses", price: 55 },
  { id: "bow-tie", slot: "neck", name: "Bow tie", price: 25 },
  { id: "scarf", slot: "neck", name: "Cozy scarf", price: 35 },
  { id: "headphones", slot: "extra", name: "Headphones", price: 60 },
  { id: "balloon", slot: "extra", name: "Star balloon", price: 45 },
];

export const STREAK_FREEZE = { price: 40, max: 5 };

/** Class goals everyone works on together. `base` is the demo class's progress so far. */
export const SEED_GOALS = [
  { id: "goal-answers", courseId: "all", title: "Class 7B solves 400 questions", metric: "answers", target: 400, reward: "🎉 Pajama day on Friday", base: 262, createdAt: daysFromNow(-3, 8) },
  { id: "goal-math", courseId: "math", title: "Hand in 30 math assignments together", metric: "turnins", target: 30, reward: "🍪 Cookie celebration", base: 21, createdAt: daysFromNow(-5, 8) },
];
export const GOAL_METRICS = { answers: "questions solved", turnins: "assignments handed in" };

/** Things families can do away from screens, by subject. Shown next to a child's gaps. */
export const OFFLINE_IDEAS = {
  math: [
    "Cook together and double or halve a recipe. Say the fractions out loud.",
    "At the store, guess the sale price before checking (what's 25% off $40?).",
    "Card game: flip two cards to make a fraction. Whose fraction is bigger?",
  ],
  science: [
    "After a hot shower, look at the foggy mirror and talk about condensation.",
    "Freeze, melt and boil water in the kitchen and name each change.",
    "Look at an onion skin or a leaf with a magnifying glass.",
  ],
  english: [
    "Read a short news story together and sum up the main idea in one sentence.",
    "Spot similes and metaphors in song lyrics on a car ride.",
    "Take turns inventing a silly hyperbole at dinner.",
  ],
  social: [
    "Draw a map of your street with a legend and a compass rose.",
    "Use a paper map (or a mall map) to find your way somewhere.",
    "Watch a short documentary on Ancient Egypt and share 3 surprising facts.",
  ],
};

export const BUDDIES = [
  { id: "nova", name: "Nova", vibe: "Pop star", line: "Let's make studying a hit!" },
  { id: "zip", name: "Captain Zip", vibe: "Superhero", line: "Homework hero, reporting for duty!" },
  { id: "kiko", name: "Kiko", vibe: "Skater", line: "We've got this. One trick at a time." },
  { id: "bao", name: "Bao", vibe: "Panda pal", line: "Snack break after this question?" },
];

const NAMES = ["Ava", "Mateo", "Priya", "Liam", "Zoe", "Kenji", "Amara", "Noah", "Sofia", "Eli", "Hana", "Omar", "Grace", "Diego", "Maya", "Leo", "Nia", "Sam", "Aisha", "Lucas", "Ivy", "Ravi", "Chloe", "Theo"];
const DOING = [
  "Cells: The Building Blocks", "Fraction Fix-Up", "Figurative Language Hunt", "Ancient Egypt Explorer", "States of Matter", "Percent Power",
];

/** Small deterministic random so the demo class looks the same every time. */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** 24 classmates with grades, activity and points, for the leaderboard and teacher site. */
export function makeClassmates() {
  const r = rng(42);
  return NAMES.map((name, i) => {
    const skill = 0.55 + r() * 0.43; // how often they get things right
    const effort = r();
    const results = {};
    for (const a of SEED_ASSIGNMENTS.filter((x) => !x.postedToday)) {
      const past = new Date(a.due) < new Date();
      const doneChance = past ? 0.92 : 0.25 + effort * 0.5;
      if (r() < doneChance) {
        const total = a.questions.length;
        const correct = Math.max(1, Math.min(total, Math.round(total * (skill + (r() - 0.5) * 0.25))));
        const late = past && r() < 0.12;
        results[a.id] = { correct, total, submittedAt: new Date(Math.min(Date.now() - ((i % 12) + 1) * 3.6e6, new Date(a.due).getTime() - (late ? -DAY : r() * 3 * DAY))).toISOString(), late, minutes: Math.round(4 + r() * 12), hintsUsed: Math.round(r() * 3) };
      }
    }
    const minutesAgo = Math.round(r() < 0.45 ? r() * 20 : 60 + r() * 2000);
    const doing = minutesAgo < 20 ? { label: `Working on ${DOING[i % DOING.length]}`, question: 1 + Math.floor(r() * 4) } : null;
    const stars = Object.values(results).reduce((s, x) => s + x.correct * 9 + 20, 0) + Math.round(r() * 40);
    return { id: `c${i}`, name, buddy: BUDDIES[i % BUDDIES.length].id, results, minutesAgo, doing, stars, weekStars: Math.round(stars * (0.2 + r() * 0.35)), buddyChats: Math.round(r() * 9), streakDays: Math.round(r() * 6) };
  });
}
