import type { UploadedAudio } from "@/types/invitation";

export const EVENT_AUDIO_BUCKET = "event-audio";
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseUploadedAudio(value: unknown): UploadedAudio | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const audio = value as Record<string, unknown>;
  if (typeof audio.id !== "string" || !uuid.test(audio.id) || typeof audio.eventId !== "string" || !uuid.test(audio.eventId) || typeof audio.name !== "string") return null;
  const name = audio.name.trim();
  if (!name || name.length > 180 || /[\u0000-\u001f\u007f]/.test(name)) return null;
  return { id: audio.id.toLowerCase(), eventId: audio.eventId.toLowerCase(), name };
}

export function uploadedAudioUrl(audio: UploadedAudio) { return `/audio/${audio.eventId}/${audio.id}`; }
export function uploadedAudioPath(audio: Pick<UploadedAudio, "id" | "eventId">) { return `${audio.eventId}/${audio.id}.mp3`; }

export function selectedUploadedAudio(content: unknown): UploadedAudio | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const design = (content as { design?: { music?: { source?: string; uploadedAudio?: unknown } } }).design;
  return design?.music?.source === "upload" ? parseUploadedAudio(design.music.uploadedAudio) : null;
}
