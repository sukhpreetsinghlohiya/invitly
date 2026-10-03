export type Venue = { venue: string; address: string; mapUrl?: string };

export function safeMapLink(value?: string) {
  if (!value) return "";
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; } catch { return ""; }
}
export function venueSearchLink(venue: Venue) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue.venue, venue.address].filter(Boolean).join(", ") || "event venues")}`;
}
export function venueDirectionsLink(venue: Venue) {
  // Keep host-supplied pins exact, including short share links; never guess their coordinates.
  return safeMapLink(venue.mapUrl) || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([venue.venue, venue.address].filter(Boolean).join(", "))}`;
}

function coordinates(value: string | null) {
  if (!value || !/^[+-]?\d+(?:\.\d+)?\s*,\s*[+-]?\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const [latitude, longitude] = value.split(",").map(Number);
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? `${latitude},${longitude}` : null;
}

/** Query destinations are pins. A Google Maps @lat,lng camera position is not a venue pin. */
export function venueCoordinates(mapUrl?: string) {
  const link = safeMapLink(mapUrl);
  if (!link) return null;
  const url = new URL(link);
  if (["waze.com", "www.waze.com"].includes(url.hostname)) return coordinates(url.searchParams.get("ll"));
  if (!["google.com", "www.google.com", "maps.google.com"].includes(url.hostname) || !url.pathname.startsWith("/maps")) return null;
  return coordinates(url.searchParams.get("destination")) || coordinates(url.searchParams.get("query")) || coordinates(url.searchParams.get("q")) || coordinates(url.searchParams.get("daddr"));
}

export function venueWazeLink(venue: Venue) {
  const pin = venueCoordinates(venue.mapUrl);
  const query = [venue.venue, venue.address].filter(Boolean).join(", ");
  if (!pin && !query) return "";
  const params = new URLSearchParams(pin ? { ll: pin, navigate: "yes", utm_source: "invitly" } : { q: query, utm_source: "invitly" });
  return `https://www.waze.com/ul?${params.toString()}`;
}

/** This URL is only assigned to an iframe after the guest asks to load Google Maps. */
export function venueEmbedLink(venue: Venue) {
  const link = safeMapLink(venue.mapUrl);
  if (link) {
    const url = new URL(link);
    if (["google.com", "www.google.com", "maps.google.com"].includes(url.hostname) && url.pathname === "/maps/embed" && url.searchParams.has("pb")) return url.href;
  }
  const query = venueCoordinates(venue.mapUrl) || [venue.venue, venue.address].filter(Boolean).join(", ");
  if (!query) return "";
  return `https://www.google.com/maps?${new URLSearchParams({ q: query, output: "embed" }).toString()}`;
}
