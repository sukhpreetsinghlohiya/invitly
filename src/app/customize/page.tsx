import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionComingSoon } from "@/components/occasion-coming-soon";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvitationEditor, type EditorPhoto } from "@/components/editor/invitation-editor";
import { createOccasionInvitation, getDesign, getOccasion, traditions } from "@/data/occasions";
import { applyFestivalPreset, festivalPresets, getFestivalPreset } from "@/data/festivals";
import { isOpeningStyle } from "@/data/invitation-openings";
import { resolveTheme } from "@/data/themes";
import { getOccasionThemes } from "@/data/occasion-themes";
import { getSiteUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { validateInvitationDraft, type InvitationDraft } from "@/lib/invitation-draft";
import { getInvitationAllowance } from "@/lib/invitation-allowance";
import "./editor.css";

export const metadata: Metadata = { title: "Make it yours", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CustomizePage({ searchParams }: { searchParams: Promise<{ theme?: string; event?: string; occasion?: string; tradition?: string; festival?: string; opening?: string }> }) {
  const params = await searchParams;
  if (!params.event && !isOccasionAvailable(getOccasion(params.occasion).id)) return <OccasionComingSoon occasion={getOccasion(params.occasion).id} />;
  const requestedTheme = params.theme ? resolveTheme(params.theme) : getOccasionThemes(getOccasion(params.occasion).id)[0].id;
  const configured = Boolean(getSupabaseConfig());
  let signedIn = false;
  let published = false;
  let publishedAt: string | null = null;
  let initialPhotos: EditorPhoto[] = [];
  let photoError = "";
  let initialDraft: InvitationDraft = { themeId: requestedTheme, invitation: { ...createOccasionInvitation(getOccasion(params.occasion).id), tradition: traditions.find(item => item.id === params.tradition)?.id || "neutral", slug: `invitation-${crypto.randomUUID().slice(0, 8)}` }, musicEnabled: false };
  if (!params.event) {
    if (initialDraft.invitation.occasion === "festival") initialDraft.invitation = applyFestivalPreset(initialDraft.invitation, getFestivalPreset(params.festival).id);
    if (isOpeningStyle(params.opening)) initialDraft.invitation = { ...initialDraft.invitation, design: { ...getDesign(initialDraft.invitation), opening: { style: params.opening, icon: "monogram", line: "An invitation, just for you" } } };
  }
  if (configured) {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    signedIn = Boolean(user);
    if (user && !params.event) {
      const allowance = await getInvitationAllowance(client, user.id);
      if (allowance.limitReached) redirect("/dashboard/plan");
    }
    if (params.event) {
      if (!user) redirect("/login");
      if (!/^[a-f0-9-]{36}$/i.test(params.event)) notFound();
      const { data, error } = await client.from("events").select("*").eq("id", params.event).eq("owner_id", user.id).maybeSingle();
      if (error) throw new Error("Your invitation could not be loaded. Check your database migrations and try again.");
      if (!data) notFound();
      published = data.is_published;
      publishedAt = data.published_at;
      const validated = validateInvitationDraft({ themeId: data.theme_id, invitation: data.invitation_content, musicEnabled: data.music_enabled }, "draft");
      if (validated.data) initialDraft = validated.data;
      else if (data.invitation_content) throw new Error("This draft contains unsupported details. Your saved content has not been changed.");
      else initialDraft = { ...initialDraft, themeId: resolveTheme(data.theme_id), invitation: { ...initialDraft.invitation, couple: [data.title, ""], occasion: "other", slug: data.slug, weddingAt: data.starts_at || "", message: data.description || initialDraft.invitation.message, city: data.venue || initialDraft.invitation.city } };
      const { data: media, error: mediaError } = await client.from("media").select("id,alt_text,width,height").eq("event_id", data.id).order("created_at", { ascending: true });
      if (mediaError) photoError = "Your photos could not be loaded. Refresh to try again; your invitation details are still available.";
      else initialPhotos = (media || []).map((photo) => ({ id: photo.id, alt: photo.alt_text, width: photo.width || 1200, height: photo.height || 800, url: `/dashboard/events/${data.id}/media/${photo.id}` }));
    }
  } else if (params.event) redirect("/setup");
  return <InvitationEditor initialDraft={initialDraft} eventId={params.event} published={published} publishedAt={publishedAt} initialPhotos={initialPhotos} photoError={photoError} configured={configured} signedIn={signedIn} siteUrl={getSiteUrl().origin} preferredOccasion={params.occasion ? getOccasion(params.occasion).id : undefined} preferredTradition={traditions.find(item => item.id === params.tradition)?.id} preferredTheme={params.theme || params.occasion ? requestedTheme : undefined} preferredFestival={festivalPresets.find(item => item.id === params.festival)?.id} preferredOpening={isOpeningStyle(params.opening) ? params.opening : undefined} />;
}
