import { hasIndicText } from "@/lib/invitation-text";
import { HeroPhotoSlideshow } from "@/components/hero-photo-slideshow";
import { CoupleProfiles } from "@/components/couple-profiles";
import { InvitationVideo } from "@/components/invitation-video";
import { InvitationEnvelope } from "@/components/invitation-envelope";
import { demoWeddingPhotos } from "@/data/demo-photos";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, CalendarDays, CalendarPlus, ChevronDown, Heart, MapPin } from "lucide-react";
import { BrandMark, Flower } from "@/components/brand";
import { Botanical } from "@/components/invitation-art";
import { Countdown } from "@/components/demo/countdown";
import { MusicControl } from "@/components/demo/music-control";
import { RsvpForm } from "@/components/demo/rsvp-form";
import { ShareButton } from "@/components/demo/share-button";
import { UpdatesPreview } from "@/components/demo/updates-preview";
import { LiveAnnouncements } from "@/components/live-announcements";
import { formatEventDate } from "@/data/demo-invitation";
import { getDesign, getOccasion, guestWording } from "@/data/occasions";
import { invitationPresentation } from "../invitation-presentation";
import "../invitation-personalization.css";
import type { InvitationRenderProps } from "@/components/invitation-view";
import { SignatureCover } from "./signature-cover";
import { PhotoGallery } from "./photo-gallery";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/great-vibes/latin-400.css";
import styles from "./wedding.module.css";
import { VenueCard } from "../venue-card";
import { InvitationMotion } from "../invitation-motion";
import { OccasionIllustration } from "../indian-art";
import { CeremonyArt } from "../ceremony-art";
import { getCeremonyArt } from "@/data/ceremony-art";
import { CalendarActions } from "@/components/calendar-actions";
import { LocalEventTime } from "@/components/local-event-time";

