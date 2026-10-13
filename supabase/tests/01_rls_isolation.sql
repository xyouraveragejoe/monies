\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = notice;
create schema if not exists t; grant usage on schema t to public;
create or replace function t.check(label text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if; end $$;
create or replace function t.expect_error(label text, stmt text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'PASS  % (blocked: %)', label, sqlerrm; return; end;
  raise exception 'FAIL  % (statement was allowed)', label;
end $$;

-- ===== as user A =====
set role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
insert into assets(name,type,value) values ('A cash','cash',100) returning id as a_asset \gset
insert into goals(label,target_amount) values ('A goal',500) returning id as a_goal \gset
insert into liabilities(kind,name,balance) values ('mortgage','A mortgage',900);
insert into user_settings(expenses) values ('{"housing":1200}');
select t.check('A: user_id is filled in automatically from the login', (select user_id from assets where id=:'a_asset')='aaaaaaaa-0000-0000-0000-000000000001');
select t.check('A: can read own asset', (select count(*) from assets)=1);
select pg_sleep(0.05);
update assets set value=150 where id=:'a_asset';
select t.check('A: can update own asset; updated_at moves forward', (select value=150 and updated_at>created_at from assets where id=:'a_asset'));
select t.check('A: settings partial insert uses defaults for other columns', (select profile='{}'::jsonb and expenses->>'housing'='1200' from user_settings));

-- ===== as user B =====
select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002',false);
select t.check('B: cannot see A assets',      (select count(*) from assets)=0);
select t.check('B: cannot see A goals',       (select count(*) from goals)=0);
select t.check('B: cannot see A liabilities', (select count(*) from liabilities)=0);
select t.check('B: cannot see A settings',    (select count(*) from user_settings)=0);
with u as (update assets set value=1 where id=:'a_asset' returning 1) select t.check('B: update of A asset changes 0 rows', (select count(*) from u)=0);
with d as (delete from goals where id=:'a_goal' returning 1) select t.check('B: delete of A goal removes 0 rows', (select count(*) from d)=0);
select t.expect_error('B: cannot insert a row claiming to belong to A', $q$insert into assets(user_id,name) values ('aaaaaaaa-0000-0000-0000-000000000001','forged')$q$);
select t.expect_error('B: cannot hijack A row through upsert', format($q$insert into assets(id,name) values (%L,'hijack') on conflict (id) do update set name=excluded.name$q$, :'a_asset'));
insert into assets(name,value) values ('B cash',7);
select t.expect_error('B: cannot move own row to A', $q$update assets set user_id='aaaaaaaa-0000-0000-0000-000000000001'$q$);
select t.check('B: sees only own row', (select count(*) from assets)=1 and (select name from assets)='B cash');

-- ===== constraints (as B) =====
select t.expect_error('negative asset value rejected',   $q$insert into assets(name,value) values ('x',-1)$q$);
select t.expect_error('blank asset name rejected',       $q$insert into assets(name) values ('   ')$q$);
select t.expect_error('unknown asset type rejected',     $q$insert into assets(name,type) values ('x','lottery')$q$);
select t.expect_error('absurd amount rejected',          $q$insert into assets(name,value) values ('x',1e13)$q$);
select t.expect_error('bad goal colour rejected',        $q$insert into goals(label,color) values ('x','red')$q$);
select t.expect_error('interest over 100% rejected',     $q$insert into liabilities(kind,name,rate) values ('loan','x',150)$q$);
insert into liabilities(kind,name) values ('mortgage','B mortgage');
select t.expect_error('second mortgage for same user rejected', $q$insert into liabilities(kind,name) values ('mortgage','again')$q$);
select t.expect_error('settings must be json objects',   $q$insert into user_settings(user_id,profile) values (auth.uid(),'[1]')$q$) ;

-- ===== logged out (anon) =====
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select t.expect_error('anon cannot read assets',        'select * from assets');
select t.expect_error('anon cannot read settings',      'select * from user_settings');
select t.expect_error('anon cannot insert',             $q$insert into assets(name) values ('x')$q$);

-- ===== A's data untouched; cascade on account deletion =====
reset role;
select t.check('A data untouched by B attempts', (select value from assets where id=:'a_asset')=150 and (select count(*) from goals where id=:'a_goal')=1 and (select name from assets where id=:'a_asset')='A cash');
delete from auth.users where id='aaaaaaaa-0000-0000-0000-000000000001';
select t.check('deleting an account removes all its rows', (select count(*) from assets where user_id='aaaaaaaa-0000-0000-0000-000000000001')=0 and (select count(*) from user_settings where user_id='aaaaaaaa-0000-0000-0000-000000000001')=0);
select t.check('B data survives A deletion', (select count(*) from assets)=1);
