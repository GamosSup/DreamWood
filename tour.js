// Интерактивное обучение-игра при первом входе: подсвечивает настоящие кнопки приложения, человек нажимает их сам, за каждый шаг получает ⭐, в конце — награда.
(function(){
const KEY=()=>'dw-tour2:'+(S.me&&S.me.id||'');
const seen=()=>{try{return !!localStorage.getItem(KEY())}catch(e){return !!S.tourSeen}};
const mark=()=>{S.tourSeen=1;try{localStorage.setItem(KEY(),String(Date.now()))}catch(e){}};
const vis=el=>{if(!el||el.closest('#tour'))return false;const r=el.getBoundingClientRect();if(r.width<4||r.height<4)return false;const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'&&!el.closest('[hidden]')};
const find=sels=>{for(const s of [].concat(sels||[])){for(const el of document.querySelectorAll(s))if(vis(el))return el}return null};
function build(){
  const L=[
    {intro:1,img:'pushok.webp',t:'Добро пожаловать в Дримвуд! 🌲',d:'Я Пушок, твой проводник и помощник. Покажу все разделы, которые доступны твоей роли: жми на подсвеченные кнопки и собирай ⭐. Если что-то забудешь, квест можно повторить в настройках.',btn:'Начать знакомство 🎮'},
    {sel:'.bell',t:'Колокольчик',d:'Сюда прилетают ротации, ответы на заявки и события парка. Нажми на колокольчик!',tap:1},
    {sel:'#bk',t:'Это твоя почта',d:'Новое подсвечено цветом, а красная цифра показывает количество непрочитанных. Закрой окно кнопкой «←».',tap:1},
    {sel:'.gmc',skipIfNone:1,t:'Твой уровень',d:'Очки приходят за реальные дела: чек-листы, выход на смену, благодарности и привычки. Они открывают уровни, значки и оформление.',btn:'Круто!'},
    {sel:'#dqbox',skipIfNone:1,t:'Сегодня и задания дня',d:'Здесь начинается день: отметка на смене, твоя ротация, новости и пять ежедневных заданий. Они засчитываются автоматически после нужных действий.',btn:'Понятно'},
    {sel:'#cmp_help',skipIfNone:1,t:'Пушок всегда рядом',d:'Нажми на меня в любой вкладке — помогу найти раздел. А если зажать меня и потянуть, можно передвинуть кнопку помощи в удобное место.',btn:'Буду знать'},
    {sel:'nav [data-tab=rot]',t:'Ротации',d:'Нажми «Ротации»: где ты стоишь сегодня, завтра и в любой другой день.',tap:1},
    {t:'Ротация по времени',d:'Здесь зоны, команда и перерывы в хронологическом порядке. Своя смена подсвечена; дату можно менять на календаре сверху.',btn:'Понятно'},
    {sel:'nav [data-tab=sch]',t:'Мой график',d:'Открой свой месяц и все отметки.',tap:1},
    {t:'Дни и часы',d:'Нажми на день, чтобы выбрать отгул, отпуск или больничный, оформить заявку и записать доработку. Часы за месяц считаются сами.',btn:'Понятно'},
    {sel:'nav [data-tab=ap]',t:'Обращения',d:'Всё, что нужно сообщить или о чём попросить, собрано здесь.',tap:1},
    {sel:'.subbar',t:'Пять видов обращений',d:'Заявки и обмен сменами, Поломки, Происшествия, Списание и личное сообщение. Можно приложить фото или видео, ответ придёт уведомлением.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Ещё',d:'В «Ещё» находятся остальные разделы и поиск по ним. Открой меню!',tap:1},
    {sel:['[data-go=shift]','nav [data-tab=shift]'],t:'Чек-листы смены',d:'Открой «Смена»: здесь открытие и закрытие зон.',tap:1},
    {t:'Отмечай по ходу дела',d:'Каждая отметка приносит очки и засчитывает задание дня. Команда видит, кто и когда выполнил пункт, а прогресс зоны виден сразу.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Новости парка',d:'Снова открой «Ещё».',tap:1},
    {sel:['[data-go=park]','nav [data-tab=park]'],t:'Парк и афиша',d:'Здесь новости команды, объявления и афиша событий. Открой раздел!',tap:1},
    {sel:'.subbar',skipIfNone:1,t:'Новости и события',d:'Переключайся между новостями и афишей: важные события также появляются на экране «Сегодня».',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'База знаний',d:'Вернись в «Ещё».',tap:1},
    {sel:['[data-go=kb]','nav [data-tab=kb]'],t:'Инструкции и личные файлы',d:'Открой «Базу знаний»: регламенты, памятки по аттракционам, правила, а также твои файлы и папки.',tap:1},
    {t:'Быстрый поиск',d:'Ищи по названию и категории. Закреплённые материалы всегда сверху, а личными файлами можно поделиться с коллегами.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Личный блокнот',d:'Открой «Ещё» для следующего раздела.',tap:1},
    {sel:['[data-go=todo]','nav [data-tab=todo]'],t:'Мой блокнот',d:'Дела, подзадачи, дедлайны, события, теги и привычки — всё в одном личном месте.',tap:1},
    {sel:'.nbt',skipIfNone:1,t:'День, привычки и все дела',d:'Добавляй записи, отмечай привычки и следи за сериями. Календарь показывает дела вместе с графиком. Блокнот видишь только ты.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Журнал настроения',d:'Снова открой «Ещё».',tap:1},
    {sel:['[data-go=mood]','nav [data-tab=mood]'],t:'Как ты себя чувствуешь?',d:'Открой личный журнал настроения.',tap:1},
    {sel:'.mood-cal',skipIfNone:1,t:'Настроение по дням',d:'Выбирай любой месяц и год, нажимай на прошедшую дату и добавляй запись задним числом. График и среднее настроение видны сверху.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Благодарности',d:'Открой «Ещё».',tap:1},
    {sel:['[data-go=thanks]','nav [data-tab=thanks]'],t:'Сказать спасибо',d:'Здесь можно поблагодарить коллегу словами и стикером. Открой «Благодарности»!',tap:1},
    {t:'Добрые дела видны',d:'Благодарность появится у коллеги и в общей ленте, а в «Молодцы недели» собираются командные результаты.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Команда',d:'Снова открой «Ещё».',tap:1},
    {sel:['[data-go=team]','nav [data-tab=team]'],t:'Коллеги и контакты',d:'Найди человека по имени, посмотри команду и позвони прямо из приложения.',tap:1},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Первая неделя',d:'Для новичков здесь есть отдельный маршрут. Открой «Ещё».',tap:1},
    {sel:['[data-go=newbie]','nav [data-tab=newbie]'],skipIfNone:1,t:'Первая неделя в Дримвуд',d:'Чек-лист новичка, наставник и важные вопросы помогут освоиться. Отмечай готовые шаги — прогресс сохраняется.',tap:1},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Профиль и питомец',d:'Теперь самое интересное — открой «Ещё»!',tap:1},
    {sel:['[data-go=game]','nav [data-tab=game]'],t:'Мой профиль',d:'Здесь уровень, достижения, коллеги, автомат и твой личный питомец. Заходи!',tap:1},
    {sel:'[data-gt=pet]',t:'Мой питомец',d:'Выбери лисёнка, мишку, зайку или дракончика. Нажми «Мой питомец»!',tap:1},
    {sel:['.petch','.petpv'],t:'Познакомься с питомцем',d:'Нажми на зверька. Он реагирует на касания, следит глазами и радуется вниманию.',tap:1},
    {sel:'[data-gt=look]',t:'Образ и живой фон',d:'Открой «Мой образ»: цвет шерсти, аксессуары и слои 2.5D-фона настраиваются под твой вкус.',tap:1},
    {t:'Студия фона',d:'Меняй время, погоду, декорации и расположение слоёв. Выбранный фон появится и вверху твоего профиля.',btn:'Красота!'},
    {sel:'[data-gt=gx]',t:'Автомат с вещами',d:'За достижения и ежедневные награды ты получаешь билеты. Здесь их можно обменять на вещи для питомца и оформление.',tap:1},
    {sel:'[data-gt=ach]',t:'Достижения',d:'Все твои значки живут здесь. Новые появляются автоматически после достижений.',tap:1},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Обратная связь',d:'Осталось несколько полезных разделов. Открой «Ещё».',tap:1},
    {sel:['[data-go=feedback]','nav [data-tab=feedback]'],skipIfNone:1,t:'Предложить идею',d:'Здесь можно предложить улучшение или сообщить, что в приложении что-то не работает.',tap:1},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Настройки',d:'Последнее общее меню — «Настройки».',tap:1},
    {sel:['[data-go=set]','nav [data-tab=set]'],t:'Профиль и оформление',d:'Здесь фото, телефон, пароль, уведомления, тема и повтор этого обучения. Нажми «Настройки».',tap:1},
    {sel:'#pushbox',t:'Уведомления на телефон',d:'Включи их, чтобы получать новости и экстренные оповещения даже при закрытом приложении:',notify:1,btn:'Дальше'},
    {sel:'nav [data-tab=today]',t:'Домой',d:'Вернись на главный экран «Сегодня».',tap:1}
  ];
  if(typeof isManager==='function'&&isManager()){
    L.push({sel:'#td_alert',t:'Кнопка «Тревога»',d:'Только для руководителей: предупреждает всех сотрудников со звуком и вибрацией. Сейчас не нажимай — это просто знакомство.',btn:'Понятно'});
    L.push({sel:'.quiet-panel',skipIfNone:1,t:'Тихая панель смены',d:'Сводка без лишнего шума: кто на смене, сколько зон открыто, прогресс чек-листов и заявки, требующие решения.',btn:'Удобно'});
    L.push({sel:['nav [data-tab=dg]','[data-go=dg]'],t:'DreamGile',d:'Открой командные задачи: доски, ответственные, сроки, вложения, история и повторяющиеся поручения.',tap:1});
    L.push({t:'Работа с задачами',d:'Создавай задачи, назначай исполнителей, меняй колонки и приоритеты. Заявки техникам и архив находятся в этом же разделе.',btn:'Понятно'});
  }
  if(typeof canMng==='function'&&canMng()){
    L.push({sel:'nav [data-tab=more]',skipIfNone:1,t:'График команды',d:'Для руководителей открой «Ещё».',tap:1});
    L.push({sel:['nav [data-tab=grid]','[data-go=grid]'],t:'График и сводка',d:'Все сотрудники по дням, часы, доработки и выгрузка в Excel.',tap:1});
    L.push({sel:'.gmode',skipIfNone:1,t:'Два представления',d:'«График» помогает менять отметки по дням, «Сводка» — сравнивать часы и отсутствия. Фильтры и поиск находятся сверху.',btn:'Понятно'});
    L.push({sel:'nav [data-tab=more]',skipIfNone:1,t:'Пакетная выдача',d:'Теперь открой профиль через «Ещё».',tap:1});
    L.push({sel:['[data-go=game]','nav [data-tab=game]'],t:'Допуски и достижения',d:'Открой «Мой профиль» для управления выдачей.',tap:1});
    L.push({sel:'[data-gt=mng]',t:'Выдать несколько сразу',d:'Нажми «Выдать»: можно выбрать нескольких сотрудников и несколько допусков одним действием.',tap:1});
    L.push({sel:'#gm_items',skipIfNone:1,t:'Быстрый выбор групп',d:'Кнопки «Все», «Руководители», «Сотрудники» и команды выбирают людей сразу. Каталог собирает допуски из ротаций и базы знаний.',btn:'Всё понятно'});
  }
  L.push({done:1});
  return L;
}
function start(){
  if(document.getElementById('tour'))return;
  const L=build(),total=L.length-1;let i=-1,stars=0,tok=0,target=null,rafId=0,off=null;
  if(window.S&&S.tab!=='today'&&window.go)go('today');
  const ov=document.createElement('div');ov.id='tour';ov.innerHTML=`<div class="tdim"></div><div class="tring" hidden></div><div class="tfinger" hidden>👆</div>
    <div class="thud"><span class="tstar">⭐ <b id="t_st">0</b></span><span class="tbar"><i id="t_bar"></i></span></div><div class="tbub" hidden></div>`;
  document.body.appendChild(ov);
  const dim=ov.querySelector('.tdim'),ring=ov.querySelector('.tring'),fin=ov.querySelector('.tfinger'),bub=ov.querySelector('.tbub');
  const close=()=>{mark();cancelAnimationFrame(rafId);if(off)document.removeEventListener('click',off,true);ov.remove();try{if(window.go&&S.tab==='today')go('today')}catch(e){}setTimeout(()=>{S.gmPetShown=0;window.gmPopups&&gmPopups()},900)};
  // подсветка: тёмный слой с «дыркой» вокруг нужной кнопки (клики проходят только через дырку)
  let last='';
  function frame(){
    rafId=requestAnimationFrame(frame);
    if(!target||!document.contains(target)||!vis(target)){if(last!=='none'){last='none';dim.style.clipPath='';ring.hidden=true;fin.hidden=true}return}
    const r=target.getBoundingClientRect(),p=6,x1=Math.max(0,r.left-p),y1=Math.max(0,r.top-p),x2=Math.min(innerWidth,r.right+p),y2=Math.min(innerHeight,r.bottom+p),key=[x1,y1,x2,y2].map(Math.round).join();
    if(key===last)return;last=key;
    const W=innerWidth,H=innerHeight;
    dim.style.clipPath=`polygon(evenodd,0 0,${W}px 0,${W}px ${H}px,0 ${H}px,0 0,${x1}px ${y1}px,${x1}px ${y2}px,${x2}px ${y2}px,${x2}px ${y1}px,${x1}px ${y1}px,0 0)`;
    Object.assign(ring.style,{left:x1+'px',top:y1+'px',width:(x2-x1)+'px',height:(y2-y1)+'px'});ring.hidden=false;
    const below=y2+130<H;fin.hidden=!L[i]||!L[i].tap;fin.textContent=below?'👆':'👇';fin.style.left=((x1+x2)/2-14)+'px';fin.style.top=(below?y2+2:y1-40)+'px';
    place(x1,y1,x2,y2);
  }
  function place(x1,y1,x2,y2){
    if(bub.hidden)return;const h=bub.offsetHeight,H=innerHeight;let top;
    if(x1==null){top=Math.max(12,H-h-110)}else if(y2+h+150<H)top=y2+(L[i]&&L[i].tap?46:14);else if(y1-h-60>60)top=y1-h-(L[i]&&L[i].tap?50:14);else top=Math.max(70,H-h-110);
    bub.style.top=top+'px';
  }
  function paintHud(){ov.querySelector('#t_st').textContent=stars;ov.querySelector('#t_bar').style.width=Math.min(100,Math.round(Math.max(0,i)/total*100))+'%'}
  async function show(n){
    const my=++tok;if(off){document.removeEventListener('click',off,true);off=null}
    i=n;const s=L[i];paintHud();target=null;last='';
    if(s.done)return reward();
    if(s.intro){target=null;dim.style.clipPath='';ring.hidden=true;fin.hidden=true;return card(s)}
    if(s.sel){
      bub.hidden=true;ring.hidden=true;fin.hidden=true;
      let el=null;for(let k=0;k<(s.skipIfNone?3:35)&&my===tok;k++){el=find(s.sel);if(el)break;await new Promise(r=>setTimeout(r,100))}
      if(my!==tok)return;
      if(!el){if(s.skipIfNone)return show(i+1);target=null;return card({...s,tap:0,btn:s.btn||'Дальше'})}
      const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-90)el.scrollIntoView({block:'center'});
      target=el;
    }
    card(s);
    if(s.tap&&target){
      off=e=>{if(target&&target.contains(e.target)){document.removeEventListener('click',off,true);off=null;setTimeout(()=>win(my),380)}};
      document.addEventListener('click',off,true);
    }
  }
  function win(my){if(my!==tok)return;stars++;paintHud();const st=document.createElement('div');st.className='tpop';st.textContent='+1 ⭐';ov.appendChild(st);setTimeout(()=>st.remove(),900);show(i+1)}
  function card(s){
    bub.hidden=false;
    bub.innerHTML=`<img class="tmas" src="stickers/${s.img||'pushok.webp'}" alt="Пушок" width="${s.intro?110:54}" height="${s.intro?110:54}"><div class="tbt"><b>${s.t}</b><p>${s.d}</p>
      ${s.notify?'<button class="btn ghost" id="t_notify">🔔 Включить уведомления</button><div class="muted" id="t_nm"></div>':''}
      ${s.tap?'<div class="tpulse">👆 Нажми на подсвеченную кнопку</div>':`<button class="btn" id="t_next">${s.btn||'Дальше'}</button>`}<button class="tskip" id="t_skip">Пропустить обучение</button></div>`;
    bub.querySelector('#t_skip').onclick=close;
    bub.classList.toggle('intro',!!s.intro);
    const nx=bub.querySelector('#t_next');if(nx)nx.onclick=()=>{stars++;paintHud();show(i+1)};
    const nb=bub.querySelector('#t_notify');
    if(nb)nb.onclick=async()=>{const m=bub.querySelector('#t_nm');nb.disabled=true;
      try{if(typeof pushSupported==='function'&&!pushSupported())throw new Error(typeof pushIOSweb==='function'&&pushIOSweb()?'На iPhone сначала добавь сайт на экран «Домой» (Поделиться → На экран «Домой»), открой его оттуда и включи уведомления здесь.':'Этот браузер не поддерживает уведомления.');
        await pushEnable();nb.textContent='✅ Уведомления включены';m.textContent=''}
      catch(e){nb.disabled=false;m.textContent=e&&e.message||'Не получилось включить — это можно сделать позже в «Ещё → Настройки».'}};
    if(!target){bub.style.left='';place(null)}else place(...(()=>{const r=target.getBoundingClientRect();return [r.left-6,r.top-6,r.right+6,r.bottom+6]})());
  }
  function petPic(){try{const r=typeof gmMe==='function'&&gmMe();if(r&&typeof petCfg==='function'&&petCfg(r))return '<div class="tpet">'+gmPet(r,130,{vb:GM_PETCROP,bg:""})+'</div>'}catch(e){}return '<img src="stickers/pushok.webp" alt="Пушок" width="150" height="150">'}
  function reward(){
    cancelAnimationFrame(rafId);dim.style.clipPath='';ring.hidden=true;fin.hidden=true;bub.hidden=true;ov.querySelector('.thud').hidden=true;
    const conf=Array.from({length:28},(_,k)=>`<i style="left:${(k*37%100)}%;animation-delay:${(k%9)*0.18}s;animation-duration:${2.4+(k%5)*0.4}s">${['🎉','⭐','🎃','🍂','✨','👻','🦇','🎊'][k%8]}</i>`).join('');
    const win=document.createElement('div');win.className='twin';win.innerHTML=`<div class="tconf">${conf}</div><div class="tcard">${petPic()}<h2>Квест пройден! 🏆</h2><p>Собрано ⭐ <b>${stars}</b> из ${total}. Теперь ты настоящий участник команды Дримвуд и знаешь, где что искать. Если что-то забудешь, квест можно пройти ещё раз в «Ещё → Настройки».</p><button class="btn" id="t_fin">Вперёд, в парк!</button></div>`;
    ov.appendChild(win);win.querySelector('#t_fin').onclick=close;mark();
  }
  rafId=requestAnimationFrame(frame);
  show(0);
}
window.tourStart=start;window.tourSeen=seen;
window.tourMaybe=()=>{if(!S.me||S.me.status!=='approved'||seen())return;if(window.cmpWelcomeDue&&cmpWelcomeDue()){window.companionWelcome&&companionWelcome();return}setTimeout(()=>{if(S.me&&!seen()&&(!window.cmpWelcomeDue||!cmpWelcomeDue())&&!document.querySelector('#alov,#tour,.cmpw'))start()},1200)};
})();
