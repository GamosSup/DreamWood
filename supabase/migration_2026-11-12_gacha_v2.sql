-- Автомат v2: крутка с номером запроса (повтор не списывает билет второй раз), без монет, ежедневные награды, золотой билет.
alter table public.gacha_log add column if not exists req uuid, add column if not exists gain int not null default 0, add column if not exists gold boolean not null default false;
create unique index if not exists gacha_log_req on public.gacha_log(user_id,req) where req is not null;

create table if not exists public.gacha_daily(
  user_id uuid primary key references public.profiles on delete cascade,
  streak int not null default 0, last_day date, gold int not null default 0, best int not null default 0);
alter table public.gacha_daily enable row level security;
drop policy if exists "gacha daily read" on public.gacha_daily;
create policy "gacha daily read" on public.gacha_daily for select to authenticated using(user_id=auth.uid());

drop function if exists public.gacha_pull();
drop function if exists public.gacha_buy(text);

create or replace function public.gacha_info() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; d gacha_daily; e int; today date:=(now() at time zone 'Europe/Moscow')::date; rec jsonb;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  insert into gacha_daily(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u;
  select * into d from gacha_daily where user_id=u;
  e:=gacha_earned(u);
  select coalesce(jsonb_agg(jsonb_build_object('code',code,'rarity',rarity,'dup',dup,'gold',gold) order by at desc),'[]'::jsonb) into rec
    from (select * from gacha_log where user_id=u order by at desc limit 8) x;
  return jsonb_build_object('tickets',greatest(0,e-st.spent),'pity',st.pity,'pulls',st.pulls,'gold',d.gold,
    'streak',case when d.last_day is not null and d.last_day>=today-1 then d.streak else 0 end,
    'claimed',coalesce(d.last_day=today,false),'recent',rec);
end $$;
grant execute on function public.gacha_info() to authenticated;

-- ежедневная награда: дни 1..7 дают 1,1,2,2,3,3,2 билета, на 7-й ещё золотой; пропуск дня начинает серию заново
create or replace function public.gacha_daily_claim() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d gacha_daily; today date:=(now() at time zone 'Europe/Moscow')::date; n int; pos int; tk int; gd int:=0; rw int[]:=array[1,1,2,2,3,3,2];
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_daily(user_id) values(u) on conflict do nothing;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  select * into d from gacha_daily where user_id=u for update;
  if d.last_day=today then return jsonb_build_object('claimed',false,'streak',d.streak,'pos',((d.streak-1)%7)+1); end if;
  n:=case when d.last_day=today-1 then d.streak+1 else 1 end;
  pos:=((n-1)%7)+1; tk:=rw[pos]; if pos=7 then gd:=1; end if;
  update gacha_daily set streak=n,last_day=today,gold=gold+gd,best=greatest(best,n) where user_id=u;
  update gacha_state set spent=spent-tk where user_id=u;
  return jsonb_build_object('claimed',true,'streak',n,'pos',pos,'tickets_gain',tk,'gold_gain',gd);
end $$;
grant execute on function public.gacha_daily_claim() to authenticated;

-- крутка. p_req — номер запроса от приложения: повторный запрос с тем же номером возвращает прежний результат и ничего не списывает.
-- p_gold — золотая крутка (тратит золотой билет): эпическая 45%, мифическая 30%, легендарная 24%, тайна 1%.
create or replace function public.gacha_pull(p_req uuid default null, p_gold boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; d gacha_daily; lg gacha_log; e int; roll numeric; r int; c text; dup boolean; gain int:=0;
  w numeric[]; tot numeric; acc numeric:=0; i int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  insert into gacha_daily(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u for update;
  select * into d from gacha_daily where user_id=u for update;
  e:=gacha_earned(u);
  if p_req is not null then
    select * into lg from gacha_log where user_id=u and req=p_req;
    if found then
      return jsonb_build_object('code',lg.code,'rarity',lg.rarity,'dup',lg.dup,'gain',lg.gain,'gold',lg.gold,'tickets',greatest(0,e-st.spent),'gold_left',d.gold,'pity',st.pity);
    end if;
  end if;
  if p_gold then
    if d.gold<=0 then raise exception 'Нет золотых билетов'; end if;
    w:=array[0,0,45,30,24,1];
  else
    if e-st.spent<=0 then raise exception 'Нет билетов'; end if;
    w:=array[50,32,12,4,1.9,0.1];
    if st.pity>=9 then w[1]:=0; end if;
  end if;
  select sum(x) into tot from unnest(w) x;
  roll:=random()*tot; r:=6;
  for i in 1..6 loop
    acc:=acc+w[i];
    if w[i]>0 and roll<acc then r:=i; exit; end if;
  end loop;
  select code into c from gacha_items where rarity=r order by random() limit 1;
  if c is null then raise exception 'Автомат пуст'; end if;
  dup:=exists(select 1 from user_ach where user_id=u and code='gx:'||c);
  if dup then gain:=(array[0,1,1,2,3,5])[r];   -- дубль возвращает билеты
  else insert into user_ach(user_id,code,label,bonus) values(u,'gx:'||c,null,0) on conflict do nothing; end if;
  update gacha_state set spent=spent+(case when p_gold then 0 else 1 end)-gain, pulls=pulls+1,
    pity=case when p_gold then pity when r>=2 then 0 else pity+1 end where user_id=u returning * into st;
  if p_gold then update gacha_daily set gold=gold-1 where user_id=u returning * into d; end if;
  insert into gacha_log(user_id,code,rarity,dup,req,gain,gold) values(u,c,r,dup,p_req,gain,p_gold);
  return jsonb_build_object('code',c,'rarity',r,'dup',dup,'gain',gain,'gold',p_gold,'tickets',greatest(0,e-st.spent),'gold_left',d.gold,'pity',st.pity);
end $$;
grant execute on function public.gacha_pull(uuid,boolean) to authenticated;

-- монеты убраны; всем сотрудникам минимум 10 билетов (компенсация за сбои)
insert into public.gacha_state(user_id) select id from public.profiles where status='approved' on conflict do nothing;
update public.gacha_state set coins=0 where coins<>0;
update public.gacha_state s set spent=public.gacha_earned(s.user_id)-10
 where s.user_id in (select id from public.profiles where status='approved') and public.gacha_earned(s.user_id)-s.spent<10;

insert into public.notifications(kind,title,body,link)
select 'ach','🎟 Ежедневные награды в автомате','Заходи каждый день и забирай билеты: за 7 дней подряд получишь золотой билет с повышенным шансом на мифическую и легендарную вещь. Ещё мы починили автомат и всем доначислили билетов, минимум 10. Монеты убрали: дубли теперь возвращают билеты.','game'
where not exists(select 1 from public.notifications where title like '🎟 Ежедневные награды%');

select (select count(*) from public.gacha_items) as items,
  (select min(greatest(0,public.gacha_earned(p.id)-coalesce(s.spent,0))) from public.profiles p left join public.gacha_state s on s.user_id=p.id where p.status='approved') as min_tickets,
  (select count(*) from public.notifications where title like '🎟 Ежедневные%') as notif;
