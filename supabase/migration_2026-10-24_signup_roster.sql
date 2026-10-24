-- Миграция 2026-10-24 (вечер): регистрация с одобрением, список сотрудников (roster), табельные номера,
-- уведомления для колокольчика. Выполнить целиком в Supabase → SQL Editor. Повторный запуск безопасен.

-- 1. Профили: статус заявки, почта, дата регистрации, привязка к строке из списка сотрудников
alter table public.profiles add column if not exists status text not null default 'approved';  -- уже существующие профили становятся одобренными
alter table public.profiles alter column status set default 'pending'; -- новые — ждут одобрения
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check(status in('pending','approved','rejected'));
update public.profiles p set email=u.email from auth.users u where u.id=p.id and p.email is null;
-- табельный номер руководителя
update public.profiles set tab_no='67' where id=(select id from auth.users where lower(email)='gamossup@yandex.com');

-- 2. Список сотрудников, к которым привязываются заявки
create table if not exists public.roster(
  id bigint generated always as identity primary key,
  full_name text not null unique,
  team text not null check(team in('R','K','M')),
  profile_id uuid unique references public.profiles on delete set null,
  created_at timestamptz default now());
alter table public.roster enable row level security;
drop policy if exists "roster manager" on public.roster;
create policy "roster manager" on public.roster for all to authenticated using(is_manager()) with check(is_manager());
insert into public.roster(full_name,team) values
 ('Адылов Володя','R'),('Бражко Лёша','R'),('Митясова Оля','R'),('Иванкина Лера','R'),('Старков Рома','R'),('Бражников Саша','R'),('Кочиева Майя','R'),
 ('Канахина','M'),('Эльвир А.','M'),('Зиньков В.','M'),('Смолянова А.','M'),('Волкова Саша','M'),('Кристина (Детский клуб)','M')
on conflict(full_name) do nothing;

-- 3. Функции
create or replace function public.is_approved() returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from profiles where id=auth.uid() and status='approved') $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,full_name,email,status) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),new.email),new.email,'pending');
  return new;
end $$;

-- одобрить заявку: присваивает табельный номер (по порядку с 1, номер 67 пропускается — он только у руководителя)
create or replace function public.approve_member(p_id uuid, p_roster bigint default null) returns text language plpgsql security definer set search_path=public as $$
declare n int; t text;
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
  end if;
  return t;
end $$;

create or replace function public.reject_member(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_manager() then raise exception 'only manager'; end if;
  update profiles set status='rejected' where id=p_id;
end $$;

-- 4. Уведомления (колокольчик)
create table if not exists public.notifications(
  id bigint generated always as identity primary key,
  kind text not null,            -- news | rotation | afisha | signup
  title text not null,
  body text,
  link text,                     -- rot:2026-10-25 | news | afisha | staff
  for_managers boolean not null default false,
  created_at timestamptz default now());
create table if not exists public.notif_reads(
  user_id uuid references public.profiles on delete cascade,
  notif_id bigint references public.notifications on delete cascade,
  read_at timestamptz default now(), primary key(user_id,notif_id));
alter table public.notifications enable row level security;
alter table public.notif_reads enable row level security;
drop policy if exists "notif read" on public.notifications;
drop policy if exists "notif manager write" on public.notifications;
drop policy if exists "notif_reads own" on public.notif_reads;
create policy "notif read" on public.notifications for select to authenticated using(is_approved() and (not for_managers or is_manager()));
create policy "notif manager write" on public.notifications for all to authenticated using(is_manager()) with check(is_manager());
create policy "notif_reads own" on public.notif_reads for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- старые новости — в ленту (один раз)
insert into public.notifications(kind,title,body,link,created_at)
select 'news',n.title,n.body,'news',n.created_at from public.news n
where not exists(select 1 from public.notifications x where x.kind='news' and x.title=n.title);

-- 5. Автоуведомления
create or replace function public.mon_ru(d date) returns text language sql immutable as $$
  select extract(day from d)::int||' '||(array['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'])[extract(month from d)::int] $$;

create or replace function public.trg_news() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into notifications(kind,title,body,link) values('news',new.title,new.body,'news'); return new; end $$;
drop trigger if exists on_news_notify on public.news;
create trigger on_news_notify after insert on public.news for each row execute function public.trg_news();

create or replace function public.trg_rotation() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into notifications(kind,title,body,link) values('rotation','Вышла ротация на '||mon_ru(new.day),'Посмотри, кто где стоит и когда перерыв.','rot:'||new.day);
  elsif new.data is distinct from old.data and (new.data - 'image') is distinct from (old.data - 'image') then
    insert into notifications(kind,title,body,link) values('rotation','Ротация на '||mon_ru(new.day)||' обновлена','Изменились данные ротации.','rot:'||new.day);
  end if;
  return new;
end $$;
drop trigger if exists on_rotation_notify on public.rotations;
create trigger on_rotation_notify after insert or update on public.rotations for each row execute function public.trg_rotation();

create or replace function public.trg_events() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if exists(select 1 from nt) then
    insert into notifications(kind,title,body,link) values('afisha','Обновилась афиша','Появились новые события в парке.','afisha');
  end if;
  return null;
end $$;
drop trigger if exists on_events_notify on public.events;
create trigger on_events_notify after insert on public.events referencing new table as nt for each statement execute function public.trg_events();

create or replace function public.trg_signup() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='pending' then
    insert into notifications(kind,title,body,link,for_managers) values('signup','Новая заявка: '||coalesce(new.full_name,new.email),coalesce(new.email,''),'staff',true);
  end if;
  return new;
end $$;
drop trigger if exists on_signup_notify on public.profiles;
create trigger on_signup_notify after insert on public.profiles for each row execute function public.trg_signup();

-- 6. Политики чтения: посторонние и неодобренные ничего не видят
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using(id=auth.uid() or is_approved());
drop policy if exists "rot read" on public.rotations;
create policy "rot read" on public.rotations for select to authenticated using(is_approved());
drop policy if exists "news read" on public.news;
create policy "news read" on public.news for select to authenticated using(is_approved());
drop policy if exists "events read" on public.events;
create policy "events read" on public.events for select to authenticated using(is_approved());
