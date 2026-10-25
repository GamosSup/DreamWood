const $=s=>document.querySelector(s),app=$('#app'),nav=$('#nav');
const cfg=window.APP_CONFIG;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const THEMES={autumn:['🍂','Осень'],winter:['❄️','Зима'],spring:['🌸','Весна'],summer:['☀️','Лето']};
const getTheme=()=>{try{return localStorage.getItem('dw-theme')||'autumn-warm'}catch(e){return 'autumn-warm'}};
function applyTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('dw-theme',t)}catch(e){}
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||'#3B2A35'}
applyTheme(getTheme());
const S={unread:0,tab:'rot',me:null,team:'R',day:null,month:new Date(),viewUser:null,sel:null,people:[],marks:{},ev:null,evFilter:'all'};
const ZC={'Веревочный лагерь':'#C9D4B0','Золото':'#E6CC8F','Гольф':'#B7CFC4','Альфа':'#D3BFD0','Боулинг':'#BCC8D6','Кино':'#E4B5A3','VR-арена':'#BFD3D3','Няня 1':'#D9C3AE','Няня 2':'#D9C3AE','Детский клуб':'#E8C1B5'};
const STEPC={'Боулинг':'#BCC8D6','Ос':'#F3C29B','Гольф':'#B7CFC4','Золото':'#E6CC8F','Метро':'#CFC6BC','Веревочный лагерь / инд. задачи':'#C9D4B0','Веревочный лагерь':'#C9D4B0'};
const brkBg=t=>t.startsWith('Ос')?'#F3C29B':t.startsWith('О')?'#F5E2A8':'#E4EDF4';
const TEAMS=[['R','Рейнджеры','#C9D4B0'],['K','Хранители','#B7CFC4'],['M','Метрополис','#E4B5A3'],['W','Если дождь','#7E98AE']];
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const isManager=()=>S.me?.role==='manager';

async function boot(){
  if(cfg.SUPABASE_ANON_KEY.startsWith('ВСТАВЬ')){app.innerHTML='<div class="card pad">Нужно вставить anon key в config.js</div>';return}
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return authView('in');
  const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).single();
  S.me=data||{id:session.user.id,full_name:session.user.email,role:'employee',status:'pending'};
  S.viewUser=S.me.id;
  if(S.me.status!=='approved')return pendingView();
  nav.hidden=false;nav.querySelector('[data-tab=staff]').hidden=!isManager();go(S.tab==='staff'&&!isManager()?'rot':S.tab);
}
function authView(mode,err,ok){
  nav.hidden=true;const reg=mode==='up';
  app.innerHTML=`<div style="margin-top:40px"><div class="muted" style="text-transform:uppercase;font-weight:700">Дримвуд · Mriya Resort &amp; Spa</div><h1>Чудеса начинаются здесь</h1><p class="muted">Приложение команды парка: ротации, график, афиша и новости.</p></div>
  <div class="seg"><button id="tin" class="${reg?'':'on'}">Вход</button><button id="tup" class="${reg?'on':''}">Регистрация</button></div>
  ${reg?`<div class="two"><label>Имя<input id="fn" autocomplete="given-name" placeholder="Игорь"></label><label>Фамилия<input id="ln" autocomplete="family-name" placeholder="Шубчик"></label></div>`:''}
  <label>Почта<input id="em" type="email" autocomplete="username" placeholder="name@company.ru"></label>
  <label>Пароль${reg?' (придумай сам, не короче 6 знаков)':''}<input id="pw" type="password" autocomplete="${reg?'new-password':'current-password'}"></label>
  <div class="err">${esc(err||'')}</div>${ok?`<div class="card pad" style="background:var(--sage)">${esc(ok)}</div>`:''}
  <button class="btn" id="go">${reg?'Отправить заявку':'Войти в приключение'}</button>
  ${reg?'<div class="muted">Пароль знаешь только ты. Руководитель получит имя, фамилию и почту и подтвердит доступ.</div>':'<button class="btn ghost" id="fg">Забыли пароль?</button><div class="muted">Нет аккаунта? Открой «Регистрацию»: руководитель подтвердит заявку.</div>'}`;
  $('#tin').onclick=()=>authView('in');$('#tup').onclick=()=>authView('up');
  $('#go').onclick=async()=>{
    const email=$('#em').value.trim(),password=$('#pw').value;
    if(!reg){const {error}=await sb.auth.signInWithPassword({email,password});return error?authView('in','Не получилось войти: проверь почту и пароль'):boot()}
    const fn=$('#fn').value.trim(),ln=$('#ln').value.trim();
    if(!fn||!ln)return authView('up','Укажи имя и фамилию');
    if(!/^\S+@\S+\.\S+$/.test(email))return authView('up','Проверь почту');
    if(password.length<6)return authView('up','Пароль должен быть не короче 6 знаков');
    $('#go').disabled=true;
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:fn+' '+ln}}});
    if(error)return authView('up',/registered|already/i.test(error.message)?'Эта почта уже зарегистрирована: открой «Вход»':'Не удалось зарегистрироваться: '+error.message);
    if(data.session)return boot();
    authView('in','', 'Заявка отправлена. Если пришло письмо со ссылкой, подтверди почту, потом войди. Руководитель подтвердит доступ.');
  };
  $('#fg')&&($('#fg').onclick=async()=>{const e=$('#em').value.trim();if(!e)return authView('in','Введи почту, пришлём ссылку');await sb.auth.resetPasswordForEmail(e);authView('in','','Если почта в системе, письмо отправлено')});
}
const loginView=err=>authView('in',err);
function pendingView(){
  nav.hidden=true;const rej=S.me.status==='rejected';
  app.innerHTML=`<div style="margin-top:40px"><div style="font-size:54px">${rej?'🚫':'⏳'}</div><h1>${rej?'Заявка отклонена':'Ждём подтверждения'}</h1>
  <p class="muted">${rej?'Руководитель не подтвердил доступ. Если это ошибка, напиши ему напрямую.':`Привет, ${esc(firstName())}! Заявка отправлена руководителю. Как только он её подтвердит, откроются ротации, график и афиша.`}</p></div>
  <div class="card pad"><b>${esc(S.me.full_name||'')}</b><div class="muted">${esc(S.me.email||'')}</div></div>
  <button class="btn" id="chk">Проверить ещё раз</button><button class="btn ghost" id="out">Выйти</button>`;
  $('#chk').onclick=boot;$('#out').onclick=()=>sb.auth.signOut().then(()=>{S.me=null;boot()});
}
nav.onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.tab)};
function go(t){S.tab=t;document.body.dataset.tab=t;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));window.scrollTo(0,0);
  Promise.resolve(({rot:rotView,sch:schView,afisha:afishaView,dg:dgView,staff:staffView,set:settingsView})[t]()).then(refreshUnread)}
