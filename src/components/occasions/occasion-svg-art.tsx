import type { ReactElement } from "react";
import type { OccasionId } from "@/types/invitation";

/** Birthday: a three-tiered cake with candles, floral swags, and scattered stars. */
function BirthdayArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    {/* ground shadow */}
    <ellipse cx="240" cy="313" rx="142" ry="11" fill="currentColor" opacity=".06" />
    {/* cake bottom tier */}
    <path d="M96 230Q96 218 108 215H372Q384 215 384 227V308Q384 318 372 318H108Q96 318 96 308Z" fill="currentColor" opacity=".07" />
    <path d="M96 230Q96 218 108 215H372Q384 215 384 227V308Q384 318 372 318H108Q96 318 96 308Z" stroke="currentColor" strokeWidth="1.5" />
    {/* frosting drip on bottom tier */}
    <path d="M96 230Q114 243 132 230Q150 218 168 230Q186 242 204 230Q222 218 240 230Q258 242 276 230Q294 218 312 230Q330 242 348 230Q366 218 384 230" stroke="currentColor" strokeWidth="1.8" />
    {/* cake middle tier */}
    <path d="M132 164Q132 152 142 150H338Q348 150 348 162V218H132Z" fill="currentColor" opacity=".07" />
    <path d="M132 164Q132 152 142 150H338Q348 150 348 162V218H132Z" stroke="currentColor" strokeWidth="1.5" />
    {/* frosting drip on middle tier */}
    <path d="M132 164Q148 175 164 164Q180 153 196 164Q212 175 228 164Q244 153 260 164Q276 175 292 164Q308 153 324 164Q340 175 348 164" stroke="currentColor" strokeWidth="1.8" />
    {/* cake top tier */}
    <path d="M172 105Q172 95 182 93H298Q308 93 308 105V154H172Z" fill="currentColor" opacity=".07" />
    <path d="M172 105Q172 95 182 93H298Q308 93 308 105V154H172Z" stroke="currentColor" strokeWidth="1.5" />
    {/* frosting drip on top tier */}
    <path d="M172 105Q186 115 200 105Q214 95 228 105Q242 115 256 105Q270 95 284 105Q298 115 308 105" stroke="currentColor" strokeWidth="1.8" />
    {/* candles */}
    {[200, 228, 256].map((x, i) => <g key={x}>
      <rect x={x - 4} y={i === 1 ? 58 : 62} width="8" height="32" rx="2" fill="currentColor" opacity={i === 1 ? ".55" : ".4"} />
      {/* flame */}
      <path d={`M${x} ${i === 1 ? 52 : 56}C${x - 5} ${i === 1 ? 46 : 50} ${x - 4} ${i === 1 ? 38 : 42} ${x} ${i === 1 ? 34 : 38}C${x + 4} ${i === 1 ? 38 : 42} ${x + 5} ${i === 1 ? 46 : 50} ${x} ${i === 1 ? 52 : 56}Z`} fill="currentColor" opacity=".65" />
      <path d={`M${x} ${i === 1 ? 50 : 54}C${x - 2} ${i === 1 ? 46 : 50} ${x} ${i === 1 ? 41 : 45} ${x} ${i === 1 ? 38 : 42}C${x + 2} ${i === 1 ? 41 : 45} ${x} ${i === 1 ? 46 : 50} ${x} ${i === 1 ? 50 : 54}Z`} fill="white" opacity=".6" />
    </g>)}
    {/* decorative flowers on bottom tier */}
    {[130, 200, 271, 340].map(x => <g key={x} transform={`translate(${x} 270)`} fill="currentColor">
      {[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cy="-6" rx="4" ry="7" transform={`rotate(${a})`} opacity=".3" />)}
      <circle r="4" opacity=".5" />
    </g>)}
    {/* swag garland on middle tier */}
    <path d="M144 186Q178 200 212 186Q246 172 280 186Q314 200 336 186" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity=".45" />
    {[165, 212, 258, 307].map(x => <circle key={x} cx={x} cy="187" r="3" fill="currentColor" opacity=".4" />)}
    {/* scattered stars */}
    {[[72, 112], [407, 95], [86, 247], [401, 218], [145, 58]].map(([x, y]) => <path key={x} d={`M${x} ${y}L${x + 3} ${y + 7}L${x + 10} ${y + 8}L${x + 5} ${y + 13}L${x + 6} ${y + 20}L${x} ${y + 16}L${x - 6} ${y + 20}L${x - 5} ${y + 13}L${x - 10} ${y + 8}L${x - 3} ${y + 7}Z`} fill="currentColor" opacity=".3" transform={`scale(0.7) translate(${-x * 0.43} ${-y * 0.43})`} />)}
    {[[72, 112, .6], [407, 95, .5], [86, 247, .45], [401, 218, .5], [149, 62, .55]].map(([x, y, o]) => <path key={`s${x}`} d={`M${x} ${y}L${x + 2} ${y + 5}L${x + 7} ${y + 6}L${x + 3.5} ${y + 9}L${x + 4.5} ${y + 14}L${x} ${y + 11}L${x - 4.5} ${y + 14}L${x - 3.5} ${y + 9}L${x - 7} ${y + 6}L${x - 2} ${y + 5}Z`} fill="currentColor" opacity={o} />)}
  </svg>;
}

