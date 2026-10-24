const $=s=>document.querySelector(s),app=$('#app'),nav=$('#nav');
const cfg=window.APP_CONFIG;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const S={tab:'rot',me:null,team:'R',day:null,month:new Date(),viewUser:null,sel:null,people:[],marks:{},ev:null,evFilter:'all'};
const ZC={'Веревочный лагерь':'#C9D4B0','Золото':'#E6CC8F','Гольф':'#B7CFC4','Альфа':'#D3BFD0','Боулинг':'#BCC8D6','Кино':'#E4B5A3','VR-арена':'#BFD3D3','Няня 1':'#D9C3AE','Няня 2':'#D9C3AE','Детский клуб':'#E8C1B5'};
const STEPC={'Боулинг':'#BCC8D6','Ос':'#F3C29B','Гольф':'#B7CFC4','Золото':'#E6CC8F','Метро':'#CFC6BC','Веревочный лагерь / инд. задачи':'#C9D4B0'};
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
async function rotView(){
  const today=new Date(),d1=new Date(today.getTime()+864e5),d2=new Date(today.getTime()+2*864e5);
  const days=[['Завтра',d1],['Послезавтра',d2]];
  S.day=S.day||iso(d1);
  const {data}=await sb.from('rotations').select('*').eq('day',S.day).maybeSingle();
  const rot=data?.data;
  let h=head('Ротации',`Привет, ${esc(S.me.full_name||'')}!`);
  h+=`<div class="seg">${days.map(([n,d])=>`<button class="${iso(d)===S.day?'on':''}" data-d="${iso(d)}">${n}<br><small>${d.toLocaleDateString('ru',{weekday:'short',day:'numeric',month:'short'})}</small></button>`).join('')}</div>`;
  if(!rot){h+=`<div class="card pad"><b>Ротации на этот день пока нет</b><div class="muted">Как только её загрузят, она появится здесь.</div></div>`;app.innerHTML=h;return bindRot()}
  if(rot.banner)h+=`<div class="banner">🎃 ${esc(rot.banner)}</div>`;
  h+=`<div class="tabs">${TEAMS.map(([k,n,c])=>`<button data-t="${k}" class="${S.team===k?'on':''}" style="background:${c}">${n}</button>`).join('')}</div>`;
  const secs=rot.teams?.[S.team]||[];
  for(const s of secs){
    h+=`<div class="card sec"><div class="h">${esc(s.title)}</div>${s.note?`<div class="n" style="background:${s.noteBg||'#E8B4B8'}">${esc(s.note)}</div>`:''}`;
    for(const r of s.rows){
      const c=S.team==='W'?'#7E98AE':(ZC[r.zone]||'#D3BFD0');
      h+=`<div class="row" style="--c:${c}"><b>${esc(r.zone)}</b>${r.note?`<span class="muted">${esc(r.note)}</span>`:''}<div class="chips">${r.people.map(p=>`<div class="chip" style="--c:${c}"><span>${esc(p.icon)} ${esc(p.name)}${p.senior?'<span class="sr">Старший</span>':''}</span>${(p.brks||[]).map(b=>`<span class="pill" style="background:${brkBg(b)}">${esc(b)}</span>`).join('')}</div>`).join('')}</div>`;
      if(r.steps?.length)h+=`<div class="steps">${r.steps.map(x=>`<b>${esc(x[0])}</b><span><span class="pill" style="background:${STEPC[x[1]]||'#eee'}">${esc(x[1])}</span></span>`).join('')}</div>`;
      h+=`</div>`;
    }
    h+=`</div>`;
  }
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

// ---------- Новости ----------
async function newsView(){
  const {data}=await sb.from('news').select('*').order('pinned',{ascending:false}).order('created_at',{ascending:false});
  let h=head('Что нового','Свежее для нашей команды');
  h+=(data||[]).map(n=>`<div class="card pad" style="${n.pinned?'background:#3B2A35;color:#FFFDF9':''}"><b>${n.pinned?'📌 ':''}${esc(n.title)}</b><div style="white-space:pre-wrap;margin-top:8px;font-size:14px;line-height:1.45">${esc(n.body)}</div></div>`).join('')||'<div class="card pad">Пока новостей нет</div>';
  app.innerHTML=h;
}

// ---------- Афиша ----------
async function afishaView(){
  if(!S.ev){const {data}=await sb.from('events').select('*').order('day').order('time');S.ev=data||[]}
  const days=[...new Set(S.ev.map(e=>e.day))];if(!S.aday||!days.includes(S.aday))S.aday=days.includes(iso(new Date()))?iso(new Date()):days[0];
  let list=S.ev.filter(e=>e.day===S.aday);
  if(S.evFilter==='paid')list=list.filter(e=>e.price);if(S.evFilter==='token')list=list.filter(e=>e.token);
  let h=head('Афиша','Что происходит в парке');
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