async function refreshUnread(){
  if(!S.me||S.me.status!=='approved')return;
  const [n,r,p]=await Promise.all([sb.from('notifications').select('id'),sb.from('notif_reads').select('notif_id').eq('user_id',S.me.id),isManager()?sb.from('profiles').select('id',{count:'exact',head:true}).eq('status','pending'):Promise.resolve({count:0})]);
  if(!n.error&&!r.error){const seen=new Set((r.data||[]).map(x=>x.notif_id));S.unread=(n.data||[]).filter(x=>!seen.has(x.id)).length;
    const el=$('#bellN');if(el){el.hidden=!S.unread;el.textContent=S.unread>9?'9+':S.unread}}
  try{const q=await sb.from('dg_tasks').select('id,title,deadline,assignees').eq('done',false).not('deadline','is',null);
    const lim=iso(new Date(Date.now()+864e5));S.due=(q.data||[]).filter(t=>(t.assignees||[]).includes(S.me.id)&&t.deadline<=lim).sort((a,b)=>a.deadline<b.deadline?-1:1);
    const el=$('#bellN'),tot=(S.unread||0)+S.due.length;if(el){el.hidden=!tot;el.textContent=tot>9?'9+':tot}}catch(e){S.due=[]}
  S.pending=p.count||0;const sn=$('#staffN');if(sn){sn.hidden=!S.pending;sn.textContent=S.pending}
}
const firstName=()=>(S.me?.full_name||'').trim().split(/\s+/)[0]||'друг';
const bell=()=>`<button class="bell" aria-label="Уведомления" onclick="openBell()">🔔<i id="bellN" ${S.unread>0?'':'hidden'}>${S.unread>9?'9+':S.unread}</i></button>`;
const head=(h,sub)=>`<div class="top"><div class="hi">Привет, ${esc(firstName())}! 👋</div>${bell()}</div>${sub?`<div class="muted">${sub}</div>`:''}<h1>${h}</h1>`;
const NI={news:'📰',rotation:'🔄',afisha:'🎟️',signup:'🧑‍💼',task:'📋'};
const ago=d=>{const m=Math.round((Date.now()-new Date(d))/6e4);return m<1?'только что':m<60?m+' мин назад':m<1440?Math.floor(m/60)+' ч назад':new Date(d).toLocaleDateString('ru',{day:'numeric',month:'short'})};
async function openBell(){
  const [n,r]=await Promise.all([sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(50),sb.from('notif_reads').select('notif_id').eq('user_id',S.me.id)]);
  const seen=new Set((r.data||[]).map(x=>x.notif_id)),list=n.data||[];
  const ov=document.createElement('div');ov.className='ov';ov.innerHTML=`<div class="sheet"><div class="sh"><button class="x" id="bk" aria-label="Назад">←</button><b>Уведомления</b><span></span></div><div class="sb">${(S.due||[]).map(t=>{const od=t.deadline<iso(new Date()),td=t.deadline===iso(new Date());return `<div class="nt new" style="border-left:6px solid ${od?'#E08A7A':'#E6CC8F'}"><div class="ni">⏰</div><div class="nb"><b>${od?'Просрочена':td?'Срок сегодня':'Срок завтра'}: ${esc(t.title)}</b><div class="muted" style="margin-top:4px">📅 ${dgFmt(t.deadline)} · <a href="#" class="lnk" data-l="dg">открыть доску</a></div></div></div>`}).join('')}${list.map(x=>{const lg=(x.body||'').length>160;return `<div class="nt ${seen.has(x.id)?'':'new'}" data-id="${x.id}"><div class="ni">${NI[x.kind]||'🔔'}</div><div class="nb"><b>${esc(x.title)}</b>${seen.has(x.id)?'':'<span class="newb">новое</span>'}<div class="nbody ${lg?'cl':''}">${esc(x.body||'')}</div><div class="muted" style="margin-top:4px">${ago(x.created_at)}${lg?' · <a href="#" class="more">читать полностью</a>':''}${x.link&&x.link!=='news'?` · <a href="#" class="lnk" data-l="${esc(x.link)}">открыть</a>`:''}</div></div></div>`}).join('')||'<div class="muted" style="padding:20px">Пока ничего нового</div>'}</div></div>`;
  document.body.appendChild(ov);document.body.style.overflow='hidden';
  const close=()=>{ov.remove();document.body.style.overflow=''};
  ov.onclick=e=>{if(e.target===ov)close()};ov.querySelector('#bk').onclick=close;
  ov.querySelectorAll('.more').forEach(a=>a.onclick=e=>{e.preventDefault();a.closest('.nb').querySelector('.nbody').classList.remove('cl');a.remove()});
  ov.querySelectorAll('.lnk').forEach(a=>a.onclick=e=>{e.preventDefault();const l=a.dataset.l;close();if(l.startsWith('rot:')){S.day=l.slice(4);go('rot')}else go(l)});
  const fresh=list.filter(x=>!seen.has(x.id)).map(x=>({user_id:S.me.id,notif_id:x.id}));
  if(fresh.length){await sb.from('notif_reads').upsert(fresh);S.unread=0;const bn=$('#bellN');if(bn){const tot=(S.due||[]).length;bn.hidden=!tot;bn.textContent=tot>9?'9+':tot}}
}

// ---------- Ротации ----------
const hh=x=>{const m=x.split(':');return +m[0]+(+m[1])/60};
const dayLabel=d=>new Date(d+'T12:00:00').toLocaleDateString('ru',{weekday:'short',day:'numeric',month:'short'});
function parseRange(t){const m=String(t).match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);return m?[hh(m[1]),hh(m[2])]:[10,20]}
function personTrack(p,r,c,a,b){
  const span=b-a;let h=`<div style="display:flex;flex-direction:column;gap:4px"><div style="font-weight:700;font-size:14px">${esc(p.icon)} ${esc(p.name)}${p.senior?'<span class="sr">Старший</span>':''}</div>
  <div class="track" style="--c:${c}"><div class="work"></div>`;
  const marks=[];
  (p.brks||[]).forEach(t=>{const m=t.match(/^(Ос|О)\s+(\d+:\d+)[–-](\d+:\d+)/);if(!m)return;const s0=hh(m[2]),e0=hh(m[3]);if(e0<=a||s0>=b)return;
    h+=`<div class="brk" style="left:${(Math.max(s0,a)-a)/span*100}%;width:${(Math.min(e0,b)-Math.max(s0,a))/span*100}%;background:${brkBg(t)}">${m[1]}</div>`;marks.push(`${m[1]} ${m[2]}–${m[3]}`)});
  h+=`</div>${marks.length?`<div class="muted">Перерыв: ${marks.map(esc).join(', ')}</div>`:''}</div>`;return h}
