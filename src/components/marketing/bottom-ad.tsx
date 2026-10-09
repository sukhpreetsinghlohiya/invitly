"use client";

import { useEffect, useRef } from "react";
import styles from "./bottom-ad.module.css";

export function BottomAd() {
  const slot = useRef<HTMLModElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    const element = slot.current;
    if (!element) return;
    let nearViewport = false;
    const requestAd = () => {
      if (!nearViewport || requested.current || element.getBoundingClientRect().width === 0) return;
      // Strict Mode and resize callbacks must not initialize the same slot twice.
      if (element.dataset.adsbygoogleStatus) return;
      requested.current = true;
      try {
        const adsWindow = window as Window & { adsbygoogle?: { push: (ad: Record<string, never>) => unknown } };
        (adsWindow.adsbygoogle ||= [] as Record<string, never>[]).push({});
      } catch {
        // A blocked or unavailable ad must not interrupt the invitation site.
        element.closest<HTMLElement>("[data-ad-placement]")?.setAttribute("hidden", "");
      }
    };
    const intersection = new IntersectionObserver(entries => {
      nearViewport = entries.some(entry => entry.isIntersecting);
      requestAd();
    }, { rootMargin: "200px" });
    const resize = new ResizeObserver(requestAd);
    intersection.observe(element);
    resize.observe(element);
    return () => { intersection.disconnect(); resize.disconnect(); };
  }, []);

  return <aside className={styles.placement} aria-label="Advertisement" data-ad-placement="homepage-bottom">
    <span className={styles.label}>Advertisement</span>
    <ins ref={slot} className={`adsbygoogle ${styles.slot}`} style={{ display: "block" }}
      data-ad-client="ca-pub-4727001093466194" data-ad-slot="3809079536"
      data-ad-format="auto" data-full-width-responsive="true" />
  </aside>;
}
