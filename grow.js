// «Первая неделя» (чек-лист новичка), наставники и вопросы наставнику, благодарности и «Молодцы недели»
const ONB_TPL=[
 ['Познакомиться с наставником и командой','Спроси, как к нему обращаться и где его искать на смене',null],
 ['Пройти вводный инструктаж по технике безопасности','Подпись в журнале у руководителя',null],
 ['Подписать журналы и документы',null,null],
 ['Получить форму и бейдж',null,null],
 ['Найти свой график и ротацию в приложении','Вкладки «График» и «Ротации»','sch'],
 ['Прочитать правила парка и стандарт общения','База знаний → Методички','kb'],
 ['Прочитать памятку по своему аттракциону','База знаний → Аттракционы','kb'],
 ['Отработать смену рядом с наставником',null,null],
 ['Пройти обучение-игру в приложении','Настройки → «Пройти обучение-игру ещё раз»','set'],
 ['Задать вопросы наставнику и руководителю','Кнопка «Вопрос наставнику» на этой странице','newbie']
];
const ONB_LINK={sch:'График',kb:'База знаний',set:'Настройки',rot:'Ротации',newbie:'Вопрос',contacts:'Контакты'};
const THX_ST=['💛','🌟','🙌','🔥','🍀','🎈','🦄','🏅','🤝','☀️'];
const THX_PH=['Выручил(а) на смене','Помог(ла) с гостями','Классно провёл(а) мероприятие','Поддержал(а) в трудный момент','Научил(а) новому','Всегда с улыбкой'];
const pplById=id=>(S.dg.people||[]).find(p=>p.id===id);
const nameOf=id=>{const p=pplById(id);return p?shortName(p.full_name):'—'};
const needMig=`<div class="card pad err">⚠️ Раздел заработает после обновления базы: один раз нужно запустить supabase/migration_2026-11-04_notebook_newbie.sql.</div>`;

