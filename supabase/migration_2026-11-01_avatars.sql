-- Фото профиля: публичный бакет avatars (папка = id пользователя), путь хранится в profiles.avatar_url
alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

drop policy if exists "avatars read" on storage.objects;
drop policy if exists "avatars insert" on storage.objects;
drop policy if exists "avatars delete" on storage.objects;
create policy "avatars read" on storage.objects for select to authenticated, anon using(bucket_id='avatars');
create policy "avatars insert" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatars delete" on storage.objects for delete to authenticated using(bucket_id='avatars' and ((storage.foldername(name))[1]=auth.uid()::text or is_admin()));

create or replace function public.set_my_avatar(p text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  if p is not null and split_part(p,'/',1)<>auth.uid()::text then raise exception 'Чужая папка'; end if;
  update profiles set avatar_url=p where id=auth.uid();
end $$;
grant execute on function public.set_my_avatar(text) to authenticated;
