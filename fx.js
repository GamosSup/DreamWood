// Живость: плашка-подсказка, конфетти, счётчики, плавная смена вкладок, Дримми в пустых местах, шутки, пасхалки
const dwReduced=()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}};
const dwPick=a=>a[Math.floor(Math.random()*a.length)];

// ---- плашка внизу: «Сохранено», «Готово» ----
function toast(msg,ms=2600){
  document.querySelectorAll('.dwt').forEach(x=>x.remove());
  const t=document.createElement('div');t.className='dwt';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300)},ms);
}

// ---- конфетти ----
function dwConfetti(x,y,n=26){
  if(dwReduced())return;
  const box=document.createElement('div');box.className='cfx';document.body.appendChild(box);
  const cols=['#F3C29B','#E6CC8F','#C9D4B0','#E8B4B8','#BCC8D6','#D3BFD0'];
  for(let i=0;i<n;i++){const p=document.createElement('i'),a=Math.random()*Math.PI*2,v=60+Math.random()*130;
    p.style.cssText=`left:${x}px;top:${y}px;background:${cols[i%cols.length]};--dx:${(Math.cos(a)*v).toFixed(0)}px;--dy:${(Math.sin(a)*v-80).toFixed(0)}px;--r:${(Math.random()*720-360).toFixed(0)}deg;animation-delay:${(Math.random()*90).toFixed(0)}ms`;
    box.appendChild(p)}
  setTimeout(()=>box.remove(),1800);
}
function dwParty(){const w=innerWidth,h=innerHeight;[.2,.5,.8].forEach((k,i)=>setTimeout(()=>dwConfetti(w*k,h*.35,34),i*160))}
// конфетти из места, где нажали (флажок, кнопка)
function dwBurstAt(el,n){if(!el)return dwParty();const r=el.getBoundingClientRect();dwConfetti(r.left+r.width/2,r.top+r.height/2,n||18)}

// ---- цифры «накручиваются» ----
function dwCount(root){
  if(dwReduced())return;
  root.querySelectorAll('.stat b,.cu').forEach(el=>{
    if(el.children.length)return;
    const t=el.textContent.trim();if(!/^\d[\d\s]*([.,]\d+)?$/.test(t))return;
    const dec=(t.split(/[.,]/)[1]||'').length,v=parseFloat(t.replace(/\s/g,'').replace(',','.'));
    if(!isFinite(v)||v===0)return;
    const t0=performance.now(),D=650;
    const step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);
      if(k<1){el.textContent=(v*e).toFixed(dec).replace('.',',');requestAnimationFrame(step)}else el.textContent=t};
    requestAnimationFrame(step)});
}

// ---- вкладка мягко выезжает при переходе ----
(function(){
  let tm=null;
  new MutationObserver(()=>{
    if(!S.swapPending||!app.children.length||app.querySelector('.sk'))return;
    S.swapPending=0;
    if(dwReduced())return;
    app.classList.add('swap');dwCount(app);
    clearTimeout(tm);tm=setTimeout(()=>app.classList.remove('swap'),900);
  }).observe(app,{childList:true});
})();

// ---- колокольчик покачивается, когда пришло новое ----
(function(){
  if(typeof paintBell!=='function')return;
  const orig=paintBell;let last=0;
  window.paintBell=function(){
    orig.apply(this,arguments);
    const tot=(S.unread||0)+(S.due||[]).length+(S.ckPending?1:0);
    if(tot>last&&last>=0&&!dwReduced()){const b=document.querySelector('.bell');if(b){b.classList.remove('ring');void b.offsetWidth;b.classList.add('ring');setTimeout(()=>b.classList.remove('ring'),1400)}}
    last=tot;
  };
})();

