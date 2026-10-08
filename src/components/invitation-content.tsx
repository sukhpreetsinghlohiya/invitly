import { hasIndicText } from "@/lib/invitation-text";
import Link from "next/link";
import { HeroPhotoSlideshow } from "@/components/hero-photo-slideshow";
import { CoupleProfiles } from "@/components/couple-profiles";
import { InvitationVideo } from "@/components/invitation-video";
import { InvitationEnvelope } from "@/components/invitation-envelope";
import { PhotoGallery } from "@/components/wedding/photo-gallery";
import { demoWeddingPhotos } from "@/data/demo-photos";
import type { InvitationRenderProps } from "./invitation-view";
import { getDesign, guestWording } from "@/data/occasions";
import { invitationPresentation } from "./invitation-presentation";
import "./invitation-personalization.css";
import { ArrowLeft, ArrowUpRight, CalendarPlus, ChevronDown, Heart, MapPin } from "lucide-react";
import { Brand, Flower } from "@/components/brand";
import { Botanical } from "@/components/invitation-art";
import { Countdown } from "@/components/demo/countdown";
import { MusicControl } from "@/components/demo/music-control";
import { RsvpForm } from "@/components/demo/rsvp-form";
import { ShareButton } from "@/components/demo/share-button";
import { UpdatesPreview } from "@/components/demo/updates-preview";
import { formatEventDate } from "@/data/demo-invitation";
import { themes } from "@/data/themes";
import { LiveAnnouncements } from "@/components/live-announcements";
import { WeddingExperience } from "@/components/wedding/wedding-experience";
import "./invitation-extras.css";
import { VenueCard } from "./venue-card";
import { CalendarActions } from "./calendar-actions";
import { LocalEventTime } from "./local-event-time";
import { InvitationMotion } from "./invitation-motion";
import { OccasionExperience } from "./occasions/occasion-experience";
import { CeremonyArt } from "./ceremony-art";
import { SignatureCover } from "./wedding/signature-cover";
import "./wedding/creative-experience.css";

