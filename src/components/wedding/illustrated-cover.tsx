import { useId } from "react";
import { getDesign, guestWording } from "@/data/occasions";
import { formatEventDate } from "@/data/demo-invitation";
import { hasIndicText } from "@/lib/invitation-text";
import type { Invitation, ThemeId } from "@/types/invitation";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/great-vibes/latin-400.css";
import styles from "./illustrated-cover.module.css";

type Props = { invitation: Invitation; theme: ThemeId; compact?: boolean };

/** Original printmaking motifs. SVG definitions are scoped to each card instance. */
function Motifs({ id, theme }: { id: string; theme: ThemeId }) {
  return <defs>
    <g id={`${id}-flower`} stroke="var(--art-line)" strokeWidth=".8">
      {Array.from({ length: 10 }, (_, i) => <path key={i} transform={`rotate(${i * 36})`} d="M0-3C-5-7-8-17-3-22C2-27 9-19 7-14C9-9 3-5 0-3Z" fill="var(--art-petal)" />)}
      <circle r="8" fill="var(--art-gold)" /><circle r="4.5" fill="var(--art-petal)" />
      {[0, 60, 120, 180, 240, 300].map(angle => <circle key={angle} transform={`rotate(${angle})`} cy="-5.5" r=".8" fill="var(--art-line)" stroke="none" />)}
      <circle r="1.5" fill="var(--art-line)" />
    </g>
    <g id={`${id}-sprig`} stroke="var(--art-leaf)" strokeWidth="1.3" strokeLinecap="round" fill="none">
      <path d="M0 112C-9 79 15 55 0 4M0 80C-14 69-18 56-28 50M1 56C16 46 19 30 30 22" />
      <path d="M0 97C-21 94-27 78-23 69C-7 72-1 85 0 97ZM1 75C20 75 30 62 27 53C12 54 3 64 1 75ZM2 49C-18 46-24 32-18 22C-3 26 3 37 2 49ZM1 29C16 27 22 14 18 5C8 9 1 18 1 29ZM-1 110C13 92 29 93 32 103C24 113 11 117-1 110Z" fill="var(--art-leaf)" />
      <path d="m-2 89-15-14m21-8 17-9M0 42l-13-14m18-5 10-11M3 108l20-5" stroke="var(--art-paper)" strokeWidth=".7" />
      <use href={`#${id}-flower`} transform="translate(-29 46) scale(.48)" /><use href={`#${id}-flower`} transform="translate(31 18) scale(.4)" /><use href={`#${id}-flower`} transform="translate(-1 -4) scale(.65)" />
    </g>
    {theme === "kesar" || theme === "sindoor" ? <g id={`${id}-paisley`} fill="var(--art-petal)" stroke="var(--art-line)" strokeWidth="1">
      <path d="M-5 43C-39 24-28-10-3-28C9-38 16-46 11-60C49-31 53 7 32 33C20 49 6 50-5 43Z" />
      <path d="M-3 34C-25 20-16-3 2-18C12-27 18-32 19-40C37-17 37 7 23 25C15 37 5 39-3 34Z" fill="none" /><path d="M0 23C-13 11-3-2 9 0C24 2 20 20 10 19C3 18 4 11 9 11" fill="none" />
      <path d="m-24 7 6 1m-1-16 5 4m6-17 4 6m12-21 2 6m24 32-6 1m1 12-6-2m-1 14-5-4m-6 12-3-6m-10 8 1-6" /><circle cx="14" cy="-22" r="3" fill="var(--art-gold)" />
    </g> : null}
    {(theme === "lotus" || theme === "pichwai") && <g id={`${id}-lotus`} stroke="var(--art-line)" strokeWidth="1" strokeLinejoin="round">
      <path d="M0 8C-21-7-20-32 0-49C20-32 21-7 0 8Z" fill="var(--art-petal)" /><path d="M0 10C-32 3-43-21-36-39C-9-33 0-17 0 10ZM0 10C32 3 43-21 36-39C9-33 0-17 0 10Z" fill="var(--art-soft)" />
      <path d="M0 13C-32 22-57 4-62-18C-29-17-10-6 0 13ZM0 13C32 22 57 4 62-18C29-17 10-6 0 13Z" fill="var(--art-petal)" /><path d="M-54-12Q-31-5 0 13Q31-5 54-12M0-37V8" fill="none" />
      <path d="M-29 17Q0 32 29 17M0 22v21" fill="none" stroke="var(--art-leaf)" strokeWidth="2" />
    </g>}
    {theme === "pichwai" && <g id={`${id}-peacock`} stroke="var(--art-line)" strokeWidth="1.1" strokeLinejoin="round">
      <g transform="translate(-20 15)">{[-65, -43, -21, 1, 23].map(angle => <g key={angle} transform={`rotate(${angle})`}>
        <path d="M0 12C-22-15-24-65 0-87C24-65 22-15 0 12Z" fill="var(--art-leaf)" /><path d="M0 6V-77M-9-14-1-6m13-19-10 10m-15-24 12 12m12-29-12 12" fill="none" stroke="var(--art-gold)" />
        <ellipse cy="-59" rx="10" ry="16" fill="var(--art-gold)" /><ellipse cy="-61" rx="5.5" ry="10" fill="var(--art-blue)" /><circle cy="-65" r="2.5" fill="var(--art-paper)" />
      </g>)}</g>
      <path d="M-25 8C-7 28 16 28 27 12C41-8 18-38 30-58C37-71 48-69 52-61C56-52 47-48 43-51C39-39 54-22 55-6C63 20 42 46 15 45C-5 43-13 29-25 8Z" fill="var(--art-blue)" />
      <path d="M-17 15C4-6 32 0 31 20C19 38-5 35-17 15Z" fill="var(--art-leaf)" /><path d="M-10 15q19-5 33 7M-3 24q10-4 19 4" fill="none" stroke="var(--art-gold)" />
      <circle cx="47" cy="-61" r="2" fill="var(--art-paper)" /><path d="m53-56 11 4-11 3" fill="var(--art-gold)" stroke="none" /><path d="M35-72v-12m6 13 7-11m-16 12-7-9M7 44 1 61m24-18 8 18M-4 61h11m22 0h12" fill="none" />
      <g fill="var(--art-gold)"><circle cx="35" cy="-85" r="3" /><circle cx="49" cy="-83" r="3" /><circle cx="24" cy="-80" r="3" /></g>
    </g>}
    {theme === "mehfil" && <>
      <pattern id={`${id}-jaali`} width="38" height="38" patternUnits="userSpaceOnUse"><path d="M19 0 38 19 19 38 0 19ZM0 0l38 38M38 0 0 38" fill="none" stroke="var(--art-gold)" strokeWidth=".65" /><circle cx="19" cy="19" r="5" fill="none" stroke="var(--art-gold)" strokeWidth=".5" /></pattern>
      <g id={`${id}-lantern`} stroke="var(--art-gold)" strokeWidth="1.2"><path d="M0-40v38M-13 13 0-4l13 17M-17 13h34L13 56H-13ZM-17 13l17 6 17-6M-13 56 0 67l13-11M0 19v48M-10 19l3 33m17-33-3 33" fill="var(--art-soft)" /><path d="M-7 31Q0 20 7 31L5 48H-5Z" fill="var(--art-gold)" /><path d="M0 68v10m-4 0h8" /></g>
    </>}
    {theme === "royal" && <g id={`${id}-pavilion`} stroke="var(--art-line)" strokeWidth=".85" strokeLinejoin="round">
      <path d="M-39 13V-4H39V13M-34 13V75H34V13" fill="var(--art-paper)" /><path d="M-44-4Q-25-12-23-25Q-18-36 0-40Q18-36 23-25Q25-12 44-4Z" fill="var(--art-petal)" /><path d="M-44-4h88M-38 4h76M-39 13h78M-36 76h72M-41 83h82M0-40v-9m-4 0h8" fill="none" />
      <path d="M-18 75V32Q-18 17 0 14Q18 17 18 32V75Z" fill="var(--art-soft)" /><path d="M-12 74V33Q-12 24 0 21Q12 24 12 33V74M-30 19v50m60-50v50M-22-18h44M-16-27h32" fill="none" /><path d="M-34 70h68" />
    </g>}
  </defs>;
}

