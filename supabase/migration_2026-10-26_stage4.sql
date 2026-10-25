-- Этап 4: роль «бригадир» (руководитель своей команды) + web-push.
-- Секретные ключи push в этот файл НЕ входят (они вносятся в push_cfg отдельным запросом).

-- ===== Роли =====
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in('employee','lead','manager'));

create or replace function public.is_lead_of(uid uuid) returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from profiles me join profiles t on t.id=uid where me.id=auth.uid() and me.role='lead' and me.status='approved' and me.team is not null and me.team=t.team) $$;
create or replace function public.can_manage(uid uuid) returns boolean language sql security definer stable set search_path=public as $$
  select is_manager() or is_lead_of(uid) $$;
create or replace function public.is_lead() returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from profiles where id=auth.uid() and role='lead' and status='approved') $$;

alter table public.notifications add column if not exists for_team text;

drop policy if exists "marks own or manager" on public.marks;
create policy "marks own or manager" on public.marks for all to authenticated using(user_id=auth.uid() or can_manage(user_id)) with check(user_id=auth.uid() or can_manage(user_id));
drop policy if exists "overtime read own or manager" on public.overtime; drop policy if exists "overtime manager write" on public.overtime;
create policy "overtime read own or manager" on public.overtime for select to authenticated using(user_id=auth.uid() or can_manage(user_id));
create policy "overtime manager write" on public.overtime for all to authenticated using(can_manage(user_id) and (user_id<>auth.uid() or is_manager())) with check(can_manage(user_id) and (user_id<>auth.uid() or is_manager()));
drop policy if exists "req read" on public.requests;
create policy "req read" on public.requests for select to authenticated using(is_approved() and (user_id=auth.uid() or peer_id=auth.uid() or can_manage(user_id)));
drop policy if exists "notif read" on public.notifications;
create policy "notif read" on public.notifications for select to authenticated using(is_approved() and (not for_managers or is_manager() or (for_team is not null and is_lead() and for_team=(select team from profiles where id=auth.uid()))) and (to_user is null or to_user=auth.uid()));

create or replace function public.trg_request() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text; tm text;
begin
  select full_name,team into nm,tm from profiles where id=new.user_id;
  if new.kind='swap' then
    insert into notifications(kind,title,body,link,to_user) values('request','Предлагают обмен сменами',coalesce(nm,'Коллега')||': выйду '||mon_ru(new.peer_day)||' вместо тебя, ты — '||mon_ru(new.day)||'. Ответь в «Заявках».','req',new.peer_id);
  else
    insert into notifications(kind,title,body,link,for_managers,for_team) values('request','Новая заявка: '||kind_ru(new.kind),coalesce(nm,'Сотрудник')||' · '||mon_ru(new.day)||case when new.day_to is not null and new.day_to<>new.day then ' — '||mon_ru(new.day_to) else '' end||coalesce(' · '||nullif(new.note,''),''),'req',true,tm);
  end if;
  return new;
end $$;

