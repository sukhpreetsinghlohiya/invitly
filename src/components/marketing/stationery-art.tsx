import { useId } from "react";
import "./stationery-art.css";

export type StationeryVariant = "wedding" | "engagement" | "birthday" | "baby-shower" | "mehndi";
export type StationeryCardProps = {
  variant: StationeryVariant;
  className?: string;
  names?: readonly string[];
  eyebrow?: string;
  date?: string;
  location?: string;
  ageLabel?: string;
};

const sampleCopy: Record<StationeryVariant, { names: readonly string[]; eyebrow: string; date: string; location: string }> = {
  wedding: { names: ["Aanya", "Kabir"], eyebrow: "Together with our families", date: "14 · FEBRUARY · 2027", location: "JAIPUR, RAJASTHAN" },
  engagement: { names: ["Meher", "Arjun"], eyebrow: "A promise to grow together", date: "12 · FEBRUARY · 2027", location: "AN ENGAGEMENT CELEBRATION" },
  birthday: { names: ["Arjun"], eyebrow: "A little wonder. A whole lot of joy.", date: "21 · FEBRUARY · 2027", location: "COME CELEBRATE WITH US" },
  "baby-shower": { names: ["Riya", "Aman"], eyebrow: "You are warmly invited", date: "28 · FEBRUARY · 2027", location: "A BABY SHOWER" },
  mehndi: { names: ["Aanya", "Kabir"], eyebrow: "An evening in bloom", date: "12 · FEBRUARY · 2027", location: "COLOUR, MUSIC & OUR FAVOURITE PEOPLE" },
};

