// Геймификация: опыт и 50 уровней, достижения, косметика профиля (рамка, цвет имени, фон, значок, титул)
// Опыт считается на сервере из реальных данных (xp_of). Здесь только показ, выбор косметики и выдача значков руководителем.

// ---------- уровни ----------
// порог опыта для каждого из 50 уровней (первый элемент: уровень 1 = 0 очков). Около 2500 очков = 15 уровень = месяц работы «на все сто»
const GM_LV=[0,100,210,330,460,600,750,900,1060,1250,1450,1660,1910,2200,2500,2900,3300,3850,4400,5000,5650,6350,7150,8050,8950,10000,11100,12300,13600,15000,16500,18050,19750,21600,23500,25500,27700,30000,32400,35000,37700,40700,43700,47000,50400,54000,57800,61700,65800,70000];
const GM_RANKS=[
  {n:'Новичок',full:'Новичок',c:'#6FB36B'},
  {n:'Помощник',full:'Помощник маршрута «Семейный»',c:'#4A9BD9'},
  {n:'Мастер',full:'Мастер',c:'#E0A92A'},
  {n:'Герой',full:'Герой',c:'#8E5FE0'},
  {n:'Легенда',full:'Легенда тематического парка',c:'#E8553D'}];
const gmRankIdx=n=>Math.min(4,Math.floor((n-1)/10));
function gmLv(xp){
  xp=Math.max(0,+xp||0);let n=1;for(let i=0;i<GM_LV.length;i++)if(xp>=GM_LV[i])n=i+1;
  const lo=GM_LV[n-1],hi=GM_LV[n];
  return {n,r:gmRankIdx(n),xp,lo,hi:hi==null?null:hi,left:hi==null?0:hi-xp,pct:hi==null?100:Math.round((xp-lo)/(hi-lo)*100)};
}
// значок звания: у каждого звания свой силуэт и цвет
const GM_SHAPE=[
  '<path d="M8 23C8 14 14 9 24 9c0 9-5 14-13 14M8 24l7-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  '<path d="M11 26V6l12 5-12 5" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
  '<path d="M16 6l3 6.5 7 .8-5.2 4.8 1.5 7L16 21.5 9.7 25.1l1.5-7L6 13.3l7-.8z" fill="#fff"/>',
  '<path d="M18 5L9 18h6l-2 9 10-14h-6z" fill="#fff"/>',
  '<path d="M16 4c1 5 7 7 7 14a7 7 0 01-14 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-6 1-10z" fill="#fff"/>'];
const GM_BASE=[
  '<circle cx="16" cy="16" r="15" fill="#6FB36B"/>',
  '<path d="M16 1.5l12 7v15l-12 7-12-7v-15z" fill="#4A9BD9"/>',
  '<path d="M16 1.5l12 7v15l-12 7-12-7v-15z" fill="#E0A92A"/>',
  '<path d="M16 1.5l13 4v10c0 8-6 13-13 15-7-2-13-7-13-15v-10z" fill="#8E5FE0"/>',
  '<path d="M16 1.5l13 4v10c0 8-6 13-13 15-7-2-13-7-13-15v-10z" fill="url(#gmfl)"/>'];
const gmRankSvg=(r,sz=22)=>`<svg viewBox="0 0 32 32" width="${sz}" height="${sz}" aria-hidden="true">${r===4?'<defs><linearGradient id="gmfl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9A4D"/><stop offset="1" stop-color="#E0245E"/></linearGradient></defs>':''}${GM_BASE[r]}${GM_SHAPE[r]}</svg>`;
// «Невозможный»: подпись вместо числа
const gmLvChip=(row,big)=>{
  if(!row)return '';
  if(row.lvl_text)return `<span class="lvx${/^последний$/i.test(row.lvl_text.trim())?' lvz':/^супер/i.test(row.lvl_text.trim())?' lvs':(/^невозможный$/i.test(row.lvl_text.trim())?'':' lvg')}${/любов/i.test(row.lvl_text)?' lvh':''}${big?' big':''}" title="Уровень: ${esc(row.lvl_text)}">${esc(row.lvl_text)}</span>`;
  const L=gmLv(row.xp);
  return `<span class="lvb${big?' big':''}" style="--rc:${GM_RANKS[L.r].c}" title="${esc(GM_RANKS[L.r].full)} · уровень ${L.n}">${gmRankSvg(L.r,big?30:20)}<b>${L.n}</b></span>`;
};

