// Заявки (отгулы, обмен сменами), новости, база знаний, контакты, меню «Ещё»
const REQ_K={otgul:['🏖','Отгул'],do:['📌','ДО'],vac:['🌴','Отпуск'],sick:['🤒','Больничный'],swap:['🔄','Обмен сменами']};
const REQ_ST={peer:['Ждём коллегу','#E6CC8F'],pending:['На рассмотрении','#BCC8D6'],approved:['Одобрено','#C9D4B0'],rejected:['Отклонено','#E8B4B8'],cancelled:['Отменено','#E8DCCB']};
const dRange=x=>x.day_to&&x.day_to!==x.day?`${dayLabel(x.day)} — ${dayLabel(x.day_to)}`:dayLabel(x.day);
const dispName=id=>shortName(pname(id));

// ================= ЗАЯВКИ =================
async function reqView(){
  await ensurePeople();
  const r=await sb.from('requests').select('*').order('created_at',{ascending:false}).limit(200);
  const all=r.data||[],me=S.me.id,mgr=canMng();
  const toMe=all.filter(x=>x.status==='peer'&&x.peer_id===me);
  const pend=mgr?all.filter(x=>x.status==='pending'):[];
  const mine=all.filter(x=>x.user_id===me);
  const rest=mgr?all.filter(x=>x.user_id!==me&&x.status!=='pending'&&x.status!=='peer').slice(0,25):[];
  // кто уже отсутствует в эти даты (для решения руководителя)
  const clash={};
  if(pend.length){
    const lo=pend.map(x=>x.day).sort()[0],hi=pend.map(x=>x.day_to||x.day).sort().slice(-1)[0];
    const m=await sb.from('marks').select('user_id,day,kind').in('kind',['otgul','do','sick','vac']).gte('day',lo).lte('day',hi);
    pend.forEach(x=>{const set=new Set();(m.data||[]).forEach(k=>{if(k.user_id!==x.user_id&&k.day>=x.day&&k.day<=(x.day_to||x.day))set.add(k.user_id)});clash[x.id]=[...set]});
  }
  const what=x=>x.kind==='swap'?`<b>${esc(dispName(x.user_id))}</b> ⇄ <b>${esc(dispName(x.peer_id))}</b><div class="muted">${dayLabel(x.day)}: выйдет ${esc(dispName(x.peer_id))} вместо ${esc(dispName(x.user_id))}<br>${dayLabel(x.peer_day)}: выйдет ${esc(dispName(x.user_id))} вместо ${esc(dispName(x.peer_id))}</div>`:`<b>${esc(dispName(x.user_id))}</b> · ${REQ_K[x.kind][0]} ${REQ_K[x.kind][1]}<div class="muted">${dRange(x)}</div>`;
  const stp=x=>`<span class="pill" style="background:${REQ_ST[x.status][1]}">${REQ_ST[x.status][0]}</span>`;
  let h=head('Заявки','Отгулы, ДО, отпуск и обмен сменами')+subBar('ap','req');
  h+='<button class="btn" id="rq_new">➕ Новая заявка</button>';
  if(toMe.length)h+=`<div class="card pad col"><b>⏳ Ждут твоего ответа</b>${toMe.map(x=>`<div class="col" style="border-top:1px solid var(--line);padding-top:10px">${what(x)}${x.note?`<div>${esc(x.note)}</div>`:''}<div class="two"><button class="btn" data-pa="${x.id}" data-ok="1">Согласен</button><button class="btn ghost" data-pa="${x.id}" data-ok="0">Отказаться</button></div></div>`).join('')}</div>`;
  if(mgr)h+=`<div class="card pad col"><b>📋 На рассмотрении · ${pend.length}</b>${pend.map(x=>`<div class="col" data-dcard="${x.id}" style="border-top:1px solid var(--line);padding-top:10px">${what(x)}${apSeenPill('req',x)}${x.note?`<div>${esc(x.note)}</div>`:''}
      ${clash[x.id]?.length?`<div class="pill" style="background:#F3C29B;align-self:flex-start">⚠ В эти даты уже отсутствуют (${clash[x.id].length}): ${esc(clash[x.id].slice(0,4).map(dispName).join(', '))}${clash[x.id].length>4?'…':''}</div>`:'<div class="muted">В эти даты других отсутствующих нет</div>'}
      <details class="apth" data-th="${x.id}"><summary class="muted" style="cursor:pointer">💬 Переписка</summary><div class="col" style="margin-top:8px"></div></details><input data-dn="${x.id}" placeholder="Комментарий (необязательно)"><div class="two"><button class="btn" data-dc="${x.id}" data-ok="1">Одобрить</button><button class="btn ghost" data-dc="${x.id}" data-ok="0">Отклонить</button></div></div>`).join('')||'<div class="muted">Новых заявок нет 👌</div>'}</div>`;
  h+=`<div class="card pad col"><b>📨 Мои заявки</b>${mine.map(x=>`<div class="otr" style="align-items:flex-start"><span>${x.kind==='swap'?`${REQ_K.swap[0]} с ${esc(dispName(x.peer_id))}: ${dayLabel(x.day)} ↔ ${dayLabel(x.peer_day)}`:`${REQ_K[x.kind][0]} ${REQ_K[x.kind][1]} · ${dRange(x)}`}${x.decision_note?`<br><span class="muted">${esc(x.decision_note)}</span>`:''}<br>${stp(x)} ${apSeenPill('req',x)}<details class="apth" data-th="${x.id}"><summary class="muted" style="cursor:pointer">💬 Переписка</summary><div class="col" style="margin-top:8px"></div></details></span>${['peer','pending'].includes(x.status)?`<button class="btn ghost" data-cn="${x.id}" style="min-height:36px;padding:0 12px">Отменить</button>`:''}</div>`).join('')||'<div class="muted">Ты пока ничего не подавал(а).</div>'}</div>`;
  if(rest.length)h+=`<details class="card pad"><summary style="font-weight:800;cursor:pointer">🗂 Недавние решения · ${rest.length}</summary>${rest.map(x=>`<div class="otr" style="align-items:flex-start"><span>${what(x)}${stp(x)}</span></div>`).join('')}</details>`;
  app.innerHTML=h;
  $('#rq_new').onclick=reqForm;
  apWatch('req',all,'[data-dcard]','data-dcard');
  app.querySelectorAll('.apth').forEach(d=>d.addEventListener('toggle',()=>{if(d.open&&!d.dataset.l){d.dataset.l=1;apThread(d.querySelector('div'),'req',d.dataset.th)}}));
  const call=async(fn,args)=>{const r=await sb.rpc(fn,args);if(r.error)alert(r.error.message);reqView().then(refreshUnread)};
  app.querySelectorAll('[data-pa]').forEach(b=>b.onclick=()=>call('peer_answer',{p_id:b.dataset.pa,p_ok:b.dataset.ok==='1'}));
  app.querySelectorAll('[data-dc]').forEach(b=>b.onclick=()=>call('decide_request',{p_id:b.dataset.dc,p_ok:b.dataset.ok==='1',p_note:app.querySelector(`[data-dn="${b.dataset.dc}"]`).value||null}));
  app.querySelectorAll('[data-cn]').forEach(b=>b.onclick=async()=>{if(!confirm('Отменить заявку?'))return;const r=await sb.from('requests').update({status:'cancelled'}).eq('id',b.dataset.cn);if(r.error)alert(r.error.message);reqView().then(refreshUnread)});
}
function reqForm(){
  const today=iso(new Date());
  const f={kind:'otgul',day:'',day_to:'',peer_id:'',peer_day:'',note:''};
  dgxSheet('📨 Новая заявка',(box,paint,close)=>{
    const people=S.dg.people.filter(p=>p.id!==S.me.id);
    const sw=f.kind==='swap';
    box.innerHTML=`<div class="seg">${Object.entries(REQ_K).map(([k,v])=>`<button data-k="${k}" class="${f.kind===k?'on':''}" style="font-size:13px">${v[0]}<br>${v[1]}</button>`).join('')}</div>
    ${sw?`<label>Коллега<select id="q_peer"><option value="">— выбери —</option>${people.map(p=>`<option value="${p.id}" ${p.id===f.peer_id?'selected':''}>${esc(p.full_name)}</option>`).join('')}</select></label>
      <label>Мой день, когда выйдет коллега<input id="q_day" type="date" min="${today}" value="${f.day}"></label>
      <label>День коллеги, когда выйду я<input id="q_pday" type="date" min="${today}" value="${f.peer_day}"></label>
      <div class="muted">Сначала коллега должен согласиться, потом заявку одобрит руководитель, и график обновится сам.</div>`
    :`<div class="two"><label>С какого дня<input id="q_day" type="date" min="${today}" value="${f.day}"></label><label>По (если несколько дней)<input id="q_to" type="date" min="${today}" value="${f.day_to}"></label></div>`}
    <label>Комментарий<input id="q_note" value="${esc(f.note)}" placeholder="Причина, пожелания"></label>
    <button class="btn" id="q_go">Отправить</button><div class="err" id="q_er"></div>`;
    const read=()=>{f.day=box.querySelector('#q_day').value;f.note=box.querySelector('#q_note').value;if(sw){f.peer_id=box.querySelector('#q_peer').value;f.peer_day=box.querySelector('#q_pday').value}else f.day_to=box.querySelector('#q_to').value};
    box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{read();f.kind=b.dataset.k;paint()});
    box.querySelector('#q_go').onclick=async e=>{
      read();const er=box.querySelector('#q_er');
      if(!f.day)return er.textContent='Укажи дату';
      if(sw){if(!f.peer_id)return er.textContent='Выбери коллегу';if(!f.peer_day)return er.textContent='Укажи день коллеги';if(f.day===f.peer_day)return er.textContent='Даты должны быть разными'}
      else if(f.day_to&&f.day_to<f.day)return er.textContent='Конец раньше начала';
      e.target.disabled=true;
      const row={kind:f.kind,day:f.day,note:f.note.trim()||null,status:sw?'peer':'pending'};
      if(sw){row.peer_id=f.peer_id;row.peer_day=f.peer_day}else if(f.day_to&&f.day_to!==f.day)row.day_to=f.day_to;
      const r=await sb.from('requests').insert(row);
      if(r.error){e.target.disabled=false;return er.textContent='Не получилось: '+r.error.message}
      close(false);reqView().then(refreshUnread);
    };
  },()=>{if(onTab('req'))reqView()});
}

