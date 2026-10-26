// «Мой календарь»: личные дела, дедлайны и события по датам + мой график и доработки. Видит только владелец.
const PL_K={task:['✅','Дело'],deadline:['⏰','Дедлайн'],event:['📌','Событие']};
const PL_C={task:'#E3C46E',deadline:'#C0392B',event:'#5B8DB8'};
const plT=x=>x.due_time?String(x.due_time).slice(0,5)+(x.due_end?'–'+String(x.due_end).slice(0,5):''):'';
async function planView(){
  const today=iso(new Date());
  const P=S.pl||(S.pl={m:new Date(),sel:today});
  const me=S.me.id,y=P.m.getFullYear(),mo=P.m.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0)),n=new Date(y,mo+1,0).getDate(),lead=(new Date(y,mo,1).getDay()+6)%7;
  S.offline=0;
  const [tq,mk,ot,dn,pb]=await Promise.all([
    sb.from('todos').select('*').eq('user_id',me).order('created_at'),
    sb.from('marks').select('day,kind,note').eq('user_id',me).gte('day',first).lte('day',last),
    sb.from('overtime').select('day,hours,note,start_time').eq('user_id',me).gte('day',first).lte('day',last),
    sb.from('day_notes').select('day,body').eq('user_id',me).gte('day',first).lte('day',last),
    sb.from('todos').select('due,due_time,due_end,kind,note').limit(1)]);
  try{await loadPeriods()}catch(e){}
  const all=(tq.data||[]).map(x=>({kind:'task',due:null,...x})),marks={},otd={},notes={};
  (mk.data||[]).forEach(m=>marks[m.day]=m);(ot.data||[]).forEach(o=>(otd[o.day]=otd[o.day]||[]).push(o));(dn.data||[]).forEach(d=>notes[d.day]=d.body);
  const byDay={};all.filter(x=>x.due).forEach(x=>(byDay[x.due]=byDay[x.due]||[]).push(x));
  const srt=(a,b)=>(a.done-b.done)||String(a.due_time||'99').localeCompare(String(b.due_time||'99'))||String(a.created_at).localeCompare(String(b.created_at));
  const over=x=>!x.done&&x.due&&x.due<today;
  const overdue=all.filter(over).sort((a,b)=>a.due.localeCompare(b.due)),
    soon=all.filter(x=>!x.done&&x.due&&x.due>=today&&x.due<=iso(new Date(Date.now()+7*864e5))).sort((a,b)=>a.due.localeCompare(b.due)||srt(a,b)),
    undated=all.filter(x=>!x.due).sort(srt),done=all.filter(x=>x.done).length;
  const rowH=(x,showDay)=>`<div class="plr ${x.done?'dn':''} ${over(x)?'plo':''}"><input type="checkbox" data-pt="${x.id}" ${x.done?'checked':''} aria-label="Сделано"><div class="plb" data-pe="${x.id}"><div><span class="plk" style="background:${PL_C[x.kind]||PL_C.task}"></span>${PL_K[x.kind]?.[0]||'✅'} <b>${esc(x.body)}</b></div><div class="muted">${showDay&&x.due?dayLabel(x.due)+(plT(x)?' · ':''):''}${plT(x)}${over(x)?' · просрочено':''}${x.note?`${showDay||plT(x)?' · ':''}${esc(x.note)}`:''}</div></div></div>`;
  let h=head('Мой календарь','Дела, дедлайны и события · видите только вы');
  h+=`<div class="gmon"><button class="btn ghost" id="pl_pm" aria-label="Прошлый месяц">←</button><div class="gmt"><b>${P.m.toLocaleDateString('ru',{month:'long',year:'numeric'})}</b><small>${all.length-done?`открыто дел: ${all.length-done}`:'всё сделано'}${overdue.length?` · просрочено: ${overdue.length}`:''}</small></div><button class="btn ghost" id="pl_nm" aria-label="Следующий месяц">→</button></div>`;
  h+=`<div class="cal">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="dh">${d}</div>`).join('')}${'<div></div>'.repeat(lead)}`;
  for(let d=1;d<=n;d++){const k=iso(new Date(y,mo,d)),m=marks[k],K=m&&KINDS[m.kind],its=byDay[k]||[],o=(otd[k]||[]).reduce((a,r)=>a+Number(r.hours),0);
    const dots=its.slice(0,4).map(x=>`<i class="pld ${x.done?'dn':''}" style="background:${PL_C[x.kind]||PL_C.task}"></i>`).join('');
    h+=`<button class="day ${P.sel===k?'sel':''} ${k===today?'tdy':''}" data-k="${k}" style="${K?`background:${K[1]};`:''}">${d}<small>${K?K[0]:''}</small>${o?`<i class="otm">⏱+${String(Math.round(o*100)/100).replace('.',',')}ч</i>`:''}${dots?`<span class="pldw">${dots}</span>`:''}</button>`}
  h+=`</div><div class="gleg"><span style="background:var(--card);border:1px solid var(--line)"><i class="pld" style="background:${PL_C.task}"></i> дело</span><span style="background:var(--card);border:1px solid var(--line)"><i class="pld" style="background:${PL_C.deadline}"></i> дедлайн</span><span style="background:var(--card);border:1px solid var(--line)"><i class="pld" style="background:${PL_C.event}"></i> событие</span><span style="background:var(--pink)"><b>⏱</b> доработка</span></div>`;
  // выбранный день
  if(P.sel){const k=P.sel,m=marks[k],its=(byDay[k]||[]).slice().sort(srt),inMonth=k>=first&&k<=last;
    h+=`<div class="card pad col"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:17px">${dayLabel(k)}${k===today?' · сегодня':''}</b><button class="btn" id="pl_add" style="flex:none;min-height:38px;padding:0 14px">＋ Добавить</button></div>`;
    if(inMonth){h+=m?`<div class="pill" style="background:${KINDS[m.kind][1]};align-self:flex-start">${KINDS[m.kind][2]}${m.note?' · '+esc(m.note):''}</div>`:`<div class="muted">🕘 Рабочий день${perLabel(k)?' · '+perLabel(k):''}</div>`;
      (otd[k]||[]).forEach(o=>h+=`<div class="pill" style="background:var(--pink);align-self:flex-start">⏱ Доработка +${String(+o.hours).replace('.',',')} ч${o.start_time?' с '+String(o.start_time).slice(0,5):''}${o.note?' · '+esc(o.note):''}</div>`);
      if(notes[k])h+=`<div class="muted">📝 Комментарий руководителям: ${esc(notes[k])}</div>`}
    h+=its.length?its.map(x=>rowH(x,false)).join(''):`<div class="muted">На этот день ничего не запланировано.</div>`;
    h+=`</div>`}
  if(overdue.length)h+=`<div class="card pad col" style="border:2px solid #C0392B55"><b>⚠️ Просрочено · ${overdue.length}</b>${overdue.map(x=>rowH(x,true)).join('')}</div>`;
  if(soon.length)h+=`<div class="card pad col"><b>📆 Ближайшие 7 дней · ${soon.length}</b>${soon.map(x=>rowH(x,true)).join('')}</div>`;
  h+=`<div class="card pad col"><b>📝 Без даты · ${undated.length}</b>${undated.map(x=>rowH(x,false)).join('')||'<div class="muted">Дел без даты нет.</div>'}<div class="two"><input id="pl_q" placeholder="Быстро добавить дело…" style="flex:1"><button class="btn" id="pl_qa" style="flex:none">＋</button></div></div>`;
  if(all.length)h+=`<div class="card pad col"><b>Выполнено ${done} из ${all.length}</b>${todoBar(done,all.length)}</div>`;
  if(done)h+=`<button class="btn ghost" id="pl_clr">Убрать выполненные</button>`;
  h+=`<div class="muted">🔒 Личные записи видите только вы: руководители и администратор их не видят. Выходные, отгулы и доработки подтягиваются из графика.</div>`;
  if(pb.error)h=`<div class="card pad err">⚠️ Даты и дедлайны заработают после обновления базы: нужно один раз запустить supabase/migration_2026-11-03_planner.sql. Пока можно вести дела без даты.</div>`+h;
  app.innerHTML=h;
  $('#pl_pm').onclick=()=>{P.m=new Date(y,mo-1,1);P.sel=null;planView()};$('#pl_nm').onclick=()=>{P.m=new Date(y,mo+1,1);P.sel=null;planView()};
  app.querySelectorAll('.cal .day').forEach(b=>b.onclick=()=>{P.sel=P.sel===b.dataset.k?null:b.dataset.k;keepScroll(planView)});
  $('#pl_add')?.addEventListener('click',()=>plEdit(null,P.sel));
  app.querySelectorAll('[data-pe]').forEach(b=>b.onclick=()=>plEdit(all.find(x=>x.id==b.dataset.pe)));
  app.querySelectorAll('[data-pt]').forEach(b=>b.onchange=async()=>{const r=await sb.from('todos').update({done:b.checked,done_at:b.checked?new Date().toISOString():null}).eq('id',b.dataset.pt);if(r.error)alert(r.error.message);keepScroll(planView)});
  const qa=async()=>{const t=$('#pl_q').value.trim();if(!t)return;const r=await sb.from('todos').insert({body:t});if(r.error)return alert(r.error.message);planView()};
  $('#pl_qa').onclick=qa;$('#pl_q').onkeydown=e=>{if(e.key==='Enter')qa()};
  $('#pl_clr')?.addEventListener('click',async()=>{await sb.from('todos').delete().eq('user_id',me).eq('done',true);planView()});
}
// окно записи: создать или править
function plEdit(x,day){
  const f=x?{...x}:{body:'',kind:'task',due:day||null,due_time:null,due_end:null,note:''};
  dgxSheet(x?'✏️ Запись':'➕ Новая запись',(box,paint,close)=>{
    box.innerHTML=`<div class="mpick">${Object.entries(PL_K).map(([k,v])=>`<button data-pk="${k}" class="${f.kind===k?'on':''}" style="flex:1 1 30%;min-width:0;padding:0 6px;background:${k==='deadline'?'#F3C9C3':k==='event'?'#CFE0EE':'#F5E2A8'}"><b>${v[0]}</b> ${v[1]}</button>`).join('')}</div>
    <label>Что <input id="pl_b" value="${esc(f.body)}" placeholder="Например: сдать отчёт, заказать форму"></label>
    <label>Дата <input type="date" id="pl_d" value="${f.due||''}"></label>
    <div class="two"><label>С <input type="time" id="pl_t" value="${f.due_time?String(f.due_time).slice(0,5):''}"></label><label>До <input type="time" id="pl_e" value="${f.due_end?String(f.due_end).slice(0,5):''}"></label></div>
    <label>Заметка <textarea id="pl_n" placeholder="Детали (необязательно)">${esc(f.note||'')}</textarea></label>
    <button class="btn" id="pl_s">Сохранить</button>${x?'<button class="btn ghost" id="pl_x" style="color:#C0392B">Удалить</button>':''}<div class="err" id="pl_er"></div>`;
    box.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{f.kind=b.dataset.pk;box.querySelectorAll('[data-pk]').forEach(z=>z.classList.toggle('on',z===b))});
    box.querySelector('#pl_s').onclick=async e=>{
      const body=box.querySelector('#pl_b').value.trim(),er=box.querySelector('#pl_er');
      if(!body)return er.textContent='Напиши, что нужно сделать';
      const d=box.querySelector('#pl_d').value||null,t=box.querySelector('#pl_t').value||null,en=box.querySelector('#pl_e').value||null;
      if(en&&!t)return er.textContent='Укажи время начала';
      if(t&&en&&en<t)return er.textContent='Конец раньше начала';
      if((t||f.kind==='deadline')&&!d)return er.textContent='Укажи дату';
      const row={body,kind:f.kind,due:d,due_time:t,due_end:en,note:box.querySelector('#pl_n').value.trim()||null};
      e.target.disabled=true;
      const r=x?await sb.from('todos').update(row).eq('id',x.id):await sb.from('todos').insert(row);
      if(r.error){e.target.disabled=false;return er.textContent='Не получилось: '+r.error.message}
      if(d)S.pl.sel=d;close(false);planView()};
    box.querySelector('#pl_x')?.addEventListener('click',async()=>{if(!confirm('Удалить запись?'))return;const r=await sb.from('todos').delete().eq('id',x.id);if(r.error)return alert(r.error.message);close(false);planView()});
  },()=>planView());
}
VIEWS.todo=planView;
