// «Мой блокнот»: дела с подзадачами, дедлайны и события, привычки со стриками, неделя и месяц с моим графиком и доработками.
// Видит только владелец: руководители и администратор записи не видят.
const PL_K={task:['✅','Дело'],deadline:['⏰','Дедлайн'],event:['📌','Событие']};
const PL_C={task:'#E3C46E',deadline:'#C0392B',event:'#5B8DB8'};
const HB_IC=['💧','🏃','📖','🧘','🍎','😴','🦷','🚶','✍️','🎯','🧹','💊','🎧','🌿'];
const WDN=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const plT=x=>x.due_time?String(x.due_time).slice(0,5)+(x.due_end?'–'+String(x.due_end).slice(0,5):''):'';
const wdOf=d=>(new Date(d+'T12:00:00').getDay()+6)%7+1;
const addD=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return iso(x)};
const wkMon=d=>addD(d,-(wdOf(d)-1));
const fh1=x=>String(Math.round(x*100)/100).replace('.',',');
const plNorm=x=>({kind:'task',due:null,prio:0,tag:null,subs:[],arch:false,...x,subs:Array.isArray(x.subs)?x.subs:[]});

// серия и статистика привычки
function hbStats(h,logs,today){
  const D=new Set(h.days||[1,2,3,4,5,6,7]),start=h.created_at?iso(new Date(h.created_at)):today;
  let cur=0,c=today;
  if(D.has(wdOf(c))&&!logs.has(c))c=addD(c,-1);
  for(let i=0;i<400&&c>=start;i++,c=addD(c,-1)){if(!D.has(wdOf(c)))continue;if(logs.has(c))cur++;else break}
  let best=0,run=0;
  for(let d=start,i=0;d<=today&&i<800;d=addD(d,1),i++){if(!D.has(wdOf(d)))continue;if(logs.has(d)){run++;best=Math.max(best,run)}else if(d<today)run=0}
  let sch=0,ok=0;
  for(let i=0;i<30;i++){const d=addD(today,-i);if(d<start)break;if(!D.has(wdOf(d)))continue;if(logs.has(d)){sch++;ok++}else if(d<today)sch++}
  return {cur,best,pct:sch?Math.round(ok*100/sch):0,D,start};
}
const hbIsDue=(h,k)=>(h.days||[]).includes(wdOf(k))&&k>=iso(new Date(h.created_at||Date.now()));

