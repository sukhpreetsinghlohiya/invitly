import type { EventPhoto } from "@/types/media";

/** Original AI-generated photographs of one fictional couple, for demos only. */
export const demoWeddingPhotos: EventPhoto[] = [
  { id: "couple-portrait", url: "/images/demo/couple-portrait.webp", alt: "The couple together in rose and ivory wedding outfits", width: 1122, height: 1402, objectPosition: "50% 28%" },
  { id: "couple-walk", url: "/images/demo/couple-walk.webp", alt: "Walking hand in hand beneath jasmine flowers", width: 1122, height: 1402, objectPosition: "50% 25%" },
  { id: "couple-engagement", url: "/images/demo/couple-engagement.webp", alt: "Their engagement evening together in a candlelit garden", width: 1122, height: 1402, objectPosition: "50% 30%" },
];

export const demoEngagementPhotos: EventPhoto[] = [demoWeddingPhotos[2], demoWeddingPhotos[0], demoWeddingPhotos[1]];
