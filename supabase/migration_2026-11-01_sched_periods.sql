-- Периоды графика: часы смены по датам. Личная длина дня (profiles/roster.day_len) главнее периода,
-- у команды Метрополис своя длина дня 12 ч, поэтому на неё период не действует.
create table if not exists public.sched_periods(
  id bigint generated always as identity primary key,
  date_from date not null,
  date_to date not null check(date_to>=date_from),
  start_time time not null,
  end_time time not null,
  break_min int not null default 0,
  hours numeric(4,2) not null,
  note text,
  created_at timestamptz default now());
alter table public.sched_periods enable row level security;
drop policy if exists "sp read" on public.sched_periods;
drop policy if exists "sp write" on public.sched_periods;
create policy "sp read" on public.sched_periods for select to authenticated using(is_approved());
create policy "sp write" on public.sched_periods for all to authenticated using(is_manager()) with check(is_manager());

-- 1–23.10: пт, сб, вс 9:30–20:30, перерыв 1 ч (10 ч); 24.10–01.11: каждый день 9:30–18:30, перерыв 1 ч (8 ч)
insert into public.sched_periods(date_from,date_to,start_time,end_time,break_min,hours,note)
select '2026-10-01','2026-10-23','09:30','20:30',60,10,'пт, сб, вс' where not exists(select 1 from public.sched_periods where date_from='2026-10-01');
insert into public.sched_periods(date_from,date_to,start_time,end_time,break_min,hours,note)
select '2026-10-24','2026-11-01','09:30','18:30',60,8,'каждый день' where not exists(select 1 from public.sched_periods where date_from='2026-10-24');

-- команда Метрополис считается по своим 12 часам, остальным без личной длины дня подходят периоды
update public.profiles set day_len=12 where team='M' and day_len is null;
