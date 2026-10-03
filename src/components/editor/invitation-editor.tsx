"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { isOccasionAvailable } from "@/data/occasion-availability";
import { OccasionComingSoon } from "@/components/occasion-coming-soon";
import Image from "next/image";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Circle, Copy, ExternalLink, Heart, ImagePlus, LayoutTemplate, Link2, Loader2, Plus, Save, Settings2, ShieldCheck, Smartphone, Sparkles, Trash2, Upload } from "lucide-react";
import { Brand } from "@/components/brand";
import { InvitationLimitNotice } from "@/components/invitation-plan-notice";
import { OccasionPanel, DesignPanel } from "./occasion-design-panels";
import { WordingPanel } from "./wording-panel";
import { PersonProfileFields } from "./person-profile-fields";
import { InvitationDetailOptions } from "./invitation-options";
import { PreviewFrame } from "./preview-frame";
import { VenueFields } from "./venue-fields";
import { applyOccasion, getDesign, getOccasion } from "@/data/occasions";
import { getOccasionTheme } from "@/data/occasion-themes";
import { ceremonyArtwork } from "@/data/ceremony-art";
import { defaultMusic, youtubeVideoId } from "@/data/music";
import { isValidInvitationDate, validateInvitationDraft, validateMapUrl, type InvitationDraft } from "@/lib/invitation-draft";
import { saveInvitation, setPublication } from "@/app/dashboard/actions";
import { fromZonedInput, toZonedInput } from "@/lib/timezone";
import { uploadEventPhoto, deleteEventPhoto } from "@/app/dashboard/media-actions";
import type { EventPhoto } from "@/types/media";
import type { Invitation, ThemeId, OccasionId, TraditionId } from "@/types/invitation";

const STORAGE_KEY = "invitly:invitation-draft:v2";
const subscribeHydration = () => () => {};
export type EditorPhoto = EventPhoto;
type Props = { initialPhotos?: EditorPhoto[]; photoError?: string; publishedAt?: string | null; initialDraft: InvitationDraft; eventId?: string; published: boolean; configured: boolean; signedIn: boolean; siteUrl: string; preferredTheme?: ThemeId; preferredOccasion?: OccasionId; preferredTradition?: TraditionId };
type Tab = "Occasion" | "Design" | "Details" | "Functions" | "Photos" | "Share";
const steps = [{ name: "Occasion", icon: CalendarDays }, { name: "Details", icon: Heart }, { name: "Functions", icon: Settings2 }, { name: "Photos", icon: ImagePlus }, { name: "Design", icon: LayoutTemplate }, { name: "Share", icon: Link2 }] as const;
const stepName = (tab: Tab) => tab === "Functions" ? "Schedule" : tab;
const stepGuidance: Record<Tab, string> = {
  Occasion: "Start with the moment you are bringing people together for.",
  Details: "Add the people, date and words that make this invitation yours.",
  Functions: "Help your guests know where to be and when.",
  Photos: "Optional · Your invitation also works beautifully without photos.",
  Design: "Choose a look, then add the finishing touches.",
  Share: "Check the details, preview your invitation and share when ready.",
};

export function InvitationEditor(props: Props) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [createdEventId, setCreatedEventId] = useState<string>();
  let initial = props.initialDraft;
  let restoredLocalDraft = false;
  let savedLocalSnapshot: string | null = null;
  if (hydrated && !props.eventId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? validateInvitationDraft(JSON.parse(stored), "draft") : null;
      if (parsed?.data) { initial = parsed.data; restoredLocalDraft = true; savedLocalSnapshot = JSON.stringify(parsed.data); }
    } catch { /* Local storage is optional; the editor still works in memory. */ }
    if (props.preferredTheme) initial = { ...initial, themeId: props.preferredTheme };
    if (props.preferredOccasion) initial = { ...initial, invitation: applyOccasion(initial.invitation, props.preferredOccasion) };
    if (props.preferredTradition) initial = { ...initial, invitation: { ...initial.invitation, tradition: props.preferredTradition } };
  }
  if (!props.eventId && !isOccasionAvailable(initial.invitation.occasion)) return <OccasionComingSoon occasion={initial.invitation.occasion!} />;
  const restoredWithChanges = savedLocalSnapshot !== null && savedLocalSnapshot !== JSON.stringify(initial);
  // A first save changes the URL from a local draft to its new event ID. Keep
  // that workspace mounted so refreshed server props cannot erase its feedback.
  const workspaceId = props.eventId === createdEventId ? "local" : props.eventId || "local";
  return <EditorWorkspace key={`${workspaceId}:${hydrated}`} {...props} initialDraft={initial} restoredLocalDraft={restoredLocalDraft} restoredWithChanges={restoredWithChanges} onCreated={setCreatedEventId} />;
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

