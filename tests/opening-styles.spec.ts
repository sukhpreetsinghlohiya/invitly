import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const styles = ['doors', 'envelope', 'flowers', 'sky', 'mandap', 'bike', 'car', 'rings'] as const;
const testedProjects = ['mobile-320', 'mobile-390', 'desktop'];
const pageErrors = new WeakMap<Page, string[]>();

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test.beforeEach(async ({ page }, info) => {
  test.skip(!testedProjects.includes(info.project.name), 'Opening coverage at narrow phone, standard phone and desktop widths');
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/visitor-welcome', route => route.fulfill({ json: { enabled: false } }));
});

test.afterEach(async ({ page }) => { expect(pageErrors.get(page) || [], 'No browser runtime errors').toEqual([]); });

test('every explicit opening can be entered or skipped by keyboard without a second theme opening', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [index, style] of styles.entries()) {
    await page.goto(`/demo?theme=royal&opening=${style}`);
    const opening = page.locator(`[data-opening-style="${style}"]`);
    await expect(opening).toBeVisible();
    await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Open invitation', exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Skip opening', exact: true })).toHaveCount(1);
    await noOverflow(page);

    const action = opening.getByRole('button', { name: index % 2 ? 'Skip opening' : 'Open invitation', exact: true });
    await action.focus();
    await action.press(index % 2 ? 'Space' : 'Enter');
    await expect(opening).toHaveCount(0);
    await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
    await expect(page.locator('#invitation')).toBeFocused();
    await expect(page.locator('#invitation')).toContainText('Aanya');
    await expect(page.locator('#invitation')).toContainText('Kabir');
    await expect(page.getByRole('button', { name: 'Open invitation', exact: true })).toHaveCount(0);
    await noOverflow(page);
  }
});

test('skip remains usable during an animated opening and replay restores only the selected scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/demo?theme=royal&opening=sky');
  const opening = page.locator('[data-opening-style="sky"]');
  await expect(opening).toBeVisible();
  await page.clock.install({ time: new Date('2027-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2027-01-01T00:00:01Z'));
  await opening.getByRole('button', { name: 'Open invitation', exact: true }).click();
  await opening.getByRole('button', { name: 'Skip opening', exact: true }).click();
  await expect(opening).toHaveCount(0);
  await page.clock.runFor(50);
  await expect(page.locator('#invitation')).toBeFocused();
  await page.evaluate(() => document.dispatchEvent(new Event('invitly:replay-opening')));
  await expect(opening).toBeVisible();
  await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(1);
  await opening.getByRole('button', { name: 'Skip opening', exact: true }).click();
  await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
  await page.clock.runFor(2000);
  await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
});

test('choosing no opening gives immediate access even to a theme with doors', async ({ page }) => {
  await page.goto('/demo?theme=royal&opening=none');
  await expect(page.locator('#invitation')).toBeVisible();
  await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open invitation', exact: true })).toHaveCount(0);
  await expect(page.locator('#invitation')).toContainText('Aanya');
  await noOverflow(page);
});

test('switching designs after opening a demo restores the selected entrance', async ({ page }) => {
  for (const style of ['envelope', 'flowers']) {
    await page.goto(`/demo?theme=modern&opening=${style}`);
    await page.getByRole('button', { name: 'Open invitation', exact: true }).click();
    await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
    await page.locator('#demo-design').selectOption('floral');
    await expect(page.locator('[data-demo-theme]')).toHaveAttribute('data-demo-theme', 'floral');
    expect(new URL(page.url()).searchParams.get('opening')).toBe(style);
    await expect(page.locator(`[data-opening-style="${style}"]`)).toBeVisible();
    await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Open invitation', exact: true })).toHaveCount(1);
  }
});

