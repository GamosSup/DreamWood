-- Особый подарок Кристине (супервайзер): кигуруми акулы для питомца (без опыта)
insert into public.user_ach(user_id,code,label,bonus)
select id,'spec:shark','Кигуруми акулы',0 from public.profiles where full_name like 'Кристина Прошутин%' and status='approved'
on conflict do nothing;
