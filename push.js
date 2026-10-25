// Push-уведомления на телефон: подписка, включение/выключение, проверка.
const pushSupported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const pushU8=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0));
const pushIOSweb=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)&&!(navigator.standalone||matchMedia('(display-mode: standalone)').matches);
async function pushGet(){try{const reg=await navigator.serviceWorker.ready;return await reg.pushManager.getSubscription()}catch(e){return null}}
async function pushSave(sub){const j=sub.toJSON();return sb.from('push_subs').upsert({user_id:S.me.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,ua:navigator.userAgent.slice(0,120)},{onConflict:'endpoint'})}
async function pushRefresh(){ // при запуске: если пуши включены — освежаем запись в базе
  try{if(!pushSupported()||Notification.permission!=='granted')return;const s=await pushGet();if(s)await pushSave(s)}catch(e){}
}
async function pushEnable(){
  const key=(window.APP_CONFIG||{}).VAPID_PUBLIC;if(!key)throw new Error('Ключ уведомлений не настроен');
  const perm=await Notification.requestPermission();
  if(perm!=='granted')throw new Error(perm==='denied'?'Уведомления запрещены в настройках браузера или телефона':'Разрешение не получено');
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushU8(key)});
  const r=await pushSave(sub);if(r.error)throw new Error(r.error.message);
}
async function pushDisable(){const s=await pushGet();if(s){await sb.from('push_subs').delete().eq('endpoint',s.endpoint);await s.unsubscribe()}}
async function pushMount(){
  const box=$('#pushbox');if(!box)return;
  if(!pushSupported()){box.innerHTML=`<div class="card pad col"><b>🔔 Уведомления на телефон</b><div class="muted">${pushIOSweb()?'На iPhone пуши работают, только если добавить приложение на экран «Домой»: в Safari нажми «Поделиться» → «На экран “Домой”», затем открой иконку и включи уведомления здесь.':'Этот браузер не умеет присылать пуши. Попробуй Chrome или установленное приложение.'}</div></div>`;return}
  if(pushIOSweb()){box.innerHTML=`<div class="card pad col"><b>🔔 Уведомления на телефон</b><div class="muted">На iPhone нужно сначала добавить приложение на экран «Домой»: Safari → «Поделиться» → «На экран “Домой”». Потом открой его с иконки и включи уведомления здесь.</div></div>`;return}
  const sub=await pushGet(),on=!!sub&&Notification.permission==='granted';
  box.innerHTML=`<div class="card pad col"><b>🔔 Уведомления на телефон</b><div class="muted">${on?'Включены на этом устройстве: заявки, новости, смена ротации и задачи будут приходить, даже когда приложение закрыто.':'Новые заявки, новости, смена ротации и задачи — сразу на телефон, даже когда приложение закрыто.'}</div>
  <div class="err" id="pe"></div>
  <div class="two">${on?`<button class="btn ghost" id="pt">Проверить</button><button class="btn ghost" id="pd">Выключить</button>`:`<button class="btn" id="pe_on">Включить</button>`}</div></div>`;
  const err=m=>{const e=$('#pe');if(e)e.textContent=m||''};
  $('#pe_on')&&($('#pe_on').onclick=async e=>{e.target.disabled=true;try{await pushEnable();pushMount()}catch(x){err(x.message);e.target.disabled=false}});
  $('#pd')&&($('#pd').onclick=async()=>{await pushDisable();pushMount()});
  $('#pt')&&($('#pt').onclick=async e=>{e.target.disabled=true;const r=await sb.rpc('push_test');err(r.error?r.error.message:'Отправлено — уведомление придёт через пару секунд');setTimeout(()=>{e.target.disabled=false},3000)});
}
