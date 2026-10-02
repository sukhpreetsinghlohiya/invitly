import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const themes = ["royal", "modern", "floral", "mehfil", "kesar", "lotus", "pichwai", "ocean", "champagne", "sindoor"] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test("homepage explains the product and opens a real invitation", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Made by Sukhpreet", { exact: false })).toBeVisible();
  for (const theme of ["royal", "modern", "floral"]) {
    await expect(page.locator(`a[href="/demo?theme=${theme}"]`).first()).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);
  await mkdir("artifacts/screenshots", { recursive: true });
  await page.screenshot({ path: `artifacts/screenshots/homepage-${testInfo.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `artifacts/screenshots/homepage-${testInfo.project.name}-viewport.png` });
  await page.locator('a[href="/demo"]').first().click();
  await expect(page).toHaveURL(/\/demo/);
  await expect(page.getByText("Aanya", { exact: false }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

for (const theme of themes) {
  test(`${theme} invitation is complete and fits the viewport`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/demo?theme=${theme}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const event of ["Haldi", "Sangeet", "Wedding", "Reception"]) {
      await expect(page.getByRole("heading", { name: event, exact: true })).toBeVisible();
    }
    const directions = page.locator('a[href*="google.com/maps"], a[href*="maps.google"]');
    expect(await directions.count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator(".countdown-number").first()).toHaveText(/^\d+$/);
    await expectNoHorizontalOverflow(page);
    expect(await page.locator("audio[autoplay], video[autoplay]").count()).toBe(0);
    await mkdir("artifacts/screenshots", { recursive: true });
    await page.screenshot({ path: `artifacts/screenshots/${theme}-${testInfo.project.name}.png`, fullPage: true });
    await page.screenshot({ path: `artifacts/screenshots/${theme}-${testInfo.project.name}-viewport.png` });
    expect(errors).toEqual([]);
  });
}

test("missing backend credentials have a useful setup path", async ({ page }) => {
  await page.goto("/setup");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(".env.local", { exact: true })).toBeVisible();
  await expect(page.getByText("NEXT_PUBLIC_SUPABASE_URL", { exact: true })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("demo RSVP persists, can be edited, and updates stay explicitly simulated", async ({ page }) => {
  await page.goto("/demo?theme=royal");
  await page.getByLabel("Your name").fill("Simran Singh");
  await page.getByLabel("Guests, including you").selectOption("3");
  await page.getByRole("button", { name: "Save demo RSVP" }).click();
  await expect(page.getByRole("heading", { name: "We saved your yes, Simran Singh!" })).toBeVisible();
  await expect(page.getByText("3 guests, including you. Saved on this device only.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "We saved your yes, Simran Singh!" })).toBeVisible();
  await page.getByRole("button", { name: "Edit my response" }).click();
  await page.getByLabel("Unable to attend").check();
  await page.getByRole("button", { name: "Save demo RSVP" }).click();
  await expect(page.getByRole("heading", { name: "Thank you, Simran Singh." })).toBeVisible();
  await page.getByRole("button", { name: "Simulate a live update" }).click();
  await expect(page.getByText("Just now · Simulated update")).toBeVisible();
  await page.getByRole("button", { name: "Reset demo update" }).click();
  await expect(page.getByText("Just now · Simulated update")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("music only starts after a guest chooses play and can be stopped", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    Object.defineProperty(window, "__invitlyAudioContexts", { value: 0, writable: true });
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        const counter = window as unknown as { __invitlyAudioContexts: number };
        counter.__invitlyAudioContexts += 1;
      }
    };
  });
  await page.goto("/demo");
  const audioContexts = () => page.evaluate(() => (window as unknown as { __invitlyAudioContexts: number }).__invitlyAudioContexts);
  expect(await audioContexts()).toBe(0);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toBeVisible();
  expect(await audioContexts()).toBe(1);
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("sharing copies the current theme link and offers a manual fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => { (window as unknown as { copiedInvitation: string }).copiedInvitation = value; } },
    });
  });
  await page.goto("/demo?theme=mehfil");
  await page.getByRole("button", { name: "Share invitation" }).click();
  await expect(page.getByText("Invitation link copied.")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copiedInvitation: string }).copiedInvitation)).toBe(page.url());
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("Clipboard unavailable"); } } });
  });
  await page.getByRole("button", { name: "Share invitation" }).click();
  await expect(page.getByLabel("Invitation link", { exact: true })).toHaveValue(page.url());
  await expectNoHorizontalOverflow(page);
});

test("unauthenticated dashboard requests go to login or backend setup", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/(login|setup)(?:\?|$)/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("authentication entry points render useful pages without credentials", async ({ page }) => {
  for (const route of ["/signup", "/forgot-password", "/reset-password"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test.describe("server-rendered invitation", () => {
  test.use({ javaScriptEnabled: false });
  test("keeps the schedule and directions available before JavaScript loads", async ({ page }) => {
    await page.goto("/demo?theme=royal");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const event of ["Haldi", "Sangeet", "Wedding", "Reception"]) {
      await expect(page.getByRole("heading", { name: event, exact: true })).toBeVisible();
    }
    expect(await page.locator('a[href*="google.com/maps"]').count()).toBe(4);
    await expectNoHorizontalOverflow(page);
  });
});


test("real published invitation: opening, readable schedule, responsive photo and keyboard gallery", async ({ page }, testInfo) => {
  test.skip(process.env.INVITLY_INTEGRATION !== "1", "Local published fixture required");
  await page.goto('/i/invitly-local-preview');
  await expect(page.getByRole('navigation',{name:'Quick invitation details'}).getByRole('link',{name:'RSVP',exact:true})).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:`artifacts/screenshots/published-opening-${testInfo.project.name}.png`});
  await page.getByRole('button',{name:'Open invitation',exact:true}).click();
  const cover = page.locator('#invitation');
  await expect(cover).toBeFocused();
  await expect(cover).toBeInViewport();
  await page.screenshot({path:`artifacts/screenshots/published-cover-${testInfo.project.name}.png`});
  const hero = page.locator('#portrait');
  await hero.scrollIntoViewIfNeeded();
  await expect.poll(()=>hero.getByRole('img').evaluate(image=>(image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await hero.getByRole('img').evaluate(image=>(image as HTMLImageElement).currentSrc)).toMatch(/\?w=(320|640|960|1600)$/);
  await page.screenshot({path:`artifacts/screenshots/published-portrait-${testInfo.project.name}.png`});
  await page.getByRole('navigation',{name:'Invitation sections'}).getByRole('link',{name:'Schedule & directions',exact:true}).click();
  await page.screenshot({path:`artifacts/screenshots/published-schedule-${testInfo.project.name}.png`});
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button',{name:/^View photo 1:/}).click();
  await expect(page.getByRole('dialog',{name:'Invitation photo gallery'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'Invitation photo gallery'})).not.toBeVisible();
});

test("personal guest RSVP fits the viewport and keeps its submit control reachable", async ({ page }, testInfo) => {
  test.skip(!process.env.LIGHTHOUSE_GUEST_PATH, 'Requires the isolated local guest fixture');
  await page.goto(`${process.env.LIGHTHOUSE_GUEST_PATH}#rsvp`);
  const form = page.locator('.rsvp-form');
  await expect(form.getByRole('combobox',{name:'Your response',exact:true})).toBeVisible();
  await expect(form.getByRole('button',{name:'Send RSVP',exact:true})).toBeVisible();
  expect((await form.getByRole('button',{name:'Send RSVP',exact:true}).boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:`artifacts/screenshots/guest-rsvp-${testInfo.project.name}.png`});
});
