import { themes } from "@/data/themes";
import { defaultDesign, getOccasion, occasions, traditions } from "@/data/occasions";
import { defaultMusic, musicMoods, recordedTrack, youtubeVideoId } from "@/data/music";
import { parseUploadedAudio } from "@/lib/audio";
import { parseInvitationVideo } from "@/lib/invitation-video";
import { isOpeningStyle } from "@/data/invitation-openings";
import { festivalPresets } from "@/data/festivals";
import type { Invitation, InvitationDesign, OccasionId, SectionId, ThemeId, TraditionId } from "@/types/invitation";

export type InvitationDraft = { themeId: ThemeId; invitation: Invitation; musicEnabled: boolean };
export type InvitationDraftResult = { data: InvitationDraft; error?: never } | { error: string; data?: never };

/** Validate the calendar components, not just Date.parse's normalized result. */
export function isValidInvitationDate(value: string) {
  const parts = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return false;
  const wallClock = `${parts[1]}T${parts[2]}:${parts[3] || "00"}`;
  const utc = new Date(`${wallClock}Z`);
  if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 19) !== wallClock) return false;
  if (parts[5] !== "Z") {
    const [hours, minutes] = parts[5].slice(1).split(":").map(Number);
    if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) return false;
  }
  return Number.isFinite(Date.parse(value));
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is missing or invalid.`);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, min = 0) {
  if (typeof value !== "string") throw new Error(`Enter ${label.toLowerCase()}.`);
  const clean = value.trim();
  if (clean.length < min || clean.length > max) throw new Error(`${label} must use ${min ? `${min}–` : "no more than "}${max} characters.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(clean)) throw new Error(`${label} contains unsupported characters.`);
  return clean;
}

function identifier(value: unknown, label: string, max = 80, min = 1) {
  const clean = text(value, label, max, min);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) throw new Error(`${label} can use lowercase letters, numbers, and single hyphens.`);
  return clean;
}

function date(value: unknown, label: string) {
  const clean = text(value, label, 40, 1);
  if (!isValidInvitationDate(clean)) throw new Error(`${label} must be a real date and time with a timezone offset.`);
  return new Date(clean).toISOString();
}

function pair(value: unknown, label: string, max: number, firstMin = 0, secondMin = 0): [string, string] {
  if (!Array.isArray(value) || value.length !== 2) throw new Error(`Enter both ${label.toLowerCase()}.`);
  return [text(value[0], `${label} (first)`, max, firstMin), text(value[1], `${label} (second)`, max, secondMin)];
}

function personProfiles(value: unknown): Invitation["personProfiles"] {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== 2) throw new Error("Add one portrait card for each person.");
  const profiles = value.map((item, index) => {
    const source = record(item, `Person ${index + 1} portrait card`);
    const photoId = text(source.photoId ?? "", `Person ${index + 1} portrait`, 36);
    if (photoId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId)) throw new Error("Choose a valid uploaded portrait photo.");
    return { photoId, grandparents: text(source.grandparents ?? "", `Person ${index + 1} grandparents`, 240), ...(source.parentsPrefix === undefined ? {} : { parentsPrefix: text(source.parentsPrefix, "Parents prefix", 60) }), ...(source.grandparentsPrefix === undefined ? {} : { grandparentsPrefix: text(source.grandparentsPrefix, "Grandparents prefix", 60) }) };
  });
  return [profiles[0], profiles[1]];
}

export function validateMapUrl(value: unknown) {
  const clean = text(value ?? "", "Map link", 2000);
  if (!clean) return "";
  try { const url = new URL(clean); if (url.protocol === "https:" && !url.username && !url.password) return url.href; } catch {}
  throw new Error("Map links must be a complete HTTPS URL without a username or password.");
}

