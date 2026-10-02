import type { OccasionId, ThemeId } from "@/types/invitation";
import styles from "./photo-story.module.css";

/** Original engraved canopy. No third-party frame or raster is embedded. */
export function PhotoAlbumFrame({ theme, occasion }: { theme: ThemeId; occasion: OccasionId }) {
  if (!["wedding", "engagement", "anniversary"].includes(occasion) || ["modern", "ocean", "champagne"].includes(theme)) return null;
  return <svg viewBox="0 0 1000 580" className={styles.canopy} aria-hidden="true" focusable="false" data-decoration>
    <path className={styles.canopyPaper} d="M15 10H985V42C936 35 938 88 885 75C826 59 827 114 776 91C722 63 704 109 650 82C592 53 566 88 500 46C434 88 408 53 350 82C296 109 278 63 224 91C173 114 174 59 115 75C62 88 64 35 15 42Z" />
    <path d="M18 18H982M20 34C68 36 64 78 113 67C176 48 174 99 224 82C278 55 296 100 351 74C408 46 435 78 500 37C565 78 592 46 649 74C704 100 722 55 776 82C826 99 824 48 887 67C936 78 932 36 980 34" fill="none" stroke="currentColor" strokeWidth="1" />
    {[115, 260, 405, 595, 740, 885].map((x, index) => <g key={x} transform={`translate(${x} ${index === 0 || index === 5 ? 32 : 37})`}>
      <path d="M-38 17Q-15 9 0-10Q15 9 38 17M-22 10q-13-18-23-10q7 17 23 10M22 10q13-18 23-10q-7 17-23 10" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <g className={styles.canopyFlower}>{[0,60,120,180,240,300].map(angle => <path key={angle} transform={`rotate(${angle})`} d="M0 0C-14-9-9-24 0-25C9-24 14-9 0 0Z" />)}<circle r="4" /></g>
    </g>)}
    {[false, true].map(right => <g key={String(right)} transform={right ? "translate(1000 0) scale(-1 1)" : undefined}>
      <g className={styles.hangingBud}>
        <path d="M42 54V165M42 94l-4 5 4 5 4-5Z" fill="none" stroke="currentColor" />
        <path d="M42 161C25 166 17 189 42 205C67 189 59 166 42 161ZM42 205v22m-5-17v12m10-12v12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M42 169Q24 183 42 199Q60 183 42 169ZM31 182h22M42 162v40" fill="none" stroke="currentColor" />
        <circle cx="42" cy="231" r="2" fill="currentColor" />
      </g>
      <path d="M20 276Q30 262 21 246M21 260Q3 251 9 241Q25 242 21 260M22 269Q40 263 34 252Q21 254 22 269" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </g>)}
  </svg>;
}
