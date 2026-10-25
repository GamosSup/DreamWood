// Главная «Сегодня»: моя смена, отметка выхода, быстрые кнопки, события дня, для руководителей — что требует внимания
async function todayView(){
  const me=S.me.id,t=iso(new Date()),mgr=isManager();
  if(S.rname===undefined){const r=await sb.rpc('my_roster_name');S.rname=r.error?null:(r.data||null)}
  const cnt=(tb,f)=>{let q=sb.from(tb).select('id',{count:'exact',head:true});return f(q).then(r=>r.count||0,()=>0)};
  const [mk,ck,rt,ev,nw]=await Promise.all([
    sb.from('marks').select('kind,note').eq('user_id',me).eq('day',t).maybeSingle(),
    sb.from('checkins').select('at').eq('user_id',me).eq('day',t).maybeSingle(),
    sb.from('rotations').select('data').eq('day',t).maybeSingle(),
    S.ev?Promise.resolve({data:S.ev.filter(e=>e.day===t)}):sb.from('events').select('*').eq('day',t).order('time'),
    sb.from('news').select('id,title,body,created_at,pinned').order('pinned',{ascending:false}).order('created_at',{ascending:false}).limit(1)]);
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
  // статус дня
  if(K)h+=`<div class="card pad col" style="background:${K[1]}"><b style="font-size:18px">Сегодня у тебя: ${mk.data.kind==='do'?'день отдыха (ДО)':K[2].toLowerCase()}</b>${mk.data.note?`<div class="muted">${esc(mk.data.note)}</div>`:''}</div>`;
  else h+=`<div class="card pad col"><b style="font-size:18px">Сегодня рабочий день</b>${ck.data?`<div class="pill" style="background:#C9D4B0;align-self:flex-start">✅ Выход подтверждён в ${new Date(ck.data.at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}</div>`:`<button class="btn" id="td_ck">☀️ Я на смене</button>`}</div>`;
  h+=myShiftCard(mine);
  // быстрые кнопки
  h+=`<div class="two"><button class="btn ghost" data-go="rot">🔄 Ротация</button><button class="btn ghost" data-go="shift">✅ Смена</button></div><div class="two"><button class="btn ghost" id="td_fix">🛠 Сообщить о поломке</button><button class="btn ghost" data-go="sch">📅 Мой график</button></div>`;
  // руководителям
  if(adm){
    const row=(ic,n,v,k)=>`<div class="otr" data-go="${k}" style="cursor:pointer"><span>${ic} ${n}</span><b${v?' style="color:#C0392B"':''}>${v}</b></div>`;
    h+=`<div class="card pad col"><b>👀 Требует внимания</b>${row('📨','Заявки на рассмотрении',b.req||0,'req')}${row('🛠','Новые поломки',b.fix||0,'fix')}${row('🚨','Новые происшествия',(adm.inc||0),'inc')}${row('👥','Новые регистрации',S.pending||0,'staff')}${row('💬','Комментарии в смене сегодня',(adm.sn||0),'shift')}<div class="otr"><span>☀️ Подтвердили выход</span><b>${adm.ok} из ${adm.work}</b></div></div>`;
  }else if(S.due?.length){
    h+=`<div class="card pad col" data-go="dg" style="cursor:pointer"><b>📋 Задачи на сегодня и завтра · ${S.due.length}</b>${S.due.slice(0,3).map(x=>`<div class="muted">· ${esc(x.title)}</div>`).join('')}</div>`;
  }
  // события дня
  const evs=ev.data||[];
  if(evs.length)h+=`<div class="card pad col"><b>🎟️ Сегодня в парке</b>${evs.slice(0,5).map(e=>`<div style="display:flex;gap:10px"><b style="width:52px;flex:none">${esc(e.time)}</b><span>${esc(e.title)}<div class="muted">${esc(e.loc||'')}</div></span></div>`).join('')}<button class="btn ghost" data-go="afisha">Вся афиша</button></div>`;
  // новость
  const n=nw.data?.[0];
  if(n)h+=`<div class="card pad col" data-go="news" style="cursor:pointer"><b>📰 ${n.pinned?'📌 ':''}${esc(n.title)}</b><div class="muted" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(n.body||'')}</div></div>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-go]').forEach(c=>c.onclick=()=>go(c.dataset.go));
  $('#td_fix').onclick=()=>{go('fix');setTimeout(()=>{if(window.fixForm)fixForm()},350)};
  $('#td_ck')&&($('#td_ck').onclick=async e=>{e.target.disabled=true;const r=await sb.rpc('checkin_confirm');if(r.error){e.target.disabled=false;return alert(r.error.message)}refreshUnread();todayView()});
}
VIEWS.today=todayView;
