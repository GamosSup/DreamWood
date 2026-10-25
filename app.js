const $=s=>document.querySelector(s),app=$('#app'),nav=$('#nav');
const cfg=window.APP_CONFIG;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const THEMES={autumn:['🍂','Осень'],winter:['❄️','Зима'],spring:['🌸','Весна'],summer:['☀️','Лето']};
const getTheme=()=>{try{return localStorage.getItem('dw-theme')||'autumn-warm'}catch(e){return 'autumn-warm'}};
function applyTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('dw-theme',t)}catch(e){}
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||'#3B2A35'}
applyTheme(getTheme());
const S={unread:0,tab:'today',sub:{ap:'req',park:'news',team:'contacts'},me:null,team:'R',day:null,month:new Date(),viewUser:null,sel:null,people:[],marks:{},ev:null,evFilter:'all'};
const ZC={'Данделион':'#E4B5A3','Карусель':'#D3BFD0','Джипы':'#B7CFC4','Шахта':'#BCC8D6','Кон-Тики':'#E6CC8F','Плющ':'#C9D4B0','Дерево приключений':'#C9D4B0','Бабл хаус':'#F3C29B','Студия волшебных образов':'#D3BFD0','Квесты/Роботы':'#BFD3D3','Лес Чудес':'#B7CFC4','Альфа 1':'#D3BFD0','Альфа 2':'#D3BFD0','Старший специалист':'#E8C1B5','Супервайзер':'#E8C1B5','Веревочный лагерь':'#C9D4B0','Золото':'#E6CC8F','Гольф':'#B7CFC4','Альфа':'#D3BFD0','Боулинг':'#BCC8D6','Кино':'#E4B5A3','VR-арена':'#BFD3D3','Няня 1':'#D9C3AE','Няня 2':'#D9C3AE','Детский клуб':'#E8C1B5','Аквазона Кит':'#A9D2EC','Визги-брызги':'#A9D2EC','Купол':'#F0D98A','Бильярд':'#CDB9E3'};

// Ареалы парка: цвет, стикер и какие зоны входят (по ключевым словам в названии)
const AREAS=[
 {k:'forest',n:'Лес',img:'leaf',c:'#C9D4B0',d:'#E6EDD6',re:/веревоч|верёвоч|гольф|золот|лучн/i},
 {k:'water',n:'Вода',img:'drop',c:'#A9D2EC',d:'#DCEDF8',re:/(^|\s)кит($|\s)|аквазон|визг/i},
 {k:'mount',n:'Горы',img:'mountain',c:'#D9B999',d:'#EEDFCF',re:/шахт|карусел|джип/i},
 {k:'air',n:'Воздух',img:'wind',c:'#F0D98A',d:'#F8EFC9',re:/кон-тик|плющ|данделион|купол|сухие горки|квест|робот|бьюти|волшебных образов|террас|бабл|лес чудес|дерево приключ|площад/i},
 {k:'metro',n:'Метрополис',img:'city',c:'#CDB9E3',d:'#E7DDF3',re:/vr|боулинг|детск|бильярд|кино|зонты метрополис|няня/i},
 {k:'other',n:'Прочее',img:'star',c:'#E3D9CB',d:'#F1EBE2',re:/./}
];
const areaOf=z=>AREAS.find(a=>a.re.test(z||''))||AREAS[AREAS.length-1];
function byArea(items,zoneOf){const g=AREAS.map(a=>({a,items:[]}));items.forEach(x=>{const a=areaOf(zoneOf(x));g.find(y=>y.a===a).items.push(x)});return g.filter(y=>y.items.length)}
S.areaOpen=S.areaOpen||{};
const areaHead=(a,right)=>`<summary class="ah" style="background:${a.c}"><span class="ahn"><img src="stickers/${a.img}.svg" alt="" width="30" height="30"> ${a.n}</span><span class="pill" style="background:#FFFDF9;align-self:center">${right}</span></summary>`;
function bindAreas(root){(root||document).querySelectorAll('details.area').forEach(d=>d.addEventListener('toggle',()=>{S.areaOpen[d.dataset.ar]=d.open}))}
const STEPC={'Шахта':'#BCC8D6','Джипы':'#B7CFC4','Карусель':'#D3BFD0','Плющ':'#C9D4B0','Данделион':'#E4B5A3','Кон-Тики':'#E6CC8F','Ротация':'#E3E3E3','Пс':'#F3C29B','Боулинг':'#BCC8D6','Ос':'#F3C29B','Гольф':'#B7CFC4','Золото':'#E6CC8F','Метро':'#CFC6BC','Веревочный лагерь / инд. задачи':'#C9D4B0','Веревочный лагерь':'#C9D4B0'};
const brkBg=t=>t.startsWith('Ос')||t.startsWith('Пс')?'#F3C29B':t.startsWith('О')?'#F5E2A8':'#CFE0EE';
const TEAMS=[['R','Рейнджеры','#C9D4B0'],['K','Хранители','#B7CFC4'],['M','Метрополис','#E4B5A3'],['W','Если дождь','#7E98AE']];
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const isManager=()=>S.me?.role==='manager'||S.me?.role==='admin';
const isAdmin=()=>S.me?.role==='admin';
const isLead=()=>S.me?.role==='lead';
const canMng=()=>isManager()||isLead();
const ROLE_RU={employee:'Сотрудник',lead:'Бригадир',manager:'Руководитель',admin:'Админ'};
// запрос с запасным вариантом: если сети нет — показываем последние сохранённые данные
async function cq(key,fn){
  const k='dw:'+(S.uid||'')+':'+key;
  try{const r=await fn();
    if(!r.error){try{localStorage.setItem(k,JSON.stringify({t:Date.now(),d:r.data}))}catch(e){}return r}
    if(r.status>=400&&r.status<500)return r;
  }catch(e){}
  try{const c=JSON.parse(localStorage.getItem(k));if(c){S.offline=c.t;return {data:c.d,error:null,cached:true}}}catch(e){}
  return {data:null,error:{message:'Нет сети'}};
}
const clearCache=()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('dw:')).forEach(k=>localStorage.removeItem(k))}catch(e){}};

