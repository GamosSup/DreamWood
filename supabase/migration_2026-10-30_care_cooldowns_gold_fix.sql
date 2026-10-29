-- Независимые 15-минутные перерывы заботы и исправление завершения «Золотого лотка».
alter table public.pet_game
  add column if not exists feed_at timestamptz,
  add column if not exists wash_at timestamptz,
  add column if not exists play_at timestamptz;

create or replace function public.pet_game_status() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); g pet_game; e int; mins int; today date:=(now() at time zone 'Europe/Moscow')::date;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  insert into pet_game(user_id) values(u) on conflict do nothing;
  select * into g from pet_game where user_id=u for update;
  mins:=greatest(0,least(2880,floor(extract(epoch from now()-g.updated_at)/60)))::int;
  e:=case when g.energy>=5 then 0 else least(5-g.energy,floor(extract(epoch from now()-g.energy_at)/1200)::int) end;
  update pet_game set
    hunger=greatest(0,g.hunger-mins/30),hygiene=greatest(0,g.hygiene-mins/45),mood=greatest(0,g.mood-mins/40),
    energy=g.energy+e,energy_at=case when g.energy>=5 then now() when e>0 then g.energy_at+make_interval(mins=>e*20) else g.energy_at end,
    care_day=today,care_actions=case when g.care_day<today then 0 else g.care_actions end,updated_at=now()
    where user_id=u returning * into g;
  return jsonb_build_object(
    'hunger',g.hunger,'hygiene',g.hygiene,'mood',g.mood,
    'care_xp',g.care_xp,'care_level',pet_care_level(g.care_xp),'care_next',power(pet_care_level(g.care_xp),2)*40,
    'care_actions',least(g.care_actions,9),'gold_xp',g.gold_xp,'gold_level',gold_level(g.gold_xp),
    'gold_next',power(gold_level(g.gold_xp),2)*120,'energy',g.energy,'energy_max',5,
    'energy_in',case when g.energy>=5 then 0 else greatest(0,1200-floor(extract(epoch from now()-g.energy_at))::int) end,
    'games',g.games,'best',g.best,'gems',g.gems,'ach',to_jsonb(g.ach),
    'care_bonus',least(10,(pet_care_level(g.care_xp)-1)*2),
    'cooldowns',jsonb_build_object(
      'feed',coalesce(greatest(0,900-floor(extract(epoch from now()-g.feed_at))::int),0),
      'wash',coalesce(greatest(0,900-floor(extract(epoch from now()-g.wash_at))::int),0),
      'play',coalesce(greatest(0,900-floor(extract(epoch from now()-g.play_at))::int),0)),
    'event',gold_event(today),
    'tickets',greatest(0,gacha_earned(u)-coalesce((select spent from gacha_state where user_id=u),0)));
end $$;
grant execute on function public.pet_game_status() to authenticated;

create or replace function public.pet_care_action(p_action text) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); g pet_game; old int; new int; gain int; reward int:=0; a text[]; fresh text[]:='{}';
  last_at timestamptz; wait_sec int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_action not in('feed','wash','play') then raise exception 'Неизвестное действие'; end if;
  perform pet_game_status();
  select * into g from pet_game where user_id=u for update;
  last_at:=case when p_action='feed' then g.feed_at when p_action='wash' then g.wash_at else g.play_at end;
  wait_sec:=coalesce(greatest(0,900-floor(extract(epoch from now()-last_at))::int),0);
  if wait_sec>0 then raise exception 'Это действие будет снова доступно через % мин. % сек.',ceil(wait_sec/60.0)::int,wait_sec%60; end if;
  old:=pet_care_level(g.care_xp);gain:=case when g.care_actions<9 then 8 else 0 end;
  update pet_game set
    hunger=case when p_action='feed' then least(100,g.hunger+22) when p_action='play' then greatest(0,g.hunger-5) else g.hunger end,
    hygiene=case when p_action='wash' then least(100,g.hygiene+28) when p_action='play' then greatest(0,g.hygiene-5) when p_action='feed' then greatest(0,g.hygiene-2) else g.hygiene end,
    mood=case when p_action='play' then least(100,g.mood+24) when p_action='wash' then least(100,g.mood+3) else least(100,g.mood+4) end,
    feed_at=case when p_action='feed' then now() else g.feed_at end,
    wash_at=case when p_action='wash' then now() else g.wash_at end,
    play_at=case when p_action='play' then now() else g.play_at end,
    care_xp=g.care_xp+gain,care_actions=g.care_actions+1,updated_at=now()
    where user_id=u returning * into g;
  new:=pet_care_level(g.care_xp);reward:=greatest(0,new-old);a:=g.ach;
  if not 'care:first'=any(a) then a:=array_append(a,'care:first');fresh:=array_append(fresh,'care:first');end if;
  if new>=2 and not 'care:level2'=any(a) then a:=array_append(a,'care:level2');fresh:=array_append(fresh,'care:level2');end if;
  if new>=3 and not 'care:level3'=any(a) then a:=array_append(a,'care:level3');fresh:=array_append(fresh,'care:level3');end if;
  update pet_game set ach=a where user_id=u;
  if reward>0 then
    insert into gacha_state(user_id,spent) values(u,-reward) on conflict(user_id) do update set spent=gacha_state.spent-reward;
    insert into notifications(kind,title,body,link,to_user) values('system','🐾 Новый уровень заботы','Питомец счастлив! Уровень '||new||', награда: +'||reward||' билет(а).','gold',u);
  end if;
  return pet_game_status()||jsonb_build_object('care_reward',reward,'care_old_level',old,'care_new_level',new,'care_gain',gain,'newach',to_jsonb(fresh));
