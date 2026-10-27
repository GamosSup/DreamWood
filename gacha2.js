// Автомат, волна 1: «Космос и техника» + «Еда и кофе» (80 вещей) и особые вещи супервайзеров (единорог «Медиа», личные наборы).
// Загружается после gacha.js: дописывает предметы в те же каталоги. Список GXI2 — источник и для базы (gacha_items): supabase/migration_2026-11-16_gacha_wave1.sql
const GXI2=[
 // --- обычные (28)
 ['c_marsr',1,'bc','Марсианский','#D9704A'],['c_latte',1,'bc','Латте','#C9A27A'],['c_matcha',1,'bc','Матча','#9BBF6B'],['c_berry',1,'bc','Ягодный йогурт','#D88AB6'],
 ['h_donut',1,'ha','Пончик'],['h_mugh',1,'ha','Кружка кофе'],['h_sat',1,'ha','Спутниковая тарелка'],
 ['g_3d',1,'gl','3D-очки'],['g_star',1,'gl','Звёздные очки'],
 ['n_tie',1,'nk','Галстук'],['n_lanyard',1,'nk','Шнурок с пропуском'],
 ['c_logo',1,'ch','Нашивка-ракета'],['c_cup',1,'ch','Стаканчик кофе'],
 ['d_coffee',1,'hd','Кофе с собой'],['d_donutx',1,'hd','Пончик в лапке'],['d_mic',1,'hd','Микрофон'],
 ['b_backpack',1,'bk','Рюкзак'],['b_guitar',1,'bk','Гитара за спиной'],
 ['f_latte',1,'frame','Латте-арт'],['f_mars',1,'frame','Красная планета'],
 ['n_latten',1,'name','Латте'],['n_matchan',1,'name','Матча'],['n_marsn',1,'name','Марс'],['n_ink',1,'name','Чернила'],
 ['bg_latte',1,'bg','Молочная пенка'],['bg_dusk',1,'bg','Сумерки'],['bg_marsb',1,'bg','Марс'],['bg_cream',1,'bg','Сливки'],
 // --- редкие (22)
 ['c_cherry',2,'bc','Вишнёвый','#C0334D'],['c_ultram',2,'bc','Ультрамарин','#2C4FA8'],['c_saffron',2,'bc','Шафрановый','#F2A81D'],
 ['h_antenna',2,'ha','Антенны пришельца'],['h_pilot',2,'ha','Шлем пилота'],['h_barista',2,'ha','Кепка бариста'],
 ['g_cyber',2,'gl','Кибер-визор'],['g_monocle',2,'gl','Монокль'],
 ['n_rocket',2,'nk','Кулон-ракета'],['n_choker',2,'nk','Чокер с кристаллом'],
 ['c_astro',2,'ch','Нашивка космонавта'],['c_vinyl',2,'ch','Пластинка'],
 ['d_cake',2,'hd','Кусочек торта'],['d_planet',2,'hd','Маленькая планета'],['d_wand2',2,'hd','Световой жезл'],
 ['b_balloonw',2,'bk','Связка шариков'],['b_cloud',2,'bk','Облачко'],
 ['f_star',2,'frame','Звёздная'],['f_choc',2,'frame','Шоколадная'],
 ['n_cometn',2,'name','Комета'],['n_caramel',2,'name','Карамель'],['bg_cafe',2,'bg','Кофейня'],
 // --- эпические (16)
 ['c_nebu',3,'bc','Туманность','nebula'],['c_capp',3,'bc','Капучино','capp'],['c_melon',3,'bc','Арбузный','melon'],
 ['h_ufo',3,'ha','Летающая тарелка'],['h_sundae',3,'ha','Шапка-мороженое'],
 ['g_hud',3,'gl','Голо-очки'],['n_ring',3,'nk','Кольца Сатурна'],
 ['c_core',3,'ch','Реактор'],['c_burger',3,'ch','Бургер на груди'],
 ['b_orbit',3,'bk','Орбита'],['b_sugar',3,'bk','Сахарная вата'],['d_boombox',3,'hd','Бумбокс'],
 ['f_orbit',3,'frame','Орбита'],['f_espresso',3,'frame','Эспрессо'],['n_nova',3,'name','Сверхновая'],['bg_nebula',3,'bg','Туманность'],
 // --- мифические (9)
 ['c_cosmos',4,'bc','Космос','cosmos'],['c_gelato',4,'bc','Джелато','gelato'],['h_conste',4,'ha','Корона-созвездие'],
 ['b_solar',4,'bk','Солнечные паруса'],['f_plasma',4,'frame','Плазма'],['f_gelato',4,'frame','Джелато'],
 ['n_hyper',4,'name','Гиперпрыжок'],['bg_event',4,'bg','Горизонт событий'],['c_arc',4,'ch','Дуговой реактор'],
 // --- легендарные (4)
 ['c_supern',5,'bc','Сверхновая','supern'],['h_gold_helm',5,'ha','Золотой скафандр'],['f_quasar',5,'frame','Квазар'],['n_stellar',5,'name','Звёздное имя'],
 // --- тайна хранителя (1)
 ['b_rainbowwing',6,'bk','Радужные крылья']
];
GXI2.forEach(x=>{GXI.push(x);GX_BY[x[0]]={id:x[0],r:x[1],k:x[2],n:x[3],v:x[4]}});

