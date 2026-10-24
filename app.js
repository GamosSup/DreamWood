const $=s=>document.querySelector(s),app=$('#app'),nav=$('#nav');
const cfg=window.APP_CONFIG;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const S={tab:'rot',me:null,team:'R',day:null,month:new Date(),viewUser:null,sel:null,people:[],marks:{},ev:null,evFilter:'all'};
const ZC={'Веревочный лагерь':'#C9D4B0','Золото':'#E6CC8F','Гольф':'#B7CFC4','Альфа':'#D3BFD0','Боулинг':'#BCC8D6','Кино':'#E4B5A3','VR-арена':'#BFD3D3','Няня 1':'#D9C3AE','Няня 2':'#D9C3AE','Детский клуб':'#E8C1B5'};
const STEPC={'Боулинг':'#BCC8D6','Ос':'#F3C29B','Гольф':'#B7CFC4','Золото':'#E6CC8F','Метро':'#CFC6BC','Веревочный лагерь / инд. задачи':'#C9D4B0','Веревочный лагерь':'#C9D4B0'};
const brkBg=t=>t.startsWith('Ос')?'#F3C29B':t.startsWith('О')?'#F5E2A8':'#E4EDF4';
const TEAMS=[['R','Рейнджеры','#C9D4B0'],['K','Хранители','#B7CFC4'],['M','Метрополис','#E4B5A3'],['W','Если дождь','#7E98AE']];
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const isManager=()=>S.me?.role==='manager';

