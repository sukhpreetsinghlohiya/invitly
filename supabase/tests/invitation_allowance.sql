-- Disposable local fixtures only. Every fixture and mutation is rolled back.
begin;
insert into auth.users (id,email) values
 ('fa000000-0000-4000-a000-000000000001','allowance-a@example.invalid'),
 ('fa000000-0000-4000-a000-000000000002','allowance-b@example.invalid'),
 ('fa000000-0000-4000-a000-000000000003','allowance-bulk@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','fa000000-0000-4000-a000-000000000001',true);
insert into public.events (id,owner_id,title,slug,starts_at) values
 ('fb000000-0000-4000-a000-000000000001',auth.uid(),'First free','allowance-test-first',now()),
 ('fb000000-0000-4000-a000-000000000002',auth.uid(),'Second free','allowance-test-second',now());
do $$
begin
 if (select invitations_used from public.invitation_allowances where user_id=auth.uid()) <> 2 then raise exception 'Two creations must consume two slots'; end if;
 begin
  insert into public.events(owner_id,title,slug,starts_at) values(auth.uid(),'Third','allowance-test-third',now());
  raise exception 'Third creation was allowed';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'FREE_INVITATION_LIMIT_REACHED' then raise; end if;
 end;
 -- Counter data is readable only, and cannot be reset, deleted or forged by a host.
 begin
  update public.invitation_allowances set invitations_used=0 where user_id=auth.uid();
  raise exception 'Allowance reset was allowed';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.invitation_allowances where user_id=auth.uid();
  raise exception 'Allowance delete was allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.invitation_allowances(user_id,invitations_used) values(auth.uid(),0);
  raise exception 'Allowance forgery was allowed';
 exception when insufficient_privilege then null; end;
end; $$;
-- Editing, changing theme, publishing, unpublishing and upsert updates still work at limit.
update public.events set title='Edited at limit',theme_id='modern',is_published=true where id='fb000000-0000-4000-a000-000000000001';
update public.events set is_published=false where id='fb000000-0000-4000-a000-000000000001';
insert into public.events (id,owner_id,title,slug,starts_at)
 values ('fb000000-0000-4000-a000-000000000001',auth.uid(),'Upsert edit','allowance-test-first',now())
 on conflict(id) do update set title=excluded.title;
insert into public.events (id,owner_id,title,slug,starts_at)
 values ('fb000000-0000-4000-a000-000000000001',auth.uid(),'No-op','allowance-test-first',now())
 on conflict(id) do nothing;
delete from public.events where id='fb000000-0000-4000-a000-000000000002';
do $$
begin
 if (select invitations_used from public.invitation_allowances where user_id=auth.uid()) <> 2 then raise exception 'Editing or deletion changed usage'; end if;
 if not exists(select 1 from public.events where id='fb000000-0000-4000-a000-000000000001' and title='Upsert edit') then raise exception 'Editing at limit failed'; end if;
 begin
  insert into public.events(owner_id,title,slug,starts_at) values(auth.uid(),'After delete','allowance-test-after-delete',now());
  raise exception 'Deleting an invitation refunded a lifetime slot';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'FREE_INVITATION_LIMIT_REACHED' then raise; end if;
 end;
end; $$;
select set_config('request.jwt.claim.sub','fa000000-0000-4000-a000-000000000002',true);
do $$
begin
 if exists(select 1 from public.invitation_allowances) then raise exception 'Another account allowance leaked'; end if;
 begin
  insert into public.events(owner_id,title,slug,starts_at) values(auth.uid(),'Invalid duplicate','allowance-test-first',now());
  raise exception 'Duplicate slug was allowed';
 exception when unique_violation then null; end;
 if exists(select 1 from public.invitation_allowances) then raise exception 'Failed insert consumed a free slot'; end if;
end; $$;
insert into public.events(owner_id,title,slug,starts_at) values(auth.uid(),'Other account','allowance-test-other',now());
select set_config('request.jwt.claim.sub','fa000000-0000-4000-a000-000000000003',true);
do $$
begin
 begin
  insert into public.events(owner_id,title,slug,starts_at) values
   (auth.uid(),'Bulk 1','allowance-test-bulk-1',now()),
   (auth.uid(),'Bulk 2','allowance-test-bulk-2',now()),
   (auth.uid(),'Bulk 3','allowance-test-bulk-3',now());
  raise exception 'Bulk insert bypassed the allowance';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'FREE_INVITATION_LIMIT_REACHED' then raise; end if;
 end;
 if exists(select 1 from public.events) or exists(select 1 from public.invitation_allowances) then raise exception 'Failed bulk insert did not roll back'; end if;
end; $$;
set local role anon;
do $$
begin
 begin
  perform 1 from public.invitation_allowances;
  raise exception 'Anonymous allowance access was allowed';
 exception when insufficient_privilege then null; end;
end; $$;
rollback;
