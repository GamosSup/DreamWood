// «Мой Дримми»: личный талисман в одежде. Основа неизменна (цвет, глаза-форма, силуэт);
// меняются шапка, взгляд (очки и глаза), шарф/галстук, значок на груди и фон. Всё нарисовано поверх готовой картинки.
// Когда появятся слоёные рисунки от художника, достаточно заменить эти накладки на картинки.
const GM_SKIN='#4C97D4';
const gmHrt=(x,y,s,c)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 8C-14 -4 -13 -18 -4 -17 0 -16 0 -12 0 -12S0 -16 4 -17C13 -18 14 -4 0 8Z" fill="${c}" stroke="#fff" stroke-width="1.6"/>`;
const gmStar=(x,y,s,c)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0-15l4.4 9.2 10 1.2-7.4 6.9 2 10L0 6.2-9 12.3l2-10-7.4-6.9 10-1.2z" fill="${c}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`;
// каждый предмет: [код, название, что нужно для открытия, svg-накладка]; null в req — доступно сразу
const GM_DR={
 head:['Шапка',[
  ['','Без шапки',null,''],
  ['h_cap','Кепка',null,`<path d="M108 208Q108 140 180 138Q252 142 254 208Z" fill="#E04B4B" stroke="#8E2222" stroke-width="3"/><path d="M200 204Q268 196 292 220Q250 232 200 218Z" fill="#B83232" stroke="#8E2222" stroke-width="3"/><circle cx="181" cy="139" r="8" fill="#F5D36B" stroke="#8E2222" stroke-width="2"/>`],
  ['h_party','Праздничный колпак','chk1',`<path d="M126 210L214 200L172 84Z" fill="#FF8AD8" stroke="#B0408F" stroke-width="3" stroke-linejoin="round"/><path d="M142 190L205 183M153 158L192 154M162 130L180 127" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="172" cy="84" r="12" fill="#FFE27A" stroke="#B0408F" stroke-width="3"/>`],
  ['h_beanie','Зимняя шапка','day20',`<path d="M110 212Q104 130 182 128Q256 128 252 210Z" fill="#F2B544" stroke="#9A6A12" stroke-width="3"/><rect x="106" y="190" width="150" height="28" rx="12" fill="#E9A22A" stroke="#9A6A12" stroke-width="3"/><path d="M128 192V216M150 192V216M172 192V216M194 192V216M216 192V216M238 192V216" stroke="#9A6A12" stroke-width="3"/><circle cx="182" cy="122" r="17" fill="#FFF3C9" stroke="#9A6A12" stroke-width="3"/>`],
  ['h_bow','Бантик','thx1',`<path d="M205 150L252 122L252 176Z" fill="#FF6FA5" stroke="#B02A63" stroke-width="3" stroke-linejoin="round"/><path d="M205 150L158 122L158 176Z" fill="#FF6FA5" stroke="#B02A63" stroke-width="3" stroke-linejoin="round"/><circle cx="205" cy="150" r="14" fill="#FF3D84" stroke="#B02A63" stroke-width="3"/>`],
  ['h_flower','Цветок','hab1',`<g transform="translate(214 150)">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-17" rx="11" ry="15" fill="#FFB7D5" stroke="#C25A8A" stroke-width="2.4" transform="rotate(${a})"/>`).join('')}<circle r="10" fill="#FFD54A" stroke="#C99A12" stroke-width="2.4"/></g>`],
  ['h_cowboy','Ковбойская шляпа','chk100',`<ellipse cx="180" cy="206" rx="104" ry="20" fill="#B5793C" stroke="#6B4118" stroke-width="3.4"/><path d="M122 204Q118 140 150 132Q180 150 210 132Q242 140 238 204Z" fill="#C98A48" stroke="#6B4118" stroke-width="3.4" stroke-linejoin="round"/><path d="M122 192Q180 208 238 192" stroke="#6B4118" stroke-width="9" fill="none"/>`],
  ['h_crown','Корона','chk1000',`<path d="M118 208L110 130L148 168L180 112L212 168L250 130L242 208Z" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.4" stroke-linejoin="round"/><circle cx="180" cy="190" r="9" fill="#E0245E" stroke="#9A6D0A" stroke-width="2.4"/><circle cx="144" cy="192" r="6" fill="#4FC3F7" stroke="#9A6D0A" stroke-width="2"/><circle cx="216" cy="192" r="6" fill="#66BB6A" stroke="#9A6D0A" stroke-width="2"/>`],
  ['h_pumpkin','Тыква-шапка','evt*',`<path d="M122 212Q106 160 150 150Q180 138 210 150Q254 160 238 212Q180 226 122 212Z" fill="#FF8A1F" stroke="#9A4A00" stroke-width="3.4"/><path d="M165 150Q160 190 168 212M195 150Q200 190 192 212" stroke="#C25A00" stroke-width="3" fill="none"/><path d="M176 148Q170 124 190 116Q186 134 188 148Z" fill="#5E9E3A" stroke="#2F5E18" stroke-width="3"/>`],
  ['h_diamond','Алмазная корона','spec:admin_server',`<defs><linearGradient id="gmdc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0FFFD"/><stop offset=".5" stop-color="#5EEAD4"/><stop offset="1" stop-color="#0E8FA8"/></linearGradient></defs><path d="M118 208L108 120L148 164L180 100L212 164L252 120L242 208Z" fill="url(#gmdc)" stroke="#0B6F85" stroke-width="3.4" stroke-linejoin="round"/><path d="M148 164L160 208M212 164L200 208M180 100L180 208" stroke="#fff" stroke-opacity=".7" stroke-width="2.4"/>`]
 ]],
 eyes:['Взгляд',[
  ['','Обычный',null,''],
  ['e_round','Очки',null,`<g fill="rgba(255,255,255,.18)" stroke="#2B2B3A" stroke-width="5"><circle cx="146" cy="277" r="30"/><circle cx="214" cy="268" r="30"/></g><path d="M176 273Q180 268 184 270M116 272L96 262M244 262L262 252" stroke="#2B2B3A" stroke-width="5" fill="none" stroke-linecap="round"/>`],
  ['e_sun','Тёмные очки','day1',`<path d="M112 262Q112 252 124 252H168Q178 252 176 272Q172 300 148 300Q112 298 112 262Z" fill="#1E1F2B" stroke="#000" stroke-width="3"/><path d="M182 262Q180 252 192 252H236Q246 254 244 270Q240 298 216 298Q184 296 182 262Z" fill="#1E1F2B" stroke="#000" stroke-width="3"/><path d="M174 262H184" stroke="#000" stroke-width="5"/><path d="M122 262L134 258M196 262L208 258" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>`],
  ['e_heart','Сердечки в глазах','thx10',`${gmHrt(146,278,1.5,'#FF3D84')}${gmHrt(213,269,1.5,'#FF3D84')}`],
  ['e_star','Звёзды в глазах','chk500',`${gmStar(146,277,1.45,'#FFD54A')}${gmStar(213,268,1.45,'#FFD54A')}`],
  ['e_sleepy','Сонный','hab7',`<path d="M122 277A24 24 0 0 1 170 277Z" fill="${GM_SKIN}"/><path d="M190 268A24 24 0 0 1 238 268Z" fill="${GM_SKIN}"/><path d="M122 277H170M190 268H238" stroke="#1B3B57" stroke-width="4" stroke-linecap="round"/>`],
  ['e_wink','Подмигивает','ot1',`<ellipse cx="213" cy="268" rx="27" ry="27" fill="${GM_SKIN}"/><path d="M192 270Q213 286 234 270" stroke="#1B3B57" stroke-width="5" fill="none" stroke-linecap="round"/>`]
 ]],
 neck:['Шея',[
  ['','Без ничего',null,''],
  ['n_scarf','Шарф',null,`<path d="M132 342Q182 366 232 340L236 362Q184 386 128 362Z" fill="#E04B4B" stroke="#8E2222" stroke-width="3.4" stroke-linejoin="round"/><path d="M206 362L228 362L234 430L206 430Z" fill="#E04B4B" stroke="#8E2222" stroke-width="3.4" stroke-linejoin="round"/><path d="M146 352Q150 374 148 366M178 360V380M208 370V380" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`],
  ['n_bow','Бабочка','day20',`<path d="M184 356L142 338V374Z" fill="#8E5FE0" stroke="#4A2A92" stroke-width="3.4" stroke-linejoin="round"/><path d="M184 356L226 338V374Z" fill="#8E5FE0" stroke="#4A2A92" stroke-width="3.4" stroke-linejoin="round"/><circle cx="184" cy="356" r="10" fill="#6B3DC4" stroke="#4A2A92" stroke-width="3"/>`],
  ['n_medal','Медаль','ot10',`<path d="M148 346L184 408L222 346" fill="none" stroke="#2D7DD2" stroke-width="12" stroke-linejoin="round"/><circle cx="184" cy="418" r="22" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.4"/>${gmStar(184,418,.9,'#fff3b0')}`]
 ]],
 chest:['Грудь',[
  ['','Ничего',null,''],
  ['c_badge','Бейдж парка',null,`<rect x="136" y="388" width="64" height="40" rx="9" fill="#fff" stroke="#2B5E73" stroke-width="3.4"/><rect x="136" y="388" width="64" height="12" rx="6" fill="#62C4D8"/><text x="168" y="418" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="13" fill="#2B5E73">ДРИМВУД</text>`],
  ['c_tee','Футболка Дримвуда','chk100',`<path d="M140 372Q184 392 232 372L246 470Q188 494 128 470Z" fill="#62C4D8" stroke="#2B5E73" stroke-width="3.4" stroke-linejoin="round"/><text x="188" y="428" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="18" fill="#fff">ДРИМ</text><text x="188" y="450" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="18" fill="#fff">ВУД</text>`],
  ['c_star','Звезда-значок','got10',`${gmStar(170,410,1.9,'#FFD54A')}`],
  ['c_heart','Сердце','got50',`${gmHrt(172,414,2.3,'#FF3D84')}`]
 ]]
};
const GM_DR_ALL=Object.entries(GM_DR).flatMap(([slot,[,L]])=>L.map(x=>({slot,id:x[0],n:x[1],req:x[2],svg:x[3]}))).filter(x=>x.id);
const GM_DR_KEY={head:'dh',eyes:'de',neck:'dn',chest:'dc'};
const GM_DR_FREE={head:'h_cap',eyes:'',neck:'',chest:''};
// выбранные вещи с проверкой: чего нет у человека, то не показываем
function gmDrSet(row){
  const c=row?.cos||{},o={};
  Object.entries(GM_DR).forEach(([slot,[,L]])=>{const it=L.find(x=>x[0]===c[GM_DR_KEY[slot]]);if(it&&it[0]&&gmHas(row,it[2]))o[slot]=it[0]});
  return o;
}
// «Мой Дримми»: картинка талисмана с накладками. По умолчанию без одежды.
function gmDreemi(row,sz=160,opt={}){
  const o=opt.set||gmDrSet(row),c=gmCos(row);
  const items=['neck','chest','eyes','head'].map(s=>{const it=o[s]&&GM_DR[s][1].find(x=>x[0]===o[s]);return it?it[3]:''}).join('');
  const bg=opt.bg===undefined?c.bg:opt.bg,vb=opt.vb||[0,0,368,560];
  return `<div class="drm ${bg||''}" style="width:${sz}px;height:${Math.round(sz*vb[3]/vb[2])}px"><svg viewBox="${vb.join(' ')}" width="100%" height="100%" aria-hidden="true"><image href="stickers/mascot-balloon.webp" x="0" y="0" width="368" height="560"/>${items}</svg></div>`;
}
// крупный план для плиток выбора
const GM_DR_VB={head:[70,70,230,190],eyes:[85,215,190,120],neck:[100,315,170,130],chest:[95,355,180,150]};
