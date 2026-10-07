import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const settings = JSON.parse(await readFile('artifacts/local-supabase.json', 'utf8'));
const database = new URL(settings.DB_URL);
if (!['127.0.0.1', 'localhost'].includes(database.hostname) || database.port !== '54322' || database.pathname !== '/postgres') {
  throw new Error('Photo-limit verification only runs against the isolated local Supabase database on port 54322.');
}
const dbEnv = {
  PATH: process.env.PATH,
  PGHOST: database.hostname, PGPORT: database.port, PGDATABASE: 'postgres',
  PGUSER: decodeURIComponent(database.username), PGPASSWORD: decodeURIComponent(database.password),
  PGCONNECT_TIMEOUT: '5', PGOPTIONS: '-c statement_timeout=10000 -c lock_timeout=5000',
};
function sql(source) {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', ['-X', '--quiet', '--no-align', '--tuples-only', '--set', 'ON_ERROR_STOP=1'], { env: dbEnv, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', error = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { error += data; });
    child.on('error', reject);
    child.on('close', code => resolve({ code, output: output.trim(), error }));
    child.stdin.end(source);
  });
}
async function succeed(source) {
  const result = await sql(source);
  assert.equal(result.code, 0, result.error);
  return result.output;
}

// Replay the exact migration against small isolated tables in a transaction.
// It exercises backfill without resetting or touching the application's tables.
const scope = `photo_migration_${randomUUID().replaceAll('-', '')}`;
const migration = (await readFile('supabase/migrations/20261006102232_enforce_event_photo_limit.sql', 'utf8'))
  .replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, '')
  .replaceAll('invitly_private', scope).replaceAll('public.events', `${scope}.events`).replaceAll('public.media', `${scope}.media`);
await succeed(`begin;
 create schema ${scope};
 create table ${scope}.events(id uuid primary key,owner_id uuid);
 create table ${scope}.media(id uuid primary key default gen_random_uuid(),event_id uuid not null references ${scope}.events(id) on delete cascade);
 insert into ${scope}.events(id) values('fe000000-0000-4000-a000-000000000001'),('fe000000-0000-4000-a000-000000000002');
 insert into ${scope}.media(event_id) select 'fe000000-0000-4000-a000-000000000001' from generate_series(1,5);
 insert into ${scope}.media(event_id) select 'fe000000-0000-4000-a000-000000000002' from generate_series(1,13);
 ${migration}
 do $$ begin
  if (select photo_count from ${scope}.event_photo_counts where event_id='fe000000-0000-4000-a000-000000000001')<>5
   or (select photo_count from ${scope}.event_photo_counts where event_id='fe000000-0000-4000-a000-000000000002')<>13
   or (select count(*) from ${scope}.media)<>18 then raise exception 'Migration changed existing photos or miscounted the backfill'; end if;
  insert into ${scope}.media(event_id) select 'fe000000-0000-4000-a000-000000000001' from generate_series(1,7);
  begin
   insert into ${scope}.media(event_id) values('fe000000-0000-4000-a000-000000000001');
   raise exception 'Backfilled invitation allowed more than 12 photos';
  exception when sqlstate 'P0001' then if sqlerrm<>'EVENT_PHOTO_LIMIT_REACHED' then raise; end if; end;
  begin
   insert into ${scope}.media(event_id) values('fe000000-0000-4000-a000-000000000002');
   raise exception 'Backfilled legacy overage accepted another photo';
  exception when sqlstate 'P0001' then if sqlerrm<>'EVENT_PHOTO_LIMIT_REACHED' then raise; end if; end;
  if has_table_privilege('authenticated','${scope}.event_photo_counts','INSERT,UPDATE,DELETE,TRUNCATE')
   or has_table_privilege('service_role','${scope}.event_photo_counts','INSERT,UPDATE,DELETE,TRUNCATE')
   or has_function_privilege('authenticated','${scope}.enforce_event_photo_limit()','EXECUTE') then
   raise exception 'Migration exposed counter mutation privileges'; end if;
 end; $$;
 rollback;`);
console.log('Migration replay passed: exact backfill, existing overage preservation, atomic limit and private privileges.');

