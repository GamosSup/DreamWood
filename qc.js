// Быстрые переключения: кэш запросов «показать сразу, обновить в фоне».
// Повторный заход на экран рисуется мгновенно из памяти, свежие данные приходят следом и экран тихо обновляется, если что-то изменилось.
(function(){
  if(typeof sb==='undefined'||sb.__qc)return;
  const origFrom=sb.from.bind(sb),origRpc=sb.rpc.bind(sb);
  const NOCACHE=new Set(['alerts','alert_acks','notifications','notif_reads','push_subs','checkins','dg_tasks','profiles','app_settings']); // срочное и уведомления — всегда с сервера
  const NOSAVE=new Set(['todos','habits','habit_logs','day_notes','mentor_q','onb_items']);  // личное: только в памяти, на диск не пишем
  const WRITES=['insert','update','upsert','delete'];
  const TTL=6*3600e3,FRESH=1500,MAXN=400;
  const mem=new Map(),inflight=new Map();
  const uid=()=>{try{return storedUid()}catch(e){return null}};
  const skey=()=>'dw:qc:'+(uid()||'');
  // ---- подгрузка с диска (только неличные таблицы) ----
  try{const j=JSON.parse(localStorage.getItem(skey())||'null');if(j&&Date.now()-j.t<TTL*2)Object.entries(j.m).forEach(([k,v])=>mem.set(k,v))}catch(e){}
  let saveT=null;
  const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>{try{
    const m={};let size=0;
    [...mem.entries()].sort((a,b)=>b[1].t-a[1].t).forEach(([k,v])=>{if(NOSAVE.has(k.split('|')[0]))return;const s=JSON.stringify(v).length;if(s>150000||size+s>1800000)return;size+=s;m[k]=v});
    localStorage.setItem(skey(),JSON.stringify({t:Date.now(),m}))}catch(e){}},2500)};
  const gv={all:0};
  const clr=tb=>{gv.all++;if(tb)gv[tb]=(gv[tb]||0)+1;[...mem.keys()].forEach(k=>{if(!tb||k.startsWith(tb+'|'))mem.delete(k)});save()};
  window.qcRerender=()=>rerender();
  window.qcClear=()=>{mem.clear();try{localStorage.removeItem(skey())}catch(e){}};
  const clone=r=>{try{return structuredClone(r)}catch(e){return JSON.parse(JSON.stringify(r))}};
  // экран обновляется сам, когда фоновая загрузка принесла другие данные
  let rt=null;
  const rerender=()=>{clearTimeout(rt);rt=setTimeout(()=>{
    try{
      if(!S.me||!S.tab||document.hidden)return;
      if(document.querySelector('.ov,.alov,#tour,.ibox'))return;
      const ae=document.activeElement;if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;
      if(Date.now()-(S.qcTouch||0)<3000)return;
      const f=VIEWS[S.tab];if(f)keepScroll(f);
    }catch(e){}},400)};
  document.addEventListener('pointerdown',()=>{S.qcTouch=Date.now()},{passive:true,capture:true});
  document.addEventListener('keydown',()=>{S.qcTouch=Date.now()},{capture:true});

  function recorder(tb){
    const ops=[];let write=false;
    const build=()=>{let b=origFrom(tb);ops.forEach(([k,a])=>{b=b[k](...a)});return b};
    const run=()=>{
      if(write){return Promise.resolve(build()).then(r=>{if(!r||!r.error)clr(tb);return r},e=>{throw e})}
      const key=tb+'|'+JSON.stringify(ops);
      if(NOCACHE.has(tb))return Promise.resolve(build());
      const hit=mem.get(key),now=Date.now();
      const fetchReal=()=>{
        if(inflight.has(key))return inflight.get(key);
        const v0=gv.all+':'+(gv[tb]||0);
        const p=Promise.resolve(build()).then(r=>{inflight.delete(key);
          if(r&&!r.error&&v0!==gv.all+':'+(gv[tb]||0))return {r,changed:false,had:!!hit};
          if(r&&!r.error){const old=mem.get(key),same=old&&JSON.stringify(old.r.data)===JSON.stringify(r.data)&&old.r.count===r.count;
            mem.set(key,{t:Date.now(),r:clone({data:r.data,count:r.count,error:null})});
            if(mem.size>MAXN){[...mem.entries()].sort((a,b)=>a[1].t-b[1].t).slice(0,60).forEach(([k])=>mem.delete(k))}
            save();return {r,changed:!same,had:!!old}}
          return {r,changed:false,had:!!hit}},e=>{inflight.delete(key);throw e});
        inflight.set(key,p);return p};
      if(hit&&now-hit.t<TTL){
        if(now-hit.t>FRESH)fetchReal().then(x=>{if(x.changed)rerender()},()=>{});
        return Promise.resolve(clone(hit.r));
      }
      return fetchReal().then(x=>x.r);
    };
    const p=new Proxy(function(){},{get(_,k){
      if(k==='then')return (res,rej)=>run().then(res,rej);
      if(k==='catch')return f=>run().catch(f);
      if(k==='finally')return f=>run().finally(f);
      return (...a)=>{ops.push([k,a]);if(WRITES.includes(k))write=true;return p}}});
    return p;
  }
  sb.from=tb=>recorder(tb);
  // rpc-запросы чаще всего меняют данные: сбрасываем кэш, кроме безобидных чтений
  const RPC_READ=new Set(['my_roster_name','metro_for_day','mark_seen','game_all','ach_sync','ach_stats','ach_claim']);
  sb.rpc=(n,a,o)=>{const p=origRpc(n,a,o);if(!RPC_READ.has(n))Promise.resolve(p).then(()=>clr(),()=>{});return p};
  sb.__qc=1;
})();
