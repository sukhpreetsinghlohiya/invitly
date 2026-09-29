import { themes } from "@/data/themes";
import type { Invitation, ThemeId } from "@/types/invitation";

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

function pair(value: unknown, label: string, max: number): [string, string] {
  if (!Array.isArray(value) || value.length !== 2) throw new Error(`Enter both ${label.toLowerCase()}.`);
  return [text(value[0], `${label} (first)`, max, 1), text(value[1], `${label} (second)`, max, 1)];
}

/** Shared client/server validation. Copies an allowlist of fields as plain text. */
export function validateInvitationDraft(input: unknown): InvitationDraftResult {
  try {
    const draft = record(input, "Invitation");
    const theme = themes.find(item => item.id === draft.themeId);
    if (!theme) throw new Error("Choose an available invitation theme.");
    if (typeof draft.musicEnabled !== "boolean") throw new Error("Choose whether to offer the optional music button.");
    const source = record(draft.invitation, "Invitation details");
    const timezone = text(source.timezone, "Timezone", 80, 1);
    try { new Intl.DateTimeFormat("en-IN", { timeZone: timezone }).format(0); } catch { throw new Error("Choose a valid timezone."); }
    if (!Array.isArray(source.functions) || source.functions.length < 1 || source.functions.length > 12) throw new Error("Add between 1 and 12 functions.");
    const functions: Invitation["functions"] = source.functions.map((value, index) => {
      const item = record(value, `Function ${index + 1}`);
      const icon = item.icon;
      if (icon !== "sun" && icon !== "music" && icon !== "heart" && icon !== "sparkles") throw new Error(`Choose an icon for function ${index + 1}.`);
      return {
        id: identifier(item.id, `Function ${index + 1} ID`),
        name: text(item.name, `Function ${index + 1} name`, 80, 1),
        description: text(item.description, `Function ${index + 1} description`, 1000),
        startsAt: date(item.startsAt, `Function ${index + 1} date`),
        venue: text(item.venue, `Function ${index + 1} venue`, 200, 1),
        address: text(item.address, `Function ${index + 1} address`, 500, 1),
        dressCode: text(item.dressCode, `Function ${index + 1} dress code`, 100), icon,
      };
    });
    if (new Set(functions.map(item => item.id)).size !== functions.length) throw new Error("Each function needs a unique ID.");
    if (!Array.isArray(source.updates) || source.updates.length > 20) throw new Error("Use no more than 20 guest updates.");
    const updates: Invitation["updates"] = source.updates.map((value, index) => {
      const item = record(value, `Update ${index + 1}`);
      return { id: identifier(item.id, `Update ${index + 1} ID`), time: text(item.time, `Update ${index + 1} label`, 120, 1), message: text(item.message, `Update ${index + 1} message`, 1000, 1) };
    });
    if (new Set(updates.map(item => item.id)).size !== updates.length) throw new Error("Each update needs a unique ID.");
    const invitation: Invitation = {
      slug: identifier(source.slug, "Link name", 100, 3),
      couple: pair(source.couple, "Couple names", 60),
      initials: text(source.initials, "Initials", 8, 1),
      intro: text(source.intro, "Opening line", 160, 1),
      message: text(source.message, "Invitation message", 5000, 1),
      families: pair(source.families, "Family names", 120),
      city: text(source.city, "City", 160, 1),
      weddingAt: date(source.weddingAt, "Wedding date"), timezone, functions, updates,
    };
    if (new TextEncoder().encode(JSON.stringify(invitation)).length > 60000) throw new Error("This invitation is too long. Shorten descriptions or guest updates.");
    return { data: { themeId: theme.id, invitation, musicEnabled: draft.musicEnabled } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Check your invitation details and try again." };
  }
}