async function boot(){
  if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
  if(cfg.SUPABASE_ANON_KEY.startsWith('ВСТАВЬ')){app.innerHTML='<div class="card pad">Нужно вставить anon key в config.js</div>';return}
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return authView('in');
  S.uid=session.user.id;
  const {data}=await cq('me',()=>sb.from('profiles').select('*').eq('id',session.user.id).single());
  S.me=data||{id:session.user.id,full_name:session.user.email,role:'employee',status:'pending'};
  S.viewUser=S.me.id;
  if(S.me.status!=='approved')return pendingView();
  nav.hidden=false;nav.querySelectorAll('[data-mgr]').forEach(b=>b.hidden=!isManager());nav.querySelectorAll('[data-lead]').forEach(b=>b.hidden=!canMng());go(S.tab);
  const g=new URLSearchParams(location.search).get('go');if(g){history.replaceState(null,'',location.pathname);openLink(g)}
  window.pushRefresh&&pushRefresh();
}
const normPhone=v=>{let d=String(v||'').replace(/\D/g,'');if(d.length===11&&d[0]==='8')d='7'+d.slice(1);if(d.length===10)d='7'+d;return d.length>=11&&d.length<=15?d:''};
const phEmail=d=>d+'@dreamwood.pages.dev';
function authView(mode,err,ok){
  nav.hidden=true;const reg=mode==='up';
  app.innerHTML=`<div style="margin-top:24px"><div class="authhd"><img class="alogo" src="stickers/logo.webp" alt="Дримвуд — парк чудес и приключений"><img class="amas" src="stickers/mascot-hi.webp" alt=""></div><h1>Чудеса начинаются здесь</h1><p class="muted">Приложение команды парка: ротации, график, афиша и новости.</p></div>
  <div class="seg"><button id="tin" class="${reg?'':'on'}">Вход</button><button id="tup" class="${reg?'on':''}">Регистрация</button></div>
  ${reg?`<div class="two"><label>Имя<input id="fn" autocomplete="given-name" placeholder="Игорь"></label><label>Фамилия<input id="ln" autocomplete="family-name" placeholder="Шубчик"></label></div>
  `:''}
  <label>${reg?'Телефон (это твой логин)':'Телефон'}<input id="ph" type="tel" autocomplete="${reg?'tel':'username'}" placeholder="+7 978 123-45-67"></label>
  ${reg?'<label>Почта (необязательно)<input id="em" type="email" autocomplete="email" placeholder="name@company.ru"></label>':''}
  <label>Пароль${reg?' (придумай сам, не короче 6 знаков)':''}<input id="pw" type="password" autocomplete="${reg?'new-password':'current-password'}"></label>
  <div class="err">${esc(err||'')}</div>${ok?`<div class="card pad" style="background:var(--sage)">${esc(ok)}</div>`:''}
  <button class="btn" id="go">${reg?'Отправить заявку':'Войти в приключение'}</button>
  ${reg?'<div class="muted">Номер телефона — твой логин, почта не обязательна и нужна только для связи: мы ничего на неё не отправляем. Руководитель подтвердит доступ. Пароль знаешь только ты.</div>':'<div class="muted">Нет аккаунта? Открой «Регистрацию»: руководитель подтвердит заявку. Забыл пароль — напиши руководителю, он задаст новый.</div>'}`;
  $('#tin').onclick=()=>authView('in');$('#tup').onclick=()=>authView('up');
  $('#go').onclick=async()=>{
    const password=$('#pw').value,ph=normPhone($('#ph').value),email=$('#em')?.value.trim()||'';
    if(!ph)return authView(reg?'up':'in','Введи номер телефона полностью, например +7 978 123-45-67');
    if(!reg){const {error}=await sb.auth.signInWithPassword({email:phEmail(ph),password});return error?authView('in','Не получилось войти: проверь номер и пароль'):boot()}
    const fn=$('#fn').value.trim(),ln=$('#ln').value.trim();
    if(!fn||!ln)return authView('up','Укажи имя и фамилию');
    if(email&&!/^\S+@\S+\.\S+$/.test(email))return authView('up','Проверь почту или оставь поле пустым');
    if(password.length<6)return authView('up','Пароль должен быть не короче 6 знаков');
    $('#go').disabled=true;
    const {data,error}=await sb.auth.signUp({email:phEmail(ph),password,options:{data:{full_name:fn+' '+ln,phone:'+'+ph,contact_email:email}}});
    if(error)return authView('up',/registered|already/i.test(error.message)?'Этот номер уже зарегистрирован: открой «Вход»':'Не удалось зарегистрироваться: '+error.message);
    if(data.session)return boot();
    authView('in','', 'Заявка отправлена. Руководитель подтвердит доступ: тогда войдёшь по номеру телефона и паролю.');
  };
}
const loginView=err=>authView('in',err);
function pendingView(){
  nav.hidden=true;const rej=S.me.status==='rejected';
  app.innerHTML=`<div style="margin-top:40px"><div style="font-size:54px">${rej?'🚫':'⏳'}</div><h1>${rej?'Заявка отклонена':'Ждём подтверждения'}</h1>
  <p class="muted">${rej?'Руководитель не подтвердил доступ. Если это ошибка, напиши ему напрямую.':`Привет, ${esc(firstName())}! Заявка отправлена руководителю. Как только он её подтвердит, откроются ротации, график и афиша.`}</p></div>
  <div class="card pad"><b>${esc(S.me.full_name||'')}</b><div class="muted">${esc(S.me.email||'')}</div></div>
  <button class="btn" id="chk">Проверить ещё раз</button><button class="btn ghost" id="out">Выйти</button>`;
  $('#chk').onclick=boot;$('#out').onclick=()=>sb.auth.signOut().then(()=>{clearCache();S.me=null;boot()});
}
nav.onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.tab)};
const VIEWS={sch:schView,afisha:afishaView,dg:dgView,staff:staffView,set:settingsView};
VIEWS.ap=()=>VIEWS[S.sub.ap]();VIEWS.park=()=>VIEWS[S.sub.park]();
VIEWS.team=()=>{if(!isAdmin())S.sub.team='contacts';return VIEWS[S.sub.team]()};
function subBar(g,cur){const L={ap:[['req','📨','Заявки'],['fix','🛠','Поломки'],['inc','🚨','Происшествия']],park:[['news','📰','Новости'],['afisha','🎟️','Афиша']],team:[['contacts','📞','Контакты'],...(isAdmin()?[['staff','👥','Сотрудники']]:[])]}[g];if(!L||L.length<2)return '';const b=S.badges||{};
  return `<div class="seg subbar">${L.map(([k,ic,n])=>`<button data-sub="${k}" class="${k===cur?'on':''}">${ic} ${n}${b[k]&&k!==cur?` <i class="sbn">${b[k]}</i>`:''}</button>`).join('')}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(b&&S.me)go(b.dataset.sub)});
const MORE_TABS=['shift','park','kb','team','grid','feedback','todo','set'];
const SUBG={req:'ap',fix:'ap',inc:'ap',news:'park',afisha:'park',contacts:'team',staff:'team'};
const onTab=k=>SUBG[k]?(S.tab===SUBG[k]&&S.sub[SUBG[k]]===k):S.tab===k;
function go(t){if(SUBG[t]){S.sub[SUBG[t]]=t;t=SUBG[t]}if(!VIEWS[t]||(t==='dg'&&!isManager()))t='today';S.tab=t;S.offline=0;document.body.dataset.tab=S.sub[t]||t;
  nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t||(b.dataset.tab==='more'&&MORE_TABS.includes(t))));window.scrollTo(0,0);app.scrollTop=0;
  Promise.resolve(VIEWS[t]()).then(refreshUnread)}
const NKNOWN=new Set(['req','fix','inc','news','afisha','staff','rot','dg','shift','set','feedback']);
const NLK=l=>{l=String(l||'');return l.startsWith('rot:')?'rot':l.startsWith('checkin')?'':l};
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function paintBell(){const el=$('#bellN');if(!el)return;const tot=(S.unread||0)+(S.due||[]).length+(S.ckPending?1:0);el.hidden=!tot;el.textContent=tot>9?'9+':tot}
// красные кружки у пунктов меню: считаем непросмотренные уведомления по разделам (+ «База знаний» и «График» — по изменениям)
function paintBadges(){
  const c=k=>(S.nl||[]).filter(x=>x.k===k).length,B={};
  ['req','fix','inc','news','afisha','staff','rot','dg','shift','set','feedback'].forEach(k=>B[k]=c(k));
  B.contacts=0;B.kb=S.kbNew||0;B.sch=S.schNew||0;
  B.ap=B.req+B.fix+B.inc;B.park=B.news+B.afisha;B.team=B.staff;B.today=0;B.grid=0;
  B.more=B.shift+B.park+B.kb+B.team+B.set+B.feedback;
  S.badges=B;
  nav.querySelectorAll('button[data-tab]').forEach(btn=>{let i=btn.querySelector('i');const n=B[btn.dataset.tab]||0;
    if(!i){i=document.createElement('i');i.hidden=true;btn.appendChild(i)}
    i.hidden=!n;i.textContent=n>99?'99+':n});
  document.querySelectorAll('.subbar [data-sub]').forEach(btn=>{const k=btn.dataset.sub,n=btn.classList.contains('on')?0:(B[k]||0);let i=btn.querySelector('.sbn');
    if(!n){if(i)i.remove();return}if(!i){i=document.createElement('i');i.className='sbn';btn.appendChild(document.createTextNode(' '));btn.appendChild(i)}i.textContent=n});
}
// открыл раздел — его уведомления считаются просмотренными
async function markSeen(){
  const t=S.tab,keys=[(t==='ap'||t==='park'||t==='team')?S.sub[t]:t];
  if(t==='kb'){lsSet('dw_seen_kb',new Date().toISOString());S.kbNew=0}
  if(t==='sch'&&S.schCur){lsSet('dw_seen_sch',JSON.stringify(S.schCur));S.schNew=0}
  const ids=(S.nl||[]).filter(x=>keys.includes(x.k)).map(x=>x.id);
  if(ids.length&&!S.offline){S.nl=S.nl.filter(x=>!ids.includes(x.id));S.unread=Math.max(0,(S.unread||0)-ids.length);
    sb.from('notif_reads').upsert(ids.map(id=>({user_id:S.me.id,notif_id:id}))).then(()=>{},()=>{})}
  paintBadges();paintBell();
}
async function refreshUnread(){
  if(!S.me||S.me.status!=='approved')return;
  const [n,r,p]=await Promise.all([sb.from('notifications').select('id,kind,link'),sb.from('notif_reads').select('notif_id').eq('user_id',S.me.id),isAdmin()?sb.from('profiles').select('id',{count:'exact',head:true}).eq('status','pending'):Promise.resolve({count:0})]);
  if(!n.error&&!r.error){const seen=new Set((r.data||[]).map(x=>x.notif_id));const un=(n.data||[]).filter(x=>!seen.has(x.id));S.unread=un.length;S.nl=un.map(x=>({id:x.id,k:NLK(x.link)})).filter(x=>x.k)}
  try{const today=iso(new Date());S.ckPending=false;
    if(!n.error&&(n.data||[]).some(x=>x.kind==='checkin'&&x.link==='checkin:'+today)){const c=await sb.from('checkins').select('at').eq('user_id',S.me.id).eq('day',today).maybeSingle();S.ckPending=!c.data}}catch(e){}
  try{if(!isManager())throw 0;const q=await sb.from('dg_tasks').select('id,title,deadline,assignees').eq('done',false).not('deadline','is',null);
    const lim=iso(new Date(Date.now()+864e5));S.due=(q.data||[]).filter(t=>(t.assignees||[]).includes(S.me.id)&&t.deadline<=lim).sort((a,b)=>a.deadline<b.deadline?-1:1)}catch(e){S.due=[]}
  S.pending=p.count||0;
  try{const q=await sb.from('requests').select('id,status,peer_id').in('status',['peer','pending']);
    const rq=(q.data||[]).filter(x=>(x.status==='pending'&&canMng())||(x.status==='peer'&&x.peer_id===S.me.id)).length;
    let fx=0;if(isManager()){const q2=await sb.from('repairs').select('id',{count:'exact',head:true}).eq('status','new');fx=q2.count||0}
    S.act={req:rq,fix:fx,staff:S.pending}}catch(e){S.act=S.act||{}}
  // «База знаний»: страницы, изменённые не мной после последнего просмотра
  try{let ks=lsGet('dw_seen_kb');if(!ks){ks=new Date().toISOString();lsSet('dw_seen_kb',ks);S.kbNew=0}
    else{const q=await sb.from('kb_pages').select('id,updated_by').gt('updated_at',ks);S.kbNew=(q.data||[]).filter(x=>x.updated_by!==S.me.id).length}}catch(e){S.kbNew=0}
  // «График»: мои отметки с сегодняшнего дня изменились после последнего просмотра
  try{const td=iso(new Date());const q=await sb.from('marks').select('day,kind').eq('user_id',S.me.id).gte('day',td).order('day');
    if(!q.error){const cur={};(q.data||[]).forEach(x=>cur[x.day]=x.kind);S.schCur=cur;let old=null;try{old=JSON.parse(lsGet('dw_seen_sch')||'null')}catch(e){}
      if(!old){lsSet('dw_seen_sch',JSON.stringify(cur));S.schNew=0}
      else{const days=new Set([...Object.keys(cur),...Object.keys(old).filter(d=>d>=td)]);let d=0;days.forEach(k=>{if(cur[k]!==old[k])d++});S.schNew=d}}}catch(e){S.schNew=0}
  paintBadges();paintBell();
  if(S.tab)await markSeen();
}
const firstName=()=>(S.me?.full_name||'').trim().split(/\s+/)[0]||'друг';
const bell=()=>`<button class="bell" aria-label="Уведомления" onclick="openBell()">🔔<i id="bellN" ${S.unread>0?'':'hidden'}>${S.unread>9?'9+':S.unread}</i></button>`;

// Фото профиля
const avUrl=p=>p?sb.storage.from('avatars').getPublicUrl(p).data.publicUrl:'';
const av=(p,sz=40)=>{const u=avUrl(p&&p.avatar_url);const nm=(p&&p.full_name||'?').trim();const ini=nm.split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
  return u?`<img class="av" src="${esc(u)}" alt="" width="${sz}" height="${sz}" loading="lazy" style="width:${sz}px;height:${sz}px">`:`<span class="av ini" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.4)}px">${esc(ini)}</span>`};
