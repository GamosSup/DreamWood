-- Блокнот-трекер, привычки, «Первая неделя» с наставником, вопросы наставнику, благодарности
-- Запускать в Supabase → SQL Editor (один раз). Безопасно повторять.

-- ============ 1. Блокнот: дополнительные поля дел ============
alter table public.todos add column if not exists prio smallint not null default 0;   -- 0 обычное, 1 важное
alter table public.todos add column if not exists tag text;
alter table public.todos add column if not exists subs jsonb not null default '[]'::jsonb; -- подзадачи [{t,d}]
alter table public.todos add column if not exists arch boolean not null default false;

-- ============ 2. Привычки (личные, видит только владелец) ============
create table if not exists public.habits(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check(length(trim(title))>0),
  icon text not null default '✅',
  days int[] not null default '{1,2,3,4,5,6,7}',   -- дни недели: 1 = Пн … 7 = Вс
  arch boolean not null default false,
  created_at timestamptz default now());
create table if not exists public.habit_logs(
  habit_id bigint not null references public.habits on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day date not null,
  primary key(habit_id,day));
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
drop policy if exists "habits own" on public.habits;
drop policy if exists "habit_logs own" on public.habit_logs;
create policy "habits own" on public.habits for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "habit_logs own" on public.habit_logs for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- ============ 3. Наставники ============
alter table public.profiles add column if not exists mentor_id uuid references public.profiles on delete set null;

create or replace function public.is_mentor_of(u uuid) returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from profiles where id=u and mentor_id=auth.uid()) $$;