test('demo opening choices and replay keep the festival and design context', async ({ page }) => {
  await page.goto('/demo?theme=royal&occasion=festival&festival=diwali&opening=flowers');
  await expect(page.locator('[data-opening-style="flowers"]')).toBeVisible();
  const options = page.getByRole('complementary', { name: 'Preview options', exact: true });
  await expect(options.locator('.music-control')).toBeVisible();
  const music = (await options.locator('.music-control').boundingBox())!;
  const skip = (await page.getByRole('button', { name: 'Skip opening', exact: true }).boundingBox())!;
  const overlapWidth = Math.max(0, Math.min(music.x + music.width, skip.x + skip.width) - Math.max(music.x, skip.x));
  const overlapHeight = Math.max(0, Math.min(music.y + music.height, skip.y + skip.height) - Math.max(music.y, skip.y));
  expect(overlapWidth * overlapHeight, 'Music controls never cover the opening skip action').toBe(0);
  if (page.viewportSize()!.width <= 760) {
    await options.getByRole('combobox', { name: 'Opening', exact: true }).selectOption('doors');
  } else {
    await options.getByRole('button', { name: 'Palace doors', exact: true }).click();
    await expect(options.getByRole('button', { name: 'Palace doors', exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  const opening = page.locator('[data-opening-style="doors"]');
  await expect(opening).toBeVisible();
  for (const [key, value] of Object.entries({ theme: 'royal', occasion: 'festival', festival: 'diwali', opening: 'doors' })) {
    expect(new URL(page.url()).searchParams.get(key), key).toBe(value);
  }
  await opening.getByRole('button', { name: 'Skip opening', exact: true }).click();
  await expect(opening).toHaveCount(0);
  await options.getByRole('button', { name: 'Replay opening', exact: true }).click();
  await expect(opening).toBeVisible();
  await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(1);
  await page.locator('#demo-design').selectOption('kesar');
  await expect(page.locator('[data-demo-theme]')).toHaveAttribute('data-demo-theme', 'kesar');
  await expect(opening).toBeVisible();
  const destination = new URL((await page.locator('[data-demo-theme] > header').getByRole('link', { name: 'Make it yours', exact: true }).getAttribute('href'))!, page.url());
  for (const [key, value] of Object.entries({ theme: 'kesar', occasion: 'festival', festival: 'diwali', opening: 'doors' })) {
    expect(destination.searchParams.get(key), key).toBe(value);
  }
  if (page.viewportSize()!.width <= 760) await options.getByRole('combobox', { name: 'Opening', exact: true }).selectOption('none');
  else await options.getByRole('button', { name: 'No opening', exact: true }).click();
  await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
  await expect(options.getByRole('button', { name: 'Replay opening', exact: true })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get('opening')).toBe('none');
  await noOverflow(page);
});

test('all eight entrances visibly move before revealing the invitation', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const style of styles) {
    await page.goto(`/demo?theme=floral&opening=${style}`);
    const opening = page.locator(`[data-opening-style="${style}"]`);
    await expect(opening).toBeVisible();
    await opening.evaluate(() => document.fonts.ready);
    const originalCover = await page.locator('#invitation').elementHandle();
    await expect.poll(() => opening.locator('img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: info.outputPath(`${style}-opening.png`) });
    const movement = opening.evaluate(async stage => {
      const nodes = [...stage.querySelectorAll('[data-opening-part]')];
      const positions = nodes.map(() => new Set<string>());
      const bounds = nodes.map(() => ({ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minW: Infinity, maxW: -Infinity, minH: Infinity, maxH: -Infinity }));
      const started = performance.now();
      let samples = 0;
      let realCoverFrames = 0;
      let fadedCoverFrames = 0;
      let lastScroll = window.scrollY;
      await new Promise<void>(resolve => {
        const sample = () => {
          if (!stage.isConnected || performance.now() - started > 1600) { resolve(); return; }
          const root = stage.getBoundingClientRect();
          const entrance = stage.closest('[data-entrance-phase]');
          const paper = entrance?.querySelector('#invitation')?.parentElement;
          if (entrance?.getAttribute('data-entrance-phase') === 'opening' && paper) {
            const presentation = getComputedStyle(paper);
            if (presentation.visibility === 'visible') realCoverFrames++;
            if (Number(presentation.opacity) !== 1) fadedCoverFrames++;
            lastScroll = window.scrollY;
          }
          nodes.forEach((node, index) => {
            if (!node.isConnected) return;
            const rect = node.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            // Relative coordinates ignore the browser scrolling the clicked
            // button into view; only changes within the artwork count.
            const x = rect.left - root.left, y = rect.top - root.top;
            positions[index].add([x, y, rect.width, rect.height].map(Math.round).join(','));
            const b = bounds[index];
            b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x);
            b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y);
            b.minW = Math.min(b.minW, rect.width); b.maxW = Math.max(b.maxW, rect.width);
            b.minH = Math.min(b.minH, rect.height); b.maxH = Math.max(b.maxH, rect.height);
          });
          samples++;
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return { samples, realCoverFrames, fadedCoverFrames, lastScroll, movingLayers: nodes.flatMap((node, index) => {
        const b = bounds[index];
        const distance = Math.max(b.maxX - b.minX, b.maxY - b.minY, b.maxW - b.minW, b.maxH - b.minH);
        return positions[index].size >= 3 && distance > 2 ? [{ layer: node.getAttribute('data-opening-part') || node.tagName, distance }] : [];
      }) };
    });
    await opening.getByRole('button', { name: 'Open invitation', exact: true }).click();
    const measured = await movement;
    const measurementPath = info.outputPath(`${style}-movement.json`);
    await writeFile(measurementPath, JSON.stringify(measured, null, 2));
    await info.attach(`${style}-movement`, { path: measurementPath, contentType: 'application/json' });
    expect(measured.movingLayers.length, `${style}: actual artwork movement across frames: ${JSON.stringify(measured)}`).toBeGreaterThan(0);
    expect(measured.realCoverFrames, `${style}: the real cover is underneath the moving artwork`).toBeGreaterThan(5);
    expect(measured.fadedCoverFrames, `${style}: the invitation itself must not crossfade`).toBe(0);
    await expect(opening).toHaveCount(0);
    expect(await page.locator('#invitation').evaluate((element, original) => element === original, originalCover), 'Opening reveals the same DOM card, not a replacement').toBe(true);
    expect(Math.abs(await page.evaluate(() => window.scrollY) - measured.lastScroll), 'Finishing the entrance must not jump the page').toBeLessThanOrEqual(1);
    await expect(page.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
    await noOverflow(page);
  }
});

test('a chosen opening survives saving on this device and appears in the actual preview', async ({ page }) => {
  await page.goto('/customize?occasion=wedding&theme=royal');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  const templates = page.getByRole('tab', { name: 'Templates', exact: true });
  const colours = page.getByRole('tab', { name: 'Colours & type', exact: true });
  const entrance = page.getByRole('tab', { name: 'Opening & motion', exact: true });
  await templates.focus();
  await templates.press('ArrowRight');
  await expect(colours).toBeFocused();
  await expect(colours).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('combobox', { name: 'Colour palette', exact: true }).selectOption('sage');
  await colours.focus();
  await colours.press('ArrowRight');
  await expect(entrance).toBeFocused();
  await page.getByRole('radio', { name: 'Flowers in bloom', exact: true }).check();
  await entrance.focus();
  await entrance.press('End');
  await expect(page.getByRole('tab', { name: 'Music & layout', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(templates).toBeFocused();
  await colours.click();
  await expect(page.getByRole('combobox', { name: 'Colour palette', exact: true })).toHaveValue('sage');
  await entrance.click();
  await expect(page.getByRole('radio', { name: 'Flowers in bloom', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Flowers in bloom', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  await expect(preview.locator('[data-opening-style="flowers"]')).toBeVisible();
  await expect(preview.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(1);
  await preview.getByRole('button', { name: 'Skip opening', exact: true }).click();
  await expect(preview.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(0);
  await expect(preview.locator('#invitation')).toBeFocused();
  await page.getByRole('button', { name: 'Back to editing', exact: true }).click();
  await page.getByRole('button', { name: 'Replay opening', exact: true }).click();
  await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
  await expect(preview.locator('[data-opening-style="flowers"]')).toBeVisible();
  await expect(preview.locator('[data-section="opening"]:not([data-preview-notice])')).toHaveCount(1);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the decorative entrance never prevents reading the invitation', async ({ page }) => {
    await page.goto('/demo?theme=royal&opening=flowers');
    await expect(page.locator('[data-opening-style="flowers"]')).toBeHidden();
    await expect(page.locator('#invitation')).toBeVisible();
    await expect(page.locator('#invitation')).toContainText('Aanya');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aanya');
    await expect(page.getByRole('heading', { name: 'Haldi', exact: true })).toBeVisible();
    await noOverflow(page);
  });
});
