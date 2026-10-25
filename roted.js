// Ротация: просмотр (+ «Твоя смена», пометки, режим дождя), редактор с проверками, создание нового дня
const ROT_ICONS=['🦇','👻','🧛','🧙','🕷️','🎃','💀'];
const fmtH=x=>{const h=Math.floor(x+1e-9),m=Math.round((x-h)*60);return h+':'+String(m).padStart(2,'0')};
const rtRange=t=>{const m=String(t).match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);return m?[+m[1]+m[2]/60,+m[3]+m[4]/60]:null};
function dayEndOf(rot){
  let e=0;Object.values(rot.teams||{}).forEach(secs=>secs.forEach(s=>{const r=rtRange(s.title);if(r&&r[1]>e)e=r[1]}));
  return e||rot.close||18;
}
const nameKey=n=>norm(n).join(' ');
S.rainSeen={};

// ---------- просмотр ----------
async function rotView(){
  S.offline=0;
  const todayIso=iso(new Date()),from=iso(new Date(Date.now()-7*864e5));
  const lr=await cq('rotlist',()=>sb.from('rotations').select('day').gte('day',from).order('day'));
  const days=[...new Set([...(lr.data||[]).map(x=>x.day),todayIso])].sort();
  if(!S.day||!days.includes(S.day))S.day=days.includes(todayIso)?todayIso:days[days.length-1];
  const dr=await cq('rot:'+S.day,()=>sb.from('rotations').select('*').eq('day',S.day).maybeSingle());
  const rot=dr.data?.data,mgr=isManager();
  if(S.rname===undefined){const r=await sb.rpc('my_roster_name');S.rname=r.error?null:(r.data||null)}
  S.dayEnd=rot?dayEndOf(rot):18;
  if(rot?.rain&&!S.rainSeen[S.day]){S.team='W';S.rainSeen[S.day]=1}
  let h=head('Ротации','Кто где стоит и когда перерыв');
  h+=`<div class="tabs">${days.map(d=>`<button data-d="${d}" class="${d===S.day?'on':''}" style="background:var(--tab)">${d===todayIso?'Сегодня':dayLabel(d)}${d===todayIso?'<br><small>'+dayLabel(d)+'</small>':''}</button>`).join('')}</div>`;
  if(mgr)h+=`<div class="tabs"><button id="re_new" style="background:var(--tab)">➕ Новый день</button>${rot?`<button id="re_edit" style="background:var(--tab)">✏️ Редактировать</button><button id="re_rain" style="background:${rot.rain?'#F5E2A8':'#BCC8D6'}">${rot.rain?'☀️ Отключить режим дождя':'🌧 Включить режим дождя'}</button>`:''}</div>`;
  if(!rot){h+=`<div class="card pad"><b>Ротации на ${dayLabel(S.day)} пока нет</b><div class="muted">Как только её загрузят, она появится здесь.</div></div>`;app.innerHTML=h;return bindRot(rot)}
  if(rot.rain)h+=`<div class="banner" style="background:#7E98AE;color:#fff">🌧 Идёт дождь — работаем по плану «Если дождь»</div>`;
  if(rot.banner)h+=`<div class="banner">🎃 ${esc(rot.banner)}</div>`;
  // моя смена
  const mine=myShift(rot);
  h+=myShiftCard(mine);
  const rimg=rot.images?.[S.team]||(rot.image&&(rot.imageTeams||['R','M']).includes(S.team)?rot.image:null);
  if(rimg)h+=`<button class="card rimg" id="rimg" aria-label="Увеличить картинку ротации"><img src="${esc(rimg)}" alt="Ротация картинкой" loading="lazy"><span>🔍 Нажми, чтобы увеличить</span></button>`;
  h+=`<div class="tabs">${TEAMS.map(([k,n,c])=>`<button data-t="${k}" class="${S.team===k?'on':''}" style="background:${c}">${n}</button>`).join('')}</div>`;
  const secs=rot.teams?.[S.team]||[];
  if(!secs.length)h+=`<div class="card pad"><b>Для этой команды ротации на этот день пока нет</b><div class="muted">Как только она появится, придёт уведомление.</div></div>`;
  h+=secs.filter(s=>s.note).map(s=>`<div class="n" style="background:${s.noteBg||'#E8B4B8'};padding:8px 12px;border-radius:12px;font-weight:700;font-size:13px">${esc(s.note)}</div>`).join('');
  const order=[],byZone={};
  secs.forEach(s=>{const range=parseRange(s.title);s.rows.forEach(r=>{if(!byZone[r.zone]){byZone[r.zone]=[];order.push(r.zone)}
    byZone[r.zone].push({range,title:s.title==='Весь день'?'Весь день · 10:00–'+fmtH(S.dayEnd):s.title.replace(/^.*·\s*/,''),people:r.people,steps:r.steps})})});
  h+=byArea(order,z=>z).map(({a,items})=>`<details class="area" data-ar="r${a.k}" ${S.areaOpen['r'+a.k]===false?'':'open'}>${areaHead(a,items.length+' '+(items.length===1?'зона':'зоны'))}<div class="ab" style="background:${a.d}">${items.map(z=>zoneCard(z,byZone[z],S.team==='W'?'#7E98AE':a.c)).join('')}</div></details>`).join('');
  if(rot.legend&&secs.length)h+=`<div class="card pad muted">${rot.legend.map(esc).join('<br>')}</div>`;
  // личная пометка
  const nt=await sb.from('rot_notes').select('note').eq('day',S.day).maybeSingle();
  h+=`<div class="card pad col"><b>📝 Моя пометка к этому дню</b><div class="muted">Видишь только ты.</div><textarea id="rn_t" placeholder="Например: взять рацию, поменяться с Таней обедом…">${esc(nt.data?.note||'')}</textarea><div class="muted" id="rn_s"></div></div>`;
  app.innerHTML=h;bindRot(rot);bindAreas(app);
  $('#rimg')?.addEventListener('click',()=>rotZoom(rimg));
  let tm;const sv=async()=>{const r=await sb.from('rot_notes').upsert({day:S.day,note:$('#rn_t').value});$('#rn_s').textContent=r.error?'Не сохранилось: '+r.error.message:'Сохранено ✓'};
  $('#rn_t').oninput=()=>{$('#rn_s').textContent='…';clearTimeout(tm);tm=setTimeout(sv,900)};$('#rn_t').onblur=()=>{clearTimeout(tm);sv()};
}
function myShift(rot){
  const res=[],rk=S.rname?nameKey(S.rname):null,full=norm(S.me.full_name||'');
  const match=n=>rk?nameKey(n)===rk:(full.length>=2&&simScore(n,S.me.full_name)>=6);
  Object.entries(rot.teams||{}).forEach(([tk,secs])=>secs.forEach(s=>s.rows.forEach(r=>(r.people||[]).forEach(p=>{if(match(p.name))res.push({team:tk,sec:s.title,zone:r.zone,p,steps:r.steps,row:r})}))));
  return res;
}
function bindRot(rot){
  app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.day=b.dataset.d;rotView()});
  app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.team=b.dataset.t;rotView()});
  $('#re_edit')?.addEventListener('click',()=>rotEditor(S.day,JSON.parse(JSON.stringify(rot)),false));
  $('#re_new')?.addEventListener('click',rotNew);
  $('#re_rain')?.addEventListener('click',async()=>{
    const on=!rot.rain;if(!confirm(on?'Включить режим дождя? Всем придёт уведомление, откроется план «Если дождь».':'Отключить режим дождя? Всем придёт уведомление.'))return;
    const r=await sb.from('rotations').update({data:{...rot,rain:on},updated_at:new Date().toISOString()}).eq('day',S.day);
    if(r.error)alert(r.error.message);S.rainSeen[S.day]=1;if(on)S.team='W';else if(S.team==='W')S.team='R';rotView().then(refreshUnread)});
}

