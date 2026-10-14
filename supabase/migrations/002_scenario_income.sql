-- Monies: lets a scenario change your income (for example starting a business without a loan).
--
-- HOW TO RUN: Supabase dashboard > SQL Editor > New query > paste this whole file > Run.
-- Run it BEFORE using the new Scenarios page. Safe to run again. It only adds three columns
-- and never touches existing rows (they get 0, meaning "no income change").

alter table public.scenarios
  add column if not exists income_change        numeric(16, 2) not null default 0,
  add column if not exists income_change_months integer       not null default 0,
  add column if not exists income_after         numeric(16, 2) not null default 0;

-- (drop first so the file can be run twice)
alter table public.scenarios drop constraint if exists scenarios_income_change_range;
alter table public.scenarios drop constraint if exists scenarios_income_months_range;
alter table public.scenarios drop constraint if exists scenarios_income_after_range;

alter table public.scenarios
  add constraint scenarios_income_change_range check (abs(income_change) < 1000000000000),
  add constraint scenarios_income_months_range check (income_change_months between 0 and 600),
  add constraint scenarios_income_after_range  check (abs(income_after) < 1000000000000);
