// Автомат, волна 2: «Лес», «Море», «Зима и праздники», «Сказки» (108 вещей).
// Загружается после gacha2.js. Список GXI3 — источник и для базы (gacha_items): supabase/migration_2026-11-22_gacha_wave2.sql
const GXI3=[
 // --- обычные
 ['c_moss',1,'bc','Мох','#7FA864'],['c_acorn',1,'bc','Жёлудь','#B07A3F'],['c_fern',1,'bc','Папоротник','#4F9A5E'],['c_birch',1,'bc','Берёзовый','#E8E2D2'],
 ['c_coral',1,'bc','Коралловый','#FF8A75'],['c_lagoon',1,'bc','Лагуна','#4FC6C0'],['c_sand',1,'bc','Песочный','#E8CF9C'],
 ['c_snow',1,'bc','Снежный','#EAF4FF'],['c_ginger',1,'bc','Имбирный пряник','#C98A58'],
 ['c_lavender',1,'bc','Лавандовый','#B9A4E6'],['c_peach',1,'bc','Персиковый','#FFB894'],['c_pistach',1,'bc','Фисташковый','#B7D68A'],
 ['h_leaf',1,'ha','Венок из листьев'],['h_acornc',1,'ha','Шапка-жёлудь'],['h_sailor',1,'ha','Бескозырка'],['h_shell',1,'ha','Ракушка'],['h_santa',1,'ha','Колпак Деда Мороза'],['h_elfh',1,'ha','Шапка эльфа'],
 ['g_leafg',1,'gl','Очки-листики'],['g_shellg',1,'gl','Очки-ракушки'],['g_party',1,'gl','Праздничные очки'],
 ['n_acorn',1,'nk','Кулон-жёлудь'],['n_shellnk',1,'nk','Бусы из ракушек'],['n_scarfw',1,'nk','Полосатый шарф'],
 ['c_mapleleaf',1,'ch','Кленовый лист'],['c_starfish',1,'ch','Морская звезда'],['c_snowflake',1,'ch','Снежинка'],['c_crest',1,'ch','Герб'],
 ['d_branch',1,'hd','Веточка'],['d_fish',1,'hd','Рыбка'],['d_ring',1,'hd','Спасательный круг'],['d_snowball',1,'hd','Снежок'],['d_cane',1,'hd','Леденцовая тросточка'],['d_potion',1,'hd','Зелье'],
 ['f_moss',1,'frame','Мшистая'],['f_wave',1,'frame','Прибой'],['f_ice',1,'frame','Лёд'],
 ['n_pine',1,'name','Хвоя'],['n_sea',1,'name','Бирюза'],['n_frost',1,'name','Иней'],
 ['bg_forestd',1,'bg','Тропинка'],['bg_shore',1,'bg','Берег'],['bg_snowfall',1,'bg','Снегопад'],['bg_lilac',1,'bg','Сиреневая дымка'],
 // --- редкие
 ['c_pearl',2,'bc','Жемчужный','#F3EEF5'],['c_octo',2,'bc','Осьминожий','#9B5DE5'],['c_frost',2,'bc','Морозный','#9FD3F5'],['c_royal',2,'bc','Королевский синий','#3A4FB0'],
 ['h_mush',2,'ha','Шляпка-гриб'],['h_pirate',2,'ha','Пиратская треуголка'],['h_reind',2,'ha','Олень Рудольф'],['h_wizard',2,'ha','Колпак волшебника'],['h_tiara',2,'ha','Диадема'],
 ['g_snorkel',2,'gl','Маска для ныряния'],['g_snowf',2,'gl','Очки-снежинки'],['g_moon',2,'gl','Лунные очки'],
 ['n_feather',2,'nk','Перо на шнурке'],['n_anchor',2,'nk','Якорь'],['n_garland',2,'nk','Гирлянда'],['n_amulet',2,'nk','Амулет'],
 ['c_mushroom',2,'ch','Грибочек'],['c_pearlc',2,'ch','Жемчужина'],['c_giftc',2,'ch','Подарочек'],['c_shield',2,'ch','Щит'],
 ['d_lantern',2,'hd','Фонарик'],['d_honey',2,'hd','Бочонок мёда'],['d_sword',2,'hd','Меч'],['d_book',2,'hd','Книга заклинаний'],
 ['b_basket',2,'bk','Корзинка грибника'],['b_bubbles',2,'bk','Пузырьки'],['b_sled',2,'bk','Санки'],['b_cape2',2,'bk','Плащ героя'],
 ['f_leaves',2,'frame','Листопад'],['f_coral',2,'frame','Коралловая'],['f_garland',2,'frame','Гирлянда'],['f_castle',2,'frame','Замок'],
 ['n_magic',2,'name','Магия'],['bg_glade',2,'bg','Поляна'],['bg_reef',2,'bg','Риф'],['bg_cozy',2,'bg','Уют у камина'],['bg_castle',2,'bg','Замок на закате'],
 // --- эпические
 ['c_aqua',3,'bc','Подводный','aqua'],['c_aurora',3,'bc','Северное сияние','aurorac'],['c_fairy',3,'bc','Феечка','fairy'],['c_candy',3,'bc','Леденец','candyc'],
 ['h_deer',3,'ha','Оленьи рога'],['h_crab',3,'ha','Краб на голове'],['h_snowhat',3,'ha','Шапка-снеговик'],['h_gifth',3,'ha','Подарок на голове'],['h_knight',3,'ha','Шлем рыцаря'],['h_dragonh',3,'ha','Драконьи рожки'],
 ['n_robe',3,'nk','Королевская мантия'],['c_tree',3,'ch','Ёлочка'],['c_rune',3,'ch','Руна'],
 ['d_trident',3,'hd','Трезубец'],['d_sparkler',3,'hd','Бенгальский огонь'],['d_orbm',3,'hd','Хрустальный шар'],
 ['b_leafwing',3,'bk','Лиственные крылья'],['b_turtle',3,'bk','Черепашка'],['b_giftsack',3,'bk','Мешок подарков'],['b_fairywing',3,'bk','Крылья феи'],
 ['f_firefly',3,'frame','Светлячки'],['f_abyss',3,'frame','Бездна'],['f_aurorafr',3,'frame','Северное сияние'],['f_enchant',3,'frame','Волшебная'],
 ['n_dawnn',3,'name','Рассвет в лесу'],['n_pearln',3,'name','Жемчужное'],
 ['bg_foggy',3,'bg','Туман над лесом'],['bg_deepsea',3,'bg','Глубина'],['bg_polar',3,'bg','Полярная ночь'],['bg_mooncast',3,'bg','Лунная ночь'],
 // --- мифические
 ['c_newyear',4,'bc','Новогодний','newyearc'],['c_dragonsc',4,'bc','Драконья чешуя','dragonsc'],
 ['b_snowwing',4,'bk','Снежные крылья'],['b_castleb',4,'bk','Замок за спиной'],
 ['f_nyframe',4,'frame','Новогодняя ночь'],['f_dragonfr',4,'frame','Драконье пламя'],
 ['n_nyname',4,'name','Новогоднее'],['n_dragonn',4,'name','Дракон'],['bg_fireworks',4,'bg','Салют'],['bg_lair',4,'bg','Логово дракона'],
 // --- легендарные
 ['c_phoenix',5,'bc','Феникс','phoenix'],['h_kingcrown',5,'ha','Корона короля'],['f_chronicle',5,'frame','Хроники Дримвуда'],['n_legend',5,'name','Легенда парка']
];
GXI3.forEach(x=>{GXI.push(x);GX_BY[x[0]]={id:x[0],r:x[1],k:x[2],n:x[3],v:x[4]}});

