const C='dw-v16';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','styles.css','app.js','dgx.js','ext1.js','ext2.js','roted.js','rep.js','push.js','config.js','manifest.webmanifest','icons/icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('supabase.co'))return;
e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)))});

self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'Дримвуд',body:e.data?e.data.text():''}}
e.waitUntil(self.registration.showNotification(d.title||'Дримвуд',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:d.tag||undefined,data:{link:d.link||null}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const link=e.notification.data&&e.notification.data.link;
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs[0];if(c){c.focus();if(link)c.postMessage({go:link});return}return self.clients.openWindow('./'+(link?'?go='+encodeURIComponent(link):''))}))});