// ---------- алмазный меч (оригинальный рисунок) ----------
const GM_SWORD=`<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="gmsw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0FFFD"/><stop offset=".45" stop-color="#5EEAD4"/><stop offset="1" stop-color="#0E8FA8"/></linearGradient></defs>
<g transform="rotate(45 32 32)"><path d="M32 2L39 12V41L32 47L25 41V12Z" fill="url(#gmsw)" stroke="#0B6F85" stroke-width="1.6" stroke-linejoin="round"/><path d="M32 2L39 12V41L32 47Z" fill="#0B6F85" fill-opacity=".22"/><path d="M32 6V43" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/>
<path d="M17 47Q32 40 47 47L44.5 52Q32 47 19.5 52Z" fill="#3B4066" stroke="#1F2342" stroke-width="1.4" stroke-linejoin="round"/><rect x="29.2" y="50" width="5.6" height="9" rx="2.4" fill="#7A4A8C" stroke="#3E2450" stroke-width="1.2"/><circle cx="32" cy="61" r="3" fill="#5EEAD4" stroke="#0B6F85" stroke-width="1.2"/></g>
<path class="gmsp" d="M13 14l1.6 3.6L18 19l-3.4 1.4L13 24l-1.6-3.6L8 19l3.4-1.4z" fill="#fff"/><path class="gmsp b" d="M52 40l1.1 2.5 2.4 1-2.4 1L52 47l-1.1-2.5-2.4-1 2.4-1z" fill="#CFFAF3"/></svg>`;
const GM_WHIP=`<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><g stroke="#7A4A22" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" fill="#D9954F"><circle cx="11" cy="7.4" r="4.3"/><path d="M7.2 12.2h7.6l5 2.4-1.5 3.2-3.8-1.7 2.6 9.6-3.4 1.4-2.6-6.6-2.6 6.6-3.4-1.4 2.6-9.6-3.8 1.7-1.5-3.2z"/></g><circle cx="9.6" cy="6.8" r=".9" fill="#fff"/><circle cx="12.6" cy="6.8" r=".9" fill="#fff"/><path d="M9.3 9.2q1.7 1.6 3.4 0" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/><circle cx="11" cy="15.2" r=".9" fill="#E5484D"/><circle cx="11" cy="18.4" r=".9" fill="#52A7FF"/><path d="M19 29.5l5.2-8" stroke="#4A2C16" stroke-width="3.2" stroke-linecap="round"/><path d="M24.4 21.4C31 18 24.5 11.5 28.8 6.4" stroke="#2D1D14" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M28.8 6.4l1.6-1.2" stroke="#E5484D" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const gmIc=(ic,sz=28)=>ic==='whipgb'?`<span class="gmsw" style="display:inline-block;width:${sz}px;height:${sz}px;vertical-align:middle">${GM_WHIP}</span>`:ic==='sword'?`<span class="gmsw" style="width:${sz}px;height:${sz}px">${GM_SWORD}</span>`:`<span style="font-size:${Math.round(sz*.82)}px;line-height:1">${ic}</span>`;

// ---------- достижения ----------
const GM_GR=[['work','✅','Работа'],['days','☀️','Смены'],['hab','🔁','Привычки и дела'],['team','💛','Команда'],['park','🎡','Помощь парку'],['know','📚','Знания'],['fun','🎲','Весёлое'],['skill','🎟️','Допуски, обучения, события']];
const GM_TIER=['','Простое','Обычное','Заметное','Трудное','Редкое'];
const GM_TC=['','#9FB68C','#6AA9E0','#E3B53F','#A57BE8','#F26B4E'];
// k и goal дублируют правила на сервере (ach_sync): по ним рисуются полоски прогресса
const GM_ACH=[
 {c:'chk1',g:'work',t:1,ic:'✅',n:'Первая отметка',d:'Отметь первый пункт в чек-листе смены',b:20,k:'chk',goal:1,title:'Новичок смены'},
 {c:'chk100',g:'work',t:2,ic:'📋',n:'Сотня отметок',d:'100 пунктов чек-листов отмечено',b:60,k:'chk',goal:100,title:'Аккуратист'},
 {c:'chk500',g:'work',t:3,ic:'🗒️',n:'Пятьсот отметок',d:'500 пунктов чек-листов',b:150,k:'chk',goal:500,title:'Хозяин чек-листов'},
 {c:'chk1000',g:'work',t:4,ic:'🏅',n:'Тысяча отметок',d:'1000 пунктов чек-листов',b:300,k:'chk',goal:1000,title:'Порядок во всём'},
 {c:'chk3000',g:'work',t:5,ic:'👑',n:'Три тысячи отметок',d:'3000 пунктов чек-листов: это настоящая преданность делу',b:600,k:'chk',goal:3000,title:'Хранитель порядка'},
 {c:'day1',g:'days',t:1,ic:'☀️',n:'Первый выход',d:'Подтверди выход на смену первый раз',b:20,k:'days',goal:1},
 {c:'day20',g:'days',t:2,ic:'📅',n:'Двадцать смен',d:'20 подтверждённых выходов',b:60,k:'days',goal:20,title:'Надёжный'},
 {c:'day100',g:'days',t:3,ic:'🗓️',n:'Сто смен',d:'100 подтверждённых выходов',b:150,k:'days',goal:100,title:'Опора смены'},
 {c:'day300',g:'days',t:5,ic:'🏔️',n:'Триста смен',d:'300 подтверждённых выходов',b:400,k:'days',goal:300,title:'Ветеран парка'},
 {c:'hab1',g:'hab',t:1,ic:'🌱',n:'Первая привычка',d:'Отметь привычку в блокноте',b:15,k:'hab',goal:1},
 {c:'hab7',g:'hab',t:2,ic:'🔥',n:'Неделя подряд',d:'Привычки 7 дней подряд',b:50,k:'hstreak',goal:7,title:'На огне'},
 {c:'hab30',g:'hab',t:3,ic:'🌟',n:'Месяц подряд',d:'Привычки 30 дней подряд',b:150,k:'hstreak',goal:30,title:'Железная воля'},
 {c:'hab100',g:'hab',t:5,ic:'💎',n:'Сто дней подряд',d:'Привычки 100 дней подряд. Это очень редко',b:500,k:'hstreak',goal:100,title:'Несгибаемый'},
 {c:'todo25',g:'hab',t:2,ic:'📝',n:'Двадцать пять дел',d:'25 дел в блокноте закрыто',b:40,k:'todo',goal:25,title:'Организатор'},
 {c:'todo250',g:'hab',t:4,ic:'🗂️',n:'Двести пятьдесят дел',d:'250 закрытых дел в блокноте',b:200,k:'todo',goal:250,title:'Мастер порядка'},
 {c:'thx1',g:'team',t:1,ic:'💌',n:'Первое спасибо',d:'Скажи спасибо коллеге',b:15,k:'tsent',goal:1},
 {c:'thx10',g:'team',t:2,ic:'💛',n:'Щедрая душа',d:'Скажи спасибо коллегам 10 раз',b:50,k:'tsent',goal:10,title:'Щедрая душа'},
 {c:'got10',g:'team',t:3,ic:'🤝',n:'Любимчик команды',d:'Получи 10 благодарностей от коллег',b:100,k:'tgot',goal:10,title:'Любимчик команды'},
 {c:'got50',g:'team',t:4,ic:'💖',n:'Сердце парка',d:'Получи 50 благодарностей',b:300,k:'tgot',goal:50,title:'Сердце парка'},
 {c:'ot1',g:'park',t:1,ic:'🆘',n:'На подхвате',d:'Первая доработка или переработка',b:20,k:'otn',goal:1,title:'На подхвате'},
 {c:'ot10',g:'park',t:2,ic:'⏱️',n:'Десять часов сверху',d:'10 часов доработок и переработок в сумме',b:60,k:'oth',goal:10},
 {c:'ot40',g:'park',t:3,ic:'🎪',n:'Герой мероприятий',d:'40 часов доработок и переработок',b:150,k:'oth',goal:40,title:'Герой мероприятий'},
 {c:'ot100',g:'park',t:4,ic:'🛡️',n:'Опора парка',d:'100 часов доработок и переработок',b:400,k:'oth',goal:100,title:'Опора парка'},
 {c:'week1',g:'know',t:2,ic:'🎓',n:'Первая неделя пройдена',d:'Выполнен весь чек-лист новичка',b:60,k:'week',goal:1},
 {c:'ment1',g:'know',t:3,ic:'🧭',n:'Наставник',d:'Твой подопечный прошёл первую неделю',b:120,k:'ment',goal:1,title:'Наставник'},
 {c:'egg',g:'fun',t:2,ic:'🎈',n:'Нашёл секрет',d:'Подсказка: Дримми любит, когда его логотип трогают много раз подряд',b:25,claim:1,title:'Нашёл секрет'},
 {c:'dark',g:'fun',t:1,ic:'🌙',n:'Тёмная сторона',d:'Включи тёмную тему в настройках',b:10,claim:1},
 {c:'love',g:'fun',t:3,ic:'💌',n:'От старшего спеца с любовью',d:'Нажми на логотип Дримвуд и узнай, кто сделал это приложение. Награда: 500 опыта и 10 билетов',b:500,claim:1,title:'С любовью'},
 // выдаёт руководитель: стандартные обучения (остальное — допуски на аттракционы, события, особые значки)
 {c:'evt:parad',g:'skill',t:4,ic:'🎃',n:'Парад кошмаров',d:'Ты вступил в Парад кошмаров: событие парка Дримвуд, когда вся команда стала зверятами',b:150,man:1,title:'Участник Парада кошмаров'},
 {c:'trn:electro',g:'skill',t:4,ic:'⚡',n:'Электробезопасность',d:'Пройдено обучение, значок выдаёт руководитель',b:200,man:1,title:'Электробезопасность'},
 {c:'trn:verkholaz',g:'skill',t:4,ic:'🧗',n:'Верхолаз',d:'Пройдено обучение, значок выдаёт руководитель',b:200,man:1,title:'Верхолаз'},
 {c:'trn:rescue',g:'skill',t:4,ic:'🛟',n:'Спасатель-матрос',d:'Пройдено обучение, значок выдаёт руководитель',b:200,man:1,title:'Спасатель-матрос'},
 {c:'trn:cash',g:'skill',t:3,ic:'💳',n:'Кассовая дисциплина',d:'Пройдено обучение, значок выдаёт руководитель',b:150,man:1,title:'Кассовая дисциплина'},
 {c:'spec:shark',g:'skill',t:5,ic:'🦈',n:'Кигуруми акулы',d:'Особый подарок: костюм акулы для питомца',b:0,man:1,secret:1,title:'Акула-супервайзер'},
 {c:'spec:admin_server',g:'skill',t:5,ic:'sword',n:'Админ на сервере',d:'Особый значок. Выдаёт админ, ничего лишнего не просит',b:500,man:1,secret:1,title:'Админ на сервере'},
 {c:'spec:whipcarrot',g:'skill',t:5,ic:'whipgb',n:'Кнут и пряник',d:'Для работы с командой 💙',b:0,man:1,secret:1,title:'Кнут и пряник'},
 {c:'spec:taxi',g:'skill',t:5,ic:'🚕',n:'Лама-таксист',d:'Особый питомец: лама в кепке таксиста, светло-рыжая, с бородой',b:0,man:1,secret:1},
 {c:'spec:legend',g:'skill',t:5,ic:'👑',n:'Легенда',d:'Статус для тех, кого в парке обожают',b:0,man:1,secret:1,title:'Легенда'},
 {c:'spec:finished',g:'skill',t:5,ic:'🏆',n:'Прошёл игру',d:'Дошёл до конца: прошёл Дримвуд целиком',b:0,man:1,secret:1,title:'Прошёл игру'},
 {c:'spec:alpha',g:'skill',t:5,ic:'🐺',n:'Альфа',d:'Один за всех, оклад за одного',b:100,man:1,title:'Альфа'},
 {c:'spec:ropes_all',g:'skill',t:5,ic:'🏔️',n:'Все три маршрута лагеря',d:'Открыты все три маршрута верёвочного лагеря: Семейный, Мастер и Герой',b:150,man:1,title:'Покоритель лагеря'},
 {c:'spec:curly',g:'skill',t:5,ic:'🌀',n:'Кучерявая причёска',d:'Особый подарок: кучерявая причёска для питомца',b:0,man:1,secret:1,title:'Кучерявый'}
];
const GM_BY=Object.fromEntries(GM_ACH.map(a=>[a.c,a]));
// выданные вручную коды без записи в каталоге: допуски, события, особые
function gmDef(a){ // a: {c,l} из выданных
  const d=GM_BY[a.c];if(d)return {...d,n:d.n};
  const k=a.c.split(':')[0],lbl=a.l||a.c.split(':')[1]||a.c;
  if(k==='adm')return {c:a.c,g:'skill',t:3,ic:'🎟️',n:lbl,d:'Допуск к аттракциону',title:lbl};
  if(k==='trn')return {c:a.c,g:'skill',t:4,ic:'🎓',n:lbl,d:'Пройденное обучение',title:lbl};
  if(k==='evt')return {c:a.c,g:'skill',t:4,ic:'🎉',n:lbl,d:'Участие в мероприятии парка',title:lbl};
  return {c:a.c,g:'skill',t:5,ic:'⭐',n:lbl,d:'Особый значок',title:lbl};
}

// ---------- косметика ----------
// req: код достижения; 'adm*' — любой допуск; 'evt*' — любое мероприятие
const GM_FRAMES=[['','Без рамки',null],['f_leaf','Росток','chk1'],['f_sky','Небо','day20'],['f_sun','Солнце','hab7'],['f_rose','Роза','thx10'],['f_gold','Золото','chk500'],['f_pass','Допуск','adm*'],['f_spark','Искры','chk1000'],['f_aurora','Северное сияние','got50'],['f_fire','Огненный ореол','chk3000'],['f_diamond','Алмазная','spec:admin_server']];
const GM_NAMES=[['','Обычный',null],['n_green','Зелёный','hab1'],['n_blue','Синий','thx1'],['n_amber','Янтарный','day20'],['n_rose','Розовый','got10'],['n_grad','Градиент','chk500'],['n_shine','Блеск','chk1000'],['n_rainbow','Радужный','spec:admin_server']];
const GM_BGS=[['','Без фона',null],['bg_forest','Осенний лес','week1'],['bg_water','Вода','ot1'],['bg_mount','Горы','day100'],['bg_sky','Небо с облаками','todo25'],['bg_dome','Купол','ment1'],['bg_night','Звёздная ночь','got50'],['bg_event','Праздничный','evt*'],['bg_meadow','Летний луг',null],['bg_sunset','Закат над парком',null],['bg_snow','Зимняя сказка',null],['bg_candy','Конфетная',null],['bg_deep','Глубина',null],['bg_aurora','Северное сияние',null],['bg_space','Космос',null],['bg_forest2','Волшебный лес',null]];
const GM_COSL={frame:['Рамка вокруг фото',GM_FRAMES],name:['Цвет имени',GM_NAMES],bg:['Фон за фото',GM_BGS]};

// ---------- данные ----------
const gmKey=n=>norm(n).slice().sort().join(' ');
function gmIndex(rows){
  const by={},byName=new Map();
  (rows||[]).forEach(r=>{by[r.id]=r;[r.rot_name,r.full_name].forEach(n=>{if(!n)return;const k=gmKey(n);if(k&&!byName.has(k))byName.set(k,r)})});
  return {rows:rows||[],by,byName,at:Date.now()};
}
function gmBoot(){ // мгновенно показываем то, что запомнили в прошлый раз
  if(S.gm||!S.me)return;
  try{const j=JSON.parse(localStorage.getItem('dw:gm:'+S.me.id)||'null');if(j&&j.rows){S.gm=gmIndex(j.rows);S.gm.at=0}}catch(e){}
}
async function gmLoad(force){
  if(!S.me)return S.gm;
  gmBoot();
  if(!force){if(S.gm&&Date.now()-S.gm.at<45000)return S.gm;if(S.gmErr&&Date.now()-(S.gmTry||0)<120000)return S.gm}
  if(S.gmP)return S.gmP;
  S.gmTry=Date.now();
  S.gmP=(async()=>{
    try{
      const r=await sb.rpc('game_all');
      if(r.error){S.gmErr=r.error.message;return S.gm}
      S.gmErr=null;
      const old=S.gm?JSON.stringify(S.gm.rows.map(x=>[x.id,x.lvl_text,x.cos,gmLv(x.xp).n])):'';
      const g=gmIndex(r.data||[]);S.gm=g;
      try{localStorage.setItem('dw:gm:'+S.me.id,JSON.stringify({rows:g.rows}))}catch(e){}
      gmLevelUp();setTimeout(()=>{try{window.gmWelcomeLegend&&gmWelcomeLegend()}catch(e){}},900);setTimeout(gmPopups,1800);
      if(old&&old!==JSON.stringify(g.rows.map(x=>[x.id,x.lvl_text,x.cos,gmLv(x.xp).n]))&&window.qcRerender)qcRerender();
    }catch(e){}finally{S.gmP=null}
    return S.gm})();
  return S.gmP;
}
const gmMe=()=>{gmBoot();return S.gm&&S.me?S.gm.by[S.me.id]||null:null};
const gmHas=(row,req)=>{
  if(!req)return true;const codes=(row?.ach||[]).map(a=>a.c);
  return req.endsWith('*')?codes.some(c=>c.startsWith(req.slice(0,-1)+':')):codes.includes(req);
};
// достижения без «трофеев из автомата» (gx:…): их считать достижениями нельзя; исключение — особый значок из каталога
const gmReal=a=>!String(a.c).startsWith('gx:')||!!GM_BY[a.c];
const gmRealN=row=>(row.ach||[]).filter(gmReal).length;
// косметика человека, очищенная от того, чего у него нет (например, значок отозвали)
function gmCos(row){
  const c=row?.cos||{},o={};
  [['frame',GM_FRAMES],['name',GM_NAMES],['bg',GM_BGS]].forEach(([k,L])=>{const it=L.find(x=>x[0]===c[k]);if(it&&it[0]&&gmHas(row,it[2]))o[k]=it[0]});
  if(c.badge&&(row.ach||[]).some(a=>a.c===c.badge))o.badge=c.badge;
  if(c.title&&(row.ach||[]).some(a=>a.c===c.title))o.title=c.title;
  return o;
}
const gmBadgeIc=(row,code)=>{const a=(row.ach||[]).find(x=>x.c===code);return a?gmDef(a).ic:''};
const gmTitleTx=(row,code)=>{const a=(row.ach||[]).find(x=>x.c===code);if(!a)return '';const d=gmDef(a);return d.title||d.n};
const gmRowOf=p=>{gmBoot();if(!S.gm){gmLoad();return null}return p&&p.id?S.gm.by[p.id]||null:null};
const gmRowByName=n=>{gmBoot();if(!S.gm){gmLoad();return null}return n?S.gm.byName.get(gmKey(n))||null:null};
// аватар с рамкой и фоном (вызывается из av())
function gmFrame(p,el){
  const row=gmRowOf(p);if(!row)return el;
  const c=gmCos(row);if(!c.frame&&!c.bg)return el;
  return `<span class="avw${c.frame?' fr '+c.frame:''}${c.bg?' bgx '+c.bg:''}">${el}</span>`;
}
// имя в ротации: у кого выбрана рамка или фон, перед именем появляется мини-фото
function gmRotName(p){
  const row=gmRowByName(p.name);if(!row)return esc(p.name);
  const c=gmCos(row);
  return `${c.frame||c.bg?av(row,22)+'<span class="avgap"></span>':''}${gmName(p.name,row)}`;
}
// имя: цвет, значок рядом, уровень
function gmName(text,row,opt={}){
  const t=esc(text);if(!row)return t;
  const c=gmCos(row),ic=c.badge?gmBadgeIc(row,c.badge):'';
  return `<span class="gnm${c.name?' '+c.name:''}"${row.id?` data-pid="${row.id}"`:''}>${t}</span>${ic?` <span class="gbd gtip" ${gmTipAttr(row,c.badge)}>${ic==='sword'||ic==='whipgb'?gmIc(ic,16):ic}</span>`:''}${opt.lv===false?'':` ${gmLvChip(row)}`}`;
}
const gmTitleHtml=row=>{if(!row)return '';const c=gmCos(row);return c.title?`<div class="gmtl gtip" ${gmTipAttr(row,c.title)}>${esc(gmTitleTx(row,c.title))}</div>`:''};
// подсказка к значку и титулу: что это и за что (при наведении и по нажатию)
function gmTipAttr(row,code){
  const a=(row.ach||[]).find(x=>x.c===code);if(!a)return '';
  const d=gmDef(a),tx=`${d.n}: ${d.d||'особое достижение'}`;
  return `title="${esc(tx)}" data-tip="${esc(tx)}" tabindex="0"`;
}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.gtip[data-tip]');if(!t)return;e.stopPropagation();e.preventDefault();gmSay(`<b>${esc(t.dataset.tip.split(': ')[0])}</b><br>${esc(t.dataset.tip.split(': ').slice(1).join(': '))}`,{ms:5000})},true);

// ---------- события: новый уровень, новые достижения ----------
function gmLevelUp(){
  const me=gmMe();if(!me||me.lvl_text)return;
  const n=gmLv(me.xp).n,key='dw-lv:'+S.me.id;let last=0;
  try{last=+localStorage.getItem(key)||0;localStorage.setItem(key,String(n))}catch(e){}
  if(last&&n>last){setTimeout(()=>{dwParty();gmSay(gmRankIdx(n)>gmRankIdx(last)?`Ого, новый ранг: <b>${esc(GM_RANKS[gmRankIdx(n)].full)}</b>! Уровень ${n}. Я тобой горжусь!`:`Поздравляю, ${esc(gmFirst())}! У тебя уровень <b>${n}</b>. Так держать!`,{ms:6000})},500)}
}
async function gmSync(gap=300000){
  if(!S.me||Date.now()-(S.gmSyncAt||0)<gap)return;
  S.gmSyncAt=Date.now();
  try{
    const r=await sb.rpc('ach_sync');if(r.error||!Array.isArray(r.data))return;
    if(r.data.length){
      gmSayAch(r.data);
      dwParty();await gmLoad(true);if(window.qcRerender)qcRerender();
    }
  }catch(e){}
}
function gmClaim(code,silent){
  S.gmClaimed=S.gmClaimed||{};if(S.gmClaimed[code]||!S.me)return;S.gmClaimed[code]=1;
  const have=(gmMe()?.ach||[]).some(a=>a.c===code);if(have)return;
  sb.rpc('ach_claim',{p_code:code}).then(r=>{if(r.data===true){if(!silent){gmSayAch([{c:code,b:(GM_BY[code]||{}).b||0}]);dwParty()}gmLoad(true)}},()=>{});
}

// ---------- карточка на «Сегодня» ----------
function gameCard(){
  const row=gmMe();if(!row)return '';
  const L=gmLv(row.xp),cos=gmCos(row),have=gmRealN(row);
  return `<div class="card pad col gmc" data-go="game" style="cursor:pointer">
    <div class="gmcr">${gmLvChip(row,true)}<div style="flex:1;min-width:0"><b>${row.lvl_text?esc(row.lvl_text):esc(GM_RANKS[L.r].full)}</b>${row.lvl_text?'':`<div class="muted">Уровень ${L.n}${L.hi?` · до следующего ${L.left} оч.`:' · максимум'}</div>`}</div><span class="muted" style="white-space:nowrap">🏅 ${have}</span><span class="drmmini">${gmPetHead(row,40)}</span></div>
    ${row.lvl_text?'':`<div class="pgb"><div class="pg" style="width:${L.pct}%"></div></div>`}</div>`;
}

// ---------- экран «Мой профиль» ----------
const gmTab=()=>S.gmTab||'ach';
const gmSeeAll=()=>!!gmMe()?.lvl_text; // только у владельца приложения видны и закрытые достижения; у остальных — лишь открытые
// сколько всего достижений можно получить: открытые каталожные (без секретных и выдаваемых вручную) + всё, что уже есть
const gmCatTotal=row=>{const got=new Set((row.ach||[]).map(a=>a.c));return GM_ACH.filter(a=>got.has(a.c)||(!a.secret&&!a.man)).length+(row.ach||[]).filter(a=>gmReal(a)&&!GM_BY[a.c]).length};
function gmAbout(row,own){
  const c=row.cos||{},mo=(c.motto||'').trim(),bio=(c.bio||'').trim(),fav=(c.fav||'').trim();
  if(!mo&&!bio&&!fav)return own?`<div class="gabout muted">Здесь может быть рассказ о тебе: девиз, чем занимаешься, что любишь. Заполни во вкладке «Мой образ».</div>`:'';
  return `<div class="gabout">${mo?`<div class="gmotto">«${esc(mo)}»</div>`:''}${bio?`<div class="gbio">${esc(bio)}</div>`:''}${fav?`<div class="gfav">❤️ Люблю: ${esc(fav)}</div>`:''}</div>`;
}
const gmStage=(row,sz=190,cfg)=>{
  const c=row.cos||{},pn=(c.pname||'').trim(),bg=c.bg||'bg_default',ok=cfg||(typeof petCfg==='function'&&petCfg(row));
  const inner=ok?gmPet(row,sz,{bg:'',...(cfg?{cfg}:{})})+(pn?`<div class="pnm">${esc(pn)}</div>`:''):`<img src="stickers/mascot-hi.webp" alt="" width="120" height="120" style="object-fit:contain">`;
  return `<div class="pscene ${bg}" data-sc="${bg}">${typeof gmSceneDecor==='function'?gmSceneDecor(bg):''}<div class="pfloor"></div>${inner}</div>`;
};
function gmHero(row){
  const L=gmLv(row.xp),cos=gmCos(row);
  return `<div class="card gmh"><div class="gmhr"><div class="gmav">${av(S.me,84)}<button class="avcam gmcam" aria-label="Поставить фото из галереи">📷 Фото</button></div><div style="flex:1;min-width:0">
    <div class="gmn">${gmName(S.me.full_name||'',row,{lv:false})}</div>${gmTitleHtml(row)}
    <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">${gmLvChip(row,true)}${row.lvl_text?'':`<span><b>${esc(GM_RANKS[L.r].full)}</b><br><span class="muted">Уровень ${L.n} из 50</span></span>`}</div></div></div>
    ${gmStage(row)}
    <div class="gmcnt"><span>🏅 Достижений: <b>${gmRealN(row)}</b> из ${gmCatTotal(row)}</span><span>🎰 Билетов: <b id="gx_hdr">${typeof gxS!=='undefined'&&gxS.info?gxS.info.tickets:'…'}</b></span></div>
    ${gmAbout(row,true)}
    ${row.lvl_text?`<div class="muted" style="margin-top:8px">Всего очков: <b>${row.xp}</b></div>`:`<div class="pgb" style="margin-top:12px"><div class="pg" style="width:${L.pct}%"></div></div><div class="muted" style="margin-top:6px">${row.xp} очков${L.hi?` · до уровня ${L.n+1} осталось <b>${L.left}</b>`:' · максимальный уровень, ты легенда'}</div>`}</div>
  ${gmShelf(row,{own:1}).replace(/^/,'<div class="card pad shelfc">')+'</div>'}${gmThanksBlock(row.id)}`;
}
async function gameView(){
  S.offline=0;
  await gmLoad(true);gmSync(30000);
  const me=gmMe();
  let h=head('Мой профиль','Фото, уровень, достижения, питомец и автомат');
  if(!me){
    h+=`<div class="card pad col"><b>Раздел почти готов 🙂</b><div class="muted">${S.gmErr&&!/does not exist|function|schema/i.test(S.gmErr)?esc(S.gmErr):'В базе ещё не включены уровни и достижения. Админ должен один раз запустить обновление базы, и всё заработает.'}</div></div>`;
    app.innerHTML=h;return;
  }
  if(!S.gmTab&&!petCfg(me))S.gmTab='pet';
  h+=gmHero(me);
  h+=`<button class="btn ghost" id="gm_set" style="margin-top:-4px">⚙️ Настройки приложения</button>`;
  const tabs=[['ach','🏅 Достижения'],['pet','🐾 Мой питомец'],['gx','🎰 Автомат'],['look','🎨 Мой образ'],['team','👥 Коллеги'],['lv','📈 Уровни'],...(isManager()?[['mng','🎖 Выдать']]:[])];
  h+=`<div class="tabs gmtabs">${tabs.map(([k,n])=>`<button data-gt="${k}" class="${gmTab()===k?'on':''}" style="background:var(--tab)">${n}</button>`).join('')}</div><div id="gm_body"></div>`;
  setTimeout(()=>{const o=document.querySelector('.gmtabs .on');if(o&&o.scrollIntoView)o.scrollIntoView({inline:'center',block:'nearest'})},0);
  app.innerHTML=h;
  app.querySelectorAll('[data-gt]').forEach(b=>b.onclick=()=>{S.gmTab=b.dataset.gt;app.querySelectorAll('[data-gt]').forEach(x=>x.classList.toggle('on',x===b));gmPaint()});
  $('#gm_set').onclick=()=>go('set');
  if(typeof gxInfo==='function')gxInfo().then(i=>{const e=$('#gx_hdr');if(e)e.textContent=i.tickets}).catch(()=>{const e=$('#gx_hdr');if(e)e.textContent='—'});
  gmPaint();
}
async function gmPaint(){
  const box=$('#gm_body');if(!box)return;const t=gmTab();
  if(t==='ach')await gmAchTab(box);else if(t==='pet')gmPetTab(box);else if(t==='look')gmLookTab(box);else if(t==='lv')gmLvTab(box);else if(t==='gx')await gmGachaTab(box);else if(t==='team')gmTeamTab(box);else gmMngTab(box);
}

// --- достижения ---
async function gmAchTab(box){
  const me=gmMe(),got=new Map((me.ach||[]).map(a=>[a.c,a]));
  let st={};try{const r=await sb.rpc('ach_stats');st=r.data||{}}catch(e){}
  const rew=c=>{const r=[];GM_FRAMES.concat(GM_NAMES,GM_BGS).forEach(x=>{if(x[2]===c)r.push(x)});return r.map(x=>(GM_FRAMES.includes(x)?'рамка':GM_NAMES.includes(x)?'цвет имени':'фон')+' «'+x[1]+'»').join(', ')};
  // каталог + выданные вручную, которых нет в каталоге
  const all=GM_ACH.filter(a=>gmSeeAll()?!(a.secret&&!got.has(a.c)):got.has(a.c)).map(a=>({...a}));
  (me.ach||[]).forEach(a=>{if(!GM_BY[a.c]&&gmReal(a))all.push(gmDef(a))});
  const total=all.filter(a=>!a.man||got.has(a.c)).length,have=all.filter(a=>got.has(a.c)).length;
  let h=gmSeeAll()?`<div class="muted" style="margin:2px 2px 10px">Получено <b>${have}</b> из ${total}. За каждое достижение — бонус к очкам, а многие открывают рамки, цвета имени и фоны.</div>`:`<div class="muted" style="margin:2px 2px 10px">Получено: <b>${have}</b>. Новые достижения приходят сами, когда ты делаешь своё дело: отмечаешь чек-листы, выходишь на смены, ведёшь привычки, говоришь спасибо коллегам. За каждое — очки и, часто, новая красота для профиля.</div>${have?'':`<div class="card pad col" style="align-items:center;text-align:center"><img src="stickers/mascot-hi.webp" alt="" width="90"><b>Пока пусто</b><div class="muted">Первое достижение уже рядом. Отметь пункт в чек-листе смены.</div></div>`}`;
  h+=GM_GR.map(([g,ic,nm])=>{
    const L=all.filter(a=>a.g===g).sort((a,b)=>a.t-b.t||(got.has(b.c)?1:0)-(got.has(a.c)?1:0));if(!L.length)return '';
    const hv=L.filter(a=>got.has(a.c)).length;
    return `<details class="area gmg" ${hv||g!=='skill'?'open':''}><summary class="ah" style="background:var(--tab)"><span class="ahn">${ic} ${nm}</span><span class="pill" style="background:#FFFDF9;align-self:center">${hv} / ${L.length}</span></summary><div class="gma">${L.map(a=>{
      const o=got.get(a.c),cur=a.k?Math.min(+st[a.k]||0,a.goal):0,r=rew(a.c);
      return `<div class="gat t${a.t}${o?' on':''}" style="--tc:${GM_TC[a.t]}"><div class="gai">${gmIc(a.ic,30)}</div><div class="gab"><b>${esc(a.n)}</b><div class="muted">${esc(a.d)}</div>
        ${o?`<div class="gad">✓ ${new Date(o.t).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'})}${a.b?` · +${a.b} оч.`:''}</div>`:a.k&&!a.claim?`<div class="pgb sm"><div class="pg" style="width:${Math.round(cur/a.goal*100)}%"></div></div><div class="gad">${cur>=1e4?cur:Math.floor(cur*10)/10} из ${a.goal}${a.b?` · +${a.b} оч.`:''}</div>`:`<div class="gad">${a.man?'выдаёт руководитель':'секрет'}${a.b?` · +${a.b} оч.`:''}</div>`}
        ${r?`<div class="gar">🎁 ${esc(r)}</div>`:''}<div class="gat-t">${GM_TIER[a.t]}</div></div></div>`}).join('')}</div></details>`}).join('');
  box.innerHTML=h;
}

// --- мой образ ---
async function gmSaveCos(patch){
  const me=gmMe();if(!me)return false;
  const cur={...(me.cos||{}),...patch};Object.keys(cur).forEach(k=>{if(!cur[k])delete cur[k]});
  const r=await sb.rpc('set_my_cos',{p:cur});
  if(r.error){toast('Не сохранилось: '+r.error.message,3500);return false}
  me.cos=cur;try{localStorage.setItem('dw:gm:'+S.me.id,JSON.stringify({rows:S.gm.rows}))}catch(e){}
  toast('Сохранено ✨',1400);{const h=$('.gmh');if(h){const nx=h.nextElementSibling;if(nx&&nx.classList.contains('shelfc')){const n2=nx.nextElementSibling;nx.remove();if(n2&&n2.classList.contains('gthx'))n2.remove()}h.outerHTML=gmHero(me)}}return true;
}
function gmLookTab(box){
  const me=gmMe();let cur={...(me.cos||{})};
  const save=async(patch)=>{if(await gmSaveCos(patch)){cur={...(me.cos||{})};paint()}};
  const reqName=req=>{if(!req)return '';if(req.startsWith('gx:'))return 'из автомата';if(req.endsWith('*'))return req==='adm*'?'любой допуск':'любое мероприятие';const a=GM_BY[req];return a?a.n:req};
  const earned=(me.ach||[]).filter(gmReal).map(a=>gmDef(a));
  const opt=(k,it)=>{
    const [v,n,req]=it,ok=gmHas(me,req),on=(cur[k]||'')===v;
    if(!ok&&!gmSeeAll())return '';
    const pv=k==='frame'?`<span class="avw${v?' fr '+v:''}" style="margin:6px"><span class="av ini" style="width:30px;height:30px;font-size:12px">${esc((S.me.full_name||'?')[0])}</span></span>`
      :k==='name'?`<span class="gnm ${v}" style="font-size:15px">Имя</span>`
      :`<span class="bgsw ${v}"></span>`;
    return `<button class="gop${on?' on':''}${ok?'':' lk'}" data-k="${k}" data-v="${v}" ${ok?'':'disabled'}><span class="gopv">${pv}</span><span class="gopn">${esc(n)}</span>${ok?'':`<span class="gopl">🔒 ${esc(reqName(req))}</span>`}</button>`;
  };
  const paint=()=>{
    box.innerHTML=`<div class="card pad col"><b>📝 О себе</b><div class="muted">Это видят коллеги, когда открывают твой профиль.</div><label>Девиз<input id="ab_m" maxlength="80" placeholder="Например: и в дождь, и в зной с улыбкой" value="${esc(cur.motto||'')}"></label><label>Расскажи о себе<textarea id="ab_b" maxlength="400" rows="4" placeholder="Чем занимаешься в парке, чем увлекаешься">${esc(cur.bio||'')}</textarea></label><label>Что люблю<input id="ab_f" maxlength="120" placeholder="Кофе, походы, настолки" value="${esc(cur.fav||'')}"></label><button class="btn" id="ab_s">Сохранить</button></div><div class="muted" style="margin:2px 2px 10px">Выбери, как тебя видят коллеги: в контактах, ротации, благодарностях. Это просто красота, никаких прав и бонусов.</div>`+
    Object.entries(GM_COSL).map(([k,[ttl,L]])=>`<div class="card pad col"><b>${ttl}</b><div class="gops">${L.map(it=>opt(k,it)).join('')}</div></div>`).join('')+
    `<div class="card pad col"><b>Значок рядом с именем</b><div class="muted">Один любимый из заработанных.</div><div class="gops"><button class="gop${cur.badge?'':' on'}" data-k="badge" data-v=""><span class="gopv">—</span><span class="gopn">Без значка</span></button>${earned.map(d=>`<button class="gop${cur.badge===d.c?' on':''}" data-k="badge" data-v="${esc(d.c)}"><span class="gopv">${gmIc(d.ic,26)}</span><span class="gopn">${esc(d.n)}</span></button>`).join('')}</div></div>
    <div class="card pad col"><b>Титул под именем</b><div class="muted">Короткая подпись из заработанного.</div><div class="gops"><button class="gop${cur.title?'':' on'}" data-k="title" data-v=""><span class="gopv">—</span><span class="gopn">Без титула</span></button>${earned.filter(d=>d.title).map(d=>`<button class="gop${cur.title===d.c?' on':''}" data-k="title" data-v="${esc(d.c)}"><span class="gopn" style="font-weight:800">${esc(d.title)}</span></button>`).join('')}</div></div>`;
    box.querySelectorAll('.gop:not([disabled])').forEach(b=>b.onclick=()=>save({[b.dataset.k]:b.dataset.v}));
    const sv=box.querySelector('#ab_s');if(sv)sv.onclick=()=>save({motto:box.querySelector('#ab_m').value.trim(),bio:box.querySelector('#ab_b').value.trim(),fav:box.querySelector('#ab_f').value.trim()});
  };
  paint();
}

// --- уровни ---
function gmLvTab(box){
  const me=gmMe(),L=gmLv(me.xp);
  let h=`<div class="card pad col"><b>Как копится опыт</b><div class="muted">Опыт копится навсегда. Он считается из того, что ты реально делаешь, поэтому повторное нажатие ничего не накручивает.</div>
   <div class="gmrate">${[['✅','Пункт в чек-листе смены','5'],['☀️','Подтверждённый выход на смену','10'],['⏱️','Доработка: полчаса','10'],['🔥','Переработка: полчаса','5'],['🔁','Привычка выполнена','2'],['💌','Сказал спасибо','3'],['💛','Тебе сказали спасибо','10'],['🌱','Пункт «Первой недели»','5'],['🏅','Каждое достижение','бонус']].map(([i,t,v])=>`<div class="otr"><span>${i} ${t}</span><b>${v}${/^\d/.test(v)?' оч.':''}</b></div>`).join('')}</div>
   <div class="muted">Доработки и переработки вместе дают не больше 100 очков в неделю: чтобы приложение не подталкивало работать лишнее. Некоторые источники ограничены в день.</div></div>`;
  h+=GM_RANKS.map((r,i)=>{
    const from=i*10+1,to=i*10+10,here=L.n>=from&&L.n<=to;
    return `<details class="area gmg" ${here?'open':''}><summary class="ah" style="background:${r.c}22;border-left:5px solid ${r.c}"><span class="ahn">${gmRankSvg(i,26)} ${esc(r.full)}</span><span class="pill" style="background:#FFFDF9;align-self:center">${from}–${to}</span></summary><div class="gmlv">${Array.from({length:10},(_,j)=>{const n=from+j,x=GM_LV[n-1];return `<div class="${n===L.n?'cur':n<L.n?'done':''}"><b>${n}</b><span>${x} оч.</span></div>`}).join('')}</div></details>`}).join('');
  box.innerHTML=h;
}

// --- выдача значков (руководитель) ---
async function gmMngTab(box){
  const rows=(S.gm.rows||[]).slice().sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||'','ru'));
  const adm=isAdmin();
  const st=S.gmM=S.gmM||{type:'adm',who:''};
  let zones=S.gmZones;
  if(!zones){zones=[];try{const r=await sb.from('rotations').select('data').order('day',{ascending:false}).limit(1).maybeSingle();const z=new Set();Object.values(r.data?.data?.teams||{}).forEach(secs=>secs.forEach(s=>(s.rows||[]).forEach(x=>x.zone&&z.add(x.zone))));zones=[...z].sort((a,b)=>a.localeCompare(b,'ru'))}catch(e){}S.gmZones=zones}
  const TYPES=[['adm','🎟️ Допуск'],['trn','🎓 Обучение'],['evt','🎉 Событие'],...(adm?[['spec','⭐ Особый']]:[])];
  const personOpts=rows.map(r=>`<option value="${esc(r.full_name||'')}"></option>`).join('');
  box.innerHTML=`<div class="card pad col"><b>🎖 Выдать значок</b><div class="muted">Допуски на аттракционы, пройденные обучения и участие в событиях. Человеку придёт уведомление и бонус к очкам.</div>
   <input id="gm_p" list="gm_pl" placeholder="Кому: начни вводить имя" value="${esc(st.who)}" autocomplete="off"><datalist id="gm_pl">${personOpts}</datalist>
   <div class="seg">${TYPES.map(([k,n])=>`<button data-gty="${k}" class="${st.type===k?'on':''}">${n}</button>`).join('')}</div>
   <div id="gm_f"></div><div class="err" id="gm_e"></div><button class="btn" id="gm_go">Выдать</button></div>
   <div id="gm_given"></div>
   ${adm?`<div class="card pad col"><b>Подпись вместо уровня (админ)</b><div class="muted">Например, «Невозможный». Пусто — вернуть обычный уровень.</div><input id="gm_lp" list="gm_pl" placeholder="Кому"><input id="gm_lt" maxlength="24" placeholder="Подпись"><button class="btn ghost" id="gm_ls">Сохранить подпись</button><div class="err" id="gm_le"></div></div>`:''}`;
  const who=()=>{const v=$('#gm_p').value.trim().toLowerCase();return rows.find(r=>(r.full_name||'').toLowerCase()===v)};
  const slug=s=>String(s).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,50);
  const form=()=>{
    const f=$('#gm_f'),t=st.type;
    f.innerHTML=t==='adm'?`<input id="gm_t" list="gm_zl" placeholder="К какому аттракциону допущен" autocomplete="off"><datalist id="gm_zl">${zones.map(z=>`<option value="${esc(z)}"></option>`).join('')}</datalist>`
     :t==='trn'?`<select id="gm_t">${GM_ACH.filter(a=>a.c.startsWith('trn:')).map(a=>`<option value="${a.c}">${esc(a.n)}</option>`).join('')}<option value="">Другое обучение…</option></select><input id="gm_o" placeholder="Название обучения" hidden>`
     :t==='evt'?`<input id="gm_t" placeholder="Название события, например «Хэллоуин 2026»" autocomplete="off">`
     :`<input id="gm_t" placeholder="Название значка" autocomplete="off">`;
    const s=$('#gm_t');if(t==='trn'){s.onchange=()=>{$('#gm_o').hidden=!!s.value}}
  };
  const given=()=>{
    const r=who(),g=$('#gm_given');if(!r){g.innerHTML='';return}
    const man=(r.ach||[]).filter(a=>/^(adm|trn|evt|spec):/.test(a.c));
    g.innerHTML=`<div class="card pad col"><b>Уже выдано: ${esc(shortName(r.full_name))}</b>${man.length?man.map(a=>{const d=gmDef(a);return `<div class="otr"><span>${gmIc(d.ic,20)} ${esc(d.n)}</span><button class="btn ghost" style="min-height:34px;padding:0 12px" data-rv="${esc(a.c)}">Забрать</button></div>`}).join(''):'<div class="muted">Пока ничего.</div>'}</div>`;
    g.querySelectorAll('[data-rv]').forEach(b=>b.onclick=async()=>{if(!confirm('Забрать значок «'+b.closest('.otr').textContent.replace('Забрать','').trim()+'»?'))return;const x=await sb.rpc('ach_revoke',{p_user:r.id,p_code:b.dataset.rv});if(x.error)return alert(x.error.message);await gmLoad(true);gmMngTab(box)});
  };
  form();given();
  box.querySelectorAll('[data-gty]').forEach(b=>b.onclick=()=>{st.type=b.dataset.gty;st.who=$('#gm_p').value;box.querySelectorAll('[data-gty]').forEach(x=>x.classList.toggle('on',x===b));form()});
  $('#gm_p').oninput=()=>{st.who=$('#gm_p').value;given()};
  $('#gm_go').onclick=async e=>{
    const er=$('#gm_e');er.style.color='';er.textContent='';
    const r=who();if(!r)return er.textContent='Выбери человека из списка';
    const t=st.type;let code,label,bonus;
    if(t==='trn'){const v=$('#gm_t').value;if(v){const a=GM_BY[v];code=v;label=a.n;bonus=a.b}else{const o=$('#gm_o').value.trim();if(!o)return er.textContent='Впиши название обучения';code='trn:'+slug(o);label=o;bonus=200}}
    else{const v=$('#gm_t').value.trim();if(!v)return er.textContent='Впиши название';
      if(t==='adm'){code='adm:'+slug(v);label='Допущен: '+v;bonus=100}else if(t==='evt'){code='evt:'+slug(v);label=v;bonus=150}else{code='spec:'+slug(v);label=v;bonus=500}}
    if(!slug(label.replace(/^Допущен:\s*/,'')))return er.textContent='Название должно содержать буквы или цифры';
    e.target.disabled=true;
    const x=await sb.rpc('ach_grant',{p_user:r.id,p_code:code,p_label:label,p_bonus:bonus});
    e.target.disabled=false;
    if(x.error)return er.textContent='Не получилось: '+x.error.message;
    er.style.color='var(--ink)';er.textContent='Выдано: '+label+' → '+shortName(r.full_name)+' ✅';dwParty();
    await gmLoad(true);given();
  };
  if(adm)$('#gm_ls').onclick=async e=>{
    const er=$('#gm_le');er.style.color='';const v=$('#gm_lp').value.trim().toLowerCase(),r=rows.find(x=>(x.full_name||'').toLowerCase()===v);
    if(!r)return er.textContent='Выбери человека из списка';
    e.target.disabled=true;const x=await sb.rpc('set_lvl_text',{p_user:r.id,p_text:$('#gm_lt').value});e.target.disabled=false;
    if(x.error)return er.textContent='Не получилось: '+x.error.message;
    er.style.color='var(--ink)';er.textContent='Готово ✅';await gmLoad(true);if(r.id===S.me.id)gameView();
  };
}

