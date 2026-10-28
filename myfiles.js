// База знаний → «Моё»: личные файлы, папки и адресный доступ для коллег.
S.my={q:'',folder:'all',sort:'new',box:'own',error:''};
const mySize=n=>{n=+n||0;if(n<1024)return n+' Б';if(n<1048576)return (n/1024).toFixed(n<10240?1:0)+' КБ';if(n<1073741824)return (n/1048576).toFixed(n<10485760?1:0)+' МБ';return (n/1073741824).toFixed(1)+' ГБ'};
const myIcon=(name,mime)=>{if(/^image\//.test(mime||''))return'🖼️';if(/^video\//.test(mime||''))return'🎬';if(/^audio\//.test(mime||''))return'🎵';const e=(String(name).split('.').pop()||'').toLowerCase();return e==='pdf'?'📕':['doc','docx','txt','rtf'].includes(e)?'📝':['xls','xlsx','csv'].includes(e)?'📊':['ppt','pptx'].includes(e)?'📽️':['zip','rar','7z'].includes(e)?'🗜️':'📎'};
const myFolder=id=>id&&id!=='all'&&id!=='none'?id:null;
async function myFilesView(){
  await ensurePeople();
  const own=S.my.box==='own',fq=sb.from('my_files').select('*').order('created_at',{ascending:false});
  const [fr,fo,sh]=await Promise.all([
    own?fq.eq('owner',S.me.id):fq.neq('owner',S.me.id),
    own?sb.from('my_folders').select('*').order('name'):Promise.resolve({data:[]}),
    own?sb.from('my_shares').select('file_id,to_user'):Promise.resolve({data:[]})
  ]);
  if(fr.error||fo.error||sh.error){
    const e=fr.error||fo.error||sh.error,missing=['PGRST205','42P01'].includes(e.code);
    app.innerHTML=head('База знаний','Личные документы и файлы')+kbSectionTabs()+`<div class="card pad muted">${missing?'Раздел «Моё» пока не подключён. Нужно применить обновление базы.':'Не удалось открыть личные файлы: '+esc(e.message)}</div>`;
    return kbSectionBind();
  }
  const files=fr.data||[],folders=fo.data||[],shares=sh.data||[];
  if(S.my.folder!=='all'&&S.my.folder!=='none'&&!folders.some(f=>f.id===S.my.folder))S.my.folder='all';
  const folderName=id=>folders.find(f=>f.id===id)?.name||'Без папки';
  const visible=()=>{
    const q=S.my.q.trim().toLowerCase();
    const list=files.filter(f=>(!own||S.my.folder==='all'||(S.my.folder==='none'?!f.folder_id:f.folder_id===S.my.folder))&&(!q||(f.name+' '+(f.mime||'')+' '+folderName(f.folder_id)+' '+pname(f.owner)).toLowerCase().includes(q)));
    return list.sort((a,b)=>S.my.sort==='name'?a.name.localeCompare(b.name,'ru'):S.my.sort==='size'?(b.size-a.size):S.my.sort==='old'?(a.created_at<b.created_at?-1:1):(a.created_at>b.created_at?-1:1));
  };
  const card=f=>{
    const ownFile=f.owner===S.me.id,sn=shares.filter(s=>s.file_id===f.id).length;
    return `<div class="card pad col" data-my-open="${f.id}" style="cursor:pointer"><div class="myrow"><span class="mi">${myIcon(f.name,f.mime)}</span><span class="mt"><b>${esc(f.name)}</b><span class="muted">${mySize(f.size)} · ${dayLabel(iso(new Date(f.created_at)))}${ownFile?' · '+esc(folderName(f.folder_id)):' · От: '+esc(pname(f.owner))}</span></span>${sn?`<span class="pill" style="background:var(--tab)">📤 ${sn}</span>`:''}</div></div>`;
  };
  const listHtml=()=>visible().map(card).join('')||`<div class="card pad muted">${S.my.q?'Ничего не найдено.':own?'Здесь появятся твои документы. Загрузи первый файл.':'Коллеги ещё не отправляли тебе файлы.'}</div>`;
  const bindFiles=()=>app.querySelectorAll('[data-my-open]').forEach(b=>b.onclick=()=>myFileOpen(files.find(f=>f.id===b.dataset.myOpen),folders));
  const draw=()=>{
    const chips=own?`<div class="tabs"><button data-my-folder="all" class="${S.my.folder==='all'?'on':''}" style="background:var(--tab)">Все · ${files.length}</button><button data-my-folder="none" class="${S.my.folder==='none'?'on':''}" style="background:var(--tab)">Без папки</button>${folders.map(f=>`<button data-my-folder="${f.id}" class="${S.my.folder===f.id?'on':''}" style="background:var(--tab)">📁 ${esc(f.name)} · ${files.filter(x=>x.folder_id===f.id).length}</button>`).join('')}</div>`:'';
    let h=head('База знаний',own?'Твои документы и файлы':'Файлы, которыми поделились коллеги')+kbSectionTabs();
    h+=`<div class="tabs"><button data-mybox="own" class="${own?'on':''}" style="background:var(--tab)">Мои файлы</button><button data-mybox="in" class="${!own?'on':''}" style="background:var(--tab)">Полученные</button></div>`;
    h+=`<input id="my_q" type="search" placeholder="🔍 Поиск по файлам" value="${esc(S.my.q)}"><select id="my_sort"><option value="new" ${S.my.sort==='new'?'selected':''}>Сначала новые</option><option value="old" ${S.my.sort==='old'?'selected':''}>Сначала старые</option><option value="name" ${S.my.sort==='name'?'selected':''}>По имени</option><option value="size" ${S.my.sort==='size'?'selected':''}>По размеру</option></select>`;
    if(own)h+=`<div class="two"><button class="btn" id="my_up">📎 Загрузить</button><button class="btn ghost" id="my_new_folder">📁 Новая папка</button></div><input id="my_input" type="file" multiple hidden>${chips}${myFolder(S.my.folder)?'<button class="btn ghost" id="my_edit_folder">✏️ Название или удаление папки</button>':''}`;
    h+=`<div class="err" id="my_status">${esc(S.my.error||'')}</div><div id="my_list" class="kbl">${listHtml()}</div>`;
    app.innerHTML=h;kbSectionBind();bindFiles();
    app.querySelectorAll('[data-mybox]').forEach(b=>b.onclick=()=>{S.my.box=b.dataset.mybox;S.my.folder='all';S.my.error='';myFilesView()});
    app.querySelectorAll('[data-my-folder]').forEach(b=>b.onclick=()=>{S.my.folder=b.dataset.myFolder;draw()});
    $('#my_q').oninput=e=>{S.my.q=e.target.value;$('#my_list').innerHTML=listHtml();bindFiles()};
    $('#my_sort').onchange=e=>{S.my.sort=e.target.value;$('#my_list').innerHTML=listHtml();bindFiles()};
    $('#my_up')?.addEventListener('click',()=>$('#my_input').click());
    $('#my_input')?.addEventListener('change',e=>myUpload([...e.target.files],S.my.folder));
    $('#my_new_folder')?.addEventListener('click',()=>myFolderEdit());
    $('#my_edit_folder')?.addEventListener('click',()=>myFolderEdit(folders.find(f=>f.id===S.my.folder)));
  };
  draw();
}
async function myUpload(list,folder){
  if(!list.length)return;S.my.error='';const st=$('#my_status');if(st)st.textContent='Подготовка файлов…';
  for(let i=0;i<list.length;i++){
    const f=list[i];if(st)st.textContent=`Загрузка ${i+1} из ${list.length}: ${f.name}`;
    if(f.size>95*1024*1024){S.my.error=`«${f.name}» больше 95 МБ`;break}
    const dv=await driveSend('my',S.me.id,f);
    if(!dv.id){S.my.error=dv.err||'Облачное хранилище сейчас недоступно';break}
    const r=await sb.from('my_files').insert({owner:S.me.id,folder_id:myFolder(folder),path:'drive:'+dv.id,name:f.name||'Файл',mime:f.type||'application/octet-stream',size:f.size});
    if(r.error){S.my.error='Файл загружен, но не сохранён в списке: '+r.error.message;break}
  }
  myFilesView();
}
function myFolderEdit(f){
  dgxSheet(f?'📁 Папка':'📁 Новая папка',(box,paint,close)=>{
    box.innerHTML=`<label>Название<input id="my_fn" maxlength="120" value="${esc(f?.name||'')}" placeholder="Например: Сертификаты"></label><button class="btn" id="my_fs">Сохранить</button>${f?'<button class="btn ghost" id="my_fd" style="color:#9b2c2c;border-color:#9b2c2c">Удалить папку</button>':''}<div class="muted">При удалении папки файлы останутся в разделе «Без папки».</div><div class="err" id="my_fe"></div>`;
    box.querySelector('#my_fs').onclick=async e=>{const name=box.querySelector('#my_fn').value.trim();if(!name)return box.querySelector('#my_fe').textContent='Введи название';e.target.disabled=true;const r=f?await sb.from('my_folders').update({name}).eq('id',f.id):await sb.from('my_folders').insert({owner:S.me.id,name}).select('id').single();if(r.error){e.target.disabled=false;return box.querySelector('#my_fe').textContent=r.error.message}if(!f&&r.data)S.my.folder=r.data.id;close()};
    box.querySelector('#my_fd')?.addEventListener('click',async e=>{if(!confirm('Удалить папку? Файлы останутся.'))return;e.target.disabled=true;const r=await sb.from('my_folders').delete().eq('id',f.id);if(r.error){e.target.disabled=false;return box.querySelector('#my_fe').textContent=r.error.message}S.my.folder='all';close()});
  },()=>{if(S.tab==='kb'&&S.kb.section==='my')myFilesView()});
}
async function myFileOpen(f,folders){
  const own=f.owner===S.me.id;
  dgxSheet(esc(f.name),async(box,paint,close)=>{
    const url=await dgxUrl(f.path,'my'),img=/^image\//.test(f.mime||'');
    box.innerHTML=`${img&&url?`<img class="myprev" src="${esc(url)}" alt="${esc(f.name)}">`:`<div style="font-size:56px;text-align:center">${myIcon(f.name,f.mime)}</div>`}<div><b>${esc(f.name)}</b><div class="muted">${mySize(f.size)} · ${dayLabel(iso(new Date(f.created_at)))}${own?'':' · От: '+esc(pname(f.owner))}</div></div>${url?`<a class="btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="${esc(url)}" target="_blank" rel="noopener">Открыть</a><a class="btn ghost" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="${esc(url)}" download="${esc(f.name)}">Скачать</a>`:'<div class="err">Не удалось получить ссылку на файл.</div>'}${own?'<button class="btn ghost" id="my_file_share">📤 Отправить коллегам</button><button class="btn ghost" id="my_file_edit">✏️ Имя и папка</button><button class="btn ghost" id="my_file_delete" style="color:#9b2c2c;border-color:#9b2c2c">🗑 Удалить</button>':''}<div class="err" id="my_file_err"></div>`;
    box.querySelector('#my_file_share')?.addEventListener('click',()=>{close(false);myShare(f)});
    box.querySelector('#my_file_edit')?.addEventListener('click',()=>{close(false);myFileEdit(f,folders)});
    box.querySelector('#my_file_delete')?.addEventListener('click',async e=>{if(!confirm('Удалить файл у себя и у всех коллег, которым он отправлен?'))return;e.target.disabled=true;const err=await myDelete(f);if(err){e.target.disabled=false;return box.querySelector('#my_file_err').textContent=err}close(false);myFilesView()});
  },()=>{});
}
function myFileEdit(f,folders){
  dgxSheet('✏️ Имя и папка',(box,paint,close)=>{
    box.innerHTML=`<label>Имя файла<input id="my_en" maxlength="255" value="${esc(f.name)}"></label><label>Папка<select id="my_ef"><option value="">Без папки</option>${folders.map(x=>`<option value="${x.id}" ${x.id===f.folder_id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><button class="btn" id="my_es">Сохранить</button><div class="err" id="my_ee"></div>`;
    box.querySelector('#my_es').onclick=async e=>{const name=box.querySelector('#my_en').value.trim();if(!name)return box.querySelector('#my_ee').textContent='Введи имя файла';e.target.disabled=true;const r=await sb.from('my_files').update({name,folder_id:box.querySelector('#my_ef').value||null}).eq('id',f.id);if(r.error){e.target.disabled=false;return box.querySelector('#my_ee').textContent=r.error.message}close()};
  },()=>{if(S.tab==='kb'&&S.kb.section==='my')myFilesView()});
}
function myShare(f){
  dgxSheet('📤 Отправить коллегам',async(box,paint,close)=>{
    await ensurePeople();const r=await sb.from('my_shares').select('to_user').eq('file_id',f.id);
    if(r.error){box.innerHTML='<div class="err">'+esc(r.error.message)+'</div>';return}
    const old=(r.data||[]).map(x=>x.to_user),people=(S.dg.people||[]).filter(p=>p.id!==S.me.id).slice().sort((a,b)=>a.full_name.localeCompare(b.full_name,'ru'));
    box.innerHTML=`<div><b>${esc(f.name)}</b><div class="muted">Выбранные коллеги увидят файл в «Моё → Полученные». Уведомления не отправляются.</div></div><div style="max-height:45vh;overflow:auto">${people.map(p=>`<label class="shi"><input type="checkbox" value="${p.id}" ${old.includes(p.id)?'checked':''}><span>${esc(p.full_name)}</span></label>`).join('')}</div><button class="btn" id="my_ss">Сохранить доступ</button><div class="err" id="my_se"></div>`;
    box.querySelector('#my_ss').onclick=async e=>{e.target.disabled=true;const cur=[...box.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value),del=old.filter(x=>!cur.includes(x)),add=cur.filter(x=>!old.includes(x));if(del.length){const d=await sb.from('my_shares').delete().eq('file_id',f.id).in('to_user',del);if(d.error){e.target.disabled=false;return box.querySelector('#my_se').textContent=d.error.message}}if(add.length){const a=await sb.from('my_shares').insert(add.map(to_user=>({file_id:f.id,to_user})));if(a.error){e.target.disabled=false;return box.querySelector('#my_se').textContent=a.error.message}}close()};
  },()=>{if(S.tab==='kb'&&S.kb.section==='my')myFilesView()});
}
async function myDelete(f){
  if(!f.path.startsWith('drive:'))return'Неизвестный тип хранилища';
  const ses=(await sb.auth.getSession()).data.session;if(!ses)return'Нужно снова войти в приложение';
  try{const r=await fetch('/api/myfile?id='+encodeURIComponent(f.path.slice(6)),{method:'DELETE',headers:{authorization:'Bearer '+ses.access_token}}),j=await r.json().catch(()=>({}));if(!r.ok)return j.message||'Не удалось удалить файл из облака'}catch(e){return'Нет соединения с облаком'}
  const r=await sb.from('my_files').delete().eq('id',f.id);return r.error?r.error.message:null;
}
