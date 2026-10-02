import { mkdir } from 'node:fs/promises';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { getWordingPreset, wordingLanguages, type WordingPatch } from '../src/data/invitation-wording';
import type { OccasionId } from '../src/types/invitation';

test.use({ actionTimeout: 10000 });

const scriptFonts: Record<string, string> = {
  hindi: 'Invitly Devanagari', marathi: 'Invitly Devanagari',
  punjabi: 'Invitly Gurmukhi', gujarati: 'Invitly Gujarati',
};

async function expectWording(frame: FrameLocator, wording: WordingPatch) {
  for (const line of Object.values(wording)) await expect(frame.locator('main')).toContainText(line);
}

async function noOverflow(page: Page, frame: FrameLocator) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await frame.locator('html').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
}

test('wording choices preview before explicit apply and preserve personal details in all six languages', async ({ page }) => {
  test.setTimeout(120000);
  await mkdir('artifacts/invitation-wording', { recursive: true });
  await page.goto('/customize?occasion=wedding&theme=royal');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  const custom: WordingPatch = { coverText: 'Our own cover words', intro: 'A beginning in our own words', message: 'Please join our families for a warm evening together.', closingText: 'See you with love from our family' };
  const first = 'Aanya Sharma';
  const second = 'Kabir Singh';
  const blessing = 'Our family blessing stays exactly as we wrote it.';
  const date = '2027-04-03T12:00';
  await page.getByLabel('First name', { exact: true }).fill(first);
  await page.getByLabel('Second name', { exact: true }).fill(second);
  await page.getByLabel('Opening line', { exact: true }).fill(custom.intro);
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill(custom.message);
  await page.getByRole('textbox', { name: 'Closing message', exact: true }).fill(custom.closingText);
  await page.getByLabel(/^Blessing or personal note/).fill(blessing);
  await page.getByLabel(/^Event date and time/).fill(date);
  await page.getByLabel('City', { exact: true }).fill('Chandigarh');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByLabel(/^Cover text/).fill(custom.coverText);
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  const panel = page.locator('details.editor-wording-panel');
  await expect(panel).not.toHaveAttribute('open', '');
  await panel.locator('summary').focus();
  await panel.locator('summary').press('Enter');
  await expect(panel).toHaveAttribute('open', '');
  const languageSelect = panel.getByRole('combobox', { name: 'Wording language', exact: true });
  await expect(languageSelect.locator('option')).toHaveCount(6);
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  let current = custom;
  for (const language of wordingLanguages) {
    const preset = getWordingPreset('wedding', language.id);
    await languageSelect.selectOption(language.id);
    await expect(panel.locator('dl')).toHaveAttribute('data-wording-language', language.id);
    for (const [field, line] of Object.entries(preset)) {
      await expect(panel.locator(`[data-wording-field="${field}"]`)).toHaveText(line);
      await expect(panel.locator(`[data-wording-field="${field}"]`)).toHaveAttribute('lang', language.locale);
    }
    await expect(page.getByLabel('Opening line', { exact: true })).toHaveValue(current.intro);
    await expect(page.getByRole('textbox', { name: 'Your message', exact: true })).toHaveValue(current.message);
    await expect(page.getByRole('textbox', { name: 'Closing message', exact: true })).toHaveValue(current.closingText);
    await expectWording(frame, current);
    await panel.getByRole('button', { name: 'Use this wording', exact: true }).click();
    await expect(panel.getByRole('status')).toContainText('Wording added');
    await expect(page.getByLabel('Opening line', { exact: true })).toHaveValue(preset.intro);
    await expect(page.getByRole('textbox', { name: 'Your message', exact: true })).toHaveValue(preset.message);
    await expect(page.getByRole('textbox', { name: 'Closing message', exact: true })).toHaveValue(preset.closingText);
    await expect(page.getByLabel('First name', { exact: true })).toHaveValue(first);
    await expect(page.getByLabel('Second name', { exact: true })).toHaveValue(second);
    await expect(page.getByLabel(/^Blessing or personal note/)).toHaveValue(blessing);
    await expect(page.getByLabel(/^Event date and time/)).toHaveValue(date);
    await expectWording(frame, preset);
    await expect(frame.locator('#invitation')).toContainText(first);
    await expect(frame.locator('#invitation')).toContainText(second);
    await expect(frame.locator('#invitation')).toContainText('3 April 2027');
    const family = scriptFonts[language.id];
    if (family) {
      const nativeCover = frame.locator('#invitation [data-illustrated-cover]').getByText(preset.coverText, { exact: true });
      await expect(nativeCover).toHaveCSS('letter-spacing', /^(normal|0px)$/);
      await expect(nativeCover).toHaveCSS('font-style', 'normal');
      await expect(nativeCover).toHaveCSS('text-transform', 'none');
      await expect.poll(() => frame.locator('html').evaluate(async (_, wanted) => {
        await document.fonts.ready;
        return [...document.fonts].some(font => font.family.replaceAll('"', '') === wanted && font.status === 'loaded');
      }, family), `${language.label}: its bundled script font is actually loaded`).toBe(true);
    }
    await noOverflow(page, frame);
    await panel.screenshot({ path: `artifacts/invitation-wording/${language.id}-panel-360.png`, scale: 'css' });
    await page.getByRole('button', { name: 'Preview invitation', exact: true }).click();
    const opening = frame.getByRole('button', { name: 'Open invitation', exact: true });
    if (await opening.count()) await opening.click();
    await expect(frame.locator('#invitation [data-section="opening"]')).toHaveCount(0);
    await frame.locator('html').evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `artifacts/invitation-wording/${language.id}-guest-360.png`, scale: 'css' });
    await page.getByRole('dialog', { name: 'Live invitation preview', exact: true }).getByRole('button', { name: 'Back to editing', exact: true }).click();
    current = preset;
  }
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  await page.reload();
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await panel.locator('summary').click();
  await expect(languageSelect).toHaveValue('gujarati');
  await expect(page.getByRole('textbox', { name: 'Your message', exact: true })).toHaveValue(current.message);
  await expect(page.getByLabel(/^Blessing or personal note/)).toHaveValue(blessing);
  await expectWording(frame, current);
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByLabel(/^Cover text/)).toHaveValue(current.coverText);
});

