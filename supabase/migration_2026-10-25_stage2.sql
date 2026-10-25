-- Этап 2: чек-листы смены, журнал происшествий, заявки (отгулы/обмен сменами), ознакомление с новостями, база знаний, контакты.
-- Выполнить целиком в Supabase -> SQL Editor. Повторный запуск безопасен.

-- ===== 1. Чек-листы открытия/закрытия =====
create table if not exists public.shift_lists(
  id bigint generated always as identity primary key,
  title text not null,
  kind text not null check(kind in('open','close')),
  zone text,
  items text[] not null default '{}',
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now());
create table if not exists public.shift_checks(
  list_id bigint not null references public.shift_lists on delete cascade,
  day date not null,
  item text not null,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  at timestamptz default now(),
  primary key(list_id,day,item));
alter table public.shift_lists enable row level security; alter table public.shift_checks enable row level security;
drop policy if exists "sl read" on public.shift_lists; drop policy if exists "sl write" on public.shift_lists;
create policy "sl read" on public.shift_lists for select to authenticated using(is_approved());
create policy "sl write" on public.shift_lists for all to authenticated using(is_manager()) with check(is_manager());
drop policy if exists "sc read" on public.shift_checks; drop policy if exists "sc insert" on public.shift_checks; drop policy if exists "sc delete" on public.shift_checks;
create policy "sc read" on public.shift_checks for select to authenticated using(is_approved());
create policy "sc insert" on public.shift_checks for insert to authenticated with check(is_approved() and user_id=auth.uid());
create policy "sc delete" on public.shift_checks for delete to authenticated using(is_approved() and (user_id=auth.uid() or is_manager()));

-- стартовые шаблоны (примерные — руководитель правит под реальные регламенты)
do $$ declare z text; i int:=0; begin
  if not exists(select 1 from public.shift_lists) then
    foreach z in array array['Веревочный лагерь','Золото','Гольф','Альфа','Боулинг','Кино','VR-арена','Детский клуб'] loop
      i:=i+1;
      insert into public.shift_lists(title,kind,zone,sort,items) values
        (z||' · открытие','open',z,i*2,array['Осмотрел(а) зону: нет повреждений и посторонних предметов','Проверил(а) оборудование и ограждения','Есть связь (рация), аптечка на месте','Инвентарь подготовлен','Зона готова к приёму гостей']),
        (z||' · закрытие','close',z,i*2+1,array['Гостей в зоне нет','Оборудование выключено и зафиксировано','Инвентарь убран','Мусор убран, зона осмотрена','Зона закрыта']);
    end loop;
  end if;
end $$;

