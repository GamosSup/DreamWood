const C='dw-v106';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','styles.css?v=106','app.js?v=106','dgx.js?v=106','ext1.js?v=106','ext2.js?v=106','ext3.js?v=106','ext4.js?v=106','today.js?v=106','roted.js?v=106','xlsx.js?v=106','stickers/logo.webp','stickers/acorn.svg','stickers/balloon.svg','stickers/butterfly.svg','stickers/cherry.svg','stickers/cupcake.svg','stickers/drum.svg','stickers/flower.svg','stickers/leaf.svg','stickers/moon.svg','stickers/mushroom.svg','stickers/paw.svg','stickers/pumpkin.svg','stickers/rainbow.svg','stickers/snow.svg','stickers/star.svg','stickers/sun.svg','stickers/umbrella.svg','stickers/drop.svg','stickers/mountain.svg','stickers/wind.svg','stickers/city.svg','stickers/dome.svg','stickers/mascot-hi.webp','stickers/mascot-balloon.webp','stickers/sunglasses.webp','stickers/cloud.webp','stickers/tree.webp','stickers/smile.webp','stickers/sparkle.webp','stickers/burst.webp','stickers/bird.webp','stickers/heart.webp','stickers/thumb.webp','rep.js?v=106','plan.js?v=106','grow.js?v=106','pet.js?v=106','game.js?v=106','gacha.js?v=106','gacha2.js?v=106','gacha3.js?v=106','prof.js?v=106','brief.js?v=106','fx.js?v=106','qc.js?v=106','push.js?v=106','tour.js?v=106','config.js?v=106','logo.js?v=106','manifest.webmanifest','icons/icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(async ks=>{const old=ks.filter(k=>k!==C);await Promise.all(old.map(k=>caches.delete(k)));await self.clients.claim();
  // обновление: открытые окна со старой версией перезагружаем сами, чтобы никто не сидел на старом коде
  if(old.length){const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>{try{c.navigate(c.url)}catch(_){}})}})));
// Сеть с таймаутом: если сайт не ответил за 1,2 секунды, сразу отдаём сохранённую копию (при слабой связи или блокировках приложение всё равно открывается), а обновление докачивается в фоне
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);
if(q.method!=='GET'||u.origin!==location.origin||/^\/(api|sb)\//.test(u.pathname))return;
e.respondWith((async()=>{
  const c=await caches.open(C),hit=await c.match(q,{ignoreSearch:q.mode==='navigate'});
  if(hit&&/[?&]v=\d+/.test(u.search))return hit; // версионные файлы не меняются: отдаём сразу из памяти, без ожидания сети
  const net=fetch(q).then(r=>{if(r&&r.ok){c.put(q,r.clone())}return r});
  if(!hit)return net.catch(()=>caches.match('index.html'));
  const slow=new Promise(res=>setTimeout(()=>res(hit),1200));
  e.waitUntil(net.catch(()=>{}));
  return Promise.race([net.catch(()=>hit),slow]);
})())});

self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'Дримвуд',body:e.data?e.data.text():''}}
const u=!!d.urgent;
e.waitUntil(self.registration.showNotification(d.title||'Дримвуд',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||undefined,renotify:true,silent:false,requireInteraction:u,vibrate:u?[600,200,600,200,600,200,600,200,600]:[200,100,200],timestamp:Date.now(),data:{link:d.link||null}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const link=e.notification.data&&e.notification.data.link;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs[0];if(c){c.focus();if(link)c.postMessage({go:link});return}return self.clients.openWindow('./'+(link?'?go='+encodeURIComponent(link):''))}))});
