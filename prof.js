// Профили коллег: их видит любой сотрудник. Допуски, обучения и особые значки выставлены отдельными значками (витрина).
const GM_ADMN=l=>String(l||'').replace(/^Допущен:\s*/,'');
const GM_TIC=[[/верёв|верев/i,'🧗'],[/данделион|эвакуац/i,'🌼'],[/джип/i,'🚙'],[/карусел/i,'🎠'],[/квест/i,'🧩'],[/кон-?тик/i,'🌴'],[/плющ/i,'🌿'],[/робот/i,'🤖'],[/шахт/i,'⛏️'],[/гольф/i,'⛳'],[/золот/i,'🪙'],[/боулинг/i,'🎳'],[/спас|матрос|верхолаз/i,'🛟'],[/электро/i,'⚡'],[/касс/i,'💳'],[/альфа/i,'🐺']];
const gmTrophy=d=>{
  const nm=GM_ADMN(d.n),parts=nm.split(/\s*[·•]\s*/),main=parts[0],sub=parts[1]||'',ic=(GM_TIC.find(x=>x[0].test(nm))||[0,'🏆'])[1];
  const hero=/герой|мастер/i.test(sub);
  return `<div class="trf${hero?' hero':''}" title="${esc(d.d||d.n)}"><div class="trc"><svg viewBox="0 0 64 70" aria-hidden="true"><defs><linearGradient id="tg${hero?'h':'n'}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hero?'#FFE27A':'#FFD75A'}"/><stop offset="1" stop-color="${hero?'#E8962A':'#E0A02F'}"/></linearGradient></defs><path d="M14 10C4 10 3 28 15 32M50 10C60 10 61 28 49 32" fill="none" stroke="#C98A1E" stroke-width="4" stroke-linecap="round"/><path d="M13 6H51V26C51 38 42 45 32 45C22 45 13 38 13 26Z" fill="url(#tg${hero?'h':'n'})" stroke="#B9791A" stroke-width="2.5" stroke-linejoin="round"/><rect x="28" y="44" width="8" height="10" fill="#D9962B"/><path d="M18 62Q18 54 32 54Q46 54 46 62Z" fill="#C98A1E"/><rect x="16" y="60" width="32" height="7" rx="3" fill="#8A5A18"/></svg><span class="tri">${ic}</span></div><b>${esc(main)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
};
function gmShelf(row,opt={}){
  const ach=(row.ach||[]).filter(a=>!String(a.c).startsWith('gx:'));
  const adm=ach.filter(a=>a.c.startsWith('adm:')).map(a=>gmDef(a)).sort((a,b)=>String(a.n).localeCompare(String(b.n),'ru'));
  const oth=ach.filter(a=>/^(trn|spec|evt):/.test(a.c)).map(a=>gmDef(a));
  const chip=(d,cls)=>`<span class="bdg ${cls}" title="${esc(d.d||d.n)}"><i>${gmIc(d.ic,18)}</i><b>${esc(d.n)}</b></span>`;
  let h='';
  h+=`<div class="shelf"><div class="shl">🏆 Допуски${adm.length?` · ${adm.length}`:''}</div>${adm.length?`<div class="trofs">${adm.map(gmTrophy).join('')}</div>`:`<div class="muted">${opt.own?'Допуски к аттракционам выдаёт руководитель, они появятся здесь кубками':'Допусков пока нет'}</div>`}</div>`;
  if(oth.length)h+=`<div class="shelf"><div class="shl">🎓 Обучения и особые значки · ${oth.length}</div><div class="bdgs">${oth.map(d=>chip(d,/^trn:/.test(d.c)?'trn':'spc')).join('')}</div></div>`;
  return h;
}
// благодарности коллег
const gmThanksBlock=id=>{setTimeout(gmFillThanks,0);return `<div class="card pad col gthx" data-thx="${id}"><b>💛 Благодарности</b><div class="muted">Загружаю…</div></div>`};
async function gmFillThanks(){
  for(const el of document.querySelectorAll('[data-thx]:not([data-done])')){
    el.dataset.done=1;const id=el.dataset.thx;
    const r=await sb.from('thanks').select('id,sticker,body,from_user,created_at').eq('to_user',id).order('created_at',{ascending:false}).limit(30);
    if(r.error){el.innerHTML='<b>💛 Благодарности</b><div class="muted">Пока не получилось загрузить</div>';continue}
    const L=r.data||[],nm=u=>{const p=S.gm&&S.gm.by[u];return p?esc(shortName(p.full_name||'')):'Коллега'};
    el.innerHTML=`<b>💛 Благодарности${L.length?` · ${L.length}`:''}</b>`+(L.length?L.slice(0,6).map(x=>`<div class="shc"><span>${x.sticker||'💛'} <b>${nm(x.from_user)}</b></span><div>${esc(x.body)}</div></div>`).join('')+(L.length>6?`<div class="muted">и ещё ${L.length-6}</div>`:''):'<div class="muted">Пока никто не сказал спасибо. Скажи первым ты, и тебе скажут</div>');
  }
}
function gmProfile(id){
  const row=S.gm&&S.gm.by[id];if(!row)return toast('Профиль не нашёлся',2200);
  const L=gmLv(row.xp);
  const real=(row.ach||[]).filter(a=>gmReal(a)&&!/^(adm|trn|spec|evt):/.test(a.c)).map(a=>gmDef(a));
  dgxSheet(esc(row.full_name||'Профиль'),(box)=>{
    const pet=typeof petCfg==='function'&&petCfg(row);
    box.innerHTML=`<div class="card gmh"><div class="gmhr"><div class="gmav">${av(row,84)}</div><div style="flex:1;min-width:0"><div class="gmn">${gmName(row.full_name||'',row,{lv:false})}</div>${gmTitleHtml(row)}
      <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">${gmLvChip(row,true)}${row.lvl_text?'':`<span><b>${esc(GM_RANKS[L.r].full)}</b><br><span class="muted">Уровень ${L.n} из 50</span></span>`}</div></div></div>
      ${gmStage(row,190)}
      <div class="gmcnt"><span>🏅 Достижений: <b>${gmRealN(row)}</b></span><span>⭐ Очков: <b>${row.xp}</b></span></div>
      ${gmAbout(row,false)}</div>
    <div class="card pad shelfc">${gmShelf(row)}</div>${gmThanksBlock(row.id)}
    ${real.length?`<div class="shelf"><div class="shl">🏅 Достижения · ${real.length}</div><div class="bdgs">${real.map(d=>`<span class="bdg" title="${esc(d.d||'')}"><i>${gmIc(d.ic,18)}</i><b>${esc(d.n)}</b></span>`).join('')}</div></div>`:''}`;
  },()=>{});
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pid]');if(!b||e.target.closest('.gtip,button:not(.tmr),a,label,select,input,textarea,.avcam'))return;if(b.closest('.dgxs,.dgx-sheet')&&b.classList.contains('gmav'))return;if(S.gm&&S.gm.by[b.dataset.pid])gmProfile(b.dataset.pid)});
function gmTeamTab(box){
  const rows=(S.gm.rows||[]).filter(r=>r.full_name&&r.full_name!=='Тест Системы').slice().sort((a,b)=>String(a.full_name).localeCompare(String(b.full_name),'ru'));
  const paint=q=>{
    const k=q.trim().toLowerCase(),L=rows.filter(r=>!k||String(r.full_name).toLowerCase().includes(k));
    box.querySelector('#tm_l').innerHTML=L.map(r=>{
      const a=(r.ach||[]),na=a.filter(x=>x.c.startsWith('adm:')).length,nt=a.filter(x=>/^(trn|spec):/.test(x.c)).length;
      return `<button class="card pad tmr" data-pid="${r.id}"><span>${av(r,44)}</span><span class="tmn">${gmName(r.full_name,r)}<span class="muted">${na?`🎟️ ${na}`:''}${na&&nt?' · ':''}${nt?`🎓 ${nt}`:''}${!na&&!nt?'Значков пока нет':''}</span></span></button>`}).join('')||'<div class="card pad muted">Никого не нашлось</div>';
  };
  box.innerHTML=`<div class="muted" style="margin:2px 2px 8px">Нажми на коллегу: увидишь его уровень, питомца, допуски и значки.</div><input type="search" id="tm_s" placeholder="🔍 Найти коллегу" autocomplete="off"><div id="tm_l" class="col" style="gap:8px;margin-top:8px"></div>`;
  paint('');box.querySelector('#tm_s').oninput=e=>paint(e.target.value);
}

// ---- живые сцены за питомцем: по теме фона ----
// [символ, x%, y%, размер px, анимация, секунд, задержка, глубина параллакса]
const SC_SPACE=[['✨',8,12,16,'tw',3,0,.3],['⭐',24,28,12,'tw',2.4,.8,.3],['✨',72,10,18,'tw',3.4,.4,.3],['⭐',88,30,12,'tw',2.8,1.2,.3],['✨',50,8,12,'tw',2.2,.2,.3],['🪐',14,46,46,'fl',7,0,1],['🌍',80,52,36,'fl',8,1,.8],['🌙',64,12,30,'fl',9,.5,.6],['🚀',40,20,26,'dr',16,0,.5],['☄️',30,6,22,'dr',11,3,.4]];
const SC_NATURE=[['☁️',10,10,44,'dr',34,0,.3],['☁️',55,18,34,'dr',42,8,.3],['🌲',3,60,56,'sw',5,0,.7],['🌳',84,58,60,'sw',6,1,.7],['🌲',16,66,40,'sw',4.5,.5,.8],['🍄',74,80,22,'sw',3,0,1],['🦋',22,34,20,'fl',4,0,1.2],['🐦',60,22,20,'dr',18,2,.6],['🌼',90,82,20,'sw',3.5,.7,1],['🌸',8,84,20,'sw',3.8,.2,1]];
const SC_FOREST=[['🌲',2,52,70,'sw',6,0,.7],['🌲',86,50,74,'sw',5,.8,.7],['🌳',16,64,52,'sw',5.5,.4,.8],['🌳',72,66,50,'sw',6,1.4,.8],['🍂',30,0,18,'fa',9,0,1],['🍁',60,0,18,'fa',11,3,1],['🍂',80,0,16,'fa',10,6,1],['🦉',10,28,26,'fl',5,0,.9],['🍄',44,84,22,'sw',3,0,1],['🦌',88,76,30,'sw',4,1,1],['✨',45,22,14,'tw',2.6,0,.4],['🐿️',6,80,22,'sw',3.2,0,1]];
const SC_WATER=[['🫧',12,90,18,'ri',7,0,1],['🫧',40,92,14,'ri',9,2,1],['🫧',76,90,20,'ri',8,4,1],['🫧',58,92,12,'ri',6,1,1],['🐠',10,40,30,'dr',14,0,.8],['🐟',30,60,24,'dr',18,5,.8],['🐙',84,62,34,'fl',5,0,.9],['🐢',50,74,28,'dr',24,2,.6],['🌿',4,80,30,'sw',4,0,1],['🪸',90,84,30,'sw',5,1,1],['🦀',66,86,22,'sw',3,0,1]];
const SC_SNOW=[['❄️',8,0,16,'fa',8,0,1],['❄️',26,0,12,'fa',10,2,1],['❄️',48,0,18,'fa',9,4,1],['❄️',68,0,12,'fa',11,1,1],['❄️',88,0,16,'fa',8,5,1],['🌲',4,56,60,'sw',6,0,.7],['🌲',86,52,66,'sw',5,1,.7],['⛄',78,74,36,'sw',4,0,1],['🎿',10,82,22,'sw',3,0,1],['☃️',22,70,1,'sw',3,0,1]];
const SC_SUNSET=[['🌅',50,34,1,'fl',9,0,.3],['☁️',12,12,40,'dr',30,0,.3],['☁️',60,22,32,'dr',38,6,.3],['🐦',20,26,18,'dr',16,0,.6],['🐦',70,14,16,'dr',20,4,.6],['🌴',4,58,60,'sw',5,0,.7],['🌴',88,60,56,'sw',6,1,.7],['✨',34,50,12,'tw',3,0,.5]];
const SC_CANDY=[['🍭',10,20,34,'fl',5,0,1],['🍬',82,26,28,'fl',6,1,1],['🧁',18,64,34,'fl',7,.5,.9],['🎈',72,52,38,'fl',6,.3,1.1],['🍩',88,70,30,'fl',5.5,2,.9],['💖',46,10,20,'tw',3,0,.5],['🍪',6,84,24,'sw',3,0,1],['🌈',50,40,1,'fl',10,0,.3]];
const SC_FEST=[['🎈',10,40,38,'fl',5,0,1],['🎈',86,36,40,'fl',6,.8,1],['🎉',22,16,26,'tw',3,0,.6],['🎊',74,14,26,'tw',3.4,1,.6],['🎆',48,8,30,'tw',2.6,.5,.4],['🎡',90,66,44,'sw',6,0,.7],['🎠',6,68,40,'sw',5,0,.7],['✨',30,34,14,'tw',2.4,.2,.5]];
const SC_MOUNT=[['🏔️',12,44,64,'fl',10,0,.4],['🏔️',80,42,56,'fl',11,1,.4],['☁️',40,12,38,'dr',36,0,.3],['🦅',60,24,22,'dr',20,0,.6],['🌲',2,64,40,'sw',5,0,.8],['🌲',90,66,38,'sw',6,1,.8],['🐐',70,80,24,'sw',3.5,0,1]];
const GM_SCENES={bg_night:SC_SPACE,bg_aurora:SC_SPACE,bg_space:SC_SPACE,bg_default:SC_NATURE,bg_meadow:SC_NATURE,bg_sky:SC_NATURE,bg_forest:SC_FOREST,bg_forest2:SC_FOREST,bg_water:SC_WATER,bg_deep:SC_WATER,bg_snow:SC_SNOW,bg_sunset:SC_SUNSET,bg_candy:SC_CANDY,bg_dome:SC_FEST,bg_event:SC_FEST,bg_mount:SC_MOUNT};
const GM_SCB={SC_SPACE:['✨','⭐','☄️','🪐'],SC_NATURE:['🌸','🦋','🍃','🌼'],SC_FOREST:['🍂','🍁','🍄','🌰'],SC_WATER:['🫧','🐠','💧','🐚'],SC_SNOW:['❄️','⛄','✨','💙'],SC_SUNSET:['🌅','🐦','✨','🧡'],SC_CANDY:['🍬','🍭','💖','🎈'],SC_FEST:['🎉','🎈','🎊','✨'],SC_MOUNT:['🏔️','🦅','☁️','🌲']};
function gmSceneDecor(bg){
  const L=GM_SCENES[bg]||SC_NATURE;
  return L.map(([e,x,y,s,an,d,dl,dp])=>`<span class="sd sd-${an}" style="left:${x}%;top:${y}%;font-size:${s>1?s:34}px;--d:${d}s;--dl:${dl}s;--dp:${dp}">${e}</span>`).join('');
}
(function(){
  if(window.__scInit)return;window.__scInit=1;
  const burst=(el,x,y)=>{const bg=el.dataset.sc,L=GM_SCENES[bg]||SC_NATURE,key=Object.keys({SC_SPACE,SC_NATURE,SC_FOREST,SC_WATER,SC_SNOW,SC_SUNSET,SC_CANDY,SC_FEST,SC_MOUNT}).find(k=>({SC_SPACE,SC_NATURE,SC_FOREST,SC_WATER,SC_SNOW,SC_SUNSET,SC_CANDY,SC_FEST,SC_MOUNT})[k]===L),em=GM_SCB[key]||['✨'];
    const r=el.getBoundingClientRect();
    for(let i=0;i<7;i++){const s=document.createElement('span');s.className='scb';s.textContent=em[i%em.length];
      const a=Math.PI*2*i/7+Math.random()*.6,d=40+Math.random()*50;
      s.style.cssText=`left:${x-r.left}px;top:${y-r.top}px;--bx:${Math.cos(a)*d}px;--by:${Math.sin(a)*d-20}px`;
      el.appendChild(s);setTimeout(()=>s.remove(),1100)}};
  const move=(cx,cy)=>{document.querySelectorAll('.pscene').forEach(el=>{const r=el.getBoundingClientRect();if(!r.width)return;
    el.style.setProperty('--px',(Math.max(-1,Math.min(1,(cx-(r.left+r.width/2))/(r.width/2)))).toFixed(2));el.style.setProperty('--py',(Math.max(-1,Math.min(1,(cy-(r.top+r.height/2))/(r.height/2)))).toFixed(2))})};
  addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true});
  addEventListener('touchmove',e=>{const t=e.touches[0];t&&move(t.clientX,t.clientY)},{passive:true});
  document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('.pscene');if(!el)return;
    const sd=e.target.closest('.sd');if(sd){sd.classList.remove('pop');void sd.offsetWidth;sd.classList.add('pop')}
    burst(el,e.clientX,e.clientY)});
})();
