"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BrandMark, Flower } from "@/components/brand";
import styles from "./wedding.module.css";
import { MarigoldToran, OccasionIllustration } from "../indian-art";
import type { OccasionId } from "@/types/invitation";

export function InvitationOpening({ names, initials, families, date, isDemo, coverText, closingText, decoration, showRsvp, motion = "gentle", remembrance = false, occasion = "wedding" }: {
  names: string; initials: string; families: string[]; date: string; isDemo: boolean; coverText: string; closingText: string; decoration: boolean; showRsvp: boolean; motion?: "gentle" | "expressive" | "none"; remembrance?: boolean; occasion?: OccasionId;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  useEffect(() => {
    if (phase !== "open") return;
    let animation: Animation | undefined;
    // Scroll only after React has removed the envelope from the document.
    // Scheduling from the timer can otherwise measure the old cover offset.
    const frame = requestAnimationFrame(() => {
      const invitation = document.getElementById("invitation");
      invitation?.focus({ preventScroll: true });
      invitation?.scrollIntoView({ behavior: "instant", block: "start" });
      if (invitation && motion !== "none" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animation = invitation.animate([
          { opacity: .35, transform: "translateY(12vh) scale(.94)", borderRadius: "24px" },
          { opacity: 1, transform: "none", borderRadius: "0px" },
        ], { duration: motion === "expressive" ? 460 : 360, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
    return () => { cancelAnimationFrame(frame); animation?.cancel(); };
  }, [phase, motion]);

  function openInvitation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (phase !== "closed") return;
    setPhase("opening");
    const reduced = motion === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timeout.current = setTimeout(() => setPhase("open"), reduced ? 0 : 560);
  }

  if (phase === "open") return null;
  return <section className={styles.opening} data-remembrance={remembrance} data-opening={phase === "opening"} data-section="opening" aria-label={`An invitation from ${names}`}>
    <div className={styles.openingTop}><Link href="/" className={styles.smallBrand} aria-label="Invitly home"><BrandMark /> invitly<span>.</span></Link><span>{isDemo ? "A DEMO CELEBRATION" : "AN INVITATION, JUST FOR YOU"}</span>{isDemo && <Link href="/templates">The collection <ArrowUpRight size={13} /></Link>}</div>
    {decoration && !remembrance && <div className={styles.openingToran} data-decoration><MarigoldToran /></div>}
    <div className={styles.openingIntro}><span className={styles.eyebrow}>{coverText}</span><p>{names || "You’re invited."}</p></div>
    <a href="#invitation" className={styles.envelope} onClick={openInvitation} aria-label="Open invitation" aria-busy={phase === "opening"}>
      <span className={styles.envelopeLetter}>{decoration && <OccasionIllustration occasion={occasion} className={styles.letterArt} />}<span>{coverText}</span><strong>{names}</strong><span>{date}</span></span>
      <span className={styles.envelopeFold} aria-hidden="true" />
      <span className={styles.envelopeFlap} aria-hidden="true">{decoration && <Flower />}</span>
      <span className={styles.seal} aria-hidden="true"><span>{initials || "I"}</span>{decoration && <Flower />}</span>
      <span className={styles.envelopeLabel}>{closingText}<br /><strong>{families.filter(Boolean).join(" & ") || names}</strong></span>
    </a>
    <a href="#invitation" className={styles.openLink} onClick={openInvitation}>Open invitation <ArrowUpRight size={15} /></a>
    <p className={styles.openingDate}>{date}</p><nav className={styles.openingShortcuts} aria-label="Quick invitation details"><a href="#celebrations">Schedule & directions</a>{showRsvp && <a href="#rsvp">RSVP</a>}</nav>
    <a href="#invitation" className={styles.skipOpening}>Scroll to explore <ArrowDown size={12} /></a>
  </section>;
}
