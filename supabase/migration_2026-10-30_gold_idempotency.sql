-- Защита «Золотого лотка» от двойного запуска и повторного завершения.
create or replace function public.gold_start() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); e int; run_id uuid; recent_id uuid;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  perform pet_game_status();
  select energy into e from pet_game where user_id=u for update;
  -- Блокировка pet_game сериализует параллельные вызовы: второй увидит запуск первого.
  select id into recent_id from gold_runs
    where user_id=u and finished_at is null and at>=now()-interval '45 seconds'
    order by at desc limit 1;
  if recent_id is not null then
    return jsonb_build_object('run',recent_id,'energy',e,'event',gold_event((now() at time zone 'Europe/Moscow')::date));
  end if;
  if e<1 then raise exception 'Энергия закончилась. Немного отдохни!';end if;
  update pet_game set energy=energy-1 where user_id=u;
  insert into gold_runs(user_id) values(u) returning gold_runs.id into run_id;
  return jsonb_build_object('run',run_id,'energy',e-1,'event',gold_event((now() at time zone 'Europe/Moscow')::date));
end $$;
grant execute on function public.gold_start() to authenticated;

create or replace function public.gold_finish(p_run uuid,p_score int,p_gems jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); g pet_game; r gold_runs; old int; new int; result_score int; bonus int; reward int:=0;
  a text[];fresh text[]:='{}';k text;v text;n int;kinds int;l int;
  ev jsonb;event_code text;event_reward int:=0;event_count int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  perform pet_game_status();
  select * into r from gold_runs where id=p_run and user_id=u for update;
  if not found then raise exception 'Игровой запуск не найден. Обнови страницу и попробуй ещё раз';end if;
  -- Повторный ответ не должен отменять уже сохранённый результат или выдавать награды дважды.
  if r.finished_at is not null then
    select * into g from pet_game where user_id=u;
    return pet_game_status()||jsonb_build_object(
      'score',coalesce(r.score,0),'base_score',coalesce(r.score,0),'bonus',0,
      'reward',0,'event_reward',0,'event',gold_event((now() at time zone 'Europe/Moscow')::date),
      'old_level',gold_level(g.gold_xp),'new_level',gold_level(g.gold_xp),'newach','[]'::jsonb);
  end if;
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
