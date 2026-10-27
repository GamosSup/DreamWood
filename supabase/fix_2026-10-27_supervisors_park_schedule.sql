-- Маша (Ярошенко) и Кристина (Прошутинская) работают как операторы: по графику парка.
-- Убираем старые выходные («off») из октябрьского графика хранителей и личную длину дня, дальше считается период парка:
-- до 23.10 пт, сб, вс 9:30–20:30, с 24.10 по 01.11 каждый день 9:30–18:30. Отгулы, отпуска и больничные не трогаем.
-- 1) просмотр, что стоит сейчас:
select p.full_name,p.day_len,(select string_agg(right(m.day::text,5)||':'||m.kind,' ' order by m.day) from public.marks m where m.user_id=p.id and m.day>='2026-10-01') marks
from public.profiles p where p.full_name in('Кристина Прошутинская','Мария Ярошенко');
-- 2) исправление:
-- delete from public.marks where kind='off' and day between '2026-10-01' and '2026-11-01' and user_id in(select id from public.profiles where full_name in('Кристина Прошутинская','Мария Ярошенко'));
-- update public.profiles set day_len=null where full_name in('Кристина Прошутинская','Мария Ярошенко');
-- update public.roster set day_len=null where profile_id in(select id from public.profiles where full_name in('Кристина Прошутинская','Мария Ярошенко'));
