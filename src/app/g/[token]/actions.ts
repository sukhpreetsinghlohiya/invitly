"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { isGuestToken } from "@/lib/guest-validation";

export type GuestRsvpState = { error?: string; success?: string };
const responseErrors = new Set([
  "This invitation link is unavailable.",
  "Check your attendance, party size, and note.",
  "Please wait 10 seconds before updating your response.",
]);
export async function respondToInvitation(token: string, _state: GuestRsvpState, formData: FormData): Promise<GuestRsvpState> {
  if (!isGuestToken(token)) return { error: "This invitation link is unavailable." };
  if (!(formData instanceof FormData)) return { error: "Check your attendance, party size, and note." };
  const status = String(formData.get("status") || "");
  const party = String(formData.get("partySize") || "");
  const partySize = status === "declined" ? 0 : /^\d+$/.test(party) ? Number(party) : NaN;
  const note = String(formData.get("note") || "").trim();
  if (!["attending", "maybe", "declined"].includes(status) || !Number.isInteger(partySize) || partySize < (status === "declined" ? 0 : 1) || partySize > 20 || note.length > 1000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(note)) return { error: "Check your attendance, party size, and note." };
  try {
    const { data, error } = await createPublicClient().rpc("submit_guest_response", { p_token: token, p_status: status, p_party_size: partySize, p_note: note });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return { error: "We couldn’t save your response. Please try again." };
    if (typeof data.error === "string") return { error: responseErrors.has(data.error) ? data.error : "We couldn’t save your response. Please try again." };
    if (data.ok !== true) return { error: "We couldn’t save your response. Please try again." };
    return { success: "Your RSVP has been sent to the hosts. You can update it here whenever your plans change." };
  } catch { return { error: "We couldn’t reach the invitation service. Please try again." }; }
}