// ================= НОВОСТИ =================
async function newsView(){
  await ensurePeople();
  const [n,a]=await Promise.all([sb.from('news').select('*').order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(60),sb.from('news_acks').select('*')]);
  const mgr=isManager(),list=n.data||[],acks=a.data||[],me=S.me.id,total=S.dg.people.length;
  let h=head('Новости','Что нового в парке')+subBar('park','news');
  if(mgr)h+='<button class="btn" id="nw_new">➕ Опубликовать новость</button>';
  h+=list.map(x=>{
    const ack=acks.filter(k=>k.news_id===x.id),mine=ack.find(k=>k.user_id===me),lg=(x.body||'').length>240;
    return `<div class="card pad col" style="${x.pinned?'border-color:var(--ink)':''}"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:17px">${x.pinned?'📌 ':''}${esc(x.title)}</b>${mgr?`<button class="x" data-ne="${x.id}" aria-label="Править">✏️</button>`:''}</div>
      <div class="muted">${ago(x.created_at)}</div><div class="nbody ${lg?'cl':''}">${esc(x.body)}</div>${lg?'<a href="#" class="more" style="font-weight:700;color:var(--ink)">читать полностью</a>':''}
      ${x.require_ack?(mgr?`<div class="pill" style="background:#F3C29B;align-self:flex-start">❗ Нужно ознакомиться · ${ack.length} из ${total}</div><div class="two"><button class="btn ghost" data-who="${x.id}" style="min-height:40px">Кто не ознакомился</button><button class="btn ghost" data-rm="${x.id}" style="min-height:40px">🔔 Напомнить</button></div><div class="muted" id="who_${x.id}" hidden></div>`
        :(mine?`<div class="pill" style="background:#C9D4B0;align-self:flex-start">✅ Ты ознакомился(ась)</div>`:`<button class="btn" data-ak="${x.id}">✔ Ознакомлен(а)</button>`)):''}</div>`}).join('')||'<div class="card pad muted">Новостей пока нет.</div>';
  app.innerHTML=h;
  app.querySelectorAll('.more').forEach(a=>a.onclick=e=>{e.preventDefault();a.previousElementSibling.classList.remove('cl');a.remove()});
  $('#nw_new')?.addEventListener('click',()=>newsForm());
  app.querySelectorAll('[data-ne]').forEach(b=>b.onclick=()=>newsForm(list.find(x=>x.id==b.dataset.ne)));
  app.querySelectorAll('[data-ak]').forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await sb.from('news_acks').insert({news_id:+b.dataset.ak});if(r.error&&r.error.code!=='23505')alert(r.error.message);keepScroll(newsView)});
  app.querySelectorAll('[data-who]').forEach(b=>b.onclick=()=>{const id=+b.dataset.who,got=new Set(acks.filter(k=>k.news_id===id).map(k=>k.user_id)),miss=S.dg.people.filter(p=>!got.has(p.id)).map(p=>p.full_name);const el=$('#who_'+id);el.hidden=!el.hidden;el.textContent=miss.length?'Не ознакомились ('+miss.length+'): '+miss.join(', '):'Все ознакомились 🎉'});
  app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(!confirm('Отправить напоминание всем, кто ещё не ознакомился?'))return;const r=await sb.rpc('remind_news',{p_id:+b.dataset.rm});alert(r.error?r.error.message:'Напоминание отправлено: '+r.data+' чел.')});
}
function newsForm(x){
  const f=x?{...x}:{title:'',body:'',pinned:false,require_ack:false};
  dgxSheet(x?'✏️ Новость':'📰 Новая новость',(box,paint,close)=>{
    box.innerHTML=`<label>Заголовок<input id="w_t" value="${esc(f.title)}"></label><label>Текст<textarea id="w_b" style="min-height:160px">${esc(f.body)}</textarea></label>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="w_p" ${f.pinned?'checked':''} style="width:24px;min-height:24px"> Закрепить сверху</label>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="w_a" ${f.require_ack?'checked':''} ${x?'disabled':''} style="width:24px;min-height:24px"> Нужно подтверждение «Ознакомлен(а)»</label>
    ${x?'':'<div class="muted">Новость придёт всем уведомлением в 🔔.</div>'}
    <button class="btn" id="w_sv">${x?'Сохранить':'Опубликовать'}</button>${x?'<button class="btn ghost" id="w_dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить новость</button>':''}<div class="err" id="w_er"></div>`;
    box.querySelector('#w_sv').onclick=async()=>{
      const row={title:box.querySelector('#w_t').value.trim(),body:box.querySelector('#w_b').value.trim(),pinned:box.querySelector('#w_p').checked};
      if(!x)row.require_ack=box.querySelector('#w_a').checked;
      if(!row.title||!row.body)return box.querySelector('#w_er').textContent='Заполни заголовок и текст';
      const r=x?await sb.from('news').update(row).eq('id',x.id):await sb.from('news').insert(row);
      if(r.error)return box.querySelector('#w_er').textContent=r.error.message;close()};
    box.querySelector('#w_dl')?.addEventListener('click',async()=>{if(!confirm('Удалить новость?'))return;await sb.from('news').delete().eq('id',x.id);close()});
  },()=>{if(onTab('news'))newsView()});
}

