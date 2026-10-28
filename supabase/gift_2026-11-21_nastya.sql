-- Подарок Насте: лама-таксист, статус «Легенда», уровень «Как же она хороша», 100 тикетов.
-- Запускать ПОСЛЕ регистрации и одобрения Насти. Если подходящих профилей не один, скрипт остановится и покажет, кто это.
do $$
declare n int; u uuid; ids text;
begin
  select count(*), string_agg(full_name||' <'||coalesce(email,'')||'>',', '), (array_agg(id))[1] into n, ids, u
    from profiles where status='approved' and (full_name ilike '%настя%' or full_name ilike '%анастаси%' or full_name ilike '%nastya%') and created_at>now()-interval '14 days';
  if n<>1 then raise exception 'Нужен ровно один профиль Насти, найдено %: %', n, coalesce(ids,'—'); end if;
  insert into user_ach(user_id,code,label,bonus) values(u,'spec:taxi','Лама-таксист',0),(u,'spec:legend','Легенда',0) on conflict do nothing;
  update profiles set lvl_text='Как же она хороша',
    cos=coalesce(cos,'{}'::jsonb)||jsonb_build_object('pet','sp=llama;bc=c_gi;ha=h_taxi','title','spec:legend')
   where id=u;
  -- 2 новые записи в достижениях уже дают 2 тикета, добавляем ещё 98 => ровно 100
  insert into gacha_state(user_id,spent) values(u,-98) on conflict(user_id) do update set spent=gacha_state.spent-98;
  insert into notifications(kind,title,body,link,to_user) values('system','💛 Это специально для тебя','Игорь тебя обожает. Пусть эти два дня будут самыми спокойными и лучшими! В подарок: лама-таксист, статус «Легенда» и 100 тикетов на крутку.','game',u);
end $$;
select 'ok';
