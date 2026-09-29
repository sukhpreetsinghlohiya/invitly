import type { ThemeId } from "@/types/invitation";

export type ThemeFamily = "Indian" | "Minimal" | "Floral" | "Contemporary";
export type InvitationTheme = { id: ThemeId; name: string; category: string; description: string; number: string; family: ThemeFamily; accent: string };

export const themes: InvitationTheme[] = [
  { id: "royal", name: "Royal Indian", category: "THE GULMOHAR EDIT", description: "A maroon arch, marigold warmth, and a celebration with a little grandeur.", number: "01", family: "Indian", accent: "#58252f" },
  { id: "modern", name: "Modern Minimal", category: "THE NOOR EDIT", description: "Room to breathe, thoughtful type, and your story at the centre.", number: "02", family: "Minimal", accent: "#33473f" },
  { id: "floral", name: "Floral Celebration", category: "THE MOGRA EDIT", description: "Soft petals. Sage leaves. A love that blooms in its own time.", number: "03", family: "Floral", accent: "#3f624d" },
  { id: "mehfil", name: "Midnight Mehfil", category: "UNDER A VELVET SKY", description: "Indigo evenings, golden jaali, and a gathering written in the stars.", number: "04", family: "Indian", accent: "#283650" },
  { id: "kesar", name: "Kesar & Sunshine", category: "A LITTLE GOLDEN JOY", description: "Saffron skies, folk flowers, and the unmistakable warmth of home.", number: "05", family: "Indian", accent: "#995020" },
  { id: "lotus", name: "The Lotus Letter", category: "LOVE, SOFTLY SPOKEN", description: "Blush petals, a delicate oval, and a little poetry on the water.", number: "06", family: "Floral", accent: "#864954" },
  { id: "pichwai", name: "Pichwai Garden", category: "IN THE PALACE GARDEN", description: "A sage-green courtyard, painted peacocks, and a garden in celebration.", number: "07", family: "Indian", accent: "#435947" },
  { id: "ocean", name: "By the Blue", category: "WHERE TWO TIDES MEET", description: "Sea-glass blues, sweeping tides, and the freedom of a coastal celebration.", number: "08", family: "Contemporary", accent: "#225972" },
  { id: "champagne", name: "Champagne Hour", category: "AN EVENING TO REMEMBER", description: "Golden geometry, beautiful symmetry, and an invitation with a little sparkle.", number: "09", family: "Minimal", accent: "#75603e" },
  { id: "sindoor", name: "Sindoor Stories", category: "FULL OF HEART & COLOUR", description: "Vermillion, rangoli, and a joyful little promise surrounded by colour.", number: "10", family: "Indian", accent: "#a43828" },
];

export function resolveTheme(value?: string): ThemeId {
  return themes.find((theme) => theme.id === value)?.id ?? "royal";
}
