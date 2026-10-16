import Link from "next/link";
import { ArrowDown, ArrowUpRight, Heart } from "lucide-react";
import type { InvitationRenderProps } from "@/components/invitation-view";
import type { CSSProperties } from "react";
import { isCinematicTheme } from "@/data/cinematic-themes";
import { themes } from "@/data/themes";
import { getDesign, guestWording } from "@/data/occasions";
import { demoWeddingPhotos } from "@/data/demo-photos";
import { formatEventDate } from "@/data/demo-invitation";
import { InvitationEnvelope } from "@/components/invitation-envelope";
import { HeroPhotoSlideshow } from "@/components/hero-photo-slideshow";
import { ShareButton } from "@/components/demo/share-button";
import { hasIndicText } from "@/lib/invitation-text";
import { InvitationMotion } from "@/components/invitation-motion";
import { InvitationVideo } from "@/components/invitation-video";
import { invitationPresentation } from "@/components/invitation-presentation";
import { CoupleProfiles } from "@/components/couple-profiles";
import { VenueCard } from "@/components/venue-card";
import { CalendarActions } from "@/components/calendar-actions";
import { LocalEventTime } from "@/components/local-event-time";
import { CeremonyArt } from "@/components/ceremony-art";
import { Countdown } from "@/components/demo/countdown";
import { RsvpForm } from "@/components/demo/rsvp-form";
import { MusicControl } from "@/components/demo/music-control";
import { UpdatesPreview } from "@/components/demo/updates-preview";
import { LiveAnnouncements } from "@/components/live-announcements";
import { PhotoGallery } from "./photo-gallery";
import { CinematicCover } from "./cinematic-cover";
import { SignatureCover } from "./signature-cover";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/great-vibes/latin-400.css";
import styles from "./cinematic.module.css";

