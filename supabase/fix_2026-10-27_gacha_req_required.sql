-- Старые версии приложения крутили без номера запроса и списывали по 2 билета: теперь такая крутка отклоняется.
create or replace function public.gacha_pull(p_req uuid default null, p_gold boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; d gacha_daily; lg gacha_log; e int; roll numeric; r int; c text; dup boolean; gain int:=0;
  w numeric[]; tot numeric; acc numeric:=0; i int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_req is null then raise exception 'Приложение обновилось: закрой его полностью и открой заново'; end if;
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
