import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Megaphone } from "lucide-react";
import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { getSupabaseConfig } from "@/lib/env";
import { requireHostEvent } from "@/lib/host-event";
import { AnnouncementManager } from "./announcement-manager";
import "./announcements.css";

export const metadata = { title: "Guest announcements", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ params }: { params: Promise<{ eventId: string }> }) {
  if (!getSupabaseConfig()) redirect("/setup");
  const { eventId } = await params;
  const context = await requireHostEvent(eventId).catch((error: unknown) => {
    if (error instanceof Error && error.message === "Sign in again to manage your invitation.") redirect("/login");
    notFound();
  });
  const { client, event } = context;
  const { data: announcements, error } = await client.from("event_updates").select("id,event_id,message,pinned,is_published,created_at,updated_at").eq("event_id", eventId).order("pinned", { ascending: false }).order("created_at", { ascending: false });
  return <div className="announcements-page"><header className="announcements-header container"><Brand /><Link href="/dashboard"><ArrowLeft size={14} /> Your celebrations</Link></header>
    <main id="main" className="announcements-main container"><section className="announcements-heading"><span className="eyebrow"><Megaphone size={14} /> THE CELEBRATION DESK</span><h1>A little update.<br /><em>Everyone in the know.</em></h1><p>Guest announcements for <strong>{event.title}</strong>. Share the details that make arriving, finding, and celebrating a little easier.</p><div className="announcements-heading-links"><Link href={`/customize?event=${eventId}`}>Edit invitation <ArrowUpRight size={14} /></Link><Link href={`/dashboard/events/${eventId}/preview`} target="_blank" rel="noopener noreferrer">Preview guest page <ArrowUpRight size={14} /></Link></div></section>
      {!event.is_published && <p className="announcements-private-note">Your invitation is private. Published announcements become visible to guests when you publish the invitation.</p>}
      {error ? <div className="announcements-error" role="alert"><h2>Your announcements couldn’t be loaded.</h2><p>Refresh to try again. On a new installation, make sure the latest database migration has been applied.</p><Link className="button button-secondary" href={`/dashboard/events/${eventId}/announcements`}>Try again</Link></div> : <AnnouncementManager eventId={eventId} timezone={event.timezone || "Asia/Kolkata"} initialAnnouncements={announcements || []} />}
    </main><Footer /></div>;
}
