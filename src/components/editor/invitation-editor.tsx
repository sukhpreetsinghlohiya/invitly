"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Heart, ImagePlus, LayoutTemplate, Link2, Loader2, Plus, Save, Settings2, Smartphone, Sparkles, Trash2, Upload } from "lucide-react";
import { Brand } from "@/components/brand";
import { InvitationArt } from "@/components/invitation-art";
import { themes } from "@/data/themes";
import { validateInvitationDraft, type InvitationDraft } from "@/lib/invitation-draft";
import { saveInvitation, setPublication } from "@/app/dashboard/actions";
import { fromZonedInput, toZonedInput } from "@/lib/timezone";
import { uploadEventPhoto, deleteEventPhoto } from "@/app/dashboard/media-actions";
import type { EventPhoto } from "@/types/media";
import type { Invitation, ThemeId } from "@/types/invitation";

const STORAGE_KEY = "invitly:invitation-draft:v2";
const subscribeHydration = () => () => {};
export type EditorPhoto = EventPhoto;
type Props = { initialPhotos?: EditorPhoto[]; photoError?: string; publishedAt?: string | null; initialDraft: InvitationDraft; eventId?: string; published: boolean; configured: boolean; signedIn: boolean; siteUrl: string; preferredTheme?: ThemeId };
type Tab = "Design" | "Details" | "Functions" | "Photos" | "Share";
const steps = [{ name: "Design", icon: LayoutTemplate }, { name: "Details", icon: Heart }, { name: "Functions", icon: Settings2 }, { name: "Photos", icon: ImagePlus }, { name: "Share", icon: Link2 }] as const;

export function InvitationEditor(props: Props) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [createdEventId, setCreatedEventId] = useState<string>();
  let initial = props.initialDraft;
  if (hydrated && !props.eventId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? validateInvitationDraft(JSON.parse(stored)) : null;
      if (parsed?.data) initial = parsed.data;
    } catch { /* Local storage is optional; the editor still works in memory. */ }
    if (props.preferredTheme) initial = { ...initial, themeId: props.preferredTheme };
  }
  // A first save changes the URL from a local draft to its new event ID. Keep
  // that workspace mounted so refreshed server props cannot erase its feedback.
  const workspaceId = props.eventId === createdEventId ? "local" : props.eventId || "local";
  return <EditorWorkspace key={`${workspaceId}:${hydrated}`} {...props} initialDraft={initial} onCreated={setCreatedEventId} />;
}

const TIME_ZONES = [
  ["Asia/Kolkata", "India · Kolkata"], ["Asia/Dubai", "UAE · Dubai"], ["Asia/Singapore", "Singapore"],
  ["Asia/Kathmandu", "Nepal · Kathmandu"], ["Asia/Bangkok", "Thailand · Bangkok"], ["Asia/Hong_Kong", "Hong Kong"],
  ["Asia/Tokyo", "Japan · Tokyo"], ["Europe/London", "UK · London"], ["Europe/Paris", "France · Paris"],
  ["Europe/Berlin", "Germany · Berlin"], ["Europe/Rome", "Italy · Rome"], ["America/New_York", "US · New York"],
  ["America/Chicago", "US · Chicago"], ["America/Denver", "US · Denver"], ["America/Los_Angeles", "US · Los Angeles"],
  ["America/Toronto", "Canada · Toronto"], ["America/Vancouver", "Canada · Vancouver"], ["Australia/Sydney", "Australia · Sydney"],
  ["Australia/Perth", "Australia · Perth"], ["Pacific/Auckland", "New Zealand · Auckland"], ["Africa/Johannesburg", "South Africa · Johannesburg"], ["UTC", "Coordinated Universal Time"],
] as const;

function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    let restoringHistory = false;
    const warning = "You have unsaved invitation changes. Leave without saving?";
    function beforeUnload(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    function click(event: globalThis.MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.dataset.preserveDraft === "true") return;
      const target = new URL(link.href, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (!window.confirm(warning)) { event.preventDefault(); event.stopPropagation(); }
    }
    function pop(event: PopStateEvent) {
      if (restoringHistory) { restoringHistory = false; return; }
      if (!window.confirm(warning)) { event.stopImmediatePropagation(); restoringHistory = true; window.history.forward(); }
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, [dirty]);
}

