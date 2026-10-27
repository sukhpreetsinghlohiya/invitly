import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret: string | null;
};

export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
  if (!keyId || !keySecret) return null;
  if (!keyId.startsWith("rzp_")) return null;
  return { keyId, keySecret, webhookSecret };
}

export function getRazorpayPublicKeyId() {
  // Published to the browser via the checkout button. The key id is public by
  // design in Razorpay Checkout. The secret never leaves the server.
  const config = getRazorpayConfig();
  return config?.keyId ?? null;
}

type CreateOrderInput = {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

export async function createRazorpayOrder(config: RazorpayConfig, input: CreateOrderInput): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      notes: input.notes ?? {},
      payment_capture: 1,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Razorpay order failed: ${response.status} ${text}`);
  }
  return (await response.json()) as RazorpayOrder;
}

export function verifyCheckoutSignature(config: RazorpayConfig, orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", config.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

export function verifyWebhookSignature(secret: string, body: string, signature: string) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return safeEqualHex(expected, signature);
}

function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
