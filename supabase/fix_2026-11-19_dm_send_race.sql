-- Личные сообщения: повторная отправка с тем же req больше не даёт «duplicate key dm_req»
create or replace function public.dm_send(p_to uuid, p_body text, p_anon boolean default false, p_req uuid default null, p_photo text default null) returns bigint language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); i bigint;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_req is null then raise exception 'Обнови приложение: закрой его полностью и открой заново'; end if;
  if p_to is null or p_to=u then raise exception 'Выбери коллегу'; end if;
  if not exists(select 1 from profiles where id=p_to and status='approved') then raise exception 'Такого сотрудника нет'; end if;
  if length(trim(coalesce(p_body,'')))<1 and p_photo is null then raise exception 'Напиши текст или приложи фото'; end if;
  if p_photo is not null and not exists(select 1 from storage.objects where bucket_id='dm' and name=p_photo and owner=u) then raise exception 'Фото не загрузилось, попробуй ещё раз'; end if;
  select id into i from dm where from_user=u and req=p_req;
  if found then return i; end if;
  if (select count(*) from dm where from_user=u and created_at>now()-interval '1 day')>=30 then raise exception 'Слишком много сообщений за сутки'; end if;
  begin
    insert into dm(from_user,to_user,body,anon,req,photo) values(u,p_to,left(trim(coalesce(p_body,'')),1500),coalesce(p_anon,false),p_req,p_photo) returning id into i;
  exception when unique_violation then
    select id into i from dm where from_user=u and req=p_req;
  end;
  return i;
end $$;
grant execute on function public.dm_send(uuid,text,boolean,uuid,text) to authenticated;
select pg_get_functiondef('public.dm_send(uuid,text,boolean,uuid,text)'::regprocedure) like '%unique_violation%' as ok;
