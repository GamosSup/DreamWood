-- Геймификация: опыт (XP), уровни, достижения, косметика профиля
-- Запускать в Supabase → SQL Editor (один раз). Безопасно повторять.
-- Опыт НЕ хранится: он считается из реальных данных (xp_of), поэтому старые записи засчитываются сами,
-- снятая отметка чек-листа и удалённая доработка убирают свои очки, накрутить повторным нажатием нельзя.

-- ============ 1. Профиль: косметика и подпись вместо уровня ============
alter table public.profiles add column if not exists cos jsonb not null default '{}'::jsonb;   -- выбранная косметика {frame,name,bg,badge,title}
alter table public.profiles add column if not exists lvl_text text;                              -- подпись вместо числа уровня (ставит только админ)

-- ============ 2. Выданные достижения ============
create table if not exists public.user_ach(
  user_id uuid not null references public.profiles on delete cascade,
  code text not null,
  label text,                 -- название для выдаваемых вручную (допуски, обучения, события)
  bonus int not null default 0 check(bonus between 0 and 1000),
  at timestamptz not null default now(),
  by uuid references public.profiles on delete set null,
  primary key(user_id,code));
create index if not exists user_ach_code_idx on public.user_ach(code);
alter table public.user_ach enable row level security;
drop policy if exists "ach read" on public.user_ach;
create policy "ach read" on public.user_ach for select to authenticated using(is_approved());
-- писать напрямую нельзя: только через функции ниже

-- ============ 3. Опыт: ставки ============
-- отметка чек-листа смены ............. 5
-- подтверждённый выход на смену ....... 10
-- доработка / переработка ............. 10 / 5 за полчаса, всего не больше 100 в неделю
-- привычка выполнена .................. 2 (не больше 10 в день)
-- «спасибо» отправлено / получено ..... 3 (до 9 в день) / 10 (до 30 в день)
-- пункт «Первой недели» выполнен ...... 5
-- бонус за каждое достижение .......... из таблицы в ach_sync (или указал руководитель)
create or replace function public.xp_of(u uuid) returns integer language sql stable security definer set search_path=public as $$
  select (
    coalesce((select count(*) from shift_checks where user_id=u),0)*5
  + coalesce((select count(*) from checkins where user_id=u),0)*10
  + coalesce((select floor(sum(w)) from (select least(100, sum(hours*2*case when kind='p' then 5 else 10 end)) w from overtime where user_id=u group by date_trunc('week',day)) q),0)
  + coalesce((select sum(least(10,c*2)) from (select count(*) c from habit_logs where user_id=u group by day) q),0)
  + coalesce((select sum(least(9,c*3)) from (select count(*) c from thanks where from_user=u group by created_at::date) q),0)
  + coalesce((select sum(least(30,c*10)) from (select count(*) c from thanks where to_user=u group by created_at::date) q),0)
  + coalesce((select count(*) from onb_items where user_id=u and done),0)*5
  + coalesce((select sum(bonus) from user_ach where user_id=u),0)
  )::int $$;
revoke all on function public.xp_of(uuid) from public;

-- ============ 4. Все игровые данные одним запросом (для шапки, ротации, контактов, профиля) ============
create or replace function public.game_all() returns table(id uuid, full_name text, rot_name text, avatar_url text, xp int, lvl_text text, cos jsonb, ach jsonb)
language sql stable security definer set search_path=public as $$
  select p.id, p.full_name, r.rot_name, p.avatar_url, xp_of(p.id), p.lvl_text, p.cos,
    coalesce((select jsonb_agg(jsonb_build_object('c',a.code,'l',a.label,'t',a.at) order by a.at) from user_ach a where a.user_id=p.id),'[]'::jsonb)
  from profiles p left join roster r on r.profile_id=p.id
  where p.status='approved' and is_approved() $$;
grant execute on function public.game_all() to authenticated;

-- ============ 5. Автоматические достижения ============
-- счётчики, по которым выдаются достижения (и рисуются полоски «37 из 100» в приложении)
create or replace function public.ach_metrics(u uuid) returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'chk',(select count(*) from shift_checks where user_id=u),
    'days',(select count(*) from checkins where user_id=u),
    'hab',(select count(*) from habit_logs where user_id=u),
    'hstreak',(select coalesce(max(n),0) from (select count(*) n from (select d, d-(row_number() over(order by d))::int g from (select distinct day d from habit_logs where user_id=u) a) b group by g) c),
    'todo',(select count(*) from todos where user_id=u and done),
    'tsent',(select count(*) from thanks where from_user=u),
    'tgot',(select count(*) from thanks where to_user=u),
    'otn',(select count(*) from overtime where user_id=u and kind<>'p'),
    'oth',(select coalesce(sum(hours),0) from overtime where user_id=u),
    'week',(select case when count(*)>=5 and count(*) filter(where not done)=0 then 1 else 0 end from onb_items where user_id=u),
    'ment',(select count(*) from profiles p where p.mentor_id=u and exists(select 1 from onb_items o where o.user_id=p.id) and not exists(select 1 from onb_items o where o.user_id=p.id and not o.done))
  ) $$;
revoke all on function public.ach_metrics(uuid) from public;

create or replace function public.ach_stats() returns jsonb language sql stable security definer set search_path=public as $$
  select case when is_approved() then ach_metrics(auth.uid()) else '{}'::jsonb end $$;
