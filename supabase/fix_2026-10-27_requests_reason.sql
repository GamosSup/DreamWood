-- Заявки (отгул, ДО, больничный, отпуск, обмен) без причины не принимаются
create or replace function public.requests_need_reason() returns trigger language plpgsql as $$
begin
  if new.note is null or length(trim(new.note))<3 then raise exception 'Напиши причину заявки'; end if;
  return new;
end $$;
drop trigger if exists requests_need_reason on public.requests;
create trigger requests_need_reason before insert on public.requests for each row execute function public.requests_need_reason();
