import type { Metadata } from "next";

export const brandImage = { url: "/brand-image", width: 1200, height: 630, alt: "Invitly — invitations for your kind of togetherness" };
export function publicMetadata(title: string, description: string, canonical: string): Metadata {
  return { title, description, alternates: { canonical }, openGraph: { type: "website", siteName: "Invitly", locale: "en_IN", title, description, url: canonical, images: [brandImage] }, twitter: { card: "summary_large_image", title, description, images: [brandImage] } };
}
