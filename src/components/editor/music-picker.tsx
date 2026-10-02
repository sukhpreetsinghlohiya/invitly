"use client";

import { useState } from "react";
import { CustomAudioUpload, type AudioUploadContext } from "./custom-audio-upload";
import { Check, Music2 } from "lucide-react";
import { MusicControl } from "@/components/demo/music-control";
import { musicMoods, recordedTracks, weddingSongs, youtubeVideoId } from "@/data/music";
import type { InvitationMusic } from "@/types/invitation";

export function MusicPicker({ music, change, ...uploadContext }: AudioUploadContext & { music: InvitationMusic; change: (music: InvitationMusic) => void }) {
  function selectMusic(value: InvitationMusic) { change({ ...value, uploadedAudio: value.source === "upload" ? value.uploadedAudio : undefined }); }
  const videoId = youtubeVideoId(music.youtubeUrl);
  const [category, setCategory] = useState<"wedding" | "original" | "youtube" | "upload">(() => music.source === "upload" ? "upload" : music.source === "library" || (music.source === "youtube" && weddingSongs.some(song => song.id === videoId)) ? "wedding" : music.source === "youtube" ? "youtube" : "original");
  return <>
    <div className="editor-music-sources" role="group" aria-label="Music source">
      <button type="button" aria-pressed={category === "wedding"} onClick={() => setCategory("wedding")}>Wedding songs</button>
      <button type="button" aria-pressed={category === "original"} onClick={() => { setCategory("original"); selectMusic({ ...music, source: "original", youtubeUrl: "" }); }}>Original instrumentals</button>
      <button type="button" aria-pressed={category === "youtube"} onClick={() => { setCategory("youtube"); selectMusic({ ...music, source: "youtube" }); }}>YouTube song</button>
      <button type="button" aria-pressed={category === "upload"} onClick={() => setCategory("upload")}>Upload your audio</button>
    </div>
    {category === "upload" && <CustomAudioUpload music={music} change={selectMusic} {...uploadContext} />}
    {category === "wedding" && <>
      <p className="editor-help-note">A little shaadi energy. Choose a song, then try it before you share.</p>
      <div className="editor-music-moods editor-wedding-songs" role="group" aria-label="Wedding song collection">
        {recordedTracks.map(song => <button type="button" key={song.id} aria-pressed={music.source === "library" && music.audioTrack === song.id} onClick={() => selectMusic({ ...music, source: "library", audioTrack: song.id, youtubeUrl: "" })}><span aria-hidden="true"><Music2 size={23} /></span><div><strong>{song.name}</strong><small>{song.description}</small><span className="editor-song-source">Featured · Plays in your invitation</span></div>{music.source === "library" && music.audioTrack === song.id && <Check size={17} />}</button>)}
        {weddingSongs.map(song => <button type="button" key={song.id} aria-pressed={music.source === "youtube" && videoId === song.id} onClick={() => selectMusic({ ...music, source: "youtube", youtubeUrl: `https://www.youtube.com/watch?v=${song.id}` })}><span aria-hidden="true">♪</span><div><strong>{song.name}</strong><small>{song.description}</small><span className="editor-song-source">YouTube · {song.label}</span></div>{music.source === "youtube" && videoId === song.id && <Check size={17} />}</button>)}
      </div>
      <p className="editor-help-note">The featured recording plays directly in the invitation. Bollywood favourites open a YouTube player when guests choose to listen.</p>
    </>}
    {category === "original" && <><div className="editor-music-moods" role="group" aria-label="Instrumental mood">{musicMoods.map(item => <button type="button" key={item.id} aria-pressed={music.source === "original" && music.track === item.id} onClick={() => selectMusic({ ...music, source: "original", track: item.id })}><span aria-hidden="true">♪</span><div><strong>{item.name}</strong><small>{item.description}</small></div>{music.source === "original" && music.track === item.id && <Check size={17} />}</button>)}</div><p className="editor-help-note">Original instrumental moods for a softer welcome.</p></>}
    {category === "youtube" && <label className="form-field">YouTube song link<input type="url" maxLength={500} value={music.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" onChange={event => selectMusic({ ...music, source: "youtube", youtubeUrl: event.target.value })} aria-invalid={Boolean(music.youtubeUrl && !videoId) || undefined} /><small>{music.youtubeUrl && !videoId ? "Use a full YouTube video link, not a playlist or embed code." : "Use an official artist or label upload with embedding enabled. Guests open a visible YouTube player."}</small></label>}
    {(music.source !== "youtube" || videoId) && <div className="editor-music-listen"><span>Try it before you share</span><MusicControl key={`${music.source}:${music.track}:${music.audioTrack}:${music.uploadedAudio?.id}:${music.youtubeUrl}`} music={music} /></div>}
  </>;
}
