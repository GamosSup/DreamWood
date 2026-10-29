// Тамагочи и «Золотой лоток»: забота, прокачка, энергия и коллекция камней.
const GOLD_GEMS=[
 ['quartz','Кварц',10],['aragonite','Арагонит',12],['sodalite','Содалит',15],
 ['red_agate','Красный агат',18],['tiger_eye','Тигровый глаз',22],['topaz','Топаз',26],
 ['aventurine','Авантюрин',32],['blue_agate','Голубой агат',40],['amethyst','Аметист',50]];
const GOLD_ACH=[
 ['care:first','🍎','Первая забота','Покормить, умыть или поиграть с питомцем'],
 ['care:level2','💛','Верный друг','Достичь 2 уровня заботы'],
 ['care:level3','🌿','Уютный дом','Достичь 3 уровня заботы'],
 ['gold:first','💎','Первый блеск','Найти первый камень'],
 ['gold:score100','🥣','Полный лоток','Набрать 100 очков за игру'],
 ['gold:score300','✨','Золотые руки','Набрать 300 очков за игру'],
 ['gold:games5','🥾','Не боюсь песка','Сыграть пять раз'],
 ['gold:collector3','🔮','Ювелир','Собрать 3 вида камней'],
 ['gold:collector6','🏺','Коллекционер','Собрать 6 видов камней'],
 ['gold:collector9','🏆','Сокровищница Дримвуд','Собрать все 9 видов камней'],
 ['gold:level:2','⛏️','Ученик старателя','Достичь 2 уровня старателя'],
 ['gold:level:3','🪙','Опытный старатель','Достичь 3 уровня старателя'],
 ['gold:level:5','👑','Мастер золотой жилы','Достичь 5 уровня старателя'],
 ['event:first','🌟','Звезда события','Найти редкий камень во временном событии'],
 ['event:5','💫','Легенда жилы','Получить награды в пяти событиях']];
