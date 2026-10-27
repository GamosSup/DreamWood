-- Опыт супервайзеров: за каждую отметку в чек-листе сотрудника своей команды супервайзеру капает столько же опыта (5), как и самому сотруднику.
-- Рейнджеры — Кристина Прошутинская, Хранители — Мария Ярошенко. Список правится строками этой таблицы.
create table if not exists public.xp_supervisors(
  user_id uuid primary key references public.profiles on delete cascade,
  team text not null check(team in('R','K','M')));
alter table public.xp_supervisors enable row level security; -- без политик: читает только функция xp_of
insert into public.xp_supervisors(user_id,team) values
 ('d606e262-d946-4912-bbf1-42fa356e7878','R'),
 ('79822677-6ec7-48d2-a576-e8dc2a1be165','K')
on conflict(user_id) do update set team=excluded.team;

create or replace function public.xp_of(u uuid) returns integer language sql stable security definer set search_path=public as $$
  select (
    coalesce((select count(*) from shift_checks where user_id=u),0)*5
  + coalesce((select count(*) from shift_checks c join profiles p on p.id=c.user_id join xp_supervisors s on s.user_id=u and s.team=p.team where c.user_id<>u),0)*5
  + coalesce((select count(*) from checkins where user_id=u),0)*10
  + coalesce((select floor(sum(w)) from (select least(100, sum(hours*2*case when kind='p' then 5 else 10 end)) w from overtime where user_id=u group by date_trunc('week',day)) q),0)
  + coalesce((select sum(least(10,c*2)) from (select count(*) c from habit_logs where user_id=u group by day) q),0)
  + coalesce((select sum(least(9,c*3)) from (select count(*) c from thanks where from_user=u group by created_at::date) q),0)
  + coalesce((select sum(least(30,c*10)) from (select count(*) c from thanks where to_user=u group by created_at::date) q),0)
  + coalesce((select count(*) from onb_items where user_id=u and done),0)*5
  + coalesce((select sum(bonus) from user_ach where user_id=u),0)
  )::int $$;
revoke all on function public.xp_of(uuid) from public;
