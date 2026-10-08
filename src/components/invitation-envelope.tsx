"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { OpeningTransition, type OpeningPhase } from "./opening-transition";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getDesign, getOccasion } from "@/data/occasions";
import { formatEventDate } from "@/data/demo-invitation";
import { hasIndicText } from "@/lib/invitation-text";
import { openingSceneAssets } from "@/data/opening-scenes";
import type { Invitation, InvitationOpening } from "@/types/invitation";
import styles from "./invitation-envelope.module.css";
import { AnimatedOpening } from "./animated-opening";

function SealIcon({ icon, initials }: { icon: InvitationOpening["icon"]; initials: string }) {
  if (icon === "monogram") return <span className={styles.monogram} data-long={initials.length > 4 || undefined} data-indic={hasIndicText(initials) || undefined}>{initials}</span>;
  return <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
    {icon === "rings" ? <g fill="none" stroke="currentColor" strokeWidth="1.35"><ellipse cx="24" cy="32" rx="12" ry="15" transform="rotate(-20 24 32)" /><ellipse cx="36" cy="32" rx="12" ry="15" transform="rotate(20 36 32)" /><path d="m26 15 4-5 4 5-4 5Z" /><path d="m10 13 2 2m36-2-2 2M30 4v3" strokeWidth=".8" /></g>
      : <g fill="none" stroke="currentColor" strokeWidth="1.2">{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} transform={`rotate(${angle} 30 30)`} d="M30 25C19 16 23 7 30 9C37 7 41 16 30 25Z" />)}<circle cx="30" cy="30" r="6" /><circle cx="30" cy="30" r="2" /></g>}
  </svg>;
}

/** The selected entrance reveals the real cover without duplicating it. */
export function InvitationEnvelope({ invitation, children }: { invitation: Invitation; children: ReactNode }) {
  const design = getDesign(invitation);
  if (!design.opening || design.opening.style === "theme" || design.opening.style === "none") return children;
  return <Entrance key={`${design.opening.style}:${design.palette}`} invitation={invitation}>{children}</Entrance>;
}

function Entrance({ invitation, children }: { invitation: Invitation; children: ReactNode }) {
  const design = getDesign(invitation);
  const [phase, setPhase] = useState<OpeningPhase>("closed");
  const style = design.opening!.style;
  const opener = style === "envelope" ? <Envelope invitation={invitation} onPhaseChange={setPhase} /> : <AnimatedOpening invitation={invitation} style={style as Exclude<InvitationOpening["style"], "theme" | "none" | "envelope">} onPhaseChange={setPhase} />;
  return <OpeningTransition phase={phase} opening={style} expressive={design.motion === "expressive"} opener={opener}>{children}</OpeningTransition>;
}

function Envelope({ invitation, onPhaseChange }: { invitation: Invitation; onPhaseChange: (phase: OpeningPhase) => void }) {
  const design = getDesign(invitation);
  const opening = design.opening;
  const [phase, updatePhase] = useState<OpeningPhase>("closed");
  function setPhase(value: OpeningPhase) { updatePhase(value); onPhaseChange(value); }
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
    const replay = () => { if (timer.current) clearTimeout(timer.current); updatePhase("closed"); onPhaseChange("closed"); requestAnimationFrame(() => { section.current?.scrollIntoView({ behavior: "instant", block: "start" }); section.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); }); };
    document.addEventListener("invitly:replay-opening", replay);
    return () => document.removeEventListener("invitly:replay-opening", replay);
  }, [onPhaseChange]);
  useEffect(() => {
    if (phase !== "open" || !moveFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const destination = target.current;
      if (!destination?.isConnected) return;
      const temporaryTabIndex = !destination.hasAttribute("tabindex");
      if (temporaryTabIndex) destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
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
    if (!skip) document.dispatchEvent(new Event("invitly:open"));
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
    }, motion === "expressive" ? 2200 : 1900);
  }

  if (opening?.style !== "envelope" || phase === "open") return null;
  return <section ref={section} className={styles.opening} style={{ "--envelope-texture": `url("${openingSceneAssets.paper}")` } as CSSProperties} data-section="opening" data-opening-style="envelope" data-envelope-phase={phase} data-motion={motion} data-palette={design.palette} data-artwork={design.decoration ? "on" : "off"} aria-label="Your sealed invitation" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); open(true); } }}>
    <div className={styles.card}>
    <button className={styles.envelope} type="button" onClick={() => open()} disabled={phase === "opening"} aria-label="Break the seal and open invitation" aria-busy={phase === "opening"}>
      <span className={styles.back} aria-hidden="true" />
      <span className={styles.sideLeft} data-opening-part="left" aria-hidden="true" /><span className={styles.sideRight} data-opening-part="right" aria-hidden="true" />
      <span className={styles.lowerFold} aria-hidden="true" />
      <span className={styles.flap} data-opening-part="flap" aria-hidden="true"><span className={styles.flapLining} /></span>
      <svg className={styles.foldLines} viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0 150 240 300 0M0 400 113 235M300 400 187 235" /><path d="M0 2 150 242 300 2M1 400 114 235M299 400 186 235" /></svg>
      <span className={styles.seal} data-opening-part="center" aria-hidden="true"><span className={styles.sealRim} />{design.decoration && <SealIcon icon={opening.icon || "rings"} initials={initials} />}</span>
    </button>
    <div className={styles.introduction}><h2 data-long={names.length > 45 || undefined} data-indic={hasIndicText(names) || undefined}>{names || "You’re invited"}</h2>
    {opening.line && <p className={styles.message} data-indic={hasIndicText(opening.line) || undefined}>{opening.line}</p>}
    {dateLabel && <p className={styles.date}>{dateLabel}</p>}</div>
    <div className={styles.controls}>
    <button type="button" className={styles.openLink} onClick={() => open()} disabled={phase === "opening"}>Open invitation <ArrowUpRight size={15} aria-hidden="true" /></button>
    <button type="button" className={styles.skip} onClick={() => open(true)}>Skip opening <ArrowDown size={13} aria-hidden="true" /></button>
    </div></div>
    <noscript><style>{`.${styles.opening}{display:none!important}`}</style></noscript>
  </section>;
}
