import { expect, test } from "@playwright/test";

test("music settings stay out of the invitation until requested and can be dismissed by keyboard", async ({ page }) => {
  await page.goto("/demo?theme=royal");
  await page.getByRole("button", { name: "Open invitation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toBeVisible();
  const settings = page.getByRole("button", { name: "Music settings", exact: true });
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("slider", { name: "Volume", exact: true })).not.toBeVisible();
  await settings.click();
  const volume = page.getByRole("slider", { name: "Volume", exact: true });
  await expect(volume).toBeVisible();
  await volume.fill("0.25");
  expect(await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.volume)).toBe(.25);
  await volume.press("Escape");
  await expect(settings).toBeFocused();
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(volume).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toHaveAttribute("aria-pressed", "true");
  await settings.click();
  await page.locator("#invitation").click({ position: { x: 10, y: 10 } });
  await expect(volume).not.toBeVisible();
});

test("changing a demo design keeps its occasion and tradition and locks stale customization links", async ({ page }) => {
  await page.goto("/demo?theme=lotus&occasion=engagement&tradition=neutral");
  const select = page.getByRole("combobox", { name: "YOU’RE PREVIEWING", exact: true });
  const customize = page.locator("header").first().getByRole("link", { name: "Make it yours" });
  let release: (() => void) | undefined;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/demo?**", async route => {
    if (new URL(route.request().url()).searchParams.get("theme") === "floral") await waiting;
    await route.continue();
  });
  await select.selectOption("floral");
  await expect(select).toBeDisabled();
  await expect(customize).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("status").filter({ hasText: "Opening your next design" })).toBeVisible();
  release?.();
  await expect(page).toHaveURL(/theme=floral.*occasion=engagement.*tradition=neutral/);
  await expect(select).toBeEnabled();
  await expect(customize).toHaveAttribute("href", "/customize?theme=floral&occasion=engagement&tradition=neutral");
  await expect(customize).not.toHaveAttribute("aria-disabled");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
