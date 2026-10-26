// Прокси к Supabase: приложение ходит на свой домен (dreamwood.pages.dev/sb/...), а не на supabase.co.
// Так оно открывается у тех, у кого провайдер или оператор блокирует supabase.co.
const UP='https://bvlwpfmtcdgfsomvwqrp.supabase.co';
export async function onRequest({request,env}){
  const u=new URL(request.url);
  const target=(env.SUPABASE_URL||UP)+u.pathname.replace(/^\/sb/,'')+u.search;
  const h=new Headers(request.headers);
  ['host','cf-connecting-ip','cf-ipcountry','cf-ray','cf-visitor','x-forwarded-for','x-real-ip'].forEach(k=>h.delete(k));
  const body=request.method==='GET'||request.method==='HEAD'?undefined:request.body;
  return fetch(new Request(target,{method:request.method,headers:h,body,redirect:'manual'}));
}
