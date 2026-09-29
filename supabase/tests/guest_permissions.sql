-- Run after every migration as postgres in a disposable Supabase database.
-- Every fixture and response is rolled back. Tokens below are synthetic test data.
begin;
insert into auth.users(id,email) values
 ('f3000000-0000-4000-a000-000000000001','invitly-guest-policy-a@example.invalid'),
 ('f3000000-0000-4000-a000-000000000002','invitly-guest-policy-b@example.invalid');
insert into public.events(id,owner_id,slug,title,starts_at,is_published,venue,public_function_ids,invitation_content) values
 ('f4000000-0000-4000-a000-000000000001','f3000000-0000-4000-a000-000000000001','guest-policy-a','Test invitation A',now(),true,'SECRET VENUE',array['public'],
  '{"city":"Public city","secret_key":"PRIVATE","updates":[{"message":"PRIVATE"}],"functions":[{"id":"public","name":"Public function","private_field":"PRIVATE"},{"id":"private","name":"Private function","venue":"SECRET VENUE"}]}'),
 ('f4000000-0000-4000-a000-000000000002','f3000000-0000-4000-a000-000000000002','guest-policy-b','Test invitation B',now(),true,'',null,null),
 ('f4000000-0000-4000-a000-000000000003','f3000000-0000-4000-a000-000000000001','guest-policy-draft','Test draft',now(),false,'',null,null);
insert into public.guest_groups(id,event_id,name,function_ids) values
 ('f5000000-0000-4000-a000-000000000001','f4000000-0000-4000-a000-000000000001','Family',array['private']);
