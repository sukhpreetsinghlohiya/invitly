begin;

-- Block new saves while existing invitations are counted and the trigger is installed.
lock table public.events in share row exclusive mode;

create table public.invitation_allowances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invitations_used integer not null default 0 check (invitations_used >= 0)
);
alter table public.invitation_allowances enable row level security;
revoke all on public.invitation_allowances from public, anon, authenticated;
grant select on public.invitation_allowances to authenticated;
grant select, insert, update, delete on public.invitation_allowances to service_role;
create policy "Hosts read own invitation allowance" on public.invitation_allowances
  for select to authenticated using (user_id = (select auth.uid()));

-- Existing invitations remain editable, including accounts already above the allowance.
insert into public.invitation_allowances (user_id, invitations_used)
select owner_id, count(*)::integer from public.events group by owner_id;

-- Only this trigger can spend a free slot. No client-writable metadata is trusted.
create function invitly_private.consume_free_invitation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := (select auth.uid());
  used integer;
begin
  if caller_id is not null and caller_id <> new.owner_id then
    raise insufficient_privilege using message = 'You may only create your own invitations.';
  end if;
  insert into public.invitation_allowances as allowance (user_id, invitations_used)
    values (new.owner_id, 1)
    on conflict (user_id) do update
      set invitations_used = allowance.invitations_used + 1
      where allowance.invitations_used < 2
    returning invitations_used into used;
  if used is null then
    raise exception using errcode = 'P0001', message = 'FREE_INVITATION_LIMIT_REACHED';
  end if;
  return new;
end;
$$;
revoke all on function invitly_private.consume_free_invitation() from public, anon, authenticated;

-- AFTER INSERT only charges actual new rows, never edits or ON CONFLICT updates.
-- Concurrent inserts serialize on the account's allowance row. Failed saves roll back.
-- Deleting or unpublishing an invitation does not refund a lifetime free slot.
create trigger enforce_free_invitation_allowance after insert on public.events
  for each row execute function invitly_private.consume_free_invitation();

commit;
