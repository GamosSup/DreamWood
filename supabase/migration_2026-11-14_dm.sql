-- Личные сообщения в «Обращениях», в том числе анонимные.
-- Получатель читает только через функцию dm_inbox: у анонимных сообщений автор ему не отдаётся совсем.
-- Автора анонимного сообщения видит он сам и администратор (на случай нарушений).
create table if not exists public.dm(
  id bigint generated always as identity primary key,
  from_user uuid not null references public.profiles on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  body text not null check(length(trim(body)) between 1 and 1500),
  anon boolean not null default false,
  req uuid, read_at timestamptz, created_at timestamptz not null default now());
create unique index if not exists dm_req on public.dm(from_user,req) where req is not null;
create index if not exists dm_to on public.dm(to_user,created_at desc);
alter table public.dm enable row level security;
drop policy if exists "dm sender read" on public.dm;
create policy "dm sender read" on public.dm for select to authenticated using(from_user=auth.uid() or is_admin());
-- вставка/изменение напрямую запрещены: только функции ниже

create or replace function public.dm_send(p_to uuid, p_body text, p_anon boolean default false, p_req uuid default null) returns bigint language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); i bigint;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_req is null then raise exception 'Обнови приложение: закрой его полностью и открой заново'; end if;
  if p_to is null or p_to=u then raise exception 'Выбери коллегу'; end if;
  if not exists(select 1 from profiles where id=p_to and status='approved') then raise exception 'Такого сотрудника нет'; end if;
  if length(trim(coalesce(p_body,'')))<1 then raise exception 'Напиши текст сообщения'; end if;
  select id into i from dm where from_user=u and req=p_req;
  if found then return i; end if;
  if (select count(*) from dm where from_user=u and created_at>now()-interval '1 day')>=30 then raise exception 'Слишком много сообщений за сутки'; end if;
  insert into dm(from_user,to_user,body,anon,req) values(u,p_to,left(trim(p_body),1500),coalesce(p_anon,false),p_req) returning id into i;
  return i;
end $$;
grant execute on function public.dm_send(uuid,text,boolean,uuid) to authenticated;

create or replace function public.dm_inbox() returns jsonb language plpgsql security definer stable set search_path=public as $$
begin
  if auth.uid() is null or not is_approved() then raise exception 'нет доступа'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'body',d.body,'anon',d.anon,
      'from_id',case when d.anon then null else d.from_user end,
      'from_name',case when d.anon then null else (select full_name from profiles where id=d.from_user) end,
      'at',d.created_at,'read',d.read_at is not null) order by d.created_at desc)
    from (select * from dm where to_user=auth.uid() order by created_at desc limit 100) d),'[]'::jsonb);
end $$;
grant execute on function public.dm_inbox() to authenticated;

create or replace function public.dm_read(p_ids bigint[]) returns void language sql security definer set search_path=public as $$
  update dm set read_at=now() where to_user=auth.uid() and id=any(p_ids) and read_at is null $$;
grant execute on function public.dm_read(bigint[]) to authenticated;

create or replace function public.dm_unread() returns int language sql security definer stable set search_path=public as $$
  select count(*)::int from dm where to_user=auth.uid() and read_at is null $$;
grant execute on function public.dm_unread() to authenticated;
