import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invitation-view";
import { getPublicInvitation } from "@/lib/public-invitation";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const event = await getPublicInvitation((await params).slug);
  if (!event) return { title: "Invitation unavailable", description: "This invitation is not available.", robots: { index: false, follow: false }, openGraph: { title: "Invitation unavailable", description: "This invitation is not available.", images: [] } };
  const title = `${event.title} — You’re invited`;
  const description = event.invitation.intro.slice(0, 180);
  const url = new URL(`/i/${event.slug}`, getSiteUrl()).href;
  const photo = event.photos[0];
  const image = photo ? { url: new URL(photo.url, getSiteUrl()).href, width: photo.width, height: photo.height, alt: photo.alt } : { url: new URL(`/i/${event.slug}/opengraph-image`, getSiteUrl()).href, width: 1200, height: 630, alt: title };
  return { title, description, alternates: { canonical: url }, robots: { index: false, follow: false }, openGraph: { title, description, url, type: "website", images: [image] }, twitter: { card: "summary_large_image", title, description, images: [image.url] } };
}
export default async function PublicInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getPublicInvitation((await params).slug);
  if (!event) notFound();
  return <InvitationView invitation={event.invitation} theme={event.themeId} mode="published" musicEnabled={event.musicEnabled} photos={event.photos} calendarHref={`/i/${event.slug}/calendar`} liveUpdates={{ eventId: event.id, endpoint: `/i/${event.slug}/updates`, initial: event.announcements }} />;
}
