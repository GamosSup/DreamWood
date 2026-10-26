-- Запускать ПОСЛЕ migration_2026-11-05_game.sql. Безопасно повторять.

-- 1) Фамилия: Алексюк → Олексюк (в списке сотрудников; в самих данных больше нигде не встречается)
update public.roster   set full_name=replace(full_name,'Алексюк','Олексюк') where full_name like '%Алексюк%';
update public.roster   set rot_name =replace(rot_name ,'Алексюк','Олексюк') where rot_name  like '%Алексюк%';
update public.profiles set full_name=replace(full_name,'Алексюк','Олексюк') where full_name like '%Алексюк%';

-- 2) Яковцова и Кочиева уже в приложении: привязываем их к строкам списка, чтобы они не висели как «не зарегистрирован»
update public.roster r set profile_id=p.id
from public.profiles p
where p.id in(select id from public.profiles where full_name='Екатерина Яковцова') and r.full_name='Яковцова Е.В' and r.profile_id is null and not exists(select 1 from public.roster x where x.profile_id=p.id);
update public.roster r set profile_id=p.id
from public.profiles p
where p.id in(select id from public.profiles where full_name='Дина Кочиева') and r.full_name='Кочиева Д.' and r.profile_id is null and not exists(select 1 from public.roster x where x.profile_id=p.id);

-- 3) Мария Ярошенко — в отдел руководителей (как Кристина Прошутинская: без команды)
update public.profiles set team=(select team from public.profiles where full_name='Кристина Прошутинская' limit 1) where full_name='Мария Ярошенко';
update public.roster   set team=(select team from public.roster where full_name='Прошутинская К.' limit 1) where full_name='Ярошенко М.О';

-- 4) Всем сообщение про достижения (приходит в колокольчик и пушем)
insert into public.notifications(kind,title,body,link)
select 'ach','🏅 В приложении появились достижения','Копи опыт, получай уровни и значки, меняй рамку и цвет имени. А ещё у каждого теперь есть свой Дримми: одевай его в «Ещё» → «Мой профиль».','game'
where not exists(select 1 from public.notifications where kind='ach' and link='game' and title like '%появились достижения%');

-- проверка
select concat_ws(' | ',p.full_name,p.role,'team='||coalesce(p.team,'нет'),'список='||coalesce((select string_agg(r.full_name||' (team='||coalesce(r.team,'нет')||')',', ') from public.roster r where r.profile_id=p.id),'не привязан')) as результат
from public.profiles p where p.full_name ~ 'Ярошенко|Яковц|Кочиев|Олексюк|Шубчик'
union all select 'в списке без регистрации: '||coalesce(string_agg(full_name,', '),'никого из проверяемых') from public.roster where profile_id is null and full_name ~ 'Яковц|Кочиев|Ярошенко'
union all select 'Олексюк в списке: '||coalesce(string_agg(full_name,', '),'нет') from public.roster where full_name ~ 'Олексюк|Алексюк';
