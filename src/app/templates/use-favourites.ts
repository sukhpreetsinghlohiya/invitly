"use client";

import { useSyncExternalStore } from "react";

const key = "invitly:template-favourites:v1";
const changed = "invitly:favourites-changed";
let sessionFallback: string | null = null;
const serverSnapshot = () => "[]";
function snapshot() {
  if (sessionFallback !== null) return sessionFallback;
  try { return localStorage.getItem(key) || "[]"; } catch { return "[]"; }
}
function subscribe(notify: () => void) {
  const sync = (event: StorageEvent) => { if (event.key === key || event.key === null) { sessionFallback = null; notify(); } };
  window.addEventListener("storage", sync);
  window.addEventListener(changed, notify);
  return () => { window.removeEventListener("storage", sync); window.removeEventListener(changed, notify); };
}
function parse(value: string): string[] {
  try {
    const data: unknown = JSON.parse(value);
    return Array.isArray(data) ? [...new Set(data.filter((item): item is string => typeof item === "string" && /^[a-z-]+:[a-z-]+$/.test(item)))].slice(0, 100) : [];
  } catch { return []; }
}

export function useFavourites() {
  const saved = parse(useSyncExternalStore(subscribe, snapshot, serverSnapshot));
  function toggle(id: string) {
    const current = parse(snapshot());
    const next = JSON.stringify(current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    let persistent = true;
    try { localStorage.setItem(key, next); sessionFallback = null; } catch { sessionFallback = next; persistent = false; }
    window.dispatchEvent(new Event(changed));
    return persistent;
  }
  return { saved, toggle };
}
