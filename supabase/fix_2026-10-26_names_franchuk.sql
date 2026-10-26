-- 1) Исправление фамилий: Яковцева → Яковцова, Качиева → Кочиева (список сотрудников, профили, ротации)
update public.roster   set full_name=replace(full_name,'Яковцев','Яковцов') where full_name like '%Яковцев%';
update public.roster   set rot_name =replace(rot_name ,'Яковцев','Яковцов') where rot_name  like '%Яковцев%';
update public.profiles set full_name=replace(full_name,'Яковцев','Яковцов') where full_name like '%Яковцев%';
update public.rotations set data=replace(data::text,'Яковцев','Яковцов')::jsonb where data::text like '%Яковцев%';

update public.roster   set full_name=replace(full_name,'Качиев','Кочиев') where full_name like '%Качиев%';
update public.roster   set rot_name =replace(rot_name ,'Качиев','Кочиев') where rot_name  like '%Качиев%';
update public.profiles set full_name=replace(full_name,'Качиев','Кочиев') where full_name like '%Качиев%';
update public.rotations set data=replace(data::text,'Качиев','Кочиев')::jsonb where data::text like '%Качиев%';

-- 2) Доработка: Артур Франчук, 3 часа, лазертаг, 20.10.2026
insert into public.overtime(user_id,day,hours,note,kind)
select p.id,date '2026-10-20',3,'Лазертаг','d' from public.profiles p
where p.full_name ilike '%Франчук%'
  and not exists(select 1 from public.overtime o where o.user_id=p.id and o.day=date '2026-10-20' and o.note='Лазертаг');

-- Проверка: что получилось
select 'доработка' as что, p.full_name as кто, o.day::text as значение, o.hours::text||' ч, '||o.kind as детали
from public.overtime o join public.profiles p on p.id=o.user_id where p.full_name ilike '%Франчук%'
union all select 'имя в профилях', full_name, '', '' from public.profiles where full_name ~ 'Яковц|Кочиев|Качиев'
union all select 'имя в списке', full_name, coalesce(rot_name,''), '' from public.roster where full_name ~ 'Яковц|Кочиев|Качиев|Франчук';