end $$;
grant execute on function public.pet_care_action(text) to authenticated;

create or replace function public.gold_finish(p_run uuid,p_score int,p_gems jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); g pet_game; r gold_runs; old int; new int; result_score int; bonus int; reward int:=0;
  a text[];fresh text[]:='{}';k text;v text;n int;kinds int;l int;
  ev jsonb;event_code text;event_reward int:=0;event_count int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  perform pet_game_status();
  select * into r from gold_runs where id=p_run and user_id=u for update;
  if not found or r.finished_at is not null then raise exception 'Игра уже завершена или не найдена';end if;
  if now()-r.at<interval '20 seconds' then raise exception 'Игра ещё идёт';end if;
  select * into g from pet_game where user_id=u for update;
  bonus:=least(10,(pet_care_level(g.care_xp)-1)*2);
  result_score:=least(1000,greatest(0,round(greatest(0,coalesce(p_score,0))*(100+bonus)/100.0)))::int;
  old:=gold_level(g.gold_xp);new:=gold_level(g.gold_xp+result_score);
  update gold_runs set finished_at=now(),score=result_score where id=r.id;
  update pet_game set gold_xp=g.gold_xp+result_score,games=g.games+1,best=greatest(g.best,result_score),updated_at=now() where user_id=u returning * into g;
  if new>old then
    select coalesce(sum(least(3,(x+1)/2)),0) into reward from generate_series(old+1,new) x;
    insert into gacha_state(user_id,spent) values(u,-reward) on conflict(user_id) do update set spent=gacha_state.spent-reward;
    insert into notifications(kind,title,body,link,to_user) values('system','⛏️ Новый уровень старателя','Уровень '||new||', награда: +'||reward||' билет(а).','gold',u);
  end if;
  for k,v in select key,value from jsonb_each_text(coalesce(p_gems,'{}'::jsonb)) loop
    if k=any(array['quartz','aragonite','sodalite','red_agate','tiger_eye','topaz','aventurine','blue_agate','amethyst']) and v~'^[0-9]+$' then
      n:=least(50,greatest(0,v::int));g.gems:=jsonb_set(g.gems,array[k],to_jsonb(coalesce((g.gems->>k)::int,0)+n));
    end if;
  end loop;
  a:=g.ach;
  if g.gems<>'{}'::jsonb and not 'gold:first'=any(a) then a:=array_append(a,'gold:first');fresh:=array_append(fresh,'gold:first');end if;
  if result_score>=100 and not 'gold:score100'=any(a) then a:=array_append(a,'gold:score100');fresh:=array_append(fresh,'gold:score100');end if;
  if result_score>=300 and not 'gold:score300'=any(a) then a:=array_append(a,'gold:score300');fresh:=array_append(fresh,'gold:score300');end if;
  if g.games>=5 and not 'gold:games5'=any(a) then a:=array_append(a,'gold:games5');fresh:=array_append(fresh,'gold:games5');end if;
  select count(*) into kinds from jsonb_object_keys(g.gems) kk where (g.gems->>kk)::int>0;
  if kinds>=3 and not 'gold:collector3'=any(a) then a:=array_append(a,'gold:collector3');fresh:=array_append(fresh,'gold:collector3');end if;
  if kinds>=6 and not 'gold:collector6'=any(a) then a:=array_append(a,'gold:collector6');fresh:=array_append(fresh,'gold:collector6');end if;
  if kinds>=9 and not 'gold:collector9'=any(a) then a:=array_append(a,'gold:collector9');fresh:=array_append(fresh,'gold:collector9');end if;
  if new>old then for l in old+1..new loop
    k:='gold:level:'||l;if not k=any(a) then a:=array_append(a,k);fresh:=array_append(fresh,k);end if;
  end loop;end if;

  ev:=gold_event((now() at time zone 'Europe/Moscow')::date);
  event_code:='event:'||(ev->>'id');
  if coalesce(p_gems->>(ev->>'gem'),'0')~'^[0-9]+$'
     and (p_gems->>(ev->>'gem'))::int>0 and not event_code=any(a) then
    a:=array_append(a,event_code);event_reward:=2;
    insert into gacha_state(user_id,spent) values(u,-event_reward) on conflict(user_id) do update set spent=gacha_state.spent-event_reward;
    if not 'event:first'=any(a) then a:=array_append(a,'event:first');fresh:=array_append(fresh,'event:first');end if;
    select count(*) into event_count from unnest(a) code where code~'^event:[0-9]{4}-[0-9]{2}-[0-9]{2}:';
    if event_count>=5 and not 'event:5'=any(a) then a:=array_append(a,'event:5');fresh:=array_append(fresh,'event:5');end if;
    insert into notifications(kind,title,body,link,to_user) values('system','✨ Награда события','Редкая находка в событии «'||(ev->>'name')||'»: +2 билета.','gold',u);
  end if;
  update pet_game set gems=g.gems,ach=a where user_id=u;
  return pet_game_status()||jsonb_build_object('score',result_score,'base_score',greatest(0,coalesce(p_score,0)),'bonus',bonus,'reward',reward,'event_reward',event_reward,'event',ev,'old_level',old,'new_level',new,'newach',to_jsonb(fresh));
end $$;
grant execute on function public.gold_finish(uuid,int,jsonb) to authenticated;
