import { expect, test, type Locator } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createOccasionInvitation, occasions } from '../src/data/occasions';
import { getOccasionThemes } from '../src/data/occasion-themes';

test.use({ actionTimeout: 10000 });

async function expectReadableText(sheet: Locator) {
  const clipped = await sheet.evaluate(element => {
    const paper = element.getBoundingClientRect();
    return [...element.querySelectorAll('h1,p,div > span,small')].filter(node => node.textContent?.trim()).flatMap(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const fits = [...range.getClientRects()].every(rect => rect.left >= paper.left - 1 && rect.right <= paper.right + 1 && rect.top >= paper.top - 1 && rect.bottom <= paper.bottom + 1);
      return fits ? [] : [node.textContent];
    });
  });
  expect(clipped, 'Personal text stays inside the complete stationery sheet').toEqual([]);
}

for (const occasion of occasions.filter(item => item.id !== 'wedding')) {
  test(`${occasion.id} preserves long multilingual copy, palette and artwork controls across its three designs`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-360', 'Full editing journey at phone width; guest covers have a separate viewport matrix');
    test.setTimeout(60000);
    const first = 'Ananya Harpreet Kaur · अनन्या कौर · ਅਨਨਿਆ ਕੌਰ';
    const second = 'Arjun Sukhpreet Singh · अर्जुन सिंह · ਅਰਜੁਨ ਸਿੰਘ';
    const coverText = 'Together with our families, please join us for an afternoon of stories, kindness and happy memories. हमारे साथ आइए · ਸਾਡੇ ਨਾਲ ਆਓ';
    const city = 'Chandigarh, Punjab · चंडीगढ़ · ਚੰਡੀਗੜ੍ਹ';
    const designs = getOccasionThemes(occasion.id);
    await mkdir('artifacts/occasion-design-regressions', { recursive: true });
    await page.goto(`/customize?occasion=${occasion.id}&theme=${designs[0].id}`);
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await page.getByLabel(occasion.firstLabel, { exact: true }).fill(first);
    if (occasion.secondLabel) await page.getByLabel(occasion.secondLabel, { exact: true }).fill(second);
    await page.getByLabel(/^Event date and time/).fill('2027-04-03T12:00');
    await page.getByLabel('City', { exact: true }).fill(city);
    await page.getByRole('button', { name: 'Schedule', exact: true }).click();
    await page.getByRole('button', { name: 'Add function', exact: true }).click();
    await page.getByLabel('Venue name', { exact: true }).fill('Our family garden');
    await page.getByRole('textbox', { name: 'Venue address', exact: true }).fill('Sector 17, Chandigarh');
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await page.getByLabel(/^Cover text/).fill(coverText);
    await page.getByRole('combobox', { name: 'Colour palette', exact: true }).selectOption('sage');
    await page.getByRole('combobox', { name: 'Typography', exact: true }).selectOption('sans');
    const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
    const cover = frame.locator('#invitation');
    const dialog = page.getByRole('dialog', { name: 'Live invitation preview', exact: true });
    for (const design of designs) {
      await page.getByRole('button', { name: design.name, exact: true }).click();
      await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
      await expect(dialog).toBeVisible();
      await expect(cover).toHaveAttribute('data-occasion-layout', design.layout);
      await expect(cover).toHaveAttribute('data-palette', 'sage');
      await expect(cover).toHaveAttribute('data-typography', 'sans');
      await expect(cover.getByRole('heading', { level: 1 })).toContainText(first);
      if (occasion.secondLabel) await expect(cover.getByRole('heading', { level: 1 })).toContainText(second);
      await expect(cover.getByText(coverText, { exact: true })).toBeVisible();
      await expect(cover.getByText(city, { exact: true })).toBeVisible();
      await cover.evaluate(() => document.fonts.ready);
      await expect(cover.getByRole('heading', { level: 1 })).toHaveCSS('letter-spacing', /^(normal|0px)$/);
      await expect(cover.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /sans-serif/);
      const loadedFonts = await cover.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family).join(' '));
      expect(loadedFonts).toContain('Invitly Devanagari');
      expect(loadedFonts).toContain('Invitly Gurmukhi');
      await expectReadableText(cover.locator('[data-occasion-sheet]'));
      expect(await frame.locator('html').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
      await cover.screenshot({ path: `artifacts/occasion-design-regressions/${occasion.id}-${design.layout}-long-copy.png` });
      await dialog.getByRole('button', { name: 'Back to editing', exact: true }).click();
    }
    await page.getByRole('checkbox', { name: /^Decorative artwork/ }).uncheck();
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
    await page.reload();
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Colour palette', exact: true })).toHaveValue('sage');
    await expect(page.getByRole('combobox', { name: 'Typography', exact: true })).toHaveValue('sans');
    await expect(page.getByRole('checkbox', { name: /^Decorative artwork/ })).not.toBeChecked();
    for (const design of designs) {
      await page.getByRole('button', { name: design.name, exact: true }).click();
      await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
      await expect(cover).toHaveAttribute('data-occasion-layout', design.layout);
      await expect(cover.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(cover.getByText('3 April 2027', { exact: true })).toBeVisible();
      await expect(cover.getByText(city, { exact: true })).toBeVisible();
      await expect(cover.locator('[data-archive-ornament]')).toHaveCount(0);
      await expect(cover.locator('[data-occasion-art] img')).toHaveCount(0);
      await expect(cover.getByRole('link', { name: 'Directions', exact: true })).toBeVisible();
      await expect(cover.getByRole('link', { name: 'RSVP', exact: true })).toBeVisible();
      await expectReadableText(cover.locator('[data-occasion-sheet]'));
      await dialog.getByRole('button', { name: 'Back to editing', exact: true }).click();
    }
  });
}

