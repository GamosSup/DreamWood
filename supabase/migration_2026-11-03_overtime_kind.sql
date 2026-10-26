-- Доработки и переработки: два вида записей в таблице overtime.
-- d (по умолчанию) — доработка: добор часов из-за нехватки по графику (мероприятия)
-- p — переработка: часы сверх нормы
alter table public.overtime add column if not exists kind text not null default 'd';
do $$ begin
  if not exists(select 1 from pg_constraint where conname='overtime_kind_chk') then
    alter table public.overtime add constraint overtime_kind_chk check(kind in ('d','p'));
  end if;
end $$;
