import { ImageResponse } from "next/og";
export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", background: "#f7f1e7", color: "#683844", padding: "58px", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", flexDirection: "column", width: "65%" }}><div style={{ fontSize: 34, letterSpacing: -1 }}>invitly.</div><div style={{ display: "flex", flexDirection: "column", marginTop: 55, fontSize: 64, lineHeight: 1.08 }}><span>Your kind of</span><span>togetherness.</span></div><div style={{ marginTop: 25, fontSize: 23, color: "#766454" }}>Wedding & engagement invitations</div></div>
    <div style={{ display: "flex", width: 295, height: 450, padding: 14, background: "#683844", transform: "rotate(6deg)" }}><div style={{ border: "1px solid #cfb475", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#f5e8c8" }}><div style={{ fontSize: 16, letterSpacing: 3 }}>TOGETHER</div><div style={{ fontSize: 87, margin: "35px 0" }}>&</div><div style={{ fontSize: 16, letterSpacing: 3 }}>ALWAYS</div></div></div>
  </div>, { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400" } });
}
