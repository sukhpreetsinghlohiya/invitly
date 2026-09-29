import { getGuestInvitation } from "@/lib/public-invitation";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
  try {
    const guest = await getGuestInvitation((await params).token);
    return guest ? Response.json({ updates: guest.invitation.announcements, checkedAt: new Date().toISOString() }, { headers }) : Response.json({ unavailable: true }, { status: 404, headers });
  } catch { return Response.json({ error: "Updates could not be checked. Please try again." }, { status: 503, headers }); }
}