function axis(a,b){let t='';for(let v=Math.ceil(a);v<=b;v++)t+=`<span style="left:${(v-a)/(b-a)*100}%">${v}</span>`;return `<div class="axis">${t}</div>`}
function zoneCard(zone,blocks,c){
  let h=`<div class="card zcard" style="--c:${c}"><div class="zh" style="background:${c}">${esc(zone)}</div>`;
  blocks.forEach(bl=>{
    const [a,b]=bl.range;
    h+=`<div class="zb"><div class="zt">🕑 ${bl.title}</div>`;
    if(bl.steps?.length){
      h+=`<div class="muted">${esc(bl.people.map(p=>p.name).join(', '))} — меняет обеды</div><div class="bar">${bl.steps.map(x=>{const r=parseRange(x[0]);return `<div style="width:${(r[1]-r[0])/(b-a)*100}%;background:${STEPC[x[1]]||'#eee'}" title="${esc(x[0]+' '+x[1])}">${r[1]-r[0]>=1?esc(x[1].split(' ')[0]):''}</div>`}).join('')}</div>${axis(a,b)}
      <div class="steps">${bl.steps.map(x=>`<b>${esc(x[0])}</b><span><span class="pill" style="background:${STEPC[x[1]]||'#eee'}">${esc(x[1])}</span></span>`).join('')}</div>`;
    }else{
      h+=bl.people.map(p=>personTrack(p,null,c,a,b)).join('');h+=axis(a,b);
    }
    h+=`</div>`});
  return h+`</div>`}
async function rotView(){
  const todayIso=iso(new Date()),from=iso(new Date(Date.now()-7*864e5));
  const {data:list}=await sb.from('rotations').select('day').gte('day',from).order('day');
  const days=[...new Set([...(list||[]).map(x=>x.day),todayIso])].sort();
  if(!S.day||!days.includes(S.day))S.day=days.includes(todayIso)?todayIso:days[days.length-1];
  const {data}=await sb.from('rotations').select('*').eq('day',S.day).maybeSingle();
  const rot=data?.data;
  let h=head('Ротации','Кто где стоит и когда перерыв');
  h+=`<div class="tabs">${days.map(d=>`<button data-d="${d}" class="${d===S.day?'on':''}" style="background:var(--tab)">${d===todayIso?'Сегодня':dayLabel(d)}${d===todayIso?'<br><small>'+dayLabel(d)+'</small>':''}</button>`).join('')}</div>`;
  if(!rot){h+=`<div class="card pad"><b>Ротации на ${dayLabel(S.day)} пока нет</b><div class="muted">Как только её загрузят, она появится здесь.</div></div>`;app.innerHTML=h;return bindRot()}
  if(rot.banner)h+=`<div class="banner">🎃 ${esc(rot.banner)}</div>`;
  if(rot.image)h+=`<a href="${esc(rot.image)}" target="_blank" rel="noopener" class="card" style="display:block;overflow:hidden;padding:0"><img src="${esc(rot.image)}" alt="Ротация картинкой" loading="lazy" style="display:block;width:100%;height:auto"><div class="muted" style="padding:6px 12px;font-size:12px">🖼 Ротация картинкой — нажми, чтобы открыть крупно</div></a>`;
  h+=`<div class="tabs">${TEAMS.map(([k,n,c])=>`<button data-t="${k}" class="${S.team===k?'on':''}" style="background:${c}">${n}</button>`).join('')}</div>`;
  const secs=rot.teams?.[S.team]||[];
  const notes=secs.filter(s=>s.note).map(s=>`<div class="n" style="background:${s.noteBg||'#E8B4B8'};padding:8px 12px;border-radius:12px;font-weight:700;font-size:13px">${esc(s.note)}</div>`).join('');
  h+=notes;
  const order=[],byZone={};
  secs.forEach(s=>{const range=parseRange(s.title);s.rows.forEach(r=>{if(!byZone[r.zone]){byZone[r.zone]=[];order.push(r.zone)}
    byZone[r.zone].push({range,title:s.title==='Весь день'?'Весь день · 10:00–20:00':s.title.replace(/^.*·\s*/,''),people:r.people,steps:r.steps})})});
  order.forEach(z=>{const c=S.team==='W'?'#7E98AE':(ZC[z]||'#D3BFD0');h+=zoneCard(z,byZone[z],c)});
  if(rot.legend)h+=`<div class="card pad muted">${rot.legend.map(esc).join('<br>')}</div>`;
  app.innerHTML=h;bindRot();
}
function bindRot(){
  app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.day=b.dataset.d;rotView()});
  app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.team=b.dataset.t;rotView()});
}