// ================= БАЗА ЗНАНИЙ =================
S.kb={q:'',cat:'all'};
function md(src){
  const e=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  let out='',ul=false;const cl=()=>{if(ul){out+='</ul>';ul=false}};
  for(const raw of String(src||'').split('\n')){
    const l=raw.trimEnd();
    if(/^\s*[-*]\s+/.test(l)){if(!ul){out+='<ul>';ul=true}out+='<li>'+e(l.replace(/^\s*[-*]\s+/,''))+'</li>';continue}
    cl();
    if(/^##?#?\s/.test(l)){const n=l.match(/^#+/)[0].length;out+=(n===1?'<h2>':'<h3>')+e(l.replace(/^#+\s/,''))+(n===1?'</h2>':'</h3>')}
    else if(!l.trim())out+='<div style="height:8px"></div>';else out+='<p>'+e(l)+'</p>';
  }
  cl();return out;
}
async function kbView(){
  const r=await sb.from('kb_pages').select('*').order('pinned',{ascending:false}).order('title');
  const all=r.data||[],cats=[...new Set(all.map(p=>p.category))].sort(),mgr=isManager();
  const q=S.kb.q.trim().toLowerCase(),list=all.filter(p=>(S.kb.cat==='all'||p.category===S.kb.cat)&&(!q||(p.title+' '+p.body+' '+p.category).toLowerCase().includes(q)));
  let h=head('База знаний','Регламенты, инструкции и подсказки');
  h+=`<input id="kb_q" type="search" placeholder="🔍 Поиск по базе" value="${esc(S.kb.q)}">`;
  h+=`<div class="tabs"><button data-c="all" class="${S.kb.cat==='all'?'on':''}" style="background:var(--tab)">Все</button>${cats.map(c=>`<button data-c="${esc(c)}" class="${S.kb.cat===c?'on':''}" style="background:var(--tab)">${esc(c)}</button>`).join('')}</div>`;
  if(mgr)h+='<button class="btn" id="kb_new">➕ Новая страница</button>';
  h+=`<div id="kb_list" class="kbl">${kbGroups(list,!!q)||'<div class="card pad muted">Ничего не найдено.</div>'}</div>`;
  app.innerHTML=h;
  $('#kb_q').oninput=e=>{S.kb.q=e.target.value;const qq=S.kb.q.trim().toLowerCase();const l2=all.filter(p=>(S.kb.cat==='all'||p.category===S.kb.cat)&&(!qq||(p.title+' '+p.body+' '+p.category).toLowerCase().includes(qq)));$('#kb_list').innerHTML=kbGroups(l2,!!qq)||'<div class="card pad muted">Ничего не найдено.</div>';bindAreas($('#kb_list'));kbBind(all)};
  app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{S.kb.cat=b.dataset.c;kbView()});
  $('#kb_new')?.addEventListener('click',()=>kbEdit());
  bindAreas(app);kbBind(all);
}
const kbGroups=(list,open)=>{
  const att=list.filter(p=>p.category==='Аттракционы'),oth=list.filter(p=>p.category!=='Аттракционы');
  return oth.map(kbCard).join('')+byArea(att,p=>p.title).map(({a,items})=>`<details class="area" data-ar="kb${a.k}" ${open||S.areaOpen['kb'+a.k]?'open':''}>${areaHead(a,items.length+' '+(items.length===1?'страница':'стр.'))}<div class="ab" style="background:${a.d}">${items.map(kbCard).join('')}</div></details>`).join('');
};
const kbCard=p=>`<div class="card pad col" data-kb="${p.id}" style="cursor:pointer"><div style="display:flex;justify-content:space-between;gap:8px"><b>${p.pinned?'📌 ':''}${esc(p.title)}</b><span class="pill" style="background:var(--tab)">${esc(p.category)}</span></div><div class="muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.body.replace(/[#*\[\]]/g,'').slice(0,160))}</div></div>`;
function kbBind(all){app.querySelectorAll('[data-kb]').forEach(b=>b.onclick=()=>kbOpen(all.find(x=>x.id==b.dataset.kb)))}
function kbOpen(p){
  dgxSheet(esc(p.title),(box,paint,close)=>{
    box.innerHTML=`<div class="kbbody">${md(p.body)}</div><div class="muted">${esc(p.category)} · обновлено ${ago(p.updated_at)}</div>${isManager()?'<button class="btn ghost" id="kb_e">✏️ Править</button>':''}`;
    box.querySelector('#kb_e')?.addEventListener('click',()=>{close(false);kbEdit(p)});
  },()=>{if(S.tab==='kb')kbView()});
}
function kbEdit(p){
  const f=p?{...p}:{title:'',category:'Общее',body:'',pinned:false};
  dgxSheet(p?'✏️ Страница':'📚 Новая страница',async(box,paint,close)=>{
    const cats=[...new Set(((await sb.from('kb_pages').select('category')).data||[]).map(x=>x.category))];
    box.innerHTML=`<label>Название<input id="k_t" value="${esc(f.title)}"></label>
    <label>Раздел<input id="k_c" list="k_cl" value="${esc(f.category)}"><datalist id="k_cl">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></label>
    <label>Текст<textarea id="k_b" style="min-height:260px">${esc(f.body)}</textarea></label>
    <div class="muted"># Заголовок · **жирный** · - пункт списка · [текст](https://ссылка)</div>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="k_p" ${f.pinned?'checked':''} style="width:24px;min-height:24px"> Закрепить сверху</label>
    <button class="btn" id="k_sv">Сохранить</button>${p?'<button class="btn ghost" id="k_dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить страницу</button>':''}<div class="err" id="k_er"></div>`;
    box.querySelector('#k_sv').onclick=async()=>{
      const row={title:box.querySelector('#k_t').value.trim(),category:box.querySelector('#k_c').value.trim()||'Общее',body:box.querySelector('#k_b').value,pinned:box.querySelector('#k_p').checked};
      if(!row.title)return box.querySelector('#k_er').textContent='Введи название';
      const r=p?await sb.from('kb_pages').update(row).eq('id',p.id):await sb.from('kb_pages').insert(row);
      if(r.error)return box.querySelector('#k_er').textContent=r.error.message;close()};
    box.querySelector('#k_dl')?.addEventListener('click',async()=>{if(!confirm('Удалить страницу?'))return;await sb.from('kb_pages').delete().eq('id',p.id);close()});
  },()=>{if(S.tab==='kb')kbView()});
}