insert into public.guests(id,event_id,group_id,name,max_party_size,token_hash) values
 ('f6000000-0000-4000-a000-000000000001','f4000000-0000-4000-a000-000000000001','f5000000-0000-4000-a000-000000000001','Guest A',2,encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex')),
 ('f6000000-0000-4000-a000-000000000002','f4000000-0000-4000-a000-000000000001',null,'Guest B',1,encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex'));
insert into public.event_updates(event_id,message,is_published,pinned) values
 ('f4000000-0000-4000-a000-000000000001','Visible announcement',true,true),
 ('f4000000-0000-4000-a000-000000000001','PRIVATE announcement',false,false);
insert into public.media(id,event_id,storage_path,mime_type,size_bytes) values
 ('f7000000-0000-4000-a000-000000000001','f4000000-0000-4000-a000-000000000001','f4000000-0000-4000-a000-000000000001/photo.jpg','image/jpeg',100);

set local role authenticated;
select set_config('request.jwt.claim.sub','f3000000-0000-4000-a000-000000000002',true);
do $$ declare changed integer; begin
 if exists(select 1 from public.guests where event_id='f4000000-0000-4000-a000-000000000001') then raise exception 'Other host guest list leaked'; end if;
 if exists(select 1 from public.guest_groups where event_id='f4000000-0000-4000-a000-000000000001') then raise exception 'Other host guest groups leaked'; end if;
 update public.guests set name='Unauthorized' where id='f6000000-0000-4000-a000-000000000001';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Other host guest writable'; end if;
 begin
   insert into public.guests(event_id,name,token_hash) values('f4000000-0000-4000-a000-000000000001','Spoof',repeat('c',64));
   raise exception 'Other host guest insert allowed';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.guests(event_id,group_id,name,token_hash) values('f4000000-0000-4000-a000-000000000002','f5000000-0000-4000-a000-000000000001','Cross-event group',repeat('c',64));
   raise exception 'Cross-event group assignment allowed';
 exception when foreign_key_violation then null; end;
end; $$;

set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ declare payload jsonb; result jsonb; begin
 begin perform 1 from public.guests; raise exception 'Guest table is public'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.guest_responses; raise exception 'Responses table is public'; exception when insufficient_privilege then null; end;
 begin perform invitly_private.invitation_payload('f4000000-0000-4000-a000-000000000001',null); raise exception 'Private projection callable'; exception when insufficient_privilege then null; end;
 payload:=public.get_public_invitation('guest-policy-a');
 if jsonb_array_length(payload#>'{invitation_content,functions}') is distinct from 1 then raise exception 'Public function filter failed'; end if;
 if payload#>>'{invitation_content,functions,0,id}' is distinct from 'public' then raise exception 'Wrong public function exposed'; end if;
 if payload::text like '%PRIVATE%' or payload::text like '%SECRET VENUE%' then raise exception 'Public JSON private data leaked'; end if;
 if payload->>'venue' is distinct from 'Public city' then raise exception 'Public venue is not sanitized'; end if;
 if jsonb_array_length(payload->'updates') is distinct from 1 then raise exception 'Private announcement leaked'; end if;
 if public.get_public_invitation('guest-policy-draft') is not null then raise exception 'Draft publicly available'; end if;
 if public.get_guest_invitation(repeat('z',64)) is not null then raise exception 'Malformed guest token accepted'; end if;
 if public.get_guest_invitation(repeat('c',64)) is not null then raise exception 'Unknown guest token accepted'; end if;
 payload:=public.get_guest_invitation(repeat('a',64));
 if payload#>>'{guest,name}' is distinct from 'Guest A' then raise exception 'Private guest lookup failed'; end if;
 if payload#>>'{invitation,invitation_content,functions,0,id}' is distinct from 'private' then raise exception 'Private group visibility failed'; end if;
 if payload ? 'token_hash' or payload ? 'email' then raise exception 'Guest credential/contact leaked'; end if;
 if public.get_guest_invitation(repeat('b',64))#>>'{invitation,invitation_content,functions,0,id}' is distinct from 'public' then raise exception 'Ungrouped guest visibility failed'; end if;
 result:=public.submit_guest_response(repeat('a',64),'attending',3,'');
 if not(result ? 'error') then raise exception 'Over-limit RSVP accepted'; end if;
 result:=public.submit_guest_response(repeat('a',64),'attending',2,'Vegetarian please');
 if result->>'ok' is distinct from 'true' then raise exception 'Valid RSVP failed: %',result; end if;
 result:=public.submit_guest_response(repeat('a',64),'maybe',1,'Changed');
 if not(result ? 'error') then raise exception 'RSVP throttling failed'; end if;
 if public.get_guest_invitation(repeat('b',64))->'response' is distinct from 'null'::jsonb then raise exception 'Another guest sees response'; end if;
 if public.get_published_media('f7000000-0000-4000-a000-000000000001') is null then raise exception 'Published media lookup failed'; end if;
end; $$;

reset role;
update public.guest_responses set updated_at=now()-interval '1 minute' where guest_id='f6000000-0000-4000-a000-000000000001';
set local role anon;
do $$ declare result jsonb; begin
 result:=public.submit_guest_response(repeat('a',64),'declined',0,'Plans changed');
 if result#>>'{response,status}' is distinct from 'declined' then raise exception 'RSVP update failed'; end if;
end; $$;
reset role;
do $$ begin
 if (select count(*) from public.guest_responses where event_id='f4000000-0000-4000-a000-000000000001')<>1 then raise exception 'RSVP upsert duplicated rows'; end if;
end; $$;
update public.events set is_published=false where id='f4000000-0000-4000-a000-000000000001';
set local role anon;
do $$ begin
 if public.get_public_invitation('guest-policy-a') is not null then raise exception 'Unpublished invitation accessible'; end if;
 if public.get_guest_invitation(repeat('a',64)) is not null then raise exception 'Unpublished private invite accessible'; end if;
 if public.get_published_media('f7000000-0000-4000-a000-000000000001') is not null then raise exception 'Unpublished media accessible'; end if;
 if not(public.submit_guest_response(repeat('a',64),'attending',1,'') ? 'error') then raise exception 'Unpublished RSVP accepted'; end if;
end; $$;
rollback;
