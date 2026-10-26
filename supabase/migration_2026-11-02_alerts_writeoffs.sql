-- Происшествия: гости; аварийная кнопка (воздушная тревога); срочные пуши; списание
-- 1. Срочные уведомления
alter table public.notifications add column if not exists urgent boolean not null default false;
create or replace function public.push_wanted(prefs jsonb, k text, ttl text) returns boolean language sql immutable as $$
  select case
    when k in('checkin','signup','alert') then true
    when k='repair' and ttl like '🚨%' then true
    else coalesce((prefs->>(case when k in('request','repair','incident') then 'req' when k in('news','afisha') then 'news' when k='rotation' then 'rot' when k in('task','shift') then 'task' else 'other' end))::boolean,true) end $$;
create or replace function public.trg_push() returns trigger language plpgsql security definer set search_path=public as $$
declare c record; subs jsonb; chunk jsonb; i int; n int;
begin
  select * into c from push_cfg where id=1;
  if c.id is null or not c.enabled or c.endpoint is null then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth)),'[]'::jsonb) into subs
  from push_subs s join profiles p on p.id=s.user_id
  where p.status='approved' and push_wanted(p.push_prefs,new.kind,new.title) and (
    (new.to_user is not null and p.id=new.to_user)
    or (new.to_user is null and new.for_managers and (p.role in('manager','admin') or (p.role='lead' and new.for_team is not null and p.team=new.for_team)))
    or (new.to_user is null and not new.for_managers));
  n:=jsonb_array_length(subs);
  i:=0;
  while i<n loop
    select jsonb_agg(e) into chunk from (select e from jsonb_array_elements(subs) with ordinality t(e,o) where o>i and o<=i+40 order by o) q;
    perform net.http_post(url:=c.endpoint, body:=jsonb_build_object('pub',c.vapid_pub,'jwk',c.vapid_jwk,'subs',chunk,'msg',jsonb_build_object('title',new.title,'body',left(coalesce(new.body,''),180),'link',new.link,'tag','n'||new.id,'urgent',coalesce(new.urgent,false))), headers:='{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds:=8000);
    i:=i+40;
  end loop;
  return new;
exception when others then return new;
end $$;

-- 2. Происшествия: количество гостей и список (ФИО, телефон, возраст)
alter table public.incidents add column if not exists guests_count int check(guests_count is null or guests_count>=0);
alter table public.incidents add column if not exists guests jsonb not null default '[]'::jsonb;

-- 3. Аварийная кнопка
create table if not exists public.alerts(
  id bigint generated always as identity primary key,
  level text not null check(level in('prepare','danger','clear')),
  note text,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz default now());
create table if not exists public.alert_acks(
  alert_id bigint not null references public.alerts on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  at timestamptz default now(),
  primary key(alert_id,user_id));
alter table public.alerts enable row level security; alter table public.alert_acks enable row level security;
drop policy if exists "alerts read" on public.alerts; drop policy if exists "alerts insert" on public.alerts;
drop policy if exists "acks read" on public.alert_acks; drop policy if exists "acks insert" on public.alert_acks;
create policy "alerts read" on public.alerts for select to authenticated using(is_approved());
create policy "alerts insert" on public.alerts for insert to authenticated with check(is_manager());
create policy "acks read" on public.alert_acks for select to authenticated using(is_approved() and (is_manager() or user_id=auth.uid()));
create policy "acks insert" on public.alert_acks for insert to authenticated with check(is_approved() and user_id=auth.uid());
create or replace function public.trg_alert() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into notifications(kind,title,body,link,urgent) values('alert',
    case new.level when 'prepare' then '⚠️ Внимание, приготовиться' when 'danger' then '🚨 ВОЗДУШНАЯ ОПАСНОСТЬ, ЭВАКУИРУЕМСЯ' else '✅ Отбой тревоги' end,
    coalesce(nullif(new.note,''),case new.level when 'prepare' then 'Приготовьтесь, ждите указаний руководителя.' when 'danger' then 'Немедленно ведите гостей в укрытие, действуйте по инструкции.' else 'Опасность миновала, возвращаемся к работе по указанию руководителя.' end),
    'alert',new.level<>'clear');
  return new;
end $$;
drop trigger if exists alert_notify on public.alerts;
create trigger alert_notify after insert on public.alerts for each row execute function public.trg_alert();

-- 4. Списание
create table if not exists public.writeoffs(
  id uuid primary key default gen_random_uuid(),
  item text not null check(length(trim(item))>0),
  qty numeric not null default 1 check(qty>0),
  unit text not null default 'шт',
  zone text,
  reason text not null default 'broken' check(reason in('broken','worn','lost','expired','other')),
  descr text,
  status text not null default 'new' check(status in('new','approved','rejected','done')),
  resolution text,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  decided_by uuid references public.profiles on delete set null,
  decided_at timestamptz,
  created_at timestamptz default now());
create table if not exists public.wo_files(
  id uuid primary key default gen_random_uuid(),
  wo_id uuid not null references public.writeoffs on delete cascade,
  path text not null, name text, mime text, size bigint,
  uploaded_by uuid default auth.uid() references public.profiles,
  created_at timestamptz default now());
alter table public.writeoffs enable row level security; alter table public.wo_files enable row level security;
drop policy if exists "wo read" on public.writeoffs; drop policy if exists "wo insert" on public.writeoffs; drop policy if exists "wo update" on public.writeoffs; drop policy if exists "wo delete" on public.writeoffs;
create policy "wo read" on public.writeoffs for select to authenticated using(is_approved() and (is_manager() or created_by=auth.uid()));
create policy "wo insert" on public.writeoffs for insert to authenticated with check(is_approved() and created_by=auth.uid());
create policy "wo update" on public.writeoffs for update to authenticated using(is_manager()) with check(is_manager());
create policy "wo delete" on public.writeoffs for delete to authenticated using(is_manager() or (created_by=auth.uid() and status='new'));
drop policy if exists "wof read" on public.wo_files; drop policy if exists "wof insert" on public.wo_files; drop policy if exists "wof delete" on public.wo_files;
create policy "wof read" on public.wo_files for select to authenticated using(is_approved() and exists(select 1 from public.writeoffs w where w.id=wo_id));
create policy "wof insert" on public.wo_files for insert to authenticated with check(is_approved() and exists(select 1 from public.writeoffs w where w.id=wo_id and (w.created_by=auth.uid() or is_manager())));
create policy "wof delete" on public.wo_files for delete to authenticated using(is_manager() or uploaded_by=auth.uid());
create or replace function public.trg_writeoff() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  if tg_op='INSERT' then
    new.created_by:=coalesce(auth.uid(),new.created_by);
    if not is_manager() then new.status:='new'; new.resolution:=null; new.decided_by:=null; new.decided_at:=null; end if;
    return new;
  end if;
  if new.status is distinct from old.status then new.decided_by:=auth.uid(); new.decided_at:=now(); end if;
  return new;
end $$;
drop trigger if exists wo_before on public.writeoffs;
create trigger wo_before before insert or update on public.writeoffs for each row execute function public.trg_writeoff();
create or replace function public.trg_writeoff_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  if tg_op='INSERT' then
    select full_name into nm from profiles where id=new.created_by;
    insert into notifications(kind,title,body,link,for_managers) values('writeoff','🗑 Списание — '||left(new.item,60),coalesce(nm,'Сотрудник')||': '||new.qty||' '||new.unit||coalesce(', '||new.zone,''),'wo',true);
  elsif new.status is distinct from old.status and new.created_by is not null then
    insert into notifications(kind,title,body,link,to_user) values('writeoff',
      case new.status when 'approved' then '✅ Списание согласовано' when 'done' then '✅ Списание выполнено' when 'rejected' then '❌ Списание отклонено' else '🗑 Статус списания изменён' end,
      left(new.item,80)||coalesce(' — '||nullif(new.resolution,''),''),'wo',new.created_by);
  end if;
  return new;
end $$;
drop trigger if exists wo_notify on public.writeoffs;
create trigger wo_notify after insert or update of status on public.writeoffs for each row execute function public.trg_writeoff_notify();

-- дни недели работы парка в периоде (0=вс … 6=сб); пусто = каждый день. 1–23.10 работаем пт, сб, вс.
alter table public.sched_periods add column if not exists dows int[];
update public.sched_periods set dows='{5,6,0}' where date_from='2026-10-01' and dows is null;
