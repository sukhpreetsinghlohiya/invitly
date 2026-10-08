"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import styles from "./opening-transition.module.css";

export type OpeningPhase = "closed" | "opening" | "open";
const subscribe = () => () => {};

/** Keep the real cover in the same stage throughout the entrance. */
export function OpeningTransition({ phase, expressive, opening, opener, children }: { phase: OpeningPhase; expressive: boolean; opening: string; opener: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const content = phase === "closed" ? overlay.current : cover.current;
      if (!content) return;
      element.style.setProperty("--entrance-height", `${content.offsetHeight}px`);
      const paper = cover.current?.querySelector<HTMLElement>("[data-illustrated-cover],[data-occasion-sheet]");
      if (paper) element.style.setProperty("--opening-scene-height", `${Math.min(paper.offsetHeight, 680)}px`);
      element.dataset.measured = "true";
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (overlay.current) observer.observe(overlay.current);
    if (cover.current) observer.observe(cover.current);
    return () => observer.disconnect();
  }, [phase]);

  return <div ref={root} className={styles.stage} data-entrance-phase={phase} data-entrance-style={opening} style={{ "--entrance-duration": expressive ? "2200ms" : "1900ms" } as CSSProperties}>
    <div ref={cover} className={styles.cover} inert={hydrated && phase !== "open"} aria-hidden={hydrated && phase !== "open" ? true : undefined}>{children}</div>
    <div ref={overlay} className={styles.overlay}>{opener}</div>
    <noscript><style>{`.${styles.stage}{display:block!important;height:auto!important}.${styles.cover}{position:static!important;opacity:1!important;visibility:visible!important;transform:none!important}.${styles.overlay}{display:none!important}`}</style></noscript>
  </div>;
}
