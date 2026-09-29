-- Run AFTER all migrations in a disposable/test Supabase project using the SQL
-- editor (postgres role). Uses synthetic users and rolls back every fixture.
-- This is a policy integration check, not a substitute for browser auth tests.
begin;
insert into auth.users (id, email) values
  ('f1000000-0000-4000-a000-000000000001', 'invitly-policy-host-a@example.invalid'),
  ('f1000000-0000-4000-a000-000000000002', 'invitly-policy-host-b@example.invalid');
insert into public.events (id, owner_id, title, slug, starts_at, is_published) values
  ('f2000000-0000-4000-a000-000000000001', 'f1000000-0000-4000-a000-000000000001', 'Host A private', 'policy-test-host-a-private', now(), false),
  ('f2000000-0000-4000-a000-000000000002', 'f1000000-0000-4000-a000-000000000002', 'Host B private', 'policy-test-host-b-private', now(), false),
  ('f2000000-0000-4000-a000-000000000003', 'f1000000-0000-4000-a000-000000000002', 'Host B public', 'policy-test-host-b-public', now(), true);
insert into public.event_segments (event_id, title, starts_at) values
  ('f2000000-0000-4000-a000-000000000002', 'Private haldi', now()),
  ('f2000000-0000-4000-a000-000000000003', 'Public wedding', now());
insert into public.event_updates (event_id, message) values
  ('f2000000-0000-4000-a000-000000000002', 'Private update'),
  ('f2000000-0000-4000-a000-000000000003', 'Public update');
insert into public.media (event_id, storage_path, mime_type, size_bytes) values
  ('f2000000-0000-4000-a000-000000000002', 'f2000000-0000-4000-a000-000000000002/private.jpg', 'image/jpeg', 1024),
  ('f2000000-0000-4000-a000-000000000003', 'f2000000-0000-4000-a000-000000000003/public-event-private-media.jpg', 'image/jpeg', 1024);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-a000-000000000001', true);
do $$
declare changed integer;
begin
  if (select count(*) from public.profiles where id in ('f1000000-0000-4000-a000-000000000001', 'f1000000-0000-4000-a000-000000000002')) <> 1 then raise exception 'Profile isolation failed'; end if;
  if exists (select 1 from public.events where id = 'f2000000-0000-4000-a000-000000000002') then raise exception 'Other host draft leaked'; end if;
  if not exists (select 1 from public.events where id = 'f2000000-0000-4000-a000-000000000001') then raise exception 'Own draft inaccessible'; end if;
  if exists (select 1 from public.event_segments where event_id = 'f2000000-0000-4000-a000-000000000002') then raise exception 'Private segment leaked'; end if;
  if exists (select 1 from public.event_updates where event_id = 'f2000000-0000-4000-a000-000000000002') then raise exception 'Private update leaked'; end if;
  if exists (select 1 from public.media where event_id in ('f2000000-0000-4000-a000-000000000002', 'f2000000-0000-4000-a000-000000000003')) then raise exception 'Other host media metadata leaked'; end if;
  if exists (select 1 from public.event_segments where event_id = 'f2000000-0000-4000-a000-000000000003') then raise exception 'Other host raw segment leaked'; end if;
  if public.get_public_invitation('policy-test-host-b-public') is null then raise exception 'Published projection inaccessible'; end if;
  if not exists (select 1 from public.event_updates where event_id = 'f2000000-0000-4000-a000-000000000003') then raise exception 'Published update inaccessible'; end if;
  update public.events set title = 'Unauthorized edit' where id = 'f2000000-0000-4000-a000-000000000003';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Other host event writable'; end if;
  update public.event_segments set title = 'Unauthorized edit' where event_id = 'f2000000-0000-4000-a000-000000000003';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Other host segment writable'; end if;
  delete from public.event_updates where event_id = 'f2000000-0000-4000-a000-000000000003';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Other host update deletable'; end if;
  update public.media set alt_text = 'Unauthorized edit' where event_id = 'f2000000-0000-4000-a000-000000000003';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Other host media metadata writable'; end if;
  -- Valid owner writes must work, not merely reject all traffic.
  insert into public.event_segments (event_id, title, starts_at) values ('f2000000-0000-4000-a000-000000000001', 'Own haldi', now());
  insert into public.event_updates (event_id, message) values ('f2000000-0000-4000-a000-000000000001', 'Own update');
  insert into public.media (event_id, storage_path, mime_type, size_bytes) values ('f2000000-0000-4000-a000-000000000001', 'f2000000-0000-4000-a000-000000000001/own.jpg', 'image/jpeg', 1024);
  if not exists (select 1 from public.event_segments where event_id = 'f2000000-0000-4000-a000-000000000001') then raise exception 'Own segment inaccessible'; end if;
  if not exists (select 1 from public.event_updates where event_id = 'f2000000-0000-4000-a000-000000000001') then raise exception 'Own update inaccessible'; end if;
  if not exists (select 1 from public.media where event_id = 'f2000000-0000-4000-a000-000000000001') then raise exception 'Own media metadata inaccessible'; end if;
  begin
    insert into public.event_segments (event_id, title, starts_at) values ('f2000000-0000-4000-a000-000000000003', 'Unauthorized segment', now());
    raise exception 'Segment owner spoofing allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.event_updates (event_id, message) values ('f2000000-0000-4000-a000-000000000003', 'Unauthorized update');
    raise exception 'Update owner spoofing allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.media (event_id, storage_path, mime_type, size_bytes) values ('f2000000-0000-4000-a000-000000000003', 'f2000000-0000-4000-a000-000000000003/spoof.jpg', 'image/jpeg', 1024);
    raise exception 'Media owner spoofing allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.event_segments set event_id = 'f2000000-0000-4000-a000-000000000003' where event_id = 'f2000000-0000-4000-a000-000000000001';
    raise exception 'Segment transfer to other host allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.events (owner_id, title, slug, starts_at) values ('f1000000-0000-4000-a000-000000000002', 'Spoofed', 'policy-spoofed', now());
    raise exception 'Owner spoofing allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.events set owner_id = 'f1000000-0000-4000-a000-000000000002' where id = 'f2000000-0000-4000-a000-000000000001';
    raise exception 'Ownership transfer allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  begin
    perform 1 from public.events;
    raise exception 'Anonymous raw events exposed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.event_segments;
    raise exception 'Anonymous raw segments exposed';
  exception when insufficient_privilege then null;
  end;
  if public.get_public_invitation('policy-test-host-a-private') is not null then raise exception 'Draft projection leaked'; end if;
  if public.get_public_invitation('policy-test-host-b-public') is null then raise exception 'Published projection inaccessible'; end if;
  if exists (select 1 from public.event_updates where event_id = 'f2000000-0000-4000-a000-000000000002') then raise exception 'Anonymous private update leaked'; end if;
  if not exists (select 1 from public.event_updates where event_id = 'f2000000-0000-4000-a000-000000000003') then raise exception 'Published update inaccessible to guest'; end if;
  begin
    perform 1 from public.media;
    raise exception 'Anonymous media metadata exposed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.event_updates (event_id, message) values ('f2000000-0000-4000-a000-000000000003', 'Anonymous write');
    raise exception 'Anonymous update write allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.rsvps;
    raise exception 'Anonymous RSVP data exposed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
