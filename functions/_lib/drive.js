// Общие функции для хранилища файлов на Google Drive.
// Секреты задаются в Cloudflare Pages → Settings → Variables and Secrets (см. docs/DRIVE_SETUP.md):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, FILE_SIGN_SECRET
// Публичные значения Supabase берутся из env или по умолчанию совпадают с config.js (ключ publishable, он не секретный).
const SB_URL='https://bvlwpfmtcdgfsomvwqrp.supabase.co',SB_KEY='sb_publishable_S7nnUv3hs2bBZDhYhEFYew_j_S6s1sO';
export const ROOT_NAME='Дримвуд — файлы сайта';
export const KINDS={
  repairs:{dir:'Поломки',files:'repair_files',rec:'repairs',fk:'repair_id',col:'zone'},
  inc:{dir:'Происшествия',files:'inc_files',rec:'incidents',fk:'inc_id',col:'zone'},
  dg:{dir:'Задачи DreamGile',files:'dg_files',rec:'dg_tasks',fk:'task_id',col:'title'},
  wo:{dir:'Списания',files:'wo_files',rec:'writeoffs',fk:'wo_id',col:'item'}
};
export const sbUrl=env=>env.SUPABASE_URL||SB_URL;
export const sbKey=env=>env.SUPABASE_ANON_KEY||SB_KEY;
export const configured=env=>!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.GOOGLE_REFRESH_TOKEN&&env.FILE_SIGN_SECRET);
export const json=(o,status=200,h={})=>new Response(JSON.stringify(o),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...h}});
export const bearer=req=>{const m=(req.headers.get('authorization')||'').match(/^Bearer\s+(.+)$/i);return m?m[1]:null};

// пользователь по токену Supabase (null, если токен чужой или просрочен)
export async function authUser(req,env){
  const t=bearer(req);if(!t)return null;
  const r=await fetch(sbUrl(env)+'/auth/v1/user',{headers:{authorization:'Bearer '+t,apikey:sbKey(env)}});
  if(!r.ok)return null;const u=await r.json();return u&&u.id?{id:u.id,token:t}:null;
}
// запрос в таблицы Supabase от имени пользователя: RLS работает как обычно
export async function sbGet(env,token,path){
  const r=await fetch(sbUrl(env)+'/rest/v1/'+path,{headers:{authorization:'Bearer '+token,apikey:sbKey(env)}});
  return r.ok?r.json():[];
}

let tokCache={t:null,exp:0};
export async function gToken(env){
  if(tokCache.t&&tokCache.exp>Date.now()+60e3)return tokCache.t;
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:env.GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'})});
  const j=await r.json();if(!r.ok||!j.access_token)throw new Error('google_token: '+(j.error_description||j.error||r.status));
  tokCache={t:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};return tokCache.t;
}
const gh=t=>({authorization:'Bearer '+t});
const qq=s=>String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const folderCache=new Map();
export async function ensureFolder(tok,parent,name){
  const key=parent+'/'+name,c=folderCache.get(key);if(c)return c;
  const q=`name='${qq(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parent}' in parents`;
  const r=await fetch('https://www.googleapis.com/drive/v3/files?'+new URLSearchParams({q,fields:'files(id)',pageSize:'1',spaces:'drive'}),{headers:gh(tok)});
  const j=await r.json();if(!r.ok)throw new Error('drive_list: '+(j.error&&j.error.message||r.status));
  let id=j.files&&j.files[0]&&j.files[0].id;
  if(!id){
    const c2=await fetch('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{...gh(tok),'content-type':'application/json'},body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',...(parent==='root'?{}:{parents:[parent]})})});
    const cj=await c2.json();if(!c2.ok)throw new Error('drive_mkdir: '+(cj.error&&cj.error.message||c2.status));id=cj.id;
  }
  folderCache.set(key,id);return id;
}
// Москва: дата, время, месяц
export function msk(d=new Date()){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(x=>[x.type,x.value]));
  return {day:`${p.year}-${p.month}-${p.day}`,month:`${p.year}-${p.month}`,hm:p.hour+p.minute};
}
export const clean=(s,n=40)=>String(s||'').replace(/[\\/:*?"<>|\r\n\t#%]+/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
export const shortName=n=>{const w=clean(n,60).split(' ').filter(Boolean);return w.length>1?w[0]+' '+w[1][0]+'.':(w[0]||'')};

// подпись ссылки на файл
const enc=new TextEncoder();
const b64u=u=>btoa(String.fromCharCode(...new Uint8Array(u))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function sign(env,id,exp){
  const k=await crypto.subtle.importKey('raw',enc.encode(env.FILE_SIGN_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return b64u(await crypto.subtle.sign('HMAC',k,enc.encode(id+'.'+exp)));
}
export const okId=s=>/^[A-Za-z0-9_-]{10,100}$/.test(s||'');
