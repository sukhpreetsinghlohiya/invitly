"use client";

import { InvitationImage as Image } from "@/components/invitation-image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, Pause, Play, X } from "lucide-react";
import type { EventPhoto } from "@/types/media";
import type { InvitationDesign, OccasionId, ThemeId } from "@/types/invitation";
import { PhotoAlbumFrame } from "../photo-album-frame";
import { ArchiveOrnament } from "../archive-ornament";
import { usePhotoPlayback } from "../use-photo-playback";
import styles from "./wedding.module.css";
import album from "../photo-story.module.css";

export function PhotoGallery({ photos, motion = "gentle", theme = "royal", occasion = "wedding" }: { photos: EventPhoto[]; isDemo?: boolean; motion?: InvitationDesign["motion"]; theme?: ThemeId; occasion?: OccasionId }) {
  return <PhotoAlbum key={photos.map(photo => photo.id).join(":")} photos={photos} motion={motion} theme={theme} occasion={occasion} />;
}

function PhotoAlbum({ photos, motion, theme, occasion }: { photos: EventPhoto[]; motion: string; theme: ThemeId; occasion: OccasionId }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const { root, index, paused, setPaused, move, interaction, playing } = usePhotoPlayback(photos.length, motion, 7000);
  const photo = photos[active];
  function open(position: number) { setPaused(true); setActive(position); dialog.current?.showModal(); }
  function moveLightbox(direction: number) { setActive(value => (value + direction + photos.length) % photos.length); }
  if (!photo) return null;
  return <>
    <div ref={root} className={album.album} data-photo-album data-photo-index={index} data-count={photos.length} data-motion={motion} data-photo-playing={playing} {...interaction} role="region" aria-roledescription="carousel" aria-label="Photo album" onKeyDown={event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    }}>
      <div className={album.stage} onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => {
        if (touchStart.current !== null) { const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1); }
        touchStart.current = null;
      }}>
        <div className={album.frame} aria-hidden="true" data-decoration><ArchiveOrnament kind="branch" className={album.frameBranch} /><ArchiveOrnament kind="branch" className={album.frameBranch} /></div>
        <PhotoAlbumFrame theme={theme} occasion={occasion} />
        {photos.map((item, position) => {
          const side = position === index ? "center" : position === (index + 1) % photos.length ? "right" : position === (index + photos.length - 1) % photos.length ? "left" : "hidden";
          return <button key={item.id} type="button" className={album.card} data-position={side} aria-hidden={side === "hidden"} tabIndex={side === "hidden" ? -1 : 0} aria-label={`View photo ${position + 1}: ${item.alt}`} onClick={() => open(position)}>
            <span className={album.cardImage}>{side !== "hidden" && <Image src={item.url} alt={item.alt} fill sizes="(max-width: 650px) 60vw, 400px" loading="lazy" draggable={false} />}</span>
            <span className={album.cardNumber}>{String(position + 1).padStart(2, "0")}</span><span className={album.expand}><Expand size={15} /></span>
          </button>;
        })}
      </div>
      <div className={album.controls}><button type="button" onClick={() => move(-1)} aria-label="Previous album photo" disabled={photos.length < 2}><ArrowLeft size={18} /></button><span className={album.counter} aria-live={paused ? "polite" : "off"}>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><button type="button" onClick={() => move(1)} aria-label="Next album photo" disabled={photos.length < 2}><ArrowRight size={18} /></button>{photos.length > 1 && motion !== "none" && <button type="button" className={album.playback} onClick={() => setPaused(!paused)} aria-label={paused ? "Play album slideshow" : "Pause album slideshow"}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}</div>
      <p className={album.caption}>{photos[index].alt}</p>
    </div>
    <dialog ref={dialog} className={styles.lightbox} aria-label="Invitation photo gallery" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowLeft") { event.preventDefault(); moveLightbox(-1); } if (event.key === "ArrowRight") { event.preventDefault(); moveLightbox(1); } }}>
      <div className={styles.lightboxBody}>
        <button type="button" autoFocus className={styles.closePhoto} aria-label="Close photo gallery" onClick={() => dialog.current?.close()}><X size={23} /></button>
        <Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="90vw" />
        <div className={styles.lightboxControls}><button type="button" onClick={() => moveLightbox(-1)} aria-label="Previous photo" disabled={photos.length < 2}><ArrowLeft size={20} /></button><p aria-live="polite">{active + 1} / {photos.length}<span>{photo.alt}</span></p><button type="button" onClick={() => moveLightbox(1)} aria-label="Next photo" disabled={photos.length < 2}><ArrowRight size={20} /></button></div>
      </div>
    </dialog>
  </>;
}
