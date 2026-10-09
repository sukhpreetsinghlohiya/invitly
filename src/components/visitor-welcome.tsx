"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, LoaderCircle, X } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { toast } from "@/components/ui/feedback";
import { isWelcomePage } from "@/lib/visitor-welcome";
import styles from "./visitor-welcome.module.css";

const storageKey = "invitly:welcome-completed:v1";
const dismissedKey = "invitly:welcome-dismissed:v1";
const rememberFor = 30 * 24 * 60 * 60_000;

function alreadyIntroduced() {
  try {
    const submittedAt = Number(localStorage.getItem(storageKey));
    return submittedAt > 0 && submittedAt <= Date.now() && Date.now() - submittedAt < rememberFor;
  } catch { return false; }
}

function dismissedThisVisit() {
  try { return sessionStorage.getItem(dismissedKey) === "true"; } catch { return false; }
}

export function VisitorWelcome() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  const dismissed = useRef(false);
  const submissionId = useRef<string | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const eligible = isWelcomePage(pathname);
  const open = enabled && eligible && !completed;

  useEffect(() => {
    if (!eligible || completed) return;
    if (alreadyIntroduced() || dismissedThisVisit()) return;
    const controller = new AbortController();
    // The server only returns availability; webhook URL and token stay private.
    fetch("/api/visitor-welcome", { cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(result => { if (!controller.signal.aborted && result?.enabled === true) setEnabled(true); })
      .catch(() => { /* An unconfigured/offline welcome must not break the site. */ });
    return () => controller.abort();
  }, [eligible, completed]);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    nameInput.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      if (restoreFocus.current?.isConnected) restoreFocus.current.focus({ preventScroll: true });
    };
  }, [open]);

  function dismiss() {
    dismissed.current = true;
    try { sessionStorage.setItem(dismissedKey, "true"); } catch { /* Keep this visit optional even when browser storage is blocked. */ }
    setCompleted(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    if (!name.trim() || !reason.trim()) { setError("Please add your name and a reason for visiting."); return; }
    locked.current = true;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    submissionId.current ??= crypto.randomUUID();
    let referrer: string | null = null;
    try {
      const previous = new URL(document.referrer);
      // Send only the source origin, never a referring URL's path or query.
      if (previous.origin !== location.origin) referrer = previous.origin;
    } catch { /* Direct visits and privacy-protected browsers have no referrer. */ }
    try {
      const response = await fetch("/api/visitor-welcome", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submissionId.current, name, reason, page: pathname, referrer, website: form.get("website") || "" }),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (dismissed.current) return;
      if (!response.ok || result.ok !== true) {
        setError(typeof result.error === "string" ? result.error : "We couldn’t send your introduction. Please try again.");
        return;
      }
      try { localStorage.setItem(storageKey, String(Date.now())); } catch { /* In-memory completion still works when storage is unavailable. */ }
      setCompleted(true);
      toast({ title: `Welcome, ${name.trim()}!`, description: "Let’s find something lovely for your celebration." });
    } catch { if (!dismissed.current) setError("We couldn’t send your introduction. Your answers are saved in this form—please try again."); }
    finally { locked.current = false; setBusy(false); }
  }

  if (!open) return null;
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="visitor-welcome-heading" aria-describedby="visitor-welcome-description" onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className={styles.topline}><span className={styles.wordmark}><BrandMark /><span>invitly<span className={styles.dot}>.</span></span></span><button type="button" className={styles.close} onClick={dismiss} aria-label="Close welcome form"><X size={22} aria-hidden="true" /></button></div>
    <span className={styles.eyebrow}>A LITTLE HELLO</span>
    <h2 id="visitor-welcome-heading">Welcome to <em>Invitly.</em></h2>
    <p id="visitor-welcome-description" className={styles.intro}>Tell us a little about yourself, if you’d like. This is optional—you can close this form and explore.</p>
    <form className={styles.form} onSubmit={submit} aria-busy={busy}>
      <label htmlFor="visitor-name">Your name<input ref={nameInput} id="visitor-name" name="name" autoComplete="given-name" placeholder="What should we call you?" required maxLength={80} value={name} onChange={event => setName(event.target.value)} readOnly={busy} /></label>
      <label htmlFor="visitor-reason">What brings you to Invitly?<textarea id="visitor-reason" name="reason" placeholder="I’m looking for an invitation for…" required maxLength={500} rows={3} value={reason} onChange={event => setReason(event.target.value)} readOnly={busy} /></label>
      <div className={styles.honeypot} aria-hidden="true"><label htmlFor="visitor-website">Leave this empty<input id="visitor-website" name="website" autoComplete="off" tabIndex={-1} /></label></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button type="button" className={styles.cancel} onClick={dismiss}>Cancel</button><button className={`button ${styles.submit}`} type="submit" disabled={busy}>{busy ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Sending your hello…</> : <>Send introduction <ArrowRight size={17} aria-hidden="true" /></>}</button></div>
    </form>
  </dialog>;
}
