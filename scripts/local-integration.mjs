import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const settings = JSON.parse(await readFile('artifacts/local-supabase.json', 'utf8'));
const url = new URL(settings.API_URL);
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Integration tests only run against an isolated local Supabase instance.');
const mode = process.argv[2] || 'test';
const localPort = Number(process.env.INVITLY_LOCAL_PORT || 3001);
if (!Number.isInteger(localPort) || localPort < 1024 || localPort > 65535) throw new Error('Choose a valid local test port.');
const localOrigin = `http://127.0.0.1:${localPort}`;
const credentialsPath = 'artifacts/integration/accounts.json';
const admin = createClient(settings.API_URL, settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
if (mode === 'prepare') {
  await mkdir('artifacts/integration', { recursive: true });
  let existing;
  try { existing = JSON.parse(await readFile(credentialsPath, 'utf8')); } catch {}
  if (existing) { console.log('Local integration accounts already prepared.'); process.exit(0); }
  const accounts = {};
  for (const host of ['A','B']) {
    const email = `invitly-test-${host.toLowerCase()}-${randomBytes(6).toString('hex')}@example.test`;
    const password = randomBytes(24).toString('base64url');
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Invitly test host ${host}` } });
    if (error) throw new Error(`Could not prepare local host ${host}: ${error.code || 'auth unavailable'}`);
    accounts[host] = { id: data.user.id, email, password };
  }
  await writeFile(credentialsPath, JSON.stringify(accounts), { mode: 0o600 });
  console.log('Two confirmed local-only test hosts prepared. Credentials were not printed.');
  process.exit(0);
}
const accounts = JSON.parse(await readFile(credentialsPath, 'utf8'));
if (mode === 'fixture') {
  // Native type stripping is available in the recommended Node 24 runtime.
  const { demoInvitation } = await import('../src/data/demo-invitation.ts');
  const invitation = { ...demoInvitation, slug: 'invitly-local-preview' };
  const { error } = await admin.from('events').upsert({ owner_id: accounts.A.id, slug: invitation.slug, title: invitation.couple.join(' & '), description: invitation.message, starts_at: invitation.weddingAt, venue: invitation.city, timezone: invitation.timezone, theme_id: 'royal', invitation_content: invitation, is_published: true, published_at: new Date().toISOString(), public_function_ids: null }, { onConflict: 'slug' });
  if (error) throw new Error('Could not create the fictional local preview.');
  const { data: event } = await admin.from('events').select('id').eq('slug', invitation.slug).single();
  const storagePath = `${event.id}/representative.webp`;
  const photo = await sharp('public/images/wedding/courtyard.webp').resize({width:1600,withoutEnlargement:true}).webp({quality:78}).toBuffer();
  const { error: uploadError } = await admin.storage.from('event-media').upload(storagePath, photo, {contentType:'image/webp',upsert:true});
  if (uploadError) throw uploadError;
  const { data: existing } = await admin.from('media').select('id').eq('event_id',event.id).eq('storage_path',storagePath).maybeSingle();
  if (!existing) {
    const {error: photoError} = await admin.from('media').insert({event_id:event.id,storage_path:storagePath,alt_text:'Aanya and Kabir in a palace courtyard — original fictional demonstration image',mime_type:'image/webp',size_bytes:photo.length,width:1536,height:1024});
    if (photoError) throw photoError;
  }
  let guestFixture;
  try { guestFixture = JSON.parse(await readFile('artifacts/integration/guest-fixture.json','utf8')); } catch { guestFixture = {token:randomBytes(32).toString('hex')}; }
  const {error: guestError} = await admin.from('guests').upsert({event_id:event.id,name:'Simran — local QA guest',max_party_size:2,token_hash:createHash('sha256').update(guestFixture.token).digest('hex')},{onConflict:'token_hash'});
  if (guestError) throw guestError;
  await writeFile('artifacts/integration/guest-fixture.json',JSON.stringify(guestFixture),{mode:0o600});
  console.log('Local private RSVP fixture prepared (token not printed).');
  console.log('Fictional local invitation: http://127.0.0.1:3001/i/invitly-local-preview');
  process.exit(0);
}
const guestFixture = await readFile("artifacts/integration/guest-fixture.json","utf8").then(JSON.parse).catch(()=>null);
const env = { ...process.env, ...(guestFixture ? {LIGHTHOUSE_GUEST_PATH:`/g/${guestFixture.token}`} : {}), NEXT_PUBLIC_SUPABASE_URL: settings.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: settings.PUBLISHABLE_KEY, SUPABASE_SECRET_KEY: settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL: localOrigin, PLAYWRIGHT_BASE_URL: localOrigin, LIGHTHOUSE_BASE_URL: localOrigin, LIGHTHOUSE_INVITE_PATH: '/i/invitly-local-preview', INVITLY_INTEGRATION: '1', TEST_HOST_A_EMAIL: accounts.A.email, TEST_HOST_A_PASSWORD: accounts.A.password, TEST_HOST_B_EMAIL: accounts.B.email, TEST_HOST_B_PASSWORD: accounts.B.password };
const commands = {
  build: ['npm', ['run','build']],
  start: ['npm', ['run','start','--','--hostname','127.0.0.1','--port',String(localPort)]],
  test: ['npm', ['run','test:e2e','--','--project=mobile-360','--grep','authenticated host']],
  preview: ['npm', ['run','test:e2e','--','tests/customization.spec.ts','--project=mobile-360','--grep','theme choices','--reporter=list']],
  host: ['npm', ['run','test:e2e','--','tests/host-guest.smoke.spec.ts','--project=mobile-360','--reporter=list','--output=artifacts/host-test-results']],
  auth: ['npm', ['run','test:e2e','--','tests/auth.smoke.spec.ts','--project=mobile-360','--reporter=list']],
  api: ['node', ['scripts/test-guest-permissions.mjs']],
  allowance: ['node', ['scripts/test-invitation-allowance.mjs']],
  audio: ['npm', ['run','test:e2e','--','tests/wedding-audio.spec.ts','--project=mobile-360','--reporter=list','--output=artifacts/audio-test-results']],
  plan: ['npm', ['run','test:e2e','--','tests/invitation-plan.spec.ts','--project=mobile-360','--reporter=list','--output=artifacts/plan-test-results']],
  public: ['npm', ['run','test:e2e','--','tests/public-pages.spec.ts','tests/customization.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/public-test-results']],
  visual: ['npm', ['run','test:e2e','--','tests/public-pages.spec.ts','tests/customization.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--grep','homepage|lotus|real published|personal guest|collection|customization|functions can|theme choices|account navigation|anonymous visitors','--reporter=list','--output=artifacts/visual-recheck-results']],
  polish: ['npm', ['run','test:e2e','--','tests/motion-venue-music.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/polish-test-results']],
  curated: ['npm', ['run','test:e2e','--','tests/motion-venue-music.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--grep','three real|motion preferences','--reporter=list','--output=artifacts/curated-cover-results']],
  ceremony: ['npm', ['run','test:e2e','--','tests/ceremony-art.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/ceremony-art-results']],
  'published-review': ['npm',['run','test:e2e','--','tests/public-pages.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--grep','real published','--reporter=list','--output=artifacts/published-brand-results']],
  'polish-gallery': ['npm', ['run','test:e2e','--','tests/motion-venue-music.spec.ts','--project=mobile-360','--grep','occasion selection','--reporter=list','--output=artifacts/polish-gallery-results']],
  journey: ['npm', ['run','test:e2e','--','tests/occasion-editor.spec.ts','--project=mobile-360','--reporter=list','--output=artifacts/journey-test-results']],
  unit: ['npm', ['run','test:e2e','--','--project=data-validation','--reporter=list']],
  artwork: ['node',['scripts/capture-occasion-art.mjs']],
  'before-ui': ['node',['scripts/capture-home-editor-before.mjs']],
  'stationery-before': ['node',['scripts/capture-stationery-before.mjs']],
  'creative-before': ['node',['scripts/capture-templates-before.mjs']],
  'creative': ['npm',['run','test:e2e','--','tests/creative-templates.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/creative-templates-test-results']],
  'creative-edge': ['npm',['run','test:e2e','--','tests/creative-templates.spec.ts','--project=mobile-320','--grep','open by keyboard|maximum-length','--reporter=list','--output=artifacts/creative-edge-test-results']],
  wording: ['npm',['run','test:e2e','--','tests/invitation-wording.spec.ts','--project=mobile-360','--reporter=list','--output=artifacts/wording-test-results']],
  blog: ['npm',['run','test:e2e','--','tests/blog.spec.ts','--project=mobile-320','--project=mobile-390','--project=desktop','--reporter=list','--output=artifacts/blog-test-results']],
  'creative-regression': ['npm',['run','test:e2e','--','tests/public-pages.spec.ts','tests/motion-venue-music.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--grep','real published|motion preferences|occasion selection','--reporter=list','--output=artifacts/creative-regression-test-results']],
  'lighthouse-creative-royal': ['node',['scripts/measure-lighthouse.mjs','royal']],
  'lighthouse-creative-fix': ['node',['scripts/measure-lighthouse.mjs','templates','royal','published']],
  'lighthouse-creative': ['node',['scripts/measure-lighthouse.mjs','templates','royal','mehfil','published']],
  'stationery': ['npm',['run','test:e2e','--','tests/homepage-stationery.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/stationery-test-results']],
  'stationery-regression': ['npm',['run','test:e2e','--','tests/public-pages.spec.ts','tests/home-editor-ux.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--grep','homepage|FAQ answers','--reporter=list','--output=artifacts/stationery-regression-results']],
  'lighthouse-stationery': ['node',['scripts/measure-lighthouse.mjs','homepage','published']],
  'home-editor': ['npm',['run','test:e2e','--','tests/home-editor-ux.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/home-editor-test-results']],
  'editor-regression': ['npm',['run','test:e2e','--','tests/customization.spec.ts','--project=mobile-320','--project=mobile-360','--project=mobile-390','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/editor-regression-results']],
  'lighthouse-home-editor': ['node',['scripts/measure-lighthouse.mjs','homepage','templates','customize','published']],
  'lighthouse-home-editor-fix': ['node',['scripts/measure-lighthouse.mjs','homepage','templates','customize']],
  lighthouse: ['node', ['scripts/measure-lighthouse.mjs','homepage','published','guest','templates','birthday','remembrance']],
};
if (!commands[mode]) throw new Error(`Use prepare, fixture, or one of: ${Object.keys(commands).join(', ')}.`);
const [command, args] = commands[mode];
if (mode.startsWith('lighthouse-home-editor')) env.LIGHTHOUSE_OUTPUT_DIR = 'artifacts/home-editor-lighthouse';
if (mode === 'lighthouse-stationery') env.LIGHTHOUSE_OUTPUT_DIR = 'artifacts/stationery-lighthouse';
if (mode.startsWith('lighthouse-creative')) env.LIGHTHOUSE_OUTPUT_DIR = 'artifacts/creative-templates-lighthouse';
const child = spawn(command, args, { env, stdio: 'inherit' });
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => { console.error('Could not start integration command.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