type ReadinessItem = { id: string; title: string; detail: string; step: Tab; status: "ready" | "missing" | "optional"; action: string };
function publishingChecklist(draft: InvitationDraft): ReadinessItem[] {
  const invitation = draft.invitation;
  const occasion = getOccasion(invitation.occasion);
  const namesReady = Boolean(invitation.couple[0].trim()) && (occasion.people === 1 || Boolean(invitation.couple[1].trim()));
  const dateReady = isValidInvitationDate(invitation.weddingAt);
  const visible = invitation.functions.filter(item => item.visibility !== "hidden");
  const incomplete = invitation.functions.filter(item => {
    try { validateMapUrl(item.mapUrl); } catch { return true; }
    if (item.visibility === "hidden") return Boolean(item.startsAt) && !isValidInvitationDate(item.startsAt);
    return !item.name.trim() || !isValidInvitationDate(item.startsAt) || !item.venue.trim() || !item.address.trim();
  });
  const music = getDesign(invitation).music || defaultMusic;
  const videoId = youtubeVideoId(music.youtubeUrl);
  const musicReady = (!music.youtubeUrl || Boolean(videoId)) && (!draft.musicEnabled || music.source !== "youtube" || Boolean(videoId));
  const slug = invitation.slug.trim();
  const slugReady = slug.length >= 3 && slug.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
  return [
    { id: "names", title: occasion.people === 2 ? "Names" : "Host or celebrant name", detail: namesReady ? invitation.couple.filter(Boolean).join(" & ") : occasion.people === 2 ? "Add both names for this occasion." : "Add the name your guests will recognise.", step: "Details", status: namesReady ? "ready" : "missing", action: "Review names" },
    { id: "date", title: "Event date & timezone", detail: dateReady ? `Date entered · ${invitation.timezone}` : "Choose the event date and time.", step: "Details", status: dateReady ? "ready" : "missing", action: "Review event date" },
    { id: "schedule", title: "Guest schedule", detail: incomplete.length ? `${incomplete.length} ${incomplete.length === 1 ? "item needs" : "items need"} a title, valid date, venue, address or map link.` : visible.length ? `${visible.length} ${visible.length === 1 ? "function is" : "functions are"} ready for permitted guests.${invitation.functions.length > visible.length ? ` ${invitation.functions.length - visible.length} hidden.` : ""}` : "No guest-visible functions yet. You can add them later.", step: "Functions", status: incomplete.length ? "missing" : visible.length ? "ready" : "optional", action: "Review schedule" },
    { id: "music", title: "Optional soundtrack", detail: !musicReady ? "Choose a valid YouTube video or switch to an instrumental." : draft.musicEnabled ? music.source === "youtube" ? "YouTube song selected · guests tap to play." : music.source === "upload" ? "Your uploaded audio selected · guests tap to play." : music.source === "library" ? "Wedding recording selected · guests tap to play." : "Original instrumental selected · guests tap to play." : "Music is off. Guests can enjoy a quiet invitation.", step: "Design", status: !musicReady ? "missing" : draft.musicEnabled ? "ready" : "optional", action: "Review soundtrack" },
    { id: "link", title: "Invitation link", detail: slugReady ? `/i/${slug}` : "Use 3–100 lowercase letters, numbers and single hyphens.", step: "Share", status: slugReady ? "ready" : "missing", action: "Review invitation link" },
  ];
}

