-- Напоминание про чек-лист открытия: каждый день в 10:00 по Москве (07:00 UTC)
-- Получают подтверждённые сотрудники без отметки выходного/отпуска/больничного на сегодня,
-- и только если в активных чек-листах открытия остались неотмеченные пункты.
create or replace function public.send_shift_reminder() returns int language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date; left_n int; n int;
begin
  select count(*) into left_n
  from shift_lists l, unnest(l.items) it
  where l.active and l.kind='open'
    and not exists(select 1 from shift_checks c where c.list_id=l.id and c.day=d and c.item=it);
  if left_n=0 then return 0; end if;
  insert into notifications(kind,title,body,link,to_user)
  select 'shift','✅ Заполни чек-лист открытия','Не отмечено пунктов: '||left_n||'. Открой «Смена» и отметь свою зону.','shift',p.id
  from profiles p
  where p.status='approved'
    and not exists(select 1 from marks m where m.user_id=p.id and m.day=d)
    and not exists(select 1 from notifications x where x.to_user=p.id and x.kind='shift' and x.title like '✅ Заполни чек-лист%' and (x.created_at at time zone 'Europe/Moscow')::date=d);
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.send_shift_reminder() from public, anon, authenticated;
select cron.schedule('dw-shiftlist','0 7 * * *','select public.send_shift_reminder()');

-- время напоминания настраивает админ (по Москве)
insert into public.app_settings(key,value) values('shiftlist_time','{"h":10,"m":0}') on conflict(key) do nothing;
create or replace function public.set_shiftlist_time(h int, m int) returns void language plpgsql security definer set search_path=public,cron as $$
begin
  if not is_admin() then raise exception 'Только админ меняет время напоминания'; end if;
  if h<0 or h>23 or m<0 or m>59 then raise exception 'Неверное время'; end if;
  insert into app_settings(key,value) values('shiftlist_time',jsonb_build_object('h',h,'m',m)) on conflict(key) do update set value=excluded.value, updated_at=now();
  perform cron.schedule('dw-shiftlist', m||' '||((h-3+24)%24)||' * * *', 'select public.send_shift_reminder()');
end $$;
