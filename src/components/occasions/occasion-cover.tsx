import Image from "next/image";
import { CalendarDays, MapPin, ArrowDown, ArrowUpRight } from "lucide-react";
import { getDesign, getOccasion, invitationDirections } from "@/data/occasions";
import { getOccasionTheme } from "@/data/occasion-themes";
import { formatEventDate } from "@/data/demo-invitation";
import { hasIndicText } from "@/lib/invitation-text";
import { InvitationImage } from "@/components/invitation-image";
import type { Invitation, ThemeId } from "@/types/invitation";
import type { EventPhoto } from "@/types/media";
import styles from "./occasion-cover.module.css";

type Props = { invitation: Invitation; theme: ThemeId; compact?: boolean; cover?: EventPhoto; showRsvp?: boolean };

/** The same composed cover is used in the gallery, editor, and actual invitation. */
export function OccasionCover({ invitation, theme, compact = false, cover, showRsvp = true }: Props) {
  const occasion = getOccasion(invitation.occasion);
  const design = getDesign(invitation);
  const selected = getOccasionTheme(occasion.id, theme);
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
  const Heading = compact ? "h2" : "h1";
  const artwork = <div className={`${styles.artwork} ${cover ? styles.photograph : ""}`} data-occasion-art={occasion.id}>
    {cover ? <InvitationImage src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} sizes={compact ? "230px" : "(max-width: 700px) 88vw, 560px"} preload={!compact} />
      : design.decoration && <Image src={`/images/occasions/${occasion.id}.webp`} alt="" width={480} height={360} sizes={compact ? "230px" : "(max-width: 700px) 88vw, 480px"} preload={!compact} />}
  </div>;
  const title = <div className={styles.identity}>
    <p className={styles.coverText} data-indic={hasIndicText(invitation.coverText ?? occasion.cover) || undefined}>{invitation.coverText ?? occasion.cover}</p>
    <Heading id={compact ? undefined : "occasion-cover-title"} className={styles.names} data-long={namesLength > 32 ? "true" : undefined} data-indic={hasIndicText(names.join(" ")) || undefined}>
      {names.length ? names.map((name, index) => <span key={index}>{index > 0 && <i> & </i>}<span>{name}</span></span>) : "Your invitation"}
    </Heading>
    <p className={styles.occasionName}>{occasion.name}</p>
  </div>;
  const details = <div className={styles.details}>
    <div className={styles.date}><CalendarDays aria-hidden="true" size={16} /><span>{dateLabel || "Date to be announced"}</span></div>
    {(event?.venue || invitation.city) && <div className={styles.location}><MapPin aria-hidden="true" size={16} /><span data-indic={hasIndicText(event?.venue || invitation.city) || undefined}>{event?.venue || invitation.city}{event?.venue && invitation.city ? <small data-indic={hasIndicText(invitation.city) || undefined}>{invitation.city}</small> : null}</span></div>}
  </div>;
  const dateStamp = <div className={styles.dateStamp} aria-hidden="true"><strong>{dayLabel}</strong><span>{monthLabel}</span></div>;
  return <section id={compact ? undefined : "invitation"} aria-labelledby={compact ? undefined : "occasion-cover-title"}
    data-section={compact ? undefined : "cover"} data-occasion={occasion.id} data-layout={selected.layout} data-occasion-layout={selected.layout}
    data-theme={theme} data-motion={occasion.id === "remembrance" ? "none" : design.motion || "gentle"} data-palette={design.palette} data-typography={design.typography} data-decoration={design.decoration}
    className={`${styles.cover} ${compact ? `${styles.compact} invitation-art compact` : styles.full}`}>
    <div className={styles.composition}>
      {selected.layout === "editorial" ? <>
        <div className={styles.editionRail}><span>{occasion.name}</span><span>{monthLabel}</span></div>
        <div className={styles.editorialCopy}>{title}{!compact && invitation.intro && <p className={styles.intro} data-indic={hasIndicText(invitation.intro) || undefined}>{invitation.intro}</p>}{details}</div>
        <div className={styles.editorialVisual}>{artwork}{dateStamp}</div>
      </> : selected.layout === "keepsake" ? <>
        <div className={styles.keepsakeVisual}>{artwork}{dateStamp}</div>
        <div className={styles.keepsakeCopy}>{title}{details}</div>
      </> : <>
        <div className={styles.signatureTop}>{occasion.id === "naming" || occasion.id === "other" || occasion.id === "birthday" ? title : artwork}</div>
        <div className={styles.signatureMain}>{occasion.id === "naming" || occasion.id === "other" || occasion.id === "birthday" ? artwork : title}</div>
        {details}
      </>}
    </div>
    {!compact && <div className={styles.actions} aria-label="Invitation quick links">
      {event && <a href="#celebrations"><CalendarDays size={16} aria-hidden="true" /><span>Schedule</span><ArrowDown size={14} aria-hidden="true" /></a>}
      {event && (event.venue || event.address || event.mapUrl) && <a href={invitationDirections(event)} target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" /><span>Directions</span><ArrowUpRight size={14} aria-hidden="true" /></a>}
      {showRsvp && <a href="#rsvp" className={styles.rsvp}><span>RSVP</span><ArrowDown size={14} aria-hidden="true" /></a>}
    </div>}
  </section>;
}
