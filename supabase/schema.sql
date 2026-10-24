-- Запусти целиком в Supabase → SQL Editor.
create table public.profiles(id uuid primary key references auth.users on delete cascade, full_name text, role text not null default 'employee' check(role in('employee','manager')), team text);
create table public.rotations(day date primary key, data jsonb not null, updated_at timestamptz default now());
create table public.marks(user_id uuid references public.profiles on delete cascade, day date, kind text not null check(kind in('off','otgul','do','sick','vac')), note text, primary key(user_id,day));
create table public.news(id bigint generated always as identity primary key, title text not null, body text not null, pinned boolean default false, created_at timestamptz default now());
create table public.events(id bigint generated always as identity primary key, day date not null, time text, title text not null, loc text, descr text, price text, token boolean default false);

create function public.is_manager() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='manager') $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.email)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table profiles enable row level security; alter table rotations enable row level security; alter table marks enable row level security; alter table news enable row level security; alter table events enable row level security;
create policy "profiles read" on profiles for select to authenticated using(true);
create policy "profiles manager write" on profiles for all to authenticated using(is_manager()) with check(is_manager());
create policy "rot read" on rotations for select to authenticated using(true);
create policy "rot manager write" on rotations for all to authenticated using(is_manager()) with check(is_manager());
create policy "news read" on news for select to authenticated using(true);
create policy "news manager write" on news for all to authenticated using(is_manager()) with check(is_manager());
create policy "events read" on events for select to authenticated using(true);
create policy "events manager write" on events for all to authenticated using(is_manager()) with check(is_manager());
create policy "marks own or manager" on marks for all to authenticated using(user_id=auth.uid() or is_manager()) with check(user_id=auth.uid() or is_manager());
-- Роль сотрудник не может сам себе поставить manager: обычный пользователь не имеет права писать в profiles (только manager).

-- Добавлено 2026-10-24: табельные номера, прочитанные новости (колокольчик), переработки. Для уже работающей базы запускай supabase/migration_2026-10-24_bell_overtime.sql
alter table public.profiles add column if not exists tab_no text;
create table if not exists public.news_reads(user_id uuid references public.profiles on delete cascade, news_id bigint references public.news on delete cascade, read_at timestamptz default now(), primary key(user_id,news_id));
alter table public.news_reads enable row level security;
create policy "reads own" on public.news_reads for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create table if not exists public.overtime(id bigint generated always as identity primary key, user_id uuid not null references public.profiles on delete cascade, day date not null, start_time text, hours numeric not null check(hours>0), note text, created_by uuid references public.profiles, created_at timestamptz default now());
alter table public.overtime enable row level security;
create policy "overtime read own or manager" on public.overtime for select to authenticated using(user_id=auth.uid() or is_manager());
create policy "overtime manager write" on public.overtime for all to authenticated using(is_manager()) with check(is_manager());
