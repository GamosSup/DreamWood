-- Миграция 2026-10-24: колокольчик (прочитанные новости), переработки, табельные номера, имя, график 4/3.
-- Выполнить в Supabase → SQL Editor. Повторный запуск безопасен.

alter table public.profiles add column if not exists tab_no text;

create table if not exists public.news_reads(user_id uuid references public.profiles on delete cascade, news_id bigint references public.news on delete cascade, read_at timestamptz default now(), primary key(user_id,news_id));
alter table public.news_reads enable row level security;
drop policy if exists "reads own" on public.news_reads;
create policy "reads own" on public.news_reads for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create table if not exists public.overtime(id bigint generated always as identity primary key, user_id uuid not null references public.profiles on delete cascade, day date not null, start_time text, hours numeric not null check(hours>0), note text, created_by uuid references public.profiles, created_at timestamptz default now());
alter table public.overtime enable row level security;
drop policy if exists "overtime read own or manager" on public.overtime;
drop policy if exists "overtime manager write" on public.overtime;
create policy "overtime read own or manager" on public.overtime for select to authenticated using(user_id=auth.uid() or is_manager());
create policy "overtime manager write" on public.overtime for all to authenticated using(is_manager()) with check(is_manager());

-- Игорь Шубчик (рабочий аккаунт руководителя)
update public.profiles set full_name='Игорь Шубчик' where id=(select id from auth.users where lower(email)='gamossup@yandex.com');

-- Его график 4/3 на октябрь и ноябрь 2026: выходные среда, четверг, пятница (смена 9:00–20:00, 10 рабочих часов)
insert into public.marks(user_id,day,kind)
select u.id, d::date, 'off'
from auth.users u, generate_series('2026-10-01'::date,'2026-11-30'::date,'1 day') d
where lower(u.email)='gamossup@yandex.com' and extract(dow from d) in (3,4,5)
on conflict(user_id,day) do nothing;
