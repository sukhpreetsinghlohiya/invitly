import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const directory='artifacts/brand-art-review';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const results=[];
try {
  for(const [width,height] of [[320,740],[360,800],[390,844],[768,1024],[1440,1000]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:3001/templates');
    for(const img of await page.locator('.occasion-card-art img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(image=>image.decode());
    }
    await page.locator('.occasion-collections').screenshot({path:`${directory}/occasions-${width}.png`});
    results.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,cards:document.querySelectorAll('.occasion-collection').length,images:[...document.querySelectorAll('.occasion-card-art img')].map(img=>({loaded:img.complete&&img.naturalWidth>0,width:Math.round(img.getBoundingClientRect().width),height:Math.round(img.getBoundingClientRect().height)}))})));
    await page.goto('http://127.0.0.1:3001/');
    await page.locator('.brand-mark').first().evaluate(image=>image.decode());
    await page.screenshot({path:`${directory}/homepage-${width}.png`});
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:3001/templates');
  const first=page.locator('.occasion-collection').first();
  await first.scrollIntoViewIfNeeded();
  await first.hover();
  await page.waitForTimeout(450);
  const hover=await first.evaluate(el=>({card:getComputedStyle(el).transform,art:getComputedStyle(el.querySelector('img')).transform}));
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await first.evaluate(el=>({card:getComputedStyle(el).transform,art:getComputedStyle(el.querySelector('img')).transform}));
  const icons=await page.locator('link[rel="icon"],link[rel="apple-touch-icon"]').evaluateAll(links=>links.map(link=>({href:link.getAttribute('href'),type:link.getAttribute('type')})));
  for(const icon of icons) icon.status=(await page.request.get(new URL(icon.href,'http://127.0.0.1:3001').href)).status();
  const report={viewports:results,hover,reducedMotion:reduced,icons};
  await writeFile(`${directory}/checks.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(results.some(r=>r.overflow!==0||r.cards!==9||r.images.some(img=>!img.loaded))||icons.some(icon=>icon.status!==200)||reduced.card!=='none'||reduced.art!=='none') throw new Error('Brand/artwork inspection failed.');
} finally {await browser.close();}
