import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { themes } from '../src/data/themes';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

function imageAsset(source: string) {
  const url = new URL(source, 'http://127.0.0.1');
  return url.searchParams.get('url') || url.pathname;
}

async function loadedArtwork(art: Locator) {
  await expect(art).toBeVisible();
  const assets: string[] = [];
  for (const image of await art.locator('img').all()) {
    if (!await image.isVisible()) continue;
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    assets.push(imageAsset(await image.getAttribute('src') || ''));
  }
  for (const svg of await art.locator('svg').all()) {
    if (!await svg.isVisible()) continue;
    if (!await svg.locator('path,rect,circle,ellipse,line,polyline,polygon,use').count()) continue;
    expect(await svg.evaluate(node => (node as SVGSVGElement).getBBox().width)).toBeGreaterThan(0);
  }
  const geometry = await art.locator('svg').evaluateAll(svgs => svgs.map(svg => [...svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,use,g')].map(shape => ({
    tag: shape.tagName,
    shape: [...shape.attributes].filter(attribute => ['d','x','y','x1','x2','y1','y2','cx','cy','rx','ry','r','width','height','points','transform'].includes(attribute.name)).map(attribute => [attribute.name, attribute.value]),
  }))));
  return { images: [...new Set(assets)].sort(), vector: createHash('sha256').update(JSON.stringify(geometry)).digest('hex') };
}

test('all ten wedding covers are real, match their gallery artwork and fit every screen width', async ({ page }) => {
  test.setTimeout(120000);
  const width = page.viewportSize()!.width;
  const galleryAssets = new Map<string, Awaited<ReturnType<typeof loadedArtwork>>>();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('artifacts/creative-templates-after', { recursive: true });
  await page.goto('/templates');
  await expect(page.locator('article.collection-card')).toHaveCount(10);
  await expect(page.locator('article.collection-card [data-illustrated-cover]')).toHaveCount(10);
  if (width <= 600) {
    expect((await page.locator('article.collection-card').first().boundingBox())!.width, 'Phone galleries show one readable stationery card per row').toBeGreaterThan(width * .75);
  }
  for (const theme of themes) {
    const card = page.locator(`article.collection-card [data-illustrated-cover="${theme.id}"]`);
    await expect(card).toHaveAttribute('data-compact', 'true');
    galleryAssets.set(theme.id, await loadedArtwork(card));
  }
  expect(new Set([...galleryAssets.values()].map(art => art.vector)).size).toBe(10);
  await page.evaluate(() => document.fonts.ready);
  const firstRow = await page.locator('article.collection-card').evaluateAll(cards => {
    const rowTop = cards[0].getBoundingClientRect().top;
    return cards.filter(card => Math.abs(card.getBoundingClientRect().top - rowTop) < 1).map(card => ({
      copyTop: card.querySelector('.collection-card-copy')!.getBoundingClientRect().top,
      previewHeight: card.querySelector('.collection-card-preview')!.getBoundingClientRect().height,
    }));
  });
  expect(Math.max(...firstRow.map(card => card.copyTop)) - Math.min(...firstRow.map(card => card.copyTop)), 'Gallery descriptions share a row baseline').toBeLessThanOrEqual(1);
  expect(Math.max(...firstRow.map(card => card.previewHeight)) - Math.min(...firstRow.map(card => card.previewHeight)), 'Gallery previews share a row height').toBeLessThanOrEqual(1);
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `artifacts/creative-templates-after/gallery-viewport-${width}.png` });
  await page.locator('#collection').screenshot({ path: `artifacts/creative-templates-after/gallery-collection-${width}.png` });

  const search = page.getByRole('searchbox', { name: 'Find a design', exact: true });
  await search.fill('Midnight Mehfil');
  await expect(page.locator('article.collection-card')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Customize Midnight Mehfil', exact: true })).toHaveAttribute('href', /theme=mehfil.*occasion=wedding/);
  await search.fill('');
  const filters = page.getByRole('group', { name: 'Filter invitation styles' });
  await filters.getByRole('button', { name: 'Minimal', exact: true }).click();
  await expect(page.locator('article.collection-card')).toHaveCount(2);
  await filters.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('article.collection-card')).toHaveCount(10);

  for (const theme of themes) {
    await page.goto(`/demo?theme=${theme.id}`);
    const stage = page.locator(`#invitation[data-signature-cover="${theme.id}"]`);
    await expect(stage).toBeVisible();
    const art = stage.locator(`[data-illustrated-cover="${theme.id}"]`);
    await expect(art).toHaveAttribute('data-compact', 'false');
    const opening = stage.getByRole('button', { name: 'Open invitation', exact: true });
    if (theme.id === 'royal' || theme.id === 'mehfil') {
      await expect(opening).toBeVisible();
      await page.screenshot({ path: `artifacts/creative-templates-after/${theme.id}-opening-${width}.png` });
      await opening.click();
      await expect(stage.locator('[data-section="opening"]')).toHaveCount(0);
      await expect(stage).toBeFocused();
    } else await expect(opening).toHaveCount(0);
    expect(await loadedArtwork(art)).toEqual(galleryAssets.get(theme.id));
    await expect(art).toContainText('Aanya');
    await expect(art).toContainText('Kabir');
    await expect(stage.getByRole('navigation', { name: 'Quick invitation details' }).getByRole('link', { name: /Schedule & directions/ })).toHaveAttribute('href', '#celebrations');
    await expect(stage.getByRole('link', { name: /^RSVP/ })).toHaveAttribute('href', '#rsvp');
    await expect(page.locator('audio[autoplay],video[autoplay]')).toHaveCount(0);
    await noOverflow(page);
    await stage.screenshot({ path: `artifacts/creative-templates-after/${theme.id}-cover-${width}.png` });
  }
  expect(errors).toEqual([]);
});

