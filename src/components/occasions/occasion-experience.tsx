import { SaveDateIllustration } from "@/components/save-date-illustration";
import { hasIndicText } from "@/lib/invitation-text";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, CalendarPlus, ChevronUp, MapPin } from "lucide-react";
import type { InvitationRenderProps } from "@/components/invitation-view";
import type { OccasionId } from "@/types/invitation";
import { Brand } from "@/components/brand";
import { ArchiveOrnament } from "@/components/archive-ornament";
import { Countdown } from "@/components/demo/countdown";
import { MusicControl } from "@/components/demo/music-control";
import { RsvpForm } from "@/components/demo/rsvp-form";
import { ShareButton } from "@/components/demo/share-button";
import { UpdatesPreview } from "@/components/demo/updates-preview";
import { InvitationMotion } from "@/components/invitation-motion";
import { invitationPresentation } from "@/components/invitation-presentation";
import { LiveAnnouncements } from "@/components/live-announcements";
import { VenueCard } from "@/components/venue-card";
import { CoupleProfiles } from "@/components/couple-profiles";
import { InvitationVideo } from "@/components/invitation-video";
import { InvitationEnvelope } from "@/components/invitation-envelope";
import { CeremonyArt } from "@/components/ceremony-art";
import { PhotoGallery } from "@/components/wedding/photo-gallery";
import { formatEventDate } from "@/data/demo-invitation";
import { getDesign, getOccasion, guestWording } from "@/data/occasions";
import { getOccasionTheme, getOccasionThemes } from "@/data/occasion-themes";
import { OccasionCover } from "./occasion-cover";
import "../invitation-personalization.css";
import "./experience.css";

type OccasionCopy = { storyLabel: string; storyTitle: string; scheduleLabel: string; scheduleTitle: string; rsvpTitle: string; photoTitle: string };
const occasionCopy: Record<Exclude<OccasionId, "wedding">, OccasionCopy> = {
  engagement: { storyLabel: "A NOTE FROM US", storyTitle: "The beginning of our always.", scheduleLabel: "SAVE THIS LITTLE MOMENT", scheduleTitle: "A moment for our promise.", rsvpTitle: "Will you be there?", photoTitle: "Our story so far." },
  birthday: { storyLabel: "YOUR INVITATION TO THE FUN", storyTitle: "A little cake. A lot of company.", scheduleLabel: "THE BIRTHDAY PLAN", scheduleTitle: "Here’s when the fun begins.", rsvpTitle: "A place with your name on it.", photoTitle: "The moments that made this year." },
  "baby-shower": { storyLabel: "A NOTE FROM OUR FAMILY", storyTitle: "There is so much love already.", scheduleLabel: "A GENTLE MOMENT TOGETHER", scheduleTitle: "A gathering for our little beginning.", rsvpTitle: "Join our circle of love.", photoTitle: "A new chapter, in pictures." },
  housewarming: { storyLabel: "FROM OUR HOME TO YOU", storyTitle: "The best part of a home is its people.", scheduleLabel: "COME ON OVER", scheduleTitle: "Our door will be open.", rsvpTitle: "Make yourself at home.", photoTitle: "A glimpse of our new chapter." },
  naming: { storyLabel: "A LITTLE ANNOUNCEMENT", storyTitle: "A name to hold close.", scheduleLabel: "WITH THE PEOPLE WE LOVE", scheduleTitle: "A day for our little one.", rsvpTitle: "Be part of this beginning.", photoTitle: "Little moments, forever treasured." },
  anniversary: { storyLabel: "FROM OUR ALBUM OF LIFE", storyTitle: "All the little things that became a life.", scheduleLabel: "ANOTHER MEMORY TO MAKE", scheduleTitle: "Together, once more.", rsvpTitle: "The years are sweeter with you.", photoTitle: "The story we are still writing." },
  remembrance: { storyLabel: "IN LOVING MEMORY", storyTitle: "A life held close.", scheduleLabel: "TIME & PLACE", scheduleTitle: "A gathering in remembrance.", rsvpTitle: "Let us know if you can join us.", photoTitle: "Treasured memories." },
  other: { storyLabel: "A PERSONAL INVITATION", storyTitle: "Good company makes the occasion.", scheduleLabel: "THE PLAN", scheduleTitle: "Let’s spend some time together.", rsvpTitle: "We would love your company.", photoTitle: "A few moments to share." },
};

