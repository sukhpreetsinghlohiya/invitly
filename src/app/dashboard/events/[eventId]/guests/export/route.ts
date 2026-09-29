import { NextResponse } from "next/server";
import { requireHostEvent } from "@/lib/host-event";
import { guestCsv } from "@/lib/guest-validation";
import { getHostGuestData } from "@/lib/host-guests";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const { client, event } = await requireHostEvent(eventId);
    const { guests, groups, responses } = await getHostGuestData(client, eventId);
    const responseByGuest = new Map(responses.map(response => [response.guest_id, response]));
    const groupById = new Map(groups.map(group => [group.id, group.name]));
    const csv = guestCsv(["name", "email", "phone", "group", "max_party_size", "status", "party_size", "note", "updated_at"], guests.map(guest => {
      const response = responseByGuest.get(guest.id);
      return [guest.name, guest.email, guest.phone, guest.group_id ? groupById.get(guest.group_id) || "" : "", guest.max_party_size, response?.status || "awaiting", response?.party_size ?? "", response?.note || "", response?.updated_at || ""];
    }));
    return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${event.slug}-guests.csv"`, "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Sign in as the invitation owner to export guests." }, { status: 403, headers: { "Cache-Control": "private, no-store" } }); }
}
