// Смена (чек-листы открытия/закрытия) и журнал происшествий
const hm=ts=>new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
const shortName=n=>String(n||'—').trim().split(/\s+/).slice(0,2).join(' ');
async function ensurePeople(force){
  if(!force&&S.dg.people&&S.dg.people.length&&S.dg.people[0].position!==undefined)return;
  const {data}=await sb.from('profiles').select('id,full_name,tab_no,team,phone,role,position').eq('status','approved').order('full_name');
  S.dg.people=data||[];
}
function keepScroll(fn){const st=app.scrollTop;return Promise.resolve(fn()).then(()=>{app.scrollTop=st})}
function downloadCSV(name,rows){
  const q=v=>{v=String(v??'').replace(/"/g,'""');return /[;"\n]/.test(v)?'"'+v+'"':v};
  const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
// универсальная загрузка файла в бакет + таблицу вложений
async function fileUpload(bucket,table,fk,id,file,maxMb=10){
  const f=await dgxShrink(file);
  if(f.size>maxMb*1024*1024)return 'Файл «'+file.name+'» больше '+maxMb+' МБ';
  const ext=((f.name.match(/\.(\w{1,5})$/)||[])[1]||'bin').toLowerCase();
  const path=`${id}/${crypto.randomUUID()}.${ext}`;
  const up=await sb.storage.from(bucket).upload(path,f,{contentType:f.type||'application/octet-stream'});
  if(up.error)return 'Не загрузилось: '+up.error.message;
  const r=await sb.from(table).insert({[fk]:id,path,name:file.name,mime:f.type,size:f.size});
  return r.error?'Не сохранилось: '+r.error.message:null;
}

// ================= СМЕНА =================
S.sh={day:null,kind:'open'};
async function shiftView(){
  S.offline=0;
  await ensurePeople();
  const today=iso(new Date()),day=S.sh.day||today;S.sh.day=day;
  const [L,C,N]=await Promise.all([cq('shl',()=>sb.from('shift_lists').select('*').eq('active',true).order('sort')),cq('shc'+day,()=>sb.from('shift_checks').select('*').eq('day',day)),cq('shn'+day,()=>sb.from('shift_notes').select('*').eq('day',day).order('created_at'))]);
  const notes=N.error?[]:(N.data||[]);
  const mgr=isManager(),all=(L.data||[]).filter(l=>l.kind===S.sh.kind),checks=C.data||[];
  const doneOf=l=>l.items.filter(it=>checks.some(c=>c.list_id===l.id&&c.item===it));
  const isFull=l=>l.items.length>0&&doneOf(l).length===l.items.length;
  const complete=all.filter(isFull).length,can=day===today||mgr;
  let h=head('Смена','Чек-листы открытия и закрытия зон');
  h+=`<div class="two"><button class="btn ghost" id="sh_p" style="flex:none;width:56px">←</button><button class="btn ghost" id="sh_t" style="flex:1">${day===today?'Сегодня · ':''}${dayLabel(day)}</button><button class="btn ghost" id="sh_n" style="flex:none;width:56px">→</button></div>`;
  h+=`<div class="seg"><button data-k="open" class="${S.sh.kind==='open'?'on':''}">🌅 Открытие</button><button data-k="close" class="${S.sh.kind==='close'?'on':''}">🌙 Закрытие</button></div>`;
  h+=`<div class="stat"><div style="background:var(--sage)"><b>${complete} из ${all.length}</b>${S.sh.kind==='open'?'зон открыто':'зон закрыто'}</div><div style="background:var(--gold)"><b>${all.reduce((a,l)=>a+doneOf(l).length,0)} из ${all.reduce((a,l)=>a+l.items.length,0)}</b>пунктов отмечено</div></div>`;
  if(!can)h+='<div class="muted">Прошлые дни можно только смотреть.</div>';
  h+=all.map(l=>{
    const dn=doneOf(l),full=isFull(l),c=ZC[l.zone]||'#D3BFD0';
    const last=full?checks.filter(x=>x.list_id===l.id).sort((a,b)=>a.at<b.at?1:-1)[0]:null,nl=notes.filter(n=>n.list_id===l.id);
    return `<details class="card shl" ${full?'':'open'}><summary class="zh" style="background:${c}"><span>${esc(l.zone||l.title)}</span><span class="pill" style="background:${full?'#C9D4B0':'#FFFDF9'};align-self:center">${nl.length?'💬'+nl.length+' · ':''}${full?'✅ '+hm(last.at)+' · '+esc(shortName(pname(last.user_id))):dn.length+' / '+l.items.length}</span></summary>
      <div class="zb">${l.items.map(it=>{const ck=checks.find(x=>x.list_id===l.id&&x.item===it);
        return `<label class="shi"><input type="checkbox" data-l="${l.id}" data-i="${esc(it)}" ${ck?'checked':''} ${can?'':'disabled'}><span style="${ck?'text-decoration:line-through;color:var(--muted)':''}">${esc(it)}${ck?`<br><small class="who">✔ ${esc(pname(ck.user_id))} · ${hm(ck.at)}</small>`:''}${notes.some(n=>n.list_id===l.id&&n.item===it)?` <small class="who" style="background:#F5E2A8">💬 ${notes.filter(n=>n.list_id===l.id&&n.item===it).length}</small>`:''}</span></label>`}).join('')||'<div class="muted">Пунктов нет</div>'}
      <div class="shn"><b>💬 Комментарии${nl.length?' · '+nl.length:''}</b>${nl.map(n=>`<div class="shc"><div><b>${esc(shortName(pname(n.user_id)))}</b> <span class="muted">${hm(n.created_at)}${n.item?' · к пункту «'+esc(n.item)+'»':''}</span>${n.user_id===S.me.id||mgr?` <button class="x" data-nd="${n.id}" aria-label="Удалить">✕</button>`:''}</div><div>${esc(n.body)}</div></div>`).join('')}
        ${can?`<div class="shnf"><select data-nl="${l.id}"><option value="">Ко всему списку</option>${l.items.map(it=>`<option value="${esc(it)}">${esc(it.length>46?it.slice(0,46)+'…':it)}</option>`).join('')}</select><textarea data-nt="${l.id}" placeholder="Например: закончились журналы, нужны новые"></textarea><button class="btn" data-ns="${l.id}" style="min-height:42px">Отправить</button></div>`:''}</div></div></details>`}).join('')||'<div class="card pad muted">Списков пока нет.</div>';
  if(mgr)h+='<button class="btn ghost" id="sh_ed">✏️ Править чек-листы</button>';
  app.innerHTML=h;
  const go2=d=>{const x=new Date(day+'T12:00:00');x.setDate(x.getDate()+d);S.sh.day=iso(x);shiftView()};
  $('#sh_p').onclick=()=>go2(-1);$('#sh_n').onclick=()=>go2(1);$('#sh_t').onclick=()=>{S.sh.day=today;shiftView()};
  app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{S.sh.kind=b.dataset.k;shiftView()});
  $('#sh_ed')?.addEventListener('click',shiftEditor);
  app.querySelectorAll('.shi input').forEach(b=>b.onchange=async()=>{
    const list_id=+b.dataset.l,item=b.dataset.i;b.disabled=true;
    const r=b.checked?await sb.from('shift_checks').insert({list_id,day,item}):await sb.from('shift_checks').delete().eq('list_id',list_id).eq('day',day).eq('item',item);
    if(r.error&&r.error.code!=='23505')alert(r.error.message);
    keepScroll(shiftView);
  });
  app.querySelectorAll('[data-ns]').forEach(b=>b.onclick=async()=>{
    const id=+b.dataset.ns,t=app.querySelector(`[data-nt="${id}"]`),body=t.value.trim();if(!body)return t.focus();
    const item=app.querySelector(`[data-nl="${id}"]`).value||null;b.disabled=true;
    const r=await sb.from('shift_notes').insert({list_id:id,day,item,body});
    if(r.error){alert(r.error.message);b.disabled=false;return}
    keepScroll(shiftView);
  });
  app.querySelectorAll('[data-nd]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить комментарий?'))return;const r=await sb.from('shift_notes').delete().eq('id',b.dataset.nd);if(r.error)alert(r.error.message);keepScroll(shiftView)});
  clearInterval(S.sh.timer);S.sh.timer=setInterval(()=>{if(S.tab!=='shift'){clearInterval(S.sh.timer);return}if(!document.querySelector('.ov')&&!document.hidden&&!(document.activeElement&&document.activeElement.tagName==='TEXTAREA')&&![...app.querySelectorAll('textarea[data-nt]')].some(t=>t.value))keepScroll(shiftView)},30000);
}
function shiftEditor(){
  let edit=null;
  dgxSheet('✏️ Чек-листы',async(box,paint)=>{
    if(!edit){
      const r=await sb.from('shift_lists').select('*').order('sort');const list=r.data||[];
      box.innerHTML=`<div class="muted">Здесь можно править пункты, добавлять зоны и отключать списки. Шаблоны созданы для примера — поправь под ваши регламенты.</div>
      ${list.map(l=>`<div class="otr"><span><b>${esc(l.title)}</b><br><span class="muted">${l.kind==='open'?'Открытие':'Закрытие'} · пунктов: ${l.items.length}${l.active?'':' · выключен'}</span></span><button class="btn ghost" data-e="${l.id}" style="min-height:38px;padding:0 14px">Изменить</button></div>`).join('')}
      <button class="btn" id="sl_new">+ Новый список</button>`;
      box.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{edit={...list.find(x=>x.id==b.dataset.e)};paint()});
      box.querySelector('#sl_new').onclick=()=>{edit={id:null,title:'',kind:'open',zone:DGX_ZONES[0],items:[],sort:(list.reduce((m,x)=>Math.max(m,x.sort),0))+1,active:true};paint()};
      return;
    }
    const x=edit;
    box.innerHTML=`<label>Название<input id="e_t" value="${esc(x.title)}" placeholder="Например: Гольф · открытие"></label>
    <div class="two"><label>Когда<select id="e_k"><option value="open" ${x.kind==='open'?'selected':''}>Открытие</option><option value="close" ${x.kind==='close'?'selected':''}>Закрытие</option></select></label>
    <label>Зона<select id="e_z">${DGX_ZONES.map(z=>`<option ${z===x.zone?'selected':''}>${esc(z)}</option>`).join('')}</select></label></div>
    <label>Пункты (каждый с новой строки)<textarea id="e_i" style="min-height:160px">${esc(x.items.join('\n'))}</textarea></label>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="e_a" ${x.active?'checked':''} style="width:24px;min-height:24px"> Список включён</label>
    <button class="btn" id="e_sv">Сохранить</button><button class="btn ghost" id="e_cn">Назад</button>${x.id?'<button class="btn ghost" id="e_dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить список</button>':''}<div class="err" id="e_er"></div>`;
    box.querySelector('#e_cn').onclick=()=>{edit=null;paint()};
    box.querySelector('#e_sv').onclick=async()=>{
      const row={title:box.querySelector('#e_t').value.trim(),kind:box.querySelector('#e_k').value,zone:box.querySelector('#e_z').value,items:box.querySelector('#e_i').value.split('\n').map(s=>s.trim()).filter(Boolean),active:box.querySelector('#e_a').checked,sort:x.sort};
      if(!row.title)return box.querySelector('#e_er').textContent='Введи название';
      const r=x.id?await sb.from('shift_lists').update(row).eq('id',x.id):await sb.from('shift_lists').insert(row);
      if(r.error)return box.querySelector('#e_er').textContent=r.error.message;edit=null;paint()};
    box.querySelector('#e_dl')?.addEventListener('click',async()=>{if(!confirm('Удалить список вместе с историей отметок?'))return;await sb.from('shift_lists').delete().eq('id',x.id);edit=null;paint()});
  },()=>{if(S.tab==='shift')shiftView()});
}

