import { expect, test } from '@playwright/test';
import { createOccasionInvitation } from '../src/data/occasions';
import { getOccasionThemes } from '../src/data/occasion-themes';
import type { InvitationDraft } from '../src/lib/invitation-draft';

test.use({ actionTimeout: 10000 });

test('hosts can edit individual family cards and optional sections, then recover all choices after reload', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'Complete editor journey on a phone');
  test.setTimeout(90000);
  await page.goto('/customize?occasion=wedding&theme=modern');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await page.getByLabel('First name', { exact: true }).fill('Arjun Singh');
  await page.getByLabel('Second name', { exact: true }).fill('Meher Kaur');
  await page.getByRole('textbox', { name: 'Portrait section heading', exact: false }).fill('Our people, our story.');
  await page.getByRole('textbox', { name: 'First person’s parents / family (optional)', exact: true }).fill('Harjit Kaur & Manjeet Singh');
  await page.getByRole('textbox', { name: 'Second person’s parents / family (optional)', exact: true }).fill('Simran Kaur & Amar Singh');
  await expect(page.getByRole('textbox', { name: /^First person’s parents prefix/ })).toHaveValue('S/o');
  await expect(page.getByRole('textbox', { name: /^Second person’s parents prefix/ })).toHaveValue('D/o');
  await page.getByRole('textbox', { name: /^First person’s parents prefix/ }).fill('Beloved child of');
  await page.getByRole('textbox', { name: 'First person’s grandparents (optional)', exact: true }).fill('सरला और मोहन');
  await page.getByRole('textbox', { name: 'Second person’s grandparents (optional)', exact: true }).fill('ਗੁਰਮੀਤ ਕੌਰ ਅਤੇ ਜਸਵੰਤ ਸਿੰਘ');
  await page.getByRole('textbox', { name: 'First person’s grandparents prefix', exact: true }).fill('With blessings from');
  await page.getByRole('checkbox', { name: /^Show portraits/ }).uncheck();
  await page.getByLabel(/^Event date and time/).fill('2027-04-03T12:00');
  await page.getByLabel(/^Countdown end date and time/).fill('2027-04-02T18:00');
  await page.getByRole('checkbox', { name: /^Show an invitation video/ }).check();
  await page.getByRole('textbox', { name: 'Video section title', exact: true }).fill('Our little film');
  await page.getByRole('textbox', { name: /^YouTube or Vimeo video link/ }).fill('https://youtu.be/M7lc1UVf-VE');
  const frame = page.frameLocator('iframe[title="Actual guest invitation preview"]');
  const profiles = frame.locator('[data-couple-profiles]');
  await expect(profiles.getByRole('heading', { name: 'Our people, our story.', exact: true })).toBeVisible();
  await expect(profiles.locator('[data-person-profile]')).toHaveCount(2);
  await expect(profiles.locator('[data-person-portrait]')).toHaveCount(0);
  await expect(profiles.locator('[data-person-profile="0"]')).toContainText('Beloved child of');
  await expect(profiles.locator('[data-person-profile="0"]')).toContainText('सरला और मोहन');
  await expect(profiles.locator('[data-person-profile="1"]')).toContainText('ਗੁਰਮੀਤ ਕੌਰ ਅਤੇ ਜਸਵੰਤ ਸਿੰਘ');
  await expect(frame.locator('iframe[src*="youtube"],iframe[src*="vimeo"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('combobox', { name: 'Invitation opening', exact: true }).selectOption('envelope');
  await page.getByRole('combobox', { name: 'Envelope cover icon', exact: true }).selectOption('flower');
  await page.getByRole('textbox', { name: 'Envelope opening line', exact: true }).fill('A letter for our favourite people');
  await page.getByRole('checkbox', { name: /^Show RSVP/ }).uncheck();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.locator('.editor-workspace-status')).toHaveAttribute('data-save-state', 'saved');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('invitly:invitation-draft:v2')!) as InvitationDraft);
  expect(saved.invitation.countdownAt).toBe('2027-04-02T12:30:00.000Z');
  expect(saved.invitation.weddingAt).toBe('2027-04-03T06:30:00.000Z');
  expect(saved.invitation.video?.url).toBe('https://www.youtube.com/watch?v=M7lc1UVf-VE');
  await page.reload();
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /^Portrait section heading/ })).toHaveValue('Our people, our story.');
  await expect(page.getByRole('checkbox', { name: /^Show portraits/ })).not.toBeChecked();
  await expect(page.getByRole('textbox', { name: 'First person’s grandparents (optional)', exact: true })).toHaveValue('सरला और मोहन');
  await expect(page.getByLabel(/^Countdown end date and time/)).toHaveValue('2027-04-02T18:00');
  await expect(page.getByRole('textbox', { name: 'Video section title', exact: true })).toHaveValue('Our little film');
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Invitation opening', exact: true })).toHaveValue('envelope');
  await expect(page.getByRole('combobox', { name: 'Envelope cover icon', exact: true })).toHaveValue('flower');
  await expect(page.getByRole('textbox', { name: 'Envelope opening line', exact: true })).toHaveValue('A letter for our favourite people');
  await expect(page.getByRole('checkbox', { name: /^Show RSVP/ })).not.toBeChecked();
  await expect(frame.locator('#rsvp')).toHaveCount(0);
  await expect(frame.getByRole('link', { name: /^RSVP/ })).toHaveCount(0);
  expect(await frame.locator('html').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
});

