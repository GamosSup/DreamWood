-- DreamGile Pro: вложения, история, архив, @упоминания, заявки техникам, повторяющиеся задачи.
-- Выполнить целиком в Supabase -> SQL Editor. Повторный запуск безопасен.

-- 1. Новые поля
alter table public.dg_boards add column if not exists intake boolean not null default false;              -- доска приёма заявок: сотрудники могут создавать на ней задачи
alter table public.dg_boards add column if not exists intake_assignees uuid[] not null default '{}';      -- кто автоматически назначается на заявки
alter table public.dg_tasks  add column if not exists archived boolean not null default false;
alter table public.dg_tasks  add column if not exists zone text;                                          -- зона/аттракцион (для заявок)
alter table public.dg_tasks  add column if not exists recurring_id uuid;
alter table public.dg_tasks  add column if not exists watchers uuid[] not null default '{}';             -- упомянутые в комментариях: видят задачу и могут комментировать
alter table public.dg_comments add column if not exists mentions uuid[] not null default '{}';
create index if not exists dg_tasks_arch on public.dg_tasks(board_id, archived);

-- 2. Политики задач: видят и наблюдатели; на досках приёма заявок создавать могут все одобренные
drop policy if exists "dg tasks read" on public.dg_tasks;
create policy "dg tasks read" on public.dg_tasks for select to authenticated
  using(is_approved() and (is_manager() or auth.uid()=any(assignees) or auth.uid()=any(watchers) or created_by=auth.uid()));
drop policy if exists "dg tasks insert" on public.dg_tasks;
create policy "dg tasks insert" on public.dg_tasks for insert to authenticated
  with check(is_manager() or (is_approved() and created_by=auth.uid() and exists(select 1 from public.dg_boards b where b.id=board_id and b.intake)));

-- сотрудник по-прежнему может менять только колонку/позицию/«готово»; служебные вызовы (рассылка повторяющихся, упоминания) не блокируются
create or replace function public.dg_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at:=now();
  if not is_manager() and pg_trigger_depth()<=1 and coalesce(current_setting('dg.spawn',true),'')<>'1' then
    if (new.board_id,new.title,new.descr,new.assignees,new.deadline,new.priority,new.label,new.created_by,new.archived,new.zone,new.recurring_id,new.watchers)
       is distinct from (old.board_id,old.title,old.descr,old.assignees,old.deadline,old.priority,old.label,old.created_by,old.archived,old.zone,old.recurring_id,old.watchers) then
      raise exception 'Сотрудник может только переносить задачу и отмечать выполнение';
    end if;
  end if;
  return new;
end $$;

-- при создании заявки сотрудником: назначаем ответственных доски, сбрасываем служебные поля
create or replace function public.dg_intake() returns trigger language plpgsql security definer set search_path=public as $$
declare b record;
begin
  if auth.uid() is not null and not is_manager() and coalesce(current_setting('dg.spawn',true),'')<>'1' then
    select * into b from dg_boards where id=new.board_id;
    if b.intake then new.assignees:=b.intake_assignees; end if;
    new.archived:=false; new.done:=false; new.watchers:='{}'; new.created_by:=auth.uid(); new.recurring_id:=null;
  end if;
  return new;
end $$;
drop trigger if exists dg_tasks_intake on public.dg_tasks;
create trigger dg_tasks_intake before insert on public.dg_tasks for each row execute function public.dg_intake();

-- 3. Уведомления: назначение, заявка руководителям
create or replace function public.trg_dg_task() returns trigger language plpgsql security definer set search_path=public as $$
declare u uuid; olda uuid[]; ib boolean;
begin
  olda:=case when tg_op='UPDATE' then old.assignees else '{}'::uuid[] end;
  foreach u in array new.assignees loop
    if not (u=any(olda)) and u is distinct from auth.uid() then
      insert into notifications(kind,title,body,link,to_user) values('task',case when new.zone is not null then 'Заявка: ' else 'Новая задача: ' end||new.title,coalesce(nullif(new.descr,''),'Тебя назначили исполнителем.')||case when new.deadline is not null then ' Срок: '||mon_ru(new.deadline) else '' end,'dg',u);
    end if;
  end loop;
  if tg_op='INSERT' then
    select intake into ib from dg_boards where id=new.board_id;
    if coalesce(ib,false) and not is_manager() then
      insert into notifications(kind,title,body,link,for_managers) values('task','Новая заявка: '||new.title,coalesce(new.zone||' · ','')||coalesce(new.descr,''),'dg',true);
    end if;
  end if;
  return new;
end $$;

