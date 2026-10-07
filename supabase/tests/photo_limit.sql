-- Isolated transaction fixtures: none of these users/events/photos survive.
begin;
set local statement_timeout = '10s';
insert into auth.users(id,email) values
 ('fc000000-0000-4000-a000-000000000001','photo-limit-a@example.invalid'),
 ('fc000000-0000-4000-a000-000000000002','photo-limit-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','fc000000-0000-4000-a000-000000000001',true);
insert into public.events(id,owner_id,title,slug,starts_at) values
 ('fd000000-0000-4000-a000-000000000001',auth.uid(),'Photo limit one','photo-limit-test-one',now()),
 ('fd000000-0000-4000-a000-000000000002',auth.uid(),'Photo limit two','photo-limit-test-two',now());
insert into public.media(event_id,storage_path,mime_type,size_bytes)
 select 'fd000000-0000-4000-a000-000000000001',
   'fd000000-0000-4000-a000-000000000001/photo-'||n||'.webp','image/webp',100
 from generate_series(1,12) n;
do $$ begin
 begin
  insert into public.media(event_id,storage_path,mime_type,size_bytes)
   values('fd000000-0000-4000-a000-000000000001','fd000000-0000-4000-a000-000000000001/extra.webp','image/webp',100);
  raise exception 'Thirteenth photo was allowed';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'EVENT_PHOTO_LIMIT_REACHED' then raise; end if;
 end;
 -- App roles cannot read, reset, forge, or invoke the private counter.
 begin
  perform 1 from invitly_private.event_photo_counts;
  raise exception 'Private counts are readable by a host';
 exception when insufficient_privilege then null; end;
 begin
  update invitly_private.event_photo_counts set photo_count=0;
  raise exception 'Host reset a photo count';
 exception when insufficient_privilege then null; end;
 begin
  delete from invitly_private.event_photo_counts;
  raise exception 'Host deleted a photo count';
 exception when insufficient_privilege then null; end;
 begin
  perform invitly_private.enforce_event_photo_limit();
  raise exception 'Host called the private trigger';
 exception when insufficient_privilege then null; end;
end; $$;

-- A no-op upsert and an update upsert must not consume another slot.
insert into public.media(id,event_id,storage_path,mime_type,size_bytes)
 select id,event_id,storage_path,mime_type,size_bytes from public.media
 where storage_path='fd000000-0000-4000-a000-000000000001/photo-1.webp'
 on conflict(id) do nothing;
insert into public.media(id,event_id,storage_path,mime_type,size_bytes)
 select id,event_id,storage_path,mime_type,size_bytes from public.media
 where storage_path='fd000000-0000-4000-a000-000000000001/photo-1.webp'
 on conflict(id) do update set alt_text='Edited at the limit';

delete from public.media where storage_path='fd000000-0000-4000-a000-000000000001/photo-12.webp';
do $$ begin
 begin
  insert into public.media(event_id,storage_path,mime_type,size_bytes)
   select 'fd000000-0000-4000-a000-000000000001',
    'fd000000-0000-4000-a000-000000000001/bulk-'||n||'.webp','image/webp',100
   from generate_series(1,2) n;
  raise exception 'Bulk photos bypassed the limit';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'EVENT_PHOTO_LIMIT_REACHED' then raise; end if;
 end;
 if (select count(*) from public.media where event_id='fd000000-0000-4000-a000-000000000001')<>11 then
  raise exception 'Failed bulk insert did not roll back';
 end if;
end; $$;
insert into public.media(event_id,storage_path,mime_type,size_bytes)
 values('fd000000-0000-4000-a000-000000000001','fd000000-0000-4000-a000-000000000001/replacement.webp','image/webp',100);

-- Moving a photo transfers its slot; a rejected move must leave both counts intact.
update public.media set event_id='fd000000-0000-4000-a000-000000000002',
 storage_path='fd000000-0000-4000-a000-000000000002/moved.webp'
 where storage_path='fd000000-0000-4000-a000-000000000001/photo-1.webp';
insert into public.media(event_id,storage_path,mime_type,size_bytes)
 values('fd000000-0000-4000-a000-000000000001','fd000000-0000-4000-a000-000000000001/after-move.webp','image/webp',100);
do $$ begin
 begin
  update public.media set event_id='fd000000-0000-4000-a000-000000000001',
   storage_path='fd000000-0000-4000-a000-000000000001/denied-move.webp'
   where storage_path='fd000000-0000-4000-a000-000000000002/moved.webp';
  raise exception 'Move into a full invitation was allowed';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'EVENT_PHOTO_LIMIT_REACHED' then raise; end if;
 end;
 if (select count(*) from public.media where event_id='fd000000-0000-4000-a000-000000000002')<>1 then
  raise exception 'Rejected move removed its original photo';
 end if;
