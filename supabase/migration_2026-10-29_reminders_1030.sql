-- Автоматические напоминания каждый день в 10:30 по Москве (07:30 UTC).
-- Отметка на смене: только тем, кто ещё не подтвердил выход и не имеет отметки выходного/отпуска/больничного.
create or replace function public.send_checkins() returns int language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date; n int;
begin
  insert into notifications(kind,title,body,link,to_user)
  select 'checkin','⏰ Не забудь отметиться на смене','До 10:30 подтверждения не было. Нажми на это сообщение, если ты сегодня на смене.','checkin:'||d,p.id
  from profiles p
  where p.status='approved'
    and not exists(select 1 from marks m where m.user_id=p.id and m.day=d)
    and not exists(select 1 from checkins c where c.user_id=p.id and c.day=d)
    and not exists(select 1 from notifications x where x.kind='checkin' and x.to_user=p.id and x.link='checkin:'||d);
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.send_checkins() from public, anon, authenticated;

-- Чек-листы: отдельный остаток пунктов для каждого сотрудника, не чаще одного раза в день.
create or replace function public.send_shift_reminder() returns int language plpgsql security definer set search_path=public as $$
declare d date:=(now() at time zone 'Europe/Moscow')::date; tot int; n int;
begin
  select coalesce(sum(cardinality(items)),0) into tot from shift_lists where active and kind='open';
  if tot=0 then return 0; end if;
  insert into notifications(kind,title,body,link,to_user)
  select 'shift','✅ Заполни чек-лист открытия','Не отмечено пунктов: '||(tot-c.n)||'. Открой «Смена» и отметь свою зону.','shift',p.id
  from profiles p
  cross join lateral (select count(*)::int n from shift_checks s join shift_lists l on l.id=s.list_id and l.active and l.kind='open' where s.user_id=p.id and s.day=d and s.item=any(l.items)) c
  where p.status='approved' and tot-c.n>0
    and not exists(select 1 from marks m where m.user_id=p.id and m.day=d)
    and not exists(select 1 from notifications x where x.to_user=p.id and x.kind='shift' and x.title like '✅ Заполни чек-лист%' and (x.created_at at time zone 'Europe/Moscow')::date=d);
  get diagnostics n=row_count;
  return n;
end $$;
revoke all on function public.send_shift_reminder() from public, anon, authenticated;

insert into public.app_settings(key,value) values('checkin_time','{"h":10,"m":30}')
on conflict(key) do update set value=excluded.value,updated_at=now();
insert into public.app_settings(key,value) values('shiftlist_time','{"h":10,"m":30}')
on conflict(key) do update set value=excluded.value,updated_at=now();

-- Пересоздание по имени не оставляет дублирующихся заданий при повторном запуске файла.
do $$ begin perform cron.unschedule('dw-checkin'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('dw-shiftlist'); exception when others then null; end $$;
select cron.schedule('dw-checkin','30 7 * * *','select public.send_checkins()');
select cron.schedule('dw-shiftlist','30 7 * * *','select public.send_shift_reminder()');
