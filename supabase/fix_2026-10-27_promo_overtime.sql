-- Доработка за промо 02.10.2026: Ева Котович и Ярослав Хомич, по 4 часа каждому
insert into public.overtime(user_id,day,hours,note,kind)
select p.id,date '2026-10-02',4,'Промо','d' from public.profiles p
where (p.full_name ilike '%Котович%' or p.full_name ilike '%Хомич%')
  and not exists(select 1 from public.overtime o where o.user_id=p.id and o.day=date '2026-10-02' and o.note='Промо');

-- Проверка: должно быть две строки по 4 часа
select p.full_name as кто, o.day::text as день, o.hours::text||' ч, '||o.kind||', '||o.note as детали
from public.overtime o join public.profiles p on p.id=o.user_id
where o.day=date '2026-10-02' and o.note='Промо';
