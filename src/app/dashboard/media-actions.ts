"use server";

import sharp, { type OutputInfo } from "sharp";
import { revalidatePath } from "next/cache";
import { requireHostEvent, isUuid } from "@/lib/host-event";
import { EVENT_MEDIA_BUCKET } from "@/lib/supabase/storage";
import { PHOTO_UPLOAD_ERROR, PHOTO_UPLOAD_MAX_BYTES } from "@/lib/photo-upload";
import type { EventPhoto } from "@/types/media";
export type { EventPhoto } from "@/types/media";

export async function uploadEventPhoto(eventId: string, form: FormData): Promise<{ error?: string; photo?: EventPhoto }> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > PHOTO_UPLOAD_MAX_BYTES) return { error: PHOTO_UPLOAD_ERROR };
    if (!alt || alt.length > 300) return { error: "Describe your photo in 1–300 characters for guests using screen readers." };
    const { count, error: countError } = await client.from("media").select("id", { count: "exact", head: true }).eq("event_id", eventId);
    if (countError) return { error: "Photo storage is unavailable. Check the latest database migration." };
    if ((count || 0) >= 12) return { error: "Use up to 12 photos. Remove one before uploading another." };
    let processed: { data: Buffer; info: OutputInfo };
    try {
      const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 24000000, animated: false, failOn: "warning" });
      const metadata = await input.metadata();
      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages || 1) > 1) return { error: "Choose a still JPG, PNG, or WebP photo." };
      processed = await input.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    } catch { return { error: "That photo could not be read. Choose an undamaged image under 24 megapixels." }; }
    const path = `${eventId}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await client.storage.from(EVENT_MEDIA_BUCKET).upload(path, processed.data, { contentType: "image/webp", cacheControl: "0", upsert: false });
    if (uploadError) return { error: "The photo could not be uploaded. Check your connection and storage setup, then retry." };
    const { data: photo, error } = await client.from("media").insert({ event_id: eventId, storage_path: path, alt_text: alt, mime_type: "image/webp", size_bytes: processed.data.length, width: processed.info.width, height: processed.info.height }).select("id").single();
    if (error || !photo) {
      await client.storage.from(EVENT_MEDIA_BUCKET).remove([path]);
      return { error: "The photo metadata could not be saved. Please retry." };
    }
    revalidatePath("/customize");
    revalidatePath(`/i/${event.slug}`);
    return { photo: { id: photo.id, url: `/dashboard/events/${eventId}/media/${photo.id}`, alt, width: processed.info.width, height: processed.info.height } };
  } catch (error) { return { error: error instanceof Error ? error.message : "The upload service is unavailable. Please retry." }; }
}

export async function deleteEventPhoto(eventId: string, mediaId: string): Promise<{ error?: string }> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    if (!isUuid(mediaId)) return { error: "Choose a valid photo." };
    const { data: photo } = await client.from("media").select("storage_path").eq("id", mediaId).eq("event_id", eventId).maybeSingle();
    if (!photo) return { error: "That photo is not part of your invitation." };
    const { error: storageError } = await client.storage.from(EVENT_MEDIA_BUCKET).remove([photo.storage_path]);
    if (storageError) return { error: "The photo could not be removed. Please retry." };
    const { error } = await client.from("media").delete().eq("id", mediaId).eq("event_id", eventId);
    if (error) return { error: "The image was removed but its record needs another removal attempt." };
    revalidatePath("/customize");
    revalidatePath(`/i/${event.slug}`);
    return {};
  } catch (error) { return { error: error instanceof Error ? error.message : "The photo service is unavailable." }; }
}