test.describe('interactive illustrated openings', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('Royal and Mehfil open by keyboard, hand off focus and respect reduced motion', async ({ page }) => {
    for (const theme of ['royal', 'mehfil']) {
      await page.goto(`/demo?theme=${theme}`);
      const stage = page.locator('#invitation');
      const reveal = stage.locator('[data-reveal-phase]');
      const open = stage.getByRole('button', { name: 'Open invitation', exact: true });
      await expect(reveal).toHaveAttribute('data-reveal-phase', 'closed');
      await open.focus();
      await expect(open).toBeFocused();
      await open.press('Enter');
      await expect(reveal).toHaveAttribute('data-reveal-phase', 'opening');
      await expect(reveal).toHaveAttribute('data-reveal-phase', 'open');
      await expect(stage).toBeFocused();
      await expect(stage.locator('[data-section="opening"]')).toHaveCount(0);
      await noOverflow(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await open.focus();
      await open.press('Space');
      await expect(reveal).toHaveAttribute('data-reveal-phase', 'open');
      await expect(stage).toBeFocused();
      expect(await stage.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
      await noOverflow(page);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.reload();
      await open.focus();
      await open.press('Enter');
      await expect(reveal).toHaveAttribute('data-reveal-phase', 'opening');
      await page.keyboard.press('Tab');
      const directions = stage.getByRole('navigation', { name: 'Quick invitation details' }).getByRole('link', { name: /Schedule & directions/ });
      await expect(directions).toBeFocused();
      await expect(reveal).toHaveAttribute('data-reveal-phase', 'open');
      await expect(directions, 'Opening must preserve a guest’s deliberate keyboard navigation').toBeFocused();
    }
  });
});

test('long multilingual names survive all theme switches, quiet artwork, save and real previews', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'Complete editor journey at 360px, with actual phone and desktop previews');
  test.setTimeout(120000);
  await page.goto('/customize?occasion=wedding&theme=royal');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  const first = 'Ananya Harpreet Kaur · अनन्या';
  const second = 'Arjun Sukhpreet Singh · ਅਰਜੁਨ';
  const message = 'ਸਾਡੇ ਨਾਲ ਆਓ · हमारे साथ आइए · Join our families for an evening together.';
  await page.getByLabel('First name', { exact: true }).fill(first);
  await page.getByLabel('Second name', { exact: true }).fill(second);
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill(message);
  await page.getByLabel(/^Event date and time/).fill('2027-04-03T12:00');
  await page.getByLabel('City', { exact: true }).fill('Chandigarh');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('combobox', { name: 'Typography', exact: true }).selectOption('sans');
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  for (const theme of themes) {
    await page.getByRole('button', { name: theme.name, exact: true }).click();
    const art = frame.locator(`#invitation [data-illustrated-cover="${theme.id}"]`);
    await expect(art).toContainText(first);
    await expect(art).toContainText(second);
    await expect(art.getByText(first, { exact: true })).toHaveCSS('font-family', /sans-serif/);
    const lastName = await art.getByText(second, { exact: true }).boundingBox();
    const date = await art.getByText(/3 April 2027/).boundingBox();
    expect(lastName).not.toBeNull();
    expect(date).not.toBeNull();
    expect(date!.y, `${theme.id}: date below editable names`).toBeGreaterThanOrEqual(lastName!.y + lastName!.height - 1);
    await expect(frame.locator('main')).toContainText(message);
    const overflow = await frame.locator('html').evaluate(node => ({
      width: node.scrollWidth - node.clientWidth,
      elements: [...document.querySelectorAll('main *')].filter(element => {
        if (!(element instanceof HTMLElement)) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && (bounds.left < -1 || bounds.right > node.clientWidth + 1 || element.scrollWidth > element.clientWidth + 1);
      }).slice(0, 16).map(element => {
        const bounds = element.getBoundingClientRect();
        return { tag: element.tagName, class: element.className, text: element.textContent?.slice(0, 80), left: bounds.left, right: bounds.right, width: bounds.width, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      }),
    }));
    expect(overflow.width, `${theme.id}: ${JSON.stringify(overflow.elements)}`).toBeLessThanOrEqual(0);
  }
  await page.getByRole('button', { name: 'Royal Indian', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Open invitation', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: /^Decorative artwork/ }).uncheck();
  await expect(frame.locator('#invitation [data-illustrated-cover]')).toHaveAttribute('data-artwork', 'off');
  await expect(frame.locator('#invitation [data-decoration]')).toHaveCount(0);
  await expect(frame.getByRole('button', { name: 'Open invitation', exact: true })).toHaveCount(0);
  await expect(frame.locator('#invitation')).toContainText(first);
  await expect(frame.locator('#invitation')).toContainText(second);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /^Decorative artwork/ })).not.toBeChecked();
  await expect(frame.locator('#invitation')).toContainText(first);
  await page.getByRole('checkbox', { name: /^Decorative artwork/ }).check();
  await expect(frame.locator('#invitation [data-illustrated-cover]')).toHaveAttribute('data-artwork', 'on');
  await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Live invitation preview', exact: true });
  await expect(dialog).toBeVisible();
  await frame.getByRole('button', { name: 'Open invitation', exact: true }).click();
  await expect(frame.locator('#invitation')).toBeFocused();
  await page.screenshot({ path: 'artifacts/creative-templates-after/editor-long-names-phone.png' });
  await page.getByRole('button', { name: 'Desktop · 1280px', exact: true }).click();
  await expect(page.locator('iframe[title="Actual guest invitation preview"]')).toHaveCSS('width', '1280px');
  await expect(frame.locator('#invitation')).toContainText(first);
  expect(await frame.locator('html').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'artifacts/creative-templates-after/editor-long-names-desktop.png' });
  await dialog.getByRole('button', { name: 'Back to editing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Preview invitation', exact: true })).toBeFocused();
});

