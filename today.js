// Главная «Сегодня»: моя смена, отметка выхода, быстрые кнопки, события дня, для руководителей — что требует внимания
async function todayView(){
  const me=S.me.id,t=iso(new Date()),mgr=isManager(),tm=(()=>{const x=new Date(t+'T12:00:00');x.setDate(x.getDate()+1);return iso(x)})(),ym=t.slice(0,7),ms=ym+'-01';
  if(S.rname===undefined){const r=await sb.rpc('my_roster_name');S.rname=r.error?null:(r.data||null)}
  const cnt=(tb,f)=>{let q=sb.from(tb).select('id',{count:'exact',head:true});return f(q).then(r=>r.count||0,()=>0)};
  const [mk,ck,rt,ev,nw,rt2,rq,mm,ot,td]=await Promise.all([
    sb.from('marks').select('kind,note').eq('user_id',me).eq('day',t).maybeSingle(),
    sb.from('checkins').select('at').eq('user_id',me).eq('day',t).maybeSingle(),
    sb.from('rotations').select('data').eq('day',t).maybeSingle(),
    S.ev?Promise.resolve({data:S.ev.filter(e=>e.day===t)}):sb.from('events').select('*').eq('day',t).order('time'),
    sb.from('news').select('id,title,body,created_at,pinned').order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(1),
    sb.from('rotations').select('data').eq('day',tm).maybeSingle(),
    sb.from('requests').select('id,kind,day,day_to,status,created_at').eq('user_id',me).neq('status','cancelled').order('created_at',{ascending:false}).limit(4),
    sb.from('marks').select('day,kind').eq('user_id',me).gte('day',ms).lte('day',ym+'-31'),
    sb.from('overtime').select('hours').eq('user_id',me).gte('day',ms).lte('day',ym+'-31'),
    sb.from('todos').select('done').eq('user_id',me)]);
  let adm=null;
  if(mgr){
    await ensurePeople();
    const [inc,sn,tm,cks]=await Promise.all([cnt('incidents',q=>q.eq('status','new')),cnt('shift_notes',q=>q.eq('day',t)),sb.from('marks').select('user_id').eq('day',t),sb.from('checkins').select('user_id').eq('day',t)]);
    const total=(S.dg.people||[]).length,absent=(tm.data||[]).length;
    adm={inc,sn,total,work:Math.max(0,total-absent),ok:(cks.data||[]).length};
  }
  const rot=rt.data?.data,mine=rot&&window.myShift?myShift(rot):[],K=mk.data&&KINDS[mk.data.kind];
  const b=S.act||{};
  let h=head('Сегодня',dayLabel(t));
  h+=alertCard();h+='<div id="pushbn"></div>';
  h+=`<div class="card pad" style="background:linear-gradient(120deg,#F5E2A8,#F3C29B);border:0"><div style="font-family:Alegreya,Georgia,serif;font-size:19px;line-height:1.3">✨ ${esc(dayPhrase())}</div></div>`;
  // статус дня
  if(K)h+=`<div class="card pad col" style="background:${K[1]}"><b style="font-size:18px">Сегодня у тебя: ${mk.data.kind==='do'?'день отдыха (ДО)':K[2].toLowerCase()}</b>${mk.data.note?`<div class="muted">${esc(mk.data.note)}</div>`:''}</div>`;
  else h+=`<div class="card pad col"><b style="font-size:18px">Сегодня рабочий день</b>${ck.data?`<div class="pill" style="background:#C9D4B0;align-self:flex-start">✅ Выход подтверждён в ${new Date(ck.data.at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}</div>`:`<button class="btn" id="td_ck">☀️ Я на смене</button>`}</div>`;
  h+=myShiftCard(mine,'Сегодня ты стоишь здесь');
  // завтра — когда ротация уже вышла
  const rot2=rt2.data?.data;
  if(rot2&&window.myShift){const m2=myShift(rot2);h+=m2.length?myShiftCard(m2,'Завтра, '+dayLabel(tm)):`<div class="card pad col"><b>🌙 Завтра, ${dayLabel(tm)}</b><div class="muted">Ротация вышла, тебя в ней нет (выходной или не поставили?). Если это ошибка, напиши руководителю.</div></div>`}
  else if(!mgr)h+=`<div class="card pad col"><b>🌙 Завтра</b><div class="muted">Ротация на завтра ещё не вышла: придёт уведомление.</div></div>`;
  // быстрые кнопки
  h+=`<div class="two"><button class="btn ghost" data-go="rot">🔄 Ротация</button><button class="btn ghost" data-go="shift">✅ Смена</button></div><div class="two"><button class="btn ghost" id="td_fix">🛠 Сообщить о поломке</button><button class="btn ghost" data-go="sch">📅 Мой график</button></div>`;
  // мой блокнот
  {const tl=td.data||[],dn=tl.filter(x=>x.done).length;if(tl.length)h+=`<div class="card pad col" data-go="todo" style="cursor:pointer"><b>📝 Мои дела · ${dn} из ${tl.length}</b>${todoBar(dn,tl.length)}</div>`}
  // мои заявки и итоги месяца
  if((rq.data||[]).length)h+=`<div class="card pad col" data-go="req" style="cursor:pointer"><b>📨 Мои заявки</b>${rq.data.map(x=>`<div class="otr"><span>${(REQ_K[x.kind]||['','Заявка'])[0]} ${(REQ_K[x.kind]||['','Заявка'])[1]} · ${dRange(x)}</span><span class="pill" style="background:${(REQ_ST[x.status]||['','#E8DCCB'])[1]}">${(REQ_ST[x.status]||['?'])[0]}</span></div>`).join('')}</div>`;
  {const cnt=k=>(mm.data||[]).filter(x=>x.kind===k).length,hrs=(ot.data||[]).reduce((a,x)=>a+(+x.hours||0),0),dim=new Date(+ym.slice(0,4),+ym.slice(5),0).getDate(),off=(mm.data||[]).length;
   h+=`<div class="card pad col" data-go="sch" style="cursor:pointer"><b>📊 Мой месяц</b><div class="otr"><span>Рабочих дней по графику</span><b>${dim-off} из ${dim}</b></div><div class="otr"><span>Отгулов</span><b>${cnt('otgul')}</b></div><div class="otr"><span>Отпуск / больничный</span><b>${cnt('vac')} / ${cnt('sick')}</b></div><div class="otr"><span>Переработка</span><b>${hrs?hrs+' ч':'—'}</b></div></div>`}
  // руководителям
  if(adm){
    const row=(ic,n,v,k)=>`<div class="otr" data-go="${k}" style="cursor:pointer"><span>${ic} ${n}</span><b${v?' style="color:#C0392B"':''}>${v}</b></div>`;
    h+=`<div class="card pad col"><b>👀 Требует внимания</b>${row('📨','Заявки на рассмотрении',b.req||0,'req')}${row('🛠','Новые поломки',b.fix||0,'fix')}${row('🚨','Новые происшествия',(adm.inc||0),'inc')}${isAdmin()?row('👥','Новые регистрации',S.pending||0,'staff'):''}${row('💬','Комментарии в смене сегодня',(adm.sn||0),'shift')}<div class="otr"><span>☀️ Подтвердили выход</span><b>${adm.ok} из ${adm.work}</b></div></div>`;
  }else if(false){
    h+=`<div class="card pad col" data-go="dg" style="cursor:pointer"><b>📋 Задачи на сегодня и завтра · ${S.due.length}</b>${S.due.slice(0,3).map(x=>`<div class="muted">· ${esc(x.title)}</div>`).join('')}</div>`;
  }
  // события дня
  const evs=ev.data||[];
  if(evs.length)h+=`<div class="card pad col"><b>🎟️ Сегодня в парке</b>${evs.slice(0,5).map(e=>`<div style="display:flex;gap:10px"><b style="width:52px;flex:none">${esc(e.time)}</b><span>${esc(e.title)}<div class="muted">${esc(e.loc||'')}</div></span></div>`).join('')}<button class="btn ghost" data-go="afisha">Вся афиша</button></div>`;
  // новость
  const n=nw.data?.[0];
  if(n)h+=`<div class="card pad col" data-go="news" style="cursor:pointer"><b>📰 ${n.pinned?'📌 ':''}${esc(n.title)}</b><div class="muted" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(n.body||'')}</div></div>`;
  h+=`<button class="btn ghost" id="td_fb" style="min-height:40px;font-size:14px">💡 Предложить идею / что-то сломалось в приложении</button>`;
  app.innerHTML=h;
  $('#td_fb').onclick=()=>fbForm();
  $('#td_alert')?.addEventListener('click',alertSheet);window.pushBanner&&pushBanner();
  app.querySelectorAll('[data-go]').forEach(c=>c.onclick=()=>go(c.dataset.go));
  $('#td_fix').onclick=()=>{go('fix');setTimeout(()=>{if(window.fixForm)fixForm()},350)};
  $('#td_ck')&&($('#td_ck').onclick=async e=>{e.target.disabled=true;const r=await sb.rpc('checkin_confirm');if(r.error){e.target.disabled=false;return alert(r.error.message)}refreshUnread();todayView()});
}
VIEWS.today=todayView;

// ---------- фраза дня ----------
const PHRASES=['Доброе утро! Сегодня обязательно будет хотя бы одна улыбка гостя, и это будет твоя заслуга.','У тебя всё получится: ты уже умеешь больше, чем думаешь.','Ты часть команды, которая дарит детям чудеса. Это очень важно.','Маленькая улыбка на старте дня делает всю смену светлее.','Сегодня хороший день, чтобы сделать кому-то день лучше.','Ты не один: рядом команда, которая всегда подстрахует.','Каждый гость уходит домой с воспоминанием, и в нём есть частичка тебя.','Спокойно, шаг за шагом: всё успеется, и всё получится.','Ты молодец, что выходишь и делаешь парк живым.','Добрые слова ничего не стоят, но дарят очень много. Подари их сегодня.','Сегодня ты создаёшь чьё-то самое тёплое семейное воспоминание.','Улыбнись: у тебя лучшая работа, где люди приходят за радостью.','Даже если день непростой, команда рядом, и вы справитесь вместе.','Спасибо, что ты здесь. Без тебя парк был бы не таким солнечным.','Дыши глубже, шагай увереннее: сегодня твой день.','Ошибаться нормально. Главное — спросить, улыбнуться и пойти дальше.','Твоя забота о гостях видна сразу. Это очень ценят.','Сегодня маленькие победы тоже считаются. Отмечай их!','Пусть сегодня вокруг будет больше смеха, чем суеты.','Ты умеешь удивлять. Покажи это ещё раз!','Один добрый взгляд может поменять настроение целой семьи.','Работать в парке чудес — это уже немного волшебство.','Всё лучшее начинается с хорошего настроения. Начни с него!','Ты справишься с любой очередью, ведь у тебя есть улыбка и команда.','Сегодня светит солнце, даже если за окном дождь: оно у тебя внутри.','Помогая другим, ты делаешь парк по-настоящему семейным.','Гордись собой: ты каждый день делаешь важное дело.','Доверяй себе. Ты уже столько всего освоил(а)!','Любой большой день состоит из маленьких добрых дел.','Пусть этот день принесёт тебе приятные неожиданности.','Команда сильна, когда каждый заботится о другом. Спасибо, что заботишься.','Улыбка заразительна. Заражай ею всех вокруг!','Сегодня можно немного больше радоваться мелочам.','Ты выбрал(а) работу, где можно дарить радость. Это дорогого стоит.','Не торопись: хорошо сделанное дело лучше быстрого.','Каждое «пожалуйста» и «спасибо» превращает смену в праздник.','У тебя отлично получается. Продолжай в том же духе!','Хорошая смена начинается с хорошей командной шутки.','Ты — тот, кого гости запомнят добрым словом.','Новый день — новые чудеса. Найди хотя бы одно!','Всё будет хорошо, а вместе с командой — ещё лучше.','Позаботься о себе тоже: вода, перерыв и тёплое слово себе.','Сегодня ты можешь научиться чему-то новому. Это здорово.','Лучшее украшение парка — доброжелательные люди. Вроде тебя!','Радость, которую ты даёшь, обязательно вернётся к тебе.','Каждая смена — шанс стать чуточку увереннее.','Твоя работа делает чьи-то выходные особенными.','Вместе мы можем всё: от открытия до последнего гостя.','Улыбайся: дети всегда чувствуют, когда им рады.','Хороший день — это когда ты помог и тебе помогли.','Не бойся просить помощи. Это признак сильной команды.','Пусть твой голос звучит спокойно и доброжелательно: так нравится гостям.','Сегодня мир вокруг становится чуточку добрее благодаря тебе.','Ты умеешь быть надёжным. Это редкое и ценное качество.','Начни с маленького шага: остальное придёт само.','Ты вносишь в парк свой цвет, и без него картина была бы беднее.','Секрет хорошей смены простой: улыбка, внимание и командный дух.','Отдыхай, когда положено: уставшая улыбка не так светит.','Пусть на этой неделе у тебя будет много поводов для гордости.','Семья парка Дримвуд — это и ты. Спасибо!'];
const dayPhrase=()=>{const d=new Date(),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/864e5);return PHRASES[(n+d.getFullYear()*7)%PHRASES.length]};
// ---------- Памятка по зоне из базы знаний ----------
document.addEventListener('click',async e=>{const a=e.target.closest('[data-kbz]');if(!a)return;e.preventDefault();
  const z=a.dataset.kbz.replace(/\s+\d+$/,'');const r=await sb.from('kb_pages').select('*').eq('title',z).maybeSingle();
  if(r.data)kbOpen(r.data);else alert('Скоро здесь появится нужная информация по зоне «'+z+'».')});
