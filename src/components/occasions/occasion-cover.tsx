import Image from "next/image";
import { CalendarDays, MapPin, ArrowDown, ArrowUpRight } from "lucide-react";
import { getDesign, getOccasion, invitationDirections } from "@/data/occasions";
import { getOccasionTheme } from "@/data/occasion-themes";
import { getOccasionArtwork } from "@/data/occasion-art";
import { formatEventDate } from "@/data/demo-invitation";
import { hasIndicText } from "@/lib/invitation-text";
import { InvitationImage } from "@/components/invitation-image";
import { ArchiveOrnament } from "@/components/archive-ornament";
import { HeroPhotoSlideshow } from "@/components/hero-photo-slideshow";
import { TraditionSymbol } from "@/components/tradition-symbol";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import type { Invitation, ThemeId } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import styles from "./occasion-cover.module.css";

type Props = { invitation: Invitation; theme: ThemeId; compact?: boolean; cover?: EventPhoto; photos?: EventPhoto[]; showRsvp?: boolean };

/** Independent leaves and highlights bring the illustration to life without moving its paper or text. */
function ArtAccents({ occasion }: { occasion: string }) {
  if (occasion === "remembrance") return null;
  const celestial = occasion === "baby-shower" || occasion === "naming" || occasion === "birthday";
  return <svg className={styles.artAccents} viewBox="0 0 480 360" data-decoration aria-hidden="true" focusable="false">
    {celestial ? <>
      {[[48, 72, 1], [405, 56, .8], [436, 263, .6], [49, 283, .55]].map(([x, y, scale], index) => <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}><g className={styles.glimmerMotion} data-cover-motion="glimmer"><path d="M0-10 2-2 10 0 2 2 0 10-2 2-10 0-2-2Z" fill="currentColor" /><circle cx="17" cy="-17" r="2" fill="currentColor" /></g></g>)}
      <path d="M30 180Q11 153 32 131M443 178q21 26 1 48" fill="none" stroke="currentColor" strokeWidth=".8" strokeDasharray="1 5" />
    </> : <>
      {[false, true].map(right => <g key={String(right)} transform={right ? "translate(480 360) rotate(180)" : undefined}><g className={styles.leafMotion} data-cover-motion="botanical">
        <path d="M33 241Q13 195 33 139" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M27 216q-28-9-24-30 25 3 24 30ZM25 194q25-8 27-30-24 4-27 30ZM27 166q-17-15-11-29 20 7 11 29Z" fill="currentColor" opacity=".35" />
        <path d="m9 193 16 17m0-23 19-16M21 144l6 16" fill="none" stroke="currentColor" strokeWidth=".65" />
      </g></g>)}
      {[[61, 58], [420, 293]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}><path className={styles.glimmerMotion} data-cover-motion="glimmer" d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="currentColor" /></g>)}
    </>}
  </svg>;
}

/** The botanical arrangement keeps its own print area, even when the hosts add longer copy. */
function EngagementGarden({ compact }: { compact: boolean }) {
  const art = getOccasionArtwork("engagement");
  return <div className={styles.engagementGarden} data-decoration aria-hidden="true">
    <Image src={art.src} alt="" width={art.width} height={art.height} sizes={compact ? "230px" : "(max-width: 700px) 80vw, 400px"} loading={compact ? "lazy" : "eager"} />
    <ArtAccents occasion="engagement" />
  </div>;
}