// ---------- новый день ----------
function rotNew(){
  dgxSheet('➕ Новая ротация',async(box,paint,close)=>{
    const all=(await sb.from('rotations').select('day').order('day',{ascending:false}).limit(60)).data||[];
    const next=new Date(Date.now()+864e5);const dflt=iso(next);
    box.innerHTML=`<label>На какой день<input id="n_d" type="date" value="${dflt}"></label>
    <label>За основу взять<select id="n_s"><option value="">Пустую ротацию</option>${all.map((x,i)=>`<option value="${x.day}" ${i===0?'selected':''}>${dayLabel(x.day)}</option>`).join('')}</select></label>
    <div class="muted">Копируются разделы, зоны, люди и перерывы — дальше правишь под новый день.</div>
    <button class="btn" id="n_go">Открыть редактор</button><div class="err" id="n_er"></div>`;
    box.querySelector('#n_go').onclick=async()=>{
      const day=box.querySelector('#n_d').value,src=box.querySelector('#n_s').value;if(!day)return box.querySelector('#n_er').textContent='Выбери дату';
      const ex=(await sb.from('rotations').select('data').eq('day',day).maybeSingle()).data;
      if(ex&&!confirm('На этот день ротация уже есть. Открыть её для правки?')) return;
      let D;
      if(ex)D=ex.data;
      else if(src){D=JSON.parse(JSON.stringify((await sb.from('rotations').select('data').eq('day',src).single()).data.data));delete D.image;delete D.rain}
      else D={banner:'',legend:[],teams:{R:[],K:[],M:[],W:[]},close:18};
      close(false);rotEditor(day,D,!ex);
    };
  },()=>{});
}

