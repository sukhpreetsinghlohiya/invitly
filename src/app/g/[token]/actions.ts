"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { isGuestToken } from "@/lib/guest-validation";

export type GuestRsvpState = { error?: string; success?: string };
export async function respondToInvitation(token: string, _state: GuestRsvpState, formData: FormData): Promise<GuestRsvpState> {
  if (!isGuestToken(token)) return { error: "This invitation link is unavailable." };
  const status = String(formData.get("status") || "");
  const party = String(formData.get("partySize") || "");
  const partySize = status === "declined" ? 0 : /^\d+$/.test(party) ? Number(party) : NaN;
  const note = String(formData.get("note") || "").trim();
  if (!["attending", "maybe", "declined"].includes(status) || !Number.isInteger(partySize) || partySize < 0 || partySize > 20 || note.length > 1000) return { error: "Check your attendance, party size, and note." };
  try {
    const { data, error } = await createPublicClient().rpc("submit_guest_response", { p_token: token, p_status: status, p_party_size: partySize, p_note: note });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return { error: "We couldn’t save your response. Please try again." };
    if (typeof data.error === "string") return { error: data.error };
    if (data.ok !== true) return { error: "We couldn’t save your response. Please try again." };
    return { success: "Your RSVP has been sent to the hosts. You can update it here whenever your plans change." };
  } catch { return { error: "We couldn’t reach the invitation service. Please try again." }; }
}
