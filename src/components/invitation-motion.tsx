"use client";

import { useEffect, useRef } from "react";
import type { InvitationDesign, ThemeId } from "@/types/invitation";

/** Shared observers; every section remains readable without JavaScript. */
export function InvitationMotion({ theme, motion = "gentle" }: { theme: ThemeId; motion?: InvitationDesign["motion"] }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = marker.current?.closest("[data-invitation-root]");
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const watched = new Set<Element>();
    const artVisibility = new Map<Element, boolean>();
    const allowed = () => motion !== "none" && !preference.matches && !document.hidden;
    const updateArt = () => artVisibility.forEach((visible, element) => {
      const active = allowed() && visible && !element.hasAttribute("data-art-quiet");
      element.setAttribute(element.hasAttribute("data-ceremony-art") ? "data-art-active" : "data-cover-art-active", String(active));
    });
    const artObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => artVisibility.set(entry.target, entry.isIntersecting));
      updateArt();
    }, { threshold: 0 });
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        entry.target.setAttribute("data-revealed", "true");
        if (!allowed() || entry.target.contains(document.activeElement)) continue;
        const parts = [...entry.target.querySelectorAll("[data-reveal-content] > *")];
        const targets = parts.length ? parts : [entry.target];
        targets.forEach((element, index) => {
          const distance = motion === "expressive" ? 24 : 14;
          const transform = theme === "modern" || theme === "lotus" ? `translateY(${distance / 2}px)` : `translateY(${distance}px)`;
          const animation = element.animate([{ opacity: .3, transform }, { opacity: 1, transform: "none" }], {
            duration: motion === "expressive" ? 680 : 500,
            delay: Math.min(index, 5) * 65,
            easing: "cubic-bezier(.2,.75,.25,1)",
            fill: "backwards",
          });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      }
    }, { threshold: 0, rootMargin: "0px 0px -28px 0px" });
    const discover = () => {
      root.querySelectorAll("[data-reveal]").forEach(element => {
        if (watched.has(element)) return;
        watched.add(element);
        // First-screen content is visible immediately, including keyboard focus.
        if (element.getBoundingClientRect().top >= window.innerHeight - 28) observer.observe(element);
      });
      root.querySelectorAll("[data-ceremony-art], [data-illustrated-cover], [data-occasion-sheet]").forEach(element => {
        if (artVisibility.has(element)) return;
        artVisibility.set(element, false);
        artObserver.observe(element);
      });
      watched.forEach(element => { if (!root.contains(element)) { observer.unobserve(element); watched.delete(element); } });
      artVisibility.forEach((_, element) => { if (!root.contains(element)) { artObserver.unobserve(element); artVisibility.delete(element); } });
    };
    const synchronize = () => {
      if (!allowed()) { animations.forEach(animation => animation.cancel()); animations.clear(); }
      updateArt();
    };
    discover();
    // The host can add functions or change artwork while the live preview is open.
    const mutations = new MutationObserver(discover);
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    return () => {
      observer.disconnect(); artObserver.disconnect(); mutations.disconnect();
      preference.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
      animations.forEach(animation => animation.cancel());
      artVisibility.forEach((_, element) => element.setAttribute(element.hasAttribute("data-ceremony-art") ? "data-art-active" : "data-cover-art-active", "false"));
    };
  }, [theme, motion]);
  return <span hidden ref={marker} />;
}
