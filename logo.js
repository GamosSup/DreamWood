// Анимированный логотип «Дримвуд»: подстраивается под тему (сезон, светлая/тёмная, Хеллоуин).
// По букве ходят человечки, вокруг мчатся американские горки, плывут облака, качаются ёлки.
let DWL_N=0;
function dwLogo(o={}){
  const id='dwl'+(++DWL_N),big=!!o.big,H=big?214:196;
  const P='M6 74C30 74 44 26 72 26C100 26 108 74 140 74A20 20 0 1 1 170 58C190 42 200 22 232 24C262 26 270 62 300 64C330 66 345 32 372 32C392 32 402 52 414 58';
  const person=(c,d,dur,y,begin,x0,x1)=>`<g><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear" path="M${x0} ${y}H${x1}"/><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.4;0 0" dur=".55s" repeatCount="indefinite"/><circle cx="0" cy="-17" r="4.4" fill="#FFD9B0" stroke="var(--lgs)" stroke-width="1.2"/><path d="M-4.6 -11.5h9.2l1.2 8.5h-11.6z" fill="${c}" stroke="var(--lgs)" stroke-width="1.2" stroke-linejoin="round"/><path d="M-2.4 -3v5M2.4 -3v5" stroke="var(--lgs)" stroke-width="2" stroke-linecap="round"><animate attributeName="d" values="M-2.4 -3v5M2.4 -3v5;M-4 -3l-2 5M4 -3l2 5;M-2.4 -3v5M2.4 -3v5;M-1 -3l3 5M1 -3l-3 5;M-2.4 -3v5M2.4 -3v5" dur=".55s" repeatCount="indefinite"/></path></g></g>`;
  const cart=(c,begin)=>`<g><animateMotion dur="9s" begin="${begin}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}p"/></animateMotion><rect x="-9" y="-9" width="18" height="9" rx="3.5" fill="${c}" stroke="var(--lgs)" stroke-width="1.4"/><circle cx="-3.5" cy="-12.5" r="3.2" fill="#FFD9B0" stroke="var(--lgs)" stroke-width="1"/><circle cx="3.5" cy="-12.5" r="3.2" fill="#FFD9B0" stroke="var(--lgs)" stroke-width="1"/><circle cx="-5" cy="1" r="2" fill="var(--lgs)"/><circle cx="5" cy="1" r="2" fill="var(--lgs)"/></g>`;
  const tree=(x,s)=>`<g transform="translate(${x} 190) scale(${s})"><g><animateTransform attributeName="transform" type="rotate" values="-3 0 0;3 0 0;-3 0 0" dur="4s" repeatCount="indefinite"/><rect x="-2" y="-8" width="4" height="8" fill="#8A5A3C"/><path d="M0 -44L-13 -22H-6L-16 -8H16L6 -22H13Z" fill="var(--lgp)" stroke="var(--lgs)" stroke-width="1.4" stroke-linejoin="round"/></g></g>`;
  return `<svg class="dwl" viewBox="0 0 420 ${H}" role="img" aria-label="Дримвуд — парк чудес и приключений" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lg1)"/><stop offset="1" style="stop-color:var(--lg2)"/></linearGradient><path id="${id}p" d="${P}"/></defs>
<g class="lg-d"><g><animateTransform attributeName="transform" type="rotate" from="0 392 22" to="360 392 22" dur="30s" repeatCount="indefinite"/><g stroke="#FFC857" stroke-width="2.4" stroke-linecap="round"><path d="M392 6v-5M392 38v5M376 22h-5M408 22h5M381 11l-3-3M403 33l3 3M403 11l3-3M381 33l-3 3"/></g></g><circle cx="392" cy="22" r="10" fill="#FFC857" stroke="var(--lgs)" stroke-width="1.4"/></g>
<g class="lg-n"><path d="M394 8a14 14 0 1 0 8 25a11 11 0 1 1 -8 -25z" fill="#FFE9A8" stroke="var(--lgs)" stroke-width="1.4"/><g fill="#fff"><circle cx="30" cy="14" r="1.8"><animate attributeName="opacity" values=".2;1;.2" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="150" cy="10" r="1.5"><animate attributeName="opacity" values="1;.2;1" dur="3s" repeatCount="indefinite"/></circle><circle cx="300" cy="14" r="1.8"><animate attributeName="opacity" values=".3;1;.3" dur="2.8s" repeatCount="indefinite"/></circle></g></g>
<g class="lg-c" fill="var(--lgc)" opacity=".85"><g><animateTransform attributeName="transform" type="translate" values="-30 0;40 0;-30 0" dur="26s" repeatCount="indefinite"/><ellipse cx="60" cy="14" rx="20" ry="7"/><ellipse cx="74" cy="10" rx="12" ry="7"/></g><g><animateTransform attributeName="transform" type="translate" values="30 0;-40 0;30 0" dur="32s" repeatCount="indefinite"/><ellipse cx="260" cy="10" rx="18" ry="6"/><ellipse cx="272" cy="7" rx="10" ry="6"/></g></g>
<g stroke="var(--lgt)" stroke-width="2.4" opacity=".55"><path d="M72 28V118M232 26V118M372 34V118M300 66V118M140 76V118"/></g>
<use href="#${id}p" fill="none" stroke="var(--lgs)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<use href="#${id}p" fill="none" stroke="var(--lgc)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
<use href="#${id}p" fill="none" stroke="var(--lgs)" stroke-width="1.2" stroke-dasharray="1.5 6" opacity=".7"/>
${cart('#FF5E7E',0)}${cart('#4FC98F',-.7)}${cart('#52A7FF',-1.4)}
<text x="210" y="${big?176:172}" text-anchor="middle" font-family="Alegreya,Georgia,serif" font-weight="800" font-size="86" fill="url(#${id}g)" style="stroke:var(--lgs);stroke-width:3.4px;paint-order:stroke" stroke-linejoin="round">Дримвуд</text>
${person('#FF7A59',0,9,131,0,150,396).replace('<g><animateMotion','<g><animateMotion')}${person('#4FC98F',0,11,131,-2,120,380)}${person('#52A7FF',0,13,131,-5,170,390)}
<path d="M0 190H420" stroke="var(--lgt)" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>
<g class="lg-t">${tree(14,1)}${tree(404,1.1)}</g>
${(()=>{const y=186;return `<g>${person('#FFB84D',0,16,y,0,40,380)}${person('#C77DFF',0,20,y,-3,60,360)}${person('#FF7A59',0,14,y,-6,30,390)}</g>`})()}
<g class="lg-h"><g font-size="30"><text x="30" y="188">🎃</text><text x="372" y="186">🎃</text></g><g><animateMotion dur="12s" repeatCount="indefinite" path="M-20 60Q100 20 210 70T440 40"/><text font-size="22" text-anchor="middle">🦇</text></g></g>
${big?`<text x="210" y="209" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="11.5" letter-spacing="2.6" style="fill:var(--lgt)">ПАРК ЧУДЕС И ПРИКЛЮЧЕНИЙ</text>`:''}
</svg>`;
}
(function(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){
    const stop=()=>document.querySelectorAll('svg.dwl').forEach(s=>{try{s.pauseAnimations()}catch(e){}});
    new MutationObserver(stop).observe(document.documentElement,{childList:true,subtree:true});
  }
})();
// экран загрузки
(function(){
  const s=document.getElementById('splash');if(!s)return;
  s.innerHTML=`<div class="spl">${dwLogo({big:1})}<div class="spd"><i></i><i></i><i></i></div></div>`;
  const t0=Date.now();let gone=false;
  const hide=()=>{if(gone)return;gone=true;s.classList.add('off');setTimeout(()=>s.remove(),600)};
  const app=document.getElementById('app'),chk=()=>{if(app&&app.children.length&&!app.querySelector('.sk,.skel')){const w=Math.max(0,1100-(Date.now()-t0));setTimeout(hide,w)}};
  if(app)new MutationObserver(chk).observe(app,{childList:true});
  setTimeout(hide,9000);
})();

(function(){const nl=document.getElementById('navlogo');if(nl)nl.innerHTML=dwLogo()})();
