-- Парк по периодам (пт-вс 9:30–20:30 до 23.10, с 24.10 по 01.11 без выходных 9:30–18:30) действует на всех,
-- кроме Игоря Шубчика, Насти, команды Метрополис и Игоря Олексюка: у них остаётся личная длина дня.
-- У остальных личную длину дня сбрасываем, тогда в графике считается период парка.
-- 1) сначала смотрим, кого это касается (ничего не меняет):
select 'profiles' src, full_name, team, role, day_len from public.profiles where status='approved' order by (day_len is null), full_name;
select 'roster' src, full_name, team, day_len from public.roster where day_len is not null order by full_name;
-- 2) сброс (раскомментировать после проверки списка; Настя и Шубчик исключены по имени)
-- update public.profiles set day_len=null where day_len is not null and team is distinct from 'M'
--   and full_name !~* '(Шубчик|Олексюк|Алексюк|Наст)';
-- update public.roster set day_len=null where day_len is not null and team is distinct from 'M'
--   and full_name !~* '(Шубчик|Олексюк|Алексюк|Наст)';
