import type { OccasionId } from "@/types/invitation";
import { providedArtwork } from "@/data/provided-art";

export type OccasionArtwork = {
  src: string;
  width: number;
  height: number;
  motion?: "ambient";
};

/** One source for the collection cards, covers and ceremony schedule. */
export const watercolorArtwork = Object.fromEntries(
  ["wedding", "engagement", "birthday", "baby-shower", "housewarming", "marigold"].map(id => [
    id, { src: `/images/watercolor/${id}.webp`, width: 800, height: 600, motion: "ambient" },
  ]),
) as Record<"wedding" | "engagement" | "birthday" | "baby-shower" | "housewarming" | "marigold", OccasionArtwork>;

const occasionArtwork: Record<OccasionId, OccasionArtwork> = {
  wedding: watercolorArtwork.wedding,
  engagement: watercolorArtwork.engagement,
  birthday: watercolorArtwork.birthday,
  "baby-shower": watercolorArtwork["baby-shower"],
  housewarming: watercolorArtwork.housewarming,
  naming: watercolorArtwork["baby-shower"],
  anniversary: { src: providedArtwork.floralInfinity.src, width: providedArtwork.floralInfinity.width, height: providedArtwork.floralInfinity.height, motion: "ambient" },
  other: watercolorArtwork.marigold,
  remembrance: { src: "/images/occasions/remembrance.webp", width: 480, height: 360 },
};

export function getOccasionArtwork(occasion: OccasionId): OccasionArtwork {
  return occasionArtwork[occasion];
}