VIEWS.game=gameView;
gmBoot();


// ---------- Дримми: личные поздравления ----------
const gmFirst=()=>((S.me&&S.me.full_name)||'').trim().split(/\s+/)[0]||'друг';
const GM_CHEER=['Ура!','Круто!','Вот это да!','Молодец!','Отлично!','Здорово!'];
let GM_SQ=[],GM_SB=false;
function gmSay(html,opt={}){GM_SQ.push([html,opt]);gmSayNext()}
function gmSayNext(){
  if(GM_SB||!GM_SQ.length)return;GM_SB=true;
  const [html,o]=GM_SQ.shift(),d=document.createElement('div');
  d.className='dsay';d.innerHTML=`<img src="stickers/mascot-hi.webp" alt="" width="56" height="56"><div class="dsb">${html}</div>`;
  document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));
  let done=false;const end=()=>{if(done)return;done=true;d.classList.remove('on');setTimeout(()=>{d.remove();GM_SB=false;gmSayNext()},260)};
  d.onclick=end;setTimeout(end,o.ms||5500);
}
function gmSayAch(list){
  const L=(list||[]).map(x=>({d:GM_BY[x.c]||{n:x.c},b:x.b||0}));if(!L.length)return;
  const cheer=GM_CHEER[Math.floor(Math.random()*GM_CHEER.length)];
  if(L.length===1){const x=L[0];gmSay(`${cheer} ${esc(gmFirst())}, у тебя новое достижение: <b>${esc(x.d.n)}</b>${x.b?` и +${x.b} очков`:''}. Я рад за тебя!`,{ms:6500})}
  else gmSay(`${cheer} ${esc(gmFirst())}, сразу ${L.length} новых достижений: ${L.slice(0,3).map(x=>`<b>${esc(x.d.n)}</b>`).join(', ')}${L.length>3?' и другие':''}. Горжусь тобой!`,{ms:7500});
}

