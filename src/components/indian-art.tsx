import type { OccasionId } from "@/types/invitation";
import "./indian-art.css";

function Marigold({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cy="-6" rx="4" ry="8" fill={i % 2 ? "#e4a326" : "#dc7926"} transform={`rotate(${i * 45})`} />)}<circle r="6" fill="#f3c04d" /><circle r="2.5" fill="#b86526" /></g>;
}

export function MarigoldToran({ className = "" }: { className?: string }) {
  return <svg className={`indian-toran ${className}`} viewBox="0 0 800 120" fill="none" aria-hidden="true"><path d="M-10 15Q100 125 200 15Q300 125 400 15Q500 125 600 15Q700 125 810 15" stroke="#798453" strokeWidth="3" />{Array.from({ length: 41 }, (_, i) => { const x = i * 20, t = (x % 200) / 200, y = 15 + 220 * t * (1-t); return <Marigold key={i} x={x} y={y} size={.72} />; })}{[0,200,400,600,800].map(x => <g key={x}><path d={`M${x} 14v76`} stroke="#b59a5b" strokeWidth="2" />{[23,40,57,74].map(y => <Marigold key={y} x={x} y={y} size={.6} />)}<path d={`M${x} 84q-10 18 0 29q10-11 0-29`} fill="#69805c" /></g>)}</svg>;
}

export function PavilionArt() {
  return <g stroke="#9c6a38" strokeWidth="1.5" strokeLinejoin="round"><path d="M45 143V63h150v80" fill="#f1dbad" /><path d="M34 64q18-6 26-21h120q8 15 26 21Z" fill="#c88a56" /><path d="M73 42q5-15 23-16q5-13 24-18q19 5 24 18q18 1 23 16Z" fill="#edc88f" /><path d="M67 142V85q0-13 13-13q13 0 13 13v57M147 142V85q0-13 13-13q13 0 13 13v57" fill="#faf2de" /><path d="M101 142V82q0-9 9-13q0-9 10-14q10 5 10 14q9 4 9 13v60" fill="#733a38" /><path d="M40 143h160v7H40zM35 151h170M63 66v75M96 65v77M144 65v77M177 66v75" fill="#d8b277" /><path d="M66 103h25m-25 6h25m58-6h25m-25 6h25" strokeWidth=".7" /><g fill="#73835b"><path d="M22 145q-20-26-4-47q14 18 4 47M22 145q19-30 30-11q-9 16-30 11M219 145q20-26 4-47q-14 18-4 47M219 145q-19-30-30-11q9 16 30 11" /></g><Marigold x={54} y={65} size={.55} /><Marigold x={186} y={65} size={.55} /></g>;
}

export function DholArt() {
  return <g transform="rotate(-12 120 90)" stroke="#925a34" strokeWidth="2"><path d="M66 66Q120 34 174 66V121Q120 153 66 121Z" fill="#b25437" /><ellipse cx="66" cy="94" rx="17" ry="31" fill="#f2d6a0" /><ellipse cx="174" cy="94" rx="17" ry="31" fill="#f5dfb7" /><ellipse cx="174" cy="94" rx="11" ry="24" fill="none" /><path d="m68 66 22 62 22-76 23 85 20-82 20 66M69 120l21-62 23 80 22-87 20 80 18-65" fill="none" stroke="#eed7a8" /><path d="m39 38 28 35m120-33-17 27" strokeWidth="5" strokeLinecap="round" /><path d="M74 56q45-45 87 0" fill="none" stroke="#b58e45" strokeWidth="4" /><Marigold x={87} y={144} size={.7} /><Marigold x={157} y={145} size={.7} /></g>;
}

export function PeacockArt() {
  return <g stroke="#58715a" strokeWidth="1.3"><g transform="translate(109 101)">{[-65,-40,-15,10,35,60].map(angle => <g key={angle} transform={`rotate(${angle})`}><ellipse cy="-36" rx="19" ry="48" fill="#adc29d" /><ellipse cy="-62" rx="8" ry="12" fill="#c5a562" /><ellipse cy="-64" rx="4" ry="7" fill="#436d77" /></g>)}</g><path d="M72 127q40 25 67-7q11-13 4-32q-9-24 7-34q13-9 17 1q2 8-8 9q-6 5 0 16q28 44-8 67q-41 26-79-20Z" fill="#4d7b7b" /><path d="M81 122q39-31 58 4q-28 24-58-4Z" fill="#708f69" /><path d="m151 46-4-12m10 10 2-13m3 15 8-9m-53 112-3 12m17-13 6 11" /><circle cx="159" cy="55" r="2" fill="#faf1da" /><path d="m166 56 9 5-10 1" fill="#c29b4c" /></g>;
}

function Wreath() {
  return <g fill="none" stroke="#82916a" strokeWidth="1.5"><path d="M93 149C5 120 47 35 91 33M147 149c88-29 46-114 2-116" />{[false,true].map(flip => <g key={String(flip)} transform={flip ? "translate(240 0) scale(-1 1)" : undefined}><path d="M62 119q-23-2-20-20q22-1 20 20M53 92q-25-7-15-24q21 6 15 24M61 65q-20-17-3-29q17 14 3 29M76 44q-12-25 9-29q9 18-9 29" fill="#a4b293" /><path d="M66 125q17-19 26-4q-11 14-26 4M56 101q14-18 23-4q-9 14-23 4M59 77q21-9 24 6q-16 10-24-6" fill="#c4cdac" /></g>)}</g>;
}

