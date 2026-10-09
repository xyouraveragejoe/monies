-- =====================================================================
-- Monies: initial database schema
-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Safe to run again; it will not duplicate or delete your data.
--
-- The security idea: every row stores the id of the user who owns it
-- (user_id). Row Level Security (RLS) policies then say "you may only
-- see and change rows where user_id is YOU". The database enforces this
-- itself, so even a bug in the app cannot show someone else's data.
-- =====================================================================

begin;

-- Keeps updated_at current whenever a row changes.
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

-- ---------------------------------------------------------------------
-- 1. One settings row per user (profile, income, expenses, etc.).
--    Stored as JSON because these are single forms, not lists.
-- ---------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  profile     jsonb not null default '{}'::jsonb,
  income      jsonb not null default '{}'::jsonb,
  expenses    jsonb not null default '{}'::jsonb,
  retirement  jsonb not null default '{}'::jsonb,
  predictor   jsonb not null default '{}'::jsonb,
  lifestyle   jsonb not null default '{}'::jsonb,
  vision      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint settings_are_objects check (
    jsonb_typeof(profile) = 'object' and jsonb_typeof(income) = 'object' and
    jsonb_typeof(expenses) = 'object' and jsonb_typeof(retirement) = 'object' and
    jsonb_typeof(predictor) = 'object' and jsonb_typeof(lifestyle) = 'object' and
    jsonb_typeof(vision) = 'object'
  ),
  constraint settings_are_small check (
    pg_column_size(profile) < 20000 and pg_column_size(income) < 20000 and
    pg_column_size(expenses) < 20000 and pg_column_size(retirement) < 20000 and
    pg_column_size(predictor) < 20000 and pg_column_size(lifestyle) < 20000 and
    pg_column_size(vision) < 20000
  )
);

-- ---------------------------------------------------------------------
-- 2. Assets: bank accounts, investments, property, crypto, etc.
-- ---------------------------------------------------------------------
create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  type        text not null default 'cash'
              check (type in ('cash', 'investment', 'retirement', 'property', 'crypto', 'other')),
  value       numeric(16, 2) not null default 0 check (value >= 0),
  institution text not null default '' check (char_length(institution) <= 120),
  notes       text not null default '' check (char_length(notes) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Liabilities: credit cards, loans and the mortgage.
-- ---------------------------------------------------------------------
create table if not exists public.liabilities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind           text not null check (kind in ('credit_card', 'loan', 'mortgage')),
  name           text not null check (char_length(btrim(name)) between 1 and 120),
  balance        numeric(16, 2) not null default 0 check (balance >= 0),
  rate           numeric(7, 3) not null default 0 check (rate between 0 and 100),
  min_payment    numeric(16, 2) not null default 0 check (min_payment >= 0),
  credit_limit   numeric(16, 2) check (credit_limit is null or credit_limit >= 0),
  tenure_months  integer check (tenure_months is null or tenure_months between 0 and 600),
  property_value numeric(16, 2) check (property_value is null or property_value >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- A person has at most one mortgage row (matches the app's single mortgage form).
create unique index if not exists one_mortgage_per_user
  on public.liabilities (user_id) where kind = 'mortgage';

-- ---------------------------------------------------------------------
-- 4. Goals (the roadmap).
-- ---------------------------------------------------------------------
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label          text not null check (char_length(btrim(label)) between 1 and 120),
  category       text not null default 'savings'
                 check (category in ('savings', 'property', 'retirement', 'business', 'travel', 'education', 'other')),
  target_age     integer not null default 40 check (target_age between 0 and 120),
  target_amount  numeric(16, 2) not null default 0 check (target_amount >= 0),
  current_amount numeric(16, 2) not null default 0 check (current_amount >= 0),
  done           boolean not null default false,
  color          text not null default '#4a7c52' check (color ~ '^#[0-9a-fA-F]{6}$'),
  note           text not null default '' check (char_length(note) <= 500),
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- lets other tables point at a goal AND prove it belongs to the same user
  unique (id, user_id)
);

-- ---------------------------------------------------------------------
-- 5. Life scenarios (buy a house, start a business, ...).
-- ---------------------------------------------------------------------
create table if not exists public.scenarios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 120),
  icon          text not null default '' check (char_length(icon) <= 16),
  enabled       boolean not null default false,
  category      text not null default 'other' check (char_length(category) <= 40),
  cost          numeric(16, 2) not null default 0 check (cost >= 0),
  down_payment  numeric(16, 2) not null default 0 check (down_payment >= 0),
  loan_amount   numeric(16, 2) not null default 0 check (loan_amount >= 0),
  loan_rate     numeric(7, 3) not null default 0 check (loan_rate between 0 and 100),
  loan_tenure   integer not null default 0 check (loan_tenure between 0 and 600),
  monthly_extra numeric(16, 2) not null default 0,  -- may be negative (income lost)
  prep_years    numeric(5, 1) not null default 1 check (prep_years between 0 and 60),
  risk          text not null default 'medium' check (risk in ('low', 'medium', 'high')),
  note          text not null default '' check (char_length(note) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Vision board: pictures, notes and quotes about the life you want.
--    A picture can be linked to a goal and given a monthly cost.
-- ---------------------------------------------------------------------
create table if not exists public.vision_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null default 'image' check (kind in ('image', 'note', 'quote')),
  image_path   text,
  caption      text not null default '' check (char_length(caption) <= 300),
  body         text not null default '' check (char_length(body) <= 2000),
  goal_id      uuid,
  monthly_cost numeric(16, 2) not null default 0 check (monthly_cost >= 0),
  pos_x        numeric(8, 3) not null default 0,
  pos_y        numeric(8, 3) not null default 0,
  width        numeric(6, 2) not null default 28 check (width between 5 and 100),
  z_index      integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- an image row must have a file, and the file must sit in the owner's own folder
  constraint image_has_file check (kind <> 'image' or image_path is not null),
  constraint image_in_own_folder check (image_path is null or image_path like user_id::text || '/%'),
  -- the linked goal must belong to the same user; deleting the goal just unlinks it
  constraint vision_goal_same_user foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete set null (goal_id)
);

create index if not exists assets_user_idx       on public.assets (user_id);
create index if not exists liabilities_user_idx  on public.liabilities (user_id);
create index if not exists goals_user_idx        on public.goals (user_id);
create index if not exists scenarios_user_idx    on public.scenarios (user_id);
create index if not exists vision_items_user_idx on public.vision_items (user_id);

-- ---------------------------------------------------------------------
-- Security: turn on RLS and allow each signed-in user their own rows only.
-- Visitors who are not signed in (the "anon" role) get no access at all.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['user_settings', 'assets', 'liabilities', 'goals', 'scenarios', 'vision_items']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || '_delete_own', t);

    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- Private photo storage for the vision board.
-- Files live at  vision/<your user id>/<file>  and only you can touch them.
-- Max 5 MB each; JPEG, PNG or WebP only.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vision', 'vision', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists vision_files_select_own on storage.objects;
drop policy if exists vision_files_insert_own on storage.objects;
drop policy if exists vision_files_update_own on storage.objects;
drop policy if exists vision_files_delete_own on storage.objects;

create policy vision_files_select_own on storage.objects for select to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vision_files_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vision_files_update_own on storage.objects for update to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vision_files_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
