export async function onRequest({request,params}){
  const p=[].concat(params.path||[]).join('/');
  const r=await fetch('https://fonts.gstatic.com/'+p,{cf:{cacheEverything:true,cacheTtl:31536000}});
  if(!r.ok)return new Response('',{status:r.status});
  return new Response(r.body,{headers:{'content-type':r.headers.get('content-type')||'font/woff2','cache-control':'public, max-age=31536000, immutable','access-control-allow-origin':'*'}});
}
