import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { StationeryCard } from "@/components/marketing/stationery-art";
import "./occasion-showcase.css";

const featuredOccasions = [
  { id: "wedding", label: "Wedding", note: "A beautiful beginning" },
  { id: "engagement", label: "Engagement", note: "A promise worth sharing" },
  { id: "birthday", label: "Birthday", note: "Another year of you" },
  { id: "baby-shower", label: "Baby shower", note: "A little love on the way" },
] as const;

const moreOccasions = [
  { id: "housewarming", label: "Housewarming" },
  { id: "naming", label: "Naming ceremony" },
  { id: "anniversary", label: "Anniversary" },
  { id: "remembrance", label: "Remembrance" },
  { id: "other", label: "Other gatherings" },
] as const;

/** A small stationery collection with real routes into each occasion's gallery. */
export function OccasionShowcase() {
  return <section id="occasions" className="occasion-showcase container" aria-labelledby="occasion-showcase-heading">
    <div className="occasion-showcase-intro">
      <span className="eyebrow">EVERY MOMENT, BEAUTIFULLY YOURS</span>
      <h2 id="occasion-showcase-heading">A design for <br />every kind of <br /><em>together.</em></h2>
      <p>A grand celebration. A little milestone. Find the invitation that feels like your moment.</p>
      <Link className="occasion-showcase-browse" href="/templates#occasion-collections-title">Explore every occasion <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <div className="occasion-showcase-cards">
      {featuredOccasions.map(occasion => <Link key={occasion.id} className={`occasion-showcase-card showcase-${occasion.id}`} data-occasion={occasion.id}
        href={`/templates?occasion=${occasion.id}#collection`} aria-label={`Explore ${occasion.label} invitations`} prefetch={false}>
        <div className="showcase-paper" aria-hidden="true"><StationeryCard variant={occasion.id} /></div>
        <div className="showcase-card-label"><h3>{occasion.label}</h3><span><ArrowUpRight size={14} aria-hidden="true" /></span></div>
        <p className="showcase-card-note">{occasion.note}</p>
      </Link>)}
    </div>
    <div className="occasion-showcase-more">
      <p>And all the moments in between.</p>
      <nav aria-label="More invitation occasions">{moreOccasions.map(occasion => <Link key={occasion.id} data-occasion={occasion.id} href={`/templates?occasion=${occasion.id}#collection`} prefetch={false}>{occasion.label}<ArrowUpRight size={12} aria-hidden="true" /></Link>)}</nav>
    </div>
  </section>;
}
