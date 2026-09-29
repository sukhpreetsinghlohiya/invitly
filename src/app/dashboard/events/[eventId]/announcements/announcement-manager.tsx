"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Megaphone, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { changeAnnouncement, removeAnnouncement, saveAnnouncement, type AnnouncementResult, type HostAnnouncement } from "@/app/dashboard/announcement-actions";

type RunAction = (key: string, action: () => Promise<AnnouncementResult>, removedId?: string) => Promise<boolean>;
function stamp(iso: string, timezone: string) {
  try { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(iso)); }
  catch { return "Date unavailable"; }
}

export function AnnouncementManager({ eventId, timezone, initialAnnouncements }: { eventId: string; timezone: string; initialAnnouncements: HostAnnouncement[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const ordered = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at));

  const run: RunAction = async (key, action, removedId) => {
    setPending(key); setError(""); setMessage("");
    try {
      const result = await action();
      if (result.error) { setError(result.error); return false; }
      if (removedId) setAnnouncements((current) => current.filter((item) => item.id !== removedId));
      if (result.announcement) {
        const saved = result.announcement;
        setAnnouncements((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      }
      setMessage(result.success || "Announcement updated.");
      return true;
    } catch { setError("We couldn’t reach the announcement service. Your existing updates are safe; please try again."); return false; }
    finally { setPending(""); }
  };

  return <div className="announcements-workspace"><section className="announcements-composer" aria-labelledby="new-announcement-title"><span className="eyebrow">FROM YOUR HOSTS, WITH LOVE</span><h2 id="new-announcement-title">Keep them <em>close.</em></h2><p>A venue note, a new timing, a warm welcome. Write it once, right here.</p><AnnouncementForm eventId={eventId} pending={Boolean(pending)} run={run} /></section>
    <section className="announcements-list" aria-labelledby="announcements-list-title"><div className="announcements-list-heading"><h2 id="announcements-list-title">Your announcements</h2><span>{announcements.length} {announcements.length === 1 ? "update" : "updates"}</span></div><p className="announcements-zone">Dates shown in {timezone}. Pinned updates appear first.</p><div className="announcements-feedback" aria-live="polite">{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}</div>
      {ordered.length ? <div className="announcements-feed">{ordered.map((item) => <AnnouncementCard key={item.id} eventId={eventId} announcement={item} timezone={timezone} pending={pending} run={run} />)}</div> : <div className="announcements-empty"><Megaphone size={29} /><h3>No updates just yet.</h3><p>Your guests will see announcements here after you publish them. Start with a warm welcome or a useful travel note.</p></div>}
    </section></div>;
}

function AnnouncementForm({ eventId, announcement, pending, run, onDone }: { eventId: string; announcement?: HostAnnouncement; pending: boolean; run: RunAction; onDone?: () => void }) {
  const [message, setMessage] = useState(announcement?.message || "");
  const [published, setPublished] = useState(announcement?.is_published ?? true);
  const [pinned, setPinned] = useState(announcement?.pinned || false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = await run(announcement?.id || "new", () => saveAnnouncement(eventId, announcement?.id || null, form));
    if (saved) {
      if (onDone) onDone();
      else { setMessage(""); setPublished(true); setPinned(false); }
    }
  }
  return <form className="announcement-form" onSubmit={submit}><label className="form-field">{announcement ? "Edit announcement message" : "Message for your guests"}<textarea name="message" required maxLength={1000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="A little note from your hosts…" disabled={pending} /></label><p className="announcement-character-count">{message.length} / 1,000 characters</p><label className="announcement-checkbox"><input type="checkbox" name="is_published" checked={published} onChange={(event) => setPublished(event.target.checked)} disabled={pending} /><span><strong>Publish for guests</strong><small>Turn off to keep this announcement as a private draft.</small></span></label><label className="announcement-checkbox"><input type="checkbox" name="pinned" checked={pinned} onChange={(event) => setPinned(event.target.checked)} disabled={pending} /><span><strong>Pin to the top</strong><small>Keep an important detail easy to find.</small></span></label><div className="announcement-form-actions"><button type="submit" className="button" disabled={pending}>{pending ? <Loader2 size={15} className="announcement-spinner" /> : <Plus size={15} />}{pending ? "Saving…" : announcement ? "Save announcement" : published ? "Post announcement" : "Save announcement draft"}</button>{onDone && <button type="button" className="button button-secondary" disabled={pending} onClick={onDone}>Cancel editing</button>}</div></form>;
}

function AnnouncementCard({ eventId, announcement: item, timezone, pending, run }: { eventId: string; announcement: HostAnnouncement; timezone: string; pending: string; run: RunAction }) {
  const [editing, setEditing] = useState(false);
  async function remove() {
    if (!window.confirm("Remove this announcement? It will disappear from your invitation.")) return;
    await run(item.id, () => removeAnnouncement(eventId, item.id), item.id);
  }
  return <article className={`announcement-card ${item.pinned ? "announcement-pinned" : ""}`}><div className="announcement-card-meta"><span className={`announcement-badge ${item.is_published ? "announcement-visible" : ""}`}>{item.is_published ? <Eye size={12} /> : <EyeOff size={12} />}{item.is_published ? "Published" : "Private draft"}</span>{item.pinned && <span className="announcement-pin-label"><Pin size={12} /> Pinned</span>}<time dateTime={item.created_at}>{stamp(item.created_at, timezone)}</time></div>
    {editing ? <AnnouncementForm eventId={eventId} announcement={item} pending={Boolean(pending)} run={run} onDone={() => setEditing(false)} /> : <><p className="announcement-message">{item.message}</p>{item.updated_at !== item.created_at && <p className="announcement-edited">Updated {stamp(item.updated_at, timezone)}</p>}<div className="announcement-card-actions"><button type="button" disabled={Boolean(pending)} onClick={() => setEditing(true)}><Pencil size={14} /> Edit announcement</button><button type="button" disabled={Boolean(pending)} onClick={() => void run(item.id, () => changeAnnouncement(eventId, item.id, "pinned", !item.pinned))}>{item.pinned ? <PinOff size={14} /> : <Pin size={14} />}{item.pinned ? "Unpin announcement" : "Pin announcement"}</button><button type="button" disabled={Boolean(pending)} onClick={() => void run(item.id, () => changeAnnouncement(eventId, item.id, "is_published", !item.is_published))}>{item.is_published ? <EyeOff size={14} /> : <Eye size={14} />}{item.is_published ? "Hide announcement" : "Publish announcement"}</button><button className="announcement-remove" type="button" disabled={Boolean(pending)} onClick={() => void remove()}><Trash2 size={14} /> Remove announcement</button></div></>}
  </article>;
}
