"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { MusicPlaybackIcon, MusicSettings } from "./music-settings";

export function RecordedMusic({ track, autoPlay = false }: { track?: { name: string; src: string }; autoPlay?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(.5);
  const [error, setError] = useState("");
  const manualChoice = useRef(false);
  const starting = useRef(false);
  const request = useRef(0);
  const wantsPlayback = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startDemo = useEffectEvent(() => {
    if (!manualChoice.current && audioRef.current?.paused) void start(true);
  });
  useEffect(() => {
    if (!autoPlay) return;
    startDemo();
    const open = () => startDemo();
    document.addEventListener("invitly:open", open);
    return () => document.removeEventListener("invitly:open", open);
  }, [autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => { request.current += 1; wantsPlayback.current = false; starting.current = false; clearTimeout(timeout.current); if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } };
  }, []);

  function stop() {
    request.current += 1;
    wantsPlayback.current = false;
    starting.current = false;
    clearTimeout(timeout.current);
    audioRef.current?.pause();
    setPlaying(false); setLoading(false);
  }

  async function start(automatic = false) {
    const audio = audioRef.current;
    if (!audio || !track || starting.current || !audio.paused) return;
    const attempt = ++request.current;
    wantsPlayback.current = true;
    starting.current = true;
    setLoading(true); setError("");
    timeout.current = setTimeout(() => {
      if (request.current !== attempt) return;
      stop();
      setError("The song is taking too long to load. Tap Play to try again.");
    }, 15_000);
    try {
      // Autoplay is only requested by demos. Published invitations stay opt-in.
      if (!audio.getAttribute("src")) audio.src = track.src;
      else if (audio.error) audio.load();
      audio.volume = volume;
      await audio.play();
    } catch (reason) {
      if (request.current === attempt && audioRef.current === audio && !(reason instanceof DOMException && reason.name === "AbortError")) {
        wantsPlayback.current = false;
        const blocked = reason instanceof DOMException && reason.name === "NotAllowedError";
        // Browsers can require a gesture for sound. The Play button is the
        // normal fallback, so this should not cover the invitation with an error.
        setPlaying(false); setError(automatic && blocked ? "" : "The song couldn’t start. Tap Play to try again.");
      }
    } finally { if (request.current === attempt) { clearTimeout(timeout.current); starting.current = false; if (audioRef.current === audio) setLoading(false); } }
  }

  function toggle() {
    manualChoice.current = true;
    if (starting.current || (audioRef.current && !audioRef.current.paused)) { stop(); setError(""); return; }
    void start();
  }

  if (!track) return <p className="form-feedback" role="status">This song is unavailable. All invitation details are still available.</p>;
  return <div className="music-control" data-playing={playing}>
    <audio ref={audioRef} preload="none" loop onPlaying={() => { if (!wantsPlayback.current) { audioRef.current?.pause(); return; } clearTimeout(timeout.current); setPlaying(true); setLoading(false); setError(""); }} onPause={() => setPlaying(false)} onError={() => { stop(); setError("The song couldn’t load. Tap Play to try again."); }} />
    <button className="music-button" type="button" onClick={() => void toggle()} aria-pressed={playing} aria-label={loading ? "Cancel loading music" : playing ? "Pause music" : "Play music"}>
      <MusicPlaybackIcon playing={playing} loading={loading} /><span className="music-label">{loading ? "Cancel loading music" : playing ? "Pause music" : "Play music"}</span>
    </button>
    {playing && <MusicSettings name={track.name} volume={volume} onVolumeChange={value => { setVolume(value); if (audioRef.current) audioRef.current.volume = value; }} />}
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;
}
