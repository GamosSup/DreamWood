// Главная «Сегодня»: моя смена, отметка выхода, быстрые кнопки, события дня, для руководителей — что требует внимания
async function todayView(){
  const me=S.me.id,t=iso(new Date()),mgr=isManager(),tm=(()=>{const x=new Date(t+'T12:00:00');x.setDate(x.getDate()+1);return iso(x)})(),ym=t.slice(0,7),ms=ym+'-01';
  const rnameP=S.rname===undefined?Promise.resolve(sb.rpc('my_roster_name')).then(r=>{S.rname=r.error?null:(r.data||null)},()=>{}):null;
  const cnt=(tb,f)=>{let q=sb.from(tb).select('id',{count:'exact',head:true});return f(q).then(r=>r.count||0,()=>0)};
  // блок руководителя считается одновременно с остальным (раньше ждал, пока загрузится всё остальное)
  const admP=mgr?(async()=>{
    await ensurePeople();
    const [inc,sn,tm,cks]=await Promise.all([cnt('incidents',q=>q.eq('status','new')),cnt('shift_notes',q=>q.eq('day',t)),sb.from('marks').select('user_id').eq('day',t),sb.from('checkins').select('user_id').eq('day',t)]);
    const total=(S.dg.people||[]).length,absent=(tm.data||[]).length;
    const ox=await sb.from('overtime').select('*').eq('day',t).then(r=>r.data||[],()=>[]);
    const nm=id=>shortName((S.dg.people.find(p=>p.id===id)||{}).full_name||'');
    return {inc,sn,total,work:Math.max(0,total-absent),ok:(cks.data||[]).length,ot:ox.map(o=>`${OT_K[otKind(o)][0]} ${nm(o.user_id)} +${String(+o.hours).replace('.',',')} ч${o.note?' ('+o.note+')':''}`)};
  })().catch(()=>null):null;
  const [mk,ck,rt,ev,nw,rt2,rq,mm,ot,td,hb,hl,ob,th]=await Promise.all([
    sb.from('marks').select('kind,note').eq('user_id',me).eq('day',t).maybeSingle(),
    sb.from('checkins').select('at').eq('user_id',me).eq('day',t).maybeSingle(),
    sb.from('rotations').select('data').eq('day',t).maybeSingle(),
    S.ev?Promise.resolve({data:S.ev.filter(e=>e.day===t)}):sb.from('events').select('*').eq('day',t).order('time'),
    sb.from('news').select('id,title,body,created_at,pinned').order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(1),
    sb.from('rotations').select('data').eq('day',tm).maybeSingle(),
    sb.from('requests').select('id,kind,day,day_to,status,created_at').eq('user_id',me).neq('status','cancelled').order('created_at',{ascending:false}).limit(4),
    sb.from('marks').select('day,kind').eq('user_id',me).gte('day',ms).lte('day',ym+'-31'),
    sb.from('overtime').select('*').eq('user_id',me).gte('day',ms).lte('day',ym+'-31'),
    sb.from('todos').select('*').eq('user_id',me),
    sb.from('habits').select('id,title,icon,days,created_at').eq('user_id',me).eq('arch',false),
    sb.from('habit_logs').select('habit_id').eq('user_id',me).eq('day',t),
    sb.from('onb_items').select('id,title,done,link').eq('user_id',me).order('sort').order('id'),
    sb.from('thanks').select('id,sticker,body,from_user,created_at').eq('to_user',me).gte('created_at',new Date(Date.now()-7*864e5).toISOString()).order('created_at',{ascending:false}).limit(3)]);
  if(rnameP)await rnameP;
  if((th.data||[]).length)await ensurePeople();
  const adm=admP?await admP:null;
  const rot=rt.data?.data,mine=rot&&window.myShift?myShift(rot):[],K=mk.data&&KINDS[mk.data.kind];
  const b=S.act||{};
  let h=head('Сегодня',dayLabel(t));
  h+=alertCard();h+=window.briefCard?briefCard():'';h+=window.briefBox?briefBox():'';h+='<div id="pushbn"></div>';
  {const dj=new Date().getDate()%2===0,tx=dj?dayJoke():dayPhrase();
   h+=`<div class="card pad dayph" id="td_ph" role="button" tabindex="0" aria-label="Ещё один совет"><div style="flex:1;min-width:0"><div class="phh" id="td_pht">${dj?'🌟 Совет Дримми':'✨ Фраза дня'}</div><div class="pht" id="td_phx">${esc(tx)}</div></div><img src="stickers/mascot-hi.webp" alt="" width="64" height="64"></div>`}
  // статус дня
  if(K)h+=`<div class="card pad col" style="background:${K[1]}"><b style="font-size:18px">Сегодня у тебя: ${mk.data.kind==='do'?'день отдыха (ДО)':K[2].toLowerCase()}</b>${mk.data.note?`<div class="muted">${esc(mk.data.note)}</div>`:''}</div>`;
  else h+=`<div class="card pad col"><b style="font-size:18px">Сегодня рабочий день</b>${ck.data?`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="pill" style="background:#C9D4B0;color:#3B2A35">✅ Выход подтверждён в ${new Date(ck.data.at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}</div>${mgr?'<button class="btn ghost" id="td_ckx" style="min-height:34px;padding:0 12px">↩️ Отменить</button>':''}</div>`:`<button class="btn" id="td_ck">☀️ Я на смене</button>`}</div>`;
  h+='<div id="dqbox"></div>';
  h+=myShiftCard(mine,'Сегодня ты стоишь здесь');
  // завтра — когда ротация уже вышла
  const rot2=rt2.data?.data;
  if(rot2&&window.myShift){const m2=myShift(rot2);h+=m2.length?myShiftCard(m2,'Завтра, '+dayLabel(tm)):`<div class="card pad col"><b>🌙 Завтра, ${dayLabel(tm)}</b><div class="muted">Ротация вышла, тебя в ней нет (выходной или не поставили?). Если это ошибка, напиши руководителю.</div></div>`}
  else if(!mgr)h+=`<div class="card pad col"><b>🌙 Завтра</b><div class="muted">Ротация на завтра ещё не вышла: придёт уведомление.</div></div>`;
  // быстрые кнопки
  h+=`<div class="two"><button class="btn ghost" data-go="rot">🔄 Ротация</button><button class="btn ghost" data-go="shift">✅ Смена</button></div><div class="two"><button class="btn ghost" id="td_fix">🛠 Сообщить о поломке</button><button class="btn ghost" data-go="sch">📅 Мой график</button></div>`;
  // мой блокнот: дела и привычки
  {const tl=(td.data||[]).map(x=>({due:null,kind:'task',arch:false,...x})).filter(x=>!x.arch),op=tl.filter(x=>!x.done),dn=tl.length-op.length,ov=op.filter(x=>x.due&&x.due<t),tdy=op.filter(x=>x.due===t),nx=op.filter(x=>x.due&&x.due>t).sort((p,q)=>p.due.localeCompare(q.due))[0];
   const wdn=(new Date().getDay()+6)%7+1,hs=(hb.data||[]).filter(x=>(x.days||[]).includes(wdn)),hdone=new Set((hl.data||[]).map(x=>x.habit_id)),hd=hs.filter(x=>hdone.has(x.id)).length;
   const li=x=>`<div class="muted">${(PL_K[x.kind]||['✅'])[0]} ${x.due&&x.due!==t?dayLabel(x.due)+' · ':''}${x.due_time?String(x.due_time).slice(0,5)+' · ':''}${esc(x.body)}${x.due&&x.due<t?' <b style="color:#C0392B">просрочено</b>':''}</div>`;
   if(tl.length||hs.length)h+=`<div class="card pad col" data-go="todo" style="cursor:pointer"><b>📝 Мой блокнот${ov.length?` · <span style="color:#C0392B">просрочено ${ov.length}</span>`:''}${tdy.length?` · сегодня ${tdy.length}`:''}</b>${[...ov,...tdy].slice(0,4).map(li).join('')}${!ov.length&&!tdy.length&&nx?`<div class="muted">Ближайшее:</div>${li(nx)}`:''}${hs.length?`<div class="muted">🔥 Привычки сегодня: <b>${hd} из ${hs.length}</b>${hd===hs.length?' · умница!':''}</div>`:''}${tl.length&&!op.length?'<div class="muted">🎉 Все дела сделаны</div>':''}${tl.length?todoBar(dn,tl.length,1):''}</div>`}
  // первая неделя и спасибо от коллег
  {const oi=ob.data||[],od=oi.filter(x=>x.done).length;
   if(oi.length&&od<oi.length){const nxt=oi.filter(x=>!x.done).slice(0,2);h+=`<div class="card pad col" data-go="newbie" style="cursor:pointer;border:2px solid var(--sage)"><b>🌱 Первая неделя · ${od} из ${oi.length}</b>${todoBar(od,oi.length,1)}${nxt.map(x=>`<div class="muted">⬜ ${esc(x.title)}</div>`).join('')}</div>`}
   const tt=th.data||[];
   if(tt.length)h+=`<div class="card pad col" data-go="thanks" style="cursor:pointer;background:linear-gradient(120deg,#FBE9B7,#F8D3C0);border:0;color:#3B2A35"><b>💛 Тебе сказали спасибо</b>${tt.slice(0,2).map(x=>`<div>${x.sticker} <b>${esc(nameOf(x.from_user))}:</b> ${esc(x.body)}</div>`).join('')}</div>`}
  if(window.gmLoad){gmLoad();gmSync();if(window.gmPopups&&!S.gmPopQ){S.gmPopQ=1;setTimeout(()=>{S.gmPopQ=0;gmPopups()},2500)}}
  h+=gameCard();
  h+=dayNotesCard();
  // мои заявки и итоги месяца
  if((rq.data||[]).length)h+=`<div class="card pad col" data-go="req" style="cursor:pointer"><b>📨 Мои заявки</b>${rq.data.map(x=>`<div class="otr"><span>${(REQ_K[x.kind]||['','Заявка'])[0]} ${(REQ_K[x.kind]||['','Заявка'])[1]} · ${dRange(x)}</span><span class="pill" style="background:${(REQ_ST[x.status]||['','#E8DCCB'])[1]}">${(REQ_ST[x.status]||['?'])[0]}</span></div>`).join('')}</div>`;
  {const cnt=k=>(mm.data||[]).filter(x=>x.kind===k).length,hd=(ot.data||[]).filter(x=>otKind(x)==='d').reduce((a,x)=>a+(+x.hours||0),0),hp=(ot.data||[]).filter(x=>otKind(x)==='p').reduce((a,x)=>a+(+x.hours||0),0),dim=new Date(+ym.slice(0,4),+ym.slice(5),0).getDate(),off=(mm.data||[]).length;
   h+=`<div class="card pad col" data-go="sch" style="cursor:pointer"><b>📊 Мой месяц</b><div class="otr"><span>Рабочих дней по графику</span><b>${dim-off} из ${dim}</b></div><div class="otr"><span>Отгулов</span><b>${cnt('otgul')}</b></div><div class="otr"><span>Отпуск / больничный</span><b>${cnt('vac')} / ${cnt('sick')}</b></div><div class="otr"><span>⏱ Доработки</span><b>${hd?hd+' ч':'—'}</b></div><div class="otr"><span>🔥 Переработки</span><b>${hp?hp+' ч':'—'}</b></div></div>`}
  // руководителям
  if(adm){
    const row=(ic,n,v,k)=>`<div class="otr" data-go="${k}" style="cursor:pointer"><span>${ic} ${n}</span><b${v?' style="color:#C0392B"':''}>${v}</b></div>`;
    h+=`<div class="card pad col"><b>👀 Требует внимания</b>${row('📨','Заявки на рассмотрении',b.req||0,'req')}${row('🛠','Новые поломки',b.fix||0,'fix')}${row('🚨','Новые происшествия',(adm.inc||0),'inc')}${isAdmin()?row('👥','Новые регистрации',S.pending||0,'staff'):''}${row('💬','Комментарии в смене сегодня',(adm.sn||0),'shift')}<div class="otr"><span>☀️ Подтвердили выход</span><b>${adm.ok} из ${adm.work}</b></div>${(adm.ot||[]).length?`<div style="margin-top:4px"><b>⏱ Доработки и переработки сегодня</b>${adm.ot.map(x=>`<div class="muted">· ${esc(x)}</div>`).join('')}</div>`:''}</div>`;
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
  $('#td_fb').onclick=()=>fbForm();dayNotesBind();
  {const ph=$('#td_ph');if(ph){const next=()=>{const x=$('#td_phx'),cur=x.textContent;const j=dayJoke(cur);$('#td_pht').textContent='🌟 Совет Дримми';x.textContent=j;ph.classList.remove('flip');void ph.offsetWidth;ph.classList.add('flip')};ph.onclick=next;ph.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();next()}}}}
  $('#td_alert')?.addEventListener('click',alertSheet);$('#td_brief')?.addEventListener('click',()=>briefSheet());window.briefMount&&briefMount();window.pushBanner&&pushBanner();
  app.querySelectorAll('[data-go]').forEach(c=>c.onclick=()=>go(c.dataset.go));
  $('#td_fix').onclick=()=>{go('fix');setTimeout(()=>{if(window.fixForm)fixForm()},350)};
  if(window.dqFill)dqFill();
  $('#td_ckx')&&($('#td_ckx').onclick=async e=>{if(!confirm('Отменить отметку «Я на смене»?'))return;e.target.disabled=true;const r=await sb.rpc('checkin_cancel',{p_user:null});if(r.error){e.target.disabled=false;return alert(r.error.message)}refreshUnread();todayView()});
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
// ---------- Личный блокнот: полоска прогресса (сам блокнот — в plan.js) ----------
const todoBar=(d,n,compact)=>{const p=n?Math.round(d*100/n):0;return `<div class="pgb"><div class="pg" style="width:${p}%"></div></div>${compact?'':`<div class="muted">${p}%${n&&d===n?' · 🎉 Всё сделано, отличная работа!':''}</div>`}`};
