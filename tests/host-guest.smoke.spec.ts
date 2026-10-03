import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import sharp from "sharp";

// Real local Supabase integration only. Each suite creates its own disposable
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
  let currentGuestPath = "";
  let completed = false;
  let admin: SupabaseClient | undefined;
  const accounts: Partial<Record<"A" | "B", { id: string; email: string; password: string }>> = {};
  const slug = `smoke-${randomBytes(8).toString("hex")}`;
  const photographAlt = `Our original test photograph ${slug}`;
  const latency: { operation: string; milliseconds: number; transport: string | null }[] = [];
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";

  test.beforeAll(async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-360", "The integration journey runs once at the guest phone width.");
    const settings = JSON.parse(await readFile("artifacts/local-supabase.json", "utf8"));
    for (const url of [settings.API_URL, baseURL]) {
      if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw new Error("Host smoke fixtures are limited to the isolated local app and Supabase.");
    }
    admin = createClient(settings.API_URL, settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const account of ["A", "B"] as const) {
      const email = `host-smoke-${account.toLowerCase()}-${randomBytes(8).toString("hex")}@example.test`;
      const password = randomBytes(24).toString("base64url");
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Local smoke host ${account}` } });
      if (error || !data.user) throw new Error(`Could not create disposable local host ${account}.`);
      accounts[account] = { id: data.user.id, email, password };
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
    test.setTimeout(90000);
    const cleanupErrors: string[] = [];
    async function cleanup(label: string, action: () => Promise<void>) {
      try { await action(); } catch { cleanupErrors.push(label); }
    }
    // Close every context even when setup, a journey, or another cleanup fails.
    for (const context of [hostContext, otherHostContext, guestContext]) {
      if (context) await cleanup("browser context", () => context.close());
    }
    const client = admin;
    const ownerIds = Object.values(accounts).map((account) => account.id);
    if (client && ownerIds.length) {
      // Query by this run's fresh owners: the first save may have succeeded even
      // if the browser failed before recording its event URL.
      const eventIds = new Set(eventId ? [eventId] : []);
      await cleanup("discover this suite's invitations", async () => {
        const { data, error } = await client.from("events").select("id").in("owner_id", ownerIds);
        if (error) throw new Error("Event lookup failed.");
        for (const event of data || []) eventIds.add(event.id);
      });
      for (const id of eventIds) {
        await cleanup("remove this suite's uploaded photos", async () => {
          // Listing also catches an upload whose media-row insertion failed.
          const { data, error } = await client.storage.from("event-media").list(id, { limit: 100 });
          if (error) throw new Error("Photo lookup failed.");
          const paths = (data || []).filter((file) => file.id).map((file) => `${id}/${file.name}`);
          if (paths.length && (await client.storage.from("event-media").remove(paths)).error) throw new Error("Photo removal failed.");
        });
        await cleanup("remove this suite's media rows", async () => {
          if ((await client.from("media").delete().eq("event_id", id)).error) throw new Error("Media cleanup failed.");
        });
      }
      await cleanup("remove this suite's invitations", async () => {
        if ((await client.from("events").delete().in("owner_id", ownerIds)).error) throw new Error("Invitation cleanup failed.");
      });
      for (const id of ownerIds) {
        await cleanup("remove disposable local account", async () => {
          if ((await client.auth.admin.deleteUser(id)).error) throw new Error("Account cleanup failed.");
        });
      }
    }
    if (hostContext) await cleanup("write announcement measurements", async () => {
      await mkdir("artifacts/integration", { recursive: true });
      await writeFile("artifacts/integration/announcement-latency.json", JSON.stringify({ measuredAt: new Date().toISOString(), completed, samples: latency }, null, 2));
    });
    expect(cleanupErrors, "Every disposable fixture must be removed, including after a failed journey.").toEqual([]);
  });

  async function signIn(page: Page, account: "A" | "B") {
    await page.goto("/login");
    const email = page.getByRole("textbox", { name: "Email address", exact: true });
    const password = page.getByLabel(/^Password/);
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    const credentials = accounts[account];
    if (!credentials) throw new Error(`Disposable host ${account} was not prepared.`);
    await email.fill(credentials.email);
    await password.fill(credentials.password);
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

  function optimizedImagePath(source: string) {
    return `/_next/image?${new URLSearchParams({ url: source, w: "640", q: "75" })}`;
  }

  async function expectInvitationResources(path: string, available: boolean, visibleFunction = true) {
    for (const resource of ["calendar", "updates"] as const) {
      const response = await guestContext.request.get(`${path}/${resource}`).catch(() => {
        // Playwright's raw request error can include the private bearer URL.
        throw new Error(`The invitation ${resource} request could not complete.`);
      });
      expect(response.status(), `${resource} must respect the invitation's current access`).toBe(available ? 200 : 404);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(response.headers()["cache-control"]).toContain("private");
      if (path.startsWith("/g/")) expect(response.headers()["referrer-policy"]).toBe("no-referrer");
      if (resource === "calendar" && available) {
        expect(response.headers()["content-type"]).toContain("text/calendar");
        const calendar = await response.text();
        expect(calendar).toContain("BEGIN:VCALENDAR");
        expect(calendar.match(/BEGIN:VEVENT/g) || []).toHaveLength(visibleFunction ? 1 : 0);
        if (visibleFunction) expect(calendar).toContain("SUMMARY:Farewell brunch");
        else expect(calendar).not.toContain("Farewell brunch");
        expect(calendar).not.toContain("Haldi");
      } else if (resource === "updates") {
        const payload = await response.json();
        if (available) expect(Array.isArray(payload.updates)).toBe(true);
        else expect(payload).toEqual({ unavailable: true });
      }
    }
  }

  test("host saves a zoned invitation with functions and a photo, reloads it, and opens its full private preview", async () => {
    test.setTimeout(150000);
    await signIn(host, "A");
    await host.goto("/customize?theme=royal");
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
    const indiaWallTime = await host.getByLabel("Event date and time (Asia/Kolkata)", { exact: true }).inputValue();
    await host.getByLabel(/^Event time zone/).selectOption("America/New_York");
    await expect(host.getByLabel("Event date and time (America/New_York)", { exact: true })).toHaveValue(indiaWallTime);
    await host.getByLabel("Event date and time (America/New_York)", { exact: true }).fill("2027-02-14T18:00");
    await host.getByRole("button", { name: "Schedule", exact: true }).click();
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
    await expect(host.getByLabel("Event date and time (America/New_York)", { exact: true })).toHaveValue("2027-02-14T18:00");
    await host.getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(host.locator("fieldset.editor-function")).toHaveCount(1);
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
    const optimizedPrivatePhoto = await hostContext.request.get(optimizedImagePath(`/dashboard/events/${eventId}/media/${mediaId}`));
    expect(optimizedPrivatePhoto.status(), "Owner-only photos must not enter the shared image optimizer cache.").toBe(400);
    await host.getByRole("button", { name: "Preview invitation", exact: true }).click();
    const popup = host.waitForEvent("popup");
    await host.getByRole("link", { name: "Open full invitation preview", exact: true }).click();
    const preview = await popup;
    await expect(preview.getByRole("heading", { name: /SimranTest.*ArjunTest/, level: 1 })).toBeVisible();
    await expect(preview.getByRole("heading", { name: "Farewell brunch", exact: true })).toBeVisible();
    await expect(preview.getByRole("img", { name: photographAlt, exact: true }).first()).toBeVisible();
    const directions = await preview.locator('a[href*="google.com/maps"]').evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
    expect(directions.some((url) => new URL(url).searchParams.get("destination") === "Hudson Garden, Central Park, New York, NY")).toBe(true);
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
    const publicPhoto = guest.getByRole("img", { name: photographAlt, exact: true }).first();
    await publicPhoto.scrollIntoViewIfNeeded();
    await expect(publicPhoto).toBeVisible();
    await expect.poll(() => publicPhoto.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const optimizedPhoto = await guestContext.request.get(optimizedImagePath(`/media/${mediaId}`));
    expect(optimizedPhoto.status(), "Revocable invitation photos must bypass the shared image optimizer even while published.").toBe(400);
    const optimizedArtwork = await guestContext.request.get(optimizedImagePath("/images/marketing/marigold-branch.webp"));
    expect(optimizedArtwork.status(), "Public marketing artwork must remain optimizable.").toBe(200);
    expect(optimizedArtwork.headers()["content-type"]).toMatch(/^image\//);
    expect((await optimizedArtwork.body()).length).toBeGreaterThan(0);
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
    await expectInvitationResources(`/i/${slug}`, true, false);
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
    await expectInvitationResources(privatePath, true);
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
    await row.getByRole("button", { name: "Replace link", exact: true }).click();
    await host.getByRole("dialog").getByRole("button", { name: "Replace link", exact: true }).click();
    await expect(host.getByText("A new private link is ready. The old link no longer works.", { exact: true })).toBeVisible();
    expect((await guest.goto(privatePath))?.status()).toBe(404);
    await expectInvitationResources(privatePath, false);
    const replacement = new URL(await host.getByRole("textbox", { name: guestName, exact: true }).inputValue()).pathname;
    expect(replacement !== privatePath).toBe(true);
    currentGuestPath = replacement;
    expect((await guest.goto(replacement))?.status()).toBe(200);
    await expect(guest.getByRole("combobox", { name: /^Your response/ })).toHaveValue("declined");
    await expectInvitationResources(replacement, true);
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
    await expect(host.locator(".announcements-feedback")).toContainText("Announcement saved for your guests.");
    let card = host.locator("article.announcement-card").filter({ hasText: text });
    await card.getByRole("button", { name: "Edit announcement", exact: true }).click();
    const changed = `The welcome toast starts at 6:30 pm in the garden. ${slug}`;
    await host.getByRole("textbox", { name: "Edit announcement message", exact: true }).fill(changed);
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
    await card.getByRole("button", { name: "Remove announcement", exact: true }).click();
    await host.getByRole("dialog").getByRole("button", { name: "Remove announcement", exact: true }).click();
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
    await host.getByRole("dialog").getByRole("button", { name: "Make private", exact: true }).click();
    await expect(host.locator(".editor-feedback")).toContainText("Your invitation is private again");
    expect((await guest.goto(`/i/${slug}`))?.status()).toBe(404);
    const response = await guestContext.request.get(`/media/${mediaId}`);
    expect(response.status()).toBe(404);
    const optimizedPhoto = await guestContext.request.get(optimizedImagePath(`/media/${mediaId}`));
    expect(optimizedPhoto.status(), "Unpublishing must not leave an invitation photo accessible through the image optimizer.").toBe(400);
    await expectInvitationResources(`/i/${slug}`, false);
    expect(Boolean(currentGuestPath), "The rotated private guest link was created earlier in the journey.").toBe(true);
    expect((await guest.goto(currentGuestPath))?.status()).toBe(404);
    await expectInvitationResources(currentGuestPath, false);
    await host.goto("/dashboard");
    const saved = host.locator("article.dashboard-event-card").filter({ has: host.locator(`a[href="/customize?event=${eventId}"]`) });
    await expect(saved).toContainText("Unpublished");
    await expect(saved.getByRole("link", { name: "Edit invitation", exact: true })).toHaveAttribute("href", `/customize?event=${eventId}`);
    completed = true;
  });
});
