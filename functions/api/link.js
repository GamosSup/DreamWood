// GET /api/link?k=repairs|inc|dg&id=<Drive id> — выдаёт подписанную ссылку на час, если пользователю по правилам базы виден этот файл.
import {authUser,sbGet,sign,configured,json,KINDS,okId}from'../_lib/drive.js';
export async function onRequestGet({request,env}){
  if(!configured(env))return json({error:'drive_not_configured'},501);
  const u=await authUser(request,env);if(!u)return json({error:'unauthorized'},401);
  const q=new URL(request.url).searchParams,K=KINDS[q.get('k')],id=q.get('id');
  if(!K||!okId(id))return json({error:'bad_request'},400);
  const rows=await sbGet(env,u.token,`${K.files}?path=eq.drive:${id}&select=id,mime&limit=1`);
  if(!rows.length)return json({error:'forbidden'},403);
  const exp=Math.floor(Date.now()/1000)+3600;
  return json({url:`/api/file?id=${id}&exp=${exp}&sig=${await sign(env,id,exp)}`,mime:rows[0].mime||null});
}