// ================= ПЕРВАЯ НЕДЕЛЯ =================
async function newbieView(){
  await ensurePeople();
  const me=S.me.id,mgr=isManager();
  const [it,qs,mees,mine,allIt,menPf]=await Promise.all([
    sb.from('onb_items').select('*').eq('user_id',me).order('sort').order('id'),
    sb.from('mentor_q').select('*').order('created_at',{ascending:false}).limit(80),
    sb.from('profiles').select('id,full_name,team,mentor_id').eq('mentor_id',me),
    sb.from('profiles').select('mentor_id').eq('id',me).maybeSingle(),
    mgr?sb.from('onb_items').select('user_id,done'):Promise.resolve({data:[]}),
    mgr?sb.from('profiles').select('id,mentor_id').not('mentor_id','is',null):Promise.resolve({data:[]})]);
  let h=head('🌱 Первая неделя','Чек-лист новичка, наставник и вопросы');
  if(it.error||mine.error)return app.innerHTML=h+needMig;
  const items=it.data||[],mentor=pplById(mine.data?.mentor_id),done=items.filter(x=>x.done).length;
  const myQ=(qs.data||[]).filter(x=>x.user_id===me),mentees=mees.data||[];
  const incoming=(qs.data||[]).filter(x=>x.user_id!==me&&(x.mentor_id===me||(mgr&&!x.mentor_id)));
  const isNew=items.length>0||!!mentor;

  // --- мой наставник и вопрос
  if(isNew||!mgr&&!mentees.length)h+=`<div class="card pad col"><b>🤝 ${mentor?'Твой наставник':'Наставник'}</b>${mentor?`<div style="display:flex;gap:12px;align-items:center">${av(mentor,52)}<div style="flex:1;min-width:0"><b>${esc(mentor.full_name)}</b><div class="muted">${TN[mentor.team]||''}${mentor.position?' · '+esc(mentor.position):''}</div></div>${mentor.phone?`<a class="btn ghost" style="flex:none;display:flex;align-items:center;text-decoration:none;min-height:44px" href="tel:${esc(mentor.phone)}">📞</a>`:''}</div>`:`<div class="muted">Наставника пока не назначили. Вопрос уйдёт руководителям.</div>`}<button class="btn" id="nb_ask">❓ ${mentor?'Вопрос наставнику':'Задать вопрос'}</button></div>`;

  // --- мой чек-лист
  if(items.length){
    const all=done===items.length;
    h+=`<div class="card pad col"><b>✅ Мой чек-лист · ${done} из ${items.length}</b>${todoBar(done,items.length,1)}${all?`<div class="dremp"><img src="stickers/mascot-balloon.webp" alt="" width="64" height="64"><div><b>Первая неделя пройдена! 🎉</b><div class="muted">Дримми гордится тобой. Дальше будет только интереснее.</div></div></div>`:''}
      ${items.map(x=>`<div class="plw"><div class="plr ${x.done?'dn':''}"><input type="checkbox" data-oi="${x.id}" ${x.done?'checked':''} aria-label="Сделано"><div class="plb"><div><b>${esc(x.title)}</b></div>${x.note?`<div class="muted">${esc(x.note)}</div>`:''}${x.link&&ONB_LINK[x.link]&&!x.done?`<button class="plbtn" data-ol="${x.link}" style="margin-top:6px">Открыть: ${ONB_LINK[x.link]} →</button>`:''}</div></div></div>`).join('')}</div>`;
    h+=`<div class="card pad col"><b>⚡ Быстрые переходы</b><div class="sitel"><a href="#" data-ol="kb">📚 База знаний</a><a href="#" data-ol="sch">📅 Мой график</a><a href="#" data-ol="rot">🔄 Ротации</a><a href="#" data-ol="contacts">📞 Контакты</a></div></div>`;
  }else if(isNew)h+=`<div class="card pad">${dEmpty('any','Руководитель или наставник скоро добавит тебе чек-лист «Первая неделя»')}</div>`;

  // --- мои вопросы
  if(myQ.length)h+=`<div class="card pad col"><b>💬 Мои вопросы</b>${myQ.slice(0,8).map(q=>`<div class="shc"><div class="muted">${ago(q.created_at)}</div><div style="white-space:pre-wrap">${esc(q.body)}</div>${q.answer?`<div style="margin-top:6px;padding:8px 10px;border-radius:12px;background:var(--tab)"><b>${esc(nameOf(q.answered_by))}:</b> <span style="white-space:pre-wrap">${esc(q.answer)}</span></div>`:'<div class="muted">⏳ Ждёт ответа</div>'}</div>`).join('')}</div>`;

  // --- вопросы подопечных
  if(incoming.length){
    const open=incoming.filter(x=>!x.answer),dn=incoming.filter(x=>x.answer).slice(0,4);
    h+=`<div class="card pad col"><b>❓ Вопросы подопечных${open.length?` · ждут ответа: ${open.length}`:''}</b>${open.concat(dn).map(q=>`<div class="shc"><div><b>${esc(nameOf(q.user_id))}</b> <span class="muted">${ago(q.created_at)}</span></div><div style="white-space:pre-wrap">${esc(q.body)}</div>${q.answer?`<div class="muted" style="white-space:pre-wrap;margin-top:6px">Ответ: ${esc(q.answer)}</div>`:`<div class="shnf"><textarea data-qa="${q.id}" placeholder="Ответ"></textarea><button class="btn" data-qs="${q.id}">Ответить</button></div>`}</div>`).join('')}</div>`;
  }

  // --- подопечные и новички
  const prog={};(allIt.data||[]).forEach(r=>{const p=prog[r.user_id]||(prog[r.user_id]={d:0,n:0});p.n++;if(r.done)p.d++});
  const ids=new Set([...(mees.data||[]).map(x=>x.id),...Object.keys(prog),...(menPf.data||[]).map(x=>x.id)]);
  const mentorOf={};(menPf.data||[]).forEach(x=>mentorOf[x.id]=x.mentor_id);(mees.data||[]).forEach(x=>mentorOf[x.id]=me);
  if(mgr||mentees.length){
    const rows=[...ids].map(id=>({id,p:pplById(id),pr:prog[id]})).filter(x=>x.p);
    h+=`<div class="card pad col"><b>${mgr?'👥 Новички и наставники':'🌱 Мои подопечные'}${rows.length?' · '+rows.length:''}</b>${rows.map(x=>`<div class="otr" data-op="${x.id}" style="cursor:pointer;align-items:center"><span style="min-width:0">${esc(x.p.full_name)}<div class="muted">${mentorOf[x.id]?'наставник: '+esc(nameOf(mentorOf[x.id])):'наставника нет'}</div></span><span class="pill" style="background:${x.pr&&x.pr.d===x.pr.n?'#C9D4B0':'#E6CC8F'};color:#3B2A35">${x.pr?x.pr.d+'/'+x.pr.n:'нет чек-листа'}</span></div>`).join('')||dEmpty('any','Пока никого нет')}${mgr?'<button class="btn" id="nb_new">＋ Назначить чек-лист или наставника</button>':''}</div>`;
  }
  if(!isNew&&!mgr&&!mentees.length)h+=`<div class="card pad">${dEmpty('any','Здесь появится чек-лист, когда ты выйдешь на первые смены, а наставники увидят вопросы своих подопечных')}</div>`;
  app.innerHTML=h;

  $('#nb_ask')?.addEventListener('click',()=>mqAsk(mentor));
  $('#nb_new')?.addEventListener('click',()=>onbPick());
  app.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>onbPerson(b.dataset.op));
  app.querySelectorAll('[data-ol]').forEach(b=>b.onclick=e=>{e.preventDefault();go(b.dataset.ol)});
  app.querySelectorAll('[data-oi]').forEach(b=>b.onchange=async()=>{
    const ck=b.checked;if(ck)dwBurstAt(b,14);
    const r=await sb.from('onb_items').update({done:ck,done_at:ck?new Date().toISOString():null}).eq('id',b.dataset.oi);
    if(r.error)return alert(r.error.message);
    const nd=items.filter(x=>x.id==b.dataset.oi?ck:x.done).length;
    if(ck&&nd===items.length){dwParty();toast('🎉 Первая неделя пройдена!',3400)}
    keepScroll(newbieView)});
  app.querySelectorAll('[data-qs]').forEach(b=>b.onclick=async()=>{
    const t=app.querySelector(`[data-qa="${b.dataset.qs}"]`).value.trim();if(!t)return;b.disabled=true;
    const r=await sb.from('mentor_q').update({answer:t,answered_by:me,answered_at:new Date().toISOString()}).eq('id',b.dataset.qs);
    if(r.error){b.disabled=false;return alert(r.error.message)}toast('Ответ отправлен ✅');keepScroll(newbieView)});
}
function mqAsk(mentor){
  dgxSheet('❓ Вопрос наставнику',(box,paint,close)=>{
    box.innerHTML=`<div class="muted">${mentor?'Вопрос получит '+esc(mentor.full_name)+'. Ответ придёт уведомлением.':'Наставника пока нет, вопрос получат руководители. Ответ придёт уведомлением.'}</div>
    <textarea id="mq_t" placeholder="Например: куда ставить ограждение, если пошёл дождь?" maxlength="600" style="min-height:120px"></textarea>
    <div class="plf">${['Как правильно…','Где найти…','Что делать, если…'].map(x=>`<button data-ph="${x}">${x}</button>`).join('')}</div>
    <button class="btn" id="mq_s">Отправить</button><div class="err" id="mq_e"></div>`;
    box.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{const t=box.querySelector('#mq_t');t.value=(t.value?t.value+' ':'')+b.dataset.ph;t.focus()});
    box.querySelector('#mq_s').onclick=async e=>{const t=box.querySelector('#mq_t').value.trim();if(!t)return box.querySelector('#mq_e').textContent='Напиши вопрос';
      e.target.disabled=true;const r=await sb.from('mentor_q').insert({body:t});
      if(r.error){e.target.disabled=false;return box.querySelector('#mq_e').textContent='Не получилось: '+r.error.message}
      toast('Вопрос отправлен ✅');close(false);newbieView()};
  },()=>newbieView());
}
// руководитель: выбрать сотрудника и открыть его окно
function onbPick(){
  dgxSheet('＋ Кому назначить',async(box,paint,close)=>{
    await ensurePeople();
    box.innerHTML=`<div class="muted">Найди сотрудника по имени или фамилии</div>${empSearchHtml(S.dg.people,null)}<div style="min-height:220px"></div>`;
    empSearchBind(box,S.dg.people,id=>{close(false);onbPerson(id)});
  },()=>newbieView());
}
// окно сотрудника: чек-лист, наставник
async function onbPerson(uid){
  await ensurePeople();
  const p=pplById(uid),mgr=isManager();if(!p)return;
  dgxSheet('🌱 '+shortName(p.full_name),async(box,paint,close)=>{
    const [it,pf]=await Promise.all([sb.from('onb_items').select('*').eq('user_id',uid).order('sort').order('id'),sb.from('profiles').select('mentor_id').eq('id',uid).maybeSingle()]);
    const items=it.data||[],mid=pf.data?.mentor_id||'',done=items.filter(x=>x.done).length;
    box.innerHTML=`${mgr?`<label>Наставник<select id="op_m"><option value="">— не назначен —</option>${S.dg.people.filter(x=>x.id!==uid).map(x=>`<option value="${x.id}" ${x.id===mid?'selected':''}>${esc(x.full_name)}</option>`).join('')}</select></label>`:`<div class="muted">Наставник: ${esc(mid?nameOf(mid):'не назначен')}</div>`}
    <b>Чек-лист · ${done} из ${items.length}</b>${items.length?todoBar(done,items.length,1):''}
    ${items.map(x=>`<div class="otr" style="align-items:flex-start"><span style="${x.done?'text-decoration:line-through;color:var(--muted)':''}">${x.done?'✅':'⬜'} ${esc(x.title)}${x.note?`<div class="muted">${esc(x.note)}</div>`:''}</span><button class="x" data-ox="${x.id}" aria-label="Убрать">✕</button></div>`).join('')||'<div class="muted">Чек-листа ещё нет.</div>'}
    <div class="two"><input id="op_t" placeholder="Свой пункт…" style="flex:1"><button class="btn" id="op_a" style="flex:none">＋</button></div>
    ${items.length?'':'<button class="btn" id="op_tpl">📋 Добавить стандартный чек-лист «Первая неделя»</button>'}
    ${items.length&&mgr?'<button class="btn ghost" id="op_clr" style="color:#C0392B">Очистить чек-лист</button>':''}<div class="err" id="op_e"></div>`;
    const re=()=>paint();
    box.querySelector('#op_m')?.addEventListener('change',async e=>{const r=await sb.rpc('set_mentor',{p_user:uid,p_mentor:e.target.value||null});if(r.error)return alert(r.error.message);toast(e.target.value?'Наставник назначен ✅':'Наставник снят')});
    box.querySelectorAll('[data-ox]').forEach(b=>b.onclick=async()=>{await sb.from('onb_items').delete().eq('id',b.dataset.ox);re()});
    const add=async()=>{const t=box.querySelector('#op_t').value.trim();if(!t)return;const r=await sb.from('onb_items').insert({user_id:uid,title:t,sort:items.length+1});if(r.error)return box.querySelector('#op_e').textContent=r.error.message;re()};
    box.querySelector('#op_a').onclick=add;box.querySelector('#op_t').onkeydown=e=>{if(e.key==='Enter')add()};
    box.querySelector('#op_tpl')?.addEventListener('click',async e=>{e.target.disabled=true;
      const r=await sb.from('onb_items').insert(ONB_TPL.map(([title,note,link],i)=>({user_id:uid,title,note,link,sort:i+1})));
      if(r.error){e.target.disabled=false;return box.querySelector('#op_e').textContent=r.error.message}
      await sb.from('notifications').insert({kind:'mentor',title:'🌱 Тебе назначили чек-лист «Первая неделя»',body:'Пройди пункты по порядку, а если появятся вопросы, задай их наставнику.',link:'newbie',to_user:uid}).then(()=>{},()=>{});
      toast('Чек-лист добавлен ✅');re()});
    box.querySelector('#op_clr')?.addEventListener('click',async()=>{if(!confirm('Удалить все пункты чек-листа?'))return;await sb.from('onb_items').delete().eq('user_id',uid);re()});
  },()=>newbieView());
}

