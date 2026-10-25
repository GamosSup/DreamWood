-- Вход по номеру телефона + паролю. Почта для связи необязательна.
-- Технически логин в auth — это <цифры номера>@dreamwood.pages.dev (письма на него не отправляются).
-- 1. Подтверждаем всех существующих (аккаунт «Тест Системы» не входил из-за неподтверждённой почты)
update auth.users set email_confirmed_at=coalesce(email_confirmed_at,now()) where email_confirmed_at is null;
-- 2. Переводим существующие аккаунты на логин по телефону; реальная почта остаётся в profiles.email
do $$
declare r record; d text; ne text;
begin
  for r in select u.id, p.phone from auth.users u join profiles p on p.id=u.id where p.phone is not null and u.email not like '%@dreamwood.pages.dev' loop
    d:=regexp_replace(r.phone,'\D','','g');
    if length(d)=11 and left(d,1)='8' then d:='7'||substr(d,2); end if;
    if length(d)=10 then d:='7'||d; end if;
    if length(d) between 11 and 15 then
      ne:=d||'@dreamwood.pages.dev';
      update auth.users set email=ne, updated_at=now() where id=r.id;
      update auth.identities set provider_id=r.id::text, identity_data=jsonb_set(identity_data,'{email}',to_jsonb(ne)), updated_at=now() where user_id=r.id and provider='email';
      update profiles set phone='+'||d where id=r.id;
    end if;
  end loop;
end $$;
-- 3. Новый пользователь: почта для связи берётся из формы (может быть пустой)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,full_name,email,status,phone) values(new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),new.email),
    case when new.email like '%@dreamwood.pages.dev' then nullif(trim(coalesce(new.raw_user_meta_data->>'contact_email','')),'') else new.email end,
    'pending',nullif(trim(coalesce(new.raw_user_meta_data->>'phone','')),''));
  return new;
end $$;
-- 4. Смена номера меняет и логин
create or replace function public.set_my_phone(p text) returns void language plpgsql security definer set search_path=public,auth as $$
declare d text:=regexp_replace(coalesce(p,''),'\D','','g'); ne text;
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  if length(d)=11 and left(d,1)='8' then d:='7'||substr(d,2); end if;
  if length(d)=10 then d:='7'||d; end if;
  if length(d) not between 11 and 15 then raise exception 'Введи номер полностью, например +7 978 123-45-67'; end if;
  ne:=d||'@dreamwood.pages.dev';
  if exists(select 1 from auth.users where email=ne and id<>auth.uid()) then raise exception 'Этот номер уже занят'; end if;
  update auth.users set email=ne, updated_at=now() where id=auth.uid();
  update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(ne)), updated_at=now() where user_id=auth.uid() and provider='email';
  update profiles set phone='+'||d where id=auth.uid();
end $$;
