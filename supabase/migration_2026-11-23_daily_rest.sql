-- Задания выходного дня + фото на проверку админу
create table if not exists public.dq_photos(id bigint generated always as identity primary key, user_id uuid not null references public.profiles on delete cascade, day date not null, path text not null, status text not null default 'pending', created_at timestamptz not null default now());
create index if not exists dq_photos_ud on public.dq_photos(user_id,day);
alter table public.dq_photos enable row level security;
drop policy if exists "dqph read" on public.dq_photos;
create policy "dqph read" on public.dq_photos for select to authenticated using(user_id=auth.uid() or is_admin());
insert into storage.buckets(id,name,public,file_size_limit) values('dqp','dqp',false,5242880) on conflict(id) do nothing;
drop policy if exists "dqp obj read" on storage.objects; drop policy if exists "dqp obj insert" on storage.objects; drop policy if exists "dqp obj delete" on storage.objects;
create policy "dqp obj read" on storage.objects for select to authenticated using(bucket_id='dqp' and (owner=auth.uid() or is_admin()));
create policy "dqp obj insert" on storage.objects for insert to authenticated with check(bucket_id='dqp' and is_approved());
create policy "dqp obj delete" on storage.objects for delete to authenticated using(bucket_id='dqp' and (owner=auth.uid() or is_admin()));

create or replace function public.dq_ping(p_code text) returns void language plpgsql security definer set search_path=public as $$ declare d date:=(now() at time zone 'Europe/Moscow')::date; begin if auth.uid() is null or not is_approved() then return; end if; if p_code not in('rot','pet','wtodo') then raise exception 'неизвестное задание'; end if; insert into daily_quests(user_id,day,code) values(auth.uid(),d,p_code) on conflict do nothing; end $$;
grant execute on function public.dq_ping(text) to authenticated;

create or replace function public.dq_photo_submit(p_path text) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'Europe/Moscow')::date;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if exists(select 1 from dq_photos where user_id=u and day=d and status in('approved','pending')) then return; end if;
  if not exists(select 1 from storage.objects where bucket_id='dqp' and name=p_path and owner=u) then raise exception 'Фото не загрузилось, попробуй ещё раз'; end if;
  insert into dq_photos(user_id,day,path) values(u,d,p_path);
end $$;
grant execute on function public.dq_photo_submit(text) to authenticated;

create or replace function public.dq_photo_review(p_id bigint, p_ok boolean) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_admin() then raise exception 'только администратор'; end if;
  update dq_photos set status=case when p_ok then 'approved' else 'rejected' end where id=p_id and status='pending';
end $$;
grant execute on function public.dq_photo_review(bigint,boolean) to authenticated;

create or replace function public.dq_status() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'Europe/Moscow')::date; r text[]:='{}'; rest boolean; ph text; pend jsonb:='[]';
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  rest:=exists(select 1 from marks where user_id=u and day=d);
  if exists(select 1 from thanks where from_user=u and (created_at at time zone 'Europe/Moscow')::date=d) then r:=r||'thx'; end if;
  if rest then
    if exists(select 1 from habit_logs where user_id=u and day=d) then r:=r||'whab'; end if;
    if exists(select 1 from dq_photos where user_id=u and day=d and status='approved') then r:=r||'wphoto'; end if;
    select status into ph from dq_photos where user_id=u and day=d order by (status='approved') desc,(status='pending') desc,id desc limit 1;
    r:=r||coalesce((select array_agg(code) from daily_quests where user_id=u and day=d and code in('wtodo','pet')),'{}');
  else
    if exists(select 1 from shift_checks where user_id=u and day=d) then r:=r||'chk'; end if;
    if exists(select 1 from checkins where user_id=u and day=d) then r:=r||'ck'; end if;
    r:=r||coalesce((select array_agg(code) from daily_quests where user_id=u and day=d and code in('rot','pet')),'{}');
  end if;
  if is_admin() then
    pend:=coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',p.full_name,'path',x.path) order by x.id) from dq_photos x join profiles p on p.id=x.user_id where x.status='pending'),'[]'::jsonb);
  end if;
  return jsonb_build_object('mode',case when rest then 'rest' else 'work' end,'done',to_jsonb(r),'claimed',exists(select 1 from daily_quests where user_id=u and day=d and code='claim'),'photo',ph,'pend',pend);
end $$;
grant execute on function public.dq_status() to authenticated;

create or replace function public.dq_claim() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'Europe/Moscow')::date; s jsonb; n int; e int; st gacha_state;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  s:=dq_status();
  if s->>'mode'='rest' then
    select count(*) into n from jsonb_array_elements_text(s->'done') x where x in('wtodo','whab','wphoto','thx','pet');
  else
    select count(*) into n from jsonb_array_elements_text(s->'done') x where x in('chk','ck','thx','rot','pet');
  end if;
  if n<5 then raise exception 'Выполнены не все задания'; end if;
  insert into daily_quests(user_id,day,code) values(u,d,'claim') on conflict do nothing;
  if not found then return jsonb_build_object('again',true); end if;
  insert into gacha_state(user_id,spent) values(u,-4) on conflict(user_id) do update set spent=gacha_state.spent-4;
  select * into st from gacha_state where user_id=u; e:=gacha_earned(u);
  return jsonb_build_object('gain',4,'tickets',greatest(0,e-st.spent));
end $$;
grant execute on function public.dq_claim() to authenticated;
select 'ok';