// ---------- График ----------
const KINDS={off:['ВЫХ','#E8DCCB','Выходной'],otgul:['ОТ','#E4B5A3','Отгул'],do:['ДО','#F5E2A8','ДО'],sick:['Б','#BCC8D6','Больничный'],vac:['ОП','#C9D4B0','Отпуск']};
async function schView(){
  if(isManager()&&!S.people.length){const {data}=await sb.from('profiles').select('id,full_name').eq('status','approved').order('full_name');S.people=data||[]}
  const m=S.month,y=m.getFullYear(),mo=m.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0));
  const {data}=await sb.from('marks').select('*').eq('user_id',S.viewUser).gte('day',first).lte('day',last);
  const otr=await sb.from('overtime').select('*').eq('user_id',S.viewUser).gte('day',first).lte('day',last).order('day').order('start_time');
  const otRows=otr.data||[],otSum=otRows.reduce((a,r)=>a+Number(r.hours),0),fh=x=>String(Math.round(x*100)/100).replace('.',',');
  S.marks={};(data||[]).forEach(r=>S.marks[r.day]=r);
  const n=new Date(y,mo+1,0).getDate(),lead=(new Date(y,mo,1).getDay()+6)%7;
  let h=head('График',m.toLocaleDateString('ru',{month:'long',year:'numeric'}));
  if(isManager())h+=`<label>Сотрудник<select id="who">${S.people.map(p=>`<option value="${p.id}" ${p.id===S.viewUser?'selected':''}>${esc(p.full_name)}</option>`).join('')}</select></label>`;
  h+=`<div style="display:flex;gap:8px"><button class="btn ghost" id="pm">←</button><button class="btn ghost" id="nm">→</button></div><div class="cal">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="dh">${d}</div>`).join('')}${'<div></div>'.repeat(lead)}`;
  let worked=0;const cnt={};
  for(let d=1;d<=n;d++){const k=iso(new Date(y,mo,d)),mk=S.marks[k];
    if(!mk)worked++;else cnt[mk.kind]=(cnt[mk.kind]||0)+1;
    h+=`<button class="day ${S.sel===k?'sel':''}" data-k="${k}" style="background:${mk?KINDS[mk.kind][1]:'var(--card)'}">${d}<small>${mk?KINDS[mk.kind][0]:''}</small></button>`}
  h+=`</div><div class="stat"><div style="background:var(--sage)"><b>${worked}</b>рабочих дней</div><div style="background:var(--gold)"><b>${worked*10}</b>часов по графику</div></div>
  <div class="stat"><div style="background:var(--pink)"><b>${fh(otSum)}</b>переработки</div><div style="background:var(--blue)"><b>${fh(worked*10+otSum)}</b>всего часов</div></div>
  <div class="muted">Смена 11 ч, из них 1 ч обед → 10 рабочих часов. Дни без отметки считаются рабочими. Переработки вносит руководитель и они идут в общий итог.</div>`;
  const defd=S.sel||(iso(new Date()).slice(0,7)===first.slice(0,7)?iso(new Date()):first);
  h+=`<div class="card pad col"><b>⏱ Переработки</b>${otRows.length?otRows.map(r=>`<div class="otr"><span><b>${dayLabel(r.day)}</b> · с ${esc(String(r.start_time||'—').slice(0,5))} · ${fh(+r.hours)} ч${r.note?' · '+esc(r.note):''}</span>${isManager()?`<button class="x" data-od="${r.id}" aria-label="Удалить">✕</button>`:''}</div>`).join(''):'<div class="muted">В этом месяце переработок нет</div>'}
  ${isManager()?`<div class="col" style="border-top:1px solid var(--line);padding-top:10px"><div class="muted">Добавить переработку для выбранного сотрудника</div><input type="date" id="otd" value="${defd}"><div class="two"><label>С какого времени<input type="time" id="ots" value="20:00"></label><label>Сколько часов<input type="number" id="oth" step="0.5" min="0.5" placeholder="2"></label></div><input id="otn" placeholder="Комментарий (необязательно)"><button class="btn" id="otadd">Добавить</button></div>`:''}</div>`;
  if(S.sel){const mk=S.marks[S.sel];
    h+=`<div class="card pad" style="display:flex;flex-direction:column;gap:10px"><b>${S.sel}</b><div class="tabs">${Object.entries(KINDS).map(([k,v])=>`<button data-m="${k}" style="background:${v[1]}" class="${mk?.kind===k?'on':''}">${v[2]}</button>`).join('')}<button data-m="" style="background:#fff;border:1px solid #ccc">Рабочий</button></div><textarea id="note" placeholder="Комментарий">${esc(mk?.note||'')}</textarea><button class="btn" id="save">Сохранить</button></div>`}
  app.innerHTML=h;
  $('#who')?.addEventListener('change',e=>{S.viewUser=e.target.value;S.sel=null;schView()});
  $('#pm').onclick=()=>{S.month=new Date(y,mo-1,1);S.sel=null;schView()};$('#nm').onclick=()=>{S.month=new Date(y,mo+1,1);S.sel=null;schView()};
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{S.sel=b.dataset.k;S.pick=S.marks[S.sel]?.kind||'';schView()});
  app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{S.pick=b.dataset.m;app.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
  $('#otadd')?.addEventListener('click',async()=>{
    const day=$('#otd').value,hours=parseFloat(String($('#oth').value).replace(',','.'));
    if(!day||!(hours>0))return alert('Укажи дату и сколько часов (больше нуля)');
    const r=await sb.from('overtime').insert({user_id:S.viewUser,day,start_time:$('#ots').value||null,hours,note:$('#otn').value.trim()||null,created_by:S.me.id});
    if(r.error)return alert('Не удалось добавить: '+r.error.message);schView()});
  app.querySelectorAll('[data-od]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить эту переработку?'))return;const r=await sb.from('overtime').delete().eq('id',b.dataset.od);if(r.error)alert(r.error.message);schView()});
  $('#save')?.addEventListener('click',async()=>{
    const kind=S.pick??S.marks[S.sel]?.kind??'',note=$('#note').value;
    const r=kind?await sb.from('marks').upsert({user_id:S.viewUser,day:S.sel,kind,note}):await sb.from('marks').delete().eq('user_id',S.viewUser).eq('day',S.sel);
    if(r.error)alert('Не удалось сохранить: '+r.error.message);S.sel=null;schView()});
}


async function importSeed(){
  if(!confirm('Загрузить афишу и новости из файла seed/events.json? Существующие записи за эти даты будут заменены.'))return;
  const d=await (await fetch('seed/events.json?'+Date.now())).json();
  const days=[...new Set(d.events.map(e=>e.day))];
  await sb.from('events').delete().in('day',days);
  let r=await sb.from('events').insert(d.events);
  if(r.error)return alert('Афиша: '+r.error.message);
  await sb.from('news').delete().in('title',d.news.map(n=>n.title));
  r=await sb.from('news').insert(d.news);
  if(r.error)return alert('Новости: '+r.error.message);
  S.ev=null;alert('Готово: загружено '+d.events.length+' событий и '+d.news.length+' новости');go(S.tab);
}
const importBtn=()=>isManager()?'<button class="btn ghost" onclick="importSeed()">⬆️ Загрузить афишу и новости из файла</button>':'';
// ---------- Афиша ----------
async function afishaView(){
  if(!S.ev){const {data}=await sb.from('events').select('*').order('day').order('time');S.ev=data||[]}
  const days=[...new Set(S.ev.map(e=>e.day))];if(!S.aday||!days.includes(S.aday))S.aday=days.includes(iso(new Date()))?iso(new Date()):days[0];
  let list=S.ev.filter(e=>e.day===S.aday);
  if(S.evFilter==='paid')list=list.filter(e=>e.price);if(S.evFilter==='token')list=list.filter(e=>e.token);
  let h=head('Афиша','Что происходит в парке')+(S.ev.length?'':importBtn());
  h+=`<div class="tabs">${days.map(d=>`<button data-ad="${d}" class="${d===S.aday?'on':''}" style="background:var(--tab)">${d.slice(8)}.${d.slice(5,7)}</button>`).join('')}</div>`;
  h+=`<div class="seg">${[['all','Все'],['paid','Платные ₽'],['token','С ТыквоФишкой']].map(([k,n])=>`<button data-f="${k}" class="${S.evFilter===k?'on':''}">${n}</button>`).join('')}</div>`;
  h+=list.map(e=>`<div class="card pad" style="display:flex;gap:12px"><b style="width:60px">${esc(e.time)}</b><div><b>${esc(e.title)}</b><div class="muted">${esc(e.loc)}</div><div style="font-size:14px;margin-top:6px">${esc(e.descr)}</div><div style="margin-top:6px;display:flex;gap:6px">${e.price?`<span class="pill" style="background:#F5E2A8">${esc(e.price)}</span>`:''}${e.token?'<span class="pill" style="background:#F3C29B">ТыквоФишка</span>':''}</div></div></div>`).join('')||'<div class="card pad">Нет событий</div>';
  app.innerHTML=h;
  app.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{S.aday=b.dataset.ad;afishaView()});
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.evFilter=b.dataset.f;afishaView()});
}
// ---------- Сотрудники (руководитель) ----------
const norm=t=>String(t||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я\s]/g,' ').split(/\s+/).filter(x=>x.length>1);
function simScore(a,b){const A=norm(a),B=norm(b);let sc=0;A.forEach(x=>B.forEach(y=>{if(x===y)sc+=3;else if(x.length>=3&&y.length>=3&&(x.startsWith(y.slice(0,3))||y.startsWith(x.slice(0,3))))sc+=1}));return sc}
const TN={R:'Рейнджеры',K:'Хранители',M:'Метрополис'};
async function staffView(){
  if(!isManager())return go('rot');
  const [pr,ro]=await Promise.all([sb.from('profiles').select('id,full_name,email,role,status,tab_no,team,created_at').order('created_at'),sb.from('roster').select('*').order('team').order('full_name')]);
  const all=pr.data||[],roster=ro.data||[];
  const ap=all.filter(p=>p.status==='approved'),req=all.filter(p=>p.status!=='approved').sort((a,b)=>(a.status==='pending'?0:1)-(b.status==='pending'?0:1));
  const rl=new Map(roster.filter(r=>r.profile_id).map(r=>[r.profile_id,r.full_name]));
  const free=roster.filter(r=>!r.profile_id);
  const dt=d=>d?new Date(d).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'}):'';
  let h=head('Сотрудники','Заявки на регистрацию и список команды');
  h+=`<div class="stat"><div style="background:var(--sage)"><b>${ap.length}</b>в команде</div><div style="background:var(--gold)"><b>${req.filter(p=>p.status==='pending').length}</b>новых заявок</div></div>`;
  h+=`<div class="card pad col"><b>📨 Заявки</b>${req.length?req.map(p=>{
      const opts=free.map(r=>({r,sc:simScore(p.full_name,r.full_name)})).sort((a,b)=>b.sc-a.sc);
      return `<div class="col" style="border-top:1px solid var(--line);padding-top:10px"><div><b>${esc(p.full_name)}</b>${p.status==='rejected'?'<span class="pill" style="background:#E8B4B8;margin-left:6px">отклонена</span>':''}<div class="muted">${esc(p.email||'')} · ${dt(p.created_at)}</div></div>
      <label>Это сотрудник из списка:<select data-rs="${p.id}"><option value="">— не привязывать —</option>${opts.map(({r,sc})=>`<option value="${r.id}" ${sc>=3&&r===opts[0].r?'selected':''}>${sc>0?'★ ':''}${esc(r.full_name)} · ${TN[r.team]}</option>`).join('')}</select></label>
      <div class="two"><button class="btn" data-ok="${p.id}">Одобрить</button>${p.status==='rejected'?'':`<button class="btn ghost" data-no="${p.id}">Отклонить</button>`}</div></div>`}).join(''):'<div class="muted">Новых заявок нет</div>'}<div class="muted">★ — похоже по имени и фамилии. Табельный номер присваивается автоматически при одобрении.</div></div>`;
  h+=`<div class="card pad col"><b>👥 Команда · ${ap.length}</b><div class="muted">Имя (первое слово идёт в приветствие) и табельный номер</div>${ap.map(p=>`<div class="prow"><input class="pn" data-pn="${p.id}" value="${esc(p.full_name||'')}" placeholder="Имя Фамилия"><input class="pt" data-pt="${p.id}" value="${esc(p.tab_no||'')}" placeholder="№"><button class="btn" style="padding:0 14px" data-sp="${p.id}" aria-label="Сохранить">💾</button></div><div class="muted" style="margin-top:-6px">${p.role==='manager'?'руководитель':'сотрудник'}${rl.get(p.id)?' · в списке: '+esc(rl.get(p.id)):''}${p.team?' · '+(TN[p.team]||''):''} · с ${dt(p.created_at)}</div>`).join('')}</div>`;
  h+=`<div class="card pad col"><b>📋 Ещё не зарегистрировались · ${free.length}</b><div class="muted">${free.length?free.map(r=>esc(r.full_name)).join(', '):'Все из списка уже в приложении'}</div></div>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-ok]').forEach(b=>b.onclick=async()=>{const id=b.dataset.ok,rs=app.querySelector(`[data-rs="${id}"]`).value;b.disabled=true;
    const r=await sb.rpc('approve_member',{p_id:id,p_roster:rs?+rs:null});if(r.error){alert('Не удалось одобрить: '+r.error.message);return staffView()}
    alert('Одобрено. Табельный номер: '+r.data);S.people=[];staffView().then(refreshUnread)});
  app.querySelectorAll('[data-no]').forEach(b=>b.onclick=async()=>{if(!confirm('Отклонить заявку?'))return;const r=await sb.rpc('reject_member',{p_id:b.dataset.no});if(r.error)alert(r.error.message);staffView().then(refreshUnread)});
  app.querySelectorAll('[data-sp]').forEach(b=>b.onclick=async()=>{const id=b.dataset.sp,full_name=app.querySelector(`[data-pn="${id}"]`).value.trim(),tab_no=app.querySelector(`[data-pt="${id}"]`).value.trim()||null;
    const r=await sb.from('profiles').update({full_name,tab_no}).eq('id',id);if(r.error)return alert('Не удалось сохранить: '+r.error.message);
    if(id===S.me.id){S.me.full_name=full_name;S.me.tab_no=tab_no}S.people=[];b.textContent='✅';setTimeout(()=>staffView(),600)});
}
// ---------- Настройки ----------

