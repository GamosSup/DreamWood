// Интерактивное обучение-игра при первом входе: подсвечивает настоящие кнопки приложения, человек нажимает их сам, за каждый шаг получает ⭐, в конце — награда.
(function(){
const KEY=()=>'dw-tour2:'+(S.me&&S.me.id||'');
const seen=()=>{try{return !!localStorage.getItem(KEY())}catch(e){return !!S.tourSeen}};
const mark=()=>{S.tourSeen=1;try{localStorage.setItem(KEY(),String(Date.now()))}catch(e){}};
const vis=el=>{if(!el||el.closest('#tour'))return false;const r=el.getBoundingClientRect();if(r.width<4||r.height<4)return false;const cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none'&&!el.closest('[hidden]')};
const find=sels=>{for(const s of [].concat(sels||[])){for(const el of document.querySelectorAll(s))if(vis(el))return el}return null};
function build(){
  const L=[
    {intro:1,img:'mascot-hi.webp',t:'Добро пожаловать в Дримвуд! 🌲',d:'Я Дримми, твой проводник. Это твоё приложение: ротации, график, чек-листы, достижения и даже свой питомец. Пройди мини-квест: жми на подсвеченные кнопки, за каждую получишь ⭐, а в конце тебя ждёт награда. Всего минута!',btn:'Начать квест 🎮'},
    {sel:'.bell',t:'Колокольчик',d:'Сюда прилетают все новости: ротация на завтра, ответы на заявки и события парка. Нажми на колокольчик!',tap:1},
    {sel:'#bk',t:'Это твоя почта',d:'Новое подсвечено цветом, а красная цифра на колокольчике показывает, сколько писем ждёт. Закрой окно: нажми «←».',tap:1},
    {sel:'.gmc',skipIfNone:1,t:'Твой уровень',d:'Видишь карточку? Это твой уровень и очки. Они капают за реальные дела: отметил пункт в чек-листе, вышел на смену, сказал спасибо коллеге. Копи очки, открывай значки и красоту для профиля.',btn:'Круто!'},
    {sel:'nav [data-tab=rot]',t:'Ротации',d:'Нажми «Ротации»: где ты стоишь сегодня, завтра и в любой день.',tap:1},
    {t:'Ротация',d:'Тут расстановка по зонам и перерывы. Твою смену мы подсвечиваем, а когда выходит ротация на завтра, приходит уведомление.',btn:'Понятно'},
    {sel:'nav [data-tab=sch]',t:'График',d:'Дальше «График»: твой месяц и все отметки.',tap:1},
    {t:'График',d:'Нажми на любой день, чтобы выбрать отметку (отгул, отпуск, больничный) или оформить заявку. Часы за месяц считаются сами.',btn:'Понятно'},
    {sel:'nav [data-tab=ap]',t:'Обращения',d:'«Обращения»: всё, что нужно сообщить или о чём попросить.',tap:1},
    {sel:'.subbar',t:'Четыре вкладки',d:'Заявки (отгул, обмен сменами), Поломки, Происшествия и Списание. К любому обращению можно приложить фото или видео, а ответ придёт уведомлением.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Ещё',d:'В «Ещё» спрятаны остальные разделы. Открой его!',tap:1},
    {sel:['[data-go=shift]','nav [data-tab=shift]'],t:'Смена',d:'Нажми «Смена»: чек-листы открытия и закрытия зон.',tap:1},
    {t:'Чек-листы',d:'Отмечай пункты по ходу дела: каждая отметка приносит очки. Коллеги видят, кто и во сколько открыл или закрыл локацию, и ты видишь их отметки.',btn:'Понятно'},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Снова «Ещё»',d:'Теперь самое интересное. Открой меню ещё раз!',tap:1},
    {sel:['[data-go=game]','nav [data-tab=game]'],t:'Мой профиль',d:'Здесь живёт твой прогресс: уровень, значки и твой личный питомец. Заходи!',tap:1},
    {sel:'[data-gt=pet]',t:'Мой питомец',d:'У каждого в Дримвуде есть свой зверёк. Нажми «Мой питомец»!',tap:1},
    {sel:['.petch','.petpv'],t:'Познакомься с питомцем',d:'Нажми на зверька, который тебе нравится: лисёнок, мишка, зайка или дракончик. Потом его можно одеть как угодно: шапки, очки, плащи, цвет шерсти и даже улыбку. Новые вещи приходят за достижения и события парка.',tap:1},
    {sel:'[data-gt=ach]',t:'Достижения',d:'Нажми «Достижения»: тут все твои значки. Новые приходят сами, и я лично прибегу тебя поздравить!',tap:1},
    {sel:'nav [data-tab=more]',skipIfNone:1,t:'Последнее «Ещё»',d:'Осталось включить уведомления. Открой меню!',tap:1},
    {sel:['[data-go=set]','nav [data-tab=set]'],t:'Настройки',d:'Нажми «Настройки».',tap:1},
    {sel:'#pushbox',t:'Уведомления на телефон',d:'Включи их здесь, и сообщения придут, даже когда приложение закрыто. Это нужно и для экстренных оповещений. Попробуй прямо сейчас:',notify:1,btn:'Дальше'},
    {sel:'nav [data-tab=today]',t:'Домой',d:'Финиш рядом: вернись на главный экран «Сегодня».',tap:1}
  ];
  if(typeof isManager==='function'&&isManager())L.push({sel:'#td_alert',t:'Кнопка «Тревога»',d:'Она только у руководителей: одним нажатием предупреждает всех сотрудников со звуком и вибрацией. Сейчас не нажимай, это просто знакомство.',btn:'Понятно'});
  if(typeof canMng==='function'&&canMng())L.push({sel:['nav [data-tab=grid]','[data-go=grid]'],t:'График и сводка',d:'Для руководителей: все сотрудники по дням, часы, доработки и выгрузка в Excel. Найдёшь в «Ещё».',btn:'Понятно'});
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
  const close=()=>{mark();cancelAnimationFrame(rafId);if(off)document.removeEventListener('click',off,true);ov.remove();try{if(window.go&&S.tab==='today')go('today')}catch(e){}};
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
    bub.innerHTML=`<img class="tmas" src="stickers/${s.img||'mascot-hi.webp'}" alt="" width="${s.intro?110:54}" height="${s.intro?110:54}"><div class="tbt"><b>${s.t}</b><p>${s.d}</p>
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
  function petPic(){try{const r=typeof gmMe==='function'&&gmMe();if(r&&typeof petCfg==='function'&&petCfg(r))return '<div class="tpet">'+gmPet(r,130,{vb:GM_PETCROP,bg:""})+'</div>'}catch(e){}return '<img src="stickers/mascot-balloon.webp" alt="" width="150" height="150">'}
  function reward(){
    cancelAnimationFrame(rafId);dim.style.clipPath='';ring.hidden=true;fin.hidden=true;bub.hidden=true;ov.querySelector('.thud').hidden=true;
    const conf=Array.from({length:28},(_,k)=>`<i style="left:${(k*37%100)}%;animation-delay:${(k%9)*0.18}s;animation-duration:${2.4+(k%5)*0.4}s">${['🎉','⭐','🎃','🍂','✨','👻','🦇','🎊'][k%8]}</i>`).join('');
    const win=document.createElement('div');win.className='twin';win.innerHTML=`<div class="tconf">${conf}</div><div class="tcard">${petPic()}<h2>Квест пройден! 🏆</h2><p>Собрано ⭐ <b>${stars}</b> из ${total}. Теперь ты настоящий дримвудовец и знаешь, где что искать. Если что-то забудешь, квест можно пройти ещё раз в «Ещё → Настройки».</p><button class="btn" id="t_fin">Вперёд, в парк!</button></div>`;
    ov.appendChild(win);win.querySelector('#t_fin').onclick=close;mark();
  }
  rafId=requestAnimationFrame(frame);
  show(0);
}
window.tourStart=start;
window.tourMaybe=()=>{if(!S.me||S.me.status!=='approved'||seen())return;setTimeout(()=>{if(S.me&&!seen()&&!document.getElementById('alov')&&!document.getElementById('tour'))start()},1200)};
})();
