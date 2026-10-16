import type { OccasionId } from "@/types/invitation";

/** Launch availability; keep the remaining designs and saved invitations intact. */
export const availableOccasions: readonly OccasionId[] = [
  "wedding", "engagement", "festival",
  "birthday", "baby-shower", "housewarming",
  "naming", "anniversary", "remembrance", "other",
  "conference", "webinar", "ladies-night", "virtual-event", "kids-birthday",
];

export function isOccasionAvailable(occasion: string = "wedding") {
  return availableOccasions.some(id => id === occasion);
}

export const occasionComingSoonMessage = "This occasion is coming soon. Choose from our available collections.";