// ---------- DreamGile ----------
const PRI={low:['Низкий','#B7CFC4'],normal:['Обычный','#BCC8D6'],high:['Высокий','#F3C29B'],urgent:['Срочно','#E08A7A']};
const LBL=['#C9D4B0','#E6CC8F','#B7CFC4','#D3BFD0','#BCC8D6','#E4B5A3'];
S.dg={board:null,mine:false,rt:false};
const ini=n=>(String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('')||'?').toUpperCase();
const pname=id=>(S.dg.people||[]).find(p=>p.id===id)?.full_name||'—';
const dgFmt=d=>d?new Date(d+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'short'}):'';
const dgOver=t=>t.deadline&&!t.done&&t.deadline<iso(new Date());
async function dgLoad(){
  const [b,p]=await Promise.all([sb.from('dg_boards').select('*').order('created_at'),sb.from('profiles').select('id,full_name,tab_no').eq('status','approved').order('full_name')]);
  S.dg.boards=b.data||[];S.dg.people=p.data||[];
  if(!S.dg.board||!S.dg.boards.find(x=>x.id===S.dg.board))S.dg.board=S.dg.boards[0]?.id;
  S.dg.cols=[];S.dg.tasks=[];S.dg.cl={};S.dg.cm={};
  if(!S.dg.board)return;
  const [c,t]=await Promise.all([sb.from('dg_columns').select('*').eq('board_id',S.dg.board).order('pos'),sb.from('dg_tasks').select('*').eq('board_id',S.dg.board).order('pos')]);
  S.dg.cols=c.data||[];S.dg.tasks=t.data||[];
  const ids=S.dg.tasks.map(x=>x.id);if(!ids.length)return;
  const [cl,cm]=await Promise.all([sb.from('dg_checklist').select('task_id,done').in('task_id',ids),sb.from('dg_comments').select('task_id').in('task_id',ids)]);
  (cl.data||[]).forEach(x=>{const o=S.dg.cl[x.task_id]||(S.dg.cl[x.task_id]=[0,0]);o[1]++;if(x.done)o[0]++});
  (cm.data||[]).forEach(x=>S.dg.cm[x.task_id]=(S.dg.cm[x.task_id]||0)+1);
}
async function dgView(){
  await dgLoad();const D=S.dg;
  if(!D.rt){D.rt=true;try{sb.channel('dg-live').on('postgres_changes',{event:'*',schema:'public',table:'dg_tasks'},()=>{if(S.tab==='dg'&&!document.querySelector('.ov'))dgView()}).subscribe()}catch(e){}}
  let h=head('DreamGile','Задачи команды');
  if(!D.board){app.innerHTML=h+`<div class="card pad">Досок пока нет.${isManager()?'<br><button class="btn" id="nb" style="margin-top:10px">Создать доску</button>':''}</div>`;$('#nb')?.addEventListener('click',dgNewBoard);return}
  h+=`<div class="two"><label style="flex:1"><select id="bsel">${D.boards.map(b=>`<option value="${b.id}" ${b.id===D.board?'selected':''}>${esc(b.title)}</option>`).join('')}</select></label>${isManager()?'<button class="btn ghost" id="nb" style="min-height:48px">+ Доска</button>':''}</div>`;
  h+=`<div class="tabs"><button data-f="all" class="${D.mine?'':'on'}" style="background:#E3EAD2">${isManager()?'Все задачи':'Мои задачи'}</button>${isManager()?`<button data-f="mine" class="${D.mine?'on':''}" style="background:#E3EAD2">Только мои</button>`:''}${isManager()?'<button id="ac" style="background:#E3EAD2">+ Колонка</button>':''}</div>`;
  h+=`<div class="two"><label style="flex:1"><input id="dq" type="search" placeholder="🔍 Поиск по задачам и людям" value="${esc(D.q||'')}"></label><button class="btn ghost" id="dod" style="min-height:48px;${D.od?'background:#E08A7A;border-color:#E08A7A':''}">⏰ Просрочено</button></div>`;
  const last=D.cols[D.cols.length-1]?.id;
  const vis=D.tasks.filter(t=>!D.mine||t.assignees.includes(S.me.id));
  h+=`<div class="dgcols">${D.cols.map(c=>{const ts=vis.filter(t=>t.column_id===c.id);return `<div class="dgcol" data-col="${c.id}"><div class="dgch" style="background:${c.color||'#BCC8D6'}"><b>${esc(c.title)}</b><span class="cnt">${ts.length}</span>${isManager()?`<button class="x" data-cm="${c.id}" style="width:30px;height:30px;font-size:14px">⋯</button>`:''}</div><div class="dgtasks">${ts.map(t=>dgCard(t)).join('')||'<div class="muted" style="padding:8px">Пусто</div>'}</div>${isManager()?`<button class="btn ghost" data-add="${c.id}" style="min-height:40px;margin:0 8px 8px">+ Задача</button>`:''}</div>`}).join('')}</div>`;
  if(!D.cols.length)h+='<div class="card pad">В доске нет колонок.'+(isManager()?' Нажми «+ Колонка».':'')+'</div>';
  app.innerHTML=h;
  $('#bsel').onchange=e=>{D.board=e.target.value;dgView()};$('#nb')?.addEventListener('click',dgNewBoard);
  $('#ac')?.addEventListener('click',async()=>{const n=prompt('Название колонки');if(!n)return;const pos=(D.cols.reduce((m,c)=>Math.max(m,+c.pos),0))+1;const r=await sb.from('dg_columns').insert({board_id:D.board,title:n.trim(),pos});if(r.error)alert(r.error.message);dgView()});
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{D.mine=b.dataset.f==='mine';dgView()});
  app.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>dgOpen(null,b.dataset.add));
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{if(Date.now()-(window.__dgNoClick||0)<600)return;dgOpen(b.dataset.open)});
  app.querySelectorAll('[data-cm]').forEach(b=>b.onclick=e=>{e.stopPropagation();dgColMenu(b.dataset.cm)});
  const dgFilter=()=>{const q=($('#dq').value||'').trim().toLowerCase();D.q=q;app.querySelectorAll('.tk').forEach(el=>{el.style.display=(!q||el.dataset.q.includes(q))&&(!D.od||el.dataset.od==='1')?'':'none'});app.querySelectorAll('.dgcol').forEach(c=>{c.querySelector('.cnt').textContent=[...c.querySelectorAll('.tk')].filter(x=>x.style.display!=='none').length})};
  $('#dq').oninput=dgFilter;$('#dod').onclick=()=>{D.od=!D.od;dgView()};if(D.q||D.od)dgFilter();
  if(matchMedia('(pointer:fine)').matches)app.querySelectorAll('.tk').forEach(el=>{el.draggable=true;el.ondragstart=e=>{e.dataTransfer.setData('text/plain',el.dataset.open)}});
  dgTouch();
  app.querySelectorAll('.dgcol').forEach(el=>{el.ondragover=e=>{e.preventDefault();el.classList.add('over')};el.ondragleave=()=>el.classList.remove('over');el.ondrop=e=>{e.preventDefault();el.classList.remove('over');dgMove(e.dataTransfer.getData('text/plain'),el.dataset.col)}});
}