// градиентные шкурки
Object.assign(PET_GRAD,{
 nebula:{s:['#2B1B5E','#8E3FD1','#FF7AC8'],base:'#7A3FB0',belly:'#E9D6FF'},
 capp:{s:['#6B4130','#C9A27A','#FFF1DC'],base:'#B58B66',belly:'#FFF5E6'},
 melon:{s:['#2E9B5A','#FF6B8B','#FFD0DC'],base:'#E86A86',belly:'#FFE6EC'},
 cosmos:{s:['#04051C','#2B3A9F','#B07CFF','#FF8AD8'],base:'#4B3FA8',belly:'#C9B8FF'},
 gelato:{s:['#FFB3D5','#FFF0B0','#9EE7FF','#C9B3FF'],base:'#F7C6E0',belly:'#FFFDF3'},
 supern:{s:['#FFF7C2','#FFB347','#FF4E8B','#6C2BD9'],base:'#FF8E53',belly:'#FFF3D6'},
 masha:{s:['#5A3522','#C98A58','#FFC4D6','#FFE9A8'],base:'#D49A74',belly:'#FFF2E2'},
 kris:{s:['#0B1030','#2DE2FF','#FF2DAA','#FFE45E'],base:'#7A5AD0',belly:'#E3E8FF'}
});

