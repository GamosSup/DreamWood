-- Лес: не хватало чек-листа ОТКРЫТИЯ для Веревочного лагеря (закрытие было, открытие — нет)
insert into public.shift_lists(title,kind,zone,items,sort)
select 'Открытие: Веревочный лагерь','open','Веревочный лагерь',array['Осмотрел(а) зону: нет повреждений и посторонних предметов','Проверил(а) оборудование и ограждения','Есть связь (рация), аптечка на месте','Инвентарь подготовлен','Зона готова к приёму гостей'],
  coalesce((select min(sort) from public.shift_lists where kind='open' and zone='Золото'),20)-1
where not exists(select 1 from public.shift_lists where kind='open' and zone='Веревочный лагерь');
update public.shift_lists set active=true where kind in('open','close') and zone='Веревочный лагерь';
