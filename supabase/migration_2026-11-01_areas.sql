-- Ареалы парка: новые локации + убрать «Пеликан» и «Мастер-классы»
-- Группировка по ареалам делается в приложении по названию зоны, здесь только данные.

-- 1. Новые зоны: чек-листы открытия/закрытия и страницы базы знаний
insert into public.shift_lists(title,kind,zone,items,sort)
select 'Открытие: '||z,'open',z,array['Осмотрел(а) зону: нет повреждений и посторонних предметов','Проверил(а) оборудование и ограждения','Есть связь (рация), аптечка на месте','Инвентарь подготовлен','Зона готова к приёму гостей'],20+row_number() over()
from unnest(array['Аквазона Кит','Визги-брызги','Купол','Бьюти-бар','Бильярд','Мини-гольф']) z
where not exists(select 1 from public.shift_lists l where l.zone=z and l.kind='open')
  and not (z='Мини-гольф' and exists(select 1 from public.shift_lists l where l.zone='Гольф'));
insert into public.shift_lists(title,kind,zone,items,sort)
select 'Закрытие: '||z,'close',z,array['Гостей в зоне нет','Оборудование выключено и зафиксировано','Инвентарь убран','Мусор убран, зона осмотрена','Зона закрыта'],60+row_number() over()
from unnest(array['Аквазона Кит','Визги-брызги','Купол','Бьюти-бар','Бильярд','Мини-гольф']) z
where not exists(select 1 from public.shift_lists l where l.zone=z and l.kind='close')
  and not (z='Мини-гольф' and exists(select 1 from public.shift_lists l where l.zone='Гольф'));
insert into public.kb_pages(title,category,body,pinned)
select z,'Аттракционы','Скоро здесь появится нужная информация по этому аттракциону: как работает, правила безопасности, что делать при поломке.',false
from unnest(array['Аквазона Кит','Визги-брызги','Купол','Бьюти-бар','Бильярд']) z
where not exists(select 1 from public.kb_pages p where p.title=z and p.category='Аттракционы');

-- 2. Убрать «Пеликан» и «Мастер-классы»: списки выключаем (историю отметок не трогаем), заглушки КБ удаляем
update public.shift_lists set active=false where zone in ('Пеликан','Мастер-классы (МК)');
delete from public.kb_pages where category='Аттракционы' and title in ('Пеликан','Мастер-классы (МК)') and body like 'Скоро здесь появится%';

-- 3. Всё в «Купол»: студия волшебных образов, терраса, бабл хаус, лес чудес, дерево приключений (сухие горки), площадь
update public.shift_lists set active=false where zone in ('Студия волшебных образов','Терраса','Бабл хаус','Лес Чудес','Дерево приключений','Площадь');
delete from public.kb_pages where category='Аттракционы' and title in ('Студия волшебных образов','Терраса','Бабл хаус','Лес Чудес','Дерево приключений','Площадь') and body like 'Скоро здесь появится%';
