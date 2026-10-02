"use client";

import { MapPin, ArrowUpRight, Check } from "lucide-react";
import { useId } from "react";
import { safeMapLink, venueSearchLink } from "@/lib/venue";
import type { Invitation } from "@/types/invitation";

type FunctionDetails = Invitation["functions"][number];
export function VenueFields({ event, change }: { event: FunctionDetails; change: (patch: Partial<FunctionDetails>) => void }) {
  const id = useId();
  const link = safeMapLink(event.mapUrl);
  const invalid = Boolean(event.mapUrl?.trim() && !link);
  return <div className="editor-venue">
    <div className="editor-venue-heading"><MapPin size={22} /><div><h3>A place to come together.</h3><p>Help your guests find the right entrance.</p></div></div>
    <label className="form-field">Venue name<input value={event.venue} maxLength={200} placeholder="The venue, hall, or home name" onChange={e => change({ venue: e.target.value })} /></label>
    <label className="form-field">Venue address<textarea value={event.address} maxLength={500} rows={2} placeholder="Street, landmark, city, and PIN code" onChange={e => change({ address: e.target.value })} /></label>
    <div className="editor-map-guide"><span className="editor-map-step">1</span><div><strong>Find your venue on Google Maps</strong><p>Check the exact pin, then choose Share → Copy link.</p><a href={venueSearchLink(event)} target="_blank" rel="noopener noreferrer">Find venue on Google Maps <ArrowUpRight size={15} /><span className="sr-only"> (opens a new tab)</span></a></div></div>
    <label className="form-field">Google Maps link (optional)<input type="url" maxLength={2000} value={event.mapUrl || ""} placeholder="https://maps.app.goo.gl/…" aria-invalid={invalid || undefined} aria-describedby={`${id}-map-help`} onChange={e => change({ mapUrl: e.target.value })} /><small id={`${id}-map-help`} className={invalid ? "form-error" : ""}>{invalid ? "Use a complete HTTPS map link, without a username or password." : "Paste the shared location link. Without a link, directions use your venue name and address."}</small></label>
    {link && <a className="editor-map-confirm" href={link} target="_blank" rel="noopener noreferrer"><Check size={16} /> Check your saved location <ArrowUpRight size={14} /><span className="sr-only"> (opens a new tab)</span></a>}
  </div>;
}