test('personal cover photos remain visible in all 24 occasion layouts when decorative artwork is off', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-320', 'Photo rendering at the narrowest guest width');
  test.setTimeout(60000);
  const photoUrl = '/dashboard/events/11111111-1111-4111-a111-111111111111/media/22222222-2222-4222-a222-222222222222';
  const photo = { id: '22222222-2222-4222-a222-222222222222', url: photoUrl, alt: 'A personal cover photo', width: 480, height: 360 };
  await page.route(url => url.pathname === photoUrl, route => route.fulfill({ path: 'public/images/occasions/birthday.webp', contentType: 'image/webp' }));
  await page.goto('/preview');
  for (const occasion of occasions.filter(item => item.id !== 'wedding')) for (const design of getOccasionThemes(occasion.id)) {
    const invitation = createOccasionInvitation(occasion.id);
    invitation.couple = ['Ananya · अनन्या · ਅਨਨਿਆ', ''];
    invitation.weddingAt = '2027-04-03T06:30:00.000Z';
    invitation.city = 'Chandigarh';
    invitation.coverPhotoId = photo.id;
    invitation.design!.decoration = false;
    const payload = { type: 'invitly-preview', draft: { themeId: design.id, invitation, musicEnabled: false }, photos: [photo] };
    // Exercise the same-origin preview contract with an intercepted owner-photo route;
    // storage uploads and owner authorization are covered by the integration suite.
    await expect.poll(async () => {
      await page.evaluate(data => window.postMessage(data, window.location.origin), payload);
      return page.locator(`#invitation[data-occasion="${occasion.id}"][data-occasion-layout="${design.layout}"]`).count();
    }).toBe(1);
    const cover = page.locator('#invitation');
    await expect(cover.getByRole('heading', { level: 1 })).toBeVisible();
    const image = cover.getByRole('img', { name: photo.alt, exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(cover.locator('[data-archive-ornament]')).toHaveCount(0);
    await expect(cover.getByText('3 April 2027', { exact: true })).toBeVisible();
    await expect(cover.getByRole('link', { name: 'RSVP', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${occasion.id}/${design.layout}`).toBeLessThanOrEqual(0);
  }
});
