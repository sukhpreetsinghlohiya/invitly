import { createAdminClient, getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { getRazorpayConfig, verifyWebhookSignature } from "@/lib/razorpay";
import { PACKS, type PackId } from "@/lib/billing";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

type RazorpayWebhook = {
  event: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number; notes?: Record<string, string> } } };
  created_at?: number;
};

export async function POST(request: Request) {
  const razorpay = getRazorpayConfig();
  const serviceConfig = getSupabaseServiceConfig();
  if (!razorpay?.webhookSecret || !serviceConfig) return reply({ error: "not configured" }, 503);

  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const raw = await request.text();
  if (!signature || !verifyWebhookSignature(razorpay.webhookSecret, raw, signature)) {
    return reply({ error: "invalid signature" }, 400);
  }

  let event: RazorpayWebhook;
  try { event = JSON.parse(raw) as RazorpayWebhook; } catch { return reply({ error: "bad json" }, 400); }
  const payment = event.payload?.payment?.entity;
  if (!payment?.id) return reply({ ok: true });

  const eventId = `${payment.id}:${event.event}`;
  const admin = createAdminClient();
  const { error: logError } = await admin.from("billing_events").insert({
    event_id: eventId,
    event_type: event.event,
    user_id: payment.notes?.userId ?? null,
    payload: event as unknown as Json,
  });
  if (logError && logError.code === "23505") return reply({ ok: true, duplicate: true });
  if (logError) { console.error("billing.webhook.log_failed", logError); return reply({ error: "log failed" }, 500); }

  if (event.event !== "payment.captured" && event.event !== "order.paid") return reply({ ok: true });

  const userId = payment.notes?.userId;
  const packId = payment.notes?.packId as PackId | undefined;
  if (!userId || !packId || !(packId in PACKS)) return reply({ ok: true });
  const pack = PACKS[packId];

  // Same idempotency guard as /verify. Verify path usually wins (synchronous
  // from the browser modal); this is the safety net when the user closes the
  // tab before verify runs.
  const { error: ledgerError } = await admin.from("credit_transactions").insert({
    user_id: userId,
    delta: pack.credits,
    reason: "purchase",
    razorpay_payment_id: payment.id,
    pack_id: packId,
    note: pack.name,
  });
  if (ledgerError && ledgerError.code === "23505") return reply({ ok: true, already: true });
  if (ledgerError) { console.error("billing.webhook.ledger_failed", ledgerError); return reply({ error: "ledger failed" }, 500); }

  const { data: existing } = await admin.from("user_credits").select("balance, lifetime_purchased").eq("user_id", userId).maybeSingle();
  const nextBalance = (existing?.balance ?? 0) + pack.credits;
  const nextLifetime = (existing?.lifetime_purchased ?? 0) + pack.credits;
  const { error: upsertError } = await admin.from("user_credits").upsert({
    user_id: userId,
    balance: nextBalance,
    lifetime_purchased: nextLifetime,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (upsertError) { console.error("billing.webhook.upsert_failed", upsertError); return reply({ error: "credit failed" }, 500); }

  return reply({ ok: true });
}
