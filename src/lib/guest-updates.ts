import type { LiveAnnouncement } from "@/types/announcements";

type UpdateResult = { unavailable: true } | { unavailable: false; updates: LiveAnnouncement[]; checkedAt: string };
const validDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

/** A stalled request must release the poller so later host updates can arrive. */
export async function readGuestUpdates(endpoint: string, lifetime: AbortSignal): Promise<UpdateResult> {
  const request = new AbortController();
  const abort = () => request.abort();
  lifetime.addEventListener("abort", abort, { once: true });
  if (lifetime.aborted) abort();
  const deadline = setTimeout(abort, 10_000);
  try {
    const response = await fetch(endpoint, { cache: "no-store", signal: request.signal, credentials: "omit" });
    if (response.status === 404 || response.status === 410) return { unavailable: true };
    if (!response.ok) throw new Error("Updates unavailable");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("updates" in body) || !("checkedAt" in body) || !validDate(body.checkedAt) || !Array.isArray(body.updates)) throw new Error("Invalid updates");
    const updates = body.updates;
    if (updates.some((item: unknown) => !item || typeof item !== "object" || !("id" in item) || typeof item.id !== "string" || !("message" in item) || typeof item.message !== "string" || !("pinned" in item) || typeof item.pinned !== "boolean" || !("created_at" in item) || !validDate(item.created_at) || !("updated_at" in item) || !validDate(item.updated_at))) throw new Error("Invalid updates");
    return { unavailable: false, updates, checkedAt: body.checkedAt };
  } finally {
    clearTimeout(deadline);
    lifetime.removeEventListener("abort", abort);
  }
}