/** Baby shower / Naming: a botanical cradle with floating stars and leaf arches. */
function CradleArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="318" rx="128" ry="10" fill="currentColor" opacity=".06" />
    {/* cradle body */}
    <path d="M130 232Q130 180 165 160H315Q350 180 350 232Q350 274 240 290Q130 274 130 232Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".06" />
    {/* cradle hood */}
    <path d="M165 160Q200 100 240 92Q280 100 315 160" stroke="currentColor" strokeWidth="2" />
    <path d="M175 157Q207 107 240 99Q273 107 305 157" stroke="currentColor" strokeWidth=".8" opacity=".4" />
    {/* hood ribs */}
    {[[186, 154, 213, 118], [214, 150, 230, 103], [266, 150, 250, 103], [294, 154, 267, 118]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2} ${x2} ${y2}`} stroke="currentColor" strokeWidth="1" opacity=".35" />)}
    {/* cradle base/rockers */}
    <path d="M155 285Q155 310 170 318H310Q325 310 325 285" stroke="currentColor" strokeWidth="1.8" />
    <path d="M140 318Q190 334 240 318Q290 334 340 318" stroke="currentColor" strokeWidth="2.2" />
    {/* blanket drape inside cradle */}
    <path d="M155 232Q155 260 175 272H305Q325 260 325 232Q325 215 305 207H175Q155 215 155 232Z" fill="currentColor" opacity=".08" stroke="currentColor" strokeWidth="1" />
    {/* pillow */}
    <path d="M190 210Q190 200 200 198H280Q290 200 290 210V225Q290 234 280 235H200Q190 234 190 225Z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth=".8" />
    {/* lace trim on hood edge */}
    {[175, 195, 215, 240, 265, 285, 305].map((x, i) => <circle key={i} cx={x} cy={[157, 147, 139, 136, 139, 147, 157][i]} r="3" fill="currentColor" opacity=".35" />)}
    {/* botanical arch — left side */}
    <path d="M85 290Q65 230 80 170Q95 120 118 100" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
    {[[84, 255, -25], [87, 220, -15], [93, 190, -5], [104, 155, 10]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".32"><ellipse cy="-9" rx="7" ry="14" /><ellipse cy="-9" rx="7" ry="14" transform="rotate(40)" opacity=".6" /></g>)}
    {/* botanical arch — right side */}
    <path d="M395 290Q415 230 400 170Q385 120 362 100" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
    {[[396, 255, 25], [393, 220, 15], [387, 190, 5], [376, 155, -10]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".32"><ellipse cy="-9" rx="7" ry="14" /><ellipse cy="-9" rx="7" ry="14" transform="rotate(-40)" opacity=".6" /></g>)}
    {/* stars and moon */}
    {[[120, 82, .9], [357, 85, .8], [78, 145, .5], [405, 148, .5], [240, 54, .7]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".55"><path d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" /></g>)}
    <path d="M240 54C237 47 237 40 240 34C243 40 243 47 240 54Z" fill="currentColor" opacity=".25" />
  </svg>;
}

/** Housewarming: an arched doorway with marigold garland and welcome elements. */
function HouseArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="320" rx="155" ry="12" fill="currentColor" opacity=".06" />
    {/* house outline */}
    <path d="M120 320V195L240 100L360 195V320H120Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".05" />
    {/* roof */}
    <path d="M108 200L240 90L372 200" stroke="currentColor" strokeWidth="2.5" />
    {/* roof ridge line */}
    <path d="M240 90V320" stroke="currentColor" strokeWidth=".7" opacity=".2" />
    {/* chimney */}
    <path d="M285 125V95H310V128" stroke="currentColor" strokeWidth="2" />
    <path d="M281 95H314" stroke="currentColor" strokeWidth="3" />
    {/* front door — arched */}
    <path d="M208 320V224Q208 194 240 190Q272 194 272 224V320H208Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity=".08" />
    {/* door arch detail */}
    <path d="M212 224Q212 198 240 195Q268 198 268 224" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
    {/* door panels */}
    <rect x="213" y="250" width="27" height="30" rx="2" stroke="currentColor" strokeWidth=".8" opacity=".4" />
    <rect x="240" y="250" width="27" height="30" rx="2" stroke="currentColor" strokeWidth=".8" opacity=".4" />
    {/* door knob */}
    <circle cx="237" cy="277" r="3" fill="currentColor" opacity=".5" />
    {/* windows */}
    <rect x="130" y="230" width="50" height="45" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity=".06" />
    <path d="M130 253H180M155 230V275" stroke="currentColor" strokeWidth=".8" opacity=".4" />
    <rect x="300" y="230" width="50" height="45" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity=".06" />
    <path d="M300 253H350M325 230V275" stroke="currentColor" strokeWidth=".8" opacity=".4" />
    {/* step */}
    <path d="M200 320H280" stroke="currentColor" strokeWidth="3" />
    <path d="M192 323H288" stroke="currentColor" strokeWidth="4" />
    {/* marigold garland above door */}
    <path d="M175 215Q240 185 305 215" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
    {[179, 198, 218, 240, 262, 282, 301].map((x, i) => {
      const ys = [213, 202, 195, 192, 195, 202, 213];
      const y = ys[i];
      return <g key={x} transform={`translate(${x} ${y})`} fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <ellipse key={a} cy="-5" rx="3.5" ry="6" transform={`rotate(${a})`} opacity=".35" />)}
        <circle r="4" opacity=".5" />
      </g>;
    })}
    {/* botanical branches */}
    <path d="M65 290Q50 245 68 200Q82 160 103 135" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
    {[[66, 260, -30], [71, 230, -18], [80, 200, -8], [94, 167, 8]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".28"><ellipse cy="-10" rx="7" ry="15" /><ellipse cy="-10" rx="7" ry="15" transform="rotate(35)" opacity=".55" /></g>)}
    <path d="M415 290Q430 245 412 200Q398 160 377 135" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
    {[[414, 260, 30], [409, 230, 18], [400, 200, 8], [386, 167, -8]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".28"><ellipse cy="-10" rx="7" ry="15" /><ellipse cy="-10" rx="7" ry="15" transform="rotate(-35)" opacity=".55" /></g>)}
    {/* welcome mat */}
    <path d="M205 323H275V332Q275 337 240 337Q205 337 205 332Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity=".1" />
    <path d="M210 327H270" stroke="currentColor" strokeWidth=".8" opacity=".35" strokeDasharray="3 2" />
  </svg>;
}

/** Anniversary: two interlocking rings with botanical swags and infinity ribbon. */
function AnniversaryArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="318" rx="138" ry="10" fill="currentColor" opacity=".06" />
    {/* infinity figure-8 path */}
    <path d="M240 195C240 160 195 130 160 155C125 180 125 220 160 245C195 270 240 240 240 205C240 170 285 140 320 165C355 190 355 230 320 255C285 280 240 250 240 215" stroke="currentColor" strokeWidth="2.5" opacity=".55" />
    {/* left ring */}
    <circle cx="170" cy="200" r="55" stroke="currentColor" strokeWidth="2" opacity=".45" />
    <circle cx="170" cy="200" r="48" stroke="currentColor" strokeWidth=".8" opacity=".25" />
    {/* right ring */}
    <circle cx="310" cy="200" r="55" stroke="currentColor" strokeWidth="2" opacity=".45" />
    <circle cx="310" cy="200" r="48" stroke="currentColor" strokeWidth=".8" opacity=".25" />
    {/* floral sprays on rings */}
    {[[-38, -38], [38, -38], [-38, 38], [38, 38]].map(([dx, dy], i) => <g key={i} transform={`translate(${170 + dx} ${200 + dy})`} fill="currentColor" opacity=".35">
      {[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cy="-5" rx="3.5" ry="7" transform={`rotate(${a})`} />)}
      <circle r="3.5" opacity=".7" />
    </g>)}
    {[[-38, -38], [38, -38], [-38, 38], [38, 38]].map(([dx, dy], i) => <g key={i} transform={`translate(${310 + dx} ${200 + dy})`} fill="currentColor" opacity=".35">
      {[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cy="-5" rx="3.5" ry="7" transform={`rotate(${a})`} />)}
      <circle r="3.5" opacity=".7" />
    </g>)}
    {/* ribbon bow at top */}
    <path d="M210 148Q230 128 240 140Q250 128 270 148Q250 163 240 155Q230 163 210 148Z" fill="currentColor" opacity=".3" />
    <circle cx="240" cy="152" r="6" fill="currentColor" opacity=".45" />
    {/* botanical arch left */}
    <path d="M75 305Q58 255 73 205Q87 160 107 135" stroke="currentColor" strokeWidth="1.2" opacity=".42" />
    {[[75, 278, -28], [78, 248, -15], [84, 218, -4], [96, 188, 10]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".28"><ellipse cy="-9" rx="6" ry="13" /><ellipse cy="-9" rx="6" ry="13" transform="rotate(38)" opacity=".55" /></g>)}
    {/* botanical arch right */}
    <path d="M405 305Q422 255 407 205Q393 160 373 135" stroke="currentColor" strokeWidth="1.2" opacity=".42" />
    {[[405, 278, 28], [402, 248, 15], [396, 218, 4], [384, 188, -10]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".28"><ellipse cy="-9" rx="6" ry="13" /><ellipse cy="-9" rx="6" ry="13" transform="rotate(-38)" opacity=".55" /></g>)}
    {/* sparkle stars */}
    {[[240, 85, 1.1], [92, 145, .7], [388, 148, .7], [76, 310, .5], [404, 310, .5]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".5"><path d="M0-9 2.2-2.2 9 0 2.2 2.2 0 9-2.2 2.2-9 0-2.2-2.2Z" /></g>)}
  </svg>;
}

/** Remembrance: a tall candle with botanical sprigs, soft light, and quiet elegance. */
function RemembranceArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="318" rx="110" ry="9" fill="currentColor" opacity=".06" />
    {/* candle body */}
    <path d="M220 130V300Q220 310 240 310Q260 310 260 300V130Q255 122 240 120Q225 122 220 130Z" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="1.8" />
    {/* wax drips */}
    <path d="M220 155Q213 161 218 168Q223 175 220 180" stroke="currentColor" strokeWidth="1.5" opacity=".4" />
    <path d="M258 172Q265 178 263 186" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
    {/* candle top with wick */}
    <path d="M220 130Q230 120 240 118Q250 120 260 130" stroke="currentColor" strokeWidth="1.5" />
    <path d="M240 118V110" stroke="currentColor" strokeWidth="1.5" />
    {/* flame */}
    <path d="M240 108C233 100 230 88 235 76C238 68 242 64 240 56C238 64 244 68 245 76C250 88 247 100 240 108Z" fill="currentColor" opacity=".6" />
    <path d="M240 104C236 97 234 88 237 79C238 73 240 69 240 63C240 69 242 73 243 79C246 88 244 97 240 104Z" fill="white" opacity=".5" />
    {/* glow rings */}
    <circle cx="240" cy="78" r="22" stroke="currentColor" strokeWidth="1" opacity=".12" />
    <circle cx="240" cy="78" r="38" stroke="currentColor" strokeWidth=".7" opacity=".07" />
    {/* candle holder plate */}
    <path d="M218 308Q218 318 240 319Q262 318 262 308H218Z" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="240" cy="308" rx="32" ry="6" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity=".08" />
    {/* botanical left */}
    <path d="M122 300Q102 255 110 205Q118 162 135 138" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
    {[[122, 275, -25], [118, 245, -14], [118, 215, -4], [126, 183, 8]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".32"><ellipse cy="-10" rx="6" ry="14" /><ellipse cy="-10" rx="6" ry="14" transform="rotate(35)" opacity=".55" /></g>)}
    {/* botanical right */}
    <path d="M358 300Q378 255 370 205Q362 162 345 138" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
    {[[358, 275, 25], [362, 245, 14], [362, 215, 4], [354, 183, -8]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".32"><ellipse cy="-10" rx="6" ry="14" /><ellipse cy="-10" rx="6" ry="14" transform="rotate(-35)" opacity=".55" /></g>)}
    {/* garland at base */}
    <path d="M154 306Q240 295 326 306" stroke="currentColor" strokeWidth="1" opacity=".4" />
    {[164, 196, 228, 262, 296].map(x => <circle key={x} cx={x} cy={x === 228 ? 298 : 302} r="3.5" fill="currentColor" opacity=".35" />)}
    {/* quiet stars */}
    {[[80, 138, .8], [398, 142, .75], [90, 240, .5], [390, 240, .5], [240, 34, .6]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".4"><path d="M0-7 1.8-1.8 7 0 1.8 1.8 0 7-1.8 1.8-7 0-1.8-1.8Z" /></g>)}
  </svg>;
}

/** Other gatherings: a marigold arch with garland, lanterns, and warm invitation feel. */
function OtherGatheringArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="320" rx="158" ry="11" fill="currentColor" opacity=".06" />
    {/* arch frame */}
    <path d="M100 320V240Q100 130 240 110Q380 130 380 240V320" stroke="currentColor" strokeWidth="2" opacity=".35" />
    <path d="M118 320V244Q118 148 240 130Q362 148 362 244V320" stroke="currentColor" strokeWidth="1" opacity=".2" />
    {/* inner arch glow */}
    <path d="M135 320V250Q135 165 240 148Q345 165 345 250V320" fill="currentColor" opacity=".04" />
    {/* marigold garland across arch */}
    {/* left side of arch */}
    {[[106, 300, -18], [101, 265, -10], [100, 232, 0], [103, 200, 10], [112, 170, 20], [126, 143, 32]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(ang => <ellipse key={ang} cy="-5.5" rx="4" ry="7.5" transform={`rotate(${ang})`} opacity=".38" />)}
      <circle r="4.5" opacity=".55" />
    </g>)}
    {/* right side of arch */}
    {[[374, 300, 18], [379, 265, 10], [380, 232, 0], [377, 200, -10], [368, 170, -20], [354, 143, -32]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(ang => <ellipse key={ang} cy="-5.5" rx="4" ry="7.5" transform={`rotate(${ang})`} opacity=".38" />)}
      <circle r="4.5" opacity=".55" />
    </g>)}
    {/* top arch marigolds */}
    {[[162, 124, 50], [195, 112, 30], [220, 108, 12], [240, 107, 0], [260, 108, -12], [285, 112, -30], [318, 124, -50]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(ang => <ellipse key={ang} cy="-5" rx="3.5" ry="6.5" transform={`rotate(${ang})`} opacity=".35" />)}
      <circle r="4" opacity=".5" />
    </g>)}
    {/* hanging decorations */}
    {[[150, 120], [240, 107], [330, 120]].map(([x, y]) => <g key={x}>
      <path d={`M${x} ${y}V${y + 30}`} stroke="currentColor" strokeWidth=".8" opacity=".35" />
      <path d={`M${x} ${y + 30}C${x - 8} ${y + 22} ${x - 8} ${y + 35} ${x} ${y + 42}C${x + 8} ${y + 35} ${x + 8} ${y + 22} ${x} ${y + 30}Z`} fill="currentColor" opacity=".35" />
    </g>)}
    {/* stars */}
    {[[75, 100, .9], [405, 98, .8], [78, 210, .6], [402, 207, .6], [155, 70, .5], [325, 72, .5]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".45"><path d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" /></g>)}
  </svg>;
}

/** Conference: a presentation podium with microphone, screen/board, laurel branches, and scattered stars. */
function ConferenceArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="322" rx="148" ry="10" fill="currentColor" opacity=".06" />
    {/* presentation screen/board */}
    <rect x="100" y="68" width="280" height="168" rx="4" fill="currentColor" opacity=".06" stroke="currentColor" strokeWidth="2" />
    <rect x="108" y="76" width="264" height="152" rx="2" fill="currentColor" opacity=".35" stroke="currentColor" strokeWidth=".8" />
    {/* screen content lines */}
    <path d="M140 120H340" stroke="currentColor" strokeWidth="1.5" opacity=".25" />
    <path d="M140 138H300" stroke="currentColor" strokeWidth="1" opacity=".2" />
    <path d="M140 154H320" stroke="currentColor" strokeWidth="1" opacity=".18" />
    <path d="M140 170H280" stroke="currentColor" strokeWidth="1" opacity=".16" />
    {/* screen header bar */}
    <rect x="108" y="76" width="264" height="22" rx="2" fill="currentColor" opacity=".1" />
    <path d="M140 91H260" stroke="currentColor" strokeWidth="2" opacity=".4" />
    {/* screen stand */}
    <path d="M240 236V265" stroke="currentColor" strokeWidth="3" opacity=".45" />
    <path d="M210 265H270" stroke="currentColor" strokeWidth="2.5" opacity=".4" />
    {/* podium body */}
    <path d="M195 270Q195 260 205 258H275Q285 260 285 270V318H195Z" fill="currentColor" opacity=".09" stroke="currentColor" strokeWidth="1.8" />
    {/* podium top shelf */}
    <rect x="188" y="254" width="104" height="8" rx="2" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="1.2" />
    {/* podium panel detail */}
    <rect x="204" y="278" width="72" height="28" rx="2" stroke="currentColor" strokeWidth=".8" opacity=".3" />
    {/* microphone stand */}
    <path d="M240 255V228" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
    <path d="M230 228Q230 215 240 212Q250 215 250 228Z" fill="currentColor" opacity=".35" stroke="currentColor" strokeWidth="1.2" />
    {/* microphone head */}
    <ellipse cx="240" cy="210" rx="9" ry="13" fill="currentColor" opacity=".25" stroke="currentColor" strokeWidth="1.5" />
    {/* mic grille lines */}
    <path d="M232 206H248M232 210H248M232 214H248" stroke="currentColor" strokeWidth=".7" opacity=".35" />
    {/* laurel left */}
    <path d="M72 318Q55 270 68 218Q80 172 98 148" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
    {[[72, 295, -28], [70, 263, -16], [72, 233, -5], [80, 203, 8], [91, 173, 20]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".3"><ellipse cy="-10" rx="6.5" ry="14" /><ellipse cy="-10" rx="6.5" ry="14" transform="rotate(36)" opacity=".55" /></g>)}
    {/* laurel right */}
    <path d="M408 318Q425 270 412 218Q400 172 382 148" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
    {[[408, 295, 28], [410, 263, 16], [408, 233, 5], [400, 203, -8], [389, 173, -20]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".3"><ellipse cy="-10" rx="6.5" ry="14" /><ellipse cy="-10" rx="6.5" ry="14" transform="rotate(-36)" opacity=".55" /></g>)}
    {/* decorative stars */}
    {[[58, 120, .85], [422, 118, .8], [62, 230, .6], [418, 228, .6], [240, 42, .9], [155, 52, .55], [325, 50, .55]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".45"><path d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" /></g>)}
  </svg>;
}

/** Webinar: a laptop screen with video-call grid, wifi waves, and connecting network dots. */
function WebinarArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="322" rx="152" ry="10" fill="currentColor" opacity=".05" />
    {/* laptop base */}
    <path d="M108 282Q108 275 116 275H364Q372 275 372 282V290Q372 296 364 296H116Q108 296 108 290Z" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="1.5" />
    {/* laptop hinge line */}
    <path d="M164 275H316" stroke="currentColor" strokeWidth="2.5" opacity=".3" />
    {/* laptop screen body */}
    <path d="M148 100Q148 90 158 88H322Q332 90 332 100V276H148Z" fill="currentColor" opacity=".06" stroke="currentColor" strokeWidth="2" />
    {/* screen bezel inner */}
    <rect x="158" y="98" width="164" height="168" rx="2" fill="currentColor" opacity=".08" stroke="currentColor" strokeWidth=".8" />
    {/* video grid — 4 tiles (2x2) */}
    {[[162, 102], [245, 102], [162, 177], [245, 177]].map(([gx, gy], i) => <g key={i}>
      <rect x={gx} y={gy} width="76" height="68" rx="3" fill="currentColor" opacity=".08" stroke="currentColor" strokeWidth=".8" />
      {/* person silhouette in each tile */}
      <ellipse cx={gx + 38} cy={gy + 22} rx="13" ry="15" fill="currentColor" opacity=".18" />
      <path d={`M${gx + 15} ${gy + 62}Q${gx + 38} ${gy + 44} ${gx + 61} ${gy + 62}`} fill="currentColor" opacity=".14" />
    </g>)}
    {/* wifi signal waves above laptop */}
    {[28, 20, 12].map((r, i) => <path key={i} d={`M${240 - r * 3.2} ${88 - r * 1.5}Q240 ${88 - r * 2.8} ${240 + r * 3.2} ${88 - r * 1.5}`} stroke="currentColor" strokeWidth="2" opacity={.55 - i * .15} />)}
    {/* wifi dot */}
    <circle cx="240" cy="92" r="3.5" fill="currentColor" opacity=".6" />
    {/* connecting network dots — left side */}
    {[[72, 160], [55, 210], [80, 258]].map(([x, y], i) => <g key={i}>
      <circle cx={x} cy={y} r="5.5" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1" />
      <path d={`M${x + 6} ${y}L148 ${y < 200 ? 140 : 200}`} stroke="currentColor" strokeWidth=".8" strokeDasharray="3 3" opacity=".2" />
    </g>)}
    {/* connecting network dots — right side */}
    {[[408, 155], [425, 205], [400, 255]].map(([x, y], i) => <g key={i}>
      <circle cx={x} cy={y} r="5.5" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1" />
      <path d={`M${x - 6} ${y}L332 ${y < 200 ? 140 : 200}`} stroke="currentColor" strokeWidth=".8" strokeDasharray="3 3" opacity=".2" />
    </g>)}
    {/* decorative small dots */}
    {[[100, 90], [140, 68], [340, 68], [380, 92], [240, 52]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="currentColor" opacity=".25" />)}
    {/* stars */}
    {[[60, 100, .75], [420, 100, .7], [240, 35, .8]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".4"><path d="M0-7 1.8-1.8 7 0 1.8 1.8 0 7-1.8 1.8-7 0-1.8-1.8Z" /></g>)}
  </svg>;
}

/** Ladies Night: champagne glasses clinking, fairy lights, scattered stars, and roses. */
function LadiesNightArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="322" rx="150" ry="10" fill="currentColor" opacity=".06" />
    {/* fairy lights string across top */}
    <path d="M40 68Q120 55 200 68Q280 81 360 68Q400 62 440 68" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
    {/* light bulbs on string */}
    {[[60, 64], [100, 58], [150, 68], [200, 62], [240, 76], [280, 62], [330, 68], [380, 60], [420, 68]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}>
      <path d="M0 0V6" stroke="currentColor" strokeWidth=".8" opacity=".4" />
      <ellipse cy="11" rx="5" ry="7" fill="currentColor" opacity=".3" />
      <rect x="-3" y="7" width="6" height="3" rx="1" fill="currentColor" opacity=".4" />
    </g>)}
    {/* left champagne glass */}
    <path d="M168 300V220" stroke="currentColor" strokeWidth="2" opacity=".5" />
    <path d="M148 302H188" stroke="currentColor" strokeWidth="2.5" opacity=".5" />
    <path d="M158 222Q158 180 168 175Q178 180 178 222Q175 228 168 230Q161 228 158 222Z" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M158 185Q163 178 168 176Q173 178 178 185" stroke="currentColor" strokeWidth="1" opacity=".35" />
    {/* bubbles left glass */}
    {[[162, 215], [170, 205], [165, 195], [172, 210]].map(([x, y]) => <circle key={`bl${x}${y}`} cx={x} cy={y} r="2" fill="currentColor" opacity=".3" />)}
    {/* right champagne glass */}
    <path d="M312 300V220" stroke="currentColor" strokeWidth="2" opacity=".5" />
    <path d="M292 302H332" stroke="currentColor" strokeWidth="2.5" opacity=".5" />
    <path d="M302 222Q302 180 312 175Q322 180 322 222Q319 228 312 230Q305 228 302 222Z" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M302 185Q307 178 312 176Q317 178 322 185" stroke="currentColor" strokeWidth="1" opacity=".35" />
    {/* bubbles right glass */}
    {[[306, 215], [314, 205], [309, 195], [316, 210]].map(([x, y]) => <circle key={`br${x}${y}`} cx={x} cy={y} r="2" fill="currentColor" opacity=".3" />)}
    {/* clink sparkle at top */}
    <path d="M240 168L238 155M240 168L252 162M240 168L228 162M240 168L242 155" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
    <circle cx="240" cy="168" r="4" fill="currentColor" opacity=".5" />
    {/* roses left */}
    {[[105, 240], [80, 275]].map(([rx, ry]) => <g key={rx} transform={`translate(${rx} ${ry})`} fill="currentColor">
      {[0, 51, 102, 153, 204, 255, 306].map(a => <ellipse key={a} cy="-8" rx="6" ry="10" transform={`rotate(${a})`} opacity=".28" />)}
      <circle r="6" opacity=".4" />
    </g>)}
    {/* roses right */}
    {[[375, 240], [400, 275]].map(([rx, ry]) => <g key={rx} transform={`translate(${rx} ${ry})`} fill="currentColor">
      {[0, 51, 102, 153, 204, 255, 306].map(a => <ellipse key={a} cy="-8" rx="6" ry="10" transform={`rotate(${a})`} opacity=".28" />)}
      <circle r="6" opacity=".4" />
    </g>)}
    {/* leaf accents */}
    {[[92, 260, -20], [72, 290, 10], [388, 260, 20], [408, 290, -10]].map(([x, y, a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" opacity=".28"><ellipse cy="-10" rx="5.5" ry="13" /></g>)}
    {/* scattered stars */}
    {[[55, 130, .9], [425, 125, .85], [72, 200, .6], [408, 198, .6], [155, 44, .7], [325, 44, .7], [240, 38, .8]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".5"><path d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" /></g>)}
    {/* small sparkle dots */}
    {[[135, 155], [192, 135], [288, 135], [345, 155], [200, 95], [280, 95]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.5" fill="currentColor" opacity=".35" />)}
  </svg>;
}

/** Virtual Event: a globe with connection lines, speech bubbles, and digital decorative elements. */
function VirtualEventArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="322" rx="148" ry="10" fill="currentColor" opacity=".05" />
    {/* globe outline */}
    <circle cx="240" cy="190" r="108" fill="currentColor" opacity=".05" stroke="currentColor" strokeWidth="2" />
    <circle cx="240" cy="190" r="108" stroke="currentColor" strokeWidth=".8" opacity=".2" />
    {/* globe latitude lines */}
    <ellipse cx="240" cy="190" rx="108" ry="32" stroke="currentColor" strokeWidth=".9" opacity=".2" />
    <ellipse cx="240" cy="158" rx="88" ry="22" stroke="currentColor" strokeWidth=".7" opacity=".15" />
    <ellipse cx="240" cy="222" rx="88" ry="22" stroke="currentColor" strokeWidth=".7" opacity=".15" />
    {/* globe longitude lines */}
    <path d="M240 82Q280 140 280 190Q280 240 240 298" stroke="currentColor" strokeWidth=".9" opacity=".2" />
    <path d="M240 82Q200 140 200 190Q200 240 240 298" stroke="currentColor" strokeWidth=".9" opacity=".2" />
    <path d="M132 190Q186 170 240 170Q294 170 348 190" stroke="currentColor" strokeWidth=".7" opacity=".15" />
    {/* connection dots on globe */}
    {[[185, 152], [300, 170], [165, 210], [310, 225], [240, 140], [240, 248]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="currentColor" opacity=".35" stroke="currentColor" strokeWidth="1" />)}
    {/* connection lines between dots */}
    <path d="M185 152L300 170M300 170L310 225M185 152L165 210M165 210L240 248M240 140L300 170M240 140L185 152" stroke="currentColor" strokeWidth=".9" strokeDasharray="3 2" opacity=".25" />
    {/* speech bubble left */}
    <path d="M75 118Q75 103 87 100H142Q154 103 154 118V140Q154 153 142 153H104L94 165V153H87Q75 153 75 140Z" fill="currentColor" opacity=".08" stroke="currentColor" strokeWidth="1.5" />
    <path d="M88 120H140M88 132H130" stroke="currentColor" strokeWidth="1" opacity=".3" />
    {/* speech bubble right */}
    <path d="M326 108Q326 93 338 90H393Q405 93 405 108V130Q405 143 393 143H345L335 155V143H338Q326 143 326 130Z" fill="currentColor" opacity=".08" stroke="currentColor" strokeWidth="1.5" />
    <path d="M339 110H391M339 122H381" stroke="currentColor" strokeWidth="1" opacity=".3" />
    {/* connection lines from bubbles to globe */}
    <path d="M148 148L178 162" stroke="currentColor" strokeWidth=".8" strokeDasharray="2 3" opacity=".3" />
    <path d="M332 128L302 165" stroke="currentColor" strokeWidth=".8" strokeDasharray="2 3" opacity=".3" />
    {/* digital squares/pixels top */}
    {[[72, 62], [88, 48], [104, 62], [88, 76], [376, 56], [392, 42], [408, 56], [392, 70]].map(([x, y]) => <rect key={`${x}${y}`} x={x - 5} y={y - 5} width="10" height="10" rx="1.5" fill="currentColor" opacity=".2" />)}
    {/* small dots scattered */}
    {[[55, 190], [425, 188], [60, 255], [420, 250], [140, 305], [340, 305]].map(([x, y]) => <circle key={`d${x}`} cx={x} cy={y} r="3" fill="currentColor" opacity=".22" />)}
    {/* stars */}
    {[[50, 140, .8], [430, 135, .75], [240, 32, .9], [120, 35, .6], [360, 35, .6]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".45"><path d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" /></g>)}
  </svg>;
}

/** Kids Birthday: a playful cake with many candles, floating balloons, stars, and confetti. */
function KidsBirthdayArt() {
  return <svg viewBox="0 0 480 360" width="480" height="360" aria-hidden="true" focusable="false" data-decoration fill="none" style={{ display: "block", width: "100%", height: "auto" }}>
    <ellipse cx="240" cy="322" rx="155" ry="11" fill="currentColor" opacity=".07" />
    {/* cake bottom tier */}
    <path d="M80 248Q80 234 95 230H385Q400 234 400 248V318Q400 330 385 330H95Q80 330 80 318Z" fill="currentColor" opacity=".09" stroke="currentColor" strokeWidth="2" />
    {/* frosting drip bottom */}
    <path d="M80 248Q100 263 120 248Q140 233 160 248Q180 263 200 248Q220 233 240 248Q260 263 280 248Q300 233 320 248Q340 263 360 248Q380 233 400 248" stroke="currentColor" strokeWidth="2" />
    {/* dots on bottom tier */}
    {[115, 160, 205, 250, 295, 340].map(x => <circle key={x} cx={x} cy="285" r="5" fill="currentColor" opacity=".22" />)}
    {/* cake middle tier */}
    <path d="M118 178Q118 164 132 160H348Q362 164 362 178V234H118Z" fill="currentColor" opacity=".09" stroke="currentColor" strokeWidth="2" />
    {/* frosting drip middle */}
    <path d="M118 178Q136 192 154 178Q172 164 190 178Q208 192 226 178Q244 164 262 178Q280 192 298 178Q316 164 334 178Q352 192 362 178" stroke="currentColor" strokeWidth="2" />
    {/* wavy stripe on middle tier */}
    <path d="M120 205Q145 196 170 205Q195 214 220 205Q245 196 270 205Q295 214 320 205Q345 196 360 205" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
    {/* cake top tier */}
    <path d="M158 115Q158 102 170 99H310Q322 102 322 115V163H158Z" fill="currentColor" opacity=".09" stroke="currentColor" strokeWidth="2" />
    {/* frosting drip top */}
    <path d="M158 115Q174 128 190 115Q206 102 222 115Q238 128 254 115Q270 102 286 115Q302 128 322 115" stroke="currentColor" strokeWidth="2" />
    {/* candles — lots of them */}
    {[174, 196, 218, 240, 262, 284, 306].map((x, i) => <g key={x}>
      <rect x={x - 4} y={i % 2 === 0 ? 70 : 76} width="8" height="28" rx="3" fill="currentColor" opacity={i % 2 === 0 ? ".5" : ".38"} />
      {/* flame outer */}
      <path d={`M${x} ${i % 2 === 0 ? 64 : 70}C${x - 5} ${i % 2 === 0 ? 57 : 63} ${x - 4} ${i % 2 === 0 ? 48 : 54} ${x} ${i % 2 === 0 ? 45 : 51}C${x + 4} ${i % 2 === 0 ? 48 : 54} ${x + 5} ${i % 2 === 0 ? 57 : 63} ${x} ${i % 2 === 0 ? 64 : 70}Z`} fill="currentColor" opacity=".65" />
      {/* flame inner */}
      <path d={`M${x} ${i % 2 === 0 ? 62 : 68}C${x - 2} ${i % 2 === 0 ? 57 : 63} ${x} ${i % 2 === 0 ? 51 : 57} ${x} ${i % 2 === 0 ? 48 : 54}C${x + 2} ${i % 2 === 0 ? 51 : 57} ${x} ${i % 2 === 0 ? 57 : 63} ${x} ${i % 2 === 0 ? 62 : 68}Z`} fill="white" opacity=".55" />
    </g>)}
    {/* balloons */}
    {[[88, 108, 1], [66, 175, 0.85], [392, 112, 1], [414, 178, 0.85]].map(([bx, by, s], i) => <g key={i} transform={`translate(${bx} ${by}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="22" ry="28" fill="currentColor" opacity=".22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M0 28L2 42" stroke="currentColor" strokeWidth="1" opacity=".4" />
      <path d="M-5 -12C-8 -8 -6 0 0 0" stroke="white" strokeWidth="1.2" opacity=".35" />
    </g>)}
    {/* balloon strings */}
    <path d="M88 136Q85 165 78 195" stroke="currentColor" strokeWidth="1" opacity=".3" strokeDasharray="2 2" />
    <path d="M392 140Q395 168 402 196" stroke="currentColor" strokeWidth="1" opacity=".3" strokeDasharray="2 2" />
    {/* confetti scattered */}
    {[[112, 52, 30], [155, 38, -20], [210, 48, 45], [270, 40, -35], [328, 52, 25], [370, 38, -15], [52, 82, 50], [428, 80, -40], [140, 72, -25], [340, 68, 35]].map(([x, y, r]) => <rect key={`${x}${y}`} x={x - 4} y={y - 2} width="8" height="5" rx="1" fill="currentColor" opacity=".3" transform={`rotate(${r} ${x} ${y})`} />)}
    {/* star confetti */}
    {[[68, 62, .8], [172, 32, .75], [240, 28, .9], [308, 32, .75], [412, 58, .8], [132, 50, .6], [348, 48, .6]].map(([x, y, s]) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor" opacity=".55"><path d="M0-9 2.2-2.2 9 0 2.2 2.2 0 9-2.2 2.2-9 0-2.2-2.2Z" /></g>)}
  </svg>;
}

const artComponents: Partial<Record<string, () => ReactElement>> = {
  birthday: BirthdayArt,
  "baby-shower": CradleArt,
  naming: CradleArt,
  housewarming: HouseArt,
  anniversary: AnniversaryArt,
  remembrance: RemembranceArt,
  other: OtherGatheringArt,
  conference: ConferenceArt,
  webinar: WebinarArt,
  "ladies-night": LadiesNightArt,
  "virtual-event": VirtualEventArt,
  "kids-birthday": KidsBirthdayArt,
};

export function OccasionSvgArt({ occasion }: { occasion: OccasionId | string }) {
  const Component = artComponents[occasion];
  if (!Component) return null;
  return <Component />;
}

export function hasOccasionSvgArt(occasion: OccasionId | string): boolean {
  return occasion in artComponents;
}