// ---- Дримми в пустых местах ----
const DR_EMPTY={
  tasks:['Дел нет. Даже Дримми завидует 😌','Тишина и порядок. Можно выпить чаю ☕','Список пуст. Придумай себе что-нибудь приятное 🍭','Пусто, как в парке в семь утра 🌅'],
  today:['На сегодня ничего не запланировано. Красота!','Свободный день? Дримми одобряет 👍','Чисто. Можно полюбоваться облаками ☁️'],
  done:['Всё сделано! Дримми хлопает ушами 👏','Ты просто космос! Всё закрыто 🚀','Ничего не осталось. Респект 🎉'],
  habits:['Привычек пока нет. Начни с самой маленькой: стакан воды 💧','Пока пусто. Одна привычка в день — и ты уже герой 🦸','Заведи первую привычку, Дримми будет болеть за тебя 📣'],
  search:['Ничего не нашлось. Дримми искал даже под лавочкой 🔍','Пусто. Может, попробовать другое слово?','Не нашёл. Дримми пожимает плечами 🤷'],
  thanks:['Пока никто никого не поблагодарил. Будь первым! 💛','Здесь будут тёплые слова. Скажи первое спасибо 🌟'],
  q:['Вопросов пока нет. Спрашивать не стыдно, все когда-то были новичками 🌱'],
  any:['Здесь пока пусто. Дримми тоже ждёт 🍃','Пока ничего нет 🌿']
};
function dEmpty(kind,sub){
  const t=dwPick(DR_EMPTY[kind]||DR_EMPTY.any);
  return `<div class="dremp"><img src="stickers/${dwPick(['mascot-hi','mascot-balloon'])}.webp" alt="" width="64" height="64" loading="lazy"><div><b>${esc(t)}</b>${sub?`<div class="muted">${sub}</div>`:''}</div></div>`;
}

// ---- «Совет дня от Дримми» ----
const DR_JOKES=[
 'Улыбка — самый дешёвый аттракцион в парке. Раздавай бесплатно 😊',
 'Если гость спрашивает, где туалет, а ты не знаешь, это шанс прогуляться вместе 🚶',
 'Хороший перерыв — это когда ноги скажут тебе спасибо 👟',
 'Вода — тоже ротация: меняй бутылку на каждом перерыве 💧',
 'Если день не задался, вспомни: у карусели тоже бывает плохой круг 🎠',
 'Не бойся спрашивать. Даже у Дримми было первое «а как тут вообще?» 🌱',
 'Лучший стикер для настроения — тот, что ты подаришь коллеге 💛',
 'Смена как мороженое: тает быстро, поэтому наслаждайся 🍦',
 'Ты тут не просто работаешь. Ты делаешь детям лето в любой сезон ☀️',
 'Когда сомневаешься, спроси наставника. Когда не сомневаешься, всё равно спроси 😄',
 'Пять минут тишины — тоже важное оборудование смены 🎧',
 'Записал дело в блокнот — освободил место в голове для хороших мыслей 📝',
 'Маленькая привычка каждый день сильнее большой раз в месяц 🌳',
 'Если гость смеётся, ты всё делаешь правильно 🎈',
 'Сегодня отличный день, чтобы сказать коллеге «спасибо» 🙌',
 'Тёплая куртка и сухие носки — лучшие друзья осенней смены 🍂',
 'Не знаешь, что делать? Улыбнись и спроси, чем помочь 🌟',
 'Аттракцион работает, пока работает команда. А команда — это ты 🤝'
];
const dayJoke=(skip)=>{const d=new Date(),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/864e5);let i=(n*3+d.getFullYear())%DR_JOKES.length;if(skip!=null){do{i=Math.floor(Math.random()*DR_JOKES.length)}while(DR_JOKES[i]===skip)}return DR_JOKES[i]};