// перенос задач пальцем: долгое нажатие на карточку (0,4 с) → тянем в нужную колонку
function dgTouch(){
  const wrap=app.querySelector('.dgcols');if(!wrap)return;
  let st=null;
  const colAt=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest('.dgcol')};
  const clear=()=>{app.querySelectorAll('.dgcol.over').forEach(c=>c.classList.remove('over'))};
  const end=()=>{if(!st)return;clearTimeout(st.timer);if(st.ghost)st.ghost.remove();if(st.el)st.el.classList.remove('lift');clear();cancelAnimationFrame(st.raf);st=null};
  const scrollLoop=()=>{if(!st||!st.on)return;const r=wrap.getBoundingClientRect();if(st.x<r.left+50)wrap.scrollLeft-=12;else if(st.x>r.right-50)wrap.scrollLeft+=12;
    const sc=app;const ar=sc.getBoundingClientRect();if(st.y<ar.top+60)sc.scrollTop-=10;else if(st.y>ar.bottom-60)sc.scrollTop+=10;
    clear();const c=colAt(st.x,st.y);if(c)c.classList.add('over');st.raf=requestAnimationFrame(scrollLoop)};
  app.querySelectorAll('.tk').forEach(el=>{
    el.addEventListener('touchstart',e=>{
      if(e.touches.length!==1)return;const t=e.touches[0];
      st={el,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,on:false};
      st.timer=setTimeout(()=>{if(!st)return;st.on=true;if(navigator.vibrate)navigator.vibrate(25);
        const g=el.cloneNode(true);g.className='tk ghost';g.style.width=el.offsetWidth+'px';g.style.left=(st.x-el.offsetWidth/2)+'px';g.style.top=(st.y-30)+'px';document.body.appendChild(g);st.ghost=g;el.classList.add('lift');st.raf=requestAnimationFrame(scrollLoop)},380);
    },{passive:true});
    el.addEventListener('touchmove',e=>{
      if(!st)return;const t=e.touches[0];st.x=t.clientX;st.y=t.clientY;
      if(!st.on){if(Math.abs(st.x-st.sx)>8||Math.abs(st.y-st.sy)>8){clearTimeout(st.timer);st=null}return}
      e.preventDefault();st.ghost.style.left=(st.x-st.ghost.offsetWidth/2)+'px';st.ghost.style.top=(st.y-30)+'px';
    },{passive:false});
    const fin=async e=>{
      if(!st)return;const s=st;
      if(s.on){e.preventDefault();const c=colAt(s.x,s.y);const id=s.el.dataset.open;end();if(c)await dgMove(id,c.dataset.col);else dgView();window.__dgNoClick=Date.now()}else end()};
    el.addEventListener('touchend',fin,{passive:false});el.addEventListener('touchcancel',()=>end(),{passive:true});
    el.addEventListener('contextmenu',e=>{if(st&&st.on)e.preventDefault()});
  });
}
function dgCard(t){
  const cl=S.dg.cl[t.id],cm=S.dg.cm[t.id];
  return `<div class="tk" data-open="${t.id}" data-q="${esc((t.title+' '+(t.descr||'')+' '+t.assignees.map(pname).join(' ')).toLowerCase())}" data-od="${dgOver(t)?1:0}" style="border-left:6px solid ${t.label||'transparent'}"><div class="tt">${t.done?'✅ ':''}${esc(t.title)}</div><div class="tm">${t.priority!=='normal'?`<span class="pill" style="background:${PRI[t.priority][1]}">${PRI[t.priority][0]}</span>`:''}${t.deadline?`<span class="pill" style="background:${dgOver(t)?'#E08A7A':'#F1E8DA'}">📅 ${dgFmt(t.deadline)}</span>`:''}${cl?`<span class="pill" style="background:#F1E8DA">☑ ${cl[0]}/${cl[1]}</span>`:''}${cm?`<span class="pill" style="background:#F1E8DA">💬 ${cm}</span>`:''}</div>${t.assignees.length?`<div class="av">${t.assignees.slice(0,4).map(a=>`<i title="${esc(pname(a))}">${esc(ini(pname(a)))}</i>`).join('')}${t.assignees.length>4?`<i>+${t.assignees.length-4}</i>`:''}</div>`:''}</div>`}
