import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "@playwright/test";
import type { AuthMode, AuthState } from "../src/app/auth/actions";

const source = ts.transpileModule(readFileSync("src/app/auth/actions.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const now = 1_800_000_000_000;

function fixture(error: { status?: number; code?: string } | null = null, hasUser = true, googleEnabled = true, invalidSite = false) {
  const calls: { operation: string; input?: unknown }[] = [];
  const auth = Object.fromEntries(["signUp", "signInWithPassword", "resetPasswordForEmail", "getUser", "updateUser", "resend", "verifyOtp", "signInWithOAuth"].map((operation) => [operation, async (input: unknown) => {
    calls.push({ operation, input });
    return { error: operation === "getUser" ? null : error, data: { session: null, user: hasUser ? { id: "fixture" } : null, url: "https://auth.example/authorize" } };
  }]));
  const exports: { authenticate?: (mode: AuthMode, state: AuthState, data: FormData) => Promise<AuthState>; signInWithGoogle?: () => Promise<AuthState>; confirmEmail?: (state: AuthState, data: FormData) => Promise<AuthState> } = {};
  runInNewContext(source, {
    exports,
    URL,
    AbortSignal,
    fetch: async () => ({ ok: true, json: async () => ({ external: { google: googleEnabled } }) }),
    Date: { now: () => now },
    process: { env: { NEXT_PUBLIC_SITE_URL: "https://invitly.example", NODE_ENV: "test" } },
    require: (name: string) => {
      if (name === "next/navigation") return { redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } };
      if (name === "@/lib/env") return { getSupabaseConfig: () => ({ url: "https://auth.example", key: "test-public-key" }), getAuthSiteUrl: () => { if (invalidSite) throw new Error("Invalid site URL"); return new URL("https://invitly.example"); } };
      if (name === "@/lib/supabase/server") return { createClient: async () => ({ auth }) };
      throw new Error(`Unexpected test import: ${name}`);
    },
  });
  return { authenticate: exports.authenticate!, signInWithGoogle: exports.signInWithGoogle!, confirmEmail: exports.confirmEmail!, calls };
}

function form(changes: Record<string, string> = {}) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ email: "person@example.test", name: "A Person", password: "long-fixture-password", confirmPassword: "long-fixture-password", ...changes })) data.set(name, value);
  return data;
}

test("all auth mutations translate server 429 and typed rate-limit errors into a bounded UI pause", async () => {
  for (const mode of ["login", "signup", "forgot", "reset", "resend"] as const) {
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


test("existing short passwords reach login while new passwords keep the stronger policy", async () => {
  const service = fixture();
  expect(await service.authenticate("login", {}, form({ password: "six123" })).then(() => "no redirect", (error: Error) => error.message)).toBe("REDIRECT:/dashboard");
  expect(service.calls[0].operation).toBe("signInWithPassword");
  const signup = fixture();
  expect((await signup.authenticate("signup", {}, form({ password: "six123", confirmPassword: "six123" }))).error).toContain("8 and 128");
  expect(signup.calls).toHaveLength(0);
});

test("unconfirmed login has a recovery path and resending does not reveal account existence", async () => {
  expect((await fixture({ code: "email_not_confirmed" }).authenticate("login", {}, form())).confirmationRequired).toBe(true);
  const sent = await fixture().authenticate("resend", {}, form());
  expect(sent.success).toContain("awaiting confirmation");
  for (const code of ["user_not_found", "email_already_confirmed"]) expect(await fixture({ code }).authenticate("resend", {}, form())).toEqual(sent);
});

test("Google OAuth uses the configured callback and redirects without swallowing the framework signal", async () => {
  const service = fixture();
  expect(await service.signInWithGoogle().then(() => "no redirect", (error: Error) => error.message)).toBe("REDIRECT:https://auth.example/authorize");
  expect(service.calls[0]).toEqual({ operation: "signInWithOAuth", input: { provider: "google", options: { redirectTo: "https://invitly.example/auth/callback", queryParams: { prompt: "select_account" } } } });
});

test("confirmation verifies only allowed tokens and uses fixed destinations", async () => {
  for (const type of ["email", "recovery", "invite"]) {
    const service = fixture();
    expect(await service.confirmEmail({}, form({ token_hash: "fixture-hash", type, next: "https://evil.example" })).then(() => "no redirect", (error: Error) => error.message)).toBe(type === "email" ? "REDIRECT:/dashboard" : "REDIRECT:/reset-password");
    expect(service.calls[0]).toEqual({ operation: "verifyOtp", input: { token_hash: "fixture-hash", type } });
  }
  for (const values of [{ type: "unknown", token_hash: "value" }, { type: "email", token_hash: "" }]) {
    const service = fixture();
    expect((await service.confirmEmail({}, form(values))).error).toContain("invalid");
    expect(service.calls).toHaveLength(0);
  }
  expect((await fixture({ code: "otp_expired" }).confirmEmail({}, form({ token_hash: "old", type: "email" }))).error).toContain("expired");
});


test("a disabled Google provider leaves visitors on the working email form", async () => {
  const service = fixture(null, true, false);
  expect((await service.signInWithGoogle()).error).toContain("continue with email");
  expect(service.calls).toHaveLength(0);
});

test("a malformed email callback origin does not disable existing password sign-in or password updates", async () => {
  for (const mode of ["login", "reset"] as const) {
    const service = fixture(null, true, true, true);
    expect(await service.authenticate(mode, {}, form()).then(() => "no redirect", (error: Error) => error.message)).toBe("REDIRECT:/dashboard");
    expect(service.calls.map(call => call.operation)).toEqual(mode === "login" ? ["signInWithPassword"] : ["getUser", "updateUser"]);
  }
});
