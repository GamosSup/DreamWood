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
