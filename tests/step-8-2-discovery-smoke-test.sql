-- Vibelancers Step 8.2: Freelancer discovery smoke test
-- SAFETY: All fixtures use reserved .invalid emails and TEST DEMO labels.
-- Run only against a development/test database. This script wraps every
-- fixture in a transaction and rolls it back at the end; no test users remain.
-- Expected results: default=2, online=1, available-now=1, Negombo=1,
-- min-price >= 3000=1, restricted listing search=0.

begin;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('f1000000-0000-4000-8000-000000000001','authenticated','authenticated','step82-design@example.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
('f1000000-0000-4000-8000-000000000002','authenticated','authenticated','step82-tutor@example.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
('f1000000-0000-4000-8000-000000000003','authenticated','authenticated','step82-restricted@example.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now());

insert into public.profiles (id, display_name, bio, location)
values
('f1000000-0000-4000-8000-000000000001','TEST DEMO — Design Studio','Temporary discovery fixture; not a real freelancer.','Jaffna'),
('f1000000-0000-4000-8000-000000000002','TEST DEMO — Maths Tutor','Temporary discovery fixture; not a real freelancer.','Negombo'),
('f1000000-0000-4000-8000-000000000003','TEST DEMO — Restricted Account','Temporary discovery fixture; should never appear.','Jaffna');

insert into public.profile_roles (user_id, role)
values
('f1000000-0000-4000-8000-000000000001','freelancer'),
('f1000000-0000-4000-8000-000000000002','freelancer'),
('f1000000-0000-4000-8000-000000000003','freelancer');

insert into public.service_listings (freelancer_id,title,description,category,service_scope,fulfilment_type,price_type,pricing_mode,freelancer_price,currency,service_area,status)
values
('f1000000-0000-4000-8000-000000000001','TEST DEMO — Logo Design','Temporary demo listing for checking search and filters.','Design','online','completion_deadline','fixed','freelancer_set',5000,'LKR',null,'active'),
('f1000000-0000-4000-8000-000000000002','TEST DEMO — Maths Tutoring','Temporary demo listing for checking local service and price filters.','Education','local','appointment','hourly','freelancer_set',2500,'LKR','Negombo','active'),
('f1000000-0000-4000-8000-000000000003','TEST DEMO — Hidden Service','Temporary demo listing for restriction-filter test.','Design','online','completion_deadline','fixed','freelancer_set',1000,'LKR',null,'active');

insert into public.freelancer_presence (freelancer_id,is_available,last_seen_at,updated_at)
values
('f1000000-0000-4000-8000-000000000001',true,now(),now()),
('f1000000-0000-4000-8000-000000000002',false,now(),now()),
('f1000000-0000-4000-8000-000000000003',true,now(),now());

insert into public.account_safety_status (user_id,status,public_reason)
values ('f1000000-0000-4000-8000-000000000003','restricted','Temporary fixture for discovery security test.');

do $test$
declare
  n integer;
begin
  select count(*) into n from public.search_service_listings(p_limit=>50);
  if n <> 2 then raise exception 'Default search expected 2 visible listings; got %', n; end if;

  select count(*) into n from public.search_service_listings(p_service_scope=>'online',p_limit=>50);
  if n <> 1 then raise exception 'Online filter expected 1; got %', n; end if;

  select count(*) into n from public.search_service_listings(p_available_now=>true,p_limit=>50);
  if n <> 1 then raise exception 'Available-now filter expected 1; got %', n; end if;

  select count(*) into n from public.search_service_listings(p_service_area=>'Negombo',p_limit=>50);
  if n <> 1 then raise exception 'Area filter expected 1; got %', n; end if;

  select count(*) into n from public.search_service_listings(p_min_price=>3000,p_limit=>50);
  if n <> 1 then raise exception 'Minimum-price filter expected 1; got %', n; end if;

  select count(*) into n from public.search_service_listings(p_search=>'Hidden Service',p_limit=>50);
  if n <> 0 then raise exception 'Restricted listing must not be visible'; end if;
end
$test$;

select 'default search; expected 2' as test, count(*) as actual
from public.search_service_listings(p_limit=>50)
union all
select 'online filter; expected 1', count(*)
from public.search_service_listings(p_service_scope=>'online',p_limit=>50)
union all
select 'available-now filter; expected 1', count(*)
from public.search_service_listings(p_available_now=>true,p_limit=>50)
union all
select 'area filter; expected 1', count(*)
from public.search_service_listings(p_service_area=>'Negombo',p_limit=>50)
union all
select 'minimum-price filter; expected 1', count(*)
from public.search_service_listings(p_min_price=>3000,p_limit=>50)
union all
select 'restricted listing hidden; expected 0', count(*)
from public.search_service_listings(p_search=>'Hidden Service',p_limit=>50);

rollback;
