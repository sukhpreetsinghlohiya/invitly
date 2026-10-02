import { useId } from "react";
import styles from "./signature-cover.module.css";

function Rosette({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {Array.from({ length: 8 }, (_, i) => <path key={i} d="M0-3C-8-9-6-17 0-20C6-17 8-9 0-3Z" transform={`rotate(${i * 45})`} fill="#bc954f" stroke="#ebd19a" strokeWidth=".7" />)}
    <circle r="4" fill="#71383a" stroke="#ebd19a" />
  </g>;
}

function DoorLeaf({ side, lantern }: { side: "left" | "right"; lantern: boolean }) {
  const id = useId().replaceAll(":", "");
  const mirror = side === "right";
  return <div className={`${styles.leaf} ${mirror ? styles.rightLeaf : styles.leftLeaf}`}>
    <svg viewBox="0 0 200 640" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-wood`} x2="1" y2="0"><stop stopColor={lantern ? "#092f2c" : "#51212d"} /><stop offset=".5" stopColor={lantern ? "#18534a" : "#823b46"} /><stop offset="1" stopColor={lantern ? "#103c37" : "#5e2530"} /></linearGradient>
        <pattern id={`${id}-jaali`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M16 0 20 12 32 16 20 20 16 32 12 20 0 16 12 12Z" fill="none" stroke="#b89a64" strokeWidth=".8" /><path d="m16 9 7 7-7 7-7-7Z" fill="#d6b76c" opacity=".3" /><circle cx="16" cy="16" r="1.4" fill="#e4ce9b" /></pattern>
      </defs>
      <g transform={mirror ? "translate(200 0) scale(-1 1)" : undefined}>
        <path d="M0 0H200V640H0Z" fill={`url(#${id}-wood)`} />
        <path d="M8 8H192V632H8Z" fill="none" stroke="#bd9755" strokeWidth="2" /><path d="M13 14H187V626H13Z" fill="none" stroke="#bd9755" strokeWidth=".6" />
        <path d="M23 289V115Q23 73 63 59Q91 48 100 29Q109 48 137 59Q177 73 177 115V289Z" fill={lantern ? "#142e2b" : "#46202a"} stroke="#c5a164" strokeWidth="2" />
        <path d="M30 281V115Q30 79 67 65Q93 55 100 41Q109 56 134 66Q170 80 170 115V281Z" fill={`url(#${id}-jaali)`} stroke="#c5a164" strokeWidth=".8" />
        <rect x="23" y="351" width="154" height="260" rx="3" fill="none" stroke="#c5a164" strokeWidth="2" />
        <rect x="30" y="358" width="140" height="246" fill={lantern ? `url(#${id}-jaali)` : "#57242e"} stroke="#c5a164" strokeWidth=".7" />
        {!lantern && <g fill="none" stroke="#c5a164" strokeWidth="1.2"><path d="M100 585V414M100 552C46 552 49 504 71 488C89 504 93 530 100 552ZM100 520C147 518 152 475 130 457C110 470 106 496 100 520ZM100 478C59 473 63 436 78 425C91 440 94 459 100 478Z" /><path d="M100 418C70 395 79 377 100 369C121 377 130 395 100 418Z" fill="#bd9755" /><path d="M60 584h80M70 591h60" /><Rosette x={53} y={384} size={.4} /><Rosette x={147} y={384} size={.4} /></g>}
        <path d="M15 308H185M15 332H185" stroke="#ba965a" strokeWidth="1.2" />
        {[34, 70, 106].map(x => <g key={x}><circle cx={x} cy="320" r="4" fill="#ad8042" stroke="#e2c384" /><circle cx={x - .8} cy="319" r="1.2" fill="#fae1ac" /></g>)}
        <Rosette x={162} y={315} size={.63} /><g className={styles.knocker}><circle cx="162" cy="338" r="13" fill="none" stroke="#5a412d" strokeWidth="5" /><circle cx="162" cy="337" r="13" fill="none" stroke="#d4b573" strokeWidth="3" /><path d="M151 332Q154 324 163 324" fill="none" stroke="#f3dda3" strokeWidth="1.4" /></g>
      </g>
    </svg>
  </div>;
}

/** Original carved panels: a floral courtyard door and a geometric lantern door. */
export function SignatureDoors({ lantern = false }: { lantern?: boolean }) {
  return <>
    <div className={styles.leaves}><DoorLeaf side="left" lantern={lantern} /><DoorLeaf side="right" lantern={lantern} /></div>
    {!lantern && <svg className={styles.stoneFrame} viewBox="0 0 400 640" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0H400V640H0ZM21 623V185Q6 153 31 136Q22 104 55 93Q51 63 88 57Q99 25 133 36Q156 9 183 26Q192 8 200 7Q208 8 217 26Q244 9 267 36Q301 25 312 57Q349 63 345 93Q378 104 369 136Q394 153 379 185V623Z" fillRule="evenodd" fill="#d7b784" />
      <path d="M21 623V185Q6 153 31 136Q22 104 55 93Q51 63 88 57Q99 25 133 36Q156 9 183 26Q192 8 200 7Q208 8 217 26Q244 9 267 36Q301 25 312 57Q349 63 345 93Q378 104 369 136Q394 153 379 185V623" fill="none" stroke="#926c38" strokeWidth="7" /><path d="M21 623V185Q6 153 31 136Q22 104 55 93Q51 63 88 57Q99 25 133 36Q156 9 183 26Q192 8 200 7Q208 8 217 26Q244 9 267 36Q301 25 312 57Q349 63 345 93Q378 104 369 136Q394 153 379 185V623" fill="none" stroke="#f2d7a2" strokeWidth="2" />
      {[215, 274, 333, 392, 451, 510, 569].map(y => <g key={y} fill="none" stroke="#9c7746" strokeWidth=".8"><path d={`M0 ${y}H15M385 ${y}H400`} /><path d={`M5 ${y + 7}v44M395 ${y + 7}v44`} /></g>)}
      <path d="M0 628H400V640H0Z" fill="#b08b54" /><path d="M0 631H400M0 635H400" stroke="#edd2a1" strokeWidth="1" />
    </svg>}
  </>;
}
