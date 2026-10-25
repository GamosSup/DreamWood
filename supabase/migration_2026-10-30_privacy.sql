-- 1. Смена у каждого сотрудника своя: отметки и комментарии видны только автору (и руководителям для сводки)
alter table public.shift_checks drop constraint if exists shift_checks_pkey;
alter table public.shift_checks add primary key(list_id,day,item,user_id);
drop policy if exists "sc read" on public.shift_checks;
create policy "sc read" on public.shift_checks for select to authenticated using(is_approved() and (user_id=auth.uid() or is_manager()));
drop policy if exists "sn read" on public.shift_notes;
create policy "sn read" on public.shift_notes for select to authenticated using(is_approved() and (user_id=auth.uid() or is_manager()));

-- напоминание в 10:00: считаем пункты отдельно по каждому человеку
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

-- 2. DreamGile (задачи) — только руководителям и админу
drop policy if exists "dg boards read" on public.dg_boards;
create policy "dg boards read" on public.dg_boards for select to authenticated using(is_approved() and is_manager());
drop policy if exists "dg cols read" on public.dg_columns;
create policy "dg cols read" on public.dg_columns for select to authenticated using(is_approved() and is_manager());
drop policy if exists "dg tasks read" on public.dg_tasks;
create policy "dg tasks read" on public.dg_tasks for select to authenticated using(is_approved() and is_manager());
drop policy if exists "dg tasks insert" on public.dg_tasks;
create policy "dg tasks insert" on public.dg_tasks for insert to authenticated with check(is_manager());
drop policy if exists "dg tasks update" on public.dg_tasks;
create policy "dg tasks update" on public.dg_tasks for update to authenticated using(is_manager()) with check(is_manager());

-- 3. Регистрации и список команды — только админ
create or replace function public.approve_member(p_id uuid, p_roster bigint default null) returns text language plpgsql security definer set search_path=public as $$
declare n int; t text; pr text; pp text;
begin
  if not is_admin() then raise exception 'Только админ одобряет регистрации'; end if;
  select tab_no into t from profiles where id=p_id;
  if t is null or t='' then
    select coalesce(max(tab_no::int) filter (where tab_no ~ '^\d+$' and tab_no::int<>67),0)+1 into n from profiles;
    if n=67 then n:=68; end if;
    t:=n::text;
  end if;
  update profiles set status='approved', tab_no=t where id=p_id;
  if p_roster is not null then
    update roster set profile_id=null where profile_id=p_id;
    update roster set profile_id=p_id where id=p_roster;
    update profiles set team=(select team from roster where id=p_roster) where id=p_id;
    select pre_role,pre_position into pr,pp from roster where id=p_roster;
    if pp is not null then update profiles set position=pp where id=p_id; end if;
    if pr is not null then
      perform set_config('dw.role_ok','1',true);
      update profiles set role=pr where id=p_id;
    end if;
  end if;
  return t;
end $$;
create or replace function public.reject_member(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_admin() then raise exception 'Только админ отклоняет регистрации'; end if;
  update profiles set status='rejected' where id=p_id;
end $$;
-- уведомление о новой регистрации получает только админ (лично)
create or replace function public.trg_signup() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='pending' then
    insert into notifications(kind,title,body,link,to_user)
    select 'signup','Новая заявка: '||coalesce(new.full_name,new.email),coalesce(new.email,''),'staff',a.id from profiles a where a.role='admin' and a.status='approved';
  end if;
  return new;
end $$;
delete from public.notifications where kind='signup' and to_user is null;
