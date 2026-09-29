"use client";

import { useEffect, useRef, useState } from "react";

export function MusicControl() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    stopRef.current?.();
    void audioRef.current?.close();
    audioRef.current = null;
  }, []);

  async function toggleMusic() {
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      void audioRef.current?.close();
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Create and resume in the click gesture; the composition loads only now.
      const context = new AudioContext();
      audioRef.current = context;
      await context.resume();
      const { startOriginalMelody } = await import("./original-melody");
      if (audioRef.current !== context || context.state === "closed") return;
      stopRef.current = startOriginalMelody(context);
      setPlaying(true);
    } catch {
      void audioRef.current?.close();
      audioRef.current = null;
      setError("Music could not start in this browser. You can still enjoy the full invitation.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="music-control">
    <button className="music-button" type="button" onClick={toggleMusic} disabled={loading} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"}>
      <span aria-hidden="true">{playing ? "Ⅱ" : "♪"}</span>
      <span>{loading ? "Starting music…" : playing ? "Pause music" : "Play music"}</span>
    </button>
    {error && <p className="form-feedback" role="status">{error}</p>}
  </div>;
}
