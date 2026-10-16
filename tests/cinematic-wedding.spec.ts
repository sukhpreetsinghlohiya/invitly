import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { themes } from '../src/data/themes';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/visitor-welcome', route => route.fulfill({ json: { enabled: false } }));
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test('every wedding theme uses the same readable guest flow', async ({ page }, info) => {
  test.setTimeout(120000);
  for (const theme of themes) {
    await page.goto(`/demo?theme=${theme.id}&opening=none`);
    await page.getByRole('button', { name: 'Skip opening', exact: true }).click();
    const invitation = page.locator('[data-wedding-flow="shared"]');
    await expect(invitation).toHaveCount(1);
    await expect(invitation.locator('h1')).toContainText('Aanya');
    await expect(invitation.locator('[data-couple-profiles]')).toHaveCount(1);
    await expect(invitation.locator('[data-photo-album]')).toHaveCount(1);
    await expect(invitation.locator('#celebrations article')).toHaveCount(4);
    await expect(invitation.locator('#celebrations a').filter({ hasText: /Get directions/ })).toHaveCount(4);
    await expect(invitation.locator('#rsvp')).toHaveCount(1);
    await expect(invitation.locator('#updates')).toHaveCount(1);
    await expect(invitation.locator('nav[aria-label="Invitation sections"]')).toBeVisible();
    const order = await invitation.evaluate(root => {
      const y = (section: string) => root.querySelector(`[data-section="${section}"]`)!.getBoundingClientRect().top;
      return { story: y('story'), people: y('people'), photos: y('photos'), schedule: y('schedule'), rsvp: y('rsvp') };
    });
    expect(order.story, theme.id).toBeLessThan(order.people);
    expect(order.photos, theme.id).toBeLessThan(order.schedule);
    expect(order.schedule, theme.id).toBeLessThan(order.rsvp);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), theme.id).toBeLessThanOrEqual(0);
    if (theme.id === 'modern' || theme.id === 'meenaya') {
      await mkdir('artifacts/cinematic', { recursive: true });
      for (const section of ['invitation', 'story', 'rsvp']) {
        await invitation.locator(`#${section}`).screenshot({ path: `artifacts/cinematic/shared-${theme.id}-${section}-${info.project.name}.png` });
      }
    }
  }
});

test('homepage explains customization and opens each wedding design', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const control = page.locator('#full-control');
  await expect(control.getByRole('heading')).toContainText('is yours to change.');
  await expect(control.locator('dt')).toHaveCount(8);
  await expect(control).toContainText('See replies in your dashboard');
  await expect(page.locator('#reactions')).toContainText('not customer testimonials');
  for (const theme of ['aranya', 'riviera', 'dastaan', 'meenaya', 'kesari', 'haveli']) {
    const link = page.locator(`#themes a[aria-label][href="/demo?theme=${theme}"]`);
    await expect(link).toHaveCount(1);
    await link.scrollIntoViewIfNeeded();
    await expect.poll(() => link.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await mkdir('artifacts/cinematic', { recursive: true });
  await page.screenshot({ path: `artifacts/cinematic/home-${info.project.name}.png`, fullPage: true });
  await control.screenshot({ path: `artifacts/cinematic/full-control-${info.project.name}.png` });
  await page.locator('#reactions').screenshot({ path: `artifacts/cinematic/reactions-${info.project.name}.png` });
  for (const theme of ['aranya', 'riviera', 'dastaan', 'meenaya', 'kesari', 'haveli']) {
    await page.goto(`/demo?theme=${theme}`);
    await page.getByRole('button', { name: 'Skip opening', exact: true }).click();
    const cover = page.locator(`#invitation [data-illustrated-cover="${theme}"]`);
    await expect(cover).toBeVisible();
    await expect(cover).toContainText('Aanya');
    await expect(cover).toContainText('Kabir');
    await expect.poll(() => cover.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('#celebrations article')).not.toHaveCount(0);
    await expect(page.locator('#rsvp').getByLabel('Your name')).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    if (theme === 'meenaya') await page.screenshot({ path: `artifacts/cinematic/meenaya-${info.project.name}.png`, fullPage: true });
  }
  await page.getByRole('navigation', { name: 'Invitation sections' }).getByRole('link', { name: /RSVP/ }).click();
  await expect(page.locator('#rsvp h2')).toBeInViewport();
  const sectionsNav = page.getByRole('navigation', { name: 'Invitation sections' });
  await expect(sectionsNav).toBeInViewport({ ratio: 1 });
  expect(await sectionsNav.evaluate(nav => {
    const box = nav.getBoundingClientRect();
    return nav.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await expect(page.locator('#rsvp').getByLabel('Your name')).toHaveCSS('font-size', '16px');
  await page.locator('#rsvp').getByLabel('Your name').fill('Preview Guest');
  await page.getByRole('button', { name: 'Save demo RSVP' }).click();
  await expect(page.locator('#rsvp')).toContainText('We saved your yes, Preview Guest!');
  await page.reload();
  await expect(page.locator('#rsvp')).toContainText('We saved your yes, Preview Guest!');
  expect(errors).toEqual([]);
});

test('cinematic design and edited names survive a saved draft reload', async ({ page }) => {
  await page.goto('/customize?theme=riviera&occasion=wedding');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByLabel('First name', { exact: true }).fill('Meera');
  await page.getByLabel('Second name', { exact: true }).fill('Rohan');
  const preview = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  await expect(preview.locator('[data-illustrated-cover="riviera"]')).toContainText('Meera');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByText('Draft saved on this device.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(preview.locator('[data-illustrated-cover="riviera"]')).toContainText('Rohan');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Coastal Promise', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
