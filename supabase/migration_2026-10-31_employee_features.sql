-- 1. Обратная связь: пишут все, читает только админ, сотрудник видит свои + отметку «прочитано»
create table if not exists public.feedback(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check(kind in('idea','bug')),
  body text not null check(length(trim(body))>0),
  status text not null default 'new' check(status in('new','read','done')),
  read_at timestamptz,
  created_at timestamptz default now());
alter table public.feedback enable row level security;
drop policy if exists "fb read" on public.feedback; drop policy if exists "fb insert" on public.feedback; drop policy if exists "fb update" on public.feedback; drop policy if exists "fb delete" on public.feedback;
create policy "fb read" on public.feedback for select to authenticated using(is_approved() and (user_id=auth.uid() or is_admin()));
create policy "fb insert" on public.feedback for insert to authenticated with check(is_approved() and user_id=auth.uid());
create policy "fb update" on public.feedback for update to authenticated using(is_admin()) with check(is_admin());
create policy "fb delete" on public.feedback for delete to authenticated using(is_admin());
create or replace function public.trg_feedback() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  select full_name into nm from profiles where id=new.user_id;
  insert into notifications(kind,title,body,link,to_user)
  select 'feedback',case when new.kind='idea' then '💡 Идея от ' else '🛠 Что-то сломалось: ' end||coalesce(nm,'сотрудника'),left(new.body,200),'feedback',a.id from profiles a where a.role='admin' and a.status='approved';
  return new;
end $$;
drop trigger if exists on_feedback_notify on public.feedback;
create trigger on_feedback_notify after insert on public.feedback for each row execute function public.trg_feedback();

