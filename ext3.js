// Поломки: сотрудник присылает описание + фото/видео, руководитель ведёт статус
const FIX_ST={new:['Новая','#E8B4B8'],work:['Принято в работу','#E6CC8F'],clarify:['Нужно уточнение','#F3C29B'],done:['Выполнено','#C9D4B0'],rejected:['Отклонено','#E8DCCB']};
S.fix={f:'all'};
const fixSize=b=>b>=1048576?(b/1048576).toFixed(1).replace('.',',')+' МБ':Math.max(1,Math.round(b/1024))+' КБ';
async function fixView(){
  await ensurePeople();
  const [r,fl]=await Promise.all([sb.from('repairs').select('*').order('created_at',{ascending:false}).limit(300),sb.from('repair_files').select('repair_id,mime')]);
  const mgr=isManager(),all=r.data||[],list=all.filter(x=>S.fix.f==='all'||x.status===S.fix.f);
  const nf={};(fl.data||[]).forEach(x=>{const o=nf[x.repair_id]||(nf[x.repair_id]={p:0,v:0});/^video\//.test(x.mime||'')?o.v++:o.p++});
  let h=head('Поломки',mgr?'Что сломалось в парке — от сотрудников':'Сообщи, если что-то сломалось')+subBar('ap','fix');
  h+=`<button class="btn" id="fx_new">🛠 Сообщить о поломке</button>`;
  if(mgr){const c=s=>all.filter(x=>x.status===s).length;
    h+=`<div class="tabs">${[['all','Все',all.length],['new','Новые',c('new')],['work','В работе',c('work')],['clarify','Уточнение',c('clarify')],['done','Выполнены',c('done')],['rejected','Отклонены',c('rejected')]].map(([k,n,v])=>`<button data-f="${k}" class="${S.fix.f===k?'on':''}" style="background:var(--tab)">${n} · ${v}</button>`).join('')}</div>`}
  h+=list.map(x=>{const f=nf[x.id];return `<div class="card pad col" data-fx="${x.id}" style="cursor:pointer;border-left:8px solid ${x.urgent?'#E08A7A':FIX_ST[x.status][1]}">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${x.urgent?'🚨 ':'🛠 '}${esc(x.zone||'—')}</b><span class="pill" style="background:${FIX_ST[x.status][1]}">${FIX_ST[x.status][0]}</span></div>${apSeenPill('fix',x)}
    <div style="font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(x.descr)}</div>
    <div class="muted">${dayLabel(iso(new Date(x.created_at)))}${f?` · ${f.p?'📷 '+f.p:''}${f.p&&f.v?' ':''}${f.v?'🎬 '+f.v:''}`:''}${mgr?' · '+esc(shortName(pname(x.reported_by))):''}</div></div>`}).join('')||'<div class="card pad muted">Пока заявок нет.</div>';
  app.innerHTML=h;
  $('#fx_new').onclick=fixForm;
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.fix.f=b.dataset.f;fixView()});
  app.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>fixOpen(all.find(x=>x.id===b.dataset.fx)));
  apWatch('fix',list,'[data-fx]','data-fx');
}
function fixForm(){
  let files=[];
  dgxSheet('🛠 Сообщить о поломке',(box,paint,close)=>{
    const show=()=>{box.querySelector('#f_fl').innerHTML=files.map((f,i)=>`<div class="otr"><span>${/^video\//.test(f.type)?'🎬':'📷'} ${esc(f.name.slice(-28))} <span class="muted">${fixSize(f.size)}</span></span><button class="btn ghost" data-rm="${i}" style="min-height:34px;padding:0 12px">✕</button></div>`).join('');
      box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{files.splice(+b.dataset.rm,1);show()})};
    box.innerHTML=`<div class="muted">Опиши, что сломалось и где, и приложи фото или видео — так руководителю проще понять и быстрее починить.</div>
    <label>Где<select id="f_z">${DGX_ZONES.map(z=>`<option>${esc(z)}</option>`).join('')}</select></label>
    <label>Что сломалось<textarea id="f_d" placeholder="Например: не работает замок на калитке, гость может пройти без билета"></textarea></label>
    <label style="display:flex;gap:10px;align-items:center;flex-direction:row"><input type="checkbox" id="f_u" style="width:24px;min-height:24px;flex:none"><span>🚨 Срочно: опасно для гостей или мешает работать</span></label>
    <div class="two"><label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer;flex-direction:row">📷 Фото<input id="f_p" type="file" multiple accept="image/*" hidden></label>
    <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer;flex-direction:row">🎬 Видео<input id="f_v" type="file" multiple accept="video/*" hidden></label></div>
    <div id="f_fl" class="col"></div><div class="muted">Видео — до 50 МБ (примерно минута). Можно снять сразу или выбрать из галереи.</div>
    <button class="btn" id="f_go">Отправить</button><div class="err" id="f_er"></div>`;
    const add=e=>{files.push(...[...e.target.files]);e.target.value='';show()};
    box.querySelector('#f_p').onchange=add;box.querySelector('#f_v').onchange=add;
    box.querySelector('#f_go').onclick=async e=>{
      const d=box.querySelector('#f_d').value.trim(),er=box.querySelector('#f_er');if(!d)return er.textContent='Опиши, что сломалось';
      const big=files.find(f=>f.size>50*1024*1024);if(big)return er.textContent='«'+big.name+'» больше 50 МБ — убери его или сними видео покороче';
      e.target.disabled=true;er.style.color='var(--muted)';er.textContent='Отправляю…';
      const r=await sb.from('repairs').insert({zone:box.querySelector('#f_z').value,descr:d,urgent:box.querySelector('#f_u').checked}).select().single();
      if(r.error){e.target.disabled=false;er.style.color='';return er.textContent='Не получилось: '+r.error.message}
      const bad=[];
      for(let i=0;i<files.length;i++){er.textContent=`Загружаю файл ${i+1} из ${files.length}…`;const m=await fileUpload('repairs','repair_files','repair_id',r.data.id,files[i],50);if(m)bad.push(m)}
      close(false);
      alert(bad.length?'Заявка отправлена, но не всё загрузилось:\n'+bad.join('\n'):'Отправлено, руководители уведомлены ✅');fixView();
    };
  },()=>{if(onTab('fix'))fixView()});
}
function fixOpen(x){
  const mgr=isManager();
  dgxSheet((x.urgent?'🚨 ':'🛠 ')+esc(x.zone||'Поломка'),async(box)=>{
    const f=await sb.from('repair_files').select('*').eq('repair_id',x.id).order('created_at');const files=f.data||[];
    const urls=await Promise.all(files.map(y=>dgxUrl(y.path,'repairs')));
    const media=files.map((y,i)=>{const u=urls[i];if(!u)return dgxMiss(y);
      if(/^video\//.test(y.mime||''))return `<video src="${u}" controls playsinline preload="metadata" style="width:100%;border-radius:14px;background:#000;max-height:60vh"></video>`;
      if(/^image\//.test(y.mime||''))return `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" loading="lazy" alt="" style="width:100%;border-radius:14px;display:block"></a>`;
      return `<a href="${u}" target="_blank" rel="noopener">📎 ${esc(y.name||'файл')}</a>`}).join('');
    box.innerHTML=`<div class="muted">${dayLabel(iso(new Date(x.created_at)))} · ${new Date(x.created_at).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})} · сообщил(а): ${esc(pname(x.reported_by))} · <span class="pill" style="background:${FIX_ST[x.status][1]}">${FIX_ST[x.status][0]}</span>${x.urgent?' · <b>🚨 срочно</b>':''}</div>
    <div style="white-space:pre-wrap">${esc(x.descr)}</div>
    ${media?`<div class="col" style="gap:10px">${media}</div>`:'<div class="muted">Без фото и видео</div>'}
    ${mgr?`<label>Статус<select id="x_st">${apStOpts(FIX_ST,x.status,[])}</select></label>
      <label>Комментарий (увидит сотрудник)<textarea id="x_rs">${esc(x.resolution||'')}</textarea></label>
      <button class="btn" id="x_sv">Сохранить</button><button class="btn ghost" id="x_dl" style="color:#9b2c2c;border-color:#9b2c2c">Удалить заявку</button><div class="err" id="x_er"></div>`
      :(x.resolution?`<div><b style="font-size:14px">Ответ руководителя</b><div style="margin-top:4px;white-space:pre-wrap">${esc(x.resolution)}</div></div>`:'')}`;
    box.insertAdjacentHTML('beforeend','<div class="col" id="thr"></div>');apThread(box.querySelector('#thr'),'fix',x.id);apMark('fix',x);
    box.querySelector('#x_sv')?.addEventListener('click',async()=>{const r=await sb.from('repairs').update({status:box.querySelector('#x_st').value,resolution:box.querySelector('#x_rs').value.trim()||null}).eq('id',x.id);if(r.error)return box.querySelector('#x_er').textContent=r.error.message;document.querySelector('.ov #bk').click()});
    box.querySelector('#x_dl')?.addEventListener('click',async()=>{if(!confirm('Удалить заявку вместе с фото и видео?'))return;if(files.length)await sb.storage.from('repairs').remove(files.map(y=>y.path));await sb.from('repairs').delete().eq('id',x.id);document.querySelector('.ov #bk').click()});
  },()=>{if(onTab('fix'))fixView()});
}
VIEWS.fix=fixView;

// ================= ОБРАТНАЯ СВЯЗЬ (идеи и «что-то сломалось» по самому приложению) =================
// Пишут все, читает и отвечает отметкой только админ; сотрудник видит свои сообщения и «прочитано».
const FB_K={idea:['💡','Предложить идею'],bug:['🛠','Что-то сломалось']},FB_ST={new:['Отправлено','#EEE6D8'],read:['Прочитано','#E6CC8F'],done:['Учтено / сделано','#C9D4B0']};
function fbForm(kind){
  let k=kind||'idea';
  dgxSheet('Обратная связь',(box,paint,close)=>{
    box.innerHTML=`<div class="seg">${Object.entries(FB_K).map(([x,v])=>`<button data-k="${x}" class="${k===x?'on':''}">${v[0]} ${v[1]}</button>`).join('')}</div>
    <label>${k==='idea'?'Что добавить или улучшить в приложении?':'Что сломалось или работает не так?'}<textarea id="fb_t" placeholder="${k==='idea'?'Например: хочу видеть погоду на главной':'Например: не открывается график на телефоне'}" style="min-height:120px"></textarea></label>
    <div class="muted">Это сообщение прочитает администратор приложения.</div><button class="btn" id="fb_go">Отправить</button><div class="err" id="fb_er"></div>`;
    box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{k=b.dataset.k;paint()});
    box.querySelector('#fb_go').onclick=async e=>{const t=box.querySelector('#fb_t').value.trim();if(!t)return box.querySelector('#fb_er').textContent='Напиши пару слов';
      e.target.disabled=true;const r=await sb.from('feedback').insert({kind:k,body:t});
      if(r.error){e.target.disabled=false;return box.querySelector('#fb_er').textContent='Не получилось: '+r.error.message}
      close(false);alert('Спасибо! Сообщение отправлено ✅');if(S.tab==='feedback')fbView()};
  });
}
S.fb={f:'new'};
async function fbView(){
  await ensurePeople();
  const adm=isAdmin(),r=await sb.from('feedback').select('*').order('created_at',{ascending:false}).limit(300);
  const all=r.data||[],list=adm?all.filter(x=>S.fb.f==='all'||(S.fb.f==='new'?x.status!=='done':x.status===S.fb.f)):all.filter(x=>x.user_id===S.me.id);
  let h=head('Обратная связь',adm?'Идеи и сообщения о неполадках от сотрудников':'Предложи идею или сообщи, что что-то не работает');
  h+=`<div class="two"><button class="btn" id="fb_i">💡 Предложить идею</button><button class="btn" id="fb_b">🛠 Что-то сломалось</button></div>`;
  if(adm)h+=`<div class="tabs">${[['new','Открытые',all.filter(x=>x.status!=='done').length],['done','Сделано',all.filter(x=>x.status==='done').length],['all','Все',all.length]].map(([k,n,c])=>`<button data-f="${k}" class="${S.fb.f===k?'on':''}" style="background:var(--tab)">${n} · ${c}</button>`).join('')}</div>`;
  h+=list.map(x=>`<div class="card pad col" style="border-left:8px solid ${FB_ST[x.status][1]}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${FB_K[x.kind][0]} ${FB_K[x.kind][1]}${adm?' · '+esc(pname(x.user_id)):''}</b><span class="pill" style="background:${FB_ST[x.status][1]}">${FB_ST[x.status][0]}${x.status==='read'&&x.read_at?' '+hm(x.read_at):''}</span></div>
    <div style="white-space:pre-wrap">${esc(x.body)}</div><div class="muted">${dayLabel(iso(new Date(x.created_at)))} · ${hm(x.created_at)}</div>
    ${adm?`<div class="two">${x.status!=='done'?`<button class="btn" data-d="${x.id}">✅ Сделано</button>`:`<button class="btn ghost" data-u="${x.id}">↩️ Вернуть</button>`}<button class="btn ghost" data-x="${x.id}" style="color:#9b2c2c;border-color:#9b2c2c">Удалить</button></div>`:''}</div>`).join('')||`<div class="card pad muted">${adm?'Пока сообщений нет.':'Ты пока ничего не отправлял(а).'}</div>`;
  app.innerHTML=h;
  $('#fb_i').onclick=()=>fbForm('idea');$('#fb_b').onclick=()=>fbForm('bug');
  app.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.fb.f=b.dataset.f;fbView()});
  const upd=async(id,p)=>{const r=await sb.from('feedback').update(p).eq('id',id);if(r.error)alert(r.error.message);fbView()};
  app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>upd(b.dataset.d,{status:'done',read_at:new Date().toISOString()}));
  app.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>upd(b.dataset.u,{status:'read'}));
  app.querySelectorAll('[data-x]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить сообщение?'))return;const r=await sb.from('feedback').delete().eq('id',b.dataset.x);if(r.error)alert(r.error.message);fbView()});
  // админ открыл раздел: новые сообщения отмечаются прочитанными
  if(adm){const fresh=all.filter(x=>x.status==='new').map(x=>x.id);if(fresh.length)sb.from('feedback').update({status:'read',read_at:new Date().toISOString()}).in('id',fresh).then(()=>{})}
}
VIEWS.feedback=fbView;
