import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Before capture is local only.');
const output = 'artifacts/home-editor-before';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const evidence = [];
try {
  for (const [width, height] of [[320,740],[360,800],[390,844],[768,1024],[1440,1000]]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.screenshot({ path: `${output}/homepage-${width}.png`, fullPage: true });
    await page.locator('footer').screenshot({ path: `${output}/footer-${width}.png` });
    await page.goto('/customize?occasion=birthday&theme=kesar');
    await page.screenshot({ path: `${output}/editor-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await page.getByLabel('Birthday person’s name', { exact: true }).fill('Anaya');
    await page.screenshot({ path: `${output}/editor-details-${width}.png`, fullPage: true });
    evidence.push({ width, height, routes: ['/', '/customize?occasion=birthday&theme=kesar'] });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/capture.json`, JSON.stringify({ capturedAt: new Date().toISOString(), baseURL, evidence }, null, 2));
console.log(`Captured homepage, footer and editor before changes at ${evidence.length} widths.`);
