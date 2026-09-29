import { ImageResponse } from "next/og";
import { getPublicInvitation } from "@/lib/public-invitation";
import { themes } from "@/data/themes";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await getPublicInvitation((await params).slug);
  if (!event) return new Response("Invitation unavailable", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const accent = themes.find(theme => theme.id === event.themeId)?.accent || "#58252f";
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#faf6ed", padding: 40 }}><div style={{ display: "flex", width: "100%", height: "100%", border: `2px solid ${accent}`, borderRadius: "180px 180px 8px 8px", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 50, color: accent }}><div style={{ display: "flex", fontSize: 24, letterSpacing: 5 }}>YOU’RE INVITED</div><div style={{ display: "flex", textAlign: "center", fontSize: event.title.length > 50 ? 48 : 68, marginTop: 28, marginBottom: 28 }}>{event.title}</div><div style={{ display: "flex", fontSize: 25 }}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: event.invitation.timezone }).format(new Date(event.invitation.weddingAt))}</div><div style={{ display: "flex", marginTop: 34, fontSize: 24 }}>invitly.</div></div></div>, { width: 1200, height: 630, headers: { "Cache-Control": "private, no-store" } });
}
