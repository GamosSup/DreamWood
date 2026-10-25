-- Этап 3: личные пометки к ротации, привязка сотрудника к имени в ротации, режим дождя (уведомление). Повторный запуск безопасен.
create table if not exists public.rot_notes(
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day date not null,
  note text not null default '',
  primary key(user_id,day));
alter table public.rot_notes enable row level security;
drop policy if exists "rot notes own" on public.rot_notes;
create policy "rot notes own" on public.rot_notes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create or replace function public.my_roster_name() returns text language sql security definer stable set search_path=public as $$
  select full_name from roster where profile_id=auth.uid() limit 1 $$;

create or replace function public.trg_rotation() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into notifications(kind,title,body,link) values('rotation','Вышла ротация на '||mon_ru(new.day),'Посмотри, кто где стоит и когда перерыв.','rot:'||new.day);
  elsif coalesce(new.data->>'rain','')<>coalesce(old.data->>'rain','') then
    insert into notifications(kind,title,body,link) values('rotation',
      case when (new.data->>'rain')='true' then '🌧 Включён режим дождя' else '☀️ Дождь закончился' end,
      case when (new.data->>'rain')='true' then 'Работаем по плану «Если дождь». Открой ротацию на '||mon_ru(new.day)||'.' else 'Возвращаемся к обычной ротации на '||mon_ru(new.day)||'.' end,
      'rot:'||new.day);
  elsif new.data is distinct from old.data and (new.data - 'image') is distinct from (old.data - 'image') then
    insert into notifications(kind,title,body,link) values('rotation','Ротация на '||mon_ru(new.day)||' обновлена','Изменились данные ротации.','rot:'||new.day);
  end if;
  return new;
end $$;
