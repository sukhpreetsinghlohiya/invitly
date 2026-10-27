begin;

-- One plan row per account. Only service_role (via verified webhooks and the
-- /api/billing/verify endpoint using the service key) can write.
create table public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'inactive' check (status in ('inactive','active','expired','refunded')),
  activated_at timestamptz,
  expires_at timestamptz,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_paise bigint check (amount_paise is null or amount_paise >= 0),
  currency text default 'INR',
  updated_at timestamptz not null default now()
);
alter table public.user_plans enable row level security;
revoke all on public.user_plans from public, anon, authenticated;
grant select on public.user_plans to authenticated;
grant select, insert, update, delete on public.user_plans to service_role;
create policy "Hosts read own plan" on public.user_plans
  for select to authenticated using (user_id = (select auth.uid()));

create index user_plans_status_idx on public.user_plans (status) where status = 'active';

-- Idempotent log of Razorpay events. Webhook handler inserts a row keyed by
-- razorpay event id and skips re-processing on conflict.
create table public.billing_events (
  event_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
alter table public.billing_events enable row level security;
revoke all on public.billing_events from public, anon, authenticated;
grant select, insert, update, delete on public.billing_events to service_role;

-- Replace the free-invitation trigger with a plan-aware version. Pro accounts
-- with an active plan skip the 2-invitation cap. Free accounts behave as before.
create or replace function invitly_private.consume_free_invitation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := (select auth.uid());
  used integer;
  plan_row public.user_plans%rowtype;
  is_unlimited boolean := false;
begin
  if caller_id is not null and caller_id <> new.owner_id then
    raise insufficient_privilege using message = 'You may only create your own invitations.';
  end if;

  select * into plan_row from public.user_plans where user_id = new.owner_id;
  if plan_row.plan = 'pro'
     and plan_row.status = 'active'
     and (plan_row.expires_at is null or plan_row.expires_at > now()) then
    is_unlimited := true;
  end if;

  if is_unlimited then
    insert into public.invitation_allowances as allowance (user_id, invitations_used)
      values (new.owner_id, 1)
      on conflict (user_id) do update
        set invitations_used = allowance.invitations_used + 1;
    return new;
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

commit;