test('two portraits use the selected authorized photos and can be hidden without losing names or family details', async ({ page }, info) => {
  test.skip(!['mobile-320', 'desktop'].includes(info.project.name), 'Portrait layout on narrow phone and desktop');
  const photos = [
    { id: '11111111-1111-4111-a111-111111111111', url: '/dashboard/events/33333333-3333-4333-a333-333333333333/media/11111111-1111-4111-a111-111111111111', alt: 'Arjun in the palace garden', width: 1200, height: 1600 },
    { id: '22222222-2222-4222-a222-222222222222', url: '/dashboard/events/33333333-3333-4333-a333-333333333333/media/22222222-2222-4222-a222-222222222222', alt: 'Meher in the courtyard', width: 1200, height: 1600 },
  ];
  for (const [index, photo] of photos.entries()) await page.route(url => url.pathname === photo.url, route => route.fulfill({ path: `public/images/wedding/${index ? 'courtyard' : 'palace-walk'}.webp`, contentType: 'image/webp' }));
  await page.goto('/preview');
  for (const occasion of ['wedding', 'engagement', 'anniversary'] as const) {
    const invitation = createOccasionInvitation(occasion);
    invitation.couple = ['Arjun Sukhpreet Singh · ਅਰਜੁਨ', 'Meher Harpreet Kaur · मेहर'];
    invitation.families = ['Harjit & Manjeet Singh', 'Simran & Amar Singh'];
    invitation.personProfiles = [
      { photoId: photos[0].id, grandparents: 'Gurmeet & Jaswant Singh', parentsPrefix: 'S/o', grandparentsPrefix: 'GS/o' },
      { photoId: photos[1].id, grandparents: 'Sarla & Mohan', parentsPrefix: 'D/o', grandparentsPrefix: 'GD/o' },
    ];
    invitation.profileSection = { heading: 'The families beside us', showPhotos: true };
    invitation.design!.opening = { style: 'none', icon: 'monogram', line: '' };
    const draft: InvitationDraft = { themeId: getOccasionThemes(occasion)[0].id, invitation, musicEnabled: false };
    await expect.poll(async () => {
      await page.evaluate(data => window.postMessage(data, window.location.origin), { type: 'invitly-preview', draft, photos });
      return page.locator(`[data-couple-profiles][data-occasion="${occasion}"] [data-profile-photo]`).count();
    }).toBe(2);
    const section = page.locator('[data-couple-profiles]');
    for (const [index, photo] of photos.entries()) {
      const person = section.locator(`[data-person-profile="${index}"]`);
      await expect(person.locator('[data-profile-photo]')).toHaveAttribute('data-profile-photo', photo.id);
      const image = person.getByRole('img', { name: photo.alt, exact: true });
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(person).toContainText(invitation.couple[index]);
      await expect(person).toContainText(invitation.families[index]);
      await expect(person).toContainText(invitation.personProfiles[index].grandparents!);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), occasion).toBeLessThanOrEqual(0);
    await section.screenshot({ path: `artifacts/screenshots/portraits-${occasion}-${info.project.name}.png` });
    invitation.profileSection.showPhotos = false;
    await page.evaluate(data => window.postMessage(data, window.location.origin), { type: 'invitly-preview', draft, photos });
    await expect(section.locator('[data-person-portrait]')).toHaveCount(0);
    await expect(section.getByRole('heading', { name: invitation.couple[0], exact: true })).toBeVisible();
    await expect(section).toContainText('Gurmeet & Jaswant Singh');
  }
});

test('the optional envelope opens by keyboard, preserves the actual invitation and hands off focus', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'Keyboard/reduced-motion opening');
  const invitation = createOccasionInvitation('engagement');
  invitation.couple = ['Meher', 'Arjun'];
  invitation.design!.opening = { style: 'envelope', icon: 'rings', line: 'A letter for our favourite people' };
  const draft: InvitationDraft = { themeId: 'lotus', invitation, musicEnabled: false };
  await page.goto('/preview');
  await expect.poll(async () => {
    await page.evaluate(data => window.postMessage(data, window.location.origin), { type: 'invitly-preview', draft, photos: [] });
    return page.locator('[data-envelope-phase]').count();
  }).toBe(1);
  await expect(page.locator('[data-envelope-phase]')).toContainText('A letter for our favourite people');
  const open = page.getByRole('button', { name: 'Break the seal and open invitation', exact: true });
  await open.focus();
  await open.press('Enter');
  await expect(page.locator('[data-envelope-phase]')).toHaveCount(0);
  await expect(page.locator('#invitation')).toBeFocused();
  await expect(page.locator('#invitation')).toContainText('Meher');
  await expect(page.locator('#invitation')).toContainText('Arjun');
});

test('video embeds are loaded only after a guest chooses to watch and never request autoplay', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-360', 'External embed behavior checked once');
  const requests: string[] = [];
  page.on('request', request => { if (/youtube-nocookie|player\.vimeo/.test(request.url())) requests.push(request.url()); });
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Video provider fixture</p>' }));
  const invitation = createOccasionInvitation('wedding');
  invitation.couple = ['Meher', 'Arjun'];
  invitation.video = { enabled: true, url: 'https://youtu.be/M7lc1UVf-VE', title: 'Our little film' };
  const draft: InvitationDraft = { themeId: 'modern', invitation, musicEnabled: false };
  await page.goto('/preview');
  await expect.poll(async () => {
    await page.evaluate(data => window.postMessage(data, window.location.origin), { type: 'invitly-preview', draft, photos: [] });
    return page.locator('[data-invitation-video]').count();
  }).toBe(1);
  const section = page.locator('[data-invitation-video]');
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('heading', { name: 'Our little film', exact: true })).toBeVisible();
  await expect(section.locator('iframe')).toHaveCount(0);
  expect(requests).toEqual([]);
  await section.getByRole('button', { name: /Watch our film/ }).click();
  await expect(section.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/M7lc1UVf-VE\?autoplay=0/);
  await expect.poll(() => requests.length).toBe(1);
});
