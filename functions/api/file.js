// GET /api/file?id=&exp=&sig= — отдаёт файл с Drive по подписанной ссылке (поддерживает Range для видео).
import {gToken,sign,configured,okId}from'../_lib/drive.js';
export async function onRequestGet({request,env}){
  if(!configured(env))return new Response('not configured',{status:501});
  const q=new URL(request.url).searchParams,id=q.get('id'),exp=+q.get('exp'),sig=q.get('sig')||'';
  if(!okId(id)||!exp||exp<Date.now()/1000)return new Response('expired',{status:403});
  if(sig!==await sign(env,id,exp))return new Response('bad signature',{status:403});
  const h={authorization:'Bearer '+await gToken(env)};const rg=request.headers.get('range');if(rg)h.range=rg;
  const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`,{headers:h});
  if(!r.ok&&r.status!==206)return new Response('not found',{status:r.status===404?404:502});
  const o=new Headers();for(const k of ['content-length','content-range','accept-ranges','etag'])if(r.headers.get(k))o.set(k,r.headers.get(k));
  // безопасно: показываем только картинки/видео/аудио/PDF, всё остальное — скачиванием; скрипты на нашем домене не выполняются
  const ct=r.headers.get('content-type')||'application/octet-stream',safe=/^(image\/(jpeg|png|webp|gif|heic|heif)|video\/|audio\/|application\/pdf)/i.test(ct);
  o.set('content-type',safe?ct:'application/octet-stream');o.set('content-disposition',safe?'inline':'attachment');
  o.set('cache-control','private, max-age=3000');o.set('x-content-type-options','nosniff');o.set('content-security-policy','sandbox');
  return new Response(r.body,{status:r.status,headers:o});
}
