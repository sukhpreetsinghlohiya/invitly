import { getPublicInvitation } from "@/lib/public-invitation";
import { invitationCalendar } from "@/lib/calendar";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
  try {
    const event = await getPublicInvitation((await params).slug);
    if (!event) return new Response("Invitation unavailable", { status: 404, headers });
    // Select only from the already-authorized function projection, never the raw event.
    const selected = new URL(request.url).searchParams.get("function");
    const functions = selected ? event.invitation.functions.filter(item => item.id === selected) : event.invitation.functions;
    if (selected && !functions.length) return new Response("Event unavailable", { status: 404, headers });
    const invitation = { ...event.invitation, functions };
    return new Response(invitationCalendar(invitation, event.id), { headers: { ...headers, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${event.slug}.ics"` } });
  } catch {
    return new Response("The calendar is temporarily unavailable. Please try again shortly.", { status: 503, headers: { ...headers, "Retry-After": "30" } });
  }
}
