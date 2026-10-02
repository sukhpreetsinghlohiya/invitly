"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, MapPin, Navigation } from "lucide-react";
import { venueDirectionsLink } from "@/lib/venue";
import "./venue-card.css";

export function VenueCard({ venue, address, mapUrl, eventName }: { venue: string; address: string; mapUrl?: string; eventName: string }) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  async function copyAddress() {
    try { await navigator.clipboard.writeText([venue, address].filter(Boolean).join(", ")); setCopied(true); setManual(false); }
    catch { setManual(true); }
  }
  return <div className="venue-card">
    <div className="venue-card-heading"><span className="venue-pin" aria-hidden="true"><MapPin size={23} strokeWidth={1.5} /></span><div><span className="venue-eyebrow">MEET US HERE</span><strong>{venue || "Venue to be announced"}</strong></div></div>
    {address && <p className="venue-address">{address}</p>}
    {(venue || address || mapUrl) && <div className="venue-actions"><a href={venueDirectionsLink({ venue, address, mapUrl })} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Get directions <ArrowUpRight size={14} /><span className="sr-only"> for {eventName} (opens Google Maps or your saved map in a new tab)</span></a>{address && <button type="button" onClick={() => void copyAddress()} aria-label={`Copy address for ${eventName}`}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy address"}</button>}</div>}
    <span className="sr-only" role="status">{copied ? "Venue address copied." : ""}</span>
    {manual && <label className="venue-copy-fallback">Select and copy this address<input readOnly value={[venue, address].filter(Boolean).join(", ")} onFocus={event => event.currentTarget.select()} /></label>}
  </div>;
}