grant execute on function public.ach_stats() to authenticated;

create or replace function public.ach_sync() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); m jsonb; r record; res jsonb:='[]'::jsonb;
begin
  if u is null or not is_approved() then return res; end if;
  m:=ach_metrics(u);
  for r in select v.code, v.bonus from (values
    ('chk1',20,'chk',1),('chk100',60,'chk',100),('chk500',150,'chk',500),('chk1000',300,'chk',1000),('chk3000',600,'chk',3000),
    ('day1',20,'days',1),('day20',60,'days',20),('day100',150,'days',100),('day300',400,'days',300),
    ('hab1',15,'hab',1),('hab7',50,'hstreak',7),('hab30',150,'hstreak',30),('hab100',500,'hstreak',100),
    ('todo25',40,'todo',25),('todo250',200,'todo',250),
    ('thx1',15,'tsent',1),('thx10',50,'tsent',10),('got10',100,'tgot',10),('got50',300,'tgot',50),
    ('week1',60,'week',1),('ment1',120,'ment',1),
    ('ot1',20,'otn',1),('ot10',60,'oth',10),('ot40',150,'oth',40),('ot100',400,'oth',100)
  ) v(code,bonus,k,goal) where coalesce((m->>v.k)::numeric,0)>=v.goal loop
    insert into user_ach(user_id,code,bonus) values(u,r.code,r.bonus) on conflict do nothing;
    if found then res:=res||jsonb_build_array(jsonb_build_object('c',r.code,'b',r.bonus)); end if;
  end loop;
  return res;
end $$;
grant execute on function public.ach_sync() to authenticated;

-- ============ 6. Секреты и забавы, которые подтверждает сам телефон ============
create or replace function public.ach_claim(p_code text) returns boolean language plpgsql security definer set search_path=public as $$
declare b int;
begin
  if not is_approved() then return false; end if;
  b:=case p_code when 'egg' then 25 when 'dark' then 10 else null end;
  if b is null then raise exception 'неизвестное достижение'; end if;
  insert into user_ach(user_id,code,bonus) values(auth.uid(),p_code,b) on conflict do nothing;
  return found;
end $$;
grant execute on function public.ach_claim(text) to authenticated;

-- ============ 7. Выдача руководителем: допуски, обучения, события, особые ============
create or replace function public.ach_grant(p_user uuid, p_code text, p_label text default null, p_bonus int default 100) returns void language plpgsql security definer set search_path=public as $$
declare ttl text;
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  if p_code !~ '^(adm|trn|evt|spec):[a-z0-9_а-яё-]{1,60}$' then raise exception 'Неверный код достижения'; end if;
  if p_code like 'spec:%' and not exists(select 1 from profiles where id=auth.uid() and role='admin') then raise exception 'Особые значки выдаёт только админ'; end if;
  insert into user_ach(user_id,code,label,bonus,by) values(p_user,p_code,left(coalesce(p_label,p_code),80),greatest(0,least(coalesce(p_bonus,0),500)),auth.uid())
    on conflict(user_id,code) do update set label=excluded.label, by=excluded.by;
  ttl:=left(coalesce(p_label,p_code),80);
  insert into notifications(kind,title,body,link,to_user) values('ach','🏅 Тебе выдали значок',ttl,'game',p_user);
end $$;
grant execute on function public.ach_grant(uuid,text,text,int) to authenticated;

create or replace function public.ach_revoke(p_user uuid, p_code text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  delete from user_ach where user_id=p_user and code=p_code;
end $$;
grant execute on function public.ach_revoke(uuid,text) to authenticated;

-- ============ 8. Свой образ: выбор косметики ============
create or replace function public.set_my_cos(p jsonb) returns void language plpgsql security definer set search_path=public as $$
declare k text; clean jsonb:='{}'::jsonb;
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  for k in select jsonb_object_keys(coalesce(p,'{}'::jsonb)) loop
    if k in('frame','name','bg','badge','title') and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 80 then
      clean:=clean||jsonb_build_object(k,p->>k);
    end if;
  end loop;
  update profiles set cos=clean where id=auth.uid();
end $$;
grant execute on function public.set_my_cos(jsonb) to authenticated;

-- подпись вместо числа уровня: только админ
create or replace function public.set_lvl_text(p_user uuid, p_text text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from profiles where id=auth.uid() and role='admin') then raise exception 'Только админ'; end if;
  update profiles set lvl_text=nullif(left(trim(coalesce(p_text,'')),24),'') where id=p_user;
end $$;
grant execute on function public.set_lvl_text(uuid,text) to authenticated;

-- ============ 9. Личное: Игорян — уровень «Невозможный» и «Админ на сервере» ============
do $$ declare u uuid; begin
  select id into u from auth.users where lower(email)='goga.sabaka@gmail.com' limit 1;
  if u is not null and exists(select 1 from profiles where id=u) then
    update profiles set lvl_text='Невозможный' where id=u;
    insert into user_ach(user_id,code,label,bonus) values(u,'spec:admin_server','Админ на сервере',500) on conflict do nothing;
  end if;
end $$;

-- проверка
select p.full_name, p.role, p.lvl_text, xp_of(p.id) as xp,
  (select string_agg(a.code,', ') from user_ach a where a.user_id=p.id) as ach
from profiles p
where p.id in(select id from auth.users where lower(email)='goga.sabaka@gmail.com')
   or p.id in(select user_id from user_ach);