// ================= КОНТАКТЫ =================
S.ct={q:''};
async function contactsView(){
  await ensurePeople(true);
  const ppl=S.dg.people;
  let h=head('Контакты','Телефоны команды')+subBar('team','contacts');
  h+=`<input id="ct_q" type="search" placeholder="🔍 Поиск по имени" value="${esc(S.ct.q)}"><div id="ct_list"></div>`;
  app.innerHTML=h;
  const draw=()=>{
    const q=S.ct.q.trim().toLowerCase(),rows=ppl.filter(p=>!q||(p.full_name||'').toLowerCase().includes(q));
    const groups=[...Object.keys(TN),''].map(t=>[t,rows.filter(p=>(p.team||'')===t)]).filter(g=>g[1].length);
    $('#ct_list').innerHTML=groups.map(([t,g])=>`<div class="card"><div class="zh" style="background:var(--tab)">${t?TN[t]:'Руководство и остальные'} · ${g.length}</div>${g.map(p=>`<div class="otr" style="padding:10px 16px"><span><b>${esc(p.full_name||'?')}</b>${p.position?` <span class="sr">${esc(p.position)}</span>`:(['manager','admin'].includes(p.role)?' <span class="sr">Руководитель</span>':'')}${p.tab_no?`<br><span class="muted">таб. № ${esc(p.tab_no)}</span>`:''}</span>${p.phone?`<a class="btn" style="display:flex;align-items:center;text-decoration:none;min-height:40px;padding:0 14px" href="tel:${esc(p.phone.replace(/[^\d+]/g,''))}">📞 ${esc(p.phone)}</a>`:'<span class="muted">нет номера</span>'}</div>`).join('')}</div>`).join('')||'<div class="card pad muted">Никого не нашли.</div>';
  };
  draw();
  $('#ct_q').oninput=e=>{S.ct.q=e.target.value;draw()};
}

