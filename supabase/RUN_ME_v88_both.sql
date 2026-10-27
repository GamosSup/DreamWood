-- Личные сообщения: фото. Подарки: вещи из автомата.
alter table public.dm add column if not exists photo text;

-- бакет для фото сообщений; путь нейтральный (<номер запроса>/<случайное имя>), автор в пути не светится
insert into storage.buckets(id,name,public,file_size_limit) values('dm','dm',false,5242880) on conflict(id) do nothing;
drop policy if exists "dm obj read" on storage.objects; drop policy if exists "dm obj insert" on storage.objects; drop policy if exists "dm obj delete" on storage.objects;
create policy "dm obj read" on storage.objects for select to authenticated using(bucket_id='dm' and (owner=auth.uid() or is_admin() or exists(select 1 from public.dm d where d.photo=name and d.to_user=auth.uid())));
create policy "dm obj insert" on storage.objects for insert to authenticated with check(bucket_id='dm' and is_approved());
create policy "dm obj delete" on storage.objects for delete to authenticated using(bucket_id='dm' and (owner=auth.uid() or is_admin()));

drop function if exists public.dm_send(uuid,text,boolean,uuid);
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
  insert into dm(from_user,to_user,body,anon,req,photo) values(u,p_to,left(trim(coalesce(p_body,'')),1500),coalesce(p_anon,false),p_req,p_photo) returning id into i;
  return i;
end $$;
grant execute on function public.dm_send(uuid,text,boolean,uuid,text) to authenticated;
-- текст может быть пустым, если есть фото
alter table public.dm drop constraint if exists dm_body_check;
alter table public.dm add constraint dm_body_check check(length(body)<=1500 and (photo is not null or length(trim(body))>=1));

create or replace function public.dm_inbox() returns jsonb language plpgsql security definer stable set search_path=public as $$
begin
  if auth.uid() is null or not is_approved() then raise exception 'нет доступа'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'body',d.body,'anon',d.anon,'photo',d.photo,
      'from_id',case when d.anon then null else d.from_user end,
      'from_name',case when d.anon then null else (select full_name from profiles where id=d.from_user) end,
      'at',d.created_at,'read',d.read_at is not null) order by d.created_at desc)
    from (select * from dm where to_user=auth.uid() order by created_at desc limit 100) d),'[]'::jsonb);
end $$;
grant execute on function public.dm_inbox() to authenticated;

-- подарок вещи из автомата: вещь переходит от дарителя к коллеге (если у коллеги её ещё нет)
alter table public.gacha_gifts alter column n drop not null;
alter table public.gacha_gifts drop constraint if exists gacha_gifts_n_check;
alter table public.gacha_gifts add column if not exists item text;
create or replace function public.gacha_gift_item(p_to uuid, p_code text, p_req uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid();
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_req is null then raise exception 'Обнови приложение: закрой его полностью и открой заново'; end if;
  if p_to is null or p_to=u then raise exception 'Выбери коллегу'; end if;
  if not exists(select 1 from profiles where id=p_to and status='approved') then raise exception 'Такого сотрудника нет'; end if;
  if not exists(select 1 from gacha_items where code=p_code) then raise exception 'Такой вещи нет'; end if;
  if exists(select 1 from gacha_gifts where from_user=u and req=p_req) then return jsonb_build_object('again',true); end if;
  perform 1 from user_ach where user_id in(u,p_to) and code='gx:'||p_code order by user_id for update;
  if not exists(select 1 from user_ach where user_id=u and code='gx:'||p_code) then raise exception 'У тебя нет этой вещи'; end if;
  if exists(select 1 from user_ach where user_id=p_to and code='gx:'||p_code) then raise exception 'У коллеги уже есть такая вещь'; end if;
  delete from user_ach where user_id=u and code='gx:'||p_code;
  insert into user_ach(user_id,code,label,bonus) values(p_to,'gx:'||p_code,null,0);
  insert into gacha_gifts(from_user,to_user,n,item,req) values(u,p_to,null,p_code,p_req);
  return jsonb_build_object('gave',p_code);
end $$;
grant execute on function public.gacha_gift_item(uuid,text,uuid) to authenticated;
select 'ok' as r;
-- «О себе» в профиле: девиз, рассказ, увлечения
create or replace function public.set_my_cos(p jsonb) returns void language plpgsql security definer set search_path=public as $$
declare k text; clean jsonb:='{}'::jsonb;
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  for k in select jsonb_object_keys(coalesce(p,'{}'::jsonb)) loop
    if k in('frame','name','bg','badge','title') and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 80 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='pet' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 300 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='motto' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 80 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='bio' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 400 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='fav' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 120 then
      clean:=clean||jsonb_build_object(k,p->>k);
    end if;
  end loop;
  update profiles set cos=clean where id=auth.uid();
end $$;
grant execute on function public.set_my_cos(jsonb) to authenticated;
select pg_get_functiondef('public.set_my_cos(jsonb)'::regprocedure) like '%motto%' as ok;
