// Автомат с шариками (как корейские капсульные автоматы): предметы, шансы, экран.
// Предметы выпадают из шариков. Билет: по одному за каждое достижение и за каждые полчаса доработки/переработки (считает база).
// Список GXI — единственный источник: по нему база (gacha_items) и приложение. Если меняешь, пересобери SQL (см. supabase/migration_2026-11-11_gacha.sql).

// редкости: название, цвет, шанс (%)
const GX_R=[null,['Обычная','#9FB68C',50],['Редкая','#6AA9E0',32],['Эпическая','#A57BE8',12],['Мифическая','#F26B4E',4],['Легендарная','#F0B429',1.9],['Тайна хранителя','conic-gradient(#FF5E7E,#FFB347,#4FC98F,#52A7FF,#B07CFF,#FF5E7E)',0.1]];
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
// меню вещи: надеть или подарить коллеге (вещь переходит к нему, у тебя её не остаётся)
async function gxItemMenu(id,after){
  await ensurePeople();
  const it=GX_BY[id];
  dgxSheet(esc(it.n),(box,paint,close)=>{
    const people=(S.dg.people||[]).filter(p=>p.id!==S.me.id).slice().sort((a,b)=>String(a.full_name).localeCompare(String(b.full_name),'ru'));
    box.innerHTML=`<div style="text-align:center">${gxPrev(id,130)}</div>
    <button class="btn" id="gi_wear">✨ Надеть</button>
    <div class="card pad col"><b>🎁 Подарить коллеге</b><div class="muted">Вещь перейдёт к нему, а у тебя её больше не будет. Если у коллеги такая уже есть, подарить не получится.</div>
    <select id="gi_to" aria-label="Кому"><option value="">— выбери —</option>${people.map(p=>`<option value="${p.id}">${esc(p.full_name)}</option>`).join('')}</select>
    <button class="btn ghost" id="gi_give">Подарить</button><div class="err" id="gi_er"></div></div>`;
    box.querySelector('#gi_wear').onclick=async()=>{if(await gxWear(id)){close(false);toast('Надето ✨',1500)}};
    box.querySelector('#gi_give').onclick=async e=>{
      const to=box.querySelector('#gi_to').value,er=box.querySelector('#gi_er');
      if(!to)return er.textContent='Выбери, кому подарить';
      const who=box.querySelector('#gi_to').selectedOptions[0].textContent;
      if(!confirm(`Подарить «${it.n}»: ${who}? У тебя этой вещи не останется.`))return;
      e.target.disabled=true;er.textContent='';
      const r=await sb.rpc('gacha_gift_item',{p_to:to,p_code:id,p_req:gxReq()});
      if(r.error){e.target.disabled=false;return er.textContent=r.error.message}
      close(false);toast(`Подарено: ${who} 🎁`,2600);
      try{await gmLoad(true)}catch(x){}
      after&&after();
    };
  },()=>{});
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
const gxReq=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
const GX_DAY=[['🎟','1'],['🎟','1'],['🎟','2'],['🎟','2'],['🎟','3'],['🎟','3'],['🏅','золотой']];
// шарик падает сразу при нажатии, запрос идёт параллельно; карточка открывается, когда доиграла анимация и пришёл ответ
function gxSpin(fetchRes,onData,onClose){
  const ov=document.createElement('div');ov.className='gxov';
  ov.innerHTML=`<div class="gxcap" style="--gc:#B9A8E8"><div class="gxt"></div><div class="gxbm"></div></div><div class="gxres"></div>`;
  document.body.appendChild(ov);
  const t0=Date.now();
  return fetchRes().then(async d=>{
    const left=1750-(Date.now()-t0);if(left>0)await new Promise(r=>setTimeout(r,left));
    const it=GX_BY[d.code]||{id:d.code,r:d.rarity,k:'bg',n:d.code},r=d.rarity,col=gxRc(r),big=r>=5;
    const nextG=d.gold&&d.gold_left>0,nextN=!d.gold&&d.tickets>0||d.gold&&d.gold_left<=0&&d.tickets>0;
    const res=ov.querySelector('.gxres');res.className='gxres r'+r;res.style.setProperty('--rc',/^#/.test(col)?col:'#B07CFF');
    res.innerHTML=`${d.gold?'<div class="gxgl">🏅 Золотая крутка</div>':''}<div class="gxrar" style="${r===6?'background:'+col+';-webkit-background-clip:text;background-clip:text;color:transparent':'color:'+col}">${GX_R[r][0]}</div><div class="gxpv">${gxPrev(it.id,150)}</div><b class="gxn">${esc(it.n)}</b><div class="muted">${GX_KIND[it.k]||''}</div>
     <div class="gxdup">${d.dup?`Уже есть.${d.gain>0?` Возвращаем <b>+${d.gain} 🎟</b>`:''}`:'✨ Новое в коллекции!'}</div>
     <div class="gxbt">${d.dup?'':`<button class="btn" data-w>Надеть</button>`}${nextG?`<button class="btn ghost" data-a="g">Ещё золотая · осталось ${d.gold_left} 🏅</button>`:''}${nextN?`<button class="btn ghost" data-a="n">Ещё раз · осталось ${d.tickets} 🎟</button>`:''}<button class="btn ghost" data-x>Закрыть</button></div>`;
    ov.querySelector('.gxcap').remove();
    onData&&onData(d);
    ov.classList.add('open');if(r>=3)dwParty();if(big){setTimeout(dwParty,500);setTimeout(dwParty,1000)}
    const done=()=>ov.remove();
    ov.querySelector('[data-x]').onclick=()=>{done();onClose&&onClose(null)};
    ov.querySelectorAll('[data-a]').forEach(a=>a.onclick=()=>{done();onClose&&onClose(a.dataset.a)});
    const w=ov.querySelector('[data-w]');if(w)w.onclick=async()=>{w.disabled=true;if(await gxWear(it.id)){w.textContent='Надето ✓'}else w.disabled=false};
  }).catch(e=>{ov.remove();toast((e&&e.message)||'Не получилось, попробуй ещё раз',3500);onClose&&onClose(null)});
}
const gxCells=(streak,claimed)=>{
  const lastPos=streak>0?((streak-1)%7)+1:0,nextPos=streak>0?(lastPos%7)+1:1;
  const doneTo=claimed?lastPos:(nextPos===1?0:nextPos-1);
  return `<div class="gxdays">${GX_DAY.map(([ic,t],i)=>{const n=i+1,dn=n<=doneTo,td=!claimed&&n===nextPos;return `<div class="gxd${dn?' dn':''}${td?' td':''}${n===7?' g7':''}"><small>День ${n}</small><span>${dn?'✓':ic}</span><b>${t==='золотой'?'🏅':'+'+t}</b></div>`}).join('')}</div>`;
};
async function gxDaily(){
  if(window._gxDay)return;window._gxDay=1;
  try{
    const r=await sb.rpc('gacha_daily_claim');if(r.error||!r.data||!r.data.claimed)return;
    const d=r.data,ov=document.createElement('div');ov.className='gxov open gxdaily';
    ov.innerHTML=`<div class="gxres" style="--rc:#F0B429;opacity:1;transform:none"><div class="gxrar" style="color:#C9871A">Ежедневная награда</div><b class="gxn">День ${d.pos} из 7 · серия ${d.streak}</b>${gxCells(d.streak,true)}
      <div class="gxdup">Тебе: <b>+${d.tickets_gain} 🎟</b>${d.gold_gain?` и <b>🏅 золотой билет</b>: повышенный шанс на легендарную вещь`:''}</div>
      <div class="muted">${d.pos===7?'Неделя подряд! Золотой билет ждёт в автомате.':'Заходи каждый день: на 7-й день серии будет золотой билет. Пропустишь день, серия начнётся заново.'}</div>
      <div class="gxbt"><button class="btn" data-g>К автомату 🎰</button><button class="btn ghost" data-x>Закрыть</button></div></div>`;
    document.body.appendChild(ov);dwParty();
    ov.querySelector('[data-x]').onclick=()=>ov.remove();
    ov.querySelector('[data-g]').onclick=()=>{ov.remove();S.gmTab='gx';go('game')};
    gxS.info=null;
  }catch(e){}
}
{const sa=startApp;startApp=function(){const x=sa.apply(this,arguments);setTimeout(gxDaily,2500);return x}}
async function gmGachaTab(box){
  box.innerHTML='<div class="muted" style="padding:14px">Загружаю автомат…</div>';
  let inf;try{inf=await gxInfo()}catch(e){
    box.innerHTML=`<div class="card pad col"><b>Автомат ещё не подключён 🎰</b><div class="muted">${/does not exist|function|schema|gacha/i.test(String(e.message||e))?'В базе нужно один раз запустить обновление. Админ знает.':esc(e.message||e)}</div></div>`;return;
  }
  try{if(typeof ensurePeople==='function')await ensurePeople()}catch(e){}
  const rows=GXI.length,have=GXI.filter(x=>gxOwn(x[0])).length;
  const paint=()=>{
    const byR=[1,2,3,4,5,6].map(r=>({r,L:GXI.filter(x=>x[1]===r)}));
    const left=Math.max(1,10-(inf.pity||0));
    box.innerHTML=`<div class="card pad col gxm"><div class="gxst"><span>🎟 Билетов <b id="gx_t">${inf.tickets}</b></span><span>🏅 Золотых <b>${inf.gold||0}</b></span></div>
     ${gxMachine()}
     <button class="btn" id="gx_pull" ${inf.tickets>0?'':'disabled'}>${inf.tickets>0?'Крутить ручку · 1 🎟':'Нет билетов'}</button>
     ${(inf.gold||0)>0?`<button class="btn gxgold" id="gx_gold">🏅 Золотая крутка · 1 🏅</button><div class="muted" style="text-align:center">Золотая: эпическая 45%, мифическая 30%, легендарная 24%, тайна 1%.</div>`:''}
     <div class="muted" style="text-align:center">Гарантия редкого или выше: через <b>${left}</b> ${((x)=>x%10===1&&x!==11?'крутку':x%10>=2&&x%10<=4&&(x<12||x>14)?'крутки':'круток')(left)}.</div></div>
    <div class="card pad col"><b>Ежедневная награда</b>${gxCells(inf.streak||0,inf.claimed)}<div class="muted">${inf.claimed?'Сегодняшняя награда получена. Приходи завтра!':'Заходи в приложение каждый день и получай билеты.'} На 7-й день подряд будет золотой билет. Пропустишь день: серия начнётся заново.${inf.streak?` Сейчас серия: <b>${inf.streak}</b>.`:''}</div></div>
    <div class="card pad col"><b>Передать билеты коллеге</b><div class="muted">Можно подарить свои билеты для круток. Золотые не передаются.</div>
     <select id="gx_to"><option value="">— кому —</option>${(S.dg&&S.dg.people||[]).filter(p=>p.id!==S.me.id).slice().sort((a,b)=>String(a.full_name).localeCompare(String(b.full_name),'ru')).map(p=>`<option value="${p.id}">${esc(p.full_name)}</option>`).join('')}</select>
     <div class="two"><input id="gx_n" type="number" min="1" max="${Math.max(1,inf.tickets)}" value="1" inputmode="numeric" aria-label="Сколько билетов"><button class="btn" id="gx_give" ${inf.tickets>0?'':'disabled'}>Передать</button></div><div class="err" id="gx_ge"></div>
     ${(inf.gifts&&inf.gifts.length)?`<div class="muted">${inf.gifts.map(g=>g.in?`🎁 ${esc(g.from||'Коллега')} передал(а) тебе ${g.n} 🎟`:`➡️ Ты передал(а) ${esc(g.to||'коллеге')} ${g.n} 🎟`).join('<br>')}</div>`:''}</div>
    ${(inf.recent&&inf.recent.length)?`<div class="card pad col"><b>Последние выпадения</b><div class="gxrec">${inf.recent.map(x=>`<div class="gxrc" title="${esc((GX_BY[x.code]||{}).n||'')}"><i class="gxdot" style="background:${gxRc(x.rarity)}"></i><span>${gxPrev(x.code,46)}</span>${x.dup?'<small>дубль</small>':''}${x.gold?'<small>🏅</small>':''}</div>`).join('')}</div></div>`:''}
    <div class="card pad col"><b>Как получить билеты</b><div class="muted">Один билет за каждое полученное достижение и по одному за каждые полчаса доработки или переработки. Ещё билеты дают ежедневные награды. Билеты за всё, что уже есть, засчитаны сами.</div></div>
    <div class="card pad col"><b>Шансы</b><div class="gxodds">${byR.map(({r,L})=>`<div class="otr"><span><i class="gxdot" style="background:${gxRc(r)}"></i> ${GX_R[r][0]}</span><span><b>${gxPct(r)}</b> · ${L.filter(x=>gxOwn(x[0])).length}/${L.length}</span></div>`).join('')}</div><div class="muted">Если выпал дубль, часть билетов возвращается: редкая и эпическая +1, мифическая +2, легендарная +3, тайна +5. Обычные дубли ничего не возвращают.</div></div>
    <div class="card pad col"><b>Коллекция · ${have} из ${rows}</b><div class="muted">Нажми на вещь, которая у тебя есть, чтобы надеть или подарить коллеге.</div></div>
    ${byR.map(({r,L})=>`<details class="area gmg" ${r<=2?'open':''}><summary class="ah" style="background:var(--tab)"><span class="ahn"><i class="gxdot" style="background:${gxRc(r)}"></i> ${GX_R[r][0]}</span><span class="pill" style="background:#FFFDF9;align-self:center">${L.filter(x=>gxOwn(x[0])).length} / ${L.length}</span></summary><div class="gops" style="padding:8px">${L.map(([id,,k,n])=>{const ow=gxOwn(id),secret=r===6;return `<button class="gop gxit${ow?'':' lk'}" data-i="${id}"><span class="gopv">${ow?gxPrev(id,78):'<span style="font-size:30px;opacity:.5">?</span>'}</span><span class="gopn">${ow||!secret?esc(n):'???'}</span>${ow?'':'<span class="gopl">пока нет</span>'}</button>`}).join('')}</div></details>`).join('')}`;
    box.querySelector('#gx_pull').onclick=()=>pull(false);
    const gv=box.querySelector('#gx_give');
    if(gv)gv.onclick=async()=>{
      const to=box.querySelector('#gx_to').value,n=parseInt(box.querySelector('#gx_n').value,10),er=box.querySelector('#gx_ge');
      if(!to)return er.textContent='Выбери, кому передать';
      if(!(n>=1))return er.textContent='Укажи число билетов';
      if(n>inf.tickets)return er.textContent='У тебя только '+inf.tickets;
      const who=box.querySelector('#gx_to').selectedOptions[0].textContent;
      if(!confirm(`Передать ${n} билетов: ${who}?`))return;
      gv.disabled=true;er.textContent='';
      const r=await sb.rpc('gacha_gift',{p_to:to,p_n:n,p_req:gxReq()});
      if(r.error){gv.disabled=false;return er.textContent=r.error.message}
      toast(`Передано ${n} 🎟: ${who}`,2600);
      try{inf=await gxInfo()}catch(e){inf={...inf,tickets:r.data.tickets}}
      const hd=document.getElementById('gx_hdr');if(hd)hd.textContent=inf.tickets;paint();
    };
    const g=box.querySelector('#gx_gold');if(g)g.onclick=()=>pull(true);
    box.querySelectorAll('.gxit').forEach(b=>b.onclick=async()=>{
      const id=b.dataset.i;
      if(gxOwn(id)){gxItemMenu(id,()=>{if(box.isConnected)paint()});return}
      toast('Этой вещи пока нет в коллекции. Выбей её в автомате!',2600);
    });
  };
  // крутка: один клик = один номер запроса; повтор того же запроса база не списывает
  const pull=gold=>{
    if(window._gxBusy)return;window._gxBusy=1;
    const req=gxReq();
    gxSpin(async()=>{
      const call=()=>sb.rpc('gacha_pull',{p_req:req,p_gold:!!gold});
      let r=await call();
      if(r.error&&/fetch|network|load failed|timeout/i.test(r.error.message||''))r=await call();
      if(r.error&&/could not find|does not exist|PGRST202/i.test(r.error.message||r.error.code||'')&&!gold)r=await sb.rpc('gacha_pull'); // база ещё на старой версии: работаем по-старому
      if(r.error)throw r.error;return r.data;
    },d=>{
      inf={...inf,tickets:d.tickets,pity:d.pity,gold:d.gold_left!=null?d.gold_left:inf.gold,recent:[{code:d.code,rarity:d.rarity,dup:d.dup,gold:d.gold},...(inf.recent||[])].slice(0,8)};
      if(box.isConnected)paint();
      const hd=document.getElementById('gx_hdr');if(hd)hd.textContent=d.tickets;
      gmLoad(true).then(()=>{if(box.isConnected&&!window._gxBusy)paint()}).catch(()=>{});
    },again=>{
      window._gxBusy=0;
      if(box.isConnected)paint();
      if(again)setTimeout(()=>pull(again==='g'),150);
    });
  };
  paint();
}

// ---------- ежедневные задания: 5 штук, за все — 4 билета ----------
const DQ_LIST=[['chk','✅','Заполни чек-лист','Отметь хотя бы один пункт в чек-листе смены'],['ck','☀️','Отметься на смене','Нажми «Я на смене» (в выходной засчитывается сам)'],['rot','🔄','Загляни в ротацию','Открой вкладку «Ротации»'],['thx','💛','Скажи спасибо коллеге','Отправь благодарность в «Спасибо»'],['pet','🐾','Навести питомца','Открой свой профиль и поздоровайся с питомцем']];
const DQ_REST=[['wtodo','📝','Запиши заметку','Добавь дело или мысль в «Мой блокнот»','todo'],['whab','🌱','Отметь привычку','Отметь любую привычку в блокноте или заведи новую','todo'],['wphoto','🌿','Выйди на природу','Сфотографируй что-нибудь красивое на улице и отправь фото. Игорь проверит'],['thx','💛','Скажи спасибо коллеге','Отправь благодарность в «Спасибо»','thanks'],['pet','🐾','Навести питомца','Открой свой профиль и поздоровайся с питомцем']];
function dqPing(c){const k='dq:'+(S.me?S.me.id:'')+':'+c+':'+new Date().toDateString();try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){}
  const retry=()=>{try{sessionStorage.removeItem(k)}catch(e){}};
  sb.rpc('dq_ping',{p_code:c}).then(r=>{if(r.error)return retry();if(window._dqS)window._dqS.done=[...new Set((window._dqS.done||[]).concat([c]))];dqFill(true)},retry)}
// статус грузится параллельно с экраном «Сегодня» и кладётся в кэш, чтобы карточка появлялась сразу
function dqKey(){return 'dw:dq:'+(S.me?S.me.id:'')}
function dqPre(){if(!S.me)return;window._dqP=Promise.resolve(sb.rpc('dq_status')).then(r=>r,e=>({error:e}))}
function dqCache(){try{const j=JSON.parse(localStorage.getItem(dqKey())||'null');return j&&j.d===iso(new Date())?j.s:null}catch(e){return null}}
function dqHtml(s){
  if(!s)return '<div class="card pad col dqc"><div style="display:flex;align-items:center;gap:8px"><b style="flex:1">🎯 Задания дня</b><span class="pill" style="background:#F6E3B0;color:#3B2A35">…</span></div><div class="pgb"><div class="pg" style="width:0"></div></div><div class="muted">Загружаю…</div></div>';
  const rest=s.mode==='rest',L=rest?DQ_REST:DQ_LIST,dn=new Set(s.done||[]),n=L.filter(x=>dn.has(x[0])).length,ph=s.photo;
  const row=x=>{const ok=dn.has(x[0]);let act='';
    if(x[0]==='wphoto'&&!ok){act=ph==='pending'?'<div class="muted">⏳ Фото на проверке у Игоря</div>':`${ph==='rejected'?'<div class="muted">❌ Фото не подошло. Пришли другое</div>':''}<button class="btn gh dq_ph" type="button">📷 Отправить фото</button>`}
    else if(x[4]&&!ok)act=`<button class="btn gh dq_go" data-go="${x[4]}" type="button" style="padding:6px 12px">Открыть</button>`;
    return `<div class="dqr${ok?' ok':''}"><span class="dqi">${ok?'✅':x[1]}</span><div style="flex:1;min-width:0"><b>${x[2]}</b><div class="muted">${x[3]}</div>${act}</div></div>`};
  const pend=(s.pend||[]).length?`<div class="col" style="gap:8px"><b>📸 Фото на проверке (${s.pend.length})</b>${s.pend.map(p=>`<div class="dqr"><img class="dqp" data-p="${esc(p.path)}" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:12px;background:#0002"><div style="flex:1"><b>${esc(p.name||'Сотрудник')}</b><div style="display:flex;gap:6px;margin-top:6px"><button class="btn dq_rv" data-id="${p.id}" data-ok="1" type="button" style="padding:6px 12px">✅ Принять</button><button class="btn gh dq_rv" data-id="${p.id}" data-ok="0" type="button" style="padding:6px 12px">❌ Нет</button></div></div></div>`).join('')}</div>`:'';
  return `<div class="card pad col dqc"><div style="display:flex;align-items:center;gap:8px"><b style="flex:1">${rest?'🌿 Задания выходного':'🎯 Задания дня'}</b><span class="pill" style="background:#F6E3B0;color:#3B2A35">${n} из 5</span></div>
    ${rest?'<div class="muted">Сегодня нужно работать над собой, а не над парком 💛</div>':''}
    <div class="pgb"><div class="pg" style="width:${n*20}%"></div></div>${L.map(row).join('')}
    ${s.claimed?'<div class="muted">🎟 Награда за сегодня получена. Завтра будут новые задания.</div>':n===5?'<button class="btn" id="dq_claim" type="button">🎟 Забрать 4 билета</button>':'<div class="muted">Выполни все пять и получи 4 билета на крутку.</div>'}${pend}</div>`;
}
function dqBoxHtml(){return dqHtml(dqCache())}
function dqWire(box){
  box.querySelectorAll('.dq_go').forEach(b=>b.onclick=()=>{try{go(b.dataset.go)}catch(e){}});
  const f=document.createElement('input');f.type='file';f.accept='image/*';f.style.display='none';box.appendChild(f);
  const pb=box.querySelector('.dq_ph');if(pb){pb.onclick=()=>f.click();f.onchange=async()=>{const file=f.files&&f.files[0];if(!file)return;pb.disabled=true;pb.textContent='Отправляю…';
    try{const sm=window.dgxShrink?await dgxShrink(file,1280):file,path=S.me.id+'/'+iso(new Date())+'-'+Date.now()+'.jpg';
      const up=await sb.storage.from('dqp').upload(path,sm,{contentType:'image/jpeg'});if(up.error)throw up.error;
      const r=await sb.rpc('dq_photo_submit',{p_path:path});if(r.error)throw r.error;toast('Фото отправлено на проверку 📸',2400);dqFill(true)}
    catch(e){pb.disabled=false;pb.textContent='📷 Отправить фото';alert(e.message||'Не получилось отправить фото')}}}
  const cb=box.querySelector('#dq_claim');if(cb)cb.onclick=async()=>{cb.disabled=true;const c=await sb.rpc('dq_claim');if(c.error){cb.disabled=false;return alert(c.error.message)}
    try{dwParty()}catch(e){}toast('+4 билета 🎟',2200);gxS&&(gxS.info=null);dqFill(true)};
  box.querySelectorAll('.dqp').forEach(async im=>{const r=await sb.storage.from('dqp').createSignedUrl(im.dataset.p,3600);if(!r.error)im.src=r.data.signedUrl;im.onclick=()=>{if(im.src)window.open(im.src,'_blank')}});
  box.querySelectorAll('.dq_rv').forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await sb.rpc('dq_photo_review',{p_id:+b.dataset.id,p_ok:b.dataset.ok==='1'});if(r.error){b.disabled=false;return alert(r.error.message)}toast(b.dataset.ok==='1'?'Принято ✅':'Отклонено',1600);dqFill(true)});
}
async function dqFill(fresh){
  const box=document.getElementById('dqbox');if(!box)return;
  try{
    let r=!fresh&&window._dqP?await window._dqP:await sb.rpc('dq_status');window._dqP=null;
    if(r.error||!r.data){await new Promise(z=>setTimeout(z,800));r=await sb.rpc('dq_status')}
    const bx=document.getElementById('dqbox');if(!bx)return;
    if(r.error||!r.data){if(!dqCache())bx.innerHTML='<div class="card pad col dqc"><b>🎯 Задания дня</b><div class="muted">Не загрузилось. Потяни вниз, чтобы обновить.</div></div>';return}
    window._dqS=r.data;try{localStorage.setItem(dqKey(),JSON.stringify({d:iso(new Date()),s:r.data}))}catch(e){}
    bx.innerHTML=dqHtml(r.data);dqWire(bx);
  }catch(e){}
}
