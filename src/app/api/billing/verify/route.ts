import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { getRazorpayConfig, verifyCheckoutSignature } from "@/lib/razorpay";
import { PACKS, type PackId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

async function fetchOrderNotes(keyId: string, keySecret: string, orderId: string) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null) as { notes?: Record<string, string>; amount?: number } | null;
  return data;
}

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

  // Re-fetch the order from Razorpay — the signature only proves the trio was
  // signed by our secret, not that the notes we trusted at checkout time are
  // still correct. Notes are set server-side at order creation, so this is
  // authoritative for the credit count and target user.
  const order = await fetchOrderNotes(razorpay.keyId, razorpay.keySecret, orderId);
  if (!order?.notes?.userId || !order.notes.packId) return reply({ error: "This order can’t be matched." }, 400);
  if (order.notes.userId !== user.id) return reply({ error: "This order does not belong to your account." }, 403);
  const packId = order.notes.packId as PackId;
  const pack = PACKS[packId];
  if (!pack) return reply({ error: "Unknown credit pack." }, 400);

  const admin = createAdminClient();

  // Idempotency: insert the ledger row first with the Razorpay payment id as
  // a unique key. If a webhook already recorded this payment, this insert
  // returns a conflict and we skip the balance update.
  const { error: ledgerError } = await admin.from("credit_transactions").insert({
    user_id: user.id,
    delta: pack.credits,
    reason: "purchase",
    razorpay_payment_id: paymentId,
    pack_id: packId,
    note: pack.name,
  });
  if (ledgerError && ledgerError.code === "23505") {
    return reply({ ok: true, already: true, credits: pack.credits });
  }
  if (ledgerError) {
    console.error("billing.verify.ledger_failed", ledgerError);
    return reply({ error: "We received your payment but couldn’t add credits. We’ll fix it shortly." }, 500);
  }

  // Credit the balance. Users without a row (edge case) get seeded here.
  const { data: existing } = await admin.from("user_credits").select("balance, lifetime_purchased").eq("user_id", user.id).maybeSingle();
  const nextBalance = (existing?.balance ?? 0) + pack.credits;
  const nextLifetime = (existing?.lifetime_purchased ?? 0) + pack.credits;
  const { error: upsertError } = await admin.from("user_credits").upsert({
    user_id: user.id,
    balance: nextBalance,
    lifetime_purchased: nextLifetime,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (upsertError) {
    console.error("billing.verify.upsert_failed", upsertError);
    return reply({ error: "Credits couldn’t be added. Our team will fix this quickly." }, 500);
  }

  return reply({ ok: true, credits: pack.credits, balance: nextBalance });
}
