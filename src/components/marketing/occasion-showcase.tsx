import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { StationeryCard } from "@/components/marketing/stationery-art";
import { ComingSoonBadge } from "@/components/occasion-coming-soon";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionCover } from "@/components/occasions/occasion-cover";
import { occasionDemo } from "@/data/occasion-demos";
import "./occasion-showcase.css";

const featuredOccasions = [
  { id: "wedding", label: "Wedding", note: "A beautiful beginning" },
  { id: "engagement", label: "Engagement", note: "A promise worth sharing" },
  { id: "festival", label: "Festival", note: "A celebration, together" },
  { id: "birthday", label: "Birthday", note: "Another year of you" },
] as const;

const moreOccasions = [
  { id: "baby-shower", label: "Baby shower" },
  { id: "housewarming", label: "Housewarming" },
  { id: "naming", label: "Naming ceremony" },
  { id: "anniversary", label: "Anniversary" },
  { id: "remembrance", label: "Remembrance" },
  { id: "other", label: "Other gatherings" },
] as const;

/** Available collections open their gallery; future collections remain clearly labelled previews. */
export function OccasionShowcase() {
  return <section id="occasions" className="occasion-showcase container" aria-labelledby="occasion-showcase-heading">
    <div className="occasion-showcase-intro">
      <span className="eyebrow">EVERY MOMENT, BEAUTIFULLY YOURS</span>
      <h2 id="occasion-showcase-heading">A design for <br />every kind of <br /><em>together.</em></h2>
      <p>Wedding, engagement and festival invitations, ready to make your own.</p>
      <Link className="occasion-showcase-browse" href="/templates#occasion-collections-title">Explore the collections <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <div className="occasion-showcase-cards">
      {featuredOccasions.map(occasion => {
        const available = isOccasionAvailable(occasion.id);
        const content = <>
          <div className="showcase-paper" aria-hidden="true">{occasion.id === "festival" ? <OccasionCover invitation={occasionDemo("festival")} theme="royal" compact /> : <StationeryCard variant={occasion.id} />}</div>
          <div className="showcase-card-label"><h3>{occasion.label}</h3>{available && <span><ArrowUpRight size={14} aria-hidden="true" /></span>}</div>
          <p className="showcase-card-note">{occasion.note}</p>
          {!available && <div className="showcase-card-status"><ComingSoonBadge /></div>}
        </>;
        return available ? <Link key={occasion.id} className={`occasion-showcase-card showcase-${occasion.id}`} data-occasion={occasion.id}
          href={`/templates?occasion=${occasion.id}#collection`} aria-label={`Explore ${occasion.label} invitations`} prefetch={false}>{content}</Link>
          : <article key={occasion.id} className={`occasion-showcase-card showcase-${occasion.id}`} data-occasion={occasion.id} data-coming-soon={occasion.id}>{content}</article>;
      })}
    </div>
    <div className="occasion-showcase-more">
      <p>More moments on the way.</p>
      <ul aria-label="Upcoming invitation occasions">{moreOccasions.map(occasion => <li key={occasion.id} data-occasion={occasion.id} data-coming-soon={occasion.id}>{occasion.label}<ComingSoonBadge /></li>)}</ul>
    </div>
  </section>;
}
