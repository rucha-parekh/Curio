// Original chibi study buddies (our own designs). Every buddy shares one head/body layout,
// so shop items fit everyone: hat (top of head), face (eyes), neck, extra.

const SKIN = { nova: "#FFD9C2", zip: "#E8B48C", kiko: "#8D5A3B", bao: "#FFFFFF" };
const INK = "#2B2440";

// Moods: happy, talk, wow, happy-closed, cheer (arms up, big grin), sad (worried brows, frown, a tear), wave (calling you over).
const CLOSED_EYES = ["happy-closed", "cheer"];

/** Worried brows and a little tear, drawn on top of any face. */
function SadBits({ brow = INK }) {
  return (
    <g>
      <g fill="none" stroke={brow} strokeWidth="3" strokeLinecap="round">
        <path d="M37 51 l14 -5" />
        <path d="M83 51 l-14 -5" />
      </g>
      <path d="M85 70 q-3.6 6 0 8.4 q3.6 -2.4 0 -8.4z" fill="#7CC8FF" stroke="#4DA3E0" strokeWidth="1" />
    </g>
  );
}

function Eyes({ mood }) {
  if (CLOSED_EYES.includes(mood)) {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
        <path d="M40 64 q6 -7 12 0" />
        <path d="M68 64 q6 -7 12 0" />
      </g>
    );
  }
  const sad = mood === "sad";
  return (
    <g>
      <g className="buddy-eyes">
        <ellipse cx="46" cy={sad ? 65 : 63} rx="7" ry={sad ? 7.4 : 8.6} fill={INK} />
        <ellipse cx="74" cy={sad ? 65 : 63} rx="7" ry={sad ? 7.4 : 8.6} fill={INK} />
        <circle cx="48.6" cy="60.6" r="2.8" fill="#fff" />
        <circle cx="76.6" cy="60.6" r="2.8" fill="#fff" />
        <circle cx="44.5" cy="67" r="1.1" fill="#fff" />
        <circle cx="72.5" cy="67" r="1.1" fill="#fff" />
      </g>
      {sad && <SadBits />}
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === "talk" || mood === "wave") return <ellipse cx="60" cy="79" rx="5" ry="4.2" fill="#B5435A" />;
  if (mood === "wow") return <circle cx="60" cy="80" r="3.6" fill="#B5435A" />;
  if (mood === "cheer") return <path d="M50 75 q10 15 20 0 z" fill="#B5435A" stroke={INK} strokeWidth="2" strokeLinejoin="round" />;
  if (mood === "sad") return <path d="M53 83 q7 -7 14 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
  return <path d="M53 77 q7 7 14 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
}

function Body({ color, accent, mood, children }) {
  const leftUp = mood === "cheer";
  const rightUp = mood === "cheer" || mood === "wave";
  return (
    <g>
      {/* feet */}
      <ellipse cx="49" cy="133" rx="8" ry="5" fill={INK} />
      <ellipse cx="71" cy="133" rx="8" ry="5" fill={INK} />
      {/* torso */}
      <path d="M38 132 q-4 -26 8 -36 h28 q12 10 8 36 z" fill={color} />
      {/* arms: down, or up in the air for a cheer / a wave */}
      {leftUp ? <ellipse cx="25" cy="86" rx="6" ry="13" fill={color} transform="rotate(-35 25 86)" /> : <ellipse cx="35" cy="112" rx="6" ry="10" fill={color} transform="rotate(18 35 112)" />}
      {rightUp ? (
        <g className={mood === "wave" ? "buddy-wave-arm" : undefined}>
          <ellipse cx="95" cy="86" rx="6" ry="13" fill={color} transform="rotate(35 95 86)" />
        </g>
      ) : (
        <ellipse cx="85" cy="112" rx="6" ry="10" fill={color} transform="rotate(-18 85 112)" />
      )}
      {accent}
      {children}
    </g>
  );
}

function Head({ skin, children, cheeks = "#FF9DB0" }) {
  return (
    <g>
      <circle cx="60" cy="60" r="38" fill={skin} />
      <ellipse cx="37" cy="74" rx="6" ry="3.6" fill={cheeks} opacity="0.75" />
      <ellipse cx="83" cy="74" rx="6" ry="3.6" fill={cheeks} opacity="0.75" />
      {children}
    </g>
  );
}

