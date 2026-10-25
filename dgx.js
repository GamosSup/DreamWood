// DreamGile Pro: вложения, история, заявки техникам, повторяющиеся задачи, архив, настройки доски
const DGX_ZONES=['Веревочный лагерь','Золото','Гольф','Альфа','Боулинг','Кино','VR-арена','Аквазона Кит','Визги-брызги','Купол','Бильярд','Няня 1','Няня 2','Детский клуб','Общая территория','Другое'];
const DGX_DAYS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const dgxCache=new Map();

// универсальное окно
function dgxSheet(title,render,onClose,cls){
  const ov=document.createElement('div');ov.className='ov';
  const close=(refresh=true)=>{ov.remove();document.body.style.overflow='';if(refresh){if(onClose)onClose();else if(S.tab==='dg')dgView()}};
  const paint=async()=>{
    ov.innerHTML=`<div class="sheet ${cls||''}"><div class="sh"><button class="x" id="bk" aria-label="Назад">←</button><b>${title}</b><span></span></div><div class="sb col" id="sbd"></div></div>`;
    ov.querySelector('#bk').onclick=()=>close();
    await render(ov.querySelector('#sbd'),paint,close);
  };
  ov.onclick=e=>{if(e.target===ov)close()};
  document.body.appendChild(ov);document.body.style.overflow='hidden';paint();return ov;
}

// ---------- файлы ----------
async function dgxUrl(path,bucket='dg'){
  const key=bucket+'/'+path,c=dgxCache.get(key);if(c&&c.exp>Date.now())return c.url;
  const r=await sb.storage.from(bucket).createSignedUrl(path,3600);if(r.error)return null;
  dgxCache.set(key,{url:r.data.signedUrl,exp:Date.now()+3300e3});return r.data.signedUrl;
}
function dgxShrink(file,max=1600){
  return new Promise(res=>{
    if(!/^image\/(jpeg|png|webp)/.test(file.type))return res(file);
    const img=new Image(),u=URL.createObjectURL(file);
    img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      c.toBlob(b=>{URL.revokeObjectURL(u);res(b?new File([b],file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):file)},'image/jpeg',.82)};
    img.onerror=()=>{URL.revokeObjectURL(u);res(file)};img.src=u;
  });
}
async function dgxUpload(taskId,file){
  const f=await dgxShrink(file);
  if(f.size>10*1024*1024)return 'Файл «'+file.name+'» больше 10 МБ';
  const ext=((f.name.match(/\.(\w{1,5})$/)||[])[1]||'bin').toLowerCase();
  const path=`${taskId}/${crypto.randomUUID()}.${ext}`;
  const up=await sb.storage.from('dg').upload(path,f,{contentType:f.type||'application/octet-stream'});
  if(up.error)return 'Не загрузилось: '+up.error.message;
  const r=await sb.from('dg_files').insert({task_id:taskId,path,name:file.name,mime:f.type,size:f.size});
  if(r.error)return 'Не сохранилось: '+r.error.message;
  return null;
}

// удалить файлы задачи из хранилища (перед удалением самой задачи)
async function dgxDropFiles(id){const f=(await sb.from('dg_files').select('path').eq('task_id',id)).data||[];if(f.length)await sb.storage.from('dg').remove(f.map(x=>x.path))}

