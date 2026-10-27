-- Чек-листы Смены: пункты с числом (::n) и «работают / не работают» (::vr)
alter table public.shift_checks add column if not exists val text;

-- Мини-гольф (зона «Гольф»): количество мячей при открытии и закрытии
update public.shift_lists set items=array_append(items,'Мячей в наличии, шт::n')
 where kind='open' and zone='Гольф' and not 'Мячей в наличии, шт::n'=any(items);
update public.shift_lists set items=array_append(items,'Мячей в наличии, шт::n')
 where kind='close' and zone='Гольф' and not 'Мячей в наличии, шт::n'=any(items);

-- Шахта и Джипы (G-Pride): VR-очки и телефоны для VR — работают / не работают
update public.shift_lists set items=items||array['VR-очки::vr','Телефоны для VR::vr']
 where kind in('open','close') and zone in('Шахта','Джипы') and not 'VR-очки::vr'=any(items);
