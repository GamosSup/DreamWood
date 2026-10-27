-- Имя питомца в профиле (до 16 символов), остальное как раньше
create or replace function public.set_my_cos(p jsonb) returns void language plpgsql security definer set search_path=public as $$
declare k text; clean jsonb:='{}'::jsonb;
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  for k in select jsonb_object_keys(coalesce(p,'{}'::jsonb)) loop
    if k in('frame','name','bg','badge','title') and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 80 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='pet' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 300 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='motto' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 80 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='bio' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 400 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='fav' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 120 then
      clean:=clean||jsonb_build_object(k,p->>k);
    elsif k='pname' and jsonb_typeof(p->k)='string' and length(p->>k) between 1 and 16 then
      clean:=clean||jsonb_build_object(k,p->>k);
    end if;
  end loop;
  update profiles set cos=clean where id=auth.uid();
end $$;
grant execute on function public.set_my_cos(jsonb) to authenticated;
select pg_get_functiondef('public.set_my_cos(jsonb)'::regprocedure) like '%pname%' as ok;
