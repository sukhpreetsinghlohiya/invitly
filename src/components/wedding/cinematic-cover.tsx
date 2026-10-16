import Image from "next/image";
import { getCinematicTheme } from "@/data/cinematic-themes";
import { getDesign, guestWording } from "@/data/occasions";
import { formatEventDate } from "@/data/demo-invitation";
import { hasIndicText } from "@/lib/invitation-text";
import { TraditionSymbol } from "@/components/tradition-symbol";
import type { CinematicThemeId, Invitation } from "@/types/invitation";
import styles from "./cinematic.module.css";

export function CinematicCover({ invitation, theme, compact = false }: { invitation: Invitation; theme: CinematicThemeId; compact?: boolean }) {
  const design = getDesign(invitation);
  const selected = getCinematicTheme(theme);
  const names = invitation.couple.filter(Boolean);
  return <div className={styles.cover} data-cinematic-theme={theme} data-illustrated-cover={theme} data-compact={compact} data-motion={design.motion} data-palette={design.palette} data-typography={design.typography} data-decorations={design.decoration ? "on" : "off"} aria-hidden={compact || undefined}>
    {design.decoration && <Image src={`/images/cinematic/${selected.scene}.webp`} fill alt="" sizes={compact ? "(max-width: 600px) 90vw, 440px" : "100vw"} loading={compact ? "lazy" : "eager"} fetchPriority={compact ? "auto" : "high"} className={styles.scenery} data-scroll-depth={compact ? undefined : true} />}
    <div className={styles.shade} />
    <div className={styles.coverTop}><span>{invitation.initials}</span><span>A WEDDING CELEBRATION</span></div>
    <div className={styles.coverCopy} data-cover-reading-area>
      <TraditionSymbol invitation={invitation} />
      <p className={styles.overline} data-indic={hasIndicText(guestWording(invitation).cover) || undefined}>{guestWording(invitation).cover}</p>
      <div className={styles.coverNames} data-long-names={Math.max(...names.map(name => name.length), 0) > 18} data-indic={hasIndicText(names.join(" ")) || undefined}>{names.length ? names.map((name, index) => <span key={index}>{index > 0 && <em>&</em>}{name}</span>) : <span>Your names</span>}</div>
      <p className={styles.coverInvitation}>Invite you to celebrate their wedding</p>
      {invitation.blessing && <p className={styles.blessing} data-indic={hasIndicText(invitation.blessing) || undefined}>{invitation.blessing}</p>}
    </div>
    <div className={styles.coverBottom}><span className={styles.coverRule} /><p>{formatEventDate(invitation.weddingAt, invitation.timezone, { day: "numeric", month: "long", year: "numeric" })}</p><p data-indic={hasIndicText(invitation.city) || undefined}>{invitation.city}</p><span className={styles.coverScroll}>THE BEGINNING OF FOREVER</span></div>
  </div>;
}
