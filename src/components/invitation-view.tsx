import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, CalendarPlus, Heart, MapPin, Music2, Sparkles, Sun } from "lucide-react";
import { Brand, Flower } from "@/components/brand";
import { InvitationArt, Botanical } from "@/components/invitation-art";
import { Countdown } from "@/components/demo/countdown";
import { MusicControl } from "@/components/demo/music-control";
import { RsvpForm } from "@/components/demo/rsvp-form";
import { ShareButton } from "@/components/demo/share-button";
import { UpdatesPreview } from "@/components/demo/updates-preview";
import { formatEventDate } from "@/data/demo-invitation";
import { themes } from "@/data/themes";
import { getRequestTimestamp } from "@/lib/request-time";
import type { Invitation, ThemeId } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import { LiveAnnouncements, type LiveUpdatesConfig } from "@/components/live-announcements";
import "./invitation-extras.css";

const icons = { sun: Sun, music: Music2, heart: Heart, sparkles: Sparkles };

export function InvitationView({ invitation, theme, mode, musicEnabled = mode === "demo", photos = [], calendarHref, rsvpContent, liveUpdates, previewBackHref }: {
  invitation: Invitation;
  theme: ThemeId;
  mode: "demo" | "published" | "guest" | "preview";
  musicEnabled?: boolean;
  photos?: EventPhoto[];
  calendarHref?: string;
  rsvpContent?: ReactNode;
  liveUpdates?: LiveUpdatesConfig;
  previewBackHref?: string;
}) {
  const isDemo = mode === "demo";
  const isPreview = mode === "preview";
  const showUpdates = isDemo || Boolean(liveUpdates) || invitation.updates.length > 0;
  const showRsvp = isDemo || Boolean(rsvpContent);
  const chronologicalFunctions = [...invitation.functions].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const firstDate = chronologicalFunctions[0]?.startsAt || invitation.weddingAt;
  const lastDate = chronologicalFunctions.at(-1)?.startsAt || invitation.weddingAt;
  const timezoneLabel = invitation.timezone === "Asia/Kolkata" ? "IST" : invitation.timezone;
  const today = formatEventDate(new Date(getRequestTimestamp()).toISOString(), invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const todaysFunctions = chronologicalFunctions.filter(event => formatEventDate(event.startsAt, invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" }) === today);
  const coupleName = invitation.couple.filter(Boolean).join(" & ");

  return <div className={`demo-page demo-${theme}`}>
    <header className="demo-toolbar"><div className="container">
      {isDemo ? <><Link href="/templates" className="back-link"><ArrowLeft size={16} /><span>The collection</span></Link><span className="demo-label">A DEMO CELEBRATION</span></> : <Brand />}
      {isPreview ? <Link href={previewBackHref || "/dashboard"} className="text-link">Back to editing</Link> : mode === "guest" ? <span className="demo-label">YOUR PERSONAL INVITATION</span> : <ShareButton text={isDemo ? undefined : `Join us to celebrate ${coupleName}.`} />}
    </div></header>
    {isPreview && <p className="private-preview-notice" role="status">Private host preview. Guests cannot use this address.</p>}
    {isDemo && <><div className="theme-switcher"><span>Find your feeling</span><nav aria-label="Invitation themes">{themes.map(item => <Link key={item.id} href={`/demo?theme=${item.id}`} aria-current={theme === item.id ? "page" : undefined} scroll={false}>{item.name}</Link>)}</nav></div><div className="demo-customize-link"><Link className="text-link" href={`/customize?theme=${theme}`}>Customize this theme <ArrowUpRight size={15} /></Link></div></>}
    <main id="main" className="invitation-main">
      <section className="invite-hero" aria-labelledby="couple-heading">
        <div className="invite-hero-art">{invitation.couple[1] ? <InvitationArt theme={theme} invitation={invitation} /> : <div className="published-hero"><Flower /><h2>{coupleName}</h2><p>{invitation.intro}</p></div>}</div>
        <div className="invite-welcome"><span className="eyebrow">YOU’RE INVITED TO A LITTLE FOREVER</span>
          <h1 id="couple-heading">{invitation.couple[0]}{invitation.couple[1] && <> <em>&</em> {invitation.couple[1]}</>}</h1>
          <p className="invite-intro">{invitation.intro}</p><p>{invitation.message}</p>
          <div className="family-names">{invitation.families.filter(Boolean).map((family, index) => <span key={index}>{family}</span>)}</div>
          <span className="invite-location"><MapPin size={15} /> {invitation.city}</span>
          <Countdown date={invitation.weddingAt} initialRemaining={Math.max(0, new Date(invitation.weddingAt).getTime() - getRequestTimestamp())} />
          <div className="invite-hero-actions"><a className="button" href={showRsvp ? "#rsvp" : "#celebrations"}>{showRsvp ? "We saved you a seat" : "Celebrate with us"} <Heart size={16} /></a>{musicEnabled && <MusicControl />}</div>
        </div>
      </section>
      <nav className="invite-nav" aria-label="Invitation sections"><a href="#celebrations">The celebrations</a>{showRsvp && <a href="#rsvp">RSVP</a>}{showUpdates && <a href="#updates">Guest updates</a>}</nav>
      {!isDemo && <section className="today-events invite-section" aria-labelledby="today-heading"><div><span className="eyebrow">TODAY · {timezoneLabel}</span><h2 id="today-heading">Today’s celebrations</h2></div>{todaysFunctions.length ? <ul>{todaysFunctions.map(event => <li key={event.id}><strong>{event.name}</strong><time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })}</time><span>{event.venue}</span></li>)}</ul> : <p>No functions scheduled for today in {invitation.timezone}. Your invitation’s schedule is below.</p>}</section>}
      <section id="celebrations" className="celebrations invite-section">
        <div className="invite-section-heading"><span className="eyebrow">{formatEventDate(firstDate, invitation.timezone, { day: "numeric", month: "short" })} – {formatEventDate(lastDate, invitation.timezone, { day: "numeric", month: "short", year: "numeric" })} · ALL TIMES {timezoneLabel}</span>
          <h2>{isDemo ? "Four moments." : "The moments that matter."}<br /><em>One beautiful beginning.</em></h2><p>Come for the vows. Stay for everything in between.</p>
        </div>
        {calendarHref && invitation.functions.length > 0 && <p className="calendar-download"><a className="button button-secondary" href={calendarHref}><CalendarPlus size={16} /> Add celebrations to calendar</a><small>Times adjust to your calendar’s timezone. End times are estimates.</small></p>}
        {!invitation.functions.length && <p className="demo-disclaimer">Your hosts will share the celebration details with you.</p>}
        <div className="functions-grid">{chronologicalFunctions.map((event, index) => {
          const Icon = icons[event.icon];
          return <article className="function-card" key={event.id}>
            <div className="function-top"><span className="function-icon"><Icon size={23} strokeWidth={1.4} /></span><span className="function-number">{String(index + 1).padStart(2, "0")}</span></div>
            <div className="function-details"><span className="eyebrow">{formatEventDate(event.startsAt, invitation.timezone, { weekday: "long", day: "numeric", month: "short" })}</span><h3>{event.name}</h3>
              <time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit", ...(invitation.timezone === "Asia/Kolkata" ? {} : { timeZoneName: "short" as const }) })}{invitation.timezone === "Asia/Kolkata" ? " IST" : ""}</time>
              {event.description && <p>{event.description}</p>}{event.dressCode && <span className="dress-code">A little dress note: {event.dressCode}</span>}
            </div>
            <div className="venue-details"><strong><MapPin size={15} />{event.venue}</strong><span>{event.address}</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`} target="_blank" rel="noopener noreferrer">Get directions <ArrowUpRight size={15} /><span className="sr-only"> for {event.name} (opens Google Maps in a new tab)</span></a></div>
          </article>;
        })}</div>
        {isDemo && <p className="demo-disclaimer">A fictional wedding at a real Jaipur landmark. No booking or association with the venue is implied.</p>}
      </section>
      {!!photos.length && <section className="invite-section invitation-photos" aria-labelledby="photos-heading"><div className="invite-section-heading"><span className="eyebrow">LITTLE MOMENTS, OUR STORY</span><h2 id="photos-heading">A little of <em>us.</em></h2></div><div className="invitation-photo-grid">{photos.map(photo => <figure key={photo.id}><Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} unoptimized loading="lazy" /><figcaption>{photo.alt}</figcaption></figure>)}</div></section>}
      {showRsvp && <section className="rsvp-section invite-section" id="rsvp"><div className="rsvp-intro"><Flower /><span className="eyebrow">IT WOULDN’T BE THE SAME WITHOUT YOU</span><h2>A seat at our table.<br /><em>A place in our story.</em></h2><p>Let us know if you can join us. We&apos;ll take care of the happy tears.</p>{isDemo && <p className="local-demo-note">RSVP preview · Your response stays in this browser and is not sent to the hosts.</p>}</div>{isDemo ? <RsvpForm /> : rsvpContent}</section>}
      {showUpdates && <section className="updates-section invite-section" id="updates"><div className="invite-section-heading"><span className="eyebrow">A LITTLE CLOSER, EVEN FROM HERE</span><h2>From our <em>celebration desk.</em></h2><p>{isDemo ? "The latest little details, all in one place." : "A note from the hosts. Refresh this invitation for the latest details."}</p></div>
        {isDemo ? <UpdatesPreview updates={invitation.updates} /> : liveUpdates ? <LiveAnnouncements {...liveUpdates} timezone={invitation.timezone} /> : <div className="update-feed">{invitation.updates.map(update => <article className="update-card" key={update.id}><span className="update-dot" aria-hidden="true" /><div><p className="update-time">{update.time}</p><p>{update.message}</p></div></article>)}</div>}
      </section>}
      <section className="invite-signoff">{theme === "floral" ? <Botanical className="signoff-botanical" /> : <Flower />}<p>With love, always.</p><h2>{coupleName}</h2><div className="multilingual"><span lang="hi">सप्रेम आमंत्रण</span><span aria-hidden="true">·</span><span lang="pa">ਜੀ ਆਇਆਂ ਨੂੰ</span></div></section>
    </main>
    <footer className="demo-footer"><Brand /><p>Your moments, thoughtfully together.</p><Link href="/templates">Find your own invitation <ArrowUpRight size={14} /></Link><span>Made by Sukhpreet</span></footer>
  </div>;
}
