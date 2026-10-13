\set ON_ERROR_STOP on
set client_min_messages = notice;
set role authenticated; select set_config('request.jwt.claim.sub','bbbbbbbb-0000-0000-0000-000000000002',false);
delete from user_settings;
-- how the app saves one settings column at a time (user_id omitted on purpose)
insert into user_settings(profile) values ('{"age":30}') on conflict (user_id) do update set profile=excluded.profile;
insert into user_settings(expenses) values ('{"housing":900}') on conflict (user_id) do update set expenses=excluded.expenses;
insert into user_settings(profile) values ('{"age":31}') on conflict (user_id) do update set profile=excluded.profile;
select t.check('upsert without user_id: one row, columns saved independently', (select count(*) from user_settings)=1 and (select profile->>'age'='31' and expenses->>'housing'='900' from user_settings));
-- list upsert by id, twice (insert then update)
insert into assets(id,name,value) values ('11111111-1111-1111-1111-111111111111','Fund',1) on conflict (id) do update set name=excluded.name, value=excluded.value;
insert into assets(id,name,value) values ('11111111-1111-1111-1111-111111111111','Fund renamed',2) on conflict (id) do update set name=excluded.name, value=excluded.value;
select t.check('asset upsert by id updates in place', (select count(*) from assets where id='11111111-1111-1111-1111-111111111111')=1 and (select name='Fund renamed' and value=2 from assets where id='11111111-1111-1111-1111-111111111111'));
