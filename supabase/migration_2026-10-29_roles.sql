-- Этап 5: роль «админ», должности, предустановки по списку, настройки приложения, выбор пушей.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in('employee','lead','manager','admin'));
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists push_prefs jsonb not null default '{}'::jsonb;
alter table public.roster alter column team drop not null;
alter table public.roster add column if not exists pre_role text;
alter table public.roster add column if not exists pre_position text;

-- админ тоже считается руководителем во всех политиках
create or replace function public.is_manager() returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from profiles where id=auth.uid() and role in('manager','admin')) $$;
create or replace function public.is_admin() returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;

-- роли руководителей меняет только админ (из SQL-редактора без пользователя — можно)
create or replace function public.trg_profile_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and coalesce(current_setting('dw.role_ok',true),'')<>'1' then
    if (old.role in('manager','admin') or new.role in('manager','admin')) and not is_admin() then
      raise exception 'Роли руководителей назначает и снимает только админ';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profile_guard on public.profiles;
create trigger profile_guard before update on public.profiles for each row execute function public.trg_profile_guard();

-- удалять из приложения может только админ; руководители правят профили
drop policy if exists "profiles manager write" on public.profiles;
drop policy if exists "profiles mgr ins" on public.profiles; drop policy if exists "profiles mgr upd" on public.profiles; drop policy if exists "profiles admin del" on public.profiles;
create policy "profiles mgr ins" on public.profiles for insert to authenticated with check(is_manager());
create policy "profiles mgr upd" on public.profiles for update to authenticated using(is_manager()) with check(is_manager());
create policy "profiles admin del" on public.profiles for delete to authenticated using(is_admin());