create or replace function public.set_mentor(p_user uuid, p_mentor uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not is_manager() then raise exception 'only manager'; end if;
  if p_user is not null and p_user=p_mentor then raise exception 'нельзя назначить наставником самого себя'; end if;
  update profiles set mentor_id=p_mentor where id=p_user;
  if p_mentor is not null then
    insert into notifications(kind,title,body,link,to_user) values('mentor','🌱 Ты наставник','Тебе назначили подопечного: '||coalesce((select full_name from profiles where id=p_user),'новичок')||'. Его чек-лист и вопросы — в разделе «Первая неделя».','newbie',p_mentor);
    insert into notifications(kind,title,body,link,to_user) values('mentor','🌱 У тебя появился наставник',coalesce((select full_name from profiles where id=p_mentor),'Коллега')||' поможет освоиться. Чек-лист и вопросы наставнику — в разделе «Первая неделя».','newbie',p_user);
  end if;
end $$;
grant execute on function public.set_mentor(uuid,uuid) to authenticated;

-- ============ 4. «Первая неделя»: чек-лист новичка ============
create table if not exists public.onb_items(
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,   -- новичок
  title text not null check(length(trim(title))>0),
  note text,
  link text,                    -- раздел приложения для кнопки «Открыть»
  sort int not null default 0,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz default now());
alter table public.onb_items enable row level security;
drop policy if exists "onb read" on public.onb_items;
drop policy if exists "onb ins" on public.onb_items;
drop policy if exists "onb upd" on public.onb_items;
drop policy if exists "onb del" on public.onb_items;
create policy "onb read" on public.onb_items for select to authenticated using(user_id=auth.uid() or is_manager() or is_mentor_of(user_id));
create policy "onb ins"  on public.onb_items for insert to authenticated with check(is_manager() or is_mentor_of(user_id));
create policy "onb upd"  on public.onb_items for update to authenticated using(user_id=auth.uid() or is_manager() or is_mentor_of(user_id)) with check(user_id=auth.uid() or is_manager() or is_mentor_of(user_id));
create policy "onb del"  on public.onb_items for delete to authenticated using(is_manager() or is_mentor_of(user_id));

-- ============ 5. Вопросы наставнику ============
create table if not exists public.mentor_q(
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  mentor_id uuid references public.profiles on delete set null,
  body text not null check(length(trim(body))>0),
  answer text,
  answered_by uuid references public.profiles on delete set null,
  answered_at timestamptz,
  created_at timestamptz default now());
alter table public.mentor_q enable row level security;
drop policy if exists "mq read" on public.mentor_q;
drop policy if exists "mq ins" on public.mentor_q;
drop policy if exists "mq upd" on public.mentor_q;
drop policy if exists "mq del" on public.mentor_q;
create policy "mq read" on public.mentor_q for select to authenticated using(user_id=auth.uid() or mentor_id=auth.uid() or is_manager());
create policy "mq ins"  on public.mentor_q for insert to authenticated with check(user_id=auth.uid());
create policy "mq upd"  on public.mentor_q for update to authenticated using(mentor_id=auth.uid() or is_manager()) with check(mentor_id=auth.uid() or is_manager());
create policy "mq del"  on public.mentor_q for delete to authenticated using(user_id=auth.uid() or is_manager());

create or replace function public.trg_mq_ins() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text; m uuid;
begin
  select full_name, mentor_id into nm, m from profiles where id=new.user_id;
  new.mentor_id:=m;   -- вопрос всегда уходит текущему наставнику (или руководителям, если его нет)
  return new;
end $$;
drop trigger if exists mq_ins on public.mentor_q;
create trigger mq_ins before insert on public.mentor_q for each row execute function public.trg_mq_ins();

create or replace function public.trg_mq_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  select full_name into nm from profiles where id=new.user_id;
  if tg_op='INSERT' then
    if new.mentor_id is not null then
      insert into notifications(kind,title,body,link,to_user) values('mentor','❓ Вопрос от подопечного',coalesce(nm,'Новичок')||': '||left(new.body,160),'newbie',new.mentor_id);
    else
      insert into notifications(kind,title,body,link,for_managers) values('mentor','❓ Вопрос наставнику',coalesce(nm,'Новичок')||': '||left(new.body,160),'newbie',true);
    end if;
  elsif new.answer is not null and old.answer is distinct from new.answer then
    insert into notifications(kind,title,body,link,to_user) values('mentor','💬 Ответ на твой вопрос',left(new.answer,180),'newbie',new.user_id);
  end if;
  return new;
end $$;
drop trigger if exists mq_notify on public.mentor_q;
create trigger mq_notify after insert or update on public.mentor_q for each row execute function public.trg_mq_notify();

-- ============ 6. Благодарности ============
create table if not exists public.thanks(
  id bigint generated always as identity primary key,
  from_user uuid not null default auth.uid() references public.profiles on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  body text not null check(length(trim(body))>0 and length(body)<=300),
  sticker text not null default '💛',
  created_at timestamptz default now());
create index if not exists thanks_to_idx on public.thanks(to_user,created_at desc);
alter table public.thanks enable row level security;
drop policy if exists "thanks read" on public.thanks;
drop policy if exists "thanks ins" on public.thanks;
drop policy if exists "thanks del" on public.thanks;
create policy "thanks read" on public.thanks for select to authenticated using(is_approved());
create policy "thanks ins"  on public.thanks for insert to authenticated with check(from_user=auth.uid() and to_user<>auth.uid() and is_approved());
create policy "thanks del"  on public.thanks for delete to authenticated using(from_user=auth.uid() or is_manager());

create or replace function public.trg_thanks() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  if (select count(*) from thanks where from_user=new.from_user and created_at>now()-interval '1 day')>=15 then
    raise exception 'Слишком много благодарностей за сутки, продолжи завтра';
  end if;
  select full_name into nm from profiles where id=new.from_user;
  insert into notifications(kind,title,body,link,to_user) values('thanks',new.sticker||' Тебе сказали спасибо',coalesce(nm,'Коллега')||': '||left(new.body,160),'thanks',new.to_user);
  return new;
end $$;
drop trigger if exists thanks_ins on public.thanks;
create trigger thanks_ins before insert on public.thanks for each row execute function public.trg_thanks();
