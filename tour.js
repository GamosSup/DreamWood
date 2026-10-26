// Обучение при первом входе: короткая экскурсия по приложению (показывается один раз на устройстве, потом — в Настройках)
(function(){
const KEY=()=>'dw-tour1:'+(S.me&&S.me.id||'');
const seen=()=>{try{return !!localStorage.getItem(KEY())}catch(e){return !!S.tourSeen}};
const mark=()=>{S.tourSeen=1;try{localStorage.setItem(KEY(),String(Date.now()))}catch(e){}};
function steps(){
  const L=[
    {img:'mascot-hi.webp',t:'Добро пожаловать в Дримвуд!',d:'Это рабочее приложение команды парка. Здесь ротации, график, заявки, чек-листы смен, новости и всё, что нужно в течение дня. Покажем главное за минуту.'},
    {img:'sun.svg',t:'🏠 Сегодня',d:'Главный экран: где ты стоишь сегодня и завтра, твой статус дня, свежая новость, заявки и дела. Утром здесь же кнопка «Я на смене» — нажми её, когда вышел на работу.'},
    {img:'rainbow.svg',t:'🔄 Ротации',d:'Расстановка по зонам и перерывы на любой день. Когда выходит ротация на завтра, приходит уведомление. Свою смену подсвечиваем.'},
    {img:'moon.svg',t:'📅 График',d:'Твой месяц: рабочие дни, отгулы, отпуск, больничные. Нажми на день — выбери отметку или оформи заявку. Часы за месяц считаются сами.'},
    {img:'balloon.svg',t:'📨 Обращения',d:'Заявки на отгул и обмен сменами, поломки, происшествия и списание. К любому обращению можно приложить фото или видео, а ответ придёт уведомлением.'},
    {img:'star.svg',t:'✅ Смена',d:'Чек-листы открытия и закрытия зон. Отмечай пункты по ходу дела: коллеги видят, кто и во сколько открыл или закрыл локацию.'},
    {img:'leaf.svg',t:'☰ Ещё',d:'В разделе «Ещё» новости и афиша, база знаний с регламентами, телефоны команды, твой блокнот и обратная связь. Идею или вопрос можно отправить прямо оттуда.'},
    {img:'bird.webp',t:'🔔 Уведомления',d:'Колокольчик вверху собирает всё важное. Чтобы сообщения приходили на телефон, даже когда приложение закрыто, включи уведомления. Это же нужно для экстренных оповещений.',notify:1}
  ];
  if(canMng())L.splice(7,0,{img:'burst.webp',t:'👑 Для руководителей',d:'Тебе доступна «График и сводка»: все сотрудники по дням, часы, переработки и выгрузка в Excel.'+(isManager()?' Есть раздел «Задачи», а в «Ещё» и на экране «Сегодня» — кнопка «Тревога»: предупредить всех сотрудников сразу, со звуком и вибрацией.':'')});
  L.push({img:'thumb.webp',t:'Готово!',d:'Если что-то непонятно, загляни в «Ещё → База знаний» или напиши в «Обратную связь». Это обучение всегда можно открыть заново: «Ещё → Настройки».'});
  return L;
}
function start(){
  if(document.getElementById('tour'))return;
  const L=steps();let i=0;
  const ov=document.createElement('div');ov.id='tour';ov.className='tour';document.body.appendChild(ov);document.body.style.overflow='hidden';
  const done=()=>{mark();ov.remove();document.body.style.overflow='';try{window.go&&S.tab==='today'&&go('today')}catch(e){}};
  function paint(dir){
    const s=L[i],last=i===L.length-1;
    ov.innerHTML=`<div class="tcard ${dir||''}"><button class="tskip" id="t_skip" ${last?'hidden':''}>Пропустить</button>
      <img class="timg" src="stickers/${s.img}" alt="" width="132" height="132"><h2>${s.t}</h2><p>${s.d}</p>
      ${s.notify?'<div id="t_nb"><button class="btn ghost" id="t_notify">🔔 Включить уведомления</button><div class="muted" id="t_nm"></div></div>':''}
      <div class="tdots">${L.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
      <div class="two"><button class="btn ghost" id="t_back" ${i?'':'hidden'}>← Назад</button><button class="btn" id="t_next">${last?'Начать работу':'Далее →'}</button></div></div>`;
    ov.querySelector('#t_skip').onclick=done;
    ov.querySelector('#t_back').onclick=()=>{i--;paint('back')};
    ov.querySelector('#t_next').onclick=()=>last?done():(i++,paint('fwd'));
    const nb=ov.querySelector('#t_notify');
    if(nb)nb.onclick=async()=>{const m=ov.querySelector('#t_nm');nb.disabled=true;
      try{if(typeof pushSupported==='function'&&!pushSupported())throw new Error(typeof pushIOSweb==='function'&&pushIOSweb()?'На iPhone сначала добавь сайт на экран «Домой» (Поделиться → На экран «Домой»), открой его оттуда и включи уведомления в «Ещё → Настройки».':'Этот браузер не поддерживает уведомления.');
        await pushEnable();nb.textContent='✅ Уведомления включены';m.textContent=''}
      catch(e){nb.disabled=false;m.textContent=e&&e.message||'Не получилось включить — это можно сделать позже в «Ещё → Настройки».'}};
  }
  paint();
}
window.tourStart=start;
window.tourMaybe=()=>{if(!S.me||S.me.status!=='approved'||seen())return;setTimeout(()=>{if(S.me&&!seen()&&!document.getElementById('alov'))start()},900)};
})();
