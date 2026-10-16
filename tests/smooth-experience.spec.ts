import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/visitor-welcome', route => route.fulfill({ json: { enabled: false } }));
  await page.route('https://pagead2.googlesyndication.com/**', route => route.abort());
});

test('native scrolling, touch controls and reduced motion stay usable', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const paper = page.locator('img[alt="Ivory invitation paper with a sage ribbon and gold confetti"]');
  await expect.poll(() => paper.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('link', { name: 'A LITTLE LOOK INSIDE' }).click();
  await expect(page.locator('#full-control h2')).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200);
  await expect(page.getByText('Made by Sukhpreet', { exact: false })).toHaveCount(0);
  if (info.project.name.startsWith('mobile') || info.project.name === 'tablet') await expect(page.locator('[data-motion-cursor]')).toHaveCSS('display', 'none');
  else {
    await page.mouse.move(120, 300);
    await expect(page.locator('[data-motion-cursor]')).toHaveAttribute('data-visible', 'true');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-motion-cursor]')).toHaveCSS('display', 'none');
  await expect(paper).toHaveCSS('translate', 'none');
  await page.screenshot({ path: info.outputPath('home-controls.png'), fullPage: true });

  for (const occasion of ['wedding', 'engagement']) {
    await page.goto(`/demo?occasion=${occasion}&theme=meenaya`);
    await expect(page.getByRole('button', { name: 'Open invitation', exact: true })).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Skip opening', exact: true }).click();
    if (occasion === 'wedding') {
      await page.getByRole('navigation', { name: 'Invitation sections' }).getByRole('link', { name: 'Our story' }).click();
      const heading = page.locator('#story h1');
      await expect(heading).toBeInViewport({ ratio: 1 });
      expect(await heading.evaluate(element => {
        const box = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + 2));
      })).toBe(true);
    }
    const album = page.locator('[data-photo-album]');
    await expect(album).toHaveAttribute('data-count', '3');
    await album.scrollIntoViewIfNeeded();
    await expect.poll(() => album.locator('img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    expect(await album.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).src.includes('couple-')))).toBe(true);
    await album.getByRole('button', { name: 'Next album photo' }).click();
    await expect(album).toHaveAttribute('data-photo-index', '1');
    await album.locator('[data-position="center"]').click();
    const gallery = page.getByRole('dialog', { name: 'Invitation photo gallery' });
    await expect(gallery).toBeVisible();
    await gallery.getByRole('button', { name: 'Close photo gallery' }).click();
    await expect(gallery).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: info.outputPath(`${occasion}-album.png`) });
  }
  expect(errors).toEqual([]);
});
