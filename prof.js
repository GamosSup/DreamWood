// Профили коллег: их видит любой сотрудник. Допуски, обучения и особые значки выставлены отдельными значками (витрина).
const GM_ADMN=l=>String(l||'').replace(/^Допущен:\s*/,'');
function gmShelf(row,opt={}){
  const ach=(row.ach||[]).filter(a=>!String(a.c).startsWith('gx:'));
  const adm=ach.filter(a=>a.c.startsWith('adm:')).map(a=>gmDef(a)).sort((a,b)=>String(a.n).localeCompare(String(b.n),'ru'));
  const oth=ach.filter(a=>/^(trn|spec|evt):/.test(a.c)).map(a=>gmDef(a));
  const chip=(d,cls)=>`<span class="bdg ${cls}" title="${esc(d.d||d.n)}"><i>${gmIc(d.ic,18)}</i><b>${esc(cls==='adm'?GM_ADMN(d.n):d.n)}</b></span>`;
  let h='';
  h+=`<div class="shelf"><div class="shl">🎟️ Допуски${adm.length?` · ${adm.length}`:''}</div>${adm.length?`<div class="bdgs">${adm.map(d=>chip(d,'adm')).join('')}</div>`:`<div class="muted">${opt.own?'Допуски к аттракционам выдаёт руководитель, они появятся здесь':'Допусков пока нет'}</div>`}</div>`;
  if(oth.length)h+=`<div class="shelf"><div class="shl">🎓 Обучения и особые значки · ${oth.length}</div><div class="bdgs">${oth.map(d=>chip(d,/^trn:/.test(d.c)?'trn':'spc')).join('')}</div></div>`;
  return h;
}
function gmProfile(id){
  const row=S.gm&&S.gm.by[id];if(!row)return toast('Профиль не нашёлся',2200);
  const L=gmLv(row.xp);
  const real=(row.ach||[]).filter(a=>gmReal(a)&&!/^(adm|trn|spec|evt):/.test(a.c)).map(a=>gmDef(a));
  dgxSheet(esc(row.full_name||'Профиль'),(box)=>{
    box.innerHTML=`<div class="card gmh"><div class="gmhr"><div class="gmav">${av(row,84)}</div><div style="flex:1;min-width:0"><div class="gmn">${gmName(row.full_name||'',row,{lv:false})}</div>${gmTitleHtml(row)}
      <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">${gmLvChip(row,true)}${row.lvl_text?'':`<span><b>${esc(GM_RANKS[L.r].full)}</b><br><span class="muted">Уровень ${L.n} из 50</span></span>`}</div></div></div>
      <div class="gmcnt"><span>🏅 Достижений: <b>${gmRealN(row)}</b></span><span>⭐ Очков: <b>${row.xp}</b></span></div></div>
    ${typeof petCfg==='function'&&petCfg(row)?`<div class="card pad" style="display:flex;justify-content:center">${gmPet(row,150)}</div>`:''}
    ${gmShelf(row)}
    ${real.length?`<div class="shelf"><div class="shl">🏅 Достижения · ${real.length}</div><div class="bdgs">${real.map(d=>`<span class="bdg" title="${esc(d.d||'')}"><i>${gmIc(d.ic,18)}</i><b>${esc(d.n)}</b></span>`).join('')}</div></div>`:''}`;
  },()=>{});
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pid]');if(b&&!e.target.closest('.gtip'))gmProfile(b.dataset.pid)});
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
