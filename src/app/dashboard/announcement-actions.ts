"use server";

import { revalidatePath } from "next/cache";
import { isUuid, requireHostEvent } from "@/lib/host-event";

export type HostAnnouncement = { id: string; event_id: string; message: string; pinned: boolean; is_published: boolean; created_at: string; updated_at: string };
export type AnnouncementResult = { error?: string; success?: string; announcement?: HostAnnouncement };
const columns = "id,event_id,message,pinned,is_published,created_at,updated_at";

function refreshAnnouncements(eventId: string, slug: string) {
  revalidatePath(`/dashboard/events/${eventId}/announcements`);
  revalidatePath(`/dashboard/events/${eventId}/preview`);
  revalidatePath(`/i/${slug}`);
}
function failure(error: unknown): AnnouncementResult {
  const safeMessages = ["Choose a valid invitation.", "Sign in again to manage your invitation.", "This invitation is unavailable. You can only manage invitations you own."];
  return { error: error instanceof Error && safeMessages.includes(error.message) ? error.message : "The announcement service is unavailable. Please try again." };
}

export async function saveAnnouncement(eventId: string, announcementId: string | null, form: FormData): Promise<AnnouncementResult> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    if (announcementId !== null && !isUuid(announcementId)) return { error: "Choose a valid announcement to edit." };
    const message = String(form.get("message") || "").trim();
    if (message.length < 1 || message.length > 1000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) return { error: "Write an announcement using 1–1,000 characters, without unsupported characters." };
    const values = { message, pinned: form.get("pinned") === "on", is_published: form.get("is_published") === "on" };
    const query = announcementId
      ? client.from("event_updates").update({ ...values, updated_at: new Date().toISOString() }).eq("id", announcementId).eq("event_id", eventId)
      : client.from("event_updates").insert({ ...values, event_id: eventId });
    const { data, error } = await query.select(columns).maybeSingle();
    if (error || !data) return { error: "This announcement could not be saved. Check your connection and try again." };
    refreshAnnouncements(eventId, event.slug);
    return { announcement: data, success: values.is_published ? "Announcement saved for your guests." : "Announcement saved as a private draft." };
  } catch (error) { return failure(error); }
}

export async function changeAnnouncement(eventId: string, announcementId: string, field: "pinned" | "is_published", value: boolean): Promise<AnnouncementResult> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    if (!isUuid(announcementId) || !["pinned", "is_published"].includes(field) || typeof value !== "boolean") return { error: "Choose a valid announcement action." };
    const update = field === "pinned" ? { pinned: value, updated_at: new Date().toISOString() } : { is_published: value, updated_at: new Date().toISOString() };
    const { data, error } = await client.from("event_updates").update(update).eq("id", announcementId).eq("event_id", eventId).select(columns).maybeSingle();
    if (error || !data) return { error: "That announcement could not be updated. It may have been removed; refresh and try again." };
    refreshAnnouncements(eventId, event.slug);
    return { announcement: data, success: field === "pinned" ? value ? "Announcement pinned to the top." : "Announcement unpinned." : value ? "Announcement published." : "Announcement hidden from guests." };
  } catch (error) { return failure(error); }
}

export async function removeAnnouncement(eventId: string, announcementId: string): Promise<AnnouncementResult> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    if (!isUuid(announcementId)) return { error: "Choose a valid announcement to remove." };
    const { data, error } = await client.from("event_updates").delete().eq("id", announcementId).eq("event_id", eventId).select("id").maybeSingle();
    if (error || !data) return { error: "That announcement could not be removed. Refresh and try again." };
    refreshAnnouncements(eventId, event.slug);
    return { success: "Announcement removed." };
  } catch (error) { return failure(error); }
}