async function boot(){
  if(cfg.SUPABASE_ANON_KEY.startsWith('ВСТАВЬ')){app.innerHTML='<div class="card pad">Нужно вставить anon key в config.js</div>';return}
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return loginView();
  const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).single();
  S.me=data||{id:session.user.id,full_name:session.user.email,role:'employee'};
  S.viewUser=S.me.id;nav.hidden=false;go(S.tab);
}
function loginView(err){
  nav.hidden=true;
  app.innerHTML=`<div style="margin-top:40px"><div class="muted" style="text-transform:uppercase;font-weight:700">Дримвуд · Mriya Resort &amp; Spa</div><h1>Чудеса начинаются здесь</h1><p class="muted">Вход для команды парка: ротации, график, новости и афиша.</p></div>
  <label>Почта<input id="em" type="email" autocomplete="username" placeholder="name@company.ru"></label>
  <label>Пароль<input id="pw" type="password" autocomplete="current-password"></label>
  <div class="err">${esc(err||'')}</div><button class="btn" id="go">Войти в приключение</button>
  <button class="btn ghost" id="fg">Забыли пароль?</button><div class="muted">Доступ по приглашению от руководителя.</div>`;
  $('#go').onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});error?loginView('Не получилось войти: проверь почту и пароль'):boot()};
  $('#fg').onclick=async()=>{const e=$('#em').value.trim();if(!e)return loginView('Введи почту, пришлём ссылку');await sb.auth.resetPasswordForEmail(e);loginView('Если почта в системе, письмо отправлено')};
}
nav.onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.tab)};
function go(t){S.tab=t;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));({rot:rotView,sch:schView,news:newsView,afisha:afishaView})[t]()}
const head=(h,sub)=>`<div class="muted">${sub||''}</div><div style="display:flex;justify-content:space-between;align-items:center"><h1>${h}</h1><button class="btn ghost" style="min-height:36px" onclick="sb.auth.signOut().then(()=>{S.me=null;boot()})">Выйти</button></div>`;

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
  let h=head('Ротации',`Привет, ${esc(S.me.full_name||'')}!`);
  h+=`<div class="tabs">${days.map(d=>`<button data-d="${d}" class="${d===S.day?'on':''}" style="background:#E3EAD2">${d===todayIso?'Сегодня':dayLabel(d)}${d===todayIso?'<br><small>'+dayLabel(d)+'</small>':''}</button>`).join('')}</div>`;
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
  if(isManager()&&!S.people.length){const {data}=await sb.from('profiles').select('id,full_name').order('full_name');S.people=data||[]}
  const m=S.month,y=m.getFullYear(),mo=m.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0));
  const {data}=await sb.from('marks').select('*').eq('user_id',S.viewUser).gte('day',first).lte('day',last);
  S.marks={};(data||[]).forEach(r=>S.marks[r.day]=r);
  const n=new Date(y,mo+1,0).getDate(),lead=(new Date(y,mo,1).getDay()+6)%7;
  let h=head('График',m.toLocaleDateString('ru',{month:'long',year:'numeric'}));
  if(isManager())h+=`<label>Сотрудник<select id="who">${S.people.map(p=>`<option value="${p.id}" ${p.id===S.viewUser?'selected':''}>${esc(p.full_name)}</option>`).join('')}</select></label>`;
  h+=`<div style="display:flex;gap:8px"><button class="btn ghost" id="pm">←</button><button class="btn ghost" id="nm">→</button></div><div class="cal">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="dh">${d}</div>`).join('')}${'<div></div>'.repeat(lead)}`;
  let worked=0;const cnt={};
  for(let d=1;d<=n;d++){const k=iso(new Date(y,mo,d)),mk=S.marks[k];
    if(!mk)worked++;else cnt[mk.kind]=(cnt[mk.kind]||0)+1;
    h+=`<button class="day ${S.sel===k?'sel':''}" data-k="${k}" style="background:${mk?KINDS[mk.kind][1]:'#FFFDF9'}">${d}<small>${mk?KINDS[mk.kind][0]:''}</small></button>`}
  h+=`</div><div class="stat"><div style="background:#C9D4B0"><b>${worked}</b>рабочих дней</div><div style="background:#E6CC8F"><b>${worked*10}</b>рабочих часов</div></div><div class="muted">Смена 11 ч, из них 1 ч обед → 10 рабочих часов. Дни без отметки считаются рабочими.</div>`;
  if(S.sel){const mk=S.marks[S.sel];
    h+=`<div class="card pad" style="display:flex;flex-direction:column;gap:10px"><b>${S.sel}</b><div class="tabs">${Object.entries(KINDS).map(([k,v])=>`<button data-m="${k}" style="background:${v[1]}" class="${mk?.kind===k?'on':''}">${v[2]}</button>`).join('')}<button data-m="" style="background:#fff;border:1px solid #ccc">Рабочий</button></div><textarea id="note" placeholder="Комментарий">${esc(mk?.note||'')}</textarea><button class="btn" id="save">Сохранить</button></div>`}
  app.innerHTML=h;
  $('#who')?.addEventListener('change',e=>{S.viewUser=e.target.value;S.sel=null;schView()});
  $('#pm').onclick=()=>{S.month=new Date(y,mo-1,1);S.sel=null;schView()};$('#nm').onclick=()=>{S.month=new Date(y,mo+1,1);S.sel=null;schView()};
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{S.sel=b.dataset.k;S.pick=S.marks[S.sel]?.kind||'';schView()});
  app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{S.pick=b.dataset.m;app.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x===b))});
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
// ---------- Новости ----------
async function newsView(){
  const {data}=await sb.from('news').select('*').order('pinned',{ascending:false}).order('created_at',{ascending:false});
  let h=head('Что нового','Свежее для нашей команды')+((data||[]).length?'':importBtn());
  h+=(data||[]).map(n=>{const long=n.body.length>400,open=S.newsOpen?.[n.id];return `<div class="card pad" style="${n.pinned?'background:#3B2A35;color:#FFFDF9':''}"><b>${n.pinned?'📌 ':''}${esc(n.title)}</b><div style="white-space:pre-wrap;margin-top:8px;font-size:14px;line-height:1.45">${esc(long&&!open?n.body.split('\n')[0]:n.body)}</div>${long?`<button class="btn ghost" style="margin-top:10px;min-height:40px;${n.pinned?'color:#FFFDF9;border-color:#FFFDF9':''}" data-nid="${n.id}">${open?'Свернуть':'Развернуть'}</button>`:''}</div>`}).join('')||'<div class="card pad">Пока новостей нет</div>';
  app.innerHTML=h;
  app.querySelectorAll('[data-nid]').forEach(b=>b.onclick=()=>{S.newsOpen=S.newsOpen||{};S.newsOpen[b.dataset.nid]=!S.newsOpen[b.dataset.nid];newsView()});
}

// ---------- Афиша ----------
async function afishaView(){
  if(!S.ev){const {data}=await sb.from('events').select('*').order('day').order('time');S.ev=data||[]}
  const days=[...new Set(S.ev.map(e=>e.day))];if(!S.aday||!days.includes(S.aday))S.aday=days.includes(iso(new Date()))?iso(new Date()):days[0];
  let list=S.ev.filter(e=>e.day===S.aday);
  if(S.evFilter==='paid')list=list.filter(e=>e.price);if(S.evFilter==='token')list=list.filter(e=>e.token);
  let h=head('Афиша','Что происходит в парке')+(S.ev.length?'':importBtn());
  h+=`<div class="tabs">${days.map(d=>`<button data-ad="${d}" class="${d===S.aday?'on':''}" style="background:#E3EAD2">${d.slice(8)}.${d.slice(5,7)}</button>`).join('')}</div>`;
  h+=`<div class="seg">${[['all','Все'],['paid','Платные ₽'],['token','С ТыквоФишкой']].map(([k,n])=>`<button data-f="${k}" class="${S.evFilter===k?'on':''}">${n}</button>`).join('')}</div>`;
  h+=list.map(e=>`<div class="card pad" style="display:flex;gap:12px"><b style="width:60px">${esc(e.time)}</b><div><b>${esc(e.title)}</b><div class="muted">${esc(e.loc)}</div><div style="font-size:14px;margin-top:6px">${esc(e.descr)}</div><div style="margin-top:6px;display:flex;gap:6px">${e.price?`<span class="pill" style="background:#F5E2A8">${esc(e.price)}</span>`:''}${e.token?'<span class="pill" style="background:#F3C29B">ТыквоФишка</span>':''}</div></div></div>`).join('')||'<div class="card pad">Нет событий</div>';
  app.innerHTML=h;
  app.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{S.aday=b.dataset.ad;afishaView()});
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.evFilter=b.dataset.f;afishaView()});
}
sb.auth.onAuthStateChange(()=>{});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
boot();
