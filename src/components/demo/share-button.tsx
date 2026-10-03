"use client";

import { useRef, useState } from "react";

import { BusyIndicator, toast } from "@/components/ui/feedback";

export function ShareButton({ text = "A little preview of a big celebration on Invitly." }: { text?: string }) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const fallback = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  async function share() {
    if (running.current) return;
    running.current = true; setPending(true);
    const url = window.location.href;
    setFeedback("");
    setFallbackUrl("");
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text, url });
        setFeedback("Invitation shared."); toast({ title: "Shared successfully." });
      } else {
        await navigator.clipboard.writeText(url);
        setFeedback("Invitation link copied."); toast({ title: "Link copied.", description: "Ready to share with your guests." });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setFallbackUrl(url);
      setFeedback("Select and copy the invitation link below.");
      requestAnimationFrame(() => { fallback.current?.focus(); fallback.current?.select(); });
    } finally { running.current = false; setPending(false); }
  }
  return <div className="share-control">
    <button className="button button-secondary" type="button" onClick={share} disabled={pending} aria-busy={pending}>{pending && <BusyIndicator />}{pending ? "Opening share…" : "Share invitation"} <span aria-hidden="true">↗</span></button>
    <p role="status" className="form-feedback">{feedback}</p>
    {fallbackUrl && <div className="form-field"><label htmlFor="share-invitation-link">Invitation link</label><input ref={fallback} id="share-invitation-link" readOnly value={fallbackUrl} onFocus={(event) => event.currentTarget.select()} /></div>}
  </div>;
}