function avResize(file,n=256){return new Promise((ok,no)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const s=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=n;c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,n,n);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(new Error('Не получилось обработать фото')),'image/jpeg',.85)};im.onerror=()=>no(new Error('Не удалось открыть картинку'));im.src=u})}
async function avSet(file){
  const old=S.me.avatar_url,path=S.me.id+'/'+Date.now()+'.jpg';
  const blob=file?await avResize(file):null;
  if(blob){const up=await sb.storage.from('avatars').upload(path,blob,{contentType:'image/jpeg'});if(up.error)throw up.error}
  const r=await sb.rpc('set_my_avatar',{p:blob?path:null});if(r.error)throw r.error;
  if(old)sb.storage.from('avatars').remove([old]);
  S.me.avatar_url=blob?path:null;
}
const head=(h,sub)=>`<div class="top"><div class="brand"><img class="lg" src="stickers/logo.webp" alt="Дримвуд"><div class="hi">Привет, ${esc(firstName())}! 👋</div></div><div class="topr"><button class="avb" aria-label="Мой профиль" onclick="go('set')">${av(S.me,40)}</button>${bell()}</div></div>${S.offline?`<div class="banner" style="background:#E6CC8F;color:#3B2A35;font-size:14px">📴 Нет сети — показаны сохранённые данные (от ${new Date(S.offline).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}). Менять что-либо пока нельзя.</div>`:''}${sub?`<div class="muted">${sub}</div>`:''}<h1>${h}</h1>`;
const NI={news:'📰',rotation:'🔄',afisha:'🎟️',signup:'🧑‍💼',task:'📋',request:'📨',incident:'🚨',shift:'💬',checkin:'☀️',repair:'🛠',feedback:'💡'};
const ago=d=>{const m=Math.round((Date.now()-new Date(d))/6e4);return m<1?'только что':m<60?m+' мин назад':m<1440?Math.floor(m/60)+' ч назад':new Date(d).toLocaleDateString('ru',{day:'numeric',month:'short'})};
async function openBell(){
  const [n,r,ckq]=await Promise.all([sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(50),sb.from('notif_reads').select('notif_id').eq('user_id',S.me.id),sb.from('checkins').select('day,at').eq('user_id',S.me.id).order('day',{ascending:false}).limit(40)]);
  const cks=new Map((ckq.data||[]).map(c=>[c.day,c.at])),todayIso=iso(new Date()),tm=t=>new Date(t).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  const seen=new Set((r.data||[]).map(x=>x.notif_id)),list=n.data||[];
  const ov=document.createElement('div');ov.className='ov';ov.innerHTML=`<div class="sheet"><div class="sh"><button class="x" id="bk" aria-label="Назад">←</button><b>Уведомления</b><span></span></div><div class="sb">${(S.due||[]).map(t=>{const od=t.deadline<iso(new Date()),td=t.deadline===iso(new Date());return `<div class="nt new" style="border-left:6px solid ${od?'#E08A7A':'#E6CC8F'}"><div class="ni">⏰</div><div class="nb"><b>${od?'Просрочена':td?'Срок сегодня':'Срок завтра'}: ${esc(t.title)}</b><div class="muted" style="margin-top:4px">📅 ${dgFmt(t.deadline)} · <a href="#" class="lnk" data-l="dg">открыть доску</a></div></div></div>`}).join('')}${list.map(x=>{if(x.kind==='checkin'){const day=String(x.link||'').slice(8),ck=cks.get(day),pend=!ck&&day===todayIso;return `<div class="nt ckn ${ck?'done':pend?'pend':'miss'}" data-id="${x.id}" ${pend?'data-ck="1"':''}><div class="ni">${ck?'✅':'☀️'}</div><div class="nb"><b>${ck?'Выход на смену подтверждён':pend?'Ты сегодня на смене?':'Выход не подтверждён'}</b>${seen.has(x.id)||pend?'':'<span class="newb">новое</span>'}<div class="nbody">${ck?'Подтверждено в '+tm(ck):pend?'Нажми на это сообщение, чтобы подтвердить.':dayLabel(day)}</div><div class="muted" style="margin-top:4px">${ago(x.created_at)}</div></div></div>`}
    const lg=(x.body||'').length>160;return `<div class="nt ${seen.has(x.id)?'':'new'}" data-id="${x.id}"><div class="ni">${NI[x.kind]||'🔔'}</div><div class="nb"><b>${esc(x.title)}</b>${seen.has(x.id)?'':'<span class="newb">новое</span>'}<div class="nbody ${lg?'cl':''}">${esc(x.body||'')}</div><div class="muted" style="margin-top:4px">${ago(x.created_at)}${lg?' · <a href="#" class="more">читать полностью</a>':''}${x.link?` · <a href="#" class="lnk" data-l="${esc(x.link)}">открыть</a>`:''}</div></div></div>`}).join('')||'<div class="muted" style="padding:20px">Пока ничего нового</div>'}</div></div>`;
  document.body.appendChild(ov);document.body.style.overflow='hidden';
  const close=()=>{ov.remove();document.body.style.overflow=''};
  ov.onclick=e=>{if(e.target===ov)close()};ov.querySelector('#bk').onclick=close;
  ov.querySelectorAll('.more').forEach(a=>a.onclick=e=>{e.preventDefault();a.closest('.nb').querySelector('.nbody').classList.remove('cl');a.remove()});
  ov.querySelectorAll('.lnk').forEach(a=>a.onclick=e=>{e.preventDefault();const l=a.dataset.l;close();if(l.startsWith('rot:')){S.day=l.slice(4);go('rot')}else go(l)});
  ov.querySelectorAll('.ckn[data-ck]').forEach(el=>el.onclick=async()=>{
    if(el.dataset.busy)return;el.dataset.busy=1;
    const r=await sb.rpc('checkin_confirm');if(r.error){alert('Не получилось подтвердить: '+r.error.message);delete el.dataset.busy;return}
    el.className='nt ckn done';el.removeAttribute('data-ck');el.querySelector('.ni').textContent='✅';el.querySelector('b').textContent='Выход на смену подтверждён';el.querySelector('.nbody').textContent='Подтверждено в '+tm(r.data||Date.now());
    S.ckPending=false;paintBell()
  });
  const fresh=list.filter(x=>!seen.has(x.id)&&!NKNOWN.has(NLK(x.link))).map(x=>({user_id:S.me.id,notif_id:x.id}));
  if(fresh.length){await sb.from('notif_reads').upsert(fresh);S.unread=(S.nl||[]).length;paintBell()}
}

