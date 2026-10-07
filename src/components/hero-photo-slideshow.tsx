"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { InvitationImage } from "./invitation-image";
import { usePhotoPlayback } from "./use-photo-playback";
import type { EventPhoto } from "@/types/media";
import type { InvitationDesign } from "@/types/invitation";
import styles from "./photo-story.module.css";

type Props = { photos: EventPhoto[]; coverPhotoId?: string; motion?: InvitationDesign["motion"]; className?: string; preload?: boolean };

export function HeroPhotoSlideshow(props: Props) {
  const ordered = [...props.photos].sort((a, b) => Number(b.id === props.coverPhotoId) - Number(a.id === props.coverPhotoId));
  return <HeroSlides key={ordered.map(photo => photo.id).join(":")} {...props} photos={ordered} />;
}

function HeroSlides({ photos, motion = "gentle", className = "", preload = false }: Props) {
  const { root, index, paused, setPaused, move, interaction, playing } = usePhotoPlayback(photos.length, motion);
  if (!photos.length) return null;
  return <div ref={root} className={`${styles.hero} ${className}`} data-photo-slideshow data-photo-index={index} data-motion={motion} data-paused={paused} data-photo-playing={playing} {...interaction} role="region" aria-label="Invitation photographs" aria-roledescription="carousel">
    {photos.map((photo, position) => <div key={photo.id} className={styles.heroSlide} data-active={position === index} aria-hidden={position !== index}>
      {(position === 0 || position === index || position === (index + 1) % photos.length) && <InvitationImage src={photo.url} alt={photo.alt} fill sizes="(max-width: 650px) 100vw, 1200px" style={photo.objectPosition ? { objectPosition: photo.objectPosition } : undefined} preload={preload && position === 0} loading={preload && position === 0 ? undefined : "lazy"} />}
    </div>)}
    {photos.length > 1 && <div className={styles.heroControls}>
      <button type="button" aria-label="Previous cover photo" onClick={() => move(-1)}><ChevronLeft size={17} /></button>
      <span aria-live={paused ? "polite" : "off"}>{String(index + 1).padStart(2, "0")} <i>/</i> {String(photos.length).padStart(2, "0")}</span>
      <button type="button" aria-label="Next cover photo" onClick={() => move(1)}><ChevronRight size={17} /></button>
      {motion !== "none" && <button className={styles.playback} type="button" aria-label={paused ? "Play cover slideshow" : "Pause cover slideshow"} onClick={() => setPaused(!paused)}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
    </div>}
  </div>;
}
