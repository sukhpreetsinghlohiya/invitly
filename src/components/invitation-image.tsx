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
  return <Image placeholder="blur" blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23e9dfd1'/%3E%3C/svg%3E" {...props} alt={props.alt} loader={protectedSource ? protectedLoader : undefined} />;
}
