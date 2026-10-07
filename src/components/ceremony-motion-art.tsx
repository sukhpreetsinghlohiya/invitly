import type { CSSProperties } from "react";
import type { CeremonyArtId, CeremonyArtwork } from "@/data/ceremony-art";

type ArtworkPart = { name: string; path: string; origin: string; movement: "sway" | "pendulum" | "flame" | "drum" | "float"; delay?: string };

// The existing artwork stays intact: only these isolated parts move above it.
// Soft mask edges blend the animated texture back into the painted illustration.
// Coordinates use a shared 600×450 canvas and responsive objectBoundingBox masks.
function polygon(points: number[][]) {
  return `${points.map(([x, y], index) => `${index ? "L" : "M"}${x / 600} ${y / 450}`).join(" ")}Z`;
}
function ellipse(x: number, y: number, rx: number, ry: number) {
  return `M${(x - rx) / 600} ${y / 450}a${rx / 600} ${ry / 450} 0 1 0 ${2 * rx / 600} 0a${rx / 600} ${ry / 450} 0 1 0 ${-2 * rx / 600} 0`;
}

const parts: Partial<Record<CeremonyArtId, ArtworkPart[]>> = {
  sangeet: [
    { name: "drum-skin", path: ellipse(167, 212, 56, 112), origin: "28% 47%", movement: "drum" },
    { name: "drum-tassel", path: polygon([[475, 155], [491, 152], [494, 183], [503, 219], [520, 268], [508, 287], [460, 282], [460, 257], [474, 210]]), origin: "80% 35%", movement: "pendulum" },
  ],
  haldi: [
    { name: "marigold-left", path: ellipse(193, 246, 55, 51), origin: "33% 66%", movement: "sway" },
    { name: "marigold-right", path: ellipse(493, 175, 38, 40), origin: "81% 48%", movement: "sway", delay: "-2.5s" },
  ],
  mehndi: [
    { name: "jasmine-left", path: polygon([[99, 291], [126, 293], [154, 313], [168, 359], [161, 386], [122, 383], [99, 348]]), origin: "19% 65%", movement: "pendulum" },
    { name: "jasmine-right", path: polygon([[449, 285], [477, 289], [497, 316], [506, 350], [492, 376], [465, 379], [447, 347]]), origin: "77% 65%", movement: "pendulum", delay: "-1.7s" },
  ],
  wedding: [
    { name: "hanging-flowers", path: polygon([[279, 135], [313, 134], [320, 211], [312, 259], [293, 270], [278, 247]]), origin: "50% 30%", movement: "pendulum" },
  ],
  reception: [
    { name: "flower-vine-left", path: polygon([[183, 112], [204, 107], [206, 153], [197, 211], [179, 211], [181, 169]]), origin: "32% 25%", movement: "pendulum" },
    { name: "flower-vine-right", path: polygon([[382, 103], [405, 101], [417, 139], [425, 181], [416, 194], [399, 170], [390, 140]]), origin: "66% 24%", movement: "pendulum", delay: "-2s" },
  ],
  baraat: [
    { name: "horse-tail", path: polygon([[164, 213], [183, 208], [180, 252], [166, 300], [166, 348], [173, 385], [162, 403], [146, 383], [135, 345], [139, 293], [151, 249]]), origin: "28% 47%", movement: "sway" },
  ],
  birthday: [
    { name: "balloon-rose", path: polygon([[416, 4], [465, 5], [491, 26], [502, 68], [493, 111], [471, 146], [445, 169], [421, 175], [391, 144], [373, 103], [370, 54], [389, 21]]), origin: "71% 39%", movement: "float" },
    { name: "candle-left", path: ellipse(202, 91, 11, 25), origin: "34% 25%", movement: "flame" },
    { name: "candle-centre", path: ellipse(258, 107, 12, 27), origin: "43% 30%", movement: "flame", delay: "-.8s" },
    { name: "candle-right", path: ellipse(312, 86, 12, 26), origin: "52% 25%", movement: "flame", delay: "-1.3s" },
  ],
  "baby-shower": [
    { name: "hanging-star", path: polygon([[148, 323], [159, 342], [181, 345], [165, 361], [170, 382], [148, 373], [130, 385], [132, 361], [116, 347], [139, 341]]), origin: "25% 56%", movement: "pendulum" },
  ],
  housewarming: [
    { name: "welcome-leaves", path: polygon([[524, 245], [547, 245], [573, 258], [589, 297], [583, 336], [545, 329], [529, 300]]), origin: "92% 75%", movement: "sway" },
  ],
  naming: [
    { name: "cradle-garland", path: polygon([[265, 96], [288, 96], [298, 128], [296, 183], [286, 205], [266, 198], [264, 144]]), origin: "47% 22%", movement: "pendulum" },
  ],
  engagement: [
    { name: "ring-garden", path: polygon([[65, 45], [113, 28], [153, 38], [157, 79], [149, 122], [121, 167], [89, 175], [64, 139], [54, 98]]), origin: "21% 40%", movement: "sway" },
  ],
  anniversary: [
    { name: "anniversary-leaves", path: polygon([[188, 12], [244, 6], [273, 23], [263, 57], [229, 85], [191, 97], [172, 71]]), origin: "32% 24%", movement: "sway" },
  ],
  other: [
    { name: "garden-leaves", path: polygon([[166, 25], [226, 13], [260, 28], [255, 76], [230, 100], [180, 106], [157, 72]]), origin: "35% 27%", movement: "sway" },
  ],
};

