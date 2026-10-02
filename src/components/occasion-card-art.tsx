import Image from "next/image";
import type { OccasionId } from "@/types/invitation";

/** User-supplied artwork, prepared as individually optimized transparent assets. */
export function OccasionCardArt({ occasion }: { occasion: OccasionId }) {
  return <div className="occasion-card-art" aria-hidden="true">
    <Image src={`/images/occasions/${occasion}.webp`} alt="" width={480} height={360}
      sizes="(max-width: 600px) 112px, (max-width: 760px) 250px, 300px"
      loading="lazy" />
  </div>;
}
