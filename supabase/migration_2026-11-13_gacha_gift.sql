-- Автомат: передача билетов коллегам.
create table if not exists public.gacha_gifts(
  id bigint generated always as identity primary key,
  from_user uuid not null references public.profiles on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  n int not null check(n>0), req uuid, at timestamptz not null default now());
create unique index if not exists gacha_gifts_req on public.gacha_gifts(from_user,req) where req is not null;
alter table public.gacha_gifts enable row level security;
drop policy if exists "gacha gifts read" on public.gacha_gifts;
create policy "gacha gifts read" on public.gacha_gifts for select to authenticated using(from_user=auth.uid() or to_user=auth.uid() or is_manager());

create or replace function public.gacha_gift(p_to uuid, p_n int, p_req uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; e int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_req is null then raise exception 'Обнови приложение: закрой его полностью и открой заново'; end if;
  if p_to is null or p_to=u then raise exception 'Выбери коллегу'; end if;
  if p_n is null or p_n<1 or p_n>1000 then raise exception 'Укажи число билетов от 1'; end if;
  if not exists(select 1 from profiles where id=p_to and status='approved') then raise exception 'Такого сотрудника нет'; end if;
  insert into gacha_state(user_id) values(u),(p_to) on conflict do nothing;
  perform 1 from gacha_state where user_id in(u,p_to) order by user_id for update;
  select * into st from gacha_state where user_id=u;
  if exists(select 1 from gacha_gifts where from_user=u and req=p_req) then
    return jsonb_build_object('tickets',greatest(0,gacha_earned(u)-st.spent),'again',true);
  end if;
  e:=gacha_earned(u);
  if e-st.spent<p_n then raise exception 'Не хватает билетов: у тебя %', greatest(0,e-st.spent); end if;
  update gacha_state set spent=spent+p_n where user_id=u returning * into st;
  update gacha_state set spent=spent-p_n where user_id=p_to;
  insert into gacha_gifts(from_user,to_user,n,req) values(u,p_to,p_n,p_req);
  return jsonb_build_object('tickets',greatest(0,e-st.spent),'gave',p_n);
end $$;
grant execute on function public.gacha_gift(uuid,int,uuid) to authenticated;

-- gacha_info: добавлен список последних переданных билетов
create or replace function public.gacha_info() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; d gacha_daily; e int; today date:=(now() at time zone 'Europe/Moscow')::date; rec jsonb; gf jsonb;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  insert into gacha_daily(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u;
  select * into d from gacha_daily where user_id=u;
  e:=gacha_earned(u);
  select coalesce(jsonb_agg(jsonb_build_object('code',code,'rarity',rarity,'dup',dup,'gold',gold) order by at desc),'[]'::jsonb) into rec from (select * from gacha_log where user_id=u order by at desc limit 8) x;
  select coalesce(jsonb_agg(jsonb_build_object('from',(select full_name from profiles where id=g.from_user),'to',(select full_name from profiles where id=g.to_user),'n',g.n,'in',g.to_user=u,'at',g.at) order by g.at desc),'[]'::jsonb) into gf
    from (select * from gacha_gifts where (from_user=u or to_user=u) and at>now()-interval '14 days' order by at desc limit 6) g;
  return jsonb_build_object('tickets',greatest(0,e-st.spent),'pity',st.pity,'pulls',st.pulls,'gold',d.gold,
    'streak',case when d.last_day is not null and d.last_day>=today-1 then d.streak else 0 end,
    'claimed',coalesce(d.last_day=today,false),'recent',rec,'gifts',gf);
end $$;
grant execute on function public.gacha_info() to authenticated;
