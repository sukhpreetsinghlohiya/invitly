"use server";

import { isOccasionAvailable, occasionComingSoonMessage } from "@/data/occasion-availability";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { themes } from "@/data/themes";
import { getOccasion, invitationNames } from "@/data/occasions";
import { validateInvitationDraft } from "@/lib/invitation-draft";
import type { Invitation } from "@/types/invitation";
import type { Json } from "@/types/database";
import { getInvitationAllowance } from "@/lib/invitation-allowance";
import { ALLOWANCE_UNAVAILABLE_MESSAGE, INVITATION_LIMIT_MESSAGE, isInvitationLimitError } from "@/lib/invitation-plan";
import { EVENT_AUDIO_BUCKET, selectedUploadedAudio, uploadedAudioPath } from "@/lib/audio";
import { validateMp3 } from "@/lib/audio-file";
import { createMediaServiceClient } from "@/lib/supabase/media-server";

export type EventFormState = { error?: string; success?: string; upgradeRequired?: boolean };

export async function createEvent(_previous: EventFormState, formData: FormData): Promise<EventFormState> {
  if (!getSupabaseConfig()) return { error: "Connect Supabase before creating an event." };
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const venue = String(formData.get("venue") || "").trim();
  const date = String(formData.get("date") || "");
  const themeId = String(formData.get("theme") || "");
  if (!title || title.length > 160) return { error: "Add an event title using 1–160 characters." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 100) return { error: "Use 3–100 lowercase letters, numbers, and single hyphens for your link name." };
  if (!venue || venue.length > 500) return { error: "Add a venue using 1–500 characters." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}:00+05:30`))) return { error: "Choose a valid event date and time." };
  // Date.parse normalizes impossible dates such as February 31; reject those.
  const wallClock = new Date(`${date}:00Z`);
  if (wallClock.toISOString().slice(0, 16) !== date) return { error: "That date does not exist. Choose a valid calendar date and time." };
  if (!themes.some(theme => theme.id === themeId)) return { error: "Choose an available invitation theme." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session expired. Sign in again before creating an event." };
    const allowance = await getInvitationAllowance(supabase, user.id).catch(() => null);
    if (!allowance) return { error: ALLOWANCE_UNAVAILABLE_MESSAGE };
    if (allowance.limitReached) return { error: INVITATION_LIMIT_MESSAGE, upgradeRequired: true };
    const { error } = await supabase.from("events").insert({ owner_id: user.id, title, slug, venue, starts_at: new Date(`${date}:00+05:30`).toISOString(), theme_id: themeId });
    if (isInvitationLimitError(error)) return { error: INVITATION_LIMIT_MESSAGE, upgradeRequired: true };
    if (error) return { error: error.code === "23505" ? "That link name is already taken. Try another." : "We couldn’t save this event. Check your Supabase migrations and try again." };
    revalidatePath("/dashboard");
    return { success: "Your event draft is saved. Publish it from your celebrations list when you’re ready to share." };
  } catch {
    return { error: "The event service is unavailable. Please try again." };
  }
}

export async function saveInvitation(input: { eventId?: string; themeId: string; invitation: Invitation; musicEnabled: boolean }): Promise<{ error?: string; upgradeRequired?: boolean; eventId?: string; slug?: string; published?: boolean; publishedAt?: string | null }> {
  const validation = validateInvitationDraft(input, "draft");
  if (!validation.data) return { error: validation.error };
  if (!input.eventId && !isOccasionAvailable(validation.data.invitation.occasion)) return { error: occasionComingSoonMessage };
  if (!getSupabaseConfig()) return { error: "Your preview is ready. Connect Supabase to save and publish a permanent invitation link." };
  const eventId = input.eventId;
  if (eventId !== undefined && (typeof eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId))) return { error: "Choose a valid invitation to edit." };
  const { invitation, themeId, musicEnabled } = validation.data;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in to save your invitation. Your browser preview is still available." };
    if (!eventId) {
      const allowance = await getInvitationAllowance(supabase, user.id).catch(() => null);
      if (!allowance) return { error: ALLOWANCE_UNAVAILABLE_MESSAGE };
      if (allowance.limitReached) return { error: INVITATION_LIMIT_MESSAGE, upgradeRequired: true };
    }
    let previousSlug: string | undefined;
    if (eventId) {
      const { data: existing, error: readError } = await supabase.from("events").select("slug,is_published,invitation_content").eq("id", eventId).eq("owner_id", user.id).maybeSingle();
      if (readError || !existing) return { error: "This invitation could not be found. You can only edit invitations you own." };
      const content = existing.invitation_content;
      const previousOccasion = content && typeof content === "object" && !Array.isArray(content) ? content.occasion || "wedding" : "other";
      if (!isOccasionAvailable(invitation.occasion) && invitation.occasion !== previousOccasion) return { error: occasionComingSoonMessage };
      previousSlug = existing.slug;
      if (existing.is_published) {
        const complete = validateInvitationDraft(input, "publish");
        if (complete.error) return { error: "This invitation is live. Complete its details or unpublish it before saving an incomplete draft. " + complete.error };
      }
    }
    const selectedPhotoIds = [...new Set([invitation.coverPhotoId, ...(invitation.personProfiles || []).map(profile => profile.photoId)].filter((id): id is string => Boolean(id)))];
    if (selectedPhotoIds.length) {
      if (!eventId) return { error: "Upload photos to this invitation before selecting them." };
      const { data: selectedPhotos, error: photoError } = await supabase.from("media").select("id").eq("event_id", eventId).in("id", selectedPhotoIds);
      if (photoError || selectedPhotos?.length !== selectedPhotoIds.length) return { error: "Choose cover and portrait photos uploaded to this invitation." };
    }
    const uploadedAudio = selectedUploadedAudio(invitation);
    if (uploadedAudio) {
      if (!eventId || uploadedAudio.eventId !== eventId.toLowerCase()) return { error: "Upload audio to this invitation before selecting it." };
      const { data: audio, error: audioError } = await createMediaServiceClient().storage.from(EVENT_AUDIO_BUCKET).download(uploadedAudioPath(uploadedAudio));
      if (audioError || !audio) return { error: "Your uploaded audio is unavailable. Upload it again or choose another soundtrack." };
      try { await validateMp3(audio); } catch (problem) { return { error: problem instanceof Error ? problem.message : "Choose a readable MP3." }; }
    }
    const values = {
      title: invitationNames(invitation) || `Untitled ${getOccasion(invitation.occasion).name.toLowerCase()}`,
      slug: invitation.slug, description: invitation.message, starts_at: invitation.weddingAt || null,
      venue: invitation.functions[0]?.venue || invitation.city, theme_id: themeId,
      invitation_content: invitation as unknown as Json, music_enabled: musicEnabled, timezone: invitation.timezone,
    };
    const query = eventId
      ? supabase.from("events").update(values).eq("id", eventId).eq("owner_id", user.id)
      : supabase.from("events").insert({ ...values, owner_id: user.id, is_published: false });
    const { data, error } = await query.select("id,slug,is_published,published_at").maybeSingle();
    if (isInvitationLimitError(error)) return { error: INVITATION_LIMIT_MESSAGE, upgradeRequired: true };
    if (error || !data) return { error: error?.code === "23505" ? "That invitation link is already taken. Choose another link name." : "We couldn’t save your invitation. Check that the latest database migrations are applied and try again." };
    revalidatePath("/dashboard");
    revalidatePath("/customize");
    revalidatePath(`/invite/${data.slug}`);
    revalidatePath(`/i/${data.slug}`);
    if (previousSlug && previousSlug !== data.slug) revalidatePath(`/invite/${previousSlug}`);
    if (previousSlug && previousSlug !== data.slug) revalidatePath(`/i/${previousSlug}`);
    return { eventId: data.id, slug: data.slug, published: data.is_published, publishedAt: data.published_at };
  } catch {
    return { error: "The invitation service is unavailable. Your preview remains available; please try saving again." };
  }
}

export async function setPublication(eventId: string, published: boolean): Promise<EventFormState> {
  if (!getSupabaseConfig()) return { error: "Connect Supabase before publishing." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId) || typeof published !== "boolean") return { error: "Choose a valid event." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return { error: "Your session expired. Please sign in again." };
    const { data: existing } = await supabase.from("events").select("invitation_content,theme_id,music_enabled,published_at").eq("id", eventId).eq("owner_id", user.id).maybeSingle();
    if (!existing) return { error: "This invitation could not be found in your account." };
    if (published) {
      const checked = validateInvitationDraft({ invitation: existing.invitation_content, themeId: existing.theme_id, musicEnabled: existing.music_enabled });
      if (checked.error) return { error: "Complete and save your invitation in the editor before publishing. " + checked.error };
    }
    const { data, error } = await supabase.from("events").update({ is_published: published, published_at: published ? existing.published_at || new Date().toISOString() : existing.published_at }).eq("id", eventId).eq("owner_id", user.id).select("slug").maybeSingle();
    if (error || !data) return { error: "We couldn’t update this event. You may only manage events you own." };
    revalidatePath("/dashboard");
    revalidatePath(`/invite/${data.slug}`);
    revalidatePath(`/i/${data.slug}`);
    revalidatePath("/customize");
    return { success: published ? "Your invitation is live. Anyone with its link can view it." : "Your invitation is now private. The public link is unavailable." };
  } catch {
    return { error: "The event service is unavailable. Please try again." };
  }
}
