-- Этап 4б: график сотрудников (Хранители) до их регистрации + имя в ротации.
alter table public.roster add column if not exists rot_name text;  -- как человека зовут в ротации (если отличается от списка)
create or replace function public.my_roster_name() returns text language sql security definer stable set search_path=public as $$
  select coalesce(rot_name,full_name) from roster where profile_id=auth.uid() limit 1 $$;

create table if not exists public.roster_marks(
  roster_id bigint not null references public.roster on delete cascade,
  day date not null,
  kind text not null check(kind in('off','otgul','do','sick','vac')),
  note text,
  primary key(roster_id,day));
alter table public.roster_marks enable row level security;
drop policy if exists "roster_marks manager" on public.roster_marks;
create policy "roster_marks manager" on public.roster_marks for all to authenticated using(is_manager()) with check(is_manager());

-- когда сотрудник привязывается к строке списка, его отметки из графика переезжают в «График»
create or replace function public.trg_roster_link() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.profile_id is not null and new.profile_id is distinct from old.profile_id then
    insert into marks(user_id,day,kind,note) select new.profile_id,day,kind,coalesce(note,'из графика') from roster_marks where roster_id=new.id
    on conflict(user_id,day) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists roster_link on public.roster;
create trigger roster_link after update of profile_id on public.roster for each row execute function public.trg_roster_link();

-- Хранители из октябрьского графика (o=выходной, t=отгул, d=ДО, s=больничный, .=работает; символ на каждый день октября)
with src(name,rot,hire,pat) as (values
('Ярошенко М.О','Машунчик опасность','2025-08-19','o...oooo...oooo...oooo...oooo..'),
('Лефенцова А.В','Анастасия','2025-08-19','...ooo....ooo....ooo....ooo....'),
('Бегалыева А.А',null,'2025-01-14','o...oooo...oooo...oooo.........'),
('Ванышев Д.А','Давид','2023-12-12','o...oooo...oooo...oooo.........'),
('Волошкин И.С',null,'2024-11-28','o...oooo...oooo...oooo.........'),
('Котович Е',null,'2025-04-03','od..oooo...oooo...oooo.........'),
('Решетникова Ю.О',null,'2025-06-03','o...oooo...oooo...oooo.........'),
('Хомич Я.А','Ярослав','2025-02-14','o...oooo...oooo...oooo.........'),
('Эрежебова М.Д','Мавиле','2026-02-06','otttooootttoooo...oooo.........'),
('Яковцева Е.В',null,'2025-01-14','otttooootttoooo...oooo.........'),
('Хасанова С',null,'2023-12-12','o...oooo...oooo...oooo.........'),
('Франчук А','Артурито Франческо','2024-11-28','o...oooo...oooo..doooo.........'),
('Ткаченко Ксения',null,'2025-04-03','o...oooo...oooo...oooo.........'),
('Быкова Анна','Аня','2025-06-03','o...oooo...oooodddoooo.........'),
('Бугаева Юлиана',null,'2025-02-14','o...oooo...oooo...oooo.........'),
('Дарья','Даша','2026-06-04','o...oooo...oooo...oooo.........'),
('Плюта М.','Макс','2026-05-19','o...oooo...oooo...oooo.........'),
('Османова Э.',null,'2026-06-04','o...oooo...oooo...oooo.........'),
('Качиева Д.','Дина','2026-06-04','o...oooo...oooo...oooo.........'),
('Надточий К.',null,'2026-06-04','o...oooo...oooo...oooo.........'),
('Зарубина В.','Варвара','2026-08-25','o...oooo...oooo...oooo.........'),
('Будылдин И.',null,'2026-10-20','o...oooo...oooo...oooo.........'))
, ins as (
  insert into public.roster(full_name,team,rot_name)
  select name,'K',rot from src where not exists (select 1 from public.roster r where r.full_name=src.name)
  returning id)
select count(*) from ins;

with src(name,rot,hire,pat) as (values
('Ярошенко М.О','Машунчик опасность','2025-08-19','o...oooo...oooo...oooo...oooo..'),
('Лефенцова А.В','Анастасия','2025-08-19','...ooo....ooo....ooo....ooo....'),
('Бегалыева А.А',null,'2025-01-14','o...oooo...oooo...oooo.........'),
('Ванышев Д.А','Давид','2023-12-12','o...oooo...oooo...oooo.........'),
('Волошкин И.С',null,'2024-11-28','o...oooo...oooo...oooo.........'),
('Котович Е',null,'2025-04-03','od..oooo...oooo...oooo.........'),
('Решетникова Ю.О',null,'2025-06-03','o...oooo...oooo...oooo.........'),
('Хомич Я.А','Ярослав','2025-02-14','o...oooo...oooo...oooo.........'),
('Эрежебова М.Д','Мавиле','2026-02-06','otttooootttoooo...oooo.........'),
('Яковцева Е.В',null,'2025-01-14','otttooootttoooo...oooo.........'),
('Хасанова С',null,'2023-12-12','o...oooo...oooo...oooo.........'),
('Франчук А','Артурито Франческо','2024-11-28','o...oooo...oooo..doooo.........'),
('Ткаченко Ксения',null,'2025-04-03','o...oooo...oooo...oooo.........'),
('Быкова Анна','Аня','2025-06-03','o...oooo...oooodddoooo.........'),
('Бугаева Юлиана',null,'2025-02-14','o...oooo...oooo...oooo.........'),
('Дарья','Даша','2026-06-04','o...oooo...oooo...oooo.........'),
('Плюта М.','Макс','2026-05-19','o...oooo...oooo...oooo.........'),
('Османова Э.',null,'2026-06-04','o...oooo...oooo...oooo.........'),
('Качиева Д.','Дина','2026-06-04','o...oooo...oooo...oooo.........'),
('Надточий К.',null,'2026-06-04','o...oooo...oooo...oooo.........'),
('Зарубина В.','Варвара','2026-08-25','o...oooo...oooo...oooo.........'),
('Будылдин И.',null,'2026-10-20','o...oooo...oooo...oooo.........'))
insert into public.roster_marks(roster_id,day,kind)
select r.id, make_date(2026,10,i), case substr(s.pat,i,1) when 'o' then 'off' when 't' then 'otgul' when 'd' then 'do' else 'sick' end
from src s join public.roster r on r.full_name=s.name, generate_series(1,31) i
where substr(s.pat,i,1)<>'.' and make_date(2026,10,i)>=s.hire::date
on conflict do nothing;
update public.roster_marks m set note='ДО написан' from public.roster r where r.id=m.roster_id and r.full_name='Котович Е' and m.day=make_date(2026,10,2) and m.kind='do';
