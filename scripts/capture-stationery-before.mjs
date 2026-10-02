import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Stationery baseline capture is local only.');
const output = 'artifacts/stationery-before';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const evidence = [];
try {
  for (const [width, height] of [[320,740],[360,800],[390,844],[768,1024],[1440,1000]]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const response = await page.goto('/');
    if (!response?.ok()) throw new Error(`Homepage capture failed at ${width}px.`);
    await page.evaluate(() => document.fonts.ready);
    const hero = page.locator('main .hero');
    await hero.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => undefined))));
    await page.screenshot({ path: `${output}/homepage-viewport-${width}.png` });
    await hero.screenshot({ path: `${output}/hero-${width}.png` });
    evidence.push({ width, height, route: '/', overflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/capture.json`, JSON.stringify({ capturedAt: new Date().toISOString(), baseURL, evidence }, null, 2));
console.log(`Captured the current homepage viewport and hero at ${evidence.length} widths.`);
