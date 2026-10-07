import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/visitor-welcome", route => route.fulfill({ json: { enabled: false } }));
});

test("colour and artwork searches have matching counts, a clear button and a full reset", async ({ page }) => {
  await page.goto("/templates");
  const input = page.getByRole("searchbox", { name: "Find a design", exact: true });
  const cards = page.locator("article.collection-card");
  const filters = page.getByRole("group", { name: "Filter invitation styles" });
  await input.fill("pink flowers");
  await expect(cards).toHaveCount(2);
  await expect(filters.getByRole("button", { name: "Floral", exact: true })).toHaveText("Floral2");
  await expect(filters.getByRole("button", { name: "Minimal", exact: true })).toHaveText("Minimal0");
  await input.fill("blue doves");
  await expect(cards).toHaveCount(1);
  await expect(cards.getByRole("heading")).toHaveText("By the Blue");
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(cards).toHaveCount(10);
  await input.fill("gold rings");
  await expect(cards).toHaveCount(1);
  await expect(cards.getByRole("heading")).toHaveText("Champagne Hour");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(cards).toHaveCount(10);
  await filters.getByRole("button", { name: "Minimal", exact: true }).click();
  await input.fill("blue doves");
  await expect(cards).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No matching designs yet." })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(filters.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(cards).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("changing tradition disables stale preview links until the selected artwork is ready", async ({ page }) => {
  await page.goto("/templates");
  const select = page.getByRole("combobox", { name: "Tradition (optional)", exact: true });
  let release: (() => void) | undefined;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/templates?**", async route => {
    if (new URL(route.request().url()).searchParams.get("tradition") === "sikh") await held;
    await route.continue();
  });
  await select.selectOption("sikh");
  try {
    await expect(select).toBeDisabled();
    await expect(page.getByRole("status").filter({ hasText: "Preparing your designs" })).toBeVisible();
    for (const label of ["Preview Royal Indian invitation", "Preview Royal Indian", "Customize Royal Indian"]) {
      const link = page.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("aria-disabled", "true");
      await expect(link).toHaveAttribute("tabindex", "-1");
    }
  } finally { release?.(); }
  await expect(select).toBeEnabled();
  const customize = page.getByRole("link", { name: "Customize Royal Indian", exact: true });
  await expect(customize).toHaveAttribute("href", /tradition=sikh/);
  await expect(customize).not.toHaveAttribute("aria-disabled");
  await expect(page.locator('.collection-card [data-tradition-symbol="sikh"]')).toHaveCount(10);
});

test("engagement search uses its own colours and artwork", async ({ page }) => {
  await page.goto("/templates?occasion=engagement");
  const input = page.getByRole("searchbox", { name: "Find a design", exact: true });
  await input.fill("pink flowers");
  await expect(page.locator("article.collection-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "The Promise Letter", exact: true })).toBeVisible();
  await input.fill("green rings");
  await expect(page.locator("article.collection-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Pressed Promises", exact: true })).toBeVisible();
});
