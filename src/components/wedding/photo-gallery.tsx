"use client";

import { InvitationImage as Image } from "@/components/invitation-image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import type { EventPhoto } from "@/types/media";
import styles from "./wedding.module.css";

export function PhotoGallery({ photos }: { photos: EventPhoto[]; isDemo?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const photo = photos[active];
  function open(index: number) { setActive(index); dialog.current?.showModal(); }
  function move(direction: number) { setActive(index => (index + direction + photos.length) % photos.length); }
  if (!photo) return null;
  return <>
    <div className={styles.galleryGrid}>{photos.map((item, index) => <button key={item.id} type="button" className={styles.galleryPhoto} aria-label={`View photo ${index + 1}: ${item.alt}`} onClick={() => open(index)}>
      <Image src={item.url} alt={item.alt} width={item.width} height={item.height} sizes="(max-width: 650px) 45vw, 550px" loading="lazy" />
      <span className={styles.photoNumber}>0{index + 1}</span><span className={styles.expandPhoto}><Expand size={17} /></span>
    </button>)}</div>
    <dialog ref={dialog} className={styles.lightbox} aria-label="Invitation photo gallery" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } }}>
      <div className={styles.lightboxBody}>
        <button type="button" autoFocus className={styles.closePhoto} aria-label="Close photo gallery" onClick={() => dialog.current?.close()}><X size={23} /></button>
        <Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="90vw" />
        <div className={styles.lightboxControls}><button type="button" onClick={() => move(-1)} aria-label="Previous photo" disabled={photos.length < 2}><ArrowLeft size={20} /></button><p aria-live="polite">{active + 1} / {photos.length}<span>{photo.alt}</span></p><button type="button" onClick={() => move(1)} aria-label="Next photo" disabled={photos.length < 2}><ArrowRight size={20} /></button></div>
      </div>
    </dialog>
  </>;
}