export function SharedWeddingExperience({ invitation, theme, mode, photos = [], musicEnabled, calendarHref, rsvpContent, liveUpdates, previewBackHref, renderTimestamp }: InvitationRenderProps) {
  const selected = themes.find(item => item.id === theme)!;
  const design = getDesign(invitation);
  const copy = guestWording(invitation);
  const isDemo = mode === "demo";
  const isPreview = mode === "preview";
  const images = isDemo ? demoWeddingPhotos : photos;
  const cover = images.find(image => image.id === invitation.coverPhotoId) || images[0];
  const names = invitation.couple.filter(Boolean).join(" & ") || "Your celebration";
  const showRsvp = design.rsvp !== false && (isDemo || isPreview || Boolean(rsvpContent));
  const showUpdates = isDemo || Boolean(liveUpdates) || invitation.updates.length > 0;
  const events = [...invitation.functions].filter(event => event.visibility !== "hidden").sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const countdownAt = invitation.countdownAt || invitation.weddingAt;
  const localDay = (date: string) => formatEventDate(date, invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const today = localDay(new Date(renderTimestamp).toISOString());
  const todayEvents = events.filter(event => localDay(event.startsAt) === today);
  const customizeHref = `/customize?occasion=wedding&theme=${theme}&tradition=${invitation.tradition || "neutral"}${design.opening ? `&opening=${design.opening.style}` : ""}`;
  const presentation = invitationPresentation(invitation);
  const themeStyle = { "--cinema-accent": selected.accent, "--theme-accent": "var(--cinema-accent)", ...presentation.style } as CSSProperties;
  return <div className={`${styles.experience} invitation-body`} data-wedding-flow="shared" data-cinematic-theme={theme} data-body-theme={theme} {...presentation} style={themeStyle}>
    <InvitationMotion theme={theme} motion={design.motion} />
    <main id="main" className="invitation-ordered">
      <InvitationEnvelope invitation={invitation}>{isCinematicTheme(theme) ? <section id="invitation" tabIndex={-1} className={styles.coverSection} data-section="cover" aria-label={`An invitation for ${names}`}><CinematicCover invitation={invitation} theme={theme} /><a className={styles.explore} href="#story">Open our story <ArrowDown size={15} /></a></section> : <SignatureCover invitation={invitation} theme={theme} isDemo={isDemo} showRsvp={showRsvp} />}</InvitationEnvelope>
      {isPreview && <p className={styles.notice} data-preview-notice data-section="opening">Private host preview. <Link href={previewBackHref || "/dashboard"}>Back to editing</Link></p>}
      <nav className={styles.nav} data-section="navigation" aria-label="Invitation sections"><a href="#invitation" className={styles.monogram}>{invitation.initials}</a><div><a href="#story">Our story</a><a href="#celebrations">The celebrations</a>{showRsvp && <a href="#rsvp" className={styles.navRsvp}>RSVP <ArrowUpRight size={13} /></a>}</div></nav>
      <section id="story" data-section="story" className={styles.story}>
        <div className={styles.storyCopy} data-reveal data-reveal-content><span className={styles.overline}>TWO LIVES. ONE BEAUTIFUL BEGINNING.</span><h1 data-long-names={names.length > 32 || undefined} data-indic={hasIndicText(names) || undefined}>{invitation.couple[0] || "Your invitation"}{invitation.couple[1] && <><br /><em>& {invitation.couple[1]}</em></>}</h1><p className={styles.storyIntro} data-indic={hasIndicText(invitation.intro) || undefined}>{invitation.intro}</p><p data-indic={hasIndicText(invitation.message) || undefined}>{invitation.message}</p>{invitation.blessing && <p className={styles.storyBlessing} data-indic={hasIndicText(invitation.blessing) || undefined}>{invitation.blessing}</p>}<div className={styles.familyNames}>{invitation.families.filter(Boolean).map((family, index) => <p key={index} data-indic={hasIndicText(family) || undefined}>{family}</p>)}</div><span className={styles.signature} data-indic={hasIndicText(names) || undefined}>{names}</span></div>
        {cover && <figure className={styles.portrait} data-reveal data-scroll-depth><HeroPhotoSlideshow photos={images} coverPhotoId={cover.id} motion={design.motion} className={styles.storySlideshow} /><figcaption>THE PEOPLE AT THE HEART OF IT ALL</figcaption></figure>}
      </section>
      {design.countdown && Number.isFinite(Date.parse(countdownAt)) && <section className={styles.countdown} data-section="countdown"><span className={styles.overline}>EVERY DAY BRINGS US CLOSER</span><h2>Until our <em>forever.</em></h2><Countdown key={countdownAt} date={countdownAt} timezone={invitation.timezone} initialRemaining={Math.max(0, Date.parse(countdownAt) - renderTimestamp)} /></section>}
      <CoupleProfiles invitation={invitation} photos={images} />
      {!isDemo && todayEvents.length > 0 && <aside className={styles.today} data-section="today" aria-label="Today’s schedule"><span className={styles.overline}>TODAY · {invitation.timezone}</span>{todayEvents.map(event => <p key={event.id} data-indic={hasIndicText(event.name + event.venue) || undefined}><strong>{event.name}</strong> · {formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })}{event.venue ? ` · ${event.venue}` : ""}</p>)}<a href="#celebrations">See event details ↓</a></aside>}
      <section id="celebrations" data-section="schedule" className={styles.celebrations}>
        <div className={styles.sectionHeading} data-reveal data-reveal-content><span className={styles.overline}>COME FOR THE WEDDING. STAY FOR THE MEMORIES.</span><h2>The <em>celebrations.</em></h2><p>A little laughter, a little dancing, and all our favourite people.</p><small>All times in {invitation.timezone}</small></div>
        {!events.length && <p className={styles.empty}>The celebration details will be shared here soon.</p>}
        {calendarHref && events.length > 0 && <div className={styles.calendarAll}><a href={calendarHref}>Save all celebrations to your calendar ↗</a><small>Times adjust to your calendar’s timezone. End times are estimates.</small></div>}
        <div className={styles.events}>{events.map((event, index) => <article key={event.id} className={styles.event} data-reveal>
          <div className={styles.eventArt}>{design.decoration && <CeremonyArt title={event.name} fallbackIcon={event.icon} />}<span>{String(index + 1).padStart(2, "0")}</span></div>
          <div className={styles.eventCopy}><span className={styles.overline}>{formatEventDate(event.startsAt, invitation.timezone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><h3 data-indic={hasIndicText(event.name) || undefined}>{event.name}</h3><time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })}</time><LocalEventTime startsAt={event.startsAt} hostTimezone={invitation.timezone} />{event.description && <p data-indic={hasIndicText(event.description) || undefined}>{event.description}</p>}{event.dressCode && <p className={styles.dress} data-indic={hasIndicText(event.dressCode) || undefined}><strong>Dress code</strong> {event.dressCode}</p>}<VenueCard venue={event.venue} address={event.address} mapUrl={event.mapUrl} eventName={event.name} /><CalendarActions event={event} names={invitation.couple} timezone={invitation.timezone} calendarHref={calendarHref} /></div>
        </article>)}</div>
      </section>
      {images.length > 0 && <section id="memories" className={styles.memories} data-section="photos"><div className={styles.sectionHeading} data-reveal data-reveal-content><span className={styles.overline}>THE LITTLE MOMENTS THAT BROUGHT US HERE</span><h2>A love story,<br /><em>one frame at a time.</em></h2></div><PhotoGallery editorial photos={images} theme={theme} occasion="wedding" motion={design.motion} />{isDemo && <p className={styles.sampleNote}>Sample photographs. Names and celebration details are fictional.</p>}</section>}
      <InvitationVideo video={invitation.video} />
      {showRsvp && <section id="rsvp" data-section="rsvp" className={styles.rsvp}><div data-reveal>{design.decoration && <Heart size={24} strokeWidth={1} data-decoration />}<span className={styles.overline}>A PLACE AT OUR CELEBRATION</span><h2>It wouldn’t be<br />the same <em>without you.</em></h2><p>{copy.rsvpIntro}</p><span className={styles.signature} data-indic={hasIndicText(names) || undefined}>With love, {names}</span></div>{isDemo || isPreview ? <RsvpForm scope={`cinematic-${theme}`} /> : rsvpContent}</section>}
      {showUpdates && <section id="updates" data-section="updates" className={styles.updates}><div className={styles.sectionHeading}><span className={styles.overline}>A LITTLE NOTE FROM US</span><h2>Before <em>you arrive.</em></h2></div>{isDemo ? <UpdatesPreview updates={invitation.updates} /> : liveUpdates ? <LiveAnnouncements {...liveUpdates} timezone={invitation.timezone} /> : <div className="update-feed">{invitation.updates.map(update => <article className="update-card" key={update.id}><div><p className="update-time">{update.time}</p><p data-indic={hasIndicText(update.message) || undefined}>{update.message}</p></div></article>)}</div>}</section>}
      <section className={styles.signoff} data-section="signoff"><span className={styles.overline}>THE NEXT CHAPTER STARTS WITH YOU</span><h2 data-indic={hasIndicText(names) || undefined}>{names}</h2><p data-indic={hasIndicText(copy.closing) || undefined}>{copy.closing}</p><span>{formatEventDate(invitation.weddingAt, invitation.timezone, { day: "numeric", month: "long", year: "numeric" })} · {invitation.city}</span>{mode !== "guest" && !isPreview && <ShareButton text={isDemo ? undefined : `An invitation for ${names}.`} />}</section>
    </main>
    <footer className={styles.footer}><Link href="/">invitly.</Link><span>{selected.name} · Made with love</span><Link href={isDemo ? customizeHref : "/templates"}>{isDemo ? "Make this invitation yours" : "Create an invitation"} <ArrowUpRight size={14} /></Link></footer>
    {musicEnabled && <div className={styles.music}><MusicControl key={`${design.music?.source}:${design.music?.track}:${design.music?.audioTrack}:${design.music?.uploadedAudio?.id}:${design.music?.youtubeUrl}`} music={design.music} /></div>}
  </div>;
}