-- 2. Обращения: «просмотрено», расширенные статусы, переписка
alter table public.requests add column if not exists seen_at timestamptz, add column if not exists seen_by uuid;
alter table public.repairs add column if not exists seen_at timestamptz, add column if not exists seen_by uuid;
alter table public.incidents add column if not exists seen_at timestamptz, add column if not exists seen_by uuid;
alter table public.repairs drop constraint if exists repairs_status_check;
alter table public.repairs add constraint repairs_status_check check(status in('new','work','clarify','done','rejected'));
alter table public.incidents drop constraint if exists incidents_status_check;
alter table public.incidents add constraint incidents_status_check check(status in('new','review','work','clarify','done','rejected','closed'));
alter table public.requests drop constraint if exists requests_kind_check;
alter table public.requests add constraint requests_kind_check check(kind in('otgul','do','vac','sick','swap'));
create or replace function public.mark_seen(p_kind text, p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if p_kind='req' then
    update requests set seen_at=now(), seen_by=auth.uid() where id=p_id and seen_at is null and user_id<>auth.uid() and can_manage(user_id);
  elsif p_kind='fix' and is_manager() then
    update repairs set seen_at=now(), seen_by=auth.uid() where id=p_id and seen_at is null and reported_by<>auth.uid();
  elsif p_kind='inc' and is_manager() then
    update incidents set seen_at=now(), seen_by=auth.uid() where id=p_id and seen_at is null and reported_by<>auth.uid();
  end if;
end $$;
grant execute on function public.mark_seen(text,uuid) to authenticated;
create table if not exists public.ap_msgs(
  id bigint generated always as identity primary key,
  kind text not null check(kind in('req','fix','inc')),
  ref_id uuid not null,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check(length(trim(body))>0),
  created_at timestamptz default now());
create index if not exists ap_msgs_ref on public.ap_msgs(kind,ref_id);
alter table public.ap_msgs enable row level security;
drop policy if exists "apm read" on public.ap_msgs; drop policy if exists "apm insert" on public.ap_msgs;
create policy "apm read" on public.ap_msgs for select to authenticated using(is_approved() and (
  (kind='req' and exists(select 1 from requests r where r.id=ref_id)) or
  (kind='fix' and exists(select 1 from repairs r where r.id=ref_id)) or
  (kind='inc' and exists(select 1 from incidents r where r.id=ref_id))));
create policy "apm insert" on public.ap_msgs for insert to authenticated with check(is_approved() and user_id=auth.uid() and (
  (kind='req' and exists(select 1 from requests r where r.id=ref_id)) or
  (kind='fix' and exists(select 1 from repairs r where r.id=ref_id)) or
  (kind='inc' and exists(select 1 from incidents r where r.id=ref_id))));
create or replace function public.trg_ap_msg() returns trigger language plpgsql security definer set search_path=public as $$
declare own uuid; nk text; nm text;
begin
  if new.kind='req' then select user_id into own from requests where id=new.ref_id; nk:='request';
  elsif new.kind='fix' then select reported_by into own from repairs where id=new.ref_id; nk:='repair';
  else select reported_by into own from incidents where id=new.ref_id; nk:='incident'; end if;
  if own is null then return new; end if;
  select full_name into nm from profiles where id=new.user_id;
  if new.user_id=own then
    insert into notifications(kind,title,body,link,for_managers) values(nk,'💬 Ответ по обращению: '||coalesce(nm,'сотрудник'),left(new.body,200),new.kind,true);
  else
    insert into notifications(kind,title,body,link,to_user) values(nk,'💬 Вопрос по твоему обращению',left(new.body,200),new.kind,own);
  end if;
  return new;
end $$;
drop trigger if exists on_ap_msg on public.ap_msgs;
create trigger on_ap_msg after insert on public.ap_msgs for each row execute function public.trg_ap_msg();

-- 3. График сотрудника: отметки ставит только руководитель; сотрудник шлёт заявку или пишет комментарий к дню
drop policy if exists "marks own or manager" on public.marks;
drop policy if exists "marks read" on public.marks; drop policy if exists "marks write" on public.marks;
create policy "marks read" on public.marks for select to authenticated using(user_id=auth.uid() or can_manage(user_id));
create policy "marks write" on public.marks for all to authenticated using(can_manage(user_id) and (user_id<>auth.uid() or is_manager())) with check(can_manage(user_id) and (user_id<>auth.uid() or is_manager()));
create table if not exists public.day_notes(
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day date not null,
  body text not null,
  updated_at timestamptz default now(),
  primary key(user_id,day));
alter table public.day_notes enable row level security;
drop policy if exists "dn read" on public.day_notes; drop policy if exists "dn own" on public.day_notes;
create policy "dn read" on public.day_notes for select to authenticated using(is_approved() and (user_id=auth.uid() or can_manage(user_id)));
create policy "dn own" on public.day_notes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- 4. Личный блокнот: видит только владелец (даже админ не видит)
create table if not exists public.todos(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check(length(trim(body))>0),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz default now());
alter table public.todos enable row level security;
drop policy if exists "todos own" on public.todos;
create policy "todos own" on public.todos for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- 5. Длина рабочего дня для подсчёта часов (8 / 10 / 12): личная, иначе по умолчанию от команды
alter table public.roster add column if not exists day_len int check(day_len in(8,10,12));
alter table public.profiles add column if not exists day_len int check(day_len in(8,10,12));
update public.roster set day_len=12 where team='M' and day_len is null;
update public.roster set day_len=8 where day_len is null and (full_name ilike '%Олексюк%' or full_name ilike '%Прошутинск%' or full_name ilike '%Ярошенко%');
update public.profiles set day_len=10 where role='admin' and day_len is null;

-- 6. Аттракционы: чек-листы «Смены» и страницы базы знаний для всех зон из ротаций
insert into public.shift_lists(title,kind,zone,items,sort)
select 'Открытие: '||z,'open',z,array['Осмотрел(а) зону: нет повреждений и посторонних предметов','Проверил(а) оборудование и ограждения','Есть связь (рация), аптечка на месте','Инвентарь подготовлен','Зона готова к приёму гостей'],20+row_number() over()
from unnest(array['Бабл хаус','Данделион','Дерево приключений','Джипы','Карусель','Квесты/Роботы','Кон-Тики','Лес Чудес','Лучный тир','Пеликан','Площадь','Плющ','Терраса','Шахта','Студия волшебных образов','Зонты Метрополис','Мастер-классы (МК)']) z
where not exists(select 1 from public.shift_lists l where l.zone=z and l.kind='open');
insert into public.shift_lists(title,kind,zone,items,sort)
select 'Закрытие: '||z,'close',z,array['Гостей в зоне нет','Оборудование выключено и зафиксировано','Инвентарь убран','Мусор убран, зона осмотрена','Зона закрыта'],60+row_number() over()
from unnest(array['Бабл хаус','Данделион','Дерево приключений','Джипы','Карусель','Квесты/Роботы','Кон-Тики','Лес Чудес','Лучный тир','Пеликан','Площадь','Плющ','Терраса','Шахта','Студия волшебных образов','Зонты Метрополис','Мастер-классы (МК)']) z
where not exists(select 1 from public.shift_lists l where l.zone=z and l.kind='close');
insert into public.kb_pages(title,category,body,pinned)
select z,'Аттракционы','Скоро здесь появится нужная информация по этому аттракциону: как работает, правила безопасности, что делать при поломке.',false
from unnest(array['VR-арена','Альфа','Бабл хаус','Боулинг','Веревочный лагерь','Гольф','Данделион','Дерево приключений','Детский клуб','Джипы','Золото','Зонты Метрополис','Карусель','Квесты/Роботы','Кино','Кон-Тики','Лес Чудес','Лучный тир','Мастер-классы (МК)','Пеликан','Площадь','Плющ','Студия волшебных образов','Терраса','Шахта']) z
where not exists(select 1 from public.kb_pages k where k.title=z);
