import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const settings = JSON.parse(await readFile('artifacts/local-supabase.json', 'utf8'));
const db = new URL(settings.DB_URL);
if (![db.hostname, new URL(settings.API_URL).hostname].every(host => ['127.0.0.1', 'localhost'].includes(host))) throw new Error('Disposable local Supabase only.');
const sql = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', 'supabase/tests/invitation_allowance.sql'], {
  env: { ...process.env, PGHOST: db.hostname, PGPORT: db.port, PGUSER: decodeURIComponent(db.username), PGPASSWORD: decodeURIComponent(db.password), PGDATABASE: db.pathname.slice(1) }, encoding: 'utf8',
});
if (sql.status !== 0) throw new Error(sql.stderr || 'Allowance SQL checks failed.');
console.log('Passed allowance SQL checks: two free saves, blocked third, editing, upserts, deletion, isolation, permissions and bulk rollback.');

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(settings.API_URL, settings.SECRET_KEY || settings.SERVICE_ROLE_KEY, options);
const suffix = randomBytes(8).toString('hex');
const email = `allowance-${suffix}@example.test`;
const password = randomBytes(24).toString('base64url');
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
assert.equal(error, null, 'Disposable test account creation must succeed');
try {
  const client = createClient(settings.API_URL, settings.PUBLISHABLE_KEY, options);
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, 'Local login must succeed');
  // A user-controlled paid-plan claim must never unlock more creations.
  assert.equal((await client.auth.updateUser({ data: { plan: 'paid', free_invitation_limit: 999 } })).error, null);
  const results = await Promise.all(Array.from({ length: 8 }, (_, index) => client.from('events').insert({ owner_id: data.user.id, title: 'Concurrent free invitation', slug: `quota-${suffix}-${index}`, starts_at: null }).select('id')));
  assert.equal(results.filter(result => !result.error).length, 2, 'Exactly two concurrent saves must succeed');
  assert.equal(results.filter(result => result.error?.message === 'FREE_INVITATION_LIMIT_REACHED').length, 6, 'All six excess requests must hit the quota');
  const { data: allowance, error: allowanceError } = await client.from('invitation_allowances').select('invitations_used').single();
  assert.equal(allowanceError, null);
  assert.equal(allowance.invitations_used, 2);
  const remaining = await client.from('events').select('id', { count: 'exact', head: true });
  assert.equal(remaining.count, 2);
  await client.auth.signOut({ scope: 'local' });
  console.log('Passed real HTTP concurrency: 8 simultaneous saves, exactly 2 accepted; forged paid metadata did not bypass the limit.');
} finally {
  const cleanup = await admin.auth.admin.deleteUser(data.user.id);
  assert.equal(cleanup.error, null, 'Disposable test account cleanup must succeed');
}