async function noteView(local){
  const today=iso(new Date());
  const P=S.pl||(S.pl={sel:today,tab:'day',m:new Date(),f:'all'});
  if(!P.sel)P.sel=today;
  const me=S.me.id,ws=wkMon(P.sel),we=addD(ws,6);
  S.offline=0;
  let tq,pb,hq,hl,mk,ot,dnq;
  if(local&&P.raw)({tq,pb,hq,hl,mk,ot,dnq}=P.raw);
  else{
    [,tq,pb,hq,hl,mk,ot,dnq]=await Promise.all([
      loadPeriods().catch(()=>{}),
      sb.from('todos').select('*').eq('user_id',me).order('created_at'),
      sb.from('todos').select('due,prio,tag,subs,arch').limit(1),
      sb.from('habits').select('*').eq('user_id',me).eq('arch',false).order('created_at'),
      sb.from('habit_logs').select('habit_id,day').eq('user_id',me).gte('day',addD(today,-400)),
      sb.from('marks').select('day,kind,note').eq('user_id',me).gte('day',ws).lte('day',we),
      sb.from('overtime').select('*').eq('user_id',me).gte('day',ws).lte('day',we),
      sb.from('day_notes').select('day,body').eq('user_id',me).gte('day',ws).lte('day',we)]);
    P.raw={tq,pb,hq,hl,mk,ot,dnq};
  }
  P.ext=!pb.error;P.hab=!hq.error;
  const every=(tq.data||[]).map(plNorm),all=every.filter(x=>!x.arch),archived=every.filter(x=>x.arch);
  S.plTags=[...new Set(every.map(x=>x.tag).filter(Boolean))].sort();
  const habits=hq.data||[],logsBy={};(hl.data||[]).forEach(r=>(logsBy[r.habit_id]=logsBy[r.habit_id]||new Set()).add(r.day));
  const marks={},otd={},notes={};
  (mk.data||[]).forEach(m=>marks[m.day]=m);(ot.data||[]).forEach(o=>(otd[o.day]=otd[o.day]||[]).push(o));(dnq.data||[]).forEach(d=>notes[d.day]=d.body);
  const over=x=>!x.done&&x.due&&x.due<today;
  const srt=(a,b)=>(a.done-b.done)||(b.prio-a.prio)||String(a.due_time||'99').localeCompare(String(b.due_time||'99'))||String(a.created_at).localeCompare(String(b.created_at));
  const byDay={};all.forEach(x=>{if(x.due)(byDay[x.due]=byDay[x.due]||[]).push(x)});
  const hbDone=(h,k)=>!!(logsBy[h.id]&&logsBy[h.id].has(k));
  const dayItems=k=>{const t=(byDay[k]||[]),hs=habits.filter(h=>hbIsDue(h,k));return {t,hs,tot:t.length+hs.length,dn:t.filter(x=>x.done).length+hs.filter(h=>hbDone(h,k)).length}};

  const subHtml=x=>x.subs.length&&!x.done?`<div class="pls">${x.subs.map((s,i)=>`<label class="chk"><input type="checkbox" data-sb="${x.id}:${i}" ${s.d?'checked':''}><span class="${s.d?'sdn':''}">${esc(s.t)}</span></label>`).join('')}</div>`:'';
  const rowH=(x,showDay)=>{const sd=x.subs.filter(s=>s.d).length;
    return `<div class="plw"><div class="plr ${x.done?'dn':''} ${over(x)?'plo':''}"><input type="checkbox" data-pt="${x.id}" ${x.done?'checked':''} aria-label="Сделано"><div class="plb" data-pe="${x.id}"><div>${x.prio?'⭐ ':''}<span class="plk" style="background:${PL_C[x.kind]||PL_C.task}"></span>${PL_K[x.kind]?.[0]||'✅'} <b>${esc(x.body)}</b></div><div class="muted">${showDay&&x.due?dayLabel(x.due)+(plT(x)?' · ':''):''}${plT(x)}${over(x)?' · просрочено':''}${x.tag?`${showDay&&x.due||plT(x)||over(x)?' · ':''}<span class="tg">#${esc(x.tag)}</span>`:''}${x.subs.length?` · ☑ ${sd}/${x.subs.length}`:''}${x.note?` · ${esc(x.note)}`:''}</div></div></div>${subHtml(x)}</div>`};

  // ---------- шапка: быстрый ввод, неделя, вкладки ----------
  let h=head('Мой блокнот','Дела, привычки и дедлайны · видите только вы');
  if(pb.error)h+=`<div class="card pad err">⚠️ Часть возможностей (подзадачи, важное, теги, привычки) заработает после обновления базы: один раз нужно запустить supabase/migration_2026-11-04_notebook_newbie.sql. Обычные дела работают уже сейчас.</div>`;
  h+=`<div class="two nbq"><input id="nb_q" placeholder="${P.tab==='day'?'Новое дело на '+(P.sel===today?'сегодня':dayLabel(P.sel))+'…':'Новое дело…'}" enterkeyhint="done" autocomplete="off"><button class="btn" id="nb_qa" style="flex:none" aria-label="Добавить">＋</button><button class="btn ghost" id="nb_qm" style="flex:none;padding:0 14px" aria-label="Подробнее">⋯</button></div>`;
  h+=`<div class="wk"><button class="wkn" id="wk_p" aria-label="Прошлая неделя">‹</button><div class="wkd">${Array.from({length:7},(_,i)=>{const k=addD(ws,i),its=(byDay[k]||[]).filter(x=>!x.done),m=marks[k],K=m&&KINDS[m.kind],oo=otd[k]||[];
    return `<button class="wd ${k===P.sel?'sel':''} ${k===today?'tdy':''} ${i>4?'we':''}" data-k="${k}" ${K?`style="background:${K[1]};color:#3B2A35"`:''}><small>${WDN[i]}</small><b>${+k.slice(8)}</b><span class="wdm">${its.slice(0,3).map(x=>`<i class="pld" style="background:${PL_C[x.kind]||PL_C.task}"></i>`).join('')}${oo.length?'<i class="wdo"></i>':''}</span>${K?`<em>${K[0]}</em>`:''}</button>`}).join('')}</div><button class="wkn" id="wk_n" aria-label="Следующая неделя">›</button></div>`;
  h+=`<div class="wkb"><span class="muted">${new Date(P.sel+'T12:00:00').toLocaleDateString('ru',{month:'long',year:'numeric'})}</span><span style="flex:1"></span>${P.sel!==today?'<button class="plbtn" id="wk_t">Сегодня</button>':''}<button class="plbtn" id="wk_m">📆 Месяц</button></div>`;
  h+=`<div class="seg nbt">${[['day',P.sel===today?'☀️ Сегодня':'📅 День'],['hab','🔥 Привычки'],['all','🗂 Все дела']].map(([k,n])=>`<button data-nt="${k}" class="${P.tab===k?'on':''}">${n}</button>`).join('')}</div>`;

  // ---------- вкладка «День» ----------
  if(P.tab==='day'){
    const k=P.sel,m=marks[k],di=dayItems(k),ovr=all.filter(over).sort((a,b)=>a.due.localeCompare(b.due)),isT=k===today;
    h+=`<div class="card pad col"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:17px">${dayLabel(k)}${isT?' · сегодня':''}</b><button class="btn" id="pl_add" style="flex:none;min-height:38px;padding:0 14px">＋ Добавить</button></div>`;
    h+=m?`<div class="pill" style="background:${KINDS[m.kind][1]};color:#3B2A35;align-self:flex-start">${KINDS[m.kind][2]}${m.note?' · '+esc(m.note):''}</div>`:`<div class="muted">🕘 Рабочий день${perLabel(k)?' · '+perLabel(k):''}</div>`;
    (otd[k]||[]).forEach(o=>h+=`<div class="pill" style="background:${OT_K[otKind(o)][2]};color:#3B2A35;align-self:flex-start">${OT_K[otKind(o)][0]} ${OT_K[otKind(o)][1]} +${String(+o.hours).replace('.',',')} ч${o.start_time?' с '+String(o.start_time).slice(0,5):''}${o.note?' · '+esc(o.note):''}</div>`);
    if(notes[k])h+=`<div class="muted">📝 Комментарий руководителям: ${esc(notes[k])}</div>`;
    if(di.tot)h+=`<div class="pgw"><div class="pgt"><span>${di.dn} из ${di.tot}</span><span>${Math.round(di.dn*100/di.tot)}%</span></div>${todoBar(di.dn,di.tot,1)}</div>`;
    h+='</div>';
    if(P.hab&&di.hs.length)h+=`<div class="card pad col"><b>🔥 Привычки</b>${di.hs.map(x=>{const st=hbStats(x,logsBy[x.id]||new Set(),today),dn=hbDone(x,k);return `<div class="hbr"><button class="hbc ${dn?'on':''}" data-hb="${x.id}" data-day="${k}" ${k>today?'disabled':''} aria-label="${esc(x.title)}">${dn?'✓':x.icon}</button><div class="hbx"><b>${esc(x.title)}</b><div class="muted">${st.cur?`🔥 ${st.cur} ${plural(st.cur,'день','дня','дней')} подряд`:'серия начнётся с первой отметки'}</div></div></div>`}).join('')}</div>`;
    if(isT&&ovr.length)h+=`<div class="card pad col" style="border:2px solid #C0392B55"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>⚠️ Просрочено · ${ovr.length}</b><button class="plbtn" id="pl_ov">Перенести на сегодня</button></div>${ovr.map(x=>rowH(x,true)).join('')}</div>`;
    const its=di.t.slice().sort(srt);
    h+=its.length?`<div class="card pad col"><b>${isT?'Дела на сегодня':'Дела на день'} · ${its.length}</b>${its.map(x=>rowH(x,false)).join('')}</div>`:(!di.hs.length&&!(isT&&ovr.length)?`<div class="card pad">${dEmpty(isT?'today':'tasks','Нажми «＋ Добавить» или впиши дело в строку сверху')}</div>`:'');
    if(di.tot&&di.dn===di.tot)h+=`<div class="card pad">${dEmpty('done')}</div>`;
    const soon=all.filter(x=>!x.done&&x.due&&x.due>k&&x.due<=addD(k,7)).sort((a,b)=>a.due.localeCompare(b.due)||srt(a,b));
    if(soon.length)h+=`<div class="card pad col"><b>📆 Ближайшие 7 дней · ${soon.length}</b>${soon.map(x=>rowH(x,true)).join('')}</div>`;
  }
  // ---------- вкладка «Привычки» ----------
  if(P.tab==='hab'){
    if(!P.hab)h+=`<div class="card pad">${dEmpty('any','Привычки заработают после обновления базы')}</div>`;
    else{
      h+=`<button class="btn" id="hb_add">＋ Новая привычка</button>`;
      if(!habits.length)h+=`<div class="card pad">${dEmpty('habits','Например: «выпить воды», «разминка», «записать часы»')}</div>`;
      habits.forEach(x=>{const L=logsBy[x.id]||new Set(),st=hbStats(x,L,today),dn=L.has(today),dueT=hbIsDue(x,today);
        const cells=[];const mon=wkMon(today),from=addD(mon,-28);
        for(let i=0;i<35;i++){const d=addD(from,i);let c='n';if(d>today)c='f';else if(!st.D.has(wdOf(d))||d<st.start)c='o';else if(L.has(d))c='y';else c='m';cells.push(`<i class="hc ${c}${d===today?' t':''}" title="${dayLabel(d)}"></i>`)}
        h+=`<div class="card pad col hbk"><div class="hbr"><button class="hbc ${dn?'on':''}" data-hb="${x.id}" data-day="${today}" ${dueT?'':'disabled'} aria-label="${esc(x.title)}">${dn?'✓':x.icon}</button><div class="hbx"><b>${esc(x.title)}</b><div class="muted">${(x.days||[]).length===7?'каждый день':(x.days||[]).map(d=>WDN[d-1]).join(', ')}${dueT?'':' · сегодня выходной от неё'}</div></div><button class="x" data-he="${x.id}" aria-label="Изменить">⋯</button></div>
          <div class="hbs"><div><b class="cu">${st.cur}</b><small>🔥 серия</small></div><div><b class="cu">${st.best}</b><small>🏆 рекорд</small></div><div><b class="cu">${st.pct}</b><small>% за 30 дней</small></div></div>
          <div class="hbh">${cells.join('')}</div><div class="hbw"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div></div>`});
      h+=`<div class="muted">Отметка одним нажатием. Серия считается только по тем дням недели, которые ты выбрал для привычки.</div>`;
    }
  }
  // ---------- вкладка «Все дела» ----------
  if(P.tab==='all'){
    const nq=t=>String(t||'').toLowerCase().replace(/ё/g,'е'),qt=nq(P.q).split(/\s+/).filter(Boolean);
    const tags=[...new Set(all.map(x=>x.tag).filter(Boolean))].sort();
    const fl=all.filter(x=>{const f=P.f||'all';return (f==='all'||(f==='star'?x.prio:x.kind===f))&&(!P.tg||x.tag===P.tg)&&(!P.hd||!x.done)&&qt.every(w=>nq(x.body+' '+(x.note||'')+' '+(x.tag||'')+' '+x.subs.map(s=>s.t).join(' ')).includes(w))});
    const open=fl.filter(x=>!x.done),dnl=fl.filter(x=>x.done);
    const ovr=open.filter(over).sort((a,b)=>a.due.localeCompare(b.due)),td=open.filter(x=>x.due===today).sort(srt),
      soon=open.filter(x=>x.due&&x.due>today&&x.due<=addD(today,7)).sort((a,b)=>a.due.localeCompare(b.due)||srt(a,b)),
      later=open.filter(x=>x.due&&x.due>addD(today,7)).sort((a,b)=>a.due.localeCompare(b.due)||srt(a,b)),
      und=open.filter(x=>!x.due).sort(srt);
    h+=`<input type="search" id="pl_s" placeholder="🔍 Поиск по делам и тегам" value="${esc(P.q||'')}" autocomplete="off"><div class="plf">${[['all','Все'],['task','✅ Дела'],['deadline','⏰ Дедлайны'],['event','📌 События'],...(P.ext?[['star','⭐ Важные']]:[])].map(([k,v])=>`<button data-pf="${k}" class="${(P.f||'all')===k?'on':''}">${v}</button>`).join('')}<button id="pl_hd" class="${P.hd?'on':''}">${P.hd?'Сделанные скрыты':'Скрыть сделанные'}</button></div>`;
    if(tags.length)h+=`<div class="plf">${tags.map(t=>`<button data-tg="${esc(t)}" class="${P.tg===t?'on':''}">#${esc(t)}</button>`).join('')}</div>`;
    const sec=(t,l,st)=>l.length?`<div class="card pad col" ${st?`style="${st}"`:''}><b>${t} · ${l.length}</b>${l.map(x=>rowH(x,true)).join('')}</div>`:'';
    h+=sec('⚠️ Просрочено',ovr,'border:2px solid #C0392B55')+sec('☀️ Сегодня',td)+sec('📆 Ближайшие 7 дней',soon)+sec('🗓 Позже',later)+sec('📝 Без даты',und);
    if(!open.length)h+=`<div class="card pad">${dEmpty(qt.length||P.tg||(P.f&&P.f!=='all')?'search':(all.length?'done':'tasks'))}</div>`;
    if(dnl.length)h+=`<details class="card pad"><summary style="font-weight:800;cursor:pointer">✔️ Сделано · ${dnl.length}</summary><div class="col">${dnl.slice().sort((a,b)=>String(b.done_at).localeCompare(String(a.done_at))).map(x=>rowH(x,true)).join('')}</div></details>`;
    const dn=all.filter(x=>x.done).length;
    if(all.length)h+=`<div class="card pad col"><b>Выполнено ${dn} из ${all.length}</b>${todoBar(dn,all.length,1)}</div>`;
    if(P.ext&&dn)h+=`<button class="btn ghost" id="pl_arc">📦 Убрать выполненные в архив</button>`;
    if(archived.length)h+=`<details class="card pad"><summary style="font-weight:800;cursor:pointer">📦 Архив · ${archived.length}</summary><div class="col">${archived.map(x=>rowH(x,true)).join('')}<button class="btn ghost" id="pl_clr" style="color:#C0392B">Очистить архив</button></div></details>`;
  }
  h+=`<div class="muted">🔒 Блокнот личный: руководители и администратор его не видят. Выходные, отгулы и доработки подтягиваются из графика.</div>`;
  app.innerHTML=h;

  // ---------- действия ----------
  const rr=()=>keepScroll(noteView),rl=()=>keepScroll(()=>noteView(true));
  const get=id=>every.find(x=>x.id==id);
  const q=$('#nb_q');
  const qadd=async()=>{const t=q.value.trim();if(!t)return;const row={body:t};if(P.tab==='day')row.due=P.sel;const r=await sb.from('todos').insert(row);if(r.error)return alert(r.error.message);toast('Добавлено ✅');if(window.dqPing)dqPing('wtodo');rr()};
  $('#nb_qa').onclick=qadd;q.onkeydown=e=>{if(e.key==='Enter')qadd()};
  $('#nb_qm').onclick=()=>{P.prefill=q.value.trim();plEdit(null,P.tab==='day'?P.sel:null)};
  $('#wk_p').onclick=()=>{P.sel=addD(P.sel,-7);noteView()};$('#wk_n').onclick=()=>{P.sel=addD(P.sel,7);noteView()};
  $('#wk_t')?.addEventListener('click',()=>{P.sel=today;noteView()});$('#wk_m').onclick=()=>{P.m=new Date(P.sel+'T12:00:00');nbMonth()};
  app.querySelectorAll('.wd').forEach(b=>b.onclick=()=>{P.sel=b.dataset.k;if(P.tab!=='day')P.tab='day';rl()});
  app.querySelectorAll('[data-nt]').forEach(b=>b.onclick=()=>{P.tab=b.dataset.nt;rl()});
  $('#pl_add')?.addEventListener('click',()=>plEdit(null,P.sel));
  app.querySelectorAll('[data-pe]').forEach(b=>b.onclick=()=>plEdit(get(b.dataset.pe)));
  const dayDone=()=>{const di=dayItems(P.sel);return di.tot&&di.dn===di.tot};
  app.querySelectorAll('[data-pt]').forEach(b=>b.onchange=async()=>{
    const x=get(b.dataset.pt);if(x)x.done=b.checked;
    const ck=b.checked;if(ck)dwBurstAt(b,14);
    const r=await sb.from('todos').update({done:ck,done_at:ck?new Date().toISOString():null}).eq('id',b.dataset.pt);
    if(r.error)alert(r.error.message);
    else if(ck&&P.tab==='day'&&dayDone()){dwParty();toast('🎉 На этот день всё сделано!')}
    rr()});
  app.querySelectorAll('[data-sb]').forEach(b=>b.onchange=async()=>{
    const [id,i]=b.dataset.sb.split(':'),x=get(id);if(!x)return;const subs=x.subs.map(s=>({...s}));subs[+i].d=b.checked;
    if(b.checked)dwBurstAt(b,8);
    const r=await sb.from('todos').update({subs}).eq('id',id);if(r.error)alert(r.error.message);rr()});
  app.querySelectorAll('[data-hb]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.hb,k=b.dataset.day,on=b.classList.contains('on'),L=logsBy[id]||new Set();
    b.disabled=true;
    const r=on?await sb.from('habit_logs').delete().eq('habit_id',id).eq('day',k):await sb.from('habit_logs').insert({habit_id:id,day:k});
    if(r.error){b.disabled=false;return alert(r.error.message)}
    if(!on){dwBurstAt(b,16);L.add(k);logsBy[id]=L;const hh=habits.find(z=>z.id==id),st=hbStats(hh,L,today);
      if([3,7,14,21,30,60,100].includes(st.cur))toast(`🔥 ${st.cur} ${plural(st.cur,'день','дня','дней')} подряд! Так держать`);
      else if(P.tab==='day'&&dayDone()){dwParty();toast('🎉 На этот день всё сделано!')}}
    if(window.dqFill)dqFill(true);rr()});
  app.querySelectorAll('[data-he]').forEach(b=>b.onclick=()=>hbEdit(habits.find(x=>x.id==b.dataset.he)));
  $('#hb_add')?.addEventListener('click',()=>hbEdit(null));
  $('#pl_ov')?.addEventListener('click',async()=>{const r=await sb.from('todos').update({due:today}).eq('user_id',me).eq('done',false).lt('due',today);if(r.error)return alert(r.error.message);toast('Перенёс на сегодня');rr()});
  {const si=$('#pl_s');if(si)si.oninput=()=>{P.q=si.value;clearTimeout(P.qt);P.qt=setTimeout(()=>{const pos=si.selectionStart;noteView(true).then(()=>{const n=$('#pl_s');if(n){n.focus();n.setSelectionRange(pos,pos)}})},350)}}
  app.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{P.f=b.dataset.pf;rl()});
  app.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{P.tg=P.tg===b.dataset.tg?null:b.dataset.tg;rl()});
  $('#pl_hd')?.addEventListener('click',()=>{P.hd=!P.hd;rl()});
  $('#pl_arc')?.addEventListener('click',async()=>{const r=await sb.from('todos').update({arch:true}).eq('user_id',me).eq('done',true);if(r.error)return alert(r.error.message);toast('Убрано в архив 📦');rr()});
  $('#pl_clr')?.addEventListener('click',async()=>{if(!confirm('Удалить всё из архива насовсем?'))return;await sb.from('todos').delete().eq('user_id',me).eq('arch',true);rr()});
}

