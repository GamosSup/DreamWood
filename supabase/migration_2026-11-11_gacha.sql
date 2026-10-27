-- Автомат с шариками: билеты, шансы, монеты, обмен.
-- Билет: по одному за каждое достижение (кроме выпавших из автомата) и по одному за каждые полчаса доработки/переработки; считается из данных, поэтому прошлое засчитано.
-- Предмет, который выпал, хранится как достижение с кодом 'gx:<код>' (опыт не даёт). Дубль даёт монеты; монетами можно купить любую вещь, кроме «Тайны хранителя».
create table if not exists public.gacha_items(code text primary key, rarity int not null check(rarity between 1 and 6));
create table if not exists public.gacha_state(
  user_id uuid primary key references public.profiles on delete cascade,
  spent int not null default 0, pulls int not null default 0, pity int not null default 0, coins int not null default 0);
create table if not exists public.gacha_log(
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  code text not null, rarity int not null, dup boolean not null, at timestamptz not null default now());
alter table public.gacha_items enable row level security;
alter table public.gacha_state enable row level security;
alter table public.gacha_log enable row level security;
drop policy if exists "gacha items read" on public.gacha_items; create policy "gacha items read" on public.gacha_items for select to authenticated using(true);
drop policy if exists "gacha state read" on public.gacha_state; create policy "gacha state read" on public.gacha_state for select to authenticated using(user_id=auth.uid());
drop policy if exists "gacha log read" on public.gacha_log; create policy "gacha log read" on public.gacha_log for select to authenticated using(user_id=auth.uid() or is_manager());
-- записывать напрямую нельзя: только функции ниже

insert into public.gacha_items(code,rarity) values
 ('c_mintg',1),
 ('c_lav',1),
 ('c_peach',1),
 ('c_teal',1),
 ('c_choc',1),
 ('c_lime',1),
 ('c_cream',1),
 ('c_graph',1),
 ('h_headph',1),
 ('h_chef',1),
 ('d_lolli',1),
 ('d_ice',1),
 ('n_mintc',1),
 ('n_coral',1),
 ('n_lilac',1),
 ('bg_peach',1),
 ('bg_mintbg',1),
 ('bg_lavbg',1),
 ('c_coral',2),
 ('c_indigo',2),
 ('c_rasp',2),
 ('h_ninja',2),
 ('h_halo',2),
 ('h_prop',2),
 ('n_bell',2),
 ('n_chain',2),
 ('b_butter',2),
 ('f_neon',2),
 ('f_candy',2),
 ('f_ice',2),
 ('n_sunset',2),
 ('n_ocean',2),
 ('bg_sakura',2),
 ('bg_snow',2),
 ('c_sunset',3),
 ('c_ocean',3),
 ('c_candy',3),
 ('h_tiara',3),
 ('h_astro',3),
 ('b_jet',3),
 ('g_vr',3),
 ('f_lava',3),
 ('f_sak',3),
 ('n_aur',3),
 ('bg_space',3),
 ('bg_arcade',3),
 ('c_galaxy',4),
 ('b_angel',4),
 ('f_circuit',4),
 ('f_pixel',4),
 ('n_neon',4),
 ('bg_aurora',4),
 ('h_crystal',5),
 ('f_royal',5),
 ('n_royal',5),
 ('c_goldsuit',6),
 ('c_ghost',6),
 ('f_rainbow',6),
 ('key',6),
 ('cm_d',6)
on conflict(code) do update set rarity=excluded.rarity;

-- сколько билетов заработано всего
create or replace function public.gacha_earned(u uuid) returns int language sql stable security definer set search_path=public as $$
  select (coalesce((select count(*) from user_ach where user_id=u and code not like 'gx:%'),0)
        + coalesce((select floor(sum(hours)*2) from overtime where user_id=u),0))::int $$;
revoke all on function public.gacha_earned(uuid) from public;

create or replace function public.gacha_info() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; e int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u;
  e:=gacha_earned(u);
  return jsonb_build_object('tickets',greatest(0,e-st.spent),'coins',st.coins,'pity',st.pity,'pulls',st.pulls);
end $$;
grant execute on function public.gacha_info() to authenticated;

-- крутка: шансы 50 / 32 / 12 / 4 / 1,9 / 0,1 %; каждая 10-я крутка без «обычной» (гарантия редкого и выше; «Тайна» шанс не меняет)
create or replace function public.gacha_pull() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; e int; roll numeric; r int; c text; dup boolean; gain int:=0;
  w numeric[]:=array[50,32,12,4,1.9,0.1]; tot numeric; acc numeric:=0; i int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u for update;
  e:=gacha_earned(u);
  if e-st.spent<=0 then raise exception 'Нет билетов'; end if;
  tot:=case when st.pity>=9 then 50 else 100 end; -- при гарантии «обычные» (50%) исключаются
  roll:=random()*tot; r:=6;
  for i in case when st.pity>=9 then 2 else 1 end..6 loop
    acc:=acc+w[i];
    if roll<acc then r:=i; exit; end if;
  end loop;
  select code into c from gacha_items where rarity=r order by random() limit 1;
  if c is null then raise exception 'Автомат пуст'; end if;
  dup:=exists(select 1 from user_ach where user_id=u and code='gx:'||c);
  if dup then
    gain:=(array[1,2,5,10,25,100])[r];
  else
    insert into user_ach(user_id,code,label,bonus) values(u,'gx:'||c,null,0) on conflict do nothing;
  end if;
  update gacha_state set spent=spent+1,pulls=pulls+1,coins=coins+gain,pity=case when r>=2 then 0 else pity+1 end where user_id=u returning * into st;
  insert into gacha_log(user_id,code,rarity,dup) values(u,c,r,dup);
  return jsonb_build_object('code',c,'rarity',r,'dup',dup,'gain',gain,'tickets',greatest(0,e-st.spent),'coins',st.coins,'pity',st.pity);
end $$;
grant execute on function public.gacha_pull() to authenticated;

-- обмен монет на вещь (кроме «Тайны хранителя»)
create or replace function public.gacha_buy(p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; r int; price int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  select rarity into r from gacha_items where code=p_code;
  if r is null then raise exception 'Такой вещи нет'; end if;
  if r=6 then raise exception 'Эту вещь можно только выиграть в автомате'; end if;
  if exists(select 1 from user_ach where user_id=u and code='gx:'||p_code) then raise exception 'Уже есть'; end if;
  price:=(array[5,10,25,50,100])[r];
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u for update;
  if st.coins<price then raise exception 'Не хватает монет: нужно %', price; end if;
  update gacha_state set coins=coins-price where user_id=u returning * into st;
  insert into user_ach(user_id,code,label,bonus) values(u,'gx:'||p_code,null,0) on conflict do nothing;
  return jsonb_build_object('tickets',greatest(0,gacha_earned(u)-st.spent),'coins',st.coins,'pity',st.pity,'pulls',st.pulls);
end $$;
grant execute on function public.gacha_buy(text) to authenticated;
