import type { InvitationDesign, SectionId } from "@/types/invitation";

export type WeddingLook = Pick<InvitationDesign, "palette" | "typography" | "decoration" | "motion">;

// A look changes presentation only; it never replaces a couple's content.
export const weddingLooks: { id: string; name: string; description: string; colours: [string, string, string]; settings: WeddingLook }[] = [
  { id: "heirloom", name: "Heirloom letter", description: "Rose & ivory · classic serif · gentle motion", colours: ["#713d4c", "#efe3df", "#bc9758"], settings: { palette: "rose", typography: "serif", decoration: true, motion: "gentle" } },
  { id: "garden", name: "Garden vows", description: "Sage & paper · calligraphy · gentle motion", colours: ["#355341", "#e6eadf", "#bc9758"], settings: { palette: "sage", typography: "script", decoration: true, motion: "gentle" } },
  { id: "editorial", name: "Quiet editorial", description: "Indigo & pearl · modern type · still", colours: ["#293d60", "#e6e7ee", "#a7aeba"], settings: { palette: "indigo", typography: "sans", decoration: false, motion: "none" } },
];

export function weddingLookSettings(design: InvitationDesign): WeddingLook {
  return { palette: design.palette, typography: design.typography, decoration: design.decoration, motion: design.motion || "gentle" };
}

export function sameWeddingLook(a: WeddingLook, b: WeddingLook) {
  return a.palette === b.palette && a.typography === b.typography && a.decoration === b.decoration && a.motion === b.motion;
}

export const weddingJourneys: { id: string; name: string; description: string; order: SectionId[] }[] = [
  { id: "story", name: "Our story first", description: "Welcome guests with your story, then share the plans.", order: ["story", "schedule", "photos", "rsvp", "updates"] },
  { id: "plans", name: "The plans first", description: "Put ceremonies and travel notes within easy reach.", order: ["schedule", "updates", "story", "photos", "rsvp"] },
  { id: "photos", name: "Our photos first", description: "Start with your favourite moments together.", order: ["photos", "story", "schedule", "rsvp", "updates"] },
];