function EditorWorkspace({ initialDraft, eventId: initialId, published: initiallyPublished, publishedAt, initialPhotos = [], photoError, configured, signedIn, siteUrl, onCreated }: Props & { onCreated: (eventId: string) => void }) {
  const [draft, setDraft] = useState(initialDraft);
  const [tab, setTab] = useState<Tab>("Design");
  const [eventId, setEventId] = useState(initialId);
  const [published, setPublished] = useState(initiallyPublished);
  const [everPublished, setEverPublished] = useState(Boolean(publishedAt || initiallyPublished));
  const [photos, setPhotos] = useState(initialPhotos);
  const [mediaPending, setMediaPending] = useState(false);
  const [mediaError, setMediaError] = useState(photoError || "");
  const [mediaMessage, setMediaMessage] = useState("");
  const previewPanel = useRef<HTMLElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [savedSlug, setSavedSlug] = useState(initialDraft.invitation.slug);
  const invitation = draft.invitation;
  const theme = themes.find(item => item.id === draft.themeId)!;
  const shareUrl = `${siteUrl}/i/${savedSlug}`;

  useUnsavedChanges(dirty || pending || mediaPending);
  useEffect(() => {
    if (!previewVisible) return;
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previewPanel.current?.querySelector<HTMLButtonElement>(".editor-preview-close")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { setPreviewVisible(false); return; }
      if (event.key !== "Tab") return;
      const nodes = previewPanel.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,textarea");
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = priorOverflow; window.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [previewVisible]);

  function changeZone(zone: string) {
    const wedding = fromZonedInput(toZonedInput(invitation.weddingAt, invitation.timezone), zone);
    if (!wedding.value) { setError(wedding.error || "Choose a valid time zone."); return; }
    const functions: Invitation["functions"] = [];
    for (const item of invitation.functions) {
      const converted = fromZonedInput(toZonedInput(item.startsAt, invitation.timezone), zone);
      if (!converted.value) { setError(`${item.name}: ${converted.error || "Choose a valid local time."}`); return; }
      functions.push({ ...item, startsAt: converted.value });
    }
    details({ timezone: zone, weddingAt: wedding.value, functions });
  }
  function changeDate(wallTime: string, index?: number) {
    const result = fromZonedInput(wallTime, invitation.timezone);
    if (!result.value) { setError(result.error || "Choose a valid date and time."); return; }
    if (index === undefined) details({ weddingAt: result.value });
    else changeFunction(index, { startsAt: result.value });
  }

  function change(next: InvitationDraft) { setDraft(next); setDirty(true); setMessage(""); setError(""); }
  function chooseTheme(themeId: ThemeId) {
    change({ ...draft, themeId });
    if (!eventId) window.history.replaceState(null, "", `/customize?theme=${themeId}`);
  }
  function details(patch: Partial<Invitation>) { change({ ...draft, invitation: { ...invitation, ...patch } }); }
  function changeName(index: 0 | 1, name: string) {
    const couple: [string, string] = [...invitation.couple]; couple[index] = name;
    details({ couple, initials: couple.map(value => Array.from(value.trim())[0] || "").join("") || "♡" });
  }
  function changeFunction(index: number, patch: Partial<Invitation["functions"][number]>) {
    details({ functions: invitation.functions.map((item, i) => i === index ? { ...item, ...patch } : item) });
  }
  function addFunction() {
    if (invitation.functions.length >= 12) return;
    details({ functions: [...invitation.functions, { id: `function-${crypto.randomUUID()}`, name: "New function", startsAt: invitation.weddingAt, description: "A little moment to celebrate together.", venue: "Your venue", address: invitation.city, dressCode: "Come as you are", icon: "sparkles" }] });
  }
  async function save(publish = false) {
    const checked = validateInvitationDraft(draft);
    if (!checked.data) { setError(checked.error); return; }
    setError(""); setMessage("");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.data)); }
    catch { if (!signedIn) { setError("This browser could not save your draft. Allow local storage or sign in to save to your account."); return; } }
    if (!signedIn) {
      setDirty(false);
      setMessage(publish ? "Your draft is saved on this device. Sign in to publish a permanent link for your family." : "Draft saved on this device. Sign in when you’re ready to publish.");
      if (publish) setTab("Share");
      return;
    }
    setPending(true);
    try {
      const result = await saveInvitation({ ...checked.data, eventId });
      if (result.error || !result.eventId) { setError(result.error || "Your invitation could not be saved. Please try again."); return; }
      if (!eventId) onCreated(result.eventId);
      setEventId(result.eventId); setSavedSlug(result.slug || invitation.slug); setPublished(Boolean(result.published)); setEverPublished(Boolean(result.publishedAt || result.published || everPublished)); setDirty(false);
      window.history.replaceState(null, "", `/customize?event=${result.eventId}`);
      if (publish) {
        const publication = await setPublication(result.eventId, true);
        if (publication.error) { setError(publication.error); return; }
        setPublished(true); setEverPublished(true); setTab("Share"); setMessage("Your invitation is live. Share a little joy with your family.");
      } else setMessage(result.published ? "Changes saved. Your shared invitation is updated." : "Your invitation is safely saved as a private draft.");
    } catch { setError("We couldn’t reach your account. Your draft is still saved on this device."); }
    finally { setPending(false); }
  }
  async function unpublish() {
    if (!eventId) return;
    setPending(true); setError("");
    try { const result = await setPublication(eventId, false); if (result.error) setError(result.error); else { setPublished(false); setMessage("Your invitation is private again. Guests can no longer open its link."); } }
    catch { setError("Could not unpublish. Please try again."); }
    finally { setPending(false); }
  }
  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventId) { setMediaError("Save this invitation to your account before adding photos."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setMediaError("Choose a photo to upload."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setMediaError("Choose a JPG, PNG, or WebP photo up to 5 MB."); return; }
    setMediaPending(true); setMediaError(""); setMediaMessage("");
    try {
      const result = await uploadEventPhoto(eventId, data);
      if (result.error || !result.photo) { setMediaError(result.error || "The photo could not be uploaded. Please try again."); return; }
      setPhotos((current) => [...current, result.photo!]);
      form.reset(); setMediaMessage("Photo uploaded. It will appear with your invitation when published.");
    } catch { setMediaError("The photo service is unavailable. Your invitation is safe; please try again."); }
    finally { setMediaPending(false); }
  }
  async function removePhoto(photo: EditorPhoto) {
    if (!eventId || !window.confirm("Remove this photo from your invitation?")) return;
    setMediaPending(true); setMediaError(""); setMediaMessage("");
    try {
      const result = await deleteEventPhoto(eventId, photo.id);
      if (result.error) { setMediaError(result.error); return; }
      setPhotos((current) => current.filter((item) => item.id !== photo.id)); setMediaMessage("Photo removed.");
    } catch { setMediaError("This photo could not be removed. Please try again."); }
    finally { setMediaPending(false); }
  }
  function preserveForAccount(event: MouseEvent<HTMLAnchorElement>) {
    const checked = validateInvitationDraft(draft);
    if (!checked.data) { event.preventDefault(); setError(checked.error); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.data)); setDirty(false); }
    catch { event.preventDefault(); setError("We couldn’t preserve your design in this browser. Allow local storage before continuing to your account."); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setMessage("Invitation link copied. Ready for the family group."); }
    catch { setMessage("Select and copy your invitation link from the field below."); }
  }
  const preview = { ...invitation, weddingAt: Number.isFinite(Date.parse(invitation.weddingAt)) ? invitation.weddingAt : initialDraft.invitation.weddingAt };

  return <div className="editor-page">
    <header className="editor-header"><Brand /><Link className="editor-back" href={signedIn ? "/dashboard" : "/templates"}><ArrowLeft size={14} /> {signedIn ? "Your celebrations" : "The collection"}</Link><div className="editor-header-actions"><span className="editor-save-state">{dirty ? "Unsaved changes" : published ? "Published" : everPublished ? "Unpublished" : eventId ? "Private draft" : "Your creative space"}</span><button className="button button-secondary button-small" disabled={pending || mediaPending} onClick={() => void save()}>{pending ? <Loader2 size={15} className="editor-spinner" /> : <Save size={15} />} Save draft</button><button className="button button-small editor-header-publish" onClick={() => void save(true)} disabled={pending || mediaPending}>Publish invitation <ArrowRight size={15} /></button></div></header>
    <main id="main" className="editor-layout">
      <section className="editor-controls" inert={previewVisible || pending || mediaPending || undefined}><div className="editor-heading"><span className="eyebrow">A LITTLE OF YOU, IN EVERY DETAIL</span><h1>Make it <em>yours.</em></h1><p>The look you love. The people you love. Let&apos;s put them together.</p></div>
        <nav className="editor-steps" aria-label="Customization steps">{steps.map((step, index) => <button key={step.name} aria-pressed={tab === step.name} onClick={() => setTab(step.name)}><step.icon size={16} /><span>{step.name}</span><small>0{index + 1}</small></button>)}</nav>
        <div className="editor-form-panel">
          {tab === "Design" && <><div className="editor-panel-heading"><h2>A feeling, before a word.</h2><p>Ten original looks. Switch anytime — your story comes with you.</p></div><div className="editor-theme-grid">{themes.map(item => <button key={item.id} aria-pressed={draft.themeId === item.id} aria-label={item.name} className="editor-theme-choice" onClick={() => chooseTheme(item.id)}><span className={`editor-swatch swatch-${item.id}`} style={{ "--swatch-accent": item.accent } as CSSProperties}><span>{item.number}</span><i>{item.family === "Floral" ? "❧" : item.family === "Minimal" ? "&" : "✦"}</i>{draft.themeId === item.id && <b><Check size={12} /></b>}</span><strong>{item.name}</strong><small>{item.family}</small></button>)}</div><button className="button editor-next" onClick={() => setTab("Details")}>Now, tell your story <ArrowRight size={16} /></button></>}
          {tab === "Details" && <><div className="editor-panel-heading"><h2>The two of you.</h2><p>Start with the names everyone is coming to celebrate.</p></div><div className="editor-field-pair"><label className="form-field">First name<input value={invitation.couple[0]} maxLength={30} onChange={event => changeName(0, event.target.value)} /></label><label className="form-field">Second name<input value={invitation.couple[1]} maxLength={30} onChange={event => changeName(1, event.target.value)} /></label></div><label className="form-field">Opening line<input value={invitation.intro} maxLength={160} onChange={event => details({ intro: event.target.value })} /></label><label className="form-field">Your message<textarea value={invitation.message} maxLength={5000} rows={4} onChange={event => details({ message: event.target.value })} /></label><div className="editor-field-pair"><label className="form-field">First family<input value={invitation.families[0]} maxLength={120} onChange={event => details({ families: [event.target.value, invitation.families[1]] })} /></label><label className="form-field">Second family<input value={invitation.families[1]} maxLength={120} onChange={event => details({ families: [invitation.families[0], event.target.value] })} /></label></div><label className="form-field">Event time zone<select value={invitation.timezone} onChange={event => changeZone(event.target.value)}>{!TIME_ZONES.some(([zone]) => zone === invitation.timezone) && <option value={invitation.timezone}>{invitation.timezone}</option>}{TIME_ZONES.map(([zone, label]) => <option key={zone} value={zone}>{label} · {zone}</option>)}</select><small>All functions use this zone. Changing it keeps the local times you entered.</small></label><label className="form-field">Wedding date and time ({invitation.timezone})<input type="datetime-local" value={toZonedInput(invitation.weddingAt, invitation.timezone)} onChange={event => changeDate(event.target.value)} /></label><label className="form-field">City<input value={invitation.city} maxLength={160} onChange={event => details({ city: event.target.value })} /></label><label className="editor-toggle"><input type="checkbox" checked={draft.musicEnabled} onChange={event => change({ ...draft, musicEnabled: event.target.checked })} /><span><strong>Offer a little music</strong><small>Our original melody. Guests choose Play; it never autoplays.</small></span></label><button className="button editor-next" onClick={() => setTab("Functions")}>Add your celebrations <ArrowRight size={16} /></button></>}
          {tab === "Functions" && <><div className="editor-panel-heading"><h2>Every happy moment.</h2><p>From haldi sunshine to the last dance. All times are in {invitation.timezone}.</p></div><div className="editor-function-list">{invitation.functions.map((func, index) => <fieldset className="editor-function" key={func.id}><legend><span>0{index + 1}</span> {func.name || "Your function"}</legend><button type="button" className="editor-remove" aria-label={`Remove ${func.name}`} disabled={invitation.functions.length <= 1} onClick={() => details({ functions: invitation.functions.filter(item => item.id !== func.id) })}><Trash2 size={15} /></button><label className="form-field">Function name<input value={func.name} maxLength={80} onChange={event => changeFunction(index, { name: event.target.value })} /></label><label className="form-field">Date and time ({invitation.timezone})<input type="datetime-local" value={toZonedInput(func.startsAt, invitation.timezone)} onChange={event => changeDate(event.target.value, index)} /></label><label className="form-field">Venue name<input value={func.venue} maxLength={200} onChange={event => changeFunction(index, { venue: event.target.value })} /></label><label className="form-field">Venue address<input value={func.address} maxLength={500} onChange={event => changeFunction(index, { address: event.target.value })} /><small>Directions open this address in Google Maps.</small></label><label className="form-field">A little description<textarea value={func.description} maxLength={1000} rows={2} onChange={event => changeFunction(index, { description: event.target.value })} /></label><div className="editor-field-pair"><label className="form-field">Dress code<input value={func.dressCode} maxLength={100} onChange={event => changeFunction(index, { dressCode: event.target.value })} /></label><label className="form-field">Motif<select value={func.icon} onChange={event => changeFunction(index, { icon: event.target.value as Invitation["functions"][number]["icon"] })}><option value="sun">Sunshine</option><option value="music">Music</option><option value="heart">Heart</option><option value="sparkles">Sparkle</option></select></label></div></fieldset>)}</div><button className="button button-secondary editor-add" disabled={invitation.functions.length >= 12} onClick={addFunction}><Plus size={16} /> Add function</button><button className="button editor-next" onClick={() => setTab("Photos")}>Add a little of your story <ArrowRight size={16} /></button></>}
          {tab === "Photos" && <><div className="editor-panel-heading"><h2>A few favourite moments.</h2><p>Add your own photos to the invitation. Choose images you own or have permission to share.</p></div>{!signedIn || !eventId ? <div className="editor-photo-empty"><ImagePlus size={31} /><h3>Your story, in pictures.</h3><p>{signedIn ? "Save your invitation once to create a private home for your photos." : "Sign in and save your invitation to securely upload photos."}</p>{signedIn ? <button className="button" disabled={pending || mediaPending} onClick={() => void save()}>Save invitation to add photos</button> : <Link className="button button-secondary" data-preserve-draft="true" onClick={preserveForAccount} href={configured ? "/login" : "/setup"}>{configured ? "Sign in to add photos" : "Set up photo storage"}</Link>}</div> : <><form className="editor-photo-upload" onSubmit={uploadPhoto}><label className="form-field">Choose a photo<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required disabled={mediaPending} /><small>JPG, PNG, or WebP · up to 5 MB each.</small></label><label className="form-field">Photo description<input name="alt" required maxLength={300} placeholder="e.g. The two of us in the Jaipur gardens" disabled={mediaPending} /><small>A short description makes your photo accessible to everyone.</small></label><button className="button" disabled={mediaPending} type="submit">{mediaPending ? <Loader2 className="editor-spinner" size={16} /> : <Upload size={16} />}{mediaPending ? "Updating photos…" : "Upload photo"}</button></form>{photos.length ? <div className="editor-photo-grid">{photos.map(photo => <figure key={photo.id}><Image src={photo.url} alt={photo.alt} width={photo.width || 1200} height={photo.height || 800} unoptimized /><figcaption>{photo.alt}</figcaption><button className="button button-secondary" type="button" disabled={mediaPending} onClick={() => void removePhoto(photo)}><Trash2 size={14} /> Remove photo</button></figure>)}</div> : <p className="editor-photo-note">Your first photo will appear here after uploading.</p>}</>}<div aria-live="polite">{mediaError && <p className="form-error" role="alert">{mediaError}</p>}{mediaMessage && <p className="form-success">{mediaMessage}</p>}</div><button className="button editor-next" onClick={() => setTab("Share")}>Give it a little link <ArrowRight size={16} /></button></>}
          {tab === "Share" && <><div className="editor-panel-heading"><h2>A little link.<br /><em>A big family group.</em></h2><p>Publish your invitation, then send the same link to everyone you love.</p></div><label className="form-field">Invitation link<span className="editor-url-prefix">{siteUrl.replace(/^https?:\/\//, "")}/i/</span><input value={invitation.slug} maxLength={100} autoCapitalize="none" spellCheck={false} onChange={event => details({ slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /><small>Use lowercase letters, numbers, and hyphens. Changing a live link means sharing the new address.</small></label><div className="editor-publish-note"><Sparkles size={19} /><div><strong>Your own page on Invitly</strong><p>Guests open the link in their browser. No account, no download — just your celebration.</p></div></div>{!signedIn && <div className="editor-account-note"><p>{configured ? "Sign in to keep your design in your account and publish your invitation. Your draft will be preserved on this device when you continue." : "You can design and save locally now. Connect Supabase and sign in to publish a permanent link."}</p><Link className="text-link" data-preserve-draft="true" onClick={preserveForAccount} href={configured ? "/signup" : "/setup"}>{configured ? "Create your host account" : "Connect your installation"} <ArrowRight size={14} /></Link>{configured && <Link className="text-link" data-preserve-draft="true" onClick={preserveForAccount} href="/login">Already have an account? Sign in</Link>}</div>}<button className="button editor-publish" disabled={pending || mediaPending} onClick={() => void save(true)}>{pending ? "Preparing your invitation…" : published ? "Save & update invitation" : "Publish invitation"}<ArrowRight size={16} /></button>{published && <div className="editor-share-live"><span className="eyebrow"><span className="live-dot" /> YOUR INVITATION IS LIVE</span><label className="form-field">Published invitation URL<input readOnly value={shareUrl} onFocus={event => event.currentTarget.select()} /></label><div className="editor-share-actions"><button className="button button-secondary" onClick={() => void copyLink()}><Copy size={15} /> Copy link</button><a className="button" href={`https://wa.me/?text=${encodeURIComponent(`We would love to celebrate with you! ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp <ExternalLink size={14} /></a><a className="text-link" href={shareUrl} target="_blank" rel="noopener noreferrer">Open invitation <ExternalLink size={14} /></a></div><button className="editor-unpublish" disabled={pending || mediaPending} onClick={() => void unpublish()}>Make invitation private</button></div>}</>}
        </div>
        <div aria-live="polite" className="editor-feedback">{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success">{message}</p>}</div>
        <p className="editor-credit">Made with a little love. Made by Sukhpreet.</p>
      </section>
      <section ref={previewPanel} role={previewVisible ? "dialog" : undefined} aria-modal={previewVisible || undefined} aria-label="Live invitation preview" className={`editor-preview ${previewVisible ? "editor-preview-open" : ""}`}><div className="editor-preview-toolbar"><span><Smartphone size={14} /> LIVE PREVIEW</span><span>{theme.name}</span><button onClick={() => setPreviewVisible(false)} className="editor-preview-close">Back to editing</button></div><div className="editor-phone"><div className="editor-phone-top"><span /><i /></div><InvitationArt theme={draft.themeId} invitation={preview} /><div className="editor-preview-copy"><span className="eyebrow">YOU’RE INVITED</span><h2>{invitation.couple.join(" & ")}</h2><p>{invitation.message}</p><div className="editor-mini-functions">{invitation.functions.map(item => <div key={item.id}><span>✦</span><strong>{item.name || "Your function"}</strong><small>{Number.isFinite(Date.parse(item.startsAt)) ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: invitation.timezone }).format(new Date(item.startsAt)) + ` ${invitation.timezone} · ` : ""}{item.venue}</small></div>)}</div><p className="editor-preview-signoff">With love, {invitation.couple.join(" & ")}</p></div></div><p className="editor-preview-hint"><span /> Your changes appear here, as you make them.</p>{eventId ? <><Link href={`/dashboard/events/${eventId}/preview`} className="text-link" target="_blank" rel="noopener noreferrer">Open full invitation preview <ExternalLink size={13} /></Link>{dirty && <p className="editor-preview-hint">The full preview shows your last saved changes.</p>}</> : <p className="editor-preview-hint">Save to your account to open a full private preview.</p>}</section>
    </main><button hidden={previewVisible} className="editor-mobile-preview button" onClick={() => setPreviewVisible(value => !value)}><Smartphone size={16} />{previewVisible ? "Back to editing" : "Preview invitation"}</button>
  </div>;
}
