-- «Сегодня бриф»: руководитель пишет бриф всем или одной команде, с указанием локации.
-- Сотрудники видят его карточкой на «Сегодня» и получают уведомление.
create table if not exists public.briefs(
  id bigint generated always as identity primary key,
  day date not null default ((now() at time zone 'Europe/Moscow')::date),
  team text check(team is null or team in('R','K','M')),
  location text check(location is null or length(location)<=120),
  body text not null check(length(trim(body)) between 1 and 1500),
  author uuid not null references public.profiles on delete cascade,
  created_at timestamptz default now());
create index if not exists briefs_day on public.briefs(day);
alter table public.briefs enable row level security;
drop policy if exists "brief read" on public.briefs; drop policy if exists "brief delete" on public.briefs;
create policy "brief read" on public.briefs for select to authenticated
  using(is_approved() and (is_manager() or team is null or team=(select team from profiles where id=auth.uid())));
create policy "brief delete" on public.briefs for delete to authenticated using(is_manager());

create or replace function public.brief_publish(p_team text, p_loc text, p_body text) returns bigint language plpgsql security definer set search_path=public as $$
declare v_id bigint; tn text; ttl text; bd text; loc text; tm text;
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  tm:=nullif(trim(coalesce(p_team,'')),'');
  if tm is not null and tm not in('R','K','M') then raise exception 'Неверная команда'; end if;
  if length(trim(coalesce(p_body,'')))=0 then raise exception 'Напиши текст брифа'; end if;
  loc:=nullif(left(trim(coalesce(p_loc,'')),120),'');
  insert into briefs(team,location,body,author) values(tm,loc,left(trim(p_body),1500),auth.uid()) returning id into v_id;
  tn:=case tm when 'R' then 'Рейнджеры' when 'K' then 'Хранители' when 'M' then 'Метрополис' else null end;
  ttl:='📣 Бриф на сегодня'||coalesce(' · '||tn,'');
  bd:=coalesce('📍 '||loc||'. ','')||left(trim(p_body),160);
  if tm is null then
    insert into notifications(kind,title,body,link) values('brief',ttl,bd,'today');
  else
    insert into notifications(kind,title,body,link,to_user)
    select 'brief',ttl,bd,'today',p.id from profiles p where p.status='approved' and p.team=tm and p.id<>auth.uid();
  end if;
  return v_id;
end $$;
grant execute on function public.brief_publish(text,text,text) to authenticated;

select (select count(*) from information_schema.tables where table_name='briefs') as таблица,
       (select count(*) from pg_proc where proname='brief_publish') as функция;
