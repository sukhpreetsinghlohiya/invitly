import Link from "next/link";
import { ArrowRight, Check, CheckCheck, Gift, ImagePlus, Link2, MapPin, MessageCircle, Send, Users } from "lucide-react";
import { Flower } from "@/components/brand";
import { HelpTooltip } from "./help-tooltip";
import "./how-it-works.css";

function DesignGraphic() {
  return <div className="how-graphic how-design-graphic" aria-hidden="true">
    <div className="how-mini-editor"><div className="how-mini-toolbar"><span><i /><i /><i /></span><small>YOUR PREVIEW</small></div>
      <div className="how-mini-editor-body"><div className="how-mini-fields"><span>Names</span><i /><span>Your day</span><i /><span>The details</span><div><MapPin size={13} /><ImagePlus size={13} /></div><div className="how-colour-dots"><b /><b /><b /></div></div>
        <div className="how-mini-invitation"><Flower /><small>TOGETHER WITH OUR FAMILIES</small><strong>Aanya<br /><em>&</em><br />Kabir</strong><span>14 · FEB · 2027</span></div></div>
    </div><span className="how-graphic-caption"><Check size={12} /> Your words. Your colours. Your moment.</span>
  </div>;
}

function ShareGraphic() {
  return <div className="how-graphic how-share-graphic" aria-hidden="true">
    <div className="how-link-sample"><span><Link2 size={14} /> YOUR INVITATION LINK</span><strong>invitly.co.in/i/your-day</strong><i><CheckCheck size={15} /> Ready to share</i></div>
    <div className="how-link-branches"><div><Send size={19} /><strong>Public link</strong><span>Event details</span></div><div><MessageCircle size={19} /><strong>Personal link</strong><span>Guest RSVP</span></div></div>
    <span className="how-graphic-caption">Example links · you choose who to send them to</span>
  </div>;
}

function GuestGraphic() {
  return <div className="how-graphic how-guests-graphic" aria-hidden="true">
    <div className="how-response-sample"><header><span><Users size={15} /> Guest responses</span><small>EXAMPLE</small></header>
      <div><span className="how-person">R</span><span><strong>Riya & family</strong><small>3 people · Vegetarian meals</small></span><span className="how-response-yes">Attending</span></div>
      <div><span className="how-person">A</span><span><strong>Arjun</strong><small>1 person</small></span><span className="how-response-maybe">Maybe</span></div>
    </div><div className="how-update-sample"><CheckCheck size={16} /><span><strong>A little update, all together.</strong><small>“The celebration starts at 6 pm.”</small></span></div>
  </div>;
}

export function HowItWorks() {
  return <section id="how-it-works" className="how-invitly" aria-labelledby="how-invitly-title"><div className="container">
    <div className="how-invitly-heading"><div><span className="eyebrow">HOW INVITLY WORKS</span><h2 id="how-invitly-title">From “save the date”<br />to <em>“see you there.”</em></h2></div><div><p>Less coordinating. More celebrating.</p><p>Make an invitation, send the right link, and keep your people in the loop. Here’s what happens at each step.</p><Link className="text-link" href="/demo">See a sample invitation <ArrowRight size={16} /></Link></div></div>
    <ol className="how-invitly-steps">
      <li className="how-invitly-step"><div className="how-step-label"><span>01 / MAKE IT YOURS</span><HelpTooltip label="More about drafts and your free invitations">You can try designs without signing up. Saving to your account uses one of your two free invitations. A saved draft stays private until you publish it. Editing or changing its design doesn’t use another free slot.</HelpTooltip></div>
        <DesignGraphic /><h3>Create your invitation</h3><p>Start with your occasion and a design you love. Then make every detail feel like you.</p>
        <ul className="how-step-checks"><li><Check />Add names, a date, venues and your own words.</li><li><Check />Include photos, a schedule and optional music.</li><li><Check />Check the phone or desktop preview, then save your draft.</li></ul>
        <Link className="how-step-link" href="/templates">Find your design <ArrowRight size={15} /></Link>
      </li>
      <li className="how-invitly-step"><div className="how-step-label"><span>02 / SEND A LITTLE JOY</span><HelpTooltip label="Public links and personal RSVP links explained">Your public link shows the invitation details. To collect an RSVP, add a guest in your dashboard and send that person their private guest link. Anyone holding that private link can respond for that guest, so share it with its intended recipient.</HelpTooltip></div>
        <ShareGraphic /><h3>Share the right link</h3><p>Publish when you’re ready. Your guests open the invitation in their browser—no app or account needed.</p>
        <ul className="how-step-checks"><li><Check />Share the public link for your event details.</li><li><Check />Add guests to create their personal RSVP links.</li><li><Check />Copy and send links yourself through WhatsApp, email or messages.</li></ul>
        <Link className="how-step-link" href="/demo">See what guests see <ArrowRight size={15} /></Link>
      </li>
      <li className="how-invitly-step"><div className="how-step-label"><span>03 / BRING EVERYONE TOGETHER</span><HelpTooltip label="More about guest responses and live updates">Guests use their personal link to choose Attending, Maybe or Declined, add their party size and leave a note. Saved edits update the same invitation link. If you change its link name, share the new address. Announcements appear on the invitation; they aren’t automatic WhatsApp messages.</HelpTooltip></div>
        <GuestGraphic /><h3>Know who’s coming</h3><p>Keep responses and the latest details in one place, from the first welcome to the final farewell.</p>
        <ul className="how-step-checks"><li><Check />See attendance, party sizes and guest notes in your dashboard.</li><li><Check />Post announcements and keep venue details up to date.</li><li><Check />Edit your saved invitation as plans change, without starting over.</li></ul>
        <Link className="how-step-link" href="/dashboard">Open your dashboard <ArrowRight size={15} /></Link>
      </li>
    </ol>
    <div className="how-free-note"><div className="how-free-icon"><Gift size={23} /></div><div><strong>A little room to try it. Your first 2 invitations are free.</strong><p>Choose any template. Extra invitations will need a paid plan—payments are coming soon. Your saved invitations remain editable.</p></div><Link className="button" href="/signup">Create a free account <ArrowRight size={16} /></Link></div>
  </div></section>;
}
