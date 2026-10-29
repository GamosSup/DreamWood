// Пушок-помощник: ежедневное приветствие, статус дня, настроение и поиск по приложению.
const CMP_MOOD=[null,{i:'😞',n:'Тяжело',c:'#E8B4B8'},{i:'😕',n:'Так себе',c:'#F3C29B'},{i:'😐',n:'Ровно',c:'#F0D98A'},{i:'🙂',n:'Хорошо',c:'#B7D9C0'},{i:'😄',n:'Отлично',c:'#A9D2EC'}];
const cmpToday=()=>iso(new Date());
const cmpSeenKey=()=> 'dw-welcome:'+(S.me&&S.me.id||'');
function cmpMascot(sz=74){return `<img class="cmp-mascot" src="stickers/pushok.webp" alt="Пушок" width="${sz}" height="${sz}">`}
function cmpError(e){return String(e&&e.message||e||'Не получилось сохранить')}

function companionWelcome(force=false,tries=0){
  if(!S.me||S.me.status!=='approved'||document.querySelector('.cmpw'))return;
  if(!force&&lsGet(cmpSeenKey())===cmpToday())return;
  if(document.querySelector('#tour,.ov,.evtw,.wlc')){if(tries<12)setTimeout(()=>companionWelcome(force,tries+1),1600);return}
  if(!force)lsSet(cmpSeenKey(),cmpToday());
  const day=cmpToday(),state={status:null,mood:0,rest:false,note:'',step:0};
  const ov=document.createElement('div');ov.className='cmpw';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Приветствие Пушок');
  const close=()=>{ov.remove();document.body.style.overflow='';document.removeEventListener('keydown',kd)};
  const kd=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',kd);
  const shell=body=>{ov.innerHTML=`<div class="cmp-card"><button class="cmp-x" aria-label="Закрыть">×</button><div class="cmp-top">${cmpMascot()}<div><span class="cmp-kicker">ПУШОК РЯДОМ</span><h2>Привет, ${esc(firstName())}!</h2></div></div><div class="cmp-dots">${[0,1,2].map(i=>`<i class="${state.step>=i?'on':''}"></i>`).join('')}</div><div class="cmp-body">${body}</div></div>`;
    ov.querySelector('.cmp-x').onclick=close;ov.querySelector('.cmp-skip')?.addEventListener('click',close);document.body.style.overflow='hidden'};
  const statusStep=()=>{state.step=0;shell(`<div class="cmp-speech">Кажется, ты сегодня ${state.rest?'на выходном':'на смене'}?</div><p class="muted">Проверим, чтобы график и сводка были верными.</p><div class="two"><button class="btn" data-st="work">☀️ На смене</button><button class="btn ghost" data-st="rest">🌿 На выходном</button></div><div class="err cmp-err"></div><button class="cmp-skip">Пропустить сегодня</button>`);
    ov.querySelectorAll('[data-st]').forEach(b=>b.onclick=async()=>{const er=ov.querySelector('.cmp-err');er.textContent='';ov.querySelectorAll('[data-st]').forEach(x=>x.disabled=true);
      const r=await sb.rpc('day_status_set',{p_status:b.dataset.st});
      if(r.error){er.textContent=cmpError(r.error);ov.querySelectorAll('[data-st]').forEach(x=>x.disabled=false);return}
      state.status=b.dataset.st;
      if(state.rest&&state.status==='work')state.note='Перерабатывать хорошо, но давай как-нибудь подумаем и об отдыхе. Запиши свои идеи в «Мой блокнот», а потом обсуди с Игорем Ш. Береги себя 💛';
      else if(!state.rest&&state.status==='rest')state.note='По графику была смена, но отдых тоже важен. Если планы просто изменились — всё записал. Если это ошибка, поправить отметку поможет руководитель.';
      else state.note=state.status==='work'?'Отметил выход на смену. Спокойного и доброго дня!':'Отметил выходной. Пусть сегодня будет время на то, что восстанавливает.';
      moodStep()})};
  const moodStep=()=>{state.step=1;shell(`<div class="cmp-speech">${esc(state.note)}</div><h3>Как ты себя чувствуешь?</h3><p class="muted">Это личная запись: коллеги её не видят. Потом можно посмотреть любой прошлый месяц.</p><div class="cmp-moods">${CMP_MOOD.slice(1).map((m,i)=>`<button data-mood="${i+1}" aria-label="${m.n}"><span>${m.i}</span><small>${m.n}</small></button>`).join('')}</div><div class="err cmp-err"></div><button class="cmp-skip">Пропустить</button>`);
    ov.querySelectorAll('[data-mood]').forEach(b=>b.onclick=async()=>{const n=+b.dataset.mood;ov.querySelectorAll('[data-mood]').forEach(x=>x.disabled=true);const r=await sb.rpc('mood_set',{p_day:day,p_mood:n});
      if(r.error){ov.querySelector('.cmp-err').textContent=cmpError(r.error);ov.querySelectorAll('[data-mood]').forEach(x=>x.disabled=false);return}
      state.mood=n;S.moodToday=n;tasksStep()})};
  const tasksStep=async()=>{state.step=2;const gentle=state.mood>0&&state.mood<=2;shell(`<div class="cmp-speech">Твои задания на сегодня — поможем друг другу быть продуктивнее.</div>${gentle?'<p class="muted">Начнём с малого и бережного: без гонки. Одно доброе действие уже считается.</p>':''}<div id="cmp-dq"><div class="card pad muted">Подбираю задания…</div></div><button class="btn" id="cmp-done">Перейти к дню</button><button class="btn ghost" id="cmp-journal">Мой журнал настроения</button>`);
    ov.querySelector('#cmp-done').onclick=()=>{close();if(S.tab==='today')todayView()};ov.querySelector('#cmp-journal').onclick=()=>{close();go('mood')};
    const r=await sb.rpc('dq_status'),box=ov.querySelector('#cmp-dq');if(!box)return;
    if(r.error||!r.data){box.innerHTML='<div class="card pad muted">Задания уже ждут на вкладке «Сегодня».</div>';return}
    window._dqS=r.data;box.innerHTML=dqHtml(r.data);dqWire(box)};
  document.body.appendChild(ov);statusStep();
  Promise.all([sb.from('marks').select('kind').eq('user_id',S.me.id).eq('day',day).maybeSingle(),sb.from('mood_entries').select('mood').eq('user_id',S.me.id).eq('day',day).maybeSingle()]).then(([mk,md])=>{
    state.rest=!!mk.data;state.mood=md.data?.mood||0;S.moodToday=state.mood;
    const q=ov.querySelector('.cmp-speech');if(q&&state.step===0)q.textContent=`Кажется, ты сегодня ${state.rest?'на выходном':'на смене'}?`;
  }).catch(()=>{});
}