-- комментарии: упомянутые становятся наблюдателями и получают уведомление
create or replace function public.trg_dg_comment() returns trigger language plpgsql security definer set search_path=public as $$
declare t record; u uuid; nm text; targets uuid[];
begin
  select * into t from dg_tasks where id=new.task_id;
  select full_name into nm from profiles where id=new.author;
  if coalesce(array_length(new.mentions,1),0)>0 then
    update dg_tasks set watchers=(select coalesce(array_agg(distinct x),'{}') from unnest(watchers||new.mentions) x) where id=new.task_id;
  end if;
  targets:=(select coalesce(array_agg(distinct x),'{}') from unnest(t.assignees||coalesce(array[t.created_by],'{}'::uuid[])||t.watchers||new.mentions) x where x is not null and x is distinct from new.author);
  foreach u in array targets loop
    insert into notifications(kind,title,body,link,to_user) values('task',case when u=any(new.mentions) then 'Тебя упомянули: ' else 'Комментарий: ' end||t.title,coalesce(nm,'Кто-то')||': '||new.body,'dg',u);
  end loop;
  return new;
end $$;

-- 4. История изменений
create table if not exists public.dg_history(id bigint generated always as identity primary key, task_id uuid not null references public.dg_tasks on delete cascade, user_id uuid, what text not null, at timestamptz default now());
create index if not exists dg_history_task on public.dg_history(task_id, at);
alter table public.dg_history enable row level security;
drop policy if exists "dg history read" on public.dg_history;
create policy "dg history read" on public.dg_history for select to authenticated using(exists(select 1 from public.dg_tasks t where t.id=task_id));

create or replace function public.dg_log() returns trigger language plpgsql security definer set search_path=public as $$
declare w uuid:=auth.uid(); a text; b text;
begin
  if tg_op='INSERT' then
    insert into dg_history(task_id,user_id,what) values(new.id,w,case when new.recurring_id is not null then 'задача создана автоматически (повторяющаяся)' else 'создал(а) задачу' end);
    return new;
  end if;
  if new.column_id is distinct from old.column_id then
    select title into a from dg_columns where id=old.column_id; select title into b from dg_columns where id=new.column_id;
    insert into dg_history(task_id,user_id,what) values(new.id,w,'перенёс(ла): «'||coalesce(a,'?')||'» → «'||coalesce(b,'?')||'»');
  end if;
  if new.assignees is distinct from old.assignees then
    insert into dg_history(task_id,user_id,what) values(new.id,w,'исполнители: '||coalesce((select string_agg(full_name,', ') from profiles where id=any(new.assignees)),'никого'));
  end if;
  if new.deadline is distinct from old.deadline then
    insert into dg_history(task_id,user_id,what) values(new.id,w,'срок: '||coalesce(mon_ru(new.deadline),'убран'));
  end if;
  if new.priority is distinct from old.priority then
    insert into dg_history(task_id,user_id,what) values(new.id,w,'приоритет: '||case new.priority when 'low' then 'низкий' when 'normal' then 'обычный' when 'high' then 'высокий' else 'срочно' end);
  end if;
  if new.title is distinct from old.title then
    insert into dg_history(task_id,user_id,what) values(new.id,w,'название: «'||new.title||'»');
  end if;
  if new.archived is distinct from old.archived then
    insert into dg_history(task_id,user_id,what) values(new.id,w,case when new.archived then 'отправил(а) в архив' else 'вернул(а) из архива' end);
  end if;
  return new;
end $$;
drop trigger if exists dg_tasks_log on public.dg_tasks;
create trigger dg_tasks_log after insert or update on public.dg_tasks for each row execute function public.dg_log();

-- 5. Вложения (фото, PDF)
create table if not exists public.dg_files(
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.dg_tasks on delete cascade,
  path text not null, name text, mime text, size int,
  uploaded_by uuid default auth.uid() references public.profiles,
  created_at timestamptz default now());
create index if not exists dg_files_task on public.dg_files(task_id);
alter table public.dg_files enable row level security;
drop policy if exists "dg files read" on public.dg_files;
drop policy if exists "dg files insert" on public.dg_files;
drop policy if exists "dg files delete" on public.dg_files;
create policy "dg files read" on public.dg_files for select to authenticated using(exists(select 1 from public.dg_tasks t where t.id=task_id));
create policy "dg files insert" on public.dg_files for insert to authenticated with check(uploaded_by=auth.uid() and exists(select 1 from public.dg_tasks t where t.id=task_id));
create policy "dg files delete" on public.dg_files for delete to authenticated using(uploaded_by=auth.uid() or is_manager());

