import { expect, test } from "@playwright/test";
import { themes } from "../src/data/themes";

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

test("a closer look browses all designs without duplicate artwork IDs and restores keyboard focus", async ({ page }, info) => {
  test.setTimeout(60000);
  await page.goto('/templates');
  const opener = page.getByRole('link', { name: 'Preview Royal Indian invitation', exact: true });
  await opener.focus();
  await opener.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close design preview', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  const focus = await dialog.evaluate(element => ({ inDialog: element.contains(document.activeElement), pageFocused: document.hasFocus() }));
  // A native desktop dialog can send Shift+Tab to browser chrome. It must
  // never focus an underlying page control, and Tab must return to the modal.
  expect(focus.inDialog || !focus.pageFocused, 'Background page controls remain inert').toBe(true);
  if (!focus.pageFocused) {
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close design preview', exact: true })).toBeFocused();
  }
  for (const [index, theme] of themes.entries()) {
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(theme.name);
    await expect(page.locator(`[data-illustrated-cover="${theme.id}"]`)).toHaveCount(1);
    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('svg[id], svg [id]')].map(node => node.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(duplicateIds, `${theme.name}: artwork IDs stay unique when moved into the modal`).toEqual([]);
    await expect(dialog.getByRole('link', { name: 'Use this design', exact: true })).toHaveAttribute('href', new RegExp(`theme=${theme.id}&occasion=wedding`));
    if (index === 0) await expect(dialog.getByRole('button', { name: 'Previous design', exact: true })).toBeDisabled();
    if (index < themes.length - 1) await dialog.getByRole('button', { name: 'Next design', exact: true }).click();
  }
  await expect(dialog.getByRole('button', { name: 'Next design', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Previous design', exact: true }).click();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Champagne Hour');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: info.outputPath('gallery-design-preview.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('[data-illustrated-cover]')).toHaveCount(10);
});

test("favourites persist and removing the last saved design recovers a usable empty state", async ({ page }) => {
  await page.goto('/templates');
  await page.getByRole('button', { name: 'Save Royal Indian to favourites', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove Royal Indian from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove Royal Indian from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^Favourites/ }).click();
  await expect(page.locator('article.collection-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Preview Royal Indian', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Royal Indian', exact: true });
  await dialog.getByRole('button', { name: 'Saved to favourites', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Save to favourites', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('searchbox', { name: 'Find a design', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Keep the ones you love.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explore designs', exact: true }).click();
  await expect(page.locator('article.collection-card')).toHaveCount(10);
  await expect(page.getByRole('button', { name: 'Save Royal Indian to favourites', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test("festival gallery previews retain the chosen celebration in demo and editor links", async ({ page }) => {
  await page.goto('/templates?occasion=festival&festival=diwali');
  await expect(page.locator('article.collection-card')).toHaveCount(3);
  await page.getByRole('link', { name: 'Preview The Festival Letter', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The Festival Letter', exact: true });
  for (const name of ['Use this design', 'Open live demo']) {
    const destination = new URL((await dialog.getByRole('link', { name, exact: true }).getAttribute('href'))!, page.url());
    expect(destination.searchParams.get('occasion')).toBe('festival');
    expect(destination.searchParams.get('festival')).toBe('diwali');
    expect(destination.searchParams.get('theme')).toBe('royal');
  }
  await dialog.getByRole('link', { name: 'Open live demo', exact: true }).click();
  await expect(page.locator('#invitation').getByRole('heading', { level: 1 })).toHaveText('Diwali together');
  await expect(page.locator('[data-invitation-root]')).not.toContainText(/Aanya|Kabir|bride|groom/i);
});
