update public.notifications set title=replace(title,'мы — дримвудовые','мы — команда Дримвуд'), body=replace(body,'В Дримвуде начался','В парке Дримвуд начался') where title like '%дримвудовые%' or body like '%В Дримвуде начался%';
update public.kb_pages set body=replace(body,'В Дримвуде гости','В парке Дримвуд гости') where body like '%В Дримвуде гости%';
