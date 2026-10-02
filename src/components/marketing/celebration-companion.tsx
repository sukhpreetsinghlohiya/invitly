import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, MessageCircle, Users } from "lucide-react";
import { CelebrationPreview } from "./celebration-preview";
import { HelpTooltip } from "./help-tooltip";
import "./celebration-companion.css";

const features = [
  { title: "Every moment, in order", description: "Dates, timings, dress notes and venues, from the first welcome to the last dance.", icon: CalendarDays, help: "About schedules and guest visibility", detail: "Add each function in the editor with its own date, time and venue. Personal guest links show the functions allowed for that guest’s group. Hidden draft functions stay private." },
  { title: "An easier way to get there", description: "A venue, an address and a directions link for each part of your celebration.", icon: MapPin, help: "About venue directions", detail: "Add the venue address and its Google Maps share link. Guests can open Directions or copy the address. The map in this sample is an illustration, not a real venue location." },
  { title: "One place for their replies", description: "Collect attendance, party sizes and personal notes through each guest’s RSVP link.", icon: Users, help: "About collecting guest replies", detail: "Create a guest in your dashboard and send their personal link. Responses appear in your guest list. The public invitation link only shares event details; it does not collect guest RSVPs." },
  { title: "Little updates, easy to find", description: "Post a welcome, a timing change or a helpful reminder right on the invitation.", icon: MessageCircle, help: "About invitation updates", detail: "Publish announcements from your dashboard. Guests see them when they open or refresh the invitation. Updates do not send automatic WhatsApp messages or push notifications. Saved edits use the same link unless you change its address." },
];

export function CelebrationCompanion() {
  return <section id="celebration-companion" className="celebration-companion container" aria-labelledby="celebration-companion-title">
    <div className="celebration-companion-copy">
      <span className="eyebrow">MORE THAN A SAVE-THE-DATE</span>
      <h2 id="celebration-companion-title">The invite is<br />only <em>the beginning.</em></h2>
      <p className="celebration-companion-intro">The date is set. The excitement is building. Give your people one familiar place to check the plan, find their way and stay part of the celebration.</p>
    </div>
    <CelebrationPreview />
    <div className="celebration-companion-details">
      <ul className="celebration-features">{features.map(({ title, description, icon: Icon, help, detail }) => <li key={title}>
        <span className="celebration-feature-icon"><Icon size={19} aria-hidden="true" /></span>
        <div><h3>{title}</h3><p>{description}</p></div>
        <HelpTooltip label={help}>{detail}</HelpTooltip>
      </li>)}</ul>
      <div className="celebration-companion-action"><Link className="button" href="/demo#updates">Explore event updates <ArrowRight size={16} aria-hidden="true" /></Link><span>A little look inside. No sign-up needed.</span></div>
    </div>
  </section>;
}