-- ===== 2. Журнал происшествий =====
create table if not exists public.incidents(
  id uuid primary key default gen_random_uuid(),
  day date not null default ((now() at time zone 'Europe/Moscow')::date),
  at_time text,
  zone text,
  kind text not null default 'other' check(kind in('injury','breakdown','conflict','loss','other')),
  severity text not null default 'low' check(severity in('low','mid','high')),
  descr text not null,
  actions text,
  people text,
  reported_by uuid default auth.uid() references public.profiles,
  status text not null default 'new' check(status in('new','review','closed')),
  resolution text,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.inc_files(
  id uuid primary key default gen_random_uuid(),
  inc_id uuid not null references public.incidents on delete cascade,
  path text not null, name text, mime text, size int,
  uploaded_by uuid default auth.uid() references public.profiles,
  created_at timestamptz default now());
alter table public.incidents enable row level security; alter table public.inc_files enable row level security;
drop policy if exists "inc read" on public.incidents; drop policy if exists "inc insert" on public.incidents; drop policy if exists "inc update" on public.incidents; drop policy if exists "inc delete" on public.incidents;
create policy "inc read" on public.incidents for select to authenticated using(is_approved() and (is_manager() or reported_by=auth.uid()));
create policy "inc insert" on public.incidents for insert to authenticated with check(is_approved() and reported_by=auth.uid());
create policy "inc update" on public.incidents for update to authenticated using(is_manager()) with check(is_manager());
create policy "inc delete" on public.incidents for delete to authenticated using(is_manager());
drop policy if exists "incf read" on public.inc_files; drop policy if exists "incf insert" on public.inc_files; drop policy if exists "incf delete" on public.inc_files;
create policy "incf read" on public.inc_files for select to authenticated using(exists(select 1 from public.incidents i where i.id=inc_id));
create policy "incf insert" on public.inc_files for insert to authenticated with check(uploaded_by=auth.uid() and exists(select 1 from public.incidents i where i.id=inc_id));
create policy "incf delete" on public.inc_files for delete to authenticated using(uploaded_by=auth.uid() or is_manager());

insert into storage.buckets(id,name,public,file_size_limit) values('inc','inc',false,10485760) on conflict(id) do nothing;
drop policy if exists "inc obj read" on storage.objects; drop policy if exists "inc obj insert" on storage.objects; drop policy if exists "inc obj delete" on storage.objects;
create policy "inc obj read" on storage.objects for select to authenticated using(bucket_id='inc' and exists(select 1 from public.incidents i where i.id::text=(storage.foldername(name))[1]));
create policy "inc obj insert" on storage.objects for insert to authenticated with check(bucket_id='inc' and exists(select 1 from public.incidents i where i.id::text=(storage.foldername(name))[1]));
create policy "inc obj delete" on storage.objects for delete to authenticated using(bucket_id='inc' and (owner=auth.uid() or is_manager()));

create or replace function public.trg_incident() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    if not is_manager() then new.status:='new'; new.resolution:=null; end if;
    new.reported_by:=coalesce(auth.uid(),new.reported_by);
    return new;
  end if;
  new.updated_at:=now(); return new;
end $$;
drop trigger if exists inc_before on public.incidents;
create trigger inc_before before insert or update on public.incidents for each row execute function public.trg_incident();
create or replace function public.trg_incident_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  select full_name into nm from profiles where id=new.reported_by;
  insert into notifications(kind,title,body,link,for_managers) values('incident',case when new.severity='high' then '🚨 ' else '' end||'Происшествие: '||coalesce(new.zone,'парк'),coalesce(nm,'Сотрудник')||': '||left(new.descr,200),'inc',true);
  return new;
end $$;
drop trigger if exists inc_notify on public.incidents;
create trigger inc_notify after insert on public.incidents for each row execute function public.trg_incident_notify();

-- ===== 3. Заявки: отгулы / ДО / отпуск / обмен сменами =====
create table if not exists public.requests(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check(kind in('otgul','do','vac','swap')),
  day date not null,                -- день (для обмена — мой день, который выйдет коллега)
  day_to date,                      -- конец отпуска
  peer_id uuid references public.profiles on delete cascade,
  peer_day date,                    -- день коллеги, который выйду я
  note text,
  status text not null default 'pending' check(status in('peer','pending','approved','rejected','cancelled')),
  decision_note text, decided_by uuid, decided_at timestamptz,
  created_at timestamptz default now());
create index if not exists requests_user on public.requests(user_id, created_at desc);
alter table public.requests enable row level security;
drop policy if exists "req read" on public.requests; drop policy if exists "req insert" on public.requests; drop policy if exists "req cancel" on public.requests;
create policy "req read" on public.requests for select to authenticated using(is_approved() and (user_id=auth.uid() or peer_id=auth.uid() or is_manager()));
create policy "req insert" on public.requests for insert to authenticated with check(is_approved() and user_id=auth.uid() and ((kind='swap' and status='peer' and peer_id is not null and peer_id<>auth.uid() and peer_day is not null) or (kind<>'swap' and status='pending')));
create policy "req cancel" on public.requests for update to authenticated using(user_id=auth.uid() and status in('peer','pending')) with check(user_id=auth.uid() and status='cancelled');

create or replace function public.kind_ru(k text) returns text language sql immutable as $$ select case k when 'otgul' then 'отгул' when 'do' then 'ДО' when 'vac' then 'отпуск' when 'swap' then 'обмен сменами' else k end $$;

create or replace function public.trg_request() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  select full_name into nm from profiles where id=new.user_id;
  if new.kind='swap' then
    insert into notifications(kind,title,body,link,to_user) values('request','Предлагают обмен сменами',coalesce(nm,'Коллега')||': выйду '||mon_ru(new.peer_day)||' вместо тебя, ты — '||mon_ru(new.day)||'. Ответь в «Заявках».','req',new.peer_id);
  else
    insert into notifications(kind,title,body,link,for_managers) values('request','Новая заявка: '||kind_ru(new.kind),coalesce(nm,'Сотрудник')||' · '||mon_ru(new.day)||case when new.day_to is not null and new.day_to<>new.day then ' — '||mon_ru(new.day_to) else '' end||coalesce(' · '||nullif(new.note,''),''),'req',true);
  end if;
  return new;
end $$;
drop trigger if exists req_notify on public.requests;
create trigger req_notify after insert on public.requests for each row execute function public.trg_request();

-- коллега отвечает на предложение обмена
create or replace function public.peer_answer(p_id uuid, p_ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare r record; nm text;
begin
  select * into r from requests where id=p_id;
  if r.id is null or r.peer_id is distinct from auth.uid() or r.status<>'peer' then raise exception 'Нельзя ответить на эту заявку'; end if;
  select full_name into nm from profiles where id=r.peer_id;
  if p_ok then
    update requests set status='pending' where id=p_id;
    insert into notifications(kind,title,body,link,to_user) values('request','Коллега согласен на обмен',coalesce(nm,'Коллега')||' согласен. Теперь заявку рассмотрит руководитель.','req',r.user_id);
    insert into notifications(kind,title,body,link,for_managers) values('request','Заявка на обмен сменами',(select full_name from profiles where id=r.user_id)||' ⇄ '||coalesce(nm,'')||': '||mon_ru(r.day)||' / '||mon_ru(r.peer_day),'req',true);
  else
    update requests set status='rejected', decision_note='Коллега отказался', decided_at=now() where id=p_id;
    insert into notifications(kind,title,body,link,to_user) values('request','Обмен сменами: коллега отказался',coalesce(nm,'Коллега')||' не может поменяться.','req',r.user_id);
  end if;
end $$;

-- руководитель решает; при одобрении отметки в графике ставятся сами
create or replace function public.decide_request(p_id uuid, p_ok boolean, p_note text default null) returns void language plpgsql security definer set search_path=public as $$
declare r record; d date; mk text;
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  select * into r from requests where id=p_id;
  if r.id is null or r.status<>'pending' then raise exception 'Заявка уже рассмотрена'; end if;
  update requests set status=case when p_ok then 'approved' else 'rejected' end, decision_note=nullif(p_note,''), decided_by=auth.uid(), decided_at=now() where id=p_id;
  if p_ok then
    if r.kind='swap' then
      insert into marks(user_id,day,kind,note) values(r.user_id,r.day,'off','обмен сменами') on conflict(user_id,day) do update set kind='off', note='обмен сменами';
      delete from marks where user_id=r.user_id and day=r.peer_day;
      insert into marks(user_id,day,kind,note) values(r.peer_id,r.peer_day,'off','обмен сменами') on conflict(user_id,day) do update set kind='off', note='обмен сменами';
      delete from marks where user_id=r.peer_id and day=r.day;
    else
      mk:=r.kind;
      for d in select generate_series(r.day, coalesce(r.day_to,r.day), interval '1 day')::date loop
        insert into marks(user_id,day,kind,note) values(r.user_id,d,mk,'по заявке') on conflict(user_id,day) do update set kind=mk, note='по заявке';
      end loop;
    end if;
  end if;
  insert into notifications(kind,title,body,link,to_user) values('request',case when p_ok then '✅ Заявка одобрена' else '❌ Заявка отклонена' end,kind_ru(r.kind)||' · '||mon_ru(r.day)||coalesce('. '||nullif(p_note,''),''),'req',r.user_id);
  if r.kind='swap' then
    insert into notifications(kind,title,body,link,to_user) values('request',case when p_ok then '✅ Обмен сменами одобрен' else '❌ Обмен сменами отклонён' end,mon_ru(r.peer_day)||' / '||mon_ru(r.day)||coalesce('. '||nullif(p_note,''),''),'req',r.peer_id);
  end if;
end $$;

-- ===== 4. Новости: подтверждение ознакомления =====
alter table public.news add column if not exists require_ack boolean not null default false;
create table if not exists public.news_acks(
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  news_id bigint not null references public.news on delete cascade,
  at timestamptz default now(),
  primary key(user_id,news_id));
alter table public.news_acks enable row level security;
drop policy if exists "ack read" on public.news_acks; drop policy if exists "ack insert" on public.news_acks;
create policy "ack read" on public.news_acks for select to authenticated using(is_approved() and (user_id=auth.uid() or is_manager()));
create policy "ack insert" on public.news_acks for insert to authenticated with check(is_approved() and user_id=auth.uid());
create or replace function public.trg_news() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into notifications(kind,title,body,link) values('news',case when new.require_ack then '❗ Нужно ознакомиться: ' else '' end||new.title,new.body,'news');
  return new;
end $$;
create or replace function public.remind_news(p_id bigint) returns int language plpgsql security definer set search_path=public as $$
declare n int; t text;
begin
  if not is_manager() then raise exception 'Только руководитель'; end if;
  select title into t from news where id=p_id;
  insert into notifications(kind,title,body,link,to_user)
    select 'news','❗ Напоминание: ознакомься с новостью',t,'news',p.id from profiles p where p.status='approved' and not exists(select 1 from news_acks a where a.news_id=p_id and a.user_id=p.id);
  get diagnostics n=row_count; return n;
end $$;

-- ===== 5. База знаний =====
create table if not exists public.kb_pages(
  id bigint generated always as identity primary key,
  title text not null, category text not null default 'Общее', body text not null default '',
  pinned boolean not null default false,
  updated_by uuid default auth.uid(), updated_at timestamptz default now(), created_at timestamptz default now());
alter table public.kb_pages enable row level security;
drop policy if exists "kb read" on public.kb_pages; drop policy if exists "kb write" on public.kb_pages;
create policy "kb read" on public.kb_pages for select to authenticated using(is_approved());
create policy "kb write" on public.kb_pages for all to authenticated using(is_manager()) with check(is_manager());
create or replace function public.kb_touch() returns trigger language plpgsql as $$ begin new.updated_at:=now(); new.updated_by:=auth.uid(); return new; end $$;
drop trigger if exists kb_touch on public.kb_pages;
create trigger kb_touch before update on public.kb_pages for each row execute function public.kb_touch();
insert into public.kb_pages(title,category,pinned,body)
select 'Как пользоваться приложением','Приложение',true,E'# Коротко о главном\n\n- **Ротации** — кто где стоит и когда перерыв. Вверху выбери день и команду.\n- **График** — твои выходные, отгулы и переработки.\n- **DreamGile** — задачи команды. Зажми карточку пальцем и перетащи в другую колонку.\n- **Смена** — чек-листы открытия и закрытия зон.\n- **Заявки** — отгул, ДО, отпуск или обмен сменами.\n- Если что-то сломалось в зоне, нажми «Сообщить о поломке» в DreamGile.\n\nЕсли чего-то не нашёл — напиши руководителю.'
where not exists(select 1 from public.kb_pages);

-- ===== 6. Контакты =====
alter table public.profiles add column if not exists phone text;
create or replace function public.set_my_phone(p text) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_approved() then raise exception 'Нет доступа'; end if;
  update profiles set phone=nullif(trim(p),'') where id=auth.uid();
end $$;
