-- Автомат: защита от двойной крутки (две крутки в одну миллисекунду списывали 2 билета) + подарок 5 билетов всем сотрудникам.
create or replace function public.gacha_pull() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); st gacha_state; e int; roll numeric; r int; c text; dup boolean; gain int:=0;
  w numeric[]:=array[50,32,12,4,1.9,0.1]; tot numeric; acc numeric:=0; i int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into gacha_state(user_id) values(u) on conflict do nothing;
  select * into st from gacha_state where user_id=u for update;
  if exists(select 1 from gacha_log where user_id=u and at>now()-interval '1 second') then raise exception 'Не так быстро'; end if;
  e:=gacha_earned(u);
  if e-st.spent<=0 then raise exception 'Нет билетов'; end if;
  tot:=case when st.pity>=9 then 50 else 100 end;
  roll:=random()*tot; r:=6;
  for i in case when st.pity>=9 then 2 else 1 end..6 loop
    acc:=acc+w[i];
    if roll<acc then r:=i; exit; end if;
  end loop;
  select code into c from gacha_items where rarity=r order by random() limit 1;
  if c is null then raise exception 'Автомат пуст'; end if;
  dup:=exists(select 1 from user_ach where user_id=u and code='gx:'||c);
  if dup then gain:=(array[1,2,5,10,25,100])[r];
  else insert into user_ach(user_id,code,label,bonus) values(u,'gx:'||c,null,0) on conflict do nothing; end if;
  update gacha_state set spent=spent+1,pulls=pulls+1,coins=coins+gain,pity=case when r>=2 then 0 else pity+1 end where user_id=u returning * into st;
  insert into gacha_log(user_id,code,rarity,dup) values(u,c,r,dup);
  return jsonb_build_object('code',c,'rarity',r,'dup',dup,'gain',gain,'tickets',greatest(0,e-st.spent),'coins',st.coins,'pity',st.pity);
end $$;
grant execute on function public.gacha_pull() to authenticated;

-- 5 билетов каждому одобренному сотруднику (один раз: отметка в gacha_log не нужна, запускать однократно)
insert into public.gacha_state(user_id,spent)
select id,-5 from public.profiles where status='approved'
on conflict(user_id) do update set spent=public.gacha_state.spent-5;

select count(*) as granted from public.profiles where status='approved';
