import { getPublicInvitation } from "@/lib/public-invitation";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    const event = await getPublicInvitation((await params).slug);
    return event ? Response.json({ updates: event.announcements, checkedAt: new Date().toISOString() }, { headers }) : Response.json({ unavailable: true }, { status: 404, headers });
  } catch { return Response.json({ error: "Updates could not be checked. Please try again." }, { status: 503, headers }); }
}
