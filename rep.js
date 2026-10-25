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
