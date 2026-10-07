import Image from "next/image";
import type { OccasionId } from "@/types/invitation";
import { getOccasionArtwork } from "@/data/occasion-art";

/** Shared, locally hosted artwork with preserved transparency. */
export function OccasionCardArt({ occasion }: { occasion: OccasionId }) {
  const art = getOccasionArtwork(occasion);
  return <div className="occasion-card-art" aria-hidden="true">
    <Image src={art.src} alt="" width={art.width} height={art.height}
      sizes="(max-width: 600px) 112px, (max-width: 760px) 250px, 300px"
      loading="lazy" />
  </div>;
}
