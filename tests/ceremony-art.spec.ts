import { expect, test, type Locator } from '@playwright/test';
import { themes } from '../src/data/themes';

async function expectLoadedArtwork(art: Locator, id: string) {
  await expect(art).toHaveAttribute('data-ceremony-art', id);
  await art.scrollIntoViewIfNeeded();
  await expect(art).toBeVisible();
  const image = art.locator('img');
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).toHaveAttribute('alt', '');
  const dimensions = await image.evaluate(element => ({
    width: Number(element.getAttribute('width')),
    height: Number(element.getAttribute('height')),
  }));
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.height).toBeGreaterThan(0);
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
}

test('all ten wedding schedules show the named ceremony artwork at every viewport', async ({ page }, info) => {
  test.setTimeout(120000);
  const ceremonies = [['Haldi', 'haldi'], ['Sangeet', 'sangeet'], ['Wedding', 'wedding'], ['Reception', 'reception']] as const;
  for (const theme of themes) {
    await page.goto(`/demo?theme=${theme.id}`);
    const schedule = page.locator('#celebrations');
    for (const [title, id] of ceremonies) {
      const event = schedule.locator('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
      await expectLoadedArtwork(event.locator('[data-ceremony-art]'), id);
      await expect(event.getByRole('link', { name: /Get directions/ })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), theme.id).toBeLessThanOrEqual(0);
    if (theme.id === 'royal' || theme.id === 'modern') {
      await schedule.screenshot({ path: `artifacts/screenshots/ceremony-schedule-${theme.id}-${info.project.name}.png` });
    }
  }
});

test('hosts can rename ceremonies, remove their artwork and reload the real preview', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'The full editable ceremony journey runs once at 360px');
  test.setTimeout(90000);
  await page.goto('/customize?occasion=wedding&theme=modern');
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Add function', exact: true }).click();
  const name = page.getByLabel('Function name', { exact: true });
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  const event = frame.locator('#celebrations article');
  const cases = [
    ['Haldi', 'haldi'], ['Sangeet', 'sangeet'], ['Mehndi', 'mehndi'], ['Wedding', 'wedding'],
    ['Reception', 'reception'], ['Baraat', 'baraat'], ['Roka', 'engagement'],
    ['मेहंदी की शाम', 'mehndi'], ['ਬਰਾਤ ਦਾ ਸਵਾਗਤ', 'baraat'], ['रोका', 'engagement'],
    ['ਹਲਦੀ', 'haldi'], ['ਸੰਗੀਤ', 'sangeet'], ['ਵਿਆਹ', 'wedding'],
    ['Wedding reception', 'reception'], ['ਵਿਆਹ ਦਾ ਰਿਸੈਪਸ਼ਨ', 'reception'],
  ] as const;
  for (const [title, id] of cases) {
    await name.fill(title);
    await expect(event.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expectLoadedArtwork(event.locator('[data-ceremony-art]'), id);
    if (['Haldi', 'Sangeet', 'Mehndi', 'Wedding', 'Reception', 'Baraat', 'Roka'].includes(title)) {
      await event.screenshot({ path: `artifacts/screenshots/ceremony-editor-${id}-mobile-360.png` });
    }
  }
  await name.fill('An evening together');
  await expect(event.getByRole('heading', { name: 'An evening together', exact: true })).toBeVisible();
  await expect(event.locator('[data-ceremony-art="neutral"]')).toBeVisible();
  await expect(event.locator('[data-ceremony-art] img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-feedback')).toContainText('saved');
  await page.reload();
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await expect(page.getByLabel('Function name', { exact: true })).toHaveValue('An evening together');
  await expect(event.locator('[data-ceremony-art="neutral"]')).toBeVisible();
  await page.getByLabel('Function name', { exact: true }).fill('Haldi');
  await expectLoadedArtwork(event.locator('[data-ceremony-art]'), 'haldi');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  for (const [theme, id] of [['Royal Indian', 'royal'], ['Modern Minimal', 'modern']] as const) {
    await page.getByRole('tab', { name: 'Templates', exact: true }).click();
    await page.getByRole('button', { name: theme, exact: true }).click();
    // The iframe receives changes after the editor’s 200ms debounce. The old
    // theme also contains Haldi, so its artwork cannot signal the new preview.
    await expect(frame.locator('[data-signature-cover]')).toHaveAttribute('data-signature-cover', id);
    await expectLoadedArtwork(event.locator('[data-ceremony-art]'), 'haldi');
    await page.getByRole('tab', { name: 'Colours & type', exact: true }).click();
    await page.getByLabel('Decorative artwork').uncheck();
    await expect(event.locator('[data-ceremony-art]')).toHaveCount(0);
    await expect(event.getByRole('heading', { name: 'Haldi', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Colours & type', exact: true }).click();
    await page.getByLabel('Decorative artwork').check();
    await expectLoadedArtwork(event.locator('[data-ceremony-art]'), 'haldi');
  }
  expect(await frame.locator('html').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});
