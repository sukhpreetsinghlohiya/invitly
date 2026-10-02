"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";

export default function SongPlayer({ videoId, close }: { videoId: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  function dismiss() { dialog.current?.close(); close(); }
  return <dialog ref={dialog} className="song-dialog" aria-labelledby="song-title" onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }} onCancel={event => { event.preventDefault(); dismiss(); }} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
    <div className="song-dialog-body"><div className="song-dialog-header"><div><span className="eyebrow">A LITTLE SOUNDTRACK</span><h2 id="song-title">Our song, your moment.</h2></div><button type="button" aria-label="Close song player" onClick={dismiss}><X size={21} /></button></div>
      <p>Press Play in the player. Closing this window stops the song.</p>
      <iframe title="Invitation song on YouTube" src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&autoplay=0&rel=0`} referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Song unavailable? Open on YouTube <ArrowUpRight size={15} /></a>
    </div>
  </dialog>;
}