// ---------- проверки ротации ----------
function rotCheck(D,roster){
  const out=[],seenMsg=new Set(),add=(lvl,msg)=>{if(seenMsg.has(msg))return;seenMsg.add(msg);out.push({lvl,msg})};
  const brkRe=/^(Ос|Пс|О|П|Т|Бриф)\s*(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/;
  const parseB=s=>{const m=String(s).match(brkRe);return m?{code:m[1],s:+m[2]+m[3]/60,e:+m[4]+m[5]/60,raw:s}:null};
  const ov=(a,b)=>a.s<b.e-.01&&b.s<a.e-.01;
  const end=dayEndOf(D),rk=roster?new Set(roster.map(nameKey)):null;
  const alpha=[],obr=[],metro=['боулинг','кино','vr','детск','нян'];
  const labelMatch=(label,zone)=>{
    const l=label.toLowerCase(),z=zone.toLowerCase();
    if(l.startsWith('метро'))return metro.some(k=>z.includes(k));
    return z.includes(l.split(/[\s/]/)[0].slice(0,6))||l.includes(z.split(/[\s/]/)[0].slice(0,6));
  };
  Object.entries(D.teams||{}).forEach(([tk,secs])=>{
    if(tk==='W')return;
    const strict=tk!=='M'; // у Метрополиса свой порядок перерывов
    const alphaNames=new Set();
    secs.forEach((s,si)=>{
      const sr=rtRange(s.title)||[10,end],where=`${TN[tk]||tk} · ${s.title||'раздел '+(si+1)}`;
      const seen=new Map();let alphaRows=0;
      (s.rows||[]).forEach(r=>{
        const zone=r.zone||'(без названия)',ppl=r.people||[],isA=(r.steps||[]).length>0;
        if(isA){alphaRows++;ppl.forEach(p=>alphaNames.add(nameKey(p.name)));
          const st=r.steps.map(x=>({r:rtRange(x[0]),label:String(x[1])})).filter(x=>x.r);
          st.sort((a,b)=>a.r[0]-b.r[0]);
          st.forEach((x,i)=>{
            if(x.r[0]<sr[0]-.01||x.r[1]>sr[1]+.01)add('warn',`${where}: замена Альфы ${fmtH(x.r[0])}–${fmtH(x.r[1])} выходит за границы раздела`);
            if(i>0&&x.r[0]<st[i-1].r[1]-.01)add('err',`${where}: у Альфы пересекаются замены (${fmtH(st[i-1].r[0])}–${fmtH(st[i-1].r[1])} и ${fmtH(x.r[0])}–${fmtH(x.r[1])})`);
            if(i>0&&x.r[0]>st[i-1].r[1]+.01)add('warn',`${where}: у Альфы пустое время ${fmtH(st[i-1].r[1])}–${fmtH(x.r[0])}`);
            if(!/^(ос|пс|бриф|т|ротация)$/i.test(x.label.trim()))alpha.push({s:x.r[0],e:x.r[1],label:x.label,where});
          });
        }
        const iv=[];
        ppl.forEach(p=>{
          const nm=p.name||'(без имени)',k=nameKey(p.name||'');
          if(!p.name)add('err',`${where} · ${zone}: человек без имени`);
          else{ if(seen.has(k)&&!isA)add(strict?'err':'warn',`${where}: ${nm} стоит сразу в двух зонах (${seen.get(k)} и ${zone})`);seen.set(k,zone);
            if(rk&&!rk.has(k))add('warn',`${nm} нет в списке сотрудников — проверь написание`)}
          const bs=(p.brks||[]).map(parseB).filter(Boolean);
          bs.forEach((b,i)=>{
            if(b.code==='Бриф'||b.code==='Т')return;
            if(b.s<sr[0]-.01||b.e>sr[1]+.01)add('warn',`${where} · ${nm}: перерыв ${fmtH(b.s)}–${fmtH(b.e)} вне времени раздела`);
            if(b.e-b.s>1.01||b.e-b.s<.24)add('warn',`${where} · ${nm}: странная длительность перерыва ${fmtH(b.s)}–${fmtH(b.e)}`);
            bs.slice(i+1).forEach(c=>{if(c.code!=='Бриф'&&c.code!=='Т'&&ov(b,c))add('err',`${where} · ${nm}: перерывы пересекаются (${fmtH(b.s)}–${fmtH(b.e)} и ${fmtH(c.s)}–${fmtH(c.e)})`)});
            if(b.code==='О'||b.code==='П')obr.push({zone,s:b.s,e:b.e,name:nm,where});
            if(strict&&/веревоч/i.test(zone)&&b.code==='О')add('warn',`${where} · ${nm}: у Веревочного лагеря обед самостоятельный — должен быть «Ос», а не «О»`);
            iv.push({...b,who:nm});
          });
          const lunches=bs.filter(b=>['О','Ос','П','Пс'].includes(b.code));
          if(strict&&!isA&&(sr[1]-sr[0])>=3.5&&p.name&&!lunches.length&&!(p.brks||[]).length)add('warn',`${where} · ${nm} (${zone}): не указан перерыв`);
        });
        // зона без людей: все на самостоятельном обеде одновременно
        if(strict&&!isA&&ppl.length){
          const pts=new Set();iv.filter(b=>b.code==='Ос').forEach(b=>{pts.add(b.s);pts.add(b.e)});
          [...pts].sort((a,b)=>a-b).forEach((t,i,arr)=>{const nx=arr[i+1];if(nx===undefined)return;const mid=(t+nx)/2;
            const away=new Set(iv.filter(b=>b.code==='Ос'&&b.s<=mid&&b.e>=mid).map(b=>b.who));
            if(away.size>=ppl.length)add('warn',`${where}: в зоне «${zone}» никого нет с ${fmtH(t)} до ${fmtH(nx)} (все на обеде)`)});
          if(/веревоч/i.test(zone)){const ob=iv.filter(b=>b.code==='Ос');ob.forEach((b,i)=>ob.slice(i+1).forEach(c=>{if(ov(b,c))add('warn',`${where}: на Веревочном ${b.who} и ${c.who} уходят на обед одновременно`)}))}
        }
      });
      if(alphaRows>1)add('warn',`${where}: в разделе больше одной строки Альфы`);
    });
    if(alphaNames.size>1)add('warn',`${TN[tk]||tk}: Альфа назначена по-разному в разных частях дня (${alphaNames.size} чел.) — обычно Альфа один на весь день`);
  });
  // сверка О ↔ замены Альфы
  obr.forEach(o=>{if(!alpha.some(a=>ov(a,o)&&labelMatch(a.label,o.zone)))add('err',`${o.name} («${o.zone}», ${fmtH(o.s)}–${fmtH(o.e)}) — стоит «О», но Альфа в это время эту зону не меняет`)});
  alpha.forEach(a=>{if(a.e-a.s<=1.01&&!/веревоч/i.test(a.label)&&!obr.some(o=>ov(a,o)&&labelMatch(a.label,o.zone)))add('warn',`Альфа ${fmtH(a.s)}–${fmtH(a.e)} меняет «${a.label}», но у зоны в это время нет «О»`)});
  return out;
}

// ---------- редактор ----------
const getP=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
const setP=(o,p,v)=>{const ks=p.split('.'),l=ks.pop();ks.reduce((a,k)=>a[k],o)[l]=v};
function parseStep(line){const m=line.match(/^\s*(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})\s+(.+?)\s*$/);return m?[m[1]+'–'+m[2],m[3]]:null}
async function rotEditor(day,D,isNew){
  D.teams=D.teams||{};['R','K','M','W'].forEach(k=>D.teams[k]=D.teams[k]||[]);D.legend=D.legend||[];
  if(!D.close)D.close=dayEndOf(D);
  let roster=null;try{const r=await sb.from('roster').select('full_name').order('full_name');if(!r.error)roster=(r.data||[]).map(x=>x.full_name)}catch(e){}
  let team=S.team&&D.teams[S.team]?S.team:'R';
  const zones=[...new Set([...Object.keys(ZC),'Метро','Лучный тир','Золото','Альфа'])];
  dgxSheet((isNew?'➕ Ротация · ':'✏️ Ротация · ')+dayLabel(day),(box,paint,close)=>{
    const secHtml=()=>(D.teams[team]||[]).map((s,si)=>{
      const base=`teams.${team}.${si}`;
      return `<div class="card pad col" style="border-left:8px solid ${s.noteBg||'#E8B4B8'}">
        <div class="two"><label style="flex:1">Раздел<input data-p="${base}.title" value="${esc(s.title||'')}" placeholder="Первая половина дня · 10:00–14:00"></label><button class="x" data-act="delSec" data-si="${si}" aria-label="Удалить раздел" style="align-self:flex-end">×</button></div>
        <label>Заметка сверху<input data-p="${base}.note" value="${esc(s.note||'')}" placeholder="10:00–10:30 · Т — танцуем на северном входе"></label>
        ${(s.rows||[]).map((r,ri)=>{const rb=`${base}.rows.${ri}`;return `<div class="col" style="padding:10px;border-radius:14px;background:var(--bg);border:1px solid var(--line)">
          <div class="two"><label style="flex:2">Зона<input list="ed_z" data-p="${rb}.zone" value="${esc(r.zone||'')}"></label><label>Пометка<input data-p="${rb}.note" value="${esc(r.note||'')}" placeholder="Меняет обеды"></label><button class="x" data-act="delRow" data-si="${si}" data-ri="${ri}" aria-label="Удалить зону" style="align-self:flex-end">×</button></div>
          ${r.steps?`<label>Замены Альфы (каждая с новой строки: «10:00–12:00 Боулинг»)<textarea data-p="${rb}.steps" data-kind="steps" style="min-height:100px">${esc(r.steps.map(x=>x[0]+' '+x[1]).join('\n'))}</textarea></label><button class="btn ghost" data-act="noSteps" data-si="${si}" data-ri="${ri}" style="min-height:36px">Это не строка Альфы</button>`:''}
          ${(r.people||[]).map((p,pi)=>{const pb=`${rb}.people.${pi}`;return `<div class="col" style="gap:6px;padding-top:6px;border-top:1px dashed var(--line)"><div class="prow"><input class="pt" data-p="${pb}.icon" value="${esc(p.icon||'')}" list="ed_i" style="width:62px;text-align:center"><input class="pn" list="ed_p" data-p="${pb}.name" value="${esc(p.name||'')}" placeholder="Имя"><label style="flex-direction:row;align-items:center;gap:4px;font-size:12px;white-space:nowrap"><input type="checkbox" data-p="${pb}.senior" ${p.senior?'checked':''} style="width:20px;min-height:20px">Старш.</label><button class="x" data-act="delPer" data-si="${si}" data-ri="${ri}" data-pi="${pi}" aria-label="Убрать человека">×</button></div>
            <input data-p="${pb}.brks" data-kind="brks" value="${esc((p.brks||[]).join('; '))}" placeholder="Перерывы через «;» — Ос 12:00–12:30; О 13:00–13:30"></div>`}).join('')}
          <div class="two"><button class="btn ghost" data-act="addPer" data-si="${si}" data-ri="${ri}" style="min-height:38px">+ Человек</button>${r.steps?'':`<button class="btn ghost" data-act="mkSteps" data-si="${si}" data-ri="${ri}" style="min-height:38px">Строка Альфы</button>`}</div></div>`}).join('')}
        <button class="btn ghost" data-act="addRow" data-si="${si}" style="min-height:40px">+ Зона</button></div>`}).join('')||'<div class="muted">В этой команде разделов пока нет.</div>';
    box.innerHTML=`<datalist id="ed_z">${zones.map(z=>`<option value="${esc(z)}">`).join('')}</datalist><datalist id="ed_i">${ROT_ICONS.map(i=>`<option value="${i}">`).join('')}</datalist><datalist id="ed_p">${(roster||[]).map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
    <div class="two"><label>Надпись в шапке<input id="ed_b" value="${esc(D.banner||'')}" placeholder="Необязательно"></label><label style="max-width:150px">Парк до (час)<input id="ed_c" type="number" min="12" max="23" value="${D.close||18}"></label></div>
    <div class="tabs">${TEAMS.map(([k,n,c])=>`<button data-tm="${k}" class="${team===k?'on':''}" style="background:${c}">${n}</button>`).join('')}</div>
    <div id="ed_secs" class="col">${secHtml()}</div>
    <button class="btn ghost" data-act="addSec">+ Раздел (часть дня)</button>
    <label>Легенда (каждая строка отдельно)<textarea id="ed_l" style="min-height:90px">${esc(D.legend.join('\n'))}</textarea></label>
    <div id="ed_iss" class="card pad col"></div>
    <button class="btn" id="ed_sv">${isNew?'Опубликовать ротацию':'Сохранить'}</button><div class="err" id="ed_er"></div>`;
    const redo=()=>{
      const iss=rotCheck(D,roster),er=iss.filter(x=>x.lvl==='err').length,wr=iss.length-er;
      box.querySelector('#ed_iss').innerHTML=`<b>${iss.length?`Проверка: ${er?`🔴 ошибок ${er}`:''}${er&&wr?' · ':''}${wr?`🟡 замечаний ${wr}`:''}`:'✅ Проверка: замечаний нет'}</b>${iss.map(x=>`<div style="font-size:13px">${x.lvl==='err'?'🔴':'🟡'} ${esc(x.msg)}</div>`).join('')}<div class="muted">Проверяю правила: «О» ↔ замены Альфы, «Ос» у Веревочного, перерывы в границах раздела, пустые зоны.</div>`;
      return iss;
    };
    redo();let tm;const later=()=>{clearTimeout(tm);tm=setTimeout(redo,350)};
    const rerender=()=>{box.querySelector('#ed_secs').innerHTML=secHtml();redo()};
    box.addEventListener('input',e=>{
      const el=e.target;
      if(el.id==='ed_b')D.banner=el.value;else if(el.id==='ed_c')D.close=+el.value||18;else if(el.id==='ed_l')D.legend=el.value.split('\n').map(s=>s.trim()).filter(Boolean);
      else if(el.dataset.p){let v=el.type==='checkbox'?el.checked:el.value;
        if(el.dataset.kind==='brks')v=v.split(';').map(s=>s.trim()).filter(Boolean);
        else if(el.dataset.kind==='steps')v=v.split('\n').map(parseStep).filter(Boolean);
        setP(D,el.dataset.p,v)}
      later();
    });
    box.addEventListener('click',e=>{
      const t=e.target.closest('[data-act],[data-tm]');if(!t)return;
      if(t.dataset.tm){team=t.dataset.tm;box.querySelectorAll('[data-tm]').forEach(b=>b.classList.toggle('on',b===t));rerender();return}
      const a=t.dataset.act,si=+t.dataset.si,ri=+t.dataset.ri,pi=+t.dataset.pi,secs=D.teams[team];
      if(a==='addSec')secs.push({title:'',note:'',noteBg:'#E8B4B8',rows:[]});
      else if(a==='delSec'){if(!confirm('Удалить раздел целиком?'))return;secs.splice(si,1)}
      else if(a==='addRow')secs[si].rows.push({zone:'',people:[]});
      else if(a==='delRow'){if(!confirm('Удалить зону?'))return;secs[si].rows.splice(ri,1)}
      else if(a==='addPer'){const rr=secs[si].rows[ri];rr.people.push({name:'',icon:ROT_ICONS[rr.people.length%ROT_ICONS.length],senior:false,brks:[]})}
      else if(a==='delPer')secs[si].rows[ri].people.splice(pi,1);
      else if(a==='mkSteps')secs[si].rows[ri].steps=[];
      else if(a==='noSteps')delete secs[si].rows[ri].steps;
      else return;
      rerender();
    });
    box.querySelector('#ed_sv').onclick=async e=>{
      const iss=redo(),errEl=box.querySelector('#ed_er'),er=iss.filter(x=>x.lvl==='err').length;
      if(er&&!confirm(`В ротации ${er} ошибок(и). Всё равно сохранить?`))return;
      D.banner=box.querySelector('#ed_b').value.trim();
      e.target.disabled=true;
      const r=await sb.from('rotations').upsert({day,data:D,updated_at:new Date().toISOString()});
      if(r.error){e.target.disabled=false;return errEl.textContent='Не сохранилось: '+r.error.message}
      S.day=day;try{localStorage.removeItem('dw:rot:'+day)}catch(x){}
      close();
    };
  },()=>{if(S.tab==='rot')rotView().then(refreshUnread)},'wide');
}

