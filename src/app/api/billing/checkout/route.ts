import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";
import { PLANS, type PlanId } from "@/lib/billing";

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
  if (authError || !user) return reply({ error: "Please sign in to upgrade." }, 401);

  let body: { planId?: unknown };
  try { body = await request.json(); } catch { return reply({ error: "Please try again." }, 400); }
  const planId = typeof body.planId === "string" ? (body.planId as PlanId) : null;
  if (!planId || !(planId in PLANS) || planId === "free") return reply({ error: "Choose a plan to upgrade." }, 400);
  const plan = PLANS[planId];

  const order = await createRazorpayOrder(razorpay, {
    amountPaise: plan.amountPaise,
    currency: "INR",
    receipt: `inv_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: { userId: user.id, planId },
  }).catch((error) => {
    console.error("razorpay.order.failed", error);
    return null;
  });
  if (!order) return reply({ error: "We couldn’t start checkout. Please try again." }, 502);

  const admin = createAdminClient();
  await admin.from("user_plans").upsert({
    user_id: user.id,
    plan: planId,
    status: "inactive",
    razorpay_order_id: order.id,
    amount_paise: plan.amountPaise,
    currency: order.currency,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return reply({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpay.keyId,
    planName: plan.name,
    userEmail: user.email ?? "",
  });
}
