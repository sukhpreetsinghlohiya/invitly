import { ArrowUpRight, CalendarPlus, ChevronDown, Download } from "lucide-react";
import { eventCalendarDownloadHref, eventCalendarLinks, type CalendarEvent } from "@/lib/calendar";
import styles from "./calendar-actions.module.css";

/** Only the event already supplied to this schedule card is shared with the chosen calendar. */
export function CalendarActions({ event, names, timezone, calendarHref }: { event: CalendarEvent; names: string[]; timezone: string; calendarHref?: string }) {
  const links = eventCalendarLinks(event, names, timezone);
  if (!links) return null;
  return <details className={styles.actions} data-calendar-actions>
    <summary><CalendarPlus size={16} aria-hidden="true" /><span>Add to calendar</span><ChevronDown size={15} aria-hidden="true" /></summary>
    <div className={styles.options} role="group" aria-label={`Calendar options for ${event.name}`}>
      <a href={links.google} target="_blank" rel="noopener noreferrer" aria-label={`Add ${event.name} to Google Calendar`}>Google Calendar<ArrowUpRight size={14} aria-hidden="true" /></a>
      <a href={links.outlook} target="_blank" rel="noopener noreferrer" aria-label={`Add ${event.name} to Outlook`}>Outlook<ArrowUpRight size={14} aria-hidden="true" /></a>
      {calendarHref && <a href={eventCalendarDownloadHref(calendarHref, event.id)} referrerPolicy="no-referrer" aria-label={`Download ${event.name} for Apple Calendar or another calendar`}>Apple / .ics<Download size={14} aria-hidden="true" /></a>}
    </div>
    <p className={styles.note}>A two-hour placeholder; confirm the finish time with your hosts.</p>
  </details>;
}
