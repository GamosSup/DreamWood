-- Графики 4/3 у Игоря Шубчика (сб, вс, пн, вт) и Насти (ср, чт, пт, сб); сб общий. День 10 ч (9:30–20:30, обед час).
-- Выходные ставим отметками «off» с 01.10 по 30.11. На 22.10 Игорь вышел вместо Насти: его чт не выходной + заметка, не переработка.
-- ВНИМАНИЕ: замени фамилию Насти в :nastya (по умолчанию ищется по началу «Наст»), перед запуском проверь первый запрос.
with p as (
  select (select id from public.profiles where status='approved' and full_name ilike '%Шубчик%' limit 1) igor,
         (select id from public.profiles where status='approved' and full_name ilike 'Наст%' limit 1) nastya)
select * from p;
update public.profiles set day_len=10 where full_name ilike '%Шубчик%' or id=(select id from public.profiles where status='approved' and full_name ilike 'Наст%' limit 1);
with p as (
  select (select id from public.profiles where status='approved' and full_name ilike '%Шубчик%' limit 1) igor,
         (select id from public.profiles where status='approved' and full_name ilike 'Наст%' limit 1) nastya),
d as (select g::date day, extract(dow from g)::int dw from generate_series('2026-10-01'::date,'2026-11-30'::date,'1 day') g)
insert into public.marks(user_id,day,kind,note)
select p.igor,d.day,'off','выходной по графику 4/3' from p,d where d.dw in(3,4,5) and d.day<>'2026-10-22'
union all
select p.nastya,d.day,'off','выходной по графику 4/3' from p,d where d.dw in(0,1,2)
on conflict(user_id,day) do nothing;
insert into public.day_notes(user_id,day,body)
select id,'2026-10-22','Вышел вместо Насти (не переработка)' from public.profiles where status='approved' and full_name ilike '%Шубчик%' limit 1
on conflict(user_id,day) do update set body=excluded.body;
select 'ok' r;
