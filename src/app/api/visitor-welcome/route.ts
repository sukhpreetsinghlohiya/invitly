import { validateVisitorIntroduction } from "@/lib/visitor-welcome";
import { allowVisitorAttempt, deliverVisitorIntroduction, getVisitorWebhookConfig } from "@/lib/visitor-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export function GET() {
  return reply({ enabled: Boolean(getVisitorWebhookConfig()) });
}

async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.body || Number(request.headers.get("content-length")) > 4096) throw new Error("size");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new Error("size"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isSameOrigin(request: Request) {
  const source = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!source || (fetchSite && fetchSite !== "same-origin")) return false;
  try {
    const origin = new URL(source);
    const target = new URL(request.url);
    if (origin.origin !== source || !["http:", "https:"].includes(origin.protocol)) return false;
    // Next can use an internal hostname in request.url. Host preserves the
    // browser-facing authority, including the port; browsers cannot forge it.
    const host = request.headers.get("host") || target.host;
    return origin.host === host && (origin.protocol === target.protocol || fetchSite === "same-origin");
  } catch { return false; }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply({ error: "Please send this from the Invitly website." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply({ error: "Please use the welcome form." }, 415);
  if (!getVisitorWebhookConfig()) return reply({ error: "Our welcome form is unavailable right now. You can keep exploring." }, 503);
  // Vercel overwrites its own forwarding header. Do not trust arbitrary
  // x-forwarded-for input when running outside Vercel.
  const address = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
  if (!allowVisitorAttempt(address)) return Response.json({ error: "Please wait a few minutes before trying again." }, { status: 429, headers: { ...headers, "Retry-After": "600" } });
  let raw: unknown;
  try { raw = await readSmallJson(request); } catch { return reply({ error: "Please keep your introduction short and try again." }, 400); }
  // A hidden field catches simple form-filling bots without bothering people.
  if (raw && typeof raw === "object" && "website" in raw && (raw as { website?: unknown }).website) return reply({ ok: true });
  const input = validateVisitorIntroduction(raw);
  if (!input) return reply({ error: "Add your name and tell us what brings you to Invitly." }, 400);
  const result = await deliverVisitorIntroduction(input);
  if (!result.ok) return reply({ error: "Your introduction couldn’t be sent. Your answers are still here—please try again." }, result.status);
  return reply({ ok: true });
}