// ================= ПРОИСШЕСТВИЯ =================
const INC_K={injury:['🩹','Травма'],breakdown:['🛠','Поломка'],conflict:['🗣','Конфликт'],loss:['🔍','Потеря'],other:['📝','Другое']};
const INC_S={low:['Лёгкое','#B7CFC4'],mid:['Среднее','#F3C29B'],high:['Серьёзное','#E08A7A']};
const INC_ST={new:['Новое','#E8B4B8'],review:['В разборе','#E6CC8F'],closed:['Закрыто','#C9D4B0']};
S.inc={f:'all'};
async function incView(){
  await ensurePeople();
  const r=await sb.from('incidents').select('*').order('created_at',{ascending:false}).limit(300);
  const mgr=isManager(),all=r.data||[],list=all.filter(x=>S.inc.f==='all'||x.status===S.inc.f);
  let h=head('Происшествия',mgr?'Журнал происшествий парка':'Твои сообщения о происшествиях')+subBar('ap','inc');
  h+=`<button class="btn" id="inc_new">➕ Сообщить о происшествии</button>`;
  if(mgr){
    const cnt=s=>all.filter(x=>x.status===s).length;
    h+=`<div class="tabs">${[['all','Все',all.length],['new','Новые',cnt('new')],['review','В разборе',cnt('review')],['closed','Закрытые',cnt('closed')]].map(([k,n,c])=>`<button data-f="${k}" class="${S.inc.f===k?'on':''}" style="background:var(--tab)">${n} · ${c}</button>`).join('')}<button id="inc_csv" style="background:var(--tab)">⬇️ Excel</button></div>`;
  }
  h+=list.map(x=>`<div class="card pad col" data-inc="${x.id}" style="cursor:pointer;border-left:8px solid ${INC_S[x.severity][1]}">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${INC_K[x.kind][0]} ${esc(x.zone||'—')}</b><span class="pill" style="background:${INC_ST[x.status][1]}">${INC_ST[x.status][0]}</span></div>
    <div style="font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(x.descr)}</div>
    <div class="muted">${dayLabel(x.day)}${x.at_time?' · '+esc(x.at_time):''} · ${INC_K[x.kind][1]} · ${INC_S[x.severity][0]}${mgr?' · '+esc(shortName(pname(x.reported_by))):''}</div></div>`).join('')||'<div class="card pad muted">Пока записей нет.</div>';
  app.innerHTML=h;
  $('#inc_new').onclick=incForm;
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.inc.f=b.dataset.f;incView()});
  app.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>incOpen(all.find(x=>x.id===b.dataset.inc)));
  $('#inc_csv')?.addEventListener('click',()=>downloadCSV('proisshestviya_'+iso(new Date())+'.csv',[['Дата','Время','Зона','Вид','Серьёзность','Что произошло','Что сделано','Кто пострадал / свидетели','Сообщил(а)','Статус','Решение']].concat(all.map(x=>[x.day,x.at_time||'',x.zone||'',INC_K[x.kind][1],INC_S[x.severity][0],x.descr,x.actions||'',x.people||'',pname(x.reported_by),INC_ST[x.status][0],x.resolution||'']))));
}
function incForm(){
  let files=[];const now=new Date(),t0=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  dgxSheet('🚨 Сообщить о происшествии',(box,paint,close)=>{
    box.innerHTML=`<div class="muted">Опиши коротко и по делу. Руководители получат уведомление сразу. При травме сначала окажи помощь и вызови врача.</div>
    <div class="two"><label>Зона<select id="n_z">${DGX_ZONES.map(z=>`<option>${esc(z)}</option>`).join('')}</select></label><label>Время<input id="n_t" type="time" value="${t0}"></label></div>
    <div class="two"><label>Что за случай<select id="n_k">${Object.entries(INC_K).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select></label><label>Насколько серьёзно<select id="n_s">${Object.entries(INC_S).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></label></div>
    <label>Что произошло<textarea id="n_d"></textarea></label>
    <label>Что сделано<textarea id="n_a" placeholder="Помощь оказана, вызван врач, зона огорожена…"></textarea></label>
    <label>Кто пострадал / свидетели<input id="n_p" placeholder="Имена, возраст гостя, контакты"></label>
    <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer;flex-direction:row">📷 Прикрепить фото<input id="n_f" type="file" multiple accept="image/*" hidden></label><div class="muted" id="n_fl"></div>
    <button class="btn" id="n_go">Отправить</button><div class="err" id="n_er"></div>`;
    box.querySelector('#n_f').onchange=e=>{files=[...e.target.files];box.querySelector('#n_fl').textContent='Выбрано файлов: '+files.length};
    box.querySelector('#n_go').onclick=async e=>{
      const d=box.querySelector('#n_d').value.trim(),er=box.querySelector('#n_er');if(!d)return er.textContent='Опиши, что произошло';
      e.target.disabled=true;er.style.color='var(--muted)';er.textContent='Отправляю…';
      const r=await sb.from('incidents').insert({zone:box.querySelector('#n_z').value,at_time:box.querySelector('#n_t').value||null,kind:box.querySelector('#n_k').value,severity:box.querySelector('#n_s').value,descr:d,actions:box.querySelector('#n_a').value.trim()||null,people:box.querySelector('#n_p').value.trim()||null}).select().single();
      if(r.error){e.target.disabled=false;er.style.color='';return er.textContent='Не получилось: '+r.error.message}
      for(const f of files)await fileUpload('inc','inc_files','inc_id',r.data.id,f);
      close(false);alert('Записано, руководители уведомлены ✅');incView();
    };
  },()=>{if(onTab('inc'))incView()});
}
function incOpen(x){
  const mgr=isManager();let st=x.status;
  dgxSheet(INC_K[x.kind][0]+' '+esc(x.zone||'Происшествие'),async(box,paint)=>{
    const f=await sb.from('inc_files').select('*').eq('inc_id',x.id).order('created_at');const files=f.data||[];
    const urls=await Promise.all(files.map(y=>dgxUrl(y.path,'inc')));
    box.innerHTML=`<div class="muted">${dayLabel(x.day)}${x.at_time?' · '+esc(x.at_time):''} · ${INC_K[x.kind][1]} · <span class="pill" style="background:${INC_S[x.severity][1]}">${INC_S[x.severity][0]}</span> · сообщил(а): ${esc(pname(x.reported_by))}</div>
    <div><b style="font-size:14px">Что произошло</b><div style="white-space:pre-wrap;margin-top:4px">${esc(x.descr)}</div></div>
    ${x.actions?`<div><b style="font-size:14px">Что сделано</b><div style="white-space:pre-wrap;margin-top:4px">${esc(x.actions)}</div></div>`:''}
    ${x.people?`<div><b style="font-size:14px">Кто пострадал / свидетели</b><div style="margin-top:4px">${esc(x.people)}</div></div>`:''}
    ${files.length?`<div class="fgrid">${files.map((y,i)=>`<div class="fi">${/^image\//.test(y.mime||'')&&urls[i]?`<a href="${urls[i]}" target="_blank" rel="noopener"><img src="${urls[i]}" loading="lazy" alt=""></a>`:`<a href="${urls[i]||'#'}" target="_blank" rel="noopener">📎<br>${esc((y.name||'файл').slice(-22))}</a>`}</div>`).join('')}</div>`:''}
    ${mgr?`<label>Статус<select id="i_st">${Object.entries(INC_ST).map(([k,v])=>`<option value="${k}" ${k===st?'selected':''}>${v[0]}</option>`).join('')}</select></label>
      <label>Решение / комментарий руководителя<textarea id="i_rs">${esc(x.resolution||'')}</textarea></label>
      <button class="btn" id="i_sv">Сохранить</button><button class="btn ghost" id="i_dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить запись</button><div class="err" id="i_er"></div>`
      :`<div><b style="font-size:14px">Статус:</b> <span class="pill" style="background:${INC_ST[x.status][1]}">${INC_ST[x.status][0]}</span>${x.resolution?`<div style="margin-top:6px;white-space:pre-wrap">${esc(x.resolution)}</div>`:''}</div>`}`;
    box.querySelector('#i_sv')?.addEventListener('click',async()=>{const r=await sb.from('incidents').update({status:box.querySelector('#i_st').value,resolution:box.querySelector('#i_rs').value.trim()||null}).eq('id',x.id);if(r.error)return box.querySelector('#i_er').textContent=r.error.message;S.inc.f=S.inc.f;document.querySelector('.ov #bk').click()});
    box.querySelector('#i_dl')?.addEventListener('click',async()=>{if(!confirm('Удалить запись о происшествии насовсем?'))return;if(files.length)await sb.storage.from('inc').remove(files.map(y=>y.path));await sb.from('incidents').delete().eq('id',x.id);document.querySelector('.ov #bk').click()});
  },()=>{if(onTab('inc'))incView()});
}

VIEWS.shift=shiftView;VIEWS.inc=incView;
