-- Подтверждение выхода на смену: утром в колокольчик приходит уведомление, сотрудник нажимает на него.
-- Руководитель (и бригадир своей команды) видит зелёную точку в «Общем графике».
create table if not exists public.checkins(
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day date not null,
  at timestamptz not null default now(),
  primary key(user_id,day));
alter table public.checkins enable row level security;
drop policy if exists "checkins read" on public.checkins;
create policy "checkins read" on public.checkins for select to authenticated using(is_approved() and (user_id=auth.uid() or can_manage(user_id)));
-- записывать напрямую нельзя: только через checkin_confirm() (день считается по московскому времени)

create or replace function public.checkin_confirm() returns timestamptz language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date; t timestamptz;
begin
  if not is_approved() then raise exception 'нет доступа'; end if;
  insert into checkins(user_id,day) values(auth.uid(),d) on conflict(user_id,day) do nothing;
  select at into t from checkins where user_id=auth.uid() and day=d;
  return t;
end $$;

-- утренняя рассылка: всем, у кого сегодня нет отметки выходного/отгула/ДО/больничного/отпуска
create or replace function public.send_checkins() returns int language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date; n int;
begin
  insert into notifications(kind,title,body,link,to_user)
  select 'checkin','☀️ Ты сегодня на смене?','Нажми на это сообщение, чтобы подтвердить выход.','checkin:'||d,p.id
  from profiles p
  where p.status='approved'
    and not exists(select 1 from marks m where m.user_id=p.id and m.day=d)
    and not exists(select 1 from notifications x where x.kind='checkin' and x.to_user=p.id and x.link='checkin:'||d);
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.send_checkins() from public, anon, authenticated;

-- каждый день в 09:00 по Москве (06:00 UTC)
select cron.schedule('dw-checkin','0 6 * * *','select public.send_checkins()');