/** Occasion-specific original clipart. Decorative, removable, and free of sacred symbols. */
export function OccasionIllustration({ occasion = "wedding", className = "", motif }: { occasion?: OccasionId; className?: string; motif?: "dhol" | "peacock" }) {
  let art;
  if (motif === "dhol") art = <DholArt />;
  else if (motif === "peacock") art = <PeacockArt />;
  else if (occasion === "wedding") art = <PavilionArt />;
  else if (occasion === "birthday") art = <><path d="M51 82q-16 19 0 40m141-66q-18 38 1 68" fill="none" stroke="#9b7b5f" /><ellipse cx="49" cy="56" rx="23" ry="31" fill="#c47571" /><ellipse cx="191" cy="35" rx="19" ry="26" fill="#dca841" /><path d="M68 150v-49q52-14 104 0v49Z" fill="#deac8f" stroke="#966143" /><path d="M68 101q8 17 16 0q8 17 16 0q8 17 16 0q8 17 16 0q8 17 16 0q8 17 24 0" fill="#fff2dc" stroke="#966143" /><path d="M93 96V77m27 19V68m27 28V77" stroke="#7a936e" strokeWidth="5" />{[93,120,147].map((x,i)=><path key={x} d={`M${x} ${i===1?63:72}q-8-6 0-14q8 8 0 14`} fill="#d9a138" />)}<path d="M56 154h128" stroke="#966143" strokeWidth="3" /></>;
  else if (occasion === "engagement" || occasion === "anniversary") art = <><Wreath /><g fill="none" stroke="#b88b38" strokeWidth="5"><circle cx="104" cy="96" r="30" /><circle cx="138" cy="96" r="30" /></g><path d="m95 62 9-12 10 12-10 12Z" fill="#f5e7c2" stroke="#b88b38" strokeWidth="2" />{occasion === "anniversary" && <><Marigold x={78} y={136} size={.8} /><Marigold x={159} y={137} size={.8} /><path d="M115 28q5-12 10 0q12-6 10 5l-15 13-15-13q-2-11 10-5" fill="#b96e68" /></>}</>;
  else if (occasion === "baby-shower") art = <><path d="M146 15a51 51 0 1 0 31 83a44 44 0 0 1-31-83" fill="#e2bf78" /><path d="M46 127q-12-25 15-33q0-28 31-21q12-31 39-13q21-8 29 15q35-5 34 22q30 14 11 34Z" fill="#f1e6d4" stroke="#c5ad8e" strokeWidth="2" /><path d="m182 27 4 10 11 2-9 7 2 11-9-6-10 6 2-11-8-7 11-2ZM38 56l3 8 9 2-7 5 1 9-7-5-7 5 1-9-7-5 9-2Z" fill="#cfa554" /><path d="M75 102q5 8 10 0m47 0q5 8 10 0m-42 13q9 9 18 0" fill="none" stroke="#b0896e" strokeWidth="2" /></>;
  else if (occasion === "housewarming") art = <><path d="M58 147V72l62-44 62 44v75Z" fill="#eed4ac" stroke="#9e754a" strokeWidth="2" /><path d="m45 76 75-56 75 56" fill="none" stroke="#a75842" strokeWidth="9" strokeLinejoin="round" /><path d="M102 147V104a18 18 0 0 1 36 0v43" fill="#6d866f" stroke="#53694f" /><path d="M69 86h20v26H69zm83 0h19v26h-19z" fill="#f8efda" stroke="#9e754a" /><circle cx="128" cy="121" r="2.5" fill="#e7bd6f" /><path d="M35 149v-23m0 10q-21-10-10-23q17 8 10 23m0-8q19-22 23-4q-7 14-23 4m175 21v-33m0 12q-23-12-10-26q14 7 10 26m0-5q17-23 23-8q-4 18-23 8" fill="#7b8f67" stroke="#53694f" /><Marigold x={96} y={78} size={.55} /><Marigold x={120} y={82} size={.55} /><Marigold x={144} y={78} size={.55} /></>;
  else if (occasion === "naming") art = <><path d="M60 121q60 30 120 0l-13-58H73Z" fill="#e8d0ab" stroke="#a57a52" strokeWidth="2" /><path d="M74 63q46-62 92 0" fill="#f6e7d4" stroke="#a57a52" strokeWidth="2" /><path d="M72 118V75m19 50V73m19 57V73m20 57V73m19 52V73m19 45V75M57 141q63 27 126 0m-94-9-7 15m69-15 7 15" fill="none" stroke="#a57a52" strokeWidth="3" /><path d="M121 25v25m-3 1-6 9 8 7 9-7-6-9" fill="#bf9560" stroke="#a57a52" /><Marigold x={53} y={67} size={.7} /><Marigold x={187} y={67} size={.7} /></>;
  else if (occasion === "remembrance") art = <><Wreath /><path d="M105 134V80h30v54Z" fill="#f5ead8" stroke="#b4a58b" /><path d="M120 75q-18-18 0-42q18 24 0 42" fill="#c5ad78" /><path d="M96 138h48" stroke="#a09276" strokeWidth="2" /></>;
  else art = <><Marigold x={120} y={81} size={3} /><g fill="#849369"><path d="M109 143q-41-13-30-41q32 8 30 41M132 143q41-13 30-41q-32 8-30 41" /></g></>;
  return <svg className={`occasion-illustration ${className}`} viewBox="0 0 240 170" fill="none" aria-hidden="true" data-occasion-art={occasion}>{art}</svg>;
}
