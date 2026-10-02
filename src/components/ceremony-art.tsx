import Image from "next/image";
import { Heart, Music2, Sparkles, Sun } from "lucide-react";
import { Flower } from "@/components/brand";
import { getCeremonyArt } from "@/data/ceremony-art";
import type { Invitation } from "@/types/invitation";
import "./ceremony-art.css";

const fallbackIcons = { sun: Sun, music: Music2, heart: Heart, sparkles: Sparkles };

/** Schedule artwork is decorative. The nearby event name supplies its meaning. */
export function CeremonyArt({ title, fallbackIcon, className = "" }: { title: string; fallbackIcon?: Invitation["functions"][number]["icon"]; className?: string }) {
  const art = getCeremonyArt(title);
  const Icon = fallbackIcon ? fallbackIcons[fallbackIcon] : null;
  return <div className={`ceremony-art ${art ? "" : "ceremony-art-fallback"} ${className}`} aria-hidden="true" data-decoration data-ceremony-art={art?.id || "neutral"}>
    {art ? <Image src={art.src} alt="" width={art.width} height={art.height} sizes="(max-width: 760px) 128px, 220px" loading="lazy" /> : Icon ? <Icon size={56} strokeWidth={1.25} /> : <Flower />}
  </div>;
}
