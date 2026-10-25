-- Поломки: любой сотрудник присылает описание + фото/видео, руководители получают уведомление и ведут статус.
create table if not exists public.repairs(
  id uuid primary key default gen_random_uuid(),
  zone text,
  descr text not null,
  urgent boolean not null default false,
  status text not null default 'new' check(status in('new','work','done')),
  resolution text,
  reported_by uuid default auth.uid() references public.profiles,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.repair_files(
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repairs on delete cascade,
  path text not null, name text, mime text, size bigint,
  uploaded_by uuid default auth.uid() references public.profiles,
  created_at timestamptz default now());
alter table public.repairs enable row level security; alter table public.repair_files enable row level security;
drop policy if exists "rep read" on public.repairs; drop policy if exists "rep insert" on public.repairs; drop policy if exists "rep update" on public.repairs; drop policy if exists "rep delete" on public.repairs;
create policy "rep read" on public.repairs for select to authenticated using(is_approved() and (is_manager() or reported_by=auth.uid()));
create policy "rep insert" on public.repairs for insert to authenticated with check(is_approved() and reported_by=auth.uid());
create policy "rep update" on public.repairs for update to authenticated using(is_manager()) with check(is_manager());
create policy "rep delete" on public.repairs for delete to authenticated using(is_manager());
drop policy if exists "repf read" on public.repair_files; drop policy if exists "repf insert" on public.repair_files; drop policy if exists "repf delete" on public.repair_files;
create policy "repf read" on public.repair_files for select to authenticated using(exists(select 1 from public.repairs r where r.id=repair_id));
create policy "repf insert" on public.repair_files for insert to authenticated with check(uploaded_by=auth.uid() and exists(select 1 from public.repairs r where r.id=repair_id));
create policy "repf delete" on public.repair_files for delete to authenticated using(uploaded_by=auth.uid() or is_manager());

insert into storage.buckets(id,name,public,file_size_limit) values('repairs','repairs',false,52428800) on conflict(id) do update set file_size_limit=52428800;
drop policy if exists "rep obj read" on storage.objects; drop policy if exists "rep obj insert" on storage.objects; drop policy if exists "rep obj delete" on storage.objects;
create policy "rep obj read" on storage.objects for select to authenticated using(bucket_id='repairs' and exists(select 1 from public.repairs r where r.id::text=(storage.foldername(name))[1]));
create policy "rep obj insert" on storage.objects for insert to authenticated with check(bucket_id='repairs' and exists(select 1 from public.repairs r where r.id::text=(storage.foldername(name))[1]));
create policy "rep obj delete" on storage.objects for delete to authenticated using(bucket_id='repairs' and (owner=auth.uid() or is_manager()));

create or replace function public.trg_repair() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    if not is_manager() then new.status:='new'; new.resolution:=null; end if;
    new.reported_by:=coalesce(auth.uid(),new.reported_by);
    return new;
  end if;
  new.updated_at:=now(); return new;
end $$;
drop trigger if exists rep_before on public.repairs;
create trigger rep_before before insert or update on public.repairs for each row execute function public.trg_repair();

create or replace function public.trg_repair_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  if tg_op='INSERT' then
    select full_name into nm from profiles where id=new.reported_by;
    insert into notifications(kind,title,body,link,for_managers) values('repair',case when new.urgent then '🚨 Срочно: ' else '🛠 ' end||'поломка — '||coalesce(new.zone,'парк'),coalesce(nm,'Сотрудник')||': '||left(new.descr,200),'fix',true);
  elsif new.status is distinct from old.status and new.reported_by is not null then
    insert into notifications(kind,title,body,link,to_user) values('repair',
      case new.status when 'work' then '🔧 Поломка взята в работу' when 'done' then '✅ Поломка устранена' else '🛠 Статус поломки изменён' end,
      coalesce(new.zone,'парк')||': '||left(new.descr,120)||coalesce(' — '||nullif(new.resolution,''),''),'fix',new.reported_by);
  end if;
  return new;
end $$;
drop trigger if exists rep_notify on public.repairs;
create trigger rep_notify after insert or update of status on public.repairs for each row execute function public.trg_repair_notify();
