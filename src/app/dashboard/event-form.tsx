"use client";
import { useActionState } from "react";
import { createEvent, type EventFormState } from "./actions";
import { themes } from "@/data/themes";

export function EventForm() {
  const [state, action, pending] = useActionState<EventFormState, FormData>(createEvent, {});
  return <form action={action}>
    <label className="form-field" htmlFor="title">Event title<input id="title" name="title" required maxLength={160} placeholder="Aanya & Kabir’s wedding" /></label>
    <label className="form-field" htmlFor="slug">Link name<input id="slug" name="slug" required minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="aanya-and-kabir" autoCapitalize="none" /><small>Lowercase letters, numbers, and hyphens. This reserves your event’s unique link name.</small></label>
    <label className="form-field" htmlFor="date">Date and time (India Standard Time)<input id="date" name="date" type="datetime-local" required /></label>
    <label className="form-field" htmlFor="venue">Venue<input id="venue" name="venue" required maxLength={500} placeholder="Venue name, city" /></label>
    <label className="form-field" htmlFor="theme">Invitation style<select id="theme" name="theme" defaultValue="royal">{themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
    <button className="button" type="submit" disabled={pending}>{pending ? "Saving your event…" : "Save event draft"}</button>
    <div aria-live="polite" aria-atomic="true">{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success">{state.success}</p>}</div>
  </form>;
}
