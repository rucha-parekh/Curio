// Little sound effects for the buddy's moods, made with the Web Audio API (no audio files to download).
let ctx = null;
function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(c, freq, start, dur, { type = "sine", vol = 0.16, slideTo } = {}) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

const SOUNDS = {
  // happy rising arpeggio
  cheer: (c, t) => [523, 659, 784, 1047].forEach((f, i) => tone(c, f, t + i * 0.09, 0.24, { type: "triangle" })),
  // two drooping notes: "aww"
  sad: (c, t) => {
    tone(c, 440, t, 0.35, { slideTo: 310 });
    tone(c, 330, t + 0.3, 0.5, { slideTo: 220 });
  },
  // soft bubble pop for ordinary messages
  pop: (c, t) => tone(c, 520, t, 0.13, { slideTo: 880, vol: 0.1 }),
  // "boop-boop!" to get attention
  wave: (c, t) => {
    tone(c, 880, t, 0.12, { type: "square", vol: 0.05 });
    tone(c, 1175, t + 0.16, 0.14, { type: "square", vol: 0.05 });
  },
  // whoosh up + sparkle for the sign-in twirl
  twirl: (c, t) => {
    tone(c, 260, t, 0.8, { slideTo: 1400, vol: 0.08 });
    [1047, 1319, 1568].forEach((f, i) => tone(c, f, t + 0.7 + i * 0.08, 0.26, { type: "triangle", vol: 0.09 }));
  },
  // sparkly run for a new badge
  badge: (c, t) => [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(c, f, t + i * 0.07, 0.3, { type: "triangle", vol: 0.1 })),
};

export function playSfx(name) {
  if (!SOUNDS[name]) return;
  if (typeof navigator !== "undefined" && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  const c = audio();
  if (c) SOUNDS[name](c, c.currentTime + 0.02);
}
