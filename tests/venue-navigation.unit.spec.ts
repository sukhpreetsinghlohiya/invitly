import { expect, test } from "@playwright/test";
import { venueCoordinates, venueDirectionsLink, venueEmbedLink, venueWazeLink } from "../src/lib/venue";

const venue = { venue: "घर & Friends", address: "Sector 17, ਚੰਡੀਗੜ੍ਹ #12" };

test("Waze navigates only when the saved map contains an explicit coordinate destination", () => {
  const pin = { ...venue, mapUrl: "https://www.google.com/maps/dir/?api=1&destination=30.741482%2C76.768066" };
  const waze = new URL(venueWazeLink(pin));
  expect(waze.searchParams.get("ll")).toBe("30.741482,76.768066");
  expect(waze.searchParams.get("navigate")).toBe("yes");
  expect(venueCoordinates("https://maps.google.com/maps?q=0,0")).toBe("0,0");
  expect(venueCoordinates("https://www.waze.com/ul?ll=-33.8568,151.2153")).toBe("-33.8568,151.2153");
});

test("a camera position or short share URL is not treated as an exact venue pin", () => {
  for (const mapUrl of ["https://www.google.com/maps/place/Garden/@30.741482,76.768066,15z", "https://maps.app.goo.gl/saved-pin", "https://www.google.com/maps?q=91,76", "https://example.com/maps?q=30,76"]) {
    expect(venueCoordinates(mapUrl)).toBeNull();
    const waze = new URL(venueWazeLink({ ...venue, mapUrl }));
    expect(waze.searchParams.get("q")).toBe("घर & Friends, Sector 17, ਚੰਡੀਗੜ੍ਹ #12");
    expect(waze.searchParams.has("ll")).toBe(false);
    expect(waze.searchParams.has("navigate")).toBe(false);
  }
});

test("embedded maps use the known pin or an encoded address without inventing coordinates", () => {
  const embed = new URL(venueEmbedLink(venue));
  expect(embed.origin).toBe("https://www.google.com");
  expect(embed.searchParams.get("q")).toBe("घर & Friends, Sector 17, ਚੰਡੀਗੜ੍ਹ #12");
  expect(embed.searchParams.get("output")).toBe("embed");
  expect(venueEmbedLink({ venue: "", address: "", mapUrl: "https://maps.app.goo.gl/saved-pin" })).toBe("");
  expect(venueWazeLink({ venue: "", address: "", mapUrl: "https://maps.app.goo.gl/saved-pin" })).toBe("");
  const saved = "https://www.google.com/maps/embed?pb=saved-map";
  expect(venueEmbedLink({ ...venue, mapUrl: saved })).toBe(saved);
  expect(venueEmbedLink({ ...venue, mapUrl: "https://google.com.evil.test/maps/embed?pb=bad" })).toBe(venueEmbedLink(venue));
});

test("the primary directions link still preserves the host's exact HTTPS share link", () => {
  const mapUrl = "https://maps.app.goo.gl/host-saved-pin";
  expect(venueDirectionsLink({ ...venue, mapUrl })).toBe(mapUrl);
  expect(venueDirectionsLink({ ...venue, mapUrl: "javascript:alert(1)" })).toContain("https://www.google.com/maps/dir/");
});
