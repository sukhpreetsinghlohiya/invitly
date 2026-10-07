"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Play, SlidersHorizontal } from "lucide-react";

export function MusicPlaybackIcon({ playing, loading }: { playing: boolean; loading: boolean }) {
  if (loading) return <LoaderCircle size={17} className="music-loading-icon" aria-hidden="true" />;
  if (!playing) return <Play size={16} aria-hidden="true" />;
  return <span className="music-equalizer" aria-hidden="true"><i /><i /><i /></span>;
}

export function MusicSettings({ name, volume, onVolumeChange }: { name: string; volume: number; onVolumeChange: (volume: number) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <div ref={root} className="music-settings" onBlur={event => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} className="music-settings-toggle" type="button" aria-label="Music settings" title="Music settings" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><SlidersHorizontal size={16} aria-hidden="true" /></button>
    <div id={id} className="music-playing-panel" hidden={!open}>
      <span className="music-track-label">NOW PLAYING</span><span>{name}</span>
      <label>Volume<input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => onVolumeChange(Number(event.target.value))} /></label>
    </div>
  </div>;
}
