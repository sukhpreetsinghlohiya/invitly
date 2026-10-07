import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("account screens have usable Google and email paths on small screens", async ({ page }, info) => {
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/auth-demo/${path.slice(1)}-${info.project.name}.png`, fullPage: true });
  }
  await page.getByLabel("Your name", { exact: true }).fill("Preview Person");
  await page.getByLabel("Email address", { exact: true }).fill("preview@example.test");
  await page.locator("#password").fill("password-one");
  await page.locator("#confirmPassword").fill("password-two");
  await page.getByRole("button", { name: "Create my account", exact: true }).click();
  await expect(page.locator(".form-error[role=alert]")).toContainText("passwords don’t match");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Preview Person");
  await page.goto("/resend-confirmation");
  await expect(page.getByRole("button", { name: "Send confirmation email", exact: true })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test("email-link landing is inert until confirmation and errors have recovery paths", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=preview-not-a-real-token&type=email");
  await expect(page.getByRole("button", { name: "Confirm my email", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/confirm\?/);
  await page.goto("/auth/confirm?token_hash=preview&type=unknown");
  await expect(page.getByRole("heading", { name: "Let’s try a fresh link.", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Request a fresh email", exact: true })).toHaveAttribute("href", "/resend-confirmation");
  await page.goto("/auth/callback?error=access_denied&error_description=private-provider-detail");
  await expect(page).toHaveURL(/\/login\?error=cancelled$/);
  await expect(page.locator(".form-error[role=alert]")).toContainText("cancelled");
  await expect(page.locator("body")).not.toContainText("private-provider-detail");
});

test("demo selector preserves the chosen design and occasion in the editor link", async ({ page }, info) => {
  await page.goto("/demo?theme=royal&occasion=wedding&tradition=neutral");
  const select = page.getByLabel("YOU’RE PREVIEWING", { exact: true });
  await expect(select).toHaveValue("royal");
  await expect(page.getByRole("button", { name: /^(Play|Pause) music$/ })).toHaveCount(1);
  await page.screenshot({ path: `artifacts/auth-demo/demo-${info.project.name}.png`, fullPage: false });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await select.selectOption("floral");
  await expect(page).toHaveURL(/theme=floral/);
  await expect(page.locator("header").first().getByRole("link", { name: "Make it yours" })).toHaveAttribute("href", /theme=floral.*occasion=wedding.*tradition=neutral/);
  await page.goto("/demo?occasion=engagement&theme=lotus");
  await expect(select).toHaveValue("lotus");
  expect(await select.locator("option").count()).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("branded account emails fit on mobile and contain the intended secure links", async ({ page }, info) => {
  for (const [name, type] of [["confirmation", "email"], ["recovery", "recovery"], ["invite", "invite"]]) {
    const html = (await readFile(`supabase/templates/${name}.html`, "utf8"))
      .replaceAll("{{ .SiteURL }}", "https://invitly.co.in")
      .replaceAll("{{ .TokenHash }}", "a".repeat(64));
    await page.setContent(html);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const links = page.locator('a[href*="/auth/confirm"]');
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute("href", new RegExp(`type=${type}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/auth-demo/email-${name}-${info.project.name}.png`, fullPage: true });
  }
});

test("blocked autoplay recovers from opening without showing a broken player", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let opened = false;
    const fixture = window as unknown as { blockedPlaybackAttempts: number };
    fixture.blockedPlaybackAttempts = 0;
    document.addEventListener("invitly:open", () => { opened = true; }, { capture: true });
    HTMLMediaElement.prototype.play = function () {
      if (!opened) {
        fixture.blockedPlaybackAttempts += 1;
        return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      }
      return original.call(this);
    };
  });
  await page.goto("/demo");
  await expect.poll(() => page.evaluate(() => (window as unknown as { blockedPlaybackAttempts: number }).blockedPlaybackAttempts)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toBeVisible();
  await expect(page.locator(".music-control .form-feedback")).toHaveCount(0);
  await page.getByRole("button", { name: "Open invitation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toBeVisible();
  await expect(page.locator(".music-control .form-feedback")).toHaveCount(0);
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toBeEnabled();
});
