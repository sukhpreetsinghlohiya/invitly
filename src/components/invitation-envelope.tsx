"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getDesign, getOccasion } from "@/data/occasions";
import { formatEventDate } from "@/data/demo-invitation";
import { hasIndicText } from "@/lib/invitation-text";
import { ArchiveOrnament } from "@/components/archive-ornament";
import type { Invitation, InvitationOpening } from "@/types/invitation";
import styles from "./invitation-envelope.module.css";

function SealIcon({ icon, initials }: { icon: InvitationOpening["icon"]; initials: string }) {
  if (icon === "monogram") return <span className={styles.monogram} data-long={initials.length > 4 || undefined} data-indic={hasIndicText(initials) || undefined}>{initials}</span>;
  return <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
    {icon === "rings" ? <g fill="none" stroke="currentColor" strokeWidth="1.35"><ellipse cx="24" cy="32" rx="12" ry="15" transform="rotate(-20 24 32)" /><ellipse cx="36" cy="32" rx="12" ry="15" transform="rotate(20 36 32)" /><path d="m26 15 4-5 4 5-4 5Z" /><path d="m10 13 2 2m36-2-2 2M30 4v3" strokeWidth=".8" /></g>
      : <g fill="none" stroke="currentColor" strokeWidth="1.2">{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} transform={`rotate(${angle} 30 30)`} d="M30 25C19 16 23 7 30 9C37 7 41 16 30 25Z" />)}<circle cx="30" cy="30" r="6" /><circle cx="30" cy="30" r="2" /></g>}
  </svg>;
}

/** A separate, optional opening; it never hides or duplicates the invitation content. */
export function InvitationEnvelope({ invitation }: { invitation: Invitation }) {
  const design = getDesign(invitation);
  if (design.opening?.style !== "envelope") return null;
  return <Envelope key={`${design.opening.icon}:${design.opening.line}:${design.palette}`} invitation={invitation} />;
}

function Envelope({ invitation }: { invitation: Invitation }) {
  const design = getDesign(invitation);
  const opening = design.opening;
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const section = useRef<HTMLElement>(null);
  const target = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveFocus = useRef(true);
  const names = invitation.couple.filter(Boolean).join(" & ");
  const initials = invitation.initials || invitation.couple.filter(Boolean).map(name => Array.from(name.trim())[0] || "").join(" ");
  const occasion = getOccasion(invitation.occasion);
  const motion = occasion.id === "remembrance" ? "none" : design.motion || "gentle";
  const date = invitation.weddingAt || invitation.functions.find(item => item.visibility !== "hidden")?.startsAt || "";
  const dateLabel = formatEventDate(date, invitation.timezone, { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (phase !== "open" || !moveFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const destination = target.current;
      if (!destination?.isConnected) return;
      const temporaryTabIndex = !destination.hasAttribute("tabindex");
      if (temporaryTabIndex) destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
      destination.scrollIntoView({ behavior: "instant", block: "start" });
      if (temporaryTabIndex) destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  function findDestination() {
    const root = section.current?.closest("[data-invitation-root]") || section.current?.closest("main,article,[data-invitation]") || section.current?.parentElement;
    target.current = root?.querySelector<HTMLElement>("#invitation,[data-section=cover]") || null;
  }

  function open(skip = false) {
    if (phase === "open" || (phase === "opening" && !skip)) return;
    findDestination();
    if (timer.current) clearTimeout(timer.current);
    moveFocus.current = true;
    const instant = skip || motion === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (instant) { setPhase("open"); return; }
    setPhase("opening");
    timer.current = setTimeout(() => {
      const active = section.current?.ownerDocument.activeElement;
      moveFocus.current = !active || active === document.body || Boolean(section.current?.contains(active));
      setPhase("open");
    }, motion === "expressive" ? 1050 : 850);
  }

  if (opening?.style !== "envelope" || phase === "open") return null;
  return <section ref={section} className={styles.opening} data-section="opening" data-envelope-phase={phase} data-motion={motion} data-palette={design.palette} data-artwork={design.decoration ? "on" : "off"} aria-label="Your sealed invitation">
    <div className={styles.introduction}><span>{occasion.id === "remembrance" ? "A personal invitation" : "For a day to remember"}</span><h2 data-long={names.length > 45 || undefined} data-indic={hasIndicText(names) || undefined}>{names || "You’re invited"}</h2></div>
    <button className={styles.envelope} type="button" onClick={() => open()} disabled={phase === "opening"} aria-label="Break the seal and open invitation" aria-busy={phase === "opening"}>
      <span className={styles.back} aria-hidden="true" />
      <span className={styles.letter} aria-hidden="true"><span>{occasion.name}</span><strong data-indic={hasIndicText(names) || undefined}>{names || "You’re invited"}</strong><span>{dateLabel}</span></span>
      <span className={styles.sideLeft} aria-hidden="true" /><span className={styles.sideRight} aria-hidden="true" />
      <span className={styles.lowerFold} aria-hidden="true">{design.decoration && <ArchiveOrnament kind="branch" className={styles.embossedBranch} />}</span>
      <span className={styles.flap} aria-hidden="true"><span className={styles.flapLining} /></span>
      <span className={styles.seal} aria-hidden="true"><span className={styles.sealRim} />{design.decoration && <SealIcon icon={opening.icon || "rings"} initials={initials} />}</span>
      <span className={styles.address} aria-hidden="true">With warm wishes<span>{initials || "Invitly"}</span></span>
    </button>
    {opening.line && <p className={styles.message} data-indic={hasIndicText(opening.line) || undefined}>{opening.line}</p>}
    <button type="button" className={styles.openLink} onClick={() => open()} disabled={phase === "opening"}>Open invitation <ArrowUpRight size={15} aria-hidden="true" /></button>
    {dateLabel && <p className={styles.date}>{dateLabel}</p>}
    <button type="button" className={styles.skip} onClick={() => open(true)}>Skip opening <ArrowDown size={13} aria-hidden="true" /></button>
    <noscript><style>{`.${styles.opening}{display:none!important}`}</style></noscript>
  </section>;
}