// ---------- месяц: календарь с графиком, доработками и итогами часов ----------
function nbMonth(){
  const P=S.pl;
  dgxSheet('📆 Месяц',async(box,paint,close)=>{
    const today=iso(new Date()),m=P.m||new Date(),y=m.getFullYear(),mo=m.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0)),n=new Date(y,mo+1,0).getDate(),lead=(new Date(y,mo,1).getDay()+6)%7,me=S.me.id;
    const [tq,mk,ot,pf]=await Promise.all([
      sb.from('todos').select('id,due,done,kind').eq('user_id',me).gte('due',first).lte('due',last),
      sb.from('marks').select('day,kind').eq('user_id',me).gte('day',first).lte('day',last),
      sb.from('overtime').select('*').eq('user_id',me).gte('day',first).lte('day',last),
      sb.from('profiles').select('day_len,team').eq('id',me).maybeSingle()]);
    try{await loadPeriods()}catch(e){}
    const marks={},otd={},byDay={};(mk.data||[]).forEach(r=>marks[r.day]=r);(ot.data||[]).forEach(o=>(otd[o.day]=otd[o.day]||[]).push(o));(tq.error?[]:tq.data||[]).forEach(x=>(byDay[x.due]=byDay[x.due]||[]).push(x));
    const dl=pf.data?.day_len||null,tm=pf.data?.team,dlen=dl||(tm==='M'?12:10),lenSet=!!dl;
    let wd=0,wH=0,oH=0,dH=0,cO=0,cD=0;for(let d=1;d<=n;d++){const k=iso(new Date(y,mo,d)),mm=marks[k],hh=dayH(k,dlen,lenSet);if(!mm){if(lenSet||!perOf(k)||parkOpen(k)){wd++;wH+=hh}}else if(mm.kind==='otgul'){oH+=hh;cO++}else if(mm.kind==='do'){dH+=hh;cD++}}
    const otK={d:0,p:0};(ot.data||[]).forEach(r=>otK[otKind(r)]+=Number(r.hours));const base=wH+oH-dH;
    let h=`<div class="gmon"><button class="btn ghost" id="nm_p" aria-label="Прошлый месяц">←</button><div class="gmt"><b>${m.toLocaleDateString('ru',{month:'long',year:'numeric'})}</b></div><button class="btn ghost" id="nm_n" aria-label="Следующий месяц">→</button></div>`;
    h+=`<div class="cal">${WDN.map(d=>`<div class="dh">${d}</div>`).join('')}${'<div></div>'.repeat(lead)}`;
    for(let d=1;d<=n;d++){const k=iso(new Date(y,mo,d)),mm=marks[k],K=mm?KINDS[mm.kind]:(!lenSet&&perOf(k)&&!parkOpen(k)?KINDS.off:null),its=byDay[k]||[],oo=otd[k]||[],ob=['d','p'].map(t=>[t,oo.filter(r=>otKind(r)===t).reduce((a,r)=>a+Number(r.hours),0)]).filter(x=>x[1]);
      const dots=its.slice(0,4).map(x=>`<i class="pld ${x.done?'dn':''}" style="background:${PL_C[x.kind]||PL_C.task}"></i>`).join('');
      h+=`<button class="day ${P.sel===k?'sel':''} ${k===today?'tdy':''}" data-k="${k}" style="${K?`background:${K[1]};color:#3B2A35;`:''}">${d}<small>${K?K[0]:''}</small>${ob.map(([t,v])=>`<i class="otm ${t}">${OT_K[t][0]}+${fh1(v)}ч</i>`).join('')}${dots?`<span class="pldw">${dots}</span>`:''}</button>`}
    h+=`</div><div class="stat"><div style="background:var(--gold)"><b>${fh1(base)}</b>часов по графику · ${wd} дн.</div><div style="background:var(--blue)"><b>${fh1(base+otK.d+otK.p)}</b>всего часов</div></div><div class="stat"><div style="background:${OT_K.d[2]};color:#3B2A35"><b>${fh1(otK.d)}</b>⏱ доработки</div><div style="background:${OT_K.p[2]};color:#3B2A35"><b>${fh1(otK.p)}</b>🔥 переработки</div></div>${cO||cD?`<div class="muted">Отгулов: ${cO} · ДО: ${cD}</div>`:''}`;
    h+=`<div class="gleg"><span style="background:#F4C6D0;color:#3B2A35"><b>⏱</b> доработка</span><span style="background:#F3C29B;color:#3B2A35"><b>🔥</b> переработка</span></div><div class="muted">Нажми на день, чтобы открыть его в блокноте.</div>`;
    box.innerHTML=h;
    $('#nm_p').onclick=()=>{P.m=new Date(y,mo-1,1);paint()};$('#nm_n').onclick=()=>{P.m=new Date(y,mo+1,1);paint()};
    box.querySelectorAll('.day').forEach(b=>b.onclick=()=>{P.sel=b.dataset.k;P.tab='day';close(false);noteView()});
  },()=>noteView());
}

