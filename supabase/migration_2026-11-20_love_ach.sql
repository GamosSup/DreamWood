-- Достижение «От старшего спеца с любовью»: +500 опыта и +10 билетов (1 за саму запись, ещё 9 добавляем в счёт)
create or replace function public.ach_claim(p_code text) returns boolean language plpgsql security definer set search_path=public as $$
declare b int; lbl text; ok boolean:=false;
begin
  if not is_approved() then return false; end if;
  if p_code='evt:parad' then
    if now()>timestamptz '2026-11-30 23:59:00+03' then return false; end if;
    b:=150; lbl:='Парад кошмаров';
  elsif p_code='love' then
    b:=500; lbl:='От старшего спеца с любовью';
  else
    b:=case p_code when 'egg' then 25 when 'dark' then 10 else null end;
  end if;
  if b is null then raise exception 'неизвестное достижение'; end if;
  insert into user_ach(user_id,code,label,bonus) values(auth.uid(),p_code,lbl,b) on conflict do nothing;
  ok:=found;
  if ok and p_code='love' then
    insert into gacha_state(user_id,spent) values(auth.uid(),-9) on conflict(user_id) do update set spent=gacha_state.spent-9;
  end if;
  return ok;
end $$;
grant execute on function public.ach_claim(text) to authenticated;
select pg_get_functiondef('public.ach_claim(text)'::regprocedure) like '%love%' as ok;
