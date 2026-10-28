// Объёмные сцены за питомцем. Three.js загружается только здесь, рабочие экраны не затрагиваются.
const P3D_DEF={enabled:true,hour:15,weather:'auto',density:.8,speed:.7,yaw:0,distance:8.5};
const P3D_THEMES={
  bg_default:'nature',bg_meadow:'nature',bg_sky:'nature',bg_glade:'nature',bg_peach:'nature',bg_mintbg:'nature',bg_lavbg:'nature',bg_lilac:'nature',
  bg_forest:'forest',bg_forest2:'forest',bg_forestd:'forest',bg_foggy:'forest',bg_sakura:'forest',
  bg_water:'water',bg_deep:'water',bg_shore:'water',bg_reef:'water',bg_deepsea:'water',
  bg_snow:'snow',bg_snowfall:'snow',bg_polar:'snow',bg_mooncast:'snow',
  bg_mount:'mountain',bg_sunset:'mountain',bg_dusk:'mountain',bg_castle:'mountain',bg_marsb:'mountain',bg_lair:'mountain',
  bg_candy:'candy',bg_dome:'fest',bg_event:'fest',bg_fireworks:'fest',
  bg_night:'space',bg_space:'space',bg_nebula:'space',bg_aurora:'aurora',
  bg_latte:'cozy',bg_cream:'cozy',bg_cafe:'cozy',bg_cozy:'cozy',bg_masha:'cozy',bg_arcade:'neon',bg_kris:'neon'
};
const P3D_PAL={
  nature:{sky:'#9FD8FF',ground:'#75B958',accent:'#FFD966',leaf:'#4E9C52'},
  forest:{sky:'#86B9A0',ground:'#426F3E',accent:'#FFB45E',leaf:'#2F7D4F'},
  water:{sky:'#3D9BC1',ground:'#C7B783',accent:'#FF8D7A',leaf:'#4BAF8A'},
  snow:{sky:'#B7D3EF',ground:'#E8F1F8',accent:'#FF8E87',leaf:'#5B8C85'},
  mountain:{sky:'#F5AE83',ground:'#75617E',accent:'#FFD28A',leaf:'#4C6657'},
  candy:{sky:'#F6B8DB',ground:'#D9B4F2',accent:'#FF6F9F',leaf:'#9DDED0'},
  fest:{sky:'#7661BB',ground:'#4E3D83',accent:'#FFD45E',leaf:'#FF7B9E'},
  space:{sky:'#070B27',ground:'#24204C',accent:'#9D8CFF',leaf:'#6ED6FF'},
  aurora:{sky:'#07162E',ground:'#173D4B',accent:'#69FFC3',leaf:'#A58CFF'},
  cozy:{sky:'#6F4B43',ground:'#8A5A3C',accent:'#FFB45E',leaf:'#D9B48A'},
  neon:{sky:'#090823',ground:'#17102D',accent:'#FF3FA4',leaf:'#36E4FF'}
};
const P3D_VAR={
  bg_forest:{sky:'#E8B178',ground:'#75533A',leaf:'#B76B38'},bg_forest2:{sky:'#326D55',ground:'#244D36',leaf:'#4E9C52',accent:'#FFF09A'},
  bg_foggy:{sky:'#9AAEA5',ground:'#556C5D',leaf:'#607D68'},bg_sakura:{sky:'#F8D7E5',ground:'#8CB785',leaf:'#E99ABB',accent:'#FFF1F6'},
  bg_shore:{sky:'#86D5EA',ground:'#E4CD91',accent:'#FF9E78'},bg_reef:{sky:'#258FB1',ground:'#C7B783',accent:'#FF7C88'},bg_deep:{sky:'#145879',ground:'#55736D'},bg_deepsea:{sky:'#082E4B',ground:'#274C55'},
  bg_polar:{sky:'#101C46',ground:'#C5D9EE',accent:'#8CE8FF'},bg_mooncast:{sky:'#172044',ground:'#AEBEDD',accent:'#D8E5FF'},
  bg_dusk:{sky:'#72578F',ground:'#514664',accent:'#FFAD8A'},bg_marsb:{sky:'#B94E35',ground:'#79382C',accent:'#FFB077',leaf:'#66504A'},bg_lair:{sky:'#24182E',ground:'#382C38',accent:'#FF704D',leaf:'#514052'},
  bg_latte:{sky:'#8A6654',ground:'#A77B58'},bg_cream:{sky:'#B18D70',ground:'#C9A77E'},bg_cozy:{sky:'#5B3833',ground:'#754632',accent:'#FF9C52'},
  bg_night:{sky:'#111A43',ground:'#252658'},bg_nebula:{sky:'#180D38',ground:'#302054',accent:'#FF79C8'},bg_aurora:{sky:'#061A2B',ground:'#123B45'},
  bg_arcade:{sky:'#10082B',ground:'#1B1033',accent:'#FF2DAA',leaf:'#2DE2FF'},bg_kris:{sky:'#070D26',ground:'#151335',accent:'#7B2DFF',leaf:'#2DE2FF'}
};
const p3dCfg=row=>({...P3D_DEF,...((row&&row.cos&&row.cos.p3d)||{})});
const p3dInfo=bg=>{const theme=P3D_THEMES[bg]||'nature';return{theme,...P3D_PAL[theme],...(P3D_VAR[bg]||{})}};
let P3D_LOAD;
function p3dLoad(){
  if(window.THREE)return Promise.resolve(window.THREE);
  if(P3D_LOAD)return P3D_LOAD;
  P3D_LOAD=new Promise((res,rej)=>{const s=document.createElement('script'),v=(document.querySelector('script[src*="pet3d.js"]')||{src:''}).src.split('?v=')[1]||'1';s.src='vendor/three.min.js?v='+v;s.onload=()=>res(window.THREE);s.onerror=()=>{P3D_LOAD=null;rej(new Error('Three.js не загрузился'))};document.head.appendChild(s)});
  return P3D_LOAD;
}
function gmPet3DScan(root,row){
  if(!root||!row)return;
  root.querySelectorAll('.pscene').forEach(el=>{const cfg=p3dCfg(row);if(cfg.enabled===false||el._p3d||el.dataset.p3dLoading)return;el.dataset.p3dLoading='1';
    p3dLoad().then(()=>{if(el.isConnected&&cfg.enabled!==false)p3dMount(el,el.dataset.sc||'bg_default',cfg)}).catch(()=>{}).finally(()=>{delete el.dataset.p3dLoading});
  });
}
function p3dMount(el,bg,cfg){
  const T=window.THREE;if(!T||!el.isConnected)return;
  const info=p3dInfo(bg);let renderer;
  try{renderer=new T.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power'})}catch(e){return}
  const canvas=renderer.domElement;canvas.className='p3d-canvas';canvas.setAttribute('aria-hidden','true');el.prepend(canvas);el.classList.add('p3d-on');
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,60),root=new T.Group();scene.add(root);scene.fog=new T.Fog(info.sky,9,28);
  const hemi=new T.HemisphereLight('#FFF4E0',info.ground,1.5),sun=new T.DirectionalLight('#FFF0D6',2);sun.position.set(5,8,6);scene.add(hemi,sun);
  const actors=[],particles=[],geos=new Set(),mats=new Set();let disposed=false,visible=true,raf=0,last=performance.now(),time=0,drag=null;
  const reduced=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness:.82,metalness:0,flatShading:true,...extra});mats.add(m);return m};
  const B=(color,extra={})=>{const m=new T.MeshBasicMaterial({color,...extra});mats.add(m);return m};
  const G=g=>{geos.add(g);return g};
  const G0={sphere:G(new T.SphereGeometry(1,14,10)),ico:G(new T.IcosahedronGeometry(1,1)),box:G(new T.BoxGeometry(1,1,1)),cyl:G(new T.CylinderGeometry(1,1,1,12)),cone:G(new T.ConeGeometry(1,1,10)),torus:G(new T.TorusGeometry(1,.16,8,24))};
  const add=(geo,mat,p=[0,0,0],s=[1,1,1],parent=root)=>{const o=new T.Mesh(geo,mat);o.position.set(...p);o.scale.set(...s);parent.add(o);return o};
  const group=(p=[0,0,0],s=1)=>{const g=new T.Group();g.position.set(...p);g.scale.setScalar(s);root.add(g);return g};
  const actor=(o,type,extra={})=>{actors.push({o,type,x:o.position.x,y:o.position.y,z:o.position.z,phase:actors.length*.83,...extra});return o};
  let seed=137;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  const N=n=>Math.max(1,Math.round(n*Math.max(.35,Math.min(1,+cfg.density||.8))));
  const matGround=M(info.ground),matLeaf=M(info.leaf),matAccent=M(info.accent),matTrunk=M('#69452E'),matWhite=M('#E9E4DA'),matDark=M('#29243B');
  const ground=(mat=matGround,y=-.55)=>{const o=add(G(new T.PlaneGeometry(32,32)),mat,[0,y,0]);o.rotation.x=-Math.PI/2;return o};
  const tree=(x,z,s=1,snow=false)=>{const g=group([x,-.5,z],s);add(G0.cyl,matTrunk,[0,.65,0],[.18,1.3,.18],g);add(G0.ico,snow?matWhite:matLeaf,[0,1.65,0],[.8,.9,.8],g);add(G0.ico,snow?matWhite:matLeaf,[-.42,1.4,.08],[.58,.64,.58],g);add(G0.ico,snow?matWhite:matLeaf,[.4,1.42,-.08],[.62,.7,.62],g);return g};
  const cloud=(x,y,z,s=1)=>{const g=group([x,y,z],s),m=M('#F4F0E8',{transparent:true,opacity:.88,emissive:'#6B675F',emissiveIntensity:.32});[[0,0,0,.65],[.58,.02,0,.48],[-.55,-.03,.02,.42],[.12,.26,0,.48]].forEach(a=>add(G0.sphere,m,a.slice(0,3),[a[3],a[3]*.78,a[3]],g));actor(g,'drift');return g};
  const flower=(x,z,c)=>{const g=group([x,-.42,z],.16);add(G0.cyl,M('#4E8B4E'),[0,.5,0],[.09,1,.09],g);add(G0.sphere,M(c||info.accent),[0,1.1,0],[.6,.35,.6],g)};
  const particlesOf=(kind,count,color)=>{const n=N(count),pos=new Float32Array(n*3),rand=new Float32Array(n);for(let i=0;i<n;i++){pos[i*3]=(rnd()-.5)*13;pos[i*3+1]=rnd()*7-.3;pos[i*3+2]=(rnd()-.5)*8;rand[i]=rnd()}const geo=G(new T.BufferGeometry());geo.setAttribute('position',new T.BufferAttribute(pos,3));const mat=B(color,{transparent:true,opacity:kind==='rain'?.55:.85,depthWrite:false});const pts=new T.Points(geo,mat);pts.material.size=kind==='stars'?.055:kind==='rain'?.045:.085;root.add(pts);particles.push({pts,pos,rand,kind,n});return pts};
  const donut=(x,y,z,c)=>{const o=add(G0.torus,M(c),[x,y,z],[.55,.55,.55]);o.rotation.y=.5;actor(o,'float');return o};
  const fish=(x,y,z,c)=>{const g=group([x,y,z],.42);add(G0.sphere,M(c),[0,0,0],[1,.55,.45],g);const tail=add(G0.cone,matAccent,[-1,0,0],[.55,.7,.35],g);tail.rotation.z=Math.PI/2;add(G0.sphere,matDark,[.55,.18,.35],[.08,.08,.08],g);actor(g,'swim');return g};
  const castle=()=>{const g=group([0,-.45,-4],1.15),stone=M('#B8A7A1'),roof=M('#755089');add(G0.box,stone,[0,.8,0],[2.8,1.6,.8],g);[-1.25,1.25].forEach(x=>{add(G0.cyl,stone,[x,1.3,0],[.48,2.6,.48],g);add(G0.cone,roof,[x,3,0],[.65,1.2,.65],g)});add(G0.box,matDark,[0,.55,.43],[.55,1.1,.08],g)};
  const ferris=()=>{const g=group([2.8,1.1,-3],1.25),wheel=new T.Group();g.add(wheel);const ring=add(G0.torus,matAccent,[0,0,0],[1.35,1.35,1.35],wheel);for(let i=0;i<8;i++){const a=i*Math.PI/4,sp=add(G0.cyl,matWhite,[0,0,0],[.035,2.6,.035],wheel);sp.rotation.z=a;add(G0.box,M(i%2?'#FF8A9F':'#79D8E8'),[Math.cos(a)*1.25,Math.sin(a)*1.25,0],[.28,.25,.28],wheel)}add(G0.cyl,matWhite,[0,-1.15,0],[.1,2.3,.1],g);actor(wheel,'wheel');return ring};
  const build=()=>{
    const th=info.theme;
    if(th==='space'||th==='aurora'){
      ground(M(info.ground,{roughness:.95}));particlesOf('stars',180,'#FFF4CF');
      const planet=add(G0.sphere,M(info.accent,{roughness:.55}),[-2.8,2.4,-3],[1.05,1.05,1.05]);actor(planet,'spin');const ring=add(G0.torus,B('#D6C7FF',{transparent:true,opacity:.65}),[-2.8,2.4,-3],[1.5,1.5,1.5]);ring.rotation.x=1.15;actor(ring,'spin');
      add(G0.sphere,M('#7ED6E8',{roughness:.5}),[3,3,-5],[.55,.55,.55]);
      for(let i=0;i<N(9);i++)add(G0.ico,M(i%2?info.ground:'#443B68'),[(rnd()-.5)*10,-.2+rnd()*.5,(rnd()-.5)*7],[.15+rnd()*.35,.15+rnd()*.35,.15+rnd()*.35]);
      if(th==='aurora')for(let j=0;j<3;j++){const pts=[];for(let i=0;i<7;i++)pts.push(new T.Vector3(-5+i*1.7,3.1+j*.35+Math.sin(i+j)*.35,-5-j*.25));const curve=new T.CatmullRomCurve3(pts),tube=add(G(new T.TubeGeometry(curve,48,.09+j*.025,6,false)),B(j%2?'#9B8CFF':'#62FFC0',{transparent:true,opacity:.32,depthWrite:false}));actor(tube,'aurora')}
      return;
    }
    if(th==='neon'){
      ground(M(info.ground,{roughness:.55,metalness:.15}));const grid=new T.GridHelper(28,28,info.leaf,info.accent);grid.position.y=-.53;grid.material.transparent=true;grid.material.opacity=.38;root.add(grid);geos.add(grid.geometry);mats.add(grid.material);
      for(let i=0;i<N(7);i++){const o=add(G0.torus,B(i%2?info.accent:info.leaf,{transparent:true,opacity:.82}),[(rnd()-.5)*9,.3+rnd()*3,-1-rnd()*5],[.25+rnd()*.6,.25+rnd()*.6,.25+rnd()*.6]);o.rotation.x=rnd()*2;actor(o,'spin')}
      particlesOf('stars',100,info.leaf);return;
    }
    if(th==='cozy'){
      ground(M(info.ground,{roughness:.68}));add(G0.box,M(info.sky),[0,2,-5.5],[12,5,.25]);
      const frame=M('#D4B28B');add(G0.box,frame,[-2.7,2.2,-5.25],[2.4,2.1,.18]);add(G0.box,B('#9FD8FF'),[-2.7,2.2,-5.12],[2.05,1.75,.08]);add(G0.box,frame,[-2.7,2.2,-5.02],[.1,1.8,.08]);add(G0.box,frame,[-2.7,2.2,-5.02],[2.1,.1,.08]);
      add(G0.box,M('#5B4036'),[3.5,.35,-3.9],[2.1,1.8,.6]);add(G0.box,matDark,[3.5,.25,-3.55],[1.35,1.05,.12]);const fire=add(G0.ico,B(info.accent),[3.5,.2,-3.4],[.45,.7,.25]);actor(fire,'fire');
      for(let i=0;i<3;i++){const mug=group([-2.7+i*.7,-.25,-1.5],.24);add(G0.cyl,M(i%2?'#E8D6BC':'#C9826B'),[0,.5,0],[.55,1,.55],mug);const h=add(G0.torus,M(i%2?'#E8D6BC':'#C9826B'),[.58,.55,0],[.5,.5,.5],mug);h.rotation.y=Math.PI/2}
      particlesOf('stars',45,'#FFD69A');return;
    }
    if(th==='water'){
      ground(matGround,-1.25);scene.fog.near=6;scene.fog.far=22;
      for(let i=0;i<N(9);i++){const x=(rnd()-.5)*10,z=-1-rnd()*5,g=group([x,-1.15,z],.5+rnd()*.45);for(let j=0;j<3;j++){const c=add(G0.cyl,j%2?matLeaf:matAccent,[j*.25-.25,.65,0],[.1,1.3+j*.3,.1],g);c.rotation.z=(j-1)*.18}actor(g,'sway')}
      for(let i=0;i<N(6);i++)fish((rnd()-.5)*8,.3+rnd()*2.5,-1-rnd()*4,i%2?info.accent:'#FFD166');
      particlesOf('bubbles',100,'#D9FAFF');return;
    }
    if(th==='mountain'){
      ground();for(let i=0;i<7;i++){if(bg==='bg_castle'&&i>1&&i<5)continue;const m=M(i%2?info.ground:'#67576B'),o=add(G0.cone,m,[-7+i*2.2,.8,-5-rnd()*2],[2.2,3.8+rnd()*2,2.2]);o.rotation.y=rnd();if(i%2===0)add(G0.cone,matWhite,[o.position.x,o.position.y+2.3,o.position.z],[.75,1.1,.75])}
      cloud(-3,3,-3,1);cloud(2.8,3.5,-5,.8);if(bg==='bg_castle')castle();else{tree(-3,-1,.9);tree(3.2,-1.5,.75)}particlesOf(bg==='bg_lair'?'stars':'none',55,info.accent);return;
    }
    if(th==='candy'){
      ground();for(let i=0;i<N(7);i++){const x=(rnd()-.5)*9,z=-1-rnd()*4,g=group([x,-.45,z],.65);add(G0.cyl,matWhite,[0,1,0],[.12,2,.12],g);const top=add(G0.torus,M(i%2?info.accent:'#8EDFD2'),[0,2.15,0],[.55,.55,.55],g);top.rotation.x=.3;actor(g,'float')}
      donut(-2.8,2,-3,'#FF8FB7');donut(2.5,2.8,-4,'#A68AE8');particlesOf('confetti',75,'#FFF2F8');return;
    }
    if(th==='fest'){
      ground();ferris();for(let i=0;i<N(6);i++){const g=group([(rnd()-.5)*8,.5+rnd()*2,-1-rnd()*3],.4),balloon=add(G0.sphere,M(i%2?info.accent:'#79D8E8'),[0,0,0],[.65,.85,.65],g);add(G0.cyl,matWhite,[0,-1,0],[.025,1.5,.025],g);actor(g,'float')}particlesOf('confetti',130,'#FFD45E');return;
    }
    ground();const snowy=th==='snow';
    for(let i=0;i<N(8);i++){const side=i%2?-1:1;tree(side*(2.3+rnd()*3.3),-1-rnd()*5,.65+rnd()*.65,snowy)}
    cloud(-3,3.4,-4,.85);cloud(3,2.8,-5,.65);
    if(snowy){const g=group([3.1,-.45,-.5],.8);add(G0.sphere,matWhite,[0,.45,0],[.65,.65,.65],g);add(G0.sphere,matWhite,[0,1.35,0],[.48,.48,.48],g);add(G0.cone,matAccent,[0,1.35,.5],[.12,.5,.12],g).rotation.x=Math.PI/2;add(G0.cyl,matDark,[0,1.85,0],[.55,.18,.55],g);particlesOf('snow',150,'#FFFFFF')}
    else{for(let i=0;i<N(18);i++)flower((rnd()-.5)*10,-1-rnd()*5,i%2?info.accent:'#FF9EB5');particlesOf(th==='forest'?'leaves':'none',95,th==='forest'?'#FFD09A':'#FFF3C4')}
  };
  build();
  if(cfg.weather&&cfg.weather!=='auto'){
    particles.forEach(p=>root.remove(p.pts));particles.length=0;
    if(cfg.weather!=='none')particlesOf(cfg.weather,120,cfg.weather==='snow'?'#FFFFFF':cfg.weather==='bubbles'?'#D9FAFF':info.accent);
  }
  const applyLight=()=>{const h=((+cfg.hour||0)%24+24)%24,day=Math.max(.06,Math.sin((h-6)*Math.PI/12)),night=new T.Color('#08132E'),sky=new T.Color(info.sky);sky.lerp(night,Math.max(0,.72-day*.65));if(h>=16&&h<=20)sky.lerp(new T.Color('#F19A78'),.16);scene.background=sky;scene.fog.color.copy(sky);hemi.intensity=.45+day*1.25;sun.intensity=.35+day*1.85;const a=(h-12)/24*Math.PI*2;sun.position.set(Math.cos(a)*7,3+day*7,Math.sin(a)*6)};
  const applyCamera=()=>{const d=Math.max(6,Math.min(12,+cfg.distance||8.5)),yaw=+cfg.yaw||0;camera.position.set(Math.sin(yaw)*d,3.2,Math.cos(yaw)*d);camera.lookAt(0,1,0)};
  const render=()=>{if(!disposed)renderer.render(scene,camera)};
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render()};
  const tick=now=>{if(disposed||!el.isConnected){dispose();return}const dt=Math.min(.05,(now-last)/1000)*Math.max(0,+cfg.speed||0);last=now;time+=dt;
    actors.forEach(a=>{const o=a.o,t=time+a.phase;if(a.type==='float')o.position.y=a.y+Math.sin(t*1.3)*.18;if(a.type==='spin'){o.rotation.y=t*.35;o.rotation.z=Math.sin(t*.3)*.12}if(a.type==='drift'){o.position.x=a.x+Math.sin(t*.12)*1.4}if(a.type==='swim'){o.position.x=a.x+Math.sin(t*.55)*1.5;o.rotation.y=Math.cos(t*.55)>0?0:Math.PI}if(a.type==='sway')o.rotation.z=Math.sin(t*.8)*.08;if(a.type==='wheel')o.rotation.z=-t*.18;if(a.type==='fire')o.scale.y=.65+Math.sin(t*7)*.16;if(a.type==='aurora')o.rotation.y=Math.sin(t*.25)*.08});
    particles.forEach(p=>{const a=p.pts.geometry.attributes.position;for(let i=0;i<p.n;i++){const j=i*3,r=p.rand[i];if(p.kind==='snow'||p.kind==='confetti'||p.kind==='leaves'||p.kind==='rain'){p.pos[j+1]-=dt*(p.kind==='rain'?4.8:.45+r*.8);p.pos[j]+=Math.sin(time+i)*dt*(p.kind==='leaves'?.45:.12);if(p.pos[j+1]<-.5)p.pos[j+1]=6.7}else if(p.kind==='bubbles'){p.pos[j+1]+=dt*(.35+r*.7);if(p.pos[j+1]>6.5)p.pos[j+1]=-.5}else if(p.kind==='stars')p.pos[j+2]+=Math.sin(time+i)*dt*.015}a.needsUpdate=true});
    render();if(visible&&!document.hidden&&!reduced&&+cfg.speed>0)raf=requestAnimationFrame(tick);else raf=0};
  const start=()=>{if(!raf&&!disposed&&visible&&!document.hidden&&!reduced&&+cfg.speed>0){last=performance.now();raf=requestAnimationFrame(tick)}};
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0};
  const dispose=()=>{if(disposed)return;disposed=true;stop();io.disconnect();ro.disconnect();mo.disconnect();document.removeEventListener('visibilitychange',vis);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();if(el._p3d&&el._p3d.dispose===dispose)delete el._p3d};
  const vis=()=>{if(document.hidden)stop();else start()};
  const down=e=>{drag={x:e.clientX,yaw:+cfg.yaw||0};canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);e.stopPropagation()};
  const move=e=>{if(!drag)return;cfg.yaw=Math.max(-1.1,Math.min(1.1,drag.yaw+(e.clientX-drag.x)/180));applyCamera();render();e.stopPropagation()};
  const up=e=>{drag=null;e.stopPropagation()};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('click',e=>e.stopPropagation());document.addEventListener('visibilitychange',vis);
  const io=new IntersectionObserver(es=>{visible=!!es[0]?.isIntersecting;if(visible){resize();start()}else stop()},{threshold:.05}),ro=new ResizeObserver(resize),mo=new MutationObserver(()=>{if(!el.isConnected)dispose()});io.observe(el);ro.observe(el);mo.observe(document.body,{childList:true,subtree:true});
  el._p3d={dispose,get:()=>({...cfg}),update:patch=>{Object.assign(cfg,patch);applyLight();applyCamera();stop();render();start()}};
  applyLight();applyCamera();resize();start();
}
function gmPet3DStudio(me,refresh){
  const cfg=petCfg(me),draft={...p3dCfg(me)},state={bg:(me.cos||{}).bg||'bg_default'};
  const seen=new Set(),bgs=[['bg_default','Парк Дримвуд'],...GM_BGS.filter(x=>x[0]&&gmHas(me,x[2]))].filter(x=>!seen.has(x[0])&&seen.add(x[0]));
  dgxSheet('🌍 3D-студия фона',(box,paint,close)=>{
    box.innerHTML=`<div id="p3d_stage"></div><div class="muted p3d-tip">Потяни сцену в сторону, чтобы осмотреться. Питомец и все его вещи остаются прежними.</div>
      <label>Фон<select id="p3d_bg">${bgs.map(([v,n])=>`<option value="${esc(v)}" ${state.bg===v?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
      <div class="two"><label>Час суток <output id="p3d_ho"></output><input id="p3d_h" type="range" min="0" max="24" step="0.5" value="${draft.hour}"></label><label>Скорость <output id="p3d_so"></output><input id="p3d_s" type="range" min="0" max="1.5" step="0.1" value="${draft.speed}"></label></div>
      <div class="two"><label>Плотность объектов<input id="p3d_d" type="range" min="0.35" max="1" step="0.05" value="${draft.density}"></label><label>Приближение<input id="p3d_z" type="range" min="6" max="12" step="0.1" value="${draft.distance}"></label></div>
      <label>Погода и частицы<select id="p3d_w">${[['auto','Подстроить под фон'],['none','Без частиц'],['snow','Снег'],['rain','Дождь'],['leaves','Листопад'],['bubbles','Пузырьки'],['stars','Светлячки и звёзды'],['confetti','Конфетти']].map(([v,n])=>`<option value="${v}" ${draft.weather===v?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="chk p3d-en"><input id="p3d_e" type="checkbox" ${draft.enabled!==false?'checked':''}><span>Использовать объёмную сцену в карточке питомца</span></label>
      <div class="two"><button class="btn ghost" id="p3d_r">Сбросить</button><button class="btn" id="p3d_save">Сохранить фон</button></div>`;
    const stage=box.querySelector('#p3d_stage'),row=()=>({...me,cos:{...(me.cos||{}),bg:state.bg,p3d:draft}});
    const labels=()=>{const h=+draft.hour||0;box.querySelector('#p3d_ho').textContent=String(Math.floor(h)).padStart(2,'0')+':'+(h%1?'30':'00');box.querySelector('#p3d_so').textContent=draft.speed==0?'стоп':draft.speed+'×'};
    const preview=()=>{const old=stage.querySelector('.pscene')?._p3d;if(old)old.dispose();stage.innerHTML=gmStage(row(),150,cfg);gmPet3DScan(stage,row());labels()};
    const live=patch=>{Object.assign(draft,patch);const e=stage.querySelector('.pscene')?._p3d;if(e)e.update(draft);labels()};
    box.querySelector('#p3d_bg').onchange=e=>{state.bg=e.target.value;preview()};
    box.querySelector('#p3d_w').onchange=e=>{draft.weather=e.target.value;preview()};
    box.querySelector('#p3d_d').oninput=e=>{draft.density=+e.target.value;clearTimeout(state.dt);state.dt=setTimeout(preview,140)};
    box.querySelector('#p3d_e').onchange=e=>{draft.enabled=e.target.checked;preview()};
    box.querySelector('#p3d_h').oninput=e=>live({hour:+e.target.value});box.querySelector('#p3d_s').oninput=e=>live({speed:+e.target.value});box.querySelector('#p3d_z').oninput=e=>live({distance:+e.target.value});
    box.querySelector('#p3d_r').onclick=()=>{Object.keys(P3D_DEF).forEach(k=>draft[k]=P3D_DEF[k]);paint()};
    box.querySelector('#p3d_save').onclick=async e=>{const en=stage.querySelector('.pscene')?._p3d;if(en)Object.assign(draft,en.get());e.target.disabled=true;if(await gmSaveCos({bg:state.bg==='bg_default'?'':state.bg,p3d:{...draft}})){close(false);refresh()}else e.target.disabled=false};
    preview();
  });
}
