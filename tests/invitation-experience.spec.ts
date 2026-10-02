import { expect, test, type Page } from '@playwright/test';
import { occasionDemo } from '../src/data/occasion-demos';
import { getDesign } from '../src/data/occasions';
import type { Invitation, OccasionId, ThemeId } from '../src/types/invitation';
import type { EventPhoto } from '../src/types/media';

const eventId = '11111111-1111-4111-a111-111111111111';
const photographs: EventPhoto[] = [
  { id: '22222222-2222-4222-a222-222222222222', alt: 'A walk through the palace', width: 1536, height: 1024 },
  { id: '33333333-3333-4333-a333-333333333333', alt: 'An evening in the courtyard', width: 1536, height: 1024 },
  { id: '44444444-4444-4444-a444-444444444444', alt: 'A favourite moment together', width: 1536, height: 1024 },
].map(photo => ({ ...photo, url: `/dashboard/events/${eventId}/media/${photo.id}` }));

async function fixturePhotos(page: Page) {
  await page.route(url => url.pathname.startsWith(`/dashboard/events/${eventId}/media/`), route => {
    const second = new URL(route.request().url()).pathname.endsWith(photographs[1].id);
    return route.fulfill({ path: `public/images/wedding/${second ? 'courtyard' : 'palace-walk'}.webp`, contentType: 'image/webp' });
  });
}

function invitation(occasion: OccasionId = 'wedding', theme: ThemeId = 'royal', motion: 'none' | 'gentle' | 'expressive' = 'gentle') {
  const value = structuredClone(occasionDemo(occasion, theme));
  value.design = { ...getDesign(value), motion, opening: { style: 'none', icon: 'rings', line: '' } };
  value.coverPhotoId = photographs[1].id;
  return value;
}

async function preview(page: Page, value: Invitation, themeId: ThemeId = 'royal', photos = photographs) {
  await fixturePhotos(page);
  await page.goto('/preview');
  await expect.poll(async () => {
    await page.evaluate(payload => window.postMessage(payload, window.location.origin), {
      type: 'invitly-preview', draft: { themeId, invitation: value, musicEnabled: false }, photos,
    });
    return page.locator('[data-invitation-root]').count();
  }).toBe(1);
}

test('the chosen cover starts first and slideshow controls pause, wrap and remain accessible', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await preview(page, invitation());
  const hero = page.getByRole('region', { name: 'Invitation photographs', exact: true });
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-photo-index', '0');
  await expect(hero.locator('[data-active=true] img')).toHaveAttribute('alt', photographs[1].alt);
  await hero.getByRole('button', { name: 'Pause cover slideshow' }).click();
  await expect(hero).toHaveAttribute('data-paused', 'true');
  await page.clock.runFor(14000);
  await expect(hero).toHaveAttribute('data-photo-index', '0');
  await hero.getByRole('button', { name: 'Previous cover photo' }).click();
  await expect(hero).toHaveAttribute('data-photo-index', '2');
  await expect(hero.locator('[data-active=true] img')).toHaveAttribute('alt', photographs[2].alt);
  await hero.getByRole('button', { name: 'Next cover photo' }).click();
  await expect(hero).toHaveAttribute('data-photo-index', '0');
  await hero.getByRole('button', { name: 'Play cover slideshow' }).click();
  await expect(hero.getByRole('button', { name: 'Pause cover slideshow' })).toBeFocused();
  await page.mouse.move(0, 0);
  await expect(hero).toHaveAttribute('data-photo-playing', 'false');
  await page.clock.runFor(7000);
  await expect(hero).toHaveAttribute('data-photo-index', '0');
  // Leaving with the pointer must not override keyboard focus inside the carousel.
  await page.keyboard.press('Tab');
  await expect(hero).toHaveAttribute('data-photo-playing', 'true');
  await page.clock.runFor(7000);
  await expect(hero).toHaveAttribute('data-photo-index', '1');
  for (const button of await hero.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await hero.screenshot({ path: `artifacts/screenshots/experience-cover-${info.project.name}.png` });
});

test('photo autoplay runs only while visible and stops for a user pause', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await preview(page, invitation('birthday', 'kesar'), 'kesar');
  const hero = page.locator('[data-photo-slideshow]');
  await hero.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(hero).toHaveAttribute('data-photo-playing', 'true');
  await page.clock.runFor(7000);
  await expect(hero).toHaveAttribute('data-photo-index', '1');
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  // Wait for the real visibility notification before advancing the synthetic clock.
  await expect(hero).toHaveAttribute('data-photo-playing', 'false');
  const awayIndex = await hero.getAttribute('data-photo-index');
  await page.clock.runFor(14000);
  await expect(hero).toHaveAttribute('data-photo-index', awayIndex!);
  await hero.scrollIntoViewIfNeeded();
  await hero.getByRole('button', { name: 'Pause cover slideshow' }).click();
  await page.clock.runFor(14000);
  await expect(hero).toHaveAttribute('data-photo-index', awayIndex!);
});

