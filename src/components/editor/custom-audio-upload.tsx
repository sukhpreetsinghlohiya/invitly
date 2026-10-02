"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { Loader2, Upload } from "lucide-react";
import { prepareAudioUpload, finishAudioUpload, discardAudioUpload } from "@/app/dashboard/audio-actions";
import { createClient } from "@/lib/supabase/client";
import { EVENT_AUDIO_BUCKET, MAX_AUDIO_BYTES } from "@/lib/audio";
import type { InvitationMusic } from "@/types/invitation";

export type AudioUploadContext = { eventId?: string; signedIn?: boolean; saveForAudio?: () => void; busy?: (value: boolean) => void; preserveForAudio?: (event: MouseEvent<HTMLAnchorElement>) => void };

export function CustomAudioUpload({ music, change, eventId, signedIn, saveForAudio, busy, preserveForAudio }: AudioUploadContext & { music: InvitationMusic; change: (music: InvitationMusic) => void }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const current = music.source === "upload" ? music.uploadedAudio : undefined;
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("audio");
    if (!eventId || !(file instanceof File) || !file.size || file.size > MAX_AUDIO_BYTES || !/\.mp3$/i.test(file.name)) { setFeedback("Choose an MP3 up to 10 MB."); return; }
    setPending(true); busy?.(true); setFeedback("Uploading your recording…");
    let uploadedId: string | undefined;
    try {
      const prepared = await prepareAudioUpload(eventId, file.name, file.size);
      if (prepared.error || !prepared.id || !prepared.path || !prepared.token) throw new Error(prepared.error || "Audio upload could not start.");
      uploadedId = prepared.id;
      const normalized = new File([file], file.name, { type: "audio/mpeg" });
      const { error } = await createClient().storage.from(EVENT_AUDIO_BUCKET).uploadToSignedUrl(prepared.path, prepared.token, normalized, { contentType: "audio/mpeg", cacheControl: "0", upsert: false });
      if (error) throw new Error("The upload didn’t finish. Check your connection and try again.");
      setFeedback("Checking your MP3…");
      const result = await finishAudioUpload(eventId, prepared.id, file.name);
      if (result.error || !result.audio) throw new Error(result.error || "Your recording could not be checked.");
      if (current && current.id !== result.audio.id) await discardAudioUpload(eventId, current.id);
      change({ ...music, source: "upload", youtubeUrl: "", uploadedAudio: result.audio });
      form.reset(); setFeedback("Audio uploaded. Preview it below, then save your invitation to apply it.");
    } catch (error) {
      if (uploadedId) await discardAudioUpload(eventId, uploadedId);
      setFeedback(error instanceof Error ? error.message : "Your upload could not finish. Please retry.");
    } finally { setPending(false); busy?.(false); }
  }
  async function remove() {
    if (!eventId || !current) return;
    setPending(true); busy?.(true);
    try {
      const result = await discardAudioUpload(eventId, current.id);
      if (result.error) { setFeedback(result.error); return; }
      change({ ...music, source: "original", uploadedAudio: undefined, youtubeUrl: "" });
      setFeedback("Custom audio removed from this draft. Save your invitation to apply the change. You can also turn music off.");
    } catch { setFeedback("The recording could not be removed. Check your connection and try again.");
    } finally { setPending(false); busy?.(false); }
  }
  if (!eventId) return <div className="editor-custom-audio"><h3>Your song. Your voice. Your moment.</h3><p>{signedIn ? "Save your invitation once, then upload an MP3 from your device." : "Sign in and save your invitation to upload your own song or voice recording."}</p>{signedIn ? <button type="button" className="button button-secondary" onClick={saveForAudio}>Save invitation to add audio</button> : <Link className="button button-secondary" data-preserve-draft="true" onClick={preserveForAudio} href="/login">Sign in to add audio</Link>}</div>;
  return <div className="editor-custom-audio">
    <form onSubmit={upload}><label className="form-field">Your MP3 file<input name="audio" type="file" accept="audio/mpeg,.mp3" required disabled={pending} /><small>MP3 · up to 10 MB and 15 minutes. Add a song or a personal voice recording.</small></label><button type="submit" className="button button-secondary" disabled={pending}>{pending ? <Loader2 size={16} className="editor-spinner" /> : <Upload size={16} />}{pending ? "Uploading audio…" : current ? "Replace audio" : "Upload audio"}</button></form>
    {current && <div className="editor-uploaded-audio"><strong>{current.name}</strong><span>Selected for this invitation</span><button type="button" className="button button-secondary" disabled={pending} onClick={() => void remove()}>Remove custom audio</button></div>}
    <p className="editor-help-note">Your recording stays private while the invitation is a draft. Guests can listen after you save and publish.</p>
    {feedback && <p className="form-feedback" role="status">{feedback}</p>}
  </div>;
}
