import type { CinematicThemeId, ThemeId } from "@/types/invitation";

export const cinematicThemes = [
  { id: "aranya", name: "Temple Dawn", category: "THE TEMPLE GARDEN", description: "Temple light, a lotus pond, and a quiet beginning to your forever.", number: "11", family: "Indian", accent: "#425b47", scene: "temple", keywords: ["cinematic", "temple", "green", "south indian"] },
  { id: "riviera", name: "Coastal Promise", category: "A COASTAL LOVE LETTER", description: "Sea-blue horizons, bougainvillea, and a celebration in the sun.", number: "12", family: "Contemporary", accent: "#376e83", scene: "coast", keywords: ["cinematic", "coastal", "blue", "destination", "beach"] },
  { id: "dastaan", name: "Palace Reverie", category: "YOUR STORY, IN COLOUR", description: "Rose-coloured arches, saffron flowers, and a palace full of stories.", number: "13", family: "Indian", accent: "#97492f", scene: "palace", keywords: ["cinematic", "palace", "pink", "saffron"] },
  { id: "meenaya", name: "Jasmine & Gold", category: "A SOUTH INDIAN ROMANCE", description: "Jasmine, golden light, and a wedding wrapped in family and tradition.", number: "14", family: "Indian", accent: "#7a292e", scene: "temple", keywords: ["cinematic", "south indian", "temple", "gold", "jasmine"] },
  { id: "kesari", name: "Midnight Marigold", category: "AN EVENING OF GRANDEUR", description: "Midnight blue, marigold gold, and room for a joyful celebration.", number: "15", family: "Indian", accent: "#786025", scene: "palace", keywords: ["cinematic", "punjabi", "blue", "gold", "royal"] },
  { id: "haveli", name: "Courtyard Letters", category: "THE HERITAGE COURTYARD", description: "Warm sandstone, lantern-lit courtyards, and the feeling of coming home.", number: "16", family: "Indian", accent: "#9b5a43", scene: "palace", keywords: ["cinematic", "heritage", "terracotta", "palace", "lanterns"] },
] as const;

export function isCinematicTheme(theme: ThemeId): theme is CinematicThemeId {
  return cinematicThemes.some(item => item.id === theme);
}

export function getCinematicTheme(theme: CinematicThemeId) {
  return cinematicThemes.find(item => item.id === theme)!;
}
