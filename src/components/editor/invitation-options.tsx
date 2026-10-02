"use client";

import { fromZonedInput, toZonedInput } from "@/lib/timezone";
import type { Invitation, InvitationDesign, InvitationOpening } from "@/types/invitation";
import styles from "./invitation-options.module.css";

export function InvitationDetailOptions({ invitation, onChange, onError }: { invitation: Invitation; onChange: (patch: Partial<Invitation>) => void; onError: (error: string) => void }) {
  const video = invitation.video || { enabled: false, url: "", title: "Our story, on film." };
  return <div className={styles.options}>
    {invitation.occasion !== "remembrance" && <section className={styles.section} aria-labelledby="countdown-options-title"><h3 id="countdown-options-title">A moment to count down to.</h3><label className="form-field">Countdown end date and time ({invitation.timezone})<input type="datetime-local" value={toZonedInput(invitation.countdownAt || "", invitation.timezone)} onChange={event => {
      if (!event.target.value) { onChange({ countdownAt: "" }); return; }
      const result = fromZonedInput(event.target.value, invitation.timezone);
      if (!result.value) { onError(result.error || "Choose a valid countdown date and time."); return; }
      onChange({ countdownAt: result.value });
    }} /><small>Leave blank to count down to your event date. You can hide the countdown in Design.</small></label></section>}
    <section className={styles.section} aria-labelledby="video-options-title"><h3 id="video-options-title">Your story, in motion.</h3><label className="editor-toggle"><input type="checkbox" checked={video.enabled} onChange={event => onChange({ video: { ...video, enabled: event.target.checked } })} /><span><strong>Show an invitation video</strong><small>Add a pre-wedding film or another video you’d like to share.</small></span></label>
      {video.enabled && <><label className="form-field">Video section title<input value={video.title ?? "Our story, on film."} maxLength={120} onChange={event => onChange({ video: { ...video, title: event.target.value } })} /></label><label className="form-field">YouTube or Vimeo video link<input type="url" maxLength={500} value={video.url} placeholder="https://youtu.be/… or https://vimeo.com/…" onChange={event => onChange({ video: { ...video, url: event.target.value } })} /><small>Your guests choose when to load and play the video.</small></label></>}
    </section>
  </div>;
}

export function InvitationDesignOptions({ design, onChange }: { design: InvitationDesign; onChange: (patch: Partial<InvitationDesign>) => void }) {
  const opening: InvitationOpening = design.opening || { style: "theme", icon: "monogram", line: "An invitation, just for you" };
  return <section className={styles.section} aria-labelledby="opening-options-title">
    <h3 id="opening-options-title">An opening, just for them.</h3>
    <label className="form-field">Invitation opening<select value={opening.style} onChange={event => onChange({ opening: { ...opening, style: event.target.value as InvitationOpening["style"] } })}><option value="theme">Theme original</option><option value="envelope">An envelope to open</option><option value="none">Show the invitation straight away</option></select></label>
    {opening.style === "envelope" && <><label className="form-field">Envelope cover icon<select value={opening.icon} onChange={event => onChange({ opening: { ...opening, icon: event.target.value as InvitationOpening["icon"] } })}><option value="rings">Two rings</option><option value="flower">A flower</option><option value="monogram">Your initials</option></select></label><label className="form-field">Envelope opening line<input value={opening.line} maxLength={160} onChange={event => onChange({ opening: { ...opening, line: event.target.value } })} /></label></>}
    <label className="editor-toggle"><input type="checkbox" checked={design.rsvp ?? true} onChange={event => onChange({ rsvp: event.target.checked })} /><span><strong>Show RSVP</strong><small>Offer a response section and RSVP links on the invitation.</small></span></label>
  </section>;
}
