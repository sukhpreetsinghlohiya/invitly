"use client";

import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import type { Invitation } from "@/types/invitation";
import { parseInvitationVideo } from "@/lib/invitation-video";
import styles from "./invitation-video.module.css";

export function InvitationVideo({ video }: { video?: Invitation["video"] }) {
  const source = video?.enabled ? parseInvitationVideo(video.url) : null;
  if (!source || !video) return null;
  return <VideoPlayer key={source.embedUrl} source={source} title={video.title || "A little of our story."} />;
}

function VideoPlayer({ source, title }: { source: NonNullable<ReturnType<typeof parseInvitationVideo>>; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return <section className={styles.section} data-section="video" data-invitation-video aria-labelledby="invitation-video-heading">
    <header data-reveal><span>OUR STORY, IN MOTION</span><h2 id="invitation-video-heading">{title}</h2></header>
    <div className={styles.screen}>
      {loaded ? <iframe src={source.embedUrl} title={title} allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="no-referrer" /> : <button type="button" onClick={() => setLoaded(true)} className={styles.load}><span className={styles.play}><Play size={28} fill="currentColor" /></span><strong>Watch our film</strong><span>Load video from {source.provider === "youtube" ? "YouTube" : "Vimeo"}</span></button>}
    </div>
    <a href={source.externalUrl} target="_blank" rel="noopener noreferrer">Open on {source.provider === "youtube" ? "YouTube" : "Vimeo"} <ArrowUpRight size={15} /><span className="sr-only"> (opens in a new tab)</span></a>
  </section>;
}
