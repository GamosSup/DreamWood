const C='dw-v54';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','styles.css','app.js','dgx.js','ext1.js','ext2.js','ext3.js','ext4.js','today.js','roted.js','xlsx.js','stickers/logo.webp','stickers/acorn.svg','stickers/balloon.svg','stickers/butterfly.svg','stickers/cherry.svg','stickers/cupcake.svg','stickers/drum.svg','stickers/flower.svg','stickers/leaf.svg','stickers/moon.svg','stickers/mushroom.svg','stickers/paw.svg','stickers/pumpkin.svg','stickers/rainbow.svg','stickers/snow.svg','stickers/star.svg','stickers/sun.svg','stickers/umbrella.svg','stickers/drop.svg','stickers/mountain.svg','stickers/wind.svg','stickers/city.svg','stickers/dome.svg','stickers/mascot-hi.webp','stickers/mascot-balloon.webp','stickers/sunglasses.webp','stickers/cloud.webp','stickers/tree.webp','stickers/smile.webp','stickers/sparkle.webp','stickers/burst.webp','stickers/bird.webp','stickers/heart.webp','stickers/thumb.webp','rep.js','plan.js','push.js','tour.js','config.js','manifest.webmanifest','icons/icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Сеть с таймаутом: если сайт не ответил за 1,2 секунды, сразу отдаём сохранённую копию (при слабой связи или блокировках приложение всё равно открывается), а обновление докачивается в фоне
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);
if(q.method!=='GET'||u.origin!==location.origin||/^\/(api|sb)\//.test(u.pathname))return;
e.respondWith((async()=>{
  const c=await caches.open(C),hit=await c.match(q,{ignoreSearch:q.mode==='navigate'});
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
