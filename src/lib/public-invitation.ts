import "server-only";
import { cache } from "react";
import { getSupabaseConfig } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { isValidInvitationDate, validateInvitationDraft } from "@/lib/invitation-draft";
import { resolveTheme } from "@/data/themes";
import type { Invitation, ThemeId } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import type { LiveAnnouncement } from "@/types/announcements";

export type PublicInvitation = { id: string; title: string; slug: string; themeId: ThemeId; invitation: Invitation; musicEnabled: boolean; photos: EventPhoto[]; announcements: LiveAnnouncement[] };
export type GuestInvitation = { invitation: PublicInvitation; guest: { name: string; max_party_size: number }; response: { status: "attending" | "declined" | "maybe"; party_size: number; note: string; updated_at: string } | null };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isInvitationSlug(value: string) { return value.length >= 3 && value.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value); }
function object(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown, max: number) { return typeof value === "string" ? value.slice(0, max) : ""; }
// Postgres timestamps can carry microseconds; the editor validates milliseconds.
function timestamp(value: unknown) { return text(value, 40).replace(/(\.\d{3})\d+(?=Z|[+-]\d{2}:\d{2}$)/, "$1"); }
function validZone(value: unknown) { try { const zone = text(value, 80) || "Asia/Kolkata"; new Intl.DateTimeFormat("en", { timeZone: zone }).format(0); return zone; } catch { return "Asia/Kolkata"; } }

/** Only consume the SQL projection; never query raw events to fill missing public fields. */
export function parsePublicInvitation(value: unknown): PublicInvitation | null {
  const raw = object(value);
  if (!raw || typeof raw.id !== "string" || !uuid.test(raw.id) || typeof raw.slug !== "string" || !isInvitationSlug(raw.slug)) return null;
  const title = text(raw.title, 160);
  if (!title) return null;
  const themeId = resolveTheme(text(raw.theme_id, 40));
  const content = object(raw.invitation_content);
  const zone = validZone(content?.timezone ?? raw.timezone);
  let invitation: Invitation;
  if (content) {
    if (!Array.isArray(content.functions)) return null;
    // Zero visible functions is valid for a restricted group. Validate other
    // fields using a temporary function, then discard it entirely.
    const noFunctions = content.functions.length === 0;
    const placeholder = { id: "validation-only", name: "Validation", description: "", startsAt: timestamp(content.weddingAt), venue: "Validation", address: "Validation", dressCode: "", icon: "heart" };
    const functions = noFunctions ? [placeholder] : content.functions.map(item => { const event = object(item); return event ? { ...event, startsAt: timestamp(event.startsAt) } : item; });
    const checked = validateInvitationDraft({ themeId, musicEnabled: Boolean(raw.music_enabled), invitation: { ...content, weddingAt: timestamp(content.weddingAt), timezone: zone, functions } });
    if (!checked.data) return null;
    invitation = { ...checked.data.invitation, slug: raw.slug, functions: noFunctions ? [] : checked.data.invitation.functions };
  } else {
    const startsAt = timestamp(raw.starts_at);
    if (!isValidInvitationDate(startsAt)) return null;
    const functions: Invitation["functions"] = (Array.isArray(raw.segments) ? raw.segments : []).flatMap(item => {
      const segment = object(item);
      if (!segment || !isValidInvitationDate(timestamp(segment.starts_at))) return [];
      return [{ id: text(segment.id, 80), name: text(segment.title, 80), description: text(segment.description, 1000), startsAt: timestamp(segment.starts_at), venue: text(segment.venue, 200), address: text(segment.venue, 500), dressCode: "", icon: "heart" as const }];
    });
    invitation = { slug: raw.slug, couple: [title, ""], initials: Array.from(title).slice(0, 2).join(""), intro: "Together with our favourite people.", message: text(raw.description, 5000), families: ["", ""], city: text(raw.venue, 160), weddingAt: startsAt, timezone: zone, functions, updates: [] };
  }
  const photos = (Array.isArray(raw.photos) ? raw.photos : []).slice(0, 12).flatMap(item => {
    const photo = object(item);
    if (!photo || typeof photo.id !== "string" || !uuid.test(photo.id)) return [];
    return [{ id: photo.id, url: `/media/${photo.id}`, alt: text(photo.alt_text, 500) || "A moment from the celebration", width: Math.max(1, Math.min(20000, Number(photo.width) || 1600)), height: Math.max(1, Math.min(20000, Number(photo.height) || 1067)) }];
  });
  const announcements = (Array.isArray(raw.updates) ? raw.updates : []).slice(0, 100).flatMap(item => {
    const update = object(item);
    if (!update || typeof update.id !== "string" || !uuid.test(update.id) || !isValidInvitationDate(timestamp(update.created_at))) return [];
    return [{ id: update.id, message: text(update.message, 4000), created_at: timestamp(update.created_at), updated_at: isValidInvitationDate(timestamp(update.updated_at)) ? timestamp(update.updated_at) : timestamp(update.created_at), pinned: update.pinned === true }];
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.created_at) - Date.parse(a.created_at));
  return { id: raw.id, title, slug: raw.slug, themeId, invitation, musicEnabled: raw.music_enabled === true, photos, announcements };
}

async function publicRpc(name: "get_public_invitation" | "get_guest_invitation", args: Record<string, string>): Promise<unknown> {
  const client = createPublicClient();
  const { data, error } = name === "get_public_invitation" ? await client.rpc(name, { p_slug: args.p_slug }) : await client.rpc(name, { p_token: args.p_token });
  if (error) throw new Error("This invitation is temporarily unavailable. Please try again shortly.");
  return data;
}

// React cache deduplicates within one render, not across visitor requests.
export const getPublicInvitation = cache(async (slug: string): Promise<PublicInvitation | null> => {
  if (!getSupabaseConfig() || !isInvitationSlug(slug)) return null;
  return parsePublicInvitation(await publicRpc("get_public_invitation", { p_slug: slug }));
});
export const getGuestInvitation = cache(async (token: string): Promise<GuestInvitation | null> => {
  if (!getSupabaseConfig() || !/^[0-9a-f]{64}$/.test(token)) return null;
  const raw = object(await publicRpc("get_guest_invitation", { p_token: token }));
  const invitation = parsePublicInvitation(raw?.invitation);
  const guest = object(raw?.guest);
  if (!invitation || !guest || typeof guest.name !== "string") return null;
  const response = object(raw?.response);
  return { invitation, guest: { name: guest.name.slice(0, 160), max_party_size: Math.max(1, Math.min(30, Number(guest.max_party_size) || 1)) }, response: response && ["attending", "declined", "maybe"].includes(String(response.status)) ? { status: response.status as "attending" | "declined" | "maybe", party_size: Number(response.party_size) || 0, note: text(response.note, 2000), updated_at: text(response.updated_at, 40) } : null };
});
