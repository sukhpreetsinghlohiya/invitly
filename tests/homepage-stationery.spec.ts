import { mkdir } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';

const available = ['wedding', 'engagement'] as const;
const upcoming = ['birthday', 'baby-shower', 'housewarming', 'naming', 'anniversary', 'remembrance', 'other'] as const;

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

async function expectArtworkLoaded(artwork: Locator) {
  await expect(artwork).toBeVisible();
  for (const image of await artwork.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveAttribute('alt', '');
  }
  for (const svg of await artwork.locator('svg').all()) {
    expect(await svg.evaluate(node => [...node.querySelectorAll('use')].every(use => {
      const href = use.getAttribute('href');
      const target = href?.startsWith('#') ? document.getElementById(href.slice(1)) : null;
      return target !== null && node.contains(target);
    }))).toBe(true);
    expect(await svg.evaluate(node => (node as SVGSVGElement).getBBox().width)).toBeGreaterThan(0);
  }
  expect(await artwork.locator('img,svg').count()).toBeGreaterThan(0);
}

test('stationery homepage has readable navigation, loaded artwork and real occasion journeys', async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.marketing-header');
  const hero = page.locator('main .hero.stationery-hero');
  const heroWrap = page.locator('.stationery-hero-wrap');
  const showcase = page.locator('#occasions');
  const login = header.getByRole('link', { name: 'Log in', exact: true });
  await expect(header).toHaveCount(1);
  await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
  if (page.viewportSize()!.width <= 800) {
    await header.getByRole('button', { name: 'Open navigation' }).click();
    const mobile = header.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobile.getByRole('link', { name: 'Host login' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(mobile).toBeHidden();
  } else {
    await expect(login).toHaveAttribute('href', '/login');
    await expect(login).toBeInViewport({ ratio: 1 });
    expect((await login.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    for (const link of await header.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link').all()) await expect(link).toBeInViewport({ ratio: 1 });
  }
  await expect(hero.getByRole('link', { name: 'Create your invitation', exact: true })).toHaveAttribute('href', '/templates#occasion-collections-title');
  await expect(hero.getByRole('link', { name: 'Open a live invitation', exact: true })).toHaveAttribute('href', '/demo');
  await expect(hero.getByRole('link', { name: 'Open the live wedding invitation demo', exact: true })).toHaveAttribute('href', '/demo');
  await expect(hero.locator('button,[aria-roledescription="carousel"]')).toHaveCount(0);
  await expect(page.locator('audio[autoplay],video[autoplay]')).toHaveCount(0);
  await expectNoOverflow(page);

  await expectArtworkLoaded(hero.getByRole('link', { name: 'Open the live wedding invitation demo', exact: true }));
  await expect(heroWrap.locator('img.stationery-botanical')).toHaveCount(2);
  for (const image of await heroWrap.locator('img.stationery-botanical').all()) {
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveAttribute('alt', '');
    await expect(image).toHaveAttribute('aria-hidden', 'true');
    await expect(image).toHaveAttribute('width', '600');
    await expect(image).toHaveAttribute('height', '900');
    await expect(image).toHaveAttribute('sizes', /.+/);
  }
  await expect(showcase.locator('.occasion-showcase-card')).toHaveCount(4);
  await expect(showcase.locator('[data-occasion]')).toHaveCount(9);
  await expect(showcase.locator('a[data-occasion]')).toHaveCount(2);
  for (const occasion of upcoming) {
    const card = showcase.locator(`[data-occasion="${occasion}"]`);
    await expect(card).toContainText('Coming soon');
    await expect(card).not.toHaveAttribute('href');
    await expect(card.locator('a,button')).toHaveCount(0);
  }
  const footerOccasions = page.locator('.marketing-footer').getByRole('navigation', { name: 'Invitation occasions', exact: true });
  await expect(footerOccasions.locator('a[href*="occasion="]')).toHaveCount(2);
  for (const occasion of upcoming) {
    const label = footerOccasions.locator(`[data-coming-soon="${occasion}"]`);
    await expect(label).toContainText('Coming soon');
    await expect(label.locator('a,button')).toHaveCount(0);
  }
  for (const occasion of available) {
    const link = showcase.locator(`a[data-occasion="${occasion}"]`);
    const href = `/templates?occasion=${occasion}#collection`;
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAccessibleName(/.+/);
    expect((await page.request.get(href)).ok(), occasion).toBe(true);
  }
  for (const card of await showcase.locator('.showcase-paper').all()) {
    await expect(card).toHaveAttribute('aria-hidden', 'true');
    await expectArtworkLoaded(card);
  }
  await expectNoOverflow(page);
  await mkdir('artifacts/stationery-after', { recursive: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `artifacts/stationery-after/homepage-viewport-${info.project.name}.png` });
  await heroWrap.screenshot({ path: `artifacts/stationery-after/hero-${info.project.name}.png` });
  await showcase.screenshot({ path: `artifacts/stationery-after/occasions-${info.project.name}.png` });

  const create = hero.getByRole('link', { name: 'Create your invitation', exact: true });
  await create.focus();
  await expect(create).toBeFocused();
  await create.press('Enter');
  await expect(page).toHaveURL(/\/templates#occasion-collections-title$/);
  await expect(page.locator('#occasion-collections-title')).toBeInViewport();
  await page.goto('/');
  await hero.getByRole('link', { name: 'Open a live invitation', exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Aanya', { exact: false }).first()).toBeVisible();

  for (const occasion of available) {
    await page.goto('/');
    await showcase.locator(`a[data-occasion="${occasion}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/templates\\?occasion=${occasion}#collection$`));
    await expect(page.locator('.occasion-collection[aria-current="page"]')).toHaveAttribute('href', `/templates?occasion=${occasion}#collection`);
    await expect(page.locator('article.collection-card')).toHaveCount(occasion === 'wedding' ? 10 : 3);
    await expectNoOverflow(page);
  }
  await page.goto('/');
  if (page.viewportSize()!.width <= 800) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Host login' }).click();
  } else await login.click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('stationery decorations respect reduced motion without hiding content or adding media playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.locator('main .hero.stationery-hero');
  const showcase = page.locator('#occasions');
  await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(showcase.getByRole('heading', { level: 2 })).toBeVisible();
  const movingDecorations = await page.locator('.stationery-hero-wrap *, .occasion-showcase *').evaluateAll(nodes => nodes.flatMap(node => {
    const style = getComputedStyle(node);
    const durations = `${style.animationDuration},${style.transitionDuration}`.split(',').map(value => {
      const duration = Number.parseFloat(value);
      return value.trim().endsWith('ms') ? duration / 1000 : duration;
    });
    return durations.some(duration => duration > 0.001) ? [node.getAttribute('class') || node.tagName] : [];
  }));
  expect(movingDecorations).toEqual([]);
  await expect(page.locator('audio,video')).toHaveCount(0);
  await expectNoOverflow(page);
});