// ---------- «Мой питомец» ----------
const GM_PETCROP=[30,-40,260,290];
function gmPetHead(row,sz){
  if(typeof petCfg!=='function'||!petCfg(row))return `<img src="stickers/mascot-hi.webp" alt="" width="${sz}" height="${sz}" style="object-fit:contain">`;
  return gmPet(row,sz,{vb:GM_PETCROP,bg:''});
}
const gmPetSw=v=>(typeof PET_GRAD!=='undefined'&&PET_GRAD[v])?`linear-gradient(135deg,${PET_GRAD[v].s.join(',')})`:v==='gold'?'linear-gradient(135deg,#FFF0B0,#EDBE46 50%,#B8821C)':v==='rainbow'?'linear-gradient(135deg,#FF6B8B,#FFB347,#7BDB8A,#52A7FF,#B07CFF)':v==='night'?'radial-gradient(circle at 35% 30%,#4C5CC8,#1B2262)':v;
async function gmPetSave(cfg){return gmSaveCos({pet:petEnc(cfg)})}
function gmPetChooser(onPick,sz=104){
  return `<div class="petch">${PET_SP.filter(x=>!x[3]||gmHas(gmMe(),x[3])).map(([k,n,c])=>`<button class="petc" data-sp="${k}"><span class="petcv">${gmPet({},sz,{cfg:{...PET_DEF,sp:k,bc:petBcOf(k)},vb:GM_PETCROP,bg:''})}</span><b>${n}</b></button>`).join('')}</div>`;
}
function gmPetTab(box){
  const me=gmMe();
  const draw=()=>{
    const cfg=petCfg(me);
    if(!cfg){
      box.innerHTML=`<div class="card pad col" style="align-items:center;text-align:center"><b style="font-size:18px">Выбери себе питомца 🐾</b><div class="muted">У каждого в команде будет свой зверёк. Выбери того, кто нравится больше. Потом его можно будет одеть и раскрасить как угодно: цвет, глаза, улыбку, причёску, шапки, очки и многое другое.</div>${gmPetChooser()}</div>`;
      box.querySelectorAll('[data-sp]').forEach(b=>b.onclick=async()=>{if(await gmPetSave({...PET_DEF,sp:b.dataset.sp})){gmSay(`Отличный выбор, ${esc(gmFirst())}! Теперь вы вместе. Одень зверька как тебе нравится, а новые вещи будешь получать за достижения.`,{ms:6500});dwParty();gmParadeClaim();draw()}});
      return;
    }
    const keep=window.scrollY,base={...cfg,ha:'',gl:'',nk:'',ch:'',bk:'',hd:'',hr:''};
    const tile=(k,kind,crop,it)=>{
      const [id,n,req,val]=it,ok=gmHas(me,req);if(!ok&&(!gmSeeAll()||/^spec:/.test(req||'')))return '';
      const on=(cfg[k]||'')===id;
      const v=kind==='sw'?`<span class="petsw" style="background:${gmPetSw(val)}"></span>`:gmPet({},78,{cfg:{...base,...(k==='ec'||k==='gz'?{ex:'x_n'}:{}),[k]:id},vb:crop||PET_VB,bg:''});
      return `<button class="gop${on?' on':''}${ok?'':' lk'}" data-k="${k}" data-v="${esc(id)}" ${ok?'':'disabled'}><span class="gopv">${v}</span><span class="gopn">${esc(n)}</span>${ok?'':`<span class="gopl">🔒 ${esc(gmReqName(req))}</span>`}</button>`;
    };
    box.innerHTML=`<div class="petpv2">${gmStage(me,150,cfg)}</div>
    <div class="card pad col"><b>🏷️ Имя питомца</b><div class="muted">Оно видно под питомцем в профиле, а если надеть «Бейдж парка» (раздел «Грудь»), то и на бейджике.</div><div style="display:flex;gap:8px"><input id="pn_i" maxlength="16" placeholder="Как его зовут?" value="${esc((me.cos||{}).pname||'')}" style="flex:1;min-width:0"><button class="btn" id="pn_s" style="flex:none">Сохранить</button></div>${cfg.ch==='c_badge'?'':'<button class="btn ghost" id="pn_b">🪪 Надеть бейдж с именем</button>'}</div>
    <div class="card pad col"><b>Вид</b><div class="muted">Это твой питомец. Выбирай всё, что нравится, а результат виден в карточке вверху. Новые вещи открываются за достижения и события. Фон берётся из раздела «Мой образ».</div><div class="gops">${PET_SP.filter(x=>!x[3]||gmHas(me,x[3])).map(([k,n])=>`<button class="gop${cfg.sp===k?' on':''}" data-sp="${k}"><span class="gopv">${gmPet({},78,{cfg:{...cfg,sp:k,bc:cfg.bc===petBcOf(cfg.sp)?petBcOf(k):cfg.bc},vb:GM_PETCROP,bg:''})}</span><span class="gopn">${n}</span></button>`).join('')}</div></div>`+
    PET_G.map(([k,ttl,L,kind,crop])=>`<div class="card pad col"><b>${ttl}</b><div class="gops">${L.map(it=>tile(k,kind,crop,it)).join('')}</div></div>`).join('');
    box.querySelector('#pn_s').onclick=async()=>{if(await gmSaveCos({pname:box.querySelector('#pn_i').value.trim()})){draw();window.scrollTo(0,keep)}};
    const pb=box.querySelector('#pn_b');if(pb)pb.onclick=async()=>{if(await gmPetSave({...cfg,ch:'c_badge'})){draw();window.scrollTo(0,keep)}};
    box.querySelectorAll('.gop[data-k]:not([disabled])').forEach(b=>b.onclick=async()=>{if(await gmPetSave({...cfg,[b.dataset.k]:b.dataset.v})){draw();window.scrollTo(0,keep)}});
    box.querySelectorAll('.gop[data-sp]').forEach(b=>b.onclick=async()=>{const sp=b.dataset.sp;if(sp===cfg.sp)return;if(await gmPetSave({...cfg,sp,bc:cfg.bc===petBcOf(cfg.sp)?petBcOf(sp):cfg.bc})){draw();window.scrollTo(0,keep)}});
  };
  draw();
}
function gmReqName(req){if(!req)return '';if(req.startsWith('gx:'))return 'из автомата';if(req.endsWith('*'))return req==='adm*'?'любой допуск':'любое мероприятие';const a=GM_BY[req];return a?a.n:req}