test('the three-photo album supports manual rotation, lightbox keyboard navigation and closing', async ({ page }, info) => {
  await preview(page, invitation());
  const album = page.getByRole('region', { name: 'Photo album', exact: true });
  await album.scrollIntoViewIfNeeded();
  await expect(album.locator('[data-position=center]')).toHaveCount(1);
  await expect(album.locator('[data-position=left]')).toHaveCount(1);
  await expect(album.locator('[data-position=right]')).toHaveCount(1);
  await album.getByRole('button', { name: 'Next album photo' }).click();
  await expect(album).toHaveAttribute('data-photo-index', '1');
  await expect(album.locator('[data-position=center]')).toHaveAccessibleName(`View photo 2: ${photographs[1].alt}`);
  await album.screenshot({ path: `artifacts/screenshots/experience-album-${info.project.name}.png` });
  await album.locator('[data-position=center]').click();
  const lightbox = page.getByRole('dialog', { name: 'Invitation photo gallery' });
  await expect(lightbox).toBeVisible();
  await expect(lightbox.getByRole('img')).toHaveAttribute('alt', photographs[1].alt);
  await page.keyboard.press('ArrowRight');
  await expect(lightbox.getByRole('img')).toHaveAttribute('alt', photographs[2].alt);
  await page.keyboard.press('ArrowLeft');
  await expect(lightbox.getByRole('img')).toHaveAttribute('alt', photographs[1].alt);
  await page.keyboard.press('Escape');
  await expect(lightbox).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('reduced motion and the host motion-off setting stop autoplay while keeping manual photographs usable', async ({ page }) => {
  await page.clock.install();
  for (const hostMotion of ['gentle', 'none'] as const) {
    await page.emulateMedia({ reducedMotion: hostMotion === 'gentle' ? 'reduce' : 'no-preference' });
    await preview(page, invitation('engagement', 'lotus', hostMotion), 'lotus');
    const hero = page.locator('[data-photo-slideshow]');
    await hero.scrollIntoViewIfNeeded();
    await page.clock.runFor(14000);
    await expect(hero).toHaveAttribute('data-photo-index', '0');
    await hero.getByRole('button', { name: 'Next cover photo' }).click();
    await expect(hero).toHaveAttribute('data-photo-index', '1');
    expect(await hero.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
    await expect(hero.getByRole('button', { name: /cover slideshow/ })).not.toBeVisible();
    const album = page.locator('[data-photo-album]');
    await album.scrollIntoViewIfNeeded();
    await page.clock.runFor(15000);
    await expect(album).toHaveAttribute('data-photo-index', '0');
    await album.getByRole('button', { name: 'Next album photo' }).click();
    await expect(album).toHaveAttribute('data-photo-index', '1');
  }
});

test('dhol sticks and drum parts play independently only while in view', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await preview(page, invitation('wedding', 'modern'), 'modern', []);
  const art = page.locator('[data-ceremony-art=sangeet]');
  await expect(art).toHaveAttribute('data-art-active', 'false');
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute('data-art-active', 'true');
  for (const name of ['drum-stick-high', 'drum-stick-low', 'drum-skin', 'drum-tassel']) {
    const part = art.locator(`[data-art-layer="${name}"]`);
    const first = await part.evaluate(element => getComputedStyle(element).transform);
    await expect.poll(() => part.evaluate(element => getComputedStyle(element).transform)).not.toBe(first);
  }
  expect(await art.locator('img').evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await art.screenshot({ path: `artifacts/screenshots/experience-playing-dhol-${info.project.name}.png` });
  await page.locator('#invitation').scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute('data-art-active', 'false');
  expect(await art.locator('[data-art-layer]').evaluateAll(elements => elements.every(element => getComputedStyle(element).animationPlayState === 'paused'))).toBe(true);
  await art.scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(art).toHaveAttribute('data-art-active', 'false');
  expect(await art.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const still = invitation('wedding', 'modern', 'none');
  await preview(page, still, 'modern', []);
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute('data-art-active', 'false');
  expect(await art.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  still.design!.decoration = false;
  await preview(page, still, 'modern', []);
  await expect(page.locator('[data-ceremony-art]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Sangeet', exact: true })).toBeVisible();
});

test('every named ceremony has its own moving parts and remembrance remains still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const value = invitation('wedding', 'modern');
  const names = ['Haldi', 'Sangeet', 'Mehndi', 'Wedding', 'Reception', 'Baraat', 'Engagement', 'Birthday', 'Baby shower', 'Housewarming', 'Naming', 'Anniversary', 'Memorial'];
  value.functions = names.map((name, index) => ({ ...value.functions[0], id: `event-${index}`, name }));
  await preview(page, value, 'modern', []);
  await expect(page.locator('[data-ceremony-art]')).toHaveCount(names.length);
  for (const art of await page.locator('[data-ceremony-art]').all()) {
    await art.scrollIntoViewIfNeeded();
    const quiet = await art.getAttribute('data-ceremony-art') === 'remembrance';
    await expect(art).toHaveAttribute('data-art-active', String(!quiet));
    await expect.poll(() => art.locator('img').evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    if (quiet) expect(await art.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
    else expect(await art.locator('[data-art-layer]').count()).toBeGreaterThan(0);
  }
  await preview(page, invitation('remembrance', 'modern', 'expressive'), 'modern');
  await expect(page.locator('[data-invitation-root]')).toHaveAttribute('data-motion', 'none');
  const art = page.locator('[data-ceremony-art=remembrance]');
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute('data-art-active', 'false');
  expect(await art.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
});