const GOLD={tab:'care',st:null,run:null,raf:0,timer:0,careTimer:0,stAt:0,stamp:null,loading:false};
const goldAchDef=c=>GOLD_ACH.find(x=>x[0]===c)||['','✨','Новое достижение',c];
function goldCfg(){const me=(typeof gmMe==='function'&&gmMe())||S.me;return typeof petCfg==='function'?petCfg(me):null}
function goldPet(sz=160,vb=[0,-70,320,500]){const c=goldCfg();return c?gmPet({},sz,{cfg:c,vb,bg:''}):'<img class="gp-no-pet" src="stickers/mascot-hi.webp" alt="Питомец">'}
function goldLevelHtml(kind){
 const s=GOLD.st,care=kind==='care',lv=s[care?'care_level':'gold_level'],xp=s[care?'care_xp':'gold_xp'],next=s[care?'care_next':'gold_next'],base=care?40:120,prev=(lv-1)*(lv-1)*base,pct=Math.max(0,Math.min(100,Math.round((xp-prev)/(next-prev)*100)));
 return `<div class="gp-level"><div class="gp-level-top"><span>${care?'💛 Уровень заботы':'⛏️ Уровень старателя'}</span><b>${lv}</b></div><div class="gp-xp"><i style="width:${pct}%"></i></div><div class="gp-level-note"><span>${xp} опыта</span><span>до ${lv+1} уровня: ${Math.max(0,next-xp)}</span></div></div>`;
}
function goldEnergyHtml(){const s=GOLD.st;return `<div class="gp-energy"><div><b>⚡ Энергия</b><span>${s.energy?'+1 каждые 20 минут':s.energy_in?`следующая через ${Math.ceil(s.energy_in/60)} мин`:'скоро восстановится'}</span></div><div class="gp-cells">${Array.from({length:5},(_,i)=>`<i class="${i<s.energy?'on':''}"></i>`).join('')}</div></div>`}
function goldEventHtml(ev=GOLD.st.event){
 if(!ev)return '';const gem=(GOLD_GEMS.find(x=>x[0]===ev.gem)||['','Редкий камень'])[1],hours=Math.max(1,Math.ceil((ev.ends_in||0)/3600));
 return `<div class="gp-event"><div class="gp-event-top"><span>✨ Событие дня</span><small>ещё ${hours} ч.</small></div><b>${esc(ev.name)}</b><p>Чаще падает: <strong>${esc(gem)}</strong>. Первая находка сегодня принесёт <strong>+${ev.reward||2} билета</strong>.</p></div>`;
}
function goldTabs(){return `<div class="tabs gp-tabs">${[['care','🐾 Забота'],['game','⛏️ Лоток'],['style','🎨 Образ'],['ach','🏅 Награды']].map(([k,n])=>`<button data-gold-tab="${k}" class="${GOLD.tab===k?'on':''}">${n}</button>`).join('')}</div>`}
function goldView(){
 goldStop();app.innerHTML=head('Питомец','Забота, наряд, живой фон и Золотой лоток')+'<div id="gold_app"><div class="card pad muted">Загружаем питомца и его рюкзак…</div></div>';
 // Экран готов сразу: иначе общий скелетон go() через 160 мс удалит #gold_app до ответа RPC.
 gmLoad();goldRefresh();
}
async function goldRefresh(){
 if(GOLD.loading)return;GOLD.loading=true;
 try{const r=await Promise.race([sb.rpc('pet_game_status'),new Promise((_,rej)=>setTimeout(()=>rej(new Error('Сервер отвечает слишком долго. Проверь соединение и попробуй ещё раз.')),12000))]);if(r.error)throw r.error;GOLD.st=r.data;goldPaint()}
 catch(e){const box=$('#gold_app');if(box)box.innerHTML=`<div class="card pad col"><b>Не удалось открыть приключение</b><div class="muted">${esc(e.message||e)}</div><button class="btn" id="gold_retry">Попробовать ещё раз</button></div>`;const b=$('#gold_retry');if(b)b.onclick=()=>goldRefresh()}
 finally{GOLD.loading=false}
}
function goldPaint(){
 const box=$('#gold_app');if(!box||!GOLD.st)return;
 if(GOLD.stamp!==GOLD.st){GOLD.stamp=GOLD.st;GOLD.stAt=Date.now()}
 clearInterval(GOLD.careTimer);GOLD.careTimer=0;
 box.innerHTML=goldTabs()+`<div class="gp-ticket">🎟 <b>${GOLD.st.tickets}</b></div>`;
 const body=GOLD.tab==='care'?goldCareHtml():GOLD.tab==='game'?goldGameHtml():GOLD.tab==='style'?'':goldAchHtml();box.insertAdjacentHTML('beforeend','<div id="gp_body">'+body+'</div>');
 box.querySelectorAll('[data-gold-tab]').forEach(b=>b.onclick=()=>{GOLD.tab=b.dataset.goldTab;goldPaint()});
 if(GOLD.tab==='care'){box.querySelectorAll('[data-care]').forEach(b=>b.onclick=()=>goldCare(b.dataset.care));goldCareClock();GOLD.careTimer=setInterval(goldCareClock,1000)}
 if(GOLD.tab==='game'){const b=$('#gold_start');if(b)b.onclick=()=>goldStart()}
 if(GOLD.tab==='style')gmPetTab(box.querySelector('#gp_body'));
}
const goldClock=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
function goldCareClock(){
 if(GOLD.tab!=='care'||!GOLD.st)return;const elapsed=(Date.now()-(GOLD.stAt||Date.now()))/1000;
 document.querySelectorAll('[data-care]').forEach(b=>{const a=b.dataset.care,left=Math.max(0,Math.ceil((GOLD.st.cooldowns?.[a]||0)-elapsed)),small=b.querySelector('[data-care-time]');b.disabled=GOLD.loading||left>0;if(small)small.textContent=left?`снова через ${goldClock(left)}`:small.dataset.desc||''});
}
function goldCareHtml(){
 const s=GOLD.st,food=s.care_level>=3?'🍰':s.care_level>=2?'🍪':'🍎',toy=s.care_level>=3?'🪁':'🧶';
 if(!goldCfg())return `<div class="card pad col gp-empty"><b>Сначала выбери питомца</b><div class="muted">После этого здесь появятся забота, игры и прокачка.</div><button class="btn" onclick="GOLD.tab='style';goldPaint()">Выбрать питомца</button></div>`;
 const stat=(ic,n,v)=>`<div class="gp-stat"><span>${ic} ${n}</span><b>${v}</b><div><i style="width:${v}%"></i></div></div>`;
 const btn=(a,ic,n,d)=>`<button data-care="${a}"><span>${ic}</span><b>${n}</b><small data-care-time="${a}" data-desc="${d}">${d}</small></button>`;
 return `${goldLevelHtml('care')}<div class="gp-care-scene"><div class="gp-sun"></div><div class="gp-hill"></div><div class="gp-care-pet">${goldPet(190)}</div><div class="gp-care-fx" id="gp_care_fx"></div><div class="gp-name">${esc((gmMe()?.cos||{}).pname||'Твой питомец')}</div></div>
 <div class="gp-stats">${stat('🍎','Сытость',s.hunger)}${stat('🫧','Чистота',s.hygiene)}${stat('💛','Настроение',s.mood)}</div>
 <div class="gp-care-actions">${btn('feed',food,'Покормить',s.care_level>=3?'Праздничный пирог':s.care_level>=2?'Свежее печенье':'Лесные яблоки')}${btn('wash','🫧','Умыть','Пена и блёстки')}${btn('play',toy,'Поиграть',s.care_level>=3?'Воздушный змей':'Любимая игрушка')}</div>
 <div class="gp-care-note">Опыт заботы: <b>${Math.min(9,s.care_actions)} / 9 действий сегодня</b>. ${s.care_actions>=9?'Сегодня весь опыт получен.':'Каждое действие даёт 8 опыта.'} <b>Кормление, умывание и игра доступны раз в 15 минут каждое.</b> Забота даёт до +10% очков в игре.</div>
 <div class="gp-next-unlock">${s.care_level<2?'На 2 уровне появится печенье и +1 билет':s.care_level<3?'На 3 уровне появятся пирог и воздушный змей':'Новые уровни заботы усиливают бонус в Золотом лотке'}</div>`;
}
function goldGameHtml(){
 const s=GOLD.st;
 if(!goldCfg())return `<div class="card pad col gp-empty"><b>Сначала выбери питомца</b><div class="muted">Выбери зверька во вкладке «Образ» — он будет старателем и сохранит в игре весь свой наряд.</div><button class="btn" onclick="GOLD.tab='style';goldPaint()">Выбрать питомца</button></div>`;
 return `${goldLevelHtml('gold')}${goldEnergyHtml()}${goldEventHtml()}<div class="gp-mine"><div class="gp-mine-lights"><i></i><i></i><i></i></div><div class="gp-mine-pet">${goldPet(135)}</div><div class="gp-pan-demo">〰️</div><div class="gp-mine-copy"><b>Золотой лоток</b><span>Двигай лоток, лови самоцветы и не хватай камни. Игра длится 30 секунд.</span></div></div>
 <button class="btn gp-start" id="gold_start">${s.energy?'Начать игру · −1 ⚡':'Энергия закончилась · к наставнику'}</button>
 <div class="gp-mentor-tip"><img src="stickers/gold/mentor.webp" alt="Наставник старателей"><div><b>Наставник старателей</b><span>Хороший старатель знает меру. Пять игр — и песок отправляется на просев, а ты — на отдых.</span></div></div>
 <div class="gp-collection-head"><b>Коллекция камней</b><span>${Object.keys(s.gems||{}).length} / 9 видов</span></div><div class="gp-collection">${GOLD_GEMS.map(([k,n],i)=>{const c=+(s.gems||{})[k]||0,ev=s.event&&s.event.gem===k;return `<div class="gp-gem ${c?'got':''} ${ev?'event':''}"><img src="stickers/gold/gem-${i+1}.svg" alt="${n}"><b>${n}</b><span>${ev?'✨ событие':c?c+' шт.':'ещё не найден'}</span></div>`}).join('')}</div>
 <div class="gp-game-meta"><span>Лучший результат: <b>${s.best}</b></span><span>Игр сыграно: <b>${s.games}</b></span><span>Бонус заботы: <b>+${s.care_bonus}%</b></span></div>`;
}
function goldAchHtml(){const got=new Set(GOLD.st.ach||[]);return `<div class="card pad gp-ach-summary"><b>Получено ${GOLD_ACH.filter(x=>got.has(x[0])).length} из ${GOLD_ACH.length}</b><div class="muted">Уровни старателя приносят билеты, а достижения остаются в этой коллекции.</div></div><div class="gp-ach">${GOLD_ACH.map(([c,ic,n,d])=>`<div class="gp-ach-row ${got.has(c)?'got':''}"><span>${got.has(c)?ic:'🔒'}</span><div><b>${n}</b><small>${d}</small></div><i>${got.has(c)?'✓':'—'}</i></div>`).join('')}</div>`}
function goldCareFx(action){
 const fx=$('#gp_care_fx'),pet=document.querySelector('.gp-care-pet');if(!fx||!pet)return;
 const food=GOLD.st.care_level>=3?'🍰':GOLD.st.care_level>=2?'🍪':'🍎',toy=GOLD.st.care_level>=3?'🪁':'🧶',hearts='<b class="gp-heart h1">♥</b><b class="gp-heart h2">♥</b><b class="gp-heart h3">♥</b>';
 fx.className='gp-care-fx on '+action;pet.classList.add('gp-fx-'+action);
 if(action==='feed')fx.innerHTML=`<i class="gp-food f1">${food}</i><i class="gp-food f2">${food}</i><i class="gp-food f3">${food}</i><b class="gp-mood-face">😋</b>${hearts}`;
 else if(action==='wash')fx.innerHTML='<i class="gp-foam"></i>'+Array.from({length:10},(_,i)=>`<i class="gp-bubble b${i+1}"></i>`).join('')+'<b class="gp-spark s1">✦</b><b class="gp-spark s2">✦</b><b class="gp-spark s3">✦</b>';
 else fx.innerHTML=`<i class="gp-toy">${toy}</i><i class="gp-toy-trail">✦</i>${hearts}`;
 clearTimeout(fx._timer);fx._timer=setTimeout(()=>{fx.className='gp-care-fx';fx.innerHTML='';pet.classList.remove('gp-fx-'+action)},1900);
}
async function goldCare(action){
 if(GOLD.loading)return;GOLD.loading=true;document.querySelectorAll('[data-care]').forEach(b=>b.disabled=true);
 try{const r=await sb.rpc('pet_care_action',{p_action:action});if(r.error)throw r.error;GOLD.st=r.data;goldPaint();goldCareFx(action);
  const gain=r.data.care_gain||0;if(r.data.care_reward){toast(`Новый уровень заботы! +${r.data.care_reward} билет(а) 🎟`,3200);try{dwParty()}catch(e){}}else toast((action==='feed'?'Вкусно!':action==='wash'?'Чистота и блеск!':'Как весело!')+(gain?` +${gain} опыта заботы`:' Забота засчитана'),1600)}
 catch(e){toast('Не получилось: '+(e.message||e),2600)}finally{GOLD.loading=false;goldCareClock()}
}
async function goldStart(){
 if(GOLD.run||GOLD.loading)return;if(!GOLD.st)await goldRefresh();if(GOLD.st&&GOLD.st.energy<1){goldTired();return}
 GOLD.loading=true;
 try{const r=await sb.rpc('gold_start');if(r.error)throw r.error;GOLD.st.energy=r.data.energy;GOLD.st.event=r.data.event||GOLD.st.event;GOLD.run={id:r.data.run,event:r.data.event||GOLD.st.event,score:0,gems:{},time:30,objects:[],tray:0,combo:0,last:performance.now(),spawn:0,finished:false};goldRunPaint()}
 catch(e){GOLD.loading=false;if(/энерг/i.test(e.message||''))goldTired();else toast('Не удалось начать: '+(e.message||e),2600);return}finally{GOLD.loading=false}
}
function goldRunPaint(){
 const box=$('#gold_app');if(!box||!GOLD.run)return;
 box.innerHTML=`<div class="gp-hud"><div><small>СЧЁТ</small><b id="gp_score">0</b></div><div><small>ВРЕМЯ</small><b id="gp_time">30</b></div><div><small>ЭНЕРГИЯ</small><b>⚡ ${GOLD.st.energy}</b></div></div><div class="gp-play" id="gp_play"><div class="gp-cave"></div><div class="gp-play-pet">${goldPet(112)}</div><div class="gp-falls" id="gp_falls"></div><div class="gp-tray" id="gp_tray"><i></i><span>〰</span></div><div class="gp-play-hint">Двигай лоток пальцем или мышью</div></div>`;
 const area=$('#gp_play');GOLD.run.tray=area.clientWidth/2;
 const move=e=>{if(!GOLD.run)return;const r=area.getBoundingClientRect(),x=Math.max(46,Math.min(r.width-46,e.clientX-r.left));GOLD.run.tray=x;$('#gp_tray').style.left=x+'px'};
 area.onpointerdown=e=>{area.setPointerCapture&&area.setPointerCapture(e.pointerId);move(e)};area.onpointermove=e=>{if(e.buttons||e.pointerType==='touch')move(e)};
 $('#gp_tray').style.left=GOLD.run.tray+'px';GOLD.run.raf=requestAnimationFrame(goldTick);
}
function goldSpawn(){
 const R=GOLD.run,area=$('#gp_play');if(!R||!area)return;const rock=Math.random()<.17;let idx=Math.min(8,Math.floor(Math.pow(Math.random(),1.8)*9));
 if(!rock&&R.event&&Math.random()<.22){const featured=GOLD_GEMS.findIndex(x=>x[0]===R.event.gem);if(featured>=0)idx=featured}
 const el=document.createElement(rock?'div':'img');if(rock){el.className='gp-rock';el.textContent='🪨'}else{el.className='gp-fall-gem';el.src=`stickers/gold/gem-${idx+1}.svg`;el.alt=GOLD_GEMS[idx][1]}
 const x=25+Math.random()*Math.max(30,area.clientWidth-50);el.style.left=x+'px';el.style.top='-70px';$('#gp_falls').appendChild(el);R.objects.push({el,x,y:-70,vy:150+Math.random()*115,rock,idx});
}
function goldTick(now){
 const R=GOLD.run;if(!R||R.finished)return;const dt=Math.min(.04,(now-R.last)/1000);R.last=now;R.time-=dt;R.spawn-=dt;if(R.spawn<=0){goldSpawn();R.spawn=.48+Math.random()*.24}
 const area=$('#gp_play');if(!area)return;const h=area.clientHeight;
 for(let i=R.objects.length-1;i>=0;i--){const o=R.objects[i];o.y+=o.vy*dt;o.el.style.top=o.y+'px';o.el.style.transform=`rotate(${o.y*(o.rock?.3:.8)}deg)`;
  if(o.y>h-120&&o.y<h-48&&Math.abs(o.x-R.tray)<68){
   if(o.rock){R.score=Math.max(0,R.score-25);R.combo=0;goldFloat(o.x,o.y,'−25','bad')}else{const g=GOLD_GEMS[o.idx];R.score+=g[2];R.combo++;R.gems[g[0]]=(R.gems[g[0]]||0)+1;goldFloat(o.x,o.y,'+'+g[2],'good')}
   o.el.remove();R.objects.splice(i,1);$('#gp_score').textContent=R.score;continue}
  if(o.y>h+60){o.el.remove();R.objects.splice(i,1)}}
 const te=$('#gp_time');if(te)te.textContent=Math.max(0,Math.ceil(R.time));
 if(R.time<=0){goldFinish();return}R.raf=requestAnimationFrame(goldTick);
}
function goldFloat(x,y,text,kind){const box=$('#gp_falls');if(!box)return;const e=document.createElement('b');e.className='gp-float '+kind;e.textContent=text;e.style.left=x+'px';e.style.top=y+'px';box.appendChild(e);setTimeout(()=>e.remove(),700)}
async function goldFinish(){
 const R=GOLD.run;if(!R||R.finished)return;R.finished=true;cancelAnimationFrame(R.raf);GOLD.loading=true;
 try{const r=await sb.rpc('gold_finish',{p_run:R.id,p_score:R.score,p_gems:R.gems});if(r.error)throw r.error;GOLD.st=r.data;GOLD.run=null;goldResult(r.data)}
 catch(e){GOLD.loading=false;R.finished=false;R.time=5;R.last=performance.now();toast('Результат не сохранился, продолжаем: '+(e.message||e),3000);R.raf=requestAnimationFrame(goldTick);return}finally{GOLD.loading=false}
}
function goldResult(d){
 const box=$('#gold_app');if(!box)return;const fresh=(d.newach||[]).map(goldAchDef);
 box.innerHTML=`<div class="gp-result"><div class="gp-result-glow">✨</div><div class="gp-kicker">ЛОТОК ЗАКРЫТ</div><h2>${d.score} очков</h2><div class="gp-result-pet">${goldPet(125)}</div><div class="gp-result-grid"><div><b>+${d.score}</b><span>опыта старателя</span></div><div><b>${d.new_level}</b><span>уровень</span></div><div><b>+${d.reward}</b><span>билетов за уровень</span></div></div>${d.event_reward?`<div class="gp-event-win">✨ Редкая находка в событии «${esc(d.event?.name||'Событие дня')}»: <b>+${d.event_reward} билета</b></div>`:''}${d.bonus?`<div class="gp-bonus">💛 Бонус заботы: +${d.bonus}%</div>`:''}${fresh.length?`<div class="gp-newach"><b>Новые достижения</b>${fresh.map(x=>`<span>${x[1]} ${x[2]}</span>`).join('')}</div>`:''}<button class="btn" id="gp_again">${GOLD.st.energy?'Ещё одна игра · −1 ⚡':'Что скажет наставник?'}</button><button class="btn ghost" id="gp_care">Вернуться к питомцу</button></div>`;
 $('#gp_again').onclick=()=>GOLD.st.energy?goldStart():goldTired();$('#gp_care').onclick=()=>{GOLD.tab='care';goldPaint()};
 if(d.reward||d.event_reward){toast(`Награды получены: +${(d.reward||0)+(d.event_reward||0)} билет(а) 🎟`,3000);try{dwParty()}catch(e){}}
 if(!GOLD.st.energy)GOLD.timer=setTimeout(()=>{if(!GOLD.run)goldTired()},2200);
}
function goldTired(){
 clearTimeout(GOLD.timer);document.querySelector('.gp-tired')?.remove();const ov=document.createElement('div');ov.className='gp-tired';
 ov.innerHTML=`<div class="gp-tired-card"><div class="gp-tired-sand"></div><div class="gp-tired-actors"><img class="gp-tired-mentor" src="stickers/gold/mentor.webp" alt="Наставник"><i class="gp-arm"></i><i class="gp-hand"></i><div class="gp-tired-pet">${goldPet(118)}</div></div><div class="gp-tired-speech"><b>Наставник старателей</b><p>«Ты устал, а у нас из-за тебя кончился песок. Ждём техников»</p></div><div class="gp-tired-note">⚡ Энергия восстанавливается по 1 единице каждые 20 минут. Питомец тоже рад передышке.</div><button class="btn" id="gp_rest">Пойти отдыхать</button></div>`;
 document.body.appendChild(ov);$('#gp_rest').onclick=()=>{ov.classList.add('out');setTimeout(()=>ov.remove(),350);GOLD.tab='care';goldRefresh()};
}
function goldStop(){cancelAnimationFrame(GOLD.raf);cancelAnimationFrame(GOLD.run?.raf||0);clearTimeout(GOLD.timer);clearInterval(GOLD.careTimer);GOLD.timer=0;GOLD.careTimer=0;GOLD.run=null;GOLD.loading=false;document.querySelector('.gp-tired')?.remove()}
VIEWS.pet=goldView;VIEWS.gold=goldView;
