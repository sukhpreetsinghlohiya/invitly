import { expect, test } from '@playwright/test';
import { createOccasionInvitation, getOccasion } from '../src/data/occasions';
import { getOccasionThemes } from '../src/data/occasion-themes';

// Keep this launch expectation independent of the implementation's allow-list.
const available = ['wedding', 'engagement'] as const;
const upcoming = ['birthday', 'baby-shower', 'housewarming', 'naming', 'anniversary', 'remembrance', 'other'] as const;

for (const route of ['/templates', '/demo', '/customize']) {
  test(`${route} shows Coming soon for all seven upcoming occasions`, async ({ page }) => {
    test.setTimeout(60000);
    for (const occasion of upcoming) {
      await page.goto(`${route}?occasion=${occasion}&theme=royal`);
      const notice = page.locator(`[data-coming-soon="${occasion}"]`);
      await expect(notice).toBeVisible();
      await expect(notice.getByRole('heading', { level: 1 })).toContainText(getOccasion(occasion).name);
      await expect(notice.getByText('Coming soon', { exact: true })).toBeVisible();
      await expect(notice.getByRole('link', { name: /Explore weddings/ })).toHaveAttribute('href', '/templates?occasion=wedding#collection');
      await expect(notice.getByRole('link', { name: /Explore engagements/ })).toHaveAttribute('href', '/templates?occasion=engagement#collection');
      await expect(page.locator('.collection-gallery,.editor-workspace-status,#invitation')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${route}/${occasion}`).toBeLessThanOrEqual(0);
    }
  });
}

test('the catalog exposes two live collections and seven clearly labelled non-links', async ({ page }) => {
  await page.goto('/templates');
  await expect(page.locator('.occasion-collection')).toHaveCount(9);
  await expect(page.locator('a.occasion-collection')).toHaveCount(2);
  const choice = page.getByRole('combobox', { name: 'Occasion', exact: true });
  await expect(choice.locator('option')).toHaveCount(9);
  for (const occasion of upcoming) {
    const card = page.locator(`.occasion-collection-${occasion}`);
    await expect(card).toContainText('Coming soon');
    await expect(card).not.toHaveAttribute('href');
    await expect(card.locator('a,button')).toHaveCount(0);
    await expect(choice.locator(`option[value="${occasion}"]`)).toHaveJSProperty('disabled', true);
    await expect(choice.locator(`option[value="${occasion}"]`)).toContainText('Coming soon');
  }
  for (const occasion of available) {
    await expect(page.locator(`a.occasion-collection-${occasion}`)).toHaveAttribute('href', `/templates?occasion=${occasion}#collection`);
    await expect(choice.locator(`option[value="${occasion}"]`)).toHaveJSProperty('disabled', false);
    await choice.selectOption(occasion);
    await expect(page.locator('.collection-gallery')).toHaveAttribute('data-gallery-occasion', occasion);
    await expect(page.locator('article.collection-card')).toHaveCount(occasion === 'wedding' ? 10 : 3);
  }
});

test('the editor permits both live occasions and disables every upcoming choice', async ({ page }) => {
  await page.goto('/customize?occasion=wedding');
  const group = page.getByRole('group', { name: 'Choose an occasion', exact: true });
  await expect(group.getByRole('button')).toHaveCount(9);
  await expect(group.locator('button:enabled')).toHaveCount(2);
  for (const occasion of upcoming) {
    const button = group.getByRole('button', { name: new RegExp(getOccasion(occasion).name) });
    await expect(button).toBeDisabled();
    await expect(button).toContainText('Coming soon');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  }
  for (const occasion of ['engagement', 'wedding'] as const) {
    const button = group.getByRole('button', { name: new RegExp(getOccasion(occasion).name) });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(new RegExp(`occasion=${occasion}(?:&|$)`));
  }
});

test('unsupported device drafts stay intact behind Coming soon and can be reused for an available occasion', async ({ page }) => {
  test.setTimeout(60000);
  const key = 'invitly:invitation-draft:v2';
  await page.goto('/');
  for (const occasion of upcoming) {
    const invitation = createOccasionInvitation(occasion);
    invitation.couple = ['A saved family name', 'A second saved name'];
    const saved = JSON.stringify({ invitation, themeId: getOccasionThemes(occasion)[0].id, musicEnabled: false });
    await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), { key, saved });
    await page.goto('/customize');
    await expect(page.locator(`[data-coming-soon="${occasion}"]`)).toBeVisible();
    await expect(page.locator('.editor-workspace-status')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(saved);
  }
  await page.goto('/customize?occasion=engagement&theme=lotus');
  await expect(page.locator('.editor-workspace-status')).toBeVisible();
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('A saved family name');
  await expect(page.getByLabel('Second name', { exact: true })).toHaveValue('A second saved name');
});

test('saved event entry still uses owner authentication for an upcoming occasion', async ({ page }) => {
  await page.goto('/customize?event=11111111-1111-4111-a111-111111111111&occasion=birthday');
  await expect(page).toHaveURL(/\/(?:login|setup)(?:\?|$)/);
  await expect(page.locator('div[data-coming-soon] h1')).toHaveCount(0);
});