export function ceremonyParts(id: CeremonyArtId) { return parts[id] || []; }

function Petals({ warm = false }: { warm?: boolean }) {
  return <g className={`ceremony-petals${warm ? " ceremony-petals-warm" : ""}`}>
    {[{ x: 99, y: 85, delay: "-.9s" }, { x: 478, y: 81, delay: "-3.4s" }, { x: 361, y: 49, delay: "-5.7s" }].map(({ x, y, delay }, index) => <g key={index} transform={`translate(${x} ${y})`}>
      <g className="ceremony-petal" data-art-layer="falling-petal" style={{ animationDelay: delay }}><path d="M0 0C-8-6-12 0-8 7C-5 12 3 14 7 9C8 5 4 1 0 0Z" fill={warm ? "#e9af39" : "#d39585"} /><path d="M-7 2Q0 6 4 9" fill="none" stroke={warm ? "#ffda73" : "#f2cfb9"} strokeWidth="1" /></g>
    </g>)}
  </g>;
}

function Sparkle({ x, y, delay = "0s" }: { x: number; y: number; delay?: string }) {
  return <g transform={`translate(${x} ${y})`}><g data-art-layer="metal-glint" className="ceremony-glint" style={{ animationDelay: delay }}><path d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z" fill="#fff3c5" /><circle r="2" fill="#fffdf2" /></g></g>;
}

function DholPerformance({ id }: { id: string }) {
  return <>
    <defs><linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ebc983" /><stop offset=".4" stopColor="#ae692d" /><stop offset=".7" stopColor="#dfad5a" /><stop offset="1" stopColor="#865025" /></linearGradient></defs>
    <g className="ceremony-drum-ripple" data-art-layer="drum-resonance" fill="none" stroke="#f9d78c" strokeWidth="2.5"><ellipse cx="162" cy="211" rx="41" ry="85" /><ellipse cx="162" cy="211" rx="29" ry="63" opacity=".65" /></g>
    <g className="ceremony-stick ceremony-stick-high" data-art-layer="drum-stick-high" strokeLinecap="round">
      <path d="M64 104Q98 136 145 180" fill="none" stroke="#72411e" strokeWidth="11" /><path d="M64 104Q98 136 145 180" fill="none" stroke={`url(#${id}-wood)`} strokeWidth="8" /><path d="M65 102L105 141" stroke="#f4d89c" strokeWidth="2" opacity=".8" /><ellipse cx="146" cy="181" rx="7" ry="9" transform="rotate(-40 146 181)" fill="#e8c380" stroke="#855829" strokeWidth="1.5" />
    </g>
    <g className="ceremony-stick ceremony-stick-low" data-art-layer="drum-stick-low" fill="none" strokeLinecap="round">
      <path d="M58 303Q77 316 94 300L139 251" stroke="#72411e" strokeWidth="9" /><path d="M58 303Q77 316 94 300L139 251" stroke={`url(#${id}-wood)`} strokeWidth="6" /><path d="M61 303Q78 312 92 298" stroke="#f2d494" strokeWidth="1.5" />
    </g>
    <g className="ceremony-beat-mark" data-art-layer="drum-beat" stroke="#d0a452" strokeWidth="2.5" strokeLinecap="round" fill="none"><path d="m90 183-13-8m8 32-15-1m21 28-13 8" /></g>
  </>;
}

/** Layered native SVG, animated by CSS only while the shared viewport observer activates it. */
export function CeremonyMotionArt({ art, id }: { art: CeremonyArtwork; id: string }) {
  // Original masks are registered to the older paintings. New watercolors use
  // ambient accents so no displaced fragments are painted over their subjects.
  const layers = art.motion === "ambient" ? [] : ceremonyParts(art.id);
  if (art.id === "remembrance") return null;
  return <svg className="ceremony-motion-art" viewBox="0 0 600 450" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <filter id={`${id}-soft-edge`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".004" /></filter>
      {layers.map(layer => <mask key={layer.name} id={`${id}-${layer.name}`} x="0" y="0" width="1" height="1" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox"><path d={layer.path} fill="white" filter={`url(#${id}-soft-edge)`} /></mask>)}
    </defs>
    {layers.map(layer => <g key={layer.name} className={`ceremony-part ceremony-part-${layer.movement}`} data-art-layer={layer.name} style={{ transformOrigin: layer.origin, animationDelay: layer.delay } as CSSProperties}>
      <image href={art.src} x="0" y="0" width="600" height="450" preserveAspectRatio="none" mask={`url(#${id}-${layer.name})`} />
    </g>)}
    {art.id === "sangeet" && <DholPerformance id={id} />}
    {art.id === "haldi" && <><Petals warm /><Sparkle x={319} y={180} delay="-1s" /><Sparkle x={405} y={270} delay="-4s" /></>}
    {art.id === "mehndi" && <><Sparkle x={351} y={149} /><Sparkle x={260} y={314} delay="-3s" /></>}
    {(art.id === "wedding" || art.id === "reception" || art.id === "baraat") && <Petals warm={art.id === "wedding"} />}
    {(art.id === "engagement" || art.id === "anniversary") && <><Sparkle x={330} y={203} /><Sparkle x={233} y={301} delay="-3.7s" /></>}
    {art.id === "housewarming" && <Petals warm />}
    {art.id === "birthday" && <Petals />}
    {art.id === "baby-shower" && <><Sparkle x={337} y={113} /><Sparkle x={448} y={162} delay="-2.7s" /></>}
    {(art.id === "naming" || art.id === "other") && <Petals />}
  </svg>;
}
