-- Исправление ежедневных заданий и общие статусы аттракционов.
-- Безопасно запускать повторно.

-- В text[] одиночные значения добавляем через array_append: r || 'thx' вызывает 22P02.
create or replace function public.dq_status() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'Europe/Moscow')::date; r text[]:='{}'; rest boolean; ph text; pend jsonb:='[]';
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  rest:=exists(select 1 from marks where user_id=u and day=d);
  if exists(select 1 from thanks where from_user=u and (created_at at time zone 'Europe/Moscow')::date=d) then r:=array_append(r,'thx'); end if;
  if rest then
    if exists(select 1 from habit_logs where user_id=u and day=d) then r:=array_append(r,'whab'); end if;
    if exists(select 1 from dq_photos where user_id=u and day=d and status='approved') then r:=array_append(r,'wphoto'); end if;
    select status into ph from dq_photos where user_id=u and day=d order by (status='approved') desc,(status='pending') desc,id desc limit 1;
    r:=r||coalesce((select array_agg(code) from daily_quests where user_id=u and day=d and code in('wtodo','pet')),'{}');
  else
    if exists(select 1 from shift_checks where user_id=u and day=d) then r:=array_append(r,'chk'); end if;
    if exists(select 1 from checkins where user_id=u and day=d) then r:=array_append(r,'ck'); end if;
    r:=r||coalesce((select array_agg(code) from daily_quests where user_id=u and day=d and code in('rot','pet')),'{}');
  end if;
  if is_admin() then
    pend:=coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'name',p.full_name,'path',x.path) order by x.id) from dq_photos x join profiles p on p.id=x.user_id where x.status='pending'),'[]'::jsonb);
  end if;
  return jsonb_build_object('mode',case when rest then 'rest' else 'work' end,'done',to_jsonb(r),'claimed',exists(select 1 from daily_quests where user_id=u and day=d and code='claim'),'photo',ph,'pend',pend);
end $$;
grant execute on function public.dq_status() to authenticated;

-- Одна строка на аттракцион, маршрут или дорожку. Отсутствие строки = работает.
create table if not exists public.attraction_status(
  entity text primary key,
  is_open boolean not null default true,
  reason_code text,
  reason_text text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.attraction_status enable row level security;
drop policy if exists "attraction status read" on public.attraction_status;
create policy "attraction status read" on public.attraction_status for select to authenticated using(is_approved());
grant select on public.attraction_status to authenticated;

create or replace function public.attraction_set(
  p_entity text,
  p_is_open boolean,
  p_reason_code text default null,
  p_reason_text text default null
) returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); reason text:=trim(coalesce(p_reason_text,''));
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if trim(coalesce(p_entity,''))='' or length(p_entity)>160 then raise exception 'некорректный аттракцион'; end if;
  if p_is_open is null then raise exception 'некорректный статус'; end if;
  if not p_is_open then
    if p_reason_code is null or p_reason_code not in('rain','wind','storm','cold','breakdown','maintenance','cleaning','other') then raise exception 'выбери причину'; end if;
    if reason='' then raise exception 'укажи причину простоя'; end if;
    if length(reason)>500 then raise exception 'причина слишком длинная'; end if;
  else
    p_reason_code:=null; reason:=null;
  end if;
  insert into attraction_status(entity,is_open,reason_code,reason_text,updated_by,updated_at)
  values(p_entity,p_is_open,p_reason_code,reason,u,now())
  on conflict(entity) do update set is_open=excluded.is_open,reason_code=excluded.reason_code,reason_text=excluded.reason_text,updated_by=excluded.updated_by,updated_at=now();
end $$;
grant execute on function public.attraction_set(text,boolean,text,text) to authenticated;

select 'ok';
