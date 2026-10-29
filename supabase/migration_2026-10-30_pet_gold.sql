-- Тамагочи и «Золотой лоток»: забота, уровни, коллекция, энергия и серверные награды.
create table if not exists public.pet_game(
  user_id uuid primary key references public.profiles on delete cascade,
  hunger int not null default 82 check(hunger between 0 and 100),
  hygiene int not null default 80 check(hygiene between 0 and 100),
  mood int not null default 84 check(mood between 0 and 100),
  care_xp int not null default 0 check(care_xp>=0),
  gold_xp int not null default 0 check(gold_xp>=0),
  energy int not null default 5 check(energy between 0 and 5),
  energy_at timestamptz not null default now(),
  care_day date not null default (now() at time zone 'Europe/Moscow')::date,
  care_actions int not null default 0 check(care_actions>=0),
  games int not null default 0 check(games>=0),
  best int not null default 0 check(best>=0),
  gems jsonb not null default '{}'::jsonb,
  ach text[] not null default '{}',
  updated_at timestamptz not null default now());
create table if not exists public.gold_runs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  at timestamptz not null default now(),
  finished_at timestamptz,
  score int);
create index if not exists gold_runs_user_idx on public.gold_runs(user_id,at desc);
alter table public.pet_game enable row level security;
alter table public.gold_runs enable row level security;
drop policy if exists "pet game read own" on public.pet_game;
create policy "pet game read own" on public.pet_game for select to authenticated using(user_id=auth.uid());
drop policy if exists "gold runs read own" on public.gold_runs;
create policy "gold runs read own" on public.gold_runs for select to authenticated using(user_id=auth.uid());

create or replace function public.pet_care_level(x int) returns int language sql immutable as $$
  select 1+floor(sqrt(greatest(0,coalesce(x,0))/40.0))::int $$;
create or replace function public.gold_level(x int) returns int language sql immutable as $$
  select 1+floor(sqrt(greatest(0,coalesce(x,0))/120.0))::int $$;

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
    'tickets',greatest(0,gacha_earned(u)-coalesce((select spent from gacha_state where user_id=u),0)));
end $$;
grant execute on function public.pet_game_status() to authenticated;

create or replace function public.pet_care_action(p_action text) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); g pet_game; old int; new int; gain int; reward int:=0; a text[]; fresh text[]:='{}';
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  if p_action not in('feed','wash','play') then raise exception 'Неизвестное действие'; end if;
  perform pet_game_status();
  select * into g from pet_game where user_id=u for update;
  old:=pet_care_level(g.care_xp);gain:=case when g.care_actions<9 then 8 else 0 end;
  update pet_game set
    hunger=case when p_action='feed' then least(100,g.hunger+22) when p_action='play' then greatest(0,g.hunger-5) else g.hunger end,
    hygiene=case when p_action='wash' then least(100,g.hygiene+28) when p_action='play' then greatest(0,g.hygiene-5) when p_action='feed' then greatest(0,g.hygiene-2) else g.hygiene end,
    mood=case when p_action='play' then least(100,g.mood+24) when p_action='wash' then least(100,g.mood+3) else least(100,g.mood+4) end,
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

create or replace function public.gold_start() returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); e int; id uuid;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  perform pet_game_status();select energy into e from pet_game where user_id=u for update;
  if e<1 then raise exception 'Энергия закончилась. Немного отдохни!';end if;
  update pet_game set energy=energy-1 where user_id=u;
  insert into gold_runs(user_id) values(u) returning gold_runs.id into id;
  return jsonb_build_object('run',id,'energy',e-1);
end $$;
grant execute on function public.gold_start() to authenticated;

create or replace function public.gold_finish(p_run uuid,p_score int,p_gems jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); g pet_game; r gold_runs; old int; new int; score int; bonus int; reward int:=0;
  a text[];fresh text[]:='{}';k text;v text;n int;kinds int;l int;
begin
  if u is null or not is_approved() then raise exception 'нет доступа'; end if;
  perform pet_game_status();
  select * into r from gold_runs where id=p_run and user_id=u for update;
  if not found or r.finished_at is not null then raise exception 'Игра уже завершена или не найдена';end if;
  if now()-r.at<interval '20 seconds' then raise exception 'Игра ещё идёт';end if;
  select * into g from pet_game where user_id=u for update;
  bonus:=least(10,(pet_care_level(g.care_xp)-1)*2);
  score:=least(1000,greatest(0,round(greatest(0,coalesce(p_score,0))*(100+bonus)/100.0)))::int;
  old:=gold_level(g.gold_xp);new:=gold_level(g.gold_xp+score);
  update gold_runs set finished_at=now(),score=score where id=r.id;
  update pet_game set gold_xp=g.gold_xp+score,games=g.games+1,best=greatest(g.best,score),updated_at=now() where user_id=u returning * into g;
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
  if score>=100 and not 'gold:score100'=any(a) then a:=array_append(a,'gold:score100');fresh:=array_append(fresh,'gold:score100');end if;
  if score>=300 and not 'gold:score300'=any(a) then a:=array_append(a,'gold:score300');fresh:=array_append(fresh,'gold:score300');end if;
  if g.games>=5 and not 'gold:games5'=any(a) then a:=array_append(a,'gold:games5');fresh:=array_append(fresh,'gold:games5');end if;
  select count(*) into kinds from jsonb_object_keys(g.gems) kk where (g.gems->>kk)::int>0;
  if kinds>=3 and not 'gold:collector3'=any(a) then a:=array_append(a,'gold:collector3');fresh:=array_append(fresh,'gold:collector3');end if;
  if kinds>=6 and not 'gold:collector6'=any(a) then a:=array_append(a,'gold:collector6');fresh:=array_append(fresh,'gold:collector6');end if;
  if kinds>=9 and not 'gold:collector9'=any(a) then a:=array_append(a,'gold:collector9');fresh:=array_append(fresh,'gold:collector9');end if;
  if new>old then for l in old+1..new loop
    k:='gold:level:'||l;if not k=any(a) then a:=array_append(a,k);fresh:=array_append(fresh,k);end if;
  end loop;end if;
  update pet_game set gems=g.gems,ach=a where user_id=u;
  return pet_game_status()||jsonb_build_object('score',score,'base_score',greatest(0,coalesce(p_score,0)),'bonus',bonus,'reward',reward,'old_level',old,'new_level',new,'newach',to_jsonb(fresh));
end $$;
grant execute on function public.gold_finish(uuid,int,jsonb) to authenticated;