function Border({ id, theme }: { id: string; theme: ThemeId }) {
  if (theme === "royal") return <>
    <rect x="10" y="10" width="440" height="624" fill="none" stroke="var(--art-gold)" strokeWidth="1.3" /><rect x="18" y="18" width="424" height="608" fill="none" stroke="var(--art-gold)" strokeWidth=".7" strokeDasharray="1 4" />
    <path d="M57 526V178Q57 157 79 154Q68 132 92 123Q89 101 115 103Q119 77 144 88Q157 58 185 76Q208 44 230 63Q252 44 275 76Q303 58 316 88Q341 77 345 103Q371 101 368 123Q392 132 381 154Q403 157 403 178V526Z" fill="var(--art-paper)" stroke="var(--art-gold)" strokeWidth="2" />
    <path d="M66 513V181Q66 160 89 160Q78 135 103 131Q95 108 123 113Q123 86 148 99Q160 70 188 87Q211 54 230 77Q249 54 272 87Q300 70 312 99Q337 86 337 113Q365 108 357 131Q382 135 371 160Q394 160 394 181V513" fill="none" stroke="var(--art-line)" strokeWidth=".7" />
    {[32, 428].map(x => <g key={x}><path d={`M${x} 28V452`} stroke="var(--art-gold)" strokeWidth=".8" />{[42, 70, 98, 126, 154, 182, 210, 238, 266, 294, 322, 350, 378, 406, 434].map(y => <use key={y} href={`#${id}-flower`} transform={`translate(${x} ${y}) scale(.44)`} />)}</g>)}
  </>;
  if (theme === "mehfil") return <>
    <rect x="10" y="10" width="440" height="624" fill={`url(#${id}-jaali)`} opacity=".33" /><rect x="19" y="19" width="422" height="606" fill="none" stroke="var(--art-gold)" strokeWidth="1" />
    <path d="M56 584V224C56 136 145 140 230 64C315 140 404 136 404 224V584Z" fill="var(--art-paper)" stroke="var(--art-gold)" strokeWidth="2" /><path d="M66 575V227C66 148 151 149 230 80C309 149 394 148 394 227V575Z" fill="none" stroke="var(--art-gold)" strokeWidth=".7" />
    <path d="m224 41 6-8 6 8-6 8Z" fill="var(--art-gold)" />
  </>;
  if (theme === "modern") return <>
    <path d="M24 615V216C24 90 112 25 228 25H436V615Z" fill="var(--art-soft)" /><path d="M59 591V218C59 112 132 61 232 61H400V591Z" fill="var(--art-paper)" stroke="var(--art-line)" strokeWidth=".8" />
    <path d="M24 310V216C24 90 112 25 228 25H310" fill="none" stroke="var(--art-line)" strokeWidth="2" />
  </>;
  if (theme === "floral") return <>
    <rect x="15" y="15" width="430" height="614" fill="none" stroke="var(--art-line)" strokeWidth=".7" />
    <path d="M66 524V180C66 89 144 49 230 49C316 49 394 89 394 180V524C394 580 66 580 66 524Z" fill="var(--art-paper)" stroke="var(--art-leaf)" strokeWidth="1" /><path d="M77 518V179C77 99 148 61 230 61C312 61 383 99 383 179V518" fill="none" stroke="var(--art-leaf)" strokeWidth=".55" />
    {[65, 198, 331, 464].map(y => <g key={y}><use href={`#${id}-sprig`} transform={`translate(44 ${y}) scale(.72 1)`} /><use href={`#${id}-sprig`} transform={`translate(416 ${y + 115}) rotate(180) scale(.72 1)`} /></g>)}
  </>;
  if (theme === "kesar") return <>
    <rect x="12" y="12" width="436" height="620" fill="none" stroke="var(--art-line)" strokeWidth="1" /><rect x="22" y="22" width="416" height="600" fill="none" stroke="var(--art-line)" strokeWidth=".65" strokeDasharray="2 5" />
    <path d="M76 526V173Q76 147 96 139Q97 112 127 112Q143 83 173 94Q199 60 230 80Q261 60 287 94Q317 83 333 112Q363 112 364 139Q384 147 384 173V526Z" fill="var(--art-paper)" stroke="var(--art-line)" strokeWidth="1" />
    {[74, 179, 284, 389, 494, 599].map((y, i) => <g key={y}><use href={`#${id}-${i % 2 ? "flower" : "paisley"}`} transform={`translate(46 ${y}) scale(${i % 2 ? .65 : .48})`} /><use href={`#${id}-${i % 2 ? "flower" : "paisley"}`} transform={`translate(414 ${y}) scale(${i % 2 ? -.65 : -.48} ${i % 2 ? .65 : .48})`} /></g>)}
    {[111, 171, 230, 289, 349].map(x => <use key={x} href={`#${id}-flower`} transform={`translate(${x} 43) scale(.52)`} />)}
  </>;
  if (theme === "lotus") return <>
    <rect x="13" y="13" width="434" height="618" fill="none" stroke="var(--art-line)" strokeWidth=".6" /><ellipse cx="230" cy="308" rx="175" ry="257" fill="var(--art-paper)" stroke="var(--art-line)" strokeWidth="1" /><ellipse cx="230" cy="308" rx="163" ry="244" fill="none" stroke="var(--art-line)" strokeWidth=".55" />
    <path d="M36 150Q1 318 49 469M424 150Q459 318 411 469" fill="none" stroke="var(--art-leaf)" strokeWidth=".8" />
    {[210, 281, 352, 423].map(y => <g key={y}><path d={`M32 ${y}q-20-14-13-32q23 8 13 32Zm396 0q20-14 13-32q-23 8-13 32Z`} fill="var(--art-leaf)" opacity=".65" /></g>)}
  </>;
  if (theme === "pichwai") return <>
    <rect x="12" y="12" width="436" height="620" fill="none" stroke="var(--art-line)" strokeWidth="1" /><rect x="21" y="21" width="418" height="602" fill="none" stroke="var(--art-line)" strokeWidth=".6" />
    <path d="M70 485V176C70 136 99 103 133 95C151 91 162 78 173 69Q204 92 230 58Q256 92 287 69C298 78 309 91 327 95C361 103 390 136 390 176V485Z" fill="var(--art-paper)" stroke="var(--art-line)" strokeWidth="1.2" />
    {[72, 207, 342, 477].map(y => <g key={y}><use href={`#${id}-sprig`} transform={`translate(42 ${y}) scale(.61 .9)`} /><use href={`#${id}-sprig`} transform={`translate(418 ${y}) scale(-.61 .9)`} /></g>)}
  </>;
  if (theme === "ocean") return <>
    <rect x="17" y="17" width="426" height="610" fill="none" stroke="var(--art-line)" strokeWidth=".8" /><path d="M37 521V176C37 85 121 37 230 37C339 37 423 85 423 176V521" fill="var(--art-paper)" stroke="var(--art-line)" strokeWidth=".6" />
  </>;
  if (theme === "champagne") return <>
    <path d="M18 80H42V42H80V18H380V42H418V80H442V564H418V602H380V626H80V602H42V564H18Z" fill="none" stroke="var(--art-gold)" strokeWidth="1.3" /><path d="M28 91H53V54H91V30H369V54H407V91H432V553H407V590H369V614H91V590H53V553H28Z" fill="none" stroke="var(--art-gold)" strokeWidth=".55" />
    <path d="M60 189v269m340-269v269M54 218h12m-12 212h12m328-212h12m-12 212h12" stroke="var(--art-gold)" strokeWidth=".7" />
  </>;
  return <>
    <rect x="14" y="14" width="432" height="616" fill="none" stroke="var(--art-gold)" strokeWidth="1" /><rect x="24" y="24" width="412" height="596" fill="none" stroke="var(--art-gold)" strokeWidth=".6" strokeDasharray="2 4" />
    <path d="M78 107H382V550H78Z" fill="var(--art-paper)" stroke="var(--art-gold)" strokeWidth="1.4" /><path d="M88 117H372V540H88Z" fill="none" stroke="var(--art-line)" strokeWidth=".55" />
    {[96, 207, 318, 429, 540].map(y => <g key={y}><use href={`#${id}-paisley`} transform={`translate(47 ${y}) scale(.46)`} /><use href={`#${id}-paisley`} transform={`translate(413 ${y}) scale(-.46 .46)`} /></g>)}
    {[108, 168, 230, 292, 352].map(x => <g key={x}><use href={`#${id}-flower`} transform={`translate(${x} 62) scale(.62)`} /><use href={`#${id}-flower`} transform={`translate(${x} 582) scale(.62)`} /></g>)}
  </>;
}

