// POST /api/upload — файл (сырое тело) уходит на Google Drive в папку «Дримвуд — файлы сайта / <раздел> / <месяц> / <день>».
// Заголовки: Authorization: Bearer <токен Supabase>, X-Kind: repairs|inc|dg, X-Rec: id записи, X-Name: имя файла (encodeURIComponent), Content-Type, Content-Length.
import {authUser,sbGet,gToken,ensureFolder,configured,json,KINDS,ROOT_NAME,msk,clean,shortName}from'../_lib/drive.js';
const MAX=95*1024*1024;
export async function onRequestPost({request,env}){
  if(!configured(env))return json({error:'drive_not_configured'},501);
  const u=await authUser(request,env);if(!u)return json({error:'unauthorized'},401);
  const K=KINDS[request.headers.get('x-kind')];if(!K)return json({error:'bad_kind'},400);
  const len=+request.headers.get('content-length')||0;
  if(!len)return json({error:'no_length'},411);
  if(len>MAX)return json({error:'too_big',message:'Файл больше 95 МБ — сними видео покороче'},413);
  const rec=(request.headers.get('x-rec')||'').replace(/[^0-9a-f-]/gi,'');
  const mime=request.headers.get('content-type')||'application/octet-stream';
  let orig='file';try{orig=decodeURIComponent(request.headers.get('x-name')||'file')}catch(e){}
  try{
    // кто, откуда: берём из базы с правами самого пользователя
    const [pr,rc]=await Promise.all([sbGet(env,u.token,`profiles?id=eq.${u.id}&select=full_name`),rec?sbGet(env,u.token,`${K.rec}?id=eq.${rec}&select=${K.col}`):[]]);
    const who=shortName(pr[0]&&pr[0].full_name),what=clean(rc[0]&&rc[0][K.col],40);
    const t=msk(),ext=((orig.match(/\.([A-Za-z0-9]{1,5})$/)||[])[1]||(mime.split('/')[1]||'bin').replace(/[^a-z0-9]/gi,'').slice(0,5)||'bin').toLowerCase();
    const name=[t.day,t.hm,what,who].filter(Boolean).join('_')+'_'+crypto.randomUUID().slice(0,4)+'.'+ext;
    const tok=await gToken(env);
    let f=await ensureFolder(tok,'root',ROOT_NAME);
    for(const d of [K.dir,t.month,t.day])f=await ensureFolder(tok,f,d);
    const init=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name',{method:'POST',headers:{authorization:'Bearer '+tok,'content-type':'application/json; charset=UTF-8','x-upload-content-type':mime,'x-upload-content-length':String(len)},body:JSON.stringify({name,parents:[f],description:'Загрузил(а): '+(pr[0]&&pr[0].full_name||u.id)+'; исходное имя: '+orig})});
    const loc=init.headers.get('location');if(!init.ok||!loc)throw new Error('drive_init: '+init.status);
    const up=await fetch(loc,{method:'PUT',headers:{'content-type':mime,'content-length':String(len)},body:request.body});
    const j=await up.json().catch(()=>({}));if(!up.ok||!j.id)throw new Error('drive_put: '+up.status);
    return json({id:j.id,name:j.name||name});
  }catch(e){return json({error:'drive_failed',message:String(e.message||e)},502)}
}
