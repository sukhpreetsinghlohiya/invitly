import { expect, test } from "@playwright/test";
import { invitationCalendar, foldCalendarLine } from "../src/lib/calendar";
import { demoInvitation } from "../src/data/demo-invitation";

test("calendar uses UTC instants and includes only supplied visible functions", () => {
  const invitation = structuredClone(demoInvitation);
  invitation.functions = [invitation.functions[0]];
  const calendar = invitationCalendar(invitation, "event-id", Date.parse("2026-09-29T10:00:00Z"));
  expect(calendar).toContain("DTSTART:20270213T050000Z\r\n");
  expect(calendar).toContain("DTSTAMP:20260929T100000Z\r\n");
  expect(calendar).toContain("X-WR-TIMEZONE:Asia/Kolkata\r\n");
  expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(calendar).not.toContain("Sangeet");
  expect(invitationCalendar({ ...invitation, functions: [] }, "event-id")).not.toContain("BEGIN:VEVENT");
});

test("calendar text cannot inject additional ICS properties", () => {
  const invitation = structuredClone(demoInvitation);
  invitation.functions[0].name = "Haldi, family; together\r\nATTENDEE:mailto:injected@example.test";
  invitation.functions[0].description = "Backslash \\ and\nnew line";
  const calendar = invitationCalendar(invitation, "event-id");
  expect(calendar).not.toContain("\r\nATTENDEE:");
  expect(calendar).toContain("Haldi\\, family\\; together\\nATTENDEE");
  expect(calendar).toContain("Backslash \\\\ and\\nnew line");
});

test("folded Unicode calendar lines remain within 75 UTF-8 bytes", () => {
  const value = `SUMMARY:${"सप्रेम आमंत्रण ਜੀ ਆਇਆਂ ਨੂੰ ".repeat(20)}`;
  const folded = foldCalendarLine(value);
  for (const line of folded.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
  expect(folded.replace(/\r\n /g, "")).toBe(value);
});
