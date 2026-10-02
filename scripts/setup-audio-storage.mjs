import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';

const local = process.argv.includes('--local');
if (!local && !process.argv.includes('--hosted')) throw new Error('Choose --local or --hosted.');
let url, secret;
if (local) {
  const settings = JSON.parse(await readFile('artifacts/local-supabase.json', 'utf8'));
  url = settings.API_URL; secret = settings.SECRET_KEY || settings.SERVICE_ROLE_KEY;
  if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Expected local Supabase.');
} else {
  nextEnv.loadEnvConfig(process.cwd());
  url = process.env.NEXT_PUBLIC_SUPABASE_URL; secret = process.env.SUPABASE_SECRET_KEY;
}
if (!url || !secret) throw new Error('Supabase server configuration is required.');
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const options = { public: false, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: ['audio/mpeg'] };
const { data: bucket, error: readError } = await client.storage.getBucket('event-audio');
if (bucket) {
  if (bucket.public || Number(bucket.file_size_limit) !== options.fileSizeLimit || bucket.allowed_mime_types?.join(',') !== 'audio/mpeg') throw new Error('Existing event-audio bucket differs from the expected private MP3 configuration. Review it before updating.');
  console.log(`${local ? 'Local' : 'Hosted'} private audio storage verified.`);
} else {
  if (readError && !['400', '404'].includes(String(readError.statusCode))) throw new Error('Could not inspect audio storage.');
  const { error } = await client.storage.createBucket('event-audio', options);
  if (error) throw new Error(`Audio bucket setup failed: ${error.message}`);
  console.log(`${local ? 'Local' : 'Hosted'} private audio storage created (MP3, 10 MB).`);
}