end; $$;

-- A second host still cannot insert, edit, or remove another host's photos.
select set_config('request.jwt.claim.sub','fc000000-0000-4000-a000-000000000002',true);
do $$ begin
 if exists(select 1 from public.media) then raise exception 'Other host photos leaked'; end if;
 begin
  insert into public.media(event_id,storage_path,mime_type,size_bytes)
   values('fd000000-0000-4000-a000-000000000002','fd000000-0000-4000-a000-000000000002/intruder.webp','image/webp',100);
  raise exception 'Other host uploaded a photo';
 exception when insufficient_privilege then null; end;
 update public.media set alt_text='Intruder edit' where event_id='fd000000-0000-4000-a000-000000000001';
 if found then raise exception 'Other host updated photos'; end if;
 delete from public.media where event_id='fd000000-0000-4000-a000-000000000001';
 if found then raise exception 'Other host deleted photos'; end if;
end; $$;
set local role anon;
do $$ begin
 begin
  perform 1 from invitly_private.event_photo_counts;
  raise exception 'Anonymous counter access allowed';
 exception when insufficient_privilege then null; end;
end; $$;

reset role;
do $$ begin
 if (select photo_count from invitly_private.event_photo_counts where event_id='fd000000-0000-4000-a000-000000000001')<>12
 or (select photo_count from invitly_private.event_photo_counts where event_id='fd000000-0000-4000-a000-000000000002')<>1 then
  raise exception 'Private counts drifted after edits, rollbacks or moves';
 end if;
 if has_table_privilege('authenticated','invitly_private.event_photo_counts','INSERT,UPDATE,DELETE,TRUNCATE')
 or has_table_privilege('service_role','invitly_private.event_photo_counts','INSERT,UPDATE,DELETE,TRUNCATE')
 or has_function_privilege('authenticated','invitly_private.enforce_event_photo_limit()','EXECUTE') then
  raise exception 'App roles have private counter privileges';
 end if;
end; $$;

-- Event deletion/cascades must not be blocked by count maintenance.
set local role authenticated;
select set_config('request.jwt.claim.sub','fc000000-0000-4000-a000-000000000001',true);
delete from public.events where id='fd000000-0000-4000-a000-000000000002';
reset role;
do $$ begin
 if exists(select 1 from invitly_private.event_photo_counts where event_id='fd000000-0000-4000-a000-000000000002') then
  raise exception 'Deleted event left a counter';
 end if;
end; $$;

-- Simulate a pre-migration overage within this transaction only. The migration
-- backfills the exact count, keeps every existing row, and never deletes photos.
select set_config('request.jwt.claim.sub','fc000000-0000-4000-a000-000000000002',true);
insert into public.events(id,owner_id,title,slug,starts_at) values
 ('fd000000-0000-4000-a000-000000000003','fc000000-0000-4000-a000-000000000002','Legacy photos','photo-limit-test-legacy',now());
set local session_replication_role = replica;
insert into public.media(event_id,storage_path,mime_type,size_bytes)
 select 'fd000000-0000-4000-a000-000000000003',
   'fd000000-0000-4000-a000-000000000003/legacy-'||n||'.webp','image/webp',100
 from generate_series(1,13) n;
set local session_replication_role = origin;
insert into invitly_private.event_photo_counts(event_id,photo_count)
 select event_id,count(*) from public.media where event_id='fd000000-0000-4000-a000-000000000003' group by event_id;
set local role authenticated;
select set_config('request.jwt.claim.sub','fc000000-0000-4000-a000-000000000002',true);
update public.media set alt_text='Legacy photo remains editable' where event_id='fd000000-0000-4000-a000-000000000003';
do $$ begin
 if (select count(*) from public.media)<>13 then raise exception 'Legacy overage was not preserved'; end if;
 begin
  insert into public.media(event_id,storage_path,mime_type,size_bytes)
   values('fd000000-0000-4000-a000-000000000003','fd000000-0000-4000-a000-000000000003/too-many.webp','image/webp',100);
  raise exception 'Legacy overage allowed another photo';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'EVENT_PHOTO_LIMIT_REACHED' then raise; end if;
 end;
end; $$;
delete from public.media where storage_path in (
 'fd000000-0000-4000-a000-000000000003/legacy-12.webp',
 'fd000000-0000-4000-a000-000000000003/legacy-13.webp');
insert into public.media(event_id,storage_path,mime_type,size_bytes)
 values('fd000000-0000-4000-a000-000000000003','fd000000-0000-4000-a000-000000000003/recovered.webp','image/webp',100);
reset role;
do $$ begin
 if (select photo_count from invitly_private.event_photo_counts where event_id='fd000000-0000-4000-a000-000000000003')<>12 then
  raise exception 'Legacy overage did not recover after removals';
 end if;
end; $$;
rollback;
