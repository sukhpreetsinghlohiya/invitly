import { mkdir, writeFile } from "node:fs/promises";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import sharp from "sharp";

// Real local Supabase integration only. The runner supplies confirmed, disposable
// accounts; no credentials, auth traces, or login screenshots are written here.
test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe.configure({ mode: "serial" });

test.describe("authenticated host and guest publication smoke", () => {
  test.skip(process.env.INVITLY_INTEGRATION !== "1", "Requires the explicitly enabled local integration environment.");
  let hostContext: BrowserContext;
  let otherHostContext: BrowserContext;
  let guestContext: BrowserContext;
  let host: Page;
  let otherHost: Page;
  let guest: Page;
  let eventId = "";
  let mediaId = "";
  let completed = false;
  const slug = `smoke-${Date.now().toString(36)}`;
  const photographAlt = `Our original test photograph ${slug}`;
  const latency: { operation: string; milliseconds: number; transport: string | null }[] = [];
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";

  test.beforeAll(async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-360", "The integration journey runs once at the guest phone width.");
    for (const name of ["TEST_HOST_A_EMAIL", "TEST_HOST_A_PASSWORD", "TEST_HOST_B_EMAIL", "TEST_HOST_B_PASSWORD"]) {
      if (!process.env[name]) throw new Error(`The local integration runner must provide ${name}.`);
    }
    const options = { baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" as const };
    hostContext = await browser.newContext(options);
    otherHostContext = await browser.newContext(options);
    guestContext = await browser.newContext(options);
    host = await hostContext.newPage();
    otherHost = await otherHostContext.newPage();
    guest = await guestContext.newPage();
    for (const page of [host, otherHost, guest]) page.setDefaultTimeout(10000);
  });

  test.afterAll(async () => {
    if (hostContext) {
      await mkdir("artifacts/integration", { recursive: true });
      await writeFile("artifacts/integration/announcement-latency.json", JSON.stringify({ measuredAt: new Date().toISOString(), completed, samples: latency }, null, 2));
    }
    await Promise.all([hostContext?.close(), otherHostContext?.close(), guestContext?.close()]);
  });

  async function signIn(page: Page, account: "A" | "B") {
    await page.goto("/login");
    const email = page.getByRole("textbox", { name: "Email address", exact: true });
    const password = page.getByLabel(/^Password/);
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await email.fill(process.env[`TEST_HOST_${account}_EMAIL`]!);
    await password.fill(process.env[`TEST_HOST_${account}_PASSWORD`]!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20000 });
  }

  async function saveDraft() {
    await host.getByRole("button", { name: "Save draft", exact: true }).click();
    try { await expect(host.locator(".editor-feedback .form-success")).toBeVisible({ timeout: 20000 }); }
    catch { throw new Error(`Draft save failed: ${await host.locator(".editor-feedback").innerText()}`); }
  }

  async function recordLatency(operation: string, started: number) {
    const milliseconds = Date.now() - started;
    const transport = await guest.locator("[data-live-transport]").getAttribute("data-live-transport");
    expect(["realtime", "polling", "fallback"]).toContain(transport);
    latency.push({ operation, milliseconds, transport });
  }

  test("host saves a zoned invitation with functions and a photo, reloads it, and opens its full private preview", async () => {
    test.setTimeout(150000);
    await signIn(host, "A");
    await host.goto("/customize?theme=mehfil");
    await host.getByRole("button", { name: "Details", exact: true }).click();
    await host.getByLabel("First name", { exact: true }).fill("SimranTest");
    await host.getByLabel("Second name", { exact: true }).fill("ArjunTest");
    await host.getByLabel("City", { exact: true }).fill("New York, NY");
    const unsavedWarning = host.waitForEvent("dialog");
    const leaving = host.getByRole("link", { name: "Invitly home", exact: true }).click();
    const warning = await unsavedWarning;
    expect(warning.message()).toContain("unsaved invitation changes");
    await warning.dismiss();
    await leaving;
    await expect(host.getByLabel("First name", { exact: true })).toHaveValue("SimranTest");
    const indiaWallTime = await host.getByLabel("Wedding date and time (Asia/Kolkata)", { exact: true }).inputValue();
    await host.getByLabel(/^Event time zone/).selectOption("America/New_York");
    await expect(host.getByLabel("Wedding date and time (America/New_York)", { exact: true })).toHaveValue(indiaWallTime);
    await host.getByLabel("Wedding date and time (America/New_York)", { exact: true }).fill("2027-02-14T18:00");
    await host.getByRole("button", { name: "Functions", exact: true }).click();
    await host.getByRole("button", { name: "Add function", exact: true }).click();
    const brunch = host.locator("fieldset.editor-function").last();
    await brunch.getByLabel("Function name", { exact: true }).fill("Farewell brunch");
    await brunch.getByLabel("Date and time (America/New_York)", { exact: true }).fill("2027-02-15T11:00");
    await brunch.getByLabel("Venue name", { exact: true }).fill("Hudson Garden");
    await brunch.getByLabel(/^Venue address/).fill("Central Park, New York, NY");
    await host.getByRole("button", { name: "Share", exact: true }).click();
    await host.getByRole("textbox", { name: /^Invitation link/ }).fill(slug);
    await saveDraft();
    await expect(host).toHaveURL(/\/customize\?event=[0-9a-f-]{36}$/);
    await expect(host.getByRole("button", { name: "Share", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(host.locator(".editor-feedback .form-success")).toBeVisible();
    eventId = new URL(host.url()).searchParams.get("event") || "";
    expect(eventId).toMatch(/^[0-9a-f-]{36}$/);
    await host.reload();
    await host.getByRole("button", { name: "Details", exact: true }).click();
    await expect(host.getByLabel("First name", { exact: true })).toHaveValue("SimranTest");
    await expect(host.getByLabel(/^Event time zone/)).toHaveValue("America/New_York");
    await expect(host.getByLabel("Wedding date and time (America/New_York)", { exact: true })).toHaveValue("2027-02-14T18:00");
    await host.getByRole("button", { name: "Functions", exact: true }).click();
    await expect(host.locator("fieldset.editor-function")).toHaveCount(5);
    await expect(host.locator("fieldset.editor-function").last().getByLabel("Date and time (America/New_York)", { exact: true })).toHaveValue("2027-02-15T11:00");
    await host.getByRole("button", { name: "Photos", exact: true }).click();
    const png = await sharp({ create: { width: 96, height: 64, channels: 3, background: { r: 176, g: 130, b: 72 } } }).png().toBuffer();
    await host.locator('input[name="file"]').setInputFiles({ name: "original-smoke-photo.png", mimeType: "image/png", buffer: png });
    await host.getByLabel(/^Photo description/).fill(photographAlt);
    await host.getByRole("button", { name: "Upload photo", exact: true }).click();
    const image = host.getByRole("img", { name: photographAlt, exact: true });
    await expect(image).toBeVisible({ timeout: 20000 });
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const source = await image.getAttribute("src");
    expect(source).toMatch(new RegExp(`/dashboard/events/${eventId}/media/[0-9a-f-]{36}`));
    mediaId = source!.split("/").at(-1)!;
    await host.getByRole("button", { name: "Preview invitation", exact: true }).click();
    const popup = host.waitForEvent("popup");
    await host.getByRole("link", { name: "Open full invitation preview", exact: true }).click();
    const preview = await popup;
    await expect(preview.getByRole("heading", { name: /SimranTest.*ArjunTest/, level: 1 })).toBeVisible();
    await expect(preview.getByRole("heading", { name: "Farewell brunch", exact: true })).toBeVisible();
    await expect(preview.getByRole("img", { name: photographAlt, exact: true })).toBeVisible();
    const directions = await preview.locator('a[href*="google.com/maps"]').evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
    expect(directions.some((url) => new URL(url).searchParams.get("query") === "Central Park, New York, NY")).toBe(true);
    await preview.close();
    await host.getByRole("button", { name: "Back to editing", exact: true }).click();
    expect(await host.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("another signed-in host cannot see the invitation, edit it, preview it, or fetch its private photo", async () => {
    test.setTimeout(60000);
    await signIn(otherHost, "B");
    await expect(otherHost.locator(`a[href="/customize?event=${eventId}"]`)).toHaveCount(0);
    expect((await otherHost.goto(`/customize?event=${eventId}`))?.status()).toBe(404);
    // The dashboard loading boundary can start a streamed HTTP 200 before
    // Next renders notFound. Verify the denial and absence of private content.
    await otherHost.goto(`/dashboard/events/${eventId}/preview`);
    await expect(otherHost.getByRole("heading", { name: "This invitation hasn't arrived.", exact: true })).toBeVisible();
    await expect(otherHost.getByText("SimranTest", { exact: false })).toHaveCount(0);
    const privatePhoto = await otherHostContext.request.get(`/dashboard/events/${eventId}/media/${mediaId}`);
    expect(privatePhoto.status()).toBe(404);
    expect((await guest.goto(`/i/${slug}`))?.status()).toBe(404);
  });

  test("publishing opens the guest link and saved edits appear without redeploying", async () => {
    test.setTimeout(90000);
    await host.getByRole("button", { name: "Share", exact: true }).click();
    await host.locator(".editor-publish").click();
    await expect(host.getByLabel("Published invitation URL", { exact: true })).toHaveValue(new RegExp(`/i/${slug}$`), { timeout: 20000 });
    expect((await guest.goto(`/i/${slug}`))?.status()).toBe(200);
    await expect(guest.getByRole("heading", { name: /SimranTest.*ArjunTest/, level: 1 })).toBeVisible();
    const publicPhoto = guest.getByRole("img", { name: photographAlt, exact: true });
    await publicPhoto.scrollIntoViewIfNeeded();
    await expect(publicPhoto).toBeVisible();
    await expect.poll(() => publicPhoto.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await host.getByRole("button", { name: "Details", exact: true }).click();
    await host.getByLabel("First name", { exact: true }).fill("SimranUpdated");
    await saveDraft();
    await guest.reload();
    await expect(guest.getByRole("heading", { name: /SimranUpdated.*ArjunTest/, level: 1 })).toBeVisible();
    expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("a private guest sees only their group's functions, saves and updates an RSVP, and loses access after link rotation", async () => {
    test.setTimeout(120000);
    await host.goto(`/dashboard/events/${eventId}/guests`);
    await expect(host.getByRole("combobox", { name: /^Functions on the public link/ })).toBeVisible({ timeout: 10000 }).catch(async () => { throw new Error((await host.locator("body").innerText()).replace(/[a-f0-9]{64}/g, "[token]").replace(/[^\s@]+@[^\s@]+/g, "[email]")); });
    await host.getByRole("combobox", { name: /^Functions on the public link/ }).selectOption("none");
    await host.getByRole("button", { name: "Save public visibility", exact: true }).click();
    await expect(host.getByText("The public invitation now hides the function schedule. Private group links still show their assigned functions.", { exact: true })).toBeVisible();
    await guest.goto(`/i/${slug}`);
    await expect(guest.getByRole("heading", { name: /SimranUpdated.*ArjunTest/, level: 1 })).toBeVisible();
    await expect(guest.getByRole("heading", { name: "Farewell brunch", exact: true })).toHaveCount(0);
    await expect(guest.getByRole("heading", { name: "Haldi", exact: true })).toHaveCount(0);
    await host.getByLabel("Group name", { exact: true }).fill("Brunch guests");
    await host.getByRole("checkbox", { name: "All functions, including future additions", exact: true }).uncheck();
    await host.getByRole("checkbox", { name: "Farewell brunch", exact: true }).check();
    await host.getByRole("button", { name: "Create group", exact: true }).click();
    await expect(host.getByText("Guest group saved. Its private links now show the selected functions.", { exact: true })).toBeVisible();
    const guestName = `Gurleen ${slug}`;
    await host.getByLabel("Guest name", { exact: true }).fill(guestName);
    await host.getByRole("combobox", { name: /^Guest group/ }).selectOption({ label: "Brunch guests" });
    await host.getByLabel("Maximum party size", { exact: true }).fill("2");
    await host.getByRole("button", { name: "Add guest & create link", exact: true }).click();
    const freshLink = host.getByRole("textbox", { name: guestName, exact: true });
    await expect(freshLink).toBeVisible();
    const privatePath = new URL(await freshLink.inputValue()).pathname;
    expect(/^\/g\/[a-f0-9]{64}$/.test(privatePath)).toBe(true);
    expect((await guest.goto(privatePath))?.status()).toBe(200);
    await expect(guest.getByRole("heading", { name: "Farewell brunch", exact: true })).toBeVisible();
    await expect(guest.getByRole("heading", { name: "Haldi", exact: true })).toHaveCount(0);
    await guest.getByRole("combobox", { name: /^Your response/ }).selectOption("attending");
    await guest.getByLabel(/^People in your party, including you/).fill("2");
    await guest.getByLabel("A note for the hosts (optional)", { exact: true }).fill("One vegetarian meal, please.");
    await guest.getByRole("button", { name: "Send RSVP", exact: true }).click();
    await expect(guest.getByText("Your RSVP has been sent to the hosts. You can update it here whenever your plans change.", { exact: true })).toBeVisible();
    const firstResponseAt = Date.now();
    await host.reload();
    let row = host.getByRole("row").filter({ hasText: guestName });
    await expect(row).toContainText("attending");
    await expect(row).toContainText("2 / 2");
    await expect(row).toContainText("One vegetarian meal, please.");
    await guest.reload();
    await expect(guest.getByRole("combobox", { name: /^Your response/ })).toHaveValue("attending");
    // Respect the real server's ten-second RSVP update limit.
    const remaining = Math.max(0, 11000 - (Date.now() - firstResponseAt));
    if (remaining) await guest.waitForTimeout(remaining);
    await guest.getByRole("combobox", { name: /^Your response/ }).selectOption("declined");
    await guest.getByRole("button", { name: "Update RSVP", exact: true }).click();
    await expect(guest.getByText("Your RSVP has been sent to the hosts. You can update it here whenever your plans change.", { exact: true })).toBeVisible();
    await host.reload();
    row = host.getByRole("row").filter({ hasText: guestName });
    await expect(row).toContainText("declined");
    await expect(row).toContainText("0 / 2");
    host.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Replace link", exact: true }).click();
    await expect(host.getByText("A new private link is ready. The old link no longer works.", { exact: true })).toBeVisible();
    expect((await guest.goto(privatePath))?.status()).toBe(404);
    const replacement = new URL(await host.getByRole("textbox", { name: guestName, exact: true }).inputValue()).pathname;
    expect(replacement !== privatePath).toBe(true);
    expect((await guest.goto(replacement))?.status()).toBe(200);
    await expect(guest.getByRole("combobox", { name: /^Your response/ })).toHaveValue("declined");
    await guest.goto(`/i/${slug}`);
  });

  test("host announcement post, edit, pin and removal reach a separate guest session with measured latency", async () => {
    test.setTimeout(150000);
    await host.goto(`/dashboard/events/${eventId}/announcements`);
    const text = `Meet us in the garden for the welcome toast. ${slug}`;
    await host.getByLabel("Message for your guests", { exact: true }).fill(text);
    let started = Date.now();
    await host.getByRole("button", { name: "Post announcement", exact: true }).click();
    await expect(guest.getByText(text, { exact: true })).toBeVisible({ timeout: 25000 });
    await recordLatency("post", started);
    let card = host.locator("article.announcement-card").filter({ hasText: text });
    await card.getByRole("button", { name: "Edit announcement", exact: true }).click();
    const changed = `The welcome toast starts at 6:30 pm in the garden. ${slug}`;
    await host.getByLabel("Edit announcement message", { exact: true }).fill(changed);
    started = Date.now();
    await host.getByRole("button", { name: "Save announcement", exact: true }).click();
    await expect(guest.getByText(changed, { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(guest.getByText(text, { exact: true })).toHaveCount(0);
    await recordLatency("edit", started);
    card = host.locator("article.announcement-card").filter({ hasText: changed });
    started = Date.now();
    await card.getByRole("button", { name: "Pin announcement", exact: true }).click();
    await expect(guest.locator('[data-pinned="true"]').filter({ hasText: changed })).toBeVisible({ timeout: 25000 });
    await recordLatency("pin", started);
    started = Date.now();
    host.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Remove announcement", exact: true }).click();
    await expect(guest.getByText(changed, { exact: true })).toHaveCount(0, { timeout: 25000 });
    await recordLatency("remove", started);
    const secretDraft = `Host-only announcement draft ${slug}`;
    await host.getByLabel("Message for your guests", { exact: true }).fill(secretDraft);
    await host.getByRole("checkbox", { name: /^Publish for guests/ }).uncheck();
    await host.getByRole("button", { name: "Save announcement draft", exact: true }).click();
    await expect(host.locator("article.announcement-card").filter({ hasText: secretDraft })).toContainText("Private draft");
    await guest.reload();
    await expect(guest.getByText(secretDraft, { exact: true })).toHaveCount(0);
  });

  test("unpublishing hides the guest page and public photo while preserving the owner's draft", async () => {
    test.setTimeout(60000);
    await host.goto(`/customize?event=${eventId}`);
    await host.getByRole("button", { name: "Share", exact: true }).click();
    await host.getByRole("button", { name: "Make invitation private", exact: true }).click();
    await expect(host.locator(".editor-feedback")).toContainText("Your invitation is private again");
    expect((await guest.goto(`/i/${slug}`))?.status()).toBe(404);
    const response = await guestContext.request.get(`/media/${mediaId}`);
    expect(response.status()).toBe(404);
    await host.goto("/dashboard");
    const saved = host.locator("article.dashboard-event-card").filter({ hasText: "SimranUpdated" });
    await expect(saved).toContainText("Unpublished");
    await expect(saved.getByRole("link", { name: "Edit invitation", exact: true })).toHaveAttribute("href", `/customize?event=${eventId}`);
    completed = true;
  });
});
