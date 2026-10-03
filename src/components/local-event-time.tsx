"use client";

import { useSyncExternalStore } from "react";
import { Clock3 } from "lucide-react";
import styles from "./local-event-time.module.css";

function browserTimezone() { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
function subscribeToTimezoneChange(callback: () => void) {
  window.addEventListener("focus", callback);
  return () => window.removeEventListener("focus", callback);
}
const serverTimezone = () => null;

function formatLocalTime(startsAt: string, hostTimezone: string, guestTimezone: string | null) {
  if (!guestTimezone || !Number.isFinite(Date.parse(startsAt))) return null;
  try {
    const host = new Intl.DateTimeFormat("en", { timeZone: hostTimezone }).resolvedOptions().timeZone;
    const guest = new Intl.DateTimeFormat("en", { timeZone: guestTimezone }).resolvedOptions().timeZone;
    if (host === guest) return null;
    const date = new Intl.DateTimeFormat("en-GB", { timeZone: guest, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" }).format(new Date(startsAt));
    return { date, timezone: guest.replaceAll("_", " ") };
  } catch { return null; }
}

export function LocalEventTime({ startsAt, hostTimezone }: { startsAt: string; hostTimezone: string }) {
  const guestTimezone = useSyncExternalStore(subscribeToTimezoneChange, browserTimezone, serverTimezone);
  const local = formatLocalTime(startsAt, hostTimezone, guestTimezone);
  if (!local) return null;
  return <span className={styles.localTime} data-local-event-time><Clock3 size={14} aria-hidden="true" /><span>Your time: <time dateTime={startsAt}>{local.date}</time><small>{local.timezone}</small></span></span>;
}