async function dgMove(id,colId){
  const D=S.dg,t=D.tasks.find(x=>x.id===id);if(!t||t.column_id===colId)return;
  const pos=D.tasks.filter(x=>x.column_id===colId).reduce((m,x)=>Math.max(m,+x.pos),0)+1;
  const last=D.cols[D.cols.length-1]?.id;
  const r=await sb.from('dg_tasks').update({column_id:colId,pos,done:colId===last}).eq('id',id);
  if(r.error)alert('Не удалось перенести: '+r.error.message);dgView();
}
async function dgNewBoard(){
  const n=prompt('Название доски');if(!n)return;
  const b=await sb.from('dg_boards').insert({title:n.trim()}).select().single();
  if(b.error)return alert(b.error.message);
  await sb.from('dg_columns').insert(['Нужно сделать','В работе','На проверке','Готово'].map((t,i)=>({board_id:b.data.id,title:t,pos:i+1,color:['#BCC8D6','#E6CC8F','#D3BFD0','#C9D4B0'][i]})));
  S.dg.board=b.data.id;dgView();
}
async function dgColMenu(id){
  const c=S.dg.cols.find(x=>x.id===id);const a=prompt('Колонка «'+c.title+'»\n1 — переименовить\n2 — сдвинуть влево\n3 — сдвинуть вправо\n4 — удалить (вместе с задачами)','1');
  if(a==='1'){const n=prompt('Новое название',c.title);if(n)await sb.from('dg_columns').update({title:n.trim()}).eq('id',id)}
  else if(a==='2'||a==='3'){const L=S.dg.cols,i=L.findIndex(x=>x.id===id),j=a==='2'?i-1:i+1;if(L[j]){await sb.from('dg_columns').update({pos:L[j].pos}).eq('id',id);await sb.from('dg_columns').update({pos:c.pos}).eq('id',L[j].id)}}
  else if(a==='4'&&confirm('Удалить колонку и все её задачи?'))await sb.from('dg_columns').delete().eq('id',id);
  dgView();
}
async function dgOpen(id,colId){
  const D=S.dg,mgr=isManager();
  let t=id?D.tasks.find(x=>x.id===id):{id:null,column_id:colId,title:'',descr:'',assignees:[],deadline:null,priority:'normal',label:null,done:false};
  if(!t)return;
  let cl=[],cm=[];
  if(id){const [a,b]=await Promise.all([sb.from('dg_checklist').select('*').eq('task_id',id).order('pos'),sb.from('dg_comments').select('*').eq('task_id',id).order('created_at')]);cl=a.data||[];cm=b.data||[]}
  const ov=document.createElement('div');ov.className='ov';
  const ro=!mgr?'disabled':'';
  const draw=()=>{ov.innerHTML=`<div class="sheet"><div class="sh"><button class="x" id="bk" aria-label="Назад">←</button><b>${id?'Задача':'Новая задача'}</b><span></span></div><div class="sb col">
  <label>Название<input id="f_t" value="${esc(t.title)}" ${ro}></label>
  <label>Описание<textarea id="f_d" ${ro}>${esc(t.descr||'')}</textarea></label>
  <label>Колонка<select id="f_c">${D.cols.map(c=>`<option value="${c.id}" ${c.id===t.column_id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label>
  <div class="two"><label>Срок<input id="f_dl" type="date" value="${t.deadline||''}" ${ro}></label><label>Приоритет<select id="f_p" ${ro}>${Object.entries(PRI).map(([k,v])=>`<option value="${k}" ${k===t.priority?'selected':''}>${v[0]}</option>`).join('')}</select></label></div>
  <div><b style="font-size:14px">Метка</b><div class="chips" style="margin-top:6px">${[null,...LBL].map(c=>`<button class="lb ${(t.label||null)===c?'on':''}" data-l="${c||''}" style="background:${c||'#fff'}" ${ro}>${c?'':'—'}</button>`).join('')}</div></div>
  <div><b style="font-size:14px">Исполнители</b><div class="chips" style="margin-top:6px">${D.people.map(p=>`<button class="as ${t.assignees.includes(p.id)?'on':''}" data-a="${p.id}" ${ro}>${esc(p.full_name||'?')}</button>`).join('')}</div></div>
  ${id?`<div><b style="font-size:14px">Чек-лист</b>${cl.map(x=>`<div class="otr"><label style="flex-direction:row;align-items:center;gap:8px;font-weight:600"><input type="checkbox" data-ck="${x.id}" ${x.done?'checked':''} style="width:22px;min-height:22px"> <span style="${x.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(x.text)}</span></label>${mgr?`<button class="x" data-cd="${x.id}">×</button>`:''}</div>`).join('')}${mgr?'<div class="prow" style="margin-top:6px"><input id="f_ck" placeholder="Новый пункт" class="pn"><button class="btn" id="f_cka">+</button></div>':''}</div>
  <div><b style="font-size:14px">Комментарии</b>${cm.map(x=>`<div class="cmt"><b>${esc(pname(x.author))}</b> <span class="muted">${ago(x.created_at)}</span><div style="white-space:pre-wrap">${esc(x.body)}</div></div>`).join('')||'<div class="muted">Пока нет</div>'}<div class="prow" style="margin-top:6px"><input id="f_cm" placeholder="Написать комментарий" class="pn"><button class="btn" id="f_cma">➤</button></div></div>`:''}
  ${mgr?'<button class="btn" id="sv">Сохранить</button>':''}${mgr&&id?'<button class="btn ghost" id="dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить задачу</button>':''}
  <div class="err" id="er"></div></div></div>`;bind()};
  const close=()=>{ov.remove();document.body.style.overflow='';dgView()};
  const reload=async()=>{const [a,b]=await Promise.all([sb.from('dg_checklist').select('*').eq('task_id',id).order('pos'),sb.from('dg_comments').select('*').eq('task_id',id).order('created_at')]);cl=a.data||[];cm=b.data||[];readForm();draw()};
  const readForm=()=>{if(mgr){t.title=$('#f_t').value;t.descr=$('#f_d').value;t.deadline=$('#f_dl').value||null;t.priority=$('#f_p').value}t.column_id=$('#f_c').value};
  const bind=()=>{
    ov.querySelector('#bk').onclick=close;
    ov.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{readForm();t.label=b.dataset.l||null;draw()});
    ov.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{readForm();const a=b.dataset.a;t.assignees=t.assignees.includes(a)?t.assignees.filter(x=>x!==a):[...t.assignees,a];draw()});
    ov.querySelectorAll('[data-ck]').forEach(b=>b.onchange=async()=>{await sb.from('dg_checklist').update({done:b.checked}).eq('id',b.dataset.ck);reload()});
    ov.querySelectorAll('[data-cd]').forEach(b=>b.onclick=async()=>{await sb.from('dg_checklist').delete().eq('id',b.dataset.cd);reload()});
    ov.querySelector('#f_cka')?.addEventListener('click',async()=>{const v=$('#f_ck').value.trim();if(!v)return;await sb.from('dg_checklist').insert({task_id:id,text:v,pos:cl.reduce((m,x)=>Math.max(m,+x.pos),0)+1});reload()});
    ov.querySelector('#f_cma')?.addEventListener('click',async()=>{const v=$('#f_cm').value.trim();if(!v)return;const r=await sb.from('dg_comments').insert({task_id:id,body:v});if(r.error)ov.querySelector('#er').textContent=r.error.message;else reload()});
    ov.querySelector('#dl')?.addEventListener('click',async()=>{if(!confirm('Удалить задачу?'))return;await sb.from('dg_tasks').delete().eq('id',id);close()});
    ov.querySelector('#sv')?.addEventListener('click',async()=>{
      readForm();if(!t.title.trim())return ov.querySelector('#er').textContent='Введи название';
      const last=D.cols[D.cols.length-1]?.id;const pos=id&&t.column_id===D.tasks.find(x=>x.id===id).column_id?D.tasks.find(x=>x.id===id).pos:D.tasks.filter(x=>x.column_id===t.column_id).reduce((m,x)=>Math.max(m,+x.pos),0)+1;
      const row={board_id:D.board,column_id:t.column_id,title:t.title.trim(),descr:t.descr,assignees:t.assignees,deadline:t.deadline,priority:t.priority,label:t.label,pos,done:t.column_id===last};
      const r=id?await sb.from('dg_tasks').update(row).eq('id',id):await sb.from('dg_tasks').insert(row);
      if(r.error)ov.querySelector('#er').textContent=r.error.message;else close()});
    // сотрудник: смена колонки сразу сохраняется
    if(!mgr)ov.querySelector('#f_c').onchange=async e=>{await dgMove(id,e.target.value);ov.remove();document.body.style.overflow=''};
  };
  document.body.appendChild(ov);document.body.style.overflow='hidden';draw();
}

