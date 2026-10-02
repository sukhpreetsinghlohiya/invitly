"use client";
import Image, { type ImageProps, type ImageLoaderProps } from "next/image";

// Preserve per-request publication/ownership checks. The shared Next image cache
// must never keep a private photograph available after an invitation is revoked.
function protectedLoader({ src, width }: ImageLoaderProps) {
  const size = [320, 640, 960, 1600].find(size => size >= width) || 1600;
  return `${src}?w=${size}`;
}
export function InvitationImage(props: ImageProps) {
  const protectedSource = typeof props.src === "string" && /^\/(?:media\/|dashboard\/events\/)/.test(props.src);
  return <Image {...props} alt={props.alt} loader={protectedSource ? protectedLoader : undefined} />;
}