// вложения и история внутри карточки задачи
async function dgxMount(ov,id,mgr){
  const fe=ov.querySelector('#dgfiles'),he=ov.querySelector('#dghist');if(!fe)return;
  const [f,h]=await Promise.all([
    sb.from('dg_files').select('*').eq('task_id',id).order('created_at'),
    sb.from('dg_history').select('*').eq('task_id',id).order('at',{ascending:false}).limit(40)]);
  if(!ov.isConnected)return;
  const files=f.data||[],urls=await Promise.all(files.map(x=>dgxUrl(x.path)));
  fe.innerHTML=`<b style="font-size:14px">Вложения</b><div class="fgrid" style="margin-top:6px">${files.map((x,i)=>{
    const img=/^image\//.test(x.mime||'');
    return `<div class="fi">${img&&urls[i]?`<a href="${urls[i]}" target="_blank" rel="noopener"><img src="${urls[i]}" alt="${esc(x.name||'')}" loading="lazy"></a>`:`<a href="${urls[i]||'#'}" target="_blank" rel="noopener">📎<br>${esc((x.name||'файл').slice(-24))}</a>`}${(mgr||x.uploaded_by===S.me.id)?`<button class="x" data-fd="${x.id}" aria-label="Удалить">×</button>`:''}</div>`}).join('')||'<span class="muted">Пока нет</span>'}</div>
    <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;margin-top:8px;cursor:pointer;flex-direction:row">📎 Добавить фото или файл<input id="dgfin" type="file" multiple accept="image/*,application/pdf" hidden></label><div class="err" id="dgfer"></div>`;
  fe.querySelector('#dgfin').onchange=async e=>{
    const list=[...e.target.files];if(!list.length)return;const er=fe.querySelector('#dgfer');er.style.color='var(--muted)';er.textContent='Загружаю…';
    let bad='';for(const file of list){const r=await dgxUpload(id,file);if(r)bad=r}
    if(bad){er.style.color='';er.textContent=bad}else dgxMount(ov,id,mgr);
  };
  fe.querySelectorAll('[data-fd]').forEach(b=>b.onclick=async()=>{
    if(!confirm('Удалить вложение?'))return;const x=files.find(y=>y.id===b.dataset.fd);
    if(x)await sb.storage.from('dg').remove([x.path]);await sb.from('dg_files').delete().eq('id',b.dataset.fd);dgxMount(ov,id,mgr)});
  if(he){const hs=h.data||[];
    he.innerHTML=`<details><summary style="font-weight:700;font-size:14px;cursor:pointer">🕘 История изменений (${hs.length})</summary>${hs.map(x=>`<div class="cmt"><span class="muted">${ago(x.at)}</span> · <b>${esc(x.user_id?pname(x.user_id):'Система')}</b> ${esc(x.what)}</div>`).join('')||'<div class="muted">Пока пусто</div>'}</details>`}
}

// ---------- кнопки на доске ----------
const dgxIntake=()=>(S.dg.boards||[]).find(b=>b.intake);
function dgxToolbar(){
  let h='';
  if(dgxIntake())h+='<button id="dgx_in" style="background:#E4B5A3">🛠 Сообщить о поломке</button>';
  if(isManager())h+='<button id="dgx_rc" style="background:#E3EAD2">🔁 Повторяющиеся</button><button id="dgx_ar" style="background:#E3EAD2">🗄 Архив</button><button id="dgx_bs" style="background:#E3EAD2">⚙️ Доска</button>';
  return h;
}
function dgxBind(){
  $('#dgx_in')?.addEventListener('click',()=>dgxIntakeForm());
  $('#dgx_rc')?.addEventListener('click',dgxRecurring);
  $('#dgx_ar')?.addEventListener('click',dgxArchive);
  $('#dgx_bs')?.addEventListener('click',dgxBoardSettings);
  if(!S.dg.spawned){S.dg.spawned=true;sb.rpc('dg_spawn_recurring').then(r=>{if(!r.error&&r.data>0&&S.tab==='dg')dgView()})}
}

