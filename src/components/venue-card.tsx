"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Map, MapPin, Navigation, X } from "lucide-react";
import { venueCoordinates, venueDirectionsLink, venueEmbedLink, venueWazeLink } from "@/lib/venue";
import "./venue-card.css";
import styles from "./venue-map.module.css";

export function VenueCard({ venue, address, mapUrl, eventName }: { venue: string; address: string; mapUrl?: string; eventName: string }) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const [loadedMap, setLoadedMap] = useState("");
  const place = { venue, address, mapUrl };
  const embed = venueEmbedLink(place);
  const waze = venueWazeLink(place);
  const exactPin = Boolean(venueCoordinates(mapUrl));
  const mapIsOpen = Boolean(embed && loadedMap === embed);
  async function copyAddress() {
    try { await navigator.clipboard.writeText([venue, address].filter(Boolean).join(", ")); setCopied(true); setManual(false); }
    catch { setManual(true); }
  }
  return <div className="venue-card">
    <div className="venue-card-heading"><span className="venue-pin" aria-hidden="true"><MapPin size={23} strokeWidth={1.5} /></span><div><span className="venue-eyebrow">MEET US HERE</span><strong>{venue || "Venue to be announced"}</strong></div></div>
    {address && <p className="venue-address">{address}</p>}
    {embed && <div className={styles.map} data-venue-map data-map-loaded={mapIsOpen}>
      {mapIsOpen ? <><iframe src={embed} title={`Venue map for ${eventName}`} referrerPolicy="no-referrer" loading="lazy" allowFullScreen /><button className={styles.close} type="button" onClick={() => setLoadedMap("")} aria-label={`Close map for ${eventName}`}><X size={16} /></button></> : <button type="button" className={styles.load} onClick={() => setLoadedMap(embed)} aria-label={`Show venue map for ${eventName}`}><span className={styles.mapIcon} aria-hidden="true"><Map size={31} strokeWidth={1.2} /><MapPin size={19} /></span><strong>View venue map</strong><span>Load Google Maps</span></button>}
      {!mapIsOpen && <small className={styles.caption}>{exactPin ? "Your host’s saved coordinates" : embed.includes("/maps/embed?") ? "Your host’s saved map" : "Venue name and address search"}</small>}
    </div>}
    {(venue || address || mapUrl) && <div className="venue-actions"><a href={venueDirectionsLink(place)} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Get directions <ArrowUpRight size={14} /><span className="sr-only"> for {eventName} (opens Google Maps or your saved map in a new tab)</span></a>{waze && <a href={waze} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> {exactPin ? "Route in Waze" : "Find in Waze"}<ArrowUpRight size={14} /><span className="sr-only"> for {eventName}{exactPin ? "" : " using the venue address"} (opens in a new tab)</span></a>}{address && <button type="button" onClick={() => void copyAddress()} aria-label={`Copy address for ${eventName}`}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy address"}</button>}</div>}
    <span className="sr-only" role="status">{copied ? "Venue address copied." : ""}</span>
    {manual && <label className="venue-copy-fallback">Select and copy this address<input readOnly value={[venue, address].filter(Boolean).join(", ")} onFocus={event => event.currentTarget.select()} /></label>}
  </div>;
}