const CHARACTERS = {
  nova: ({ mood, hat }) => (
    <>
      {/* hair back */}
      <path d="M20 66 q-4 -46 40 -48 q44 2 40 48 q-2 18 -8 26 l-6 -18 h-52 l-6 18 q-6 -8 -8 -26z" fill="#FF7FB5" />
      <Body mood={mood} color="#B79CFF" accent={<path d="M60 104 l3 6 6 .6 -4.6 4 1.4 6.4 -5.8 -3.4 -5.8 3.4 1.4 -6.4 -4.6 -4 6 -.6z" fill="#FFE27A" />} />
      <Head skin={SKIN.nova}>
        {/* bangs */}
        {!hat && <path d="M24 52 q4 -34 36 -34 q32 0 36 34 q-14 -10 -24 -10 q-4 8 -12 8 q-8 -8 -16 -2 q-8 -4 -20 4z" fill="#FF7FB5" />}
        {hat && <path d="M24 54 q6 -18 20 -20 q8 6 16 4 q10 -6 18 -2 q12 4 18 18 q-14 -6 -24 -6 q-4 6 -12 6 q-8 -6 -16 -2 q-8 -2 -20 2z" fill="#FF7FB5" />}
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {/* headset mic */}
        <path d="M23 64 q2 22 24 20" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="48" cy="84" r="3.2" fill={INK} />
        <circle cx="22.5" cy="62" r="5" fill="#FFE27A" stroke={INK} strokeWidth="2" />
      </Head>
    </>
  ),
  zip: ({ mood, hat }) => (
    <>
      {/* cape */}
      <path d="M40 96 q-14 22 -12 40 h64 q2 -18 -12 -40z" fill="#FF6B6B" />
      <Body mood={mood} color="#5AA9FF" accent={<path d="M62 101 l-7 11 h6 l-3 10 9 -13 h-6 l3 -8z" fill="#FFE27A" />} />
      <Head skin={SKIN.zip}>
        {!hat && <path d="M24 50 q0 -32 36 -32 q36 0 36 32 l-8 -8 -4 8 -8 -12 -6 10 -10 -14 -6 14 -8 -10 -4 12 -8 -8z" fill="#3A2C2A" />}
        {hat && <path d="M24 50 q4 -14 14 -16 l6 8 8 -10 8 10 8 -10 8 10 6 -8 q10 4 14 16 q-36 -8 -72 0z" fill="#3A2C2A" />}
        {/* hero mask */}
        <path d="M30 58 q30 -10 60 0 q2 12 -6 14 q-12 2 -24 -4 q-12 6 -24 4 q-8 -2 -6 -14z" fill="#5AA9FF" />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </Head>
    </>
  ),
  kiko: ({ mood, hat }) => (
    <>
      <Body mood={mood} color="#FFAE57" accent={<><path d="M50 96 q10 10 20 0" fill="none" stroke="#E08A2E" strokeWidth="3" /><rect x="52" y="112" width="16" height="8" rx="3" fill="#E08A2E" /></>} />
      <Head skin={SKIN.kiko} cheeks="#E86F7E">
        {/* curls */}
        <g fill="#24170F">
          <circle cx="26" cy="54" r="8" />
          <circle cx="94" cy="54" r="8" />
          {hat && (
            <>
              <circle cx="34" cy="34" r="10" />
              <circle cx="50" cy="26" r="11" />
              <circle cx="70" cy="26" r="11" />
              <circle cx="86" cy="34" r="10" />
            </>
          )}
        </g>
        {/* beanie */}
        {!hat && (
          <>
            <path d="M22 50 q2 -36 38 -36 q36 0 38 36z" fill="#7FD8B0" />
            <rect x="20" y="44" width="80" height="11" rx="5.5" fill="#5BBE95" />
            <circle cx="60" cy="13" r="7" fill="#FFE27A" />
          </>
        )}
        <g fill="#5C3A26">
          <circle cx="40" cy="70" r="1.2" />
          <circle cx="36" cy="72" r="1.2" />
          <circle cx="80" cy="70" r="1.2" />
          <circle cx="84" cy="72" r="1.2" />
        </g>
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </Head>
    </>
  ),
  bao: ({ mood }) => (
    <>
      <Body mood={mood} color="#FF9DB0" accent={<circle cx="60" cy="114" r="7" fill="#fff" opacity="0.8" />} />
      {/* ears */}
      <circle cx="30" cy="28" r="12" fill={INK} />
      <circle cx="90" cy="28" r="12" fill={INK} />
      <Head skin={SKIN.bao}>
        <circle cx="60" cy="60" r="38" fill="none" stroke="#E9E4F2" strokeWidth="1.5" />
        <ellipse cx="45" cy="64" rx="11" ry="13" fill={INK} transform="rotate(20 45 64)" />
        <ellipse cx="75" cy="64" rx="11" ry="13" fill={INK} transform="rotate(-20 75 64)" />
        {CLOSED_EYES.includes(mood) ? (
          <g fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round">
            <path d="M40 64 q6 -7 12 0" />
            <path d="M68 64 q6 -7 12 0" />
          </g>
        ) : (
          <g className="buddy-eyes">
            <circle cx="46" cy="63" r="4.6" fill="#fff" />
            <circle cx="74" cy="63" r="4.6" fill="#fff" />
            <circle cx="46.8" cy={mood === "sad" ? 65 : 63.6} r="2.6" fill={INK} />
            <circle cx="74.8" cy={mood === "sad" ? 65 : 63.6} r="2.6" fill={INK} />
          </g>
        )}
        {mood === "sad" && <SadBits />}
        <ellipse cx="60" cy="73" rx="4" ry="2.8" fill={INK} />
        <Mouth mood={mood} />
      </Head>
    </>
  ),
};

