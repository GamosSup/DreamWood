// «Мой питомец»: свой зверёк в стиле Дримми (4 вида), которого можно кастомить по полной.
// Нарисован кодом по слоям, поэтому меняется всё: цвет, глаза, взгляд, улыбка, причёска, узор, одежда.
const PET_VB=[0,-60,320,500];
const pMix=(a,b,t)=>{const h=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
let PET_N=0;
const petHrt=(x,y,s,c)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 8C-14 -4 -13 -18 -4 -17 0 -16 0 -12 0 -12S0 -16 4 -17C13 -18 14 -4 0 8Z" fill="${c}" stroke="#fff" stroke-width="1.6"/>`;
const petStar=(x,y,s,c)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0-15l4.4 9.2 10 1.2-7.4 6.9 2 10L0 6.2-9 12.3l2-10-7.4-6.9 10-1.2z" fill="${c}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`;
const PET_INK='#2A1B30';

// ---------- виды ----------
const PET_SP=[['fox','Лисёнок','#F28C38'],['bear','Мишка','#A8744A'],['bunny','Зайка','#B79BEA'],['dragon','Дракончик','#5CBF7A']];
// ---------- варианты (код, название, что нужно для открытия, значение) ----------
const PET_BC=[['c_or','Рыжий',null,'#F28C38'],['c_br','Коричневый',null,'#A8744A'],['c_li','Сиреневый',null,'#B79BEA'],['c_gr','Зелёный',null,'#5CBF7A'],['c_sk','Голубой',null,'#5BA8E8'],['c_pk','Розовый',null,'#F29BB8'],['c_gy','Серый',null,'#9AA5B1'],
  ['c_ye','Жёлтый','day1','#F2C94C'],['c_mi','Мятный','hab1','#6FD3C2'],['c_rd','Красный','chk100','#E5484D'],['c_wh','Белый','hab30','#F4F1EA'],['c_go','Золотой','chk1000','gold'],['c_ni','Ночной','got50','night'],['c_rb','Радужный','spec:admin_server','rainbow']];
const PET_EC=[['e_gr','Зелёные',null,'#3CA559'],['e_br','Карие',null,'#8B5A2B'],['e_bl','Синие',null,'#3A8FE0'],['e_vi','Фиолетовые',null,'#8E5FE0'],['e_am','Янтарные','day20','#E0A12A'],['e_pk','Розовые','thx10','#F06FA6'],['e_rd','Красные','chk500','#E5484D'],['e_aq','Бирюзовые','got10','#22C6C6']];
const PET_EX=[['x_n','Обычные',null],['x_h','Весёлые',null],['x_s','Сонные','hab7'],['x_w','Подмигивает','ot1'],['x_o','Удивлённые','chk100'],['x_l','Сердечки','thx10'],['x_t','Звёзды','chk500']];
const PET_GZ=[['c','Прямо',null],['l','Влево',null],['r','Вправо',null],['u','Вверх',null]];
const PET_MO=[['m_s','Улыбка',null],['m_g','Широкая',null],['m_k','Хитрая','day20'],['m_t','С языком','hab1'],['m_o','Ого!','chk100'],['m_c','Котик','thx1'],['m_z','Спит','hab7']];
const PET_HR=[['r_0','Без причёски',null],['r_t','Хохолок',null],['r_b','Чёлка',null],['r_m','Ирокез','day20'],['r_c','Завиток','hab1'],['r_k','Кучерявая','spec:curly']];
const PET_HC=[['k_br','Каштановый',null,'#5A3A22'],['k_bk','Чёрный',null,'#2A2A35'],['k_bl','Синий',null,'#2F6FD0'],['k_or','Рыжий',null,'#E8872E'],['k_pk','Розовый','thx1','#F06FA6'],['k_gr','Зелёный','hab1','#3FAE5A'],['k_pu','Фиолетовый','day20','#7B4FD1'],['k_go','Золотой','chk500','#F2C94C'],['k_wh','Белый','hab30','#F4F4F4']];
const PET_PT=[['p_0','Без узора',null],['p_d','Веснушки-пятнышки','day1'],['p_h','Сердце на пузике','thx1'],['p_s','Звезда на пузике','chk100'],['p_z','Полоски','hab7']];
// накладки: svg-текст строится в системе координат слоя, см. petGear
const PET_HA=[['','Без шапки',null],['h_cap','Кепка',null],['h_shark','Кигуруми акулы','spec:shark'],['h_party','Праздничный колпак','chk1'],['h_beanie','Зимняя шапка','day20'],['h_bow','Бантик','thx1'],['h_flower','Цветок','hab1'],['h_cowboy','Ковбойская шляпа','chk100'],['h_crown','Корона','chk1000'],['h_pumpkin','Тыква-шапка','evt*'],['h_witch','Шляпа ведьмы','evt*'],['h_horns','Рожки','evt*'],['h_diamond','Алмазная корона','spec:admin_server']];
const PET_GL=[['','Без очков',null],['g_round','Круглые очки',null],['g_sun','Тёмные очки','day1'],['g_heart','Очки-сердечки','thx10']];
const PET_NK=[['','Без ничего',null],['n_scarf','Шарф',null],['n_bow','Бабочка','day20'],['n_medal','Медаль','ot10']];
const PET_CH=[['','Ничего',null],['c_badge','Бейдж парка',null],['c_tee','Футболка Дримвуда','chk100'],['c_star','Звезда-значок','got10'],['c_heart','Сердце','got50']];
const PET_BK=[['','Ничего',null],['b_cape','Красный плащ',null],['b_wings','Волшебные крылышки','ot1'],['b_bat','Крылья летучей мыши','evt*']];
const PET_HD=[['','Пусто',null],['d_balloon','Шарик',null],['d_wand','Волшебная палочка','hab1'],['d_flag','Флажок парка','day20']];
// группы для экрана: ключ в настройке, заголовок, варианты, как показывать плитку (кадр для крупного плана)
const PET_G=[
 ['bc','Цвет шерсти',PET_BC,'sw',null],['ec','Цвет глаз',PET_EC,'sw',[85,90,150,110]],['ex','Глаза',PET_EX,'pv',[60,70,200,170]],['gz','Взгляд',PET_GZ,'pv',[60,70,200,170]],
 ['mo','Улыбка',PET_MO,'pv',[80,130,160,130]],['hr','Причёска',PET_HR,'pv',[50,-40,220,200]],['hc','Цвет причёски',PET_HC,'sw',null],['pt','Узор',PET_PT,'pv',[40,-20,240,420]],
 ['ha','Шапка',PET_HA,'pv',[40,-50,240,200]],['gl','Очки',PET_GL,'pv',[60,70,200,170]],['nk','Шея',PET_NK,'pv',[50,170,220,170]],['ch','Грудь',PET_CH,'pv',[60,230,200,200]],
 ['bk','За спиной',PET_BK,'pv',[0,170,320,290]],['hd','В руке',PET_HD,'pv',[100,100,220,300]]];
const PET_DEF={sp:'',bc:'',ec:'e_gr',ex:'x_n',gz:'c',mo:'m_s',hr:'r_0',hc:'k_br',pt:'p_0',ha:'',gl:'',nk:'',ch:'',bk:'',hd:'',cm:''};
const petEnc=c=>Object.entries(c).filter(([k,v])=>v&&v!==PET_DEF[k]||k==='sp'&&v).map(([k,v])=>k+'='+v).join(';');
const petDec=s=>{const c={...PET_DEF};String(s||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)c[p.slice(0,i)]=p.slice(i+1)});return c};
// конфигурация человека с проверкой, что вещи у него открыты
function petCfg(row){
  const c=petDec(row?.cos?.pet),o={...PET_DEF};
  if(!PET_SP.some(x=>x[0]===c.sp&&(!x[3]||gmHas(row,x[3]))))return null;
  o.sp=c.sp;
  PET_G.forEach(([k,,L])=>{const it=L.find(x=>x[0]===c[k]);if(it&&gmHas(row,it[2]))o[k]=it[0]});
  if(!o.bc)o.bc=PET_BC.find(x=>x[3]===PET_SP.find(s=>s[0]===o.sp)[2])?.[0]||'c_or';
  return o;
}
const petBcOf=sp=>(PET_BC.find(x=>x[3]===PET_SP.find(s=>s[0]===sp)[2])||PET_BC[0])[0];

// ---------- рисование ----------
// градиентные «скины» шерсти (из автомата): s — цвета по диагонали, base — средний цвет, belly — цвет пузика
const PET_GRAD={sunset:{s:['#FF6B8B','#FF9E4D','#FFD76B'],base:'#FF8E53',belly:'#FFE6D2'},ocean:{s:['#5FE0C8','#3A9AE0','#2B3A9F'],base:'#3C9AD0',belly:'#D8F1FA'},candy:{s:['#FF9ECD','#FFE0EE','#9EE7FF'],base:'#FFB3D5',belly:'#FFF3F8'},galaxy:{s:['#2B1B5E','#6A3FC9','#C06BFF'],base:'#5B35B0',belly:'#8F6AE0'},goldsuit:{s:['#FFF6C2','#F5C842','#C48A12','#FFE98A'],base:'#F5C842',belly:'#FFF8D6'},ghost:{s:['#EAFBFF','#BCE8F6','#93CDEA'],base:'#BCE8F6',belly:'#F6FDFF'}};
// дополнительные рисунки (заполняются в gacha.js): за спиной, в руке, очки
const PET_BX={},PET_HX={},PET_GLX={};
function petDefs(id,bcv,hcv,ecv){
  const rad=(n,c)=>`<radialGradient id="${id}${n}" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="${pMix(c,'#ffffff',.38)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${pMix(c,'#000000',.24)}"/></radialGradient>`;
  let body;
  if(bcv==='gold')body=`<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset=".5" stop-color="#EDBE46"/><stop offset="1" stop-color="#B8821C"/></linearGradient>`;
  else if(bcv==='rainbow')body=`<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6B8B"/><stop offset=".25" stop-color="#FFB347"/><stop offset=".5" stop-color="#7BDB8A"/><stop offset=".75" stop-color="#52A7FF"/><stop offset="1" stop-color="#B07CFF"/></linearGradient>`;
  else if(bcv==='night')body=`<radialGradient id="${id}b" cx=".35" cy=".28" r=".9"><stop offset="0" stop-color="#4C5CC8"/><stop offset="1" stop-color="#1B2262"/></radialGradient>`;
  else if(PET_GRAD[bcv]){const g=PET_GRAD[bcv].s;body=`<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1">${g.map((c,i)=>`<stop offset="${(i/(g.length-1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`}
  else body=rad('b',bcv);
  return body+rad('h',hcv)+`<radialGradient id="${id}e" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${pMix(ecv,'#ffffff',.35)}"/><stop offset=".7" stop-color="${ecv}"/><stop offset="1" stop-color="${pMix(ecv,'#000000',.35)}"/></radialGradient><radialGradient id="${id}p" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FF9BC4"/><stop offset="1" stop-color="#E5226F"/></radialGradient>`;
}
function petEye(cx,cy,mode,id,gz,idx){
  const dx={c:0,l:-8,r:8,u:0}[gz]||0,dy={c:0,l:0,r:0,u:-11}[gz]||0;
  const white=(rx=24,ry=29)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${PET_INK}" stroke-width="3.2"/>`;
  const iris=(r=18,pr=9.5)=>`<g class="pir"><circle cx="${cx+dx}" cy="${cy+2+dy}" r="${r}" fill="url(#${id}e)"/><circle cx="${cx+dx}" cy="${cy+3+dy}" r="${pr}" fill="#1B1020"/><circle cx="${cx+dx-6}" cy="${cy-6+dy}" r="6" fill="#fff"/><circle cx="${cx+dx+7}" cy="${cy+9+dy}" r="3" fill="#fff" opacity=".9"/></g>`;
  const happy=`<path d="M${cx-21} ${cy+10}Q${cx} ${cy-22} ${cx+21} ${cy+10}" stroke="${PET_INK}" stroke-width="7.5" fill="none" stroke-linecap="round"/>`;
  if(mode==='x_h')return happy;
  if(mode==='x_w'&&idx===1)return happy;
  if(mode==='x_l')return white()+petHrt(cx,cy+2,1.75,'#FF3D84');
  if(mode==='x_t')return white()+petStar(cx,cy+1,1.65,'#FFD54A');
  if(mode==='x_o')return white(26,32)+iris(14,6.5)+`<path d="M${cx-24} ${cy-44}Q${cx} ${cy-58} ${cx+24} ${cy-44}" stroke="${PET_INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(mode==='x_s')return white()+iris()+`<path d="M${cx-24} ${cy+2}A24 29 0 0 1 ${cx+24} ${cy+2}Z" fill="url(#${id}b)" stroke="${PET_INK}" stroke-width="3.2" stroke-linejoin="round"/>`;
  return white()+iris()+`<path d="M${cx-24} ${cy-6}Q${cx} ${cy-34} ${cx+24} ${cy-6}" stroke="${PET_INK}" stroke-width="3" fill="none" opacity=".35"/>`;
}
const petMouth=m=>{
  const s=`stroke="${PET_INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  if(m==='m_g')return `<path d="M134 196Q160 240 186 196Z" fill="#7A1F2B" stroke="${PET_INK}" stroke-width="4" stroke-linejoin="round"/><path d="M142 197H178V203Q160 207 142 203Z" fill="#fff"/><ellipse cx="160" cy="220" rx="13" ry="8" fill="#FF7B9C"/>`;
  if(m==='m_k')return `<path d="M140 198Q168 214 188 190" ${s}/><path d="M188 190l6-6" ${s}/>`;
  if(m==='m_t')return `<path d="M136 196Q160 218 184 196" ${s}/><path d="M150 207Q160 238 172 207Z" fill="#FF7B9C" stroke="${PET_INK}" stroke-width="3.4" stroke-linejoin="round"/><path d="M161 210V222" stroke="#E5226F" stroke-width="2.4"/>`;
  if(m==='m_o')return `<ellipse cx="160" cy="208" rx="11" ry="14" fill="#7A1F2B" stroke="${PET_INK}" stroke-width="4"/>`;
  if(m==='m_c')return `<path d="M132 194Q146 210 160 194Q174 210 188 194" ${s}/>`;
  if(m==='m_z')return `<path d="M146 204H174" ${s}/><text x="214" y="102" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="26" fill="#fff" stroke="${PET_INK}" stroke-width="1.4">z</text>`;
  return `<path d="M136 196Q160 220 184 196" ${s}/>`;
};
function petHair(h,F,D,id){
  const st=`fill="url(#${id}h)" stroke="${D}" stroke-width="3" stroke-linejoin="round"`;
  if(h==='r_t')return `<path d="M126 84Q92 30 140 6Q136 44 156 72Z" ${st}/><path d="M146 74Q138 12 198 -10Q172 34 184 74Z" ${st}/><path d="M176 76Q206 34 250 40Q216 58 210 88Z" ${st}/>`;
  if(h==='r_m')return `<path d="M124 78L134 20L150 70L162 6L176 68L192 22L200 78Q160 62 124 78Z" ${st}/>`;
  if(h==='r_c')return `<path d="M160 74Q150 26 188 22Q222 22 210 50Q198 66 184 52" fill="none" stroke="${D}" stroke-width="19" stroke-linecap="round"/><path d="M160 74Q150 26 188 22Q222 22 210 50Q198 66 184 52" fill="none" stroke="url(#${id}h)" stroke-width="13" stroke-linecap="round"/>`;
  if(h==='r_k'){let c='';const cs=[];for(let a=12;a<=168;a+=14){const r=a/180*Math.PI;cs.push([160+Math.cos(r)*98,126-Math.sin(r)*80,22])}
    [[110,78,19],[142,62,20],[178,62,20],[210,78,19],[126,98,15],[194,98,15]].forEach(x=>cs.push(x));
    c=cs.map(([x,y,r])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" ${st}/>`).join('');
    const sp=cs.slice(0,11).map(([x,y,r])=>`<path d="M${(x-r*.45).toFixed(1)} ${(y+r*.1).toFixed(1)}q${(r*.45).toFixed(1)} ${(-r*.7).toFixed(1)} ${(r*.9).toFixed(1)} 0" fill="none" stroke="${D}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`).join('');
    return c+sp}
  if(h==='r_b')return `<path d="M62 126Q78 54 160 58Q242 54 258 126Q236 96 208 112Q184 84 160 108Q136 84 112 112Q84 96 62 126Z" ${st}/>`;
  return '';
}
function petEars(sp,F,D,inn){
  const m=(g)=>`<g>${g}</g><g transform="translate(320 0) scale(-1 1)">${g}</g>`;
  const st=`fill="${F}" stroke="${D}" stroke-width="3.2" stroke-linejoin="round"`;
  if(sp==='fox')return m(`<path d="M70 124L38 4L140 72Z" ${st}/><path d="M74 104L56 38L116 76Z" fill="${inn}"/>`);
  if(sp==='bear')return m(`<circle cx="88" cy="84" r="40" ${st}/><circle cx="88" cy="86" r="22" fill="${inn}"/>`);
  if(sp==='potato')return m(`<ellipse cx="72" cy="128" rx="22" ry="17" transform="rotate(-24 72 128)" ${st}/>`);
  if(sp==='leopard')return m(`<circle cx="92" cy="86" r="32" ${st}/><circle cx="92" cy="90" r="17" fill="#3A2A22"/>`);
  if(sp==='unicorn')return m(`<path d="M66 122L48 50L118 92Z" ${st}/><path d="M72 108L60 66L102 92Z" fill="${inn}"/>`)+`<path d="M144 84L160 -30L176 84Z" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.2" stroke-linejoin="round"/><path d="M148 62L172 52M150 44L170 34M152 26L168 18M146 80L174 70" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>`;
  if(sp==='bunny')return m(`<ellipse cx="106" cy="14" rx="28" ry="64" transform="rotate(-12 106 14)" ${st}/><ellipse cx="106" cy="20" rx="14" ry="46" transform="rotate(-12 106 20)" fill="${inn}"/>`);
  return m(`<path d="M64 120L8 96L42 152Z" ${st}/><path d="M112 78L98 12L146 66Z" fill="#F5E6B3" stroke="${D}" stroke-width="3.2" stroke-linejoin="round"/>`);
}
function petTail(sp,F,D,bellyc){
  const st=`fill="${F}" stroke="${D}" stroke-width="3.2" stroke-linejoin="round"`;
  if(sp==='fox')return `<path d="M112 394Q8 414 8 300Q8 238 58 232Q40 290 78 332Q98 352 130 352Z" ${st}/><path d="M8 300Q8 240 58 232Q42 262 48 286Q24 284 8 300Z" fill="#FFF6E8" stroke="${D}" stroke-width="2"/>`;
  if(sp==='bear')return `<circle cx="96" cy="392" r="22" ${st}/>`;
  if(sp==='bunny')return `<circle cx="94" cy="394" r="25" fill="#fff" stroke="${D}" stroke-width="3"/>`;
  if(sp==='potato')return '';
  if(sp==='leopard')return `<path d="M112 392Q30 410 24 330Q20 290 52 272" fill="none" stroke="${D}" stroke-width="32" stroke-linecap="round"/><path d="M112 392Q30 410 24 330Q20 290 52 272" fill="none" stroke="${F}" stroke-width="25" stroke-linecap="round"/><path d="M40 380Q30 362 28 346M26 318Q24 304 32 292" stroke="#2A1B12" stroke-width="8" stroke-linecap="round" fill="none"/>`;
  if(sp==='unicorn')return ['#FF5E7E','#FFB347','#FFE45E','#4FC98F','#52A7FF','#B07CFF'].map((c,i)=>`<path d="M112 396Q${40-i*3} ${410+i*4} ${34-i*2} ${340-i*4}Q${28-i*2} ${300-i*3} ${60-i*2} ${280+i*3}" fill="none" stroke="${c}" stroke-width="${30-i*4.4}" stroke-linecap="round"/>`).join('');
  return `<path d="M112 392Q32 406 24 336Q20 302 46 292" fill="none" stroke="${D}" stroke-width="32" stroke-linecap="round"/><path d="M112 392Q32 406 24 336Q20 302 46 292" fill="none" stroke="${F}" stroke-width="25" stroke-linecap="round"/><path d="M46 292L20 268L70 274Z" fill="#F5E6B3" stroke="${D}" stroke-width="3" stroke-linejoin="round"/>`;
}
function petBack(b,sp,F,D,W){
  let o='';
  if(sp==='unicorn'){const mn=['#FF5E7E','#FFB347','#FFE45E','#4FC98F','#52A7FF','#B07CFF'].map((c,i)=>{const w=`<path d="M${96-i*3} ${96+i*6}Q${20-i*4} ${150+i*8} ${40-i*2} ${260+i*4}Q${60-i*2} ${310+i*2} ${112-i*4} ${300-i*6}" fill="none" stroke="${c}" stroke-width="${26-i*3.6}" stroke-linecap="round"/>`;return `<g>${w}</g><g transform="translate(320 0) scale(-1 1)">${w}</g>`}).join('');o+=mn}
  if(sp==='dragon'){const w=`<path d="M100 262Q4 236 12 150Q56 176 96 236Z" fill="${W}" stroke="${D}" stroke-width="3.2" stroke-linejoin="round"/><path d="M60 218Q40 196 30 170" stroke="${D}" stroke-width="2.4" fill="none"/>`;o+=`<g>${w}</g><g transform="translate(320 0) scale(-1 1)">${w}</g>`}
  if(b==='b_bat'){const w=`<path d="M104 268Q-10 238 4 146Q34 178 52 160Q70 194 98 178Q100 214 108 246Z" fill="#3A2A55" stroke="#150A28" stroke-width="3.2" stroke-linejoin="round"/><path d="M52 160Q58 196 76 214M98 178Q92 204 96 230" stroke="#150A28" stroke-width="2.4" fill="none"/>`;o+=`<g>${w}</g><g transform="translate(320 0) scale(-1 1)">${w}</g>`}
  if(b==='b_cape')o+=`<path d="M100 236Q36 330 56 424Q160 446 264 424Q284 330 220 236Z" fill="#E5484D" stroke="#8E2222" stroke-width="3.2" stroke-linejoin="round"/><path d="M100 236Q70 340 80 420Q160 436 240 420Q250 340 220 236" fill="none" stroke="#B83232" stroke-width="3" opacity=".6"/>`;
  if(b==='b_wings'){const w=`<path d="M104 268Q-6 216 10 138Q64 160 104 244Z" fill="rgba(190,232,255,.82)" stroke="#6AA9E0" stroke-width="3" stroke-linejoin="round"/><path d="M96 276Q30 292 28 340Q78 338 108 296Z" fill="rgba(190,232,255,.82)" stroke="#6AA9E0" stroke-width="3" stroke-linejoin="round"/>`;o+=`<g>${w}</g><g transform="translate(320 0) scale(-1 1)">${w}</g>`}
  if(PET_BX[b])o+=PET_BX[b];
  return o;
}
// особая вещь: кигуруми акулы (капюшон с плавником и зубами рисуется прямо в координатах головы; тело, хвост и ушки меняются в petSvg)
const PET_SUIT='#7C9FBF',PET_SUITD='#3E5F80',PET_SUITB='#EAF3FA';
const PET_SHARK_HOOD=`<path d="M150 70Q158 14 204 -8Q192 34 196 72Z" fill="${PET_SUIT}" stroke="${PET_SUITD}" stroke-width="3.4" stroke-linejoin="round"/><path d="M58 150L14 196L68 190Z" fill="${PET_SUIT}" stroke="${PET_SUITD}" stroke-width="3.4" stroke-linejoin="round"/><path d="M262 150L306 196L252 190Z" fill="${PET_SUIT}" stroke="${PET_SUITD}" stroke-width="3.4" stroke-linejoin="round"/><path d="M58 176Q44 76 160 54Q276 76 262 176Q252 124 218 108Q160 90 102 108Q68 124 58 176Z" fill="${PET_SUIT}" stroke="${PET_SUITD}" stroke-width="3.4" stroke-linejoin="round"/><path d="M92 114Q160 94 228 114L222 120Q160 102 98 120Z" fill="${PET_SUITB}"/><path d="M100 118L108 132L118 120L128 134L138 122L148 135L158 122L168 135L178 122L188 134L198 120L208 132L218 118" fill="${PET_SUITB}" stroke="${PET_SUITD}" stroke-width="2.2" stroke-linejoin="round" opacity=".95"/><circle cx="118" cy="80" r="9" fill="#1E2A3A"/><circle cx="202" cy="80" r="9" fill="#1E2A3A"/><circle cx="121" cy="77" r="3" fill="#fff"/><circle cx="205" cy="77" r="3" fill="#fff"/><path d="M130 70Q160 62 190 70" stroke="${PET_SUITD}" stroke-width="2.4" fill="none" opacity=".5"/>`;
const PET_SHARK_TAIL=`<path d="M118 396Q46 402 22 330Q50 340 66 322Q70 366 124 364Z" fill="${PET_SUIT}" stroke="${PET_SUITD}" stroke-width="3.4" stroke-linejoin="round"/><path d="M22 330Q8 300 30 280Q38 306 66 322Z" fill="${PET_SUIT}" stroke="${PET_SUITD}" stroke-width="3.4" stroke-linejoin="round"/>`;
// накладки: готовые рисунки, подогнанные под размеры зверька
const petT=(x,y,s,ox,oy,g)=>`<g transform="translate(${x} ${y}) scale(${s}) translate(${-ox} ${-oy})">${g}</g>`;
const PET_GEAR={
 h_cap:`<path d="M108 208Q108 140 180 138Q252 142 254 208Z" fill="#E04B4B" stroke="#8E2222" stroke-width="3"/><path d="M200 204Q268 196 292 220Q250 232 200 218Z" fill="#B83232" stroke="#8E2222" stroke-width="3"/><circle cx="181" cy="139" r="8" fill="#F5D36B" stroke="#8E2222" stroke-width="2"/>`,
 h_party:`<path d="M126 210L214 200L172 84Z" fill="#FF8AD8" stroke="#B0408F" stroke-width="3" stroke-linejoin="round"/><path d="M142 190L205 183M153 158L192 154M162 130L180 127" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="172" cy="84" r="12" fill="#FFE27A" stroke="#B0408F" stroke-width="3"/>`,
 h_beanie:`<path d="M110 212Q104 130 182 128Q256 128 252 210Z" fill="#F2B544" stroke="#9A6A12" stroke-width="3"/><rect x="106" y="190" width="150" height="28" rx="12" fill="#E9A22A" stroke="#9A6A12" stroke-width="3"/><path d="M128 192V216M150 192V216M172 192V216M194 192V216M216 192V216M238 192V216" stroke="#9A6A12" stroke-width="3"/><circle cx="182" cy="122" r="17" fill="#FFF3C9" stroke="#9A6A12" stroke-width="3"/>`,
 h_bow:`<path d="M205 150L252 122L252 176Z" fill="#FF6FA5" stroke="#B02A63" stroke-width="3" stroke-linejoin="round"/><path d="M205 150L158 122L158 176Z" fill="#FF6FA5" stroke="#B02A63" stroke-width="3" stroke-linejoin="round"/><circle cx="205" cy="150" r="14" fill="#FF3D84" stroke="#B02A63" stroke-width="3"/>`,
 h_flower:`<g transform="translate(214 150)">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-17" rx="11" ry="15" fill="#FFB7D5" stroke="#C25A8A" stroke-width="2.4" transform="rotate(${a})"/>`).join('')}<circle r="10" fill="#FFD54A" stroke="#C99A12" stroke-width="2.4"/></g>`,
 h_cowboy:`<ellipse cx="180" cy="206" rx="104" ry="20" fill="#B5793C" stroke="#6B4118" stroke-width="3.4"/><path d="M122 204Q118 140 150 132Q180 150 210 132Q242 140 238 204Z" fill="#C98A48" stroke="#6B4118" stroke-width="3.4" stroke-linejoin="round"/><path d="M122 192Q180 208 238 192" stroke="#6B4118" stroke-width="9" fill="none"/>`,
 h_crown:`<path d="M118 208L110 130L148 168L180 112L212 168L250 130L242 208Z" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.4" stroke-linejoin="round"/><circle cx="180" cy="190" r="9" fill="#E0245E" stroke="#9A6D0A" stroke-width="2.4"/><circle cx="144" cy="192" r="6" fill="#4FC3F7" stroke="#9A6D0A" stroke-width="2"/><circle cx="216" cy="192" r="6" fill="#66BB6A" stroke="#9A6D0A" stroke-width="2"/>`,
 h_pumpkin:`<path d="M122 212Q106 160 150 150Q180 138 210 150Q254 160 238 212Q180 226 122 212Z" fill="#FF8A1F" stroke="#9A4A00" stroke-width="3.4"/><path d="M165 150Q160 190 168 212M195 150Q200 190 192 212" stroke="#C25A00" stroke-width="3" fill="none"/><path d="M176 148Q170 124 190 116Q186 134 188 148Z" fill="#5E9E3A" stroke="#2F5E18" stroke-width="3"/>`,
 h_witch:`<ellipse cx="180" cy="206" rx="108" ry="19" fill="#4B2A7B" stroke="#241040" stroke-width="3.4"/><path d="M128 204L164 88Q172 62 196 70Q184 86 188 104L234 204Z" fill="#5E35A0" stroke="#241040" stroke-width="3.4" stroke-linejoin="round"/><path d="M136 186Q184 202 230 186L234 204Q184 220 132 204Z" fill="#F2A33A" stroke="#241040" stroke-width="3"/><rect x="168" y="183" width="24" height="26" rx="3" fill="#FFD54A" stroke="#241040" stroke-width="2.5"/>`,
 h_horns:`<path d="M128 200Q110 160 134 130Q138 164 154 192Z" fill="#E5484D" stroke="#7A1010" stroke-width="3.2" stroke-linejoin="round"/><path d="M232 200Q250 160 226 130Q222 164 206 192Z" fill="#E5484D" stroke="#7A1010" stroke-width="3.2" stroke-linejoin="round"/>`,
 h_diamond:`<defs><linearGradient id="petdc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0FFFD"/><stop offset=".5" stop-color="#5EEAD4"/><stop offset="1" stop-color="#0E8FA8"/></linearGradient></defs><path d="M118 208L108 120L148 164L180 100L212 164L252 120L242 208Z" fill="url(#petdc)" stroke="#0B6F85" stroke-width="3.4" stroke-linejoin="round"/><path d="M148 164L160 208M212 164L200 208M180 100L180 208" stroke="#fff" stroke-opacity=".7" stroke-width="2.4"/>`,
 n_scarf:`<path d="M132 342Q182 366 232 340L236 362Q184 386 128 362Z" fill="#E04B4B" stroke="#8E2222" stroke-width="3.4" stroke-linejoin="round"/><path d="M206 362L228 362L234 430L206 430Z" fill="#E04B4B" stroke="#8E2222" stroke-width="3.4" stroke-linejoin="round"/><path d="M146 352Q150 374 148 366M178 360V380M208 370V380" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
 n_bow:`<path d="M184 356L142 338V374Z" fill="#8E5FE0" stroke="#4A2A92" stroke-width="3.4" stroke-linejoin="round"/><path d="M184 356L226 338V374Z" fill="#8E5FE0" stroke="#4A2A92" stroke-width="3.4" stroke-linejoin="round"/><circle cx="184" cy="356" r="10" fill="#6B3DC4" stroke="#4A2A92" stroke-width="3"/>`,
 n_medal:`<path d="M148 346L184 408L222 346" fill="none" stroke="#2D7DD2" stroke-width="12" stroke-linejoin="round"/><circle cx="184" cy="418" r="22" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.4"/>${petStar(184,418,.9,'#fff3b0')}`,
 c_badge:`<rect x="136" y="388" width="64" height="40" rx="9" fill="#fff" stroke="#2B5E73" stroke-width="3.4"/><rect x="136" y="388" width="64" height="12" rx="6" fill="#62C4D8"/><text x="168" y="418" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="13" fill="#2B5E73">ДРИМВУД</text>`,
 c_tee:`<path d="M140 372Q184 392 232 372L246 470Q188 494 128 470Z" fill="#62C4D8" stroke="#2B5E73" stroke-width="3.4" stroke-linejoin="round"/><text x="188" y="428" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="18" fill="#fff">ДРИМ</text><text x="188" y="450" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="18" fill="#fff">ВУД</text>`,
 c_star:petStar(170,410,1.9,'#FFD54A'),c_heart:petHrt(172,414,2.3,'#FF3D84')
};
function petGear(c,face){ // face: {eyesY}
  let top='',hat='';
  const id=c.ha&&PET_GEAR[c.ha],g=c.gl;
  const E=`<g fill="none" stroke="#2B2B3A" stroke-width="5.5" stroke-linecap="round">`;
  let gl='';
  if(g==='g_round')gl=`<g fill="rgba(255,255,255,.2)" stroke="#2B2B3A" stroke-width="5.5"><circle cx="118" cy="148" r="35"/><circle cx="202" cy="148" r="35"/></g><path d="M153 146Q160 138 167 146M83 142L58 130M237 142L262 130" stroke="#2B2B3A" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  if(g==='g_sun')gl=`<path d="M82 128Q82 116 96 116H134Q148 116 146 140Q142 182 112 182Q80 178 82 128Z" fill="#1E1F2B" stroke="#000" stroke-width="3.4"/><path d="M174 140Q172 116 186 116H224Q238 116 238 128Q240 178 208 182Q178 182 174 140Z" fill="#1E1F2B" stroke="#000" stroke-width="3.4"/><path d="M144 134H176" stroke="#000" stroke-width="6"/><path d="M92 130L112 124M184 130L204 124" stroke="#fff" stroke-opacity=".6" stroke-width="4.4" stroke-linecap="round"/>`;
  if(g==='g_heart')gl=`${petHrt(118,150,3.2,'#FF5C9A')}${petHrt(202,150,3.2,'#FF5C9A')}<path d="M153 142Q160 134 167 142" stroke="#B02A63" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(PET_GLX[g])gl=PET_GLX[g];
  return {hat:c.ha==='h_shark'?PET_SHARK_HOOD:id?petT(160,104,1.34,180,205,PET_GEAR[c.ha]):'',gl,nk:c.nk?petT(160,236,1.3,184,352,PET_GEAR[c.nk]):'',ch:c.ch?petT(160,322,1.12,184,410,PET_GEAR[c.ch]):''};
}
function petHandItem(h){
  if(h==='d_balloon')return `<path d="M240 352Q270 270 290 176" stroke="#7A5C8F" stroke-width="3" fill="none"/><ellipse cx="292" cy="130" rx="30" ry="42" fill="url(#PETP)" stroke="#B0176A" stroke-width="3"/><ellipse cx="282" cy="114" rx="8" ry="13" fill="#fff" opacity=".5" transform="rotate(20 282 114)"/><path d="M286 172L292 180L298 172Z" fill="#E5226F"/>`;
  if(h==='d_wand')return `<path d="M240 358L272 214" stroke="#8E5FE0" stroke-width="8" stroke-linecap="round"/>${petStar(276,196,2.1,'#FFD54A')}<circle cx="296" cy="168" r="4" fill="#fff"/><circle cx="256" cy="176" r="3" fill="#fff"/>`;
  if(h==='d_flag')return `<path d="M242 360L268 150" stroke="#7A5C3A" stroke-width="6" stroke-linecap="round"/><path d="M268 152L318 168L270 196Z" fill="#E5484D" stroke="#8E2222" stroke-width="3" stroke-linejoin="round"/>${petStar(284,170,.6,'#fff')}`;
  return PET_HX[h]||'';
}
// сам зверёк. opt: cfg — настройки, vb — кадр, bg — фон, sz — ширина
function petSvg(c,opt={}){
  const id='pt'+(++PET_N)+'_';
  const sp=c.sp,bcItem=PET_BC.find(x=>x[0]===c.bc)||PET_BC[0],bcv=bcItem[3];
  const solid=/^#/.test(bcv),F=`url(#${id}b)`;
  const baseHex=solid?bcv:PET_GRAD[bcv]?PET_GRAD[bcv].base:(bcv==='gold'?'#EDBE46':bcv==='night'?'#2F3F9A':'#9A7BFF');
  const D=pMix(baseHex,'#1a1030',.45),hcv=(PET_HC.find(x=>x[0]===c.hc)||PET_HC[0])[3],ecv=(PET_EC.find(x=>x[0]===c.ec)||PET_EC[0])[3];
  const belly=solid?pMix(bcv,'#FFF4DC',.62):PET_GRAD[bcv]?PET_GRAD[bcv].belly:bcv==='gold'?'#FFF1C4':bcv==='night'?'#5668D4':'#ffffff';
  const muz=sp==='bear'?pMix(baseHex,'#FFE9C7',.65):sp==='dragon'?belly:(solid?pMix(bcv,'#ffffff',.82):belly);
  const inn='#F7C6CF',hD=pMix(hcv,'#000000',.45);
  const gear=petGear(c);
  const SU=c.ha==='h_shark',Fb=SU?PET_SUIT:F,Dk=SU?PET_SUITD:D;
  const nose=sp==='bunny'?`<ellipse cx="160" cy="176" rx="10" ry="7.5" fill="#F48FB1" stroke="${PET_INK}" stroke-width="2.4"/>`:sp==='dragon'?`<circle cx="150" cy="176" r="4" fill="${PET_INK}" opacity=".7"/><circle cx="170" cy="176" r="4" fill="${PET_INK}" opacity=".7"/>`:`<ellipse cx="160" cy="176" rx="13" ry="9" fill="#3A2530"/><ellipse cx="156" cy="173" rx="4" ry="2.4" fill="#fff" opacity=".6"/>`;
  let pat='';
  if(c.pt==='p_h')pat=petHrt(160,334,2.4,'#FF7BA5');
  if(c.pt==='p_s')pat=petStar(160,334,1.9,'#FFD54A');
  if(c.pt==='p_d'){const sp2=pMix(baseHex,'#ffffff',.42);pat=[[150,80,6],[176,88,8],[128,92,5],[212,94,5],[118,284,9],[204,292,11],[134,372,8],[190,366,6],[222,330,7]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${sp2}" opacity=".85"/>`).join('')}
  if(c.pt==='p_z')pat=`<path d="M142 68Q140 90 146 104M160 62V98M178 68Q180 90 174 104" stroke="${D}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/><path d="M98 290Q118 296 124 316M96 330Q116 334 122 352M222 290Q202 296 196 316M224 330Q204 334 198 352" stroke="${D}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>`;
  if(bcv==='night'||bcv==='galaxy')pat+=[[100,90,3],[220,80,2.5],[84,230,2.5],[250,150,3],[120,300,3],[206,280,2.5],[150,380,3],[186,358,2],[70,150,2.5],[236,112,2]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".9"/>`).join('');
  if(sp==='potato')pat+=[[120,84,7,4],[206,92,6,4],[150,64,5,3],[100,150,6,4],[226,150,5,3],[110,300,10,7],[212,296,9,6],[126,380,8,5],[198,372,9,6],[222,336,7,5],[98,340,6,4],[170,392,8,5]].map(([x,y,rx,ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#8A5E2C" opacity=".78"/><ellipse cx="${x-1}" cy="${y-1}" rx="${rx*.5}" ry="${ry*.5}" fill="#5E3C16" opacity=".6"/>`).join('');
  if(sp==='leopard')pat+=[[118,86,9],[204,88,8],[148,66,6],[98,150,7],[228,150,6],[110,296,12],[214,292,11],[96,350,9],[230,346,9],[128,382,10],[196,380,10],[160,262,8],[84,258,7],[238,262,7]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#2A1B12" stroke-width="${Math.max(3,r*.45)}" opacity=".85"/><circle cx="${x}" cy="${y}" r="${r*.28}" fill="#2A1B12" opacity=".85"/>`).join('');
  if(sp==='unicorn')pat+=`<rect x="112" y="316" width="96" height="34" rx="12" fill="#fff" stroke="#8E5FE0" stroke-width="3.4"/><text x="160" y="340" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="21" fill="#8E5FE0" letter-spacing="1">МЕДИА</text>`;
  const hand=petHandItem(c.hd).replace('PETP',id+'p');
  const vb=opt.vb||PET_VB,sz=opt.sz||160;
  const body=`<defs>${petDefs(id,solid?bcv:bcv,hcv,ecv)}</defs>`+
   petBack(c.bk,sp,F,D,pMix(baseHex,'#ffffff',.3))+(SU?PET_SHARK_TAIL:petTail(sp,F,D,belly))+(SU?'':petEars(sp,F,D,inn))+
   `<path d="M160 232C100 232 88 300 90 350C92 396 120 410 160 410C200 410 228 396 230 350C232 300 220 232 160 232Z" fill="${Fb}" stroke="${Dk}" stroke-width="3.4"/>`+
   `<ellipse cx="160" cy="338" rx="48" ry="62" fill="${SU?PET_SUITB:belly}"/>`+
   `<ellipse cx="94" cy="318" rx="19" ry="48" transform="rotate(14 94 318)" fill="${Fb}" stroke="${Dk}" stroke-width="3.2"/><circle cx="82" cy="362" r="19" fill="${Fb}" stroke="${Dk}" stroke-width="3.2"/>`+
   `<ellipse cx="226" cy="318" rx="19" ry="48" transform="rotate(-14 226 318)" fill="${Fb}" stroke="${Dk}" stroke-width="3.2"/><circle cx="238" cy="362" r="19" fill="${Fb}" stroke="${Dk}" stroke-width="3.2"/>`+
   `<ellipse cx="116" cy="410" rx="38" ry="19" fill="${Fb}" stroke="${Dk}" stroke-width="3.2"/><ellipse cx="204" cy="410" rx="38" ry="19" fill="${Fb}" stroke="${Dk}" stroke-width="3.2"/><path d="M98 414v-8M116 416v-9M134 414v-8M186 414v-8M204 416v-9M222 414v-8" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/>`+
   `<ellipse cx="160" cy="150" rx="104" ry="90" fill="${F}" stroke="${D}" stroke-width="3.4"/><ellipse cx="116" cy="96" rx="42" ry="20" fill="#fff" opacity=".2" transform="rotate(-20 116 96)"/>`+
   `<ellipse cx="160" cy="196" rx="48" ry="33" fill="${muz}"/><circle cx="84" cy="196" r="16" fill="#FF8FA3" opacity=".42"/><circle cx="236" cy="196" r="16" fill="#FF8FA3" opacity=".42"/>`+pat+
   `<g class="pey">`+petEye(118,148,c.ex,id,c.gz,0)+petEye(202,148,c.ex,id,c.gz,1)+`</g>`+nose+petMouth(c.mo)+
   petHair(c.hr,F,hD,id)+gear.nk+gear.ch+hand+gear.gl+gear.hat+(sp==='potato'&&!c.ha?`<path d="M158 70Q148 34 176 22Q168 44 172 70Z" fill="#6DBB48" stroke="#3E7B2E" stroke-width="3" stroke-linejoin="round"/><ellipse cx="186" cy="34" rx="16" ry="9" transform="rotate(-28 186 34)" fill="#7ED957" stroke="#3E7B2E" stroke-width="3"/>`:'')+(c.cm?`<g class="cmw"><image href="stickers/mascot-hi.webp" x="188" y="282" width="132" height="132"/></g>`:'');
  return `<svg viewBox="${vb.join(' ')}" width="100%" height="100%" aria-hidden="true">${body}</svg>`;
}
// готовый блок с питомцем человека (или с заданной настройкой). bg — класс фона
function gmPet(row,sz=160,opt={}){
  const c=opt.cfg||petCfg(row);if(!c)return '';
  const bg=opt.bg===undefined?(gmCos(row).bg||''):opt.bg,vb=opt.vb||PET_VB;
  return `<div class="drm ${bg}${opt.anim||sz>=90?' pan':''}${c.bc==='c_ghost'?' pgh':c.bc==='c_goldsuit'?' pgs':''}" style="width:${sz}px;height:${Math.round(sz*vb[3]/vb[2])}px">${petSvg(c,{vb})}</div>`;
}

// ---- оживление питомца: моргает, смотрит по сторонам, следит за пальцем, прыгает от нажатия ----
(function(){
  if(window.__panInit)return;window.__panInit=1;
  const rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const all=()=>document.querySelectorAll('.drm.pan');
  const gaze=(el,x,y)=>{el.style.setProperty('--ix',x.toFixed(1)+'px');el.style.setProperty('--iy',y.toFixed(1)+'px')};
  let last=0;
  const look=(cx,cy)=>{last=Date.now();all().forEach(el=>{const r=el.getBoundingClientRect();if(!r.width)return;
    const dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height*.46),d=Math.hypot(dx,dy)||1,k=Math.min(1,d/160);gaze(el,dx/d*9*k,dy/d*8*k)})};
  if(!rm){
    addEventListener('pointermove',e=>look(e.clientX,e.clientY),{passive:true});
    addEventListener('touchmove',e=>{const t=e.touches[0];t&&look(t.clientX,t.clientY)},{passive:true});
    setInterval(()=>{if(Date.now()-last<4000)return;all().forEach(el=>{if(Math.random()<.35)gaze(el,0,0);else gaze(el,(Math.random()*2-1)*9,(Math.random()*2-1)*6)})},2600);
  }
  document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('.drm.pan');if(!el||rm)return;
    el.classList.remove('pjump');void el.offsetWidth;el.classList.add('pjump');
    const r=el.getBoundingClientRect();look(e.clientX,e.clientY);
    for(let i=0;i<4;i++){const h=document.createElement('span');h.className='pheart';h.textContent=['💖','✨','💛','💕'][i%4];
      h.style.left=(r.left+r.width*(.3+Math.random()*.4))+'px';h.style.top=(r.top+r.height*.3)+'px';h.style.animationDelay=(i*90)+'ms';
      document.body.appendChild(h);setTimeout(()=>h.remove(),1500)}
  });
})();
