import { expect, test } from "@playwright/test";
import { mergePrivateGuestLinks } from "../src/app/dashboard/events/[eventId]/guests/private-links";

test("creating more guest links preserves earlier links, including duplicate guest names", () => {
  const first = { guestId: "guest-1", name: "Aman", path: "/g/first-private-token" };
  const second = { guestId: "guest-2", name: "Aman", path: "/g/second-private-token" };
  const links = mergePrivateGuestLinks([first], [second]);
  expect(links).toEqual([first, second]);
  expect(mergePrivateGuestLinks(links, [])).toEqual(links);
});

test("rotating a guest link replaces its invalidated token while retaining all other guests", () => {
  const first = { guestId: "guest-1", name: "Aman", path: "/g/old-token" };
  const second = { guestId: "guest-2", name: "Simran", path: "/g/another-token" };
  const replacement = { ...first, path: "/g/new-token" };
  expect(mergePrivateGuestLinks([first, second], [replacement])).toEqual([replacement, second]);
  expect(first.path).toBe("/g/old-token");
});
