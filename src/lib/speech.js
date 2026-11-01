// Read-aloud and the buddy's voice, with the browser's built-in text-to-speech. Nothing leaves the device.
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Emojis and arrows read badly ("smiling face with…"), so they're dropped before speaking. */
export const speakable = (text) => String(text).replace(/\p{Extended_Pictographic}|️/gu, "").replace(/→/g, ", then ").replace(/\s+/g, " ").trim();

// A girl voice and a boy voice. We look for a matching system voice, then tune pitch so it sounds young and friendly.
export const VOICES = { girl: { label: "Girl", pitch: 1.35, rate: 1.03 }, boy: { label: "Boy", pitch: 1.1, rate: 1.0 } };
const GIRL = /female|zira|aria|jenny|samantha|victoria|karen|moira|tessa|fiona|susan|hazel|libby|sonia|natasha|allison|google us english|google uk english female/i;
const BOY = /\bmale|david|mark|guy|daniel|alex|fred|george|ryan|thomas|aaron|google uk english male/i;

let voices = [];
const loadVoices = () => (voices = window.speechSynthesis.getVoices());
if (canSpeak()) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}
function pickVoice(kind) {
  const en = voices.filter((v) => /^en/i.test(v.lang));
  const pool = en.length ? en : voices;
  const match = pool.find((v) => (kind === "boy" ? BOY.test(v.name) && !/female/i.test(v.name) : GIRL.test(v.name)));
  return { voice: match || pool[0] || null, matched: !!match };
}

// Browsers only allow speech after the person has clicked or typed once. Until then, keep the latest line and say it then.
let pending = null;
const activated = () => (typeof navigator !== "undefined" && navigator.userActivation ? navigator.userActivation.hasBeenActive : true);
if (typeof window !== "undefined") {
  const unlock = () => {
    if (!pending) return;
    const [t, o] = pending;
    pending = null;
    setTimeout(() => speak(t, o), 0);
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

/** speak(text, { voice: "girl" | "boy", onStart, onEnd }) */
export function speak(text, { onEnd, onStart, voice = "girl" } = {}) {
  if (!canSpeak() || !text) return;
  if (!activated()) {
    pending = [text, { onEnd, onStart, voice }];
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(speakable(text));
  const v = VOICES[voice] || VOICES.girl;
  const { voice: sys, matched } = pickVoice(voice);
  if (sys) u.voice = sys;
  // No matching system voice: bend the pitch further so girl and boy still sound different.
  u.pitch = matched ? v.pitch : voice === "boy" ? 0.8 : 1.55;
  u.rate = v.rate;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}
export function stopSpeaking() {
  pending = null;
  if (canSpeak()) window.speechSynthesis.cancel();
}