function EditorWorkspace({ initialDraft, eventId: initialId, published: initiallyPublished, publishedAt, initialPhotos = [], photoError, configured, signedIn, siteUrl, onCreated, restoredLocalDraft, restoredWithChanges }: Props & { onCreated: (eventId: string) => void; restoredLocalDraft: boolean; restoredWithChanges: boolean }) {
  const [draft, setDraft] = useState(initialDraft);
  const [tab, setTab] = useState<Tab>("Occasion");
  const [eventId, setEventId] = useState(initialId);
  const [published, setPublished] = useState(initiallyPublished);
  const [everPublished, setEverPublished] = useState(Boolean(publishedAt || initiallyPublished));
  const [photos, setPhotos] = useState(initialPhotos);
  const [mediaPending, setMediaPending] = useState(false);
  const [mediaError, setMediaError] = useState(photoError || "");
  const [mediaMessage, setMediaMessage] = useState("");
  const previewPanel = useRef<HTMLElement>(null);
  const feedbackPanel = useRef<HTMLDivElement>(null);
  const formPanel = useRef<HTMLFieldSetElement>(null);
  const previousTab = useRef<Tab>("Occasion");
  const invitationLink = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [dirty, setDirty] = useState(restoredWithChanges);
  const [hasSaved, setHasSaved] = useState(Boolean(initialId || restoredLocalDraft));
  const [previewVisible, setPreviewVisible] = useState(false);
  const [savedSlug, setSavedSlug] = useState(initialDraft.invitation.slug);
  const invitation = draft.invitation;
  const occasion = getOccasion(invitation.occasion);
  const theme = getOccasionTheme(invitation.occasion, draft.themeId);
  const shareUrl = `${siteUrl}/i/${savedSlug}`;
  const stepIndex = steps.findIndex(step => step.name === tab);
  const nextStep = steps[stepIndex + 1];
  const previousStep = steps[stepIndex - 1];
  const saveState = pending || mediaPending ? "saving" : dirty ? "unsaved" : hasSaved ? "saved" : "new";
  const saveLabel = pending ? "Saving your invitation…" : mediaPending ? "Updating your photos…" : dirty ? "Unsaved changes" : hasSaved ? eventId ? "All changes saved" : "Saved on this device" : "New draft · not saved yet";
  const visibleError = error || (tab === "Photos" ? mediaError : "");
  const visibleMessage = message || (tab === "Photos" ? mediaMessage : "");
  const readiness = publishingChecklist(draft);
  const publishValidation = tab === "Share" ? validateInvitationDraft(draft, "publish") : null;

  useUnsavedChanges(dirty || pending || mediaPending);
  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    const heading = formPanel.current?.querySelector<HTMLHeadingElement>("h2");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }, [tab]);
  useEffect(() => {
    if (!visibleError) return;
    feedbackPanel.current?.focus({ preventScroll: true });
    feedbackPanel.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
  }, [visibleError]);
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
    const closePreview = (event: MessageEvent) => {
      const frame = previewPanel.current?.querySelector("iframe");
      if (event.origin === window.location.origin && event.source === frame?.contentWindow && event.data?.type === "invitly-preview-close") setPreviewVisible(false);
    };
    window.addEventListener("message", closePreview);
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = priorOverflow; window.removeEventListener("keydown", keydown); window.removeEventListener("message", closePreview); previous?.focus(); };
  }, [previewVisible]);

  function changeZone(zone: string) {
    const wedding = invitation.weddingAt ? fromZonedInput(toZonedInput(invitation.weddingAt, invitation.timezone), zone) : { value: "" };
    if (wedding.value === undefined) { setError(wedding.error || "Choose a valid time zone."); return; }
    const countdown = invitation.countdownAt ? fromZonedInput(toZonedInput(invitation.countdownAt, invitation.timezone), zone) : { value: "" };
    if (countdown.value === undefined) { setError(countdown.error || "Choose a valid countdown time zone."); return; }
    const functions: Invitation["functions"] = [];
    for (const item of invitation.functions) {
      const converted = item.startsAt ? fromZonedInput(toZonedInput(item.startsAt, invitation.timezone), zone) : { value: "" };
      if (converted.value === undefined) { setError(`${item.name}: ${converted.error || "Choose a valid local time."}`); return; }
      functions.push({ ...item, startsAt: converted.value });
    }
    details({ timezone: zone, weddingAt: wedding.value, ...(invitation.countdownAt === undefined ? {} : { countdownAt: countdown.value }), functions });
  }
  function changeDate(wallTime: string, index?: number) {
    if (!wallTime) { if (index === undefined) details({ weddingAt: "" }); else changeFunction(index, { startsAt: "" }); return; }
    const result = fromZonedInput(wallTime, invitation.timezone);
    if (!result.value) { setError(result.error || "Choose a valid date and time."); return; }
    if (index === undefined) details({ weddingAt: result.value });
    else changeFunction(index, { startsAt: result.value });
  }

  function change(next: InvitationDraft) {
    setDraft(next); setDirty(true); setMessage(""); setError("");
    if (!eventId && (next.themeId !== draft.themeId || next.invitation.occasion !== invitation.occasion || next.invitation.tradition !== invitation.tradition)) {
      const parameters = new URLSearchParams({ theme: next.themeId, occasion: next.invitation.occasion || "wedding", tradition: next.invitation.tradition || "neutral" });
      window.history.replaceState(null, "", `/customize?${parameters}`);
    }
  }
  function chooseTheme(themeId: ThemeId) {
    change({ ...draft, themeId });
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
    if (invitation.functions.length >= 100) return;
    details({ functions: [...invitation.functions, { id: `function-${crypto.randomUUID()}`, name: occasion.schedule, startsAt: invitation.weddingAt, description: "", venue: "", address: invitation.city, dressCode: "", icon: occasion.id === "remembrance" ? "heart" : "sparkles", mapUrl: "", visibility: "public" }] });
  }
  async function save(publish = false) {
    const checked = validateInvitationDraft(draft, publish || published ? "publish" : "draft");
    if (!checked.data) { setError(checked.error); return; }
    setError(""); setMessage("");
    let deviceBackupSaved = false;
    try { localStorage.setItem(eventId ? `${STORAGE_KEY}:${eventId}` : STORAGE_KEY, JSON.stringify(checked.data)); deviceBackupSaved = true; }
    catch { if (!signedIn) { setError("This browser could not save your draft. Allow local storage or sign in to save to your account."); return; } }
    if (!signedIn) {
      setDirty(false); setHasSaved(true);
      setMessage(publish ? "Your draft is saved on this device. Sign in to publish a permanent link for your family." : "Draft saved on this device. Sign in when you’re ready to publish.");
      if (publish) setTab("Share");
      return;
    }
    setPending(true);
    try {
      const result = await saveInvitation({ ...checked.data, eventId });
      if (result.upgradeRequired) { setUpgradeRequired(true); setError(result.error || "Your free invitation allowance is used."); return; }
      if (result.error || !result.eventId) { setError(result.error || "Your invitation could not be saved. Please try again."); return; }
      if (!eventId) { onCreated(result.eventId); try { localStorage.removeItem(STORAGE_KEY); } catch {} }
      setEventId(result.eventId); setSavedSlug(result.slug || invitation.slug); setPublished(Boolean(result.published)); setEverPublished(Boolean(result.publishedAt || result.published || everPublished)); setDirty(false); setHasSaved(true);
      window.history.replaceState(null, "", `/customize?event=${result.eventId}`);
      if (publish) {
        const publication = await setPublication(result.eventId, true);
        if (publication.error) { setError(publication.error); return; }
        setPublished(true); setEverPublished(true); setTab("Share"); setMessage("Your invitation is live. Share your invitation with your people.");
      } else setMessage(result.published ? "Changes saved. Your shared invitation is updated." : "Your invitation is safely saved as a private draft.");
    } catch { setError(deviceBackupSaved ? "We couldn’t reach your account. Your draft is still saved on this device." : "We couldn’t reach your account or save a device backup. Your changes are still open in this editor. Try saving again before leaving."); }
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
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      const photoReferences: Partial<Invitation> = {};
      if (invitation.coverPhotoId === photo.id) photoReferences.coverPhotoId = "";
      if (invitation.personProfiles?.some(profile => profile.photoId === photo.id)) {
        photoReferences.personProfiles = invitation.personProfiles.map(profile => profile.photoId === photo.id ? { ...profile, photoId: "" } : profile) as NonNullable<Invitation["personProfiles"]>;
      }
      if (Object.keys(photoReferences).length) details(photoReferences);
      setMediaMessage("Photo removed.");
    } catch { setMediaError("This photo could not be removed. Please try again."); }
    finally { setMediaPending(false); }
  }
  function preserveForAccount(event: MouseEvent<HTMLAnchorElement>) {
    const checked = validateInvitationDraft(draft, "draft");
    if (!checked.data) { event.preventDefault(); setError(checked.error); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked.data)); setDirty(false); }
    catch { event.preventDefault(); setError("We couldn’t preserve your design in this browser. Allow local storage before continuing to your account."); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setMessage("Invitation link copied. Ready for the family group."); }
    catch { setMessage("Select and copy your invitation link from the field below."); }
  }

  function review(item: ReadinessItem) {
    if (item.step !== tab) setTab(item.step);
    else if (item.id === "link") {
      invitationLink.current?.focus({ preventScroll: true });
      invitationLink.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    }
  }

  return <div className="editor-page">
    <header className="editor-header" inert={previewVisible || undefined}><Brand /><Link className="editor-back" href={signedIn ? "/dashboard" : "/templates"}><ArrowLeft size={14} /> {signedIn ? "Your celebrations" : "The collection"}</Link><div className="editor-header-actions"><button className="button button-secondary button-small editor-preview-trigger" aria-label="Preview invitation" onClick={() => setPreviewVisible(true)}><Smartphone size={15} /> Preview</button><button className="button button-secondary button-small" disabled={pending || mediaPending} onClick={() => void save()}>{pending ? <Loader2 size={15} className="editor-spinner" /> : <Save size={15} />} Save draft</button><button className="button button-small editor-header-publish" onClick={() => void save(true)} disabled={pending || mediaPending}>Publish invitation <ArrowRight size={15} /></button></div></header>
    <div className="editor-workspace-status" role="status" aria-live="polite" data-save-state={saveState} data-storage={eventId ? "account" : "device"} inert={previewVisible || undefined}><div className="editor-status-copy"><span>{saveState === "saving" ? <Loader2 size={16} className="editor-spinner" /> : saveState === "saved" ? <CheckCircle2 size={16} /> : saveState === "unsaved" ? <Circle size={13} /> : <Save size={15} />}{saveLabel}</span><small>{eventId ? "Saved to your account" : hasSaved ? "Available only in this browser" : signedIn ? "Save to your account when ready" : "Save draft keeps your work on this device"}</small></div><span className="editor-publication-state">{published ? "Live invitation" : everPublished ? "Unpublished" : "Private draft"}</span></div>
    <main id="main" className="editor-layout">
      <section className="editor-controls" inert={previewVisible || undefined}><div className="editor-heading"><span className="eyebrow">A LITTLE OF YOU, IN EVERY DETAIL</span><h1>Make it <em>yours.</em></h1><p>From a first idea to a thoughtful invitation. Save anytime and finish at your own pace.</p></div>
        <nav className="editor-steps" aria-label="Customization steps">{steps.map((step, index) => <button type="button" key={step.name} disabled={mediaPending} aria-label={stepName(step.name)} aria-pressed={tab === step.name} aria-current={tab === step.name ? "step" : undefined} onClick={() => setTab(step.name)}><step.icon size={16} /><span>{stepName(step.name)}</span><small>0{index + 1}</small></button>)}</nav>
        <div className="editor-step-progress"><div className="editor-current-step" role="status">Step {stepIndex + 1} of {steps.length} · {stepName(tab)}</div><progress aria-label="Invitation editor progress" aria-valuetext={`Step ${stepIndex + 1} of ${steps.length}: ${stepName(tab)}`} value={stepIndex + 1} max={steps.length} /><p>{stepGuidance[tab]}</p></div>
        <div aria-live="polite" className="editor-feedback" ref={feedbackPanel} tabIndex={-1}>{visibleError && <p className="form-error" role="alert"><AlertCircle size={18} />{visibleError}</p>}{visibleMessage && <p className="form-success"><CheckCircle2 size={18} />{visibleMessage}</p>}{upgradeRequired && <InvitationLimitNotice />}</div>
        <fieldset className="editor-form-panel" key={tab} ref={formPanel} disabled={pending || mediaPending} aria-labelledby="editor-step-heading">
          {tab === "Occasion" && <OccasionPanel draft={draft} change={change} />}
          {tab === "Design" && <DesignPanel draft={draft} change={change} chooseTheme={chooseTheme} eventId={eventId} signedIn={signedIn} saveForAudio={() => void save()} busy={setMediaPending} preserveForAudio={preserveForAccount} />}
          {tab === "Details" && <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>{occasion.id === "remembrance" ? "A life to remember." : "The people. The story."}</h2><p>{occasion.id === "remembrance" ? "Share the name and memories you would like to honour." : "Your words make this invitation yours. Leave optional details blank."}</p></div><WordingPanel invitation={invitation} onApply={details} /><div className="editor-field-pair"><label className="form-field">{occasion.firstLabel}<input value={invitation.couple[0]} maxLength={60} onChange={event => changeName(0, event.target.value)} /></label><label className="form-field">{occasion.secondLabel || "Additional name (optional)"}<input value={invitation.couple[1]} maxLength={60} onChange={event => changeName(1, event.target.value)} /></label></div><label className="form-field">Opening line<input value={invitation.intro} maxLength={160} onChange={event => details({ intro: event.target.value })} /></label><label className="form-field">Your message<textarea value={invitation.message} maxLength={5000} rows={4} onChange={event => details({ message: event.target.value })} /></label>{occasion.people === 2 ? <PersonProfileFields invitation={invitation} photos={photos} onChange={details} onChoosePhotos={() => setTab("Photos")} /> : <div className="editor-field-pair"><label className="form-field">Family / hosts (optional)<input value={invitation.families[0]} maxLength={120} onChange={event => details({ families: [event.target.value, invitation.families[1]] })} /></label><label className="form-field">Additional family (optional)<input value={invitation.families[1]} maxLength={120} onChange={event => details({ families: [invitation.families[0], event.target.value] })} /></label></div>}<label className="form-field">Event time zone<select value={invitation.timezone} onChange={event => changeZone(event.target.value)}>{!TIME_ZONES.some(([zone]) => zone === invitation.timezone) && <option value={invitation.timezone}>{invitation.timezone}</option>}{TIME_ZONES.map(([zone, label]) => <option key={zone} value={zone}>{label} · {zone}</option>)}</select><small>All functions use this zone. Changing it keeps the local times you entered.</small></label><label className="form-field">Event date and time ({invitation.timezone})<input type="datetime-local" value={toZonedInput(invitation.weddingAt, invitation.timezone)} onChange={event => changeDate(event.target.value)} /></label><label className="form-field">City<input value={invitation.city} maxLength={160} onChange={event => details({ city: event.target.value })} /></label><label className="form-field">Blessing or personal note (optional)<textarea value={invitation.blessing || ""} maxLength={1000} rows={3} onChange={event => details({ blessing: event.target.value })} /><small>Use your own words in English, Hindi, Punjabi, or any language. Leave blank to omit.</small></label><label className="form-field">Closing message<textarea value={invitation.closingText ?? ""} maxLength={300} rows={2} onChange={event => details({ closingText: event.target.value })} /></label><InvitationDetailOptions invitation={invitation} onChange={details} onError={setError} /></>}
          {tab === "Functions" && <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>Your gathering, at a glance.</h2><p>Add the moments your guests need to know about. All times use {invitation.timezone}. You can save unfinished details.</p>{occasion.id === "wedding" && <p className="editor-ceremony-hint">Ceremony artwork follows your function title: Haldi, Mehndi, Sangeet, Wedding, Reception, Baraat or Engagement. English, Hindi and Punjabi titles are supported. Other titles use your chosen motif. Hide artwork in Design → Decorative artwork.</p>}</div><div className="editor-schedule-overview"><strong>{invitation.functions.filter(item => item.visibility !== "hidden").length} visible to permitted guests</strong><span>{invitation.functions.filter(item => item.visibility === "hidden").length} hidden drafts</span></div>{occasion.id === "wedding" && <datalist id="editor-ceremony-titles">{ceremonyArtwork.map(item => <option key={item.id} value={item.label} />)}</datalist>}{!invitation.functions.length && <div className="editor-schedule-empty"><CalendarDays size={24} /><h3>Start with your first gathering.</h3><p>Add a title, date and venue. You can keep an unfinished function hidden until the details are ready.</p></div>}<div className="editor-function-list">{invitation.functions.map((func, index) => <fieldset className="editor-function" key={func.id}><legend><span>{String(index + 1).padStart(2, "0")}</span> {func.name || "Your function"}</legend><button type="button" className="editor-remove" aria-label={`Remove ${func.name}`} onClick={() => details({ functions: invitation.functions.filter(item => item.id !== func.id) })}><Trash2 size={15} /></button><label className="form-field">Function name<input list={occasion.id === "wedding" ? "editor-ceremony-titles" : undefined} value={func.name} maxLength={80} onChange={event => changeFunction(index, { name: event.target.value })} /></label><label className="form-field">Date and time ({invitation.timezone})<input type="datetime-local" value={toZonedInput(func.startsAt, invitation.timezone)} onChange={event => changeDate(event.target.value, index)} /></label><VenueFields event={func} change={patch => changeFunction(index, patch)} /><label className="form-field">Guest visibility<select value={func.visibility || "public"} onChange={event => changeFunction(index, { visibility: event.target.value as "public" | "hidden" })}><option value="public">Visible to permitted guests</option><option value="hidden">Draft — hidden from all guests</option></select><small>Guest-group restrictions still apply. Hidden items never appear on guest links.</small></label><label className="form-field">A little description<textarea value={func.description} maxLength={1000} rows={2} onChange={event => changeFunction(index, { description: event.target.value })} /></label><div className="editor-field-pair"><label className="form-field">Dress code<input value={func.dressCode} maxLength={100} onChange={event => changeFunction(index, { dressCode: event.target.value })} /></label><label className="form-field">Motif<select value={func.icon} onChange={event => changeFunction(index, { icon: event.target.value as Invitation["functions"][number]["icon"] })}><option value="sun">Sunshine</option><option value="music">Music</option><option value="heart">Heart</option><option value="sparkles">Sparkle</option></select></label></div></fieldset>)}</div><button className="button button-secondary editor-add" disabled={invitation.functions.length >= 100} onClick={addFunction}><Plus size={16} /> Add function</button></>}
          {tab === "Photos" && <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>A few favourite moments.</h2><p>Add your own photos to the invitation. Choose images you own or have permission to share.</p></div>{!signedIn || !eventId ? <div className="editor-photo-empty"><ImagePlus size={31} /><h3>Your story, in pictures.</h3><p>{signedIn ? "Save your invitation once to create a private home for your photos." : "Sign in and save your invitation to securely upload photos."}</p>{signedIn ? <button className="button" disabled={pending || mediaPending} onClick={() => void save()}>Save invitation to add photos</button> : <Link className="button button-secondary" data-preserve-draft="true" onClick={preserveForAccount} href={configured ? "/login" : "/setup"}>{configured ? "Sign in to add photos" : "Set up photo storage"}</Link>}</div> : <><form className="editor-photo-upload" onSubmit={uploadPhoto}><label className="form-field">Choose a photo<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required disabled={mediaPending} /><small>JPG, PNG, or WebP · up to 5 MB each.</small></label><label className="form-field">Photo description<input name="alt" required maxLength={300} placeholder="Describe what is in this photo" disabled={mediaPending} /><small>A short description makes your photo accessible to everyone.</small></label><button className="button" disabled={mediaPending} type="submit">{mediaPending ? <Loader2 className="editor-spinner" size={16} /> : <Upload size={16} />}{mediaPending ? "Updating photos…" : "Upload photo"}</button></form>{mediaPending && <div className="upload-progress" role="status"><progress aria-label="Uploading and preparing photo" /><span>Uploading, checking, and preparing your photo…</span></div>}{photos.length ? <div className="editor-photo-grid">{photos.map(photo => <figure key={photo.id}><Image src={photo.url} alt={photo.alt} width={photo.width || 1200} height={photo.height || 800} unoptimized /><figcaption>{photo.alt}</figcaption><button className="button button-secondary" type="button" aria-pressed={invitation.coverPhotoId === photo.id || (!invitation.coverPhotoId && photo.id === photos[0]?.id)} onClick={() => details({ coverPhotoId: photo.id })}>{invitation.coverPhotoId === photo.id || (!invitation.coverPhotoId && photo.id === photos[0]?.id) ? "Cover photo" : "Use as cover"}</button><button className="button button-secondary" type="button" disabled={mediaPending} onClick={() => void removePhoto(photo)}><Trash2 size={14} /> Remove photo</button></figure>)}</div> : <p className="editor-photo-note">Your first photo will appear here after uploading.</p>}</>}</>}
          {tab === "Share" && <><div className="editor-panel-heading"><h2 id="editor-step-heading" tabIndex={-1}>A little link.<br /><em>A big family group.</em></h2><p>Publish a shared invitation link. For RSVPs and private schedules, create personal guest links from your dashboard.</p></div><section className="editor-readiness" aria-label="Publishing checklist"><div className="editor-readiness-heading"><ShieldCheck size={25} /><div><h3>{publishValidation?.data ? "Ready for your final preview." : "Before you publish."}</h3><p>Check what your guests will see. Photos and music are optional.</p></div></div><ul>{readiness.map(item => <li key={item.id} data-readiness-status={item.status} data-readiness-id={item.id}><span className="editor-readiness-icon" aria-label={item.status === "ready" ? "Ready" : item.status === "missing" ? "Needs attention" : "Optional"}>{item.status === "ready" ? <CheckCircle2 size={20} /> : item.status === "missing" ? <AlertCircle size={20} /> : <Circle size={18} />}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><button type="button" onClick={() => review(item)} aria-label={item.action}>{item.status === "missing" ? "Add details" : "Review"}<ArrowRight size={15} /></button></li>)}</ul>{publishValidation?.error && <p className="editor-readiness-note">{publishValidation.error}</p>}<button type="button" className="button button-secondary editor-final-preview" onClick={() => setPreviewVisible(true)}><Smartphone size={16} /> Preview before sharing</button></section><label className="form-field">Invitation link<span className="editor-url-prefix">{siteUrl.replace(/^https?:\/\//, "")}/i/</span><input ref={invitationLink} value={invitation.slug} maxLength={100} autoCapitalize="none" spellCheck={false} onChange={event => details({ slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /><small>Use lowercase letters, numbers, and hyphens. Changing a live link means sharing the new address.</small></label><div className="editor-publish-note"><Sparkles size={19} /><div><strong>Your own page on Invitly</strong><p>Guests open the link in their browser. No account, no download — all the details in their browser.</p></div></div>{!signedIn && <div className="editor-account-note"><p>{configured ? "Sign in to keep your design in your account and publish your invitation. Your draft will be preserved on this device when you continue." : "You can design and save locally now. Connect Supabase and sign in to publish a permanent link."}</p><Link className="text-link" data-preserve-draft="true" onClick={preserveForAccount} href={configured ? "/signup" : "/setup"}>{configured ? "Create your host account" : "Connect your installation"} <ArrowRight size={14} /></Link>{configured && <Link className="text-link" data-preserve-draft="true" onClick={preserveForAccount} href="/login">Already have an account? Sign in</Link>}</div>}<button className="button editor-publish" disabled={pending || mediaPending} onClick={() => void save(true)}>{pending ? "Preparing your invitation…" : published ? "Save & update invitation" : "Publish invitation"}<ArrowRight size={16} /></button>{published && <div className="editor-share-live"><span className="eyebrow"><span className="live-dot" /> YOUR INVITATION IS LIVE</span><label className="form-field">Published invitation URL<input readOnly value={shareUrl} onFocus={event => event.currentTarget.select()} /></label><div className="editor-share-actions"><button className="button button-secondary" onClick={() => void copyLink()}><Copy size={15} /> Copy link</button><a className="button" href={`https://wa.me/?text=${encodeURIComponent(`${invitation.coverText || "You’re invited"} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp <ExternalLink size={14} /></a><a className="text-link" href={shareUrl} target="_blank" rel="noopener noreferrer">Open invitation <ExternalLink size={14} /></a></div><button className="editor-unpublish" disabled={pending || mediaPending} onClick={() => void unpublish()}>Make invitation private</button></div>}</>}
          <div className="editor-step-navigation" aria-label="Editor step navigation">{previousStep && <button type="button" className="button button-secondary" onClick={() => setTab(previousStep.name)} aria-label={`Back to ${stepName(previousStep.name)}`}><ArrowLeft size={16} /> Back</button>}{nextStep && <button type="button" className="button editor-continue" onClick={() => setTab(nextStep.name)} aria-label={`Continue to ${stepName(nextStep.name)}`}><span>Continue <small>{stepName(nextStep.name)}</small></span><ArrowRight size={17} /></button>}</div>
        </fieldset>
        <p className="editor-credit">Made with a little love. Made by Sukhpreet.</p>
      </section>
      <section ref={previewPanel} role={previewVisible ? "dialog" : undefined} aria-modal={previewVisible || undefined} aria-label="Live invitation preview" className={`editor-preview ${previewVisible ? "editor-preview-open" : ""}`}><div className="editor-preview-toolbar"><span><Smartphone size={14} /> LIVE PREVIEW</span><span>{theme.name}</span><button onClick={() => setPreviewVisible(false)} className="editor-preview-close">Back to editing</button></div><PreviewFrame draft={draft} photos={photos} />{eventId ? <><Link href={`/dashboard/events/${eventId}/preview`} className="text-link" target="_blank" rel="noopener noreferrer">Open full invitation preview <ExternalLink size={13} /></Link>{dirty && <p className="editor-preview-hint">The full preview shows your last saved changes.</p>}</> : <p className="editor-preview-hint">Save to your account to open a full private preview.</p>}</section>
    </main>
  </div>;
}
