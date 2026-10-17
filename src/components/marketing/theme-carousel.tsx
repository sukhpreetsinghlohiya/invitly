"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { InvitationArt } from "@/components/invitation-art";
import { demoInvitation } from "@/data/demo-invitation";
import type { InvitationTheme } from "@/data/themes";
import "./theme-carousel.css";

export function ThemeCarousel({ themes }: { themes: InvitationTheme[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 8);
    setCanNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 8);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateState();
    track.addEventListener("scroll", updateState, { passive: true });
    const ro = new ResizeObserver(updateState);
    ro.observe(track);
    return () => { track.removeEventListener("scroll", updateState); ro.disconnect(); };
  }, [updateState]);

  const scroll = (dir: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".tc-card");
    const step = card ? card.offsetWidth + parseInt(getComputedStyle(track).gap || "0") : track.clientWidth * 0.8;
    track.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <div className="theme-carousel">
      <div className="tc-track" ref={trackRef}>
        {themes.map((theme) => (
          <Link href={`/demo?theme=${theme.id}`} key={theme.id} className="tc-card theme-card">
            <div className={`theme-preview preview-${theme.id}`}>
              <span className="theme-number">N° {theme.number}</span>
              <InvitationArt theme={theme.id} invitation={demoInvitation} compact />
              <span className="preview-open" aria-hidden="true"><ArrowUpRight size={20} /></span>
            </div>
            <div className="theme-title">
              <h3>{theme.name}</h3>
              <span>{theme.category}</span>
            </div>
            <p>{theme.description}</p>
            <span className="theme-link">Explore invitation <ArrowRight size={15} /></span>
          </Link>
        ))}
      </div>
      <div className="tc-controls">
        <button className="tc-arrow" onClick={() => scroll("prev")} disabled={!canPrev} aria-label="Previous designs">
          <ArrowLeft size={18} />
        </button>
        <button className="tc-arrow" onClick={() => scroll("next")} disabled={!canNext} aria-label="Next designs">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
