-- Ивент «Парад кошмаров»: награда за вступление и уведомление для всех
create or replace function public.ach_claim(p_code text) returns boolean language plpgsql security definer set search_path=public as $$
declare b int; lbl text;
begin
  if not is_approved() then return false; end if;
  if p_code='evt:parad' then
    if now()>timestamptz '2026-11-30 23:59:00+03' then return false; end if;
    b:=150; lbl:='Парад кошмаров';
  else
    b:=case p_code when 'egg' then 25 when 'dark' then 10 else null end;
  end if;
  if b is null then raise exception 'неизвестное достижение'; end if;
  insert into user_ach(user_id,code,label,bonus) values(auth.uid(),p_code,lbl,b) on conflict do nothing;
  return found;
end $$;
grant execute on function public.ach_claim(text) to authenticated;

delete from public.notifications where kind='ach' and link='game' and (title like '%питомц%') and title not like '%Парад%';
insert into public.notifications(kind,title,body,link)
select 'ach','🎃 Парад кошмаров: теперь мы — дримвудовые','В Дримвуде начался Парад кошмаров! У каждого теперь есть свой питомец: лисёнок, мишка, зайка или дракончик. Выбери зверька и вступай в парад: за участие значок, очки и хэллоуинские костюмы.','game'
where not exists(select 1 from public.notifications where kind='ach' and title like '%Парад кошмаров%');

select (select count(*) from public.notifications where kind='ach' and title like '%Парад кошмаров%') as парад_уведомлений,
       (select count(*) from public.notifications where kind='ach' and link='game' and title like '%питомц%' and title not like '%Парад%') as старых_питомцев,
       pg_get_functiondef('public.ach_claim(text)'::regprocedure) like '%evt:parad%' as claim_ок;
