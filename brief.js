// «Сегодня бриф»: руководитель пишет бриф всем или одной команде, с локацией. Сотрудники видят его на «Сегодня».
(function(){
const TEAMS_B=[['','Всем','🌲'],['R','Рейнджеры','🌿'],['K','Хранители','🛡️'],['M','Метрополис','🏙️']];
const tName=t=>(TEAMS_B.find(x=>x[0]===(t||''))||TEAMS_B[0])[1];
const hm=d=>new Date(d).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
window.briefCard=()=>isManager()?`<button class="alcard brfcard" id="td_brief"><span>📣</span><span><b>Сегодня бриф</b><br><small>Всем или команде, с указанием локации</small></span></button>`:'';
window.briefBox=()=>'<div id="td_brf"></div>';
async function zones(){
  if(S.gmZones&&S.gmZones.length)return S.gmZones;
  let z=[];try{const r=await sb.from('rotations').select('data').order('day',{ascending:false}).limit(1).maybeSingle();const s=new Set();Object.values(r.data?.data?.teams||{}).forEach(secs=>secs.forEach(x=>(x.rows||[]).forEach(w=>w.zone&&s.add(String(w.zone).replace(/\s+\d+$/,'')))));z=[...s].sort((a,b)=>a.localeCompare(b,'ru'))}catch(e){}
  S.gmZones=z;return z;
}
// карточка(и) брифа на «Сегодня»: видят все, руководителю доступно удаление
window.briefMount=async function(){
  const box=document.getElementById('td_brf');if(!box)return;
  const t=iso(new Date());let rows=[];
  try{const r=await sb.from('briefs').select('*').eq('day',t).order('created_at',{ascending:false});if(r.error)return;rows=r.data||[]}catch(e){return}
  if(!box.isConnected||!rows.length){box.innerHTML='';return}
  const nm=id=>{try{return shortName((S.dg&&S.dg.people||[]).find(p=>p.id===id)?.full_name||'')||''}catch(e){return ''}};
  box.innerHTML=`<div class="card pad col brf"><div class="brh"><b>📣 Бриф на сегодня</b></div>${rows.map(b=>`<div class="bri"><div class="brm"><span class="pill brt${b.team?'':' all'}">${esc(tName(b.team))}</span>${b.location?`<span class="pill brl">📍 ${esc(b.location)}</span>`:''}<span class="muted">${hm(b.created_at)}</span>${isManager()?`<button class="brx" data-bd="${b.id}" aria-label="Удалить бриф">🗑</button>`:''}</div><div class="brb">${esc(b.body)}</div></div>`).join('')}</div>`;
  box.querySelectorAll('[data-bd]').forEach(x=>x.onclick=async()=>{if(!confirm('Удалить этот бриф? У сотрудников он тоже пропадёт.'))return;const r=await sb.from('briefs').delete().eq('id',x.dataset.bd);if(r.error)return alert(r.error.message);briefMount()});
};
window.briefSheet=function(){
  dgxSheet('📣 Сегодня бриф',async(box,paint,close)=>{
    const st=S.briefDraft||(S.briefDraft={team:'',loc:'',body:''});
    const zs=await zones();
    box.innerHTML=`<div class="muted">Бриф увидят на экране «Сегодня», и придёт уведомление. Выбери, кому он адресован.</div>
      <div class="field"><b>Кому</b><div class="brteams" id="b_team">${TEAMS_B.map(([k,n,ic])=>`<button data-t="${k}" class="${st.team===k?'on':''}">${ic} ${n}</button>`).join('')}</div></div>
      <label>📍 Локация<input id="b_loc" list="b_zl" maxlength="120" placeholder="Например: Главная площадь, 9:00" value="${esc(st.loc)}"><datalist id="b_zl">${zs.map(z=>`<option value="${esc(z)}">`).join('')}</datalist></label>
      ${zs.length?`<div class="brchips">${zs.slice(0,14).map(z=>`<button class="chip" data-z="${esc(z)}">${esc(z)}</button>`).join('')}</div>`:''}
      <label>Текст брифа<textarea id="b_body" rows="6" maxlength="1500" placeholder="Что важно знать сегодня: задачи, изменения, гости, погода…">${esc(st.body)}</textarea></label>
      <div class="err" id="b_er"></div>
      <button class="btn" id="b_go">📣 Отправить бриф</button>`;
    const sync=()=>{st.loc=box.querySelector('#b_loc').value;st.body=box.querySelector('#b_body').value};
    box.querySelectorAll('#b_team [data-t]').forEach(b=>b.onclick=()=>{sync();st.team=b.dataset.t;box.querySelectorAll('#b_team [data-t]').forEach(x=>x.classList.toggle('on',x===b))});
    box.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{box.querySelector('#b_loc').value=b.dataset.z;sync()});
    box.querySelector('#b_go').onclick=async e=>{
      sync();const er=box.querySelector('#b_er');er.textContent='';
      if(!st.body.trim())return er.textContent='Напиши текст брифа';
      const who=st.team?'команде «'+tName(st.team)+'»':'всем сотрудникам';
      if(!confirm('Отправить бриф '+who+'? Придёт уведомление.'))return;
      e.target.disabled=true;
      const r=await sb.rpc('brief_publish',{p_team:st.team||'',p_loc:st.loc.trim(),p_body:st.body.trim()});
      e.target.disabled=false;
      if(r.error)return er.textContent=/function|does not exist|briefs/i.test(r.error.message)?'В базе ещё не включены брифы. Админу нужно один раз запустить обновление базы.':'Не получилось: '+r.error.message;
      S.briefDraft=null;close(false);toast('Бриф отправлен ✅',2400);if(S.tab==='today')todayView();
    };
  },()=>{},'');
};
})();
