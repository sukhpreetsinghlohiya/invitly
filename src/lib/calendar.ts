import type { Invitation } from "@/types/invitation";

export function escapeCalendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
function utcTimestamp(value: string | number) { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
// RFC 5545: 75 UTF-8 octets maximum; never split a code point.
export function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let result = "", length = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (length + size > 75) { result += "\r\n "; length = 1; }
    result += character; length += size;
  }
  return result;
}
export function invitationCalendar(invitation: Invitation, eventId: string, now = Date.now()) {
  const names = invitation.couple.filter(Boolean).join(" & ");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitly//Celebrations//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapeCalendarText(names)}`, `X-WR-TIMEZONE:${escapeCalendarText(invitation.timezone)}`];
  for (const item of invitation.functions) {
    const startsAt = Date.parse(item.startsAt);
    if (!Number.isFinite(startsAt)) continue;
    lines.push("BEGIN:VEVENT", `UID:${escapeCalendarText(`${eventId}-${item.id}@invitly.co.in`)}`, `DTSTAMP:${utcTimestamp(now)}`, `DTSTART:${utcTimestamp(startsAt)}`, "DURATION:PT2H", `SUMMARY:${escapeCalendarText(`${item.name} — ${names}`)}`, `DESCRIPTION:${escapeCalendarText(`${item.description}\nEvent timezone: ${invitation.timezone}\n${item.dressCode ? `Dress code: ${item.dressCode}\n` : ""}End time is an estimate; check with your hosts.`)}`, `LOCATION:${escapeCalendarText([item.venue, item.address].filter(Boolean).join(", "))}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}

export type CalendarEvent = Invitation["functions"][number];

/** Use the same two-hour estimate as the downloadable calendar, always as UTC instants. */
export function eventCalendarLinks(event: CalendarEvent, names: string[], timezone: string) {
  const startsAt = Date.parse(event.startsAt);
  if (!Number.isFinite(startsAt)) return null;
  const endsAt = startsAt + 2 * 60 * 60 * 1000;
  const hosts = names.filter(Boolean).join(" & ");
  const title = `${event.name}${hosts ? ` — ${hosts}` : ""}`;
  const description = [event.description, event.dressCode ? `Dress code: ${event.dressCode}` : "", `Event timezone: ${timezone}`, "End time is an estimate; check with your hosts."].filter(Boolean).join("\n\n");
  const location = [event.venue, event.address].filter(Boolean).join(", ");
  // Google's documented event-edit link creates a guest-owned copy without sharing an invitation URL.
  const google = new URL("https://calendar.google.com/calendar/r/eventedit");
  google.search = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${utcTimestamp(startsAt)}/${utcTimestamp(endsAt)}`, stz: timezone, etz: timezone, details: description, location }).toString();
  const outlook = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  outlook.search = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: title, startdt: new Date(startsAt).toISOString().replace(".000Z", "Z"), enddt: new Date(endsAt).toISOString().replace(".000Z", "Z"), body: description, location, allday: "false" }).toString();
  return { google: google.href, outlook: outlook.href };
}

/** Keep the existing public or token-scoped download route and its query parameters. */
export function eventCalendarDownloadHref(calendarHref: string, functionId: string) {
  const [base, hash] = calendarHref.split("#");
  const separator = base.indexOf("?");
  const pathname = separator === -1 ? base : base.slice(0, separator);
  const search = new URLSearchParams(separator === -1 ? "" : base.slice(separator + 1));
  search.set("function", functionId);
  return `${pathname}?${search.toString()}${hash ? `#${hash}` : ""}`;
}
