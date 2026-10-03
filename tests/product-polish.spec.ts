import { expect, test } from "@playwright/test";

test("public indexing contains only marketing content and published journal pages", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain("/templates?occasion=engagement");
  expect(xml).toContain("/blog/");
  expect(xml).not.toMatch(/<loc>[^<]*\/(?:g|i|invite|dashboard|preview|customize|auth)(?:\/|<)/);
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /g/");
  expect(await robots.text()).toContain("Sitemap:");
  const privatePage = await request.get("/g/invalid-private-token");
  expect(privatePage.headers()["x-robots-tag"]).toContain("noindex");
});

test("occasion metadata, legal links, and friendly not-found pages are usable", async ({ page, request }) => {
  await page.goto("/templates?occasion=engagement");
  await expect(page).toHaveTitle("Engagement invitation designs | Invitly");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/templates\?occasion=engagement$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/brand-image$/);
  await expect(page.getByRole("navigation", { name: "Privacy and terms" }).getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
  const image = await request.get("/brand-image");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
  await page.goto("/missing-invitly-page");
  await expect(page.getByRole("link", { name: "Back to Invitly" })).toBeVisible();
});

test("mobile navigation opens, closes with Escape, and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("debounced design search has a useful empty state and recovery", async ({ page }) => {
  await page.goto("/templates");
  const search = page.getByRole("searchbox");
  await search.fill("no-such-invitation-style");
  await expect(page.getByRole("heading", { name: "No matching designs yet." })).toBeVisible();
  await page.getByRole("button", { name: "Clear search and style" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".collection-card")).toHaveCount(10);
});

test("maps load by choice and event calendars show guest-local time", async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: "America/New_York", reducedMotion: "reduce" });
  const page = await context.newPage();
  const mapRequests: string[] = [];
  await page.route("https://www.google.com/maps**", route => { mapRequests.push(route.request().url()); return route.fulfill({ body: "Map preview", contentType: "text/html" }); });
  await page.goto("/demo?theme=royal");
  const open = page.getByRole("button", { name: "Open invitation", exact: true });
  if (await open.count()) await open.click();
  const first = page.locator('[data-local-event-time]').first();
  await expect(first).toContainText("America/New York");
  await expect(first).toContainText("13 Feb 2027");
  expect(mapRequests).toHaveLength(0);
  const load = page.getByRole("button", { name: "Show venue map for Haldi", exact: true });
  await load.click();
  await expect(page.getByTitle("Venue map for Haldi", { exact: true })).toBeVisible();
  await expect.poll(() => mapRequests.length).toBe(1);
  await page.getByRole("button", { name: "Close map for Haldi", exact: true }).click();
  await expect(page.getByTitle("Venue map for Haldi", { exact: true })).toHaveCount(0);
  const calendar = page.locator('[data-calendar-actions]').first();
  await calendar.locator("summary").click();
  const google = calendar.getByRole("link", { name: "Add Haldi to Google Calendar" });
  const href = new URL((await google.getAttribute("href"))!);
  expect(href.hostname).toBe("calendar.google.com");
  expect(href.searchParams.get("dates")).toBe("20270213T050000Z/20270213T070000Z");
  expect(href.href).not.toContain("/g/");
  await context.close();
});
