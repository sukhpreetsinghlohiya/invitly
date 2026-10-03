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