// ---------- Ротации ----------
const hh=x=>{const m=x.split(':');return +m[0]+(+m[1])/60};
const dayLabel=d=>new Date(d+'T12:00:00').toLocaleDateString('ru',{weekday:'short',day:'numeric',month:'short'});
function parseRange(t){const m=String(t).match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);return m?[hh(m[1]),hh(m[2])]:[10,S.dayEnd||18]}
function personTrack(p,r,c,a,b){
  const span=b-a;let h=`<div style="display:flex;flex-direction:column;gap:4px"><div style="font-weight:700;font-size:14px">${esc(p.icon)} ${esc(p.name)}${p.senior?'<span class="sr">Старший</span>':''}${p.tag?`<span class="sr" style="background:#E8DCCB;color:#3B2A35">${esc(p.tag)}</span>`:''}</div>
  <div class="track" style="--c:${c}"><div class="work"></div>`;
  const marks=[];
  (p.brks||[]).forEach(t=>{const m=t.match(/^(Ос|Пс|О|П)\s+(\d+:\d+)[–-](\d+:\d+)/);if(!m)return;const s0=hh(m[2]),e0=hh(m[3]);if(e0<=a||s0>=b)return;
    h+=`<div class="brk" style="left:${(Math.max(s0,a)-a)/span*100}%;width:${(Math.min(e0,b)-Math.max(s0,a))/span*100}%;background:${brkBg(t)}">${m[1]}</div>`;marks.push(`${m[1]} ${m[2]}–${m[3]}`)});
  h+=`</div>${marks.length?`<div class="muted">Перерыв: ${marks.map(esc).join(', ')}</div>`:''}</div>`;return h}
function axis(a,b){let t='';for(let v=Math.ceil(a);v<=b;v++)t+=`<span style="left:${(v-a)/(b-a)*100}%">${v}</span>`;return `<div class="axis">${t}</div>`}
function zoneCard(zone,blocks,c){
  let h=`<div class="card zcard" style="--c:${c}"><div class="zh" style="background:${c}">${esc(zone)}</div>`;
  blocks.forEach(bl=>{
    const [a,b]=bl.range;
    h+=`<div class="zb"><div class="zt">🕑 ${bl.title}</div>`;
    if(bl.steps?.length){
      h+=`<div class="muted">${esc(bl.people.map(p=>p.name).join(', '))} — меняет обеды</div><div class="bar">${(()=>{let cur=a;return bl.steps.map(x=>{const r=parseRange(x[0]);const gap=r[0]>cur+0.01?`<div style="width:${(r[0]-cur)/(b-a)*100}%;background:transparent"></div>`:'';cur=r[1];return gap+`<div style="width:${(r[1]-r[0])/(b-a)*100}%;background:${STEPC[x[1]]||'#eee'}" title="${esc(x[0]+' '+x[1])}">${r[1]-r[0]>=1?esc(x[1].split(' ')[0]):''}</div>`}).join('')})()}</div>${axis(a,b)}
      <div class="steps">${bl.steps.map(x=>`<b>${esc(x[0])}</b><span><span class="pill" style="background:${STEPC[x[1]]||'#eee'}">${esc(x[1])}</span></span>`).join('')}</div>`;
    }else{
      h+=bl.people.map(p=>personTrack(p,null,c,a,b)).join('');h+=axis(a,b);
    }
    h+=`</div>`});
  return h+`</div>`}
