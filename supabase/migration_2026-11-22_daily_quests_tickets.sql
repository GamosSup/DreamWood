-- Ежедневные задания (5 штук, за все 5 — 4 билета на крутку) + разовый подарок: всем по 30 билетов.
create table if not exists public.daily_quests(
  user_id uuid not null references public.profiles on delete cascade,
  day date not null, code text not null,
  at timestamptz not null default now(),
  primary key(user_id,day,code));
alter table public.daily_quests enable row level security;
drop policy if exists "dq read" on public.daily_quests;
create policy "dq read" on public.daily_quests for select to authenticated using(user_id=auth.uid());

-- два задания отмечаются самим приложением (открыл ротацию, зашёл в свой профиль)
create or replace function public.dq_ping(p_code text) returns void language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date;
begin
  if auth.uid() is null or not is_approved() then return; end if;
  if p_code not in('rot','pet') then raise exception 'неизвестное задание'; end if;
  insert into daily_quests(user_id,day,code) values(auth.uid(),d,p_code) on conflict do nothing;
end $$;
grant execute on function public.dq_ping(text) to authenticated;

-- что выполнено сегодня: чек-лист, выход на смену (или выходной), спасибо коллеге — считаем по данным, остальное — по пингам
create or replace function public.dq_status() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'Europe/Moscow')::date; r text[]:='{}';
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if exists(select 1 from shift_checks where user_id=u and day=d) then r:=r||'chk'; end if;
  if exists(select 1 from checkins where user_id=u and day=d) or exists(select 1 from marks where user_id=u and day=d) then r:=r||'ck'; end if;
  if exists(select 1 from thanks where from_user=u and (created_at at time zone 'Europe/Moscow')::date=d) then r:=r||'thx'; end if;
  r:=r||coalesce((select array_agg(code) from daily_quests where user_id=u and day=d and code in('rot','pet')),'{}');
  return jsonb_build_object('done',to_jsonb(r),'claimed',exists(select 1 from daily_quests where user_id=u and day=d and code='claim'));
end $$;
grant execute on function public.dq_status() to authenticated;

-- награда за все пять: 4 билета (один раз в день)
create or replace function public.dq_claim() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'Europe/Moscow')::date; s jsonb; n int; e int; st gacha_state;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  s:=dq_status();
  select count(*) into n from jsonb_array_elements_text(s->'done') x where x in('chk','ck','thx','rot','pet');
  if n<5 then raise exception 'Выполнены не все задания'; end if;
  insert into daily_quests(user_id,day,code) values(u,d,'claim') on conflict do nothing;
  if not found then return jsonb_build_object('again',true); end if;
  insert into gacha_state(user_id,spent) values(u,-4) on conflict(user_id) do update set spent=gacha_state.spent-4;
  select * into st from gacha_state where user_id=u; e:=gacha_earned(u);
  return jsonb_build_object('gain',4,'tickets',greatest(0,e-st.spent));
end $$;
grant execute on function public.dq_claim() to authenticated;

-- подарок: всем одобренным по 30 билетов (один раз)
do $$ begin
  if not exists(select 1 from notifications where title like '🎟 Подарок: 30 билетов%') then
    insert into gacha_state(user_id,spent) select id,-30 from profiles where status='approved' on conflict(user_id) do update set spent=gacha_state.spent-30;
    insert into notifications(kind,title,body,link) values('ach','🎟 Подарок: 30 билетов на крутку','Всем по 30 билетов в автомат. А ещё появились ежедневные задания: выполни все пять и получи ещё 4 билета.','game');
  end if;
end $$;
select 'ok';