/** Original block-print motifs. Shared definitions keep repeated borders lightweight. */
function PrintDefinitions({ id, variant }: { id: string; variant: StationeryVariant }) {
  return <defs>
    <g id={`${id}-flower`}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M0-2C-7-6-8-15-3-18C1-21 7-16 6-12C9-9 5-3 0-2Z" transform={`rotate(${angle})`} fill="var(--stationery-flower)" stroke="var(--stationery-ink)" strokeWidth=".65" />)}
      <circle r="6" fill="var(--stationery-paper)" stroke="var(--stationery-ink)" strokeWidth=".8" />
      <circle r="2.2" fill="var(--stationery-ink)" />
      {[0, 90, 180, 270].map(angle => <path key={angle} d="M0-8v-5" transform={`rotate(${angle})`} stroke="var(--stationery-ink)" strokeWidth=".7" />)}
    </g>
    <g id={`${id}-sprig`} fill="none" stroke="var(--stationery-leaf)" strokeWidth="1.05" strokeLinecap="round">
      <path d="M0 76C-8 53 9 36 0 2M-1 56C-16 47-13 38-20 31M2 35C15 27 11 14 21 7" />
      <path d="M-2 61C-19 61-22 48-19 43C-8 43-3 53-2 61ZM0 47C16 45 21 37 18 31C8 32 1 39 0 47ZM1 25C-14 25-21 17-17 10C-6 10 0 18 1 25ZM-1 72C8 59 18 62 21 67C16 75 7 77-1 72Z" fill="var(--stationery-leaf)" />
      <path d="m-4 58-10-10m17-5 11-8m-15-13-11-8m13 57 13-3" stroke="var(--stationery-paper)" strokeWidth=".7" />
      <use href={`#${id}-flower`} transform="translate(-19 26) scale(.43)" />
      <use href={`#${id}-flower`} transform="translate(22 3) scale(.45)" />
      <use href={`#${id}-flower`} transform="translate(0 -5) scale(.63)" />
    </g>
    {variant === "mehndi" && <g id={`${id}-paisley`} stroke="var(--stationery-ink)" strokeWidth="1.1" fill="none">
      <path d="M-5 43C-37 27-28-6-6-22C6-31 13-42 10-56C44-30 52 3 35 30C26 47 7 51-5 43Z" fill="var(--stationery-wash)" />
      <path d="M-3 36C-24 22-19-1-2-15C13-29 18-32 17-41C36-17 41 4 28 23C19 38 6 42-3 36Z" />
      <path d="M-4 23C-14 13-6-2 7-3C22-3 27 12 16 20C8 24 0 20 3 12C5 8 10 10 8 13" strokeWidth="1.5" />
      <path d="M-24 13l6-1m-3-11 6 2m-1-12 5 4m2-13 3 5m7-15 3 5m24 31-6 1m3 11-6-2m0 11-5-4m-4 11-3-5m-6 10-1-6m-9 4 1-6" strokeWidth=".9" />
      <use href={`#${id}-flower`} transform="translate(11 -16) scale(.37)" />
      <circle cx="14" cy="-31" r="2" fill="var(--stationery-ink)" />
    </g>}
    {variant === "engagement" && <g id={`${id}-peacock`} stroke="var(--stationery-leaf)" strokeWidth=".95" strokeLinejoin="round">
      <g transform="translate(-10 7)">{[-72, -47, -22, 3, 28].map(angle => <g key={angle} transform={`rotate(${angle})`}>
        <path d="M0 7C-15-14-13-44 0-49C13-44 15-14 0 7Z" fill="var(--stationery-wash)" />
        <path d="M0 6V-43" fill="none" /><ellipse cy="-33" rx="5" ry="9" fill="var(--stationery-flower)" /><ellipse cy="-34" rx="2.4" ry="4.5" fill="var(--stationery-leaf)" />
      </g>)}</g>
      <path d="M-15 6C4 23 24 10 23-4C22-20 15-39 25-48C31-55 39-52 40-46C41-40 35-39 33-41C30-34 36-25 40-16C51 7 36 27 16 29C2 31-8 19-15 6Z" fill="var(--stationery-leaf)" />
      <path d="M-8 9C9-9 27 0 24 14C14 26 1 22-8 9Z" fill="var(--stationery-wash)" />
      <path d="M-5 9q14-5 23 5M0 15q8-3 15 4" fill="none" /><circle cx="35" cy="-47" r="1.8" fill="var(--stationery-paper)" />
      <path d="m41-44 7 3-7 2" fill="var(--stationery-flower)" stroke="none" /><path d="M27-54v-8m5 8 4-7m-12 9-4-6M8 29l-3 10m16-12 5 12M1 39h8m12 0h9" fill="none" />
      <g fill="var(--stationery-flower)"><circle cx="27" cy="-63" r="2.1" /><circle cx="37" cy="-62" r="2.1" /><circle cx="19" cy="-59" r="2.1" /></g>
    </g>}
    {variant === "baby-shower" && <g id={`${id}-elephant`} stroke="var(--stationery-leaf)" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-53-7C-72-11-72 12-78 10" fill="none" strokeWidth="2" /><path d="m-78 7-4 7" strokeWidth="4" />
      <path d="M-58 1C-64-22-46-49-20-50C11-52 38-44 47-22C56-33 72-28 76-12L78 12C79 24 91 25 94 16C99 27 85 38 72 30C60 27 55 19 56 8L46 8L43 39H24L22 11H-17L-21 39H-41L-45 4Z" fill="var(--stationery-elephant,#b7c6b0)" />
      <path d="M-28-45Q1-56 30-39L27-8Q-1 6-29-12Z" fill="var(--stationery-paper)" /><path d="M-22-43Q0-50 24-37L23-13Q0-3-24-15Z" fill="var(--stationery-wash)" />
      <path d="M-25-10v6m9-2v6m9-5v6m10-6v6m10-8v6m9-10v5" stroke="var(--stationery-flower)" strokeWidth="2.5" />
      <use href={`#${id}-flower`} transform="translate(1 -28) scale(.52)" />
      <path d="M47-21C27-43 9-30 11-12C13 3 26 13 35 10C49 7 51-9 47-21Z" fill="var(--stationery-flower)" /><path d="M41-18C28-32 20-22 21-10C23-2 29 3 36 4" fill="none" stroke="var(--stationery-paper)" />
      <path d="M54-12q4-5 9-1M64-3q5 4 9 2M25 34h18m-82 0h18" fill="none" /><circle cx="61" cy="-11" r="1.6" fill="var(--stationery-ink)" /><path d="M-17 11Q1 15 22 11" fill="none" />
    </g>}
  </defs>;
}

