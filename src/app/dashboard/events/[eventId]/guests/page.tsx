import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand, Footer } from "@/components/brand";
import { requireHostEvent } from "@/lib/host-event";
import { getSupabaseConfig } from "@/lib/env";
import { getHostGuestData } from "@/lib/host-guests";
import { GuestManager } from "./guest-manager";
import "./guests.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your guests", robots: { index: false, follow: false } };

export default async function GuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  if (!getSupabaseConfig()) redirect("/setup");
  const { eventId } = await params;
  let host;
  try { host = await requireHostEvent(eventId); } catch { redirect("/dashboard"); }
  const { client, event } = host;
  const [guestData, segments] = await Promise.all([
    getHostGuestData(client, eventId).catch(() => null),
    client.from("event_segments").select("id,title").eq("event_id", eventId).order("sort_order"),
  ]);
  const content = event.invitation_content as { functions?: { id: string; name: string }[] } | null;
  const functions = content?.functions?.map(item => ({ id: item.id, name: item.name })) || segments.data?.map(item => ({ id: item.id, name: item.title })) || [];
  return <><main id="main" className="utility-page container guests-page"><Brand /><section className="utility-card">
    <Link className="text-link" href={`/customize?event=${eventId}`}>← Back to invitation</Link><p className="eyebrow">Your favourite people</p><h1>Guests for {event.title}</h1>
    <p>Private links show each group’s functions and collect a real RSVP, without a guest account. Publish your invitation before sharing them.</p>
    {!guestData ? <p className="form-error" role="alert">Guest management is unavailable. Apply the guest-management migration and refresh this page.</p> : <GuestManager eventId={eventId} guests={guestData.guests} groups={guestData.groups} responses={guestData.responses} functions={functions} publicFunctionIds={event.public_function_ids} />}
  </section></main><Footer /></>;
}
