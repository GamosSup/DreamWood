// DELETE /api/myfile?id=<Drive id> — владелец личного файла перемещает его в корзину Drive.
import {authUser,sbGet,gToken,configured,json,okId}from'../_lib/drive.js';
export async function onRequestDelete({request,env}){
  if(!configured(env))return json({error:'drive_not_configured'},501);
  const u=await authUser(request,env);if(!u)return json({error:'unauthorized'},401);
  const id=new URL(request.url).searchParams.get('id');if(!okId(id))return json({error:'bad_request'},400);
  const rows=await sbGet(env,u.token,`my_files?path=eq.drive:${id}&owner=eq.${u.id}&select=id&limit=1`);
  if(!rows.length)return json({error:'forbidden'},403);
  try{
    const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}`,{method:'PATCH',headers:{authorization:'Bearer '+await gToken(env),'content-type':'application/json'},body:JSON.stringify({trashed:true})});
    if(!r.ok)return json({error:'drive_failed',message:'Не удалось удалить файл: '+r.status},502);
    return json({ok:true});
  }catch(e){return json({error:'drive_failed',message:String(e.message||e)},502)}
}
