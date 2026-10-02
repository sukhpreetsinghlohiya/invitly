import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Creative-template baseline capture is local only.');
const output = 'artifacts/creative-templates-before';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const evidence = [];
try {
  for (const [width, height] of [[320,740],[360,800],[390,844],[768,1024],[1440,1000]]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const response = await page.goto('/templates');
    if (!response?.ok()) throw new Error(`Gallery capture failed at ${width}px.`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/gallery-viewport-${width}.png` });
    await page.locator('#collection').screenshot({ path: `${output}/gallery-collection-${width}.png` });
    const dimensions = [];
    for (const theme of ['royal', 'mehfil']) {
      await page.goto(`/demo?theme=${theme}`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${output}/${theme}-opening-${width}.png` });
      const open = page.getByRole('link', { name: 'Open invitation', exact: true }).last();
      if (await open.isVisible()) await open.click();
      const cover = await page.locator('#invitation').count() ? page.locator('#invitation') : page.locator('.invite-hero');
      await cover.waitFor({ state: 'visible' });
      await cover.screenshot({ path: `${output}/${theme}-cover-${width}.png` });
      dimensions.push({ theme, overflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) });
    }
    evidence.push({ width, height, routes: ['/templates', '/demo?theme=royal', '/demo?theme=mehfil'], dimensions });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/capture.json`, JSON.stringify({ capturedAt: new Date().toISOString(), baseURL, evidence }, null, 2));
console.log(`Captured gallery, Royal and Mehfil before changes at ${evidence.length} widths.`);
