import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "@playwright/test";
import type { AuthMode, AuthState } from "../src/app/auth/actions";

const source = ts.transpileModule(readFileSync("src/app/auth/actions.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const now = 1_800_000_000_000;

function fixture(error: { status?: number; code?: string } | null = null, hasUser = true) {
  const calls: { operation: string; input?: unknown }[] = [];
  const auth = Object.fromEntries(["signUp", "signInWithPassword", "resetPasswordForEmail", "getUser", "updateUser"].map((operation) => [operation, async (input: unknown) => {
    calls.push({ operation, input });
    return { error: operation === "getUser" ? null : error, data: { session: null, user: hasUser ? { id: "fixture" } : null } };
  }]));
  const exports: { authenticate?: (mode: AuthMode, state: AuthState, data: FormData) => Promise<AuthState> } = {};
  runInNewContext(source, {
    exports,
    Date: { now: () => now },
    process: { env: { NEXT_PUBLIC_SITE_URL: "https://invitly.example", NODE_ENV: "test" } },
    require: (name: string) => {
      if (name === "next/navigation") return { redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } };
      if (name === "@/lib/env") return { getSupabaseConfig: () => ({}), getSiteUrl: () => new URL("https://invitly.example") };
      if (name === "@/lib/supabase/server") return { createClient: async () => ({ auth }) };
      throw new Error(`Unexpected test import: ${name}`);
    },
  });
  return { authenticate: exports.authenticate!, calls };
}

function form(changes: Record<string, string> = {}) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ email: "person@example.test", name: "A Person", password: "long-fixture-password", confirmPassword: "long-fixture-password", ...changes })) data.set(name, value);
  return data;
}

test("all auth mutations translate server 429 and typed rate-limit errors into a bounded UI pause", async () => {
  for (const mode of ["login", "signup", "forgot", "reset"] as const) {
    for (const error of [{ status: 429 }, { status: 400, code: "over_email_send_rate_limit" }, { status: 400, code: "over_request_rate_limit" }]) {
      const service = fixture(error);
      const result = await service.authenticate(mode, {}, form());
      expect(result.code).toBe("rate_limited");
      expect(result.retryAfter).toBe(60);
      expect(result.notBefore).toBe(now + 60_000);
      expect(result.error).toContain("Please wait");
    }
  }
});

test("reset requests keep identical account-safe responses for accepted and unknown addresses", async () => {
  const accepted = fixture();
  const missing = fixture({ code: "user_not_found", status: 404 });
  const sent = await accepted.authenticate("forgot", {}, form());
  expect(await missing.authenticate("forgot", {}, form())).toEqual(sent);
  expect(sent.success).toContain("If an account uses this email");
  expect(sent.retryAfter).toBe(60);
  expect(accepted.calls[0].operation).toBe("resetPasswordForEmail");
});

test("password updates still verify the user and cannot be authorized by client cooldown state", async () => {
  const service = fixture(null, false);
  const result = await service.authenticate("reset", { notBefore: now + 99_000, success: "trusted" }, form());
  expect(result.error).toContain("expired");
  expect(service.calls.map((call) => call.operation)).toEqual(["getUser"]);
  const login = fixture();
  const navigation = await login.authenticate("login", { notBefore: now + 99_000 }, form()).then(() => "no redirect", (error: Error) => error.message);
  expect(navigation).toBe("REDIRECT:/dashboard");
  expect(login.calls[0].operation).toBe("signInWithPassword");
});

test("invalid lengths and mismatched passwords never reach the auth service", async () => {
  const invalid: Record<string, string>[] = [{ password: "short" }, { password: "a".repeat(129) }, { confirmPassword: "does-not-match" }, { email: "invalid" }];
  for (const changes of invalid) {
    const service = fixture();
    expect((await service.authenticate("signup", {}, form(changes))).error).toBeTruthy();
    expect(service.calls).toHaveLength(0);
  }
});

test("ordinary auth errors remain friendly without a false rate-limit countdown", async () => {
  const service = fixture({ status: 400, code: "invalid_credentials" });
  const result = await service.authenticate("login", {}, form());
  expect(result.error).toContain("Check your email and password");
  expect(result.notBefore).toBeUndefined();
});