function Wearable({ id }) {
  switch (id) {
    case "party-hat":
      return (
        <g transform="translate(60 4) rotate(12)">
          <path d="M-14 22 L0 -16 L14 22z" fill="#7CC8FF" />
          <path d="M-9 8 L9 8 M-5 -3 L5 -3" stroke="#FFE27A" strokeWidth="4" />
          <circle cx="0" cy="-17" r="5" fill="#FF7FB5" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M28 36 q2 -24 32 -24 q30 0 32 24z" fill="#FF6B6B" />
          <path d="M78 34 q22 0 28 6 q-14 4 -30 0z" fill="#E04F4F" />
          <circle cx="60" cy="12" r="3" fill="#E04F4F" />
        </g>
      );
    case "flower-crown":
      return (
        <g>
          {[[30, 32, "#FF9DB0"], [42, 24, "#FFE27A"], [54, 21, "#B79CFF"], [66, 21, "#FF9DB0"], [78, 24, "#7FD8B0"], [90, 32, "#FFE27A"]].map(([x, y, c], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="6.5" fill={c} />
              <circle cx={x} cy={y} r="2.4" fill="#fff" />
            </g>
          ))}
        </g>
      );
    case "bunny-ears":
      return (
        <g>
          <ellipse cx="44" cy="6" rx="9" ry="22" fill="#fff" stroke="#E9E4F2" strokeWidth="2" transform="rotate(-12 44 6)" />
          <ellipse cx="44" cy="8" rx="4" ry="15" fill="#FFC2D1" transform="rotate(-12 44 8)" />
          <ellipse cx="76" cy="6" rx="9" ry="22" fill="#fff" stroke="#E9E4F2" strokeWidth="2" transform="rotate(12 76 6)" />
          <ellipse cx="76" cy="8" rx="4" ry="15" fill="#FFC2D1" transform="rotate(12 76 8)" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M36 30 l-2 -20 12 10 14 -16 14 16 12 -10 -2 20z" fill="#FFD23F" stroke="#E0A800" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="60" cy="22" r="3" fill="#FF6B6B" />
        </g>
      );
    case "round-specs":
      return (
        <g fill="none" stroke={INK} strokeWidth="2.6">
          <circle cx="46" cy="63" r="11" />
          <circle cx="74" cy="63" r="11" />
          <path d="M57 62 q3 -3 6 0" />
        </g>
      );
    case "star-shades":
      return (
        <g fill="#FF7FB5" fillOpacity="0.85" stroke={INK} strokeWidth="2">
          {[46, 74].map((x) => (
            <path key={x} transform={`translate(${x} 63)`} d="M0 -13 l3.8 7.8 8.6 1.2 -6.2 6 1.5 8.6 -7.7 -4.1 -7.7 4.1 1.5 -8.6 -6.2 -6 8.6 -1.2z" />
          ))}
          <path d="M55 61 h10" fill="none" />
        </g>
      );
    case "heart-glasses":
      return (
        <g fill="#FF5A7A" fillOpacity="0.85" stroke={INK} strokeWidth="2">
          {[46, 74].map((x) => (
            <path key={x} transform={`translate(${x} 60)`} d="M0 12 C-14 2 -12 -9 -5 -9 C-2 -9 0 -6 0 -4 C0 -6 2 -9 5 -9 C12 -9 14 2 0 12z" />
          ))}
          <path d="M55 59 h10" fill="none" />
        </g>
      );
    case "bow-tie":
      return (
        <g transform="translate(60 99)">
          <path d="M0 0 l-12 -7 v14z M0 0 l12 -7 v14z" fill="#FF6B6B" />
          <circle r="3.4" fill="#E04F4F" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d="M40 94 q20 8 40 0 v8 q-20 8 -40 0z" fill="#7FD8B0" />
          <path d="M68 100 l4 22 h-9 l-2 -20z" fill="#5BBE95" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M22 60 q0 -50 38 -50 q38 0 38 50" fill="none" stroke="#B79CFF" strokeWidth="6" strokeLinecap="round" />
          <rect x="14" y="52" width="13" height="22" rx="6" fill="#B79CFF" stroke={INK} strokeWidth="2" />
          <rect x="93" y="52" width="13" height="22" rx="6" fill="#B79CFF" stroke={INK} strokeWidth="2" />
        </g>
      );
    case "balloon":
      return (
        <g>
          <path d="M88 116 q14 -30 18 -64" fill="none" stroke={INK} strokeWidth="1.5" />
          <path transform="translate(108 40)" d="M0 -14 l4.1 8.4 9.3 1.3 -6.7 6.5 1.6 9.3 -8.3 -4.4 -8.3 4.4 1.6 -9.3 -6.7 -6.5 9.3 -1.3z" fill="#FFD23F" stroke="#E0A800" strokeWidth="1.5" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * <Buddy id="nova" equipped={{hat, face, neck, extra}} mood="happy|talk|wow|happy-closed|cheer|sad|wave" size={96} />
 */
export default function Buddy({ id = "nova", equipped = {}, mood = "happy", size = 96, title }) {
  const Char = CHARACTERS[id] || CHARACTERS.nova;
  const hat = equipped.hat;
  return (
    <svg viewBox="-6 -22 132 162" width={size} height={size * (162 / 132)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {equipped.extra === "headphones" ? null : <Wearable id={equipped.extra} />}
      <Char mood={mood} hat={hat} />
      {equipped.extra === "headphones" && <Wearable id="headphones" />}
      <Wearable id={equipped.neck} />
      <Wearable id={equipped.face} />
      <Wearable id={hat} />
    </svg>
  );
}

/** Just the item, for shop tiles. */
const ITEM_BOX = {
  "party-hat": "40 -18 44 46", cap: "24 6 88 36", "flower-crown": "20 8 80 32", "bunny-ears": "28 -20 64 52", crown: "30 0 60 36",
  "round-specs": "32 49 56 28", "star-shades": "28 46 64 34", "heart-glasses": "28 46 64 32", "bow-tie": "44 88 32 22", scarf: "36 88 48 38",
  headphones: "10 4 100 74", balloon: "84 20 40 100",
};
export function ItemPreview({ id, size = 64 }) {
  return (
    <svg viewBox={ITEM_BOX[id] || "0 0 120 120"} width={size} height={size} aria-hidden="true">
      <Wearable id={id} />
    </svg>
  );
}