// ---------- событие «Парад кошмаров»: приветственное окно (один раз всем; без питомца ещё до 3 раз) ----------
const GM_EVT='parade1';
function gmPetPopup(tries=0){
  const me=gmMe();if(!me||!S.me||typeof petCfg!=='function'||S.gmPetShown)return;
  const cfg0=petCfg(me),key='dw-pet:'+S.me.id,ek='dw-evt:'+GM_EVT+':'+S.me.id;let n=0,seen=null;
  try{n=+localStorage.getItem(key)||0;seen=localStorage.getItem(ek)}catch(e){}
  if(seen&&(cfg0||n>=3))return;
  if(document.querySelector('.ov,#tour,.alov,.ibox')){if(tries<8)setTimeout(()=>gmPetPopup(tries+1),3000);return}
  S.gmPetShown=1;try{localStorage.setItem(key,String(n+1));localStorage.setItem(ek,'1')}catch(e){}
  dgxSheet('🎃 Событие',(box,paint,close)=>{
    const has=!!cfg0;
    box.innerHTML=`<div class="evt"><div class="evb">🦇 🎃 🦇</div><div class="evk">Событие в парке</div><div class="evh">Парад кошмаров</div><div class="evs">Теперь мы — команда Дримвуд!</div>
      <div class="evp">${has?'Парад начался, и твой зверёк уже в строю. Загляни в профиль: там можно сменить наряд, причёску, цвет и взгляд.':'В парке начался парад: вся команда превращается в зверят парка Дримвуд. Выбери себе питомца, того, кто нравится больше всех. Потом его можно одеть и раскрасить как угодно.'}</div>
      ${has?`<div style="display:flex;justify-content:center">${gmPet(me,150,{cfg:cfg0,bg:''})}</div><button class="btn" id="ev_go">🐾 К моему питомцу</button>`:gmPetChooser(0,92)}
      <div class="evp" style="font-size:12px;opacity:.8">Новые вещи и рамки приходят за достижения и события парка.</div>
      <button class="btn ghost evx" id="ev_x">${has?'Круто!':'Выберу позже'}</button></div>`;
    box.querySelectorAll('[data-sp]').forEach(b=>b.onclick=async()=>{if(await gmPetSave({...PET_DEF,sp:b.dataset.sp})){close(false);dwParty();gmSay(`Отличный выбор, ${esc(gmFirst())}! Теперь ты на параде вместе со зверьком. Загляни в «Мой профиль», там его можно одеть.`,{ms:6500})}});
    const go1=$('#ev_go');if(go1)go1.onclick=()=>{close(false);S.gmTab='pet';go('game')};
    $('#ev_x').onclick=()=>close(false);
    setTimeout(dwParty,350);
  },()=>{},'drmsheet');
}

