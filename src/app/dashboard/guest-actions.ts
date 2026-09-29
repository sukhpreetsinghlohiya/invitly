"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isUuid, requireHostEvent } from "@/lib/host-event";
import { parseGuestCsv, validateGuest, type GuestInput } from "@/lib/guest-validation";

type Result = { error?: string; success?: string; links?: { name: string; path: string }[] };
const refresh = (eventId: string) => revalidatePath(`/dashboard/events/${eventId}/guests`);
const newToken = () => { const token = randomBytes(32).toString("hex"); return { token, hash: createHash("sha256").update(token).digest("hex") }; };
const failure = (error: unknown): Result => ({ error: error instanceof Error ? error.message : "The guest service is unavailable. Please try again." });

export async function saveGuest(eventId: string, input: GuestInput): Promise<Result> {
  try {
    const { client } = await requireHostEvent(eventId);
    const invalid = validateGuest(input); if (invalid) return { error: invalid };
    if (input.id !== undefined && !isUuid(input.id)) return { error: "Choose a valid guest." };
    if (input.groupId) {
      const { data } = await client.from("guest_groups").select("id").eq("id", input.groupId).eq("event_id", eventId).maybeSingle();
      if (!data) return { error: "Choose a group from this invitation." };
    }
    const values = { event_id: eventId, name: input.name.trim(), email: input.email.trim().toLowerCase(), phone: input.phone.trim(), group_id: input.groupId, max_party_size: input.maxPartySize };
    if (input.id) {
      const { data, error } = await client.from("guests").update(values).eq("id", input.id).eq("event_id", eventId).select("id").maybeSingle();
      if (error || !data) return { error: "We couldn’t update this guest. Refresh and try again." };
      refresh(eventId); return { success: "Guest updated. Their existing private link still works." };
    }
    const { token, hash } = newToken();
    const { error } = await client.from("guests").insert({ ...values, token_hash: hash });
    if (error) return { error: "We couldn’t add this guest. Check your database migrations and try again." };
    refresh(eventId); return { success: "Guest added. Copy their private link now; only its hash is stored.", links: [{ name: values.name, path: `/g/${token}` }] };
  } catch (error) { return failure(error); }
}

export async function rotateGuestLink(eventId: string, guestId: string): Promise<Result> {
  try {
    const { client } = await requireHostEvent(eventId);
    if (!isUuid(guestId)) return { error: "Choose a valid guest." };
    const { token, hash } = newToken();
    const { data, error } = await client.from("guests").update({ token_hash: hash }).eq("id", guestId).eq("event_id", eventId).select("name").maybeSingle();
    if (error || !data) return { error: "We couldn’t replace this guest link." };
    refresh(eventId); return { success: "A new private link is ready. The old link no longer works.", links: [{ name: data.name, path: `/g/${token}` }] };
  } catch (error) { return failure(error); }
}

export async function deleteGuest(eventId: string, guestId: string): Promise<Result> {
  try {
    const { client } = await requireHostEvent(eventId);
    if (!isUuid(guestId)) return { error: "Choose a valid guest." };
    const { data, error } = await client.from("guests").delete().eq("id", guestId).eq("event_id", eventId).select("id").maybeSingle();
    if (error || !data) return { error: "We couldn’t remove this guest." };
    refresh(eventId); return { success: "Guest removed and their link revoked." };
  } catch (error) { return failure(error); }
}

