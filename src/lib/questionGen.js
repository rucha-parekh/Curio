// Built-in question maker for when no AI is connected. It reads the uploaded text and builds
// real questions from its own sentences: fill-in-the-blank, multiple choice and true/false.

const STOP = new Set("the a an and or but of to in on at for with by from as is are was were be been being this that these those it its into than then there their they them he she his her we our you your i not no yes can will would should could have has had do does did so such also very more most many much some any each other which who whom what when where why how about over under after before between during because while if".split(" "));

function sentences(text) {
  return text
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.replace(/\s+/g, " "))
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 220 && /[a-z]/.test(s) && !/^(figure|table|page|chapter)\b/i.test(s));
}

/** Words worth asking about: numbers, capitalised names (not first word), and long content words. */
function keyTerms(sentence) {
  const words = sentence.replace(/[.,;:!?()"“”]/g, "").split(" ");
  const out = [];
  words.forEach((w, i) => {
    const lw = w.toLowerCase();
    if (STOP.has(lw) || w.length < 3) return;
    let score = 0;
    if (/^\d[\d.,%]*$/.test(w)) score = 3;
    else if (i > 0 && /^[A-Z][a-z]+/.test(w)) score = 2.5;
    else if (w.length >= 7) score = 1 + w.length / 20;
    if (score) out.push({ word: w.replace(/[,]$/, ""), score });
  });
  return out.sort((a, b) => b.score - a.score);
}

function shuffle(list, seed) {
  const a = [...list];
  let s = seed || 7;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const blank = (sentence, word) => sentence.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), "_____");

export function localQuestions(text, count = 6) {
  const sents = sentences(text);
  const items = sents.map((s) => ({ s, terms: keyTerms(s) })).filter((x) => x.terms.length);
  // Pool of terms used as wrong options, grouped by kind so options look alike.
  const pool = { num: new Set(), name: new Set(), word: new Set() };
  for (const it of items)
    for (const t of it.terms) pool[/^\d/.test(t.word) ? "num" : /^[A-Z]/.test(t.word) ? "name" : "word"].add(t.word);

  const picked = shuffle(items, items.length).slice(0, Math.min(count, items.length));
  const qs = [];
  picked.forEach((it, i) => {
    const term = it.terms[0].word;
    const kind = /^\d/.test(term) ? "num" : /^[A-Z]/.test(term) ? "name" : "word";
    const stem = (w) => w.toLowerCase().replace(/(es|s|ed|ing)$/, "").slice(0, 6);
    const others = [...new Map([...pool[kind]].filter((w) => stem(w) !== stem(term) && !it.s.toLowerCase().includes(w.toLowerCase())).map((w) => [stem(w), w])).values()];
    const mode = i % 3; // 0 mc, 1 short, 2 tf
    const explanation = `From your document: "${it.s}"`;
    if (mode === 0 && others.length >= 3) {
      const options = shuffle([term, ...shuffle(others, i + 3).slice(0, 3)], i + 11);
      qs.push({ type: "mc", prompt: `Fill in the blank: ${blank(it.s, term)}`, options, answer: options.indexOf(term), hint: `Look for the part of your document that talks about ${it.terms[1]?.word || "this idea"}.`, explanation });
    } else if (mode === 2 && others.length >= 1) {
      const fake = i % 2 === 0;
      const swap = shuffle(others, i + 5)[0];
      const statement = fake ? it.s.replace(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), swap) : it.s;
      qs.push({ type: "tf", prompt: `True or false? ${statement}`, answer: !fake, hint: "Check this sentence against your document word by word.", explanation });
    } else {
      qs.push({ type: "short", prompt: `Fill in the blank: ${blank(it.s, term)}`, answer: term, accept: [], hint: `It ${/^\d/.test(term) ? "is a number" : `starts with "${term[0]}" and has ${term.length} letters`}.`, explanation });
    }
  });
  return qs.map((q, i) => ({ ...q, id: `q${i + 1}` }));
}
