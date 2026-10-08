"use client";

import { useEffect, useState } from "react";
import { InvitationContent } from "@/components/invitation-content";
import { getDesign } from "@/data/occasions";
import { validateInvitationDraft, type InvitationDraft } from "@/lib/invitation-draft";
import type { EventPhoto } from "@/types/media";

export function DraftPreview() {
  const [preview, setPreview] = useState<{ draft: InvitationDraft; photos: EventPhoto[]; timestamp: number } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type === "invitly-preview-replay") { document.dispatchEvent(new Event("invitly:replay-opening")); return; }
      if (event.data?.type !== "invitly-preview") return;
      const checked = validateInvitationDraft(event.data.draft, "draft");
      if (!checked.data) { setError(checked.error); return; }
      const photos = (Array.isArray(event.data.photos) ? event.data.photos : []).filter((photo: EventPhoto) => photo && typeof photo.url === "string" && /^\/dashboard\/events\/[0-9a-f-]{36}\/media\/[0-9a-f-]{36}$/.test(photo.url) && typeof photo.alt === "string" && Number.isFinite(photo.width) && Number.isFinite(photo.height)).slice(0, 12);
      setPreview({ draft: checked.data, photos, timestamp: Date.now() }); setError("");
    }
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") window.parent.postMessage({type:"invitly-preview-close"},window.location.origin); };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.getAttribute("href")?.startsWith("#")) return;
      // Keep the preview inside its frame, but let hosts check external venue
      // and song links that already open a separate, protected browser tab.
      try {
        const target = new URL(link.href);
        if (target.protocol === "https:" && !target.username && !target.password && target.origin !== window.location.origin && link.target === "_blank" && link.relList.contains("noopener")) return;
      } catch { /* An invalid destination stays inside the preview. */ }
      event.preventDefault();
    };
    window.addEventListener("keydown", keydown); document.addEventListener("click", navigate);
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "invitly-preview-ready" }, window.location.origin);
    return () => { window.removeEventListener("message", receive); window.removeEventListener("keydown", keydown); document.removeEventListener("click", navigate); };
  }, []);
  if (!preview) return <main id="main" className="preview-waiting"><p>{error || "Your invitation preview appears here as you create it."}</p></main>;
  const { draft, photos, timestamp } = preview;
  const previewIdentity = `${draft.themeId}:${draft.invitation.occasion || "wedding"}:${draft.invitation.tradition || "neutral"}:${getDesign(draft.invitation).opening?.style || "theme"}:${draft.invitation.festival?.preset || ""}`;
  return <div className="embedded-preview">{error && <p role="alert" className="private-preview-notice">Preview paused: {error}</p>}<InvitationContent key={previewIdentity} invitation={{ ...draft.invitation, functions: draft.invitation.functions.filter(item => item.visibility !== "hidden") }} theme={draft.themeId} musicEnabled={draft.musicEnabled} photos={photos} mode="preview" renderTimestamp={timestamp} previewBackHref="/customize" /></div>;
}
