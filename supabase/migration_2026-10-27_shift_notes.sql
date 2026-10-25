-- Комментарии к спискам смены (открытие/закрытие): «нужны журналы» и т.п. Руководителям приходит уведомление.
create table if not exists public.shift_notes(
  id bigint generated always as identity primary key,
  list_id bigint not null references public.shift_lists on delete cascade,
  day date not null,
  item text,
  body text not null check(length(trim(body))>0),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz default now());
create index if not exists shift_notes_day on public.shift_notes(day);
alter table public.shift_notes enable row level security;
drop policy if exists "sn read" on public.shift_notes; drop policy if exists "sn insert" on public.shift_notes; drop policy if exists "sn delete" on public.shift_notes;
create policy "sn read" on public.shift_notes for select to authenticated using(is_approved());
create policy "sn insert" on public.shift_notes for insert to authenticated with check(is_approved() and user_id=auth.uid());
create policy "sn delete" on public.shift_notes for delete to authenticated using(is_approved() and (user_id=auth.uid() or is_manager()));

create or replace function public.trg_shift_note() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text; z text;
begin
  select full_name into nm from profiles where id=new.user_id;
  select coalesce(zone,title) into z from shift_lists where id=new.list_id;
  insert into notifications(kind,title,body,link,for_managers) values('shift','Смена · '||coalesce(z,'')||': комментарий',coalesce(nm,'Сотрудник')||': '||left(new.body,160),'shift',true);
  return new;
end $$;
drop trigger if exists shift_note_notify on public.shift_notes;
create trigger shift_note_notify after insert on public.shift_notes for each row execute function public.trg_shift_note();
