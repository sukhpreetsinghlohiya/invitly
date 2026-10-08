import type { InvitationOpening } from "@/types/invitation";

export const openingStyles = [
  { id: "theme", label: "Theme original", description: "Keep this design’s original entrance." },
  { id: "none", label: "No opening", description: "Go straight to your invitation." },
  { id: "envelope", label: "Envelope", description: "Break the seal on a personal letter." },
  { id: "doors", label: "Palace doors", description: "Golden doors open to your celebration." },
  { id: "flowers", label: "Flowers in bloom", description: "A garden gently parts to welcome guests." },
  { id: "sky", label: "Open sky", description: "Clouds drift apart in a starlit sky." },
  { id: "mandap", label: "The mandap", description: "Curtains reveal a flower-filled pavilion." },
  { id: "bike", label: "Bike ride", description: "A little scooter ride into your next chapter." },
  { id: "car", label: "Car arrival", description: "A flower-dressed vintage car arrives." },
  { id: "rings", label: "Two rings", description: "Two golden circles come together." },
] as const satisfies ReadonlyArray<{ id: InvitationOpening["style"]; label: string; description: string }>;

export type AnimatedOpeningStyle = Exclude<InvitationOpening["style"], "theme" | "none" | "envelope">;
export function isOpeningStyle(value: unknown): value is InvitationOpening["style"] {
  return typeof value === "string" && openingStyles.some(style => style.id === value);
}
