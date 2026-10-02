"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";

const STORAGE_KEY = "invitly:demo:rsvp:v1";
const CHANGE_EVENT = "invitly-demo-rsvp-change";
type Response = { name: string; attendance: "yes" | "no"; guests: number };

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
function getSnapshot(key: string = STORAGE_KEY) {
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
}
function readResponse(raw: string): Response | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const response = value as Partial<Response>;
    if (typeof response.name !== "string" || !response.name.trim() || response.name.length > 80 || !["yes", "no"].includes(response.attendance ?? "") || !Number.isInteger(response.guests) || Number(response.guests) < 0 || Number(response.guests) > 6) return null;
    return response as Response;
  } catch { return null; }
}

export function RsvpForm({ quiet = false, scope }: { quiet?: boolean; scope?: string }) {
  const storageKey = scope ? `${STORAGE_KEY}:${scope}` : STORAGE_KEY;
  const stored = useSyncExternalStore(subscribe, () => getSnapshot(storageKey), () => "");
  const saved = readResponse(stored);
  const [editing, setEditing] = useState(false);
  const [attendance, setAttendance] = useState("yes");
  const [feedback, setFeedback] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) { setFeedback("Please enter your name."); return; }
    const response: Response = { name, attendance: attendance === "yes" ? "yes" : "no", guests: attendance === "yes" ? Number(data.get("guests") ?? 1) : 0 };
    try {
      localStorage.setItem(storageKey, JSON.stringify(response));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      setEditing(false);
      setFeedback("Your preview response is saved on this device. Nothing was sent to the hosts.");
    } catch {
      setFeedback("This browser could not save your preview. Please allow local storage and try again. Nothing was sent.");
    }
  }

  return (
    <div className="rsvp-preview">
      <p className="demo-disclaimer" id="rsvp-disclaimer">Try the RSVP preview. Your response stays in this browser and is never sent to the hosts.</p>
      {saved && !editing ? (
        <div className="rsvp-success">
          <span className="rsvp-success-mark" aria-hidden="true">✓</span>
          <h3>{saved.attendance === "yes" ? quiet ? `Your response is saved, ${saved.name}.` : `We saved your yes, ${saved.name}!` : `Thank you, ${saved.name}.`}</h3>
          <p>{saved.attendance === "yes" ? `${saved.guests} ${saved.guests === 1 ? "guest" : "guests"}, including you.` : "You selected “Unable to attend”."} Saved on this device only.</p>
          <button className="button button-secondary" type="button" onClick={() => { setAttendance(saved.attendance); setEditing(true); setFeedback(""); }}>Edit my response</button>
        </div>
      ) : (
        <form className="rsvp-form" onSubmit={handleSubmit} aria-describedby="rsvp-disclaimer">
          <div className="form-field">
            <label htmlFor="rsvp-name">Your name</label>
            <input id="rsvp-name" name="name" type="text" autoComplete="name" placeholder="e.g. Simran Singh" maxLength={80} required defaultValue={saved?.name ?? ""} />
          </div>
          <fieldset className="rsvp-attendance">
            <legend>Will you be joining us?</legend>
            <label className={`radio-option ${attendance === "yes" ? "is-selected" : ""}`}>
              <input type="radio" name="attendance" value="yes" checked={attendance === "yes"} onChange={() => setAttendance("yes")} />
              <span>{quiet ? "Will attend" : "Joyfully accepts"}</span>
            </label>
            <label className={`radio-option ${attendance === "no" ? "is-selected" : ""}`}>
              <input type="radio" name="attendance" value="no" checked={attendance === "no"} onChange={() => setAttendance("no")} />
              <span>Unable to attend</span>
            </label>
          </fieldset>
          {attendance === "yes" && <div className="form-field">
            <label htmlFor="rsvp-guests">Guests, including you</label>
            <select id="rsvp-guests" name="guests" defaultValue={saved?.guests || 1}>
              {[1, 2, 3, 4, 5, 6].map((count) => <option value={count} key={count}>{count} {count === 1 ? "guest" : "guests"}</option>)}
            </select>
          </div>}
          <button className="button button-primary" type="submit">Save demo RSVP <span aria-hidden="true">↗</span></button>
        </form>
      )}
      <p className="form-feedback" role="status">{feedback}</p>
    </div>
  );
}
