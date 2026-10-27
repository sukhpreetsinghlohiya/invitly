begin;

-- Replace the plan-based billing (one commit prior) with a credits ledger.
-- The previous migration may or may not have been applied; the drops below are
-- idempotent so this file can run cleanly either way.
drop table if exists public.user_plans;

-- Credit balance per account. Writes are confined to the credit trigger below
-- (debits on insert) and server-side service role calls (credits on verify/webhook).
create table public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_purchased integer not null default 0 check (lifetime_purchased >= 0),
  updated_at timestamptz not null default now()
);
alter table public.user_credits enable row level security;
revoke all on public.user_credits from public, anon, authenticated;
grant select on public.user_credits to authenticated;
grant select, insert, update, delete on public.user_credits to service_role;
create policy "Hosts read own credits" on public.user_credits
  for select to authenticated using (user_id = (select auth.uid()));

-- Ledger of every credit change. Positive delta is a purchase or grant,
-- negative is a spend. razorpay_payment_id is unique so webhook replays are
-- idempotent (verify path writes first, webhook retries no-op on conflict).
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('signup_grant','purchase','invitation_spend','adjustment','refund')),
  razorpay_payment_id text unique,
  pack_id text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.credit_transactions enable row level security;
revoke all on public.credit_transactions from public, anon, authenticated;
grant select on public.credit_transactions to authenticated;
grant select, insert, update, delete on public.credit_transactions to service_role;
create policy "Hosts read own credit ledger" on public.credit_transactions
  for select to authenticated using (user_id = (select auth.uid()));

create index credit_transactions_user_idx on public.credit_transactions (user_id, created_at desc);

-- Backfill: give every existing account 200 credits minus 100 for each
-- invitation already saved. New signups get the same 200-credit grant via
-- a trigger on auth.users below.
insert into public.user_credits (user_id, balance, lifetime_purchased)
select u.id,
       greatest(0, 200 - 100 * coalesce(a.invitations_used, 0)),
       0
from auth.users u
left join public.invitation_allowances a on a.user_id = u.id
on conflict (user_id) do nothing;

insert into public.credit_transactions (user_id, delta, reason, note)
select user_id, 200, 'signup_grant', 'Backfilled free credits'
from public.user_credits
on conflict do nothing;

-- Grant 200 credits on new signup. Runs with definer rights so RLS doesn't block.
create or replace function invitly_private.grant_signup_credits() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_credits (user_id, balance, lifetime_purchased) values (new.id, 200, 0)
    on conflict (user_id) do nothing;
  insert into public.credit_transactions (user_id, delta, reason, note)
    values (new.id, 200, 'signup_grant', 'Welcome to Invitly')
    on conflict do nothing;
  return new;
end;
$$;
revoke all on function invitly_private.grant_signup_credits() from public, anon, authenticated;

drop trigger if exists grant_signup_credits_trigger on auth.users;
create trigger grant_signup_credits_trigger after insert on auth.users
  for each row execute function invitly_private.grant_signup_credits();

-- Replace the free-invitation trigger with a credit-debit trigger. Each saved
-- invitation deducts 100 credits atomically. If the balance would go negative
-- the insert is rejected and no credits move.
create or replace function invitly_private.consume_free_invitation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := (select auth.uid());
  remaining integer;
begin
  if caller_id is not null and caller_id <> new.owner_id then
    raise insufficient_privilege using message = 'You may only create your own invitations.';
  end if;

  insert into public.user_credits as c (user_id, balance, lifetime_purchased)
    values (new.owner_id, 0, 0)
    on conflict (user_id) do update set updated_at = now()
    returning c.balance into remaining;

  update public.user_credits set balance = balance - 100, updated_at = now()
    where user_id = new.owner_id and balance >= 100
    returning balance into remaining;

  if remaining is null then
    raise exception using errcode = 'P0001', message = 'FREE_INVITATION_LIMIT_REACHED';
  end if;

  insert into public.credit_transactions (user_id, delta, reason, note)
    values (new.owner_id, -100, 'invitation_spend', 'Invitation created');

  -- Keep the legacy allowance counter in sync for analytics.
  insert into public.invitation_allowances as allowance (user_id, invitations_used)
    values (new.owner_id, 1)
    on conflict (user_id) do update set invitations_used = allowance.invitations_used + 1;

  return new;
end;
$$;

commit;