// ---------- рисунки (координаты как у остальных вещей питомца) ----------
const gxS2=(c,o='')=>`fill="${c}" stroke="#2B2B3A" stroke-width="3" stroke-linejoin="round" ${o}`;
Object.assign(PET_GEAR,{
 h_donut:`<ellipse cx="180" cy="176" rx="64" ry="34" ${gxS2('#E9A66B')}/><ellipse cx="180" cy="170" rx="58" ry="28" ${gxS2('#FF8FB8')}/><ellipse cx="180" cy="172" rx="16" ry="8" fill="#FFE9F2" stroke="#B02A63" stroke-width="2.4"/><path d="M136 166l8-3M158 150l3 8M212 152l-4 8M226 172l-8-2M200 190l-2-8M150 188l6-5" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M168 154l6 2M196 160l6-3" stroke="#52A7FF" stroke-width="4" stroke-linecap="round"/>`,
 h_mugh:`<rect x="138" y="146" width="86" height="60" rx="10" ${gxS2('#fff')}/><path d="M224 160Q256 160 254 182Q252 202 224 198" fill="none" stroke="#2B2B3A" stroke-width="7"/><rect x="146" y="154" width="70" height="14" rx="6" fill="#6B4130"/><path d="M160 138Q152 124 162 112M184 138Q176 122 186 108M208 138Q200 124 210 114" stroke="#C9CEDB" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M150 186h62" stroke="#E5484D" stroke-width="6" stroke-linecap="round"/>`,
 h_sat:`<path d="M122 170Q180 244 238 170Z" ${gxS2('#DDE3EC')}/><path d="M138 176Q180 224 222 176" fill="none" stroke="#9AA6B8" stroke-width="3"/><path d="M180 196L196 120" stroke="#5B6678" stroke-width="5" stroke-linecap="round"/><circle cx="198" cy="114" r="9" ${gxS2('#E5484D')}/><path d="M168 206h24" stroke="#5B6678" stroke-width="6" stroke-linecap="round"/>`,
 h_antenna:`<path d="M146 200Q130 150 138 112M214 200Q230 150 222 112" fill="none" stroke="#3FAE5A" stroke-width="6" stroke-linecap="round"/><circle cx="138" cy="108" r="13" ${gxS2('#7BDB8A')}/><circle cx="222" cy="108" r="13" ${gxS2('#7BDB8A')}/><circle cx="134" cy="104" r="4" fill="#fff" opacity=".8"/><circle cx="218" cy="104" r="4" fill="#fff" opacity=".8"/>`,
 h_pilot:`<path d="M108 210Q104 128 180 124Q256 128 252 210Z" ${gxS2('#8AA0B8')}/><path d="M112 190Q180 176 248 190" fill="none" stroke="#5B6678" stroke-width="4"/><circle cx="148" cy="176" r="19" ${gxS2('rgba(160,230,255,.75)')}/><circle cx="212" cy="176" r="19" ${gxS2('rgba(160,230,255,.75)')}/><path d="M167 176h26" stroke="#2B2B3A" stroke-width="5"/><path d="M180 124V150" stroke="#5B6678" stroke-width="4"/>`,
 h_barista:`<path d="M108 210Q106 160 180 154Q254 160 254 210Z" ${gxS2('#6B4A36')}/><path d="M120 196Q180 182 244 196" fill="none" stroke="#4A3022" stroke-width="3.4"/><circle cx="180" cy="152" r="8" ${gxS2('#6B4A36')}/><path d="M200 168l16-6M204 178l22-8" stroke="#8D6A52" stroke-width="3" stroke-linecap="round"/><circle cx="158" cy="184" r="8" ${gxS2('#FFF1DC')}/>`,
 h_ufo:`<path d="M140 178Q180 108 220 178Z" fill="rgba(160,240,255,.75)" stroke="#2B2B3A" stroke-width="3"/><ellipse cx="180" cy="184" rx="84" ry="22" ${gxS2('#B8C2D0')}/><circle cx="130" cy="186" r="6" fill="#FFE27A"/><circle cx="156" cy="196" r="6" fill="#FF8AD8"/><circle cx="204" cy="196" r="6" fill="#7BDB8A"/><circle cx="230" cy="186" r="6" fill="#52A7FF"/><circle cx="180" cy="148" r="11" ${gxS2('#7BDB8A')}/>`,
 h_sundae:`<path d="M138 168L150 212H210L222 168Z" ${gxS2('#E9B872')}/><path d="M146 184L212 196M142 172l66 28" stroke="#C48A3C" stroke-width="2.4" opacity=".7"/><circle cx="180" cy="152" r="34" ${gxS2('#FF9ECD')}/><circle cx="180" cy="120" r="26" ${gxS2('#FFF0B0')}/><circle cx="180" cy="94" r="11" ${gxS2('#E5484D')}/><path d="M180 84Q188 70 198 72" fill="none" stroke="#3E7B2E" stroke-width="4" stroke-linecap="round"/>`,
 h_conste:`<path d="M112 206Q112 146 180 140Q248 146 248 206" fill="none" stroke="#B8C6FF" stroke-width="6" stroke-linecap="round"/>${[[122,170],[146,148],[180,134],[214,148],[238,170]].map(([x,y])=>petStar(x,y,.8,'#FFE27A')).join('')}<path d="M122 170L146 148L180 134L214 148L238 170" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 5" opacity=".9"/>`,
 h_gold_helm:`<ellipse cx="180" cy="222" rx="82" ry="80" fill="rgba(255,225,120,.28)" stroke="#E6B73E" stroke-width="9"/><path d="M114 200Q130 150 170 142" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none" opacity=".75"/><rect x="104" y="296" width="152" height="18" rx="9" ${gxS2('#F6C945')}/><circle cx="180" cy="305" r="5" fill="#9A6D0A"/><path d="M212 144l10-14M232 160l14-10" stroke="#F6C945" stroke-width="5" stroke-linecap="round"/>`,
 n_tie:`<path d="M170 342L198 342L206 358L184 372L162 358Z" ${gxS2('#E5484D')}/><path d="M184 372L162 420L184 436L206 420Z" ${gxS2('#C0334D')}/>`,
 n_lanyard:`<path d="M138 342Q184 392 230 342" fill="none" stroke="#52A7FF" stroke-width="8" stroke-linecap="round"/><rect x="160" y="384" width="48" height="36" rx="6" ${gxS2('#fff')}/><rect x="160" y="384" width="48" height="10" rx="4" fill="#62C4D8"/><circle cx="174" cy="404" r="6" fill="#C9CEDB"/><path d="M184 402h18M184 410h14" stroke="#9AA6B8" stroke-width="3" stroke-linecap="round"/>`,
 n_rocket:`<path d="M134 344Q184 382 234 344" fill="none" stroke="#C9CEDB" stroke-width="5" stroke-linecap="round"/><path d="M184 372Q202 392 196 420H172Q166 392 184 372Z" ${gxS2('#fff')}/><path d="M172 420L162 438L176 428ZM196 420L206 438L192 428Z" ${gxS2('#E5484D')}/><circle cx="184" cy="398" r="7" ${gxS2('#52A7FF')}/><path d="M178 428Q184 444 190 428Z" fill="#FFB347"/>`,
 n_choker:`<path d="M138 346Q184 376 230 346" fill="none" stroke="#2B2B3A" stroke-width="10" stroke-linecap="round"/><path d="M184 362L172 378L184 398L196 378Z" ${gxS2('#9AD8FF')}/><path d="M184 362V398M172 378H196" stroke="#fff" stroke-width="2" opacity=".8"/>`,
 n_ring:`<ellipse cx="184" cy="364" rx="74" ry="20" fill="none" stroke="#F2C26B" stroke-width="9" transform="rotate(-8 184 364)"/><circle cx="184" cy="362" r="22" ${gxS2('#FFD59E')}/><ellipse cx="184" cy="364" rx="74" ry="20" fill="none" stroke="#FFE3A8" stroke-width="3" stroke-dasharray="40 160" transform="rotate(-8 184 364)"/>`,
 c_logo:`<path d="M170 394Q186 380 190 404L186 428H156L152 404Q154 386 170 394Z" ${gxS2('#fff')}/><circle cx="170" cy="402" r="6" ${gxS2('#52A7FF')}/><path d="M156 428L146 444L160 436ZM186 428L196 444L182 436Z" ${gxS2('#E5484D')}/>`,
 c_cup:`<path d="M146 384H200L194 440H152Z" ${gxS2('#fff')}/><rect x="142" y="376" width="62" height="12" rx="5" ${gxS2('#6B4130')}/><path d="M149 408H197L195 424H151Z" fill="#E5484D"/><path d="M162 366Q156 354 164 346M182 366Q176 352 184 344" stroke="#C9CEDB" stroke-width="4" fill="none" stroke-linecap="round"/>`,
 c_astro:`<circle cx="172" cy="412" r="30" ${gxS2('#1B2262')}/><circle cx="172" cy="412" r="22" fill="none" stroke="#F6C945" stroke-width="2.4" stroke-dasharray="3 4"/>${petStar(172,410,1.1,'#FFE27A')}<path d="M146 438Q172 450 198 438" fill="none" stroke="#E5484D" stroke-width="5" stroke-linecap="round"/>`,
 c_vinyl:`<circle cx="172" cy="412" r="32" ${gxS2('#1E1F2B')}/><circle cx="172" cy="412" r="22" fill="none" stroke="#3A3F52" stroke-width="2"/><circle cx="172" cy="412" r="11" ${gxS2('#FF6FA5')}/><circle cx="172" cy="412" r="2.6" fill="#fff"/><path d="M146 396Q158 384 174 382" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`,
 c_core:`<circle cx="172" cy="412" r="32" ${gxS2('#3A3F52')}/><circle cx="172" cy="412" r="22" ${gxS2('#7DF9FF')}/><circle cx="172" cy="412" r="11" fill="#fff"/><path d="M172 380V392M172 432V444M140 412H152M192 412H204" stroke="#7DF9FF" stroke-width="5" stroke-linecap="round"/>`,
 c_burger:`<path d="M138 400Q142 372 172 372Q202 372 206 400Z" ${gxS2('#E9A66B')}/><path d="M136 408Q172 416 208 408L204 420H140Z" ${gxS2('#7BDB8A')}/><rect x="138" y="420" width="68" height="14" rx="6" ${gxS2('#6B4130')}/><path d="M138 436Q172 448 206 436L202 448Q172 458 142 448Z" ${gxS2('#E9A66B')}/><path d="M156 384h4M172 380h4M188 386h4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
 c_arc:`<circle cx="172" cy="412" r="34" ${gxS2('#2B3A9F')}/><circle cx="172" cy="412" r="26" fill="none" stroke="#7DF9FF" stroke-width="5"/><path d="M172 392L186 420H158Z" fill="#7DF9FF" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><circle cx="172" cy="412" r="5" fill="#fff"/>`
});
Object.assign(PET_GLX,{
 g_3d:`<rect x="76" y="118" width="80" height="60" rx="14" fill="rgba(229,72,77,.7)" stroke="#2B2B3A" stroke-width="4"/><rect x="164" y="118" width="80" height="60" rx="14" fill="rgba(72,160,255,.7)" stroke="#2B2B3A" stroke-width="4"/><path d="M156 142h8M76 140L56 130M244 140L264 130" stroke="#2B2B3A" stroke-width="5" stroke-linecap="round"/>`,
 g_star:`${petStar(118,150,2.6,'#FFD54A')}${petStar(202,150,2.6,'#FFD54A')}<path d="M150 146Q160 138 170 146" stroke="#B8821C" stroke-width="5" fill="none" stroke-linecap="round"/>`,
 g_cyber:`<path d="M66 128Q160 112 254 128L246 170Q160 160 74 170Z" fill="rgba(125,249,255,.55)" stroke="#2B2B3A" stroke-width="4" stroke-linejoin="round"/><path d="M84 148H236" stroke="#FF2DAA" stroke-width="5" stroke-linecap="round"/><path d="M66 140L46 132M254 140L274 132" stroke="#2B2B3A" stroke-width="5" stroke-linecap="round"/>`,
 g_monocle:`<circle cx="202" cy="148" r="38" fill="rgba(255,255,255,.25)" stroke="#B8821C" stroke-width="6"/><path d="M232 172Q250 214 236 250" fill="none" stroke="#B8821C" stroke-width="3.4"/><path d="M180 136Q190 126 204 124" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>`,
 g_hud:`<rect x="74" y="122" width="172" height="56" rx="18" fill="rgba(125,249,255,.3)" stroke="#7DF9FF" stroke-width="4"/><path d="M92 136H128M92 150H116M192 136H228M204 150H228" stroke="#7DF9FF" stroke-width="4" stroke-linecap="round"/><circle cx="118" cy="156" r="11" fill="none" stroke="#fff" stroke-width="3"/><circle cx="202" cy="156" r="11" fill="none" stroke="#fff" stroke-width="3"/>`
});
Object.assign(PET_HX,{
 d_coffee:`<path d="M222 292H262L256 354H228Z" ${gxS2('#fff')}/><rect x="218" y="284" width="48" height="12" rx="5" ${gxS2('#6B4130')}/><path d="M226 312H258L256 328H228Z" fill="#E5484D"/><path d="M234 276Q228 262 236 252M252 276Q246 260 254 250" stroke="#C9CEDB" stroke-width="4" fill="none" stroke-linecap="round"/>`,
 d_donutx:`<ellipse cx="244" cy="318" rx="34" ry="30" ${gxS2('#E9A66B')}/><ellipse cx="244" cy="314" rx="30" ry="25" ${gxS2('#FF8FB8')}/><ellipse cx="244" cy="315" rx="9" ry="7" fill="#FFE9F2" stroke="#B02A63" stroke-width="2"/><path d="M222 304l7-2M258 298l-3 7M266 322l-7-1M232 332l5-3" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`,
 d_mic:`<path d="M240 360L262 226" stroke="#3A3F52" stroke-width="9" stroke-linecap="round"/><circle cx="268" cy="196" r="26" ${gxS2('#C9CEDB')}/><path d="M250 186Q268 176 286 186M250 200Q268 190 286 200" stroke="#6B7280" stroke-width="3" fill="none"/>`,
 d_cake:`<path d="M214 312L270 296L274 340L216 352Z" ${gxS2('#FFF0B0')}/><path d="M214 312L270 296L270 306L214 322Z" ${gxS2('#FF8FB8')}/><circle cx="240" cy="296" r="9" ${gxS2('#E5484D')}/><path d="M220 334L270 322" stroke="#E9A66B" stroke-width="4"/>`,
 d_planet:`<circle cx="262" cy="200" r="30" ${gxS2('#7AD0FF')}/><path d="M246 190Q262 180 278 192" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/><ellipse cx="262" cy="204" rx="50" ry="12" fill="none" stroke="#F2C26B" stroke-width="6" transform="rotate(-16 262 204)"/><path d="M240 360L258 232" stroke="#8E5FE0" stroke-width="5" stroke-linecap="round"/>`,
 d_wand2:`<rect x="244" y="226" width="12" height="120" rx="6" ${gxS2('#3A3F52')}/><rect x="247" y="148" width="8" height="84" rx="4" fill="#7DF9FF" stroke="#2B9FB0" stroke-width="2.4"/><circle cx="251" cy="148" r="14" fill="rgba(125,249,255,.4)"/><rect x="242" y="236" width="16" height="6" fill="#E5484D"/>`,
 d_boombox:`<rect x="206" y="288" width="96" height="62" rx="12" ${gxS2('#FF6FA5')}/><circle cx="234" cy="322" r="17" ${gxS2('#2B2B3A')}/><circle cx="276" cy="322" r="17" ${gxS2('#2B2B3A')}/><circle cx="234" cy="322" r="6" fill="#C9CEDB"/><circle cx="276" cy="322" r="6" fill="#C9CEDB"/><rect x="236" y="298" width="38" height="10" rx="3" fill="#fff"/><path d="M218 288Q254 262 290 288" fill="none" stroke="#2B2B3A" stroke-width="5"/><path d="M200 300q-8 6 0 12M312 300q8 6 0 12" stroke="#52A7FF" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
});
Object.assign(PET_BX,{
 b_backpack:`<rect x="52" y="248" width="70" height="104" rx="22" ${gxS2('#52A7FF')}/><rect x="62" y="296" width="50" height="40" rx="12" ${gxS2('#2D7DD2')}/><path d="M122 262Q142 280 134 326M258 262Q238 280 246 326" fill="none" stroke="#2D7DD2" stroke-width="7" stroke-linecap="round"/>`,
 b_guitar:`<g transform="rotate(-22 60 260)"><ellipse cx="60" cy="318" rx="34" ry="40" ${gxS2('#C98A48')}/><circle cx="60" cy="320" r="12" fill="#3A2512"/><rect x="54" y="140" width="12" height="130" rx="4" ${gxS2('#6B4130')}/><rect x="50" y="122" width="20" height="26" rx="5" ${gxS2('#3A2512')}/></g>`,
 b_balloonw:`<path d="M240 270Q282 190 270 130M236 272Q214 190 226 126M240 270Q300 210 304 160" stroke="#9AA6B8" stroke-width="2.6" fill="none"/><ellipse cx="270" cy="108" rx="24" ry="30" ${gxS2('#FF6FA5')}/><ellipse cx="224" cy="104" rx="24" ry="30" ${gxS2('#52A7FF')}/><ellipse cx="302" cy="138" rx="22" ry="28" ${gxS2('#FFD54A')}/>`,
 b_cloud:`<path d="M80 230Q40 230 44 196Q48 168 82 172Q90 140 128 150Q150 138 160 168Q190 172 186 204Q184 232 150 230Z" fill="rgba(255,255,255,.92)" stroke="#9AB4D0" stroke-width="3.4" stroke-linejoin="round"/><path d="M96 252l-4 14M120 254l-4 18M144 250l-4 12" stroke="#52A7FF" stroke-width="4" stroke-linecap="round"/>`,
 b_orbit:`<ellipse cx="160" cy="300" rx="150" ry="46" fill="none" stroke="rgba(180,200,255,.85)" stroke-width="4" stroke-dasharray="10 8" transform="rotate(-18 160 300)"/><circle cx="40" cy="338" r="14" ${gxS2('#7AD0FF')}/><circle cx="280" cy="262" r="10" ${gxS2('#FF8AD8')}/><circle cx="250" cy="352" r="7" ${gxS2('#FFE27A')}/>`,
 b_sugar:`<circle cx="80" cy="170" r="42" ${gxS2('#FFC8E4')}/><circle cx="120" cy="150" r="36" ${gxS2('#FFE0EE')}/><circle cx="100" cy="120" r="32" ${gxS2('#FFC8E4')}/><circle cx="62" cy="130" r="26" ${gxS2('#9EE7FF')}/><path d="M104 214L130 278" stroke="#E9B872" stroke-width="7" stroke-linecap="round"/>`,
 b_solar:`<path d="M104 262Q-8 230 6 110Q60 140 100 214Z" fill="rgba(255,226,122,.75)" stroke="#E6B73E" stroke-width="3.4" stroke-linejoin="round"/><path d="M22 150Q54 184 84 214M14 188Q46 214 76 238M40 126Q64 156 92 190" stroke="#fff" stroke-width="2.6" fill="none" opacity=".8"/>`,
 b_rainbowwing:`<path d="M104 268Q-24 214 6 114Q44 140 100 214Z" fill="#FF5E7E" stroke="#fff" stroke-width="2.4"/><path d="M104 266Q-12 222 14 128Q50 150 100 216Z" fill="#FFB347"/><path d="M104 264Q0 226 24 142Q56 160 98 218Z" fill="#FFE45E"/><path d="M104 262Q10 230 34 156Q62 170 98 220Z" fill="#4FC98F"/><path d="M104 260Q22 232 44 170Q66 180 98 222Z" fill="#52A7FF"/>`
});
['b_solar','b_rainbowwing','b_cloud'].forEach(k=>{PET_BX[k]=gxMir(PET_BX[k])});

