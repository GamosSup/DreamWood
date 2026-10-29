// 2.5D-сцены питомца: независимые SVG-слои, глубина, погода и параллакс без WebGL.
const P25_DEF={enabled:true,hour:15,weather:'auto',density:.8,speed:.7,depth:.8,shift:0};
const P25_THEMES={
  bg_default:'nature',bg_meadow:'nature',bg_sky:'nature',bg_glade:'nature',bg_peach:'nature',bg_mintbg:'nature',bg_lavbg:'nature',bg_lilac:'nature',
  bg_forest:'forest',bg_forest2:'forest',bg_forestd:'forest',bg_foggy:'forest',bg_sakura:'forest',
  bg_water:'water',bg_deep:'water',bg_shore:'water',bg_reef:'water',bg_deepsea:'water',
  bg_snow:'snow',bg_snowfall:'snow',bg_polar:'snow',bg_mooncast:'snow',
  bg_mount:'mountain',bg_sunset:'mountain',bg_dusk:'mountain',bg_castle:'mountain',bg_marsb:'mountain',bg_lair:'mountain',
  bg_candy:'candy',bg_dome:'fest',bg_event:'fest',bg_fireworks:'fest',
  bg_night:'space',bg_space:'space',bg_nebula:'space',bg_aurora:'aurora',
  bg_latte:'cozy',bg_cream:'cozy',bg_cafe:'cozy',bg_cozy:'cozy',bg_masha:'cozy',bg_arcade:'neon',bg_kris:'neon'
};
const P25_PAL={
  nature:{sky:'#91D3EE',sky2:'#E6F4D8',ground:'#8FBE68',ground2:'#609646',accent:'#FFD966',leaf:'#4E9C52'},
  forest:{sky:'#86B9A0',sky2:'#D9D6A8',ground:'#426F3E',ground2:'#294F35',accent:'#FFB45E',leaf:'#2F7D4F'},
  water:{sky:'#167B9F',sky2:'#5CC4D2',ground:'#C7B783',ground2:'#779A78',accent:'#FF8D7A',leaf:'#4BAF8A'},
  snow:{sky:'#A9CDE8',sky2:'#EDF5FA',ground:'#E8F1F8',ground2:'#B9D1E3',accent:'#FF8E87',leaf:'#DDE9EF'},
  mountain:{sky:'#F5AE83',sky2:'#F6D3A2',ground:'#75617E',ground2:'#514664',accent:'#FFD28A',leaf:'#4C6657'},
  candy:{sky:'#F6B8DB',sky2:'#FCE2EE',ground:'#D9B4F2',ground2:'#AE88D6',accent:'#FF6F9F',leaf:'#9DDED0'},
  fest:{sky:'#7661BB',sky2:'#C188C7',ground:'#4E3D83',ground2:'#30265C',accent:'#FFD45E',leaf:'#FF7B9E'},
  space:{sky:'#070B27',sky2:'#1B2450',ground:'#24204C',ground2:'#12132F',accent:'#9D8CFF',leaf:'#6ED6FF'},
  aurora:{sky:'#07162E',sky2:'#12354B',ground:'#173D4B',ground2:'#0C2636',accent:'#69FFC3',leaf:'#A58CFF'},
  cozy:{sky:'#6F4B43',sky2:'#9B6B54',ground:'#8A5A3C',ground2:'#5B3B31',accent:'#FFB45E',leaf:'#D9B48A'},
  neon:{sky:'#090823',sky2:'#17102D',ground:'#17102D',ground2:'#090819',accent:'#FF3FA4',leaf:'#36E4FF'}
};
const P25_VAR={
  bg_forest:{sky:'#E8B178',ground:'#75533A',leaf:'#B76B38'},bg_forest2:{sky:'#326D55',ground:'#244D36',leaf:'#4E9C52',accent:'#FFF09A'},
  bg_foggy:{sky:'#9AAEA5',ground:'#556C5D',leaf:'#607D68'},bg_sakura:{sky:'#F8D7E5',ground:'#8CB785',leaf:'#E99ABB',accent:'#FFF1F6'},
  bg_shore:{sky:'#86D5EA',ground:'#E4CD91',accent:'#FF9E78'},bg_reef:{sky:'#258FB1',ground:'#C7B783',accent:'#FF7C88'},bg_deep:{sky:'#145879',ground:'#55736D'},bg_deepsea:{sky:'#082E4B',ground:'#274C55'},
  bg_polar:{sky:'#101C46',ground:'#C5D9EE',accent:'#8CE8FF'},bg_mooncast:{sky:'#172044',ground:'#AEBEDD',accent:'#D8E5FF'},
  bg_dusk:{sky:'#72578F',ground:'#514664',accent:'#FFAD8A'},bg_marsb:{sky:'#B94E35',ground:'#79382C',accent:'#FFB077',leaf:'#66504A'},bg_lair:{sky:'#24182E',ground:'#382C38',accent:'#FF704D',leaf:'#514052'},
  bg_latte:{sky:'#8A6654',ground:'#A77B58'},bg_cream:{sky:'#B18D70',ground:'#C9A77E'},bg_cozy:{sky:'#5B3833',ground:'#754632',accent:'#FF9C52'},
  bg_night:{sky:'#111A43',ground:'#252658'},bg_nebula:{sky:'#180D38',ground:'#302054',accent:'#FF79C8'},bg_aurora:{sky:'#061A2B',ground:'#123B45'},
  bg_arcade:{sky:'#10082B',ground:'#1B1033',accent:'#FF2DAA',leaf:'#2DE2FF'},bg_kris:{sky:'#070D26',ground:'#151335',accent:'#7B2DFF',leaf:'#2DE2FF'}
};
const p25Cfg=row=>({...P25_DEF,...((row&&row.cos&&row.cos.p25d)||{})});
let P25_N=0;
function p25Info(bg,hour){
  const theme=P25_THEMES[bg]||'nature',base={theme,...P25_PAL[theme],...(P25_VAR[bg]||{})},h=((+hour||0)%24+24)%24,day=Math.max(.06,Math.sin((h-6)*Math.PI/12)),night=Math.max(0,.72-day*.65);
  return{...base,hour:h,day,sky:pMix(base.sky,'#08132E',night),sky2:pMix(base.sky2,'#101A36',night*.82),ground:pMix(base.ground,'#101B2D',night*.38),ground2:pMix(base.ground2,'#101827',night*.35)};
}
const p25Clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function p25Rnd(seed){let s=seed||137;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
function p25Defs(id,i){return`<defs>
  <linearGradient id="${id}sky" x2="0" y2="1"><stop stop-color="${i.sky}"/><stop offset="1" stop-color="${i.sky2}"/></linearGradient>
  <linearGradient id="${id}ground" x2="0" y2="1"><stop stop-color="${i.ground}"/><stop offset="1" stop-color="${i.ground2}"/></linearGradient>
  <linearGradient id="${id}cloud" x2="0" y2="1"><stop stop-color="#FFFEF7"/><stop offset="1" stop-color="#E3EDE4"/></linearGradient>
  <radialGradient id="${id}leaf" cx=".32" cy=".22" r=".86"><stop stop-color="${pMix(i.leaf,'#DDF2A5',.35)}"/><stop offset=".55" stop-color="${i.leaf}"/><stop offset="1" stop-color="${pMix(i.leaf,'#173B35',.45)}"/></radialGradient>
  <linearGradient id="${id}trunk" x2="1" y2="0"><stop stop-color="#60432F"/><stop offset=".48" stop-color="#9A6C43"/><stop offset="1" stop-color="#51392C"/></linearGradient>
  <radialGradient id="${id}glow"><stop stop-color="${i.accent}" stop-opacity=".8"/><stop offset="1" stop-color="${i.accent}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}accent" x2=".8" y2="1"><stop stop-color="${pMix(i.accent,'#FFFFFF',.35)}"/><stop offset="1" stop-color="${i.accent}"/></linearGradient>
  <filter id="${id}shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#203B35" flood-opacity=".22"/></filter>
</defs>`}
function p25Cloud(x,y,s,id,op=.9){return`<g class="p25-cloud" transform="translate(${x} ${y}) scale(${s})" fill="url(#${id}cloud)" opacity="${op}"><ellipse cx="90" cy="35" rx="82" ry="24"/><circle cx="60" cy="25" r="30"/><circle cx="102" cy="15" r="38"/><circle cx="139" cy="29" r="25"/></g>`}
function p25Tree(x,y,s,id,i,snow=false){const leaf=snow?'#E8F1F5':`url(#${id}leaf)`;return`<g transform="translate(${x} ${y}) scale(${s})" filter="url(#${id}shadow)"><path d="M98 171L89 280H116L108 171Z" fill="url(#${id}trunk)"/><circle cx="102" cy="104" r="76" fill="${leaf}"/><circle cx="54" cy="135" r="51" fill="${leaf}"/><circle cx="150" cy="137" r="55" fill="${leaf}"/><circle cx="77" cy="66" r="46" fill="${leaf}" opacity=".92"/><circle cx="134" cy="73" r="48" fill="${leaf}"/><path d="M52 105Q77 67 114 58" fill="none" stroke="#FFF" stroke-opacity=".18" stroke-width="8" stroke-linecap="round"/></g>`}
function p25Sky(id,i,clouds=true){const night=i.day<.35;return`<svg class="p25-layer p25-sky" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice">${p25Defs(id,i)}<rect width="1080" height="660" fill="url(#${id}sky)"/><circle cx="814" cy="105" r="155" fill="url(#${id}glow)" opacity="${night?.35:.72}"/>${night?`<circle cx="814" cy="105" r="34" fill="#E8EDF2" opacity=".9"/><circle cx="827" cy="95" r="34" fill="${i.sky}"/>`:''}${clouds?p25Cloud(102,76,1,id)+p25Cloud(772,157,.72,id,.82)+p25Cloud(433,104,.42,id,.58):''}</svg>`}
function p25Particles(kind,count,seed){const rnd=p25Rnd(seed),n=Math.max(0,Math.round(count));let h='';for(let j=0;j<n;j++)h+=`<i style="--x:${(rnd()*100).toFixed(1)}%;--y:${(rnd()*82).toFixed(1)}%;--dl:${(-rnd()*8).toFixed(2)}s;--sz:${(3+rnd()*6).toFixed(1)}px;--dr:${(rnd()-.5)*30}deg"></i>`;return`<div class="p25-particles p25-${kind}">${h}</div>`}
function p25FrontGrass(id,i){return`<svg class="p25-layer p25-front" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 660V574Q30 599 43 533Q63 581 74 516Q94 586 115 538Q128 600 159 556Q172 612 209 586L238 660Z" fill="${i.ground2}"/><path d="M1080 660V558Q1048 595 1031 523Q1006 582 988 540Q970 602 945 550Q921 607 890 581L854 660Z" fill="${i.ground2}"/><path d="M408 660Q416 612 426 579Q429 625 443 602Q438 633 452 660M633 660Q642 614 653 586Q651 627 667 604Q660 637 675 660" fill="${i.ground2}" opacity=".85"/><path d="M0 650Q176 622 333 656Q523 629 712 655Q911 619 1080 649V660H0Z" fill="${pMix(i.ground2,'#102D27',.35)}" opacity=".7"/></svg>`}
function p25Outdoor(bg,id,i,cfg){
  const snow=i.theme==='snow',forest=i.theme==='forest',rnd=p25Rnd(101+bg.length),N=n=>Math.max(1,Math.round(n*p25Clamp(+cfg.density||.8,.35,1)));
  let trees='';[[55,180,1.2],[846,169,1.27],[260,299,.58],[718,307,.5]].forEach(a=>trees+=p25Tree(a[0],a[1],a[2],id,i,snow));
  for(let j=0;j<N(3);j++)trees+=p25Tree(120+rnd()*790,310+rnd()*70,.24+rnd()*.22,id,i,snow);
  let details='';
  if(snow)details=`<g transform="translate(790 425)" filter="url(#${id}shadow)"><ellipse cx="55" cy="128" rx="64" ry="16" fill="#8FAFC4" opacity=".25"/><circle cx="55" cy="91" r="48" fill="#F3F7FA"/><circle cx="55" cy="25" r="35" fill="#F7FAFC"/><path d="M20 8H90L79-9H31Z" fill="#343246"/><path d="M88 29L124 39L88 43Z" fill="${i.accent}"/><circle cx="43" cy="18" r="4" fill="#343246"/><circle cx="67" cy="18" r="4" fill="#343246"/><path d="M43 82V110M66 82V110" stroke="#7890A2" stroke-width="5" stroke-linecap="round"/></g>`;
  else if(forest)details=`<g transform="translate(185 493)" filter="url(#${id}shadow)"><path d="M14 36V61H31V36Z" fill="#F1DEC0"/><path d="M0 38Q21-8 45 38Z" fill="${i.accent}"/><circle cx="16" cy="23" r="4" fill="#FFF3D6"/><circle cx="30" cy="17" r="3" fill="#FFF3D6"/></g><g transform="translate(826 512) scale(.7)"><path d="M14 36V61H31V36Z" fill="#F1DEC0"/><path d="M0 38Q21-8 45 38Z" fill="${i.accent}"/></g>`;
  else{for(let j=0;j<N(15);j++){const x=45+rnd()*990,y=430+rnd()*150,c=j%2?i.accent:'#FFF8E7';details+=`<g transform="translate(${x} ${y}) scale(${.45+rnd()*.45})"><path d="M0 38Q5 17 2 0" stroke="#3D7B3D" stroke-width="4"/><g fill="${c}"><ellipse cx="2" cy="0" rx="6" ry="12"/><ellipse cx="2" cy="0" rx="6" ry="12" transform="rotate(72 2 0)"/><ellipse cx="2" cy="0" rx="6" ry="12" transform="rotate(144 2 0)"/><ellipse cx="2" cy="0" rx="6" ry="12" transform="rotate(216 2 0)"/><ellipse cx="2" cy="0" rx="6" ry="12" transform="rotate(288 2 0)"/></g><circle cx="2" cy="0" r="6" fill="#F2BF55"/></g>`}}
  const path=i.theme==='nature'?`<path d="M525 365C493 411 567 437 506 473C448 507 393 564 345 660H741C668 567 580 521 584 474C588 431 548 408 558 365Z" fill="#DCCB8E"/><path d="M525 365C493 411 567 437 506 473C448 507 393 564 345 660" fill="none" stroke="#F4E8B2" stroke-opacity=".45" stroke-width="5"/>`:'';
  return p25Sky(id,i)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 349Q112 256 242 323Q365 221 502 321Q650 227 786 316Q937 244 1080 328V660H0Z" fill="${pMix(i.ground,'#E7F0D5',.25)}"/></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 413Q152 330 324 386Q492 325 648 386Q852 311 1080 403V660H0Z" fill="url(#${id}ground)"/>${path}${trees}${details}</svg>`+p25FrontGrass(id,i);
}
function p25Water(bg,id,i,cfg){
  const rnd=p25Rnd(222+bg.length),N=n=>Math.max(1,Math.round(n*p25Clamp(+cfg.density||.8,.35,1)));let coral='',fish='';
  for(let j=0;j<N(10);j++){const x=30+rnd()*1010,y=460+rnd()*130,s=.5+rnd()*.8;coral+=`<g transform="translate(${x} ${y}) scale(${s})" filter="url(#${id}shadow)"><path d="M0 75Q-5 32 5 0M4 45Q30 26 26 4M1 58Q-28 39-24 17" fill="none" stroke="${j%2?i.accent:i.leaf}" stroke-width="13" stroke-linecap="round"/></g>`}
  for(let j=0;j<N(7);j++){const x=80+rnd()*900,y=170+rnd()*250,s=.45+rnd()*.55;fish+=`<g class="p25-fish" style="--dl:${-j*.7}s" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="42" ry="24" fill="${j%2?i.accent:'#FFD166'}"/><path d="M-37 0L-72-27V27Z" fill="${j%2?i.accent:'#FFD166'}"/><circle cx="22" cy="-6" r="5" fill="#233141"/><path d="M-9-19Q7-30 20-17" fill="none" stroke="#FFF" stroke-opacity=".35" stroke-width="5"/></g>`}
  return p25Sky(id,i,false)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M170 0L390 0L650 570L470 570Z" fill="#D9FAFF" opacity=".09"/><path d="M570 0L680 0L870 500L760 500Z" fill="#D9FAFF" opacity=".07"/><path d="M0 548Q260 501 520 546Q820 490 1080 541V660H0Z" fill="url(#${id}ground)"/></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice">${coral}${fish}</svg><svg class="p25-layer p25-front" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 660V492Q42 532 54 446Q96 526 112 477Q147 550 166 660M1080 660V470Q1038 527 1020 451Q986 526 962 485Q932 554 914 660" fill="${pMix(i.leaf,'#0D4851',.45)}" opacity=".9"/></svg>`;
}
function p25Mountain(bg,id,i,cfg){
  let mountains='';for(let j=0;j<7;j++){if(bg==='bg_castle'&&j>1&&j<5)continue;const x=-60+j*180,y=160+(j%2)*45;mountains+=`<path d="M${x} 465L${x+145} ${y}L${x+300} 465Z" fill="${j%2?i.ground:pMix(i.ground,'#30283E',.25)}"/><path d="M${x+92} ${y+72}L${x+145} ${y}L${x+202} ${y+72}L${x+165} ${y+57}L${x+143} ${y+82}L${x+124} ${y+57}Z" fill="#E9E4DA" opacity=".85"/>`}
  const castle=bg==='bg_castle'?`<g transform="translate(380 255)" filter="url(#${id}shadow)"><path d="M0 210V65H320V210Z" fill="#B8A7A1"/><path d="M25 210V20H105V210M215 210V20H295V210" fill="#C7B8AF"/><path d="M15 20L65-55L115 20ZM205 20L255-55L305 20Z" fill="#755089"/><path d="M135 210V123Q160 84 185 123V210Z" fill="#42374B"/><path d="M48 74H78V110H48ZM242 74H272V110H242Z" fill="#FFE8A3"/></g>`:'';
  return p25Sky(id,i)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice">${mountains}</svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 445Q260 390 540 449Q820 388 1080 441V660H0Z" fill="url(#${id}ground)"/>${castle}${bg==='bg_castle'?'':p25Tree(95,310,.65,id,i)+p25Tree(850,320,.55,id,i)}</svg>`+p25FrontGrass(id,i);
}
function p25Candy(bg,id,i,cfg){
  const rnd=p25Rnd(333),N=n=>Math.max(1,Math.round(n*p25Clamp(+cfg.density||.8,.35,1)));let candies='';for(let j=0;j<N(8);j++){const x=40+rnd()*1000,y=330+rnd()*180,s=.45+rnd()*.55;candies+=`<g class="p25-float" style="--dl:${-j*.5}s" transform="translate(${x} ${y}) scale(${s})" filter="url(#${id}shadow)"><path d="M0 70V160" stroke="#FFF4E8" stroke-width="13"/><circle cx="0" cy="35" r="48" fill="${j%2?i.accent:i.leaf}"/><path d="M-28 35Q0 0 28 35Q0 70-28 35Z" fill="#FFF" opacity=".45"/></g>`}
  return p25Sky(id,i)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 410Q180 280 360 410Q540 270 720 410Q900 290 1080 410V660H0Z" fill="${pMix(i.ground,'#FFFFFF',.25)}"/></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 470Q280 390 540 470Q810 390 1080 465V660H0Z" fill="url(#${id}ground)"/>${candies}<g class="p25-float" transform="translate(240 180) rotate(-15)"><circle r="61" fill="url(#${id}accent)"/><circle r="28" fill="${i.sky2}"/><path d="M-45-30L45 30M-48 0L28 52M-20-53L53-4" stroke="#FFF" stroke-width="8" opacity=".5"/></g></svg>`+p25FrontGrass(id,i);
}
function p25Fest(bg,id,i,cfg){
  let balloons='';for(let j=0;j<5;j++){const x=90+j*205,y=260+(j%2)*65;balloons+=`<g class="p25-float" style="--dl:${-j*.6}s" transform="translate(${x} ${y})"><path d="M0 65Q18 135-8 205" fill="none" stroke="#EEE" stroke-opacity=".7" stroke-width="3"/><ellipse cy="25" rx="34" ry="45" fill="${j%2?i.accent:i.leaf}"/><ellipse cx="-10" cy="8" rx="8" ry="14" fill="#FFF" opacity=".35"/></g>`}
  const fireworks=bg==='bg_fireworks'?`<g stroke="${i.accent}" stroke-width="6" stroke-linecap="round"><path d="M230 140V60M230 140L175 85M230 140L285 85M230 140H150M230 140H310M230 140L175 195M230 140L285 195"/><path d="M840 120V55M840 120L795 75M840 120L885 75M840 120H780M840 120H900M840 120L795 165M840 120L885 165"/></g>`:'';
  return p25Sky(id,i,false)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice">${fireworks}<path d="M0 430Q260 370 540 430Q810 365 1080 425V660H0Z" fill="url(#${id}ground)"/></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><g transform="translate(770 185)" filter="url(#${id}shadow)"><g class="p25-wheel"><circle cx="100" cy="130" r="125" fill="none" stroke="${i.accent}" stroke-width="16"/><path d="M100 5V255M-25 130H225M12 42L188 218M12 218L188 42" stroke="#F2E9E1" stroke-width="5"/><g fill="${i.leaf}"><circle cx="100" cy="5" r="15"/><circle cx="225" cy="130" r="15"/><circle cx="100" cy="255" r="15"/><circle cx="-25" cy="130" r="15"/></g></g><path d="M100 130L45 340H155Z" fill="#E8E1DA"/></g>${balloons}<path d="M40 410Q540 340 1040 410" fill="none" stroke="#F6E6C8" stroke-width="4"/><path d="M90 400L115 445L140 390L165 435L190 382L215 427L240 377L265 422L290 372L315 417L340 367L365 412L390 362L415 407L440 357L465 402L490 352L515 397L540 352L565 397L590 357L615 407L640 362L665 412L690 367L715 417L740 372L765 422L790 377L815 427L840 382L865 435L890 390L915 445L940 400" fill="${i.accent}" opacity=".85"/></svg>`+p25FrontGrass(id,i);
}
function p25Space(bg,id,i,aurora=false){
  const rnd=p25Rnd(444+bg.length);let stars='',rocks='';for(let j=0;j<70;j++)stars+=`<circle cx="${rnd()*1080}" cy="${rnd()*410}" r="${1+rnd()*2.6}" fill="#FFF4CF" opacity="${.35+rnd()*.65}"/>`;for(let j=0;j<9;j++)rocks+=`<path d="M${40+rnd()*1000} ${460+rnd()*140}l18-22 26 8 7 25-25 18-27-8Z" fill="${j%2?i.ground:'#443B68'}"/>`;
  const bands=aurora?`<g class="p25-aurora" fill="none" stroke-linecap="round"><path d="M-40 190Q170 40 390 175T800 140T1160 95" stroke="#62FFC0" stroke-opacity=".4" stroke-width="38"/><path d="M-50 250Q180 100 410 235T830 200T1160 155" stroke="#9B8CFF" stroke-opacity=".32" stroke-width="28"/></g>`:'';
  return p25Sky(id,i,false)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice">${stars}${bands}<g class="p25-float" transform="translate(240 190)"><circle r="83" fill="url(#${id}accent)"/><ellipse rx="142" ry="39" fill="none" stroke="#D6C7FF" stroke-width="20" opacity=".65" transform="rotate(-15)"/></g><circle cx="850" cy="145" r="43" fill="#7ED6E8"/></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 475Q260 420 540 478Q810 415 1080 470V660H0Z" fill="url(#${id}ground)"/>${rocks}</svg>`+p25FrontGrass(id,i);
}
function p25Cozy(bg,id,i){
  return`<svg class="p25-layer p25-sky" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice">${p25Defs(id,i)}<rect width="1080" height="660" fill="url(#${id}sky)"/><path d="M0 455H1080V660H0Z" fill="url(#${id}ground)"/><path d="M0 455H1080" stroke="#D4B28B" stroke-width="15"/></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><g transform="translate(120 105)" filter="url(#${id}shadow)"><rect width="280" height="235" rx="8" fill="#D4B28B"/><rect x="18" y="18" width="244" height="199" fill="#9FD8FF"/><path d="M140 18V217M18 117H262" stroke="#D4B28B" stroke-width="12"/><path d="M18 217L262 18" stroke="#FFF" stroke-opacity=".18" stroke-width="16"/></g><g transform="translate(770 245)" filter="url(#${id}shadow)"><rect width="220" height="230" rx="8" fill="#5B4036"/><rect x="28" y="72" width="164" height="130" rx="8" fill="#29243B"/><circle cx="110" cy="120" r="105" fill="url(#${id}glow)"/><path class="p25-fire" d="M110 180Q55 145 92 92Q100 128 118 105Q150 152 110 180Z" fill="${i.accent}"/></g><g transform="translate(190 480)" filter="url(#${id}shadow)"><path d="M0 0H72V65Q36 88 0 65Z" fill="#E8D6BC"/><path d="M72 12Q115 10 105 43Q98 63 72 55" fill="none" stroke="#E8D6BC" stroke-width="13"/><path d="M18-15Q5-38 20-54M43-15Q30-38 45-54" stroke="#FFF" stroke-opacity=".45" stroke-width="6" fill="none"/></g></svg><svg class="p25-layer p25-front" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><ellipse cx="540" cy="665" rx="470" ry="130" fill="#A94F49" opacity=".72"/><ellipse cx="540" cy="665" rx="390" ry="96" fill="none" stroke="#E4B285" stroke-width="12" opacity=".55"/></svg>`;
}
function p25Neon(bg,id,i){
  let lines='';for(let j=0;j<15;j++){const y=360+j*j*1.5;lines+=`<path d="M0 ${y}H1080"/>`}for(let j=-10;j<=10;j++)lines+=`<path d="M540 350L${540+j*105} 660"/>`;
  return p25Sky(id,i,false)+`<svg class="p25-layer p25-far" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><g stroke="${i.leaf}" stroke-opacity=".32" stroke-width="3">${lines}</g></svg><svg class="p25-layer p25-mid" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><g class="p25-spin" transform="translate(190 200)"><ellipse rx="95" ry="35" fill="none" stroke="${i.accent}" stroke-width="17" transform="rotate(-18)"/><ellipse rx="95" ry="35" fill="none" stroke="${i.accent}" stroke-width="35" opacity=".15" transform="rotate(-18)"/></g><g class="p25-spin" transform="translate(875 240)"><ellipse rx="80" ry="30" fill="none" stroke="${i.leaf}" stroke-width="15" transform="rotate(20)"/></g><circle cx="260" cy="420" r="110" fill="url(#${id}glow)"/><circle cx="850" cy="410" r="130" fill="url(#${id}glow)"/></svg><svg class="p25-layer p25-front" viewBox="0 0 1080 660" preserveAspectRatio="xMidYMid slice"><path d="M0 610H1080V660H0Z" fill="#080716"/><path d="M0 610H1080" stroke="${i.accent}" stroke-width="5" opacity=".65"/></svg>`;
}
function p25Scene(bg,cfg){
  const id='p25'+(++P25_N)+'_',i=p25Info(bg,cfg.hour);let h='';
  if(i.theme==='water')h=p25Water(bg,id,i,cfg);
  else if(i.theme==='mountain')h=p25Mountain(bg,id,i,cfg);
  else if(i.theme==='candy')h=p25Candy(bg,id,i,cfg);
  else if(i.theme==='fest')h=p25Fest(bg,id,i,cfg);
  else if(i.theme==='space')h=p25Space(bg,id,i,false);
  else if(i.theme==='aurora')h=p25Space(bg,id,i,true);
  else if(i.theme==='cozy')h=p25Cozy(bg,id,i);
  else if(i.theme==='neon')h=p25Neon(bg,id,i);
  else h=p25Outdoor(bg,id,i,cfg);
  const auto={water:'bubbles',snow:'snow',forest:'leaves',space:'stars',aurora:'stars',fest:'confetti',neon:'stars',cozy:'stars'}[i.theme]||'none',kind=cfg.weather==='auto'?auto:cfg.weather;
  if(kind&&kind!=='none')h+=p25Particles(kind,Math.round(28*p25Clamp(+cfg.density||.8,.35,1)),511+P25_N);
  return h;
}
function gmPet25DPet(row,sz=190,cfg){
  const full=cfg||petCfg(row);if(!full)return`<img src="stickers/mascot-hi.webp" alt="" width="120" height="120" style="object-fit:contain">`;
  const vb=PET_VB,base={...full,bk:'',ha:full.ha==='h_shark'?full.ha:'',gl:'',nk:'',ch:'',hd:'',cm:''},gear=petGear(full),id='p25pet'+(++P25_N)+'_';
  const bcv=(PET_BC.find(x=>x[0]===full.bc)||PET_BC[0])[3],solid=/^#/.test(bcv),baseHex=solid?bcv:PET_GRAD[bcv]?PET_GRAD[bcv].base:(bcv==='gold'?'#EDBE46':bcv==='night'?'#2F3F9A':'#9A7BFF'),D=pMix(baseHex,'#1a1030',.45),F=`url(#${id}b)`,hcv=(PET_HC.find(x=>x[0]===full.hc)||PET_HC[0])[3],ecv=(PET_EC.find(x=>x[0]===full.ec)||PET_EC[0])[3],defs=petDefs(id,bcv,hcv,ecv),svg=inner=>`<svg class="d25-layer" viewBox="${vb.join(' ')}" width="100%" height="100%" aria-hidden="true">${inner}</svg>`;
  const back=full.bk?`<div class="d25-back">${svg(defs+petBack(full.bk,full.sp,F,D,pMix(baseHex,'#ffffff',.3)))}</div>`:'';
  const hand=full.hd?`<div class="d25-hand">${svg(defs+petHandItem(full.hd).replace('PETP',id+'p'))}</div>`:'';
  const clothes=gear.nk||gear.ch?`<div class="d25-clothes">${svg(gear.nk+petBadgeName(gear.ch,full,{pn:(row.cos||{}).pname||''}))}</div>`:'';
  const glasses=gear.gl?`<div class="d25-glasses">${svg(gear.gl)}</div>`:'',hat=full.ha==='h_shark'?'':gear.hat?`<div class="d25-hat">${svg(gear.hat)}</div>`:'';
  const cm=full.cm?`<div class="d25-cm">${svg(`<g class="cmw"><image href="stickers/mascot-hi.webp" x="188" y="282" width="132" height="132"/></g>`)}</div>`:'';
  return`<div class="d25pet drm pan" style="width:${sz}px;height:${Math.round(sz*vb[3]/vb[2])}px">${back}${hand}<div class="d25-base">${petSvg(base,{vb,pn:(row.cos||{}).pname||''})}</div>${clothes}${glasses}${hat}${cm}</div>`;
}
function gmPet25DStage(row,sz=190,cfg){
  const c=row.cos||{},pn=(c.pname||'').trim(),p=p25Cfg(row),own=typeof S!=='undefined'&&S.me&&row.id===S.me.id?' data-own="1"':'';
  if(p.enabled===false){const bg=c.bg||'bg_meadow',inner=cfg||petCfg(row)?gmPet(row,sz,{bg:'',...(cfg?{cfg}:{})}):`<img src="stickers/mascot-hi.webp" alt="" width="120" height="120">`;return`<div class="pscene ${bg}" data-sc="${bg}"${own}>${typeof gmSceneDecor==='function'?gmSceneDecor(bg):''}<div class="pfloor"></div>${inner}${pn?`<div class="pnm">${esc(pn)}</div>`:''}</div>`}
  const bg=c.bg||'bg_meadow',speed=Math.max(.1,+p.speed||.7),style=`--p25-depth:${p25Clamp(+p.depth||0,0,1.5)};--p25-cloud:${(14/speed).toFixed(2)}s;--p25-float:${(5/speed).toFixed(2)}s;--p25-sway:${(7/speed).toFixed(2)}s;--sx:${(+p.shift||0)*28}px;--sy:0px`;
  return`<div class="pscene p25scene ${bg}${+p.speed<=0?' p25-stop':''}" data-sc="${bg}"${own} data-cfg="${esc(JSON.stringify(p))}" style="${style}">${p25Scene(bg,p)}<div class="p25-pet">${gmPet25DPet(row,sz,cfg)}</div>${pn?`<div class="pnm">${esc(pn)}</div>`:''}</div>`;
}
function p25Apply(el,cfg){const speed=Math.max(.1,+cfg.speed||.7);el.style.setProperty('--p25-depth',p25Clamp(+cfg.depth||0,0,1.5));el.style.setProperty('--p25-cloud',(14/speed)+'s');el.style.setProperty('--p25-float',(5/speed)+'s');el.style.setProperty('--p25-sway',(7/speed)+'s');el.style.setProperty('--sx',(+cfg.shift||0)*28+'px');el.classList.toggle('p25-stop',+cfg.speed<=0);el.dataset.cfg=JSON.stringify(cfg)}
function gmPet25DScan(root=document){
  const nodes=[];if(root.matches&&root.matches('.p25scene'))nodes.push(root);root.querySelectorAll&&root.querySelectorAll('.p25scene').forEach(e=>nodes.push(e));
  nodes.forEach(el=>{if(el._p25)return;let cfg;try{cfg={...P25_DEF,...JSON.parse(el.dataset.cfg||'{}')} }catch(_){cfg={...P25_DEF}}let drag=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const move=e=>{if(reduced.matches)return;if(drag){if(!drag.moved){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;drag.moved=true;el.setPointerCapture&&el.setPointerCapture(e.pointerId)}cfg.shift=p25Clamp(drag.shift+(e.clientX-drag.x)/180,-1,1);p25Apply(el,cfg);e.stopPropagation()}else if(matchMedia('(hover:hover)').matches){const r=el.getBoundingClientRect();el.style.setProperty('--sx',((e.clientX-r.left)/r.width-.5)*22*(+cfg.depth||0)+(+cfg.shift||0)*28+'px');el.style.setProperty('--sy',((e.clientY-r.top)/r.height-.5)*10*(+cfg.depth||0)+'px')}};
    el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,at:Date.now(),shift:+cfg.shift||0,moved:false};e.stopPropagation()});
    el.addEventListener('pointermove',move);el.addEventListener('pointerup',e=>{const d=drag;drag=null;if(d&&!d.moved&&Date.now()-d.at<700&&window.gmSceneBurst)gmSceneBurst(el,e.clientX,e.clientY);e.stopPropagation()});el.addEventListener('pointercancel',()=>drag=null);el.addEventListener('pointerleave',()=>{if(!drag){el.style.setProperty('--sy','0px');p25Apply(el,cfg)}});
    el._p25={get:()=>({...cfg}),update:patch=>{Object.assign(cfg,patch);p25Apply(el,cfg)}};p25Apply(el,cfg);
  });
}
function gmPet25DStudio(me,refresh){
  const cfg=petCfg(me),draft={...p25Cfg(me)},state={bg:(me.cos||{}).bg||'bg_meadow'},seen=new Set(),bgs=GM_BGS.filter(x=>x[0]&&x[0]!=='bg_default'&&gmHas(me,x[2])).filter(x=>!seen.has(x[0])&&seen.add(x[0]));
  dgxSheet('✨ 2.5D-студия фона',(box,paint,close)=>{
    box.innerHTML=`<div id="p25_stage"></div><div class="muted p25-tip">Проведи по сцене, чтобы сдвинуть слои. Питомец и аксессуары остаются прежними.</div>
      <label>Фон<select id="p25_bg">${bgs.map(([v,n])=>`<option value="${esc(v)}" ${state.bg===v?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
      <div class="two"><label>Час суток <output id="p25_ho"></output><input id="p25_h" type="range" min="0" max="24" step="0.5" value="${draft.hour}"></label><label>Скорость <output id="p25_so"></output><input id="p25_s" type="range" min="0" max="1.5" step="0.1" value="${draft.speed}"></label></div>
      <div class="two"><label>Плотность деталей<input id="p25_d" type="range" min="0.35" max="1" step="0.05" value="${draft.density}"></label><label>Глубина слоёв<input id="p25_z" type="range" min="0" max="1.5" step="0.1" value="${draft.depth}"></label></div>
      <label>Погода и частицы<select id="p25_w">${[['auto','Подстроить под фон'],['none','Без частиц'],['snow','Снег'],['rain','Дождь'],['leaves','Листопад'],['bubbles','Пузырьки'],['stars','Светлячки и звёзды'],['confetti','Конфетти']].map(([v,n])=>`<option value="${v}" ${draft.weather===v?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="chk p25-en"><input id="p25_e" type="checkbox" ${draft.enabled!==false?'checked':''}><span>Использовать 2.5D-сцену в карточке питомца</span></label>
      <div class="two"><button class="btn ghost" id="p25_r">Сбросить</button><button class="btn" id="p25_save">Сохранить фон</button></div>`;
    const stage=box.querySelector('#p25_stage'),row=()=>({...me,cos:{...(me.cos||{}),bg:state.bg,p25d:draft}});
    const labels=()=>{const h=+draft.hour||0;box.querySelector('#p25_ho').textContent=String(Math.floor(h)).padStart(2,'0')+':'+(h%1?'30':'00');box.querySelector('#p25_so').textContent=draft.speed==0?'стоп':draft.speed+'×'};
    const preview=()=>{stage.innerHTML=gmPet25DStage(row(),150,cfg);gmPet25DScan(stage);labels()};
    const live=patch=>{Object.assign(draft,patch);const e=stage.querySelector('.p25scene')?._p25;if(e)e.update(draft);labels()};
    box.querySelector('#p25_bg').onchange=e=>{state.bg=e.target.value;preview()};box.querySelector('#p25_w').onchange=e=>{draft.weather=e.target.value;preview()};
    box.querySelector('#p25_h').oninput=e=>{draft.hour=+e.target.value;preview()};box.querySelector('#p25_s').oninput=e=>live({speed:+e.target.value});box.querySelector('#p25_z').oninput=e=>live({depth:+e.target.value});
    box.querySelector('#p25_d').oninput=e=>{draft.density=+e.target.value;clearTimeout(state.dt);state.dt=setTimeout(preview,140)};box.querySelector('#p25_e').onchange=e=>{draft.enabled=e.target.checked;preview()};
    box.querySelector('#p25_r').onclick=()=>{Object.keys(P25_DEF).forEach(k=>draft[k]=P25_DEF[k]);paint()};
    box.querySelector('#p25_save').onclick=async e=>{const en=stage.querySelector('.p25scene')?._p25;if(en)Object.assign(draft,en.get());e.target.disabled=true;if(await gmSaveCos({bg:state.bg,p25d:{...draft}})){close(false);refresh()}else e.target.disabled=false};
    preview();
  });
}
if('MutationObserver' in window){const p25mo=new MutationObserver(es=>es.forEach(e=>e.addedNodes.forEach(n=>{if(n.nodeType===1)gmPet25DScan(n)})));p25mo.observe(document.body,{childList:true,subtree:true})}
gmPet25DScan(document);
