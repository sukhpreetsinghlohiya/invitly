import { getGuestInvitation } from "@/lib/public-invitation";
import { invitationCalendar } from "@/lib/calendar";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guest = await getGuestInvitation((await params).token);
  if (!guest) return new Response("Invitation unavailable", { status: 404, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  const event = guest.invitation;
  return new Response(invitationCalendar(event.invitation, event.id), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${event.slug}.ics"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
}