// ---------- заявка технику ----------
function dgxIntakeForm(){
  const ib=dgxIntake();if(!ib)return alert('Доска заявок не создана');
  let files=[];
  dgxSheet('🛠 Сообщить о поломке',(box,paint,close)=>{
    box.innerHTML=`<div class="muted">Заявка сразу уйдёт технической службе и руководителям.</div>
    <label>Где<select id="i_z">${DGX_ZONES.map(z=>`<option>${esc(z)}</option>`).join('')}</select></label>
    <label>Что случилось<textarea id="i_d" placeholder="Например: не работает кнопка запуска, шумит двигатель, трещина в ограждении"></textarea></label>
    <label>Срочность<select id="i_p"><option value="normal">Обычная — можно в течение дня</option><option value="high">Высокая — мешает работе</option><option value="urgent">СРОЧНО — аттракцион нельзя использовать</option></select></label>
    <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer;flex-direction:row">📷 Прикрепить фото<input id="i_f" type="file" multiple accept="image/*" hidden></label>
    <div class="muted" id="i_fl">${files.length?'Выбрано файлов: '+files.length:''}</div>
    <button class="btn" id="i_go">Отправить заявку</button><div class="err" id="i_er"></div>`;
    box.querySelector('#i_f').onchange=e=>{files=[...e.target.files];box.querySelector('#i_fl').textContent='Выбрано файлов: '+files.length};
    box.querySelector('#i_go').onclick=async e=>{
      const d=box.querySelector('#i_d').value.trim(),er=box.querySelector('#i_er');if(!d)return er.textContent='Опиши, что случилось';
      e.target.disabled=true;er.style.color='var(--muted)';er.textContent='Отправляю…';
      const c=await sb.from('dg_columns').select('id').eq('board_id',ib.id).order('pos').limit(1).single();
      if(c.error){e.target.disabled=false;er.style.color='';return er.textContent=c.error.message}
      const z=box.querySelector('#i_z').value,title=(z+': '+d).slice(0,90);
      const r=await sb.from('dg_tasks').insert({board_id:ib.id,column_id:c.data.id,title,descr:d,zone:z,priority:box.querySelector('#i_p').value,pos:Date.now()/1e6}).select().single();
      if(r.error){e.target.disabled=false;er.style.color='';return er.textContent='Не получилось: '+r.error.message}
      for(const f of files)await dgxUpload(r.data.id,f);
      S.dg.board=ib.id;close(false);alert('Заявка отправлена ✅');go('dg');
    };
  });
}

