"use client";

import { BusyIndicator, toast } from "@/components/ui/feedback";

import { useActionState, useEffect, useState } from "react";
import { respondToInvitation, type GuestRsvpState } from "./actions";

export function GuestRsvp({ token, name, maxPartySize, response }: { token: string; name: string; maxPartySize: number; response: { status: "attending" | "maybe" | "declined"; party_size: number; note: string } | null }) {
  const [state, action, pending] = useActionState<GuestRsvpState, FormData>(respondToInvitation.bind(null, token), {});
  const [status, setStatus] = useState(response?.status || "attending");
  useEffect(() => { if (state.success) toast({ title: "RSVP saved", description: state.success }); }, [state]);
  return <form action={action} className="rsvp-form" aria-busy={pending}>
    <h3>{name}, will you join us?</h3>
    <p>This private link is for your party. Your response goes directly to the hosts.</p>
    {response && !state.success && <p className="form-success">Your current response: {response.status}{response.status !== "declined" ? ` · ${response.party_size} ${response.party_size === 1 ? "person" : "people"}` : ""}. You can change it below.</p>}
    <label className="form-field">Your response<select name="status" value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="attending">Attending</option><option value="maybe">Maybe</option><option value="declined">Declined</option></select></label>
    {status !== "declined" && <label className="form-field">People in your party, including you<input name="partySize" type="number" min={1} max={maxPartySize} required defaultValue={Math.max(1, response?.party_size || 1)} /><small>Your invitation includes up to {maxPartySize} {maxPartySize === 1 ? "person" : "people"}.</small></label>}
    <label className="form-field">A note for the hosts (optional)<textarea name="note" maxLength={1000} rows={3} defaultValue={response?.note || ""} placeholder="Dietary needs or a little message…" /></label>
    <button className="button" type="submit" disabled={pending}>{pending && <BusyIndicator />}{pending ? "Sending your response…" : response || state.success ? "Update RSVP" : "Send RSVP"}</button>
    <div aria-live="polite" aria-atomic="true">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success">{state.success}</p>}</div>
  </form>;
}
