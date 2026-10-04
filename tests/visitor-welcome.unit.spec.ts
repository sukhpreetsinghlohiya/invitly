import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as crypto from "node:crypto";
import ts from "typescript";
import { expect, test } from "@playwright/test";
import { isWelcomePage, referringSite, validateVisitorIntroduction } from "../src/lib/visitor-welcome";

const sample = { submissionId: "a586d533-d3f8-45b1-984a-87513818ce35", name: "  Aman  Singh  ", reason: "A wedding invitation", page: "/", referrer: "https://www.google.com/search?q=private&token=secret" };
function compile(path: string) {
  return ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
}
function webhookFixture(fetcher: typeof fetch, config: Record<string, string | undefined> = {}) {
  const exports: Record<string, (...args: unknown[]) => unknown> = {};
  const env = { INVITLY_VISITOR_WEBHOOK_URL: "https://receiver.example/hook", INVITLY_VISITOR_WEBHOOK_TOKEN: "fixture-private-token", ...config };
  runInNewContext(compile("src/lib/visitor-webhook.ts"), { exports, process: { env }, URL, Date, AbortSignal, fetch: fetcher, require: (name: string) => { if (name === "server-only") return {}; if (name === "node:crypto") return crypto; throw new Error(name); } });
  return exports;
}

test("welcome validation excludes private paths and strips referrer queries", () => {
  expect(validateVisitorIntroduction(sample)).toEqual({ ...sample, name: "Aman Singh", referrer: "www.google.com" });
  for (const path of ["/g/private-token", "/i/private-slug", "/invite/x", "/dashboard", "/customize", "/auth/callback", "/signup", "/demo", "/templates?token=private", "/blog/%2fprivate"]) {
    expect(isWelcomePage(path)).toBe(false);
    expect(validateVisitorIntroduction({ ...sample, page: path })).toBeNull();
  }
  for (const patch of [{ name: " " }, { reason: " " }, { name: "x".repeat(81) }, { reason: "x".repeat(501) }, { submissionId: "not-a-uuid" }]) expect(validateVisitorIntroduction({ ...sample, ...patch })).toBeNull();
  expect(referringSite("javascript:alert(1)")).toBeNull();
  expect(referringSite(null)).toBeNull();
});

test("webhook sends the agreed JSON and deduplicates concurrent submissions", async () => {
  const calls: { url: unknown; options: RequestInit }[] = [];
  const service = webhookFixture(async (url, options) => { calls.push({ url, options: options! }); return new Response("ok"); });
  const input = validateVisitorIntroduction(sample)!;
  const results = await Promise.all([service.deliverVisitorIntroduction(input), service.deliverVisitorIntroduction(input)]);
  expect(results).toEqual([{ ok: true }, { ok: true }]);
  expect(calls).toHaveLength(1);
  const call = calls[0];
  const payload = JSON.parse(call.options.body as string);
  expect(payload).toMatchObject({ event: "visitor.introduced", id: input.submissionId, visitor: { name: "Aman Singh", reason: sample.reason }, context: { page: "/", referringSite: "www.google.com" } });
  expect(call.options.headers).toMatchObject({ Authorization: "Bearer fixture-private-token", "Idempotency-Key": input.submissionId });
  expect(call.options.redirect).toBe("error");
  expect(call.options.body).not.toContain("private-token");
  expect(call.options.body).not.toContain("q=private");
});

test("failed deliveries remain retryable and disabled or non-HTTPS destinations never receive data", async () => {
  let count = 0;
  const service = webhookFixture(async () => { count++; return new Response("provider secrets", { status: count === 1 ? 500 : 200 }); });
  expect(await service.deliverVisitorIntroduction(validateVisitorIntroduction(sample))).toEqual({ ok: false, status: 502 });
  expect(await service.deliverVisitorIntroduction(validateVisitorIntroduction(sample))).toEqual({ ok: true });
  for (const config of [{ INVITLY_VISITOR_WEBHOOK_URL: "" }, { INVITLY_VISITOR_WEBHOOK_URL: "http://receiver.example/hook" }, { INVITLY_VISITOR_WELCOME_ENABLED: "false" }, { INVITLY_VISITOR_WEBHOOK_URL: "https://user:password@receiver.example/hook" }]) {
    const disabled = webhookFixture(async () => { throw new Error("Must not fetch"); }, config);
    expect(disabled.getVisitorWebhookConfig()).toBeNull();
    expect(await disabled.deliverVisitorIntroduction(sample)).toEqual({ ok: false, status: 503 });
  }
  const timeout = webhookFixture(async () => { throw new DOMException("Timed out", "TimeoutError"); });
  expect(await timeout.deliverVisitorIntroduction(sample)).toEqual({ ok: false, status: 502 });
});

test("supplementary throttle expires and keeps different visitors separate", () => {
  const service = webhookFixture(fetch);
  for (let i = 0; i < 5; i++) expect(service.allowVisitorAttempt("visitor-a", 1000)).toBe(true);
  expect(service.allowVisitorAttempt("visitor-a", 1000)).toBe(false);
  expect(service.allowVisitorAttempt("visitor-b", 1000)).toBe(true);
  expect(service.allowVisitorAttempt("visitor-a", 601001)).toBe(true);
});

test("endpoint rejects cross-origin, oversized and invalid requests before webhook delivery", async () => {
  let deliveries = 0;
  let permitted = true;
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  runInNewContext(compile("src/app/api/visitor-welcome/route.ts"), { exports, Response, URL, Buffer, process: { env: {} }, require: (name: string) => {
    if (name === "@/lib/visitor-welcome") return { validateVisitorIntroduction };
    if (name === "@/lib/visitor-webhook") return { getVisitorWebhookConfig: () => ({}), allowVisitorAttempt: () => permitted, deliverVisitorIntroduction: async () => { deliveries++; return { ok: true }; } };
    throw new Error(name);
  } });
  const post = (body: unknown, origin = "https://invitly.example") => exports.POST!(new Request("https://invitly.example/api/visitor-welcome", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  expect((await post(sample, "https://attacker.example")).status).toBe(403);
  expect((await post({ ...sample, name: "" })).status).toBe(400);
  expect((await post({ ...sample, reason: "x".repeat(5000) })).status).toBe(400);
  expect(deliveries).toBe(0);
  expect((await post(sample)).status).toBe(200);
  expect(deliveries).toBe(1);
  const internalRequest = (origin: string, host: string, fetchSite = "same-origin") => exports.POST!(new Request("http://localhost:3014/api/visitor-welcome", { method: "POST", headers: { origin, host, "sec-fetch-site": fetchSite, "Content-Type": "application/json" }, body: JSON.stringify(sample) }));
  expect((await internalRequest("http://127.0.0.1:3014", "127.0.0.1:3014")).status).toBe(200);
  expect((await internalRequest("https://invitly.co.in", "invitly.co.in")).status).toBe(200);
  expect((await internalRequest("https://attacker.example", "invitly.co.in")).status).toBe(403);
  expect((await internalRequest("https://invitly.co.in", "invitly.co.in", "cross-site")).status).toBe(403);
  expect((await internalRequest("http://127.0.0.1:9999", "127.0.0.1:3014")).status).toBe(403);
  expect(deliveries).toBe(3);
  permitted = false;
  const limited = await post(sample);
  expect(limited.status).toBe(429);
  expect(limited.headers.get("Retry-After")).toBe("600");
  expect(deliveries).toBe(3);
});
