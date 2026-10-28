-- 1) отмена «Я на смене» — только руководитель/админ (свою отметку или чужую)
create or replace function public.checkin_cancel(p_user uuid default null) returns void language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date; u uuid:=coalesce(p_user,auth.uid());
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  delete from checkins where user_id=u and day=d;
end $$;
grant execute on function public.checkin_cancel(uuid) to authenticated;

-- 2) никаких уведомлений руководителям о каждом выходе/открытии: оставляем только сводку в приложении
do $$ declare r record; begin
  for r in select t.tgname, c.relname from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relname in('checkins','shift_checks') and not t.tgisinternal loop
    execute format('drop trigger if exists %I on public.%I', r.tgname, r.relname);
  end loop;
end $$;
delete from public.notifications where for_managers and kind in('shift','checkin') and title not like '%комментарий%';
select 'ok';
