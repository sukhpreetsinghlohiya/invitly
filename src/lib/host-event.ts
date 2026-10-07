import "server-only";
import { createClient } from "@/lib/supabase/server";

export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const hostErrors = new Set([
  "Choose a valid invitation.",
  "Sign in again to manage your invitation.",
  "This invitation is unavailable. You can only manage invitations you own.",
]);

/** Network, Storage and database exceptions can include internal details. */
export function hostActionError(error: unknown, fallback: string): string {
  return error instanceof Error && hostErrors.has(error.message) ? error.message : fallback;
}

/** Call inside every host mutation, even when the calling page is protected. */
export async function requireHostEvent(eventId: string) {
  if (!isUuid(eventId)) throw new Error("Choose a valid invitation.");
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (!user || authError) throw new Error("Sign in again to manage your invitation.");
  const { data: event, error } = await client.from("events").select("*").eq("id", eventId).eq("owner_id", user.id).maybeSingle();
  if (error || !event) throw new Error("This invitation is unavailable. You can only manage invitations you own.");
  return { client, user, event };
}
