"use server";

import { requireHostEvent, isUuid } from "@/lib/host-event";
import { createMediaServiceClient } from "@/lib/supabase/media-server";
import { EVENT_AUDIO_BUCKET, MAX_AUDIO_BYTES, parseUploadedAudio, selectedUploadedAudio, uploadedAudioPath } from "@/lib/audio";
import { validateMp3 } from "@/lib/audio-file";
import type { UploadedAudio } from "@/types/invitation";

export async function prepareAudioUpload(eventId: string, name: string, size: number): Promise<{ error?: string; id?: string; path?: string; token?: string }> {
  try {
    await requireHostEvent(eventId);
    if (typeof name !== "string" || !/\.mp3$/i.test(name) || name.length > 180 || /[\u0000-\u001f\u007f]/.test(name) || !Number.isSafeInteger(size) || size < 1 || size > MAX_AUDIO_BYTES) return { error: "Choose an MP3 up to 10 MB with a shorter file name." };
    const id = crypto.randomUUID();
    const path = uploadedAudioPath({ eventId, id });
    const { data, error } = await createMediaServiceClient().storage.from(EVENT_AUDIO_BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data) return { error: "Audio storage is unavailable. Please try again after storage setup is complete." };
    return { id, path, token: data.token };
  } catch { return { error: "Sign in and save your invitation before uploading audio." }; }
}

export async function finishAudioUpload(eventId: string, id: string, name: string): Promise<{ error?: string; audio?: UploadedAudio }> {
  try {
    await requireHostEvent(eventId);
    const audio = parseUploadedAudio({ eventId, id, name });
    if (!audio) return { error: "Choose a valid uploaded recording." };
    const storage = createMediaServiceClient().storage.from(EVENT_AUDIO_BUCKET);
    const path = uploadedAudioPath(audio);
    const { data, error } = await storage.download(path);
    if (error || !data) return { error: "The upload didn’t finish. Please choose the file and try again." };
    try { await validateMp3(data); }
    catch (problem) { await storage.remove([path]); return { error: problem instanceof Error ? problem.message : "Choose a readable MP3." }; }
    return { audio };
  } catch { return { error: "Your recording could not be checked. Please sign in and try again." }; }
}

export async function discardAudioUpload(eventId: string, id: string): Promise<{ error?: string }> {
  try {
    const { event } = await requireHostEvent(eventId);
    if (!isUuid(id)) return { error: "Choose a valid recording." };
    // The saved selection remains available until the host saves its replacement.
    if (selectedUploadedAudio(event.invitation_content)?.id === id) return {};
    const { error } = await createMediaServiceClient().storage.from(EVENT_AUDIO_BUCKET).remove([uploadedAudioPath({ eventId, id })]);
    return error ? { error: "The unused recording could not be removed. Please retry." } : {};
  } catch { return { error: "You can only remove recordings from your own invitation." }; }
}
