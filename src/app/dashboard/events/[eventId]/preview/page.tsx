import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvitationView } from "@/components/invitation-view";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/host-event";
import { parsePublicInvitation } from "@/lib/public-invitation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Private invitation preview", description: "An owner-only preview of your invitation.", robots: { index: false, follow: false }, openGraph: { title: "Private invitation preview", description: "Sign in to view your invitation.", images: [] } };

export default async function HostInvitationPreview({ params }: { params: Promise<{ eventId: string }> }) {
  if (!getSupabaseConfig()) redirect("/setup");
  const { eventId } = await params;
  if (!isUuid(eventId)) notFound();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (!user || authError) redirect("/login");
  const { data: event, error } = await client.from("events").select("*").eq("id", eventId).eq("owner_id", user.id).maybeSingle();
  if (error) throw new Error("Your private preview could not be loaded. Please try again.");
  if (!event) notFound();
  const [photos, segments, updates] = await Promise.all([
    client.from("media").select("id,alt_text,width,height").eq("event_id", eventId).order("created_at"),
    client.from("event_segments").select("*").eq("event_id", eventId).order("sort_order"),
    client.from("event_updates").select("*").eq("event_id", eventId).eq("is_published", true).order("created_at", { ascending: false }),
  ]);
  if (photos.error || segments.error || updates.error) throw new Error("Some preview details could not be loaded. Please try again.");
  const parsed = parsePublicInvitation({ ...event, photos: photos.data, segments: segments.data, updates: updates.data }, "draft");
  if (!parsed) throw new Error("This invitation needs valid details before it can be previewed.");
  const invitation = { ...parsed.invitation, functions: parsed.invitation.functions.filter(item => item.visibility !== "hidden"), updates: parsed.announcements.map(update => ({ id: update.id, message: update.message, time: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: parsed.invitation.timezone }).format(new Date(update.updated_at)) })) };
  return <InvitationView invitation={invitation} theme={parsed.themeId} musicEnabled={parsed.musicEnabled} mode="preview" previewBackHref={`/customize?event=${eventId}`} photos={parsed.photos.map(photo => ({ ...photo, url: `/dashboard/events/${eventId}/media/${photo.id}` }))} />;
}
