-- График Рейнджеров на октябрь 2026 (из файла отпусков, лист «Октябрь 2026»).
-- o=выходной, v=отпуск, .=работает. 26–31 октября в файле ещё не заполнены (везде «1») — пропущены.
with src(sur,pat) as (values
('Адылов',   'ovvvvvvvvvvvvoo...oooo.........'),
('Митясова', 'o...oooo...oooo...oooo.........'),
('Старков',  'o...oooo...oooo...oooo.........'),
('Иванкина', 'o...oooo...oooo...oooo.........'),
('Бражко',   'o...oooo...oooo...oooo.........'),
('Бражников','o...oooo...oooo...oooo.........'),
('Кочиева',  'o...oooo...oooo...oooo.........'))
insert into public.roster_marks(roster_id,day,kind,note)
select r.id, make_date(2026,10,i),
  case substr(s.pat,i,1) when 'o' then 'off' else 'vac' end,
  case when substr(s.pat,i,1)='v' then 'отпуск' end
from src s join public.roster r on r.team='R' and r.full_name ilike s.sur||'%', generate_series(1,31) i
where substr(s.pat,i,1)<>'.'
on conflict(roster_id,day) do update set kind=excluded.kind, note=excluded.note;