function DecoChevron() {
  return <g stroke="var(--art-gold)" fill="none"><path d="M80 76h84l66-37 66 37h84M98 91h65l67-38 67 38h65M119 108h51l60-37 60 37h51M145 124h34l51-34 51 34h34" strokeWidth=".7" /><path d="m230 105 15 15-15 15-15-15Z" strokeWidth="1" /></g>;
}

/** A stretchable paper rail joins the two fixed-proportion halves of the frame. */
function FrameMiddle({ theme }: { theme: ThemeId }) {
  const rails: Record<ThemeId, { paper: [number, number]; soft?: [number, number]; lines: number[]; gold?: number[] }> = {
    royal: { paper: [57, 346], lines: [66, 394], gold: [10, 18, 57, 403, 442, 450] },
    mehfil: { paper: [56, 348], lines: [], gold: [19, 56, 66, 394, 404, 441] },
    modern: { paper: [59, 341], soft: [24, 412], lines: [59, 400] },
    floral: { paper: [66, 328], lines: [15, 66, 77, 383, 394, 445] },
    kesar: { paper: [76, 308], lines: [12, 22, 76, 384, 438, 448] },
    lotus: { paper: [55.26, 349.48], lines: [13, 55.26, 67.27, 392.73, 404.74, 447] },
    pichwai: { paper: [70, 320], lines: [12, 21, 70, 390, 439, 448] },
    ocean: { paper: [37, 386], lines: [17, 37, 423, 443] },
    champagne: { paper: [0, 460], lines: [], gold: [18, 28, 60, 400, 432, 442] },
    sindoor: { paper: [78, 304], lines: [88, 372], gold: [14, 24, 78, 382, 436, 446] },
  };
  const rail = rails[theme];
  return <>
    <rect width="460" height="1" fill="var(--art-ground)" />
    {rail.soft && <rect x={rail.soft[0]} width={rail.soft[1]} height="1" fill="var(--art-soft)" />}
    <rect x={rail.paper[0]} width={rail.paper[1]} height="1" fill="var(--art-paper)" />
    {rail.lines.map(x => <rect key={x} x={x - .35} width=".7" height="1" fill="var(--art-line)" />)}
    {rail.gold?.map(x => <rect key={x} x={x - .5} width="1" height="1" fill="var(--art-gold)" />)}
  </>;
}