// ---------- единорог «Медиа» и личные наборы супервайзеров ----------
PET_SP.push(['unicorn','Единорог «Медиа»','#F1E6FB','spec:media']);
PET_BC.push(['c_unicorn','Единорожья',null,'#F1E6FB']);
const GXP=[ // личные вещи: [код, вид, название, нужный значок, значение]
 ['c_masha','bc','Кофейный рассвет','spec:skin_masha','masha'],['f_masha','frame','Рамка Маши','spec:skin_masha'],['n_masha','name','Имя Маши','spec:skin_masha'],['bg_masha','bg','Фон Маши','spec:skin_masha'],['h_masha','ha','Корона из латте-арта','spec:skin_masha'],
 ['c_kris','bc','Неоновый бит','spec:skin_kristina','kris'],['f_kris','frame','Рамка Кристины','spec:skin_kristina'],['n_kris','name','Имя Кристины','spec:skin_kristina'],['bg_kris','bg','Фон Кристины','spec:skin_kristina'],['h_kris','ha','Неон-наушники','spec:skin_kristina']
];
Object.assign(PET_GEAR,{
 h_masha:`<path d="M112 208L106 138L146 176L180 108L214 176L254 138L248 208Z" ${gxS2('#F2D9B8')}/><circle cx="180" cy="190" r="14" ${gxS2('#6B4130')}/><path d="M180 180Q174 190 180 200Q186 190 180 180ZM172 190Q180 184 188 190" fill="#FFF1DC" stroke="#FFF1DC" stroke-width="2"/><circle cx="106" cy="138" r="7" ${gxS2('#FF9ECD')}/><circle cx="254" cy="138" r="7" ${gxS2('#FF9ECD')}/><circle cx="180" cy="108" r="8" ${gxS2('#FFE27A')}/>`,
 h_kris:`<path d="M110 210Q104 124 180 120Q256 124 250 210" fill="none" stroke="#2B2B3A" stroke-width="12" stroke-linecap="round"/><path d="M110 210Q104 124 180 120Q256 124 250 210" fill="none" stroke="#2DE2FF" stroke-width="4" stroke-linecap="round"/><rect x="92" y="176" width="30" height="50" rx="14" ${gxS2('#FF2DAA')}/><rect x="238" y="176" width="30" height="50" rx="14" ${gxS2('#FF2DAA')}/><rect x="99" y="186" width="16" height="30" rx="8" fill="#2DE2FF" opacity=".85"/><rect x="245" y="186" width="16" height="30" rx="8" fill="#2DE2FF" opacity=".85"/>`
});
// регистрация (как в gacha.js)
{
  const L={ha:PET_HA,gl:PET_GL,nk:PET_NK,ch:PET_CH,bk:PET_BK,hd:PET_HD,frame:GM_FRAMES,name:GM_NAMES,bg:GM_BGS};
  GXI2.forEach(([id,r,k,n,v])=>{const req=gxCode(id);if(k==='bc')PET_BC.push([id,n,req,v]);else if(L[k])L[k].push([id,n,req])});
  GXP.forEach(([id,k,n,req,v])=>{if(k==='bc')PET_BC.push([id,n,req,v]);else if(L[k])L[k].push([id,n,req])});
  const sp=(c,n,d,ic)=>{const a={c,g:'skill',t:5,ic,n,d,b:0,man:1,secret:1,title:n};GM_ACH.push(a);GM_BY[c]=a};
  sp('spec:media','Единорог «Медиа»','Его смогли приручить только супервайзеры. Он любит кофе, наушники и музыку','🦄');
  sp('spec:skin_masha','Кофейный рассвет','Личный набор Маши: такого нет больше ни у кого','☕');
  sp('spec:skin_kristina','Неоновый бит','Личный набор Кристины: такого нет больше ни у кого','🎧');
}
