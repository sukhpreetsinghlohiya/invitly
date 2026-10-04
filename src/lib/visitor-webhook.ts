import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { VisitorIntroduction } from "./visitor-welcome";

export function getVisitorWebhookConfig() {
  const value = process.env.INVITLY_VISITOR_WEBHOOK_URL?.trim();
  if (!value || process.env.INVITLY_VISITOR_WELCOME_ENABLED === "false") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return null;
    return { url: url.href, token: process.env.INVITLY_VISITOR_WEBHOOK_TOKEN?.trim() };
  } catch { return null; }
}

type Delivery = { ok: true } | { ok: false; status: 429 | 502 | 503 };
const windowMs = 10 * 60_000;
const salt = randomBytes(24).toString("hex");
const attempts = new Map<string, { count: number; expires: number }>();
const deliveries = new Map<string, { result: Promise<Delivery>; expires: number }>();

// A bounded, supplementary per-instance throttle. Configure the Vercel WAF
// rate-limit rule described in README for a distributed production limit.
export function allowVisitorAttempt(clientAddress: string, now = Date.now()) {
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  const key = createHash("sha256").update(`${salt}:${clientAddress}`).digest("hex");
  const current = attempts.get(key);
  if (current && current.count >= 5) return false;
  if (!current && attempts.size >= 5000) return false;
  attempts.set(key, { count: (current?.count ?? 0) + 1, expires: current?.expires ?? now + windowMs });
  return true;
}

export async function deliverVisitorIntroduction(input: VisitorIntroduction): Promise<Delivery> {
  const config = getVisitorWebhookConfig();
  if (!config) return { ok: false, status: 503 };
  const now = Date.now();
  for (const [key, entry] of deliveries) if (entry.expires <= now) deliveries.delete(key);
  const previous = deliveries.get(input.submissionId);
  if (previous) return previous.result;
  if (deliveries.size >= 5000) return { ok: false, status: 429 };
  const result = (async (): Promise<Delivery> => {
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": input.submissionId,
          ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        },
        body: JSON.stringify({
          event: "visitor.introduced", version: 1, id: input.submissionId,
          submittedAt: new Date(now).toISOString(),
          visitor: { name: input.name, reason: input.reason },
          context: { page: input.page, referringSite: input.referrer },
        }),
        redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      await response.body?.cancel();
      return response.ok ? { ok: true } : { ok: false, status: 502 };
    } catch {
      // Do not log visitor details, the destination URL, credentials or the
      // provider's response. Those may all contain private information.
      return { ok: false, status: 502 };
    }
  })();
  deliveries.set(input.submissionId, { result, expires: now + windowMs });
  const outcome = await result;
  if (!outcome.ok) deliveries.delete(input.submissionId);
  return outcome;
}
