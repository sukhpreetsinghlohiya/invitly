import type { OccasionId } from "@/types/invitation";

/** Launch availability; keep the remaining designs and saved invitations intact. */
export const availableOccasions: readonly OccasionId[] = ["wedding", "engagement", "festival"];

export function isOccasionAvailable(occasion: string = "wedding") {
  return availableOccasions.some(id => id === occasion);
}

export const occasionComingSoonMessage = "This occasion is coming soon. Choose Wedding, Engagement or Festival to create an invitation today.";
