-- Monies: core tables with Row Level Security (RLS).
--
-- HOW TO RUN: Supabase dashboard > SQL Editor > New query > paste this whole file > Run.
-- It is safe to run again: it drops and recreates only the policies and triggers, never your data.
--
-- THE SECURITY IDEA (plain English):
--   Every row has a user_id. A policy on every table says "you may only touch rows where
--   user_id is YOUR login". The database enforces this, not the website, so even someone who
--   edits the app's code in their browser cannot read or change another person's rows.
--   The "anon" role (not logged in) gets no access to these tables at all.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh on every change
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- user_settings: one row per person for the "single object" parts of the app
-- (profile, income, monthly spending, retirement inputs, predictor, lifestyle)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  profile    jsonb not null default '{}'::jsonb,
  income     jsonb not null default '{}'::jsonb,
  expenses   jsonb not null default '{}'::jsonb,
  retirement jsonb not null default '{}'::jsonb,
  predictor  jsonb not null default '{}'::jsonb,
  lifestyle  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_objects check (
    jsonb_typeof(profile) = 'object' and jsonb_typeof(income) = 'object'
    and jsonb_typeof(expenses) = 'object' and jsonb_typeof(retirement) = 'object'
    and jsonb_typeof(predictor) = 'object' and jsonb_typeof(lifestyle) = 'object'
  ),
  constraint user_settings_size check (
    pg_column_size(profile) + pg_column_size(income) + pg_column_size(expenses)
    + pg_column_size(retirement) + pg_column_size(predictor) + pg_column_size(lifestyle) < 100000
  )
);

-- ---------------------------------------------------------------------------
-- assets: accounts and holdings (cash, investments, retirement, property, crypto, other)
-- ---------------------------------------------------------------------------
create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  type        text not null default 'cash' check (type in ('cash', 'investment', 'retirement', 'property', 'crypto', 'other')),
  value       numeric(16, 2) not null default 0 check (value >= 0 and value < 1000000000000),
  institution text not null default '' check (char_length(institution) <= 120),
  notes       text not null default '' check (char_length(notes) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- liabilities: credit cards, loans, and (at most one) mortgage
-- ---------------------------------------------------------------------------
create table if not exists public.liabilities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind           text not null check (kind in ('credit_card', 'loan', 'mortgage')),
  name           text not null check (char_length(btrim(name)) between 1 and 120),
  balance        numeric(16, 2) not null default 0 check (balance >= 0 and balance < 1000000000000),
  rate           numeric(7, 3) not null default 0 check (rate >= 0 and rate <= 100),
  min_payment    numeric(16, 2) not null default 0 check (min_payment >= 0 and min_payment < 1000000000000),
  credit_limit   numeric(16, 2) not null default 0 check (credit_limit >= 0 and credit_limit < 1000000000000),
  tenure_months  integer not null default 0 check (tenure_months between 0 and 1200),
  property_value numeric(16, 2) not null default 0 check (property_value >= 0 and property_value < 1000000000000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists liabilities_one_mortgage_per_user
  on public.liabilities (user_id) where kind = 'mortgage';

-- ---------------------------------------------------------------------------
-- goals: the roadmap milestones
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label          text not null check (char_length(btrim(label)) between 1 and 120),
  category       text not null default 'savings' check (char_length(category) between 1 and 40),
  target_age     integer not null default 30 check (target_age between 0 and 120),
  target_amount  numeric(16, 2) not null default 0 check (target_amount >= 0 and target_amount < 1000000000000),
  current_amount numeric(16, 2) not null default 0 check (current_amount >= 0 and current_amount < 1000000000000),
  done           boolean not null default false,
  color          text not null default '#4a7c52' check (color ~ '^#[0-9a-fA-F]{6}$'),
  note           text not null default '' check (char_length(note) <= 1000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- scenarios: "what if" life events (buy a house, start a business, ...)
-- ---------------------------------------------------------------------------
create table if not exists public.scenarios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 120),
  icon          text not null default '' check (char_length(icon) <= 16),
  enabled       boolean not null default false,
  category      text not null default 'other' check (char_length(category) between 1 and 40),
  cost          numeric(16, 2) not null default 0 check (cost >= 0 and cost < 1000000000000),
  down_payment  numeric(16, 2) not null default 0 check (down_payment >= 0 and down_payment < 1000000000000),
  loan_amount   numeric(16, 2) not null default 0 check (loan_amount >= 0 and loan_amount < 1000000000000),
  loan_rate     numeric(7, 3) not null default 0 check (loan_rate >= 0 and loan_rate <= 100),
  loan_tenure   integer not null default 0 check (loan_tenure between 0 and 1200),
  monthly_extra numeric(16, 2) not null default 0 check (abs(monthly_extra) < 1000000000000),
  prep_years    numeric(5, 1) not null default 0 check (prep_years between 0 and 100),
  risk          text not null default 'medium' check (risk in ('low', 'medium', 'high')),
  note          text not null default '' check (char_length(note) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes: every query filters by user_id
create index if not exists assets_user_idx      on public.assets (user_id);
create index if not exists liabilities_user_idx on public.liabilities (user_id);
create index if not exists goals_user_idx       on public.goals (user_id);
create index if not exists scenarios_user_idx   on public.scenarios (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers, RLS, policies and permissions (same pattern for every table)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['user_settings', 'assets', 'liabilities', 'goals', 'scenarios']
  loop
    -- keep updated_at fresh
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);

    -- turn Row Level Security on (and make it apply to the table owner too)
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);

    -- the one rule: you only ever touch your own rows
    execute format('drop policy if exists "own rows only" on public.%I', t);
    execute format(
      'create policy "own rows only" on public.%I for all to authenticated '
      'using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);

    -- logged-out visitors get nothing; logged-in users get normal row access (still filtered by the policy)
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from public', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;
