// CSS шрифтов Manrope и Alegreya со своего домена; сами файлы шрифтов идут через /v/f/...
const CSS='https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Alegreya:wght@700;800&display=swap';
export async function onRequest({request}){
  const r=await fetch(CSS,{headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'},cf:{cacheEverything:true,cacheTtl:2592000}});
  if(!r.ok)return new Response('/* fonts unavailable */',{status:200,headers:{'content-type':'text/css'}});
  const css=(await r.text()).replace(/https:\/\/fonts\.gstatic\.com\//g,'/v/f/');
  return new Response(css,{headers:{'content-type':'text/css; charset=utf-8','cache-control':'public, max-age=86400'}});
}
