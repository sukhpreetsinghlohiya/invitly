import { expect, test } from "@playwright/test";

test("password visibility preserves input focus and both password fields remain validated", async ({ page }) => {
  await page.goto("/signup");
  const password = page.locator("#password");
  test.skip(await password.count() === 0, "Auth UI needs a configured Supabase public URL/key; no live account is used.");
  await password.fill("fixture-password");
  await password.focus();
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toBeFocused();
  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveValue("fixture-password");
  await expect(password).toHaveAttribute("minlength", "8");
  await expect(page.locator("#confirmPassword")).toHaveAttribute("minlength", "8");
  await page.getByRole("button", { name: "Show confirmed password", exact: true }).click();
  await expect(page.locator("#confirmPassword")).toHaveAttribute("type", "text");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("reset submission locks immediately, retains FormData, then counts down before allowing resend", async ({ page }) => {
  await page.goto("/forgot-password");
  const email = page.locator("#email");
  test.skip(await email.count() === 0, "Auth UI needs a configured Supabase public URL/key; no email is sent.");
  await page.clock.install();
  let requests = 0;
  let submitted = "";
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/forgot-password", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests += 1;
    submitted = route.request().postData() ?? "";
    await held;
    // Mock only the action transport. Server error classification has separate
    // unit coverage, and this never reaches Supabase or sends an email.
    const result = { success: "If an account uses this email, a password reset link is on its way.", retryAfter: 60, notBefore: await page.evaluate(() => Date.now() + 60_000) };
    await route.fulfill({ contentType: "text/x-component", body: `0:${JSON.stringify({ a: result, f: "" })}\n` });
  });
  await email.fill("fixture@example.test");
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sending reset link…", exact: true })).toBeDisabled();
  await expect(email).toHaveAttribute("readonly", "");
  expect(await email.evaluate((input) => new FormData((input as HTMLInputElement).form!).get("email"))).toBe("fixture@example.test");
  await page.locator("form[aria-busy]").evaluate((form) => { for (let i = 0; i < 4; i++) (form as HTMLFormElement).requestSubmit(); });
  await expect.poll(() => requests).toBe(1);
  expect(submitted).toContain("fixture@example.test");
  release!();
  await expect(page.getByRole("status")).toContainText("If an account uses this email");
  await expect(email).toHaveValue("fixture@example.test");
  await expect(page.locator("#auth-cooldown")).toContainText("60 seconds");
  await page.clock.fastForward(61_000);
  await expect(page.getByRole("button", { name: "Send another reset link", exact: true })).toBeEnabled();
  expect(requests).toBe(1);
});

test("failed action transport returns an inline retry without clearing the email", async ({ page }) => {
  await page.goto("/forgot-password");
  const email = page.locator("#email");
  test.skip(await email.count() === 0, "Auth UI needs a configured Supabase public URL/key; no email is sent.");
  await page.route("**/forgot-password", (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue());
  await email.fill("fixture@example.test");
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText("Check your connection and try again");
  await expect(email).toHaveValue("fixture@example.test");
  await expect(page.getByRole("button", { name: "Send reset link", exact: true })).toBeEnabled();
  await expect(page.locator("form[aria-busy]")).toHaveAttribute("aria-busy", "false");
});

test("Google and email submissions share one lock even before the first render updates", async ({ page }) => {
  await page.goto("/login");
  const google = page.getByRole("form", { name: "Google sign-in", exact: true });
  test.skip(await google.count() === 0, "Auth UI needs a configured Supabase public URL/key; no account is used.");
  await page.getByLabel("Email address", { exact: true }).fill("fixture@example.test");
  await page.locator("#password").fill("fixture-password");
  let requests = 0;
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/login", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests += 1;
    await held;
    await route.fulfill({ contentType: "text/x-component", body: `0:${JSON.stringify({ a: { error: "Google is temporarily unavailable. Continue with email." }, f: "" })}\n` });
  });
  await page.evaluate(() => {
    const googleForm = document.querySelector('form[aria-label="Google sign-in"]') as HTMLFormElement;
    const emailForm = document.querySelector('form[aria-label="Sign in"]') as HTMLFormElement;
    for (let i = 0; i < 4; i++) { googleForm.requestSubmit(); emailForm.requestSubmit(); }
  });
  await expect(page.getByRole("button", { name: "Connecting to Google…", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
  await expect.poll(() => requests).toBe(1);
  release!();
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeEnabled();
  await expect(google.getByRole("alert")).toContainText("Continue with email");
  expect(requests).toBe(1);
});

test("email confirmation prevents duplicate token requests and honors rate-limit cooldown", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=fixture-only&type=recovery");
  await page.clock.install();
  let requests = 0;
  await page.route("**/auth/confirm?**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    requests += 1;
    const result = { error: "Please wait before trying again.", retryAfter: 60, notBefore: await page.evaluate(() => Date.now() + 60_000) };
    await route.fulfill({ contentType: "text/x-component", body: `0:${JSON.stringify({ a: result, f: "" })}\n` });
  });
  const form = page.getByRole("form", { name: "Verify email link", exact: true });
  await form.evaluate((element) => { for (let i = 0; i < 4; i++) (element as HTMLFormElement).requestSubmit(); });
  await expect(form.getByRole("alert")).toContainText("Please wait");
  await expect(page.locator("#confirmation-cooldown")).toContainText("60 seconds");
  await expect(form.getByRole("button")).toBeDisabled();
  expect(requests).toBe(1);
  await page.clock.fastForward(61_000);
  await expect(form.getByRole("button", { name: "Continue to reset password", exact: true })).toBeEnabled();
  expect(requests).toBe(1);
});

test("legacy email callbacks stay inert and broken recovery links offer the correct fresh email", async ({ page }) => {
  await page.goto("/auth/callback?token_hash=fixture-only&type=recovery");
  await expect(page).toHaveURL(/\/auth\/confirm\?/);
  await expect(page.getByRole("button", { name: "Continue to reset password", exact: true })).toBeVisible();
  await page.goto("/auth/callback?type=recovery");
  await expect(page).toHaveURL(/\/forgot-password\?error=verification$/);
  await expect(page.getByText("Your password reset link has expired or could not be verified.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link", exact: true })).toBeVisible();
});