/** Keep ornaments anchored to the paper edge when long names make the sheet taller. */
function TopOrnament({ id, theme }: { id: string; theme: ThemeId }) {
  if (theme === "royal") return <use href={`#${id}-flower`} transform="translate(230 109) scale(.7)" />;
  if (theme === "mehfil") return <><use href={`#${id}-lantern`} transform="translate(106 94) scale(.8)" /><use href={`#${id}-lantern`} transform="translate(354 94) scale(.8)" /><use href={`#${id}-lantern`} transform="translate(230 132) scale(.46)" /></>;
  if (theme === "modern") return <><circle cx="335" cy="100" r="28" fill="var(--art-petal)" /><path d="M318 100h34m-17-17v34" stroke="var(--art-paper)" strokeWidth=".8" /><path d="M80 108h61m-61 9h34" stroke="var(--art-line)" strokeWidth="1" /></>;
  if (theme === "floral") return <><use href={`#${id}-sprig`} transform="translate(164 79) rotate(-64) scale(.65)" /><use href={`#${id}-sprig`} transform="translate(296 79) rotate(64) scale(-.65 .65)" /><use href={`#${id}-flower`} transform="translate(230 71) scale(.9)" /></>;
  if (theme === "kesar") return <use href={`#${id}-flower`} transform="translate(230 120) scale(.75)" />;
  if (theme === "lotus") return <use href={`#${id}-lotus`} transform="translate(230 100) scale(.63)" />;
  if (theme === "pichwai") return <use href={`#${id}-lotus`} transform="translate(230 110) scale(.45)" />;
  if (theme === "ocean") return <>
    {[0, 1, 2].map(i => <path key={i} d={`M44 ${102 + i * 13}Q70 ${84 + i * 13} 101 ${102 + i * 13}T160 ${102 + i * 13}M300 ${102 + i * 13}Q329 ${84 + i * 13} 358 ${102 + i * 13}T416 ${102 + i * 13}`} fill="none" stroke="var(--art-leaf)" strokeWidth=".7" />)}
    <g transform="translate(230 105)" fill="var(--art-petal)" stroke="var(--art-line)" strokeWidth=".8"><path d="M-7 22C-47-1-40-33-25-29C-26-47-9-49 0-35C9-49 26-47 25-29C40-33 47-1 7 22Z" /><path d="m0 20-24-45m24 45v-50m0 50 24-45m-24 45-32-25m32 25 32-25M-8 23H8v8H-8Z" fill="none" /></g>
  </>;
  if (theme === "champagne") return <DecoChevron />;
  return <use href={`#${id}-flower`} transform="translate(230 154) scale(.48)" />;
}