export async function saveGuestGroup(eventId: string, input: { id?: string; name: string; functionIds: string[] | null }): Promise<Result> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    if (!input || typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 80) return { error: "Use a group name between 1 and 80 characters." };
    if (input.id !== undefined && !isUuid(input.id)) return { error: "Choose a valid group." };
    if (input.functionIds !== null) {
      if (!Array.isArray(input.functionIds) || input.functionIds.length > 100 || !input.functionIds.every(id => typeof id === "string" && id.length <= 80)) return { error: "Choose valid functions for this group." };
      const content = event.invitation_content as { functions?: { id: string }[] } | null;
      const { data: segments } = await client.from("event_segments").select("id").eq("event_id", eventId);
      const allowed = new Set(content?.functions?.map(item => item.id) || segments?.map(item => item.id) || []);
      if (input.functionIds.some(id => !allowed.has(id))) return { error: "Select functions that belong to this invitation." };
    }
    const values = { event_id: eventId, name: input.name.trim(), function_ids: input.functionIds === null ? null : [...new Set(input.functionIds)] };
    const query = input.id ? client.from("guest_groups").update(values).eq("id", input.id).eq("event_id", eventId) : client.from("guest_groups").insert(values);
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data) return { error: error?.code === "23505" ? "A group with that name already exists." : "We couldn’t save this group." };
    refresh(eventId); return { success: "Guest group saved. Its private links now show the selected functions." };
  } catch (error) { return failure(error); }
}

export async function importGuests(eventId: string, csv: string): Promise<Result> {
  try {
    const { client } = await requireHostEvent(eventId);
    const parsed = parseGuestCsv(csv); if (!parsed.rows) return { error: parsed.error };
    const { data: groups, error: groupError } = await client.from("guest_groups").select("id,name").eq("event_id", eventId);
    if (groupError) return { error: "We couldn’t load guest groups. Please try again." };
    const byName = new Map(groups?.map(group => [group.name.toLowerCase(), group.id]));
    for (const [index, row] of parsed.rows.entries()) if (row.group && !byName.has(row.group.toLowerCase())) return { error: `Row ${index + 2}: create the “${row.group}” group first, or leave its group column blank.` };
    const links: { name: string; path: string }[] = [];
    const rows = parsed.rows.map(row => { const { token, hash } = newToken(); links.push({ name: row.name, path: `/g/${token}` }); return { event_id: eventId, name: row.name, email: row.email, phone: row.phone, group_id: byName.get(row.group.toLowerCase()) || null, max_party_size: row.maxPartySize, token_hash: hash }; });
    const { error } = await client.from("guests").insert(rows);
    if (error) return { error: "The import failed. No guests were added. Check your database setup and retry." };
    refresh(eventId); return { success: `${rows.length} guests imported. Download their new private links before leaving this page.`, links };
  } catch (error) { return failure(error); }
}

export async function setPublicFunctionVisibility(eventId: string, functionIds: string[] | null): Promise<Result> {
  try {
    const { client, event } = await requireHostEvent(eventId);
    if (functionIds !== null) {
      if (!Array.isArray(functionIds) || functionIds.length > 100 || !functionIds.every(id => typeof id === "string" && id.length <= 80)) return { error: "Choose valid public functions." };
      const content = event.invitation_content as { functions?: { id: string }[] } | null;
      const { data: segments } = await client.from("event_segments").select("id").eq("event_id", eventId);
      const allowed = new Set(content?.functions?.map(item => item.id) || segments?.map(item => item.id) || []);
      if (functionIds.some(id => !allowed.has(id))) return { error: "Choose functions that belong to this invitation." };
    }
    const { data, error } = await client.from("events").update({ public_function_ids: functionIds === null ? null : [...new Set(functionIds)] }).eq("id", eventId).eq("owner_id", event.owner_id).select("id").maybeSingle();
    if (error || !data) return { error: "We couldn’t save public visibility. Refresh and try again." };
    refresh(eventId); revalidatePath(`/i/${event.slug}`); revalidatePath(`/invite/${event.slug}`);
    return { success: functionIds === null ? "The public invitation shows every function. Private group links do not hide functions that are public." : functionIds.length ? `The public invitation now shows ${functionIds.length} selected functions. Other functions are available only through groups that include them.` : "The public invitation now hides the function schedule. Private group links still show their assigned functions." };
  } catch (error) { return failure(error); }
}
