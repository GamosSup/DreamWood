// Анимированный логотип «Дримвуд»: подстраивается под тему (сезон, светлая/тёмная, Хеллоуин).
// По букве ходят человечки, вокруг мчатся американские горки, плывут облака, качаются ёлки.
let DWL_N=0;
function dwLogo(o={}){
  const id='dwl'+(++DWL_N),big=!!o.big,H=big?252:236;
  const P='M8 112C32 112 46 40 76 40C106 40 114 112 146 112A26 32 0 1 1 182 86C204 62 214 32 248 34C280 36 288 98 320 100C352 102 366 52 394 52C410 52 418 70 426 84';
  const S=1.7;
  const person=(c,dur,y,begin,x0,x1)=>`<g><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear" path="M${x0} ${y}H${x1}"/><g transform="scale(${S})"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -2.4;0 0" dur=".55s" repeatCount="indefinite"/><circle cx="0" cy="-17" r="4.6" fill="#FFD9B0" stroke="var(--lgs)" stroke-width="1.3"/><path d="M-4.8 -11.5h9.6l1.3 8.5h-12.2z" fill="${c}" stroke="var(--lgs)" stroke-width="1.3" stroke-linejoin="round"/><path d="M-2.4 -3v5M2.4 -3v5" stroke="var(--lgs)" stroke-width="2.1" stroke-linecap="round"><animate attributeName="d" values="M-2.4 -3v5M2.4 -3v5;M-4 -3l-2 5M4 -3l2 5;M-2.4 -3v5M2.4 -3v5;M-1 -3l3 5M1 -3l-3 5;M-2.4 -3v5M2.4 -3v5" dur=".55s" repeatCount="indefinite"/></path></g></g></g>`;
  const cart=(c,begin)=>`<g><animateMotion dur="9s" begin="${begin}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}p"/></animateMotion><g transform="scale(1.7)"><rect x="-9" y="-9" width="18" height="9" rx="3.5" fill="${c}" stroke="var(--lgs)" stroke-width="1.4"/><circle cx="-3.5" cy="-12.5" r="3.4" fill="#FFD9B0" stroke="var(--lgs)" stroke-width="1"/><circle cx="3.5" cy="-12.5" r="3.4" fill="#FFD9B0" stroke="var(--lgs)" stroke-width="1"/><circle cx="-5" cy="1" r="2.1" fill="var(--lgs)"/><circle cx="5" cy="1" r="2.1" fill="var(--lgs)"/></g></g>`;
  const tree=(x,s)=>`<g transform="translate(${x} 226) scale(${s})"><g><animateTransform attributeName="transform" type="rotate" values="-3 0 0;3 0 0;-3 0 0" dur="4s" repeatCount="indefinite"/><rect x="-2.4" y="-9" width="4.8" height="9" fill="#8A5A3C"/><path d="M0 -50L-15 -25H-7L-18 -9H18L7 -25H15Z" fill="var(--lgp)" stroke="var(--lgs)" stroke-width="1.5" stroke-linejoin="round"/></g></g>`;
  const ty=big?206:204,TXT=`x="212" y="${ty}" text-anchor="middle" textLength="404" lengthAdjust="spacingAndGlyphs" font-family="Alegreya,Georgia,serif" font-weight="900" font-size="112"`;
  let ext='';for(let i=9;i>=1;i--)ext+=`<text ${TXT} dx="${(i*.75).toFixed(2)}" dy="${(i*1.05).toFixed(2)}" fill="var(--lgd)" style="stroke:var(--lgd);stroke-width:5px" stroke-linejoin="round">Дримвуд</text>`;
  return `<svg class="dwl" viewBox="-6 0 436 ${H}" role="img" aria-label="Дримвуд — парк чудес и приключений" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lg1)"/><stop offset="1" style="stop-color:var(--lg2)"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><path id="${id}p" d="${P}"/></defs>
<g class="lg-d"><g><animateTransform attributeName="transform" type="rotate" from="0 396 28" to="360 396 28" dur="30s" repeatCount="indefinite"/><g stroke="#FFC857" stroke-width="3.2" stroke-linecap="round"><path d="M396 4v-6M396 52v6M372 28h-6M420 28h6M379 11l-4-4M413 45l4 4M413 11l4-4M379 45l-4 4"/></g></g><circle cx="396" cy="28" r="15" fill="#FFC857" stroke="var(--lgs)" stroke-width="1.8"/></g>
<g class="lg-n"><path d="M398 8a19 19 0 1 0 11 34a15 15 0 1 1 -11 -34z" fill="#FFE9A8" stroke="var(--lgs)" stroke-width="1.8"/><g fill="#fff"><circle cx="34" cy="18" r="2.4"><animate attributeName="opacity" values=".2;1;.2" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="160" cy="12" r="2"><animate attributeName="opacity" values="1;.2;1" dur="3s" repeatCount="indefinite"/></circle><circle cx="318" cy="18" r="2.4"><animate attributeName="opacity" values=".3;1;.3" dur="2.8s" repeatCount="indefinite"/></circle></g></g>
<g class="lg-c" fill="var(--lgc)" opacity=".85"><g><animateTransform attributeName="transform" type="translate" values="-30 0;40 0;-30 0" dur="26s" repeatCount="indefinite"/><ellipse cx="64" cy="18" rx="28" ry="10"/><ellipse cx="84" cy="12" rx="17" ry="10"/></g><g><animateTransform attributeName="transform" type="translate" values="30 0;-40 0;30 0" dur="32s" repeatCount="indefinite"/><ellipse cx="270" cy="12" rx="25" ry="9"/><ellipse cx="286" cy="8" rx="14" ry="8"/></g></g>
<g stroke="var(--lgt)" stroke-width="3.4" opacity=".55"><path d="M76 42V150M248 36V150M394 54V150M320 102V150M146 114V150"/></g>
<use href="#${id}p" fill="none" stroke="var(--lgs)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<use href="#${id}p" fill="none" stroke="var(--lgc)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<use href="#${id}p" fill="none" stroke="var(--lgs)" stroke-width="1.6" stroke-dasharray="2 8" opacity=".7"/>
${cart('#FF5E7E',0)}${cart('#4FC98F',-.8)}${cart('#52A7FF',-1.6)}
${ext}
<text ${TXT} fill="url(#${id}g)" style="stroke:var(--lgs);stroke-width:4px;paint-order:stroke" stroke-linejoin="round">Дримвуд</text>
<text ${TXT} fill="url(#${id}s)">Дримвуд</text>
${person('#FF7A59',9,152,0,150,400)}${person('#4FC98F',11,152,-2,126,380)}${person('#52A7FF',13,152,-5,176,404)}
<path d="M-4 226H432" stroke="var(--lgt)" stroke-width="3" stroke-linecap="round" opacity=".5"/>
<g class="lg-t">${tree(6,1.35)}${tree(420,1.5)}</g>
<g>${person('#FFB84D',16,224,0,40,386)}${person('#C77DFF',20,224,-3,60,366)}${person('#FF7A59',14,224,-6,30,396)}</g>
<g class="lg-h"><g font-size="40"><text x="22" y="226">🎃</text><text x="372" y="224">🎃</text></g><g><animateMotion dur="12s" repeatCount="indefinite" path="M-20 70Q100 24 212 80T450 46"/><text font-size="30" text-anchor="middle">🦇</text></g></g>
${big?`<text x="212" y="246" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="13" letter-spacing="3" style="fill:var(--lgt)">ПАРК ЧУДЕС И ПРИКЛЮЧЕНИЙ</text>`:''}
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
