-- Приветствие, дневник настроения и пакетная выдача значков.
-- Запускать в Supabase → SQL Editor. Скрипт безопасен при повторном запуске.

create table if not exists public.mood_entries(
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day date not null,
  mood int not null check(mood between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key(user_id,day)
);
alter table public.mood_entries enable row level security;
drop policy if exists "mood own" on public.mood_entries;
create policy "mood own" on public.mood_entries for all to authenticated
  using(is_approved() and user_id=auth.uid())
  with check(is_approved() and user_id=auth.uid());

create or replace function public.mood_set(p_day date, p_mood int)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  if p_day is null or p_day>(now() at time zone 'Europe/Moscow')::date then
    raise exception 'Нельзя записать настроение на будущую дату';
  end if;
  if p_mood not between 1 and 5 then raise exception 'Настроение оценивается от 1 до 5'; end if;
  insert into mood_entries(user_id,day,mood,updated_at)
    values(auth.uid(),p_day,p_mood,now())
    on conflict(user_id,day) do update set mood=excluded.mood,updated_at=now();
  return jsonb_build_object('day',p_day,'mood',p_mood);
end $$;
revoke all on function public.mood_set(date,int) from public;
grant execute on function public.mood_set(date,int) to authenticated;

-- Меняет только сегодняшний статус текущего человека. Не трогает больничный,
-- отпуск, отгул и ДО: такие расхождения решает руководитель.
create or replace function public.day_status_set(p_status text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  u uuid:=auth.uid();
  d date:=(now() at time zone 'Europe/Moscow')::date;
  k text;
begin
  if u is null or not is_approved() then raise exception 'Нет доступа'; end if;
  if p_status not in('work','rest') then raise exception 'Неизвестный статус дня'; end if;
  select kind into k from marks where user_id=u and day=d for update;
  if k is not null and k<>'off' then
    if p_status='work' then
      raise exception 'Сегодня в графике уже отмечено отсутствие. Изменить его может руководитель';
    end if;
    return jsonb_build_object('day',d,'status','rest','kind',k);
  end if;
  if p_status='work' then
    if k='off' then delete from marks where user_id=u and day=d and kind='off'; end if;
    insert into checkins(user_id,day) values(u,d) on conflict(user_id,day) do nothing;
  else
    insert into marks(user_id,day,kind,note) values(u,d,'off','Отмечено в приветствии')
      on conflict(user_id,day) do nothing;
    delete from checkins where user_id=u and day=d;
  end if;
  return jsonb_build_object('day',d,'status',p_status,'kind',k);
end $$;
revoke all on function public.day_status_set(text) from public;
grant execute on function public.day_status_set(text) to authenticated;

-- p_items: [{"code":"adm:golf","label":"Допущен: Гольф","bonus":100}, ...]
-- Выдача атомарна: при ошибке не останется частично выданного набора.
create or replace function public.ach_grant_many(p_users uuid[], p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  u uuid;
  it jsonb;
  code text;
  label text;
  bonus int;
  issued int:=0;
  skipped int:=0;
  people int:=0;
  items int:=0;
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  if p_users is null or cardinality(p_users)=0 or cardinality(p_users)>100 then
    raise exception 'Выбери от 1 до 100 сотрудников';
  end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>100 then
    raise exception 'Выбери от 1 до 100 значков';
  end if;
  if (select count(distinct x) from unnest(p_users) x)<>cardinality(p_users) then
    raise exception 'Сотрудники повторяются';
  end if;
  if exists(select 1 from unnest(p_users) x left join profiles p on p.id=x and p.status='approved' where p.id is null) then
    raise exception 'В списке есть сотрудник без подтверждённого доступа';
  end if;
  if cardinality(p_users)*jsonb_array_length(p_items)>2000 then
    raise exception 'Слишком большой пакет: не больше 2000 выдач за раз';
  end if;
  foreach u in array p_users loop
    people:=people+1;
    for it in select value from jsonb_array_elements(p_items) loop
      code:=it->>'code';
      label:=left(coalesce(nullif(it->>'label',''),code),80);
      bonus:=greatest(0,least(coalesce(nullif(it->>'bonus','')::int,0),500));
      if code !~ '^(adm|trn|evt|spec):[a-z0-9_а-яё-]{1,60}$' then
        raise exception 'Неверный код достижения: %',coalesce(code,'(пусто)');
      end if;
      if code like 'spec:%' and not exists(select 1 from profiles where id=auth.uid() and role='admin') then
        raise exception 'Особые значки выдаёт только админ';
      end if;
      insert into user_ach(user_id,code,label,bonus,by)
        values(u,code,label,bonus,auth.uid()) on conflict(user_id,code) do nothing;
      if found then
        issued:=issued+1;
        insert into notifications(kind,title,body,link,to_user)
          values('ach','🏅 Тебе выдали значок',label,'game',u);
      else
        skipped:=skipped+1;
      end if;
    end loop;
  end loop;
  items:=jsonb_array_length(p_items);
  return jsonb_build_object('issued',issued,'skipped',skipped,'people',people,'items',items);
end $$;
revoke all on function public.ach_grant_many(uuid[],jsonb) from public;
grant execute on function public.ach_grant_many(uuid[],jsonb) to authenticated;