test('maximum-length blessing, cover text and city stay readable in every real editor preview', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-320', '320px editor with the actual 360px phone preview');
  test.setTimeout(120000);
  const maximumText = (phrase: string, length: number) => phrase.repeat(Math.ceil(length / phrase.length)).slice(0, length - 1) + '!';
  const blessing = maximumText('May our families share kindness and joy. प्यार और आशीर्वाद · ਪਿਆਰ ਨਾਲ ਆਓ. ', 1000);
  const cover = maximumText('Together with our families, join us for this beautiful wedding celebration. ', 160);
  const city = maximumText('Chandigarh, Punjab · Our family celebration at the garden courtyard. ', 160);
  await mkdir('artifacts/creative-templates-edge-after', { recursive: true });
  await page.goto('/customize?occasion=wedding&theme=royal');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByLabel('First name', { exact: true }).fill('Aanya');
  await page.getByLabel('Second name', { exact: true }).fill('Kabir');
  await page.getByLabel(/^Event date and time/).fill('2027-04-03T12:00');
  await page.getByLabel('City', { exact: true }).fill(city);
  await page.getByLabel(/^Blessing or personal note/).fill(blessing);
  await expect(page.getByLabel('City', { exact: true })).toHaveValue(city);
  await expect(page.getByLabel(/^Blessing or personal note/)).toHaveValue(blessing);
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByLabel(/^Cover text/).fill(cover);
  await expect(page.getByLabel(/^Cover text/)).toHaveValue(cover);
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  const dialog = page.getByRole('dialog', { name: 'Live invitation preview', exact: true });
  for (const theme of themes) {
    await page.getByRole('button', { name: theme.name, exact: true }).click();
    await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
    await expect(dialog).toBeVisible();
    const art = frame.locator(`#invitation [data-illustrated-cover="${theme.id}"]`);
    await expect(art.getByText(blessing, { exact: true })).toBeVisible();
    await expect(art.getByText(cover, { exact: true })).toBeVisible();
    await expect(art.getByText(city, { exact: true })).toBeVisible();
    await expect(art.locator('[data-cover-reading-area]')).toBeVisible();
    await art.evaluate(() => document.fonts.ready);
    const opening = frame.getByRole('button', { name: 'Open invitation', exact: true });
    if (await opening.count()) {
      await opening.click();
      await expect(frame.locator('#invitation [data-section="opening"]')).toHaveCount(0);
    }
    const layout = await art.evaluate((element, content) => {
      const readingArea = element.querySelector('[data-cover-reading-area]')!;
      const paper = readingArea.getBoundingClientRect();
      const background = getComputedStyle(readingArea).backgroundColor;
      const rgba = (color: string) => (color.match(/[\d.]+/g) || []).map(Number);
      const luminance = (color: string) => rgba(color).slice(0, 3).map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
      const contrast = (color: string) => {
        const values = [luminance(color), luminance(background)].sort((a, b) => b - a);
        return (values[0] + .05) / (values[1] + .05);
      };
      const labels = [content.blessing, content.cover, 'Aanya', 'Kabir', '3 April 2027', content.city];
      const blocks = labels.map(text => {
        const node = [...element.querySelectorAll('p,span')].find(candidate => candidate.textContent === text && ![...candidate.children].some(child => child.textContent === text))!;
        const bounds = node.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        return {
          fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
          contrast: contrast(getComputedStyle(node).color),
          top: bounds.top,
          bottom: bounds.bottom,
          textFits: [...range.getClientRects()].every(rect => rect.left >= paper.left - 1 && rect.right <= paper.right + 1 && rect.top >= paper.top - 1 && rect.bottom <= paper.bottom + 1),
          unclipped: node.scrollWidth <= node.clientWidth + 1 || getComputedStyle(node).display === 'inline',
        };
      });
      return { blocks, opaqueReadingArea: (rgba(background)[3] ?? 1) === 1, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    }, { blessing, cover, city });
    expect(layout.opaqueReadingArea, `${theme.id}: the reading area has its own solid paper surface`).toBe(true);
    expect(layout.overflow, `${theme.id}: maximum copy fits the guest viewport`).toBeLessThanOrEqual(0);
    for (let index = 0; index < layout.blocks.length; index++) {
      const block = layout.blocks[index];
      expect(block.textFits, `${theme.id}: text block ${index + 1} remains inside the painted reading area`).toBe(true);
      expect(block.unclipped, `${theme.id}: text block ${index + 1} is not horizontally clipped`).toBe(true);
      expect(block.contrast, `${theme.id}: text contrasts with its painted reading surface`).toBeGreaterThanOrEqual(4.5);
      expect(block.fontSize, `${theme.id}: text remains legible without shrinking to fit`).toBeGreaterThanOrEqual(index === 1 ? 12 : 14);
      if (index) expect(block.top, `${theme.id}: consecutive text blocks do not overlap`).toBeGreaterThanOrEqual(layout.blocks[index - 1].bottom - 1);
    }
    await frame.locator('html').evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `artifacts/creative-templates-edge-after/${theme.id}-maximum-copy-top-320.png` });
    await art.getByText(city, { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/creative-templates-edge-after/${theme.id}-maximum-copy-footer-320.png` });
    await dialog.getByRole('button', { name: 'Back to editing', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByLabel(/^Blessing or personal note/)).toHaveValue(blessing);
  await expect(page.getByLabel('City', { exact: true })).toHaveValue(city);
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByLabel(/^Cover text/)).toHaveValue(cover);
  await expect(frame.locator('#invitation [data-illustrated-cover="sindoor"]')).toContainText(blessing);
  await noOverflow(page);
});
