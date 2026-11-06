-- Monies: a tiny "ping" function used by the daily keep-alive job.
--
-- WHY: Supabase's free plan pauses a project that has had no database activity for about a week.
-- A daily GitHub job calls this function, which makes the database do a real (harmless) request.
--
-- SAFE: it returns the word 'ok' and reads no tables, so it exposes none of your data.
-- HOW TO RUN: Supabase dashboard > SQL Editor > New query > paste this whole file > Run. Safe to run again.

create or replace function public.ping()
returns text
language sql
stable
security invoker
set search_path = ''
as $$ select 'ok'::text $$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
