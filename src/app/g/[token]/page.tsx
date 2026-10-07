import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuestInvitation } from "@/lib/public-invitation";
import { InvitationView } from "@/components/invitation-view";
import { GuestRsvp } from "./guest-rsvp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your private invitation", robots: { index: false, follow: false }, referrer: "no-referrer",
  openGraph: { title: "Your private invitation", description: "Open your personal invitation from the hosts.", images: [] },
  twitter: { card: "summary", title: "Your private invitation", images: [] },
};

export default async function GuestInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getGuestInvitation(token);
  if (!data) notFound();
  const event = data.invitation;
  return <InvitationView invitation={event.invitation} theme={event.themeId} mode="guest" musicEnabled={event.musicEnabled} photos={event.photos}
    calendarHref={`/g/${token}/calendar`} liveUpdates={{ eventId: event.id, endpoint: `/g/${token}/updates`, initial: event.announcements }}
    rsvpContent={<GuestRsvp key={token} token={token} name={data.guest.name} maxPartySize={data.guest.max_party_size} response={data.response} />} />;
}