VIEWS.rot=rotView;

// картинка ротации: маленькая в ленте, по нажатию — на весь экран (двигай пальцем, щипок — увеличить)
function rotZoom(src){
  const ov=document.createElement('div');ov.className='ibox';
  ov.innerHTML=`<button class="ibx" aria-label="Закрыть">✕</button><div class="ibs"><img src="${esc(src)}" alt="Ротация"></div>`;
  const close=()=>{ov.remove();document.body.style.overflow='';document.removeEventListener('keydown',kd)};
  const kd=e=>{if(e.key==='Escape')close()};
  ov.querySelector('.ibx').onclick=close;
  ov.querySelector('.ibs').onclick=e=>{if(e.target.classList.contains('ibs'))close()};
  document.addEventListener('keydown',kd);
  document.body.appendChild(ov);document.body.style.overflow='hidden';
}

function myShiftCard(mine,label){return mine.length?`<div class="card pad col" style="border:2px solid var(--ink)"><b>👤 ${label||'Твоя смена'}</b>${mine.map(x=>{const mates=(x.row?.people||[]).filter(q=>q!==x.p);
  return `<div><b>${esc(x.zone)}</b> <span class="muted">· ${esc(x.sec.replace(/^.*·\s*/,''))}${x.team==='W'?' · если дождь':''}</span>${x.p.brks?.length?`<div class="muted">Перерыв: ${x.p.brks.map(esc).join(' · ')}</div>`:''}${x.steps?.length?`<div class="muted">Замены: ${x.steps.map(s=>esc(s[0])+' '+esc(s[1])).join(' · ')}</div>`:''}${mates.length?`<div style="margin-top:4px">👥 <b>С тобой:</b> ${mates.map(q=>esc(q.name)+(q.brks?.length?` <span class="muted">(${q.brks.map(esc).join(', ')})</span>`:'')).join(' · ')}</div>`:''}<a href="#" class="lnk" data-kbz="${esc(x.zone)}" style="display:inline-block;margin-top:4px">📖 Памятка по зоне</a></div>`}).join('')}</div>`:''}
