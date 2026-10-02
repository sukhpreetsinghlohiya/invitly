"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import "./help-tooltip.css";

export function HelpTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const container = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) { setOpen(false); setPinned(false); }
    }
    function dismissWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); setPinned(false); }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismissWithKeyboard);
    };
  }, [open]);
  return <span className="how-help" ref={container}
    onPointerEnter={event => { if (event.pointerType === "mouse") setOpen(true); }}
    onPointerLeave={() => { if (!pinned && !container.current?.contains(document.activeElement)) setOpen(false); }}>
    <button type="button" aria-label={label} aria-expanded={open} aria-controls={id} aria-describedby={open ? id : undefined}
      onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setPinned(false); }}
      onClick={() => { setOpen(!pinned); setPinned(!pinned); }}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); setPinned(false); } }}>
      <Info size={17} aria-hidden="true" />
    </button>
    <span className="how-tooltip" id={id} role="tooltip" hidden={!open}>{children}</span>
  </span>;
}
