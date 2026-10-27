-- Подарки: Артуру питомец Картофелина, Тане питомец Леопард и статус «Единственная»
insert into public.user_ach(user_id,code,label,bonus,by)
select p.id,c.code,c.label,0,(select id from public.profiles where full_name='Игорь Шубчик')
from public.profiles p join (values ('Артур Франчук','spec:pet_potato','Картофелина'),('Татьяна Хоменко','spec:pet_leopard','Леопард'),('Татьяна Хоменко','spec:edinstvennaya','Единственная')) c(name,code,label) on p.full_name=c.name
on conflict(user_id,code) do nothing;
update public.profiles set cos=coalesce(cos,'{}'::jsonb)||jsonb_build_object('title','spec:edinstvennaya') where full_name='Татьяна Хоменко';
insert into public.notifications(kind,title,body,link,to_user)
select 'ach','🎁 Тебе подарили питомца',c.body,'game',p.id from public.profiles p join (values ('Артур Франчук','Картофелина: просто картошка с глазами. Открой «Мой питомец» и выбери её.'),('Татьяна Хоменко','Леопард, единственный в своём роде, и статус «Единственная». Открой «Мой питомец».')) c(name,body) on p.full_name=c.name;
select (select count(*) from public.user_ach where code in('spec:pet_potato','spec:pet_leopard','spec:edinstvennaya')) granted;
