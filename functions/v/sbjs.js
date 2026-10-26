// Скрипт supabase-js со своего домена (cdn.jsdelivr.net у части провайдеров не открывается). Кэшируется на сутки-месяц.
const SRC='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js';
export async function onRequest({request}){
  const r=await fetch(SRC,{cf:{cacheEverything:true,cacheTtl:2592000}});
  if(!r.ok)return new Response('upstream '+r.status,{status:502});
  return new Response(r.body,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'public, max-age=86400'}});
}