async function moodView(){
  const now=new Date(),cur=S.moodMonth?new Date(S.moodMonth):new Date(now.getFullYear(),now.getMonth(),1);
  const y=cur.getFullYear(),m=cur.getMonth(),key=`${y}-${String(m+1).padStart(2,'0')}`,from=key+'-01',to=iso(new Date(y,m+1,0));
  const r=await sb.from('mood_entries').select('day,mood,updated_at').gte('day',from).lte('day',to).order('day');
  const rows=r.data||[],by=new Map(rows.map(x=>[x.day,x.mood])),today=cmpToday(),dim=new Date(y,m+1,0).getDate(),lead=(new Date(y,m,1).getDay()+6)%7;
  const vals=rows.map(x=>x.mood),avg=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—';
  const pts=rows.map((x,i)=>{const px=rows.length===1?180:20+i*(320/Math.max(1,rows.length-1)),py=118-(x.mood-1)*23;return `${px.toFixed(1)},${py}`}).join(' ');
  let h=head('Журнал настроения','Личные заметки о самочувствии по дням');
  h+=`<div class="card pad col"><div class="mood-month"><button class="btn ghost" id="mm_prev" aria-label="Предыдущий месяц">←</button><input id="mm_pick" type="month" value="${key}" max="${today.slice(0,7)}" aria-label="Месяц и год"><button class="btn ghost" id="mm_next" aria-label="Следующий месяц">→</button></div>${r.error?`<div class="err">${esc(cmpError(r.error))}. Запусти обновление базы для журнала.</div>`:''}<div class="mood-stats"><div><b>${rows.length}</b><span>записей</span></div><div><b>${avg}</b><span>среднее</span></div><div><b>${vals.length?CMP_MOOD[Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)].i:'🌱'}</b><span>настроение</span></div></div>${rows.length?`<svg class="mood-chart" viewBox="0 0 360 140" role="img" aria-label="График настроения за месяц"><path d="M20 118H340M20 95H340M20 72H340M20 49H340M20 26H340" stroke="var(--line)" fill="none"/><polyline points="${pts}" fill="none" stroke="#6AA9E0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${rows.map((x,i)=>{const [px,py]=pts.split(' ')[i].split(',');return `<circle cx="${px}" cy="${py}" r="5" fill="${CMP_MOOD[x.mood].c}" stroke="var(--card)" stroke-width="2"/>`}).join('')}</svg>`:'<div class="muted">В этом месяце пока нет записей. Можно добавить настроение за любой прошлый день.</div>'}</div>`;
  h+=`<div class="card pad"><div class="mood-week">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<span>${x}</span>`).join('')}</div><div class="mood-cal">${Array.from({length:lead},()=>'<i></i>').join('')}${Array.from({length:dim},(_,i)=>{const d=key+'-'+String(i+1).padStart(2,'0'),v=by.get(d),future=d>today;return `<button data-md="${d}" ${future?'disabled':''} class="${d===today?'today':''}" style="${v?`--mc:${CMP_MOOD[v].c}`:''}"><b>${i+1}</b><span>${v?CMP_MOOD[v].i:'·'}</span></button>`}).join('')}</div><div class="muted" style="margin-top:10px">Нажми на дату, чтобы добавить или изменить запись.</div></div>`;
  app.innerHTML=h;
  const pick=n=>{S.moodMonth=new Date(n.getFullYear(),n.getMonth(),1);moodView()};
  $('#mm_prev').onclick=()=>pick(new Date(y,m-1,1));$('#mm_next').onclick=()=>{const n=new Date(y,m+1,1);if(n<=now)pick(n)};
  $('#mm_pick').onchange=e=>{if(!e.target.value)return;const [yy,mm]=e.target.value.split('-').map(Number);pick(new Date(yy,mm-1,1))};
  app.querySelectorAll('[data-md]:not([disabled])').forEach(b=>b.onclick=()=>companionMoodEdit(b.dataset.md,by.get(b.dataset.md)||0));
}
function companionMoodEdit(day,current=0){
  dgxSheet('Настроение · '+dayLabel(day),(box,paint,close)=>{
    box.innerHTML=`<div class="muted">Запись видна только тебе. Её можно изменить в любой момент.</div><div class="cmp-moods mood-edit">${CMP_MOOD.slice(1).map((m,i)=>`<button data-me="${i+1}" class="${current===i+1?'on':''}"><span>${m.i}</span><small>${m.n}</small></button>`).join('')}</div><div class="err" id="me_err"></div>`;
    box.querySelectorAll('[data-me]').forEach(b=>b.onclick=async()=>{box.querySelectorAll('[data-me]').forEach(x=>x.disabled=true);const r=await sb.rpc('mood_set',{p_day:day,p_mood:+b.dataset.me});
      if(r.error){box.querySelector('#me_err').textContent=cmpError(r.error);box.querySelectorAll('[data-me]').forEach(x=>x.disabled=false);return}
      if(day===cmpToday())S.moodToday=+b.dataset.me;close(false);if(S.tab==='mood')moodView();toast('Настроение сохранено 💛',1800)});
  },()=>{});
}

const CMP_LINKS=[
  ['today','🏠','Сегодня','смена отметка задания день начать'],['rot','🔄','Ротации','кто где стоит расписание перерыв зона'],['sch','📅','Мой график','выходной смена отпуск даты календарь'],['shift','✅','Чек-листы смены','открытие закрытие проверка'],['mood','💛','Журнал настроения','самочувствие эмоции месяц год прошлый'],['todo','📝','Мой блокнот','дела привычки заметки отдых идеи'],['game','🐾','Профиль и питомец','достижения уровень фон аксессуары'],['thanks','💛','Благодарности','сказать спасибо коллеге'],['kb','📚','База знаний','инструкция памятка аттракцион найти'],['team','👥','Команда','контакты сотрудники телефон'],['park','📰','Новости и афиша','события парк что нового'],['req','📨','Заявки','отгул обмен сменами отпуск'],['set','⚙️','Настройки','тема тёмная уведомления профиль']
];
function companionHelp(){
  dgxSheet('Пушок · помощник',(box,paint,close)=>{
    const tip={today:'Здесь — отметка на смене, задания дня и твоя ротация.',rot:'Выбери дату и команду. Расписание идёт по времени; своя зона подсвечена отдельно.',sch:'На календаре видны рабочие дни и отметки отсутствий.',mood:'Выбери любой месяц и нажми на дату: запись можно добавить задним числом.',game:'Во вкладке «Мой питомец» меняются образ, аксессуары и 2.5D-фон.',todo:'Сюда можно записать дело, привычку или идею для будущего отдыха.'}[S.tab]||'Напиши название раздела или действие — я покажу, куда нажать.';
    box.innerHTML=`<div class="cmp-help">${cmpMascot(68)}<div class="cmp-speech">${esc(tip)}</div></div><input type="search" id="cmp_q" placeholder="Например: график, спасибо, питомец" autocomplete="off"><div class="two cmp-actions"><button class="btn ghost" id="cmp_hello">☀️ Пройти приветствие</button><button class="btn ghost" id="cmp_mood">💛 Моё настроение</button></div><div id="cmp_results" class="col"></div>`;
    const draw=()=>{const q=String(box.querySelector('#cmp_q').value||'').toLowerCase().replace(/ё/g,'е').trim(),L=CMP_LINKS.filter(x=>!q||(x[2]+' '+x[3]).toLowerCase().replace(/ё/g,'е').includes(q));
      box.querySelector('#cmp_results').innerHTML=L.map(([k,ic,n,d])=>`<button class="card pad cmp-link" data-cl="${k}"><span>${ic}</span><span><b>${n}</b><small>${esc(d.split(' ').slice(0,5).join(' · '))}</small></span><b>→</b></button>`).join('')||'<div class="card pad muted">Не нашёл такого раздела. Попробуй короче: «график», «смена», «фон».</div>';
      box.querySelectorAll('[data-cl]').forEach(b=>b.onclick=()=>{close(false);go(b.dataset.cl)})};
    box.querySelector('#cmp_q').oninput=draw;box.querySelector('#cmp_hello').onclick=()=>{close(false);companionWelcome(true)};box.querySelector('#cmp_mood').onclick=()=>{close(false);go('mood')};draw();
  },()=>{});
}
function companionMount(){
  if(!S.me||S.me.status!=='approved'||document.querySelector('#cmp_help'))return;
  const b=document.createElement('button');b.id='cmp_help';b.className='cmp-help-btn';b.setAttribute('aria-label','Спросить Пушок');b.innerHTML=cmpMascot(46)+'<span>Помощь</span>';b.onclick=companionHelp;document.body.appendChild(b);
}
function companionBoot(tries=0){companionMount();if(!S.me)return;if(!tries){sb.from('mood_entries').select('mood').eq('user_id',S.me.id).eq('day',cmpToday()).maybeSingle().then(r=>{S.moodToday=r.data?.mood||0}).catch(()=>{});setTimeout(()=>companionWelcome(false),1100)}}
VIEWS.mood=moodView;if(!MORE_TABS.includes('mood'))MORE_TABS.splice(MORE_TABS.indexOf('todo')+1,0,'mood');
