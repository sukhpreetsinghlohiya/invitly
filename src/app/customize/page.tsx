import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvitationEditor, type EditorPhoto } from "@/components/editor/invitation-editor";
import { demoInvitation } from "@/data/demo-invitation";
import { resolveTheme } from "@/data/themes";
import { getSiteUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { validateInvitationDraft, type InvitationDraft } from "@/lib/invitation-draft";
import "./editor.css";

export const metadata: Metadata = { title: "Make it yours", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CustomizePage({ searchParams }: { searchParams: Promise<{ theme?: string; event?: string }> }) {
  const params = await searchParams;
  const configured = Boolean(getSupabaseConfig());
  let signedIn = false;
  let published = false;
  let publishedAt: string | null = null;
  let initialPhotos: EditorPhoto[] = [];
  let photoError = "";
  let initialDraft: InvitationDraft = { themeId: resolveTheme(params.theme), invitation: { ...demoInvitation, updates: [] }, musicEnabled: false };
  if (configured) {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    signedIn = Boolean(user);
    if (params.event) {
      if (!user) redirect("/login");
      if (!/^[a-f0-9-]{36}$/i.test(params.event)) notFound();
      const { data, error } = await client.from("events").select("*").eq("id", params.event).eq("owner_id", user.id).maybeSingle();
      if (error) throw new Error("Your invitation could not be loaded. Check your database migrations and try again.");
      if (!data) notFound();
      published = data.is_published;
      publishedAt = data.published_at;
      const validated = validateInvitationDraft({ themeId: data.theme_id, invitation: data.invitation_content, musicEnabled: data.music_enabled });
      if (validated.data) initialDraft = validated.data;
      else initialDraft = { ...initialDraft, themeId: resolveTheme(data.theme_id), invitation: { ...initialDraft.invitation, slug: data.slug, weddingAt: data.starts_at, message: data.description || initialDraft.invitation.message, city: data.venue || initialDraft.invitation.city } };
      const { data: media, error: mediaError } = await client.from("media").select("id,alt_text,width,height").eq("event_id", data.id).order("created_at", { ascending: true });
      if (mediaError) photoError = "Your photos could not be loaded. Refresh to try again; your invitation details are still available.";
      else initialPhotos = (media || []).map((photo) => ({ id: photo.id, alt: photo.alt_text, width: photo.width || 1200, height: photo.height || 800, url: `/dashboard/events/${data.id}/media/${photo.id}` }));
    }
  } else if (params.event) redirect("/setup");
  return <InvitationEditor initialDraft={initialDraft} eventId={params.event} published={published} publishedAt={publishedAt} initialPhotos={initialPhotos} photoError={photoError} configured={configured} signedIn={signedIn} siteUrl={getSiteUrl().origin} preferredTheme={params.theme ? resolveTheme(params.theme) : undefined} />;
}