// ---------- График ----------
// сотрудник нажал на дату: заявка (отгул/ДО/больничный/отпуск) или личный комментарий
function dayModal(k){
  const me=S.me.id,mk=S.marks[k],pd=S.pendDay[k];
  dgxSheet(dayLabel(k),(box,paint,close)=>{
    const L={otgul:['🏖','Отгул'],do:['📌','ДО'],sick:['🤒','Больничный'],vac:['🌴','Отпуск']};
    box.innerHTML=`${mk?`<div class="card pad" style="background:${KINDS[mk.kind][1]}"><b>${KINDS[mk.kind][2]}</b>${mk.note?`<div class="muted">${esc(mk.note)}</div>`:''}<div class="muted">Поставлено в графике. Изменить может руководитель.</div></div>`:''}
    ${pd?`<div class="card pad col" style="border:2px dashed var(--ink)"><b>⏳ Отправлено на согласование: ${esc((KINDS[pd.kind]||[])[2]||pd.kind)}</b><div class="muted">${dRange(pd)}</div><button class="btn ghost" id="dm_cn">Отменить заявку</button></div>`
    :`<b>Отправить заявку на этот день</b><div class="two">${['otgul','do'].map(x=>`<button class="btn ghost" data-rq="${x}">${L[x][0]} ${L[x][1]}</button>`).join('')}</div><div class="two">${['sick','vac'].map(x=>`<button class="btn ghost" data-rq="${x}">${L[x][0]} ${L[x][1]}</button>`).join('')}</div><label>Если несколько дней: по какое число<input type="date" id="dm_to" min="${k}"></label><div class="muted">Заявку увидит руководитель. Когда одобрит, день появится в графике.</div>`}
    <label>📝 Комментарий к дню<textarea id="dm_note" placeholder="Например: съездить в банк, отпроситься на час">${esc(S.dnotes[k]||'')}</textarea></label><div class="muted">Комментарий виден руководителям.</div><button class="btn" id="dm_save">Сохранить комментарий</button><div class="err" id="dm_er"></div>`;
    box.querySelectorAll('[data-rq]').forEach(b=>b.onclick=async()=>{
      const to=box.querySelector('#dm_to')?.value,er=box.querySelector('#dm_er');
      if(to&&to<k)return er.textContent='Конец раньше начала';
      b.disabled=true;const row={kind:b.dataset.rq,day:k,status:'pending'};if(to&&to!==k)row.day_to=to;
      const r=await sb.from('requests').insert(row);if(r.error){b.disabled=false;return er.textContent='Не получилось: '+r.error.message}
      close(false);S.sel=null;schView();refreshUnread()});
    box.querySelector('#dm_cn')?.addEventListener('click',async()=>{if(!confirm('Отменить заявку?'))return;const r=await sb.from('requests').update({status:'cancelled'}).eq('id',pd.id);if(r.error)return alert(r.error.message);close(false);S.sel=null;schView()});
    box.querySelector('#dm_save').onclick=async e=>{const t=box.querySelector('#dm_note').value.trim();e.target.disabled=true;
      const r=t?await sb.from('day_notes').upsert({user_id:me,day:k,body:t,updated_at:new Date().toISOString()}):await sb.from('day_notes').delete().eq('user_id',me).eq('day',k);
      if(r.error){e.target.disabled=false;return box.querySelector('#dm_er').textContent=r.error.message}
      close(false);S.sel=null;schView()};
  },()=>{S.sel=null});
}
const KINDS={off:['ВЫХ','#E8DCCB','Выходной'],otgul:['ОТ','#E4B5A3','Отгул'],do:['ДО','#F5E2A8','ДО'],sick:['Б','#BCC8D6','Больничный'],vac:['ОП','#C9D4B0','Отпуск']};
async function schView(){
  S.offline=0;
  if(canMng()&&!S.people.length){let q=sb.from('profiles').select('id,full_name,team').eq('status','approved').order('full_name');if(!isManager())q=q.eq('team',S.me.team);const {data}=await q;S.people=data||[]}
  const m=S.month,y=m.getFullYear(),mo=m.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0));
  const {data}=await cq('marks:'+S.viewUser+first,()=>sb.from('marks').select('*').eq('user_id',S.viewUser).gte('day',first).lte('day',last));
  const otr=await cq('ot:'+S.viewUser+first,()=>sb.from('overtime').select('*').eq('user_id',S.viewUser).gte('day',first).lte('day',last).order('day').order('start_time'));
  const selfMode=S.viewUser===S.me.id&&!isManager();
  const [vp,vr]=await Promise.all([sb.from('profiles').select('day_len,team').eq('id',S.viewUser).maybeSingle(),isManager()?sb.from('roster').select('id,day_len').eq('profile_id',S.viewUser).maybeSingle():Promise.resolve({data:null})]);
  const dlen=vp.data?.day_len||vr.data?.day_len||(vp.data?.team==='M'?12:10),lenSet=!!(vp.data?.day_len||vr.data?.day_len);
  const [pq,dq]=await Promise.all([sb.from('requests').select('id,kind,day,day_to').eq('user_id',S.viewUser).eq('status','pending').neq('kind','swap').lte('day',last),sb.from('day_notes').select('day,body').eq('user_id',S.viewUser).gte('day',first).lte('day',last)]);
  S.pendDay={};(pq.data||[]).forEach(x=>{const to=x.day_to||x.day;for(let d=new Date(x.day+'T12:00:00');iso(d)<=to;d.setDate(d.getDate()+1)){const k=iso(d);if(k>=first&&k<=last)S.pendDay[k]=x}});
  S.dnotes={};(dq.data||[]).forEach(x=>S.dnotes[x.day]=x.body);
  const otOk=canMng()&&(isManager()||S.viewUser!==S.me.id);
  const otRows=otr.data||[],otSum=otRows.reduce((a,r)=>a+Number(r.hours),0),fh=x=>String(Math.round(x*100)/100).replace('.',',');
  S.marks={};(data||[]).forEach(r=>S.marks[r.day]=r);
  const n=new Date(y,mo+1,0).getDate(),lead=(new Date(y,mo,1).getDay()+6)%7;
  let h=head('График',m.toLocaleDateString('ru',{month:'long',year:'numeric'}));
  if(canMng())h+=`<label>Сотрудник<select id="who">${S.people.map(p=>`<option value="${p.id}" ${p.id===S.viewUser?'selected':''}>${esc(p.full_name)}</option>`).join('')}</select></label>`;
  h+=`<div style="display:flex;gap:8px"><button class="btn ghost" id="pm">←</button><button class="btn ghost" id="nm">→</button></div><div class="cal">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="dh">${d}</div>`).join('')}${'<div></div>'.repeat(lead)}`;
  let worked=0;const cnt={};
  for(let d=1;d<=n;d++){const k=iso(new Date(y,mo,d)),mk=S.marks[k];
    if(!mk)worked++;else cnt[mk.kind]=(cnt[mk.kind]||0)+1;
    const pd=S.pendDay[k];
    h+=`<button class="day ${S.sel===k?'sel':''}" data-k="${k}" style="background:${mk?KINDS[mk.kind][1]:pd?KINDS[pd.kind]?.[1]||'var(--card)':'var(--card)'};${pd&&!mk?'border:2px dashed var(--ink);':''}">${d}<small>${mk?KINDS[mk.kind][0]:pd?'⏳ '+(KINDS[pd.kind]?.[0]||''):''}${S.dnotes[k]?' 📝':''}</small></button>`}
  const cOt=cnt.otgul||0,cDo=cnt.do||0,base=(worked+cOt-cDo)*dlen;
  h+=`</div><div class="stat"><div style="background:var(--sage)"><b>${worked}</b>рабочих дней</div><div style="background:var(--gold)"><b>${fh(base)}</b>часов по графику</div></div>
  <div class="stat"><div style="background:var(--pink)"><b>${fh(otSum)}</b>переработки</div><div style="background:var(--blue)"><b>${fh(base+otSum)}</b>всего часов</div></div>
  <div class="card pad col"><b>Как посчитано</b><div class="otr"><span>Рабочих дней × ${dlen} ч</span><b>${fh(worked*dlen)} ч</b></div><div class="otr"><span>Отгулы ${cOt} × ${dlen} ч (как отработанные)</span><b>+${fh(cOt*dlen)} ч</b></div><div class="otr"><span>ДО ${cDo} × ${dlen} ч (неоплачиваемый)</span><b>−${fh(cDo*dlen)} ч</b></div>${otSum?`<div class="otr"><span>Переработки</span><b>+${fh(otSum)} ч</b></div>`:''}<div class="otr"><span><b>Итого</b></span><b>${fh(base+otSum)} ч</b></div>
  ${isManager()?`<label>Длина рабочего дня<select id="dlen">${[8,10,12].map(v=>`<option value="${v}" ${v===dlen?'selected':''}>${v} ч${v===8?' (5/2)':v===10?' (4/3, с учётом обеда)':' (сменный 12 ч)'}</option>`).join('')}</select></label>${lenSet?'':'<div class="muted">Сейчас по умолчанию. Выбери и сохранится.</div>'}`:`<div class="muted">Длина дня: ${dlen} ч. Выходные, больничные и отпуск в часы не входят.</div>`}</div>`;
  const dl=Object.keys({...S.marks,...S.dnotes}).sort();
  if(dl.length)h+=`<div class="card pad col"><b>📋 Что и когда</b>${dl.map(k=>{const mk=S.marks[k];return `<div class="otr" style="align-items:flex-start"><span><b>${dayLabel(k)}</b>${mk?` · <span class="pill" style="background:${KINDS[mk.kind][1]}">${KINDS[mk.kind][2]}</span>${mk.note?` ${esc(mk.note)}`:''}`:''}${S.dnotes[k]?`<br><span class="muted">📝 ${esc(S.dnotes[k])}</span>`:''}</span></div>`}).join('')}</div>`;
  const defd=S.sel||(iso(new Date()).slice(0,7)===first.slice(0,7)?iso(new Date()):first);
  h+=`<div class="card pad col"><b>⏱ Переработки</b>${otRows.length?otRows.map(r=>`<div class="otr"><span><b>${dayLabel(r.day)}</b> · с ${esc(String(r.start_time||'—').slice(0,5))} · ${fh(+r.hours)} ч${r.note?' · '+esc(r.note):''}</span>${otOk?`<button class="x" data-od="${r.id}" aria-label="Удалить">✕</button>`:''}</div>`).join(''):'<div class="muted">В этом месяце переработок нет</div>'}
  ${otOk?`<div class="col" style="border-top:1px solid var(--line);padding-top:10px"><div class="muted">Добавить переработку для выбранного сотрудника</div><input type="date" id="otd" value="${defd}"><div class="two"><label>С какого времени<input type="time" id="ots" value="20:00"></label><label>Сколько часов<input type="number" id="oth" step="0.5" min="0.5" placeholder="2"></label></div><input id="otn" placeholder="Комментарий (необязательно)"><button class="btn" id="otadd">Добавить</button></div>`:''}</div>`;
  if(selfMode)h+=`<div class="muted">Нажми на дату: можно отправить заявку на отгул, ДО, больничный или отпуск и оставить комментарий. ⏳ — отправлено на согласование руководителю.</div>`;
  if(S.sel&&!selfMode){const mk=S.marks[S.sel];
    h+=`<div class="card pad" style="display:flex;flex-direction:column;gap:10px"><b>${S.sel}</b><div class="tabs">${Object.entries(KINDS).map(([k,v])=>`<button data-m="${k}" style="background:${v[1]}" class="${mk?.kind===k?'on':''}">${v[2]}</button>`).join('')}<button data-m="" style="background:#fff;border:1px solid #ccc">Рабочий</button></div><textarea id="note" placeholder="Комментарий">${esc(mk?.note||'')}</textarea>${S.dnotes[S.sel]?`<div class="muted">📝 Личный комментарий сотрудника: ${esc(S.dnotes[S.sel])}</div>`:''}<button class="btn" id="save">Сохранить</button></div>`}
  app.innerHTML=h;
  $('#dlen')?.addEventListener('change',async e=>{const v=+e.target.value;e.target.disabled=true;
    const a=await sb.from('profiles').update({day_len:v}).eq('id',S.viewUser);if(a.error)return alert(a.error.message);
    if(vr.data)await sb.from('roster').update({day_len:v}).eq('id',vr.data.id);schView()});
  $('#who')?.addEventListener('change',e=>{S.viewUser=e.target.value;S.sel=null;schView()});
  $('#pm').onclick=()=>{S.month=new Date(y,mo-1,1);S.sel=null;schView()};$('#nm').onclick=()=>{S.month=new Date(y,mo+1,1);S.sel=null;schView()};
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{S.sel=b.dataset.k;S.pick=S.marks[S.sel]?.kind||'';if(selfMode)dayModal(S.sel);else schView()});
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
  let h=head('Афиша','Что происходит в парке')+subBar('park','afisha')+(S.ev.length?'':importBtn());
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
  if(!isAdmin())return go('contacts');
  const [pr,ro]=await Promise.all([sb.from('profiles').select('id,full_name,email,role,status,tab_no,team,created_at,phone,position').order('created_at'),sb.from('roster').select('*').order('team').order('full_name')]);
  const all=pr.data||[],roster=ro.data||[];
  const ap=all.filter(p=>p.status==='approved'),req=all.filter(p=>p.status!=='approved').sort((a,b)=>(a.status==='pending'?0:1)-(b.status==='pending'?0:1));
  const rl=new Map(roster.filter(r=>r.profile_id).map(r=>[r.profile_id,r.full_name]));
  const free=roster.filter(r=>!r.profile_id);
  const dt=d=>d?new Date(d).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'}):'';
  let h=head('Сотрудники','Заявки на регистрацию и список команды')+subBar('team','staff');
  h+=`<div class="stat"><div style="background:var(--sage)"><b>${ap.length}</b>в команде</div><div style="background:var(--gold)"><b>${req.filter(p=>p.status==='pending').length}</b>новых заявок</div></div>`;
  h+=`<div class="card pad col"><b>📨 Заявки</b>${req.length?req.map(p=>{
      const opts=free.map(r=>({r,sc:simScore(p.full_name,r.full_name)})).sort((a,b)=>b.sc-a.sc);
      return `<div class="col" style="border-top:1px solid var(--line);padding-top:10px"><div><b>${esc(p.full_name)}</b>${p.status==='rejected'?'<span class="pill" style="background:#E8B4B8;margin-left:6px">отклонена</span>':''}<div class="muted">${esc(p.email||'')}${p.phone?' · '+esc(p.phone):''} · ${dt(p.created_at)}</div></div>
      <label>Это сотрудник из списка:<select data-rs="${p.id}"><option value="">— не привязывать —</option>${opts.map(({r,sc})=>`<option value="${r.id}" ${sc>=3&&r===opts[0].r?'selected':''}>${sc>0?'★ ':''}${esc(r.full_name)}${r.team?' · '+TN[r.team]:''}${r.pre_role?' · '+esc(r.pre_position||'руководитель'):''}</option>`).join('')}</select></label>
      <div class="two"><button class="btn" data-ok="${p.id}">Одобрить</button>${p.status==='rejected'?'':`<button class="btn ghost" data-no="${p.id}">Отклонить</button>`}</div></div>`}).join(''):'<div class="muted">Новых заявок нет</div>'}<div class="muted">★ — похоже по имени и фамилии. Табельный номер присваивается автоматически при одобрении.</div></div>`;
  const adm=isAdmin(),lockRole=p=>!adm&&(p.role==='manager'||p.role==='admin'),roleOpts=p=>Object.entries(ROLE_RU).filter(([k])=>adm?k!=='admin'||p.role==='admin':k==='employee'||k==='lead');
  h+=`<div class="card pad col"><b>👥 Команда · ${ap.length}</b><div class="muted">Имя (первое слово идёт в приветствие), табельный номер и должность${adm?'. Роли руководителей и удаление — только у админа':''}</div>${ap.map(p=>`<div class="col" style="border-top:1px solid var(--line);padding-top:10px;gap:6px"><div class="prow"><input class="pn" data-pn="${p.id}" value="${esc(p.full_name||'')}" placeholder="Имя Фамилия"><input class="pt" data-pt="${p.id}" value="${esc(p.tab_no||'')}" placeholder="№"><button class="btn" style="padding:0 14px" data-sp="${p.id}" aria-label="Сохранить">💾</button></div>
    <input data-ps="${p.id}" value="${esc(p.position||'')}" placeholder="Должность (например, супервайзер)">
    <div class="muted">${p.id===S.me.id||lockRole(p)||p.role==='admin'?`<b>${ROLE_RU[p.role]}</b>`:`<select class="rl" data-rl="${p.id}">${roleOpts(p).map(([k,v])=>`<option value="${k}" ${p.role===k?'selected':''}>${v}</option>`).join('')}</select>`}${rl.get(p.id)?' · в списке: '+esc(rl.get(p.id)):''}${p.team?' · '+(TN[p.team]||''):''}${p.phone?' · '+esc(p.phone):''} · с ${dt(p.created_at)}</div>
    ${adm&&p.id!==S.me.id?`<div class="two"><button class="btn ghost" data-pw="${p.id}">🔑 Новый пароль</button><button class="btn ghost" data-rm="${p.id}" style="color:#9b2c2c;border-color:#9b2c2c">🚫 Убрать</button></div>`:''}</div>`).join('')}</div>`;
  h+=`<div class="card pad col"><b>📋 Ещё не зарегистрировались · ${free.length}</b><div class="muted">${free.length?free.map(r=>esc(r.full_name)).join(', '):'Все из списка уже в приложении'}</div></div>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-ok]').forEach(b=>b.onclick=async()=>{const id=b.dataset.ok,rs=app.querySelector(`[data-rs="${id}"]`).value;b.disabled=true;
    const r=await sb.rpc('approve_member',{p_id:id,p_roster:rs?+rs:null});if(r.error){alert('Не удалось одобрить: '+r.error.message);return staffView()}
    alert('Одобрено. Табельный номер: '+r.data);S.people=[];staffView().then(refreshUnread)});
  app.querySelectorAll('[data-no]').forEach(b=>b.onclick=async()=>{if(!confirm('Отклонить заявку?'))return;const r=await sb.rpc('reject_member',{p_id:b.dataset.no});if(r.error)alert(r.error.message);staffView().then(refreshUnread)});
  app.querySelectorAll('[data-rl]').forEach(sel=>sel.onchange=async()=>{const nm=ap.find(x=>x.id===sel.dataset.rl);
    if(sel.value==='lead'&&!nm?.team)alert('У сотрудника не указана команда (он не привязан к списку), поэтому бригадир увидит только себя.');
    const r=await sb.from('profiles').update({role:sel.value}).eq('id',sel.dataset.rl);if(r.error){alert('Не удалось сменить роль: '+r.error.message);return staffView()}
    sel.style.outline='2px solid var(--sage)';setTimeout(()=>sel.style.outline='',900)});
  app.querySelectorAll('[data-sp]').forEach(b=>b.onclick=async()=>{const id=b.dataset.sp,full_name=app.querySelector(`[data-pn="${id}"]`).value.trim(),tab_no=app.querySelector(`[data-pt="${id}"]`).value.trim()||null,position=app.querySelector(`[data-ps="${id}"]`).value.trim()||null;
    const r=await sb.from('profiles').update({full_name,tab_no,position}).eq('id',id);if(r.error)return alert('Не удалось сохранить: '+r.error.message);
    if(id===S.me.id){S.me.full_name=full_name;S.me.tab_no=tab_no;S.me.position=position}S.people=[];b.textContent='✅';setTimeout(()=>staffView(),600)});
  app.querySelectorAll('[data-pw]').forEach(b=>b.onclick=async()=>{const nm=ap.find(x=>x.id===b.dataset.pw)?.full_name||'';const pw=prompt('Новый пароль для '+nm+' (не короче 6 знаков). Передай его человеку лично, он сможет сменить его в Настройках:');if(!pw)return;
    if(pw.length<6)return alert('Пароль должен быть не короче 6 знаков');const r=await sb.rpc('reset_member_password',{p_id:b.dataset.pw,p:pw});alert(r.error?'Не получилось: '+r.error.message:'Пароль задан')});
  app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{const nm=ap.find(x=>x.id===b.dataset.rm)?.full_name||'';if(!confirm('Убрать '+nm+' из приложения? Доступ закроется, график и записи в журналах сохранятся.'))return;
    const r=await sb.rpc('remove_member',{p_id:b.dataset.rm});if(r.error)return alert('Не получилось: '+r.error.message);S.people=[];staffView().then(refreshUnread)});
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
  S.offline=0;
  const [b,p]=await Promise.all([cq('dgb',()=>sb.from('dg_boards').select('*').order('created_at')),cq('dgp',()=>sb.from('profiles').select('id,full_name,tab_no').eq('status','approved').order('full_name'))]);
  S.dg.boards=b.data||[];S.dg.people=p.data||[];
  if(!S.dg.board||!S.dg.boards.find(x=>x.id===S.dg.board))S.dg.board=S.dg.boards[0]?.id;
  S.dg.cols=[];S.dg.tasks=[];S.dg.cl={};S.dg.cm={};
  if(!S.dg.board)return;
  const [c,t]=await Promise.all([cq('dgc'+S.dg.board,()=>sb.from('dg_columns').select('*').eq('board_id',S.dg.board).order('pos')),cq('dgt'+S.dg.board,()=>sb.from('dg_tasks').select('*').eq('board_id',S.dg.board).eq('archived',false).order('pos'))]);
  S.dg.cols=c.data||[];S.dg.tasks=t.data||[];
  const ids=S.dg.tasks.map(x=>x.id);if(!ids.length)return;
  const [cl,cm,fl]=await Promise.all([sb.from('dg_checklist').select('task_id,done').in('task_id',ids),sb.from('dg_comments').select('task_id').in('task_id',ids),sb.from('dg_files').select('task_id').in('task_id',ids)]);S.dg.fl={};(fl.data||[]).forEach(x=>S.dg.fl[x.task_id]=(S.dg.fl[x.task_id]||0)+1);
  (cl.data||[]).forEach(x=>{const o=S.dg.cl[x.task_id]||(S.dg.cl[x.task_id]=[0,0]);o[1]++;if(x.done)o[0]++});
  (cm.data||[]).forEach(x=>S.dg.cm[x.task_id]=(S.dg.cm[x.task_id]||0)+1);
}
async function dgView(){
  await dgLoad();const D=S.dg;
  if(!D.rt){D.rt=true;try{sb.channel('dg-live').on('postgres_changes',{event:'*',schema:'public',table:'dg_tasks'},()=>{if(S.tab==='dg'&&!document.querySelector('.ov'))dgView()}).subscribe()}catch(e){}}
  let h=head('DreamGile','Задачи команды');
  if(!D.board){app.innerHTML=h+`<div class="card pad">Досок пока нет.${isManager()?'<br><button class="btn" id="nb" style="margin-top:10px">Создать доску</button>':''}</div>`;$('#nb')?.addEventListener('click',dgNewBoard);return}
  h+=`<div class="two"><label style="flex:1"><select id="bsel">${D.boards.map(b=>`<option value="${b.id}" ${b.id===D.board?'selected':''}>${esc(b.title)}</option>`).join('')}</select></label>${isManager()?'<button class="btn ghost" id="nb" style="min-height:48px">+ Доска</button>':''}</div>`;
  h+=`<div class="tabs"><button data-f="all" class="${D.mine?'':'on'}" style="background:#E3EAD2">${isManager()?'Все задачи':'Мои задачи'}</button>${isManager()?`<button data-f="mine" class="${D.mine?'on':''}" style="background:#E3EAD2">Только мои</button>`:''}${isManager()?'<button id="ac" style="background:#E3EAD2">+ Колонка</button>':''}${dgxToolbar()}</div>`;
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
  dgTouch();dgxBind();
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
  return `<div class="tk" data-open="${t.id}" data-q="${esc((t.title+' '+(t.descr||'')+' '+t.assignees.map(pname).join(' ')).toLowerCase())}" data-od="${dgOver(t)?1:0}" style="border-left:6px solid ${t.label||'transparent'}"><div class="tt">${t.done?'✅ ':''}${esc(t.title)}</div><div class="tm">${t.zone?`<span class="pill" style="background:#E4B5A3">📍 ${esc(t.zone)}</span>`:''}${t.recurring_id?'<span class="pill" style="background:#F1E8DA">🔁</span>':''}${(S.dg.fl||{})[t.id]?`<span class="pill" style="background:#F1E8DA">📎 ${S.dg.fl[t.id]}</span>`:''}${t.priority!=='normal'?`<span class="pill" style="background:${PRI[t.priority][1]}">${PRI[t.priority][0]}</span>`:''}${t.deadline?`<span class="pill" style="background:${dgOver(t)?'#E08A7A':'#F1E8DA'}">📅 ${dgFmt(t.deadline)}</span>`:''}${cl?`<span class="pill" style="background:#F1E8DA">☑ ${cl[0]}/${cl[1]}</span>`:''}${cm?`<span class="pill" style="background:#F1E8DA">💬 ${cm}</span>`:''}</div>${t.assignees.length?`<div class="av">${t.assignees.slice(0,4).map(a=>`<i title="${esc(pname(a))}">${esc(ini(pname(a)))}</i>`).join('')}${t.assignees.length>4?`<i>+${t.assignees.length-4}</i>`:''}</div>`:''}</div>`}
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
  ${t.zone?`<div class="pill" style="background:#E4B5A3;font-size:13px">📍 ${esc(t.zone)}</div>`:''}
  <label>Название<input id="f_t" value="${esc(t.title)}" ${ro}></label>
  <label>Описание<textarea id="f_d" ${ro}>${esc(t.descr||'')}</textarea></label>
  <label>Колонка<select id="f_c">${D.cols.map(c=>`<option value="${c.id}" ${c.id===t.column_id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label>
  <div class="two"><label>Срок<input id="f_dl" type="date" value="${t.deadline||''}" ${ro}></label><label>Приоритет<select id="f_p" ${ro}>${Object.entries(PRI).map(([k,v])=>`<option value="${k}" ${k===t.priority?'selected':''}>${v[0]}</option>`).join('')}</select></label></div>
  <div><b style="font-size:14px">Метка</b><div class="chips" style="margin-top:6px">${[null,...LBL].map(c=>`<button class="lb ${(t.label||null)===c?'on':''}" data-l="${c||''}" style="background:${c||'#fff'}" ${ro}>${c?'':'—'}</button>`).join('')}</div></div>
  <div><b style="font-size:14px">Исполнители</b><div class="chips" style="margin-top:6px">${D.people.map(p=>`<button class="as ${t.assignees.includes(p.id)?'on':''}" data-a="${p.id}" ${ro}>${esc(p.full_name||'?')}</button>`).join('')}</div></div>
  ${id?`<div><b style="font-size:14px">Чек-лист</b>${cl.map(x=>`<div class="otr"><label style="flex-direction:row;align-items:center;gap:8px;font-weight:600"><input type="checkbox" data-ck="${x.id}" ${x.done?'checked':''} style="width:22px;min-height:22px"> <span style="${x.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(x.text)}</span></label>${mgr?`<button class="x" data-cd="${x.id}">×</button>`:''}</div>`).join('')}${mgr?'<div class="prow" style="margin-top:6px"><input id="f_ck" placeholder="Новый пункт" class="pn"><button class="btn" id="f_cka">+</button></div>':''}</div>
  ${id?'<div id="dgfiles"></div>':''}
  <div><b style="font-size:14px">Комментарии</b>${cm.map(x=>`<div class="cmt"><b>${esc(pname(x.author))}</b> <span class="muted">${ago(x.created_at)}</span><div style="white-space:pre-wrap">${esc(x.body)}</div></div>`).join('')||'<div class="muted">Пока нет</div>'}<div class="prow" style="margin-top:6px"><input id="f_cm" placeholder="Написать комментарий" class="pn"><button class="btn" id="f_cma">➤</button></div><select id="f_mn" style="margin-top:6px"><option value="">@ Упомянуть человека…</option>${D.people.filter(p=>p.id!==S.me.id).map(p=>`<option>${esc(p.full_name||'')}</option>`).join('')}</select></div><div id="dghist"></div>`:''}
  ${mgr?'<button class="btn" id="sv">Сохранить</button>':''}${mgr&&id?`<button class="btn ghost" id="ar">${t.archived?'↩ Вернуть из архива':'🗄 В архив'}</button>`:''}${mgr&&id?'<button class="btn ghost" id="dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить задачу</button>':''}
  <div class="err" id="er"></div></div></div>`;bind();if(id)dgxMount(ov,id,mgr)};
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
    ov.querySelector('#f_cma')?.addEventListener('click',async()=>{const v=$('#f_cm').value.trim();if(!v)return;const mentions=D.people.filter(p=>p.full_name&&v.includes('@'+p.full_name)).map(p=>p.id);const r=await sb.from('dg_comments').insert({task_id:id,body:v,mentions});if(r.error)ov.querySelector('#er').textContent=r.error.message;else reload()});
    ov.querySelector('#f_mn')?.addEventListener('change',e=>{const n=e.target.value;if(!n)return;const i=$('#f_cm');i.value+=(i.value&&!/\s$/.test(i.value)?' ':'')+'@'+n+' ';e.target.value='';i.focus()});
    ov.querySelector('#ar')?.addEventListener('click',async()=>{await sb.from('dg_tasks').update({archived:!t.archived}).eq('id',id);close()});
    ov.querySelector('#dl')?.addEventListener('click',async()=>{if(!confirm('Удалить задачу?'))return;await dgxDropFiles(id);await sb.from('dg_tasks').delete().eq('id',id);close()});
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
  const cur=getTheme(),adm=isAdmin(),pf=S.me.push_prefs||{},pon=k=>pf[k]!==false;
  let ct=null;if(adm){const r=await sb.from('app_settings').select('value').eq('key','checkin_time').maybeSingle();ct=r.data?.value||{h:9,m:30};const r2=await sb.from('app_settings').select('value').eq('key','shiftlist_time').maybeSingle();window._slt=r2.data?.value||{h:10,m:0}}
  let h=head('Настройки','Профиль и оформление');
  h+=`<div class="card pad"><b style="font-size:18px">${esc(S.me.full_name||'')}</b><div class="muted">${ROLE_RU[S.me.role]||'Сотрудник'}${S.me.position&&S.me.position!==ROLE_RU[S.me.role]?' · '+esc(S.me.position):''}${S.me.tab_no?` · табельный № ${esc(S.me.tab_no)}`:' · табельный номер пока не назначен'}</div></div>`;
  h+=`<div class="card pad col"><b>📸 Фото профиля</b><div class="muted">Его увидят коллеги в контактах и в шапке. Подойдёт любое фото, оно само обрежется в круг.</div><div class="prow" style="align-items:center">${av(S.me,64)}<label class="btn ghost" style="display:flex;align-items:center;justify-content:center;min-height:44px;cursor:pointer;margin:0;flex:1">Выбрать фото<input id="st_av" type="file" accept="image/*" hidden></label>${S.me.avatar_url?'<button class="btn ghost" id="st_avd" style="flex:none">Убрать</button>':''}</div><div class="err" id="st_ave"></div></div>`;
  h+=`<div class="card pad"><b>Оформление</b><div class="muted">Четыре сезона, у каждого тёплый и холодный вариант</div>${Object.entries(THEMES).map(([k,[ic,n]])=>`<div class="trow"><span>${ic} ${n}</span>${[['warm','Тёплый'],['cold','Холодный']].map(([v,t])=>`<button class="tbtn ${cur===k+'-'+v?'on':''}" data-th="${k}-${v}"><i class="sw" data-theme="${k}-${v}"></i>${t}</button>`).join('')}</div>`).join('')}</div>`;
  h+=`<div class="card pad col"><b>📱 Мой телефон</b><div class="muted">Номер — твой логин для входа и виден коллегам в «Команда → Контакты».</div><div class="prow"><input id="st_ph" type="tel" class="pn" placeholder="+7 ..." value="${esc(S.me.phone||'')}"><button class="btn" id="st_phs">Сохранить</button></div></div>`;
  h+=`<div class="card pad col"><b>🔑 Сменить пароль</b><div class="muted">Письмо на почту не отправляется: пароль меняется сразу.</div><input id="st_p1" type="password" autocomplete="new-password" placeholder="Новый пароль (от 6 знаков)"><input id="st_p2" type="password" autocomplete="new-password" placeholder="Повтори пароль"><div class="err" id="st_pe"></div><button class="btn" id="st_pw">Сменить пароль</button></div>`;
  h+=`<div class="card pad col"><b>🔔 Что присылать на телефон</b><div class="muted">Колокольчик внутри приложения работает всегда. Утреннюю отметку «Ты сегодня на смене?» и срочные поломки отключить нельзя.</div>${[['req','📨 Заявки, поломки и ответы по ним'],['news','📰 Новости и афиша'],['rot','🔄 Ротации'],['task','📋 Задачи и комментарии в смене']].map(([k,n])=>`<label class="chk"><input type="checkbox" data-pp="${k}" ${pon(k)?'checked':''}><span>${n}</span></label>`).join('')}</div>`;
  if(adm)h+=`<div class="card pad col"><b>⚙️ Настройки приложения (только админ)</b><div class="muted">Во сколько утром приходит «Ты сегодня на смене?» (по Москве).</div><div class="prow"><input id="st_ct" type="time" class="pn" value="${String(ct.h).padStart(2,'0')}:${String(ct.m).padStart(2,'0')}"><button class="btn" id="st_cts">Сохранить</button></div><div class="err" id="st_cte"></div><div class="muted" style="margin-top:6px">Во сколько приходит напоминание «Заполни чек-лист открытия» (по Москве).</div><div class="prow"><input id="st_lt" type="time" class="pn" value="${String(window._slt.h).padStart(2,'0')}:${String(window._slt.m).padStart(2,'0')}"><button class="btn" id="st_lts">Сохранить</button></div><div class="err" id="st_lte"></div></div>`;
  h+='<div id="pushbox"></div>';
  h+=`<button class="btn ghost" id="out">Выйти из аккаунта</button>`;
  app.innerHTML=h;
  window.pushMount&&pushMount();
  const avRun=async f=>{const er=$('#st_ave');er.style.color='';er.textContent='Загружаю…';try{await avSet(f);settingsView()}catch(e){er.textContent='Не получилось: '+(e.message||e)+(/avatar|bucket|not found|function/i.test(e.message||'')?' (в базе ещё не включены фото профиля)':'')}};
  $('#st_av').onchange=e=>{const f=e.target.files[0];if(f)avRun(f)};
  $('#st_avd')&&($('#st_avd').onclick=()=>{if(confirm('Убрать фото профиля?'))avRun(null)});
  $('#st_phs').onclick=async e=>{e.target.disabled=true;const v=normPhone($('#st_ph').value);if(!v){return alert('Введи номер полностью, например +7 978 123-45-67')}if(!confirm('Номер — это твой логин для входа. Менять на +'+v+'?')){e.target.disabled=false;return}const r=await sb.rpc('set_my_phone',{p:'+'+v});e.target.disabled=false;if(r.error)return alert(r.error.message);S.me.phone='+'+v;S.dg.people=[];e.target.textContent='✅';setTimeout(()=>e.target.textContent='Сохранить',1200)};
  $('#st_pw').onclick=async e=>{const p1=$('#st_p1').value,p2=$('#st_p2').value,er=$('#st_pe');er.style.color='';if(p1.length<6)return er.textContent='Пароль не короче 6 знаков';if(p1!==p2)return er.textContent='Пароли не совпадают';
    e.target.disabled=true;const r=await sb.auth.updateUser({password:p1});e.target.disabled=false;if(r.error)return er.textContent='Не получилось: '+r.error.message;$('#st_p1').value=$('#st_p2').value='';er.style.color='var(--ink)';er.textContent='Пароль изменён ✅'};
  app.querySelectorAll('[data-pp]').forEach(c=>c.onchange=async()=>{const p={};app.querySelectorAll('[data-pp]').forEach(x=>p[x.dataset.pp]=x.checked);const r=await sb.rpc('set_my_push_prefs',{p});if(r.error){alert(r.error.message);c.checked=!c.checked;return}S.me.push_prefs=p});
  $('#st_lts')&&($('#st_lts').onclick=async e=>{const [h,m]=($('#st_lt').value||'10:00').split(':').map(Number);e.target.disabled=true;const r=await sb.rpc('set_shiftlist_time',{h,m});e.target.disabled=false;const er=$('#st_lte');er.style.color=r.error?'':'var(--ink)';er.textContent=r.error?r.error.message:'Сохранено: напоминание приходит в '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+' ✅'});
  $('#st_cts')&&($('#st_cts').onclick=async e=>{const [h,m]=($('#st_ct').value||'09:30').split(':').map(Number);e.target.disabled=true;const r=await sb.rpc('set_checkin_time',{h,m});e.target.disabled=false;const er=$('#st_cte');er.style.color=r.error?'':'var(--ink)';er.textContent=r.error?r.error.message:'Сохранено: теперь отметка приходит в '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+' ✅'});
  app.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{applyTheme(b.dataset.th);settingsView()});
  $('#out').onclick=()=>sb.auth.signOut().then(()=>{clearCache();S.me=null;S.unread=0;boot()});
}
sb.auth.onAuthStateChange(()=>{});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
function openLink(l){if(!l)return;if(String(l).startsWith('checkin:'))return openBell();if(String(l).startsWith('rot:')){S.day=l.slice(4);go('rot')}else go(l)}
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.go&&S.me)openLink(e.data.go)});
boot();