create or replace function public.peer_answer(p_id uuid, p_ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare r record; nm text;
begin
  select * into r from requests where id=p_id;
  if r.id is null or r.peer_id is distinct from auth.uid() or r.status<>'peer' then raise exception 'Нельзя ответить на эту заявку'; end if;
  select full_name into nm from profiles where id=r.peer_id;
  if p_ok then
    update requests set status='pending' where id=p_id;
    insert into notifications(kind,title,body,link,to_user) values('request','Коллега согласен на обмен',coalesce(nm,'Коллега')||' согласен. Теперь заявку рассмотрит руководитель.','req',r.user_id);
    insert into notifications(kind,title,body,link,for_managers,for_team) values('request','Заявка на обмен сменами',(select full_name from profiles where id=r.user_id)||' ⇄ '||coalesce(nm,'')||': '||mon_ru(r.day)||' / '||mon_ru(r.peer_day),'req',true,(select team from profiles where id=r.user_id));
  else
    update requests set status='rejected', decision_note='Коллега отказался', decided_at=now() where id=p_id;
    insert into notifications(kind,title,body,link,to_user) values('request','Обмен сменами: коллега отказался',coalesce(nm,'Коллега')||' не может поменяться.','req',r.user_id);
  end if;
end $$;

create or replace function public.decide_request(p_id uuid, p_ok boolean, p_note text default null) returns void language plpgsql security definer set search_path=public as $$
declare r record; d date; mk text;
begin
  select * into r from requests where id=p_id;
  if r.id is null or r.status<>'pending' then raise exception 'Заявка уже рассмотрена'; end if;
  if not can_manage(r.user_id) then raise exception 'Нет прав на эту заявку'; end if;
  if r.user_id=auth.uid() and not is_manager() then raise exception 'Свою заявку решает руководитель'; end if;
  update requests set status=case when p_ok then 'approved' else 'rejected' end, decision_note=nullif(p_note,''), decided_by=auth.uid(), decided_at=now() where id=p_id;
  if p_ok then
    if r.kind='swap' then
      insert into marks(user_id,day,kind,note) values(r.user_id,r.day,'off','обмен сменами') on conflict(user_id,day) do update set kind='off', note='обмен сменами';
      delete from marks where user_id=r.user_id and day=r.peer_day;
      insert into marks(user_id,day,kind,note) values(r.peer_id,r.peer_day,'off','обмен сменами') on conflict(user_id,day) do update set kind='off', note='обмен сменами';
      delete from marks where user_id=r.peer_id and day=r.day;
    else
      mk:=r.kind;
      for d in select generate_series(r.day, coalesce(r.day_to,r.day), interval '1 day')::date loop
        insert into marks(user_id,day,kind,note) values(r.user_id,d,mk,'по заявке') on conflict(user_id,day) do update set kind=mk, note='по заявке';
      end loop;
    end if;
  end if;
  insert into notifications(kind,title,body,link,to_user) values('request',case when p_ok then '✅ Заявка одобрена' else '❌ Заявка отклонена' end,kind_ru(r.kind)||' · '||mon_ru(r.day)||coalesce('. '||nullif(p_note,''),''),'req',r.user_id);
  if r.kind='swap' then
    insert into notifications(kind,title,body,link,to_user) values('request',case when p_ok then '✅ Обмен сменами одобрен' else '❌ Обмен сменами отклонён' end,mon_ru(r.peer_day)||' / '||mon_ru(r.day)||coalesce('. '||nullif(p_note,''),''),'req',r.peer_id);
  end if;
end $$;

-- ===== Web-push =====
create extension if not exists pg_net with schema extensions;
create table if not exists public.push_subs(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamptz default now());
alter table public.push_subs enable row level security;
drop policy if exists "push own" on public.push_subs;
create policy "push own" on public.push_subs for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create table if not exists public.push_cfg(
  id int primary key default 1 check(id=1),
  vapid_pub text, vapid_jwk jsonb, endpoint text, enabled boolean not null default true);
alter table public.push_cfg enable row level security; -- политик нет: читает только security definer

create or replace function public.trg_push() returns trigger language plpgsql security definer set search_path=public,extensions as $$
declare c record; subs jsonb; chunk jsonb; i int; n int;
begin
  select * into c from push_cfg where id=1;
  if c.id is null or not c.enabled or c.endpoint is null then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth)),'[]'::jsonb) into subs
  from push_subs s join profiles p on p.id=s.user_id
  where p.status='approved' and (
    (new.to_user is not null and p.id=new.to_user)
    or (new.to_user is null and new.for_managers and (p.role='manager' or (p.role='lead' and new.for_team is not null and p.team=new.for_team)))
    or (new.to_user is null and not new.for_managers));
  n:=jsonb_array_length(subs);
  i:=0;
  while i<n loop
    select jsonb_agg(e) into chunk from (select e from jsonb_array_elements(subs) with ordinality t(e,o) where o>i and o<=i+40 order by o) q;
    perform net.http_post(url:=c.endpoint, body:=jsonb_build_object('pub',c.vapid_pub,'jwk',c.vapid_jwk,'subs',chunk,'msg',jsonb_build_object('title',new.title,'body',left(coalesce(new.body,''),180),'link',new.link,'tag','n'||new.id)), headers:='{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds:=8000);
    i:=i+40;
  end loop;
  return new;
exception when others then return new; -- пуш никогда не должен ломать создание уведомления
end $$;
drop trigger if exists notif_push on public.notifications;
create trigger notif_push after insert on public.notifications for each row execute function public.trg_push();

-- тест пуша из настроек: уведомление самому себе
create or replace function public.push_test() returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_approved() then raise exception 'нет доступа'; end if;
  insert into notifications(kind,title,body,link,to_user) values('system','🔔 Пуши работают','Так будут приходить заявки, новости и задачи.','set',auth.uid());
end $$;
