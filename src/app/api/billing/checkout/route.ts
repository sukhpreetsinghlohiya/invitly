import { createClient } from "@/lib/supabase/server";
import { getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";
import { PACKS, type PackId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

function isSameOrigin(request: Request) {
  const source = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!source || (fetchSite && fetchSite !== "same-origin")) return false;
  try {
    const origin = new URL(source);
    const target = new URL(request.url);
    const host = request.headers.get("host") || target.host;
    return origin.host === host;
  } catch { return false; }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply({ error: "Please send this from the Invitly website." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return reply({ error: "Please use the upgrade button." }, 415);
  }
  const razorpay = getRazorpayConfig();
  if (!razorpay) return reply({ error: "Payments are not configured yet. Please try again shortly." }, 503);
  if (!getSupabaseServiceConfig()) return reply({ error: "Payments are not configured yet. Please try again shortly." }, 503);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return reply({ error: "Please sign in to add credits." }, 401);

  let body: { packId?: unknown };
  try { body = await request.json(); } catch { return reply({ error: "Please try again." }, 400); }
  const packId = typeof body.packId === "string" ? (body.packId as PackId) : null;
  if (!packId || !(packId in PACKS)) return reply({ error: "Choose a credit pack." }, 400);
  const pack = PACKS[packId];

  const order = await createRazorpayOrder(razorpay, {
    amountPaise: pack.amountPaise,
    currency: "INR",
    receipt: `cr_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: { userId: user.id, packId, credits: String(pack.credits) },
  }).catch((error) => {
    console.error("razorpay.order.failed", error);
    return null;
  });
  if (!order) return reply({ error: "We couldn’t start checkout. Please try again." }, 502);

  return reply({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpay.keyId,
    packName: pack.name,
    credits: pack.credits,
    userEmail: user.email ?? "",
  });
}