function Landscape({ id, theme }: { id: string; theme: ThemeId }) {
  if (theme === "royal") return <>
    <path d="M38 579Q116 558 230 573T422 574V624H38Z" fill="var(--art-blue)" opacity=".55" /><path d="M57 564H403V579H57Z" fill="var(--art-gold)" />
    <g transform="translate(230 489)"><path d="M-137 78V27H137V78Z" fill="var(--art-petal)" stroke="var(--art-line)" strokeWidth=".8" />{[-116, -90, -64, 64, 90, 116].map(x => <path key={x} d={`M${x - 7} 73V49q7-14 14 0v24Z`} fill="var(--art-soft)" stroke="var(--art-line)" strokeWidth=".6" />)}<use href={`#${id}-pavilion`} transform="translate(-107 6) scale(.74)" /><use href={`#${id}-pavilion`} transform="translate(107 6) scale(.74)" /><use href={`#${id}-pavilion`} transform="translate(0 -15) scale(1.14)" /></g>
    <path d="M72 591h102m34 0h87m-201 9h61m90 0h84m-154 9h91m51-18h42" stroke="var(--art-paper)" strokeWidth="1" opacity=".7" /><use href={`#${id}-sprig`} transform="translate(61 516) scale(.56)" /><use href={`#${id}-sprig`} transform="translate(399 516) scale(-.56 .56)" />
  </>;
  if (theme === "mehfil") return <><path d="M88 565h284m-265-8h246m-183-8h120" stroke="var(--art-gold)" strokeWidth=".7" /><use href={`#${id}-sprig`} transform="translate(120 496) rotate(-36) scale(.61)" /><use href={`#${id}-sprig`} transform="translate(340 496) rotate(36) scale(-.61 .61)" /><use href={`#${id}-flower`} transform="translate(230 557) scale(.51)" /><path d="M99 605h91m80 0h91" stroke="var(--art-gold)" strokeWidth=".7" /><path d="m219 605 11-9 11 9-11 9Z" fill="var(--art-gold)" /></>;
  if (theme === "modern") return <><path d="M77 567h309M77 576h309" stroke="var(--art-line)" strokeWidth=".7" /><path d="M327 565C334 535 304 506 325 461M327 538C299 537 283 520 286 504C313 507 323 523 327 538ZM327 513C353 506 363 489 357 475C337 479 329 496 327 513Z" fill="var(--art-leaf)" stroke="var(--art-leaf)" strokeWidth="1.2" /><circle cx="123" cy="532" r="29" fill="none" stroke="var(--art-line)" strokeWidth=".8" /><circle cx="158" cy="532" r="29" fill="none" stroke="var(--art-line)" strokeWidth=".8" /></>;
  if (theme === "pichwai") return <><path d="M45 589Q230 549 415 589V621H45Z" fill="var(--art-blue)" opacity=".17" /><use href={`#${id}-peacock`} transform="translate(121 529) scale(.75)" /><use href={`#${id}-peacock`} transform="translate(339 529) scale(-.75 .75)" /><use href={`#${id}-lotus`} transform="translate(230 592) scale(.52)" /><path d="M83 609h60m174 0h60m-209 5h29m66 0h29" stroke="var(--art-line)" strokeWidth=".7" /></>;
  if (theme === "lotus") return <><path d="M38 566Q130 546 231 566T422 566M63 583Q130 563 231 583T397 583M91 600Q190 580 369 600" fill="none" stroke="var(--art-leaf)" strokeWidth=".8" /><use href={`#${id}-lotus`} transform="translate(230 535) scale(1.03)" /><use href={`#${id}-lotus`} transform="translate(117 568) rotate(-12) scale(.48)" /><use href={`#${id}-lotus`} transform="translate(350 574) rotate(13) scale(.4)" /><path d="M86 601q-16-28-30-18q7 22 30 18Zm285 4q21-27 35-15q-11 19-35 15Z" fill="var(--art-leaf)" /></>;
  if (theme === "ocean") return <>
    <path d="M18 495C84 475 100 551 174 533C246 515 260 468 332 506C384 534 412 527 442 510V626H18Z" fill="var(--art-soft)" />
    <path d="M18 531C97 501 117 568 184 547C255 525 279 518 337 547C382 569 415 555 442 539V626H18Z" fill="var(--art-blue)" opacity=".64" /><path d="M18 567C85 544 146 598 230 570S363 590 442 565V626H18Z" fill="var(--art-leaf)" opacity=".7" />
    {[0, 17, 34].map(y => <path key={y} d={`M40 ${562 + y}q38-13 72 0t72 0t72 0t72 0t72 0`} fill="none" stroke="var(--art-paper)" strokeWidth=".85" opacity=".85" />)}
  </>;
  if (theme === "champagne") return <g transform="translate(460 644) rotate(180)"><DecoChevron /></g>;
  if (theme === "sindoor") return null;
  return <>
    <use href={`#${id}-sprig`} transform="translate(104 526) rotate(-62) scale(.86)" /><use href={`#${id}-sprig`} transform="translate(356 526) rotate(62) scale(-.86 .86)" />
    <use href={`#${id}-sprig`} transform="translate(161 568) rotate(-44) scale(.6)" /><use href={`#${id}-sprig`} transform="translate(299 568) rotate(44) scale(-.6 .6)" /><use href={`#${id}-flower`} transform="translate(230 565) scale(1.2)" /><use href={`#${id}-flower`} transform="translate(193 586) scale(.61)" /><use href={`#${id}-flower`} transform="translate(267 586) scale(.61)" />
    <path d="M111 615h91m56 0h91" fill="none" stroke="var(--art-line)" strokeWidth=".6" />
  </>;
}

