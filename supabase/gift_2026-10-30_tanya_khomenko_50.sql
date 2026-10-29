-- Тане Хоменко: ровно 50 билетов, однократно.
do $$
declare u uuid; marker uuid; n int;
begin
  select count(*), (array_agg(id))[1] into n,u
    from public.profiles where full_name ilike '%Хоменко%';
  if n<>1 then raise exception 'Ожидался один профиль Хоменко, найдено: %',n; end if;

  -- Отметка сама даёт 1 билет через gacha_earned, поэтому ниже добавляем оставшиеся 49.
  insert into public.user_ach(user_id,code,label,bonus)
    values(u,'spec:gift_20261030_tanya_50','🎁 Подарок: 50 билетов',0)
    on conflict(user_id,code) do nothing returning user_id into marker;
  if marker is null then return; end if;

  insert into public.gacha_state(user_id,spent) values(u,-49)
    on conflict(user_id) do update set spent=public.gacha_state.spent-49;
  insert into public.notifications(kind,title,body,link,to_user)
    values('system','🎁 Тебе подарили 50 билетов','Билеты уже на твоём счёте. Загляни в автомат и выбери что-нибудь для питомца!','game',u);
end $$;
