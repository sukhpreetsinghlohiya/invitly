"use client";

import { useState } from "react";

export function ShareButton({ text = "A little preview of a big celebration on Invitly." }: { text?: string }) {
  const [feedback, setFeedback] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  async function share() {
    const url = window.location.href;
    setFeedback("");
    setFallbackUrl("");
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text, url });
        setFeedback("Invitation shared.");
      } else {
        await navigator.clipboard.writeText(url);
        setFeedback("Invitation link copied.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setFallbackUrl(url);
      setFeedback("Select and copy the invitation link below.");
    }
  }
  return <div className="share-control">
    <button className="button button-secondary" type="button" onClick={share}>Share invitation <span aria-hidden="true">↗</span></button>
    <p role="status" className="form-feedback">{feedback}</p>
    {fallbackUrl && <div className="form-field"><label htmlFor="share-invitation-link">Invitation link</label><input id="share-invitation-link" readOnly value={fallbackUrl} onFocus={(event) => event.currentTarget.select()} /></div>}
  </div>;
}
