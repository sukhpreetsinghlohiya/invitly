import Link from "next/link";
import { ArrowDown } from "lucide-react";
import type { Invitation, ThemeId } from "@/types/invitation";
import { formatEventDate } from "@/data/demo-invitation";
import { getDesign, guestWording } from "@/data/occasions";
import { IllustratedCover } from "./illustrated-cover";
import { CoverReveal } from "./cover-reveal";
import { SignatureDoors } from "./signature-doors";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/great-vibes/latin-400.css";
import styles from "./signature-cover.module.css";

export function SignatureCover({ invitation, theme, isDemo, showRsvp }: { invitation: Invitation; theme: ThemeId; isDemo: boolean; showRsvp: boolean }) {
  const design = getDesign(invitation);
  const names = invitation.couple.filter(Boolean).join(" & ") || "You’re invited";
  const doors = (!design.opening || design.opening.style === "theme") && design.decoration && (theme === "royal" || theme === "mehfil");
  return <section id="invitation" tabIndex={-1} className={styles.stage} data-signature-cover={theme} data-cover-palette={design.palette} data-section="cover" aria-label={`An invitation for ${names}`}>
    {!isDemo && <div className={styles.topline}><Link href="/" prefetch={false}>INVITLY</Link><span>AN INVITATION, JUST FOR YOU</span></div>}
    <CoverReveal key={`${theme}-${design.decoration}-${design.opening?.style}`} coverText={guestWording(invitation).cover} names={names} date={formatEventDate(invitation.weddingAt, invitation.timezone, { day: "numeric", month: "long", year: "numeric" })} motion={design.motion} doors={doors ? <SignatureDoors lantern={theme === "mehfil"} /> : undefined}><IllustratedCover invitation={invitation} theme={theme} /></CoverReveal>
    <nav className={styles.quickLinks} aria-label="Quick invitation details"><a href="#celebrations">Schedule & directions <ArrowDown size={13} /></a>{showRsvp && <a href="#rsvp">RSVP <ArrowDown size={13} /></a>}</nav>
  </section>;
}
