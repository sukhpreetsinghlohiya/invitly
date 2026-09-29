import { expect, test } from "@playwright/test";
import { csvCell, guestCsv, isGuestToken, parseGuestCsv, validateGuest } from "../src/lib/guest-validation";

test("guest input validates contact details, bounds, and group IDs", () => {
  const guest = { name: "ਗੁਰਪ੍ਰੀਤ", email: "guest@example.com", phone: "+91 98765 43210", groupId: null, maxPartySize: 2 };
  expect(validateGuest(guest)).toBeNull();
  for (const change of [{ name: "" }, { name: "x".repeat(121) }, { email: "invalid" }, { phone: "call me" }, { maxPartySize: 0 }, { maxPartySize: 21 }, { maxPartySize: 1.5 }, { groupId: "-".repeat(36) }]) expect(validateGuest({ ...guest, ...change })).toBeTruthy();
  expect(isGuestToken("a".repeat(64))).toBe(true);
  expect(isGuestToken("A".repeat(64))).toBe(false);
  expect(isGuestToken("a".repeat(63))).toBe(false);
});

test("CSV imports preserve quoted Unicode names and reject malformed or oversized files", () => {
  const header = "name,email,phone,group,max_party_size\r\n";
  const parsed = parseGuestCsv(`\uFEFF${header}"Singh, Aman",aman@example.com,+919876543210,"Family",2\r\n"अमृता ""K""",,,,1`);
  expect(parsed.error).toBeUndefined();
  expect(parsed.rows?.[0].name).toBe("Singh, Aman");
  expect(parsed.rows?.[1].name).toBe('अमृता "K"');
  expect(parseGuestCsv(`${header}"Unclosed,,,,1`).error).toBeTruthy();
  expect(parseGuestCsv(`${header}"Closed"extra,,,,1`).error).toBeTruthy();
  expect(parseGuestCsv(`${header}Guest,invalid,,,2`).error).toContain("Row 2");
  expect(parseGuestCsv(`${header}Guest,,,,21`).error).toContain("Party size");
  expect(parseGuestCsv("name,email\nGuest,a@example.com").error).toContain("columns");
  expect(parseGuestCsv(header).error).toContain("at least one");
  expect(parseGuestCsv(header + "Guest,,,,1\n".repeat(501)).error).toContain("500");
  expect(parseGuestCsv("x".repeat(512001)).error).toContain("500 KB");
});

test("CSV exports neutralize formula injection and escape embedded quotes", () => {
  for (const value of ["=HYPERLINK(1)", "+91999", "-1+2", "@SUM(1)", " \t=1+1", "\tplain"]) expect(csvCell(value)).toMatch(/^"'/);
  expect(csvCell('Aman "A"')).toBe('"Aman ""A"""');
  expect(guestCsv(["name", "note"], [["Aman", "=1+1"]])).toContain('"Aman","\'=1+1"');
});
