import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { blogTopics } from '../src/data/blog';

test('journal topics lead to readable articles and working invitation links', async ({ page }, info) => {
  test.setTimeout(90000);
  await mkdir('artifacts/blog', { recursive: true });
  await page.goto('/blog');
  await expect(page.locator('h1')).toContainText('Good words');
  await expect(page.locator('.journal-card')).toHaveCount(6);
  await page.screenshot({ path: `artifacts/blog/journal-${info.project.name}.png`, fullPage: true, scale: 'css' });
  for (const topic of blogTopics) {
    await page.getByRole('navigation', { name: 'Blog topics', exact: true }).getByRole('link', { name: topic.name }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/category/${topic.slug}$`));
    await expect(page.locator('h1')).toHaveText(topic.name);
    await expect(page.locator('.journal-card')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Blog topics', exact: true }).getByRole('link', { name: topic.name })).toHaveAttribute('aria-current', 'page');
    const articleLink = page.locator('.journal-read-link').first();
    const articlePath = await articleLink.getAttribute('href');
    await articleLink.click();
    await expect(page).toHaveURL(new URL(articlePath!, page.url()).href);
    await expect(page.locator('.journal-article h1')).toBeVisible();
    const title = await page.locator('.journal-article h1').innerText();
    await expect(page).toHaveTitle(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(page.url()).origin + new URL(page.url()).pathname);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('.journal-article-body>section')).toHaveCount(3);
    expect((await page.locator('.journal-article-body').innerText()).trim().split(/\s+/).length).toBeGreaterThan(250);
    await expect(page.locator('.journal-article-cta').getByRole('link', { name: 'Find your design' })).toHaveAttribute('href', `/templates?occasion=${topic.occasion}#collection`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `artifacts/blog/${topic.slug}-${info.project.name}.png`, fullPage: true, scale: 'css' });
    await page.locator('.journal-related').getByRole('link', { name: 'All journal notes' }).click();
    await expect(page).toHaveURL(/\/blog$/);
  }
});

test('footer exposes six blog topics and honest social placeholders without dead links', async ({ page }, info) => {
  await page.goto('/');
  const footer = page.locator('.marketing-footer');
  await footer.scrollIntoViewIfNeeded();
  const topics = footer.getByRole('navigation', { name: 'From the blog', exact: true });
  await expect(topics.getByRole('link')).toHaveCount(6);
  for (const topic of blogTopics) await expect(topics.getByRole('link', { name: topic.name, exact: true })).toHaveAttribute('href', `/blog/category/${topic.slug}`);
  for (const name of ['Instagram', 'Facebook', 'YouTube', 'X', 'LinkedIn']) {
    const social = footer.getByRole('img', { name: `${name} — coming soon`, exact: true });
    await expect(social).toBeVisible();
    expect(await social.evaluate(element => element.closest('a') === null && !element.hasAttribute('tabindex'))).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await mkdir('artifacts/blog', { recursive: true });
  await footer.screenshot({ path: `artifacts/blog/footer-${info.project.name}.png`, scale: 'css' });
  await topics.getByRole('link', { name: 'Weddings', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Weddings');
});

test('draft and unknown articles stay out of public pages', async ({ request }) => {
  for (const route of ['/blog/draft-example', '/blog/not-a-real-post', '/blog/category/not-a-topic']) {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('This is the private draft starter body.');
  }
  for (const route of ['/blog', '/blog/category/wedding']) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain('Draft example: your next journal note');
  }
});
