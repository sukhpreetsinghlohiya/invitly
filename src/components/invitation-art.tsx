import { Flower } from "@/components/brand";
import type { Invitation, ThemeId } from "@/types/invitation";

export function Botanical({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 180 280" fill="none" aria-hidden="true">
    <path d="M90 272C30 178 121 117 82 15M75 191C35 165 26 133 19 106M81 151C125 121 143 77 145 45M81 85C42 73 33 51 32 27" stroke="currentColor" strokeWidth="2" />
    <g fill="currentColor" opacity=".8"><ellipse cx="47" cy="158" rx="12" ry="28" transform="rotate(-40 47 158)" /><ellipse cx="91" cy="184" rx="11" ry="27" transform="rotate(29 91 184)" /><ellipse cx="124" cy="106" rx="11" ry="28" transform="rotate(37 124 106)" /><ellipse cx="65" cy="93" rx="11" ry="23" transform="rotate(-42 65 93)" /><ellipse cx="86" cy="56" rx="9" ry="22" transform="rotate(18 86 56)" /></g>
    <g fill="#e9b7a6"><circle cx="29" cy="25" r="17" /><circle cx="15" cy="31" r="12" /><circle cx="38" cy="39" r="13" /><circle cx="146" cy="44" r="18" /><circle cx="133" cy="35" r="12" /><circle cx="157" cy="29" r="13" /></g><g fill="#c1894d"><circle cx="28" cy="29" r="5" /><circle cx="145" cy="35" r="5" /></g>
  </svg>;
}

// Original vector compositions. No external images, icon packs, or font downloads.
function JaaliCanopy() {
  return <svg className="collection-motif mehfil-canopy" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <path d="M24 406V151C24 109 55 76 91 67C111 62 118 36 150 25C182 36 189 62 209 67C245 76 276 109 276 151V406Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M32 398V152C32 117 61 84 95 77C118 70 123 49 150 38C177 49 182 70 205 77C239 84 268 117 268 152V398Z" stroke="currentColor" opacity=".4" />
    {[42, 68, 94, 120, 146, 172, 198, 224, 250, 276].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 12 : 18})`}><path d="m0-5 3 5-3 5-3-5Z" fill="currentColor" opacity=".7" /></g>)}
    {[104, 145, 186, 227, 268, 309, 350, 391].map((y) => <g key={y}><path d={`M10 ${y - 10}l5 10-5 10-5-10ZM290 ${y - 10}l5 10-5 10-5-10Z`} stroke="currentColor" opacity=".5" /></g>)}
    <path d="m150 60 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="currentColor" /><circle cx="122" cy="84" r="1.5" fill="currentColor" /><circle cx="179" cy="84" r="1.5" fill="currentColor" />
    <path d="M117 409h66m-51 6h36" stroke="currentColor" />
  </svg>;
}

function FolkSun() {
  return <svg className="collection-motif kesar-folk" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <g transform="translate(232 74)">
      {Array.from({ length: 16 }, (_, index) => <path key={index} d="M0-30V-42" stroke="currentColor" strokeWidth="2" transform={`rotate(${index * 22.5})`} />)}
      <circle r="23" stroke="currentColor" strokeWidth="1.5" /><circle r="17" fill="currentColor" /><path d="M-6 1q6 7 12 0" stroke="#f5b954" strokeWidth="1.5" />
    </g>
    <g transform="translate(0 195.75) scale(1 .55)"><path d="M0 329Q75 295 150 330T300 329V435H0Z" fill="#faebc9" />
    <path d="M0 336Q75 302 150 337T300 336" stroke="currentColor" opacity=".5" /></g>
    {[24, 74, 124, 174, 224, 274].map((x) => <g key={x} transform={`translate(${x} 407)`}><path d="M0 16V-14M0 8Q-15 5-12-5Q0-2 0 8M0 1Q15-2 12-12Q0-9 0 1" stroke="currentColor" strokeWidth="1.4" /><g transform="translate(0 -21)">{[0, 60, 120].map((angle) => <ellipse key={angle} rx="4" ry="10" fill="currentColor" transform={`rotate(${angle})`} />)}<circle r="3" fill="#efba56" /></g></g>)}
    {[16, 40, 64, 88, 112, 136, 160, 184, 208, 232, 256, 280].map((x) => <path key={x} d={`M${x} 12h8v5h-8Z`} fill="currentColor" opacity=".65" />)}
  </svg>;
}

function LotusDrawing() {
  return <svg className="collection-motif lotus-drawing" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <ellipse cx="150" cy="214" rx="117" ry="183" stroke="currentColor" opacity=".38" /><ellipse cx="150" cy="214" rx="110" ry="176" stroke="currentColor" opacity=".2" />
    <path d="M156 52a12 12 0 1 0 8 20a10 10 0 0 1-8-20Z" transform="translate(0 -22)" fill="currentColor" opacity=".8" />
    <g transform="translate(150 395)"><path d="M0 0C-31-19-28-44 0-69C28-44 31-19 0 0Z" fill="#d69298" stroke="currentColor" /><path d="M0 0C-47-3-67-24-61-49C-23-49-8-25 0 0Z" fill="#e2a6aa" stroke="currentColor" /><path d="M0 0C47-3 67-24 61-49C23-49 8-25 0 0Z" fill="#e2a6aa" stroke="currentColor" /><path d="M0 0C-43 16-77 2-84-18C-50-30-19-11 0 0ZM0 0C43 16 77 2 84-18C50-30 19-11 0 0Z" fill="#efc4c3" stroke="currentColor" /><path d="M-71 19H71M-48 27H48M-22 34H22" stroke="currentColor" opacity=".6" /></g>
  </svg>;
}

function Peacock({ mirror = false }: { mirror?: boolean }) {
  return <g transform={mirror ? "translate(300 0) scale(-1 1)" : undefined}><g transform="translate(41 357)"><path d="M16-6C-8-33-25-42-27-20C-29 4-13 17 6 13Z" fill="#a7b195" stroke="#45604c" /><path d="M9 10C-1-2-15-18-19-16M14 6C5-6-7-27-14-27" stroke="#45604c" opacity=".7" /><path d="M3 7C22 13 33 0 24-14C17-25 14-35 23-40C31-45 33-32 27-30" fill="#45604c" stroke="#45604c" strokeWidth="2" /><path d="M25-45v-6m4 8 4-5m-11 4-3-5M12 13l-2 10m9-12 3 12" stroke="#45604c" strokeWidth="1.5" /><circle cx="26" cy="-38" r="1.5" fill="#f4eedb" /><path d="m30-35 6 2-5 2" fill="#aa793e" /></g></g>;
}

function PichwaiCourt() {
  return <svg className="collection-motif pichwai-court" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <path d="M20 411V145C20 81 71 25 150 25C229 25 280 81 280 145V411Z" fill="#f4eedb" stroke="#64785d" />
    <path d="M31 399V145C31 84 82 37 150 37C218 37 269 84 269 145V399Z" stroke="#64785d" opacity=".55" />
    {[42, 93, 144, 195, 246, 297, 348].map((y, index) => <g key={y} transform={`translate(10 ${y})`}><path d="M0 26V-12M0 7Q-10 2-7-7Q1-2 0 7M0 19Q10 14 7 5Q-1 10 0 19" stroke="#52684f" /><circle cy="-15" r={index % 2 ? 3 : 5} fill="#ac7962" /></g>)}
    {[42, 93, 144, 195, 246, 297, 348].map((y, index) => <g key={y} transform={`translate(290 ${y}) scale(-1 1)`}><path d="M0 26V-12M0 7Q-10 2-7-7Q1-2 0 7M0 19Q10 14 7 5Q-1 10 0 19" stroke="#52684f" /><circle cy="-15" r={index % 2 ? 3 : 5} fill="#ac7962" /></g>)}
    <g transform="translate(150 71)"><path d="M0 14C-23 1-18-16 0-27C18-16 23 1 0 14M0 14C-23 19-34 4-29-9C-11-9-4 5 0 14M0 14C23 19 34 4 29-9C11-9 4 5 0 14" fill="#be8b7a" stroke="#966a57" /><path d="M0 14v12" stroke="#64785d" /></g>
    <Peacock /><Peacock mirror /><path d="M99 393h102m-86 6h70" stroke="#64785d" opacity=".6" />
  </svg>;
}

function CoastalWaves() {
  return <svg className="collection-motif ocean-waves" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <g transform="translate(250 68) rotate(21)"><path d="M0 27C-60 10-60-49 0-49C60-49 60 10 0 27Z" stroke="#54818c" /><path d="M0 27L-34-34M0 27L-19-44M0 27V-49M0 27L19-44M0 27L34-34" stroke="#54818c" opacity=".75" /><path d="M-6 28h12" stroke="#54818c" /></g>
    <g transform="translate(0 195.75) scale(1 .55)"><path d="M0 328C66 277 133 306 179 333C226 361 265 361 300 318V435H0Z" fill="#b2cbd0" />
    <path d="M0 363C54 323 91 346 143 369C204 397 250 374 300 351V435H0Z" fill="#6b9ba8" />
    <path d="M0 403C66 362 123 381 170 408C221 437 263 402 300 389V435H0Z" fill="#2f657b" />
    <path d="M-8 344C57 293 125 322 172 348C229 380 270 371 307 332M-8 375C59 336 95 359 147 383C212 410 256 386 310 363" stroke="#f6f4e9" strokeWidth="1.2" /></g>
    <path d="M23 25h104M23 31h64" stroke="#54818c" opacity=".6" />
  </svg>;
}

function DecoFrame() {
  return <svg className="collection-motif champagne-frame" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <path d="M13 56 56 13h188l43 43v323l-43 43H56l-43-43Z" stroke="currentColor" /><path d="M22 62 62 22h176l40 40v311l-40 40H62l-40-40Z" stroke="currentColor" opacity=".5" />
    {[false, true].map((flip) => <g key={String(flip)} transform={flip ? "translate(300 435) rotate(180)" : undefined}><path d="M25 104V29h79M25 86l61-61M25 67l42-42M25 48l23-23M25 105l80-80" stroke="currentColor" /><path d="M49 14v23M14 49h23" stroke="currentColor" /></g>)}
    <path d="m150 49 18 22-18 22-18-22Zm0 10 10 12-10 12-10-12Z" stroke="currentColor" /><path d="M90 71h42m36 0h42M110 360l40 25 40-25M110 367l40 25 40-25M126 356l24 15 24-15" stroke="currentColor" />
  </svg>;
}

function RangoliCourt() {
  return <svg className="collection-motif sindoor-rangoli" viewBox="0 0 300 435" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <path d="M31 128C31 61 79 32 150 32C221 32 269 61 269 128V326C269 381 221 404 150 404C79 404 31 381 31 326Z" fill="#f8e9cd" />
    <path d="M39 128C39 67 85 40 150 40C215 40 261 67 261 128V326C261 374 215 396 150 396C85 396 39 374 39 326Z" stroke="#a43828" opacity=".45" />
    <g transform="translate(150 72) scale(.65)">{Array.from({ length: 8 }, (_, index) => <g key={index} transform={`rotate(${index * 45})`}><path d="M0-9C-17-19-10-33 0-37C10-33 17-19 0-9Z" stroke="#a43828" strokeWidth="1.2" /><circle cy="-43" r="2" fill="#a43828" /></g>)}<circle r="10" fill="#a43828" /><circle r="4" fill="#f8e9cd" /></g>
    {[30, 67, 104, 141, 178, 215, 252, 289, 326, 363, 400].map((y) => <g key={y} fill="#f8d5a1"><path d={`m14 ${y - 8} 6 8-6 8-6-8Zm272 0 6 8-6 8-6-8Z`} /></g>)}
    <path d="m150 361 5 9 10 2-10 3-5 9-5-9-10-3 10-2Z" fill="#a43828" />
  </svg>;
}

function ThemeArtwork({ theme, initials }: { theme: ThemeId; initials: string }) {
  if (theme === "floral") return <><Botanical className="botanical botanical-left" /><Botanical className="botanical botanical-right" /></>;
  if (theme === "royal") return <><div className="garland"><Flower /><Flower /><Flower /><Flower /><Flower /></div><div className="art-arch" /><Flower className="art-flower bottom-left" /><Flower className="art-flower bottom-right" /></>;
  if (theme === "mehfil") return <JaaliCanopy />;
  if (theme === "kesar") return <FolkSun />;
  if (theme === "lotus") return <LotusDrawing />;
  if (theme === "pichwai") return <PichwaiCourt />;
  if (theme === "ocean") return <CoastalWaves />;
  if (theme === "champagne") return <DecoFrame />;
  if (theme === "sindoor") return <RangoliCourt />;
  return <><div className="minimal-orbit" /><span className="minimal-monogram">{initials}</span></>;
}

export function InvitationArt({ theme, invitation, compact = false }: { theme: ThemeId; invitation: Invitation; compact?: boolean }) {
  return <div className={`invitation-art theme-${theme} ${compact ? "compact" : ""}`}>
    <div className="art-border" />
    <ThemeArtwork theme={theme} initials={invitation.initials} />
    <div className="art-copy"><span className="eyebrow">Together with our families</span><h2><span>{invitation.couple[0]}</span><i>&</i><span>{invitation.couple[1]}</span></h2><span className="art-divider">✦</span><p>We&apos;re getting married</p><span className="art-date">{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: invitation.timezone }).format(new Date(invitation.weddingAt))}</span><span className="art-city">{invitation.city}</span></div>
  </div>;
}
