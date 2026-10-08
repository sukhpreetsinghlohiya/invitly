"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { getDesign } from "@/data/occasions";
import { formatEventDate } from "@/data/demo-invitation";
import { openingStyles, type AnimatedOpeningStyle } from "@/data/invitation-openings";
import { hasIndicText } from "@/lib/invitation-text";
import type { Invitation } from "@/types/invitation";
import { OpeningScene } from "./opening-scene";
import styles from "./animated-opening.module.css";

export function AnimatedOpening({ invitation, style }: { invitation: Invitation; style: AnimatedOpeningStyle }) {
  const design = getDesign(invitation);
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const root = useRef<HTMLElement>(null);
  const destination = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveFocus = useRef(true);
  const names = invitation.couple.filter(Boolean).join(" & ") || "You’re invited";
  const line = design.opening?.line ?? "An invitation, just for you";
  const date = invitation.weddingAt || invitation.functions.find(event => event.visibility !== "hidden")?.startsAt || "";
  const motion = invitation.occasion === "remembrance" ? "none" : design.motion || "gentle";

  useEffect(() => {
    const replay = () => {
      clearTimeout(timer.current); setPhase("closed");
      requestAnimationFrame(() => { root.current?.scrollIntoView({ behavior: "instant", block: "start" }); root.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); });
    };
    document.addEventListener("invitly:replay-opening", replay);
    return () => { clearTimeout(timer.current); document.removeEventListener("invitly:replay-opening", replay); };
  }, []);

  useEffect(() => {
    if (phase !== "open" || !moveFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const target = destination.current;
      if (!target?.isConnected) return;
      const temporary = !target.hasAttribute("tabindex");
      if (temporary) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true }); target.scrollIntoView({ behavior: "instant", block: "start" });
      if (temporary) target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  function open(skip = false) {
    if (phase === "open" || (phase === "opening" && !skip)) return;
    clearTimeout(timer.current);
    destination.current = root.current?.closest("[data-invitation-root]")?.querySelector<HTMLElement>("#invitation,[data-section=cover]") || null;
    moveFocus.current = true;
    if (!skip) document.dispatchEvent(new Event("invitly:open"));
    if (skip || motion === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhase("open"); return; }
    setPhase("opening");
    timer.current = setTimeout(() => {
      const active = document.activeElement;
      moveFocus.current = !active || active === document.body || Boolean(root.current?.contains(active));
      setPhase("open");
    }, motion === "expressive" ? 2200 : 1900);
  }

  if (phase === "open") return null;
  return <section ref={root} className={styles.opening} data-section="opening" data-opening-style={style} data-opening-phase={phase} data-motion={motion} data-palette={design.palette} aria-label={`${openingStyles.find(item => item.id === style)?.label} invitation opening`} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); open(true); } }}>
    <div className={styles.card}>
      <OpeningScene style={style} phase={phase} />
      <div className={styles.copy}><h2 data-indic={hasIndicText(names) || undefined}>{names}</h2>{line && <p className={styles.line} data-indic={hasIndicText(line) || undefined}>{line}</p>}<p className={styles.date}>{formatEventDate(date, invitation.timezone, { day: "numeric", month: "long", year: "numeric" })}</p></div>
      <div className={styles.controls}><button type="button" className={styles.open} onClick={() => open()} disabled={phase === "opening"} aria-busy={phase === "opening"}>Open invitation <ArrowUpRight size={17} aria-hidden="true" /></button><button type="button" className={styles.skip} onClick={() => open(true)}>Skip opening <ArrowDown size={14} aria-hidden="true" /></button></div>
    </div>
    <noscript><style>{`.${styles.opening}{display:none!important}`}</style></noscript>
  </section>;
}
