"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./artwork-stage.module.css";

/** Fit the complete card, including long names, without cropping its artwork. */
export function ArtworkStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const surface = stage.current, card = paper.current;
    if (!surface || !card) return;
    const fit = () => {
      const scale = Math.min(1, Math.max(0, surface.clientHeight - 24) / Math.max(1, card.offsetHeight));
      card.style.setProperty("--artwork-scale", String(scale));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(surface);
    observer.observe(card);
    fit();
    return () => observer.disconnect();
  }, []);
  return <div ref={stage} className={`${styles.stage} ${className}`} data-artwork-stage><div ref={paper} className={styles.paper} data-artwork-paper>{children}</div></div>;
}