export function WeddingExperience({ invitation, mode, musicEnabled, photos = [], calendarHref, rsvpContent, liveUpdates, previewBackHref, renderTimestamp }: InvitationRenderProps) {
  const copy = guestWording(invitation);
  const design = getDesign(invitation);
  const customizeHref = `/customize?theme=royal&occasion=${invitation.occasion || "wedding"}&tradition=${invitation.tradition || "neutral"}${design.opening ? `&opening=${design.opening.style}` : ""}`;
  const occasion = getOccasion(invitation.occasion);
  const isDemo = mode === "demo";
  const isPreview = mode === "preview";
  const names = invitation.couple.filter(Boolean).join(" & ") || "Your invitation";
  const images = isDemo && (!invitation.occasion || invitation.occasion === "wedding") ? demoWeddingPhotos : photos;
  const cover = images.find(photo => photo.id === invitation.coverPhotoId) || images[0];
  const showRsvp = design.rsvp !== false && (isDemo || isPreview || Boolean(rsvpContent));
  const countdownDate = invitation.countdownAt || invitation.weddingAt;
  const showUpdates = isDemo || Boolean(liveUpdates) || invitation.updates.length > 0;
  const events = [...invitation.functions].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const timeZone = invitation.timezone === "Asia/Kolkata" ? "IST" : invitation.timezone;
  const date = formatEventDate(invitation.weddingAt, invitation.timezone, { day: "2-digit", month: "long", year: "numeric" });
  const today = formatEventDate(new Date(renderTimestamp).toISOString(), invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const todayEvents = events.filter(event => formatEventDate(event.startsAt, invitation.timezone, { year: "numeric", month: "2-digit", day: "2-digit" }) === today);

  return <div className={`${styles.page} invitation-body`} data-body-theme="royal" {...invitationPresentation(invitation)}>
    <InvitationMotion theme="royal" motion={design.motion} />
    <main id="main" className="invitation-ordered">
      <InvitationEnvelope invitation={invitation}><SignatureCover invitation={invitation} theme="royal" isDemo={isDemo} showRsvp={showRsvp} /></InvitationEnvelope>
      {isPreview && <div className={styles.previewNotice} data-section="opening" data-preview-notice><span>Private host preview. Guests cannot use this address.</span><Link href={previewBackHref || "/dashboard"}>Back to editing <ArrowUpRight size={14} /></Link></div>}
      <section id="portrait" className={`${styles.hero} ${!cover ? styles.heroWithoutPhoto : ""}`} aria-labelledby="couple-heading" data-section="portrait">
        {cover ? <HeroPhotoSlideshow photos={images} coverPhotoId={cover.id} motion={design.motion} preload /> : <span data-decoration><Botanical className={styles.heroBotanical} /></span>}
        <div className={styles.heroShade} />
        <div className={styles.heroTop}><Link href="/" className={styles.smallBrand} aria-label="Invitly home"><BrandMark /> invitly<span>.</span></Link><span>{mode === "guest" ? "YOUR PERSONAL INVITATION" : isDemo ? "THE ROYAL EDIT · DEMO" : "TOGETHER WITH OUR FAMILIES"}</span>{isDemo ? <Link href={customizeHref}>Make it yours <ArrowUpRight size={14} /></Link> : <span>{date}</span>}</div>
        <div className={styles.heroCopy}>{!cover && design.decoration && <OccasionIllustration occasion={occasion.id} className={styles.heroOccasionArt} />}<p className={styles.eyebrow} data-indic={hasIndicText(copy.cover) || undefined}>{copy.cover}</p><h1 id="couple-heading" data-long-names={names.length > 32} data-indic={hasIndicText(names) || undefined}><span>{invitation.couple[0] || "Your name"}</span>{invitation.couple[1] && <><em>&</em><span>{invitation.couple[1]}</span></>}</h1><p className={styles.heroDate} data-indic={hasIndicText(invitation.city) || undefined}>{date}<span />{invitation.city}</p><div className={styles.heroQuickLinks}><a href="#celebrations">Schedule & directions <ArrowUpRight size={14} /></a>{showRsvp && <a href="#rsvp">RSVP <Heart size={14} /></a>}</div><a href="#blessings" className={styles.heroScroll}>EXPLORE THE INVITATION <ArrowDown size={17} /></a></div>
        <span className={styles.heroSideNote}>{occasion.name.toUpperCase()}</span>
      </section>

      <nav className={styles.nav} data-section="navigation" aria-label="Invitation sections"><a className={styles.monogram} href="#invitation" aria-label="Back to invitation cover">{invitation.initials}</a><div><a href="#celebrations">Schedule & directions</a>{images.length > 0 && <a href="#memories">Photos</a>}{showRsvp && <a href="#rsvp">RSVP <Heart size={12} /></a>}{showUpdates && <a href="#updates">Updates</a>}</div></nav>

      <section id="blessings" className={styles.blessings} data-section="story">
        {design.decoration && <><Botanical className={styles.blessingBranch} /><Botanical className={`${styles.blessingBranch} ${styles.branchRight}`} /></>}
        <div data-reveal className={styles.blessingCenter}><span className={styles.blessingMark} data-decoration><Flower /></span><span className={styles.eyebrow} data-indic={hasIndicText(copy.cover) || undefined}>{copy.cover}</span><h2>{copy.story}</h2><p className={styles.intro} data-indic={hasIndicText(invitation.intro) || undefined}>{invitation.intro}</p><p className={styles.message} data-indic={hasIndicText(invitation.message) || undefined}>{invitation.message}</p>{invitation.blessing && <p className="invitation-blessing" data-indic={hasIndicText(invitation.blessing) || undefined}>{invitation.blessing}</p>}<div className={styles.familyNames}>{invitation.families.filter(Boolean).map((family, index) => <span key={index} data-indic={hasIndicText(family) || undefined}>{index > 0 && <i>&</i>}{family}</span>)}</div>{invitation.weddingAt ? <div className={styles.datePlaque}><span>{formatEventDate(invitation.weddingAt, invitation.timezone, { weekday: "long" })}</span><strong>{formatEventDate(invitation.weddingAt, invitation.timezone, { day: "2-digit" })}</strong><span>{formatEventDate(invitation.weddingAt, invitation.timezone, { month: "long", year: "numeric" })}</span></div> : <p className={styles.intro}>Date to be confirmed</p>}<p className={styles.location} data-indic={hasIndicText(invitation.city) || undefined}><MapPin size={14} />{invitation.city}</p></div>
      </section>

      {design.countdown && Number.isFinite(Date.parse(countdownDate)) && <section className={styles.counting} data-section="countdown" aria-label="Event countdown"><span className={styles.eyebrow}>EVERY DAY, A LITTLE CLOSER</span><h2>{copy.romantic ? <>Until we say <em>“forever.”</em></> : <>Counting down to <em>our day.</em></>}</h2><Countdown key={countdownDate} date={countdownDate} timezone={invitation.timezone} initialRemaining={Math.max(0, Date.parse(countdownDate) - renderTimestamp)} />{design.decoration && <Flower />}</section>}

      <CoupleProfiles invitation={invitation} photos={images} />

      {!isDemo && <section className={styles.today} data-section="today" aria-labelledby="today-heading"><CalendarDays size={22} /><div><span className={styles.eyebrow}>TODAY · {timeZone}</span><h2 id="today-heading">Today’s schedule</h2>{todayEvents.length ? <ul>{todayEvents.map(event => <li key={event.id}><strong data-indic={hasIndicText(event.name) || undefined}>{event.name}</strong> · {formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })} · {event.venue}</li>)}</ul> : <p>No functions scheduled for today. Your invitation’s schedule is below.</p>}</div></section>}

      <section id="celebrations" className={styles.celebrations} data-section="schedule"><div data-reveal className={styles.sectionHeading}><span className={styles.eyebrow}>{copy.remembrance ? "A TIME TO REMEMBER, TOGETHER" : "WE LOOK FORWARD TO SEEING YOU"}</span><h2>{copy.schedule}</h2><p>{copy.scheduleIntro}</p><span className={styles.timezone}>All times {timeZone}</span></div>
        {calendarHref && events.length > 0 && <div className={styles.calendar}><a href={calendarHref}><CalendarPlus size={16} /> Add schedule to calendar</a><small>End times are estimates. Times adjust to your calendar’s timezone.</small></div>}
        {!events.length && <p className={styles.emptySchedule}>Your hosts will share the event details with you.</p>}
        <div className={styles.timeline}>{events.map((event, index) => { return <article data-reveal className={styles.event} key={event.id}><div className={styles.eventMotif} data-decoration><span className={styles.eventNumber}>0{index + 1}</span><div>{design.decoration && <CeremonyArt title={event.name} fallbackIcon={event.icon} />}<span>{getCeremonyArt(event.name)?.label.toUpperCase() || "WITH OUR FAVOURITE PEOPLE"}</span></div></div><span className={styles.timelineDot} data-decoration><Heart size={12} fill="currentColor" /></span><div className={styles.eventContent} data-reveal-content><span className={styles.eyebrow}>{formatEventDate(event.startsAt, invitation.timezone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><h3 data-indic={hasIndicText(event.name) || undefined}>{event.name}</h3><time dateTime={event.startsAt}>{formatEventDate(event.startsAt, invitation.timezone, { hour: "numeric", minute: "2-digit" })} · {timeZone}</time><LocalEventTime startsAt={event.startsAt} hostTimezone={invitation.timezone} /><CalendarActions event={event} names={invitation.couple} timezone={invitation.timezone} calendarHref={calendarHref} /><VenueCard venue={event.venue} address={event.address} mapUrl={event.mapUrl} eventName={event.name} /><details className={styles.eventDetails}><summary>Event details <ChevronDown size={15} /></summary><div>{event.description && <p data-indic={hasIndicText(event.description) || undefined}>{event.description}</p>}{event.dressCode && <p data-indic={hasIndicText(event.dressCode) || undefined}><strong>Dress note</strong>{event.dressCode}</p>}<p data-indic={hasIndicText(event.address) || undefined}><strong>Venue address</strong>{event.address}</p></div></details></div></article>; })}</div>
        {isDemo && <p className={styles.demoNote}>A fictional celebration at a real Jaipur landmark. No venue booking or association is implied.</p>}
      </section>

      {!!images.length && <section id="memories" className={styles.memories} data-section="photos"><div data-reveal className={styles.sectionHeading}><span className={styles.eyebrow}>MOMENTS TO TREASURE</span><h2>{copy.photos}</h2><p>{copy.remembrance ? "Keeping cherished memories close." : "A little of the story we share."}</p></div><PhotoGallery photos={images} isDemo={isDemo} motion={design.motion} theme="royal" occasion={occasion.id} />{isDemo && <p className={styles.demoNote}>Sample wedding photographs. Names and event details are fictional.</p>}</section>}

      <InvitationVideo video={invitation.video} />
      {showRsvp && <section id="rsvp" className={styles.rsvp} data-section="rsvp"><div data-reveal className={styles.rsvpCopy}>{design.decoration && <Flower />}<span className={styles.eyebrow}>YOU ARE WELCOME HERE</span><h2>{copy.rsvp}</h2><p>{copy.rsvpIntro}</p><div className={styles.rsvpSignature} data-indic={hasIndicText(names) || undefined}>With love, {names}</div></div>{isDemo || isPreview ? <RsvpForm /> : rsvpContent}</section>}

      {showUpdates && <section id="updates" className={styles.updates} data-section="updates"><div data-reveal className={styles.sectionHeading}><span className={styles.eyebrow}>A LITTLE NOTE FROM US</span><h2>Notes from <em>your hosts.</em></h2><p>Details and updates for your visit.</p></div>{isDemo ? <UpdatesPreview updates={invitation.updates} /> : liveUpdates ? <LiveAnnouncements {...liveUpdates} timezone={invitation.timezone} /> : <div className="update-feed">{invitation.updates.map(update => <article className="update-card" key={update.id}><span className="update-dot" aria-hidden="true" /><div><p className="update-time" data-indic={hasIndicText(update.time) || undefined}>{update.time}</p><p data-indic={hasIndicText(update.message) || undefined}>{update.message}</p></div></article>)}</div>}</section>}

      <section className={styles.signoff} data-section="signoff">{design.decoration && <Flower />}<span className={styles.eyebrow}>{copy.remembrance ? "HELD IN OUR HEARTS" : "UNTIL WE MEET"}</span><h2 data-indic={hasIndicText(names) || undefined}>{names}</h2><p data-indic={hasIndicText(copy.closing) || undefined}>{copy.closing}</p><span data-indic={hasIndicText(invitation.families.join(" ")) || undefined}>{invitation.families.filter(Boolean).join(" & ")}</span>{mode !== "guest" && !isPreview && <ShareButton text={isDemo ? undefined : `An invitation for ${names}.`} />}</section>
    </main>
    <footer className={styles.footer}><Link href="/" className={styles.smallBrand} aria-label="Invitly home"><BrandMark /> invitly<span>.</span></Link><p>A little link. A lot of love.</p><Link href={isDemo ? customizeHref : "/templates"}>{isDemo ? "Make this invitation yours" : "Create your own invitation"} <ArrowUpRight size={14} /></Link><span>Made by Sukhpreet</span>{isDemo && <Link href="/templates">Explore all 10 designs</Link>}</footer>
    {musicEnabled && <div className={styles.floatingMusic}><MusicControl key={`${design.music?.source}:${design.music?.track}:${design.music?.audioTrack}:${design.music?.uploadedAudio?.id}:${design.music?.youtubeUrl}`} music={design.music} /></div>}
  </div>;
}
