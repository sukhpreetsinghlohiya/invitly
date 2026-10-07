"use client";

import { BusyIndicator, toast } from "@/components/ui/feedback";

import { useActionState, useEffect, useState } from "react";
import { respondToInvitation, type GuestRsvpState } from "./actions";

export function GuestRsvp({ token, name, maxPartySize, response }: { token: string; name: string; maxPartySize: number; response: { status: "attending" | "maybe" | "declined"; party_size: number; note: string } | null }) {
  const [savedResponse, setSavedResponse] = useState(response);
  const [state, action, pending] = useActionState<GuestRsvpState, FormData>(async (previous, data) => {
    try {
      const result = await respondToInvitation(token, previous, data);
      if (result.success) {
        const status = String(data.get("status")) as NonNullable<typeof response>["status"];
        setSavedResponse({ status, party_size: status === "declined" ? 0 : Number(data.get("partySize")), note: String(data.get("note") || "").trim() });
      }
      return result;
    }
    catch { return { error: "We couldn’t send your response. Check your connection and try again." }; }
  }, {});
  const [status, setStatus] = useState(response?.status || "attending");
  // Action forms reset uncontrolled inputs after they settle. Keep a guest’s
  // latest answers intact after saving, validation errors and transport errors.
  const [partySize, setPartySize] = useState(String(Math.max(1, Math.min(maxPartySize, response?.party_size || 1))));
  const [note, setNote] = useState(response?.note || "");
  useEffect(() => { if (state.success) toast({ title: "RSVP saved", description: state.success }); }, [state]);
  return <form action={action} className="rsvp-form" aria-busy={pending}>
    <h3>{name}, will you join us?</h3>
    <p>This private link is for your party. Your response goes directly to the hosts.</p>
    {savedResponse && !state.success && <p className="form-success">Your current response: {savedResponse.status}{savedResponse.status !== "declined" ? ` · ${savedResponse.party_size} ${savedResponse.party_size === 1 ? "person" : "people"}` : ""}. You can change it below.</p>}
    <label className="form-field">Your response<select name="status" value={status} disabled={pending} onChange={e => setStatus(e.target.value as typeof status)}><option value="attending">Attending</option><option value="maybe">Maybe</option><option value="declined">Declined</option></select></label>
    {status !== "declined" && <label className="form-field">People in your party, including you<input name="partySize" type="number" min={1} max={maxPartySize} required readOnly={pending} value={partySize} onChange={e => setPartySize(e.target.value)} /><small>Your invitation includes up to {maxPartySize} {maxPartySize === 1 ? "person" : "people"}.</small></label>}
    <label className="form-field">A note for the hosts (optional)<textarea name="note" maxLength={1000} rows={3} readOnly={pending} value={note} onChange={e => setNote(e.target.value)} placeholder="Dietary needs or a little message…" /></label>
    <button className="button" type="submit" disabled={pending}>{pending && <BusyIndicator />}{pending ? "Sending your response…" : savedResponse ? "Update RSVP" : "Send RSVP"}</button>
    <div aria-live="polite" aria-atomic="true">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success">{state.success}</p>}</div>
  </form>;
}
