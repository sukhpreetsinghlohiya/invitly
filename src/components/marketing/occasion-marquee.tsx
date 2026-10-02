"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { Flower } from "@/components/brand";
import "./occasion-marquee.css";

const moments = ["Weddings", "Engagements", "Birthdays", "Baby showers", "New beginnings", "Anniversaries", "Every little celebration"];

export function OccasionMarquee() {
  const [paused, setPaused] = useState(false);
  return <section className="occasion-marquee" aria-label="Invitations for every occasion" data-paused={paused}>
    <div className="occasion-marquee-viewport">
      <div className="occasion-marquee-track">
        {[0, 1].map(copy => <ul className="occasion-marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
          {moments.map(moment => <li key={moment}><span>{moment}</span><Flower aria-hidden="true" /></li>)}
        </ul>)}
      </div>
    </div>
    <button className="occasion-marquee-toggle" type="button" onClick={() => setPaused(current => !current)} aria-label={paused ? "Resume scrolling occasions" : "Pause scrolling occasions"}>
      {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
    </button>
  </section>;
}
