import { expect, test } from "@playwright/test";
import { occasionDemo } from "../src/data/occasion-demos";
import { getDesign } from "../src/data/occasions";

// The guest fixture carries a private invitation token. Keep it out of browser
// traces and automatic screenshots, including when an assertion fails.
test.use({ trace: "off", screenshot: "off", video: "off" });

test("a pending recording can be cancelled and a stale rejection cannot stop a later playback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    const fixture = window as unknown as { playRequests: number; rejectOldPlay: () => void };
    fixture.playRequests = 0;
    HTMLMediaElement.prototype.play = function () {
      fixture.playRequests += 1;
      if (fixture.playRequests === 1) return new Promise<void>((_resolve, reject) => { fixture.rejectOldPlay = () => reject(new DOMException("Old request failed", "NotSupportedError")); });
      return original.call(this);
    };
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Cancel loading music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Open invitation", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { playRequests: number }).playRequests)).toBe(1);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => (window as unknown as { rejectOldPlay: () => void }).rejectOldPlay());
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("The song couldn’t start. Tap Play to try again.")).toHaveCount(0);
});

test("a recording that never loads returns a usable retry after its timeout", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => new Promise<void>(() => {}); });
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "Cancel loading music", exact: true })).toBeEnabled();
  await page.clock.fastForward(16_000);
  await expect(page.getByText("The song is taking too long to load. Tap Play to try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toBeEnabled();
});

test("a suspended original soundtrack can be cancelled without trapping the player", async ({ page }) => {
  await page.addInitScript(() => { AudioContext.prototype.resume = () => new Promise<void>(() => {}); });
  await page.goto("/preview");
  const invitation = occasionDemo("wedding", "royal");
  invitation.design = { ...getDesign(invitation), music: { source: "original", track: "celebration", youtubeUrl: "" } };
  await expect.poll(async () => {
    await page.evaluate(payload => window.postMessage(payload, window.location.origin), { type: "invitly-preview", draft: { invitation, themeId: "royal", musicEnabled: true }, photos: [] });
    return page.getByRole("button", { name: "Play music", exact: true }).count();
  }).toBe(1);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await page.getByRole("button", { name: "Cancel loading music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toBeEnabled();
});

test("guest RSVP retains edited answers after action results and connection failures", async ({ page }) => {
  test.skip(!process.env.LIGHTHOUSE_GUEST_PATH, "Requires the isolated local guest fixture; no real RSVP is sent.");
  await page.goto(`${process.env.LIGHTHOUSE_GUEST_PATH}#rsvp`);
  let mode: "success" | "validation" | "network" = "success";
  await page.route("**/g/**", async route => {
    if (route.request().method() !== "POST") return route.continue();
    if (mode === "network") return route.abort("failed");
    const result = mode === "success" ? { success: "Your RSVP has been sent to the hosts." } : { error: "Please wait 10 seconds before updating your response." };
    await route.fulfill({ contentType: "text/x-component", body: `0:${JSON.stringify({ a: result, f: "" })}\n` });
  });
  const party = page.getByRole("spinbutton", { name: "People in your party, including you" });
  const note = page.getByRole("textbox", { name: "A note for the hosts (optional)" });
  const size = String(Math.min(2, Number(await party.getAttribute("max"))));
  await party.fill(size);
  await note.fill("Vegetarian meals, please.");
  await page.getByRole("button", { name: /^(Send|Update) RSVP$/ }).click();
  await expect(page.locator(".rsvp-form .form-success")).toContainText("Your RSVP has been sent");
  await expect(party).toHaveValue(size);
  await expect(note).toHaveValue("Vegetarian meals, please.");
  await page.getByRole("combobox", { name: "Your response", exact: true }).selectOption("declined");
  await page.getByRole("combobox", { name: "Your response", exact: true }).selectOption("attending");
  await expect(party).toHaveValue(size);
  mode = "validation";
  await page.getByRole("button", { name: "Update RSVP", exact: true }).click();
  await expect(page.locator(".rsvp-form [role=alert]")).toContainText("Please wait 10 seconds");
  await expect(note).toHaveValue("Vegetarian meals, please.");
  mode = "network";
  await page.getByRole("button", { name: /^(Send|Update) RSVP$/ }).click();
  await expect(page.locator(".rsvp-form [role=alert]")).toContainText("Check your connection and try again");
  await expect(note).toHaveValue("Vegetarian meals, please.");
});
