"use client";

import { useState } from "react";
import { CalendarDays, Check, CheckCheck, MapPin, MessageCircle, Navigation, Users } from "lucide-react";
import { Flower } from "@/components/brand";

const views = [
  { id: "updates", label: "Updates", icon: MessageCircle },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "directions", label: "Directions", icon: MapPin },
  { id: "rsvp", label: "RSVP", icon: Users },
] as const;
type View = typeof views[number]["id"];

function PreviewContent({ view }: { view: View }) {
  if (view === "schedule") return <div className="celebration-schedule">
    <span className="celebration-panel-label">A DAY TO REMEMBER · 14 FEB</span>
    <h3>A little plan for our day.</h3>
    <ol>
      <li><span>10:00 AM</span><div><strong>A sunny little haldi</strong><p>The garden · Wear a touch of yellow</p></div></li>
      <li><span>4:00 PM</span><div><strong>The wedding ceremony</strong><p>The courtyard · Come a little early</p></div></li>
      <li><span>7:00 PM</span><div><strong>Dinner & dancing</strong><p>The ballroom · Bring your best moves</p></div></li>
    </ol>
  </div>;
  if (view === "directions") return <div className="celebration-directions">
    <span className="celebration-panel-label">A PLACE TO COME TOGETHER</span>
    <div className="celebration-map" aria-hidden="true"><span className="celebration-map-garden" /><span className="celebration-map-road" /><span className="celebration-map-pin"><MapPin size={24} /></span><small>ILLUSTRATIVE MAP</small></div>
    <h3>The Garden House</h3><p>Jaipur, Rajasthan · Example venue</p>
    <span className="celebration-preview-tag"><Navigation size={13} aria-hidden="true" /> Directions from your invitation</span>
  </div>;
  if (view === "rsvp") return <div className="celebration-rsvp">
    <span className="celebration-panel-label">A PERSONAL GUEST LINK</span>
    <h3>A little yes. A lot of joy.</h3>
    <div className="celebration-rsvp-answer"><span><Check size={21} aria-hidden="true" /></span><div><strong>We’ll be there!</strong><p>Riya & family · 3 guests</p></div></div>
    <div className="celebration-rsvp-note"><span>A NOTE FOR THE HOSTS</span><p>“One vegetarian meal, please. Can’t wait to celebrate with you!”</p></div>
    <span className="celebration-preview-tag"><CheckCheck size={14} aria-hidden="true" /> Sample response · nothing is submitted</span>
  </div>;
  return <div className="celebration-updates">
    <span className="celebration-panel-label">A LITTLE NOTE FROM THE HOSTS</span>
    <h3>Good plans have little updates.</h3>
    <div className="celebration-host-note"><span className="celebration-avatar" aria-hidden="true">A&K</span><div><strong>Aanya & Kabir</strong><small>Sample announcement</small><p>Dancing starts at 7! Join us in the ballroom. We’ll save you a spot on the dance floor.</p></div></div>
    <div className="celebration-note-footer"><MessageCircle size={15} aria-hidden="true" /><span>A warm welcome. A change of plans.<br />A note that’s easy to find again.</span></div>
  </div>;
}

export function CelebrationPreview() {
  const [view, setView] = useState<View>("updates");
  return <div className="celebration-preview">
    <div className="celebration-preview-heading"><Flower /><span>THE CELEBRATION CONTINUES</span><p>Aanya <em>&</em> Kabir</p><small>14 FEBRUARY 2027 · JAIPUR</small></div>
    <div className="celebration-preview-sheet">
      <div className="celebration-preview-meta"><span><i /> YOUR GUEST’S VIEW</span><small>INTERACTIVE SAMPLE</small></div>
      <div className="celebration-preview-controls" role="group" aria-label="Explore the invitation features">
        {views.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={view === id} aria-controls="celebration-preview-content" onClick={() => setView(id)}><Icon size={16} aria-hidden="true" /><span>{label}</span></button>)}
      </div>
      <div id="celebration-preview-content" className="celebration-preview-content" role="region" aria-label={`${views.find(item => item.id === view)?.label} example`} aria-live="polite" aria-atomic="true"><PreviewContent view={view} /></div>
      <div className="celebration-preview-bottom"><span>Made for your people.</span><Flower /></div>
    </div>
    <p className="celebration-preview-hint">Pick a feature above to take a little look.</p>
  </div>;
}
