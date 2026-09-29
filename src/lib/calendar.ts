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
