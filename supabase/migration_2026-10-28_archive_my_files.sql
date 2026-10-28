-- Ручной архив ротаций и личные файлы в базе знаний. Выполнить в Supabase → SQL Editor. Повторный запуск безопасен.

-- Отдельное поле не меняет data, поэтому архивация не вызывает уведомление «Ротация обновлена».
alter table public.rotations add column if not exists archived_at timestamptz;
update public.rotations set archived_at=coalesce(archived_at,now())
where day in ('2026-10-23','2026-10-24','2026-10-25');

create table if not exists public.my_folders(
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null check(char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.my_files(
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references public.profiles on delete cascade,
  folder_id uuid references public.my_folders on delete set null,
  path text not null unique,
  name text not null check(char_length(btrim(name)) between 1 and 255),
  mime text,
  size bigint not null default 0 check(size>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.my_shares(
  file_id uuid not null references public.my_files on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key(file_id,to_user)
);
create index if not exists my_files_owner on public.my_files(owner,created_at desc);
create index if not exists my_files_folder on public.my_files(folder_id);
create index if not exists my_shares_user on public.my_shares(to_user,file_id);

alter table public.my_folders enable row level security;
alter table public.my_files enable row level security;
alter table public.my_shares enable row level security;

-- Обходит RLS только для проверки владельца; не возвращает сам файл или его содержимое.
create or replace function public.my_file_owner(p_file uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.my_files where id=p_file and owner=auth.uid())
$$;
revoke all on function public.my_file_owner(uuid) from public;
grant execute on function public.my_file_owner(uuid) to authenticated;

create or replace function public.my_touch() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists my_folders_touch on public.my_folders;
create trigger my_folders_touch before update on public.my_folders for each row execute function public.my_touch();
drop trigger if exists my_files_touch on public.my_files;
create trigger my_files_touch before update on public.my_files for each row execute function public.my_touch();

drop policy if exists "my folders own" on public.my_folders;
create policy "my folders own" on public.my_folders for all to authenticated
  using(is_approved() and owner=auth.uid()) with check(is_approved() and owner=auth.uid());

drop policy if exists "my files read" on public.my_files;
create policy "my files read" on public.my_files for select to authenticated using(
  is_approved() and (owner=auth.uid() or exists(
    select 1 from public.my_shares s where s.file_id=id and s.to_user=auth.uid()
  ))
);
drop policy if exists "my files insert" on public.my_files;
create policy "my files insert" on public.my_files for insert to authenticated with check(
  is_approved() and owner=auth.uid() and (folder_id is null or exists(
    select 1 from public.my_folders f where f.id=folder_id and f.owner=auth.uid()
  ))
);
drop policy if exists "my files update" on public.my_files;
create policy "my files update" on public.my_files for update to authenticated
  using(is_approved() and owner=auth.uid()) with check(
    is_approved() and owner=auth.uid() and (folder_id is null or exists(
      select 1 from public.my_folders f where f.id=folder_id and f.owner=auth.uid()
    ))
  );
drop policy if exists "my files delete" on public.my_files;
create policy "my files delete" on public.my_files for delete to authenticated
  using(is_approved() and owner=auth.uid());

drop policy if exists "my shares read" on public.my_shares;
create policy "my shares read" on public.my_shares for select to authenticated using(
  is_approved() and (to_user=auth.uid() or public.my_file_owner(file_id))
);
drop policy if exists "my shares insert" on public.my_shares;
create policy "my shares insert" on public.my_shares for insert to authenticated with check(
  is_approved() and public.my_file_owner(file_id) and created_by=auth.uid() and to_user<>auth.uid()
  and exists(select 1 from public.profiles p where p.id=to_user and p.status='approved')
);
drop policy if exists "my shares delete" on public.my_shares;
create policy "my shares delete" on public.my_shares for delete to authenticated
  using(is_approved() and public.my_file_owner(file_id));

grant select,insert,update,delete on public.my_folders,public.my_files,public.my_shares to authenticated;

-- Резервное хранилище для серверов без настройки Google Drive. Путь: <id владельца>/<uuid>.<расширение>.
insert into storage.buckets(id,name,public,file_size_limit) values('my','my',false,100663296)
on conflict(id) do update set file_size_limit=excluded.file_size_limit;

-- Проверка доступа к конкретному объекту для владельца и коллег, которым файл отправлен.
create or replace function public.my_path_access(p_path text) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.my_files f
    where f.path=p_path and (f.owner=auth.uid() or exists(
      select 1 from public.my_shares s where s.file_id=f.id and s.to_user=auth.uid()
    ))
  )
$$;
revoke all on function public.my_path_access(text) from public;
grant execute on function public.my_path_access(text) to authenticated;

drop policy if exists "my obj read" on storage.objects;
create policy "my obj read" on storage.objects for select to authenticated using(
  bucket_id='my' and is_approved() and public.my_path_access(name)
);
drop policy if exists "my obj insert" on storage.objects;
create policy "my obj insert" on storage.objects for insert to authenticated with check(
  bucket_id='my' and is_approved() and (storage.foldername(name))[1]=auth.uid()::text
);
drop policy if exists "my obj delete" on storage.objects;
create policy "my obj delete" on storage.objects for delete to authenticated using(
  bucket_id='my' and is_approved() and (storage.foldername(name))[1]=auth.uid()::text
);
