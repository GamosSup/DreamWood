// Автомат с шариками (как корейские капсульные автоматы): предметы, шансы, экран.
// Предметы выпадают из шариков. Билет: по одному за каждое достижение и за каждые полчаса доработки/переработки (считает база).
// Список GXI — единственный источник: по нему база (gacha_items) и приложение. Если меняешь, пересобери SQL (см. supabase/migration_2026-11-11_gacha.sql).

// редкости: название, цвет, шанс (%)
const GX_R=[null,['Обычная','#9FB68C',50],['Редкая','#6AA9E0',32],['Эпическая','#A57BE8',12],['Мифическая','#F26B4E',4],['Легендарная','#F0B429',1.9],['Тайна хранителя','conic-gradient(#FF5E7E,#FFB347,#4FC98F,#52A7FF,#B07CFF,#FF5E7E)',0.1]];
const GX_COIN=[0,1,2,5,10,25,100];          // сколько монет даёт дубль
const GX_PRICE=[0,5,10,25,50,100,0];         // цена в монетах (0 — не продаётся)
const GX_KIND={bc:'Цвет шерсти',ha:'Шапка',gl:'Очки',nk:'Шея',ch:'Грудь',bk:'За спиной',hd:'В руке',cm:'Компаньон',frame:'Рамка',name:'Цвет имени',bg:'Фон',key:'Значок и титул'};
// [код, редкость, вид, название, значение (цвет шерсти)]
const GXI=[
 // --- обычные (18)
 ['c_mintg',1,'bc','Мятная жвачка','#8EE3C8'],['c_lav',1,'bc','Лавандовый','#C3B1F0'],['c_peach',1,'bc','Персик','#FFB38A'],['c_teal',1,'bc','Бирюзовый','#2EC4B6'],
 ['c_choc',1,'bc','Шоколадный','#6B4130'],['c_lime',1,'bc','Лаймовый','#A8D83F'],['c_cream',1,'bc','Сливочный','#F4E4C1'],['c_graph',1,'bc','Графит','#4A4F5C'],
 ['h_headph',1,'ha','Наушники'],['h_chef',1,'ha','Поварской колпак'],['d_lolli',1,'hd','Леденец'],['d_ice',1,'hd','Мороженое'],
 ['n_mintc',1,'name','Мятное'],['n_coral',1,'name','Коралловое'],['n_lilac',1,'name','Сиреневое'],
 ['bg_peach',1,'bg','Персиковый'],['bg_mintbg',1,'bg','Мятный'],['bg_lavbg',1,'bg','Лавандовый'],
 // --- редкие (16)
 ['c_coral',2,'bc','Коралловый','#FF6F61'],['c_indigo',2,'bc','Индиго','#4B4FD1'],['c_rasp',2,'bc','Малиновый','#D6246E'],
 ['h_ninja',2,'ha','Повязка ниндзя'],['h_halo',2,'ha','Нимб'],['h_prop',2,'ha','Кепка с пропеллером'],
 ['n_bell',2,'nk','Колокольчик'],['n_chain',2,'nk','Золотая цепь'],['b_butter',2,'bk','Крылья бабочки'],
 ['f_neon',2,'frame','Неон'],['f_candy',2,'frame','Леденцовая'],['f_ice',2,'frame','Лёд'],
 ['n_sunset',2,'name','Закат'],['n_ocean',2,'name','Океан'],['bg_sakura',2,'bg','Сакура'],['bg_snow',2,'bg','Снегопад'],
 // --- эпические (12)
 ['c_sunset',3,'bc','Закатный','sunset'],['c_ocean',3,'bc','Океанский','ocean'],['c_candy',3,'bc','Конфетный','candy'],
 ['h_tiara',3,'ha','Тиара'],['h_astro',3,'ha','Шлем космонавта'],['b_jet',3,'bk','Реактивный ранец'],['g_vr',3,'gl','VR-шлем'],
 ['f_lava',3,'frame','Лава'],['f_sak',3,'frame','Лепестки сакуры'],['n_aur',3,'name','Северное сияние'],
 ['bg_space',3,'bg','Космос'],['bg_arcade',3,'bg','Аркада'],
 // --- мифические (6)
 ['c_galaxy',4,'bc','Галактика','galaxy'],['b_angel',4,'bk','Ангельские крылья'],['f_circuit',4,'frame','Микросхема'],['f_pixel',4,'frame','Пиксели'],
 ['n_neon',4,'name','Неоновая вывеска'],['bg_aurora',4,'bg','Полярное сияние'],
 // --- легендарные (3)
 ['h_crystal',5,'ha','Хрустальная корона'],['f_royal',5,'frame','Королевская'],['n_royal',5,'name','Королевское имя'],
 // --- тайна хранителя (5)
 ['c_goldsuit',6,'bc','Золотой Дримми-костюм','goldsuit'],['c_ghost',6,'bc','Призрачный питомец','ghost'],['f_rainbow',6,'frame','Радужная аура'],
 ['key',6,'key','Ключ хранителя'],['cm_d',6,'cm','Компаньон: маленький Дримми']
];
const GX_BY=Object.fromEntries(GXI.map(x=>[x[0],{id:x[0],r:x[1],k:x[2],n:x[3],v:x[4]}]));
const gxCode=id=>'gx:'+id;