function PrintedBorder({ variant, id }: { variant: StationeryVariant; id: string }) {
  if (variant === "wedding") return <>
    <rect x="9" y="9" width="282" height="402" stroke="var(--stationery-ink)" strokeWidth=".65" />
    <rect x="15" y="15" width="270" height="390" stroke="var(--stationery-ink)" strokeWidth=".7" strokeDasharray="1.5 3" />
    <path d="M54 82V59Q54 48 66 48H234Q246 48 246 59V361Q246 373 234 373H66Q54 373 54 361Z" stroke="var(--stationery-ink)" strokeWidth=".8" />
    {[43, 117, 191, 265, 339].map(y => <g key={y}>
      <use href={`#${id}-sprig`} transform={`translate(32 ${y}) scale(.5 .77)`} />
      <use href={`#${id}-sprig`} transform={`translate(268 ${420 - y}) rotate(180) scale(.5 .77)`} />
    </g>)}
    {[69, 110, 151, 192, 233].map((x, index) => <g key={x}>
      <use href={`#${id}-flower`} transform={`translate(${x} 29) scale(${index % 2 ? .36 : .5})`} />
      <use href={`#${id}-flower`} transform={`translate(${x} 390) scale(${index % 2 ? .36 : .5})`} />
    </g>)}
    <use href={`#${id}-flower`} transform="translate(150 73) scale(.54)" />
    <path d="M117 74h17m32 0h17" stroke="var(--stationery-ink)" strokeWidth=".6" />
  </>;
  if (variant === "mehndi") return <>
    <rect x="11" y="11" width="278" height="398" stroke="var(--stationery-ink)" strokeWidth=".8" />
    <rect x="18" y="18" width="264" height="384" stroke="var(--stationery-ink)" strokeWidth=".7" strokeDasharray="2 4" />
    <path d="M64 302V138C64 106 89 80 114 74C131 70 139 52 150 46C161 52 169 70 186 74C211 80 236 106 236 138V302Q150 340 64 302Z" stroke="var(--stationery-ink)" strokeWidth="1" />
    <path d="M71 298V139C71 111 93 87 117 81C135 76 139 65 150 58C161 65 165 76 183 81C207 87 229 111 229 139V298Q150 330 71 298Z" stroke="var(--stationery-ink)" strokeWidth=".5" />
    {[82, 158, 234, 310, 386].map(y => <g key={y}>
      <use href={`#${id}-paisley`} transform={`translate(37 ${y}) scale(.4)`} />
      <use href={`#${id}-paisley`} transform={`translate(263 ${420 - y}) rotate(180) scale(.4)`} />
    </g>)}
    {[83, 127, 173, 217].map(x => <g key={x}><use href={`#${id}-flower`} transform={`translate(${x} 31) scale(.29)`} /><use href={`#${id}-flower`} transform={`translate(${x} 388) scale(.29)`} /></g>)}
    <use href={`#${id}-paisley`} transform="translate(141 107) scale(.42)" />
    <use href={`#${id}-flower`} transform="translate(150 302) scale(.3)" />
  </>;
  if (variant === "birthday") return <>
    <rect x="13" y="13" width="274" height="394" stroke="var(--stationery-ink)" strokeWidth="1" />
    <rect x="20" y="20" width="260" height="380" stroke="var(--stationery-ink)" strokeWidth=".5" />
    {[55, 155, 255].map(y => <g key={y}>
      <use href={`#${id}-sprig`} transform={`translate(43 ${y}) scale(.65 1.15)`} />
      <use href={`#${id}-sprig`} transform={`translate(257 ${420 - y}) rotate(180) scale(.65 1.15)`} />
    </g>)}
    <use href={`#${id}-flower`} transform="translate(150 57) scale(.63)" />
    <path d="M92 59h33m50 0h33" stroke="var(--stationery-ink)" strokeWidth=".65" />
    {[85, 113, 141, 169, 197, 225].map(x => <path key={x} d={`M${x} 385q5-10 10 0q-5 10-10 0Z`} fill="var(--stationery-flower)" />)}
  </>;
  if (variant === "engagement") return <>
    <path d="M21 399V116C21 60 66 21 150 21C234 21 279 60 279 116V399Z" fill="var(--stationery-wash)" stroke="var(--stationery-leaf)" strokeWidth=".8" />
    <path d="M29 392V118C29 68 71 29 150 29C229 29 271 68 271 118V392Z" stroke="var(--stationery-leaf)" strokeWidth=".5" />
    {[81, 162, 243].map(y => <g key={y}><use href={`#${id}-sprig`} transform={`translate(37 ${y}) scale(.43 .8)`} /><use href={`#${id}-sprig`} transform={`translate(263 ${y}) scale(-.43 .8)`} /></g>)}
    <use href={`#${id}-flower`} transform="translate(150 53) scale(.6)" />
    <use href={`#${id}-peacock`} transform="translate(94 317) scale(.82)" />
    <use href={`#${id}-peacock`} transform="translate(206 317) scale(-.82 .82)" />
    <use href={`#${id}-flower`} transform="translate(150 347) scale(.35)" />
  </>;
  return <>
    <path d="M18 18H282V402H18Z" stroke="var(--stationery-leaf)" strokeWidth=".6" />
    <path d="M24 24H276V396H24Z" stroke="var(--stationery-leaf)" strokeWidth=".6" strokeDasharray="2 3" />
    <path d="M47 272V108C47 69 86 43 150 43C214 43 253 69 253 108V272" stroke="var(--stationery-leaf)" strokeWidth=".8" />
    <use href={`#${id}-sprig`} transform="translate(49 287) scale(.66)" />
    <use href={`#${id}-sprig`} transform="translate(252 287) scale(-.66 .66)" />
    <use href={`#${id}-sprig`} transform="translate(73 304) rotate(-20) scale(.48)" />
    <use href={`#${id}-sprig`} transform="translate(231 304) rotate(20) scale(-.48 .48)" />
    <use href={`#${id}-elephant`} transform="translate(142 306) scale(.92)" />
    <use href={`#${id}-flower`} transform="translate(150 64) scale(.46)" />
    {[42, 83, 124, 165, 206, 247].map(x => <path key={x} d={`M${x} 386q5-10 10 0q-5 10-10 0Z`} fill="var(--stationery-leaf)" opacity=".55" />)}
  </>;
}

