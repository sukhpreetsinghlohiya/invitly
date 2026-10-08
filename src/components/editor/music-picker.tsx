"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CustomAudioUpload, type AudioUploadContext } from "./custom-audio-upload";
import { Check, Music2, Play } from "lucide-react";
import { MusicControl } from "@/components/demo/music-control";
import { musicMoods, recordedTracks, youtubeVideoId } from "@/data/music";
import { catalogSong, filterSongs, songLanguages, songMoods, songUrl, type SongLanguage, type SongMood } from "@/data/song-catalog";
import type { InvitationMusic } from "@/types/invitation";
import styles from "./music-picker.module.css";

const SongPlayer = dynamic(() => import("@/components/demo/song-player"), { loading: () => <p role="status">Opening song player…</p> });

export function MusicPicker({ music, change, ...uploadContext }: AudioUploadContext & { music: InvitationMusic; change: (music: InvitationMusic) => void }) {
  function selectMusic(value: InvitationMusic) { change({ ...value, uploadedAudio: value.source === "upload" ? value.uploadedAudio : undefined }); }
  const videoId = youtubeVideoId(music.youtubeUrl);
  const selectedSong = music.source === "youtube" ? catalogSong(videoId) : undefined;
  const [category, setCategory] = useState<"collection" | "original" | "youtube" | "upload">(() => music.source === "upload" ? "upload" : music.source === "library" || selectedSong ? "collection" : music.source === "youtube" ? "youtube" : "original");
  const [language, setLanguage] = useState<SongLanguage>(selectedSong?.language || "all");
  const [mood, setMood] = useState<SongMood | "all">("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const previewTrigger = useRef<HTMLButtonElement | null>(null);
  const songs = filterSongs({ language, mood, query });
  const showRecording = language === "all" && mood === "all" && !query.trim();
  return <>
    <div className="editor-music-sources" role="group" aria-label="Music source">
      <button type="button" aria-pressed={category === "collection"} onClick={() => setCategory("collection")}>Song collection</button>
      <button type="button" aria-pressed={category === "original"} onClick={() => setCategory("original")}>Original instrumentals</button>
      <button type="button" aria-pressed={category === "youtube"} onClick={() => setCategory("youtube")}>YouTube song</button>
      <button type="button" aria-pressed={category === "upload"} onClick={() => setCategory("upload")}>Upload your audio</button>
    </div>
    {category === "upload" && <CustomAudioUpload music={music} change={selectMusic} {...uploadContext} />}
    {category === "collection" && <>
      <p className={styles.intro}>Find your song. Preview it, then choose it for your invitation.</p>
      <div className={styles.filters} role="group" aria-label="Song language">{songLanguages.map(item => <button key={item.id} type="button" aria-pressed={language === item.id} onClick={() => setLanguage(item.id)}>{item.name}</button>)}</div>
      <div className={styles.search}><label className="form-field">Search songs<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Song, artist or film" /></label><label className="form-field">Song mood<select value={mood} onChange={event => setMood(event.target.value as SongMood | "all")}><option value="all">All moods</option>{songMoods.map(item => <option key={item} value={item}>{item}</option>)}</select></label></div>
      <p className={styles.count} role="status">{songs.length} {songs.length === 1 ? "song" : "songs"}</p>
      {showRecording && <div className={`editor-music-moods ${styles.recorded}`} role="group" aria-label="Included recording">{recordedTracks.map(song => <button type="button" key={song.id} aria-pressed={music.source === "library" && music.audioTrack === song.id} onClick={() => selectMusic({ ...music, source: "library", audioTrack: song.id, youtubeUrl: "" })}><span aria-hidden="true"><Music2 size={23} /></span><div><strong>{song.name}</strong><small>{song.description}</small><span className="editor-song-source">Included recording · Plays directly</span></div>{music.source === "library" && music.audioTrack === song.id && <Check size={17} />}</button>)}</div>}
      {songs.length ? <ul className={styles.songs} aria-label="Song collection">{songs.map(song => <li key={song.id}>
        <button type="button" className={styles.choose} aria-label={`Choose ${song.name}`} aria-pressed={music.source === "youtube" && videoId === song.id} onClick={() => selectMusic({ ...music, source: "youtube", audioTrack: undefined, youtubeUrl: songUrl(song) })}><span><strong>{song.name}</strong><small>{song.artist}</small><small>{song.mood} · YouTube</small></span>{music.source === "youtube" && videoId === song.id && <Check size={17} aria-hidden="true" />}</button>
        <button type="button" className={styles.preview} aria-label={`Preview ${song.name}`} title={`Preview ${song.name} on YouTube`} aria-haspopup="dialog" onClick={event => { previewTrigger.current = event.currentTarget; setPreview(song.id); }}><Play size={17} aria-hidden="true" /></button>
      </li>)}</ul> : <p className={styles.empty}>No matches. Try another artist, language or mood.</p>}
      <p className={styles.intro}>YouTube songs need internet. Guests tap to open the player, then press Play. Availability can vary by region.</p>
    </>}
    {category === "original" && <><div className="editor-music-moods" role="group" aria-label="Instrumental mood">{musicMoods.map(item => <button type="button" key={item.id} aria-pressed={music.source === "original" && music.track === item.id} onClick={() => selectMusic({ ...music, source: "original", track: item.id, audioTrack: undefined, youtubeUrl: "" })}><span aria-hidden="true">♪</span><div><strong>{item.name}</strong><small>{item.description}</small></div>{music.source === "original" && music.track === item.id && <Check size={17} />}</button>)}</div><p className="editor-help-note">Original instrumental moods for a softer welcome.</p></>}
    {category === "youtube" && <label className="form-field">YouTube song link<input type="url" maxLength={500} value={music.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" onChange={event => selectMusic({ ...music, source: "youtube", audioTrack: undefined, youtubeUrl: event.target.value })} aria-invalid={Boolean(music.youtubeUrl && !videoId) || undefined} /><small>{music.youtubeUrl && !videoId ? "Use a full YouTube video link, not a playlist or embed code." : "Use an official artist or label upload with embedding enabled. Guests tap to load the player, then press Play. Internet is required."}</small></label>}
    {selectedSong && <p className={styles.selected}>Selected: <strong>{selectedSong.name}</strong> · {selectedSong.artist}</p>}
    {(music.source !== "youtube" || videoId) && <div className="editor-music-listen"><span>Try your selected soundtrack</span><MusicControl key={`${music.source}:${music.track}:${music.audioTrack}:${music.uploadedAudio?.id}:${music.youtubeUrl}`} music={music} /></div>}
    {preview && <SongPlayer key={preview} videoId={preview} close={() => { setPreview(null); previewTrigger.current?.focus(); }} />}
  </>;
}
