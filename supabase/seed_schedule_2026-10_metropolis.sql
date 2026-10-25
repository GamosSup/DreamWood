insert into public.roster(full_name,team) select x,'M' from (values ('Замятина И.'),('Клюева Н.'),('Швырева К.'),('Дылова В.'),('Черняев М.')) v(x) where not exists (select 1 from public.roster r where r.full_name=v.x);
-- График Метрополиса на октябрь 2026 (лист «Октябрь 2026»). o=выходной, d=ДО, s=больничный, v=отпуск.
-- Кристина (Детский клуб) = Суворова К. (предположение).
with src(sur,pat) as (values
('Суворова','...................ooo...ooo...'),
('Замятина','o...ooo...ooo.ddooo...ooo...ooo'),
('Клюева','.ooo...ooo...ooo...ooo...ooo...'),
('Смолянова','.ooo...ooo...ooo...ooo...ooo...'),
('Швырева','o...ooo...ooo...ooo...ooo...ooo'),
('Дылова','....ooo...ooo...ooo...ooo...ooo'),
('Волкова','..ooo...ooo...ooo...ooo...ooo..'),
('Канахина','oo...ooo...ooo...ooo...ooo...oo'),
('Эльвир','.ooo....ooo..ooo...ooo...ooo...'),
('Зиньков','o...ooooo....ooo...ooo...ooo...'),
('Черняев','osssooovvvooo...ooo...ooo...ooo'))
insert into public.roster_marks(roster_id,day,kind,note)
select r.id, make_date(2026,10,i), case substr(s.pat,i,1) when 'o' then 'off' when 'd' then 'do' when 's' then 'sick' else 'vac' end, case when substr(s.pat,i,1)='v' then 'отпуск' end
from src s join public.roster r on r.team='M' and (r.full_name ilike s.sur||'%' or (s.sur='Суворова' and r.full_name like 'Кристина (Детский%')), generate_series(1,31) i
where substr(s.pat,i,1)<>'.'
on conflict(roster_id,day) do update set kind=excluded.kind, note=excluded.note;