// ================= БЛАГОДАРНОСТИ =================
async function thanksView(){
  await ensurePeople();
  const me=S.me.id,wk=Date.now()-7*864e5;
  const r=await sb.from('thanks').select('*').order('created_at',{ascending:false}).limit(150);
  let h=head('💛 Благодарности','Тёплые слова от коллег · стена и «Молодцы недели»');
  if(r.error)return app.innerHTML=h+needMig;
  const rows=r.data||[],week=rows.filter(x=>new Date(x.created_at)>=wk),cnt={};
  week.forEach(x=>cnt[x.to_user]=(cnt[x.to_user]||0)+1);
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3),toMe=rows.filter(x=>x.to_user===me).slice(0,3),mineWk=cnt[me]||0;
  h+=`<button class="btn" id="th_new">💛 Сказать спасибо коллеге</button>`;
  if(toMe.length)h+=`<div class="card pad col" style="background:linear-gradient(120deg,#F5E2A8,#F3C29B);border:0;color:#3B2A35"><b>Тебе сказали спасибо${mineWk?' · за неделю: '+mineWk:''}</b>${toMe.map(x=>`<div>${x.sticker} <b>${gmName(nameOf(x.from_user),gmRowOf({id:x.from_user}),{lv:false})}:</b> ${esc(x.body)}</div>`).join('')}</div>`;
  if(top.length)h+=`<div class="card pad col"><div style="display:flex;gap:12px;align-items:center"><img src="stickers/mascot-balloon.webp" alt="" width="56" height="56"><div><b>🏆 Молодцы недели</b><div class="muted">Кому больше всего сказали спасибо за 7 дней</div></div></div>${top.map(([id,n],i)=>`<div class="otr"><span>${['🥇','🥈','🥉'][i]} <b>${gmName(nameOf(id),gmRowOf({id}))}</b></span><span class="pill" style="background:var(--gold)">${n} 💛</span></div>`).join('')}</div>`;
  h+=`<div class="card pad col"><b>🧱 Стена</b>${rows.slice(0,40).map(x=>`<div class="shc" ${x.to_user===me?'style="background:var(--tab)"':''}><div style="display:flex;justify-content:space-between;gap:8px"><span>${x.sticker} <b>${esc(nameOf(x.from_user))}</b> → <b>${esc(nameOf(x.to_user))}</b></span>${x.from_user===me||isManager()?`<button class="x" data-td="${x.id}" aria-label="Удалить" style="width:28px;height:28px">✕</button>`:''}</div><div style="white-space:pre-wrap">${esc(x.body)}</div><div class="muted">${ago(x.created_at)}</div></div>`).join('')||dEmpty('thanks')}</div>`;
  app.innerHTML=h;
  $('#th_new').onclick=()=>thanksSend();
  app.querySelectorAll('[data-td]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить благодарность?'))return;await sb.from('thanks').delete().eq('id',b.dataset.td);keepScroll(thanksView)});
}
function thanksSend(){
  const f={to:null,st:THX_ST[0]};
  dgxSheet('💛 Сказать спасибо',async(box,paint,close)=>{
    await ensurePeople();const people=S.dg.people.filter(p=>p.id!==S.me.id);
    box.innerHTML=`<label>Кому${empSearchHtml(people,f.to)}</label>
    <label>За что<textarea id="th_t" maxlength="300" placeholder="Например: выручил на Плюще, когда не хватало людей"></textarea></label>
    <div class="plf">${THX_PH.map(x=>`<button data-ph="${x}">${x}</button>`).join('')}</div>
    <div><b style="font-size:14px">Стикер</b><div class="plf hbic" style="margin-top:6px">${THX_ST.map(s=>`<button data-st="${s}" class="${f.st===s?'on':''}">${s}</button>`).join('')}</div></div>
    <button class="btn" id="th_s">Отправить</button><div class="err" id="th_e"></div>`;
    empSearchBind(box,people,id=>{f.to=id;box.querySelector('#empq').value=pplById(id).full_name;box.querySelector('#empl').hidden=true});
    box.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{const t=box.querySelector('#th_t');t.value=(t.value?t.value+'. ':'')+b.dataset.ph;t.focus()});
    box.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{f.st=b.dataset.st;box.querySelectorAll('[data-st]').forEach(z=>z.classList.toggle('on',z===b))});
    box.querySelector('#th_s').onclick=async e=>{const t=box.querySelector('#th_t').value.trim(),er=box.querySelector('#th_e');
      if(!f.to)return er.textContent='Выбери коллегу из списка';if(!t)return er.textContent='Напиши пару слов';
      e.target.disabled=true;const r=await sb.from('thanks').insert({to_user:f.to,body:t,sticker:f.st});
      if(r.error){e.target.disabled=false;return er.textContent='Не получилось: '+r.error.message}
      dwParty();toast('💛 Спасибо отправлено!');if(window.dqFill)dqFill(true);close(false);thanksView()};
  },()=>thanksView());
}
VIEWS.newbie=newbieView;VIEWS.thanks=thanksView;
