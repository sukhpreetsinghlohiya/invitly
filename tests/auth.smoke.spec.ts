import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("authenticated host signup, logout, recovery callback and password change", async ({ page }, testInfo) => {
  test.skip(process.env.INVITLY_INTEGRATION !== "1" || testInfo.project.name !== "mobile-360", "Disposable local auth stack only.");
  test.setTimeout(90000);
  const settings = JSON.parse(await readFile("artifacts/local-supabase.json", "utf8"));
  if (!["127.0.0.1", "localhost"].includes(new URL(settings.API_URL).hostname)) throw new Error("Local auth tests only.");
  const admin = createClient(settings.API_URL, settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `auth-${randomBytes(8).toString("hex")}@example.test`;
  const displayName = `Local auth test ${randomBytes(8).toString("hex")}`;
  const password = randomBytes(20).toString("base64url");
  const replacement = randomBytes(20).toString("base64url");
  let userId: string | undefined;
  async function findFixtureUserId() {
    const { data, error } = await admin.from("profiles").select("id").eq("full_name", displayName).maybeSingle();
    if (error) throw new Error("Could not locate the disposable local auth profile.");
    return data?.id as string | undefined;
  }
  try {
    await page.goto("/signup");
    await page.getByLabel("Your name", { exact: true }).fill(displayName);
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.locator("#password").fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create my account", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20000 });
    // Generating a recovery link here would set recovery_sent_at and throttle
    // the real reset request below. Reading the fixture profile has no effect.
    userId = await findFixtureUserId();
    if (!userId) throw new Error("The signup did not create its disposable local auth profile.");
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/forgot-password");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(page.locator(".form-success")).toContainText("password reset link");
    // Generate after requesting email so the recovery token is current. The
    // callback is real; this isolates SMTP delivery from the browser test.
    const recovery = await admin.auth.admin.generateLink({ type: "recovery", email });
    if (recovery.error) throw new Error("Local recovery token creation failed.");
    await page.goto(`/auth/callback?token_hash=${encodeURIComponent(recovery.data.properties.hashed_token)}&type=recovery`);
    await expect(page).toHaveURL(/\/auth\/confirm\?/);
    await page.getByRole("button", { name: "Continue to reset password", exact: true }).click();
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.locator("#password").fill(replacement);
    await page.getByLabel("Confirm password", { exact: true }).fill(replacement);
    await page.getByRole("button", { name: "Save new password", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/login");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator(".form-error[role=alert]")).toContainText("couldn’t sign you in");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.locator("#password").fill(replacement);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  } finally {
    // Signup may have succeeded before a navigation assertion failed. Recover
    // that fixture by its unique name, then verify ownership before deleting it.
    userId ||= await findFixtureUserId();
    if (userId) {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || data.user?.email !== email) throw new Error("Refused to remove an unverified local auth fixture.");
      if ((await admin.auth.admin.deleteUser(userId)).error) throw new Error("Could not remove the disposable local auth fixture.");
    }
  }
});