// ---- пасхалка: пять нажатий на логотип ----
(function(){
  let n=0,t=0;
  const L=['Дримми подпрыгнул от радости! 🎈','Ты нашёл секрет! Дримми тебе подмигивает 😉','Ура! Ты наш человек 🌟','Бонус: +100 к настроению 🎉','Тссс… никому не говори, что Дримми умеет прыгать 🤫'];
  document.addEventListener('click',e=>{
    const nv=e.target&&e.target.closest&&e.target.closest('#navlogo');if(nv&&window.gmAboutPark){gmAboutPark();return}
    if(!e.target.closest||!e.target.closest('.brand .lg'))return;
    clearTimeout(t);clearTimeout(window.__abt);n++;t=setTimeout(()=>n=0,2200);if(n===1)window.__abt=setTimeout(()=>{if(n===1&&window.gmAboutPark)gmAboutPark()},700);
    if(n>=5){n=0;
      const m=document.createElement('img');m.src='stickers/mascot-balloon.webp';m.className='dwjump';m.alt='';document.body.appendChild(m);setTimeout(()=>m.remove(),1800);
      dwParty();toast(dwPick(L),3200);window.gmClaim&&gmClaim('egg')}
  });
})();

// ---- «Заметки Дримми»: каждый день новые совет, шутка и мини-вызов ----
const DR_TIPS=[
 'Перед сменой выпей стакан воды. Ноги и голова скажут спасибо 💧',
 'Первое, что видит гость, — твоя улыбка. Остальное он простит 😊',
 'Не знаешь ответа? Скажи «Сейчас уточню» и уточни. Так делают профи 🌟',
 'Если стоишь на одном месте, меняй опору с ноги на ногу и разминай плечи каждые полчаса 🧘',
 'Запиши вечером три дела на завтра. Утром голова будет свободнее 📝',
 'На перерыве сядь по-настоящему и убери телефон хотя бы на пять минут 🪑',
 'Проверь рацию и бейдж до того, как вышел на точку 🎧',
 'Если ребёнок потерялся, оставайся на месте, говори спокойно и сразу зови старшего 🧸',
 'Дождь в парке — не плохая погода, а другая смена. Сухие носки в рюкзак ☔',
 'Спасибо коллеге занимает минуту, а греет неделю. Загляни в «Благодарности» 💛',
 'О мелкой поломке лучше сообщить сейчас, чем о большой потом 🛠',
 'Запоминай имена детей. Это работает лучше любого сувенира 🎈',
 'Холодно? Несколько слоёв одежды лучше одной толстой куртки 🧥',
 'Попроси наставника оценить твою смену: одна фраза растит быстрее месяца догадок 🌱',
 'Устал — это не слабость. Скажи старшему, тебя подменят ✋',
 'Читай памятки по аттракционам в базе знаний, пока едешь на работу 📚',
 'Привычка из одного шага живёт дольше, чем из десяти. Начни с малого 🔥',
 'Перед закрытием оглянись на точку и сделай то, что хотел бы найти утром 🧹',
 'Гость злится? Выслушай до конца, потом отвечай. Слово «понимаю» решает половину 🤝',
 'Береги голос: тёплая вода лучше кофе, если много говоришь 🍵',
 'Хороший день начинается с плана на три дела, а не на тридцать 🎯',
 'Загляни в график на неделю вперёд: так проще планировать свои дела 📅',
 'Плохая связь на точке? Открой ротацию заранее, приложение её запомнит 📲',
 'Выдохни, улыбнись и расправь плечи. Через минуту всё выглядит проще 🌬'
];
const DR_JOKES2=[
 '— Сколько кругов у карусели? — Столько, сколько билетов 🎠',
 'Горка сказала качелям: «Ты вечно туда-сюда». «Зато я всегда на подъёме!» — ответили качели 🛝',
 'Воздушный шарик сказал облаку: «Я лёгкий на подъём!» 🎈',
 'Что сказал ёжик, прокатившись с горки? «Колючее удовольствие!» 🦔',
 'Почему мороженое любит парк? Здесь все тают от радости 🍦',
 'Колесо обозрения — единственная работа, где все ходят по кругу, и всем нравится 🎡',
 'Если в парке тихо, это не тишина, это дети набираются сил 😅',
 'Рация — единственный друг, который всегда отвечает, но не всегда по делу 📻',
 'Осенью листья сами делают аттракцион «Хруст»: бесплатно и без очереди 🍂',
 'Лазертаг учит главному: чем ниже пригнёшься, тем выше шансы на победу… и на радикулит 😄',
 'У Дримми села батарейка, и он пошёл на подзарядку к кофе ☕',
 'Единственная очередь, которую мы любим, — на чай в перерыв 🍵',
 'Снеговик в парке тает от комплиментов. Берегите снеговиков ⛄',
 'Самый быстрый аттракцион в парке — перерыв: начинается медленно, кончается мгновенно ⏱',
 'Чем понедельник отличается от горки? С горки хотя бы весело спускаться 😄',
 'Мороженщик не расстраивается, когда холодно. Он просто ждёт своего часа 🍨',
 'Если бы у смены был рейтинг, у неё были бы пять звёзд, по одной за каждую улыбку 🌟',
 'Дримми попробовал сесть на диету, но его остановили пончики. Парк большой, соблазнов много 🍩',
 'Хороший сотрудник парка видит всё, слышит всё и всё равно улыбается 😎',
 'Любимая песня Дримми — «Ещё один круг!» 🎶'
];
const DR_QUESTS=[
 'Улыбнись первому гостю раньше, чем он улыбнётся тебе',
 'Скажи коллеге одно доброе слово',
 'Выпей воды на каждом перерыве',
 'Прочитай одну памятку в базе знаний',
 'Запиши в блокнот три дела на завтра',
 'Помоги коллеге с чем-нибудь без просьбы',
 'Узнай имя того, с кем ещё не знаком в команде',
 'Сделай пятиминутную разминку',
 'Наведи порядок на точке так, как хотел бы увидеть утром',
 'Поблагодари кого-нибудь в «Благодарностях»',
 'Перед сложным гостем сделай три глубоких вдоха',
 'Отметь сегодня все свои привычки',
 'Задай один вопрос наставнику или старшему',
 'Вспомни хорошее, что случилось сегодня, и расскажи кому-нибудь',
 'Выйди на свежий воздух на перерыве минимум на пять минут',
 'Подбодри того, кто выглядит уставшим',
 'Загляни в график на следующую неделю',
 'Убери рабочее место за две минуты'
];
function dayNotes(){
  const d=new Date(),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/864e5)+d.getFullYear()*7;
  return {tip:DR_TIPS[(n*5)%DR_TIPS.length],joke:DR_JOKES2[(n*3+1)%DR_JOKES2.length],quest:DR_QUESTS[(n*5+2)%DR_QUESTS.length],key:'dw-q:'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
}
function dayNotesCard(){
  const x=dayNotes();let dn=false;try{dn=localStorage.getItem(x.key)==='1'}catch(e){}
  return `<div class="card pad col dnote"><div style="display:flex;gap:10px;align-items:center"><img src="stickers/mascot-hi.webp" alt="" width="44" height="44" style="object-fit:contain"><div style="flex:1"><b>📓 Заметки Дримми</b><div class="muted">Каждый день новые</div></div></div>
  <div class="dnr"><span>💡</span><div>${esc(x.tip)}</div></div><div class="dnr"><span>😄</span><div>${esc(x.joke)}</div></div>
  <div class="dnr q ${dn?'on':''}" id="dn_q" role="button" tabindex="0"><span class="dnb">${dn?'✓':''}</span><div><b>Вызов дня:</b> ${esc(x.quest)}</div></div></div>`;
}
function dayNotesBind(){
  const q=document.getElementById('dn_q');if(!q)return;
  const f=()=>{const k=dayNotes().key,on=!q.classList.contains('on');q.classList.toggle('on',on);q.querySelector('.dnb').textContent=on?'✓':'';try{localStorage.setItem(k,on?'1':'0')}catch(e){}if(on){dwBurstAt(q.querySelector('.dnb'),18);toast(dwPick(['Вызов принят и выполнен! 🏅','Дримми гордится тобой 🌟','Так держать! 🙌']))}};
  q.onclick=f;q.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}};
}
