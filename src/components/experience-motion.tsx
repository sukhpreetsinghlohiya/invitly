"use client";

import { useEffect, useRef } from "react";
import styles from "./experience-motion.module.css";
import "./experience-motion.css";

/** Native scrolling with small, viewport-bound depth effects on mouse and touch. */
export function ExperienceMotion({ enabled = true }: { enabled?: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = marker.current?.closest<HTMLElement>("[data-experience-motion],[data-invitation-root]");
    if (!root || !enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const animations = new Set<Animation>();
    let frame = 0;
    let pointerFrame = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    const depths = new Set<HTMLElement>();
    const visible = new Set<HTMLElement>();
    const animated = new WeakSet<Element>();
    const canMove = () => !reduced.matches && !document.hidden;
    const renderDepth = () => {
      frame = 0;
      const height = window.innerHeight;
      visible.forEach(element => {
        const rect = element.getBoundingClientRect();
        const previousShift = parseFloat(element.style.getPropertyValue("--scroll-shift")) || 0;
        const progress = Math.max(-1, Math.min(1, (height / 2 - (rect.top - previousShift) - rect.height / 2) / height));
        element.style.setProperty("--scroll-shift", `${canMove() ? progress * (fine.matches ? 24 : 10) : 0}px`);
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(renderDepth); };
    const depthObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target as HTMLElement) : visible.delete(entry.target as HTMLElement));
      schedule();
    }, { rootMargin: "80px" });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (!canMove() || entry.target.contains(document.activeElement)) return;
        const parts = entry.target.querySelectorAll("[data-stagger] > span");
        const targets = parts.length ? [...parts] : [entry.target];
        targets.forEach((element, index) => {
          const animation = element.animate([
            { opacity: .35, transform: "translateY(22px)", clipPath: "inset(0 0 12% 0)" },
            { opacity: 1, transform: "translateY(0)", clipPath: "inset(0 0 0 0)" },
          ], { duration: 780, delay: Math.min(index, 5) * 85, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      });
    }, { rootMargin: "0px 0px -24px 0px" });
    const discover = () => {
      root.querySelectorAll<HTMLElement>("[data-scroll-depth]").forEach(element => {
        if (!depths.has(element)) { depths.add(element); depthObserver.observe(element); }
      });
      // InvitationMotion owns invitation reveals; this observer is for marketing.
      if (root.hasAttribute("data-experience-motion")) root.querySelectorAll("[data-reveal]").forEach(element => {
        if (!animated.has(element)) { animated.add(element); revealObserver.observe(element); }
      });
      depths.forEach(element => { if (!root.contains(element)) { depthObserver.unobserve(element); depths.delete(element); visible.delete(element); } });
    };
    const drawPointer = () => {
      pointerFrame = 0;
      x += (targetX - x) * .24; y += (targetY - y) * .24;
      if (cursor.current) cursor.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > .5) pointerFrame = requestAnimationFrame(drawPointer);
    };
    const hidePointer = () => { if (cursor.current) cursor.current.dataset.visible = "false"; };
    const pointerMove = (event: PointerEvent) => {
      if (!canMove() || !fine.matches || event.pointerType !== "mouse" || window.self !== window.top) return hidePointer();
      const ring = cursor.current;
      if (!ring) return;
      targetX = event.clientX; targetY = event.clientY;
      if (ring.dataset.visible !== "true") { x = targetX; y = targetY; }
      ring.dataset.visible = "true";
      ring.dataset.interactive = String(Boolean((event.target as Element).closest("a,button,select,input,textarea,summary")));
      if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
    };
    const synchronize = () => {
      if (!canMove()) {
        animations.forEach(animation => animation.cancel()); animations.clear();
        depths.forEach(element => element.style.removeProperty("--scroll-shift"));
        cancelAnimationFrame(pointerFrame); pointerFrame = 0; hidePointer();
      }
      if (!fine.matches) hidePointer();
      schedule();
    };
    discover();
    const mutationObserver = new MutationObserver(discover);
    mutationObserver.observe(root, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    root.addEventListener("pointermove", pointerMove, { passive: true });
    root.addEventListener("pointerleave", hidePointer);
    root.addEventListener("focusin", hidePointer);
    document.addEventListener("visibilitychange", synchronize);
    reduced.addEventListener("change", synchronize);
    fine.addEventListener("change", synchronize);
    return () => {
      depthObserver.disconnect(); revealObserver.disconnect(); mutationObserver.disconnect();
      cancelAnimationFrame(frame); cancelAnimationFrame(pointerFrame);
      animations.forEach(animation => animation.cancel());
      depths.forEach(element => element.style.removeProperty("--scroll-shift"));
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      root.removeEventListener("pointermove", pointerMove); root.removeEventListener("pointerleave", hidePointer); root.removeEventListener("focusin", hidePointer);
      document.removeEventListener("visibilitychange", synchronize);
      reduced.removeEventListener("change", synchronize); fine.removeEventListener("change", synchronize);
      hidePointer();
    };
  }, [enabled]);
  return <><span ref={marker} hidden /><span ref={cursor} className={styles.cursor} data-motion-cursor aria-hidden="true" /></>;
}
