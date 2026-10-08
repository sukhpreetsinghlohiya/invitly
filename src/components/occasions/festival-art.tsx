import type { FestivalPresetId } from "@/types/invitation";

function Star({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} fill="currentColor"><path d="M0-10 2.5-2.5 10 0 2.5 2.5 0 10-2.5 2.5-10 0-2.5-2.5Z" /><circle cx="15" cy="-14" r="1.6" /></g>;
}

function Lantern({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M0-80V-33m-12 2h24l8 17H-20Z" fill="#d89c52" /><path d="M-20-14-29 15l8 50H21l8-50-9-29Z" fill="#f2d395" />
    <path d="M-12-14-17 15l8 50M12-14 17 15 9 65M-29 15h58M-21 65h42M0-14V65" fill="none" />
    <path d="M-21 65-9 12 0-1 9 12 21 65" fill="#b96c3d" fillOpacity=".14" stroke="none" />
    <path d="M-15 70h30M0 71v28m-7-13v11m14-11v11" fill="none" /><circle cy="105" r="4" fill="#d89c52" />
  </g>;
}

function Marigold({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#d99336" stroke="#ad6b2f" strokeWidth=".7">
    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <ellipse key={angle} cy="-8" rx="5.5" ry="9" transform={`rotate(${angle})`} />)}
    <circle r="7" fill="#efbf62" /><circle r="3.5" fill="#ad6b2f" />
  </g>;
}

