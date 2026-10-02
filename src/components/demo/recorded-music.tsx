"use client";

import { useEffect, useRef, useState } from "react";

export function RecordedMusic({ track }: { track?: { name: string; src: string } }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(.5);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    return () => { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (!audio.paused) { audio.pause(); return; }
    setLoading(true); setError("");
    try {
      // No media request is made until the guest explicitly presses Play.
      if (!audio.getAttribute("src")) audio.src = track.src;
      else if (audio.error) audio.load();
      audio.volume = volume;
      await audio.play();
    } catch (reason) {
      if (audioRef.current === audio && !(reason instanceof DOMException && reason.name === "AbortError")) {
        setPlaying(false); setError("The song couldn’t start. Tap Play to try again.");
      }
    } finally { if (audioRef.current === audio) setLoading(false); }
  }

  if (!track) return <p className="form-feedback" role="status">This song is unavailable. All invitation details are still available.</p>;
  return <div className="music-control" data-playing={playing}>
    <audio ref={audioRef} preload="none" loop onPlaying={() => { setPlaying(true); setLoading(false); }} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setLoading(false); setError("The song couldn’t load. Tap Play to try again."); }} />
    <button className="music-button" type="button" onClick={() => void toggle()} disabled={loading} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"}>
      <span className="music-equalizer" aria-hidden="true"><i /><i /><i /></span><span>{loading ? "Starting music…" : playing ? "Pause music" : "Play music"}</span>
    </button>
    {playing && <div className="music-playing-panel"><span>{track.name}</span><label>Volume<input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => { const value = Number(event.target.value); setVolume(value); if (audioRef.current) audioRef.current.volume = value; }} /></label></div>}
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;
}
