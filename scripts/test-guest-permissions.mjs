import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const settings=JSON.parse(await readFile('artifacts/local-supabase.json','utf8'));
const database=new URL(settings.DB_URL);
if(!['127.0.0.1','localhost'].includes(database.hostname)) throw new Error('Permission tests are limited to the isolated local database.');
const env={...process.env,PGHOST:database.hostname,PGPORT:database.port,PGUSER:decodeURIComponent(database.username),PGPASSWORD:decodeURIComponent(database.password),PGDATABASE:database.pathname.slice(1)};
const outcomes=[];
for(const file of ['supabase/tests/rls.sql','supabase/tests/guest_permissions.sql']){
 await new Promise((resolve,reject)=>{
  const child=spawn('psql',['-X','-v','ON_ERROR_STOP=1','-f',file],{env,stdio:['ignore','pipe','pipe']});
  let errors='';child.stdout.resume();child.stderr.on('data',chunk=>{errors+=chunk});
  child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${file} failed: ${errors}`)));
 });
 outcomes.push({check:file,passed:true}); console.log(`Passed ${file} (all fixtures rolled back).`);
}
// Verify the real HTTP auth and REST boundary as well as the SQL policy tests.
const accounts=JSON.parse(await readFile('artifacts/integration/accounts.json','utf8'));
const clientA=createClient(settings.API_URL,settings.PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const clientB=createClient(settings.API_URL,settings.PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
for(const [client,host] of [[clientA,'A'],[clientB,'B']]){
 const {error}=await client.auth.signInWithPassword({email:accounts[host].email,password:accounts[host].password});
 assert.equal(error,null,'Local test host login must succeed');
}
for(const table of ['guests','guest_groups','guest_responses']) {
 const {error}=await clientA.from(table).select('*').limit(1);
 assert.equal(error,null,`Host HTTP access to ${table} must work`);
}
const {data:profile,error:profileError}=await clientB.from('profiles').select('id').eq('id',accounts.A.id);
assert.equal(profileError,null);assert.deepEqual(profile,[],'Host B cannot read host A profile');
const anon=createClient(settings.API_URL,settings.PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {error:guestListError}=await anon.from('guests').select('id');
assert.ok(guestListError,'Anonymous callers cannot list guests');
const {data:invalid}=await anon.rpc('get_guest_invitation',{p_token:'0'.repeat(64)});
assert.equal(invalid,null,'Unknown token must not return an invitation');
const {error:signedUrlError}=await anon.storage.from('event-media').createSignedUrl('unknown/private.webp',3600);
assert.ok(signedUrlError,'Anonymous clients cannot mint media URLs');
await clientA.auth.signOut({scope:'local'});await clientB.auth.signOut({scope:'local'});
outcomes.push({check:'HTTP auth/profile/guest/token/storage boundary',passed:true});
await mkdir('artifacts/integration',{recursive:true});
await writeFile('artifacts/integration/permissions.json',JSON.stringify({measuredAt:new Date().toISOString(),outcomes},null,2));
console.log('Passed real HTTP auth and guest privacy checks.');
