import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Use a local preview for template review.');
const label = process.argv[2] || 'before';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Invalid capture label.');
const output = `artifacts/template-review-${label}`;
const themes = ['royal', 'modern', 'floral', 'mehfil', 'kesar', 'lotus', 'pichwai', 'ocean', 'champagne', 'sindoor'];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const evidence = [];
try {
  for (const [width, height] of [[390,844], [1440,1000]]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const browserErrors = [];
    page.on('pageerror', error => browserErrors.push(error.message));
    const tiles = [];
    if (label !== 'before') {
      await page.goto('/templates');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({path:`${output}/gallery-${width}-opening.png`});
      await page.locator('article.collection-card').first().scrollIntoViewIfNeeded();
      await page.locator('article.collection-card').first().locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
      await page.locator('article.collection-card').first().screenshot({path:`${output}/gallery-${width}-card.png`});
    }
    for (const theme of themes) {
      await page.goto(`/demo?theme=${theme}`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator('[data-illustrated-cover]').first().waitFor();
      await page.locator('.music-control audio[src]').waitFor({state:'attached'});
      await page.locator('[data-illustrated-cover]').first().locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
      await page.screenshot({ path: `${output}/${theme}-${width}-opening.png` });
      await page.screenshot({ path: `${output}/${theme}-${width}-full.png`, fullPage: true });
      const cover = page.locator('[data-illustrated-cover]').first();
      await cover.screenshot({ path: `${output}/${theme}-${width}-cover.png` });
      if (label !== 'before') {
        const opening = page.getByRole('button', { name: 'Open invitation', exact: true });
        if (await opening.isVisible()) await opening.click();
        await page.locator('#invitation').screenshot({path:`${output}/${theme}-${width}-opened.png`});
        await page.locator('#celebrations article').first().screenshot({path:`${output}/${theme}-${width}-event.png`});
        await page.locator('#rsvp').screenshot({path:`${output}/${theme}-${width}-rsvp.png`});
        await page.locator('[data-section="story"]').screenshot({path:`${output}/${theme}-${width}-story.png`});
      }
      tiles.push(await sharp(`${output}/${theme}-${width}-opening.png`).resize({width:280}).png().toBuffer());
      evidence.push({theme,width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),browserErrors:[...browserErrors]});
      browserErrors.length = 0;
    }
    const tileHeight = Math.round(height * 280 / width);
    await sharp({create:{width:1400,height:tileHeight*2,channels:4,background:'#efece6'}}).composite(tiles.map((input,i)=>({input,left:(i%5)*280,top:Math.floor(i/5)*tileHeight}))).png().toFile(`${output}/all-openings-${width}.png`);
    if (label !== 'before' && width === 390) {
      for (const section of ['opened','event','rsvp','story']) {
        const images = [];
        for (const [index, theme] of themes.entries()) {
          const { data, info } = await sharp(`${output}/${theme}-${width}-${section}.png`).resize({width:280,height:780,fit:'inside'}).png().toBuffer({resolveWithObject:true});
          images.push({input:data,index,height:info.height});
        }
        const rowHeight = Math.max(...images.map(item=>item.height)) + 16;
        const rows = images.map(({input,index})=>({input,left:(index%5)*280,top:Math.floor(index/5)*rowHeight}));
        await sharp({create:{width:1400,height:rowHeight*2,channels:4,background:'#efece6'}}).composite(rows).png().toFile(`${output}/all-${section}-${width}.png`);
      }
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/capture.json`,JSON.stringify(evidence,null,2));
console.log(`Captured all ${themes.length} designs on mobile and desktop in ${output}.`);
