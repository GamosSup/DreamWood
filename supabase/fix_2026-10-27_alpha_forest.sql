-- Зоны Леса — у Альфы рейнджеров (они отвечают за Лес и Метрополис), а не у Альфы хранителей
-- 1) из «Проверки локаций» хранителей убираем строку про Лес
update public.shift_lists
set items=array_remove(items,'Лес: Веревочный лагерь, Золото, Гольф, Лучный тир')
where kind='alpha_k' and title='Проверка локаций';

-- 2) у рейнджеров появляется список «Проверка зон Леса»
insert into public.shift_lists(title,kind,zone,items,sort)
select 'Проверка зон Леса','alpha_r',null,array['Веревочный лагерь','Золото','Гольф','Лучный тир'],204
where not exists(select 1 from public.shift_lists where kind='alpha_r' and title='Проверка зон Леса');
