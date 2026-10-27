// Списание (вкладка в «Обращениях») и аварийная тревога
const WO_R={broken:['💥','Сломано / разбито'],worn:['🧵','Износ'],lost:['🔍','Утеряно'],expired:['⌛','Истёк срок'],other:['📝','Другое']};
const WO_ST={new:['Новое','#E8B4B8'],approved:['Согласовано','#E6CC8F'],done:['Списано','#C9D4B0'],rejected:['Отклонено','#E8DCCB']};
const WO_U=['шт','компл.','упак.','кг','л','м','пар'];
S.wo={f:'all'};
async function woView(){
  await ensurePeople();
  const [r,fl]=await Promise.all([sb.from('writeoffs').select('*').order('created_at',{ascending:false}).limit(300),sb.from('wo_files').select('wo_id,mime')]);
  const mgr=isManager(),all=r.data||[],list=all.filter(x=>S.wo.f==='all'||x.status===S.wo.f);
  const nf={};(fl.data||[]).forEach(x=>{nf[x.wo_id]=(nf[x.wo_id]||0)+1});
  let h=head('Списание',mgr?'Заявки на списание имущества и расходников':'Твои заявки на списание')+subBar('ap','wo');
  h+=`<button class="btn" id="wo_new">🗑 Новое списание</button>`;
  if(mgr){const c=s=>all.filter(x=>x.status===s).length;
    h+=`<div class="tabs">${[['all','Все',all.length],['new','Новые',c('new')],['approved','Согласованы',c('approved')],['done','Списаны',c('done')],['rejected','Отклонены',c('rejected')]].map(([k,n,v])=>`<button data-f="${k}" class="${S.wo.f===k?'on':''}" style="background:var(--tab)">${n} · ${v}</button>`).join('')}<button id="wo_csv" style="background:var(--tab)">⬇️ Excel</button></div>`}
  h+=list.map(x=>`<div class="card pad col" data-wo="${x.id}" style="cursor:pointer;border-left:8px solid ${WO_ST[x.status][1]}">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${WO_R[x.reason][0]} ${esc(x.item)}</b><span class="pill" style="background:${WO_ST[x.status][1]}">${WO_ST[x.status][0]}</span></div>
    <div style="font-size:14px">${+x.qty} ${esc(x.unit)}${x.zone?' · '+esc(x.zone):''} · ${WO_R[x.reason][1]}</div>
    <div class="muted">${dayLabel(iso(new Date(x.created_at)))}${nf[x.id]?' · 📷 '+nf[x.id]:''}${mgr?' · '+esc(shortName(pname(x.created_by))):''}</div></div>`).join('')||'<div class="card pad muted">Пока заявок на списание нет.</div>';
  app.innerHTML=h;
  $('#wo_new').onclick=woForm;
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.wo.f=b.dataset.f;woView()});
  app.querySelectorAll('[data-wo]').forEach(b=>b.onclick=()=>woOpen(all.find(x=>x.id===b.dataset.wo)));
  $('#wo_csv')?.addEventListener('click',()=>downloadCSV('spisaniya_'+iso(new Date())+'.csv',[['Дата','Что','Кол-во','Ед.','Зона','Причина','Комментарий','Кто подал','Статус','Решение']].concat(all.map(x=>[iso(new Date(x.created_at)),x.item,+x.qty,x.unit,x.zone||'',WO_R[x.reason][1],x.descr||'',pname(x.created_by),WO_ST[x.status][0],x.resolution||'']))));
}
function woForm(){
  let files=[];
  dgxSheet('🗑 Новое списание',(box,paint,close)=>{
    const show=()=>{box.querySelector('#w_fl').innerHTML=files.map((f,i)=>`<div class="otr"><span>${/^video\//.test(f.type)?'🎬':'📷'} ${esc(f.name.slice(-28))} <span class="muted">${fixSize(f.size)}</span></span><button class="btn ghost" data-rm="${i}" style="min-height:34px;padding:0 12px">✕</button></div>`).join('');
      box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{files.splice(+b.dataset.rm,1);show()})};
    box.innerHTML=`<div class="muted">Что нужно списать и почему. Фото помогает руководителю быстрее согласовать.</div>
    <label>Что списываем<input id="w_i" placeholder="Например: надувной мяч, страховочный карабин"></label>
    <div class="two"><label>Количество<input id="w_q" type="number" inputmode="decimal" min="0" step="any" value="1"></label><label>Единица<select id="w_u">${WO_U.map(u=>`<option>${u}</option>`).join('')}</select></label></div>
    <div class="two"><label>Зона<select id="w_z"><option value="">— не указана —</option>${DGX_ZONES.map(z=>`<option>${esc(z)}</option>`).join('')}</select></label><label>Причина<select id="w_r">${Object.entries(WO_R).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select></label></div>
    <label>Комментарий<textarea id="w_d" placeholder="Что случилось, где лежит сейчас…"></textarea></label>
    <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer;flex-direction:row">📷 Фото или видео<input id="w_f" type="file" multiple accept="image/*,video/*" hidden></label><div id="w_fl" class="col"></div>
    <button class="btn" id="w_go">Отправить</button><div class="err" id="w_er"></div>`;
    box.querySelector('#w_f').onchange=e=>{files=files.concat([...e.target.files]);e.target.value='';show()};
    box.querySelector('#w_go').onclick=async e=>{
      const er=box.querySelector('#w_er'),item=box.querySelector('#w_i').value.trim(),q=+box.querySelector('#w_q').value;
      if(!item)return er.textContent='Напиши, что списываем';if(!(q>0))return er.textContent='Укажи количество';
      e.target.disabled=true;er.style.color='var(--muted)';er.textContent='Отправляю…';
      const r=await sb.from('writeoffs').insert({item,qty:q,unit:box.querySelector('#w_u').value,zone:box.querySelector('#w_z').value||null,reason:box.querySelector('#w_r').value,descr:box.querySelector('#w_d').value.trim()||null}).select().single();
      if(r.error){e.target.disabled=false;er.style.color='';return er.textContent='Не получилось: '+r.error.message}
      let bad='';for(const f of files){const m=await fileUpload('wo','wo_files','wo_id',r.data.id,f,50);if(m)bad=m}
      close(false);alert(bad?'Заявка отправлена, но файл не загрузился: '+bad:'Отправлено, руководители уведомлены ✅');woView();
    };
  },()=>{if(onTab('wo'))woView()});
}
function woOpen(x){
  const mgr=isManager();
  dgxSheet('🗑 '+esc(x.item),async box=>{
    const f=await sb.from('wo_files').select('*').eq('wo_id',x.id).order('created_at');const files=f.data||[];
    const urls=await Promise.all(files.map(y=>dgxUrl(y.path,'wo')));
    const media=files.map((y,i)=>{const u=urls[i];if(!u)return dgxMiss(y);
      if(/^video\//.test(y.mime||''))return `<video src="${u}" controls playsinline preload="metadata" style="width:100%;border-radius:14px;background:#000;max-height:60vh"></video>`;
      if(/^image\//.test(y.mime||''))return `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" loading="lazy" alt="" style="width:100%;border-radius:14px;display:block"></a>`;
      return `<a href="${u}" target="_blank" rel="noopener">📎 ${esc(y.name||'файл')}</a>`}).join('');
    box.innerHTML=`<div class="muted">${dayLabel(iso(new Date(x.created_at)))} · подал(а): ${esc(pname(x.created_by))} · <span class="pill" style="background:${WO_ST[x.status][1]}">${WO_ST[x.status][0]}</span></div>
    <div class="otr"><span>Количество</span><b>${+x.qty} ${esc(x.unit)}</b></div><div class="otr"><span>Причина</span><b>${WO_R[x.reason][0]} ${WO_R[x.reason][1]}</b></div>${x.zone?`<div class="otr"><span>Зона</span><b>${esc(x.zone)}</b></div>`:''}
    ${x.descr?`<div style="white-space:pre-wrap">${esc(x.descr)}</div>`:''}
    ${media?`<div class="col" style="gap:10px">${media}</div>`:'<div class="muted">Без фото</div>'}
    ${mgr?`<label>Статус<select id="w_st">${apStOpts(WO_ST,x.status,[])}</select></label>
      <label>Решение / комментарий (увидит сотрудник)<textarea id="w_rs">${esc(x.resolution||'')}</textarea></label>
      <button class="btn" id="w_sv">Сохранить</button><button class="btn ghost" id="w_dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить заявку</button><div class="err" id="w_er"></div>`
      :(x.resolution?`<div><b style="font-size:14px">Ответ руководителя</b><div style="margin-top:4px;white-space:pre-wrap">${esc(x.resolution)}</div></div>`:'')+(x.status==='new'?`<button class="btn ghost" id="w_dl" style="color:#9b2c2c;border-color:#9b2c2c">Отозвать заявку</button><div class="err" id="w_er"></div>`:'')}`;
    box.querySelector('#w_sv')?.addEventListener('click',async()=>{const r=await sb.from('writeoffs').update({status:box.querySelector('#w_st').value,resolution:box.querySelector('#w_rs').value.trim()||null}).eq('id',x.id);if(r.error)return box.querySelector('#w_er').textContent=r.error.message;document.querySelector('.ov #bk').click()});
    box.querySelector('#w_dl')?.addEventListener('click',async()=>{if(!confirm('Удалить заявку на списание?'))return;const r=await sb.from('writeoffs').delete().eq('id',x.id);if(r.error)return box.querySelector('#w_er').textContent=r.error.message;document.querySelector('.ov #bk').click()});
  },()=>{if(onTab('wo'))woView()});
}
VIEWS.wo=woView;

// ================= АВАРИЙНАЯ ТРЕВОГА =================
const AL={
  prepare:{ic:'⚠️',t:'Внимание, приготовиться',d:'Приготовьтесь, ждите указаний руководителя.',c:'#F2B84B',fg:'#3a2a00'},
  danger:{ic:'🚨',t:'Воздушная опасность, эвакуируемся',d:'Немедленно ведите гостей в укрытие, действуйте по инструкции.',c:'#C0392B',fg:'#fff'},
  clear:{ic:'✅',t:'Отбой тревоги',d:'Опасность миновала, возвращаемся к работе по указанию руководителя.',c:'#5E9C76',fg:'#fff'}
};
const AU={ctx:null,timer:null,vib:null};
function alSound(level){
  alStop(true);
  try{AU.ctx=AU.ctx||new (window.AudioContext||window.webkitAudioContext)();if(AU.ctx.state==='suspended')AU.ctx.resume()}catch(e){}
  const beep=(f,d,at=0)=>{if(!AU.ctx)return;try{const o=AU.ctx.createOscillator(),g=AU.ctx.createGain(),t=AU.ctx.currentTime+at;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AU.ctx.destination);o.start(t);o.stop(t+d+.02)}catch(e){}};
  const tick=()=>{if(level==='danger'){beep(620,.5,0);beep(900,.5,.5);beep(620,.5,1);beep(900,.5,1.5)}else if(level==='prepare'){beep(780,.25,0);beep(780,.25,.4)}else{beep(660,.2,0);beep(880,.3,.25)}
    try{navigator.vibrate&&navigator.vibrate(level==='danger'?[600,200,600,200,600]:level==='prepare'?[300,150,300]:[150,80,150])}catch(e){}};
  tick();if(level!=='clear')AU.timer=setInterval(tick,level==='danger'?2200:3500);
}
function alStop(keepCtx){clearInterval(AU.timer);AU.timer=null;try{navigator.vibrate&&navigator.vibrate(0)}catch(e){}}
const alOld=a=>Date.now()-new Date(a.created_at)>12*3600e3;
async function alertCheck(){
  if(!S.me||S.me.status!=='approved')return;
  await ensurePeople();
  const r=await sb.from('alerts').select('*').order('id',{ascending:false}).limit(1);
  if(r.error)return;const a=(r.data||[])[0];S.alert=a||null;
  const ack=+lsGet('dw_al_ack')||0,clr=+lsGet('dw_al_clr')||0,last=+lsGet('dw_al_last')||0;
  document.getElementById('alb')?.remove();document.body.classList.remove('hasal');
  if(!a)return alHide();
  if(a.level==='clear'){
    if(Date.now()-new Date(a.created_at)<3*3600e3&&a.id>clr&&last&&last<a.id){if(!document.getElementById('alov')||document.getElementById('alov').dataset.id!=a.id)alShow(a)}else alHide();
    return;
  }
  if(alOld(a))return alHide();
  lsSet('dw_al_last',String(Math.max(last,a.id)));
  if(a.id>ack){if(!document.getElementById('alov')||document.getElementById('alov').dataset.id!=a.id)alShow(a)}
  else if(!document.getElementById('alov')){const b=document.createElement('button');b.id='alb';b.className='alb '+a.level;b.textContent=AL[a.level].ic+' '+AL[a.level].t+' · подробнее';b.onclick=()=>alShow(a,true);document.body.appendChild(b);document.body.classList.add('hasal')}
}
function alHide(){alStop();document.getElementById('alov')?.remove();document.body.style.overflow=document.querySelector('.ov')?'hidden':''}
async function alShow(a,quiet){
  alHide();const L=AL[a.level],mgr=isManager();
  const ov=document.createElement('div');ov.id='alov';ov.dataset.id=a.id;ov.className='alov '+a.level;ov.style.cssText=`background:${L.c};color:${L.fg}`;
  const when=new Date(a.created_at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  ov.innerHTML=`<div class="alin"><div class="alic">${L.ic}</div><h1>${L.t}</h1><p>${esc(a.note||L.d)}</p><div class="alm">Объявлено в ${when}${a.created_by?' · '+esc(shortName(pname(a.created_by))):''}</div>
    <div id="alacks" class="alacks"></div>
    <button class="albtn" id="al_ok">${a.level==='clear'?'Ок':'✅ Понял(а)'}</button>
    ${mgr?`<button class="albtn ghost" id="al_mng">⚙️ Управление тревогой</button>`:''}</div>`;
  document.body.appendChild(ov);document.body.style.overflow='hidden';
  if(!quiet)alSound(a.level);
  ov.addEventListener('pointerdown',()=>{try{AU.ctx&&AU.ctx.state==='suspended'&&AU.ctx.resume()}catch(e){}},{once:true});
  ov.querySelector('#al_ok').onclick=async()=>{
    alStop();
    if(a.level==='clear'){lsSet('dw_al_clr',String(a.id))}
    else{lsSet('dw_al_ack',String(a.id));sb.from('alert_acks').insert({alert_id:a.id}).then(()=>{})}
    alHide();alertCheck()};
  ov.querySelector('#al_mng')?.addEventListener('click',()=>{alStop();alertSheet()});
  if(mgr)alAcks(a,ov.querySelector('#alacks'));
}
async function alAcks(a,box){
  const [k,p]=await Promise.all([sb.from('alert_acks').select('user_id,at').eq('alert_id',a.id),sb.from('profiles').select('id,full_name').eq('status','approved')]);
  if(k.error||p.error||!box.isConnected)return;
  const got=new Set((k.data||[]).map(x=>x.user_id)),all=p.data||[],miss=all.filter(x=>!got.has(x.id));
  box.innerHTML=`<b>Подтвердили: ${got.size} из ${all.length}</b>${miss.length&&a.level!=='clear'?`<div class="alm">Не ответили: ${miss.map(x=>esc(shortName(x.full_name))).join(', ')}</div>`:''}`;
  if(box.isConnected&&document.getElementById('alov')&&a.level!=='clear')setTimeout(()=>{if(box.isConnected)alAcks(a,box)},8000);
}
function alertSheet(){
  dgxSheet('🚨 Тревога',(box,paint,close)=>{
    const cur=S.alert&&!alOld(S.alert)&&S.alert.level!=='clear'?S.alert:null;
    box.innerHTML=`<div class="muted">Сообщение уйдёт <b>всем сотрудникам</b> сразу: на экране во весь размер, со звуком и вибрацией. Нажми на кнопку, затем подтверди.</div>
    ${cur?`<div class="card pad" style="background:${AL[cur.level].c};color:${AL[cur.level].fg}"><b>Сейчас объявлено: ${AL[cur.level].t}</b></div>`:''}
    <label>Пояснение (необязательно)<textarea id="a_n" placeholder="Например: укрытие — подвал главного корпуса"></textarea></label>
    <button class="btn alsend prepare" data-l="prepare">⚠️ Внимание, приготовиться</button>
    <button class="btn alsend danger" data-l="danger">🚨 Воздушная опасность, эвакуируемся</button>
    <button class="btn alsend clear" data-l="clear">✅ Отбой тревоги</button><div class="err" id="a_er"></div>`;
    box.querySelectorAll('.alsend').forEach(b=>{let armed=0,tm;const t0=b.innerHTML;
      b.onclick=async()=>{
        if(!armed){armed=1;b.classList.add('armed');b.innerHTML='Нажми ещё раз — отправить ВСЕМ';tm=setTimeout(()=>{armed=0;b.classList.remove('armed');b.innerHTML=t0},4000);return}
        clearTimeout(tm);box.querySelectorAll('.alsend').forEach(x=>x.disabled=true);
        const r=await sb.from('alerts').insert({level:b.dataset.l,note:box.querySelector('#a_n').value.trim()||null});
        if(r.error){box.querySelectorAll('.alsend').forEach(x=>x.disabled=false);armed=0;b.classList.remove('armed');b.innerHTML=t0;box.querySelector('#a_er').textContent=r.error.message;return}
        close(false);await alertCheck();
      }});
  });
}
window.alertSheet=alertSheet;
const alertCard=()=>isManager()?`<button class="alcard" id="td_alert"><span>🚨</span><span><b>Тревога</b><br><small>Предупредить всех сотрудников</small></span></button>`:'';
setInterval(()=>{if(!document.hidden)alertCheck()},45000); // мгновенно приходит через realtime и пуш; опрос — страховка (реже, чтобы не нагружать сеть)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)alertCheck()});
setTimeout(alertCheck,2500);
try{sb.channel('alerts-live').on('postgres_changes',{event:'INSERT',schema:'public',table:'alerts'},()=>alertCheck()).subscribe()}catch(e){}

// ---- волна под пальцем на кнопках (анимация нажатия) ----
document.addEventListener('pointerdown',e=>{
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const b=e.target.closest&&e.target.closest('.btn,.tabs button,.seg button,.albtn,.alcard');if(!b||b.disabled)return;
  const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');
  s.className='ripple';s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  b.appendChild(s);setTimeout(()=>s.remove(),600)},{passive:true});

// ---- «С сайта парка»: новости и афиша с официального сайта для гостей + быстрые ссылки ----
const SITE='https://www.dreamwoodpark.com';
const SITE_LINKS=[['🎟️','Билеты','/tickets/'],['📅','Расписание активностей','/programm/'],['🎢','Аттракционы и услуги','/attractions/'],['🏙️','Метрополис','/metropolis/'],['🍽️','Точки питания','/restaurants/'],['📜','Правила посещения','/rules/'],['❓','Вопросы и ответы','/faq/'],['📞','Контакты и проезд','/contacts/']];
async function siteBlock(){
  const box=document.getElementById('sitebox');if(!box)return;
  const links=`<div class="card pad col"><b>🧭 Для ответов гостям</b><div class="muted">Официальный сайт парка: быстрые ссылки</div><div class="sitel">${SITE_LINKS.map(([ic,n,u])=>`<a href="${SITE+u}" target="_blank" rel="noopener">${ic} ${n}</a>`).join('')}</div><div class="muted">Телефоны для гостей: <a href="tel:88005504326">8 800 550-43-26</a> · консьерж <a href="tel:88004442417">8 800 444-24-17</a></div></div>`;
  box.innerHTML=links;
  let d=null;
  try{const c0=JSON.parse(lsGet('dw_site'));if(c0&&Date.now()-c0.t<6*3600e3)d=c0.d}catch(e){}
  if(!d)try{const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);const r=await fetch('/api/site',{signal:c.signal});clearTimeout(t);if(r.ok){d=await r.json();lsSet('dw_site',JSON.stringify({t:Date.now(),d}))}}catch(e){}
  if(!d||!(d.items||[]).length){try{const c=JSON.parse(lsGet('dw_site'));if(c)d=c.d}catch(e){}}
  if(!document.getElementById('sitebox')||!d||!(d.items||[]).length)return;
  const e=x=>esc(x);
  box.innerHTML=`<div class="card pad col"><b>🌐 С сайта парка</b><div class="muted">Что сейчас видят гости: афиша и новости dreamwoodpark.com</div>${d.items.slice(0,6).map(x=>`<a class="sitei" href="${e(x.url)}" target="_blank" rel="noopener">${x.img?`<img src="${e(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:''}<span><b>${e(x.title)}</b>${x.date?`<span class="pill" style="background:var(--gold);align-self:flex-start">${e(x.date)}</span>`:''}${x.text?`<span class="muted sitet">${e(x.text)}</span>`:''}<span class="sitem">Открыть на сайте →</span></span></a>`).join('')}</div>`+links;
}
window.siteBlock=siteBlock;