await succeed(await readFile('supabase/tests/photo_limit.sql', 'utf8'));
console.log('Photo-limit rollback tests passed: bulk/upsert/move/delete behavior, failed transactions and RLS permissions.');

const host = randomUUID();
const first = randomUUID();
const second = randomUUID();
const auth = `set local role authenticated; select set_config('request.jwt.claim.sub','${host}',true);`;
const insert = (event, name) => `insert into public.media(event_id,storage_path,mime_type,size_bytes) values('${event}','${event}/${name}.webp','image/webp',100);`;
const transaction = (statements, commit = true) => `begin; ${auth} ${statements} ${commit ? 'commit' : 'rollback'};`;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function assertCounts(firstCount, secondCount) {
  const result = await succeed(`select count(m.id)::text||':'||coalesce(c.photo_count,0)::text from public.events e left join public.media m on m.event_id=e.id left join invitly_private.event_photo_counts c on c.event_id=e.id where e.id in ('${first}','${second}') group by e.id,c.photo_count order by case when e.id='${first}' then 0 else 1 end;`);
  assert.equal(result, `${firstCount}:${firstCount}\n${secondCount}:${secondCount}`);
}
function quotaResult(result) {
  if (result.code !== 0) assert.match(result.error, /EVENT_PHOTO_LIMIT_REACHED/);
  return result.code === 0;
}
try {
  await succeed(`begin; insert into auth.users(id,email) values('${host}','photo-race-${host}@example.invalid'); insert into public.events(id,owner_id,title,slug,starts_at) values('${first}','${host}','Photo race one','photo-race-${first}',now()),('${second}','${host}','Photo race two','photo-race-${second}',now()); ${Array.from({ length: 11 }, (_, n) => insert(first, `seed-${n}`)).join(' ')} commit;`);

  const finalSlot = await Promise.all([0, 1].map(n => sql(transaction(`${insert(first, `last-${n}`)} select pg_sleep(0.2);`))));
  assert.equal(finalSlot.filter(quotaResult).length, 1, 'Exactly one racing upload may take the final slot.');

  const bulkRace = await Promise.all(Array.from({ length: 16 }, (_, n) => sql(transaction(`${insert(second, `race-${n}`)} select pg_sleep(0.02);`))));
  assert.equal(bulkRace.filter(quotaResult).length, 12, 'Concurrent inserts on an empty invitation must stop at 12.');
  await assertCounts(12, 12);

  // The target deletion holds its counter lock while the move waits. Committing
  // frees one slot and the waiting move must consume exactly that slot.
  const deleting = sql(transaction(`delete from public.media where id=(select id from public.media where event_id='${second}' order by id limit 1); select pg_sleep(0.4);`));
  await pause(100);
  const moving = sql(transaction(`update public.media set event_id='${second}',storage_path='${second}/moved.webp' where storage_path='${first}/seed-0.webp';`));
  for (const result of await Promise.all([deleting, moving])) assert.equal(result.code, 0, result.error);
  await assertCounts(11, 12);

  // A rolled-back concurrent deletion cannot free a slot for a waiting move.
  const rollingBack = sql(transaction(`delete from public.media where id=(select id from public.media where event_id='${second}' and storage_path<>'${second}/moved.webp' order by id limit 1); select pg_sleep(0.4);`, false));
  await pause(100);
  const blockedMove = sql(transaction(`update public.media set event_id='${second}',storage_path='${second}/blocked-move.webp' where storage_path='${first}/seed-1.webp';`));
  const [rollbackResult, rejectedMove] = await Promise.all([rollingBack, blockedMove]);
  assert.equal(rollbackResult.code, 0, rollbackResult.error);
  assert.equal(quotaResult(rejectedMove), false);
  await assertCounts(11, 12);
  console.log('Concurrent photo tests passed: final-slot race, 16 simultaneous inserts, delete/move serialization and rollback.');
} finally {
  // Only the freshly generated local fixture owner and its cascading rows.
  await succeed(`delete from auth.users where id='${host}';`);
  const remaining = await succeed(`select count(*) from invitly_private.event_photo_counts where event_id in ('${first}','${second}');`);
  assert.equal(remaining, '0', 'Disposable photo counters must be removed with their test events.');
}
