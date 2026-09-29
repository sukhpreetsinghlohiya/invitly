"use client";
import { useActionState } from "react";
import { setPublication, type EventFormState } from "./actions";

export function PublicationForm({ eventId, published }: { eventId: string; published: boolean }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(setPublication.bind(null, eventId, !published), {});
  return <form action={action}><button className="button button-secondary" type="submit" disabled={pending}>{pending ? "Updating…" : published ? "Unpublish invitation" : "Publish invitation"}</button><div aria-live="polite">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success">{state.success}</p>}</div></form>;
}
