import { createAdminClient, getSupabaseServiceConfig } from "@/lib/supabase/admin";
import { getRazorpayConfig, verifyWebhookSignature } from "@/lib/razorpay";
import { PRO_DURATION_DAYS } from "@/lib/billing";
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
  if (!payment?.id || !payment.order_id) return reply({ ok: true });

  const eventId = `${payment.id}:${event.event}`;
  const admin = createAdminClient();
  const { error: insertError } = await admin
    .from("billing_events")
    .insert({
      event_id: eventId,
      event_type: event.event,
      user_id: payment.notes?.userId ?? null,
      payload: event as unknown as Json,
    });
  // Duplicate (idempotent replay) → ack and stop.
  if (insertError && insertError.code === "23505") return reply({ ok: true, duplicate: true });
  if (insertError) {
    console.error("billing.webhook.log_failed", insertError);
    return reply({ error: "log failed" }, 500);
  }

  if (event.event !== "payment.captured" && event.event !== "order.paid") return reply({ ok: true });

  const { data: pending } = await admin
    .from("user_plans")
    .select("user_id, status")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!pending) return reply({ ok: true });
  if (pending.status === "active") return reply({ ok: true, already: true });

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await admin.from("user_plans").update({
    status: "active",
    activated_at: activatedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    razorpay_payment_id: payment.id,
    updated_at: activatedAt.toISOString(),
  }).eq("user_id", pending.user_id).eq("razorpay_order_id", payment.order_id);
  if (error) {
    console.error("billing.webhook.activate_failed", error);
    return reply({ error: "activate failed" }, 500);
  }
  return reply({ ok: true });
}
