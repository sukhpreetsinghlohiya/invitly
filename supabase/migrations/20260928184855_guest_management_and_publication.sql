begin;

alter table public.events add column published_at timestamptz,
  add column timezone text not null default 'Asia/Kolkata' check (char_length(timezone) between 1 and 80),
  add column public_function_ids text[] check (cardinality(public_function_ids) <= 100);
update public.events set published_at = created_at where is_published;
update public.events e set timezone=e.invitation_content->>'timezone'
  where exists(select 1 from pg_catalog.pg_timezone_names z where z.name=e.invitation_content->>'timezone');
alter table public.media add column width integer check (width between 1 and 16000),
  add column height integer check (height between 1 and 16000);
alter table public.event_updates add column is_published boolean not null default true,
  add column pinned boolean not null default false,
  add column updated_at timestamptz not null default now();

create function public.touch_event_update() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function public.touch_event_update() from public, anon, authenticated;
create trigger touch_event_update before update on public.event_updates for each row execute function public.touch_event_update();

create table public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  function_ids text[] check (cardinality(function_ids) <= 100),
  created_at timestamptz not null default now(),
  unique(event_id,name), unique(id,event_id)
);
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  group_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 40),
  max_party_size integer not null default 1 check (max_party_size between 1 and 20),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  foreign key(group_id,event_id) references public.guest_groups(id,event_id),
  unique(id,event_id)
);
create table public.guest_responses (
  guest_id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null check (status in ('attending','maybe','declined')),
  party_size integer not null check (party_size between 0 and 20),
  note text not null default '' check (char_length(note) <= 1000),
  updated_at timestamptz not null default now(),
  foreign key(guest_id,event_id) references public.guests(id,event_id) on delete cascade,
  check ((status = 'declined' and party_size = 0) or (status <> 'declined' and party_size >= 1))
);
create index guests_event_id_idx on public.guests(event_id);
create index guests_group_event_idx on public.guests(group_id,event_id);
create index guest_responses_event_id_idx on public.guest_responses(event_id);
alter table public.guest_groups enable row level security;
alter table public.guests enable row level security;
alter table public.guest_responses enable row level security;
revoke all on public.guest_groups,public.guests,public.guest_responses from anon,authenticated;
grant select,insert,update,delete on public.guest_groups,public.guests to authenticated;
grant select on public.guest_responses to authenticated;
create policy "Host manages own guest groups" on public.guest_groups for all to authenticated
  using (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())))
  with check (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
create policy "Host manages own guests" on public.guests for all to authenticated
  using (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())))
  with check (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
create policy "Host reads own guest responses" on public.guest_responses for select to authenticated
  using (exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));

-- Raw invitation documents may contain group-private functions. Guests must
-- use the narrow publication RPCs, even if they are logged in as another host.
drop policy "Read published events or own drafts" on public.events;
create policy "Host reads own events" on public.events for select to authenticated using(owner_id=(select auth.uid()));
revoke select on public.events,public.event_segments from anon;
drop policy "Read segments for visible events" on public.event_segments;
create policy "Host reads own segments" on public.event_segments for select to authenticated
  using(exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
drop policy "Read updates for visible events" on public.event_updates;

-- Public boolean gate discloses publication only, never an invitation document.
create function public.is_invitation_published(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.events where id=p_event_id and is_published);
$$;
revoke all on function public.is_invitation_published(uuid) from public;
grant execute on function public.is_invitation_published(uuid) to anon,authenticated;
create policy "Guests read published announcements" on public.event_updates for select to anon,authenticated
  using (is_published and public.is_invitation_published(event_id));
create policy "Host reads own announcements" on public.event_updates for select to authenticated
  using(exists(select 1 from public.events e where e.id=event_id and e.owner_id=(select auth.uid())));
grant select on public.event_updates to anon,authenticated;

create schema if not exists invitly_private;
revoke all on schema invitly_private from public,anon,authenticated;

-- Internal projection has no externally granted execution. Public wrappers
-- authenticate via publication status or a 256-bit bearer token respectively.
create function invitly_private.invitation_payload(p_event_id uuid,p_function_ids text[]) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id',e.id,'title',e.title,'slug',e.slug,'description',e.description,'starts_at',e.starts_at,
    'venue',case when e.invitation_content is null then e.venue else coalesce(e.invitation_content->>'city','') end,'theme_id',e.theme_id,'music_enabled',e.music_enabled,'timezone',e.timezone,
    'invitation_content',case when e.invitation_content is null then null else jsonb_build_object(
      'slug',e.slug,'couple',e.invitation_content->'couple','initials',e.invitation_content->'initials',
      'intro',e.invitation_content->'intro','message',e.invitation_content->'message','families',e.invitation_content->'families',
      'city',e.invitation_content->'city','weddingAt',e.invitation_content->'weddingAt','timezone',e.timezone,
      'functions',coalesce((select jsonb_agg(jsonb_build_object(
        'id',f.value->'id','name',f.value->'name','description',f.value->'description','startsAt',f.value->'startsAt',
        'venue',f.value->'venue','address',f.value->'address','dressCode',f.value->'dressCode','icon',f.value->'icon') order by f.ordinality)
        from jsonb_array_elements(case when jsonb_typeof(e.invitation_content->'functions')='array' then e.invitation_content->'functions' else '[]'::jsonb end) with ordinality f(value,ordinality)
        where p_function_ids is null or f.value->>'id'=any(p_function_ids)),'[]'::jsonb),'updates','[]'::jsonb) end,
    'photos',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'alt_text',m.alt_text,'width',m.width,'height',m.height) order by m.created_at) from public.media m where m.event_id=e.id),'[]'::jsonb),
    'segments',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'description',s.description,'starts_at',s.starts_at,'venue',s.venue,'maps_url',s.maps_url,'sort_order',s.sort_order) order by s.sort_order,s.starts_at)
      from public.event_segments s where s.event_id=e.id and (p_function_ids is null or s.id::text=any(p_function_ids))),'[]'::jsonb),
    'updates',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'message',u.message,'created_at',u.created_at,'updated_at',u.updated_at,'pinned',u.pinned) order by u.pinned desc,u.created_at desc)
      from public.event_updates u where u.event_id=e.id and u.is_published),'[]'::jsonb)
  ) from public.events e where e.id=p_event_id and e.is_published;
