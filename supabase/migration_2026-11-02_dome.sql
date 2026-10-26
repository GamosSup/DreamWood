-- Купол — отдельная вкладка в чек-листах: Сухие горки, Студия волшебных образов, Квесты/Роботы, Терраса (+ общий список «Купол»)
update public.shift_lists set zone='Сухие горки',title=replace(replace(title,'Дерево приключений','Сухие горки'),'  ',' '),active=true where zone='Дерево приключений';
update public.shift_lists set active=true where zone in('Студия волшебных образов','Терраса','Квесты/Роботы');
