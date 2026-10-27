import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { getRazorpayConfig, verifyCheckoutSignature } from "@/lib/razorpay";
import { PRO_DURATION_DAYS } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export async function POST(request: Request) {
  const razorpay = getRazorpayConfig();
  if (!razorpay || !getSupabaseServiceConfig()) return reply({ error: "Payments are not configured yet." }, 503);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return reply({ error: "Please sign in." }, 401);

  let body: { razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown };
  try { body = await request.json(); } catch { return reply({ error: "Please try again." }, 400); }
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature) return reply({ error: "Missing payment confirmation." }, 400);
  if (!verifyCheckoutSignature(razorpay, orderId, paymentId, signature)) return reply({ error: "Payment could not be verified." }, 400);

  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("user_plans")
    .select("user_id, plan, amount_paise")
    .eq("razorpay_order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!pending) return reply({ error: "This order does not belong to your account." }, 403);

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const { error: updateError } = await admin
    .from("user_plans")
    .update({
      status: "active",
      activated_at: activatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      razorpay_payment_id: paymentId,
      updated_at: activatedAt.toISOString(),
    })
    .eq("user_id", user.id)
    .eq("razorpay_order_id", orderId);
  if (updateError) {
    console.error("billing.verify.update_failed", updateError);
    return reply({ error: "We received your payment but couldn’t activate your plan. We’ll fix it shortly." }, 500);
  }

  return reply({ ok: true, plan: pending.plan, expiresAt: expiresAt.toISOString() });
}