/** A single, real cover composition shared by the catalogue and the invitation. */
export function IllustratedCover({ invitation, theme, compact = false }: Props) {
  const id = `illustrated-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const design = getDesign(invitation);
  const names = invitation.couple.filter(Boolean);
  const nameLength = Math.max(...names.map(name => name.length), 0);
  const firstEvent = invitation.functions.filter(event => event.visibility !== "hidden").sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  const date = invitation.weddingAt || firstEvent?.startsAt || "";
  const dateLabel = formatEventDate(date, invitation.timezone, { day: "numeric", month: "long", year: "numeric" });
  const location = invitation.city || firstEvent?.venue;
  const coverText = guestWording(invitation).cover;
  const extendedCopy = Boolean(invitation.blessing) || coverText.length > 64 || (location?.length || 0) > 40 || nameLength > 20;
  return <div className={`${styles.cover} ${compact ? styles.compact : styles.full}`} data-illustrated-cover={theme} data-compact={compact} data-extended-copy={extendedCopy} data-palette={design.palette} data-typography={design.typography} data-artwork={design.decoration ? "on" : "off"} data-long-names={nameLength > 20 ? "very" : nameLength > 11 ? "true" : undefined} aria-hidden={compact || undefined}>
    <div className={styles.sheet}>
      {design.decoration && <>
        {extendedCopy ? <>
          <svg className={styles.frameTop} viewBox="0 0 460 322" data-cover-frame-slice="top" data-decoration aria-hidden="true" focusable="false"><Motifs id={id} theme={theme} /><defs><g id={`${id}-frame`}><Border id={id} theme={theme} /></g></defs><use href={`#${id}-frame`} /></svg>
          <svg className={styles.frameMiddle} viewBox="0 0 460 1" preserveAspectRatio="none" data-cover-frame-slice="middle" data-decoration aria-hidden="true" focusable="false"><FrameMiddle theme={theme} /></svg>
          <svg className={styles.frameBottom} viewBox="0 322 460 322" data-cover-frame-slice="bottom" data-decoration aria-hidden="true" focusable="false"><use href={`#${id}-frame`} /></svg>
        </> : <svg className={styles.border} viewBox="0 0 460 644" preserveAspectRatio="none" data-decoration aria-hidden="true" focusable="false"><Motifs id={id} theme={theme} /><Border id={id} theme={theme} /></svg>}
        <svg className={styles.topOrnament} viewBox="0 0 460 200" data-cover-ornament="top" data-decoration aria-hidden="true" focusable="false"><TopOrnament id={id} theme={theme} /></svg>
      </>}
      <div className={styles.copy} data-cover-copy>
        <div className={styles.readingArea} data-cover-reading-area>
          {invitation.blessing && <p className={styles.blessing} data-indic={hasIndicText(invitation.blessing) || undefined}>{invitation.blessing}</p>}
          <p className={styles.eyebrow} data-indic={hasIndicText(coverText) || undefined}>{coverText}</p>
          <div className={styles.names} data-indic={hasIndicText(names.join(" ")) || undefined}>{names.length ? names.map((name, index) => <span className={styles.person} key={index}>{index > 0 && <span className={styles.ampersand}>&</span>}<span>{name}</span></span>) : <span>Your names</span>}</div>
          <div className={styles.details}><p>{dateLabel}</p>{location && <p className={styles.location} data-indic={hasIndicText(location) || undefined}>{location}</p>}</div>
        </div>
      </div>
      {design.decoration && <svg className={styles.landscape} viewBox="0 450 460 194" data-cover-ornament="bottom" data-decoration aria-hidden="true" focusable="false"><Landscape id={id} theme={theme} /></svg>}
    </div>
  </div>;
}