/** The same composed cover is used in the gallery, editor, and actual invitation. */
export function OccasionCover({ invitation, theme, compact = false, cover, photos = [], showRsvp = true }: Props) {
  const occasion = getOccasion(invitation.occasion);
  const design = getDesign(invitation);
  const selected = getOccasionTheme(occasion.id, theme);
  const illustration = getOccasionArtwork(occasion.id);
  const event = invitation.functions.filter(item => item.visibility !== "hidden").sort((first, second) => {
    const firstDate = Date.parse(first.startsAt), secondDate = Date.parse(second.startsAt);
    return (Number.isFinite(firstDate) ? firstDate : Infinity) - (Number.isFinite(secondDate) ? secondDate : Infinity);
  })[0];
  const date = invitation.weddingAt || event?.startsAt || "";
  const dateLabel = formatEventDate(date, invitation.timezone, { day: "numeric", month: "long", year: "numeric" });
  const dayLabel = date ? formatEventDate(date, invitation.timezone, { day: "2-digit" }) : "—";
  const monthLabel = date ? formatEventDate(date, invitation.timezone, { month: "short" }) : "Date";
  const names = invitation.couple.filter(Boolean);
  const namesLength = names.join(" & ").length;
  const longNames = namesLength > 32 || names.some(name => name.length > 24);
  const stationeryLabel = occasion.id === "remembrance" ? "A life remembered" : occasion.id === "other" ? "An invitation" : occasion.name;
  const editorialCaption = invitation.intro ?? occasion.intro;
  const Heading = compact ? "h2" : "h1";
  const artwork = <div className={`${styles.artwork} ${cover ? styles.photograph : ""}`} data-occasion-art={occasion.id}>
    {cover ? (compact ? <InvitationImage src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} sizes="230px" /> : <HeroPhotoSlideshow photos={photos.length ? photos : [cover]} coverPhotoId={cover.id} motion={occasion.id === "remembrance" ? "none" : design.motion || "gentle"} />)
      : design.decoration && (occasion.id === "engagement" ? <EngagementGarden compact={compact} /> : <><Image src={illustration.src} alt="" width={illustration.width} height={illustration.height} sizes={compact ? "230px" : "(max-width: 700px) 88vw, 480px"} preload={!compact} /><ArtAccents occasion={occasion.id} /></>)}
  </div>;
  const title = <div className={styles.identity}>
    <TraditionSymbol invitation={invitation} />
    <p className={styles.coverText} data-indic={hasIndicText(invitation.coverText ?? occasion.cover) || undefined}>{invitation.coverText ?? occasion.cover}</p>
    <Heading id={compact ? undefined : "occasion-cover-title"} className={styles.names} data-long={longNames ? "true" : undefined} data-indic={hasIndicText(names.join(" ")) || undefined}>
      {names.length ? names.map((name, index) => <span key={index}>{index > 0 && <i> & </i>}<span>{name}</span></span>) : "Your invitation"}
    </Heading>
  </div>;
  const details = <div className={styles.details}>
    <div className={styles.date}><span>{dateLabel || "Date to be announced"}</span></div>
    {(event?.venue || invitation.city) && <div className={styles.location}><span data-indic={hasIndicText(event?.venue || invitation.city) || undefined}>{event?.venue || invitation.city}{event?.venue && invitation.city ? <small data-indic={hasIndicText(invitation.city) || undefined}>{invitation.city}</small> : null}</span></div>}
  </div>;
  const dateStamp = <div className={styles.dateStamp} aria-hidden="true"><strong>{dayLabel}</strong><span>{monthLabel}</span></div>;
  return <section id={compact ? undefined : "invitation"} aria-labelledby={compact ? undefined : "occasion-cover-title"}
    data-section={compact ? undefined : "cover"} data-occasion={occasion.id} data-layout={selected.layout} data-occasion-layout={selected.layout}
    data-theme={theme} data-motion={occasion.id === "remembrance" ? "none" : design.motion || "gentle"} data-palette={design.palette} data-typography={design.typography} data-artwork={design.decoration ? "on" : "off"} data-cover-photo={cover ? "true" : undefined}
    className={`${styles.cover} ${compact ? `${styles.compact} invitation-art compact` : styles.full}`}>
    <div className={styles.canvas}><div className={styles.composition} data-occasion-sheet>
      {design.decoration && <div className={styles.paperTrim} data-decoration aria-hidden="true"><ArchiveOrnament kind="branch" className={styles.branchLeft} /><ArchiveOrnament kind="branch" className={styles.branchRight} /></div>}
      {selected.layout === "editorial" ? <>
        <div className={styles.editionRail}><span>{stationeryLabel}</span><span>{monthLabel} · {dayLabel}</span></div>
        <div className={styles.editorialCopy}>{title}</div>
        <div className={styles.editorialVisual}>{artwork}<div className={styles.visualCaption}>{dateStamp}{editorialCaption.length > 0 && editorialCaption.length <= 90 && <span data-indic={hasIndicText(editorialCaption) || undefined}>{editorialCaption}</span>}</div></div>
        {details}
      </> : selected.layout === "keepsake" ? <>
        <div className={styles.keepsakeHeading}><span>{stationeryLabel}</span>{design.decoration && <span data-decoration aria-hidden="true">✦</span>}</div>
        <div className={styles.keepsakeVisual}>{artwork}{!cover && dateStamp}</div>
        <div className={styles.keepsakeCopy}>{title}{design.decoration && <ArchiveOrnament kind="flourish" className={styles.divider} />}{details}</div>
      </> : <>
        <p className={styles.occasionName}>{stationeryLabel}</p>
        <div className={styles.signatureVisual}>{artwork}</div>
        <div className={styles.signatureMain}>{title}</div>
        {design.decoration && <ArchiveOrnament kind="flourish" className={styles.divider} />}
        {details}
      </>}
    </div></div>
    {!compact && <div className={styles.actions} aria-label="Invitation quick links">
      {event && <a href="#celebrations"><CalendarDays size={16} aria-hidden="true" /><span>Schedule</span><ArrowDown size={14} aria-hidden="true" /></a>}
      {event && (event.venue || event.address || event.mapUrl) && <a href={invitationDirections(event)} target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" /><span>Directions</span><ArrowUpRight size={14} aria-hidden="true" /></a>}
      {showRsvp && <a href="#rsvp" className={styles.rsvp}><span>RSVP</span><ArrowDown size={14} aria-hidden="true" /></a>}
    </div>}
  </section>;
}
