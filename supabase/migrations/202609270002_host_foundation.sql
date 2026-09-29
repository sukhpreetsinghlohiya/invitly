begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);
create table public.themes (
  id text primary key,
  name text not null,
  description text not null default ''
);
insert into public.themes (id, name, description) values
  ('royal', 'Royal Indian', 'An architectural invitation in maroon and muted gold.'),
  ('modern', 'Modern Minimal', 'Quiet typography, generous space, and a contemporary layout.'),
  ('floral', 'Floral Celebration', 'An original botanical illustration and a soft garden palette.');
alter table public.events add column theme_id text not null default 'royal' references public.themes(id);

create table public.event_segments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  starts_at timestamptz not null,
  venue text not null default '' check (char_length(venue) <= 500),
  maps_url text not null default '' check (maps_url = '' or (maps_url ~ '^https://' and char_length(maps_url) <= 2000)),
  sort_order integer not null default 0 check (sort_order between 0 and 100),
  created_at timestamptz not null default now()
);
create table public.media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  check (split_part(storage_path, '/', 1) = event_id::text)
);
create index event_segments_event_id_idx on public.event_segments(event_id);
create index media_event_id_idx on public.media(event_id);
alter table public.profiles enable row level security;
alter table public.themes enable row level security;
alter table public.event_segments enable row level security;
alter table public.media enable row level security;
revoke all on public.profiles, public.themes, public.event_segments, public.media from anon, authenticated;
grant select on public.themes, public.event_segments to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.media to authenticated;
grant insert, update, delete on public.event_segments to authenticated;

create policy "Hosts read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Hosts create own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Hosts edit own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Hosts delete own profile" on public.profiles for delete to authenticated using (id = (select auth.uid()));
create policy "Everyone can read themes" on public.themes for select using (true);
create policy "Read segments for visible events" on public.event_segments for select using (exists (select 1 from public.events e where e.id = event_id));
create policy "Hosts create own segments" on public.event_segments for insert to authenticated with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Hosts edit own segments" on public.event_segments for update to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))) with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Hosts delete own segments" on public.event_segments for delete to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Hosts read own media metadata" on public.media for select to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Hosts create own media metadata" on public.media for insert to authenticated with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Hosts edit own media metadata" on public.media for update to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))) with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "Hosts delete own media metadata" on public.media for delete to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

-- A narrowly scoped trigger creates profile metadata for email/password signups.
create function public.create_host_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120));
  return new;
end;
$$;
revoke all on function public.create_host_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_host_profile();
insert into public.profiles (id, full_name)
select id, left(coalesce(raw_user_meta_data ->> 'full_name', ''), 120) from auth.users on conflict (id) do nothing;
commit;