// ---------- окно дела ----------
function plEdit(x,day){
  const P=S.pl,ext=P.ext!==false;
  const f=x?{...x,subs:(x.subs||[]).map(s=>({...s}))}:{body:P.prefill||'',kind:'task',due:day||null,due_time:null,due_end:null,note:'',prio:0,tag:'',subs:[]};
  P.prefill='';
  dgxSheet(x?'✏️ Запись':'➕ Новая запись',(box,paint,close)=>{
    const tags=[...new Set((S.plTags||[]).filter(Boolean))];
    box.innerHTML=`<div class="mpick k3">${Object.entries(PL_K).map(([k,v])=>`<button data-pk="${k}" class="${f.kind===k?'on':''}" style="flex:1 1 30%;min-width:0;padding:0 6px;background:${k==='deadline'?'#F3C9C3':k==='event'?'#CFE0EE':'#F5E2A8'};color:#3B2A35"><b>${v[0]}</b> ${v[1]}</button>`).join('')}</div>
    <label>Что <input id="pl_b" value="${esc(f.body)}" placeholder="Например: сдать отчёт, заказать форму"></label>
    <label>Дата <input type="date" id="pl_d" value="${f.due||''}"></label>
    <div class="plf"><button data-qd="0">Сегодня</button><button data-qd="1">Завтра</button><button data-qd="7">Через неделю</button><button data-qd="x">Без даты</button></div>
    <div class="two"><label>С <input type="time" id="pl_t" value="${f.due_time?String(f.due_time).slice(0,5):''}"></label><label>До <input type="time" id="pl_e" value="${f.due_end?String(f.due_end).slice(0,5):''}"></label></div>
    ${ext?`<div class="plf"><button id="pl_star" class="${f.prio?'on':''}">⭐ Важное</button></div>
    <label>Тег <input id="pl_g" list="pl_tl" maxlength="24" value="${esc(f.tag||'')}" placeholder="работа, дом, учёба…" autocomplete="off"><datalist id="pl_tl">${tags.map(t=>`<option value="${esc(t)}">`).join('')}</datalist></label>
    <div><b style="font-size:14px">Подзадачи</b><div id="pl_sl" class="col" style="margin-top:6px"></div><button class="plbtn" id="pl_sa" style="margin-top:6px">＋ Подзадача</button></div>`:''}
    ${x?'':`<div class="two"><label>Повторять <select id="pl_r"><option value="">не повторять</option><option value="1">каждый день</option><option value="w">по будням</option><option value="7">каждую неделю</option><option value="m">каждый месяц</option></select></label><label>Сколько раз <input type="number" id="pl_rc" min="2" max="60" value="5"></label></div>`}
    <label>Заметка <textarea id="pl_n" placeholder="Детали (необязательно)">${esc(f.note||'')}</textarea></label>
    <button class="btn" id="pl_s">Сохранить</button>
    ${x?`<div class="two"><button class="btn ghost" id="pl_tm">⏭ На завтра</button>${ext?`<button class="btn ghost" id="pl_ar">${x.arch?'↩ Из архива':'📦 В архив'}</button>`:''}</div><button class="btn ghost" id="pl_x" style="color:#C0392B">Удалить</button>`:''}<div class="err" id="pl_er"></div>`;
    const sl=box.querySelector('#pl_sl');
    const drawSubs=focusLast=>{if(!sl)return;sl.innerHTML=f.subs.map((s,i)=>`<div class="sbr"><input type="checkbox" data-sd="${i}" ${s.d?'checked':''} aria-label="Сделано"><input data-si="${i}" value="${esc(s.t)}" placeholder="Что сделать" maxlength="120"><button class="x" data-sx="${i}" aria-label="Убрать">✕</button></div>`).join('');
      sl.querySelectorAll('[data-sd]').forEach(c=>c.onchange=()=>{f.subs[+c.dataset.sd].d=c.checked});
      sl.querySelectorAll('[data-si]').forEach(c=>{c.oninput=()=>{f.subs[+c.dataset.si].t=c.value};c.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();f.subs.push({t:'',d:false});drawSubs(true)}}});
      sl.querySelectorAll('[data-sx]').forEach(c=>c.onclick=()=>{f.subs.splice(+c.dataset.sx,1);drawSubs()});
      if(focusLast){const l=sl.querySelectorAll('[data-si]');l[l.length-1]?.focus()}};
    drawSubs();
    box.querySelector('#pl_sa')?.addEventListener('click',()=>{f.subs.push({t:'',d:false});drawSubs(true)});
    box.querySelector('#pl_star')?.addEventListener('click',e=>{f.prio=f.prio?0:1;e.currentTarget.classList.toggle('on',!!f.prio)});
    box.querySelectorAll('[data-qd]').forEach(b=>b.onclick=()=>{const v=b.dataset.qd,d=box.querySelector('#pl_d');if(v==='x')d.value='';else{const t=new Date();t.setDate(t.getDate()+(+v));d.value=iso(t)}});
    box.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{f.kind=b.dataset.pk;box.querySelectorAll('[data-pk]').forEach(z=>z.classList.toggle('on',z===b))});
    box.querySelector('#pl_s').onclick=async e=>{
      const body=box.querySelector('#pl_b').value.trim(),er=box.querySelector('#pl_er');
      if(!body)return er.textContent='Напиши, что нужно сделать';
      const d=box.querySelector('#pl_d').value||null,t=box.querySelector('#pl_t').value||null,en=box.querySelector('#pl_e').value||null;
      if(en&&!t)return er.textContent='Укажи время начала';
      if(t&&en&&en<t)return er.textContent='Конец раньше начала';
      if((t||f.kind==='deadline')&&!d)return er.textContent='Укажи дату';
      const row={body,kind:f.kind,due:d,due_time:t,due_end:en,note:box.querySelector('#pl_n').value.trim()||null};
      if(ext){row.prio=f.prio?1:0;row.tag=(box.querySelector('#pl_g').value||'').trim().replace(/^#/,'')||null;row.subs=f.subs.filter(s=>String(s.t).trim()).map(s=>({t:String(s.t).trim(),d:!!s.d}))}
      e.target.disabled=true;
      let rows=[row];const rp=box.querySelector('#pl_r')?.value,rc=Math.min(60,Math.max(2,+box.querySelector('#pl_rc')?.value||2));
      if(!x&&rp&&d){rows=[];let cur=d;for(let i=0;i<rc;i++){
        if(rp==='w'){while(wdOf(cur)>5)cur=addD(cur,1)}
        rows.push({...row,due:cur,...(ext?{subs:row.subs.map(s=>({...s,d:false}))}:{})});
        if(rp==='m'){const t0=new Date(d+'T12:00:00');t0.setMonth(t0.getMonth()+i+1);cur=iso(t0)}else cur=addD(cur,rp==='7'?7:1)}}
      const r=x?await sb.from('todos').update(row).eq('id',x.id):await sb.from('todos').insert(rows);
      if(r.error){e.target.disabled=false;return er.textContent='Не получилось: '+r.error.message}
      if(d)S.pl.sel=d;if(!x&&window.dqPing)dqPing('wtodo');toast(x?'Сохранено ✅':rows.length>1?`Добавлено: ${rows.length} ✅`:'Добавлено ✅');close(false);noteView()};
    box.querySelector('#pl_tm')?.addEventListener('click',async()=>{const base=x.due&&x.due>iso(new Date())?x.due:iso(new Date());const nd=addD(base,1);const r=await sb.from('todos').update({due:nd,done:false,done_at:null}).eq('id',x.id);if(r.error)return alert(r.error.message);S.pl.sel=nd;toast('Перенёс на '+dayLabel(nd));close(false);noteView()});
    box.querySelector('#pl_ar')?.addEventListener('click',async()=>{const r=await sb.from('todos').update({arch:!x.arch}).eq('id',x.id);if(r.error)return alert(r.error.message);toast(x.arch?'Вернул из архива':'В архиве 📦');close(false);noteView()});
    box.querySelector('#pl_x')?.addEventListener('click',async()=>{if(!confirm('Удалить запись?'))return;const r=await sb.from('todos').delete().eq('id',x.id);if(r.error)return alert(r.error.message);close(false);noteView()});
  },()=>noteView());
}

