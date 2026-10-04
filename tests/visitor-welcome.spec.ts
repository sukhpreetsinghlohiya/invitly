import { expect, test } from "@playwright/test";

test("English welcome requires name and reason, cannot be skipped, and sends once", async ({ page }, testInfo) => {
  let submitted: Record<string, unknown> | undefined;
  let requests = 0;
  let release: (() => void) | undefined;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/visitor-welcome", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { enabled: true } });
    requests++;
    submitted = route.request().postDataJSON();
    await held;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Welcome to Invitly." });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img.brand-mark")).toBeVisible();
  await expect(dialog).not.toContainText("By continuing");
  await expect(dialog.getByRole("button")).toHaveCount(1);
  await expect(page.locator("#visitor-name")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Continue to Invitly" }).click();
  expect(requests).toBe(0);
  await page.getByLabel("Your name", { exact: true }).fill("Aman");
  await page.getByRole("textbox", { name: "What brings you to Invitly?", exact: true }).fill("I want a wedding invitation.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/screenshots/visitor-welcome-${testInfo.project.name}.png` });
  await dialog.getByRole("button", { name: "Continue to Invitly" }).click();
  await expect(dialog.getByRole("button", { name: "Sending your hello…" })).toBeDisabled();
  await dialog.locator("form").evaluate(form => (form as HTMLFormElement).requestSubmit());
  await expect.poll(() => requests).toBe(1);
  expect(submitted).toMatchObject({ name: "Aman", reason: "I want a wedding invitation.", page: "/" });
  release!();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Welcome, Aman!");
  const stored = await page.evaluate(() => localStorage.getItem("invitly:welcome-completed:v1"));
  expect(stored).toMatch(/^\d+$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(dialog).toHaveCount(0);
  expect(requests).toBe(1);
});

test("webhook errors preserve both answers and allow a retry with the same id", async ({ page }) => {
  const ids: string[] = [];
  await page.route("**/api/visitor-welcome", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { enabled: true } });
    ids.push(route.request().postDataJSON().submissionId);
    return route.fulfill({ status: ids.length === 1 ? 502 : 200, json: ids.length === 1 ? { error: "Could not deliver. Please retry." } : { ok: true } });
  });
  await page.goto("/templates");
  await page.getByLabel("Your name", { exact: true }).fill("Simran");
  await page.getByRole("textbox", { name: "What brings you to Invitly?", exact: true }).fill("An engagement invitation");
  await page.getByRole("button", { name: "Continue to Invitly" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Could not deliver");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Simran");
  await expect(page.getByRole("textbox", { name: "What brings you to Invitly?", exact: true })).toHaveValue("An engagement invitation");
  await page.getByRole("button", { name: "Continue to Invitly" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
});

test("unconfigured welcome and auth/private pages do not block visitors", async ({ page }) => {
  let probes = 0;
  await page.route("**/api/visitor-welcome", route => { probes++; return route.fulfill({ json: { enabled: false } }); });
  await page.goto("/");
  await expect.poll(() => probes).toBe(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const path of ["/signup", "/privacy", "/demo", "/g/not-a-real-guest-token"]) {
    await page.goto(path);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  expect(probes).toBe(1);
});

test("real browser requests reach validation through the local hostname alias", async ({ page }) => {
  await page.goto("/");
  const response = await page.evaluate(async () => {
    const result = await fetch("/api/visitor-welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    return { status: result.status, body: await result.json() };
  });
  expect(response.status).toBe(400);
  expect(response.body.error).toContain("Add your name");
});