test('remembrance wording stays quiet in all six languages and never adds a wedding countdown', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/customize?occasion=remembrance&theme=floral');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  const panel = page.locator('details.editor-wording-panel');
  await panel.locator('summary').click();
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  for (const language of wordingLanguages) {
    const preset = getWordingPreset('remembrance', language.id);
    expect(Object.values(preset).join(' ')).not.toMatch(/wedding|shaadi|शादी|ਵਿਆਹ|લગ્ન|लग्न/iu);
    await panel.getByRole('combobox', { name: 'Wording language', exact: true }).selectOption(language.id);
    await panel.getByRole('button', { name: 'Use this wording', exact: true }).click();
    await expectWording(frame, preset);
    if (scriptFonts[language.id]) {
      const nativeCover = frame.locator('#invitation').getByText(preset.coverText, { exact: true });
      await expect(nativeCover).toHaveCSS('letter-spacing', /^(normal|0px)$/);
      await expect(nativeCover).toHaveCSS('font-style', 'normal');
      await expect(nativeCover).toHaveCSS('text-transform', 'none');
    }
    await expect(frame.locator('.countdown')).toHaveCount(0);
    await expect(frame.locator('main')).not.toContainText('We’re getting married');
    await noOverflow(page, frame);
  }
});

test('all nine occasions provide six complete, independently editable wording presets', () => {
  const occasions: OccasionId[] = ['wedding', 'engagement', 'birthday', 'baby-shower', 'housewarming', 'naming', 'anniversary', 'remembrance', 'other'];
  for (const language of wordingLanguages) {
    const presets = occasions.map(occasion => getWordingPreset(occasion, language.id));
    expect(new Set(presets.map(preset => preset.coverText)).size).toBe(9);
    for (const preset of presets) {
      expect(Object.keys(preset).sort()).toEqual(['closingText', 'coverText', 'intro', 'message']);
      for (const [field, maximum] of [['coverText', 160], ['intro', 160], ['message', 5000], ['closingText', 300]] as const) {
        expect(preset[field].trim().length).toBeGreaterThan(0);
        expect(preset[field].length).toBeLessThanOrEqual(maximum);
      }
    }
  }
});
