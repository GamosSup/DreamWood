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
    if(!e.target.closest||!e.target.closest('.brand .lg'))return;
    clearTimeout(t);n++;t=setTimeout(()=>n=0,2200);
    if(n>=5){n=0;
      const m=document.createElement('img');m.src='stickers/mascot-balloon.webp';m.className='dwjump';m.alt='';document.body.appendChild(m);setTimeout(()=>m.remove(),1800);
      dwParty();toast(dwPick(L),3200)}
  });
})();