async function settingsView(){
  const cur=getTheme();
  let h=head('Настройки','Профиль и оформление');
  h+=`<div class="card pad"><b style="font-size:18px">${esc(S.me.full_name||'')}</b><div class="muted">${isManager()?'Руководитель':'Сотрудник'}${S.me.tab_no?` · табельный № ${esc(S.me.tab_no)}`:' · табельный номер пока не назначен'}</div></div>`;
  h+=`<div class="card pad"><b>Оформление</b><div class="muted">Четыре сезона, у каждого тёплый и холодный вариант</div>${Object.entries(THEMES).map(([k,[ic,n]])=>`<div class="trow"><span>${ic} ${n}</span>${[['warm','Тёплый'],['cold','Холодный']].map(([v,t])=>`<button class="tbtn ${cur===k+'-'+v?'on':''}" data-th="${k}-${v}"><i class="sw" data-theme="${k}-${v}"></i>${t}</button>`).join('')}</div>`).join('')}</div>`;
  h+=`<button class="btn ghost" id="out">Выйти из аккаунта</button>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{applyTheme(b.dataset.th);settingsView()});
  $('#out').onclick=()=>sb.auth.signOut().then(()=>{S.me=null;S.unread=0;boot()});
}
sb.auth.onAuthStateChange(()=>{});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
boot();