$$;
revoke all on function invitly_private.invitation_payload(uuid,text[]) from public,anon,authenticated;

create function public.get_public_invitation(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select invitly_private.invitation_payload(e.id,e.public_function_ids)
  from public.events e where e.slug=p_slug and e.is_published and char_length(p_slug) between 3 and 100;
$$;
revoke all on function public.get_public_invitation(text) from public;
grant execute on function public.get_public_invitation(text) to anon,authenticated;

create function public.get_guest_invitation(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare g public.guests; e public.events; ids text[]; response jsonb;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then return null; end if;
  select * into g from public.guests where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  if not found then return null; end if;
  select * into e from public.events where id=g.event_id and is_published;
  if not found then return null; end if;
  if g.group_id is null then ids:=e.public_function_ids;
  else select function_ids into ids from public.guest_groups where id=g.group_id and event_id=g.event_id; end if;
  select jsonb_build_object('status',r.status,'party_size',r.party_size,'note',r.note,'updated_at',r.updated_at) into response from public.guest_responses r where r.guest_id=g.id;
  return jsonb_build_object('invitation',invitly_private.invitation_payload(g.event_id,ids),'guest',jsonb_build_object('name',g.name,'max_party_size',g.max_party_size),'response',response);
end; $$;
revoke all on function public.get_guest_invitation(text) from public;
grant execute on function public.get_guest_invitation(text) to anon,authenticated;

create function public.submit_guest_response(p_token text,p_status text,p_party_size integer,p_note text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g public.guests; previous timestamptz; response public.guest_responses;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error','This invitation link is unavailable.'); end if;
  -- Lock the guest row to serialize repeat requests and make throttling atomic.
  select * into g from public.guests where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
  if not found then return jsonb_build_object('error','This invitation link is unavailable.'); end if;
  perform 1 from public.events where id=g.event_id and is_published for share;
  if not found then return jsonb_build_object('error','This invitation link is unavailable.'); end if;
  if p_status is null or p_status not in ('attending','maybe','declined') or p_party_size is null or p_note is null or char_length(p_note)>1000
    or (p_status='declined' and p_party_size<>0) or (p_status<>'declined' and (p_party_size<1 or p_party_size>g.max_party_size))
    then return jsonb_build_object('error','Check your attendance, party size, and note.'); end if;
  select updated_at into previous from public.guest_responses where guest_id=g.id;
  if previous>clock_timestamp()-interval '10 seconds' then return jsonb_build_object('error','Please wait 10 seconds before updating your response.'); end if;
  insert into public.guest_responses(guest_id,event_id,status,party_size,note,updated_at)
    values(g.id,g.event_id,p_status,p_party_size,trim(p_note),clock_timestamp())
    on conflict(guest_id) do update set status=excluded.status,party_size=excluded.party_size,note=excluded.note,updated_at=excluded.updated_at
    returning * into response;
  return jsonb_build_object('ok',true,'response',jsonb_build_object('status',response.status,'party_size',response.party_size,'note',response.note,'updated_at',response.updated_at));
end; $$;
revoke all on function public.submit_guest_response(text,text,integer,text) from public;
grant execute on function public.submit_guest_response(text,text,integer,text) to anon,authenticated;

create function public.get_published_media(p_media_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',m.id,'event_id',m.event_id,'storage_path',m.storage_path,'mime_type',m.mime_type,'width',m.width,'height',m.height,'alt_text',m.alt_text)
  from public.media m join public.events e on e.id=m.event_id where m.id=p_media_id and e.is_published;
$$;
revoke all on function public.get_published_media(uuid) from public;
grant execute on function public.get_published_media(uuid) to anon,authenticated;

-- Storage remains owner-only. Anonymous SELECT would also authorize minting
-- signed URLs that survive unpublishing. The app's server-only image proxy
-- checks get_published_media for every request and streams bytes without URLs.

commit;
