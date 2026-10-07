"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { defaultMusic, musicMoods, recordedTrack, youtubeVideoId } from "@/data/music";
import { parseUploadedAudio, uploadedAudioUrl } from "@/lib/audio";
import type { InvitationMusic } from "@/types/invitation";
import { RecordedMusic } from "./recorded-music";
import { MusicPlaybackIcon, MusicSettings } from "./music-settings";
import "./music.css";

const SongPlayer = dynamic(() => import("./song-player"), { loading: () => <p role="status">Opening song player…</p> });

export function MusicControl({ music = defaultMusic, autoPlay = false }: { music?: InvitationMusic; autoPlay?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSong, setShowSong] = useState(false);
  const [volume, setVolume] = useState(.5);
  const [error, setError] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<ReturnType<typeof import("./original-melody").startOriginalMelody> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const manualChoice = useRef(false);
  const starting = useRef(false);
  const request = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const videoId = youtubeVideoId(music.youtubeUrl);
  const mood = musicMoods.find(item => item.id === music.track) || musicMoods[0];

  const startDemo = useEffectEvent((fromOpening = false) => {
    if (!manualChoice.current && !playing && !starting.current) void toggleMusic(true, fromOpening);
  });
  useEffect(() => {
    if (!autoPlay || music.source !== "original") return;
    startDemo();
    const open = () => startDemo(true);
    document.addEventListener("invitly:open", open);
    return () => document.removeEventListener("invitly:open", open);
  }, [autoPlay, music.source]);

  useEffect(() => () => {
    request.current += 1; starting.current = false; clearTimeout(timeout.current);
    engineRef.current?.stop(); engineRef.current = null;
    void audioRef.current?.close().catch(() => {}); audioRef.current = null;
  }, []);

  function pause() {
    request.current += 1; starting.current = false; clearTimeout(timeout.current);
    engineRef.current?.stop(); engineRef.current = null;
    const context = audioRef.current; audioRef.current = null;
    if (context) window.setTimeout(() => { if (context.state !== "closed") void context.close().catch(() => {}); }, 200);
    setPlaying(false); setLoading(false);
  }
  async function toggleMusic(automatic = false, fromOpening = false) {
    if (!automatic) manualChoice.current = true;
    if (starting.current) { if (!automatic) pause(); return; }
    if (playing) { pause(); return; }
    const attempt = ++request.current;
    starting.current = true;
    setLoading(true); setError("");
    timeout.current = setTimeout(() => {
      if (request.current !== attempt) return;
      pause(); setError("Music is taking too long to start. Tap Play to try again.");
    }, 15_000);
    try {
      const context = audioRef.current || new AudioContext(); audioRef.current = context;
      if (automatic && context.state === "suspended") {
        // A suspended context may leave resume() pending indefinitely until a
        // gesture. Retry synchronously from the invitation opening event.
        if (!fromOpening && !navigator.userActivation?.isActive) return;
      }
      await context.resume();
      const { startOriginalMelody } = await import("./original-melody");
      if (request.current !== attempt || audioRef.current !== context || context.state === "closed") return;
      engineRef.current = startOriginalMelody(context, music.track, volume);
      setPlaying(true);
    } catch {
      if (request.current === attempt) {
        void audioRef.current?.close().catch(() => {}); audioRef.current = null;
        setPlaying(false); setError("Music could not start. Tap Play to try again; all invitation details are still available.");
      }
    } finally { if (request.current === attempt) { clearTimeout(timeout.current); starting.current = false; setLoading(false); } }
  }

  if (music.source === "library") return <RecordedMusic key={music.audioTrack} track={recordedTrack(music.audioTrack)} autoPlay={autoPlay} />;
  if (music.source === "upload") {
    const audio = parseUploadedAudio(music.uploadedAudio);
    return <RecordedMusic key={audio?.id} track={audio ? { name: audio.name, src: uploadedAudioUrl(audio) } : undefined} autoPlay={autoPlay} />;
  }

  if (music.source === "youtube") return <div className="music-control">
    <button ref={triggerRef} className="music-button" type="button" onClick={() => videoId ? setShowSong(true) : setError("The host hasn’t added a song link yet.")} aria-haspopup="dialog"><span aria-hidden="true">♪</span> Our song</button>
    {showSong && videoId && <SongPlayer videoId={videoId} close={() => { setShowSong(false); triggerRef.current?.focus(); }} />}
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;

  return <div className="music-control" data-playing={playing}>
    <button className="music-button" type="button" onClick={() => void toggleMusic()} aria-pressed={playing} aria-label={loading ? "Cancel loading music" : playing ? "Pause music" : "Play music"}>
      <MusicPlaybackIcon playing={playing} loading={loading} />
      <span className="music-label">{loading ? "Cancel loading music" : playing ? "Pause music" : "Play music"}</span>
    </button>
    {playing && <MusicSettings name={mood.name} volume={volume} onVolumeChange={value => { setVolume(value); engineRef.current?.setVolume(value); }} />}
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;
}