/** Occasion-specific guest pages. Editing, upload and host-account code never enter this component. */
export function OccasionExperience({ invitation, theme, mode, musicEnabled = mode === "demo", photos = [], calendarHref, rsvpContent, liveUpdates, previewBackHref, renderTimestamp }: InvitationRenderProps) {
  const occasion = invitation.occasion && invitation.occasion !== "wedding" ? invitation.occasion : "other";
  const config = getOccasion(occasion);
  const design = getDesign(invitation);
  const copy = guestWording(invitation);
  const words = occasionCopy[occasion];
  const selectedTheme = getOccasionTheme(occasion, theme);
  const isDemo = mode === "demo";
  const isPreview = mode === "preview";
  const isQuiet = occasion === "remembrance";
  const names = invitation.couple.filter(Boolean).join(" & ") || "Your invitation";
  const families = invitation.families.filter(Boolean);
  const events = [...invitation.functions].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const cover = photos.find(photo => photo.id === invitation.coverPhotoId) || photos[0];
  const showRsvp = design.rsvp !== false && (isDemo || isPreview || Boolean(rsvpContent));
  const countdownDate = invitation.countdownAt || invitation.weddingAt;
  const showUpdates = Boolean(liveUpdates) || invitation.updates.length > 0;
  const timezone = invitation.timezone === "Asia/Kolkata" ? "IST" : invitation.timezone;
  const calendarDate = (value: string) => formatEventDate(value, invitation.timezone, { day: "numeric", month: "long", year: "numeric" });
  const localDay = (value: string) => formatEventDate(value, invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const today = localDay(new Date(renderTimestamp).toISOString());
  const todayEvents = !isDemo ? events.filter(event => localDay(event.startsAt) === today) : [];
  const personalizeHref = `/customize?occasion=${occasion}&theme=${theme}&tradition=${invitation.tradition || "neutral"}`;

  return <div className={`occasion-experience occasion-experience--${occasion} occasion-layout--${selectedTheme.layout}`} {...invitationPresentation(invitation)} data-motion={isQuiet ? "none" : design.motion || "gentle"}>
    <InvitationMotion theme={theme} motion={isQuiet ? "none" : design.motion} />
    {(isDemo || isPreview) && <header className="occasion-preview-bar" data-preview-notice>
      <Link href={isPreview ? previewBackHref || "/dashboard" : `/templates?occasion=${occasion}`}><ArrowLeft size={15} /><span>{isPreview ? "Back to editing" : `${isQuiet ? "Remembrance" : config.name} designs`}</span></Link>
      <span>{isPreview ? "Private host preview" : "A fictional invitation · Live demo"}</span>
      {isDemo && <Link href={personalizeHref} className="occasion-personalize">Make it yours <ArrowUpRight size={15} /></Link>}
    </header>}
    <main id="main" className="invitation-ordered">
      <InvitationEnvelope invitation={invitation} />
      <OccasionCover invitation={invitation} theme={theme} cover={cover} photos={photos} showRsvp={showRsvp} />
      {musicEnabled && <div className="occasion-music" data-section="music"><MusicControl key={`${design.music?.source}:${design.music?.track}:${design.music?.audioTrack}:${design.music?.uploadedAudio?.id}:${design.music?.youtubeUrl}`} music={design.music} /></div>}
      <nav className="occasion-nav" data-section="navigation" aria-label="Invitation sections">
        <a href="#invitation" className="occasion-nav-top" aria-label="Back to invitation cover"><ChevronUp size={17} /></a>
        <a href="#celebrations">Schedule & directions</a>
        {showRsvp && <a href="#rsvp">RSVP</a>}
        {!!photos.length && <a href="#memories">Photos</a>}
        {showUpdates && <a href="#updates">Updates</a>}
      </nav>

      <section id="our-note" className="occasion-story occasion-section" data-section="story" aria-labelledby="occasion-story-title">
        <div data-reveal className="occasion-letter">
          {design.decoration && <ArchiveOrnament kind="flourish" className="occasion-letter-ornament" />}
          {design.decoration && copy.romantic && <SaveDateIllustration />}<span className="occasion-overline">{words.storyLabel}</span>
          <h2 id="occasion-story-title">{words.storyTitle}</h2>
          {invitation.intro && <p className="occasion-intro" data-indic={hasIndicText(invitation.intro) || undefined}>{invitation.intro}</p>}
          {invitation.message && <p className="occasion-message" data-indic={hasIndicText(invitation.message) || undefined}>{invitation.message}</p>}
          {invitation.blessing && <p className="invitation-blessing" data-indic={hasIndicText(invitation.blessing) || undefined}>{invitation.blessing}</p>}
          {!!families.length && <div className="occasion-families"><span>{isQuiet ? "Remembered by" : occasion === "engagement" ? "Together with our families" : "With love from"}</span>{families.map((family, index) => <p key={index} data-indic={hasIndicText(family) || undefined}>{family}</p>)}</div>}
          {occasion === "naming" && <p className="occasion-letter-signature" data-indic={hasIndicText(names) || undefined}>{names}</p>}
        </div>
        {occasion === "housewarming" && events[0] && <aside className="occasion-address-note" aria-label="Where we’ll meet"><span className="occasion-overline"><MapPin size={15} /> WHERE WE’LL MEET</span><VenueCard venue={events[0].venue} address={events[0].address} mapUrl={events[0].mapUrl} eventName={events[0].name} /><p>The location is one tap away. We look forward to welcoming you.</p></aside>}
        {occasion === "anniversary" && <div className="occasion-anniversary-rule" aria-hidden="true" data-decoration><span />{invitation.initials || "&"}<span /></div>}
      </section>

      {design.countdown && !isQuiet && Number.isFinite(Date.parse(countdownDate)) && <section className="occasion-countdown" data-section="countdown" aria-label="Event countdown"><Countdown key={countdownDate} date={countdownDate} timezone={invitation.timezone} initialRemaining={Math.max(0, Date.parse(countdownDate) - renderTimestamp)} /></section>}

      <CoupleProfiles invitation={invitation} photos={photos} />
      {!!todayEvents.length && <aside className="occasion-today" data-section="today" aria-label="Today’s schedule"><CalendarDays size={22} /><div><strong>Today · {timezone}</strong>{todayEvents.map(event => <p key={event.id} data-indic={hasIndicText(event.name + event.venue) || undefined}>{event.name} · {formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })} · {event.venue}</p>)}</div><a href="#celebrations">Details <ArrowUpRight size={15} /></a></aside>}

      <section id="celebrations" className="occasion-schedule occasion-section" data-section="schedule" aria-labelledby="occasion-schedule-title">
        <div data-reveal className="occasion-section-heading"><span className="occasion-overline">{words.scheduleLabel}</span><h2 id="occasion-schedule-title">{words.scheduleTitle}</h2><p>All times shown in {timezone}.</p></div>
        {calendarHref && !!events.length && <div className="occasion-calendar"><a href={calendarHref}><CalendarPlus size={17} /> Add schedule to calendar</a><span>Times adjust to your calendar’s timezone. End times are estimates.</span></div>}
        {!events.length && <p className="occasion-empty">Your hosts will share the time and place here.</p>}
        <div className="occasion-event-list">{events.map((event, index) => <article data-reveal key={event.id} className="occasion-event">
          <div className="occasion-event-date"><span className="occasion-event-index">{String(index + 1).padStart(2, "0")}</span><span>{formatEventDate(event.startsAt, invitation.timezone, { weekday: "long" })}</span><strong>{formatEventDate(event.startsAt, invitation.timezone, { day: "2-digit" })}</strong><span>{formatEventDate(event.startsAt, invitation.timezone, { month: "long", year: "numeric" })}</span>{design.decoration && <div className="occasion-event-art"><CeremonyArt title={event.name} fallbackIcon={event.icon} occasion={occasion} /></div>}</div>
          <div className="occasion-event-content" data-reveal-content><h3 data-indic={hasIndicText(event.name) || undefined}>{event.name}</h3><time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })} · {timezone}</time><span className="sr-only">{calendarDate(event.startsAt)}</span>{event.description && <p className="occasion-event-description" data-indic={hasIndicText(event.description) || undefined}>{event.description}</p>}{event.dressCode && <p className="occasion-dress-note" data-indic={hasIndicText(event.dressCode) || undefined}><strong>Dress note</strong> {event.dressCode}</p>}<VenueCard venue={event.venue} address={event.address} mapUrl={event.mapUrl} eventName={event.name} /></div>
        </article>)}</div>
        {isDemo && <p className="occasion-demo-note">Fictional names, dates and venue details for this demo. Add and check your own details before sharing.</p>}
      </section>

      {!!photos.length && <section id="memories" className="occasion-photos occasion-section" data-section="photos" aria-labelledby="occasion-photos-title"><div data-reveal className="occasion-section-heading"><span className="occasion-overline">{isQuiet ? "REMEMBERING, TOGETHER" : "FROM OUR ALBUM"}</span><h2 id="occasion-photos-title">{words.photoTitle}</h2></div><PhotoGallery photos={photos} motion={isQuiet ? "none" : design.motion} theme={theme} occasion={occasion} /></section>}

      <InvitationVideo video={invitation.video} />
      {showRsvp && <section id="rsvp" className="occasion-rsvp occasion-section" data-section="rsvp" aria-labelledby="occasion-rsvp-title"><div data-reveal className="occasion-rsvp-copy"><span className="occasion-overline">{isQuiet ? "YOUR PRESENCE" : "YOU ARE INVITED"}</span><h2 id="occasion-rsvp-title">{words.rsvpTitle}</h2><p>{copy.rsvpIntro}</p>{isQuiet ? !!families.length && <p className="occasion-rsvp-signature" data-indic={hasIndicText(families.join(" ")) || undefined}>{families.join(" & ")}</p> : <p className="occasion-rsvp-signature" data-indic={hasIndicText(names) || undefined}>{names}</p>}</div><div className="occasion-rsvp-response">{isDemo || isPreview ? <RsvpForm quiet={isQuiet} scope={`occasion:${invitation.slug}`} /> : rsvpContent}</div></section>}

      {showUpdates && <section id="updates" className="occasion-updates occasion-section" data-section="updates" aria-labelledby="occasion-updates-title"><div data-reveal className="occasion-section-heading"><span className="occasion-overline">GOOD TO KNOW</span><h2 id="occasion-updates-title">Notes from your hosts.</h2><p>Details to help you plan your visit.</p></div>{isDemo ? <UpdatesPreview updates={invitation.updates} /> : liveUpdates ? <LiveAnnouncements {...liveUpdates} timezone={invitation.timezone} /> : <div className="update-feed">{invitation.updates.map(update => <article className="update-card" key={update.id}><div><p className="update-time" data-indic={hasIndicText(update.time) || undefined}>{update.time}</p><p data-indic={hasIndicText(update.message) || undefined}>{update.message}</p></div></article>)}</div>}</section>}

      <section className="occasion-signoff" data-section="signoff"><span className="occasion-overline">{isQuiet ? "WITH LOVE & REMEMBRANCE" : occasion === "housewarming" ? "OUR DOOR IS OPEN" : "UNTIL WE MEET"}</span><h2 data-indic={hasIndicText(copy.closing) || undefined}>{copy.closing}</h2><p data-indic={hasIndicText(isQuiet ? families.join(" ") : names) || undefined}>{isQuiet ? families.join(" & ") : names}</p>{mode !== "guest" && !isPreview && <ShareButton text={isDemo ? undefined : `An invitation for ${names}.`} />}</section>
    </main>
    <footer className="occasion-footer"><Brand /><p>A thoughtful invitation. A meaningful gathering.</p><Link href={isDemo ? personalizeHref : `/templates?occasion=${occasion}`}>{isDemo ? "Make this invitation yours" : "Create your own invitation"} <ArrowUpRight size={15} /></Link></footer>
    {isDemo && <aside className="occasion-try-designs" aria-label={`${config.name} invitation designs`}><span>Explore this occasion</span><div>{getOccasionThemes(occasion).map(item => <Link href={`/demo?occasion=${occasion}&theme=${item.id}&tradition=${invitation.tradition || "neutral"}`} key={item.id} aria-current={item.id === theme ? "page" : undefined}>{item.name} <ArrowUpRight size={13} /></Link>)}</div></aside>}
  </div>;
}
