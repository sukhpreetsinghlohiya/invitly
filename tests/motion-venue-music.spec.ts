import { expect, test, type Locator } from "@playwright/test";
import { occasions } from "../src/data/occasions";
import { occasionCollections } from "../src/data/occasion-demos";
import { themes } from "../src/data/themes";
import { getOccasionThemes } from "../src/data/occasion-themes";

async function loadedCoverArtwork(cover: Locator) {
  const assets: string[] = [];
  for (const image of await cover.locator('img').all()) {
    if (!await image.isVisible()) continue;
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const source = new URL(await image.getAttribute('src') || '', 'http://127.0.0.1');
    assets.push(source.searchParams.get('url') || source.pathname);
  }
  for (const ornament of await cover.locator('[data-archive-ornament]').all()) {
    if (!await ornament.isVisible()) continue;
    const source = await ornament.evaluate(async node => {
      const url = getComputedStyle(node).maskImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if (!url) throw new Error('Visible archival artwork has no SVG source');
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth) throw new Error(`Artwork did not load: ${url}`);
      return new URL(url).pathname;
    });
    assets.push(source);
  }
  expect(assets.length, 'The cover contains loaded artwork').toBeGreaterThan(0);
  return [...new Set(assets)].sort();
}

for (const occasion of occasions.filter(item => item.id === 'wedding' || item.id === 'engagement')) {
  test(`${occasion.id} has its own illustration, readable schedule and editable entry point`, async ({ page }, info) => {
    const theme = occasionCollections[occasion.id].theme;
    await page.goto(`/demo?theme=${theme}&occasion=${occasion.id}`);
    await expect(page.getByRole('heading',{level:1})).toContainText(occasionCollections[occasion.id].names[0]);
    await expect(page.locator(occasion.id === "wedding" ? `[data-illustrated-cover="${theme}"]` : `[data-occasion-art="${occasion.id}"]`).first()).toBeVisible();
    await expect(page.getByRole('heading',{name:occasion.id === "wedding" ? "Wedding" : occasion.schedule,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(0);
    if (occasion.id !== 'wedding') await expect(page.locator('main')).not.toContainText('Sunshine yellows');
    if (occasion.id === 'remembrance') await expect(page.locator('.countdown')).toHaveCount(0);
    await page.screenshot({path:`artifacts/screenshots/occasion-${occasion.id}-${info.project.name}.png`,fullPage:true});
    await page.locator('#celebrations').scrollIntoViewIfNeeded();
    await expect(page.getByRole('link',{name:/Get directions/}).first()).toHaveAttribute('href',/https:\/\/www.google.com\/maps\/dir\/\?api=1&destination=/);
    const link=page.locator('a[href*="customize"][href*="occasion="]').first();
    await expect(link).toHaveAttribute('href',new RegExp(`occasion=${occasion.id}`));
  });
}

test('legacy links for available occasions remain usable across all ten theme IDs', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360','Composition matrix at 360px; each starter also checked at all widths');
  test.setTimeout(180000);
  for (const occasion of occasions.filter(item => item.id === 'wedding' || item.id === 'engagement')) for (const theme of themes) {
    await page.goto(`/demo?theme=${theme.id}&occasion=${occasion.id}`);
    await expect(page.getByRole('heading',{level:1})).toContainText(occasionCollections[occasion.id].names[0]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),`${occasion.id}/${theme.id}`).toBeLessThanOrEqual(0);
    if (occasion.id !== 'wedding') await expect(page.locator('main')).not.toContainText('Sunshine yellows');
  }
});

for (const occasion of occasions.filter(item => item.id === 'engagement')) {
  test(`${occasion.id} offers three real cover compositions with readable actions`, async ({ page }, info) => {
    test.setTimeout(60000);
    const designs = getOccasionThemes(occasion.id);
    expect(designs).toHaveLength(3);
    const layouts = new Set<string>();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const galleryArtwork = new Map<string, string[]>();
    await page.goto(`/templates?occasion=${occasion.id}`);
    await expect(page.locator('article.collection-card')).toHaveCount(3);
    if (page.viewportSize()!.width <= 600) {
      const cards = page.locator('article.collection-card');
      const first = (await cards.nth(0).boundingBox())!;
      const second = (await cards.nth(1).boundingBox())!;
      expect(Math.abs(first.y - second.y), 'Phone galleries keep the first two designs side by side for comparison').toBeLessThanOrEqual(1);
      expect(first.x + first.width).toBeLessThan(second.x);
      for (const action of await cards.first().locator('.collection-card-actions a').all()) {
        expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
    }
    for (const design of designs) {
      const card = page.locator(`article.collection-card [data-occasion-layout="${design.layout}"]`);
      await expect(card).toBeVisible();
      galleryArtwork.set(design.id, await loadedCoverArtwork(card));
      await expect(page.getByRole('link', { name: `Customize ${design.name}`, exact: true })).toHaveAttribute('href', new RegExp(`theme=${design.id}.*occasion=${occasion.id}`));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.locator('#collection').screenshot({ path: `artifacts/screenshots/curated-${occasion.id}-gallery-${info.project.name}.png` });
    for (const design of designs) {
      await page.goto(`/demo?occasion=${occasion.id}&theme=${design.id}`);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      const cover = page.locator('#invitation');
      await expect(cover).toHaveAttribute('data-occasion-layout', design.layout);
      await expect(cover.getByRole('heading', { level: 1 })).toContainText(occasionCollections[occasion.id].names[0]);
      await expect(cover.locator(`[data-occasion-art="${occasion.id}"]`)).toBeVisible();
      expect(await loadedCoverArtwork(cover), 'Gallery and guest invitation use the same real artwork').toEqual(galleryArtwork.get(design.id));
      layouts.add((await cover.getAttribute('data-occasion-layout'))!);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${occasion.id}/${design.name}`).toBeLessThanOrEqual(0);
      const directions = cover.getByRole('link', { name: /directions/i }).first();
      await expect(directions).toBeVisible();
      expect((await directions.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      await expect(directions).toHaveAttribute('href', /https:\/\/www.google.com\/maps\/dir\/\?api=1&destination=/);
      await directions.scrollIntoViewIfNeeded();
      await expect(directions).toBeInViewport({ ratio: 1 });
      await cover.getByRole('link', { name: 'Schedule', exact: true }).click();
      await expect(page.locator('#celebrations')).toBeInViewport();
      await cover.getByRole('link', { name: 'RSVP', exact: true }).click();
      await expect(page.locator('#rsvp')).toBeInViewport();
      await cover.screenshot({ path: `artifacts/screenshots/curated-${occasion.id}-${design.layout}-${info.project.name}.png` });
    }
    expect([...layouts].sort()).toEqual(['editorial', 'keepsake', 'signature']);
    expect(errors).toEqual([]);
  });
}

test('venue and soundtrack preferences survive reload and preview', async ({ page }, info) => {
  await page.goto('/customize?occasion=engagement&theme=lotus');
  await page.getByRole('button',{name:'Schedule',exact:true}).click();
  await page.getByRole('button',{name:'Add function',exact:true}).click();
  await page.getByLabel('Venue name',{exact:true}).fill('Rose Garden');
  await page.getByLabel('Venue address',{exact:true}).fill('Sector 16, Chandigarh');
  await expect(page.getByRole('link',{name:/Find venue on Google Maps/})).toHaveAttribute('href',/Rose%20Garden.*Chandigarh/);
  await page.getByLabel('Google Maps link (optional)').fill('https://maps.app.goo.gl/example');
  await expect(page.getByRole('link',{name:/Check your saved location/})).toHaveAttribute('href','https://maps.app.goo.gl/example');
  await page.getByRole('button',{name:'Design',exact:true}).click();
  const engagementDesign = getOccasionThemes('engagement')[1];
  await page.getByRole('button',{name:engagementDesign.name,exact:true}).click();
  expect(new URL(page.url()).searchParams.get('occasion')).toBe('engagement');
  await page.getByRole('tab', { name: 'Music & layout', exact: true }).click();
  await page.getByLabel('A soundtrack for your story').check();
  await page.getByRole('tab', { name: 'Music & layout', exact: true }).click();
  await page.getByRole('button',{name:/Evening breeze/}).click();
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await page.getByLabel('Movement & transitions').selectOption('expressive');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await expect(page.locator('.editor-feedback')).toContainText('saved');
  await page.reload();
  await page.getByRole('button',{name:'Design',exact:true}).click();
  await expect(page.getByRole('button',{name:engagementDesign.name,exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('tab', { name: 'Music & layout', exact: true }).click();
  await expect(page.getByRole('button',{name:/Evening breeze/})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('tab', { name: 'Opening & motion', exact: true }).click();
  await expect(page.getByLabel('Movement & transitions')).toHaveValue('expressive');
  const actualPreview = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  await expect(actualPreview.getByRole('link', { name: /Get directions/ }).first()).toHaveAttribute('href', 'https://maps.app.goo.gl/example');
  await page.context().route('https://maps.app.goo.gl/example', route => route.fulfill({ contentType: 'text/html', body: '<p>Saved location fixture</p>' }));
  const mapPopup = page.waitForEvent('popup');
  await actualPreview.getByRole('link', { name: /Get directions/ }).first().click();
  const mapPage = await mapPopup;
  await expect(mapPage).toHaveURL('https://maps.app.goo.gl/example');
  await mapPage.close();
  await page.getByRole('tab', { name: 'Music & layout', exact: true }).click();
  await page.getByRole('button',{name:'Play music',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause music',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Mehfil rhythm/}).click();
  await expect(page.getByRole('button',{name:'Play music',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'YouTube song',exact:true}).click();
  await page.getByLabel('YouTube song link').fill('https://youtu.be/M7lc1UVf-VE');
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({contentType:'text/html',body:'<p>External player fixture</p>'}));
  await page.getByRole('button',{name:'Our song',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Our song, your moment.'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute('src',/youtube-nocookie.com\/embed\/M7lc1UVf-VE\?.*autoplay=0/);
  expect(await dialog.locator('iframe').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(200);
  await page.screenshot({path:`artifacts/screenshots/music-dialog-${info.project.name}.png`});
  await page.keyboard.press('Escape');
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Our song',exact:true})).toBeFocused();
  if ((page.viewportSize()?.width ?? 1440) < 700) {
    await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
    const previewDialog = page.getByRole('dialog', { name: 'Live invitation preview', exact: true });
    await expect(previewDialog).toBeVisible();
    await actualPreview.getByRole('button', { name: 'Our song', exact: true }).click();
    const innerSong = actualPreview.getByRole('dialog', { name: 'Our song, your moment.' });
    await expect(innerSong).toBeVisible();
    await innerSong.getByRole('button', { name: /Close/i }).press('Escape');
    await expect(innerSong).toHaveCount(0);
    await expect(previewDialog).toBeVisible();
    await actualPreview.getByRole('button', { name: 'Our song', exact: true }).press('Escape');
    await expect(previewDialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Preview invitation', exact: true })).toBeFocused();
  }
});

test('all ten wedding choices preserve personal copy in the actual preview', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'Content-preserving wedding theme switching at 360px');
  await page.goto('/customize?occasion=wedding&theme=royal');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByLabel('First name', { exact: true }).fill('Meher');
  await page.getByLabel('Second name', { exact: true }).fill('Arjun');
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('ਸਾਡੇ ਨਾਲ ਆਓ · हमारे साथ आइए');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  for (const theme of getOccasionThemes('wedding')) {
    const choice = page.getByRole('button', { name: theme.name, exact: true });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    const preview = page.frameLocator('iframe[title="Actual guest invitation preview"]').locator('main');
    await expect(preview).toContainText('Meher');
    await expect(preview).toContainText('Arjun');
    await expect(preview).toContainText('ਸਾਡੇ ਨਾਲ ਆਓ · हमारे साथ आइए');
  }
});

test.describe('motion preferences',()=>{
  test.use({reducedMotion:'no-preference'});
  test('section reveals finish without layout shifts and respect reduced motion',async({page})=>{
    await page.goto('/demo?theme=royal');
    await page.getByRole('button',{name:'Open invitation',exact:true}).click();
    await expect(page.locator('[data-section="opening"]')).toHaveCount(0);
    const hero=page.locator('#invitation');
    await expect.poll(()=>hero.evaluate(el=>el.getAnimations().length)).toBe(0);
    const fit=await hero.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,left:r.left,right:r.right,screenWidth:innerWidth};});
    expect(fit.width, 'The invitation stays a readable canvas inside the demo').toBeGreaterThanOrEqual(Math.min(300, fit.screenWidth));
    expect(fit.left).toBeGreaterThanOrEqual(0);
    expect(fit.right).toBeLessThanOrEqual(fit.screenWidth);
    await expect(hero).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(0);
    await expect(hero.getByRole('link',{name:/Schedule & directions/})).toBeVisible();
    const section=page.locator('#celebrations [data-reveal]').first();
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute('data-revealed','true');
    await expect.poll(()=>section.evaluate(el=>el.getAnimations().length)).toBe(0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.reload();
    await page.getByRole('button',{name:'Open invitation',exact:true}).click();
    await expect(page.locator('[data-section="opening"]')).toHaveCount(0);
    await page.locator('#celebrations').scrollIntoViewIfNeeded();
    expect(await page.locator('#celebrations').evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
  });
});


test('available occasion selection updates gallery artwork and preserves editable fields',async({page},info)=>{
  test.skip(info.project.name !== 'mobile-360','Full occasion editor journey at 360px');
  test.setTimeout(120000);
  await page.goto('/templates');
  page.setDefaultTimeout(10000);
  await page.getByRole('combobox',{name:'Occasion',exact:true}).selectOption('engagement');
  const engagementDesigns = getOccasionThemes('engagement');
  await expect(page.locator('article.collection-card')).toHaveCount(engagementDesigns.length);
  await expect(page.locator('.collection-card [data-occasion="engagement"]')).toHaveCount(engagementDesigns.length);
  await page.getByRole('link',{name:`Customize ${engagementDesigns[0].name}`,exact:true}).click();
  await page.getByRole('button',{name:'Details',exact:true}).click();
  await expect(page.getByLabel('First name',{exact:true})).toBeVisible();
  for(const occasion of occasions.filter(item => item.id === 'wedding' || item.id === 'engagement')){
    await page.goto(`/customize?occasion=${occasion.id}&theme=${occasionCollections[occasion.id].theme}`);
    await page.getByRole('button',{name:'Details',exact:true}).click();
    await page.getByLabel(occasion.firstLabel,{exact:true}).fill('ਸਿਮਰਨ · सिमरन');
    if(occasion.secondLabel) await page.getByLabel(occasion.secondLabel,{exact:true}).fill('Arjun');
    await page.getByRole('textbox',{name:'Your message',exact:true}).fill(`Our own ${occasion.name} message`);
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    await expect(page.locator('.editor-feedback')).toContainText('saved');
    await page.reload();
    await page.getByRole('button',{name:'Details',exact:true}).click();
    await expect(page.getByLabel(occasion.firstLabel,{exact:true})).toHaveValue('ਸਿਮਰਨ · सिमरन');
    await expect(page.getByRole('textbox',{name:'Your message',exact:true})).toHaveValue(`Our own ${occasion.name} message`);
    await expect(page.frameLocator('iframe[title="Actual guest invitation preview"]').locator('main')).toContainText('ਸਿਮਰਨ · सिमरन');
  }
});
