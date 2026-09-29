-- Run once in a fresh Supabase project using the SQL editor or Supabase CLI.
begin;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 100),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  starts_at timestamptz not null,
  venue text not null default '' check (char_length(venue) <= 500),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  attendance text not null check (attendance in ('yes', 'no')),
  guests integer not null default 1 check (guests between 1 and 10),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.event_updates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index events_owner_id_idx on public.events(owner_id);
create index rsvps_user_id_idx on public.rsvps(user_id);
create index event_updates_event_id_idx on public.event_updates(event_id);
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.event_updates enable row level security;

grant select on public.events, public.event_updates to anon, authenticated;
grant insert, update, delete on public.events, public.event_updates to authenticated;
grant select, insert, update, delete on public.rsvps to authenticated;
revoke all on public.rsvps from anon;

create policy "Read published events or own drafts" on public.events for select
  using (is_published or owner_id = (select auth.uid()));
create policy "Create own events" on public.events for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Update own events without transferring ownership" on public.events for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Delete own events" on public.events for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "Guest and host can read RSVP" on public.rsvps for select to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Guest can RSVP to a published event" on public.rsvps for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.events e where e.id = event_id and e.is_published));
create policy "Guest can update own RSVP on published events" on public.rsvps for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.events e where e.id = event_id and e.is_published));
create policy "Guest can remove own RSVP" on public.rsvps for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Read updates for visible events" on public.event_updates for select
  using (exists (select 1 from public.events e where e.id = event_id));
create policy "Host can create event updates" on public.event_updates for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Host can edit event updates" on public.event_updates for update to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Host can delete event updates" on public.event_updates for delete to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

-- Assets are private. Only the host can manage / sign URLs for an event's media.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Host reads event media" on storage.objects for select to authenticated
  using (bucket_id = 'event-media' and exists (select 1 from public.events e where e.id::text = (storage.foldername(name))[1] and e.owner_id = (select auth.uid())));
create policy "Host uploads event media" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-media' and exists (select 1 from public.events e where e.id::text = (storage.foldername(name))[1] and e.owner_id = (select auth.uid())));
create policy "Host updates event media" on storage.objects for update to authenticated
  using (bucket_id = 'event-media' and exists (select 1 from public.events e where e.id::text = (storage.foldername(name))[1] and e.owner_id = (select auth.uid())))
  with check (bucket_id = 'event-media' and exists (select 1 from public.events e where e.id::text = (storage.foldername(name))[1] and e.owner_id = (select auth.uid())));
create policy "Host deletes event media" on storage.objects for delete to authenticated
  using (bucket_id = 'event-media' and exists (select 1 from public.events e where e.id::text = (storage.foldername(name))[1] and e.owner_id = (select auth.uid())));

-- Supabase Realtime applies the subscriber's SELECT policies to these updates.
alter publication supabase_realtime add table public.event_updates;
commit;