-- «удалить» сотрудника = убрать из приложения (история графика и журналов сохраняется)
create or replace function public.remove_member(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_admin() then raise exception 'Только админ может убрать сотрудника'; end if;
  if p_id=auth.uid() then raise exception 'Себя убрать нельзя'; end if;
  perform set_config('dw.role_ok','1',true);
  update profiles set status='rejected', role='employee' where id=p_id;
  delete from push_subs where user_id=p_id;
  update roster set profile_id=null where profile_id=p_id;
end $$;

-- одобрение: привязка к списку + должность и (если одобряет админ) роль из списка
create or replace function public.approve_member(p_id uuid, p_roster bigint default null) returns text language plpgsql security definer set search_path=public as $$
declare n int; t text; pr text; pp text;
begin
  if not is_manager() then raise exception 'only manager'; end if;
  select tab_no into t from profiles where id=p_id;
  if t is null or t='' then
    select coalesce(max(tab_no::int) filter (where tab_no ~ '^\d+$' and tab_no::int<>67),0)+1 into n from profiles;
    if n=67 then n:=68; end if;
    t:=n::text;
  end if;
  update profiles set status='approved', tab_no=t where id=p_id;
  if p_roster is not null then
    update roster set profile_id=null where profile_id=p_id;
    update roster set profile_id=p_id where id=p_roster;
    update profiles set team=(select team from roster where id=p_roster) where id=p_id;
    select pre_role,pre_position into pr,pp from roster where id=p_roster;
    if pp is not null then update profiles set position=pp where id=p_id; end if;
    if pr is not null and is_admin() then
      perform set_config('dw.role_ok','1',true);
      update profiles set role=pr where id=p_id;
    end if;
  end if;
  return t;
end $$;

-- настройки приложения (меняет только админ)
create table if not exists public.app_settings(key text primary key, value jsonb not null, updated_at timestamptz default now());
alter table public.app_settings enable row level security;
drop policy if exists "settings read" on public.app_settings; drop policy if exists "settings write" on public.app_settings;
create policy "settings read" on public.app_settings for select to authenticated using(is_approved());
create policy "settings write" on public.app_settings for all to authenticated using(is_admin()) with check(is_admin());
insert into public.app_settings(key,value) values('checkin_time','{"h":9,"m":30}') on conflict(key) do nothing;
create or replace function public.set_checkin_time(h int, m int) returns void language plpgsql security definer set search_path=public,cron as $$
begin
  if not is_admin() then raise exception 'Только админ меняет время отметки'; end if;
  if h<0 or h>23 or m<0 or m>59 then raise exception 'Неверное время'; end if;
  insert into app_settings(key,value) values('checkin_time',jsonb_build_object('h',h,'m',m)) on conflict(key) do update set value=excluded.value, updated_at=now();
  perform cron.schedule('dw-checkin', m||' '||((h-3+24)%24)||' * * *', 'select public.send_checkins()');
end $$;
select cron.schedule('dw-checkin','30 6 * * *','select public.send_checkins()');

-- какие пуши нужны человеку (колокольчик внутри приложения работает всегда)
create or replace function public.push_wanted(prefs jsonb, k text, ttl text) returns boolean language sql immutable as $$
  select case
    when k in('checkin','signup') then true
    when k='repair' and ttl like '🚨%' then true
    else coalesce((prefs->>(case when k in('request','repair','incident') then 'req' when k in('news','afisha') then 'news' when k='rotation' then 'rot' when k in('task','shift') then 'task' else 'other' end))::boolean,true) end $$;
create or replace function public.trg_push() returns trigger language plpgsql security definer set search_path=public as $$
declare c record; subs jsonb; chunk jsonb; i int; n int;
begin
  select * into c from push_cfg where id=1;
  if c.id is null or not c.enabled or c.endpoint is null then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth)),'[]'::jsonb) into subs
  from push_subs s join profiles p on p.id=s.user_id
  where p.status='approved' and push_wanted(p.push_prefs,new.kind,new.title) and (
    (new.to_user is not null and p.id=new.to_user)
    or (new.to_user is null and new.for_managers and (p.role in('manager','admin') or (p.role='lead' and new.for_team is not null and p.team=new.for_team)))
    or (new.to_user is null and not new.for_managers));
  n:=jsonb_array_length(subs);
  i:=0;
  while i<n loop
    select jsonb_agg(e) into chunk from (select e from jsonb_array_elements(subs) with ordinality t(e,o) where o>i and o<=i+40 order by o) q;
    perform net.http_post(url:=c.endpoint, body:=jsonb_build_object('pub',c.vapid_pub,'jwk',c.vapid_jwk,'subs',chunk,'msg',jsonb_build_object('title',new.title,'body',left(coalesce(new.body,''),180),'link',new.link,'tag','n'||new.id)), headers:='{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds:=8000);
    i:=i+40;
  end loop;
  return new;
exception when others then return new;
end $$;

-- мои настройки: выбор пушей
create or replace function public.set_my_push_prefs(p jsonb) returns void language plpgsql security definer set search_path=public as $$
begin update profiles set push_prefs=coalesce(p,'{}'::jsonb) where id=auth.uid(); end $$;

-- ===== данные =====
-- админ
update public.profiles set role='admin', position='Старший специалист' where lower(email)='gamossup@yandex.com';
-- руководители: роль и должность применятся при одобрении их регистрации (если выберешь строку списка)
insert into public.roster(full_name,team,pre_role,pre_position)
select x.n,null,'manager',x.p from (values ('Олексюк Игорь','Заместитель руководителя тематического парка'),('Прошутинская К.','Супервайзер')) x(n,p)
where not exists(select 1 from public.roster r where r.full_name=x.n);
update public.roster set pre_role='manager', pre_position='Супервайзер' where full_name='Ярошенко М.О';
update public.roster set pre_role='manager', pre_position='Старший специалист' where full_name='Лефенцова А.В';
-- график 5/2 (выходные сб и вс) у Олексюка: октябрь–декабрь 2026
insert into public.roster_marks(roster_id,day,kind,note)
select r.id,d::date,'off','выходной 5/2' from public.roster r, generate_series('2026-10-01'::date,'2026-12-31'::date,'1 day') d
where r.full_name='Олексюк Игорь' and extract(dow from d) in(0,6) on conflict do nothing;
-- график Прошутинской К. на октябрь (из листа «Октябрь 2026»; с 23-го в файле ещё не заполнено)
insert into public.roster_marks(roster_id,day,kind)
select r.id,make_date(2026,10,i),'off' from public.roster r, generate_series(1,22) i
where r.full_name='Прошутинская К.' and substr('o...oooo...oooo...oooo..',i,1)='o' on conflict do nothing;

-- регистрация: телефон из заявки попадает в профиль
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,full_name,email,status,phone) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),new.email),new.email,'pending',nullif(trim(coalesce(new.raw_user_meta_data->>'phone','')),''));
  return new;
end $$;

-- админ задаёт сотруднику новый пароль (письма на почту не отправляются)
create or replace function public.reset_member_password(p_id uuid, p text) returns void language plpgsql security definer set search_path=public,extensions,auth as $$
begin
  if not is_admin() then raise exception 'Только админ'; end if;
  if length(coalesce(p,''))<6 then raise exception 'Пароль не короче 6 знаков'; end if;
  update auth.users set encrypted_password=extensions.crypt(p, extensions.gen_salt('bf')), updated_at=now() where id=p_id;
end $$;