insert into storage.buckets(id,name,public,file_size_limit) values('dg','dg',false,10485760) on conflict(id) do nothing;
drop policy if exists "dg obj read" on storage.objects;
drop policy if exists "dg obj insert" on storage.objects;
drop policy if exists "dg obj delete" on storage.objects;
create policy "dg obj read" on storage.objects for select to authenticated using(bucket_id='dg' and exists(select 1 from public.dg_tasks t where t.id::text=(storage.foldername(name))[1]));
create policy "dg obj insert" on storage.objects for insert to authenticated with check(bucket_id='dg' and exists(select 1 from public.dg_tasks t where t.id::text=(storage.foldername(name))[1]));
create policy "dg obj delete" on storage.objects for delete to authenticated using(bucket_id='dg' and (owner=auth.uid() or is_manager()));

-- 6. Повторяющиеся задачи
create table if not exists public.dg_recurring(
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.dg_boards on delete cascade,
  column_id uuid not null references public.dg_columns on delete cascade,
  title text not null, descr text,
  assignees uuid[] not null default '{}',
  priority text not null default 'normal' check(priority in('low','normal','high','urgent')),
  label text, zone text,
  rule text not null default 'week' check(rule in('week','month')),
  dows int[] not null default '{1,2,3,4,5,6,7}',   -- дни недели 1=пн … 7=вс
  dom int,                                          -- число месяца для rule='month'
  items text[] not null default '{}',               -- пункты чек-листа
  deadline_days int not null default 0,
  active boolean not null default true,
  last_run date,
  created_by uuid default auth.uid(),
  created_at timestamptz default now());
alter table public.dg_recurring enable row level security;
drop policy if exists "dg rec manager" on public.dg_recurring;
create policy "dg rec manager" on public.dg_recurring for all to authenticated using(is_manager()) with check(is_manager());

-- создаёт задачи на сегодня (по Москве). Безопасно вызывать сколько угодно раз: в день срабатывает один раз.
create or replace function public.dg_spawn_recurring() returns int language plpgsql security definer set search_path=public as $$
declare r record; d date:=(now() at time zone 'Europe/Moscow')::date; n int:=0; tid uuid; it text; p numeric; k int;
begin
  if auth.uid() is not null and not is_approved() then return 0; end if;
  perform set_config('dg.spawn','1',true);
  for r in select * from dg_recurring where active and (last_run is null or last_run<d) loop
    update dg_recurring set last_run=d where id=r.id;
    if (r.rule='week' and extract(isodow from d)::int=any(r.dows)) or (r.rule='month' and extract(day from d)::int=r.dom) then
      select coalesce(max(pos),0)+1 into p from dg_tasks where column_id=r.column_id;
      insert into dg_tasks(board_id,column_id,title,descr,assignees,priority,label,zone,deadline,pos,recurring_id,created_by)
        values(r.board_id,r.column_id,r.title,r.descr,r.assignees,r.priority,r.label,r.zone,d+r.deadline_days,p,r.id,r.created_by) returning id into tid;
      k:=0;
      foreach it in array r.items loop k:=k+1; insert into dg_checklist(task_id,text,pos) values(tid,it,k); end loop;
      n:=n+1;
    end if;
  end loop;
  -- выполненные задачи старше 14 дней уходят в архив
  update dg_tasks set archived=true where done and not archived and updated_at<now()-interval '14 days';
  return n;
end $$;
revoke all on function public.dg_spawn_recurring() from anon;

-- ежедневный запуск в 06:00 по Москве (если расширение pg_cron доступно; иначе задачи создаются при первом входе в приложение за день)
do $$ begin
  begin create extension if not exists pg_cron; exception when others then raise notice 'pg_cron недоступен: %', sqlerrm; end;
  begin perform cron.unschedule('dg-spawn'); exception when others then null; end;
  begin perform cron.schedule('dg-spawn','0 3 * * *','select public.dg_spawn_recurring()'); exception when others then raise notice 'cron.schedule: %', sqlerrm; end;
end $$;

-- 7. Доска приёма заявок техникам
do $$ declare b uuid; begin
  if not exists(select 1 from public.dg_boards where intake) then
    insert into public.dg_boards(title,intake) values('Заявки техникам',true) returning id into b;
    insert into public.dg_columns(board_id,title,color,pos) values
      (b,'Новая','#E4B5A3',1),(b,'В работе','#E6CC8F',2),(b,'Ждём запчасти','#D3BFD0',3),(b,'Решено','#C9D4B0',4);
  end if;
end $$;