function Diya({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="currentColor" strokeWidth="1.5">
    <path d="M0-72C-4-51-28-35-16-18C-6-2 18-10 17-28C16-43 5-48 0-72Z" fill="#e6ae4c" stroke="none" />
    <path d="M0-40C-1-27-12-19-5-13C5-5 13-16 7-25Z" fill="#fff1c0" stroke="none" />
    <path d="M-54 0Q0 68 54 0Z" fill="#b46640" /><ellipse rx="54" ry="10" fill="#efc988" />
    <path d="M-39 13Q0 36 39 13M-28 28Q0 41 28 28" fill="none" stroke="#f3d5a2" /><path d="M-1-6v9" strokeWidth="3" />
  </g>;
}

/** Preset art is decorative and selected by the host, independently of tradition. */
export function FestivalArtwork({ preset = "custom" }: { preset?: FestivalPresetId }) {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration data-festival-art={preset} fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="307" rx="157" ry="13" fill="currentColor" opacity=".055" />
    <path d="M50 72Q240 152 430 72M72 60Q240 134 408 60" stroke="currentColor" strokeWidth=".7" opacity=".35" />
    {[90, 135, 181, 226, 272, 317, 365, 405].map((x, i) => <circle key={x} cx={x} cy={i < 4 ? 87 + i * 9 : 112 - (i - 4) * 9} r="2.2" fill="currentColor" opacity=".55" />)}
    <Star x={78} y={163} size={.65} /><Star x={405} y={169} size={.65} /><Star x={353} y={52} size={.7} />
    {preset === "diwali" ? <>
      <path d="M118 283Q240 258 362 283M134 298Q240 279 346 298" stroke="currentColor" strokeWidth="1" opacity=".35" />
      <Diya x={139} y={253} scale={.7} /><Diya x={341} y={253} scale={.7} /><Diya x={240} y={257} scale={1.15} />
      <Marigold x={93} y={285} scale={.65} /><Marigold x={389} y={283} scale={.65} /><Star x={240} y={132} />
    </> : preset === "holi" ? <>
      {[[151, 181, "#bd636b"], [328, 166, "#568e88"], [225, 143, "#dc9b3f"]].map(([x, y, colour], index) => <g key={x} fill={String(colour)}><ellipse cx={Number(x)} cy={Number(y)} rx="49" ry="33" transform={`rotate(${index * 25 - 15} ${x} ${y})`} opacity=".15" /><circle cx={Number(x) - 23} cy={Number(y) - 33} r="7" opacity=".35" /><circle cx={Number(x) + 43} cy={Number(y) + 6} r="4" opacity=".6" /></g>)}
      {[[139, 250, "#bd636b"], [341, 250, "#568e88"], [240, 282, "#dc9b3f"]].map(([x, y, colour]) => <g key={x} transform={`translate(${x} ${y})`}><path d="M-51 0Q0 54 51 0Z" fill="#e8c392" stroke="currentColor" strokeWidth="1.3" /><path d="M-45-1Q-22-10-12-32Q0-47 16-26Q26-8 45-1Z" fill={String(colour)} /><path d="M-39 11Q0 28 39 11" stroke="currentColor" opacity=".35" /></g>)}
    </> : preset === "christmas" ? <>
      <path d="M240 111 190 171h24l-49 58h38l-53 62h180l-53-62h38l-49-58h24Z" fill="#496b57" stroke="#355341" strokeWidth="1.5" />
      <path d="M240 288v25" stroke="#8f6544" strokeWidth="12" /><path d="M220 161q18 17 41 0m-58 58q37 22 74 0m-89 62q52 24 104 0" stroke="#e6c88b" strokeWidth="2" />
      <g fill="#dfb567"><circle cx="228" cy="193" r="5" /><circle cx="260" cy="243" r="5" /><circle cx="214" cy="265" r="4" /><path d="m240 85 6 12 14 2-10 10 3 14-13-7-13 7 3-14-10-10 14-2Z" /></g>
      <path d="M105 274h50v37h-50Z" fill="#c88572" /><path d="M130 274v37m-25-24h50" stroke="#f6dfaa" strokeWidth="3" /><path d="M341 279h34v32h-34Z" fill="#e1bd79" /><path d="M359 279v32" stroke="#8f584c" strokeWidth="3" />
    </> : preset === "eid" ? <>
      <path d="M259 137A66 66 0 1 0 300 245 61 61 0 0 1 259 137Z" fill="#e8c586" stroke="currentColor" strokeWidth="1.1" />
      <Lantern x={146} y={203} scale={.67} /><Lantern x={354} y={194} scale={.72} /><Star x={288} y={180} size={1.3} /><Star x={268} y={263} size={.5} />
    </> : preset === "navratri" ? <>
      <g transform="translate(240 214) rotate(-38)"><rect x="-9" y="-100" width="18" height="199" rx="8" fill="#b76d46" stroke="currentColor" /><path d="M-8-78H8M-8-58H8M-8-38H8M-8 36H8M-8 57H8M-8 78H8" stroke="#edc880" strokeWidth="9" /></g>
      <g transform="translate(240 214) rotate(38)"><rect x="-9" y="-100" width="18" height="199" rx="8" fill="#668071" stroke="currentColor" /><path d="M-8-78H8M-8-58H8M-8-38H8M-8 36H8M-8 57H8M-8 78H8" stroke="#edc880" strokeWidth="9" /></g>
      <Marigold x={134} y={282} /><Marigold x={345} y={282} /><Marigold x={239} y={294} scale={.6} />
    </> : preset === "ganesh-chaturthi" ? <>
      <path d="M130 278Q240 327 350 278Z" fill="#c79a57" stroke="currentColor" /><ellipse cx="240" cy="278" rx="110" ry="19" fill="#e4c794" stroke="currentColor" />
      {[185, 240, 295].map((x, i) => <g key={x} transform={`translate(${x} ${i === 1 ? 211 : 242})`}><path d="M0-43C-3-28-37-12-27 13C-20 29 20 29 27 13C37-12 3-28 0-43Z" fill="#f9e5b8" stroke="#b99058" strokeWidth="1.3" /><path d="M0-35Q-11-2-9 20M0-35Q11-2 9 20" stroke="#d9b881" /></g>)}
      <Marigold x={104} y={271} scale={.85} /><Marigold x={375} y={273} scale={.85} /><Marigold x={139} y={291} scale={.55} />
    </> : preset === "gurpurab" ? <>
      <path d="M104 163Q240 334 376 163M109 174Q240 345 371 174" stroke="#ae8b51" strokeWidth="2" />
      {[[111, 180], [138, 210], [170, 238], [206, 255], [244, 264], [281, 257], [316, 240], [346, 214], [372, 181]].map(([x, y]) => <Marigold key={x} x={x} y={y} scale={.72} />)}
      <Star x={240} y={167} size={1.9} /><Star x={196} y={142} size={.5} /><Star x={286} y={145} size={.55} />
      <path d="M211 307h58M225 315h30" stroke="currentColor" strokeWidth=".8" />
    </> : <><Lantern x={130} y={198} scale={.72} /><Lantern x={350} y={198} scale={.72} /><Lantern x={240} y={194} scale={1.05} /><Star x={191} y={277} size={.7} /><Star x={291} y={288} size={.65} /></>}
  </svg>;
}
