import Image from "next/image";
import { useId } from "react";
import { Heart, Music2, Sparkles, Sun } from "lucide-react";
import { Flower } from "@/components/brand";
import { getCeremonyArt } from "@/data/ceremony-art";
import { CeremonyMotionArt } from "@/components/ceremony-motion-art";
import type { Invitation, OccasionId } from "@/types/invitation";
import "./ceremony-art.css";

const fallbackIcons = { sun: Sun, music: Music2, heart: Heart, sparkles: Sparkles };

/** Schedule artwork is decorative. The nearby event name supplies its meaning. */
export function CeremonyArt({ title, fallbackIcon, occasion, className = "" }: { title: string; fallbackIcon?: Invitation["functions"][number]["icon"]; occasion?: OccasionId; className?: string }) {
  const art = getCeremonyArt(title, occasion);
  const id = `ceremony-${useId().replace(/:/g, "")}`;
  const Icon = fallbackIcon ? fallbackIcons[fallbackIcon] : null;
  return <div className={`ceremony-art ${art ? "" : "ceremony-art-fallback"} ${className}`} aria-hidden="true" data-decoration data-ceremony-art={art?.id || "neutral"} data-art-active="false" data-art-quiet={art?.id === "remembrance" || undefined}>
    {art ? <>
      <Image className="ceremony-art-base" src={art.src} alt="" width={art.width} height={art.height} sizes="(max-width: 760px) 128px, 220px" loading="lazy" unoptimized />
      <CeremonyMotionArt art={art} id={id} />
    </> : <div className="ceremony-neutral-mark" data-art-layer="drawn-mark">{Icon ? <Icon size={56} strokeWidth={1.25} /> : <Flower />}</div>}
  </div>;
}
