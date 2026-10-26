// GET /api/site — свежие новости и афиша с официального сайта для гостей (dreamwoodpark.com).
// Читаем только страницу «Афиша и новости»: карточки (дата, название, картинка, ссылка) и короткое описание со страницы события.
// Данные берём с сайта не чаще раза в сутки (кэш на 24 часа), чтобы не нагружать его.
const BASE='https://www.dreamwoodpark.com';
const UA='Mozilla/5.0 (compatible; DreamwoodTeamApp/1.0)';
const dec=s=>String(s||'').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&laquo;/g,'«').replace(/&raquo;/g,'»').replace(/&mdash;/g,'—').replace(/&ndash;/g,'–').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const txt=s=>dec(String(s||'').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const abs=u=>!u?'':/^https?:/i.test(u)?u:BASE+(u.startsWith('/')?'':'/')+u;
async function get(path){const r=await fetch(BASE+path,{headers:{'user-agent':UA,'accept-language':'ru'},redirect:'follow'});if(!r.ok)throw new Error('site '+r.status);return r.text()}
export function parseCards(html){
  const out=[],re=/<a\s+class="card"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;let m;
  while((m=re.exec(html))){
    const b=m[2],img=(b.match(/<img[^>]+src="([^"]+)"/)||[])[1],date=txt((b.match(/card--subtitle[\s\S]*?<p>([\s\S]*?)<\/p>/)||[])[1]),title=txt((b.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)||[])[1]);
    if(title)out.push({url:abs(m[1]),img:abs(img),date,title});
  }
  return out;
}
export function excerpt(html){
  const t=txt(html.replace(/[\s\S]*?<main[^>]*>/i,''));let i=t.indexOf('О мероприятии');if(i>=0)i=t.indexOf('О мероприятии',i+10);
  if(i<0)return '';const s=t.slice(i+13).trim().slice(0,320);const k=s.lastIndexOf('. ');return (k>120?s.slice(0,k+1):s).trim();
}
const TTL=24*3600e3,CK='https://dw-cache.local/site-v1';
let mem={t:0,d:null};
const reply=(d,extra={})=>new Response(JSON.stringify(d),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=3600','access-control-allow-origin':'*',...extra}});
export async function onRequestGet(){
  const now=Date.now(),edge=typeof caches!=='undefined'&&caches.default?caches.default:null;
  if(mem.d&&now-mem.t<TTL)return reply(mem.d);
  if(edge){try{const hit=await edge.match(CK);if(hit){const d=await hit.json();if(d&&d.fetchedAt&&now-d.fetchedAt<TTL){mem={t:d.fetchedAt,d};return reply(d)}}}catch(e){}}
  try{
    const items=parseCards(await get('/events/')).slice(0,8);
    await Promise.all(items.map(async it=>{try{const p=it.url.replace(BASE,'');it.text=excerpt(await get(p))}catch(e){it.text=''}}));
    const d={updated:new Date().toISOString(),fetchedAt:now,source:BASE+'/events/',items};
    mem={t:now,d};
    if(edge){try{await edge.put(CK,new Response(JSON.stringify(d),{headers:{'cache-control':'max-age=86400','content-type':'application/json'}}))}catch(e){}}
    return reply(d);
  }catch(e){
    if(mem.d)return reply(mem.d);
    return new Response(JSON.stringify({error:'site_unavailable',items:[]}),{status:502,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
}
