import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// The account journey uses disposable local credentials; never record auth traces.
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

async function capturePage(page: Page, file: string, viewport = false) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `artifacts/home-editor-after/${file}.png`, fullPage: true });
  if (viewport) await page.screenshot({ path: `artifacts/home-editor-after/${file}-viewport.png` });
}

test('homepage login, keyboard FAQs and footer navigation work at every viewport', async ({ page }, info) => {
  await page.goto('/');
  const login = page.getByRole('link', { name: 'Log in', exact: true });
  await expect(login).toHaveAttribute('href', '/login');
  await expect(login).toBeInViewport({ ratio: 1 });
  expect((await login.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await expect(page.locator('.home-header')).toHaveCount(1);
  await expect(page.locator('main .hero')).toHaveCount(1);
  await mkdir('artifacts/home-editor-after', { recursive: true });
  await capturePage(page, `homepage-${info.project.name}`, true);
  await page.locator('main .hero').screenshot({ path: `artifacts/home-editor-after/hero-${info.project.name}.png` });

  const faq = page.locator('#faqs');
  const questions = faq.locator('details');
  await expect(questions).toHaveCount(8);
  for (const question of await questions.all()) {
    const summary = question.locator('summary');
    await summary.focus();
    await summary.press('Enter');
    await expect(question).toHaveJSProperty('open', true);
    await expect(question.locator('.faq-answer')).toBeVisible();
    await expect(summary).toBeFocused();
    await summary.press('Space');
    await expect(question).toHaveJSProperty('open', false);
  }
  await expect(faq).toContainText('personal invitation links');
  await expect(faq).toContainText('demo RSVPs stay in the browser');
  await expect(faq).toContainText('up to 5 MB each');
  await expect(faq).toContainText('music never starts automatically');
  await questions.first().locator('summary').press('Enter');
  await faq.screenshot({ path: `artifacts/home-editor-after/faq-${info.project.name}.png` });
  await questions.first().locator('summary').press('Space');

  const footer = page.locator('.marketing-footer');
  await expect(footer.getByRole('navigation', { name: 'Explore Invitly', exact: true })).toBeVisible();
  await expect(footer.getByRole('navigation', { name: 'Invitation occasions', exact: true })).toBeVisible();
  const hrefs = await footer.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => (link as HTMLAnchorElement).getAttribute('href')!))]);
  for (const href of hrefs) {
    const target = new URL(href, page.url());
    expect(target.origin).toBe(new URL(page.url()).origin);
    if (target.pathname === '/' && target.hash) await expect(page.locator(target.hash)).toBeAttached();
    const response = await page.request.get(`${target.pathname}${target.search}`);
    expect(response.ok(), href).toBe(true);
  }
  await footer.screenshot({ path: `artifacts/home-editor-after/footer-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await login.click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
});

test('guided editor steps, publishing checklist and previews preserve a local draft', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.goto('/customize?occasion=engagement&theme=lotus');
  const status = page.locator('.editor-workspace-status');
  const step = page.locator('.editor-current-step');
  const heading = page.locator('#editor-step-heading');
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  await expect(status).toBeVisible();
  await expect(status).toBeInViewport({ ratio: 1 });
  await expect(status).toHaveAttribute('data-storage', 'device');
  await expect(status).toContainText(/device|browser/i);
  await expect(step).toContainText('Step 1 of 6');
  await expect(page.getByRole('progressbar', { name: 'Invitation editor progress', exact: true })).toBeVisible();
  await expect(frame.locator('#invitation')).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('group', { name: 'Choose an occasion', exact: true }).getByRole('button').first()).toBeInViewport({ ratio: 1 });
  await capturePage(page, `editor-${info.project.name}`, true);
  await page.getByRole('button', { name: 'Continue to Details', exact: true }).click();
  await expect(step).toContainText('Step 2 of 6');
  await expect(heading).toBeFocused();
  await page.getByLabel('First name', { exact: true }).fill('Anaya');
  await page.getByLabel('Second name', { exact: true }).fill('Arjun');
  await expect(frame.locator('main')).toContainText('Anaya');
  await capturePage(page, `editor-details-${info.project.name}`);
  await page.getByLabel('First name', { exact: true }).fill('ਪ੍ਰੀਤ · प्रीत');
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('An engagement lunch with our favourite people.');
  await expect(status).toHaveAttribute('data-save-state', 'unsaved');
  await page.getByRole('button', { name: 'Continue to Schedule', exact: true }).click();
  await expect(heading).toBeFocused();
  await page.getByRole('button', { name: 'Add function', exact: true }).click();
  await page.getByLabel('Function name', { exact: true }).fill('Engagement lunch');
  await page.getByRole('button', { name: 'Continue to Photos', exact: true }).click();
  await expect(step).toContainText('Step 4 of 6');
  await expect(heading).toBeFocused();
  await page.getByRole('button', { name: 'Back to Schedule', exact: true }).click();
  await expect(heading).toBeFocused();
  await expect(page.getByLabel('Function name', { exact: true })).toHaveValue('Engagement lunch');

  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const checklist = page.getByRole('region', { name: 'Publishing checklist', exact: true });
  await expect(checklist.locator('[data-readiness-status="missing"]').first()).toBeVisible();
  await expect(frame.locator('main')).toContainText('Engagement lunch');
  await capturePage(page, `editor-share-missing-${info.project.name}`);
  await checklist.getByRole('button', { name: 'Review event date', exact: true }).click();
  await expect(step).toContainText('Step 2 of 6');
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('ਪ੍ਰੀਤ · प्रीत');
  await page.getByLabel(/^Event date and time/).fill('2027-04-03T12:00');
  await page.getByLabel('City', { exact: true }).fill('Chandigarh');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await checklist.getByRole('button', { name: 'Review schedule', exact: true }).click();
  await expect(step).toContainText('Step 3 of 6');
  await page.getByLabel(/^Date and time/).fill('2027-04-03T12:00');
  await page.getByLabel('Venue name', { exact: true }).fill('Our family garden');
  await page.getByLabel('Venue address', { exact: true }).fill('Sector 17, Chandigarh');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(status).toHaveAttribute('data-save-state', 'saved');
  await expect(status).toContainText(/device|browser/i);
  await page.reload();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(checklist.locator('[data-readiness-status="missing"]')).toHaveCount(0);
  await checklist.getByRole('button', { name: 'Review invitation link', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /^Invitation link/ })).toBeFocused();
  await capturePage(page, `editor-share-${info.project.name}`);
  await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Live invitation preview', exact: true });
  await expect(preview).toBeVisible();
  await expect(frame.locator('main')).toContainText('ਪ੍ਰੀਤ · प्रीत');
  await expect(frame.locator('main')).toContainText('Engagement lunch');
  await expect(frame.locator('main')).toContainText('An engagement lunch with our favourite people.');
  await page.getByRole('button', { name: 'Desktop · 1280px', exact: true }).click();
  await expect(page.locator('iframe[title="Actual guest invitation preview"]')).toHaveCSS('width', '1280px');
  await page.getByRole('button', { name: 'Phone · 360px', exact: true }).click();
  await expect(page.locator('iframe[title="Actual guest invitation preview"]')).toHaveCSS('width', '360px');
  await preview.getByRole('button', { name: 'Back to editing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Preview invitation', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);

  await page.goto('/customize?occasion=engagement&theme=royal');
  await expect(status).toHaveAttribute('data-save-state', 'unsaved');
  await expect(frame.locator('main')).toContainText('ਪ੍ਰੀਤ · प्रीत');
  await expect(frame.locator('main')).toContainText('An engagement lunch with our favourite people.');
  await expect(frame.locator('#invitation')).toHaveAttribute('data-theme', 'royal');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(status).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await expect(status).toHaveAttribute('data-save-state', 'saved');
  await expect(frame.locator('#invitation')).toHaveAttribute('data-theme', 'royal');
  await expect(frame.locator('main')).toContainText('ਪ੍ਰੀਤ · प्रीत');
});

test.describe('homepage account entry', () => {
  test('homepage login reaches the host dashboard and shows account draft status', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-360' || process.env.INVITLY_INTEGRATION !== '1', 'Isolated authenticated entry journey at 360px');
    await page.goto('/customize?occasion=engagement&theme=lotus');
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await page.getByLabel('First name', { exact: true }).fill('Restored engagement');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.locator('.editor-workspace-status')).toContainText(/device|browser/i);
    await page.goto('/');
    await page.getByRole('link', { name: 'Log in', exact: true }).click();
    await page.getByLabel('Email address', { exact: true }).fill(process.env.TEST_HOST_A_EMAIL!);
    await page.getByLabel(/^Password/).fill(process.env.TEST_HOST_A_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole('link', { name: 'New invitation', exact: true }).click();
    const status = page.locator('.editor-workspace-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('data-storage', 'device');
    await expect(status).toContainText('Saved on this device');
    await expect(status).toContainText('Available only in this browser');
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Restored engagement');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page).toHaveURL(/event=[a-f0-9-]{36}$/);
    await expect(status).toHaveAttribute('data-save-state', 'saved');
    await expect(status).toHaveAttribute('data-storage', 'account');
    await expect(status).toContainText(/account/i);
  });
});

test.describe('homepage without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('FAQ answers and login remain available before JavaScript loads', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-360', 'Native disclosure verification at 360px');
    await page.goto('/#faqs');
    const question = page.locator('#faqs details').first();
    await question.locator('summary').focus();
    await question.locator('summary').press('Enter');
    await expect(question.locator('.faq-answer')).toBeVisible();
    await expect(question.locator('.faq-answer')).toContainText('There is nothing to install');
    await question.locator('summary').press('Space');
    await expect(question).toHaveJSProperty('open', false);
    await page.getByRole('link', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });
});
