type Venue = { venue: string; address: string; mapUrl?: string };

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