export function InvitationContent({ invitation, theme, mode, musicEnabled = mode === "demo", photos = [], calendarHref, rsvpContent, liveUpdates, previewBackHref, renderTimestamp }: InvitationRenderProps) {
  if (invitation.occasion && invitation.occasion !== "wedding") return <OccasionExperience invitation={invitation} theme={theme} mode={mode} musicEnabled={musicEnabled} photos={photos} calendarHref={calendarHref} rsvpContent={rsvpContent} liveUpdates={liveUpdates} previewBackHref={previewBackHref} renderTimestamp={renderTimestamp} />;
  if (theme === "royal") return <WeddingExperience invitation={invitation} theme={theme} mode={mode} musicEnabled={musicEnabled} photos={photos} calendarHref={calendarHref} rsvpContent={rsvpContent} liveUpdates={liveUpdates} previewBackHref={previewBackHref} renderTimestamp={renderTimestamp} />;
  const copy = guestWording(invitation);
  const design = getDesign(invitation);
  const openingQuery = design.opening ? `&opening=${design.opening.style}` : "";
  const isDemo = mode === "demo";
  const isPreview = mode === "preview";
  const showUpdates = isDemo || Boolean(liveUpdates) || invitation.updates.length > 0;
  const showRsvp = design.rsvp !== false && (isDemo || isPreview || Boolean(rsvpContent));
  const images = isDemo ? demoWeddingPhotos : photos;
  const countdownDate = invitation.countdownAt || invitation.weddingAt;
  const chronologicalFunctions = [...invitation.functions].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const firstDate = chronologicalFunctions[0]?.startsAt || invitation.weddingAt;
  const lastDate = chronologicalFunctions.at(-1)?.startsAt || invitation.weddingAt;
  const timezoneLabel = invitation.timezone === "Asia/Kolkata" ? "IST" : invitation.timezone;
  const today = formatEventDate(new Date(renderTimestamp).toISOString(), invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const todaysFunctions = chronologicalFunctions.filter(event => formatEventDate(event.startsAt, invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" }) === today);
  const cover = images.find(photo => photo.id === invitation.coverPhotoId) || images[0];
  const coupleName = invitation.couple.filter(Boolean).join(" & ");

  return <div className={`demo-page demo-${theme} invitation-body`} data-body-theme={theme} {...invitationPresentation(invitation)}>
    <InvitationMotion theme={theme} motion={design.motion} />
    {!isDemo && <header className="demo-toolbar"><div className="container">
      {isDemo ? <><Link href="/templates" className="back-link"><ArrowLeft size={16} /><span>The collection</span></Link><span className="demo-label">A DEMO CELEBRATION</span></> : <Brand />}
      {isPreview ? <Link href={previewBackHref || "/dashboard"} className="text-link">Back to editing</Link> : mode === "guest" ? <span className="demo-label">YOUR PERSONAL INVITATION</span> : <ShareButton text={isDemo ? undefined : `An invitation for ${coupleName}.`} />}
    </div></header>}
    {isPreview && <p className="private-preview-notice" role="status">Private host preview. Guests cannot use this address.</p>}
    <main id="main" className="invitation-main invitation-ordered">
      <InvitationEnvelope invitation={invitation}><SignatureCover invitation={invitation} theme={theme} isDemo={isDemo} showRsvp={showRsvp} /></InvitationEnvelope>
      <section className={`invite-hero${!cover ? " invite-story-without-photo" : ""}`} aria-labelledby="couple-heading" data-section="story">
        {cover && <div className="invite-hero-art"><div className="invitation-cover-photo"><HeroPhotoSlideshow photos={images} coverPhotoId={cover.id} motion={design.motion} /></div></div>}
        <div className="invite-welcome"><span className="eyebrow" data-indic={hasIndicText(copy.cover) || undefined}>{copy.cover}</span>
          <h1 id="couple-heading" data-indic={hasIndicText(coupleName) || undefined}>{invitation.couple[0] || "Your invitation"}{invitation.couple[1] && <> <em>&</em> {invitation.couple[1]}</>}</h1>
          <p className="invite-intro" data-indic={hasIndicText(invitation.intro) || undefined}>{invitation.intro}</p><p data-indic={hasIndicText(invitation.message) || undefined}>{invitation.message}</p>
          {invitation.blessing && <p className="invitation-blessing" data-indic={hasIndicText(invitation.blessing) || undefined}>{invitation.blessing}</p>}<div className="family-names">{invitation.families.filter(Boolean).map((family, index) => <span key={index} data-indic={hasIndicText(family) || undefined}>{family}</span>)}</div>
          <span className="invite-location" data-indic={hasIndicText(invitation.city) || undefined}><MapPin size={15} /> {invitation.city}</span>
          {design.countdown && Number.isFinite(Date.parse(countdownDate)) && <Countdown key={countdownDate} date={countdownDate} timezone={invitation.timezone} initialRemaining={Math.max(0, Date.parse(countdownDate) - renderTimestamp)} />}
          <div className="invite-hero-actions"><a className="button" href={showRsvp ? "#rsvp" : "#celebrations"}>{showRsvp ? copy.remembrance ? "Join our gathering" : "We saved you a seat" : "View the schedule"} <Heart size={16} /></a>{musicEnabled && <MusicControl key={`${design.music?.source}:${design.music?.track}:${design.music?.audioTrack}:${design.music?.uploadedAudio?.id}:${design.music?.youtubeUrl}`} music={design.music} />}</div>
        </div>
      </section>
      <CoupleProfiles invitation={invitation} photos={images} />
      <nav className="invite-nav" data-section="navigation" aria-label="Invitation sections"><a href="#celebrations">{copy.schedule}</a>{showRsvp && <a href="#rsvp">RSVP</a>}{showUpdates && <a href="#updates">Guest updates</a>}</nav>
      {!isDemo && <section className="today-events invite-section" data-section="today" aria-labelledby="today-heading"><div><span className="eyebrow">TODAY · {timezoneLabel}</span><h2 id="today-heading">Today’s schedule</h2></div>{todaysFunctions.length ? <ul>{todaysFunctions.map(event => <li key={event.id}><strong data-indic={hasIndicText(event.name) || undefined}>{event.name}</strong><time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })}</time><span data-indic={hasIndicText(event.venue) || undefined}>{event.venue}</span></li>)}</ul> : <p>No functions scheduled for today in {invitation.timezone}. Your invitation’s schedule is below.</p>}</section>}
      <section id="celebrations" className="celebrations invite-section" data-section="schedule">
        <div data-reveal className="invite-section-heading"><span className="eyebrow">{formatEventDate(firstDate, invitation.timezone, { day: "numeric", month: "short" })} – {formatEventDate(lastDate, invitation.timezone, { day: "numeric", month: "short", year: "numeric" })} · ALL TIMES {timezoneLabel}</span>
          <h2>{copy.schedule}</h2><p>{copy.scheduleIntro}</p>
        </div>
        {calendarHref && invitation.functions.length > 0 && <p className="calendar-download"><a className="button button-secondary" href={calendarHref}><CalendarPlus size={16} /> Add celebrations to calendar</a><small>Times adjust to your calendar’s timezone. End times are estimates.</small></p>}
        {!invitation.functions.length && <p className="demo-disclaimer">Your hosts will share the celebration details with you.</p>}
        <div className="functions-grid">{chronologicalFunctions.map((event, index) => {
          return <article data-reveal className={`function-card${design.decoration ? " function-card-with-art" : ""}`} key={event.id}>
            <div className={`function-top${design.decoration ? " ceremony-card-art" : ""}`}>{design.decoration && <CeremonyArt title={event.name} fallbackIcon={event.icon} />}<span className="function-number">{String(index + 1).padStart(2, "0")}</span></div>
            <div className="function-details" data-reveal-content><span className="eyebrow">{formatEventDate(event.startsAt, invitation.timezone, { weekday: "long", day: "numeric", month: "short" })}</span><h3 data-indic={hasIndicText(event.name) || undefined}>{event.name}</h3>
              <time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit", ...(invitation.timezone === "Asia/Kolkata" ? {} : { timeZoneName: "short" as const }) })}{invitation.timezone === "Asia/Kolkata" ? " IST" : ""}</time><LocalEventTime startsAt={event.startsAt} hostTimezone={invitation.timezone} /><CalendarActions event={event} names={invitation.couple} timezone={invitation.timezone} calendarHref={calendarHref} />
              {(event.description || event.dressCode) && <details className="invitation-event-notes"><summary>Details{event.dressCode ? " & dress code" : ""}<ChevronDown size={15} /></summary><div>{event.description && <p data-indic={hasIndicText(event.description) || undefined}>{event.description}</p>}{event.dressCode && <p className="dress-code" data-indic={hasIndicText(event.dressCode) || undefined}><strong>Dress note</strong> {event.dressCode}</p>}</div></details>}
            </div>
            <VenueCard venue={event.venue} address={event.address} mapUrl={event.mapUrl} eventName={event.name} />
          </article>;
        })}</div>
        {isDemo && <p className="demo-disclaimer">Fictional names and venue details for this preview. Confirm your own venue before sharing.</p>}
      </section>
      {!!images.length && <section id="memories" className="invite-section invitation-photos" data-section="photos" aria-labelledby="photos-heading"><div data-reveal className="invite-section-heading"><span className="eyebrow">LITTLE MOMENTS, OUR STORY</span><h2 id="photos-heading">{copy.photos}</h2></div><PhotoGallery photos={images} motion={design.motion} theme={theme} occasion={invitation.occasion} />{isDemo && <p className="demo-disclaimer">Sample wedding photographs. Names and event details are fictional.</p>}</section>}
      <InvitationVideo video={invitation.video} />
      {showRsvp && <section className="rsvp-section invite-section" data-section="rsvp" id="rsvp"><div className="rsvp-intro"><Flower /><span className="eyebrow">YOU ARE WELCOME HERE</span><h2>{copy.rsvp}</h2><p>{copy.rsvpIntro}</p><p className="invitation-rsvp-signature" data-indic={hasIndicText(coupleName) || undefined}>With love, {coupleName}</p></div>{isDemo || isPreview ? <RsvpForm /> : rsvpContent}</section>}
      {showUpdates && <section className="updates-section invite-section" data-section="updates" id="updates"><div data-reveal className="invite-section-heading"><span className="eyebrow">A LITTLE CLOSER, EVEN FROM HERE</span><h2>From our <em>celebration desk.</em></h2><p>{isDemo ? "The latest little details, all in one place." : "A note from the hosts. Refresh this invitation for the latest details."}</p></div>
        {isDemo ? <UpdatesPreview updates={invitation.updates} /> : liveUpdates ? <LiveAnnouncements {...liveUpdates} timezone={invitation.timezone} /> : <div className="update-feed">{invitation.updates.map(update => <article className="update-card" key={update.id}><span className="update-dot" aria-hidden="true" /><div><p className="update-time" data-indic={hasIndicText(update.time) || undefined}>{update.time}</p><p data-indic={hasIndicText(update.message) || undefined}>{update.message}</p></div></article>)}</div>}
      </section>}
      <section className="invite-signoff" data-section="signoff">{theme === "floral" ? <Botanical className="signoff-botanical" /> : <Flower />}<p data-indic={hasIndicText(copy.closing) || undefined}>{copy.closing}</p><h2 data-indic={hasIndicText(coupleName) || undefined}>{coupleName}</h2><div className="multilingual"><span lang="hi">सप्रेम आमंत्रण</span><span aria-hidden="true">·</span><span lang="pa">ਜੀ ਆਇਆਂ ਨੂੰ</span></div>{isDemo && <ShareButton />}</section>
    </main>
    {isDemo && <><div className="theme-switcher"><span>Find your feeling</span><nav aria-label="Invitation themes">{themes.map(item => <Link key={item.id} href={`/demo?theme=${item.id}&occasion=${invitation.occasion || "wedding"}&tradition=${invitation.tradition || "neutral"}${openingQuery}`} aria-current={theme === item.id ? "page" : undefined}>{item.name}</Link>)}</nav></div><div className="demo-customize-link"><Link className="text-link" href={`/customize?theme=${theme}&occasion=${invitation.occasion || "wedding"}&tradition=${invitation.tradition || "neutral"}${openingQuery}`}>Customize this theme <ArrowUpRight size={15} /></Link></div></>}
    <footer className="demo-footer"><Brand /><p>Your moments, thoughtfully together.</p><Link href="/templates">Find your own invitation <ArrowUpRight size={14} /></Link><span>Made by Sukhpreet</span></footer>
  </div>;
}
