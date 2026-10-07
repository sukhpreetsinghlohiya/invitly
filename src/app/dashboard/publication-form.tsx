"use client";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { setPublication, type EventFormState } from "./actions";

export function PublicationForm({ eventId, published }: { eventId: string; published: boolean }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(async () => {
    try { return await setPublication(eventId, !published); }
    catch { return { error: "Your connection was interrupted. Refresh to check the invitation’s status before trying again." }; }
  }, {});
  return <form action={action} aria-busy={pending}><Button variant="outline" className="w-full" type="submit" disabled={pending}>{pending ? "Updating…" : published ? "Unpublish invitation" : "Publish invitation"}</Button><div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success">{state.success}</p>}</div></form>;
}
