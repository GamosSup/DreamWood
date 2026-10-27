-- Игорь Олексюк (владелец): табельный номер, подпись уровня, титул «Прошёл игру», значок «Кнут и пряник».
update public.profiles set tab_no='Е 001 КХ 82', lvl_text='Последний'
 where id=(select id from public.profiles where (full_name ilike '%олексюк%' or full_name ilike '%алексюк%') and status='approved' order by created_at limit 1);
insert into public.user_ach(user_id,code,label,bonus)
select id,c,l,0 from public.profiles, (values('spec:finished','Прошёл игру'),('spec:whipcarrot','Кнут и пряник')) v(c,l)
 where id=(select id from public.profiles where (full_name ilike '%олексюк%' or full_name ilike '%алексюк%') and status='approved' order by created_at limit 1)
on conflict do nothing;
update public.profiles set cos=coalesce(cos,'{}'::jsonb)||jsonb_build_object('title','spec:finished','badge','spec:whipcarrot')
 where id=(select id from public.profiles where (full_name ilike '%олексюк%' or full_name ilike '%алексюк%') and status='approved' order by created_at limit 1);
