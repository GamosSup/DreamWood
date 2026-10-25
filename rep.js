// Сводка за месяц: часы, переработки, отсутствия. Для руководителя и бригадира (бригадир видит только свою команду).
S.rep={month:new Date(),team:''};
const REP_K=['off','otgul','do','sick','vac'];
const repFh=x=>String(Math.round(x*100)/100).replace('.',',');
async function repView(){
  if(!canMng())return go('rot');
  S.offline=0;
  const R=S.rep,y=R.month.getFullYear(),mo=R.month.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0)),n=new Date(y,mo+1,0).getDate();
  const [pr,mk,ot]=await Promise.all([
    cq('rep:p',()=>sb.from('profiles').select('id,full_name,tab_no,team,role').eq('status','approved').order('full_name')),
    cq('rep:m'+first,()=>sb.from('marks').select('user_id,day,kind').gte('day',first).lte('day',last)),
    cq('rep:o'+first,()=>sb.from('overtime').select('user_id,day,start_time,hours,note').gte('day',first).lte('day',last).order('day'))]);
  let people=pr.data||[];
  if(!isManager())people=people.filter(p=>p.team&&p.team===S.me.team);
  const teams=[...new Set(people.map(p=>p.team).filter(Boolean))];
  if(R.team&&!teams.includes(R.team))R.team='';
  if(R.team)people=people.filter(p=>p.team===R.team);
  const ord={R:0,K:1,M:2};
  people.sort((a,b)=>(ord[a.team]??9)-(ord[b.team]??9)||String(a.full_name).localeCompare(String(b.full_name),'ru'));
  const byU={};people.forEach(p=>byU[p.id]={p,cnt:{},ot:0});
  (mk.data||[]).forEach(r=>{const o=byU[r.user_id];if(o)o.cnt[r.kind]=(o.cnt[r.kind]||0)+1});
  (ot.data||[]).forEach(r=>{const o=byU[r.user_id];if(o)o.ot+=Number(r.hours)});
  const rows=people.map(p=>{const o=byU[p.id],marked=REP_K.reduce((a,k)=>a+(o.cnt[k]||0),0),wd=n-marked,sch=wd*10;return {p,cnt:o.cnt,wd,sch,ot:o.ot,tot:sch+o.ot}});
  const sum=rows.reduce((a,r)=>{a.wd+=r.wd;a.sch+=r.sch;a.ot+=r.ot;a.tot+=r.tot;REP_K.forEach(k=>a[k]=(a[k]||0)+(r.cnt[k]||0));return a},{wd:0,sch:0,ot:0,tot:0});
  let h=head('Сводка',R.month.toLocaleDateString('ru',{month:'long',year:'numeric'})+(isManager()?'':' · '+(TN[S.me.team]||'моя команда')));
  h+=`<div style="display:flex;gap:8px"><button class="btn ghost" id="rpm">←</button><button class="btn ghost" id="rnm">→</button></div>`;
  if(isManager()&&teams.length>1||R.team)h+=`<div class="tabs"><button data-rt="" class="${R.team?'':'on'}" style="background:#E3EAD2">Все</button>${['R','K','M'].filter(t=>teams.includes(t)||R.team===t).map(t=>`<button data-rt="${t}" class="${R.team===t?'on':''}" style="background:${TEAMS.find(x=>x[0]===t)[2]}">${TN[t]}</button>`).join('')}</div>`;
  h+=`<div class="stat"><div style="background:var(--sage)"><b>${rows.length}</b>сотрудников</div><div style="background:var(--gold)"><b>${repFh(sum.sch)}</b>часов по графику</div></div>
  <div class="stat"><div style="background:var(--pink)"><b>${repFh(sum.ot)}</b>переработки</div><div style="background:var(--blue)"><b>${repFh(sum.tot)}</b>всего часов</div></div>`;
  h+=`<div class="two"><button class="btn" id="rx">⬇️ Excel: сводка</button><button class="btn ghost" id="ro">⬇️ Excel: переработки</button></div>`;
  h+=`<div class="card pad col"><div class="muted">Нажми на сотрудника — откроется его график. Дни без отметки считаются рабочими по 10 часов.</div><div class="rtw"><table class="rt"><thead><tr><th>Сотрудник</th><th>Дней</th><th>Часы</th><th>Пер.</th><th>Итого</th>${REP_K.map(k=>`<th title="${KINDS[k][2]}">${KINDS[k][0]}</th>`).join('')}</tr></thead><tbody>
  ${rows.map(r=>`<tr data-u="${r.p.id}"><td>${esc(shortName(r.p.full_name))}<small>${r.p.team?TN[r.p.team]:''}</small></td><td>${r.wd}</td><td>${r.sch}</td><td>${r.ot?repFh(r.ot):'·'}</td><td><b>${repFh(r.tot)}</b></td>${REP_K.map(k=>`<td>${r.cnt[k]||'·'}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="10" class="muted">Нет сотрудников</td></tr>`}
  </tbody><tfoot><tr><td>Итого</td><td>${sum.wd}</td><td>${repFh(sum.sch)}</td><td>${repFh(sum.ot)}</td><td><b>${repFh(sum.tot)}</b></td>${REP_K.map(k=>`<td>${sum[k]||'·'}</td>`).join('')}</tr></tfoot></table></div></div>`;
  app.innerHTML=h;
  const shift=d=>{R.month=new Date(y,mo+d,1);repView()};
  $('#rpm').onclick=()=>shift(-1);$('#rnm').onclick=()=>shift(1);
  app.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{R.team=b.dataset.rt;repView()});
  app.querySelectorAll('tr[data-u]').forEach(t=>t.onclick=()=>{S.viewUser=t.dataset.u;S.month=new Date(y,mo,1);S.sel=null;go('sch')});
  const ym=first.slice(0,7);
  $('#rx').onclick=()=>downloadCSV(`Сводка ${ym}.csv`,[['Табельный №','Сотрудник','Команда','Рабочих дней','Часов по графику','Переработки, ч','Всего часов',...REP_K.map(k=>KINDS[k][2])],
    ...rows.map(r=>[r.p.tab_no||'',r.p.full_name,r.p.team?TN[r.p.team]:'',r.wd,r.sch,repFh(r.ot),repFh(r.tot),...REP_K.map(k=>r.cnt[k]||0)]),
    ['','Итого','',sum.wd,sum.sch,repFh(sum.ot),repFh(sum.tot),...REP_K.map(k=>sum[k]||0)]]);
  $('#ro').onclick=()=>{const nm=new Map(people.map(p=>[p.id,p]));
    downloadCSV(`Переработки ${ym}.csv`,[['Дата','Табельный №','Сотрудник','С какого времени','Часов','Комментарий'],...(ot.data||[]).filter(r=>nm.has(r.user_id)).map(r=>{const p=nm.get(r.user_id);return [r.day,p.tab_no||'',p.full_name,String(r.start_time||'').slice(0,5),repFh(+r.hours),r.note||'']})])};
  if(window.keepScroll)0;
}
VIEWS.rep=repView;

// ================= ОБЩИЙ ГРАФИК (руководитель и бригадир) =================
S.grid={month:new Date(),team:''};
const GRID_WD=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
async function gridView(){
  if(!canMng())return go('rot');
  S.offline=0;
  const G=S.grid,y=G.month.getFullYear(),mo=G.month.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0)),n=new Date(y,mo+1,0).getDate(),mgr=isManager();
  const [pr,mk,ro,rm,ck]=await Promise.all([
    cq('g:p',()=>sb.from('profiles').select('id,full_name,tab_no,team,role').eq('status','approved').order('full_name')),
    cq('g:m'+first,()=>sb.from('marks').select('user_id,day,kind,note').gte('day',first).lte('day',last)),
    mgr?cq('g:r',()=>sb.from('roster').select('id,full_name,team,profile_id')):Promise.resolve({data:[]}),
    mgr?cq('g:rm'+first,()=>sb.from('roster_marks').select('roster_id,day,kind,note').gte('day',first).lte('day',last)):Promise.resolve({data:[]}),
    cq('g:c'+first,()=>sb.from('checkins').select('user_id,day').gte('day',first).lte('day',last))]);
  let rows=[];
  (pr.data||[]).forEach(p=>{if(!mgr&&p.team!==S.me.team)return;rows.push({key:'u:'+p.id,id:p.id,reg:true,name:p.full_name,team:p.team||'',tab:p.tab_no,marks:{},ck:new Set()})});
  (ro.data||[]).filter(r=>!r.profile_id).forEach(r=>rows.push({key:'r:'+r.id,id:r.id,reg:false,name:r.full_name,team:r.team||'',marks:{},ck:new Set()}));
  const byKey=new Map(rows.map(r=>[r.key,r]));
  (mk.data||[]).forEach(m=>{const r=byKey.get('u:'+m.user_id);if(r)r.marks[m.day]=m});
  (ck.data||[]).forEach(c=>{const r=byKey.get('u:'+c.user_id);if(r)r.ck.add(c.day)});
  (rm.data||[]).forEach(m=>{const r=byKey.get('r:'+m.roster_id);if(r)r.marks[m.day]=m});
  const teams=[...new Set(rows.map(r=>r.team).filter(Boolean))];
  if(G.team&&!teams.includes(G.team))G.team='';
  if(G.team)rows=rows.filter(r=>r.team===G.team);
  const ord={R:0,K:1,M:2};
  rows.sort((a,b)=>(a.team?ord[a.team]??8:9)-(b.team?ord[b.team]??8:9)||String(a.name).localeCompare(String(b.name),'ru'));
  const days=Array.from({length:n},(_,i)=>{const d=new Date(y,mo,i+1);return {i:i+1,iso:iso(d),wd:d.getDay()}});
  const today=iso(new Date());
  const tc=t=>(TEAMS.find(x=>x[0]===t)||[0,0,'#ddd'])[2];
  let h=head('Общий график',G.month.toLocaleDateString('ru',{month:'long',year:'numeric'})+(mgr?'':' · '+(TN[S.me.team]||'моя команда')));
  h+=`<div style="display:flex;gap:8px"><button class="btn ghost" id="gpm">←</button><button class="btn ghost" id="gtd" style="flex:1">Сегодня</button><button class="btn ghost" id="gnm">→</button></div>`;
  if(mgr&&teams.length>1)h+=`<div class="tabs"><button data-gt="" class="${G.team?'':'on'}" style="background:#E3EAD2">Все</button>${['R','K','M'].filter(t=>teams.includes(t)).map(t=>`<button data-gt="${t}" class="${G.team===t?'on':''}" style="background:${tc(t)}">${TN[t]}</button>`).join('')}</div>`;
  h+=`<div class="gleg">${Object.entries(KINDS).map(([k,v])=>`<span style="background:${v[1]}"><b>${v[0]}</b> ${v[2]}</span>`).join('')}<span style="background:var(--card);border:1px solid var(--line)">пусто — работает</span><span style="background:var(--card);border:1px solid var(--line)"><i class="ckdot" style="margin:0 4px 0 0"></i>подтвердил выход</span></div>`;
  const absent=d=>rows.filter(r=>{const m=r.marks[d.iso];return m&&m.kind!=='off'}).length,work=d=>rows.filter(r=>!r.marks[d.iso]).length;
  h+=`<div class="card pad col"><div class="muted">Нажми на клетку — поставить или убрать отметку.${mgr?' Серым значком отмечены те, кто ещё не зарегистрировался: их график тоже сохранён.':''}</div><div class="rtw gw"><table class="gt"><thead><tr><th class="gn">Сотрудник</th>${days.map(d=>`<th class="${d.wd%6===0?'we':''} ${d.iso===today?'td':''}">${d.i}<small>${GRID_WD[d.wd]}</small></th>`).join('')}<th>Раб.</th></tr></thead><tbody>
  ${rows.map(r=>{const w=days.filter(d=>!r.marks[d.iso]).length;return `<tr><td class="gn"><i style="background:${tc(r.team)}"></i>${esc(shortName(r.name))}${r.reg?(r.ck.has(today)?'<span class="ckdot" title="Сегодня подтвердил(а) выход"></span>':''):'<small class="nr" title="ещё не зарегистрирован">○</small>'}</td>${days.map(d=>{const m=r.marks[d.iso],K=m&&KINDS[m.kind];return `<td class="gc ${d.wd%6===0?'we':''} ${d.iso===today?'td':''} ${r.ck.has(d.iso)?'ckd':''}" data-r="${r.key}" data-d="${d.iso}" ${K?`style="background:${K[1]}" title="${esc(K[2]+(m.note?': '+m.note:''))}"`:''}>${K?K[0]:''}</td>`}).join('')}<td class="gs">${w}</td></tr>`}).join('')||`<tr><td colspan="${n+2}" class="muted">Нет сотрудников</td></tr>`}
  </tbody><tfoot><tr><td class="gn">Работают</td>${days.map(d=>`<td class="gs">${work(d)}</td>`).join('')}<td></td></tr><tr><td class="gn">Подтвердили</td>${days.map(d=>`<td class="gs">${d.iso>today?'':(rows.filter(r=>r.ck.has(d.iso)).length||'·')}</td>`).join('')}<td></td></tr><tr><td class="gn">Отсутствуют</td>${days.map(d=>`<td class="gs">${absent(d)||'·'}</td>`).join('')}<td></td></tr></tfoot></table></div></div>`;
  app.innerHTML=h;
  const wrap=app.querySelector('.gw');
  if(G.sx!=null)wrap.scrollLeft=G.sx;else{const t=wrap.querySelector('th.td');if(t)wrap.scrollLeft=Math.max(0,t.offsetLeft-120)}
  wrap.onscroll=()=>{G.sx=wrap.scrollLeft};
  const shift=d=>{G.month=new Date(y,mo+d,1);G.sx=null;gridView()};
  $('#gpm').onclick=()=>shift(-1);$('#gnm').onclick=()=>shift(1);$('#gtd').onclick=()=>{G.month=new Date();G.sx=null;gridView()};
  app.querySelectorAll('[data-gt]').forEach(b=>b.onclick=()=>{G.team=b.dataset.gt;gridView()});
  app.querySelectorAll('td.gc').forEach(td=>td.onclick=()=>{const r=byKey.get(td.dataset.r);gridEdit(r,td.dataset.d,r.marks[td.dataset.d])});
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
