import { mkdir } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await mkdir("artifacts/screenshots", { recursive: true });
  await page.screenshot({ path: `artifacts/screenshots/${name}-${testInfo.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `artifacts/screenshots/${name}-${testInfo.project.name}-viewport.png` });
}

test("the collection shows ten themes, filters by style, and opens the selected editor", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/templates");
  await expect(page.locator("article.collection-card")).toHaveCount(10);
  await expect(page.locator('.collection-count[role="status"]')).toHaveText("10 invitations to make your own");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "templates");
  const filters = page.getByRole("group", { name: "Filter invitation styles" });
  for (const [name, count] of [["Indian", 5], ["Minimal", 2], ["Floral", 2], ["Contemporary", 1]] as const) {
    await filters.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("article.collection-card")).toHaveCount(count);
    await expect(filters.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expectNoHorizontalOverflow(page);
  }
  const all = filters.getByRole("button", { name: "All", exact: true });
  await all.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("article.collection-card")).toHaveCount(10);
  await page.getByRole("link", { name: "Customize Pichwai Garden", exact: true }).click();
  await expect(page).toHaveURL(/\/customize\?theme=pichwai/);
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pichwai Garden", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("customization updates the invitation and saves a local draft across reloads", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/customize?theme=floral");
  const preview = page.frameLocator("iframe[title=\"Actual guest invitation preview\"]").locator("body");
  await expect(page.getByRole("region", { name: "Live invitation preview" })).toBeVisible();
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await page.getByLabel("First name", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved on this device.", { exact: false })).toBeVisible();
  await page.getByLabel("First name", { exact: true }).fill("Simran");
  await page.getByLabel("Second name", { exact: true }).fill("Arjun");
  await page.getByRole("textbox", { name: "Your message", exact: true }).fill("ਸਾਡੇ ਵਿਆਹ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। Join our families for a little forever.");
  await expect(preview).toContainText("Simran");
  await expect(preview).toContainText("Arjun");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved on this device.", { exact: false })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Object.values(localStorage).some((value) => value.includes("Simran") && value.includes("Arjun")))).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Simran");
  await expect(page.getByLabel("Second name", { exact: true })).toHaveValue("Arjun");
  await expect(page.getByRole("textbox", { name: "Your message", exact: true })).toHaveValue("ਸਾਡੇ ਵਿਆਹ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। Join our families for a little forever.");
  await expect(preview).toContainText("Simran");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "customize-details");
  expect(errors).toEqual([]);
});

test("functions can be added, renamed, previewed and removed", async ({ page }, testInfo) => {
  await page.goto("/customize");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  const removeButtons = page.getByRole("button", { name: /^Remove / });
  const initialCount = await removeButtons.count();
  expect(initialCount).toBe(0);
  await page.getByRole("button", { name: "Add function", exact: true }).click();
  await expect(removeButtons).toHaveCount(initialCount + 1);
  await page.getByRole("group", { name: /Wedding ceremony$/ }).getByLabel("Function name", { exact: true }).fill("Mehndi");
  await expect(page.frameLocator("iframe").locator("body")).toContainText("Mehndi");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "customize-functions");
  await page.getByRole("button", { name: "Remove Mehndi", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(removeButtons).toHaveCount(initialCount + 1);
  await page.getByRole("button", { name: "Remove Mehndi", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove function", exact: true }).click();
  await expect(removeButtons).toHaveCount(initialCount);
  await expect(page.frameLocator("iframe").locator("body")).not.toContainText("Mehndi");
});

test("theme choices are keyboard accessible and update the live preview", async ({ page }, testInfo) => {
  await page.goto("/customize?theme=floral");
  await page.getByRole("button", { name: "Design", exact: true }).click();
  const theme = page.getByRole("button", { name: "Midnight Mehfil", exact: true });
  await theme.focus();
  await expect(theme).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(theme).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved on this device.", { exact: false })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(page.getByRole("button", { name: "Midnight Mehfil", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("region", { name: "Live invitation preview" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "customize-design");
  if ((page.viewportSize()?.width ?? 1440) < 700) {
    await page.getByRole("button", { name: "Preview invitation", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Live invitation preview", exact: true });
    await expect(dialog).toBeInViewport();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await page.screenshot({ path: `artifacts/screenshots/customize-live-preview-${testInfo.project.name}.png` });
    await dialog.getByRole("button", { name: "Back to editing", exact: true }).click();
    await expect(page.getByRole("button", { name: "Preview invitation", exact: true })).toBeVisible();
  }
});

test("anonymous visitors cannot open an event's owner-only editor", async ({ page }) => {
  await page.goto("/customize?event=00000000-0000-4000-a000-000000000001");
  await expect(page).toHaveURL(/\/(login|setup)(?:\?|$)/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("account navigation preserves the unsaved local invitation", async ({ page }) => {
  await page.goto("/customize?theme=lotus");
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await page.getByLabel("First name", { exact: true }).fill("Preserved Simran");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const login = page.getByRole("link", { name: "Already have an account? Sign in", exact: true });
  if (await login.count()) await login.click();
  else await page.getByRole("link", { name: "Connect your installation", exact: true }).click();
  await expect(page).toHaveURL(/\/(login|setup)(?:\?|$)/);
  await page.goto("/customize");
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Preserved Simran");
});
