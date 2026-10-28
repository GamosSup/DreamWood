-- 1) Таня Мехрякова: одобрить, офис-менеджер, руководитель, график 5/2 (вых. сб, вс) 9:00-18:00, питомец, статус, уровень
do $$
declare t uuid; n int; tn text; rid bigint;
begin
  select id into t from profiles where full_name ilike '%Мехряков%' order by created_at desc limit 1;
  if t is null then raise exception 'Профиль Тани не найден'; end if;
  select tab_no into tn from profiles where id=t;
  if tn is null or tn='' then
    select coalesce(max(tab_no::int) filter (where tab_no ~ '^\d+$' and tab_no::int<>67),0)+1 into n from profiles;
    if n=67 then n:=68; end if; tn:=n::text;
  end if;
  perform set_config('dw.role_ok','1',true);
  update profiles set status='approved', tab_no=tn, role='manager', position='Офис-менеджер', team=null, day_len=9, lvl_text='Выше этого',
    cos=coalesce(cos,'{}'::jsonb)||jsonb_build_object('pet','sp=cat;bc=c_gy;ha=h_reports','title','spec:cardinal') where id=t;
  select id into rid from roster where profile_id=t limit 1;
  if rid is null then
    insert into roster(full_name,team,profile_id,pre_role,pre_position,day_len) values('Мехрякова Т.',null,t,'manager','Офис-менеджер',9) returning id into rid;
  else update roster set team=null,pre_role='manager',pre_position='Офис-менеджер',day_len=9 where id=rid; end if;
  insert into marks(user_id,day,kind,note)
    select t,d::date,'off','выходной 5/2' from generate_series(current_date,'2026-12-31'::date,'1 day') d where extract(dow from d) in(0,6)
    on conflict(user_id,day) do nothing;
  insert into user_ach(user_id,code,label,bonus) values(t,'spec:pet_tanya','Кот «Отчёт»',0),(t,'spec:cardinal','Серый кардинал',0) on conflict do nothing;
  insert into notifications(kind,title,body,link,to_user) values('ach','🎁 Тебе подарили питомца','Серый кот с горящими отчётами, статус «Серый кардинал» и уровень «Выше этого». Открой «Мой питомец».','game',t);
end $$;
-- 2) Подарки Насте (Лефенцова Анастасия): лама-таксист, «Легенда», «Как же она хороша», 100 билетов
do $$
declare u uuid:='8591cabe-35ed-4002-986e-f9905f83f5de';
begin
  if not exists(select 1 from profiles where id=u and status='approved') then raise exception 'Профиль Насти не найден'; end if;
  if exists(select 1 from user_ach where user_id=u and code='spec:taxi') then return; end if;
  insert into user_ach(user_id,code,label,bonus) values(u,'spec:taxi','Лама-таксист',0),(u,'spec:legend','Легенда',0) on conflict do nothing;
  update profiles set lvl_text='Как же она хороша', cos=coalesce(cos,'{}'::jsonb)||jsonb_build_object('pet','sp=llama;bc=c_gi;ha=h_taxi','title','spec:legend') where id=u;
  insert into gacha_state(user_id,spent) values(u,-98) on conflict(user_id) do update set spent=gacha_state.spent-98;
  insert into notifications(kind,title,body,link,to_user) values('system','💛 Это специально для тебя','Игорь тебя обожает. Пусть эти два дня будут самыми спокойными и лучшими! В подарок: лама-таксист, статус «Легенда» и 100 тикетов на крутку.','game',u);
end $$;
-- 3) Команда «Руководство» (team = null): Настя тоже туда
update profiles set team=null where id='8591cabe-35ed-4002-986e-f9905f83f5de';
update roster set team=null where profile_id='8591cabe-35ed-4002-986e-f9905f83f5de';
select 'ok';