/** Decorative fictional stationery; the parent supplies its real occasion link and accessible name. */
export function StationeryCard({ variant, className = "", names, eyebrow, date, location, ageLabel = "One" }: StationeryCardProps) {
  const id = `stationery-${useId().replace(/:/g, "")}`;
  const sample = sampleCopy[variant];
  const people = names || sample.names;
  return <div className={`stationery-card stationery-card--${variant} ${className}`} aria-hidden="true" data-stationery={variant}>
    <svg className="stationery-print" viewBox="0 0 300 420" fill="none" focusable="false" aria-hidden="true"><PrintDefinitions id={id} variant={variant} /><PrintedBorder id={id} variant={variant} /></svg>
    <div className="stationery-content">
      <p className="stationery-eyebrow">{eyebrow || sample.eyebrow}</p>
      {variant === "mehndi" ? <><span className="stationery-special-title">Mehndi</span><span className="stationery-small-script">a little colour, a little love</span><span className="stationery-couple-line">{people.join(" & ")}</span></>
        : variant === "birthday" ? <><div className="stationery-names"><span>{people[0]}</span></div><span className="stationery-small-script">turns</span><span className="stationery-birthday-age">{ageLabel}</span></>
        : variant === "baby-shower" ? <><div className="stationery-baby-title"><span>A little</span><em>love</em><span>is on the way</span></div><span className="stationery-couple-line">{people.join(" & ")}</span></>
        : <><div className="stationery-names">{people.map((name, index) => <span key={index}>{index > 0 && <i>&</i>}<span>{name}</span></span>)}</div><span className="stationery-invitation-label">{variant === "engagement" ? "are getting engaged" : "joyfully invite you to their wedding"}</span></>}
    </div>
    <div className="stationery-details"><span>{date || sample.date}</span><span>{location || sample.location}</span></div>
  </div>;
}
