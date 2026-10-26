// GET /api/site — свежие новости и афиша с официального сайта для гостей (dreamwoodpark.com).
// Читаем только страницу «Афиша и новости»: карточки (дата, название, картинка, ссылка) и короткое описание со страницы события.
// Результат кладём в кэш на 30 минут, чтобы не нагружать сайт.
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
let mem={t:0,d:null};
export async function onRequestGet({request}){
  const hdr={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300','access-control-allow-origin':'*'};
  const now=Date.now();
  if(mem.d&&now-mem.t<30*60e3)return new Response(JSON.stringify(mem.d),{headers:hdr});
  try{
    const items=parseCards(await get('/events/')).slice(0,8);
    await Promise.all(items.map(async it=>{try{const p=it.url.replace(BASE,'');it.text=excerpt(await get(p))}catch(e){it.text=''}}));
    mem={t:now,d:{updated:new Date().toISOString(),source:BASE+'/events/',items}};
    return new Response(JSON.stringify(mem.d),{headers:hdr});
  }catch(e){
    if(mem.d)return new Response(JSON.stringify(mem.d),{headers:hdr});
    return new Response(JSON.stringify({error:'site_unavailable',items:[]}),{status:502,headers:{...hdr,'cache-control':'no-store'}});
  }
}