function design(value: unknown, allowIncompleteMusic: boolean): InvitationDesign {
  if (value === undefined) return { ...defaultDesign, sectionOrder: [...defaultDesign.sectionOrder] };
  const source = record(value, "Design settings");
  if (!["original", "rose", "sage", "indigo"].includes(String(source.palette)) || !["original", "serif", "sans", "script"].includes(String(source.typography))) throw new Error("Choose an available colour palette and typography style.");
  if (typeof source.decoration !== "boolean" || typeof source.countdown !== "boolean") throw new Error("Choose valid decoration and countdown settings.");
  if (source.rsvp !== undefined && typeof source.rsvp !== "boolean") throw new Error("Choose whether to show RSVP.");
  if (source.traditionSymbol !== undefined && typeof source.traditionSymbol !== "boolean") throw new Error("Choose whether to show the tradition symbol.");
  let opening: InvitationDesign["opening"];
  if (source.opening !== undefined) {
    const entry = record(source.opening, "Invitation opening");
    if (!isOpeningStyle(entry.style) || !["rings", "flower", "monogram"].includes(String(entry.icon))) throw new Error("Choose an available opening style and cover icon.");
    opening = { style: entry.style, icon: entry.icon as NonNullable<InvitationDesign["opening"]>["icon"], line: text(entry.line ?? "", "Opening line", 160) };
  }
  const order = source.sectionOrder;
  if (!Array.isArray(order) || order.length !== 5 || new Set(order).size !== 5 || !order.every(item => defaultDesign.sectionOrder.includes(item))) throw new Error("Each invitation section must appear once in the section order.");
  const motion = source.motion ?? "gentle";
  if (!["gentle", "expressive", "none"].includes(String(motion))) throw new Error("Choose an available motion style.");
  const music = source.music === undefined ? defaultMusic : record(source.music, "Music settings");
  if (!["original", "youtube", "library", "upload"].includes(String(music.source))) throw new Error("Choose an available music source.");
  const track = musicMoods.find(item => item.id === music.track);
  if (!track) throw new Error("Choose an available instrumental mood.");
  const youtubeUrl = text(music.youtubeUrl ?? "", "YouTube song link", 500);
  const videoId = youtubeVideoId(youtubeUrl);
  if (youtubeUrl && !videoId) throw new Error("Paste a complete HTTPS YouTube video link, not a playlist or embed code.");
  if (music.source === "youtube" && !videoId && !allowIncompleteMusic) throw new Error("Add your YouTube song link, choose an instrumental, or turn music off before publishing.");
  const audioTrack = typeof music.audioTrack === "string" ? recordedTrack(music.audioTrack) : undefined;
  if (music.source === "library" && !audioTrack) throw new Error("Choose an available wedding song.");
  const uploadedAudio = music.source === "upload" ? parseUploadedAudio(music.uploadedAudio) : null;
  if (music.source === "upload" && !uploadedAudio) throw new Error("Upload your MP3 before selecting custom audio.");
  return { palette: source.palette as InvitationDesign["palette"], typography: source.typography as InvitationDesign["typography"], decoration: source.decoration, ...(source.traditionSymbol === undefined ? {} : { traditionSymbol: source.traditionSymbol as boolean }), countdown: source.countdown, rsvp: source.rsvp ?? true, ...(opening ? { opening } : {}), sectionOrder: order as SectionId[], motion: motion as InvitationDesign["motion"], music: { source: music.source as NonNullable<InvitationDesign["music"]>["source"], track: track.id, youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "", ...(audioTrack ? { audioTrack: audioTrack.id } : {}), ...(uploadedAudio ? { uploadedAudio } : {}) } };
}

