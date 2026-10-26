-- Питомец вместо Дримми: разрешаем сохранять выбор зверька в образе, меняем уведомление
create or replace function public.set_my_cos(p jsonb) returns void language plpgsql security definer set search_path=public as $$
declare k text; clean jsonb:='{}'::jsonb;
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  for k in select jsonb_object_keys(coalesce(p,'{}'::jsonb)) loop
    if k in('frame','name','bg','badge','title') and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 80 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='pet' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 300 then
      clean:=clean||jsonb_build_object(k,p->>k);
    end if;
  end loop;
  update profiles set cos=clean where id=auth.uid();
end $$;
grant execute on function public.set_my_cos(jsonb) to authenticated;

-- старое уведомление про Дримми убираем и отправляем новое про питомца
delete from public.notif_reads where notif_id in(select id from public.notifications where kind='ach' and title like '%появились достижения%' and title not like '%питомц%');
delete from public.notifications where kind='ach' and title like '%появились достижения%' and title not like '%питомц%';
insert into public.notifications(kind,title,body,link)
select 'ach','🐾 В приложении появились достижения и питомцы','Копи опыт, получай уровни и значки. А ещё каждый может выбрать себе зверька: лисёнка, мишку, зайку или дракончика. Выбери того, кто нравится, и одевай его в «Ещё» → «Мой профиль».','game'
where not exists(select 1 from public.notifications where kind='ach' and link='game' and title like '%и питомцы%');

select (select count(*) from public.notifications where kind='ach' and title like '%появились достижения%' and title not like '%питомц%') as старых_осталось,
       (select count(*) from public.notifications where kind='ach' and title like '%и питомцы%') as новых,
       pg_get_functiondef('public.set_my_cos(jsonb)'::regprocedure) like '%''pet''%' as питомец_разрешён;