// ---------- повторяющиеся задачи ----------
function dgxRecurring(){
  let edit=null;
  dgxSheet('🔁 Повторяющиеся задачи',async(box,paint)=>{
    const D=S.dg;
    if(!edit){
      const [r,c]=await Promise.all([sb.from('dg_recurring').select('*').order('created_at'),sb.from('dg_columns').select('id,title,board_id')]);
      const cols=c.data||[],list=r.data||[];
      const when=x=>x.rule==='month'?`каждое ${x.dom}-е число`:(x.dows.length===7?'каждый день':x.dows.map(d=>DGX_DAYS[d-1]).join(', '));
      box.innerHTML=`<div class="muted">Задачи будут создаваться сами каждое утро (06:00) по расписанию — например, «Проверить зону перед открытием».</div>
      ${list.map(x=>`<div class="card pad col" style="${x.active?'':'opacity:.55'}"><b>${esc(x.title)}</b><div class="muted">${when(x)} · колонка «${esc(cols.find(k=>k.id===x.column_id)?.title||'?')}»${x.assignees.length?' · '+esc(x.assignees.map(pname).join(', ')):''}${x.items.length?' · чек-лист: '+x.items.length:''}</div>
        <div class="two"><button class="btn ghost" data-rt="${x.id}" style="min-height:40px">${x.active?'Пауза':'Включить'}</button><button class="btn ghost" data-re="${x.id}" style="min-height:40px">Изменить</button><button class="btn ghost" data-rd="${x.id}" style="min-height:40px;color:#9b2c2c;border-color:#9b2c2c">×</button></div></div>`).join('')||'<div class="muted">Пока ничего нет.</div>'}
      <button class="btn" id="rc_new">+ Новое правило</button>`;
      box.querySelector('#rc_new').onclick=()=>{edit={board_id:D.board,column_id:D.cols[0]?.id,title:'',descr:'',assignees:[],priority:'normal',rule:'week',dows:[1,2,3,4,5,6,7],dom:1,items:[],deadline_days:0,active:true};paint()};
      box.querySelectorAll('[data-re]').forEach(b=>b.onclick=()=>{edit={...list.find(x=>x.id===b.dataset.re)};paint()});
      box.querySelectorAll('[data-rt]').forEach(b=>b.onclick=async()=>{const x=list.find(y=>y.id===b.dataset.rt);await sb.from('dg_recurring').update({active:!x.active}).eq('id',x.id);paint()});
      box.querySelectorAll('[data-rd]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить правило? Уже созданные задачи останутся.'))return;await sb.from('dg_recurring').delete().eq('id',b.dataset.rd);paint()});
      return;
    }
    // форма
    const cols=(await sb.from('dg_columns').select('id,title,board_id').eq('board_id',edit.board_id).order('pos')).data||[];
    if(!cols.find(c=>c.id===edit.column_id))edit.column_id=cols[0]?.id;
    const x=edit;
    box.innerHTML=`<label>Название<input id="r_t" value="${esc(x.title)}" placeholder="Например: Проверка зоны перед открытием"></label>
    <label>Описание<textarea id="r_d">${esc(x.descr||'')}</textarea></label>
    <div class="two"><label>Доска<select id="r_b">${D.boards.map(b=>`<option value="${b.id}" ${b.id===x.board_id?'selected':''}>${esc(b.title)}</option>`).join('')}</select></label>
    <label>Колонка<select id="r_c">${cols.map(c=>`<option value="${c.id}" ${c.id===x.column_id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label></div>
    <div><b style="font-size:14px">Когда</b><div class="seg" style="margin-top:6px"><button data-rule="week" class="${x.rule==='week'?'on':''}">По дням недели</button><button data-rule="month" class="${x.rule==='month'?'on':''}">Раз в месяц</button></div></div>
    ${x.rule==='week'?`<div class="chips">${DGX_DAYS.map((n,i)=>`<button class="as ${x.dows.includes(i+1)?'on':''}" data-dw="${i+1}">${n}</button>`).join('')}</div>`:`<label>Число месяца<input id="r_dom" type="number" min="1" max="31" value="${x.dom||1}"></label>`}
    <div class="two"><label>Приоритет<select id="r_p">${Object.entries(PRI).map(([k,v])=>`<option value="${k}" ${k===x.priority?'selected':''}>${v[0]}</option>`).join('')}</select></label>
    <label>Срок через (дн.)<input id="r_dl" type="number" min="0" max="60" value="${x.deadline_days||0}"></label></div>
    <div><b style="font-size:14px">Исполнители</b><div class="chips" style="margin-top:6px">${D.people.map(p=>`<button class="as ${x.assignees.includes(p.id)?'on':''}" data-ra="${p.id}">${esc(p.full_name||'?')}</button>`).join('')}</div></div>
    <label>Чек-лист (каждый пункт с новой строки)<textarea id="r_i" placeholder="Осмотреть ограждение&#10;Проверить кнопку аварийной остановки">${esc((x.items||[]).join('\n'))}</textarea></label>
    <button class="btn" id="r_sv">Сохранить</button><button class="btn ghost" id="r_cn">Отмена</button><div class="err" id="r_er"></div>`;
    const read=()=>{x.title=box.querySelector('#r_t').value;x.descr=box.querySelector('#r_d').value;x.column_id=box.querySelector('#r_c').value;x.priority=box.querySelector('#r_p').value;x.deadline_days=+box.querySelector('#r_dl').value||0;x.items=box.querySelector('#r_i').value.split('\n').map(s=>s.trim()).filter(Boolean);if(x.rule==='month')x.dom=+box.querySelector('#r_dom').value||1};
    box.querySelector('#r_b').onchange=e=>{read();x.board_id=e.target.value;x.column_id=null;paint()};
    box.querySelectorAll('[data-rule]').forEach(b=>b.onclick=()=>{read();x.rule=b.dataset.rule;paint()});
    box.querySelectorAll('[data-dw]').forEach(b=>b.onclick=()=>{read();const d=+b.dataset.dw;x.dows=x.dows.includes(d)?x.dows.filter(y=>y!==d):[...x.dows,d].sort();paint()});
    box.querySelectorAll('[data-ra]').forEach(b=>b.onclick=()=>{read();const a=b.dataset.ra;x.assignees=x.assignees.includes(a)?x.assignees.filter(y=>y!==a):[...x.assignees,a];paint()});
    box.querySelector('#r_cn').onclick=()=>{edit=null;paint()};
    box.querySelector('#r_sv').onclick=async()=>{
      read();const er=box.querySelector('#r_er');if(!x.title.trim())return er.textContent='Введи название';if(x.rule==='week'&&!x.dows.length)return er.textContent='Выбери хотя бы один день';
      const row={board_id:x.board_id,column_id:x.column_id,title:x.title.trim(),descr:x.descr,assignees:x.assignees,priority:x.priority,rule:x.rule,dows:x.dows,dom:x.dom,items:x.items,deadline_days:x.deadline_days,active:x.active};
      const r=x.id?await sb.from('dg_recurring').update(row).eq('id',x.id):await sb.from('dg_recurring').insert(row);
      if(r.error)return er.textContent=r.error.message;
      edit=null;await sb.rpc('dg_spawn_recurring');paint();
    };
  });
}

// ---------- архив ----------
function dgxArchive(){
  dgxSheet('🗄 Архив задач',async(box,paint)=>{
    const r=await sb.from('dg_tasks').select('id,title,updated_at,column_id').eq('board_id',S.dg.board).eq('archived',true).order('updated_at',{ascending:false}).limit(100);
    const list=r.data||[];
    box.innerHTML=`<div class="muted">Выполненные задачи уходят сюда через 14 дней сами. Можно вернуть на доску или удалить насовсем.</div>${list.map(t=>`<div class="otr"><span><b>${esc(t.title)}</b><br><span class="muted">${ago(t.updated_at)}</span></span><span style="display:flex;gap:6px"><button class="btn ghost" data-ur="${t.id}" style="min-height:38px;padding:0 12px">Вернуть</button><button class="x" data-ud="${t.id}">×</button></span></div>`).join('')||'<div class="muted">В архиве пусто</div>'}`;
    box.querySelectorAll('[data-ur]').forEach(b=>b.onclick=async()=>{await sb.from('dg_tasks').update({archived:false}).eq('id',b.dataset.ur);paint()});
    box.querySelectorAll('[data-ud]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить задачу насовсем?'))return;await dgxDropFiles(b.dataset.ud);await sb.from('dg_tasks').delete().eq('id',b.dataset.ud);paint()});
  });
}

// ---------- настройки доски ----------
function dgxBoardSettings(){
  const D=S.dg;let b={...D.boards.find(x=>x.id===D.board)};if(!b.id)return;
  dgxSheet('⚙️ Доска',(box,paint,close)=>{
    box.innerHTML=`<label>Название<input id="b_t" value="${esc(b.title)}"></label>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="b_i" ${b.intake?'checked':''} style="width:24px;min-height:24px"> Принимать заявки от всех сотрудников</label>
    <div class="muted">Если включено, любой сотрудник может создать на этой доске заявку (например, «поломка»), а ответственные получат уведомление.</div>
    ${b.intake?`<div><b style="font-size:14px">Кого назначать на заявки</b><div class="chips" style="margin-top:6px">${D.people.map(p=>`<button class="as ${(b.intake_assignees||[]).includes(p.id)?'on':''}" data-ba="${p.id}">${esc(p.full_name||'?')}</button>`).join('')}</div></div>`:''}
    <button class="btn" id="b_sv">Сохранить</button><button class="btn ghost" id="b_del" style="color:#9b2c2c;border-color:#9b2c2c">Удалить доску со всеми задачами</button><div class="err" id="b_er"></div>`;
    const read=()=>{b.title=box.querySelector('#b_t').value;b.intake=box.querySelector('#b_i').checked};
    box.querySelector('#b_i').onchange=()=>{read();paint()};
    box.querySelectorAll('[data-ba]').forEach(x=>x.onclick=()=>{read();const a=x.dataset.ba,s=b.intake_assignees||[];b.intake_assignees=s.includes(a)?s.filter(y=>y!==a):[...s,a];paint()});
    box.querySelector('#b_sv').onclick=async()=>{read();if(!b.title.trim())return box.querySelector('#b_er').textContent='Введи название';
      const r=await sb.from('dg_boards').update({title:b.title.trim(),intake:b.intake,intake_assignees:b.intake?b.intake_assignees||[]:[]}).eq('id',b.id);
      if(r.error)return box.querySelector('#b_er').textContent=r.error.message;close()};
    box.querySelector('#b_del').onclick=async()=>{if(!confirm('Удалить доску «'+b.title+'» и все её задачи? Это нельзя отменить.'))return;
      const r=await sb.from('dg_boards').delete().eq('id',b.id);if(r.error)return box.querySelector('#b_er').textContent=r.error.message;D.board=null;close()};
  });
}