// ---------- окно привычки ----------
function hbEdit(x){
  const f=x?{...x,days:[...(x.days||[])]}:{title:'',icon:HB_IC[0],days:[1,2,3,4,5,6,7]};
  dgxSheet(x?'✏️ Привычка':'🔥 Новая привычка',(box,paint,close)=>{
    box.innerHTML=`<label>Название <input id="hb_t" value="${esc(f.title)}" maxlength="60" placeholder="Например: выпить воды, разминка"></label>
    <div><b style="font-size:14px">Значок</b><div class="plf hbic" style="margin-top:6px">${HB_IC.map(i=>`<button data-ic="${i}" class="${f.icon===i?'on':''}">${i}</button>`).join('')}</div></div>
    <div><b style="font-size:14px">В какие дни</b><div class="plf" style="margin-top:6px">${WDN.map((n,i)=>`<button data-dy="${i+1}" class="${f.days.includes(i+1)?'on':''}">${n}</button>`).join('')}</div>
    <div class="plf" style="margin-top:6px"><button data-pr="all">Каждый день</button><button data-pr="wk">По будням</button><button data-pr="we">По выходным</button></div></div>
    <button class="btn" id="hb_s">Сохранить</button>
    ${x?`<button class="btn ghost" id="hb_a">📦 В архив</button><button class="btn ghost" id="hb_x" style="color:#C0392B">Удалить вместе с отметками</button>`:''}<div class="err" id="hb_er"></div>`;
    const mark=()=>{box.querySelectorAll('[data-dy]').forEach(b=>b.classList.toggle('on',f.days.includes(+b.dataset.dy)))};
    box.querySelectorAll('[data-ic]').forEach(b=>b.onclick=()=>{f.icon=b.dataset.ic;box.querySelectorAll('[data-ic]').forEach(z=>z.classList.toggle('on',z===b))});
    box.querySelectorAll('[data-dy]').forEach(b=>b.onclick=()=>{const d=+b.dataset.dy;f.days=f.days.includes(d)?f.days.filter(z=>z!==d):[...f.days,d].sort();mark()});
    box.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>{f.days={all:[1,2,3,4,5,6,7],wk:[1,2,3,4,5],we:[6,7]}[b.dataset.pr];mark()});
    box.querySelector('#hb_s').onclick=async e=>{
      const t=box.querySelector('#hb_t').value.trim(),er=box.querySelector('#hb_er');
      if(!t)return er.textContent='Напиши название';if(!f.days.length)return er.textContent='Выбери хотя бы один день';
      e.target.disabled=true;const row={title:t,icon:f.icon,days:f.days};
      const r=x?await sb.from('habits').update(row).eq('id',x.id):await sb.from('habits').insert(row);
      if(r.error){e.target.disabled=false;return er.textContent='Не получилось: '+r.error.message}
      toast(x?'Сохранено ✅':'Привычка добавлена 🔥');close(false);S.pl.tab='hab';noteView()};
    box.querySelector('#hb_a')?.addEventListener('click',async()=>{await sb.from('habits').update({arch:true}).eq('id',x.id);toast('Убрал в архив 📦');close(false);noteView()});
    box.querySelector('#hb_x')?.addEventListener('click',async()=>{if(!confirm('Удалить привычку и все отметки?'))return;await sb.from('habits').delete().eq('id',x.id);close(false);noteView()});
  },()=>noteView());
}
const plural=(n,a,b,c)=>{n=Math.abs(n)%100;const m=n%10;return n>10&&n<20?c:m>1&&m<5?b:m===1?a:c};
VIEWS.todo=noteView;
