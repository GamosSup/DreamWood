-- DreamGile: собственная доска задач. Выполнить в Supabase -> SQL Editor. Повторный запуск безопасен.

create table if not exists public.dg_boards(id uuid primary key default gen_random_uuid(), title text not null, created_by uuid default auth.uid(), created_at timestamptz default now());
create table if not exists public.dg_columns(id uuid primary key default gen_random_uuid(), board_id uuid not null references public.dg_boards on delete cascade, title text not null, color text default '#BCC8D6', pos numeric not null default 0);
create table if not exists public.dg_tasks(
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.dg_boards on delete cascade,
  column_id uuid not null references public.dg_columns on delete cascade,
  title text not null, descr text,
  assignees uuid[] not null default '{}',
  deadline date,
  priority text not null default 'normal' check(priority in('low','normal','high','urgent')),
  label text,
  pos numeric not null default 0,
  done boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.dg_checklist(id uuid primary key default gen_random_uuid(), task_id uuid not null references public.dg_tasks on delete cascade, text text not null, done boolean not null default false, pos numeric not null default 0);
create table if not exists public.dg_comments(id uuid primary key default gen_random_uuid(), task_id uuid not null references public.dg_tasks on delete cascade, author uuid default auth.uid() references public.profiles, body text not null, created_at timestamptz default now());
create index if not exists dg_tasks_board on public.dg_tasks(board_id);
create index if not exists dg_checklist_task on public.dg_checklist(task_id);
create index if not exists dg_comments_task on public.dg_comments(task_id);

alter table public.dg_boards enable row level security; alter table public.dg_columns enable row level security; alter table public.dg_tasks enable row level security; alter table public.dg_checklist enable row level security; alter table public.dg_comments enable row level security;

do $$ declare r record; begin for r in select policyname, tablename from pg_policies where schemaname='public' and tablename like 'dg\_%' loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop; end $$;

create policy "dg boards read" on public.dg_boards for select to authenticated using(is_approved());
create policy "dg boards write" on public.dg_boards for all to authenticated using(is_manager()) with check(is_manager());
create policy "dg cols read" on public.dg_columns for select to authenticated using(is_approved());
create policy "dg cols write" on public.dg_columns for all to authenticated using(is_manager()) with check(is_manager());
-- задачи: руководитель видит все; сотрудник только назначенные на него или созданные им
create policy "dg tasks read" on public.dg_tasks for select to authenticated using(is_approved() and (is_manager() or auth.uid()=any(assignees) or created_by=auth.uid()));
create policy "dg tasks insert" on public.dg_tasks for insert to authenticated with check(is_manager());
create policy "dg tasks update" on public.dg_tasks for update to authenticated using(is_manager() or auth.uid()=any(assignees)) with check(is_manager() or auth.uid()=any(assignees));
create policy "dg tasks delete" on public.dg_tasks for delete to authenticated using(is_manager());
create policy "dg checklist read" on public.dg_checklist for select to authenticated using(exists(select 1 from public.dg_tasks t where t.id=task_id));
create policy "dg checklist insert" on public.dg_checklist for insert to authenticated with check(is_manager());
create policy "dg checklist update" on public.dg_checklist for update to authenticated using(exists(select 1 from public.dg_tasks t where t.id=task_id)) with check(exists(select 1 from public.dg_tasks t where t.id=task_id));
create policy "dg checklist delete" on public.dg_checklist for delete to authenticated using(is_manager());
create policy "dg comments read" on public.dg_comments for select to authenticated using(exists(select 1 from public.dg_tasks t where t.id=task_id));
create policy "dg comments insert" on public.dg_comments for insert to authenticated with check(author=auth.uid() and exists(select 1 from public.dg_tasks t where t.id=task_id));
create policy "dg comments delete" on public.dg_comments for delete to authenticated using(author=auth.uid() or is_manager());

-- сотрудник может менять в своей задаче только колонку, позицию и «готово»
create or replace function public.dg_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at:=now();
  if not is_manager() then
    if (new.board_id,new.title,new.descr,new.assignees,new.deadline,new.priority,new.label,new.created_by) is distinct from (old.board_id,old.title,old.descr,old.assignees,old.deadline,old.priority,old.label,old.created_by) then
      raise exception 'Сотрудник может только переносить задачу и отмечать выполнение';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists dg_tasks_guard on public.dg_tasks;
create trigger dg_tasks_guard before update on public.dg_tasks for each row execute function public.dg_guard();

-- адресные уведомления в колокольчик
alter table public.notifications add column if not exists to_user uuid references public.profiles on delete cascade;
drop policy if exists "notif read" on public.notifications;
create policy "notif read" on public.notifications for select to authenticated using(is_approved() and (not for_managers or is_manager()) and (to_user is null or to_user=auth.uid()));

create or replace function public.trg_dg_task() returns trigger language plpgsql security definer set search_path=public as $$
declare u uuid; olda uuid[];
begin
  olda:=case when tg_op='UPDATE' then old.assignees else '{}'::uuid[] end;
  foreach u in array new.assignees loop
    if not (u=any(olda)) and u is distinct from auth.uid() then
      insert into notifications(kind,title,body,link,to_user) values('task','Новая задача: '||new.title,coalesce(nullif(new.descr,''),'Тебя назначили исполнителем.')||case when new.deadline is not null then ' Срок: '||mon_ru(new.deadline) else '' end,'dg',u);
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists dg_task_notify on public.dg_tasks;
create trigger dg_task_notify after insert or update of assignees on public.dg_tasks for each row execute function public.trg_dg_task();

create or replace function public.trg_dg_comment() returns trigger language plpgsql security definer set search_path=public as $$
declare t record; u uuid; nm text;
begin
  select * into t from dg_tasks where id=new.task_id;
  select full_name into nm from profiles where id=new.author;
  foreach u in array (t.assignees || coalesce(array[t.created_by],'{}'::uuid[])) loop
    if u is not null and u is distinct from new.author then
      insert into notifications(kind,title,body,link,to_user) values('task','Комментарий: '||t.title,coalesce(nm,'Кто-то')||': '||new.body,'dg',u);
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists dg_comment_notify on public.dg_comments;
create trigger dg_comment_notify after insert on public.dg_comments for each row execute function public.trg_dg_comment();

-- realtime (если доступен)
do $$ begin
  begin alter publication supabase_realtime add table public.dg_tasks; exception when others then null; end;
  begin alter publication supabase_realtime add table public.dg_comments; exception when others then null; end;
end $$;

-- стартовая доска
do $$ declare b uuid; begin
  if not exists(select 1 from public.dg_boards) then
    insert into public.dg_boards(title) values('Основная доска') returning id into b;
    insert into public.dg_columns(board_id,title,color,pos) values
      (b,'Нужно сделать','#BCC8D6',1),(b,'В работе','#E6CC8F',2),(b,'На проверке','#D3BFD0',3),(b,'Готово','#C9D4B0',4);
  end if;
end $$;