// ---------- ивент «Парад кошмаров» ----------
const GM_PARADE_END=new Date('2026-11-30T23:59:00+03:00');
const gmParadeOn=()=>Date.now()<GM_PARADE_END.getTime();
function gmParadeClaim(){if(gmParadeOn())gmClaim('evt:parad')}
const GM_PCOS=[
 {sp:'fox',ha:'h_witch',mo:'m_k',hd:'d_wand',bk:'b_cape'},
 {sp:'bear',ha:'h_pumpkin',mo:'m_g',ex:'x_o'},
 {sp:'bunny',ha:'h_horns',mo:'m_t',bk:'b_bat',ex:'x_w'},
 {sp:'dragon',bk:'b_bat',ha:'h_crown',gl:'g_sun',mo:'m_g'}];
const GM_PTAG={fox:'хитрый и шустрый',bear:'добряк и силач',bunny:'ловкая и быстрая',dragon:'огнедышащий, но добрый',potato:'простая картошка с глазами, зато своя',leopard:'единственный в своём роде',unicorn:'приручить его смогли только супервайзеры; любит кофе, наушники и музыку'};
function gmPopups(){if(gmParadeOn())gmParadePopup();else gmPetPopup()}
// приветственное окно ивента: у всех при первом заходе после обновления (новички видят его сразу после обучения)
function gmParadePopup(tries=0){
  const me=gmMe();if(!me||!S.me||typeof petCfg!=='function'||S.gmPetShown)return;
  if(typeof tourSeen==='function'&&!tourSeen())return; // сначала обучение, после него окно вызовется само
  if(document.getElementById('tour')||document.querySelector('.evtw'))return;
  const key='dw-parad2:'+S.me.id;let n=0;try{n=+localStorage.getItem(key)||0}catch(e){}
  const has=!!petCfg(me);
  if(n>=(has?1:3))return; // с питомцем показываем один раз, без питомца напоминаем до трёх раз
  if(document.querySelector('.ov,.alov,.ibox')){if(tries<10)setTimeout(()=>gmParadePopup(tries+1),2500);return}
  S.gmPetShown=1;try{localStorage.setItem(key,String(n+1))}catch(e){}
  gmClaim('evt:parad',true); // набор выдаётся сразу
  const ev=document.createElement('div');ev.className='evtw';
  const flo=Array.from({length:16},(_,k)=>`<i style="left:${(k*29+7)%100}%;animation-delay:${(k%8)*.7}s;animation-duration:${6+(k%5)*1.3}s">${['🎃','👻','🦇','🕸️','🍬','🕯️','⭐'][k%7]}</i>`).join('');
  const parade=GM_PCOS.map((c,k)=>`<div class="evtp" style="animation-delay:${k*.35}s">${gmPet({},84,{cfg:{...PET_DEF,...c,bc:petBcOf(c.sp)},vb:[0,-70,320,500],bg:''})}</div>`).join('');
  const close=()=>{ev.classList.add('out');setTimeout(()=>ev.remove(),300);document.body.style.overflow=''};
  const kit=`<div class="evtkit"><b>🎁 Тебе выдан праздничный набор</b><div class="evtchips"><span>🏅 значок «Парад кошмаров»</span><span>⭐ +150 очков</span><span>🧙 шляпа ведьмы</span><span>😈 рожки</span><span>🎃 тыква-шапка</span><span>🦇 крылья летучей мыши</span><span>🌃 праздничный фон</span></div></div>`;
  let pick='';
  const phase1=()=>{
    ev.innerHTML=`<div class="evtf">${flo}</div><div class="evtc">
      <div class="evtk">С ХЭЛЛОУИНОМ, ${esc(gmFirst()).toUpperCase()}!</div>
      <h1 class="evtt">Парад кошмаров</h1><div class="evts">Теперь мы — команда Дримвуд 🎃</div>
      <div class="evtpar">${parade}</div>
      <div class="evtsay"><img src="stickers/mascot-hi.webp" alt="" width="64" height="64"><div class="dsb">Поздравляю с Хэллоуином! В парке Дримвуд начался Парад кошмаров: теперь все мы одна команда, и у каждого есть <b>свой питомец</b>.${has?' Твой уже ждёт тебя в параде!':' Выбери того, с кем зашагаешь в параде!'}</div></div>
      ${kit}
      ${has?`<div class="evtbig" style="margin-top:2px">${gmPet({},150,{cfg:{...petCfg(me),ha:'h_witch'},vb:[0,-70,320,500],bg:''})}</div><button class="btn evtgo" id="ev_dress">Примерить костюмы 🎃</button><button class="tskip" id="ev_x">Спасибо, потом!</button>`
      :`<div class="petch evtch">${PET_SP.filter(x=>!x[3]||gmHas(gmMe(),x[3])).map(([k,nm])=>`<button class="petc" data-sp="${k}"><span class="petcv">${gmPet({},84,{cfg:{...PET_DEF,sp:k,bc:petBcOf(k)},vb:GM_PETCROP,bg:''})}</span><b>${nm}</b><span class="evtg">${GM_PTAG[k]}</span></button>`).join('')}</div>
      <button class="btn evtgo" id="ev_go" disabled>Выбери питомца</button><button class="tskip" id="ev_x">Выберу позже</button>`}
      </div>`;
    ev.querySelector('#ev_x').onclick=close;
    const dr=ev.querySelector('#ev_dress');if(dr)dr.onclick=()=>{close();S.gmTab='pet';go('game')};
    ev.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{pick=b.dataset.sp;ev.querySelectorAll('[data-sp]').forEach(x=>x.classList.toggle('on',x===b));const g=ev.querySelector('#ev_go');g.disabled=false;g.textContent='Вступить в парад 🎃';setTimeout(()=>g.scrollIntoView({block:'nearest',behavior:'smooth'}),50)});
    const go_=ev.querySelector('#ev_go');
    if(go_)go_.onclick=async e=>{
      if(!pick)return;e.target.disabled=true;
      const ok=await gmPetSave({...PET_DEF,sp:pick});
      if(!ok){e.target.disabled=false;return}
      dwParty();phase2();
    };
  };
  const phase2=()=>{
    const c=petCfg(gmMe())||{...PET_DEF,sp:pick,bc:petBcOf(pick)};
    ev.querySelector('.evtc').innerHTML=`<div class="evtk">ТЫ В ПАРАДЕ!</div><h1 class="evtt" style="font-size:30px">Добро пожаловать в команду Дримвуд</h1>
      <div class="evtbig">${gmPet({},180,{cfg:{...c,ha:'h_witch'},vb:[0,-70,320,500],bg:''})}</div>
      <div class="evtsay"><img src="stickers/mascot-hi.webp" alt="" width="64" height="64"><div class="dsb">Ура, ${esc(gmFirst())}! Теперь вы с питомцем в команде. Праздничные костюмы уже открыты: шляпа ведьмы, рожки, тыква и крылья летучей мыши. Примерь их!</div></div>
      <button class="btn evtgo" id="ev_dress">Одеть питомца 🎃</button><button class="tskip" id="ev_x2">Позже</button>`;
    ev.querySelector('#ev_dress').onclick=()=>{close();S.gmTab='pet';go('game')};
    ev.querySelector('#ev_x2').onclick=close;
  };
  phase1();document.body.appendChild(ev);document.body.style.overflow='hidden';
  requestAnimationFrame(()=>ev.classList.add('on'));
}
