"use client";

import { useEffect, useRef, useState } from "react";

/** Autoplay exists only while the album is visible, unattended and motion is allowed. */
export function usePhotoPlayback(count: number, motion: string = "gentle", delay = 6500) {
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const interacting = hovering || focused;
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element || count < 2) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const synchronize = () => {
      clearInterval(timer);
      const available = visible && !document.hidden && !preference.matches;
      setInView(available);
      if (available && !paused && !interacting && motion !== "none") {
        timer = setInterval(() => setIndex(value => (value + 1) % count), delay);
      }
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      synchronize();
    }, { threshold: .15 });
    observer.observe(element);
    document.addEventListener("visibilitychange", synchronize);
    preference.addEventListener("change", synchronize);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      preference.removeEventListener("change", synchronize);
    };
  }, [count, motion, delay, paused, interacting]);
  const move = (direction: number) => {
    setPaused(true);
    setIndex(value => (value + direction + count) % count);
  };
  return { root, index: count ? index % count : 0, paused, setPaused, move, setIndex,
    playing: inView && !paused && !interacting && motion !== "none",
    interaction: {
      onMouseEnter: () => setHovering(true),
      onMouseLeave: () => setHovering(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      },
    },
  };
}
