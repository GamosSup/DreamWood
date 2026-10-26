// Отправка Web Push (RFC 8030 + RFC 8291 aes128gcm + VAPID RFC 8292) на чистом WebCrypto.
// Вызывается из базы (триггер на notifications через pg_net). Ключи VAPID приходят в теле запроса.
const HOSTS=[/(^|\.)fcm\.googleapis\.com$/,/(^|\.)push\.services\.mozilla\.com$/,/(^|\.)push\.apple\.com$/,/(^|\.)notify\.windows\.com$/,/(^|\.)push\.services\.mozilla\.org$/];
const enc=new TextEncoder();
const b64u=u=>btoa(String.fromCharCode(...new Uint8Array(u))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0));
const cat=(...a)=>{const n=a.reduce((s,x)=>s+x.length,0),o=new Uint8Array(n);let i=0;for(const x of a){o.set(x,i);i+=x.length}return o};
async function hkdf(salt,ikm,info,len){
  const k=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,len*8));
}
async function encrypt(sub,text){
  const ua=unb64u(sub.p256dh),auth=unb64u(sub.auth);
  const eph=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const asPub=new Uint8Array(await crypto.subtle.exportKey('raw',eph.publicKey));
  const uaKey=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const secret=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:uaKey},eph.privateKey,256));
  const prk=await hkdf(auth,secret,cat(enc.encode('WebPush: info\0'),ua,asPub),32);
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const cek=await hkdf(salt,prk,enc.encode('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdf(salt,prk,enc.encode('Content-Encoding: nonce\0'),12);
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const data=cat(enc.encode(text),new Uint8Array([2]));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,data));
  const rs=new Uint8Array([0,0,16,0]);
  return cat(salt,rs,new Uint8Array([asPub.length]),asPub,ct);
}
async function vapid(aud,jwk,pub){
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const h=b64u(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const c=b64u(enc.encode(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+12*3600,sub:'https://dreamwood.pages.dev'})));
  const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(h+'.'+c));
  return `vapid t=${h}.${c}.${b64u(sig)}, k=${pub}`;
}
export async function onRequestPost({request}){
  let b;try{b=await request.json()}catch{return new Response('bad json',{status:400})}
  const {pub,jwk,subs,msg}=b||{};
  if(!pub||!jwk||!Array.isArray(subs)||!msg)return new Response('bad request',{status:400});
  const payload=JSON.stringify({title:String(msg.title||'Дримвуд').slice(0,100),body:String(msg.body||'').slice(0,200),link:msg.link||null,tag:msg.tag||null,urgent:!!msg.urgent});
  const out=await Promise.all(subs.slice(0,40).map(async s=>{
    try{
      const u=new URL(s.endpoint);
      if(u.protocol!=='https:'||!HOSTS.some(r=>r.test(u.hostname)))return {e:s.endpoint,s:0,err:'host'};
      const body=await encrypt(s,payload);
      const r=await fetch(s.endpoint,{method:'POST',headers:{'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:msg.urgent?'1800':'86400',Urgency:msg.urgent?'high':'normal',Authorization:await vapid(u.origin,jwk,pub)},body});
      return {e:s.endpoint.slice(-12),s:r.status};
    }catch(err){return {e:'?',s:0,err:String(err).slice(0,80)}}
  }));
  return Response.json(out);
}
export const onRequestGet=()=>new Response('ok');
