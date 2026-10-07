import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { themes } from "../src/data/themes";

test("selected tradition emblems fit every wedding card and neutral stays unmarked", async ({ page }, info) => {
  test.setTimeout(120000);
  await mkdir("artifacts/tradition-review", { recursive: true });
  for (const theme of themes) {
    await page.goto(`/demo?theme=${theme.id}&tradition=hindu`);
    const open = page.getByRole("button", { name: "Open invitation", exact: true });
    if (await open.isVisible()) await open.click();
    const symbol = page.locator('[data-tradition-symbol="hindu"]');
    await expect(symbol).toBeVisible();
    await expect(symbol).toHaveAttribute("aria-label", "Om");
    const inside = await symbol.evaluate(element => {
      const mark = element.getBoundingClientRect();
      const area = element.closest('[data-cover-reading-area]')!.getBoundingClientRect();
      return mark.left >= area.left && mark.right <= area.right && mark.top >= area.top && mark.bottom <= area.bottom;
    });
    expect(inside, theme.id).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.locator('[data-illustrated-cover]').screenshot({ path: `artifacts/tradition-review/hindu-${theme.id}-${info.project.name}.png` });
  }
  for (const [tradition, label] of [["sikh", "Khanda"], ["muslim", "Crescent and star"], ["christian", "Christian cross"], ["jain", "Ahimsa hand"], ["buddhist", "Dharma wheel"], ["parsi", "Sacred flame"], ["interfaith", "Unity"]]) {
    await page.goto(`/demo?occasion=engagement&theme=lotus&tradition=${tradition}`);
    const symbol = page.locator(`[data-tradition-symbol="${tradition}"]`);
    await expect(symbol).toBeVisible();
    await expect(symbol).toHaveAttribute("aria-label", label);
    await page.locator('#invitation img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
    await page.locator('#invitation').screenshot({ path: `artifacts/tradition-review/${tradition}-${info.project.name}.png` });
  }
  for (const tradition of ["neutral", "other"]) {
    await page.goto(`/demo?theme=modern&tradition=${tradition}`);
    await expect(page.locator('[data-illustrated-cover]')).toBeVisible();
    await expect(page.locator('[data-tradition-symbol]')).toHaveCount(0);
  }
});

test("a host can hide the symbol, save, reload and restore it without changing tradition", async ({ page }) => {
  await page.goto('/customize?occasion=wedding&theme=modern&tradition=sikh');
  const tradition = page.getByRole("combobox", { name: /^Tradition or cultural style \(optional\)/ });
  const toggle = page.getByRole("checkbox", { name: /^Show tradition symbol/ });
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  await expect(tradition).toHaveValue("sikh");
  await expect(toggle).toBeChecked();
  await expect(frame.locator('[data-tradition-symbol="sikh"]')).toHaveCount(1);
  await toggle.uncheck();
  await expect(frame.locator('[data-tradition-symbol]')).toHaveCount(0);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await expect(tradition).toHaveValue("sikh");
  await expect(toggle).not.toBeChecked();
  await expect(frame.locator('[data-tradition-symbol]')).toHaveCount(0);
  await toggle.check();
  await expect(frame.locator('[data-tradition-symbol="sikh"]')).toHaveCount(1);
  await tradition.selectOption("neutral");
  await expect(toggle).toHaveCount(0);
  await expect(frame.locator('[data-tradition-symbol]')).toHaveCount(0);
});

test("gallery cards show the chosen symbol and preserve it in demo and editor links", async ({ page }) => {
  await page.goto('/templates?tradition=sikh');
  await expect(page.locator('.collection-card [data-tradition-symbol="sikh"]')).toHaveCount(10);
  await expect(page.getByRole('link', { name: 'Preview Royal Indian', exact: true })).toHaveAttribute('href', /tradition=sikh/);
  await expect(page.getByRole('link', { name: 'Customize Royal Indian', exact: true })).toHaveAttribute('href', /tradition=sikh/);
  await page.getByRole('combobox', { name: 'Tradition (optional)', exact: true }).selectOption('neutral');
  await expect(page.locator('.collection-card [data-tradition-symbol]')).toHaveCount(0);
});