// ---------- рисунки вещей питомца (в тех же координатах, что и остальные) ----------
const PET_CM=[['','Без компаньона',null],['cm_d','Маленький Дримми','gx:cm_d']];
PET_G.push(['cm','Компаньон',PET_CM,'pv',[160,230,170,200]]);
const gxHat={
 h_headph:`<path d="M112 208Q108 130 180 126Q252 130 248 208" fill="none" stroke="#3A3F52" stroke-width="10" stroke-linecap="round"/><rect x="98" y="176" width="26" height="44" rx="12" fill="#E5484D" stroke="#2B2B3A" stroke-width="3.2"/><rect x="236" y="176" width="26" height="44" rx="12" fill="#E5484D" stroke="#2B2B3A" stroke-width="3.2"/>`,
 h_chef:`<path d="M124 182Q96 170 110 140Q126 112 152 128Q164 98 190 114Q218 100 232 132Q258 148 236 182Z" fill="#fff" stroke="#8A8A9A" stroke-width="3.2" stroke-linejoin="round"/><rect x="124" y="178" width="112" height="30" rx="8" fill="#fff" stroke="#8A8A9A" stroke-width="3.2"/><path d="M148 130Q150 160 146 176M180 118V172M214 130Q212 160 216 176" stroke="#D8D8E4" stroke-width="3" fill="none"/>`,
 h_ninja:`<path d="M108 200Q180 176 254 200L252 224Q180 200 110 224Z" fill="#2B2B3A" stroke="#000" stroke-width="3"/><path d="M160 187L206 193L200 214L156 210Z" fill="#C0C6D4" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/><path d="M254 202L292 218L282 232L252 222ZM250 214L288 246L274 250L246 226Z" fill="#2B2B3A" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>`,
 h_halo:`<ellipse cx="180" cy="126" rx="52" ry="14" fill="none" stroke="#F6C945" stroke-width="9"/><ellipse cx="180" cy="124" rx="52" ry="13" fill="none" stroke="#FFF6BF" stroke-width="3" opacity=".85"/>`,
 h_prop:`<path d="M114 208Q112 142 180 140Q248 142 246 208Z" fill="#52A7FF" stroke="#1F5E9E" stroke-width="3.4"/><path d="M114 208Q112 142 180 140V208Z" fill="#E5484D" stroke="#8E2222" stroke-width="3.4" stroke-linejoin="round"/><rect x="176" y="122" width="8" height="20" fill="#9A6A12"/><ellipse cx="150" cy="116" rx="34" ry="8" fill="#F6C945" stroke="#9A6D0A" stroke-width="2.4"/><ellipse cx="210" cy="116" rx="34" ry="8" fill="#52A7FF" stroke="#1F5E9E" stroke-width="2.4"/>`,
 h_tiara:`<path d="M120 206L132 160L156 182L180 140L204 182L228 160L240 206Z" fill="#E6F4FF" stroke="#6AA9E0" stroke-width="3.2" stroke-linejoin="round"/><circle cx="180" cy="170" r="9" fill="#FF8AD8" stroke="#B0408F" stroke-width="2.4"/><circle cx="148" cy="192" r="5" fill="#9AD8FF"/><circle cx="212" cy="192" r="5" fill="#9AD8FF"/>`,
 h_astro:`<ellipse cx="180" cy="236" rx="76" ry="72" fill="rgba(200,235,255,.26)" stroke="#CFE3F5" stroke-width="7"/><path d="M122 214Q132 176 168 168" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none" opacity=".75"/><rect x="106" y="296" width="148" height="16" rx="8" fill="#E0E6EE" stroke="#7B8794" stroke-width="3.2"/>`,
 h_crystal:`<path d="M118 208L112 140L146 178L168 118L180 150L192 118L214 178L248 140L242 208Z" fill="rgba(170,235,255,.85)" stroke="#2D9CDB" stroke-width="3.4" stroke-linejoin="round"/><path d="M146 178L156 208M214 178L204 208M180 150V208" stroke="#fff" stroke-width="2.6" opacity=".8"/><circle cx="112" cy="140" r="6" fill="#fff" stroke="#2D9CDB" stroke-width="2.4"/><circle cx="248" cy="140" r="6" fill="#fff" stroke="#2D9CDB" stroke-width="2.4"/><circle cx="168" cy="116" r="6" fill="#fff" stroke="#2D9CDB" stroke-width="2.4"/><circle cx="192" cy="116" r="6" fill="#fff" stroke="#2D9CDB" stroke-width="2.4"/>`,
 n_bell:`<path d="M130 346Q184 372 238 346" fill="none" stroke="#E5484D" stroke-width="9" stroke-linecap="round"/><circle cx="184" cy="374" r="14" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.2"/><path d="M178 380h12" stroke="#9A6D0A" stroke-width="3.2" stroke-linecap="round"/>`,
 n_chain:`<path d="M128 344Q184 396 240 344" fill="none" stroke="#F6C945" stroke-width="7" stroke-linecap="round"/><path d="M128 344Q184 396 240 344" fill="none" stroke="#B8860B" stroke-width="2.4" stroke-dasharray="3 6"/><rect x="170" y="386" width="28" height="28" rx="6" fill="#F6C945" stroke="#9A6D0A" stroke-width="3.2"/><text x="184" y="407" text-anchor="middle" font-size="18" font-weight="800" fill="#9A6D0A" font-family="Manrope,Arial,sans-serif">$</text>`
};
Object.assign(PET_GEAR,gxHat);
const gxMir=w=>`<g>${w}</g><g transform="translate(320 0) scale(-1 1)">${w}</g>`;
Object.assign(PET_BX,{
 b_butter:gxMir(`<path d="M104 268Q-10 190 20 110Q88 130 104 244Z" fill="#FF9BD0" stroke="#B0408F" stroke-width="3.2" stroke-linejoin="round"/><path d="M100 280Q20 300 26 366Q86 360 108 300Z" fill="#FFC8E4" stroke="#B0408F" stroke-width="3.2" stroke-linejoin="round"/><circle cx="54" cy="170" r="12" fill="#fff" opacity=".7"/>`),
 b_jet:gxMir(`<rect x="70" y="262" width="34" height="96" rx="14" fill="#B8C2D0" stroke="#4A5568" stroke-width="3.2"/><rect x="76" y="280" width="22" height="10" rx="4" fill="#E5484D"/><path d="M87 358Q70 392 87 424Q104 392 87 358Z" fill="#FFB347" stroke="#E5484D" stroke-width="2.4" stroke-linejoin="round"/>`),
 b_angel:gxMir(`<path d="M104 268Q-24 214 6 120Q40 152 60 134Q74 170 100 168Q102 214 108 246Z" fill="#fff" stroke="#9AB4D0" stroke-width="3.2" stroke-linejoin="round"/><path d="M60 134Q66 180 90 214M100 168Q94 200 98 230" stroke="#C5D6EA" stroke-width="2.4" fill="none"/>`)
});
Object.assign(PET_HX,{
 d_lolli:`<path d="M240 358L270 214" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="274" cy="190" r="26" fill="#FF6FA5" stroke="#B02A63" stroke-width="3.2"/><path d="M274 190m-18 0a18 18 0 0 1 36 0a10 10 0 0 1 -20 0a4 4 0 0 1 8 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
 d_ice:`<path d="M226 298L240 358L256 298Z" fill="#E9B872" stroke="#8A5A1F" stroke-width="3" stroke-linejoin="round"/><circle cx="240" cy="284" r="19" fill="#FF9ECD" stroke="#B02A63" stroke-width="3"/><circle cx="240" cy="262" r="15" fill="#FFF0B0" stroke="#B08A1F" stroke-width="3"/><circle cx="240" cy="246" r="5" fill="#E5484D"/>`
});
Object.assign(PET_GLX,{
 g_vr:`<rect x="70" y="114" width="180" height="66" rx="22" fill="#2B2F45" stroke="#000" stroke-width="3.4"/><rect x="82" y="124" width="70" height="46" rx="14" fill="rgba(120,220,255,.55)"/><rect x="168" y="124" width="70" height="46" rx="14" fill="rgba(120,220,255,.55)"/><path d="M70 146H48M250 146H272" stroke="#2B2F45" stroke-width="9" stroke-linecap="round"/><path d="M92 130L118 130" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`
});

// ---------- регистрация предметов в каталогах кастомизации ----------
const GX_LISTS={ha:PET_HA,gl:PET_GL,nk:PET_NK,ch:PET_CH,bk:PET_BK,hd:PET_HD,frame:GM_FRAMES,name:GM_NAMES,bg:GM_BGS};
GXI.forEach(([id,r,k,n,v])=>{
  const req=gxCode(id);
  if(k==='bc')PET_BC.push([id,n,req,v]);
  else if(GX_LISTS[k])GX_LISTS[k].push([id,n,req]);
  else if(k==='key'){const d={c:req,g:'skill',t:5,ic:'🗝️',n:'Ключ хранителя',d:'Тайна хранителя: выпал из автомата',b:0,man:1,secret:1,title:'Хранитель тайны'};GM_ACH.push(d);GM_BY[req]=d}
});

// ---------- экран автомата ----------
const gxS={info:null};
const gxInfo=async()=>{const r=await sb.rpc('gacha_info');if(r.error)throw r.error;gxS.info=r.data;return r.data};
const gxOwn=id=>gmHas(gmMe(),gxCode(id));
const gxRc=r=>GX_R[r][1];
function gxPet(){return petCfg(gmMe())||{...PET_DEF,sp:'fox',bc:petBcOf('fox')}}
// картинка предмета (для коллекции и результата)
function gxPrev(id,size=78){
  const it=GX_BY[id],k=it.k,me=gmMe();
  if(k==='frame')return `<span class="avw fr ${id}" style="margin:6px"><span class="av ini" style="width:${size-26}px;height:${size-26}px;font-size:14px">${esc((S.me.full_name||'?')[0])}</span></span>`;
  if(k==='name')return `<span class="gnm ${id}" style="font-size:${Math.round(size/4.4)}px">${esc(shortName(S.me.full_name||'Имя').split(' ')[0]||'Имя')}</span>`;
  if(k==='bg')return `<span class="bgsw ${id}" style="width:${size-18}px;height:${size-18}px"></span>`;
  if(k==='key')return `<span style="font-size:${Math.round(size*.55)}px">🗝️</span>`;
  const cfg=gxPet(),base={...cfg,ha:'',gl:'',nk:'',ch:'',bk:'',hd:'',hr:'',cm:''};
  if(k==='bc'||k==='cm')return gmPet({},size,{cfg:{...cfg,[k]:id},vb:k==='bc'?PET_VB:[0,-60,320,500],bg:''});
  const g=PET_G.find(x=>x[0]===k);
  return gmPet({},size,{cfg:{...base,[k]:id},vb:g?g[4]:PET_VB,bg:''});
}
async function gxWear(id){
  const it=GX_BY[id],k=it.k;
  if(k==='frame'||k==='name'||k==='bg')return gmSaveCos({[k]:id});
  if(k==='key')return gmSaveCos({badge:gxCode(id),title:gxCode(id)});
  const me=gmMe(),cfg=petCfg(me);
  if(!cfg){toast('Сначала выбери питомца во вкладке «Мой питомец»',3200);return false}
  return gmPetSave({...cfg,[k]:id});
}
const gxMachine=()=>{
  const cols=['#FF6B8B','#FFB347','#7BDB8A','#52A7FF','#B07CFF','#FFD23F','#F26B4E','#4FC9C0'];
  const balls=Array.from({length:15},(_,i)=>{const a=(i*137.5)%360,rr=14+(i*37)%54,x=130+Math.cos(a*Math.PI/180)*rr*1.25,y=108+Math.sin(a*Math.PI/180)*rr*.85;return `<circle class="gxb" style="animation-delay:${(i%5)*-.12}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="17" fill="${cols[i%8]}" stroke="#fff" stroke-width="2.4"/><path d="M${(x-9).toFixed(0)} ${(y-4).toFixed(0)}Q${x.toFixed(0)} ${(y-14).toFixed(0)} ${(x+8).toFixed(0)} ${(y-8).toFixed(0)}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>`}).join('');
  return `<svg id="gx_m" viewBox="0 0 260 340" width="100%" style="max-width:280px;display:block;margin:0 auto" aria-hidden="true">
   <rect x="38" y="196" width="184" height="126" rx="20" fill="#E5484D" stroke="#8E2222" stroke-width="4"/>
   <rect x="52" y="210" width="156" height="14" rx="7" fill="#FF7A7F" opacity=".7"/>
   <circle cx="130" cy="112" r="92" fill="#DFF3FF" fill-opacity=".55" stroke="#6AA9E0" stroke-width="5"/>
   <g id="gx_bl">${balls}</g>
   <path d="M62 80Q80 40 126 30" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".8"/>
   <rect x="78" y="198" width="104" height="22" rx="8" fill="#B8C2D0" stroke="#4A5568" stroke-width="3.2"/>
   <g id="gx_cr"><circle cx="130" cy="262" r="30" fill="#FFD23F" stroke="#9A6D0A" stroke-width="4"/><rect x="122" y="236" width="16" height="52" rx="8" fill="#F29A1F" stroke="#9A6D0A" stroke-width="3"/><circle cx="130" cy="262" r="7" fill="#9A6D0A"/></g>
   <path d="M92 300h76v26a8 8 0 0 1-8 8h-60a8 8 0 0 1-8-8Z" fill="#8E2222" stroke="#5A1414" stroke-width="3.4"/>
   <text x="130" y="187" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="13" fill="#fff" letter-spacing="2">ДРИМВУД</text></svg>`;
};
const gxPct=r=>{const p=GX_R[r][2];return (p<1?p.toString().replace('.',','):Math.round(p*10)/10).toString().replace('.',',')+'%'};
function gxReveal(d,again){
  const it=GX_BY[d.code]||{id:d.code,r:d.rarity,k:'bg',n:d.code},r=d.rarity,col=gxRc(r),big=r>=5;
  const ov=document.createElement('div');ov.className='gxov';
  ov.innerHTML=`<div class="gxcap" style="--gc:${/^#/.test(col)?col:'#B07CFF'}"><div class="gxt"></div><div class="gxbm"></div></div>
   <div class="gxres r${r}" style="--rc:${col}"><div class="gxrar" style="${r===6?'background:'+col+';-webkit-background-clip:text;background-clip:text;color:transparent':'color:'+col}">${GX_R[r][0]}</div><div class="gxpv">${gxPrev(it.id,150)}</div><b class="gxn">${esc(it.n)}</b><div class="muted">${GX_KIND[it.k]||''}</div>
   <div class="gxdup">${d.dup?`Уже есть. Дубль превратился в <b>+${d.gain} 🪙</b>`:'✨ Новое в коллекции!'}</div>
   <div class="gxbt">${d.dup?'':`<button class="btn" data-w>Надеть</button>`}${(d.tickets>0)?`<button class="btn ghost" data-a>Ещё раз · осталось ${d.tickets} 🎟</button>`:''}<button class="btn ghost" data-x>Закрыть</button></div></div>`;
  document.body.appendChild(ov);
  const done=()=>ov.remove();
  setTimeout(()=>{ov.classList.add('open');if(r>=3)dwParty();if(big){setTimeout(dwParty,500);setTimeout(dwParty,1000)}},1750);
  ov.querySelector('[data-x]').onclick=()=>{done();again&&again(false)};
  const a=ov.querySelector('[data-a]');if(a)a.onclick=()=>{done();again&&again(true)};
  const w=ov.querySelector('[data-w]');if(w)w.onclick=async()=>{w.disabled=true;if(await gxWear(it.id)){w.textContent='Надето ✓'}else w.disabled=false};
}
async function gmGachaTab(box){
  box.innerHTML='<div class="muted" style="padding:14px">Загружаю автомат…</div>';
  let inf;try{inf=await gxInfo()}catch(e){
    box.innerHTML=`<div class="card pad col"><b>Автомат ещё не подключён 🎰</b><div class="muted">${/does not exist|function|schema|gacha/i.test(String(e.message||e))?'В базе нужно один раз запустить обновление. Админ знает.':esc(e.message||e)}</div></div>`;return;
  }
  const rows=GXI.length,have=GXI.filter(x=>gxOwn(x[0])).length,pityLeft=Math.max(0,10-(inf.pity||0)-0);
  const paint=()=>{
    const byR=[1,2,3,4,5,6].map(r=>({r,L:GXI.filter(x=>x[1]===r)}));
    box.innerHTML=`<div class="card pad col gxm"><div class="gxst"><span>🎟 Билетов <b id="gx_t">${inf.tickets}</b></span><span>🪙 Монет <b>${inf.coins}</b></span></div>
     ${gxMachine()}
     <button class="btn" id="gx_pull" ${inf.tickets>0?'':'disabled'}>${inf.tickets>0?'Крутить ручку · 1 🎟':'Нет билетов'}</button>
     <div class="muted" style="text-align:center">Гарантия редкого или выше: через <b>${Math.max(1,10-(inf.pity||0))}</b> ${((x)=>x%10===1&&x!==11?'крутку':x%10>=2&&x%10<=4&&(x<12||x>14)?'крутки':'круток')(Math.max(1,10-(inf.pity||0)))}.</div></div>
    <div class="card pad col"><b>Как получить билеты</b><div class="muted">Один билет за каждое полученное достижение и по одному за каждые полчаса доработки или переработки. Билеты за всё, что уже есть, засчитаны сами.</div></div>
    <div class="card pad col"><b>Шансы</b><div class="gxodds">${byR.map(({r,L})=>`<div class="otr"><span><i class="gxdot" style="background:${gxRc(r)}"></i> ${GX_R[r][0]}</span><span><b>${gxPct(r)}</b> · ${L.filter(x=>gxOwn(x[0])).length}/${L.length}</span></div>`).join('')}</div><div class="muted">Дубль превращается в монеты (обычная +1, редкая +2, эпическая +5, мифическая +10, легендарная +25, тайна +100). На монеты можно обменять любую вещь, которой нет в коллекции, кроме «Тайны хранителя».</div></div>
    <div class="card pad col"><b>Коллекция · ${have} из ${rows}</b><div class="muted">Нажми на вещь, которая у тебя есть, чтобы надеть. Нет вещи: нажми, чтобы обменять на монеты, если хватает.</div></div>
    ${byR.map(({r,L})=>`<details class="area gmg" ${r<=2?'open':''}><summary class="ah" style="background:var(--tab)"><span class="ahn"><i class="gxdot" style="background:${gxRc(r)}"></i> ${GX_R[r][0]}</span><span class="pill" style="background:#FFFDF9;align-self:center">${L.filter(x=>gxOwn(x[0])).length} / ${L.length}</span></summary><div class="gops" style="padding:8px">${L.map(([id,,k,n])=>{const ow=gxOwn(id),secret=r===6;return `<button class="gop gxit${ow?'':' lk'}" data-i="${id}"><span class="gopv">${ow?gxPrev(id,78):'<span style="font-size:30px;opacity:.5">?</span>'}</span><span class="gopn">${ow||!secret?esc(n):'???'}</span>${ow?'':`<span class="gopl">${secret?'только из автомата':'🪙 '+GX_PRICE[r]}</span>`}</button>`}).join('')}</div></details>`).join('')}`;
    const m=box.querySelector('#gx_m');
    box.querySelector('#gx_pull').onclick=()=>pull();
    box.querySelectorAll('.gxit').forEach(b=>b.onclick=async()=>{
      const id=b.dataset.i,it=GX_BY[id];
      if(gxOwn(id)){if(await gxWear(id))toast('Надето ✨',1500);return}
      if(it.r===6)return toast('Это можно только выиграть в автомате',2600);
      const pr=GX_PRICE[it.r];if(inf.coins<pr)return toast(`Нужно ${pr} 🪙, у тебя ${inf.coins}`,2800);
      if(!confirm(`Обменять ${pr} монет на «${it.n}»?`))return;
      const r=await sb.rpc('gacha_buy',{p_code:id});if(r.error)return toast(r.error.message,3200);
      inf=r.data;await gmLoad(true);toast('Обменено ✨',1800);dwParty();paint();
    });
  };
  const pull=async()=>{
    if(window._gxBusy)return;window._gxBusy=1;try{await pull1()}finally{setTimeout(()=>{window._gxBusy=0},400)}
  };
  const pull1=async()=>{
    const btn=box.querySelector('#gx_pull'),m=box.querySelector('#gx_m');btn.disabled=true;m&&m.classList.add('spin');
    const [r]=await Promise.all([sb.rpc('gacha_pull'),new Promise(res=>setTimeout(res,1400))]);
    m&&m.classList.remove('spin');
    if(r.error){toast(r.error.message,3500);paint();return}
    const d=r.data;inf={...inf,tickets:d.tickets,coins:d.coins,pity:d.pity};
    await gmLoad(true);paint();
    gxReveal(d,again=>{if(again)setTimeout(()=>{const b=document.querySelector('#gx_pull');b&&!b.disabled&&b.click()},200);else paint()});
  };
  paint();
}
