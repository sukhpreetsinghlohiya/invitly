"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { defaultMusic, musicMoods, recordedTrack, youtubeVideoId } from "@/data/music";
import { parseUploadedAudio, uploadedAudioUrl } from "@/lib/audio";
import type { InvitationMusic } from "@/types/invitation";
import { RecordedMusic } from "./recorded-music";
import "./music.css";

const SongPlayer = dynamic(() => import("./song-player"), { loading: () => <p role="status">Opening song player…</p> });

export function MusicControl({ music = defaultMusic }: { music?: InvitationMusic }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSong, setShowSong] = useState(false);
  const [volume, setVolume] = useState(.5);
  const [error, setError] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<ReturnType<typeof import("./original-melody").startOriginalMelody> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const videoId = youtubeVideoId(music.youtubeUrl);
  const mood = musicMoods.find(item => item.id === music.track) || musicMoods[0];

  useEffect(() => () => {
    engineRef.current?.stop(); engineRef.current = null;
    void audioRef.current?.close(); audioRef.current = null;
  }, []);

  function pause() {
    engineRef.current?.stop(); engineRef.current = null;
    const context = audioRef.current; audioRef.current = null;
    if (context) window.setTimeout(() => { if (context.state !== "closed") void context.close(); }, 200);
    setPlaying(false);
  }
  async function toggleMusic() {
    if (playing) { pause(); return; }
    setLoading(true); setError("");
    try {
      const context = new AudioContext(); audioRef.current = context;
      await context.resume();
      const { startOriginalMelody } = await import("./original-melody");
      if (audioRef.current !== context || context.state === "closed") return;
      engineRef.current = startOriginalMelody(context, music.track, volume);
      setPlaying(true);
    } catch {
      void audioRef.current?.close(); audioRef.current = null;
      setPlaying(false); setError("Music could not start. Tap Play to try again; all invitation details are still available.");
    } finally { setLoading(false); }
  }

  if (music.source === "library") return <RecordedMusic key={music.audioTrack} track={recordedTrack(music.audioTrack)} />;
  if (music.source === "upload") {
    const audio = parseUploadedAudio(music.uploadedAudio);
    return <RecordedMusic key={audio?.id} track={audio ? { name: audio.name, src: uploadedAudioUrl(audio) } : undefined} />;
  }

  if (music.source === "youtube") return <div className="music-control">
    <button ref={triggerRef} className="music-button" type="button" onClick={() => videoId ? setShowSong(true) : setError("The host hasn’t added a song link yet.")} aria-haspopup="dialog"><span aria-hidden="true">♪</span> Our song</button>
    {showSong && videoId && <SongPlayer videoId={videoId} close={() => { setShowSong(false); triggerRef.current?.focus(); }} />}
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;

  return <div className="music-control" data-playing={playing}>
    <button className="music-button" type="button" onClick={() => void toggleMusic()} disabled={loading} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"}>
      <span className="music-equalizer" aria-hidden="true"><i /><i /><i /></span>
      <span>{loading ? "Starting music…" : playing ? "Pause music" : "Play music"}</span>
    </button>
    {playing && <div className="music-playing-panel"><span>{mood.name}</span><label>Volume<input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => { const value = Number(event.target.value); setVolume(value); engineRef.current?.setVolume(value); }} /></label></div>}
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;
}
