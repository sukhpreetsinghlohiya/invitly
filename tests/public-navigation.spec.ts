import { expect, test } from "@playwright/test";

test("collection changes cannot overwrite one another while the next collection loads", async ({ page }) => {
  await page.goto("/templates");
  const occasion = page.getByRole("combobox", { name: "Occasion", exact: true });
  const tradition = page.getByRole("combobox", { name: "Tradition (optional)", exact: true });
  let releaseNavigation!: () => void;
  const pendingNavigation = new Promise<void>(resolve => { releaseNavigation = resolve; });
  await page.route("**/templates?**", async route => {
    if (new URL(route.request().url()).searchParams.get("occasion") === "engagement") {
      await pendingNavigation;
    }
    await route.continue();
  });

  try {
    await occasion.selectOption("engagement");
    await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Preparing your designs" })).toBeVisible();
    await expect(occasion).toBeDisabled();
    await expect(tradition).toBeDisabled();
  } finally {
    releaseNavigation();
  }

  await expect(occasion).toHaveValue("engagement");
  await expect(occasion).toBeEnabled();
  await expect(tradition).toBeEnabled();
  await tradition.selectOption("sikh");
  await expect(tradition).toHaveValue("sikh");
  await expect(page).toHaveURL(/occasion=engagement&tradition=sikh/);
  await expect(occasion).toHaveValue("engagement");
  await expect(page.locator(".collection-card")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Customize The Promise Letter" })).toHaveAttribute("href", /occasion=engagement&tradition=sikh/);
});
