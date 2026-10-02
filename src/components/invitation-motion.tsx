"use client";

import { useEffect, useRef } from "react";
import type { InvitationDesign, ThemeId } from "@/types/invitation";

/** One observer, no scroll handlers. Content stays visible if JS or animation fails. */
export function InvitationMotion({ theme, motion = "gentle" }: { theme: ThemeId; motion?: InvitationDesign["motion"] }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = marker.current?.closest("[data-invitation-root]");
    if (!root || motion === "none" || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        entry.target.setAttribute("data-revealed", "true");
        // Never animate already visible first-screen content or a focused control.
        if (preference.matches || entry.target.contains(document.activeElement)) continue;
        const distance = motion === "expressive" ? 22 : 12;
        const transform = theme === "modern" || theme === "lotus" ? `translateY(${distance / 2}px)`
          : theme === "mehfil" || theme === "champagne" ? "scale(.985)"
          : `translateY(${distance}px)`;
        const animation = entry.target.animate([{ opacity: .45, transform }, { opacity: 1, transform: "none" }], {
          duration: motion === "expressive" ? 560 : 380, easing: "cubic-bezier(.2,.75,.25,1)",
        });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    root.querySelectorAll("[data-reveal]").forEach(element => {
      if (element.getBoundingClientRect().top >= window.innerHeight - 24) observer.observe(element);
    });
    const reduce = () => { if (preference.matches) { animations.forEach(animation => animation.cancel()); animations.clear(); } };
    preference.addEventListener("change", reduce);
    return () => { observer.disconnect(); preference.removeEventListener("change", reduce); animations.forEach(animation => animation.cancel()); };
  }, [theme, motion]);
  return <span hidden ref={marker} />;
}
