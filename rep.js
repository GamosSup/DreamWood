// ОБЩИЙ ГРАФИК + СВОДКА (руководитель и бригадир; бригадир видит только свою команду).
// Одна вкладка, два режима: «График» (сетка по дням) и «Сводка» (часы, доработки, отсутствия). Поиск, фильтр по команде, выгрузка в Excel.
S.grid={month:new Date(),team:'',mode:'grid',q:''};
const GRID_WD=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const REP_K=['off','otgul','do','sick','vac'];
const repFh=x=>String(Math.round(x*100)/100).replace('.',',');
const gNorm=s=>String(s||'').toLowerCase().replace(/ё/g,'е');
const gCap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const gMonthName=d=>gCap(d.toLocaleDateString('ru',{month:'long'}))+' '+d.getFullYear();

async function gridView(){
  if(!canMng())return go('rot');
  S.offline=0;
  const G=S.grid,y=G.month.getFullYear(),mo=G.month.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0)),n=new Date(y,mo+1,0).getDate(),mgr=isManager();
  const [pr,mk,ro,rm,ck,ot]=await Promise.all([
    cq('g:p',()=>sb.from('profiles').select('id,full_name,tab_no,team,role,day_len').eq('status','approved').order('full_name')),
    cq('g:m'+first,()=>sb.from('marks').select('user_id,day,kind,note').gte('day',first).lte('day',last)),
    mgr?cq('g:r',()=>sb.from('roster').select('id,full_name,team,profile_id,day_len')):Promise.resolve({data:[]}),
    mgr?cq('g:rm'+first,()=>sb.from('roster_marks').select('roster_id,day,kind,note').gte('day',first).lte('day',last)):Promise.resolve({data:[]}),
    cq('g:c'+first,()=>sb.from('checkins').select('user_id,day').gte('day',first).lte('day',last)),
    cq('g:o'+first,()=>sb.from('overtime').select('*').gte('day',first).lte('day',last).order('day'))]);
  let all=[];await loadPeriods();
  (pr.data||[]).forEach(p=>{if(!mgr&&p.team!==S.me.team)return;all.push({key:'u:'+p.id,id:p.id,reg:true,name:p.full_name,team:p.team||'',tab:p.tab_no,len:p.day_len||null,marks:{},ck:new Set(),ot:0,od:0,op:0,otd:{}})});
  (ro.data||[]).filter(r=>!r.profile_id).forEach(r=>all.push({key:'r:'+r.id,id:r.id,reg:false,name:r.full_name,team:r.team||'',len:r.day_len||null,marks:{},ck:new Set(),ot:0,od:0,op:0,otd:{}}));
  const byKey=new Map(all.map(r=>[r.key,r]));
  (ro.data||[]).filter(r=>r.profile_id&&r.day_len).forEach(r=>{const x=byKey.get('u:'+r.profile_id);if(x&&!x.len)x.len=r.day_len});
  all.forEach(r=>{r.lenSet=!!r.len||r.team==='M';if(!r.len)r.len=r.team==='M'?12:10});
  (mk.data||[]).forEach(m=>{const r=byKey.get('u:'+m.user_id);if(r)r.marks[m.day]=m});
  (ck.data||[]).forEach(c=>{const r=byKey.get('u:'+c.user_id);if(r)r.ck.add(c.day)});
  (rm.data||[]).forEach(m=>{const r=byKey.get('r:'+m.roster_id);if(r)r.marks[m.day]=m});
  (ot.data||[]).forEach(o=>{const r=byKey.get('u:'+o.user_id);if(r){const hr=Number(o.hours),k=otKind(o);r.ot+=hr;if(k==='p')r.op+=hr;else r.od+=hr;const e=r.otd[o.day]||(r.otd[o.day]={h:0,d:0,p:0,n:[],l:[]});e.h+=hr;e[k]+=hr;if(o.note)e.n.push(o.note);e.l.push(o)}});
  const teams=[...new Set(all.map(r=>r.team).filter(Boolean))];
  if(G.team&&!teams.includes(G.team))G.team='';
  const ord={R:0,K:1,M:2};
  all.sort((a,b)=>(a.team?ord[a.team]??8:9)-(b.team?ord[b.team]??8:9)||String(a.name).localeCompare(String(b.name),'ru'));
  const days=Array.from({length:n},(_,i)=>{const d=new Date(y,mo,i+1);return {i:i+1,iso:iso(d),wd:d.getDay()}});
  const today=iso(new Date()),ym=first.slice(0,7),title=gMonthName(G.month);
  const parkH=days.reduce((a,d)=>{const p=parkOpen(d.iso);return a+(p?+p.hours:0)},0);
  const tc=t=>(TEAMS.find(x=>x[0]===t)||[0,0,'#ddd'])[2];
  const toksOf=q=>gNorm(q).split(/\s+/).filter(Boolean);
  const view=()=>{ // строки с учётом команды, поиска, фильтров и сортировки
    const toks=toksOf(G.q);
    G.f=G.f||'all';G.s=G.s||'name';
    const f=r=>G.f==='od'?r.od>0:G.f==='op'?r.op>0:G.f==='abs'?REP_K.some(k=>days.some(d=>r.marks[d.iso]?.kind===k)):true;
    const l=all.filter(r=>(!G.team||r.team===G.team)&&toks.every(t=>gNorm(r.name).includes(t))&&f(r));
    if(G.s==='hours')l.sort((a,b)=>calc(b).tot-calc(a).tot);else if(G.s==='ot')l.sort((a,b)=>b.ot-a.ot||String(a.name).localeCompare(String(b.name),'ru'));
    return l};
  const tm=rs=>{const cs=rs.map(calc);return {n:rs.length,sch:cs.reduce((a,c)=>a+c.sch,0),od:cs.reduce((a,c)=>a+c.od,0),op:cs.reduce((a,c)=>a+c.op,0),tot:cs.reduce((a,c)=>a+c.tot,0)}};
  const personCard=c=>{const r=c.r,e=Object.entries(r.otd).sort();
    return `<div class="card pad col pcard"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:17px">${esc(r.name)}${r.team?` <span class="pill" style="background:${tc(r.team)}">${TN[r.team]}</span>`:''}</b><button class="x" id="pc_x" aria-label="Сбросить">✕</button></div>
    <div class="stat"><div style="background:var(--gold)"><b>${repFh(c.sch)}</b>часов по графику</div><div style="background:var(--blue)"><b>${repFh(c.tot)}</b>всего часов</div></div>
    <div class="stat"><div style="background:${OT_K.d[2]}"><b>${repFh(c.od)}</b>⏱ доработки</div><div style="background:${OT_K.p[2]}"><b>${repFh(c.op)}</b>🔥 переработки</div></div>
    <div class="otr"><span>Рабочих дней</span><b>${c.wd}</b></div>
    ${c.cnt.otgul?`<div class="otr"><span>🏖 Отгулы · ${c.cnt.otgul} дн.</span><b>${repFh(c.og)} ч</b></div>`:''}${c.cnt.do?`<div class="otr"><span>📌 ДО · ${c.cnt.do} дн.</span><b>−${repFh(c.dd)} ч</b></div>`:''}${c.cnt.sick?`<div class="otr"><span>🤒 Больничный · ${c.cnt.sick} дн.</span><b>—</b></div>`:''}${c.cnt.vac?`<div class="otr"><span>🌴 Отпуск · ${c.cnt.vac} дн.</span><b>—</b></div>`:''}
    ${e.length?e.map(([d,x])=>`<div class="otr"><span><b>${dayLabel(d)}</b> · ${x.d?OT_K.d[0]+' '+repFh(x.d)+' ч ':''}${x.p?OT_K.p[0]+' '+repFh(x.p)+' ч ':''}${x.n.length?esc(x.n.join(', ')):''}</span></div>`).join(''):''}
    <div class="two"><button class="btn ghost" id="pc_h">Все подробности</button>${r.reg?'<button class="btn ghost" id="pc_s">Открыть график</button>':''}</div></div>`};
  const otT=(r,d)=>{const e=r.otd[d];return e?[e.d?'доработка +'+repFh(e.d)+' ч':'',e.p?'переработка +'+repFh(e.p)+' ч':''].filter(Boolean).join(', ')+(e.n.length?' ('+e.n.join(', ')+')':''):''};
  const calc=r=>{const cnt={};REP_K.forEach(k=>cnt[k]=days.filter(d=>r.marks[d.iso]?.kind===k).length);
    const marked=REP_K.reduce((a,k)=>a+cnt[k],0),wd=n-marked;
    let sch=0,og=0,dd=0;days.forEach(d=>{const m=r.marks[d.iso],hh=dayH(d.iso,r.len,r.lenSet);if(!m||m.kind==='otgul')sch+=hh;else if(m.kind==='do')sch-=hh;if(m&&m.kind==='otgul')og+=hh;if(m&&m.kind==='do')dd+=hh});
    return {r,cnt,wd,sch,og,dd,ot:r.ot,od:r.od,op:r.op,tot:sch+r.ot}};

  let h=head('Общий график',mgr?'':(TN[S.me.team]||'моя команда'));
  h+=`<div class="gmon"><button class="btn ghost" id="gpm" aria-label="Прошлый месяц">←</button><div class="gmt"><b>${title}</b><small>график на этот месяц</small></div><button class="btn ghost" id="gnm" aria-label="Следующий месяц">→</button></div>`;
  h+=`<div class="tabs gmode"><button data-gm="grid" class="${G.mode==='grid'?'on':''}" style="background:#E3EAD2">📆 График</button><button data-gm="sum" class="${G.mode==='sum'?'on':''}" style="background:#E3EAD2">📊 Сводка</button></div>`;
  if(mgr&&teams.length>1)h+=`<div class="tabs"><button data-gt="" class="${G.team?'':'on'}" style="background:#E3EAD2">Все</button>${['R','K','M'].filter(t=>teams.includes(t)).map(t=>`<button data-gt="${t}" class="${G.team===t?'on':''}" style="background:${tc(t)}">${TN[t]}</button>`).join('')}</div>`;
  h+=`<div class="gsrch"><input type="search" id="gq" placeholder="🔍 Найти сотрудника…" value="${esc(G.q)}" autocomplete="off"><button class="btn" id="gx">⬇️ Excel</button></div><div class="tabs gflt">${[['all','Все'],['od','⏱ С доработками'],['op','🔥 С переработками'],['abs','🏖 С отгулами и отсутствием']].map(([k,v])=>`<button data-gf="${k}" class="${(G.f||'all')===k?'on':''}" style="background:var(--tab)">${v}</button>`).join('')}</div><div class="tabs gflt"><span class="muted" style="align-self:center">Сортировать:</span>${[['name','по имени'],['hours','по часам'],['ot','по доработкам']].map(([k,v])=>`<button data-gs="${k}" class="${(G.s||'name')===k?'on':''}" style="background:var(--tab)">${v}</button>`).join('')}</div><div id="gb"></div>`;
  app.innerHTML=h;

  const body=app.querySelector('#gb');
  const paint=()=>{
    const rows=view();
    const pc1=rows.length===1?personCard(calc(rows[0])):'';
    const bindPc=()=>{if(!pc1)return;const c=calc(rows[0]);$('#pc_h')?.addEventListener('click',()=>hoursSheet(c.r,calc,title,parkH,days));$('#pc_s')?.addEventListener('click',()=>{S.viewUser=c.r.id;S.month=new Date(y,mo,1);S.sel=null;go('sch')});$('#pc_x')?.addEventListener('click',()=>{G.q='';app.querySelector('#gq').value='';paint()})};
    if(G.mode==='sum'){
      const cs=rows.map(calc),sum=cs.reduce((a,c)=>{a.wd+=c.wd;a.sch+=c.sch;a.ot+=c.ot;a.od+=c.od;a.op+=c.op;a.tot+=c.tot;REP_K.forEach(k=>a[k]=(a[k]||0)+c.cnt[k]);return a},{wd:0,sch:0,ot:0,od:0,op:0,tot:0});
      const tq=toksOf(G.q),tr=all.filter(r=>tq.every(t=>gNorm(r.name).includes(t)));
      const tmRows=(mgr&&teams.length>1)?['R','K','M'].filter(t=>teams.includes(t)).map(t=>[t,tm(tr.filter(r=>r.team===t))]):[];
      body.innerHTML=pc1+`<div class="stat"><div style="background:var(--sage)"><b>${rows.length}</b>сотрудников</div><div style="background:var(--gold)"><b>${repFh(sum.sch)}</b>часов по графику</div></div>
      <div class="stat"><div style="background:#E3EAD2"><b>${repFh(parkH)}</b>🌳 часов работы парка</div><div style="background:var(--card);border:1px solid var(--line)"><b>${rows.length?repFh(Math.round(sum.tot/rows.length*10)/10):0}</b>в среднем на человека</div></div>
      <div class="stat"><div style="background:${OT_K.d[2]}"><b>${repFh(sum.od)}</b>⏱ доработки</div><div style="background:${OT_K.p[2]}"><b>${repFh(sum.op)}</b>🔥 переработки</div></div>
      <div class="stat"><div style="background:var(--blue)"><b>${repFh(sum.tot)}</b>всего часов</div><div style="background:var(--card);border:1px solid var(--line)"><b>${sum.otgul||0} · ${sum.do||0}</b>отгулы · ДО (дней)</div></div>
      ${tmRows.length?`<div class="card pad col"><b>👥 Часы по командам</b><div class="rtw"><table class="rt"><thead><tr><th>Команда</th><th>Чел.</th><th>По гр.</th><th>⏱</th><th>🔥</th><th>Всего</th><th>Ср.</th></tr></thead><tbody>${tmRows.map(([t,m])=>`<tr data-tm="${t}" class="${G.team===t?'on':''}"><td><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${tc(t)};margin-right:6px"></i>${TN[t]}</td><td>${m.n}</td><td>${repFh(m.sch)}</td><td>${m.od?repFh(m.od):'·'}</td><td>${m.op?repFh(m.op):'·'}</td><td><b>${repFh(m.tot)}</b></td><td>${m.n?repFh(Math.round(m.tot/m.n*10)/10):'·'}</td></tr>`).join('')}</tbody></table></div><div class="muted">Нажми на команду — отфильтруется. «Ср.» — среднее на человека.</div></div>`:''}
      <div class="card pad col"><div class="muted">${title}. Нажми на сотрудника — откроются его часы, доработки, переработки и отгулы. Дни без отметки считаются рабочими; отгул — как отработанный день, ДО — минус день; часы считаются по графику смен (9:30–20:30 с обедом и т.д.), у кого задана личная длина дня — по ней.${mgr?' Серым ○ отмечены те, кто ещё не зарегистрировался.':''}</div><div class="rtw"><table class="rt"><thead><tr><th>Сотрудник</th><th>Дней</th><th>Часы</th><th title="Доработки">⏱</th><th title="Переработки">🔥</th><th>Итого</th>${REP_K.map(k=>`<th title="${KINDS[k][2]}">${KINDS[k][0]}</th>`).join('')}</tr></thead><tbody>
      ${cs.map(c=>`<tr data-k="${c.r.key}"><td>${esc(shortName(c.r.name))}${c.r.reg?'':' <span class="nr">○</span>'}<small>${c.r.team?TN[c.r.team]:''}</small></td><td>${c.wd}</td><td>${c.sch}</td><td>${c.od?repFh(c.od):'·'}</td><td>${c.op?repFh(c.op):'·'}</td><td><b>${repFh(c.tot)}</b></td>${REP_K.map(k=>`<td>${c.cnt[k]||'·'}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="10" class="muted">Никого не нашли</td></tr>`}
      </tbody><tfoot><tr><td>Итого</td><td>${sum.wd}</td><td>${repFh(sum.sch)}</td><td>${repFh(sum.od)}</td><td>${repFh(sum.op)}</td><td><b>${repFh(sum.tot)}</b></td>${REP_K.map(k=>`<td>${sum[k]||'·'}</td>`).join('')}</tr></tfoot></table></div></div>`;
      {const ids=new Set(rows.filter(r=>r.reg).map(r=>r.id)),nmx=new Map(rows.map(r=>[r.id,r.name])),ol=ot.data.filter(o=>ids.has(o.user_id)).sort((p,q)=>p.day.localeCompare(q.day)||String(nmx.get(p.user_id)).localeCompare(String(nmx.get(q.user_id)),'ru'));
        body.insertAdjacentHTML('beforeend',`<div class="card pad col"><b>⏱ Доработки и 🔥 переработки за месяц · ${ol.length?repFh(ol.reduce((a,o)=>a+Number(o.hours),0))+' ч':'нет'}</b>${ol.map(o=>`<div class="otr"><span><b>${dayLabel(o.day)}</b> · ${esc(shortName(nmx.get(o.user_id)))} · ${OT_K[otKind(o)][0]}${o.note?' '+esc(o.note):''}</span><b>+${repFh(Number(o.hours))} ч</b></div>`).join('')||'<div class="muted">В этом месяце доработок и переработок не было.</div>'}</div>`)}
      body.querySelectorAll('tr[data-k]').forEach(t=>t.onclick=()=>hoursSheet(byKey.get(t.dataset.k),calc,title,parkH,days));
      body.querySelectorAll('tr[data-tm]').forEach(t=>t.onclick=()=>{G.team=G.team===t.dataset.tm?'':t.dataset.tm;gridView()});
      bindPc();
      return;
    }
    const absent=d=>rows.filter(r=>{const m=r.marks[d.iso];return m&&m.kind!=='off'}).length,work=d=>rows.filter(r=>!r.marks[d.iso]).length;
    body.innerHTML=pc1+`<div class="gleg">${Object.entries(KINDS).map(([k,v])=>`<span style="background:${v[1]}"><b>${v[0]}</b> ${v[2]}</span>`).join('')}<span style="background:var(--card);border:1px solid var(--line)">пусто — работает</span><span style="background:${OT_K.d[2]}"><b>+Ч</b> ⏱ доработка</span><span style="background:${OT_K.p[2]}"><b>+Ч</b> 🔥 переработка</span><span style="background:var(--card);border:1px solid var(--line)"><i class="ckdot" style="margin:0 4px 0 0"></i>подтвердил выход</span></div>
    <div class="card pad col"><div class="muted">Нажми на клетку — поставить или убрать отметку.${mgr?' Серым ○ отмечены те, кто ещё не зарегистрировался: их график тоже сохранён.':''}</div><div class="rtw gw"><table class="gt"><thead><tr><th class="gn">Сотрудник</th>${days.map(d=>`<th class="${d.wd%6===0?'we':''} ${d.iso===today?'td':''}">${d.i}<small>${GRID_WD[d.wd]}</small></th>`).join('')}<th>Раб.</th><th title="Доработки, ч">⏱</th><th title="Переработки, ч">🔥</th><th title="Часов за месяц: по графику + доработки + переработки">Часы</th></tr></thead><tbody>
    <tr class="gpark"><td class="gn" title="Часы работы парка по периодам графика">🌳 Парк, ч</td>${days.map(d=>{const p=parkOpen(d.iso);return `<td class="gs ${d.wd%6===0?'we':''}" ${p?`title="${esc(perLabel(d.iso))}"`:''}>${p?repFh(+p.hours):'·'}</td>`}).join('')}<td class="gs">${days.filter(d=>parkOpen(d.iso)).length||'·'}</td><td></td><td></td><td class="gs"><b>${repFh(parkH)}</b></td></tr>
    ${rows.map(r=>{const w=days.filter(d=>!r.marks[d.iso]).length,c=calc(r);return `<tr><td class="gn" data-hn="${r.key}"><i style="background:${tc(r.team)}"></i>${esc(shortName(r.name))}${r.reg?(r.ck.has(today)?'<span class="ckdot" title="Сегодня подтвердил(а) выход"></span>':''):'<small class="nr" title="ещё не зарегистрирован">○</small>'}</td>${days.map(d=>{const m=r.marks[d.iso],K=m&&KINDS[m.kind];return `<td class="gc ${d.wd%6===0?'we':''} ${d.iso===today?'td':''} ${r.ck.has(d.iso)?'ckd':''}" data-r="${r.key}" data-d="${d.iso}" ${K||r.otd[d.iso]?`${K?`style="background:${K[1]}" `:''}title="${esc([K?K[2]+(m.note?': '+m.note:''):'',otT(r,d.iso)].filter(Boolean).join(' · '))}"`:''}>${K?K[0]:''}${r.otd[d.iso]?`<b class="otb ${r.otd[d.iso].p?(r.otd[d.iso].d?'m':'p'):''}">+${repFh(r.otd[d.iso].h)}</b>`:''}</td>`}).join('')}<td class="gs">${w}</td><td class="gs">${c.od?repFh(c.od):'·'}</td><td class="gs">${c.op?repFh(c.op):'·'}</td><td class="gs gh" data-hn="${r.key}" title="Нажми — подробности по часам"><b>${repFh(c.tot)}</b></td></tr>`}).join('')||`<tr><td colspan="${n+5}" class="muted">Никого не нашли</td></tr>`}
    </tbody><tfoot><tr><td class="gn">Работают</td>${days.map(d=>`<td class="gs">${work(d)}</td>`).join('')}<td></td><td></td><td></td><td></td></tr><tr><td class="gn">Подтвердили</td>${days.map(d=>`<td class="gs">${d.iso>today?'':(rows.filter(r=>r.ck.has(d.iso)).length||'·')}</td>`).join('')}<td></td><td></td><td></td><td></td></tr>
    <tr><td class="gn">⏱ Доработки, ч</td>${days.map(d=>{const v=rows.reduce((a,r)=>a+(r.otd[d.iso]?r.otd[d.iso].d:0),0);return `<td class="gs">${v?'<b>'+repFh(v)+'</b>':'·'}</td>`}).join('')}<td></td><td class="gs"><b>${repFh(rows.reduce((a,r)=>a+r.od,0))||'·'}</b></td><td></td><td></td></tr>
    <tr><td class="gn">🔥 Переработки, ч</td>${days.map(d=>{const v=rows.reduce((a,r)=>a+(r.otd[d.iso]?r.otd[d.iso].p:0),0);return `<td class="gs">${v?'<b>'+repFh(v)+'</b>':'·'}</td>`}).join('')}<td></td><td></td><td class="gs"><b>${repFh(rows.reduce((a,r)=>a+r.op,0))||'·'}</b></td><td></td></tr>
    <tr><td class="gn">Отсутствуют</td>${days.map(d=>`<td class="gs">${absent(d)||'·'}</td>`).join('')}<td></td><td></td><td></td><td class="gs"><b>${repFh(rows.reduce((a,r)=>a+calc(r).tot,0))}</b></td></tr></tfoot></table></div></div>`;
    bindPc();
    const wrap=body.querySelector('.gw');
    if(G.sx!=null)wrap.scrollLeft=G.sx;else{const t=wrap.querySelector('th.td');if(t)wrap.scrollLeft=Math.max(0,t.offsetLeft-120)}
    wrap.onscroll=()=>{G.sx=wrap.scrollLeft};
    body.querySelectorAll('[data-hn]').forEach(td=>td.onclick=()=>hoursSheet(byKey.get(td.dataset.hn),calc,title,parkH,days));
    body.querySelectorAll('td.gc').forEach(td=>td.onclick=()=>{const r=byKey.get(td.dataset.r);gridEdit(r,td.dataset.d,r.marks[td.dataset.d])});
  };
  paint();

  const shift=d=>{G.month=new Date(y,mo+d,1);G.sx=null;gridView()};
  $('#gpm').onclick=()=>shift(-1);$('#gnm').onclick=()=>shift(1);
  app.querySelector('.gmt').onclick=()=>{G.month=new Date();G.sx=null;gridView()};
  app.querySelectorAll('[data-gt]').forEach(b=>b.onclick=()=>{G.team=b.dataset.gt;gridView()});
  app.querySelectorAll('[data-gm]').forEach(b=>b.onclick=()=>{G.mode=b.dataset.gm;gridView()});
  $('#gq').oninput=e=>{G.q=e.target.value;paint()};
  app.querySelectorAll('[data-gf]').forEach(b=>b.onclick=()=>{G.f=b.dataset.gf;G.sx=G.sx;gridView()});
  app.querySelectorAll('[data-gs]').forEach(b=>b.onclick=()=>{G.s=b.dataset.gs;gridView()});
  $('#gx').onclick=async e=>{const b=e.target;b.disabled=true;const t=b.textContent;b.textContent='Готовлю файл…';
    try{await gridXlsx({rows:view(),days,calc,title,ym,n,team:G.team,ot:(ot.data||[])})}catch(err){alert('Не получилось сделать Excel: '+(err.message||err))}
    b.disabled=false;b.textContent=t};
}

// ---------- выгрузка в Excel (файл собирается прямо в приложении, интернет не нужен) ----------
async function gridXlsx(o){
  const {rows,days,calc,title,ym,n,team,ot}=o,sub=team?TN[team]:'Все команды',when=new Date().toLocaleString('ru');
  const H={b:1,bg:'#EFE6D8',al:'c',vt:'m',bd:1,wrap:1},B={bd:1,al:'c'},NM={bd:1,al:'l'};
  const cs=rows.map(calc);
  // --- «График»
  const Lw=xlsxCol(2+n),L=xlsxCol(2+n+1),parkH=days.reduce((a,d)=>{const p=parkOpen(d.iso);return a+(p?+p.hours:0)},0);
  const g=[[{v:'График работы — '+title,s:{b:1,sz:16}}],[{v:sub+' · выгружено '+when,s:{color:'#7A6A5A'}}],
    [{v:'Сотрудник',s:H},{v:'Команда',s:H},...days.map(d=>({v:d.i,s:{...H,bg:d.wd%6===0?'#E3D2B5':'#EFE6D8'}})),{v:'Раб. дней',s:H},{v:'Часов',s:H}],
    ['','',...days.map(d=>({v:GRID_WD[d.wd],s:{...H,bg:d.wd%6===0?'#E3D2B5':'#EFE6D8'}})),'','']];
  g.push([{v:'🌳 Парк, часов работы',s:{...NM,b:1,bg:'#E3EAD2'}},{v:'',s:{...B,bg:'#E3EAD2'}},...days.map(d=>{const p=parkOpen(d.iso);return {v:p?+p.hours:'',s:{...B,bg:'#E3EAD2'}}}),{v:days.filter(d=>parkOpen(d.iso)).length,s:{...B,bg:'#E3EAD2'}},{v:parkH,s:{...B,b:1,bg:'#E3EAD2'}}]);
  rows.forEach((r,i)=>g.push([{v:r.name+(r.reg?'':' (не зарегистрирован)'),s:NM},{v:r.team?TN[r.team]:'',s:NM},
    ...days.map(d=>{const m=r.marks[d.iso],K=m&&KINDS[m.kind];return K?{v:K[0],s:{...B,b:1,sz:10,bg:K[1]}}:{v:'',s:{...B,bg:d.wd%6===0?'#F4EEE4':undefined}}}),
    {v:days.filter(d=>!r.marks[d.iso]).length,s:B},{v:calc(r).tot,s:{...B,b:1}}]));
  
  const colSum=(label,fn)=>[{v:label,s:{b:1}},'',...days.map((d,i)=>({v:fn(d),f:null,s:{al:'c',color:'#7A6A5A'}}))];
  g.push([]);
  g.push(colSum('Работают',d=>rows.filter(r=>!r.marks[d.iso]).length));
  g.push(colSum('Отсутствуют',d=>rows.filter(r=>{const m=r.marks[d.iso];return m&&m.kind!=='off'}).length));
  g.push([]);g.push([{v:'Обозначения:',s:{b:1}}]);
  Object.values(KINDS).forEach(v=>g.push([{v:v[0]+' — '+v[2],s:{bg:v[1]}}]));
  g.push(['пусто — рабочий день']);
  const sheet1={name:'График',rows:g,cols:[38,14,...days.map(()=>4.6),10,9],merges:['A1:'+L+'1','A2:'+L+'2','A3:A4','B3:B4',Lw+'3:'+Lw+'4',L+'3:'+L+'4'],freeze:{x:2,y:4},landscape:true,heights:{3:20,4:18}};
  // --- «Сводка»
  const tot=k=>cs.reduce((a,c)=>a+(typeof k==='function'?k(c):0),0);
  const colL=i=>xlsxCol(i);
  const r2=[[{v:'Сводка — '+title+' · '+sub,s:{b:1,sz:16}}],[{v:'Дни без отметки рабочие; отгул считается как отработанный день, ДО — минус день; длина дня у каждого своя (8, 10 или 12 ч).',s:{color:'#7A6A5A'}}],
    ['Табельный №','Сотрудник','Команда','Рабочих дней','Часов по графику','Доработки, ч','Переработки, ч','Всего часов',...REP_K.map(k=>KINDS[k][2])].map(v=>({v,s:H}))];
  cs.forEach(c=>r2.push([{v:c.r.tab||'',s:B},{v:c.r.name,s:NM},{v:c.r.team?TN[c.r.team]:'',s:NM},...[c.wd,c.sch,c.od,c.op,c.tot,...REP_K.map(k=>c.cnt[k])].map(v=>({v,s:B}))]));
  const sums=[c=>c.wd,c=>c.sch,c=>c.od,c=>c.op,c=>c.tot,...REP_K.map(k=>c=>c.cnt[k])];
  r2.push([{v:'',s:B},{v:'Итого',s:{...NM,b:1}},{v:'',s:B},...sums.map((fn,i)=>({v:tot(fn),f:cs.length?`SUM(${colL(3+i)}4:${colL(3+i)}${3+cs.length})`:null,s:{...B,b:1}}))]);
  const sheet2={name:'Сводка',rows:r2,cols:[12,28,14,12,14,14,14,12,10,10,8,12,12],freeze:{y:3},heights:{3:34}};
  // --- «Доработки и переработки»
  const nm=new Map(rows.filter(r=>r.reg).map(r=>[r.id,r])),r3=[['Дата','Табельный №','Сотрудник','Вид','С какого времени','Часов','Комментарий'].map(v=>({v,s:H}))];
  ot.filter(x=>nm.has(x.user_id)).forEach(x=>{const p=nm.get(x.user_id);r3.push([{v:x.day.split('-').reverse().join('.'),s:B},{v:p.tab||'',s:B},{v:p.name,s:NM},{v:OT_K[otKind(x)][1],s:NM},{v:String(x.start_time||'').slice(0,5),s:B},{v:Number(x.hours),s:B},{v:x.note||'',s:NM}])});
  const sheet3={name:'Доработки и переработки',rows:r3,cols:[12,12,28,14,16,8,40],freeze:{y:1}};
  const blob=new Blob([makeXlsx([sheet1,sheet2,sheet3])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`График ${ym}${team?' '+TN[team]:''}.xlsx`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
}
function hoursSheet(r,calc,title,parkH,days){
  if(!r)return;const c=calc(r),pd=days.filter(d=>parkOpen(d.iso)).length,e=Object.entries(r.otd).sort();
  dgxSheet('⏱ '+esc(shortName(r.name)),box=>{
    const mx=Math.max(parkH,c.tot,1);
    box.innerHTML=`<div class="muted">${title}${r.team?' · '+TN[r.team]:''} · длина смены: ${repFh(r.len)} ч${r.lenSet?'':' (по периодам графика)'}</div>
    <div class="stat"><div style="background:var(--gold)"><b>${repFh(c.sch)}</b>часов по графику</div><div style="background:var(--sage)"><b>${repFh(c.tot)}</b>всего часов</div></div>
    <div class="stat"><div style="background:${OT_K.d[2]}"><b>${repFh(c.od)}</b>⏱ доработки</div><div style="background:${OT_K.p[2]}"><b>${repFh(c.op)}</b>🔥 переработки</div></div>
    <div class="hbar"><i style="width:${Math.min(100,c.tot/mx*100)}%"></i></div><div class="muted">🌳 часов работы парка за месяц: ${repFh(parkH)} · дней работы парка: ${pd}</div>
    <div class="otr"><span>Рабочих дней</span><b>${c.wd}</b></div>
    ${c.cnt.otgul?`<div class="otr"><span>🏖 Отгулы · ${c.cnt.otgul} дн.</span><b>+${repFh(c.og)} ч</b></div>`:''}${c.cnt.do?`<div class="otr"><span>📌 ДО · ${c.cnt.do} дн.</span><b>−${repFh(c.dd)} ч</b></div>`:''}${REP_K.filter(k=>c.cnt[k]&&k!=='otgul'&&k!=='do').map(k=>`<div class="otr"><span>${KINDS[k][0]} ${KINDS[k][2]}</span><b>${c.cnt[k]} дн.</b></div>`).join('')}
    ${e.length?`<b>По дням</b>`+e.map(([d,x])=>`<div class="otr"><span><b>${dayLabel(d)}</b> · ${x.d?OT_K.d[0]+' доработка '+repFh(x.d)+' ч ':''}${x.p?OT_K.p[0]+' переработка '+repFh(x.p)+' ч ':''}${x.n.length?'· '+esc(x.n.join(', ')):''}</span></div>`).join(''):'<div class="muted">Доработок и переработок в этом месяце нет.</div>'}
    <div class="muted">Дни без отметки считаются рабочими; отгул — как отработанный день, ДО — минус день.</div>
    ${r.reg?'<button class="btn ghost" id="hs_o">Открыть график сотрудника</button>':''}`;
    box.querySelector('#hs_o')?.addEventListener('click',()=>{document.querySelector('.ov #bk')?.click();S.viewUser=r.id;S.month=new Date(days[0].iso+'T12:00:00');S.sel=null;go('sch')});
  });
}
function gridEdit(r,day,cur){
  dgxSheet(`${esc(shortName(r.name))} · ${dayLabel(day)}`,(box,paint,close)=>{
    let pick=cur?.kind||'';
    box.innerHTML=`<div class="tabs">${Object.entries(KINDS).map(([k,v])=>`<button data-m="${k}" style="background:${v[1]}" class="${pick===k?'on':''}">${v[2]}</button>`).join('')}<button data-m="" style="background:#fff;border:1px solid #ccc" class="${pick?'':'on'}">Рабочий</button></div>
    <textarea id="ge_n" placeholder="Комментарий (необязательно)">${esc(cur?.note||'')}</textarea><button class="btn" id="ge_s">Сохранить</button>`;
    box.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{pick=b.dataset.m;box.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
    box.querySelector('#ge_s').onclick=async e=>{e.target.disabled=true;
      const note=box.querySelector('#ge_n').value.trim()||null,tbl=r.reg?'marks':'roster_marks',col=r.reg?'user_id':'roster_id';
      const res=pick?await sb.from(tbl).upsert({[col]:r.id,day,kind:pick,note}):await sb.from(tbl).delete().eq(col,r.id).eq('day',day);
      if(res.error){alert(res.error.message);e.target.disabled=false;return}
      close();
    };
  },()=>gridView());
}
VIEWS.grid=gridView;
VIEWS.rep=()=>{S.grid.mode='sum';go('grid')}; // старая ссылка на «Сводку»
