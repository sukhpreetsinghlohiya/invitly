"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { InvitationDesign } from "@/types/invitation";
import { hasIndicText } from "@/lib/invitation-text";
import styles from "./signature-cover.module.css";

/** The artwork stays server-rendered; only the two door leaves need client state. */
export function CoverReveal({ children, doors, motion = "gentle", names, date, coverText }: {
  children: ReactNode; doors?: ReactNode; motion?: InvitationDesign["motion"]; names: string; date: string; coverText: string;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">(doors ? "closed" : "open");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function open() {
    if (phase !== "closed") return;
    document.dispatchEvent(new Event("invitly:open"));
    const reduced = motion === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("opening");
    timer.current = setTimeout(() => {
      const document = frame.current?.ownerDocument;
      const focusStayedOnOpening = document && (document.activeElement === trigger.current || document.activeElement === document.body);
      setPhase("open");
      if (focusStayedOnOpening) frame.current?.closest<HTMLElement>("[data-signature-cover]")?.focus({ preventScroll: true });
    }, reduced ? 0 : 1650);
  }

  return <div ref={frame} className={styles.reveal} data-reveal-phase={phase}>
    <div className={styles.paper}>{children}</div>
    {doors && phase !== "open" && <div className={styles.portal} data-section="opening">
      <div className={styles.doorArtwork} aria-hidden="true">{doors}</div>
      <button ref={trigger} type="button" className={styles.openButton} onClick={open} aria-label="Open invitation" disabled={phase === "opening"} aria-busy={phase === "opening"}>
        <span className={styles.plaque} data-long-label={names.length > 50 || coverText.length > 90 || undefined}>{coverText && <span className={styles.plaqueEyebrow} data-indic={hasIndicText(coverText) || undefined}>{coverText}</span>}<span className={styles.plaqueNames} data-indic={hasIndicText(names) || undefined}>{names}</span><span className={styles.plaqueDate}>{date}</span><span className={styles.openHint}>Open invitation <span aria-hidden="true">↗</span></span></span>
      </button>
      <noscript><style>{`.${styles.portal}{display:none!important}.${styles.paper}{filter:none!important;transform:none!important}`}</style></noscript>
    </div>}
  </div>;
}
