-- Личный календарь: у личных дел появляются дата, время, вид (дело / дедлайн / событие) и заметка.
-- Видит только владелец (политика "todos own" остаётся как есть).
alter table public.todos add column if not exists due date;
alter table public.todos add column if not exists due_time time;
alter table public.todos add column if not exists due_end time;
alter table public.todos add column if not exists kind text not null default 'task';
alter table public.todos add column if not exists note text;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='todos_kind_chk') then
    alter table public.todos add constraint todos_kind_chk check(kind in ('task','deadline','event'));
  end if;
end $$;
create index if not exists todos_user_due on public.todos(user_id,due);
