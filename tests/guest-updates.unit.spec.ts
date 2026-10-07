import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "@playwright/test";

const source = ts.transpileModule(readFileSync("src/lib/guest-updates.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture(fetcher: typeof fetch) {
  const exports: { readGuestUpdates?: (endpoint: string, signal: AbortSignal) => Promise<unknown> } = {};
  runInNewContext(source, { exports, fetch: fetcher, AbortController, Date, clearTimeout, setTimeout: (callback: () => void) => setTimeout(callback, 10) });
  return (signal = new AbortController().signal) => exports.readGuestUpdates!("/g/fixture/updates", signal);
}
const update = { id: "one", message: "The venue is ready.", pinned: true, created_at: "2027-01-01T00:00:00Z", updated_at: "2027-01-01T00:00:00Z" };

test("hung announcement requests abort and a later poll can succeed", async () => {
  let attempts = 0;
  const read = fixture(async (_url, options) => {
    attempts++;
    if (attempts === 1) return new Promise<Response>((_resolve, reject) => options!.signal!.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true }));
    expect(options).toMatchObject({ cache: "no-store", credentials: "omit" });
    return Response.json({ updates: [update], checkedAt: update.updated_at });
  });
  expect(await read().then(() => "unexpected success", error => error.name)).toBe("AbortError");
  expect(await read()).toMatchObject({ unavailable: false, updates: [update] });
});

test("leaving an invitation cancels its pending update request", async () => {
  const lifetime = new AbortController();
  const read = fixture(async (_url, options) => new Promise<Response>((_resolve, reject) => options!.signal!.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), { once: true })));
  const pending = read(lifetime.signal);
  lifetime.abort();
  expect(await pending.then(() => "unexpected success", error => error.name)).toBe("AbortError");
});

test("revoked invitations are distinguished from invalid or unavailable updates", async () => {
  expect(await fixture(async () => new Response(null, { status: 410 }))()).toEqual({ unavailable: true });
  for (const body of [{ updates: [update], checkedAt: "bad date" }, { updates: [{ ...update, updated_at: "bad date" }], checkedAt: update.updated_at }, { updates: [null], checkedAt: update.updated_at }]) {
    expect(await fixture(async () => Response.json(body))().then(() => "unexpected success", error => error.message)).toBe("Invalid updates");
  }
  expect(await fixture(async () => new Response(null, { status: 503 }))().then(() => "unexpected success", error => error.message)).toBe("Updates unavailable");
});
