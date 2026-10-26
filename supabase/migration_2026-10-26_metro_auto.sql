-- Метрополис из графика → ротация автоматически.
-- У каждого сотрудника Метрополиса в списке (roster) есть зона; кто в этот день не в выходном/ДО/больничном/отпуске по графику
-- (таблица roster_marks), тот попадает в ротацию. Перерывы берутся из шаблона — последней предыдущей ротации.
-- Выполнить в Supabase → SQL Editor. Повторный запуск безопасен.
alter table public.roster add column if not exists zone text;   -- Боулинг | Кино | VR-арена | Няня | Детский клуб
alter table public.roster add column if not exists icon text;   -- стикер в ротации

-- как зовут в ротации + зона (по журналу присутствия, лист «Октябрь 2026»)
update public.roster set zone='Детский клуб', rot_name='Кристина', icon='🍄' where team='M' and full_name like 'Кристина (Детский%';
update public.roster set zone='Детский клуб', icon='🎀' where team='M' and full_name ilike 'Замятина%';
update public.roster set zone='Няня', rot_name='Швырева Ксюша', icon='🎭' where team='M' and full_name ilike 'Швырева%';
update public.roster set zone='Няня', icon='🧸' where team='M' and full_name ilike 'Дылова%';
update public.roster set zone='Няня', icon='🍁' where team='M' and full_name ilike 'Смолянова%';
update public.roster set zone='Боулинг', icon='🔮' where team='M' and full_name ilike 'Волкова%';
update public.roster set zone='Боулинг', icon='🍬' where team='M' and full_name ilike 'Канахина%';
update public.roster set zone='Кино', icon='🍂' where team='M' and full_name ilike 'Эльвир%';
update public.roster set zone='VR-арена', icon='🕯️' where team='M' and full_name ilike 'Зиньков%';
update public.roster set zone='VR-арена', rot_name='Черняев Макс', icon='🧟' where team='M' and full_name ilike 'Черняев%';

create or replace function public.metro_for_day(p_day date, p_tpl jsonb default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare tpl jsonb:=p_tpl; sec jsonb; zones text[]:=array['Боулинг','Кино','VR-арена','Няня 1','Няня 2','Детский клуб']; z text; ppl jsonb; rows jsonb:='[]'::jsonb;
  tr jsonb; brks jsonb; n int; nan jsonb;
begin
  if not exists(select 1 from roster_marks m join roster r on r.id=m.roster_id where r.team='M' and date_trunc('month',m.day)=date_trunc('month',p_day)) then return null; end if; -- на этот месяц графика нет
  if tpl is null then select data#>'{teams,M}' into tpl from rotations where day<p_day and jsonb_array_length(coalesce(data#>'{teams,M}','[]'::jsonb))>0 order by day desc limit 1; end if;
  sec:=coalesce(tpl->0,jsonb_build_object('title','Весь день · 10:00–18:00','note','','noteBg','#E8B4B8'));
  -- кто работает в этот день, по зонам
  create temp table if not exists _mw(zone text,nm text,ic text,ord bigint) on commit drop;
  delete from _mw;
  insert into _mw select r.zone, coalesce(r.rot_name,r.full_name), coalesce(r.icon,''), r.id from roster r
    where r.team='M' and r.zone is not null and not exists(select 1 from roster_marks m where m.roster_id=r.id and m.day=p_day);
  foreach z in array zones loop
    ppl:=null;
    if z in('Няня 1','Няня 2') then
      n:=case z when 'Няня 1' then 1 else 2 end;
      select jsonb_agg(jsonb_build_object('icon',ic,'nm',nm)) into ppl from (select ic,nm from _mw where zone='Няня' order by ord offset n-1 limit 1) q;
    elsif z='Кино' then
      select jsonb_agg(jsonb_build_object('icon',ic,'nm',nm)) into ppl from (select ic,nm from _mw where zone=case when exists(select 1 from _mw where zone='Кино') then 'Кино' else 'VR-арена' end order by ord) q;
    elsif z='VR-арена' then
      select jsonb_agg(jsonb_build_object('icon',ic,'nm',nm)) into ppl from (select ic,nm from _mw where zone=case when exists(select 1 from _mw where zone='VR-арена') then 'VR-арена' else 'Кино' end order by ord) q;
    else
      select jsonb_agg(jsonb_build_object('icon',ic,'nm',nm)) into ppl from (select ic,nm from _mw where zone=z order by ord) q;
    end if;
    if ppl is null then continue; end if;
    select r into tr from jsonb_array_elements(coalesce(sec->'rows','[]'::jsonb)) r where r->>'zone'=z limit 1;
    brks:=coalesce(tr->'people'->0->'brks','[]'::jsonb);
    rows:=rows||jsonb_build_array(jsonb_build_object('zone',z,'people',(select jsonb_agg(jsonb_build_object('icon',p->>'icon','name',p->>'nm','senior',false,'brks',brks)) from jsonb_array_elements(ppl) p)));
  end loop;
  return jsonb_build_array(jsonb_set(sec,'{rows}',rows));
end $$;

-- при создании ротации без Метрополиса — подставить его по графику
create or replace function public.trg_rot_metro() returns trigger language plpgsql security definer set search_path=public as $$
declare m jsonb;
begin
  if jsonb_array_length(coalesce(new.data#>'{teams,M}','[]'::jsonb))=0 then
    m:=metro_for_day(new.day);
    if m is not null then new.data:=jsonb_set(new.data,'{teams,M}',m,true); end if;
  end if;
  return new;
end $$;
drop trigger if exists rot_metro_auto on public.rotations;
create trigger rot_metro_auto before insert on public.rotations for each row execute function public.trg_rot_metro();
