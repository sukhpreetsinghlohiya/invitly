import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarDays, Eye, MapPin, Megaphone, Plus, Users } from "lucide-react";
import { Brand, Flower, Footer } from "@/components/brand";
import { InvitationArt } from "@/components/invitation-art";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { validateInvitationDraft } from "@/lib/invitation-draft";
import { themes, resolveTheme } from "@/data/themes";
import { SignOutForm } from "@/app/account/sign-out-form";
import { PublicationForm } from "./publication-form";
import "./dashboard.css";

export const metadata = { title: "Your celebrations", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
function dateLabel(iso: string, timezone: string) {
  try { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: timezone }).format(new Date(iso)); }
  catch { return "Date to be confirmed"; }
}
export default async function DashboardPage() {
  if (!getSupabaseConfig()) redirect("/setup");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) redirect("/login");
  // RLS and an explicit owner predicate both protect this management view.
  const { data: events, error } = await supabase.from("events").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
  const invitations = events || [];
  const published = invitations.filter((event) => event.is_published).length;
  const unpublished = invitations.filter((event) => !event.is_published && event.published_at).length;
  const displayName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim().split(/\s+/)[0] : "";
  return <div className="dashboard-page">
    <header className="dashboard-header container"><Brand /><nav aria-label="Host navigation"><Link href="/templates">The collection</Link><Link className="button button-small" href="/customize"><Plus size={15} /> New invitation</Link></nav></header>
    <main id="main" className="dashboard-main container">
      <section className="dashboard-welcome"><div><span className="eyebrow">YOUR HOST WORKSPACE</span><h1>A little planning.<br /><em>A lot to celebrate.</em></h1><p>{displayName ? `Welcome back, ${displayName}. ` : "Welcome to your celebration space. "}Bring your invitation, your guests, and every happy detail together.</p></div><div className="dashboard-welcome-art" aria-hidden="true"><Flower /><span>Good things<br />are <em>coming together.</em></span><i>MADE FOR YOUR MOMENTS</i></div></section>
      <div className="dashboard-account"><span>Signed in as <strong>{user.email}</strong></span><SignOutForm /></div>
      {!error && <dl className="dashboard-overview"><div><dt>Your celebrations</dt><dd>{invitations.length}</dd></div><div><dt>Published invitations</dt><dd>{published}</dd></div><div><dt>Private drafts</dt><dd>{invitations.length - published - unpublished}</dd></div><div><dt>Unpublished</dt><dd>{unpublished}</dd></div></dl>}
      <section className="dashboard-celebrations" aria-labelledby="celebrations-heading"><div className="dashboard-section-heading"><div><span className="eyebrow">EVERY STORY STARTS SOMEWHERE</span><h2 id="celebrations-heading">Your <em>celebrations.</em></h2></div><Link href="/customize" className="text-link">Create an invitation <ArrowRight size={15} /></Link></div>
        {error ? <div className="dashboard-empty" role="alert"><h3>Your invitations couldn’t be loaded.</h3><p>Please refresh to try again. If this is a new installation, check that the database migrations have been applied.</p><Link className="button button-secondary" href="/dashboard">Try again</Link></div> : invitations.length ? <div className="dashboard-event-grid">{invitations.map((event) => {
          const validated = validateInvitationDraft({ themeId: event.theme_id, invitation: event.invitation_content, musicEnabled: event.music_enabled });
          const theme = themes.find((item) => item.id === resolveTheme(event.theme_id))!;
          const state = event.is_published ? "Published" : event.published_at ? "Unpublished" : "Draft";
          const zone = validated.data?.invitation.timezone || event.timezone || "Asia/Kolkata";
          return <article className="dashboard-event-card" key={event.id}>
            <div className={`dashboard-event-art preview-${theme.id}`} aria-hidden="true">{validated.data ? <InvitationArt theme={theme.id} invitation={validated.data.invitation} compact /> : <div className="dashboard-event-placeholder"><Flower /><p>A CELEBRATION TO COME</p><h3>{event.title}</h3></div>}<span className="dashboard-event-theme">{theme.name}</span></div>
            <div className="dashboard-event-content"><div className="dashboard-event-topline"><span className={`dashboard-status dashboard-status-${state.toLowerCase()}`}><i />{state}</span><span>{event.is_published ? "Ready for your guests" : event.published_at ? "Your link is private" : "Only you can see this"}</span></div><h3>{event.title}</h3><p className="dashboard-event-detail"><CalendarDays size={14} /><time dateTime={event.starts_at}>{dateLabel(event.starts_at, zone)}</time></p><p className="dashboard-event-detail"><MapPin size={14} /><span>{event.venue || validated.data?.invitation.city || "Add your venue"}</span></p><p className="dashboard-event-zone">Times in {zone}</p>
              <div className="dashboard-event-primary"><Link className="button" href={`/customize?event=${event.id}`}>Edit invitation <ArrowRight size={14} /></Link><Link className="button button-secondary" href={`/dashboard/events/${event.id}/preview`} aria-label={`Preview ${event.title}`}><Eye size={15} /> Preview</Link></div>
              <div className="dashboard-event-tools"><Link href={`/dashboard/events/${event.id}/guests`}><Users size={15} /> Guest responses <ArrowUpRight size={13} /></Link><Link href={`/dashboard/events/${event.id}/announcements`}><Megaphone size={15} /> Guest updates <ArrowUpRight size={13} /></Link>{event.is_published && <Link href={`/i/${event.slug}`} target="_blank" rel="noopener noreferrer">Open public invitation <ArrowUpRight size={13} /></Link>}</div>
              <div className="dashboard-event-publication"><PublicationForm eventId={event.id} published={event.is_published} /></div>
            </div>
          </article>;
        })}</div> : <div className="dashboard-empty"><Flower /><span className="eyebrow">YOUR FIRST INVITATION IS WAITING</span><h3>Make room for<br /><em>something wonderful.</em></h3><p>Choose a design, add your story, and bring everyone together with one little link.</p><Link className="button" href="/customize">Create your first invitation <ArrowRight size={15} /></Link><Link className="text-link" href="/templates">Explore the collection</Link></div>}
      </section>
      <aside className="dashboard-help"><div><span className="eyebrow">A LITTLE INSPIRATION</span><h2>Find your kind of <em>beautiful.</em></h2><p>Ten original themes, from palace gardens to a quiet modern moment.</p></div><Link className="button button-secondary" href="/templates">Browse themes <ArrowUpRight size={16} /></Link></aside>
    </main><Footer />
  </div>;
}
