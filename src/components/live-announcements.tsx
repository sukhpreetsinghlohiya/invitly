"use client";

import { useEffect, useState } from "react";
import { getSupabaseConfig } from "@/lib/env";
import type { LiveAnnouncement } from "@/types/announcements";

export type LiveUpdatesConfig = { eventId: string; endpoint: string; initial: LiveAnnouncement[] };
export function LiveAnnouncements({ eventId, endpoint, initial, timezone }: LiveUpdatesConfig & { timezone: string }) {
  const [updates, setUpdates] = useState(initial);
  const [transport, setTransport] = useState<"connecting" | "realtime" | "polling">("connecting");
  const [checkedAt, setCheckedAt] = useState("");
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let stopped = false, inFlight = false;
    let removeRealtime: (() => void) | undefined;
    const controller = new AbortController();
    async function refresh(via: "realtime" | "polling") {
      if (stopped || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal, credentials: "omit" });
        if (stopped) return;
        if (response.status === 404 || response.status === 410) {
          setUpdates([]); setUnavailable(true); setError("");
          // Revalidate the entire invitation too: an unpublished event must not
          // remain displayed just because this browser opened it earlier.
          window.location.reload();
          return;
        }
        if (!response.ok) throw new Error("Unavailable");
        const body = await response.json() as { updates: LiveAnnouncement[]; checkedAt: string };
        if (!Array.isArray(body.updates)) throw new Error("Invalid response");
        setUpdates(body.updates); setCheckedAt(body.checkedAt); setTransport(via); setError("");
      } catch {
        if (!stopped) { setTransport("polling"); setError("We couldn’t check for new updates. Showing the last available notes; we’ll retry shortly."); }
      } finally { inFlight = false; }
    }
    const timer = window.setInterval(() => void refresh("polling"), 15000);
    const checkNow = () => void refresh("polling");
    window.addEventListener("online", checkNow);
    document.addEventListener("visibilitychange", checkNow);
    // Load the realtime client after the primary server-rendered invitation.
    const start = window.setTimeout(() => {
      void refresh("polling");
      const config = getSupabaseConfig();
      if (!config) { setTransport("polling"); return; }
      void import("@supabase/supabase-js").then(({ createClient }) => {
        if (stopped) return;
        const client = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
        const channel = client.channel(`invitation-updates:${eventId}`).on("postgres_changes", { event: "*", schema: "public", table: "event_updates", filter: `event_id=eq.${eventId}` }, () => void refresh("realtime")).subscribe(status => {
          if (stopped) return;
          setTransport(status === "SUBSCRIBED" ? "realtime" : "polling");
        });
        removeRealtime = () => { void client.removeChannel(channel); };
      }).catch(() => { if (!stopped) setTransport("polling"); });
    }, 0);
    return () => { stopped = true; controller.abort(); window.clearTimeout(start); window.clearInterval(timer); window.removeEventListener("online", checkNow); document.removeEventListener("visibilitychange", checkNow); removeRealtime?.(); };
  }, [eventId, endpoint]);

  return <div className="live-announcements" data-live-transport={transport}>
    <p className="live-update-status" role="status">{unavailable ? "This invitation is no longer available." : error || `${transport === "realtime" ? "Live updates connected." : transport === "connecting" ? "Connecting to guest updates…" : "Checking for updates every 15 seconds."}${checkedAt ? ` Last checked ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: timezone }).format(new Date(checkedAt))}.` : ""}`}</p>
    <div className="update-feed" aria-live="polite" aria-relevant="additions text">
      {updates.map(update => <article className="update-card" data-pinned={update.pinned ? "true" : "false"} key={update.id}><span className="update-dot" aria-hidden="true" /><div>{update.pinned && <span className="eyebrow">Pinned by your hosts</span>}<p className="update-time"><time dateTime={update.updated_at}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(update.updated_at))}</time></p><p>{update.message}</p></div></article>)}
      {!updates.length && !unavailable && <p className="demo-disclaimer">No announcements yet. Notes from your hosts will appear here.</p>}
    </div>
    <noscript><p>Refresh this invitation to see the latest announcements.</p></noscript>
  </div>;
}
