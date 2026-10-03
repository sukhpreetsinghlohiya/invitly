import { expect, test } from "@playwright/test";
import { invitationCalendar, foldCalendarLine, eventCalendarLinks, eventCalendarDownloadHref } from "../src/lib/calendar";
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

test("Google and Outlook preserve UTC instants across a daylight-saving transition", () => {
  const event = { ...demoInvitation.functions[0], startsAt: "2027-03-14T01:30:00-05:00" };
  const links = eventCalendarLinks(event, ["Aanya", "Kabir"], "America/New_York")!;
  const google = new URL(links.google), outlook = new URL(links.outlook);
  expect(google.hostname).toBe("calendar.google.com");
  expect(google.searchParams.get("dates")).toBe("20270314T063000Z/20270314T083000Z");
  expect(google.searchParams.get("stz")).toBe("America/New_York");
  expect(google.searchParams.get("etz")).toBe("America/New_York");
  expect(outlook.searchParams.get("startdt")).toBe("2027-03-14T06:30:00Z");
  expect(outlook.searchParams.get("enddt")).toBe("2027-03-14T08:30:00Z");
  expect(outlook.searchParams.get("body")).toContain("End time is an estimate");
});

test("calendar provider links encode multilingual copy and contain only the selected event", () => {
  const event = { ...demoInvitation.functions[0], name: "मेहंदी & ਮਿਹੰਦੀ?", venue: "Rose & Jasmine", address: "Sector 17, चंडीगढ़ #2", description: "Tea & stories\nTogether; always", dressCode: "Flowers + pastels" };
  const links = eventCalendarLinks(event, ["अनन्या", "ਅਰਜੁਨ"], "Asia/Kolkata")!;
  const google = new URL(links.google), outlook = new URL(links.outlook);
  expect(google.searchParams.get("text")).toBe("मेहंदी & ਮਿਹੰਦੀ? — अनन्या & ਅਰਜੁਨ");
  expect(google.searchParams.get("location")).toBe("Rose & Jasmine, Sector 17, चंडीगढ़ #2");
  expect(outlook.searchParams.get("body")).toContain("Tea & stories\nTogether; always");
  expect(outlook.searchParams.get("body")).toContain("Dress code: Flowers + pastels");
  expect(links.google + links.outlook).not.toContain("Sangeet");
  expect(eventCalendarLinks({ ...event, startsAt: "date pending" }, [], "Asia/Kolkata")).toBeNull();
});

test("single-event downloads preserve the guest-scoped path and existing query parameters", () => {
  const href = eventCalendarDownloadHref("/g/private-token/calendar?view=guest#download", "function & special");
  const url = new URL(href, "https://invitation.example");
  expect(url.pathname).toBe("/g/private-token/calendar");
  expect(url.searchParams.get("view")).toBe("guest");
  expect(url.searchParams.get("function")).toBe("function & special");
  expect(url.hash).toBe("#download");
});
