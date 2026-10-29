// Аттракционы: общие статусы, причины простоя, маршруты и дорожки, быстрый переход в базу знаний.
const ATTRACT_KIDS={
  ropes:[['family','Семейный','лёгкий'],['master','Мастер','средний'],['hero','Герой','сложный']],
  bowling:[['lane1','Дорожка 1'],['lane2','Дорожка 2'],['lane3','Дорожка 3'],['lane4','Дорожка 4']]
};
const ATTRACT=DGX_ZONES.filter(x=>!['Няня 1','Няня 2','Общая территория','Другое'].includes(x)).map(n=>({
  id:{Данделион:'dandelion',Карусель:'carousel',Джипы:'jeeps',Шахта:'mine','Кон-Тики':'kontiki',Плющ:'ivy','Дерево приключений':'tree','Бабл хаус':'bubble','Лес Чудес':'forest','Веревочный лагерь':'ropes',Золото:'gold',Гольф:'golf',Альфа:'alpha',Боулинг:'bowling',Кино:'cinema','VR-арена':'vr','Аквазона Кит':'whale','Визги-брызги':'splash',Купол:'dome','Сухие горки':'slides','Студия волшебных образов':'studio','Квесты/Роботы':'quests',Терраса:'terrace',Бильярд:'billiards','Детский клуб':'kids'}[n],
  n,kids:ATTRACT_KIDS[{ 'Веревочный лагерь':'ropes',Боулинг:'bowling'}[n]]||[]
}));
ATTRACT.push({id:'archery',n:'Лучный тир',kids:[]});
const ATTRACT_REASONS=[
  ['rain','🌧 Дождь','идёт дождь'],
  ['wind','💨 Ветер','порывы больше 15 м/c'],
  ['storm','⛈ Гроза','гроза в районе парка'],
  ['cold','🥶 Низкая температура','температура ниже допустимой для эксплуатации'],
  ['breakdown','🛠 Поломка','техническая неисправность'],
  ['maintenance','⚙️ Техническое обслуживание','плановое техническое обслуживание'],
  ['cleaning','🧹 Уборка','уборка и подготовка зоны'],
  ['other','✏️ Другое','']
];
S.attract=S.attract||{filter:'all',rows:null,kb:[],error:''};
const attractRow=id=>(S.attract.rows||[]).find(x=>x.entity===id);
const attractOpen=id=>!attractRow(id)||attractRow(id).is_open;
function attractKb(n){
  const p=S.attract.kb.find(x=>x.title.toLowerCase()===n.toLowerCase());
  if(p)return kbOpen(p);
  S.kb={q:n,cat:'all',section:'base'};go('kb');
}
async function attractSet(id,open){
  const r=await sb.rpc('attraction_set',{p_entity:id,p_is_open:open,p_reason_code:null,p_reason_text:null});
  if(r.error){alert(r.error.message);return false}
  toast(open?'Аттракцион работает ✅':'Статус сохранён',1800);await attractView();return true;
}
function attractCloseForm(id,title){
  dgxSheet('🟠 '+title,(box,paint,close)=>{
    box.innerHTML=`<div class="muted">Выбери причину. Её увидит вся команда в разделе «Аттракционы».</div>
      <label>Причина<select id="at_reason">${ATTRACT_REASONS.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label>
      <label>Что произошло<textarea id="at_text" maxlength="500" required>${ATTRACT_REASONS[0][2]}</textarea></label>
      <button class="btn" id="at_save">Сохранить: отдыхает</button><div class="err" id="at_err"></div>`;
    const sel=box.querySelector('#at_reason'),txt=box.querySelector('#at_text');
    sel.onchange=()=>{txt.value=ATTRACT_REASONS.find(x=>x[0]===sel.value)[2];txt.focus()};
    box.querySelector('#at_save').onclick=async e=>{
      const reason=txt.value.trim();if(!reason)return box.querySelector('#at_err').textContent='Напиши причину простоя';
      e.target.disabled=true;
      const r=await sb.rpc('attraction_set',{p_entity:id,p_is_open:false,p_reason_code:sel.value,p_reason_text:reason});
      if(r.error){e.target.disabled=false;return box.querySelector('#at_err').textContent=r.error.message}
      close(false);toast('Причина сохранена',1800);await attractView();
    };
  },()=>{});
}
function attractCard(a){
  const row=attractRow(a.id),open=attractOpen(a.id),kb=S.attract.kb.find(x=>x.title.toLowerCase()===a.n.toLowerCase());
  let h=`<section class="card at-card ${open?'is-open':'is-closed'}" data-at-card="${a.id}"><div class="pad col"><div class="at-head"><div><b>${esc(a.n)}</b><div class="muted">${esc(areaOf(a.n).n)}</div></div><span class="at-state">${open?'● Работает':'● Отдыхает'}</span></div>
    ${!open?`<div class="at-reason"><b>Причина:</b> ${esc(row.reason_text||'не указана')}${row.updated_at?`<div class="muted">обновлено ${ago(row.updated_at)}</div>`:''}</div>`:''}
    <div class="at-actions"><button class="at-btn ${open?'on':''}" data-at-open="${a.id}" ${S.attract.error?'disabled':''}>Работает</button><button class="at-btn ${!open?'on closed':''}" data-at-close="${a.id}" data-title="${esc(a.n)}" ${S.attract.error?'disabled':''}>Отдыхает</button><button class="at-kb" data-at-kb="${esc(a.n)}" ${kb?`data-kb-id="${kb.id}"`:''}>📚 База знаний</button></div></div>`;
  if(a.kids.length){
    h+=`<div class="at-kids"><b>${a.id==='bowling'?'Дорожки':'Маршруты'}</b>${a.kids.map(k=>{
      const id=a.id+':'+k[0],kr=attractRow(id),ko=open&&attractOpen(id),own=!attractOpen(id);
      return `<div class="at-kid ${ko?'':'closed'}" data-at-card="${id}"><div><b>${esc(k[1])}</b>${k[2]?`<span class="muted"> · ${esc(k[2])}</span>`:''}<div class="muted">${!open?'Аттракцион отдыхает':ko?'работает':esc(kr.reason_text||'отдыхает')}</div></div><div class="at-kid-actions"><button class="at-mini ${ko?'on':''}" data-at-open="${id}" ${!open||S.attract.error?'disabled':''} aria-label="${esc(k[1])}: работает">✓</button><button class="at-mini ${own?'on closed':''}" data-at-close="${id}" data-title="${esc(a.n+' · '+k[1])}" ${!open||S.attract.error?'disabled':''} aria-label="${esc(k[1])}: отдыхает">Ⅱ</button></div></div>`}).join('')}</div>`;
  }
  return h+'</section>';
}
async function attractView(){
  const st=S.attract;
  if(!st.rows||st.reload){
    const [r,k]=await Promise.all([
      sb.from('attraction_status').select('entity,is_open,reason_code,reason_text,updated_by,updated_at'),
      sb.from('kb_pages').select('id,title,category,body,updated_at').eq('category','Аттракционы').order('title')
    ]);
    st.error=r.error?r.error.message:' ';st.rows=r.error?null:(r.data||[]);st.kb=k.data||[];st.reload=false;
    if(st.error===' ')st.error='';
  }
  const all=ATTRACT.filter(a=>st.filter==='all'||(st.filter==='open'?attractOpen(a.id):!attractOpen(a.id)));
  const open=ATTRACT.filter(a=>attractOpen(a.id)).length;
  let h=head('Аттракционы','Статусы зон, маршрутов и дорожек — видит вся команда');
  h+=`<div class="at-summary"><div><b>${open}</b><span>работает</span></div><div><b>${ATTRACT.length-open}</b><span>отдыхает</span></div><button class="btn ghost" id="at_refresh" aria-label="Обновить">↻</button></div>`;
  if(st.error)h+=`<div class="card pad col"><b>Статусы пока недоступны</b><div class="muted">Нужно применить обновление базы. Каталог и ссылки на инструкции уже доступны.</div><div class="err">${esc(st.error)}</div></div>`;
  h+=`<div class="tabs">${[['all','Все'],['open','Работают'],['closed','Отдыхают']].map(([k,n])=>`<button data-af="${k}" class="${st.filter===k?'on':''}" style="background:var(--tab)">${n}</button>`).join('')}</div>`;
  h+=byArea(all,x=>x.n).map(({a,items})=>`<details class="area" data-ar="at${a.k}" open>${areaHead(a,items.length)}<div class="ab at-list" style="background:${a.d}">${items.map(attractCard).join('')}</div></details>`).join('')||'<div class="card pad muted">В этом фильтре ничего нет.</div>';
  app.innerHTML=h;bindAreas(app);
  $('#at_refresh').onclick=async()=>{st.reload=true;await attractView()};
  app.querySelectorAll('[data-af]').forEach(b=>b.onclick=()=>{st.filter=b.dataset.af;attractView()});
  app.querySelectorAll('[data-at-open]').forEach(b=>b.onclick=async()=>{b.disabled=true;if(!await attractSet(b.dataset.atOpen,true))b.disabled=false});
  app.querySelectorAll('[data-at-close]').forEach(b=>b.onclick=()=>attractCloseForm(b.dataset.atClose,b.dataset.title));
  app.querySelectorAll('[data-at-kb]').forEach(b=>b.onclick=()=>attractKb(b.dataset.atKb));
}
VIEWS.attract=attractView;
