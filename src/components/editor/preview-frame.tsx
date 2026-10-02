"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { InvitationDraft } from "@/lib/invitation-draft";
import type { EventPhoto } from "@/types/media";

export function PreviewFrame({ draft, photos }: { draft: InvitationDraft; photos: EventPhoto[] }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(360);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(entries => setAvailableWidth(entries[0].contentRect.width));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const width = device === "phone" ? 360 : 1280;
  const scale = Math.min(1, availableWidth / width);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "invitly-preview", draft, photos, timestamp: Date.now() }, window.location.origin);
  }, [draft, photos]);
  useEffect(() => {
    const timer = setTimeout(send, 200);
    const ready = (event: MessageEvent) => { if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "invitly-preview-ready") send(); };
    window.addEventListener("message", ready);
    return () => { clearTimeout(timer); window.removeEventListener("message", ready); };
  }, [send]);
  return <><div className="preview-device-controls" role="group" aria-label="Preview screen size"><button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}><Smartphone size={15} /> Phone · 360px</button><button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={15} /> Desktop · 1280px</button></div><div ref={viewport} className={`preview-frame-viewport preview-frame-${device}`} style={{ height: Math.round(780 * scale) }}><iframe ref={frame} title="Actual guest invitation preview" src="/preview" onLoad={send} className="guest-preview-frame" style={{ width, height: 780, transform: `scale(${scale})` }} /></div><p className="editor-preview-hint">Your actual guest page, with your current unsaved changes.</p></>;
}
