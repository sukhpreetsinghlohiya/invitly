import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "@playwright/test";

const source = ts.transpileModule(readFileSync("src/app/auth/callback/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function callbackFixture(fail = false) {
  const calls: string[] = [];
  const exports: { GET?: (request: { nextUrl: URL }) => Promise<{ headers: Headers }> } = {};
  runInNewContext(source, {
    exports, URL, URLSearchParams,
    require: (name: string) => {
      if (name === "next/server") return { NextResponse: { redirect: (url: URL) => ({ headers: new Headers({ location: url.href }) }) } };
      if (name === "@/lib/env") return { getSupabaseConfig: () => ({}), getAuthSiteUrl: () => new URL("https://invitly.example") };
      if (name === "@/lib/supabase/server") return { createClient: async () => {
        calls.push("createClient");
        return { auth: {
          exchangeCodeForSession: async (code: string) => { calls.push(`exchange:${code}`); return { error: fail ? { code: "expired" } : null }; },
          verifyOtp: async () => { throw new Error("A GET must never consume a token hash"); },
        } };
      } };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { calls, get: (query: string) => exports.GET!({ nextUrl: new URL(`https://invitly.example/auth/callback?${query}`) }) };
}

test("legacy token-hash links reach deliberate confirmation without consuming the token on GET", async () => {
  for (const type of ["email", "recovery", "invite"]) {
    const fixture = callbackFixture();
    const result = await fixture.get(new URLSearchParams({ token_hash: "fixture+hash&value", type }).toString());
    const location = new URL(result.headers.get("location")!);
    expect(location.pathname).toBe("/auth/confirm");
    expect(location.searchParams.get("token_hash")).toBe("fixture+hash&value");
    expect(location.searchParams.get("type")).toBe(type);
    expect(fixture.calls).toEqual([]);
    expect(result.headers.get("cache-control")).toBe("private, no-store");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
  }
});

test("OAuth codes still exchange once and callbacks cannot redirect to a supplied external next URL", async () => {
  const fixture = callbackFixture();
  const result = await fixture.get("code=fixture-code&next=https://untrusted.example");
  expect(result.headers.get("location")).toBe("https://invitly.example/dashboard");
  expect(fixture.calls).toEqual(["createClient", "exchange:fixture-code"]);
});

test("expired recovery callbacks lead to a new reset email and reject malformed token hashes", async () => {
  for (const query of ["code=expired&next=/reset-password", "token_hash=fixture&type=unknown", `token_hash=${"a".repeat(1025)}&type=recovery`]) {
    const fixture = callbackFixture(true);
    const result = await fixture.get(query);
    expect(result.headers.get("location")).toBe(query.includes("type=unknown") ? "https://invitly.example/login?error=verification" : "https://invitly.example/forgot-password?error=verification");
    if (!query.startsWith("code=")) expect(fixture.calls).toEqual([]);
  }
});