/** Shared client/server validation. Copies an allowlist of fields as plain text. */
export function validateInvitationDraft(input: unknown, mode: "draft" | "publish" = "publish"): InvitationDraftResult {
  try {
    const draft = record(input, "Invitation");
    const theme = themes.find(item => item.id === draft.themeId);
    if (!theme) throw new Error("Choose an available invitation theme.");
    if (typeof draft.musicEnabled !== "boolean") throw new Error("Choose whether to offer the optional music button.");
    const source = record(draft.invitation, "Invitation details");
    const occasion = source.occasion ?? "wedding";
    const tradition = source.tradition ?? "neutral";
    if (!occasions.some(item => item.id === occasion)) throw new Error("Choose an available occasion.");
    if (!traditions.some(item => item.id === tradition)) throw new Error("Choose a tradition or the neutral option.");
    const required = mode === "publish" ? 1 : 0;
    const checkDate = (value: unknown, label: string) => mode === "draft" && value === "" ? "" : date(value, label);
    const timezone = text(source.timezone, "Timezone", 80, 1);
    try { new Intl.DateTimeFormat("en-IN", { timeZone: timezone }).format(0); } catch { throw new Error("Choose a valid timezone."); }
    if (!Array.isArray(source.functions) || source.functions.length > 100) throw new Error("Use up to 100 schedule items per invitation.");
    const functions: Invitation["functions"] = source.functions.map((value, index) => {
      const item = record(value, `Function ${index + 1}`);
      const icon = item.icon;
      const itemRequired = item.visibility === "hidden" ? 0 : required;
      if (icon !== "sun" && icon !== "music" && icon !== "heart" && icon !== "sparkles") throw new Error(`Choose an icon for function ${index + 1}.`);
      return {
        id: identifier(item.id, `Function ${index + 1} ID`),
        name: text(item.name, `Function ${index + 1} name`, 80, itemRequired),
        description: text(item.description, `Function ${index + 1} description`, 1000),
        startsAt: item.visibility === "hidden" && item.startsAt === "" ? "" : checkDate(item.startsAt, `Function ${index + 1} date`),
        venue: text(item.venue, `Function ${index + 1} venue`, 200, itemRequired),
        address: text(item.address, `Function ${index + 1} address`, 500, itemRequired),
        dressCode: text(item.dressCode, `Function ${index + 1} dress code`, 100), icon,
        mapUrl: validateMapUrl(item.mapUrl),
        visibility: item.visibility === undefined || item.visibility === "public" ? "public" : item.visibility === "hidden" ? "hidden" : (() => { throw new Error("Choose a valid schedule visibility."); })(),
      };
    });
    if (new Set(functions.map(item => item.id)).size !== functions.length) throw new Error("Each function needs a unique ID.");
    if (!Array.isArray(source.updates) || source.updates.length > 20) throw new Error("Use no more than 20 guest updates.");
    const updates: Invitation["updates"] = source.updates.map((value, index) => {
      const item = record(value, `Update ${index + 1}`);
      return { id: identifier(item.id, `Update ${index + 1} ID`), time: text(item.time, `Update ${index + 1} label`, 120, 1), message: text(item.message, `Update ${index + 1} message`, 1000, 1) };
    });
    if (new Set(updates.map(item => item.id)).size !== updates.length) throw new Error("Each update needs a unique ID.");
    let profileSection: Invitation["profileSection"];
    if (source.profileSection !== undefined) {
      const entry = record(source.profileSection, "Portrait section");
      if (entry.showPhotos !== undefined && typeof entry.showPhotos !== "boolean") throw new Error("Choose whether to show portraits.");
      profileSection = { ...(entry.heading === undefined ? {} : { heading: text(entry.heading, "Portrait section heading", 120) }), showPhotos: entry.showPhotos ?? true };
    }
    let video: Invitation["video"];
    if (source.video !== undefined) {
      const entry = record(source.video, "Invitation video");
      if (typeof entry.enabled !== "boolean") throw new Error("Choose whether to show your video.");
      const url = text(entry.url ?? "", "Video link", 500);
      const parsed = url ? parseInvitationVideo(url) : null;
      if (url && !parsed) throw new Error("Use a complete HTTPS YouTube or Vimeo video link.");
      if (entry.enabled && !parsed && mode === "publish") throw new Error("Add a video link or turn the video off before publishing.");
      video = { enabled: entry.enabled, url: parsed?.externalUrl || "", ...(entry.title === undefined ? {} : { title: text(entry.title, "Video title", 120) }) };
    }
    let festival: Invitation["festival"];
    if (source.festival !== undefined) {
      const entry = record(source.festival, "Festival details");
      const preset = festivalPresets.find(item => item.id === entry.preset);
      if (!preset) throw new Error("Choose an available festival.");
      festival = { preset: preset.id, title: text(entry.title ?? "", "Festival title", 100, occasion === "festival" ? required : 0) };
    }
    const invitation: Invitation = {
      occasion: occasion as OccasionId, tradition: tradition as TraditionId,
      ...(festival ? { festival } : {}),
      traditionLabel: text(source.traditionLabel ?? "", "Custom tradition", 100),
      blessing: text(source.blessing ?? "", "Optional blessing", 1000),
      coverText: text(source.coverText ?? getOccasion(String(occasion)).cover, "Cover text", 160),
      closingText: text(source.closingText ?? getOccasion(String(occasion)).signoff, "Closing message", 300),
      design: { ...design(source.design, mode === "draft" || !draft.musicEnabled), ...(occasion === "remembrance" ? { countdown: false } : {}) },
      coverPhotoId: source.coverPhotoId === undefined || source.coverPhotoId === "" ? "" : text(source.coverPhotoId, "Cover photo", 36),
      ...(source.personProfiles === undefined ? {} : { personProfiles: personProfiles(source.personProfiles) }),
      ...(profileSection ? { profileSection } : {}),
      ...(source.countdownAt === undefined ? {} : { countdownAt: source.countdownAt === "" ? "" : date(source.countdownAt, "Countdown end date") }),
      ...(video ? { video } : {}),
      slug: identifier(source.slug, "Link name", 100, 3),
      couple: pair(source.couple, "Names", 60, required, getOccasion(String(occasion)).people === 2 ? required : 0),
      initials: text(source.initials, "Initials", 8),
      intro: text(source.intro, "Opening line", 160),
      message: text(source.message, "Invitation message", 5000),
      families: pair(source.families, "Family names", 120),
      city: text(source.city, "City", 160),
      weddingAt: checkDate(source.weddingAt, "Event date"), timezone, functions, updates,
    };
    if (invitation.coverPhotoId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitation.coverPhotoId)) throw new Error("Choose a valid uploaded cover photo.");
    if (new TextEncoder().encode(JSON.stringify(invitation)).length > 60000) throw new Error("This invitation is too long. Shorten descriptions or guest updates.");
    return { data: { themeId: theme.id, invitation, musicEnabled: draft.musicEnabled } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Check your invitation details and try again." };
  }
}