Object.assign(PET_GRAD,{
 aqua:{s:['#1E3FA8','#2EB8D8','#9BF2E0'],base:'#2A8FC8',belly:'#D8F7F2'},
 aurorac:{s:['#0E2A4F','#2DE2A0','#8E6BFF','#FF7AC8'],base:'#3E8FA8',belly:'#D8F5EE'},
 fairy:{s:['#FFD0F0','#C9B3FF','#A6F0E8'],base:'#D9B8F5',belly:'#FFF4FF'},
 candyc:{s:['#FF6B8B','#FFFFFF','#FF6B8B','#FFFFFF'],base:'#FF9EB5',belly:'#FFFFFF'},
 newyearc:{s:['#0F6B3D','#E5484D','#F6C945','#FFFFFF'],base:'#C0503F',belly:'#FFF3D6'},
 dragonsc:{s:['#1E6B3D','#7DD35B','#F2C94C','#E5484D'],base:'#4CA65A',belly:'#FFF1B8'},
 phoenix:{s:['#FFF7C2','#FFB347','#FF4E3B','#B3122F'],base:'#FF7A3B',belly:'#FFE9B8'}
});

// ---------- рисунки (координаты как у остальных вещей питомца) ----------
const gxS3=gxS2;
Object.assign(PET_GEAR,{
 h_leaf:`<path d="M110 206Q108 150 180 146Q252 150 250 206" fill="none" stroke="#5E8F2F" stroke-width="7" stroke-linecap="round"/>${[[122,180,-40],[140,158,-20],[166,146,0],[196,146,10],[222,158,30],[240,180,50]].map(([x,y,r])=>`<path d="M${x} ${y}q-12 -14 0 -30q12 16 0 30z" transform="rotate(${r} ${x} ${y})" ${gxS3(r%20?'#7FB84A':'#5FA43A')}/>`).join('')}`,
 h_acornc:`<path d="M116 204Q116 168 180 164Q244 168 244 204Z" ${gxS3('#B07A3F')}/><path d="M122 190H238M130 178H230" stroke="#8A5A28" stroke-width="2.4" opacity=".6"/><rect x="172" y="146" width="16" height="22" rx="6" ${gxS3('#7A5028')}/>`,
 h_sailor:`<ellipse cx="180" cy="196" rx="76" ry="16" ${gxS3('#fff')}/><path d="M112 196Q112 150 180 146Q248 150 248 196Z" ${gxS3('#fff')}/><path d="M114 186Q180 176 246 186" fill="none" stroke="#1F3A8F" stroke-width="7"/><circle cx="180" cy="150" r="9" ${gxS3('#E5484D')}/>`,
 h_shell:`<path d="M136 204Q128 150 180 134Q232 150 224 204Z" ${gxS3('#FFC9B8')}/><path d="M180 136V204M158 140L152 204M202 140L208 204M142 150L132 200M218 150L228 200" stroke="#E08A78" stroke-width="3" fill="none"/>`,
 h_santa:`<path d="M112 208Q112 128 180 124Q246 130 250 208Z" ${gxS3('#E5484D')}/><path d="M244 150Q290 160 286 204" fill="none" stroke="#E5484D" stroke-width="22" stroke-linecap="round"/><rect x="104" y="196" width="152" height="22" rx="11" ${gxS3('#fff')}/><circle cx="286" cy="206" r="14" ${gxS3('#fff')}/>`,
 h_elfh:`<path d="M112 208Q116 132 188 96Q214 140 252 208Z" ${gxS3('#3FAE5A')}/><path d="M122 192Q186 178 248 192" stroke="#E5484D" stroke-width="9" fill="none"/><circle cx="190" cy="94" r="10" ${gxS3('#F6C945')}/><path d="M112 208L84 196L116 182Z" ${gxS3('#3FAE5A')}/>`,
 h_mush:`<path d="M96 198Q96 120 180 118Q264 120 264 198Q180 212 96 198Z" ${gxS3('#E5484D')}/>${[[130,160,12],[180,140,10],[226,162,13],[160,184,8],[206,188,9]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".92"/>`).join('')}`,
 h_pirate:`<path d="M84 206Q104 130 180 124Q256 130 276 206Q180 180 84 206Z" ${gxS3('#2B2B3A')}/><path d="M104 190Q180 168 256 190" fill="none" stroke="#F6C945" stroke-width="5"/><circle cx="180" cy="158" r="14" fill="#fff"/><path d="M170 166l20 0M174 152h12" stroke="#2B2B3A" stroke-width="3"/><path d="M164 150l32 18M196 150l-32 18" stroke="#fff" stroke-width="0"/>`,
 h_reind:`<path d="M124 190Q92 150 104 108M104 130Q84 126 78 106M236 190Q268 150 256 108M256 130Q276 126 282 106" fill="none" stroke="#8A5A28" stroke-width="9" stroke-linecap="round"/><path d="M148 200Q148 180 180 178Q212 180 212 200Z" ${gxS3('#B07A3F')}/>`,
 h_wizard:`<path d="M96 206L180 40L264 206Q180 226 96 206Z" ${gxS3('#4A3FA8')}/><path d="M104 196Q180 214 256 196" fill="none" stroke="#F6C945" stroke-width="7"/>${petStar(170,120,1.1,'#FFE27A')}${petStar(206,160,.8,'#FFE27A')}`,
 h_tiara:`<path d="M116 202Q180 176 244 202L236 168L214 186L196 152L180 184L164 152L146 186L124 168Z" ${gxS3('#F6C945')}/><circle cx="180" cy="168" r="8" ${gxS3('#FF6FA5')}/><circle cx="146" cy="184" r="5" ${gxS3('#7AD0FF')}/><circle cx="214" cy="184" r="5" ${gxS3('#7AD0FF')}/>`,
 h_deer:`<path d="M128 196Q84 170 100 100M100 130Q74 128 64 100M104 150Q80 160 62 148M232 196Q276 170 260 100M260 130Q286 128 296 100M256 150Q280 160 298 148" fill="none" stroke="#9A6A38" stroke-width="10" stroke-linecap="round"/><path d="M118 206Q180 190 242 206" fill="none" stroke="#9A6A38" stroke-width="8" stroke-linecap="round"/>`,
 h_crab:`<ellipse cx="180" cy="168" rx="54" ry="30" ${gxS3('#F26B4E')}/><circle cx="160" cy="132" r="10" ${gxS3('#fff')}/><circle cx="200" cy="132" r="10" ${gxS3('#fff')}/><circle cx="160" cy="132" r="4" fill="#2B2B3A"/><circle cx="200" cy="132" r="4" fill="#2B2B3A"/><path d="M126 158Q92 140 104 112Q120 124 130 140Z M234 158Q268 140 256 112Q240 124 230 140Z" ${gxS3('#F26B4E')}/>`,
 h_snowhat:`<ellipse cx="180" cy="200" rx="78" ry="12" ${gxS3('#2B2B3A')}/><path d="M128 200Q132 124 180 120Q228 124 232 200Z" ${gxS3('#2B2B3A')}/><rect x="128" y="176" width="104" height="14" fill="#E5484D"/><path d="M200 180l60 -10" stroke="#E5484D" stroke-width="8" stroke-linecap="round"/><circle cx="150" cy="126" r="5" fill="#fff"/><circle cx="210" cy="136" r="4" fill="#fff"/>`,
 h_gifth:`<rect x="122" y="150" width="116" height="58" rx="8" ${gxS3('#52A7FF')}/><rect x="168" y="150" width="24" height="58" fill="#F6C945" stroke="#2B2B3A" stroke-width="3"/><rect x="118" y="140" width="124" height="22" rx="6" ${gxS3('#3A8FE0')}/><path d="M180 140Q150 110 164 120Q180 126 180 140ZM180 140Q210 110 196 120Q180 126 180 140Z" ${gxS3('#F6C945')}/>`,
 h_knight:`<path d="M108 216Q104 124 180 118Q256 124 252 216L236 216L236 190L124 190L124 216Z" ${gxS3('#B8C2D0')}/><rect x="132" y="168" width="96" height="14" rx="4" fill="#2B2B3A"/><path d="M180 118Q196 76 236 84Q214 100 214 124Z" ${gxS3('#E5484D')}/>`,
 h_dragonh:`<path d="M124 196Q110 150 128 112Q150 140 156 190Z" ${gxS3('#F2C94C')}/><path d="M236 196Q250 150 232 112Q210 140 204 190Z" ${gxS3('#F2C94C')}/><path d="M150 180L158 160L166 180L174 156L182 180L190 156L198 180L206 160L214 180" fill="#4CA65A" stroke="#1E6B3D" stroke-width="3" stroke-linejoin="round"/>`,
 h_kingcrown:`<path d="M112 206L102 120L146 160L180 96L214 160L258 120L248 206Z" fill="#F6C945" stroke="#8A6200" stroke-width="4" stroke-linejoin="round"/><rect x="112" y="190" width="136" height="20" rx="6" fill="#E5484D" stroke="#8A6200" stroke-width="3"/><circle cx="180" cy="148" r="11" ${gxS3('#7AD0FF')}/><circle cx="128" cy="168" r="7" ${gxS3('#FF6FA5')}/><circle cx="232" cy="168" r="7" ${gxS3('#5BE08A')}/>${petStar(180,98,.9,'#FFFFFF')}`,
 n_acorn:`<path d="M140 344Q184 384 228 344" fill="none" stroke="#7A5028" stroke-width="5" stroke-linecap="round"/><path d="M170 380H202Q202 402 186 408Q170 402 170 380Z" ${gxS3('#D9A05B')}/><path d="M166 382Q166 368 186 366Q206 368 206 382Z" ${gxS3('#7A5028')}/>`,
 n_shellnk:`<path d="M136 346Q184 390 232 346" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="1 0"/>${[[142,352],[154,366],[170,376],[188,380],[206,376],[222,366],[232,352]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%2?7:5}" ${gxS3(i%2?'#FFC9B8':'#fff')}/>`).join('')}`,
 n_scarfw:`<path d="M130 342Q184 376 240 342L236 366Q184 396 134 366Z" ${gxS3('#E5484D')}/><path d="M150 358L146 376M174 368L170 386M198 370L194 388M222 362L218 380" stroke="#fff" stroke-width="7"/><path d="M208 376L226 424L246 416L232 372Z" ${gxS3('#E5484D')}/>`,
 n_feather:`<path d="M140 344Q184 380 228 344" fill="none" stroke="#7A5028" stroke-width="4"/><path d="M184 372Q214 396 190 430Q168 404 184 372Z" ${gxS3('#52A7FF')}/><path d="M184 376Q188 404 188 426" stroke="#fff" stroke-width="2.4"/>`,
 n_anchor:`<path d="M136 346Q184 384 232 346" fill="none" stroke="#9AA6B8" stroke-width="5"/><circle cx="184" cy="372" r="6" fill="none" stroke="#1F3A8F" stroke-width="4"/><path d="M184 378V420M166 392H202M160 408Q166 428 184 428Q202 428 208 408" fill="none" stroke="#1F3A8F" stroke-width="5" stroke-linecap="round"/>`,
 n_garland:`<path d="M126 344Q184 400 244 344" fill="none" stroke="#3FAE5A" stroke-width="6"/>${[[140,360,'#E5484D'],[158,376,'#F6C945'],[184,384,'#52A7FF'],[210,376,'#FF6FA5'],[228,360,'#7BDB8A']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="8" ${gxS3(c)}/>`).join('')}`,
 n_amulet:`<path d="M138 344Q184 380 230 344" fill="none" stroke="#2B2B3A" stroke-width="4"/><path d="M184 372L204 390L184 426L164 390Z" ${gxS3('#7DF9FF')}/><path d="M184 372V426M164 390H204" stroke="#2B9FB0" stroke-width="2"/>`,
 n_robe:`<path d="M120 338Q184 372 248 338L262 430Q184 452 106 430Z" ${gxS3('#7A2BD9')}/><path d="M120 338Q184 372 248 338L246 356Q184 388 122 356Z" ${gxS3('#fff')}/>${[[150,368],[176,376],[204,372],[226,366]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.4" fill="#2B2B3A"/>`).join('')}<circle cx="184" cy="356" r="9" ${gxS3('#F6C945')}/>`,
 c_mapleleaf:`<path d="M172 380L180 396L194 388L190 408L208 412L190 424L196 442L174 430L156 444L158 424L140 414L158 406L152 386L166 394Z" ${gxS3('#E8872E')}/><path d="M174 430V396" stroke="#8A4A12" stroke-width="2.4"/>`,
 c_starfish:`<path d="M172 382L180 402L202 402L184 414L192 436L172 422L152 436L160 414L142 402L164 402Z" ${gxS3('#FF8A75')}/><circle cx="172" cy="412" r="3" fill="#fff"/>`,
 c_snowflake:`<g stroke="#7AD0FF" stroke-width="5" stroke-linecap="round" fill="none"><path d="M172 380V444M144 396L200 428M144 428L200 396"/><path d="M164 386L172 394L180 386M164 438L172 430L180 438"/></g><circle cx="172" cy="412" r="6" fill="#fff" stroke="#7AD0FF" stroke-width="3"/>`,
 c_crest:`<path d="M146 384H198V418Q198 440 172 448Q146 440 146 418Z" ${gxS3('#3A4FB0')}/><path d="M172 392V440M150 408H194" stroke="#F6C945" stroke-width="5"/>${petStar(172,404,.6,'#F6C945')}`,
 c_mushroom:`<path d="M138 408Q140 384 172 382Q204 384 206 408Z" ${gxS3('#E5484D')}/><rect x="162" y="406" width="20" height="28" rx="6" ${gxS3('#FFF3D6')}/><circle cx="156" cy="396" r="4" fill="#fff"/><circle cx="184" cy="392" r="3.4" fill="#fff"/><circle cx="194" cy="402" r="3" fill="#fff"/>`,
 c_pearlc:`<path d="M138 410Q138 380 172 380Q206 380 206 410Q206 444 172 444Q138 444 138 410Z" ${gxS3('#FFC9B8')}/><path d="M172 382V442M156 386L152 440M188 386L192 440" stroke="#E08A78" stroke-width="2.4"/><circle cx="172" cy="414" r="11" fill="#fff" stroke="#B8A8C8" stroke-width="2.4"/>`,
 c_giftc:`<rect x="142" y="392" width="60" height="46" rx="6" ${gxS3('#FF6FA5')}/><rect x="166" y="392" width="12" height="46" fill="#F6C945" stroke="#2B2B3A" stroke-width="2.4"/><rect x="140" y="384" width="64" height="14" rx="4" ${gxS3('#E5484D')}/><path d="M172 384Q154 364 162 372Q172 376 172 384ZM172 384Q190 364 182 372Q172 376 172 384Z" ${gxS3('#F6C945')}/>`,
 c_shield:`<path d="M140 384H204V420Q204 442 172 450Q140 442 140 420Z" ${gxS3('#B8C2D0')}/><path d="M172 392V444M144 414H200" stroke="#E5484D" stroke-width="7"/>`,
 c_tree:`<path d="M172 378L196 404H182L204 428H184L212 448H132L160 428H140L162 404H148Z" ${gxS3('#3FAE5A')}/><rect x="166" y="448" width="12" height="10" fill="#7A5028"/><circle cx="160" cy="418" r="4" fill="#E5484D"/><circle cx="186" cy="432" r="4" fill="#F6C945"/>${petStar(172,378,.7,'#FFE27A')}`,
 c_rune:`<circle cx="172" cy="412" r="32" ${gxS3('#3A3F52')}/><path d="M172 390V434M160 400L184 412L160 424" fill="none" stroke="#7DF9FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
});
Object.assign(PET_GLX,{
 g_leafg:`<path d="M80 150Q96 108 148 128Q150 170 112 178Q84 176 80 150Z" ${gxS3('#7FB84A')}/><path d="M240 150Q224 108 172 128Q170 170 208 178Q236 176 240 150Z" ${gxS3('#7FB84A')}/><path d="M148 142Q160 134 172 142" stroke="#2B2B3A" stroke-width="5" fill="none"/><path d="M92 156L136 140M228 156L184 140" stroke="#3E7B2E" stroke-width="2.4"/>`,
 g_shellg:`<path d="M80 150Q82 114 118 112Q154 114 156 150Q152 178 118 180Q84 178 80 150Z" ${gxS3('#FFC9B8')}/><path d="M164 150Q166 114 202 112Q238 114 240 150Q236 178 202 180Q168 178 164 150Z" ${gxS3('#FFC9B8')}/><path d="M156 144Q160 138 164 144" stroke="#2B2B3A" stroke-width="5" fill="none"/><path d="M118 118V176M100 124L96 172M136 124L140 172M202 118V176M184 124L180 172M220 124L224 172" stroke="#E08A78" stroke-width="2"/>`,
 g_party:`${petStar(118,150,2.9,'#FF6FA5')}${petStar(202,150,2.9,'#52A7FF')}<path d="M150 146Q160 138 170 146" stroke="#2B2B3A" stroke-width="5" fill="none"/><path d="M84 138L62 120M236 138L258 120" stroke="#2B2B3A" stroke-width="5" stroke-linecap="round"/>`,
 g_snorkel:`<rect x="70" y="112" width="180" height="70" rx="26" fill="rgba(140,220,255,.45)" stroke="#E5484D" stroke-width="7"/><path d="M160 112V182" stroke="#E5484D" stroke-width="5"/><path d="M252 124Q290 110 290 70" fill="none" stroke="#E5484D" stroke-width="9" stroke-linecap="round"/><path d="M70 146H44" stroke="#E5484D" stroke-width="8" stroke-linecap="round"/>`,
 g_snowf:`<g stroke="#7AD0FF" stroke-width="4.6" stroke-linecap="round">${[118,202].map(x=>`<path d="M${x} 126V172M${x-20} 138L${x+20} 160M${x-20} 160L${x+20} 138"/>`).join('')}</g><path d="M150 146Q160 138 170 146" stroke="#2B2B3A" stroke-width="5" fill="none"/>`,
 g_moon:`<circle cx="118" cy="148" r="36" fill="rgba(200,190,255,.35)" stroke="#6C5BD0" stroke-width="5"/><circle cx="202" cy="148" r="36" fill="rgba(200,190,255,.35)" stroke="#6C5BD0" stroke-width="5"/><path d="M150 146Q160 138 170 146" stroke="#6C5BD0" stroke-width="5" fill="none"/>${petStar(118,148,1.2,'#FFE27A')}${petStar(202,148,1.2,'#FFE27A')}`
});
Object.assign(PET_HX,{
 d_branch:`<path d="M232 372L262 226" stroke="#7A5028" stroke-width="9" stroke-linecap="round"/><path d="M258 252Q290 244 292 218M252 286Q226 280 218 256" fill="none" stroke="#7A5028" stroke-width="6" stroke-linecap="round"/>${[[292,214,0],[216,252,-30],[262,224,20]].map(([x,y,r])=>`<path d="M${x} ${y}q-10 -12 0 -26q10 14 0 26z" transform="rotate(${r} ${x} ${y})" ${gxS3('#7FB84A')}/>`).join('')}`,
 d_fish:`<ellipse cx="256" cy="316" rx="40" ry="22" ${gxS3('#52A7FF')}/><path d="M216 316L192 296V336Z" ${gxS3('#3A8FE0')}/><circle cx="276" cy="310" r="5" fill="#fff"/><circle cx="277" cy="310" r="2.4" fill="#2B2B3A"/><path d="M246 300Q256 316 246 332" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`,
 d_ring:`<circle cx="254" cy="312" r="40" fill="none" stroke="#E5484D" stroke-width="22"/><path d="M254 272V352M214 312H294" stroke="#fff" stroke-width="0"/>${[0,90,180,270].map(a=>`<rect x="244" y="268" width="20" height="22" fill="#fff" stroke="#2B2B3A" stroke-width="2" transform="rotate(${a} 254 312)"/>`).join('')}`,
 d_snowball:`<circle cx="248" cy="318" r="30" ${gxS3('#fff')}/><path d="M232 304Q244 296 258 304" stroke="#BFD8F0" stroke-width="3" fill="none"/><circle cx="256" cy="330" r="4" fill="#BFD8F0"/>`,
 d_cane:`<path d="M238 368V250Q238 214 266 214Q294 214 294 244" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/><path d="M238 368V250Q238 214 266 214Q294 214 294 244" fill="none" stroke="#E5484D" stroke-width="16" stroke-linecap="round" stroke-dasharray="14 14"/>`,
 d_potion:`<path d="M240 330Q220 340 224 360Q246 372 270 360Q272 340 254 330V300H240Z" ${gxS3('#B07CFF')}/><rect x="238" y="290" width="18" height="14" rx="3" ${gxS3('#C9A27A')}/><path d="M232 344H262" stroke="#fff" stroke-width="3" opacity=".7"/><circle cx="244" cy="352" r="3" fill="#fff"/>`,
 d_lantern:`<path d="M246 232Q246 212 262 212Q278 212 278 232" fill="none" stroke="#2B2B3A" stroke-width="5"/><rect x="236" y="232" width="52" height="64" rx="10" fill="rgba(255,226,122,.85)" stroke="#2B2B3A" stroke-width="3.4"/><circle cx="262" cy="266" r="10" fill="#FFB347"/><rect x="232" y="226" width="60" height="10" rx="4" ${gxS3('#3A3F52')}/><rect x="232" y="292" width="60" height="10" rx="4" ${gxS3('#3A3F52')}/>`,
 d_honey:`<path d="M222 300Q216 340 240 358H282Q304 340 300 300Z" ${gxS3('#C9A27A')}/><ellipse cx="261" cy="300" rx="39" ry="11" ${gxS3('#E8B84A')}/><path d="M228 322H294M230 342H292" stroke="#7A5028" stroke-width="3"/><path d="M252 306Q256 324 262 312" fill="none" stroke="#E8B84A" stroke-width="6" stroke-linecap="round"/>`,
 d_sword:`<path d="M258 370V214L270 196L282 214V370Z" ${gxS3('#DDE3EC')}/><rect x="238" y="360" width="64" height="12" rx="5" ${gxS3('#F6C945')}/><rect x="262" y="372" width="16" height="38" rx="6" ${gxS3('#7A5028')}/><path d="M270 214V356" stroke="#9AA6B8" stroke-width="2.4"/>`,
 d_book:`<path d="M216 308L262 296L308 308V366L262 354L216 366Z" ${gxS3('#7A2BD9')}/><path d="M262 296V354" stroke="#2B2B3A" stroke-width="3"/>${petStar(240,326,.8,'#FFE27A')}${petStar(286,326,.8,'#FFE27A')}<path d="M226 372L262 362L298 372" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`,
 d_trident:`<path d="M252 372V214" stroke="#F6C945" stroke-width="9" stroke-linecap="round"/><path d="M222 168V214Q222 232 252 232Q282 232 282 214V168M252 150V232" fill="none" stroke="#F6C945" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M222 160L212 138L232 148Z M252 142L242 120L262 120Z M282 160L292 138L272 148Z" ${gxS3('#F6C945')}/>`,
 d_sparkler:`<path d="M244 372L264 238" stroke="#9AA6B8" stroke-width="6" stroke-linecap="round"/>${[[264,226,2.2,'#FFE27A'],[236,206,1.1,'#FF6FA5'],[292,208,1.2,'#7DF9FF'],[262,184,1,'#fff'],[300,240,.9,'#FFB347'],[228,244,.9,'#FFB347']].map(([x,y,s,c])=>petStar(x,y,s,c)).join('')}`,
 d_orbm:`<circle cx="262" cy="270" r="46" fill="rgba(160,200,255,.55)" stroke="#6C5BD0" stroke-width="4"/><path d="M236 260Q250 244 270 246" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>${petStar(268,284,1.1,'#FFE27A')}<path d="M236 318Q262 334 288 318L296 346H228Z" ${gxS3('#7A5028')}/>`
});
Object.assign(PET_BX,{
 b_basket:`<path d="M44 272Q48 232 80 232H130Q150 236 146 272L138 336H62Z" ${gxS3('#C9A27A')}/><path d="M56 280H140M58 300H138M60 320H136" stroke="#7A5028" stroke-width="3" opacity=".7"/><path d="M60 232Q94 176 130 232" fill="none" stroke="#7A5028" stroke-width="6"/><circle cx="84" cy="224" r="13" ${gxS3('#E5484D')}/><circle cx="112" cy="222" r="10" ${gxS3('#FFF3D6')}/>`,
 b_bubbles:`${[[60,160,26],[100,110,18],[44,230,14],[270,140,20],[250,90,12],[290,210,16]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(180,230,255,.45)" stroke="#6AA9E0" stroke-width="3"/><circle cx="${x-r*.3}" cy="${y-r*.3}" r="${r*.22}" fill="#fff"/>`).join('')}`,
 b_sled:`<g transform="rotate(-18 70 280)"><rect x="40" y="200" width="60" height="150" rx="10" ${gxS3('#B07A3F')}/><path d="M30 350Q40 372 70 372Q100 372 110 350" fill="none" stroke="#9AA6B8" stroke-width="8" stroke-linecap="round"/><path d="M52 220H88M52 250H88M52 280H88M52 310H88" stroke="#7A5028" stroke-width="3"/></g>`,
 b_cape2:`<path d="M100 236Q36 330 56 424Q160 446 264 424Q284 330 220 236Z" fill="#3A4FB0" stroke="#1F2A70" stroke-width="3.2" stroke-linejoin="round"/><path d="M100 236Q70 340 80 420Q160 436 240 420Q250 340 220 236" fill="none" stroke="#5B72E0" stroke-width="3" opacity=".6"/>`,
 b_leafwing:gxMir(`<path d="M104 266Q-8 226 10 130Q70 150 104 236Z" ${gxS3('#7FB84A')}/><path d="M96 276Q28 292 30 340Q80 338 108 296Z" ${gxS3('#5FA43A')}/><path d="M104 262Q44 212 20 150" stroke="#3E7B2E" stroke-width="2.4" fill="none"/>`),
 b_turtle:`<ellipse cx="160" cy="320" rx="130" ry="96" ${gxS3('#4CA65A')}/>${[[110,288],[160,276],[210,288],[130,340],[190,340]].map(([x,y])=>`<path d="M${x-22} ${y}l22 -22l22 22l-22 22z" fill="#7DD35B" stroke="#1E6B3D" stroke-width="3"/>`).join('')}<circle cx="40" cy="300" r="22" ${gxS3('#7DD35B')}/><circle cx="34" cy="296" r="3" fill="#2B2B3A"/>`,
 b_giftsack:`<path d="M30 290Q20 210 80 190Q140 200 138 280Q136 350 84 352Q40 350 30 290Z" ${gxS3('#C0334D')}/><path d="M62 192Q82 170 108 192" fill="none" stroke="#F6C945" stroke-width="8"/><rect x="42" y="286" width="34" height="30" rx="4" ${gxS3('#52A7FF')}/><rect x="88" y="300" width="30" height="26" rx="4" ${gxS3('#7BDB8A')}/>`,
 b_fairywing:gxMir(`<path d="M104 266Q-14 226 6 120Q60 150 104 232Z" fill="rgba(255,208,240,.8)" stroke="#C98AE0" stroke-width="3" stroke-linejoin="round"/><path d="M98 278Q24 296 30 352Q86 346 110 298Z" fill="rgba(190,232,255,.8)" stroke="#6AA9E0" stroke-width="3" stroke-linejoin="round"/>${petStar(44,170,.8,'#fff')}`),
 b_snowwing:gxMir(`<path d="M104 266Q-20 222 4 110Q60 142 104 226Z" fill="rgba(235,247,255,.92)" stroke="#9AD0F0" stroke-width="3.4" stroke-linejoin="round"/><path d="M96 280Q22 294 24 356Q84 352 110 300Z" fill="rgba(235,247,255,.92)" stroke="#9AD0F0" stroke-width="3.4" stroke-linejoin="round"/><path d="M18 150L64 190M28 130L74 176" stroke="#C9E6FA" stroke-width="3"/>${petStar(40,160,.9,'#7AD0FF')}`),
 b_castleb:`<path d="M40 380V220H64V250H84V220H108V250H128V220H152V380Z" ${gxS3('#C9CEDB')}/><path d="M60 220L96 170L132 220Z" ${gxS3('#E5484D')}/><rect x="84" y="300" width="22" height="80" rx="11" ${gxS3('#7A5028')}/><rect x="56" y="262" width="12" height="20" rx="6" ${gxS3('#2B2B3A')}/><rect x="112" y="262" width="12" height="20" rx="6" ${gxS3('#2B2B3A')}/>`
});
// регистрация в каталогах (как в gacha.js)
{
  const L={ha:PET_HA,gl:PET_GL,nk:PET_NK,ch:PET_CH,bk:PET_BK,hd:PET_HD,frame:GM_FRAMES,name:GM_NAMES,bg:GM_BGS};
  GXI3.forEach(([id,r,k,n,v])=>{const req=gxCode(id);if(k==='bc')PET_BC.push([id,n,req,v]);else if(L[k])L[k].push([id,n,req])});
}