// ================= МЕНЮ «ЕЩЁ» (телефон) =================
function moreView(){
  const mgr=isManager(),b=S.badges||{};
  const items=[['shift','✅','Смена','Открытие и закрытие: чек-листы зон'],['park','📰','Парк','Новости и афиша событий'],['kb','📚','База знаний','Регламенты и инструкции'],['team','👥','Команда','Телефоны'+(isAdmin()?', заявки на регистрацию, роли':'')],
    ...(canMng()&&VIEWS.grid?[['grid','📆','График и сводка','Все сотрудники по дням, часы и переработки, Excel']]:[]),['todo','📝','Мой блокнот','Личные дела, видите только вы'],['feedback','💡','Обратная связь',isAdmin()?'Идеи и сообщения от сотрудников':'Предложить идею или сообщить, что что-то не работает'],['set','⚙️','Настройки','Телефон, пароль, уведомления, оформление']];
  app.innerHTML=head('Ещё','Все разделы приложения')+items.map(([k,ic,n,d])=>`<div class="card pad" data-go="${k}" style="display:flex;gap:14px;align-items:center;cursor:pointer"><span style="font-size:28px">${ic}</span><span style="flex:1"><b style="font-size:16px">${n}</b><div class="muted">${d}</div></span>${b[k]?`<span class="pill" style="background:#C0392B;color:#fff;align-self:center">${b[k]}</span>`:''}</div>`).join('');
  app.querySelectorAll('[data-go]').forEach(c=>c.onclick=()=>go(c.dataset.go));
}

VIEWS.req=reqView;VIEWS.news=newsView;VIEWS.kb=kbView;VIEWS.contacts=contactsView;VIEWS.more=moreView;
