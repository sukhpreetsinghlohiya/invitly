import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const settings = JSON.parse(await readFile('artifacts/local-supabase.json', 'utf8'));
const url = new URL(settings.API_URL);
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Integration tests only run against an isolated local Supabase instance.');
const mode = process.argv[2] || 'test';
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
  console.log('Fictional local invitation: http://127.0.0.1:3001/i/invitly-local-preview');
  process.exit(0);
}
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: settings.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: settings.PUBLISHABLE_KEY, SUPABASE_SECRET_KEY: settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3001', LIGHTHOUSE_BASE_URL: 'http://127.0.0.1:3001', LIGHTHOUSE_INVITE_PATH: '/i/invitly-local-preview', INVITLY_INTEGRATION: '1', TEST_HOST_A_EMAIL: accounts.A.email, TEST_HOST_A_PASSWORD: accounts.A.password, TEST_HOST_B_EMAIL: accounts.B.email, TEST_HOST_B_PASSWORD: accounts.B.password };
const commands = {
  build: ['npm', ['run','build']],
  start: ['npm', ['run','start','--','--hostname','127.0.0.1','--port','3001']],
  test: ['npm', ['run','test:e2e','--','--project=mobile-360','--grep','authenticated host']],
  preview: ['npm', ['run','test:e2e','--','tests/customization.spec.ts','--project=mobile-360','--grep','theme choices','--reporter=list']],
  host: ['npm', ['run','test:e2e','--','tests/host-guest.smoke.spec.ts','--project=mobile-360','--reporter=list','--output=artifacts/host-test-results']],
  auth: ['npm', ['run','test:e2e','--','tests/auth.smoke.spec.ts','--project=mobile-360','--reporter=list']],
  api: ['node', ['scripts/test-guest-permissions.mjs']],
  public: ['npm', ['run','test:e2e','--','tests/public-pages.spec.ts','tests/customization.spec.ts','--project=mobile-360','--project=tablet','--project=desktop','--reporter=list','--output=artifacts/public-test-results']],
  unit: ['npm', ['run','test:e2e','--','--project=data-validation','--reporter=list']],
  lighthouse: ['node', ['scripts/measure-lighthouse.mjs','homepage','royal','modern','floral','published']],
};
if (!commands[mode]) throw new Error(`Use prepare, fixture, or one of: ${Object.keys(commands).join(', ')}.`);
const [command, args] = commands[mode];
const child = spawn(command, args, { env, stdio: 'inherit' });
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => { console.error('Could not start integration command.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