// ---------- Личный блокнот ----------
const todoBar=(d,n)=>{const p=n?Math.round(d*100/n):0;return `<div style="height:16px;border-radius:10px;background:var(--line);overflow:hidden"><div style="height:100%;width:${p}%;background:linear-gradient(90deg,var(--sage),var(--gold));border-radius:10px;transition:width .4s"></div></div><div class="muted">${p}%${n&&d===n?' · 🎉 Всё сделано, отличная работа!':''}</div>`};
async function todoView(){
  const r=await sb.from('todos').select('*').order('done').order('created_at',{ascending:false});
  const all=r.data||[],dn=all.filter(x=>x.done).length;
  let h=head('Мой блокнот','Личные дела на смену и не только');
  h+=`<div class="card pad col"><b>Выполнено ${dn} из ${all.length}</b>${todoBar(dn,all.length)}</div>`;
  h+=`<div class="two"><input id="td_in" placeholder="Новое дело…" style="flex:1"><button class="btn" id="td_add" style="flex:none">＋</button></div>`;
  h+=`<div class="card pad col">${all.map(x=>`<label class="shi" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" data-t="${x.id}" ${x.done?'checked':''}><span style="flex:1;${x.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(x.body)}</span><button class="x" data-tx="${x.id}" aria-label="Удалить">✕</button></label>`).join('')||'<div class="muted">Дел пока нет. Добавь первое!</div>'}</div>`;
  if(dn)h+=`<button class="btn ghost" id="td_clr">Убрать выполненные</button>`;
  h+=`<div class="muted">🔒 Ваши заметки видите только вы, это конфиденциально. Руководители и администратор их не видят.</div>`;
  app.innerHTML=h;
  const add=async()=>{const t=$('#td_in').value.trim();if(!t)return;const r=await sb.from('todos').insert({body:t});if(r.error)return alert(r.error.message);todoView()};
  $('#td_add').onclick=add;$('#td_in').onkeydown=e=>{if(e.key==='Enter')add()};
  app.querySelectorAll('[data-t]').forEach(b=>b.onchange=async()=>{const r=await sb.from('todos').update({done:b.checked,done_at:b.checked?new Date().toISOString():null}).eq('id',b.dataset.t);if(r.error)alert(r.error.message);keepScroll(todoView)});
  app.querySelectorAll('[data-tx]').forEach(b=>b.onclick=async e=>{e.preventDefault();await sb.from('todos').delete().eq('id',b.dataset.tx);todoView()});
  $('#td_clr')?.addEventListener('click',async()=>{await sb.from('todos').delete().eq('user_id',S.me.id).eq('done',true);todoView()});
}
VIEWS.todo=todoView;