// ---------- фон со стикерами (Дримми и значки из фирменного набора) ----------
(function(){
  const D=[ // файл, css-позиция, ширина, поворот
    ['mascot-balloon','right:-3vw;top:54vh','clamp(110px,20vw,200px)',6],
    ['mascot-hi','left:-4vw;bottom:13vh','clamp(110px,22vw,210px)',-5],
    ['sunglasses','right:24vw;top:36vh','clamp(70px,12vw,120px)',-14],
    ['cloud','right:9vw;top:21vh','clamp(90px,16vw,150px)',4],
    ['tree','left:2vw;top:41vh','clamp(46px,8vw,76px)',-8],
    ['smile','right:32vw;bottom:24vh','clamp(46px,8vw,72px)',10],
    ['sparkle','left:44vw;top:74vh','clamp(36px,6vw,58px)',0],
    ['burst','right:13vw;top:9vh','clamp(40px,7vw,64px)',12],
    ['bird','left:34vw;top:44vh','clamp(46px,8vw,76px)',10],
    ['heart','right:5vw;bottom:21vh','clamp(40px,7vw,64px)',-10],
    ['thumb','left:17vw;bottom:33vh','clamp(46px,8vw,72px)',-6]];
  const box=document.getElementById('bgs');if(!box)return;
  // россыпь нарисованных стикеров: сетка 4×8 со случайным (но одинаковым при каждом запуске) смещением
  const N=['star','flower','leaf','mushroom','acorn','balloon','rainbow','sun','moon','paw','butterfly','cupcake','drum','umbrella','snow','pumpkin','cherry'];
  let sd=7;const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296};
  const X=[];for(let r=0;r<8;r++)for(let c=0;c<4;c++){const f=N[(r*4+c*3+r)%N.length];if(r<2&&c<3||r===0)continue;
    X.push([f+'.svg',`left:${((c+.1+rnd()*.7)*25).toFixed(1)}vw;top:${((r+.05+rnd()*.7)*12.5).toFixed(1)}vh`,`clamp(44px,${(6+rnd()*3).toFixed(1)}vw,${Math.round(70+rnd()*24)}px)`,Math.round(rnd()*44-22)])}
  box.innerHTML=X.concat(D.map(d=>[d[0]+'.webp',d[1],d[2],d[3]])).map(([f,pos,w,r])=>`<img src="stickers/${f}" alt="" loading="lazy" decoding="async" style="${pos};width:${w};transform:rotate(${r}deg)">`).join('');
})();
