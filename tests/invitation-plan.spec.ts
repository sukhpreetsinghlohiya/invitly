import { readFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("two free invitations, stale editor gate, coming-soon plan, and edits after the limit", async ({ page, context }, testInfo) => {
  test.skip(process.env.INVITLY_INTEGRATION !== "1" || testInfo.project.name !== "mobile-360", "Disposable local Supabase only.");
  test.setTimeout(150000);
  const settings = JSON.parse(await readFile("artifacts/local-supabase.json", "utf8"));
  if (!["127.0.0.1", "localhost"].includes(new URL(settings.API_URL).hostname)) throw new Error("Local tests only.");
  const admin = createClient(settings.API_URL, settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `plan-ui-${randomBytes(8).toString("hex")}@example.test`;
  const password = randomBytes(24).toString("base64url");
  const account = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Plan Preview" } });
  expect(account.error).toBeNull();
  const userId = account.data.user!.id;
  try {
    await page.goto("/signup");
    await expect(page.getByText(/save your first 2 invitations free/)).toBeVisible();
    await page.goto("/login");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20000 });
    await expect(page.getByLabel("Free invitation allowance")).toContainText("0 of 2");
    await page.getByRole("link", { name: "New invitation", exact: true }).click();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".editor-feedback .form-success")).toBeVisible({ timeout: 20000 });
    const firstInvitation = new URL(page.url()).searchParams.get("event");
    expect(firstInvitation).toBeTruthy();
    await page.goto("/dashboard");
    await expect(page.getByLabel("Free invitation allowance")).toContainText("1 of 2");

    const stale = await context.newPage();
    await stale.goto("/customize");
    await expect(stale.getByRole("button", { name: "Save draft", exact: true })).toBeVisible();
    await page.goto("/customize");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".editor-feedback .form-success")).toBeVisible({ timeout: 20000 });
    expect(new URL(page.url()).searchParams.get("event")).not.toBe(firstInvitation);
    await stale.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(stale.getByLabel("Invitation limit reached")).toBeVisible({ timeout: 20000 });
    await expect(stale.getByRole("button", { name: "Payments coming soon", exact: true })).toBeDisabled();
    expect(await stale.evaluate(() => Boolean(localStorage.getItem("invitly:invitation-draft:v2")))).toBe(true);
    await stale.close();

    await page.goto("/dashboard");
    await expect(page.getByLabel("Free invitation allowance")).toContainText("2 of 2");
    await page.getByRole("link", { name: "More invitations", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/plan$/);
    await expect(page.getByLabel("Invitation limit reached")).toBeVisible();
    await expect(page.getByRole("button", { name: "Payments coming soon", exact: true })).toBeDisabled();
    for (const width of [320, 360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await mkdir("artifacts/screenshots", { recursive: true });
    await page.screenshot({ path: "artifacts/screenshots/invitation-plan-mobile.png", fullPage: true });
    await page.goto("/customize?theme=modern");
    await expect(page).toHaveURL(/\/dashboard\/plan$/);

    await page.goto(`/customize?event=${firstInvitation}`);
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await page.getByLabel("First name", { exact: true }).fill("Edited at the limit");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".editor-feedback .form-success")).toBeVisible({ timeout: 20000 });
    await page.reload();
    await page.getByRole("button", { name: "Details", exact: true }).click();
    await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Edited at the limit");
    const { count } = await admin.from("events").select("id", { count: "exact", head: true }).eq("owner_id", userId);
    expect(count).toBe(2);
  } finally {
    expect((await admin.auth.admin.deleteUser(userId)).error).toBeNull();
  }
});
