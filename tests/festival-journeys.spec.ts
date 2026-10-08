import { expect, test, type Page } from '@playwright/test';

const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }, info) => {
  test.skip(!['mobile-320', 'mobile-390', 'desktop'].includes(info.project.name), 'Festival journeys at narrow phone, standard phone and desktop widths');
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/visitor-welcome', route => route.fulfill({ json: { enabled: false } }));
});

test.afterEach(async ({ page }) => { expect(pageErrors.get(page) || [], 'No browser runtime errors').toEqual([]); });

test('festival demos use a celebration and host instead of a wedding couple in every festival design', async ({ page }) => {
  test.setTimeout(60000);
  for (const theme of ['royal', 'kesar', 'mehfil']) {
    await page.goto(`/demo?occasion=festival&festival=diwali&theme=${theme}&opening=none`);
    const invitation = page.locator('#invitation');
    await expect(invitation).toHaveAttribute('data-occasion', 'festival');
    await expect(invitation.getByRole('heading', { level: 1 })).toHaveText('Diwali together');
    await expect(invitation).toContainText('The Kapoor family');
    await expect(page.locator('[data-invitation-root]')).not.toContainText(/Aanya|Kabir|bride|groom|getting married/i);
    await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
});

test('changing a festival demo design preserves the preset and opening when starting a new invitation', async ({ page }) => {
  await page.goto('/demo?occasion=festival&festival=diwali&theme=royal&opening=flowers');
  await expect(page.locator('[data-opening-style="flowers"]')).toBeVisible();
  await page.locator('#demo-design').selectOption('kesar');
  await expect(page.locator('[data-demo-theme]')).toHaveAttribute('data-demo-theme', 'kesar');
  const demoUrl = new URL(page.url());
  expect(demoUrl.searchParams.get('occasion')).toBe('festival');
  expect(demoUrl.searchParams.get('festival')).toBe('diwali');
  expect(demoUrl.searchParams.get('opening')).toBe('flowers');
  await expect(page.locator('[data-opening-style="flowers"]')).toBeVisible();
  for (const link of await page.getByRole('link', { name: 'Make it yours', exact: true }).all()) {
    const destination = new URL((await link.getAttribute('href'))!, page.url());
    for (const [key, value] of Object.entries({ occasion: 'festival', festival: 'diwali', opening: 'flowers', theme: 'kesar' })) {
      expect(destination.searchParams.get(key), key).toBe(value);
    }
  }
  await page.locator('[data-demo-theme] > header').getByRole('link', { name: 'Make it yours', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Festival', exact: true })).toHaveValue('diwali');
  await expect(page.getByRole('textbox', { name: 'Celebration title', exact: true })).toHaveValue('Diwali together');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Host or family name', exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Second name', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Flowers in bloom', exact: true })).toBeChecked();
});

test('a fresh festival draft keeps custom wording, host and opening across preset changes and reload', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/customize?occasion=festival&theme=royal');
  const preset = page.getByRole('combobox', { name: 'Festival', exact: true });
  const title = page.getByRole('textbox', { name: 'Celebration title', exact: true });
  const tradition = page.getByRole('combobox', { name: /Tradition or cultural style/ });
  await expect(preset).toHaveValue('custom');
  await expect(title).toHaveValue('Festival gathering');
  await expect(tradition).toHaveValue('neutral');
  await preset.selectOption('diwali');
  await expect(title).toHaveValue('Diwali together');
  await expect(tradition).toHaveValue('neutral');
  await title.fill('Our festive supper');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  const host = page.getByRole('textbox', { name: 'Host or family name', exact: true });
  await expect(host).toHaveValue('');
  await host.fill('Simran & family · ਸਿਮਰਨ');
  await expect(page.getByRole('textbox', { name: 'Second name', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('An evening at our table, with our favourite people.');
  await page.getByRole('button', { name: 'Occasion', exact: true }).click();
  await preset.selectOption('holi');
  await expect(title).toHaveValue('Our festive supper');
  await expect(tradition).toHaveValue('neutral');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await page.getByRole('radio', { name: 'Flowers in bloom', exact: true }).check();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await expect(preset).toHaveValue('holi');
  await expect(title).toHaveValue('Our festive supper');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(host).toHaveValue('Simran & family · ਸਿਮਰਨ');
  await expect(page.getByRole('textbox', { name: 'Your message', exact: true })).toHaveValue('An evening at our table, with our favourite people.');
  await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  await expect(preview.locator('[data-opening-style="flowers"]')).toBeVisible();
  await preview.getByRole('button', { name: 'Skip opening', exact: true }).click();
  await expect(preview.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
  await expect(preview.locator('#invitation')).toHaveAttribute('data-occasion', 'festival');
  await expect(preview.locator('#invitation').getByRole('heading', { level: 1 })).toHaveText('Our festive supper');
  await expect(preview.locator('#invitation')).toContainText('Simran & family · ਸਿਮਰਨ');
  await expect(preview.locator('[data-invitation-root]')).toContainText('An evening at our table, with our favourite people.');
  await expect(preview.locator('[data-invitation-root]')).not.toContainText(/Aanya|Kabir|bride|groom|getting married/i);
  expect(await preview.locator('html').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
});

test('demo choices update a saved draft without erasing names or overriding later saved edits', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-390', 'One complete restored-draft journey');
  test.setTimeout(60000);
  await page.goto('/customize?occasion=wedding&theme=modern');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByRole('textbox', { name: 'First name', exact: true }).fill('Meher');
  await page.getByRole('textbox', { name: 'Second name', exact: true }).fill('Arjun');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.goto('/demo?theme=kesar&occasion=festival&festival=diwali&opening=car');
  await expect(page.locator('[data-opening-style="car"]')).toBeVisible();
  await page.locator('[data-demo-theme] > header').getByRole('link', { name: 'Make it yours', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Festival', exact: true })).toHaveValue('diwali');
  await expect(page.getByRole('textbox', { name: 'Celebration title', exact: true })).toHaveValue('Diwali together');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Host or family name', exact: true })).toHaveValue('Meher');
  await expect(page.getByRole('textbox', { name: 'Additional name (optional)', exact: true })).toHaveValue('Arjun');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Car arrival', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Flowers in bloom', exact: true }).check();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  for (const key of ['theme', 'occasion', 'tradition', 'festival', 'opening']) expect(new URL(page.url()).searchParams.has(key), `${key} preference consumed after saving`).toBe(false);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Festival', exact: true })).toHaveValue('diwali');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Host or family name', exact: true })).toHaveValue('Meher');
  await expect(page.getByRole('textbox', { name: 'Additional name (optional)', exact: true })).toHaveValue('Arjun');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Flowers in bloom', exact: true })).toBeChecked();
});
