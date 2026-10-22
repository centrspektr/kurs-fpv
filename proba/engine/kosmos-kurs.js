/* kosmos-kurs.js - 3D-карта курса. Сделано из мотора портала "Иртыш" (kosmos.js): те же звёзды, нити, полёты камеры, вспышки и кометы.
   Подключение (см. fpv/karta.html): three.min.js (r128), config.js, zadaniya.js, moduli.js, затем этот файл.
   Уровни карты (на экране всегда только один):
     вход   - портал "Добро пожаловать", кнопка "Вперёд"
     курс   - модули на одной нити по порядку (М1 -> М2 -> ...) и узел "Мой прогресс"
     модуль - в центре модуль, вокруг по нити его задания
     задание - плоское окно задания (из moduli.js) поверх своего фона
   Узлы собираются сами из MODS и LIB (zadaniya.js): новое задание в модуле = новая звезда на карте.
   Состояние узла берётся из прогресса ученика (VZ_KURS_INFO): пройдено, открыто, ждёт проверки, закрыто.
   Система всегда ведёт к следующему заданию: подлёт к нему при входе в уровень, указатель и строка "Дальше" внизу.
   Слабый телефон, нет 3D или выбран "Обычный вид" - открывается обычная страница курса (window.PLAIN_URL).
   Свои фоны заданий: window.KURS_FONY = { id_задания: 'картинка.webp' } до подключения.
   Готовые 3D-модели вместо зданий и дронов из кода: window.GOROD_MODELS (см. fpv/modeli.js). */
(function(){
'use strict';
var K=window.VZ_KURS, I=window.VZ_KURS_INFO, CFG=window.KURSY||{};
var PLAIN=window.PLAIN_URL||'index.html', VKEY=(CFG.store||'kursy')+'_view', FONY=window.KURS_FONY||{};
function lsG(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsS(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} }
var mob=matchMedia('(pointer:coarse)').matches, red=matchMedia('(prefers-reduced-motion:reduce)').matches;
var force=/[?&]3d=1/.test(location.search);
var weak=(navigator.deviceMemory&&navigator.deviceMemory<=2)||(mob&&navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
function plain(){ location.replace(PLAIN); }
if(!K||!I||!window.THREE){ plain(); return; }
if(!force&&(lsG(VKEY)==='plain'||weak)){ plain(); return; }
var cv=document.getElementById('c'), R;
try{ R=new THREE.WebGLRenderer({canvas:cv,antialias:!mob,powerPreference:'high-performance'}); }catch(e){ plain(); return; }
document.getElementById('plainB').onclick=function(){ lsS(VKEY,'plain'); location.href=PLAIN; };
R.setPixelRatio(Math.min(devicePixelRatio||1,mob?1.25:1.75));
var S=new THREE.Scene(), C=new THREE.PerspectiveCamera(62,1,.1,1200);
var BG_A=new THREE.Color('#04050d'), BG_B=new THREE.Color('#0c0420'); S.background=BG_A.clone();
var bgT=BG_A.clone(), galT=new THREE.Color('#ffffff');
function V(x,y,z){ return new THREE.Vector3(x,y,z); }
function size(){ R.setSize(innerWidth,innerHeight,false); C.aspect=innerWidth/innerHeight; C.fov=innerWidth<innerHeight?72:58; C.updateProjectionMatrix(); }
size(); addEventListener('resize',size);

function tex(draw,w,h){ var n=document.createElement('canvas'); n.width=w; n.height=h||w; draw(n.getContext('2d'),w,h||w); return new THREE.CanvasTexture(n); }
function glowTex(c){ return tex(function(x,s){ var g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2); g.addColorStop(0,'#fff'); g.addColorStop(.12,c); g.addColorStop(.4,c+'55'); g.addColorStop(1,c+'00'); x.fillStyle=g; x.fillRect(0,0,s,s); },128); }
var DOT=glowTex('#ffffff');
function rgb(c){ var k=new THREE.Color(c); return Math.round(k.r*255)+','+Math.round(k.g*255)+','+Math.round(k.b*255); }

/* ---- звёзды: летящие (бесконечные), мелкая пыль и дальняя оболочка ---- */
var N=mob?1600:2800, SP=new Float32Array(N*3), CA=new Float32Array(N*3), CB=new Float32Array(N*3), CC=new Float32Array(N*3);
var pa=[[.75,.8,1],[.85,.75,1],[1,1,1],[.6,.8,1]], pb=[[1,.62,.88],[.88,.6,1],[1,1,1],[.65,.85,1]], i, j;
for(i=0;i<N;i++){ SP[i*3]=(Math.random()-.5)*260; SP[i*3+1]=(Math.random()-.5)*200; SP[i*3+2]=60-Math.random()*360;
  var a=pa[i%4], b=pb[i%4], k=.25+Math.pow(Math.random(),2)*.75; for(j=0;j<3;j++){ CA[i*3+j]=a[j]*k; CB[i*3+j]=b[j]*Math.min(1,k*1.6); CC[i*3+j]=CA[i*3+j]; } }
var sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(SP,3)); sg.setAttribute('color',new THREE.BufferAttribute(CC,3));
S.add(new THREE.Points(sg,new THREE.PointsMaterial({size:mob?.75:.6,vertexColors:true,transparent:true,depthWrite:false,map:DOT,blending:THREE.AdditiveBlending})));
var DN=mob?1500:3500, DP=new Float32Array(DN*3);
for(i=0;i<DN;i++){ DP[i*3]=(Math.random()-.5)*420; DP[i*3+1]=(Math.random()-.5)*320; DP[i*3+2]=40-Math.random()*520; }
var dg=new THREE.BufferGeometry(); dg.setAttribute('position',new THREE.BufferAttribute(DP,3));
var SH=mob?1800:3600, SHP=new Float32Array(SH*3), SHC=new Float32Array(SH*3);
for(i=0;i<SH;i++){ var th=Math.random()*6.283, ph=Math.acos(2*Math.random()-1), rr=520+Math.random()*120, br=.3+Math.pow(Math.random(),3)*.7; SHP[i*3]=rr*Math.sin(ph)*Math.cos(th); SHP[i*3+1]=rr*Math.cos(ph)*.8; SHP[i*3+2]=rr*Math.sin(ph)*Math.sin(th); SHC[i*3]=br; SHC[i*3+1]=br*.92; SHC[i*3+2]=br; }
var shg=new THREE.BufferGeometry(); shg.setAttribute('position',new THREE.BufferAttribute(SHP,3)); shg.setAttribute('color',new THREE.BufferAttribute(SHC,3));
var shell=new THREE.Points(shg,new THREE.PointsMaterial({size:mob?2.2:1.8,vertexColors:true,transparent:true,depthWrite:false,map:DOT,blending:THREE.AdditiveBlending})); S.add(shell);
var dust=new THREE.Points(dg,new THREE.PointsMaterial({size:.28,color:0xcfd6ff,transparent:true,opacity:.55,depthWrite:false,map:DOT,blending:THREE.AdditiveBlending})); S.add(dust);
/* полосы скорости */
var M=mob?450:800, LP=new Float32Array(M*6), LC=new Float32Array(M*6);
var lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.BufferAttribute(LP,3)); lg.setAttribute('color',new THREE.BufferAttribute(LC,3));
var streak=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); S.add(streak);

/* ---- Млечный путь (курс) и галактика (модули): рисуются один раз в текстуру ---- */
function milkyTex(K2){ K2=K2||{a:'150,140,255',b:'255,220,240',s:['255,255,255','220,225,255','190,180,255','255,190,230']}; var w=mob?1024:2048, h=w/2; return tex(function(x){
  x.translate(w/2,h/2); x.rotate(-.05);
  var g=x.createLinearGradient(0,-h*.42,0,h*.42); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.5,'rgba('+K2.a+',.22)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(-w,-h*.42,w*2,h*.84);
  var g2=x.createLinearGradient(0,-h*.16,0,h*.16); g2.addColorStop(0,'rgba(0,0,0,0)'); g2.addColorStop(.5,'rgba('+K2.b+',.18)'); g2.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g2; x.fillRect(-w,-h*.16,w*2,h*.32);
  var n=mob?14000:32000; for(var i=0;i<n;i++){ var u=(Math.random()+Math.random()+Math.random()-1.5)/1.5, yy=u*h*.32, xx=(Math.random()-.5)*w*1.4;
    var br=Math.random(); x.fillStyle=br<.03?'rgba('+K2.s[0]+',.95)':br<.2?'rgba('+K2.s[1]+',.7)':br<.6?'rgba('+K2.s[2]+',.4)':'rgba('+K2.s[3]+',.25)'; var d=br<.03?1.8:1; x.fillRect(xx,yy,d,d); }
  for(i=0;i<140;i++){ var yy2=(Math.random()-.5)*h*.07+Math.sin(i*.37)*h*.03, xx2=(Math.random()-.5)*w*1.3; x.fillStyle='rgba(0,0,8,.18)'; x.beginPath(); x.ellipse(xx2,yy2,w*.02+Math.random()*w*.03,h*.012+Math.random()*h*.012,0,0,6.283); x.fill(); }
},w,h); }
var milky=new THREE.Sprite(new THREE.SpriteMaterial({map:milkyTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); milky.scale.set(900,450,1); S.add(milky);
var milky2=new THREE.Sprite(new THREE.SpriteMaterial({map:milkyTex({a:'255,90,200',b:'255,200,250',s:['255,255,255','255,215,245','230,150,255','140,190,255']}),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})); milky2.scale.set(1000,500,1); milky2.material.rotation=.04; S.add(milky2);
var milkyB=new THREE.Sprite(milky.material.clone()); milkyB.scale.set(900,450,1); S.add(milkyB); var milky2B=new THREE.Sprite(milky2.material.clone()); milky2B.scale.set(1000,500,1); S.add(milky2B);
function galaxyTex(){ return tex(function(x,s){ var c=s/2, cx=c+s*.015, cy=c-s*.01;
  var g=x.createRadialGradient(cx,cy,0,cx,cy,s*.5); g.addColorStop(0,'rgba(255,245,250,1)'); g.addColorStop(.04,'rgba(255,190,225,.75)'); g.addColorStop(.15,'rgba(200,90,255,.22)'); g.addColorStop(.42,'rgba(90,60,200,.06)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,s,s);
  var ARM=[{o:0,len:1,br:1,tw:7.4},{o:2.25,len:.78,br:.75,tw:6.6},{o:4.05,len:.9,br:.85,tw:8.1},{o:5.3,len:.45,br:.5,tw:5.2}];
  function at(a,t,j){ var r=t*s*.46, an=a.o+t*a.tw+Math.sin(t*5+a.o)*.18+j; return [cx+Math.cos(an)*r*(1+t*.08), cy+Math.sin(an)*r*.56+Math.cos(an)*r*.08]; }
  for(var i=0;i<(mob?15000:28000);i++){ var a=ARM[i%4], t=Math.pow(Math.random(),.7)*a.len, q=at(a,t,(Math.random()-.5)*(.3+t*.45));
    var hot=Math.random(); x.globalAlpha=a.br; x.fillStyle=hot<.12?'rgba(255,255,255,.95)':hot<.45?'rgba(255,130,215,.6)':hot<.75?'rgba(185,120,255,.55)':'rgba(130,190,255,.5)'; var d=Math.random()<.05?2.4:1.2;
    x.fillRect(q[0]+(Math.random()-.5)*s*.018,q[1]+(Math.random()-.5)*s*.018,d,d); }
  x.globalAlpha=1;
  x.strokeStyle='rgba(8,2,20,.38)'; x.lineCap='round';
  ARM.slice(0,3).forEach(function(a){ x.lineWidth=s*.006; x.beginPath(); for(var t=.08;t<a.len*.85;t+=.01){ var q=at(a,t,-.12); if(t<.09) x.moveTo(q[0],q[1]); else x.lineTo(q[0],q[1]); } x.stroke(); });
},mob?1024:2048); }
var gal=new THREE.Sprite(new THREE.SpriteMaterial({map:galaxyTex(),transparent:true,depthWrite:false,opacity:0})); gal.scale.set(330,330,1); gal.material.rotation=.35; S.add(gal);
var gal2=new THREE.Sprite(new THREE.SpriteMaterial({map:gal.material.map,transparent:true,depthWrite:false,opacity:0,color:0x9ec5ff})); gal2.scale.set(120,120,1); gal2.material.rotation=2.2; S.add(gal2);
var gal3=new THREE.Sprite(new THREE.SpriteMaterial({map:gal.material.map,transparent:true,depthWrite:false,opacity:0,color:0xffc6e8})); gal3.scale.set(210,210,1); gal3.material.rotation=4.1; S.add(gal3);

/* ---- портал-вход "Добро пожаловать": вихрь с переливом ---- */
var gate=new THREE.Group(); gate.position.set(0,0,-30); S.add(gate);
function swirlLayer(n,rMax,arms,chaos,sz){ var P=new Float32Array(n*3), Cl=new Float32Array(n*3), H=new Float32Array(n), B=new Float32Array(n), A=[];
  for(var a=0;a<arms;a++) A.push({off:a*6.283/arms+(Math.random()-.5)*.9, curl:3+Math.random()*5.5, len:.35+Math.random()*.65, wid:.25+Math.random()*.9, wav:4+Math.random()*8, amp:.05+Math.random()*.25});
  for(var i=0;i<n;i++){ var q=A[i%arms], u=Math.pow(Math.random(),.85), t=u*q.len, r=1.5+t*rMax;
    var an=q.off+t*q.curl+Math.sin(t*q.wav+q.off)*q.amp+(Math.random()-.5)*chaos*q.wid*(1.25-u*.6);
    r*=1+(Math.random()-.5)*chaos*.22; P[i*3]=Math.cos(an)*r; P[i*3+1]=Math.sin(an)*r; P[i*3+2]=(Math.random()-.5)*(2.2-t*1.4); H[i]=an/6.283+Math.random()*.12; B[i]=1-u*.75; }
  var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(Cl,3));
  var m=new THREE.Points(g,new THREE.PointsMaterial({size:sz,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,map:DOT}));
  m.userData={H:H,C:Cl,B:B,n:n}; gate.add(m); return m; }
var swirl=swirlLayer(mob?1700:2900,13,7,.55,.6), swirl2=swirlLayer(mob?800:1400,17,11,1.6,.42);
var glowA=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#a78bfa'),blending:THREE.AdditiveBlending,depthWrite:false,opacity:.55})); glowA.scale.set(26,26,1); gate.add(glowA);
var glowB=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#7cf3ff'),blending:THREE.AdditiveBlending,depthWrite:false})); glowB.scale.set(13,13,1); gate.add(glowB);
var eye=new THREE.Sprite(new THREE.SpriteMaterial({map:DOT,blending:THREE.AdditiveBlending,depthWrite:false})); eye.scale.set(6,6,1); gate.add(eye);
var hit=new THREE.Mesh(new THREE.SphereGeometry(15,16,12),new THREE.MeshBasicMaterial({visible:false})); gate.add(hit);
var hc=new THREE.Color();
function tint(m,t){ var u=m.userData; for(var i=0;i<u.n;i++){ hc.setHSL((u.H[i]+t*.07)%1,.85,.6); var b=u.B[i]; u.C[i*3]=hc.r*b; u.C[i*3+1]=hc.g*b; u.C[i*3+2]=hc.b*b; } m.geometry.attributes.color.needsUpdate=true; }
tint(swirl,0); tint(swirl2,0);

/* ---- свет для планет ---- */
S.add(new THREE.AmbientLight(0x7a6f9a,.4)); var sun=new THREE.DirectionalLight(0xfff1dc,1.4); sun.position.set(300,110,-150); S.add(sun);

/* ---- узлы: планета (открыто/пройдено), каркас (закрыто), свечение, номер, подпись-кнопка ---- */
function bandSkin(c){ return tex(function(x,w,h){ x.fillStyle=c; x.fillRect(0,0,w,h);
  for(var i=0;i<26;i++){ x.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,20')+','+(.05+Math.random()*.16)+')'; x.fillRect(0,Math.random()*h,w,6+Math.random()*30); }
  for(i=0;i<40;i++){ x.fillStyle='rgba(255,255,255,'+(Math.random()*.12)+')'; x.beginPath(); x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*50,4+Math.random()*12,0,0,6.283); x.fill(); } },512,256); }
function numTex(t){ return tex(function(x,s){ x.font='900 '+(s*.5)+'px Manrope, system-ui, sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  x.lineWidth=s*.07; x.strokeStyle='rgba(4,5,20,.85)'; x.strokeText(t,s/2,s/2+s*.03); x.fillStyle='#fff'; x.fillText(t,s/2,s/2+s*.03); },128); }
function capsTex(c){ return tex(function(x,w,h){ var g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,c+'00'); g.addColorStop(.25,c+'aa'); g.addColorStop(.6,'#ffffff'); g.addColorStop(.75,c); g.addColorStop(1,c+'00');
  x.fillStyle=g; x.beginPath(); x.ellipse(w/2,h/2,w/2,h*.32,0,0,6.283); x.fill(); var gl=x.createRadialGradient(w*.62,h/2,0,w*.62,h/2,h*.5); gl.addColorStop(0,'rgba(255,255,255,.9)'); gl.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gl; x.fillRect(0,0,w,h); },128,32); }
var labels=document.getElementById('labels'), NP=81;
var LV=[], LBY={};
function mkLevel(id,o){ var L={id:id,g:new THREE.Group(),nodes:[],by:{},hits:[],threads:[],pulses:[],order:[],me:V(0,-6,19)}; for(var q in o) L[q]=o[q]; L.g.visible=false; S.add(L.g); LV.push(L); LBY[id]=L; return L; }
function mkNode(L,n){ var g=new THREE.Group(); g.position.fromArray(n.p); L.g.add(g); n.g=g; n.L=L; L.by[n.id]=n; L.nodes.push(n);
  var k=n.hk=n.city||n.zone?.32:1; /* в городе узел - маяк на крыше здания */
  n.halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(n.c),blending:THREE.AdditiveBlending,depthWrite:false})); n.halo.scale.set(n.s*6*k,n.s*6*k,1); g.add(n.halo);
  n.pl=new THREE.Mesh(new THREE.SphereGeometry(n.s*.8*k,mob?24:36,mob?16:24),new THREE.MeshLambertMaterial({map:bandSkin(n.c),emissive:new THREE.Color(n.c),emissiveIntensity:n.city?.6:.14})); g.add(n.pl);
  n.wf=new THREE.Mesh(new THREE.SphereGeometry(n.s*.8*k,16,10),new THREE.MeshBasicMaterial({color:0x94a3b8,wireframe:true,transparent:true,opacity:.32})); g.add(n.wf);
  if(n.num){ n.nm=new THREE.Sprite(new THREE.SpriteMaterial({map:numTex(n.num),transparent:true,depthWrite:false,depthTest:false})); n.nm.scale.set(n.s*1.15,n.s*1.15,1); n.nm.renderOrder=3; if(n.city||n.zone) n.nm.position.y=n.s*1.1; g.add(n.nm); }
  if(n.city||n.zone) building(L,n);
  if(n.kind==='mod') antenna(n);
  var hm=new THREE.Mesh(new THREE.SphereGeometry(n.s*1.4,10,8),new THREE.MeshBasicMaterial({visible:false})); hm.userData.id=n.id; g.add(hm); L.hits.push(hm);
  var el=document.createElement('button'); el.type='button'; el.className='lb'; el.textContent=n.n; el.style.setProperty('--pc',n.c); el.onclick=function(){ tapNode(n.id); }; labels.appendChild(el); n.el=el; }
/* антенна на крыше здания модуля: мачта с перекладинами, маяк-узел на верхушке; нить идёт от антенны к антенне */
function antenna(n){ var a=new THREE.Group(), m=new THREE.MeshLambertMaterial({color:0xb8c2e0,emissive:new THREE.Color(n.c),emissiveIntensity:.35}); a.position.y=-2.6; n.g.add(a);
  var ms=new THREE.Mesh(new THREE.CylinderGeometry(.07,.12,2.6,6),m); ms.position.y=1.3; a.add(ms);
  [.7,1.4].forEach(function(y,j){ var cb=new THREE.Mesh(new THREE.BoxGeometry(1.1-j*.4,.07,.07),m); cb.position.y=y; cb.rotation.y=j*.8; a.add(cb); });
  var ds=new THREE.Mesh(new THREE.CylinderGeometry(.5,.08,.25,12,1,true),new THREE.MeshLambertMaterial({color:0xd6dcf0,emissive:new THREE.Color(n.c),emissiveIntensity:.3,side:THREE.DoubleSide})); ds.position.set(.35,1.05,0); ds.rotation.z=-.9; a.add(ds);
  var tip=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ff4d6d'),blending:THREE.AdditiveBlending,depthWrite:false})); tip.scale.setScalar(1.2); tip.position.set(-.45,1.45,0); a.add(tip);
  (n.mats=n.mats||[]).push(m); (n.anim2=n.anim2||[]).push(function(t){ ds.rotation.y=t*1.2; tip.material.opacity=Math.sin(t*3+n.p[0])>.2?1:.1; }); /* мачта стоит, крутится только тарелка */
  n.onModel=function(){ seat(n); }; if(n.model) seat(n); }
/* готовая модель ниже или уже, чем здание из кода: ищем лучом сверху её крышу поближе к центру и ставим антенну (вместе с маяком-узлом) прямо на неё */
var RC=new THREE.Raycaster(), DOWN=V(0,-1,0);
function seat(n){ var m=n.model, L=n.L; L.g.updateMatrixWorld(true); var top=new THREE.Box3().setFromObject(m).max.y, w=n.s*2.1, hits=[];
  for(var r=0;r<=5;r++) for(var k=0;k<(r?10:1);k++){ var a=k/10*6.283, x=n.p[0]+Math.sin(a)*r*w*.22, z=n.p[2]+Math.cos(a)*r*w*.22;
    RC.set(V(x,top+20,z),DOWN); var h=RC.intersectObject(m,true)[0]; if(h) hits.push({r:r,p:h.point}); }
  if(!hits.length) return; var tall=hits.filter(function(q){ return q.p.y>=PY+(top-PY)*.6; }), q=(tall.length?tall:hits).sort(function(a,b){ return a.r-b.r||b.p.y-a.p.y; })[0];
  n.g.position.set(q.p.x,q.p.y+2.6,q.p.z); reThread(L,n); }
/* узел сдвинулся: заново тянем его нити (к нему и от него) */
function reThread(L,n){ L.threads.forEach(function(T){ var m=T.n; if(m!==n&&m.from!==n.id) return; var me=m.from==='me', a=me?L.me:L.by[m.from].g.position, b=m.g.position, c=a.clone().lerp(b,.5); c.y+=L.loc?3:me?3:7;
  m.curve=new THREE.QuadraticBezierCurve3(a.clone(),c,b.clone()); var ps=m.curve.getPoints(NP-1), at=T.ln.geometry.attributes.position; ps.forEach(function(p,i){ at.setXYZ(i,p.x,p.y,p.z); }); at.needsUpdate=true; T.ln.geometry.computeBoundingSphere(); T.mid=m.curve.getPoint(.5); }); }
/* нити: у узла есть from (откуда тянется), дуга строится сама; по нити бегут огоньки-капсулы */
function mkThreads(L){ L.nodes.forEach(function(n){ if(!n.from) return; var me=n.from==='me', a=me?L.me:L.by[n.from].g.position, b=n.g.position, m=a.clone().lerp(b,.5); m.y+=L.loc?3:me?3:7;
  n.curve=new THREE.QuadraticBezierCurve3(a.clone(),m,b.clone());
  var gm=new THREE.BufferGeometry().setFromPoints(n.curve.getPoints(NP-1)); gm.setAttribute('color',new THREE.BufferAttribute(new Float32Array(NP*3),3));
  var ln=new THREE.Line(gm,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false})); L.g.add(ln);
  L.threads.push({ln:ln,n:n,mid:n.curve.getPoint(.5),seed:Math.random()*10,base:new THREE.Color(n.c)});
  var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:capsTex(n.c),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); sp.scale.set(L.loc?1.3:1.1,L.loc?.34:.28,1); sp.visible=false; L.g.add(sp);
  L.pulses.push({sp:sp,sx:sp.scale.x,sy:sp.scale.y,n:n,t:-Math.random()*3,dur:2.6+Math.random()*1.2}); }); }
/* обзор уровня: камера спереди, видна вся цепочка вглубь */
function mkOver(L){ var x=0,y=0,zMax=-1e9,zMin=1e9; L.nodes.forEach(function(n){ x+=n.p[0]; y+=n.p[1]; zMax=Math.max(zMax,n.p[2]); zMin=Math.min(zMin,n.p[2]); }); x/=L.nodes.length; y/=L.nodes.length;
  L.oP=V(x*.4,y+10,zMax+42); L.oL=V(x*.6,y,zMin+(zMax-zMin)*.35); }

/* FPV-дрон из простых фигур: рама X, корпус, фонарь, камера, моторы, винты (диск + лопасть), огонь сзади */
var PROP=null;
/* ===== готовые модели (.glb, например Kenney / Quaternius, CC0) вместо зданий и дронов из кода =====
   window.GOROD_MODELS = { 1:'modeli/shkola.glb', 2:..., 6:..., k:киоск, zs/zc/zg/zq/zf/zt/zx: зоны заданий, drone: дрон }.
   Модель сама подгоняется по размеру под место; пока грузится или если файла нет - стоит здание из кода. */
var MODELI=window.GOROD_MODELS||{}, MLOAD=null, MCACHE={}, MWAIT=[];
function gltf(cb){ if(window.THREE&&THREE.GLTFLoader){ cb(); return; } MWAIT.push(cb); if(MLOAD) return; MLOAD=document.createElement('script');
  MLOAD.src='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'; MLOAD.onload=function(){ MWAIT.splice(0).forEach(function(f){ f(); }); }; document.head.appendChild(MLOAD); }
function getModel(url,cb){ var c=MCACHE[url]; if(c&&c.sc){ cb(c.sc.clone(true)); return; } if(c){ c.q.push(cb); return; } c=MCACHE[url]={q:[cb]};
  gltf(function(){ new THREE.GLTFLoader().load(url,function(g){ c.sc=g.scene; c.q.splice(0).forEach(function(f){ f(c.sc.clone(true)); }); },null,function(){ c.q=[]; }); }); }
/* o.body - части из кода, их прячем; h и w - высота и ширина места; y0 - на какой высоте низ модели */
function useModel(o,par,url,h,w,y0){ if(!url) return; getModel(url,function(m){ var bx=new THREE.Box3().setFromObject(m), sz=bx.getSize(V()), k=Math.min(h/(sz.y||1),w/(Math.max(sz.x,sz.z)||1));
  m.scale.setScalar(k); m.position.set(-(bx.min.x+bx.max.x)/2*k,y0-bx.min.y*k,-(bx.min.z+bx.max.z)/2*k);
  var ms=[]; m.traverse(function(q){ if(q.isMesh){ (Array.isArray(q.material)?q.material:[q.material]).forEach(function(mt){ mt=mt.clone(); mt.c0=mt.color?mt.color.clone():null; if(o.c&&mt.emissive){ mt.emissive.set(o.c); mt.emissiveIntensity=.18; } /* лёгкий оттенок цвета модуля */ ms.push(mt); }); q.material=Array.isArray(q.material)?ms.slice(-q.material.length):ms[ms.length-1]; } });
  (o.body||[]).forEach(function(q){ q.visible=false; }); o.anim=[]; o.mmats=ms; par.add(m); o.model=m; if(o.st) dimModel(o); if(o.onModel) o.onModel(m); }); }
function dimModel(n){ if(n.mmats) n.mmats.forEach(function(mt){ if(mt.c0) mt.color.copy(mt.c0).multiplyScalar(n.st==='lock'?.3:1); }); }
function mkDrone(col,led){ if(!PROP) PROP=tex(function(x,s2){ var c=s2/2, g=x.createRadialGradient(c,c,c*.15,c,c,c); g.addColorStop(0,'rgba(220,235,255,.05)'); g.addColorStop(.6,'rgba(220,235,255,.28)'); g.addColorStop(.95,'rgba(220,235,255,.12)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.beginPath(); x.arc(c,c,c,0,6.283); x.fill(); },64);
  var dg=new THREE.Group(), bc=new THREE.Color(col), fr=new THREE.MeshLambertMaterial({color:0x1a1f33,emissive:bc,emissiveIntensity:.15}), props=[];
  [Math.PI/4,-Math.PI/4].forEach(function(r){ var arm=new THREE.Mesh(new THREE.BoxGeometry(3.2,.12,.32),fr); arm.rotation.y=r; dg.add(arm); });
  dg.add(new THREE.Mesh(new THREE.BoxGeometry(.9,.22,1.3),fr));
  var can=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8,0,6.283,0,Math.PI/2),new THREE.MeshLambertMaterial({color:bc,emissive:bc,emissiveIntensity:.35})); can.scale.set(1,.8,1.4); can.position.y=.1; dg.add(can);
  var cam=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.25),new THREE.MeshLambertMaterial({color:0x0b0f1e})); cam.position.set(0,.25,.75); dg.add(cam);
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(q){ var x0=q[0]*1.13, z0=q[1]*1.13, mo=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.28,10),new THREE.MeshLambertMaterial({color:0x8892b0})); mo.position.set(x0,.16,z0); dg.add(mo);
    var pr=new THREE.Mesh(new THREE.CircleGeometry(.75,20),new THREE.MeshBasicMaterial({map:PROP,transparent:true,depthWrite:false,side:THREE.DoubleSide})); pr.rotation.x=-Math.PI/2; pr.position.set(x0,.33,z0); dg.add(pr); props.push(pr);
    var bl=new THREE.Mesh(new THREE.BoxGeometry(1.4,.03,.12),new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.5})); bl.position.set(x0,.34,z0); dg.add(bl); props.push(bl); });
  var lt=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(led||'#4ade80'),blending:THREE.AdditiveBlending,depthWrite:false})); lt.scale.setScalar(1.6); lt.position.set(0,-.2,-.7); dg.add(lt);
  var dr={g:dg,lt:lt,props:props}; if(MODELI.drone){ dr.body=dg.children.filter(function(q){ return q!==lt; }); useModel(dr,dg,MODELI.drone,1.2,3.4,-.3); }
  return dr; }

/* ===== уровень "курс" = летающий город Взлёт: платформа для обучения пилотов =====
   Модули - здания по кругу платформы (главная нить идёт от здания к зданию), боковые нити - киоски у посадочной площадки.
   Здания из кода; если задан window.GOROD_MODELS - их заменят готовые модели (см. useModel) */
var MC=['#7cf3ff','#ff7ce0','#ffd36e','#9dff7c','#ff9f5a','#a78bfa'];
var mods=K.mods.filter(function(m){ return m.tasks; });
var PY=-12, CZ=-100, RI=62; /* высота верха платформы, её центр и радиус */
var LK=mkLevel('kurs',{name:'Город Взлёт',mix:0,pz:CZ,me:V(0,PY+1.5,CZ+RI-8)});
function winTex(c){ var t=tex(function(x,w,h){ x.fillStyle='#0b1022'; x.fillRect(0,0,w,h);
  for(var yy=5;yy<h;yy+=12) for(var xx=5;xx<w;xx+=11){ var on=Math.random()<.55; x.globalAlpha=on?.5+Math.random()*.5:1; x.fillStyle=on?(Math.random()<.35?c:'#ffe7a8'):'#151b36'; x.fillRect(xx,yy,6,7); }
  x.globalAlpha=1; },128,256); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
/* здание-заглушка: цоколь, башня с окнами, верхний ярус цвета модуля, светящееся кольцо */
/* здания: у каждого модуля своё (стиль st): 1 школа безопасности, 2 мастерская, 3 аккумуляторная, 4 диспетчерская вышка,
   5 гоночный стадион, 6 башня аса; киоски боковых нитей. TOPH - полная высота, над ней висит маяк-узел */
var TOPH={k:6,kb:8,kt:8,kp:8,kc:11,1:10,2:11,3:13,4:19,5:8,6:28,zs:13,zc:8,zg:7,zq:10,zf:6,zt:7,zx:8};
function building(L,n){ var b=new THREE.Group(), w=n.s*2.1, c=new THREE.Color(n.c), st=n.st0; b.position.set(n.p[0],PY,n.p[2]); if(n.face!=null) b.rotation.y=n.face; L.g.add(b); n.bld=b; n.mats=[]; n.anim=[];
  function mat(m){ n.mats.push(m); return m; }
  function L0(col,ei,o){ var q={color:col==null?0x1b2240:col,emissive:c,emissiveIntensity:ei||.08}; for(var k in o) q[k]=o[k]; return mat(new THREE.MeshLambertMaterial(q)); }
  function glow(o){ return mat(new THREE.MeshBasicMaterial(Object.assign({color:c,transparent:true,opacity:.85},o||{}))); }
  function add(geo,m,x,y,z,par){ var me=new THREE.Mesh(geo,m); me.position.set(x||0,y||0,z||0); (par||b).add(me); return me; }
  var wt=winTex(n.c); function win(rep){ var t=wt.clone(); t.needsUpdate=true; t.repeat.set(rep[0],rep[1]); return L0(0xffffff,.85,{map:t,emissive:0xffffff,emissiveMap:t}); }
  if(n.zone){ add(new THREE.CylinderGeometry(w*1.5,w*1.55,.25,40),L0(0x1b2240,.12),0,.12,0); var zr=add(new THREE.TorusGeometry(w*1.5,.12,4,48),glow({opacity:.7}),0,.26,0); zr.rotation.x=Math.PI/2; } /* площадка зоны */
  else add(new THREE.CylinderGeometry(w*1.15,w*1.3,1,10),L0(0x1b2240,.1),0,.5,0); /* цоколь */
  var k0=b.children.length; /* всё, что ниже, - здание из кода; готовая модель его заменит */
  if(ZONE[st]) ZONE[st]({b:b,n:n,w:w,c:c,add:add,L0:L0,glow:glow,win:win});
  else if(st==='k'){ add(new THREE.CylinderGeometry(w*.45,w*.5,3.2,10),win([2,1]),0,2.6,0); add(new THREE.SphereGeometry(w*.5,16,10,0,6.283,0,Math.PI/2),L0(n.c,.5),0,4.2,0);
    var sg2=add(new THREE.TorusGeometry(w*.7,.1,6,32),glow(),0,4.6,0); sg2.rotation.x=Math.PI/2; n.anim.push(function(t){ sg2.rotation.z=t*1.5; }); }
  else if(st==='kb'){ /* мастерская с гаечным ключом: сообщить об ошибке */
    add(new THREE.BoxGeometry(w*1.7,4,w*1.3),L0(0x3a2a12,.15),0,3,0); var rf=add(new THREE.CylinderGeometry(w*.75,w*.75,w*1.75,3),L0(n.c,.3),0,5+w*.37,0); rf.rotation.z=Math.PI/2; rf.rotation.y=Math.PI/2;
    add(new THREE.PlaneGeometry(w*.7,2.4),glow({opacity:.6,side:THREE.DoubleSide}),0,2.2,w*.66);
    var wr=new THREE.Group(); wr.position.set(0,7.6,0); b.add(wr); add(new THREE.BoxGeometry(.5,3.4,.3),glow(),0,-.6,0,wr);
    var hd=add(new THREE.TorusGeometry(.8,.28,6,16,Math.PI*1.5),glow(),0,1.6,0,wr); hd.rotation.z=-Math.PI*.25;
    n.anim.push(function(t){ wr.rotation.y=t*.9; wr.rotation.z=Math.sin(t*1.3)*.25; }); }
  else if(st==='kt'){ /* тренажёр: ангар с воротами, над ним кружит маленький дрон */
    var ha=add(new THREE.CylinderGeometry(w*.9,w*.9,w*1.8,24,1,false,0,Math.PI),L0(0x3a1838,.2,{side:THREE.DoubleSide}),0,1,0); ha.rotation.z=Math.PI/2; ha.rotation.y=Math.PI/2;
    add(new THREE.PlaneGeometry(w*1.1,w*.7),glow({opacity:.5,side:THREE.DoubleSide}),0,1+w*.35,w*.9+.05);
    var tg1=add(new THREE.TorusGeometry(1.3,.12,6,24),glow(),-w*.5,2.4,w*1.6), tg2=add(new THREE.TorusGeometry(1.3,.12,6,24),glow(),w*.5,2.4,w*2.4);
    var md=mkDrone(n.c,'#ff4d6d'); md.g.scale.setScalar(.45); b.add(md.g);
    n.anim.push(function(t,dt){ md.g.position.set(Math.sin(t*1.2)*w*1.1,w*1.3+2+Math.sin(t*2)*.4,Math.cos(t*1.2)*w*1.1); md.g.rotation.y=t*1.2+Math.PI/2; for(var i=1;i<md.props.length;i+=2) md.props[i].rotation.y+=dt*40;
      tg1.material.color.setHSL((t*.1)%1,.9,.62); tg2.material.color.setHSL((t*.1+.4)%1,.9,.62); }); }
  else if(st==='kp'){ /* мой прогресс: зарядная станция, зелёная полоса заряда = сколько курса пройдено */
    add(new THREE.BoxGeometry(w*1.2,5.4,w*.8),L0(0x123a22,.15),0,3.7,0); add(new THREE.BoxGeometry(w*1.3,.4,w*.9),L0(n.c,.4),0,6.6,0);
    add(new THREE.BoxGeometry(w*.7,3.4,.1),L0(0x0b1022,.1),0,3.8,w*.4+.02); var fil=add(new THREE.PlaneGeometry(w*.56,3),glow({opacity:.9}),0,2.3,w*.4+.09); fil.geometry.translate(0,1.5,0);
    var cab=add(new THREE.TorusGeometry(1.1,.12,6,16,Math.PI),L0(0x9aa3c0,.1),w*.6+1.1,1.6,0); cab.rotation.z=Math.PI;
    var pct=0, tq2=-9; n.anim.push(function(t){ if(t-tq2>1){ tq2=t; var a=0,d=0; mods.forEach(function(m){ m.tasks.forEach(function(x){ a++; if(I.task(x)==='done') d++; }); }); pct=a?d/a:0; }
      fil.scale.y=Math.max(.06,pct)*(.92+.08*Math.sin(t*3)); fil.material.opacity=.6+.35*(.5+.5*Math.sin(t*2.4)); }); }
  else if(st==='kc'){ /* вход по коду: башня с большим знаком @ */
    add(new THREE.CylinderGeometry(w*.7,w*.8,8,8),win([4,2]),0,5,0); add(new THREE.CylinderGeometry(w*.85,w*.7,.6,8),L0(n.c,.45),0,9.3,0);
    var at=new THREE.Sprite(new THREE.SpriteMaterial({map:numTex('@'),transparent:true,depthWrite:false})); at.scale.setScalar(4.4); at.position.y=11.4; b.add(at); n.mats.push(at.material);
    n.anim.push(function(t){ at.position.y=11.4+Math.sin(t*1.6)*.3; }); }
  else if(st===1){ /* школа безопасности: корпус, стеклянный купол, щит-эмблема */
    add(new THREE.CylinderGeometry(w*1.05,w*1.05,4,24),win([6,1]),0,3,0);
    add(new THREE.SphereGeometry(w*1.05,28,14,0,6.283,0,Math.PI/2),L0(n.c,.35,{transparent:true,opacity:.75}),0,5,0);
    var sh=add(new THREE.CylinderGeometry(1.4,1.4,.3,6),L0(0xffffff,.6),0,5+w*1.05+1.2,0); sh.rotation.x=Math.PI/2;
    add(new THREE.BoxGeometry(.5,1.6,.35),glow({color:0xffffff}),0,0,.2,sh).rotation.x=-Math.PI/2; add(new THREE.BoxGeometry(1.6,.5,.35),glow({color:0xffffff}),0,0,.2,sh).rotation.x=-Math.PI/2;
    n.anim.push(function(t){ sh.rotation.z=t*.8; }); }
  else if(st===2){ /* мастерская: ангар-полукруг, кран, шестерня */
    var hg=add(new THREE.CylinderGeometry(w*1.0,w*1.0,w*2,24,1,false,0,Math.PI),L0(0x2a3358,.15,{side:THREE.DoubleSide}),0,1,0); hg.rotation.z=Math.PI/2; hg.rotation.y=Math.PI/2;
    var dr=add(new THREE.PlaneGeometry(w*1.4,w*.9),glow({opacity:.55,side:THREE.DoubleSide}),0,1+w*.45,w+.05);
    add(new THREE.BoxGeometry(.6,10,.6),L0(0xffd36e,.3),w*1.15,6,-w*.6); var boom=new THREE.Group(); boom.position.set(w*1.15,11,-w*.6); b.add(boom);
    add(new THREE.BoxGeometry(7,.5,.5),L0(0xffd36e,.3),-2.5,0,0,boom); add(new THREE.BoxGeometry(.08,3,.08),glow({color:0xffffff}),-5.5,-1.5,0,boom);
    var gear=add(new THREE.TorusGeometry(1.6,.45,6,12),L0(n.c,.6),-w*.9,w*1.2+1.5,w*.4); n.anim.push(function(t){ gear.rotation.z=t*1.2; boom.rotation.y=Math.sin(t*.4)*.6; dr.material.opacity=.4+.25*Math.sin(t*2); }); }
  else if(st===3){ /* аккумуляторная: три банки с полосами заряда */
    [[-w*.6,12,0],[w*.6,10,0],[0,8,w*.7]].forEach(function(q,j){ var hh=q[1]; add(new THREE.CylinderGeometry(w*.38,w*.38,hh,20),L0(0x1d2547,.12),q[0],1+hh/2,q[2]);
      add(new THREE.CylinderGeometry(w*.18,w*.18,.8,12),L0(0xd6d3ff,.3),q[0],1+hh+.4,q[2]);
      for(var k=0;k<4;k++){ (function(k){ var band=add(new THREE.CylinderGeometry(w*.39,w*.39,hh*.14,20,1,true),glow({side:THREE.DoubleSide}),q[0],1+hh*(.15+k*.22),q[2]);
        n.anim.push(function(t){ band.material.opacity=((t*1.4+j*.7)%4>k)?.9:.12; }); })(k); } }); }
  else if(st===4){ /* диспетчерская вышка: стебель, стеклянная кабина, радар */
    add(new THREE.CylinderGeometry(w*.3,w*.42,14,12),win([2,3]),0,8,0); add(new THREE.CylinderGeometry(w*.85,w*.6,3,12),L0(n.c,.45,{transparent:true,opacity:.8}),0,16.5,0);
    add(new THREE.ConeGeometry(w*.9,1.6,12),L0(0x2a3358,.1),0,18.8,0); var rad=new THREE.Group(); rad.position.set(0,19.6,0); b.add(rad);
    var dish=add(new THREE.SphereGeometry(1.3,14,8,0,6.283,0,Math.PI/2.4),L0(0xffffff,.3,{side:THREE.DoubleSide}),0,.4,0,rad); dish.rotation.x=Math.PI/2.2; n.anim.push(function(t){ rad.rotation.y=t*1.1; });
    [[1,0],[-1,0],[0,1]].forEach(function(q){ var pd=add(new THREE.CircleGeometry(1.8,20),glow({opacity:.5}),q[0]*w*1.9,.05,q[1]*w*1.9); pd.rotation.x=-Math.PI/2; }); }
  else if(st===5){ /* гоночный стадион: кольцо трибун, ворота-арки, мачты света */
    add(new THREE.CylinderGeometry(w*1.6,w*1.75,3.2,36,1,true),L0(0x222a52,.12,{side:THREE.DoubleSide}),0,2.6,0);
    var fl=add(new THREE.CircleGeometry(w*1.55,36),L0(0x0f3b2c,.05),0,1.05,0); fl.rotation.x=-Math.PI/2;
    var gates=[]; for(var g=0;g<3;g++){ var ga=add(new THREE.TorusGeometry(1.6,.18,6,24,Math.PI),glow(),Math.cos(g*2.1)*w*.9,1.1,Math.sin(g*2.1)*w*.9); ga.rotation.y=g*2.1; gates.push(ga); }
    for(var m4=0;m4<4;m4++){ var an=m4*Math.PI/2+.4; add(new THREE.BoxGeometry(.3,7,.3),L0(0x94a3b8,.1),Math.cos(an)*w*1.7,4.5,Math.sin(an)*w*1.7); var lp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#fff2d0'),blending:THREE.AdditiveBlending,depthWrite:false})); lp.scale.setScalar(3); lp.position.set(Math.cos(an)*w*1.7,8.2,Math.sin(an)*w*1.7); b.add(lp); }
    n.anim.push(function(t){ gates.forEach(function(ga,j){ ga.material.color.setHSL((t*.1+j*.33)%1,.9,.6); }); }); }
  else { /* башня аса: ярусы, шпиль, спираль света, звезда */
    [[w*1.1,4],[w*.85,4],[w*.6,4]].forEach(function(q,j){ add(new THREE.BoxGeometry(q[0]*1.4,q[1],q[0]*1.4),win([2,1]),0,1+q[1]/2+j*4,0).rotation.y=j*.4; });
    add(new THREE.ConeGeometry(w*.5,14,6),L0(n.c,.4),0,13+7,0);
    var pts=[]; for(var k=0;k<=80;k++){ var u=k/80; pts.push(V(Math.cos(u*18)*w*(.9-u*.6),13+u*13,Math.sin(u*18)*w*(.9-u*.6))); }
    var sp=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,.12,5,false),glow({color:0xffd36e}),0,0,0); n.anim.push(function(t){ sp.rotation.y=t*.5; }); }
  n.body=b.children.slice(k0); useModel(n,b,MODELI[st],TOPH[st]-1,w*(n.zone?2.6:2.8),1);
  if(n.kind==='task') taskScreen(n,b,w,L0);
  var hb=new THREE.Mesh(new THREE.BoxGeometry(w*2.6,TOPH[st]+2,w*2.6),new THREE.MeshBasicMaterial({visible:false})); hb.position.y=TOPH[st]/2; hb.userData.id=n.id; b.add(hb); L.hits.push(hb); }
function hTex(col){ return tex(function(x,w){ var c=w/2; x.strokeStyle=col; x.lineWidth=w*.04; x.beginPath(); x.arc(c,c,c*.86,0,6.283); x.stroke();
  x.font='900 '+(w*.5)+'px Manrope, system-ui'; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle=col; x.fillText('H',c,c+w*.03); },256); }
function holoTex(col){ return tex(function(x,w,h){ x.fillStyle='rgba(10,20,40,.35)'; x.fillRect(0,0,w,h); x.strokeStyle=col; x.lineWidth=4; x.strokeRect(4,4,w-8,h-8);
  x.fillStyle=col; for(var i=0;i<7;i++){ x.globalAlpha=.35+Math.random()*.5; x.fillRect(22,26+i*20,(w-44)*(.4+Math.random()*.6),8); } x.globalAlpha=1; },256,180); }
/* экран задания (22.10): у каждого задания сбоку от зоны стоит экран на стойке, на нём номер и название.
   Дрон у зоны разворачивается к экрану; "Начать" - камера подлетает к экрану, он вырастает в окно задания */
function wrapTxt(x,t,x0,y0,mw,lh,max){ var ws=String(t||'').split(' '), ln='', n=0;
  for(var i=0;i<ws.length;i++){ var tt=ln?ln+' '+ws[i]:ws[i]; if(x.measureText(tt).width>mw&&ln){ if(++n>=max){ x.fillText(ln+'…',x0,y0); return; } x.fillText(ln,x0,y0); y0+=lh; ln=ws[i]; } else ln=tt; }
  if(ln) x.fillText(ln,x0,y0); }
function scrTex(n){ var T0=K.lib[n.tid]||{}; return tex(function(x,w,h){ x.fillStyle='rgba(6,14,32,.9)'; x.fillRect(0,0,w,h);
  x.fillStyle=n.c; x.globalAlpha=.07; for(var y=0;y<h;y+=5) x.fillRect(0,y,w,2); x.globalAlpha=1;
  x.strokeStyle=n.c; x.lineWidth=6; x.strokeRect(5,5,w-10,h-10);
  x.fillStyle=n.c; x.font='800 22px Manrope, system-ui, sans-serif'; x.fillText('ЗАДАНИЕ '+n.num,30,50);
  x.fillStyle='#ffffff'; x.font='700 36px Manrope, system-ui, sans-serif'; wrapTxt(x,T0.t,30,104,w-60,42,2);
  x.fillStyle='rgba(223,228,255,.8)'; x.font='500 25px Manrope, system-ui, sans-serif'; wrapTxt(x,T0.sub,30,200,w-60,32,3); },512,320); }
function taskScreen(n,b,w,L0){ var sg=new THREE.Group(); sg.position.set(w*2.1,0,-w*.5); sg.rotation.y=-.6; b.add(sg); /* сбоку от дороги, чуть повёрнут к ней */
  var pm=L0(0x2a3358,.15), po=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,3.6,8),pm); po.position.y=1.8; sg.add(po);
  var fr=new THREE.Mesh(new THREE.BoxGeometry(6.7,4.3,.3),L0(0x1b2240,.3)); fr.position.y=5.6; sg.add(fr);
  var pl=new THREE.Mesh(new THREE.PlaneGeometry(6.3,3.94),new THREE.MeshBasicMaterial({map:scrTex(n),transparent:true,opacity:.85})); pl.position.set(0,5.6,.16); sg.add(pl); n.mats.push(pl.material);
  n.scr=pl; n.scrW=6.3; n.scrH=3.94;
  n.anim.push(function(t){ if(n.st!=='lock') pl.material.opacity=.88+.1*Math.sin(t*7)*Math.sin(t*1.3); }); }
/* где экран в мире и откуда на него смотреть, чтобы он занял почти весь вид */
var SQ=new THREE.Quaternion();
function scrView(n){ var p=n.scr.getWorldPosition(V()), nm=V(0,0,1).applyQuaternion(n.scr.getWorldQuaternion(SQ)); nm.y=0; nm.normalize();
  var tv=Math.tan(C.fov*Math.PI/360), th=tv*C.aspect, f=Math.min(.92,800/innerWidth), D=Math.max(n.scrH/.95/(2*tv),n.scrW/f/(2*th)); /* экран по ширине совпадает с окном задания */
  return {p:p.clone().addScaledVector(nm,D),l:p,c:p,nm:nm}; }
function scrRect(n){ var hw=n.scrW/2, hh=n.scrH/2, xs=[], ys=[]; [[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]].forEach(function(q){ var v=n.scr.localToWorld(V(q[0],q[1],0)).project(C); xs.push((v.x+1)/2*innerWidth); ys.push((1-v.y)/2*innerHeight); });
  var l=Math.min.apply(0,xs), t=Math.min.apply(0,ys); return {l:l,t:t,w:Math.max.apply(0,xs)-l,h:Math.max.apply(0,ys)-t}; }
/* зоны заданий внутри модуля: вид зависит от типа задания */
var ZONE={
  zs:function(o){ /* вход в модуль: арка */ var h=8, r=o.w*1.4; [-1,1].forEach(function(sx){ o.add(new THREE.BoxGeometry(.9,h,.9),o.L0(0x2a3358,.2),sx*r,h/2,0); });
    var ar=o.add(new THREE.TorusGeometry(r,.35,8,40,Math.PI),o.glow(),0,h,0); var ln=o.add(new THREE.PlaneGeometry(r*2,1.2),o.glow({opacity:.35,side:THREE.DoubleSide}),0,h-1.6,0);
    o.n.anim.push(function(t){ ar.material.opacity=.6+.3*Math.sin(t*2); }); },
  zc:function(o){ /* материал: голограмма-стенд */ o.add(new THREE.CylinderGeometry(.9,1.2,1.6,12),o.L0(0x2a3358,.2),0,.8,0);
    var bd=o.add(new THREE.PlaneGeometry(o.w*1.1,o.w*.8),new THREE.MeshBasicMaterial({map:holoTex(o.n.c),transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}),0,3.6,0); o.n.mats.push(bd.material);
    var rg=o.add(new THREE.TorusGeometry(1.1,.08,6,30),o.glow(),0,1.8,0); rg.rotation.x=Math.PI/2;
    o.n.anim.push(function(t){ bd.position.y=3.6+Math.sin(t*1.3)*.25; bd.rotation.y=t*.6; bd.material.opacity=.7+.2*Math.sin(t*9)*Math.sin(t*1.7); rg.scale.setScalar(1+.15*Math.sin(t*2)); }); },
  zg:function(o){ /* тренажёр: игровая площадка с летающими кубиками */ var pd=o.add(new THREE.CylinderGeometry(o.w*1.3,o.w*1.35,.4,6),o.L0(0x1d2547,.25),0,.2,0);
    var ed=o.add(new THREE.TorusGeometry(o.w*1.3,.12,4,6),o.glow(),0,.45,0); ed.rotation.x=Math.PI/2;
    var cubes=[0,1,2].map(function(j){ var cb=o.add(new THREE.BoxGeometry(1.2,1.2,1.2),o.L0(MC[(j*2+1)%6],.6),Math.cos(j*2.1)*o.w*.7,3,Math.sin(j*2.1)*o.w*.7); return cb; });
    o.n.anim.push(function(t){ cubes.forEach(function(cb,j){ cb.rotation.set(t*(1+j*.3),t*.8,0); cb.position.y=3+Math.sin(t*2+j*2)*.8; }); }); },
  zq:function(o){ /* тест: ворота с вопросом */ var r=o.w*1.15, gt=o.add(new THREE.TorusGeometry(r,.32,8,48),o.glow(),0,r+1.2,0);
    [-1,1].forEach(function(sx){ o.add(new THREE.BoxGeometry(.6,1.6,.6),o.L0(0x2a3358,.2),sx*r*.7,.8,0); });
    var q=new THREE.Sprite(new THREE.SpriteMaterial({map:numTex('?'),transparent:true,depthWrite:false})); q.scale.setScalar(3.4); q.position.y=r+1.2; o.b.add(q); o.n.mats.push(q.material);
    o.n.anim.push(function(t){ gt.material.color.setHSL((t*.08)%1,.9,.62); q.position.y=r+1.2+Math.sin(t*2)*.3; }); },
  zf:function(o){ /* полёт: стартовая площадка с воротами */ var pd=o.add(new THREE.CircleGeometry(o.w*1.2,32),new THREE.MeshBasicMaterial({map:hTex(o.n.c),transparent:true}),0,.08,0); pd.rotation.x=-Math.PI/2; o.n.mats.push(pd.material);
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(q){ o.add(new THREE.CylinderGeometry(.12,.12,2.2,6),o.L0(0x94a3b8,.1),q[0]*o.w*1.25,1.1,q[1]*o.w*1.25); var lp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(o.n.c),blending:THREE.AdditiveBlending,depthWrite:false})); lp.scale.setScalar(1.6); lp.position.set(q[0]*o.w*1.25,2.3,q[1]*o.w*1.25); o.b.add(lp); });
    var g2=o.add(new THREE.TorusGeometry(2,.18,6,30),o.glow(),0,3.2,-o.w*2.4); var g3=o.add(new THREE.TorusGeometry(2,.18,6,30),o.glow(),o.w*.8,3.8,-o.w*4);
    o.n.anim.push(function(t){ g2.material.color.setHSL((t*.1)%1,.9,.6); g3.material.color.setHSL((t*.1+.3)%1,.9,.6); }); },
  zt:function(o){ /* занятие с тренером: будка тренера с флагом */ o.add(new THREE.BoxGeometry(o.w*1.3,3.2,o.w),o.L0(0x2a3358,.15),0,1.6,0);
    var wd=o.add(new THREE.PlaneGeometry(o.w*.9,1.3),o.glow({color:0xffe7a8,opacity:.8}),0,2,o.w/2+.02);
    var rf=o.add(new THREE.ConeGeometry(o.w*.95,1.6,4),o.L0(o.n.c,.35),0,4,0); rf.rotation.y=Math.PI/4;
    o.add(new THREE.CylinderGeometry(.07,.07,5,6),o.L0(0xd6d3ff,.1),o.w*.8,2.5,o.w*.4); var fl=o.add(new THREE.PlaneGeometry(1.6,1),o.glow({side:THREE.DoubleSide}),o.w*.8+.8,4.5,o.w*.4);
    o.n.anim.push(function(t){ fl.rotation.y=Math.sin(t*3)*.4; }); },
  zx:function(o){ /* итог модуля: пьедестал и кубок */ [[0,2.4,1.6],[-1.7,1.6,1.6],[1.7,1,1.6]].forEach(function(q){ o.add(new THREE.BoxGeometry(q[2],q[1],q[2]),o.L0(0x2a3358,.2),q[0],q[1]/2,0); });
    var cup=new THREE.Group(); cup.position.y=3.2; o.b.add(cup); var gold=o.L0(0xffd36e,.55); var cp=new THREE.Mesh(new THREE.CylinderGeometry(.9,.35,1.4,16,1,true),gold); cp.position.y=1.1; cup.add(cp);
    cup.add(new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.25,12),gold)); [-1,1].forEach(function(sx){ var hd=new THREE.Mesh(new THREE.TorusGeometry(.35,.08,6,16),gold); hd.position.set(sx*.95,1.2,0); hd.rotation.y=Math.PI/2; cup.add(hd); });
    o.n.anim.push(function(t){ cup.rotation.y=t*.9; }); }
};
function topY(st){ return PY+TOPH[st]+2.2; }
mods.forEach(function(m,i){ var a=i*1.02, r=RI*.62-i*1.6, st0=i<6?i+1:6, h=TOPH[st0];
  mkNode(LK,{id:m.id,kind:'mod',mid:m.id,city:1,h:h,st0:st0,from:i?mods[i-1].id:'me',n:'Модуль '+m.n,sub:m.t,c:MC[i%MC.length],p:[Math.sin(a)*r,topY(st0),CZ+Math.cos(a)*r],s:2,num:String(m.n),
  tip:i?'':'Главная нить курса: от здания к зданию, модули по порядку. Начинаем отсюда'}); LK.order.push(m.id); });
/* киоски у площадки (без нитей: от H нить идёт только к модулю 1): всё, что есть на сайте помимо модулей. act: home - окно прогресса, bug - сообщить об ошибке, code - вход по коду, soon - скоро */
/* свой квартал у площадки H: у каждого сервиса своё здание (решение 21.10, вариант 3А); настройки - внутри окна "Мой прогресс" */
[{id:'prog',n:'Мой прогресс',act:'home',c:'#4ade80',st0:'kp',a:-.4,tip:'Зарядная станция: зелёная полоса - сколько курса пройдено. Внутри очки, задания, уровень и настройки'},
 {id:'code',n:'Вход по коду',act:'code',c:'#7cf3ff',st0:'kc',a:-.66,tip:'Код от педагога: тогда он видит твой прогресс и открывает модули'},
 {id:'shp',n:'Шпаргалка',act:'soon',c:'#ff9f5a',st0:'k',a:-.9,tip:'Скоро: главные правила и цифры на одной странице'},
 {id:'bug',n:'Сообщить об ошибке',act:'bug',c:'#facc15',st0:'kb',a:.4,tip:'Мастерская: нашёл ошибку в задании - напиши, педагог поправит'},
 {id:'trn',n:'Тренажёр',act:'soon',c:'#ff7ce0',st0:'kt',a:.66,tip:'Скоро: тренажёры просто потренироваться, без заданий'}
].forEach(function(t){ var r=RI-8, h=TOPH[t.st0];
  t.kind='tab'; t.sub=t.tip; t.s=t.st0==='k'?1.2:1.5; t.city=1; t.h=h; t.p=[Math.sin(t.a)*r,topY(t.st0),CZ+Math.cos(t.a)*r]; mkNode(LK,t); LK.order.push(t.id); });
/* сама платформа: верх с сеткой, светящийся край, скала снизу, двигатели, посадочная площадка */
(function(){ var G=LK.g;
  var top=tex(function(x,w){ var c=w/2; x.fillStyle='#0d1330'; x.fillRect(0,0,w,w);
    var g=x.createRadialGradient(c,c,0,c,c,c); g.addColorStop(0,'rgba(124,243,255,.10)'); g.addColorStop(.7,'rgba(167,139,250,.06)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,w,w);
    x.strokeStyle='rgba(124,243,255,.22)'; x.lineWidth=1.2; var st=w/36; for(var i=0;i<=w;i+=st){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,w); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(w,i); x.stroke(); }
    x.strokeStyle='rgba(255,124,224,.35)'; x.lineWidth=3; [.3,.62].forEach(function(k){ x.beginPath(); x.arc(c,c,c*k,0,6.283); x.stroke(); });
    for(i=0;i<70;i++){ x.fillStyle='rgba(255,231,168,'+(.3+Math.random()*.6)+')'; x.fillRect(Math.random()*w,Math.random()*w,2,2); } },mob?512:1024);
  var deck=new THREE.Mesh(new THREE.CylinderGeometry(RI,RI-2,2.4,64),[new THREE.MeshLambertMaterial({color:0x1b2246,emissive:0x7c5cff,emissiveIntensity:.12}),new THREE.MeshLambertMaterial({map:top,emissive:0xffffff,emissiveMap:top,emissiveIntensity:.55}),new THREE.MeshLambertMaterial({color:0x111633})]);
  deck.position.set(0,PY-1.2,CZ); G.add(deck);
  var rim=new THREE.Mesh(new THREE.TorusGeometry(RI,.35,8,96),new THREE.MeshBasicMaterial({color:0x7cf3ff,transparent:true,opacity:.9})); rim.rotation.x=Math.PI/2; rim.position.set(0,PY,CZ); G.add(rim); LK.rim=rim;
  var rock=new THREE.ConeGeometry(RI-2,52,28,6,true), pos=rock.attributes.position; for(var i=0;i<pos.count;i++){ var y=pos.getY(i); if(y<25){ var f=1+(Math.random()-.5)*.22; pos.setX(i,pos.getX(i)*f); pos.setZ(i,pos.getZ(i)*f); pos.setY(i,y+(Math.random()-.5)*4); } }
  rock.computeVertexNormals(); var rk=new THREE.Mesh(rock,new THREE.MeshLambertMaterial({color:0x2a2148,emissive:0x3b1d6e,emissiveIntensity:.25,flatShading:true,side:THREE.DoubleSide})); rk.rotation.x=Math.PI; rk.position.set(0,PY-2.4-26,CZ); G.add(rk);
  LK.eng=[]; [[0,0],[24,10],[-22,14],[8,-26],[-14,-22]].forEach(function(q,j){ var e=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(j%2?'#ff7ce0':'#7cf3ff'),blending:THREE.AdditiveBlending,depthWrite:false})); e.position.set(q[0],PY-14-j*5,CZ+q[1]); e.scale.setScalar(j?14:30); G.add(e); LK.eng.push(e); });
  var under=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#a78bfa'),blending:THREE.AdditiveBlending,depthWrite:false,opacity:.5})); under.scale.set(260,160,1); under.position.set(0,PY-70,CZ); G.add(under);
  /* посадочная площадка: это "мы", отсюда нить идёт к модулю 1 */
  var pad=new THREE.Mesh(new THREE.CircleGeometry(6,40),new THREE.MeshBasicMaterial({map:tex(function(x,w){ var c=w/2; x.strokeStyle='#7cf3ff'; x.lineWidth=w*.04; x.beginPath(); x.arc(c,c,c*.86,0,6.283); x.stroke();
    x.font='900 '+(w*.5)+'px Manrope, system-ui'; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#7cf3ff'; x.fillText('H',c,c+w*.03); },256),transparent:true}));
  pad.rotation.x=-Math.PI/2; pad.position.set(LK.me.x,PY+.05,LK.me.z); G.add(pad); LK.pad=pad;
  /* детали города: бегущие огни по краю, кольцо над H, радары и маяки с вращающимся светом */
  LK.lamps=[]; var NL=mob?36:64; for(var li=0;li<NL;li++){ var la=li/NL*6.283, lp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(li%2?'#ff7ce0':'#7cf3ff'),blending:THREE.AdditiveBlending,depthWrite:false}));
    lp.scale.setScalar(2.2); lp.position.set(Math.sin(la)*(RI+.2),PY+.9,CZ+Math.cos(la)*(RI+.2)); G.add(lp); LK.lamps.push(lp); }
  var hr=new THREE.Mesh(new THREE.TorusGeometry(7.5,.12,6,48),new THREE.MeshBasicMaterial({color:0x7cf3ff,transparent:true,opacity:.7})); hr.rotation.x=Math.PI/2; hr.position.set(LK.me.x,PY+2.2,LK.me.z); G.add(hr); LK.hring=hr;
  LK.spin=[]; [[-.25,RI-4],[.25,RI-4],[2.6,RI-6],[3.6,RI-6]].forEach(function(q,j){ var a=q[0], x=Math.sin(a)*q[1], z=CZ+Math.cos(a)*q[1], g=new THREE.Group(); g.position.set(x,PY,z); G.add(g);
    var mm=new THREE.MeshLambertMaterial({color:0x8892b0,emissive:0x2a3358,emissiveIntensity:.4});
    if(j<2){ var post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,4,6),mm); post.position.y=2; g.add(post); var hd=new THREE.Group(); hd.position.y=4.2; g.add(hd);
      var dish=new THREE.Mesh(new THREE.CylinderGeometry(1.3,.15,.5,16,1,true),new THREE.MeshLambertMaterial({color:0xd6dcf0,emissive:0x7cf3ff,emissiveIntensity:.25,side:THREE.DoubleSide})); dish.rotation.x=-1.1; hd.add(dish); LK.spin.push({o:hd,v:j?1.3:-1}); }
    else { var tw=new THREE.Mesh(new THREE.CylinderGeometry(.25,.5,9,8),mm); tw.position.y=4.5; g.add(tw); var bh=new THREE.Group(); bh.position.y=9.4; g.add(bh);
      var bm=new THREE.Mesh(new THREE.ConeGeometry(1.2,9,16,1,true),new THREE.MeshBasicMaterial({color:0xffd36e,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); bm.rotation.z=Math.PI/2; bm.position.x=4.5; bh.add(bm);
      var bl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ffd36e'),blending:THREE.AdditiveBlending,depthWrite:false})); bl.scale.setScalar(3); bh.add(bl); LK.spin.push({o:bh,v:2.2}); } });
  /* дроны учеников: кружат над городом, мигают огнями */
  /* дроны учеников: FPV-квадрики кружат над городом, мигают огнями */
  LK.drones=[]; for(var d=0;d<(mob?5:9);d++){ var q=mkDrone(MC[d%MC.length],d%2?'#ff4d6d':'#4ade80'); q.g.scale.setScalar(.9); G.add(q.g);
    q.r=18+Math.random()*(RI-26); q.a=Math.random()*6.283; q.sp=(.12+Math.random()*.2)*(Math.random()<.5?1:-1); q.y=PY+8+Math.random()*18; q.ph=Math.random()*6; LK.drones.push(q); }
})();
LK.over={p:V(0,PY+40,CZ+RI+34),l:V(0,PY+2,CZ-6)};
/* ===== уровни модулей = локации: провалились в здание модуля - вокруг новая местность со своим небом и землёй.
   Задания - зоны вдоль дороги (по нити): прошёл зону - дрон-проводник летит вперёд, камера за ним к следующей ===== */
/* какие модули - открытые площадки (вокруг виден город), какие - закрытые (внутри огромного космического ангара); номера модулей с 1. Решение 21.10, вариант 5А */
var OPEN_MODS=[1,4,6];
/* во сколько раз город под крышей открытого модуля крупнее самого города (см. cityAround) */
var CF=7;
/* как влетаем в модуль (правка 7): portal - кольцо-портал над антенной, fpv - FPV-дрон ныряет в дверь здания, hyper - гиперпрыжок */
var MOD_TRANS={1:'portal',2:'fpv',3:'fpv',4:'portal',5:'fpv',6:'hyper'};
var THEME=[
  {n:'Полигон',sky:['#0b1a3a','#ff9f5a'],gr:function(x,w){ x.fillStyle='#2d4a2b'; x.fillRect(0,0,w,w); for(var i=0;i<400;i++){ x.fillStyle='rgba(0,0,0,'+Math.random()*.15+')'; x.fillRect(Math.random()*w,Math.random()*w,3,3); } x.strokeStyle='rgba(255,255,255,.08)'; x.strokeRect(0,0,w,w); },deco:['cone','post','crate']},
  {n:'Мастерская',sky:['#140b05','#ff7a2e'],gr:function(x,w){ x.fillStyle='#3a4152'; x.fillRect(0,0,w,w); x.strokeStyle='rgba(0,0,0,.45)'; x.lineWidth=3; x.strokeRect(2,2,w-4,w-4); x.fillStyle='rgba(255,255,255,.18)'; [[10,10],[w-12,10],[10,w-12],[w-12,w-12]].forEach(function(q){ x.fillRect(q[0],q[1],3,3); }); },deco:['crate','bench','post']},
  {n:'Энергостанция',sky:['#04091a','#1fb7c9'],gr:function(x,w){ x.fillStyle='#0f1626'; x.fillRect(0,0,w,w); x.strokeStyle='rgba(124,243,255,.35)'; x.lineWidth=2; x.beginPath(); x.moveTo(0,w*.3); x.lineTo(w*.4,w*.3); x.lineTo(w*.5,w*.6); x.lineTo(w,w*.6); x.moveTo(w*.7,0); x.lineTo(w*.7,w); x.stroke(); },deco:['pylon','cell','post']},
  {n:'Аэродром',sky:['#0a3a6e','#bfe6ff'],day:1,gr:function(x,w){ x.fillStyle='#4f6b3a'; x.fillRect(0,0,w,w); for(var i=0;i<500;i++){ x.fillStyle='rgba(20,40,10,'+Math.random()*.25+')'; x.fillRect(Math.random()*w,Math.random()*w,2,4); } },deco:['tree','post','crate']},
  {n:'Неоновая трасса',sky:['#0b0320','#a3208f'],gr:function(x,w){ x.fillStyle='#0a0a16'; x.fillRect(0,0,w,w); x.strokeStyle='rgba(255,47,208,.45)'; x.lineWidth=2; x.strokeRect(0,0,w,w); },deco:['gate','post']},
  {n:'Небесная арена',sky:['#1a0b3d','#ffd36e'],gr:function(x,w){ x.fillStyle='#a9a2e6'; x.fillRect(0,0,w,w); for(var i=0;i<60;i++){ var g=x.createRadialGradient(Math.random()*w,Math.random()*w,0,Math.random()*w,Math.random()*w,40); x.fillStyle='rgba(255,255,255,.12)'; x.beginPath(); x.arc(Math.random()*w,Math.random()*w,10+Math.random()*30,0,6.283); x.fill(); } },deco:['rock','cloud']}
];
function zoneKind(tid){ var L0=K.lib[tid]||{steps:[]}, ss=L0.steps.map(function(q){ return q.s; });
  if(L0.fly||ss.indexOf('fly')>=0) return 'zf'; if(/final|_as$/.test(tid)) return 'zx'; if(/coach|_day$/.test(tid)) return 'zt'; if(ss.indexOf('game')>=0) return 'zg'; if(/rep$/.test(tid)||ss[0]==='quiz') return 'zq'; return 'zc'; }
function skyDome(T){ var t=tex(function(x,w,h){ var g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,T.sky[0]); g.addColorStop(.47,T.sky[1]); g.addColorStop(.53,T.sky[1]); g.addColorStop(1,T.sky[0]); x.fillStyle=g; x.fillRect(0,0,w,h);
    if(!T.day) for(var i=0;i<600;i++){ x.fillStyle='rgba(255,255,255,'+Math.random()*.8+')'; x.fillRect(Math.random()*w,Math.random()*h*.38,1.4,1.4); } },512,512);
  return new THREE.Mesh(new THREE.SphereGeometry(430,32,18),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false,depthWrite:false})); }
function prop(kind,c){ var g=new THREE.Group(), M2=function(col,e){ return new THREE.MeshLambertMaterial({color:col,emissive:new THREE.Color(e||col),emissiveIntensity:e?.6:.05}); };
  function m(geo,mt,x,y,z){ var q=new THREE.Mesh(geo,mt); q.position.set(x||0,y||0,z||0); g.add(q); return q; }
  if(kind==='cone'){ m(new THREE.ConeGeometry(.7,1.8,12),M2(0xff7a1a),0,.9,0); m(new THREE.CylinderGeometry(.46,.52,.3,12),M2(0xffffff),0,.9,0); }
  else if(kind==='crate'){ var s2=1.6+Math.random()*1.4; m(new THREE.BoxGeometry(s2,s2,s2),M2(Math.random()<.5?0x6b5434:0x3a4152),0,s2/2,0).rotation.y=Math.random()*3; }
  else if(kind==='bench'){ m(new THREE.BoxGeometry(4,.3,1.6),M2(0x8892b0),0,1.6,0); [-1.7,1.7].forEach(function(x0){ m(new THREE.BoxGeometry(.25,1.6,1.4),M2(0x2a3358),x0,.8,0); }); m(new THREE.BoxGeometry(.8,.5,.6),M2(0x222a4a,c),.6,2,0); }
  else if(kind==='post'){ m(new THREE.CylinderGeometry(.1,.12,4,6),M2(0x94a3b8),0,2,0); var lp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(c),blending:THREE.AdditiveBlending,depthWrite:false})); lp.scale.setScalar(2.4); lp.position.y=4.2; g.add(lp); g.userData.blink=lp; }
  else if(kind==='pylon'){ m(new THREE.BoxGeometry(.5,12,.5),M2(0x2a3358),0,6,0); m(new THREE.BoxGeometry(5,.3,.3),M2(0x2a3358),0,10,0); m(new THREE.BoxGeometry(3.4,.3,.3),M2(0x2a3358),0,8,0); m(new THREE.SphereGeometry(.35,8,6),M2(0x7cf3ff,'#7cf3ff'),0,12.2,0); var pl2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ff4d6d'),blending:THREE.AdditiveBlending,depthWrite:false})); pl2.scale.setScalar(2); pl2.position.y=12.8; g.add(pl2); g.userData.blink=pl2; }
  else if(kind==='cell'){ var h=3+Math.random()*3; m(new THREE.CylinderGeometry(1,1,h,16),M2(0x1d2547),0,h/2,0); m(new THREE.CylinderGeometry(1.02,1.02,h*.25,16,1,true),M2(0x7cf3ff,c),0,h*.6,0); }
  else if(kind==='tree'){ m(new THREE.CylinderGeometry(.25,.35,2,6),M2(0x5b3b1e),0,1,0); m(new THREE.ConeGeometry(1.6,4,8),M2(0x2f6b35),0,4,0); }
  else if(kind==='gate'){ var gt=m(new THREE.TorusGeometry(2.4,.2,6,30),new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(Math.random(),.9,.6)}),0,2.6,0); gt.rotation.y=Math.random()*3; g.userData.spinO=gt; }
  else if(kind==='rock'){ var r=m(new THREE.DodecahedronGeometry(1.5+Math.random()*2,0),new THREE.MeshLambertMaterial({color:0x6a5f9e,flatShading:true}),0,1.5+Math.random()*6,0); r.rotation.set(Math.random(),Math.random(),0); }
  else if(kind==='cloud'){ var cl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ffffff'),transparent:true,opacity:.35,depthWrite:false})); cl.scale.set(18,8,1); cl.position.y=1; g.add(cl); }
  return g; }
mods.forEach(function(m,i){ var c=MC[i%MC.length], T=THEME[i%THEME.length], open=OPEN_MODS.indexOf(i+1)>=0,
  L=mkLevel(m.id,{mid:m.id,mi:i,open:open,pz:-80,name:'Модуль '+m.n+'. '+m.t,mix:0,c:c,loc:1,me:V(0,PY+2,0),fog:new THREE.Fog(open?new THREE.Color('#0a0d24').lerp(new THREE.Color(c),.08):new THREE.Color(T.sky[0]).lerp(new THREE.Color(c),.12),open?180:90,open?900:420)});
  var pts=[[0,-28]]; m.tasks.forEach(function(tid,k){ pts.push([Math.sin(k*1.25+.6)*20,-58-k*30]); });
  var gt=tex(T.gr,256); gt.wrapS=gt.wrapT=THREE.RepeatWrapping;
  if(open) roof(L,pts,c,gt,T,i); /* открытый модуль: мы на крыше здания модуля, вокруг космос, внизу город */
  else { gt.repeat.set(36,36); L.g.add(skyDome(T));
    var gr=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshLambertMaterial({map:gt,emissive:0xffffff,emissiveMap:gt,emissiveIntensity:T.day?.55:.35})); gr.rotation.x=-Math.PI/2; gr.position.set(0,PY-.02,-120); L.g.add(gr); }
  mkNode(L,{id:'c_'+m.id,kind:'center',mid:m.id,from:'me',n:'Модуль '+m.n,sub:T.n+'. '+m.t,c:c,zone:1,st0:'zs',face:0,p:[0,topY('zs'),-28],s:1.6,num:String(m.n)}); L.order.push('c_'+m.id);
  var prev='c_'+m.id, k=0;
  m.tasks.forEach(function(tid){ var T0=K.lib[tid]; if(!T0) return; var q=pts[k+1], pq=pts[k], st0=zoneKind(tid);
    mkNode(L,{id:tid,kind:'task',tid:tid,mid:m.id,from:prev,n:(k+1)+'. '+T0.t,sub:T0.sub,c:c,zone:1,st0:st0,face:Math.atan2(pq[0]-q[0],pq[1]-q[1]),p:[q[0],topY(st0),q[1]],s:1.6,num:String(k+1)}); L.order.push(tid); prev=tid; k++; });
  /* декор по теме вдали от дороги */
  function nearRoad(x,z){ for(var j=0;j<pts.length;j++){ var a2=pts[j], b2=pts[j+1]||pts[j], dx=b2[0]-a2[0], dz=b2[1]-a2[1], l2=dx*dx+dz*dz||1, u=Math.max(0,Math.min(1,((x-a2[0])*dx+(z-a2[1])*dz)/l2)), ex=a2[0]+dx*u-x, ez=a2[1]+dz*u-z; if(ex*ex+ez*ez<150) return true; } return Math.hypot(x,z)<12; }
  for(var d=0,tries=0;d<(mob?22:44)&&tries<400;tries++){ var x=(Math.random()-.5)*150, z=20-Math.random()*(pts.length*30+60); if(nearRoad(x,z)) continue; var pr=prop(T.deco[d%T.deco.length],c); pr.position.set(x,PY,z); L.g.add(pr); d++;
    if(pr.userData.blink) (L.blink=L.blink||[]).push({s:pr.userData.blink,f:1.5+Math.random()*3,p:Math.random()*6}); if(pr.userData.spinO) (L.spin=L.spin||[]).push({o:pr.userData.spinO,v:(Math.random()<.5?-1:1)*(.4+Math.random()*.8)}); }
  L.gd=mkDrone(c,'#ffffff'); L.gd.g.scale.setScalar(1.1); L.gd.g.position.set(0,PY+6,-12); L.g.add(L.gd.g);
  if(!open) hangar(L,pts,c);
  L.over={p:V(0,PY+30,26),l:V(0,PY+2,-80)}; });
/* закрытый модуль: огромный космический ангар над всей дорогой - свод с фермами, окна в космос, лампы под потолком */
var HANGT=null;
function hangar(L,pts,c){ var zMin=pts[pts.length-1][1]-70, z0=80, len=z0-zMin, R=95, zc=(z0+zMin)/2;
  if(!HANGT){ HANGT=tex(function(x,w,h){ x.fillStyle='#10152c'; x.fillRect(0,0,w,h); x.strokeStyle='rgba(167,139,250,.25)'; x.lineWidth=2; x.strokeRect(1,1,w-2,h-2);
    x.fillStyle='#03040c'; x.fillRect(w*.18,h*.22,w*.64,h*.5); for(var i=0;i<40;i++){ x.fillStyle='rgba(255,255,255,'+(.3+Math.random()*.7)+')'; x.fillRect(w*.18+Math.random()*w*.64,h*.22+Math.random()*h*.5,1.5,1.5); }
    x.strokeStyle='rgba(124,243,255,.5)'; x.strokeRect(w*.18,h*.22,w*.64,h*.5); },128,128); HANGT.wrapS=HANGT.wrapT=THREE.RepeatWrapping; HANGT.repeat.set(10,Math.round(len/26)); }
  var vm=new THREE.MeshBasicMaterial({map:HANGT,side:THREE.DoubleSide}), vault=new THREE.Mesh(new THREE.CylinderGeometry(R,R,len,48,1,true,Math.PI/2,Math.PI),vm);
  vault.rotation.x=Math.PI/2; vault.position.set(0,PY,zc); L.g.add(vault);
  var wm=new THREE.MeshBasicMaterial({color:0x0c1024,side:THREE.DoubleSide}); [z0,zMin].forEach(function(z){ var wl=new THREE.Mesh(new THREE.CircleGeometry(R,48,0,Math.PI),wm); wl.position.set(0,PY,z); L.g.add(wl); });
  var rib=new THREE.MeshBasicMaterial({color:new THREE.Color(c).lerp(new THREE.Color('#1b2246'),.55)}), lamp=glowTex('#ffe7a8');
  for(var z=z0-20;z>zMin;z-=36){ var rb=new THREE.Mesh(new THREE.TorusGeometry(R-1.5,1.1,6,48,Math.PI),rib); rb.position.set(0,PY,z); L.g.add(rb);
    [-.5,0,.5].forEach(function(a){ var lp=new THREE.Sprite(new THREE.SpriteMaterial({map:lamp,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8})); lp.scale.setScalar(9); lp.position.set(Math.sin(a)*(R-6),PY+Math.cos(a)*(R-6),z); L.g.add(lp); }); }
  var fl=new THREE.Mesh(new THREE.PlaneGeometry(R*2,len),new THREE.MeshBasicMaterial({color:new THREE.Color(c),transparent:true,opacity:.06,depthWrite:false})); fl.rotation.x=-Math.PI/2; fl.position.set(0,PY+.03,zc); L.g.add(fl);
  L.closed=1; }
/* крыша здания модуля: плита с покрытием локации, ограждение с огнями по краю, стены с окнами уходят вниз, на краю - антенна модуля */
function roof(L,pts,c,gt,T,i){ var z0=60, zMin=pts[pts.length-1][1]-55, len=z0-zMin, W=176, zc=(z0+zMin)/2, cc=new THREE.Color(c);
  gt.repeat.set(W/20,len/20); var wt=winTex(c);
  var side=new THREE.MeshLambertMaterial({map:wt,emissive:0xffffff,emissiveMap:wt,emissiveIntensity:.7}), top=new THREE.MeshLambertMaterial({map:gt,emissive:0xffffff,emissiveMap:gt,emissiveIntensity:T.day?.5:.35});
  var D=Math.max(150,TOPH[i<6?i+1:6]*CF); wt.repeat.set(W/10,6*D/64); /* стены здания уходят вниз до платформы города (город внизу в масштабе CF) */
  var body=new THREE.Mesh(new THREE.BoxGeometry(W,D,len),[side,side,top,side,side,side]); body.position.set(0,PY-D/2,zc); L.g.add(body); L.zc=zc;
  var rail=new THREE.MeshBasicMaterial({color:cc}); [[0,z0,W,.25],[0,zMin,W,.25],[-W/2,zc,.25,len],[W/2,zc,.25,len]].forEach(function(q){ var rb=new THREE.Mesh(new THREE.BoxGeometry(q[2],.25,q[3]),rail); rb.position.set(q[0],PY+1.1,q[1]); L.g.add(rb); });
  L.blink=L.blink||[]; for(var z=z0;z>=zMin;z-=16) [-W/2,W/2].forEach(function(x){ var lp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(c),blending:THREE.AdditiveBlending,depthWrite:false})); lp.scale.setScalar(2.2); lp.position.set(x,PY+1.4,z); L.g.add(lp); L.blink.push({s:lp,f:2,p:z*.08+(x>0?3:0)}); });
  /* антенна модуля в конце крыши - та же, что над зданием в городе */
  var ant=new THREE.Group(); ant.position.set(W/2-14,PY,zMin+14); L.g.add(ant); var am=new THREE.MeshLambertMaterial({color:0xb8c2e0,emissive:cc,emissiveIntensity:.35});
  var mast=new THREE.Mesh(new THREE.CylinderGeometry(.35,.7,26,8),am); mast.position.y=13; ant.add(mast); [8,15,21].forEach(function(y,j){ var cb=new THREE.Mesh(new THREE.BoxGeometry(6-j*1.6,.3,.3),am); cb.position.y=y; cb.rotation.y=j*.8; ant.add(cb); });
  var dish=new THREE.Mesh(new THREE.CylinderGeometry(3,.4,1.2,16,1,true),new THREE.MeshLambertMaterial({color:0xd6dcf0,emissive:cc,emissiveIntensity:.3,side:THREE.DoubleSide})); dish.position.y=18; dish.rotation.z=-.9; var dh=new THREE.Group(); dh.add(dish); dh.position.y=0; ant.add(dh);
  var tipL=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ff4d6d'),blending:THREE.AdditiveBlending,depthWrite:false})); tipL.scale.setScalar(5); tipL.position.y=26.5; ant.add(tipL); L.blink.push({s:tipL,f:3,p:0}); (L.spin=L.spin||[]).push({o:dh,v:.5});
  /* на крыше: вентиляторы-кондиционеры с крутящимися лопастями и мигающим огоньком */
  var vm=new THREE.MeshLambertMaterial({color:0x8892b0,emissive:0x1b2246,emissiveIntensity:.4}), bm=new THREE.MeshBasicMaterial({color:0x1a1f33,side:THREE.DoubleSide});
  for(var k=0;k<(mob?4:8);k++){ var vx=(k%2?1:-1)*(W/2-9), vz=z0-24-k*(len-50)/8, vg=new THREE.Group(); vg.position.set(vx,PY,vz); L.g.add(vg);
    var bx=new THREE.Mesh(new THREE.BoxGeometry(6,2.4,6),vm); bx.position.y=1.2; vg.add(bx); var fan=new THREE.Group(); fan.position.y=2.45; vg.add(fan);
    [0,1,2,3].forEach(function(j){ var bl=new THREE.Mesh(new THREE.BoxGeometry(4.6,.08,.7),bm); bl.rotation.y=j*Math.PI/4; fan.add(bl); });
    var vl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(k%3?'#9dff7c':'#ff9f5a'),blending:THREE.AdditiveBlending,depthWrite:false})); vl.scale.setScalar(1.2); vl.position.set(2.6,2.6,2.6); vg.add(vl);
    L.spin.push({o:fan,v:4+Math.random()*3}); L.blink.push({s:vl,f:2+Math.random()*2,p:Math.random()*6}); }
  L.roof=1; }
/* открытый модуль: мы на крыше здания модуля, внизу - весь город Взлёт в том же масштабе, что и модуль (правка 22.10: город снизу был слишком мелким).
   Это копия уровня LK, увеличенная в CF раз и повёрнутая так, что наше здание стоит под крышей, а центр города - впереди.
   Живые детали копии (огни, вертушки, дроны, роботы, кристалл) двигаются вместе с настоящим городом: см. syncCity */
var CMOV=null;
/* какие части города двигаются: один раз прокручиваем жизнь города и смотрим, что сдвинулось */
function cityMoving(){ if(CMOV) return CMOV; var all=[], t0=tm, mv=new Set(); LK.g.traverse(function(o){ all.push(o); });
  function rec(){ return all.map(function(o){ return o.position.toArray().concat(o.quaternion.toArray(),o.scale.toArray(),[o.visible?1:0]); }); }
  var a=rec(); [1.3,2.9,4.4].forEach(function(t){ tm=t0+t; life(LK,.3); rec().forEach(function(r,i){ for(var j=0;j<r.length;j++) if(Math.abs(r[j]-a[i][j])>1e-6){ mv.add(all[i]); break; } }); }); tm=t0;
  return CMOV=mv; }
function cityAround(L){ if(!L.open) return; var nm=LK.nodes.filter(function(n){ return n.model; }).length; if(L.city&&L.cityN===nm) return; /* догрузились модели - пересобираем */
  if(L.city) L.g.remove(L.city); L.cityN=nm;
  var me=LK.by[L.mid], D=Math.max(150,TOPH[me.st0]*CF), mv=cityMoving(), cp=LK.g.clone(true), pairs=[], skip=new Set([me.g,me.bld]); LK.pulses.forEach(function(q){ skip.add(q.sp); });
  LK.drones.filter(function(q){ return !q.patrol; }).slice(2).forEach(function(q){ skip.add(q.g); }); /* снизу хватит пары дронов и патрульных: бережём телефон */
  LK.nodes.forEach(function(n){ skip.add(n.wf); }); if(mob) LK.lamps.forEach(function(q,j){ if(j%2) skip.add(q); });
  (function walk(a,b){ for(var i=0;i<a.children.length;i++){ var x=a.children[i], y=b.children[i]; if(skip.has(x)){ y.visible=false; continue; } if(mv.has(x)) pairs.push([x,y]); if(x.material&&x.material.depthTest===false){ y.material=x.material.clone(); y.material.depthTest=true; } /* номера модулей не просвечивают сквозь крышу */ walk(x,y); } })(LK.g,cp);
  cp.visible=true; cp.position.set(-me.p[0],-PY,-me.p[2]);
  var o=new THREE.Group(); o.add(cp); o.scale.setScalar(CF); o.rotation.y=Math.PI-Math.atan2(-me.p[0],CZ-me.p[2]); o.position.set(0,PY-D,L.zc); L.g.add(o); L.city=o; L.sync=pairs; }
function syncCity(L){ var P=L.sync; for(var i=0;i<P.length;i++){ var a=P[i][0], b=P[i][1]; b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); b.visible=a.visible; } }
/* дорога по нити между зонами: тёмная лента со светящимися краями и пунктиром */
var ROADT=null;
function road(L,cv,col,wd){ wd=wd||1.8; if(!ROADT){ ROADT=tex(function(x,w,h){ x.fillStyle='#141a2e'; x.fillRect(0,0,w,h); x.fillStyle='#ffffff'; x.fillRect(0,0,4,h); x.fillRect(w-4,0,4,h); x.globalAlpha=.8; x.fillRect(w/2-3,0,6,h*.5); },64,128); ROADT.wrapT=THREE.RepeatWrapping; }
  var N2=48, P=[], U=[], I2=[], len=cv.getLength(), a3=V(0,0,0), t3=V(0,0,0);
  for(var i=0;i<=N2;i++){ var u=i/N2; cv.getPoint(u,a3); cv.getTangent(u,t3); t3.y=0; t3.normalize(); var nx=-t3.z*wd, nz=t3.x*wd;
    P.push(a3.x+nx,PY+.06,a3.z+nz, a3.x-nx,PY+.06,a3.z-nz); U.push(0,u*len/6, 1,u*len/6); if(i<N2){ var o=i*2; I2.push(o,o+1,o+2, o+1,o+3,o+2); } }
  var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I2);
  var m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:ROADT,side:THREE.DoubleSide,color:new THREE.Color(col).lerp(new THREE.Color('#ffffff'),.4)})); L.g.add(m); }
/* дороги в городе: широкая светящаяся от H к модулю 1 и дальше от здания к зданию по порядку; от H к сервисам - тропинки */
function cityRoads(){ function gp(n){ return V(n.p[0],PY,n.p[2]); }
  var me=V(LK.me.x,PY,LK.me.z), prev=null;
  mods.forEach(function(m){ var n=LK.by[m.id], b=gp(n), a=prev?gp(prev):me.clone(), mid=a.clone().lerp(b,.5), out=V(mid.x,0,mid.z-CZ);
    if(prev&&out.lengthSq()>.01) mid.addScaledVector(out.normalize(),6);
    if(!prev) a.addScaledVector(b.clone().sub(a).normalize(),7);
    var rcv=new THREE.QuadraticBezierCurve3(a,mid,b); (LK.rc=LK.rc||[]).push(rcv); road(LK,rcv,n.c,1.6); prev=n; });
  LK.nodes.forEach(function(n){ if(n.kind!=='tab') return; var b=gp(n), a=me.clone(); a.addScaledVector(b.clone().sub(a).normalize(),7); var mid=a.clone().lerp(b,.5); mid.z-=4;
    road(LK,new THREE.QuadraticBezierCurve3(a,mid,b),n.c,.55); }); }
cityRoads();
/* энергетический кристалл в центре города: переливается, по площадке к каждому модулю бегут огоньки зарядки */
(function(){ var G=LK.g, cg=new THREE.Group(); cg.position.set(0,PY,CZ); G.add(cg);
  var base=new THREE.Mesh(new THREE.CylinderGeometry(4.2,5,1.2,8),new THREE.MeshLambertMaterial({color:0x1b2246,emissive:0x7c5cff,emissiveIntensity:.25})); base.position.y=.6; cg.add(base);
  var cm=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x7cf3ff,emissiveIntensity:.9,transparent:true,opacity:.88,flatShading:true});
  var cr=new THREE.Mesh(new THREE.OctahedronGeometry(3,0),cm); cr.scale.set(1,2.1,1); cr.position.y=8; cg.add(cr);
  var c2=new THREE.Mesh(new THREE.OctahedronGeometry(1.4,0),cm); c2.position.y=8; cg.add(c2);
  var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#7cf3ff'),blending:THREE.AdditiveBlending,depthWrite:false})); gl.scale.setScalar(26); gl.position.y=8; cg.add(gl);
  var rings=[0,1].map(function(j){ var rg=new THREE.Mesh(new THREE.TorusGeometry(5+j*1.6,.08,4,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6})); rg.position.y=8; cg.add(rg); return rg; });
  /* линии энергии по площадке к модулям и огоньки, бегущие от кристалла */
  var lines=[], hc3=new THREE.Color(); mods.forEach(function(m){ var n=LK.by[m.id]; if(!n) return; var a=V(0,PY+.1,CZ), b=V(n.p[0],PY+.1,n.p[2]), dir=b.clone().sub(a), dl=dir.length()-6; dir.normalize(); a.addScaledVector(dir,5);
    var ln=new THREE.Mesh(new THREE.PlaneGeometry(.45,dl),new THREE.MeshBasicMaterial({color:new THREE.Color(n.c),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false})); ln.rotation.x=-Math.PI/2; ln.rotation.z=-Math.atan2(dir.x,-dir.z); ln.position.copy(a).addScaledVector(dir,dl/2); G.add(ln);
    for(var k=0;k<3;k++){ var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(n.c),blending:THREE.AdditiveBlending,depthWrite:false})); sp.scale.setScalar(1.8); G.add(sp); lines.push({sp:sp,a:a.clone(),d:dir.clone(),l:dl,t:k/3,n:n}); } });
  /* искорки поднимаются от кристалла */
  var NS=mob?30:60, sparks=[]; for(var k=0;k<NS;k++){ var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(k%2?'#7cf3ff':'#ff7ce0'),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); sp.scale.setScalar(.6); cg.add(sp); sparks.push({sp:sp,a:Math.random()*6.283,r:2+Math.random()*7,y:Math.random()*20,v:1+Math.random()*2}); }
  LK.crystal=function(t,dt){ hc3.setHSL((t*.05)%1,.9,.6); cm.emissive.copy(hc3); gl.material.color.copy(hc3); cr.rotation.y=t*.4; c2.rotation.y=-t*.9; c2.rotation.x=t*.5; cr.position.y=8+Math.sin(t*1.2)*.5;
    rings.forEach(function(rg,j){ rg.rotation.x=t*(.5+j*.3); rg.rotation.y=t*(.3-j*.2); });
    lines.forEach(function(q){ q.t=(q.t+dt*(q.n.st==='lock'?.08:.25))%1; q.sp.position.copy(q.a).addScaledVector(q.d,q.l*q.t); q.sp.material.opacity=q.n.st==='lock'?.25:Math.min(1,(1-q.t)*4); });
    sparks.forEach(function(q){ q.y+=dt*q.v; if(q.y>22){ q.y=0; q.a=Math.random()*6.283; } q.a+=dt*.4; q.sp.position.set(Math.cos(q.a)*q.r,q.y,Math.sin(q.a)*q.r); q.sp.material.opacity=Math.max(0,1-q.y/22); }); };
  /* роботы-доставщики: катаются по дороге от модуля к модулю, мигают огоньком */
  LK.bots=[]; (LK.rc||[]).forEach(function(cv,j){ if(j===0) return; for(var k=0;k<(mob?1:2);k++){ var g=new THREE.Group(), col=MC[(j+k)%MC.length];
    var bd=new THREE.Mesh(new THREE.BoxGeometry(1.1,.7,1.5),new THREE.MeshLambertMaterial({color:0xd6dcf0,emissive:new THREE.Color(col),emissiveIntensity:.25})); bd.position.y=.75; g.add(bd);
    var box=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.8),new THREE.MeshLambertMaterial({color:0x8a6a3a})); box.position.set(0,1.35,-.15); g.add(box);
    [[-.55,.45],[.55,.45],[-.55,-.45],[.55,-.45]].forEach(function(q){ var wh=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.2,10),new THREE.MeshLambertMaterial({color:0x1a1f33})); wh.rotation.z=Math.PI/2; wh.position.set(q[0],.3,q[1]); g.add(wh); });
    var lamp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('#ff9f5a'),blending:THREE.AdditiveBlending,depthWrite:false})); lamp.scale.setScalar(1.4); lamp.position.set(0,1.9,.4); g.add(lamp);
    G.add(g); LK.bots.push({g:g,cv:cv,t:Math.random(),dir:k?-1:1,sp:.05+Math.random()*.04,lamp:lamp,ph:Math.random()*6}); } }); })();
/* окраины города (правка 22.10, "добавить движухи"): зарядные площадки, где дроны садятся заряжаться и взлетают, ветряки, антенны с мигающим огнём,
   энергостолбы с кольцом; низко вдоль края кружат дроны-патрульные. Всё это видно и снизу из открытых модулей (cityAround) */
(function(){ var G=LK.g, mm=new THREE.MeshLambertMaterial({color:0x8892b0,emissive:0x2a3358,emissiveIntensity:.4}), dk=new THREE.MeshLambertMaterial({color:0x1b2246,emissive:0x7c5cff,emissiveIntensity:.2});
  function spr(c,s){ var q=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(c),blending:THREE.AdditiveBlending,depthWrite:false})); q.scale.setScalar(s); return q; }
  function add(g,geo,m,x,y,z){ var q=new THREE.Mesh(geo,m); q.position.set(x||0,y||0,z||0); g.add(q); return q; }
  /* маленький дрон для площадки: корпус, рама, 4 винта, огонёк */
  function mini(col){ var g=new THREE.Group(), fm=new THREE.MeshLambertMaterial({color:0x1a1f33,emissive:new THREE.Color(col),emissiveIntensity:.5}), pm=new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}), pr=[];
    add(g,new THREE.BoxGeometry(.8,.25,.8),fm); [Math.PI/4,-Math.PI/4].forEach(function(r){ add(g,new THREE.BoxGeometry(2.2,.08,.16),fm).rotation.y=r; });
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(q){ var p=add(g,new THREE.CircleGeometry(.45,12),pm,q[0]*.78,.2,q[1]*.78); p.rotation.x=-Math.PI/2; pr.push(p); });
    var lt=spr(col,1.2); lt.position.y=-.2; g.add(lt); return {g:g,lt:lt}; }
  LK.tick=LK.tick||[]; var KINDS=['zar','vet','ant','pyl','zar','ant','vet','pyl'], n=mob?6:12;
  for(var i=0;i<n;i++){ var a=1.0+i*4.1/(n-1); if(Math.abs(a-2.6)<.16||Math.abs(a-3.6)<.16) a+=.2;
    var r=i%2?RI-5:RI-10, g=new THREE.Group(), kd=KINDS[i%KINDS.length], col=MC[i%MC.length], ph=i*1.7; g.position.set(Math.sin(a)*r,PY,CZ+Math.cos(a)*r); g.rotation.y=a; G.add(g);
    if(kd==='zar') (function(g,col,ph){ /* зарядка: огоньки по кругу загораются по одному, столбик заряда растёт, потом дрон взлетает, делает круг и садится */
      add(g,new THREE.CylinderGeometry(2.6,2.8,.35,6),dk,0,.18,0); var lm=[]; for(var j=0;j<4;j++){ var q=spr('#9dff7c',1.2); q.position.set(Math.sin(j/4*6.283+.8)*2.3,.55,Math.cos(j/4*6.283+.8)*2.3); g.add(q); lm.push(q); }
      add(g,new THREE.BoxGeometry(.5,2.6,.5),mm,3.3,1.3,0); var fg=new THREE.BoxGeometry(.34,2.3,.34); fg.translate(0,1.15,0); var fl=add(g,fg,new THREE.MeshBasicMaterial({color:0x9dff7c}),3.3,.15,0);
      var d=mini(col); g.add(d.g);
      LK.tick.push(function(t){ var u=((t+ph)%10)/10, ch=Math.min(1,u/.6), up=u>.6?Math.sin((u-.6)/.4*Math.PI):0;
        for(var j=0;j<4;j++) lm[j].material.opacity=u<.6?(j<=ch*4?1:.15):(Math.sin(t*8+j)>0?.6:.1);
        fl.scale.y=Math.max(.05,u<.6?ch:1-up*.3); d.g.position.set(Math.sin(up*3)*up*2.5,.6+up*8,Math.cos(up*3)*up*2.5-up*2.5); d.g.rotation.y=t*(up?1.5:0);
        d.lt.material.opacity=u<.6?(Math.sin(t*4)>0?1:.3):1; }); })(g,col,ph);
    else if(kd==='vet') (function(g,ph){ /* ветряк: мачта, гондола, три лопасти крутятся */
      add(g,new THREE.CylinderGeometry(.14,.32,8,6),mm,0,4,0); add(g,new THREE.BoxGeometry(.6,.6,1.3),mm,0,8.1,0); var ro=new THREE.Group(); ro.position.set(0,8.1,.75); g.add(ro);
      var bm=new THREE.MeshLambertMaterial({color:0xd6dcf0,emissive:0x7cf3ff,emissiveIntensity:.25}); for(var j=0;j<3;j++){ var bl=new THREE.Mesh(new THREE.BoxGeometry(.28,3.4,.06),bm); bl.geometry.translate(0,1.7,0); bl.rotation.z=j*2.094; ro.add(bl); }
      var hl=spr('#ff4d6d',1.2); hl.position.y=8.6; g.add(hl);
      LK.tick.push(function(t){ ro.rotation.z=-(t+ph)*1.6; hl.material.opacity=Math.sin(t*2.5+ph)>.4?1:.12; }); })(g,ph);
    else if(kd==='ant') (function(g,col,ph){ /* антенна-вышка: решётчатая мачта, тарелка крутится, наверху мигает красный */
      add(g,new THREE.CylinderGeometry(.1,.25,10,5),mm,0,5,0); [3,5.5,7.8].forEach(function(y,j){ add(g,new THREE.BoxGeometry(1.8-j*.45,.08,.08),mm,0,y,0).rotation.y=j*.9; });
      var dh=new THREE.Group(); dh.position.y=6.6; g.add(dh); var ds=new THREE.Mesh(new THREE.CylinderGeometry(.9,.12,.35,12,1,true),new THREE.MeshLambertMaterial({color:0xd6dcf0,emissive:new THREE.Color(col),emissiveIntensity:.35,side:THREE.DoubleSide})); ds.position.x=.5; ds.rotation.z=-1; dh.add(ds);
      var tp=spr('#ff4d6d',1.6); tp.position.y=10.2; g.add(tp);
      LK.tick.push(function(t){ dh.rotation.y=(t+ph)*.9; tp.material.opacity=Math.sin(t*3+ph)>.3?1:.1; }); })(g,col,ph);
    else (function(g,col,ph){ /* энергостолб: светящийся шар в крутящемся кольце, цвет переливается, как у кристалла */
      add(g,new THREE.CylinderGeometry(.35,.6,4,6),dk,0,2,0); var orb=spr(col,3.2); orb.position.y=5.3; g.add(orb);
      var rg=new THREE.Mesh(new THREE.TorusGeometry(1.3,.08,6,28),new THREE.MeshBasicMaterial({color:new THREE.Color(col)})); rg.position.y=5.3; g.add(rg);
      LK.tick.push(function(t){ rg.rotation.x=(t+ph)*1.3; rg.rotation.y=(t+ph)*.8; orb.material.color.setHSL(((t+ph)*.06)%1,.8,.7); orb.scale.setScalar(3+Math.sin(t*2+ph)*.5); }); })(g,col,ph);
  }
  /* дроны-патрульные низко вдоль края платформы */
  for(var d=0;d<(mob?2:3);d++){ var q=mini(MC[(d+2)%MC.length]); q.props=[]; q.g.scale.setScalar(1.3); G.add(q.g); q.patrol=1; q.r=RI+2+d*1.5; q.a=d*2.1; q.sp=(.22+d*.05)*(d%2?-1:1); q.y=PY+3.5+d*1.5; q.ph=d*2; LK.drones.push(q); }
})();
LV.forEach(function(L){ mkThreads(L); mkOver(L); if(L.over){ L.oP=L.over.p; L.oL=L.over.l; } mkTop(L); if(L.loc) L.nodes.forEach(function(n){ if(n.curve){ road(L,n.curve,n.c); roadLamps(L,n.curve,n.c); } }); });
/* огоньки по краям дороги в модуле: бегут волной вперёд, к следующим заданиям */
function roadLamps(L,cv,c){ var nl=Math.max(3,Math.round(cv.getLength()/5)), a=V(0,0,0), tg=V(0,0,0); L.chase=L.chase||[];
  for(var i=0;i<nl;i++){ var u=i/nl; cv.getPoint(u,a); cv.getTangent(u,tg); tg.y=0; tg.normalize(); [-1,1].forEach(function(sd){ var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(c),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); sp.scale.setScalar(.9); sp.position.set(a.x-tg.z*2.3*sd,PY+.35,a.z+tg.x*2.3*sd); L.g.add(sp); if(sd>0) L.chase.push(sp); else L.chase.push(sp); }); } }
/* вид сверху (как у портала): камера высоко над серединой уровня, смотрит вниз */
function mkTop(L){ if(L===LK){ L.tP=V(0,PY+128,CZ+2); L.tL=V(0,PY,CZ); return; } var x=0,y=0,z=0,r=0; L.nodes.forEach(function(n){ x+=n.p[0]; y+=n.p[1]; z+=n.p[2]; }); var k=L.nodes.length; x/=k; y/=k; z/=k;
  L.nodes.forEach(function(n){ r=Math.max(r,Math.hypot(n.p[0]-x,n.p[2]-z)); }); L.tP=V(x,y+r*(L.loc?1.05:1.6)+(L.loc?40:30),z+2); L.tL=V(x,y,z); }
var topOn=false, topB=document.getElementById('topB');
function topUI(){ topB.textContent=topOn?'↩ Сбоку':'☀ Сверху'; topB.classList.toggle('act',topOn); }
topB.onclick=function(){ if(fly||!curL||(st!=='over'&&st!=='node')) return; if(tour) tourEnd(); topOn=!topOn; topUI(); hideCap(); cur=null; back=[]; st='fly';
  startFly(spunP(topOn?curL.tP:curL.oP,topOn?curL.tL:curL.oL),spun(topOn?curL.tL:curL.oL),null,red?.5:1.8,function(){ st='over'; }); };

/* ---- состояние узлов из прогресса ученика ---- */
var ME0=null; try{ ME0=JSON.parse(lsG(CFG.meKey)||'null'); }catch(e){}
function stOf(n){ if(n.act==='soon') return 'lock'; if(n.act==='code') return ME0&&ME0.code?'done':'open'; if(n.kind==='mod') return I.mod(n.mid); if(n.kind==='task') return I.task(n.tid); if(n.kind==='center') return I.mod(n.mid); return 'open'; }
var target=null;
function targetOf(L){ if(!L) return null; var nx=I.next(); if(L===LK) return nx?L.by[nx.m]:null; return nx&&nx.m===L.mid?L.by[nx.t]:null; }
function refresh(){ LV.forEach(function(L){ L.nodes.forEach(function(n){ var s=n.st=stOf(n), lock=s==='lock';
  n.pl.visible=!lock&&!n.zone; n.wf.visible=lock&&!n.zone; n.halo.material.color.set(s==='wait'?'#facc15':lock?'#64748b':'#ffffff'); n.halo.material.opacity=lock?.25:s==='done'?1:.8;
  if(n.nm) n.nm.material.opacity=lock?.45:1;
  if(n.mats) n.mats.forEach(function(m,i){ if(m.emissiveIntensity!=null){ if(m.e0==null) m.e0=m.emissiveIntensity; m.emissiveIntensity=lock?m.e0*.18:m.e0; } else m.opacity=lock?.15:.85; }); dimModel(n); n.el.className='lb s-'+s+(n.kind==='mod'||n.kind==='center'?' big':''); }); });
  LV.forEach(function(L){ L.nodes.forEach(function(n){ n.full=null; }); }); target=targetOf(curL); guideUI(); }

/* ---- состояние и полёт (как в "Иртыше") ---- */
var st='gate', gp=0, mix=0, mixT=0, roll=0, rollT=0, cur=null, curL=null, back=[], acc=0;
var spin=0; /* поворот города пальцем/мышью вбок */
function PZ(){ return curL&&curL.pz!=null?curL.pz:CZ; }
function rotC(v,a){ var z0=PZ(), x=v.x, z=v.z-z0, c=Math.cos(a), s=Math.sin(a); v.x=x*c+z*s; v.z=z0-x*s+z*c; return v; }
function spun(v){ v=v.clone(); return curL&&spin?rotC(v,spin):v; }
/* камера обзора города с учётом поворота (spin), наклона (tilt) и приближения (zoom) */
var tilt=0, zoom=1;
function setElev(o,e){ var len=o.length(), h=Math.hypot(o.x,o.z)||1; o.set(o.x/h*Math.cos(e)*len,Math.sin(e)*len,o.z/h*Math.cos(e)*len); return o; }
function elevOf(o){ return Math.asin(Math.max(-1,Math.min(1,o.y/(o.length()||1)))); }
function spunP(P,Lk){ var l=spun(Lk); if(!curL) return P.clone(); var o=P.clone().sub(Lk).applyAxisAngle(V(0,1,0),spin);
  setElev(o,Math.max(.1,Math.min(1.4,elevOf(o)+tilt))).multiplyScalar(zoom); return l.add(o); }
var camP=V(0,0,46), camL=V(0,0,-30), fly=null, speed=0, diveBack=null, guideT=0;
function viewOf(n){ var p=n.g.position; if(n.zone){ var f=n.from==='me'?n.L.me:n.L.by[n.from].g.position, dz=V(f.x-p.x,0,f.z-p.z); if(dz.lengthSq()<1) dz.set(0,0,1); dz.normalize();
    var l=V(p.x,PY+3.5,p.z); if(n.scr){ var sp=n.scr.getWorldPosition(V()); l.lerp(sp.setY(PY+4.5),.4); } /* в кадре и зона, и её экран */
    return {p:V(p.x+dz.x*(n.scr?19:17),PY+9.5,p.z+dz.z*(n.scr?19:17)),l:l}; }
  if(n.city){ var d=V(p.x,0,p.z-CZ).normalize(); if(!isFinite(d.x)) d.set(0,0,1); var H=TOPH[n.st0]||n.h, D=Math.max(15,H*1.25+8); return {p:V(p.x+d.x*D,PY+Math.max(8,H*.8),p.z+d.z*D),l:V(p.x,PY+H*.5,p.z)}; }
  return {p:V(p.x,p.y+n.s*1.1,p.z+n.s*(n.kind==='center'||n.kind==='mod'?7:6.5)),l:p.clone()}; }
function startFly(toP,toL,curve,dur,done,rev){ fly={a:camP.clone(),al:camL.clone(),b:toP,bl:toL,cv:curve,rev:!!rev,t:0,d:red?.6:dur,done:done}; guideUI(); }
function ease(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
var UP=V(0,1,0), tq=V(0,0,0), tt=V(0,0,0), tl=V(0,0,0);
function stepFly(dt){ var o=camP.clone(); fly.t=Math.min(1,fly.t+dt/fly.d); var e=ease(fly.t);
  if(fly.cv){ /* камера идёт за точкой нити, чуть сзади и выше, и смотрит вперёд по нити */
    var u=fly.rev?1-e:e; fly.cv.getPoint(u,tq); fly.cv.getTangent(u,tt); if(fly.rev) tt.negate();
    tq.addScaledVector(tt,-7).addScaledVector(UP,2.2); var ws=Math.max(0,1-e/.22), we=Math.max(0,(e-.75)/.25); camP.copy(tq).lerp(fly.a,ws*ws).lerp(fly.b,we);
    fly.cv.getPoint(Math.max(0,Math.min(1,u+(fly.rev?-.15:.15))),tl); camL.copy(fly.al).lerp(tl,Math.min(1,e/.3)).lerp(fly.bl,we); }
  else { var mid=fly.a.clone().lerp(fly.b,.5); mid.y+=4; var a1=fly.a.clone().lerp(mid,e), b1=mid.lerp(fly.b,e); camP.copy(a1.lerp(b1,e)); camL.copy(fly.al).lerp(fly.bl,Math.min(1,e*1.3)); }
  speed=o.distanceTo(camP)/Math.max(dt,.001);
  if(fly.t>=1){ var d=fly.done; fly=null; speed=0; d&&d(); guideUI(); } }

var $=function(id){ return document.getElementById(id); };
var backB=$('back'), flash=$('flash'), cap=$('cap'), wel=$('wel'), hud=$('hud'), guide=$('guide'), ptr=$('ptr'), arrow=$('arrow');
var win=$('win'), wbg=$('wbg'), pane=$('wpane'), winOn=false, winMode='', winTask=null, wasDone=false;
function setLevel(L){ LV.forEach(function(q){ q.g.visible=q===L; }); LV.forEach(function(q){ q.nodes.forEach(function(n){ if(q!==L) hideEl(n.el); }); });
  if(curL) curL.sv=[spin,tilt,zoom]; var sv=L.sv||[0,0,1]; spin=sv[0]; tilt=sv[1]; zoom=sv[2];
  if(L.open) cityAround(L); curL=L; cur=null; back=[]; acc=0; osdOff(); lvlStars(); topOn=false; topUI(); S.fog=L.fog||null; mixT=L.mix; rollT=L.mix?.06:0;
  if(L.mix){ bgT.set(L.c).multiplyScalar(.08).add(BG_B); galT.set(L.c).lerp(new THREE.Color('#ffffff'),.35); } else { bgT.copy(BG_A); galT.set('#ffffff'); }
  $('hudL').textContent=L.name; hud.classList.add('on'); backB.classList.add('on'); refresh(); }
function capTxt(n){ var s=n.st;
  if(tour) return n.tip&&n.tip!==n.sub?n.tip:'';
  if(n.act==='soon') return 'Скоро откроется';
  if(n.act==='code'&&s==='done') return 'Ты вошёл: '+esc(ME0.first||'')+'. Педагог видит твой прогресс';
  if(n.kind==='tab') return 'Нажми ещё раз - <b>открыть</b>';
  if(n.kind==='center'){ var m=mods.find(function(x){ return x.id===n.mid; }), d=m.tasks.filter(function(t){ return I.task(t)==='done'; }).length; return 'Пройдено заданий: '+d+' из '+m.tasks.length+(target?'. Нажми ещё раз - <b>к следующему</b>':''); }
  if(s==='lock') return n.kind==='mod'?'Этот модуль откроет педагог':'Откроется после предыдущего задания';
  if(s==='wait') return 'Педагог проверяет. Нажми ещё раз - <b>войти</b>';
  if(s==='done') return 'Пройдено. Нажми ещё раз - <b>повторить</b>';
  return n.kind==='mod'?'Нажми ещё раз - <b>войти в модуль</b>':'Нажми ещё раз - <b>начать</b>'; }
function showCap(n){ $('capT').textContent=n.n; $('capS').textContent=n.sub||''; $('capP').innerHTML=capTxt(n); cap.style.setProperty('--pc',n.c); cap.classList.toggle('lock',n.st==='lock'); cap.classList.add('on'); }
function hideCap(){ cap.classList.remove('on'); }
$('capT').onclick=function(){ if(cur) tapNode(cur.id); };
function shake(){ if(cap.animate) cap.animate([{transform:'translate(-50%,0)'},{transform:'translate(calc(-50% - 8px),0)'},{transform:'translate(calc(-50% + 8px),0)'},{transform:'translate(-50%,0)'}],{duration:350}); }
function arrive(n){ cur=n; acc=0; st='node'; showCap(n); guideUI(); if(tour){ clearTimeout(tourT); tourT=setTimeout(tourNext,red?900:1900); } }
/* знакомство с курсом: при первом входе камера сама облетает главную нить и все боковые, потом ведёт к заданию */
var TKEY=(CFG.store||'kursy')+'_tour', tour=null, tourT=0;
function tourStart(){ if(curL!==LK||fly) return; tour=[mods[0]&&LK.by[mods[0].id]].concat(['prog','code','bug','shp','trn'].map(function(id){ return LK.by[id]; })).filter(Boolean); tourNext(); }
function tourNext(){ if(!tour||st==='win'||curL!==LK) { tour=null; return; } var n=tour.shift(); if(!n){ tourEnd(); return; } goTo(n); }
function tourEnd(){ tour=null; clearTimeout(tourT); lsS(TKEY,'1'); back=[]; if(cur) showCap(cur); guideUI(); guideSoon(400); }
function tapNode(id){ if(fly||(st!=='over'&&st!=='node')) return; if(tour){ tour=null; clearTimeout(tourT); lsS(TKEY,'1'); } var n=curL.by[id]; if(!n) return; if(cur===n) enter(n); else goTo(n); }
function goTo(n,isBack){ if(topOn){ topOn=false; topUI(); } hideCap(); if(!isBack) back.push(cur?cur.id:null);
  /* летим плавной дугой прямо к точке обзора узла, не повторяя изгибы нити: так камера не дёргается */
  var B=viewOf(n), fwd=cur&&n.from===cur.id;
  if(passGate){ passGate=false; if(fwd&&n.kind==='task'){ var m=camP.clone().lerp(B.p,.5); m.y+=4; var u=.45, gp2=camP.clone().multiplyScalar((1-u)*(1-u)).addScaledVector(m,2*u*(1-u)).addScaledVector(B.p,u*u); gateOn(gp2,B.p.clone().sub(camP).normalize(),n); } }
  st='fly'; startFly(B.p,B.l,null,2.4,function(){ arrive(n); }); }
/* правка 6Б: после сданного задания над дорогой зажигаются ворота, камера пролетает сквозь них; сверху на секунду "Уровень N" */
var passGate=false, GATES=[];
function gateOn(p,tg,n){ var g=new THREE.Mesh(new THREE.TorusGeometry(3.4,.28,8,40),new THREE.MeshBasicMaterial({color:new THREE.Color(n.c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  g.position.copy(p); g.lookAt(p.clone().add(tg)); g.scale.setScalar(.01); n.L.g.add(g); GATES.push({m:g,L:n.L,t:0});
  var lv=$('lvl'); if(lv){ $('lvlT').textContent='Уровень '+n.num; lv.style.setProperty('--lc',n.c); lv.classList.remove('on'); void lv.offsetWidth; lv.classList.add('on'); } }
/* правка 6В: звезда вылетает из пройденной зоны и летит в счётчик модуля вверху */
var starsEl=$('stars');
function lvlStars(){ if(!starsEl) return; var L=curL, m=L&&L.loc&&mods.find(function(x){ return x.id===L.mid; });
  starsEl.classList.toggle('on',!!m&&!winOn); if(!m) return; var d=m.tasks.filter(function(t){ return I.task(t)==='done'; }).length; $('starsN').textContent=d+' / '+m.tasks.length; }
function starFly(n){ if(!starsEl) return; lvlStars(); var p=n.g.position.clone().project(C), x0=(p.x+1)/2*innerWidth, y0=(1-p.y)/2*innerHeight, r2=starsEl.getBoundingClientRect();
  var s=document.createElement('div'); s.className='starfly'; s.textContent='★'; document.body.appendChild(s);
  var go=s.animate?s.animate([{transform:'translate('+x0+'px,'+y0+'px) scale(.4)',opacity:0},{transform:'translate('+x0+'px,'+(y0-50)+'px) scale(1.6)',opacity:1,offset:.3},{transform:'translate('+(r2.left+16)+'px,'+(r2.top+4)+'px) scale(.8)',opacity:1}],{duration:red?300:1300,easing:'cubic-bezier(.5,0,.3,1)'}):null;
  function done(){ s.remove(); if(starsEl.animate) starsEl.animate([{transform:'translateX(-50%) scale(1)'},{transform:'translateX(-50%) scale(1.25)'},{transform:'translateX(-50%) scale(1)'}],{duration:400}); }
  if(go) go.onfinish=done; else done(); }
/* система ведёт: при входе в уровень и после пройденного задания сама подлетает к следующему */
/* автополёт (правка 21.10): выключен - камера стоит, ученик сам жмёт "Лететь" или на узел; включён - система сама летит к следующему */
var AKEY=(CFG.store||'kursy')+'_auto', AUTO=lsG(AKEY)==='1';
function autoUI(){ var b=$('autoB'); if(!b) return; b.textContent='Автополёт: '+(AUTO?'вкл':'выкл'); b.classList.toggle('act',AUTO); }
function guideSoon(ms){ clearTimeout(guideT); if(!AUTO) return; guideT=setTimeout(function(){ if(tour||topOn||fly||(st!=='over'&&st!=='node')) return; var t=targetOf(curL); if(t&&t!==cur) goTo(t); },ms); }
function flyOver(L,lead){ st='fly'; startFly(spunP(L.oP,L.oL),spun(L.oL),null,red?.5:2.4,function(){ st='over'; guideUI(); if(lead) guideSoon(700); }); }
/* шаг назад: по нити к предыдущему узлу; из обзора - на уровень выше; с курса - к порталу */
function goBack(){ if(fly) return; if(tour){ tourEnd(); return; } if(st==='win'){ closeWin(); return; } if(st!=='over'&&st!=='node') return;
  if(st==='over'){ if(topOn){ topB.onclick(); return; } goUp(); return; }
  hideCap(); var prev=back.pop();
  if(prev&&curL.by[prev]){ goTo(curL.by[prev],true); return; }
  st='fly'; startFly(spunP(curL.oP,curL.oL),spun(curL.oL),null,2.2,function(){ st='over'; cur=null; acc=0; }); }
backB.onclick=goBack;
function goUp(){ if(curL===LK){ exitToGate(); return; } var from=curL; hideCap(); st='fly';
  startFly(camP.clone().add(V(0,10,60)),from.oL.clone(),null,red?.4:1,function(){ flashOn(from.c+'dd',function(){ setLevel(LK); var n=LK.by[from.mid], B=viewOf(n);
    camP.copy(B.p).add(V(0,3,40)); camL.copy(B.l); flashOff(); st='fly'; startFly(B.p,B.l,null,red?.5:1.6,function(){ arrive(n); }); }); }); }
function flashOn(col,cb){ flash.style.setProperty('--fl',col||'rgba(255,255,255,.85)'); flash.style.transition='opacity .25s'; flash.style.opacity=1; setTimeout(cb,260); }
function flashOff(){ flash.style.transition='opacity 1.1s'; flash.style.opacity=0; }
/* второе нажатие: провал внутрь узла - ныряем, вспышка цветом узла, под ней новая среда */
function enter(n){
  if(n.st==='lock'||(n.act==='code'&&n.st==='done')){ shake(); return; }
  if(n.act==='bug'){ I.go.bug(); return; }
  if(n.act==='code'){ codeLogin(); return; }
  if(n.kind==='center'){ var t=targetOf(curL); if(t) goTo(t); else goUp(); return; }
  hideCap(); st='fly'; var p=n.g.position.clone(), d=p.clone().sub(camP).normalize(); diveBack={p:camP.clone(),l:camL.clone()};
  if(n.kind==='mod'){ modTrans(n); return; }
  if(n.kind==='task'&&n.scr){ var sv=scrView(n); startFly(sv.p,sv.l,null,red?.4:1.5,function(){ openWin('task',n,scrRect(n)); }); return; }
  startFly(p.clone().addScaledVector(d,-n.s*.2),p.clone().addScaledVector(d,60),null,red?.4:1.2,function(){
    flashOn(n.c+'dd',function(){ camP.copy(diveBack.p); camL.copy(diveBack.l); openWin(n.kind==='tab'?'prog':'task',n); flashOff(); }); }); }
/* правка 7: переход в модуль, у модулей разные (MOD_TRANS): portal, fpv, hyper. В конце - заставка модуля и новая локация */
function modIn(n,col){ flashOn(col||n.c+'dd',function(){ var L=LBY[n.mid], wp=$('warp'); osdOff(); hyperOff();
  wp.style.setProperty('--wc',n.c); $('warpT').textContent=n.n+'. '+n.sub; wp.classList.add('on'); flashOff();
  setTimeout(function(){ setLevel(L); if(L.closed) camP.set(0,PY+26,64); else camP.set(0,30,150); camL.copy(L.oL); wp.classList.remove('on'); flyOver(L,true); },red?300:1100); }); }
function modTrans(n){ var kind=red?'':MOD_TRANS[mods.findIndex(function(m){ return m.id===n.mid; })+1], p=n.g.position.clone(), bp=V(n.p[0],PY,n.p[2]);
  if(kind==='fpv'){ /* вид из FPV-очков: снижаемся к двери здания и ныряем внутрь */
    var out=V(camP.x-bp.x,0,camP.z-bp.z).normalize(), H=Math.max(2.4,(TOPH[n.st0]||8)*.22), door=bp.clone().addScaledVector(out,n.s*3.4).setY(PY+H);
    osdOn(n); startFly(door.clone().addScaledVector(out,10),bp.clone().setY(PY+H),null,1.4,function(){ startFly(bp.clone().setY(PY+H),bp.clone().addScaledVector(out,-20).setY(PY+H),null,.55,function(){ modIn(n,'rgba(0,0,0,.95)'); }); }); return; }
  if(kind==='portal'){ /* над антенной раскрывается кольцо-портал, влетаем в него */
    var pc=p.clone().add(V(0,6,0)), dir=V(camP.x-pc.x,0,camP.z-pc.z).normalize(), ring=new THREE.Mesh(new THREE.TorusGeometry(4.2,.45,10,48),new THREE.MeshBasicMaterial({color:new THREE.Color(n.c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    var disk=new THREE.Mesh(new THREE.CircleGeometry(4,40),new THREE.MeshBasicMaterial({color:new THREE.Color(n.c),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    ring.add(disk); ring.position.copy(pc); ring.lookAt(pc.clone().add(dir)); ring.scale.setScalar(.01); LK.g.add(ring); GATES.push({m:ring,L:LK,t:0});
    startFly(pc.clone().addScaledVector(dir,16),pc.clone(),null,1,function(){ startFly(pc.clone().addScaledVector(dir,-6),pc.clone().addScaledVector(dir,-60),null,.7,function(){ modIn(n); }); }); return; }
  if(kind==='hyper'){ /* гиперпрыжок: резкий разгон, звёзды вытягиваются в линии */
    var fw2=p.clone().sub(camP).normalize(); hyperOn(n,fw2); startFly(camP.clone().addScaledVector(fw2,-6),p.clone(),null,.5,function(){ startFly(camP.clone().addScaledVector(fw2,170),camP.clone().addScaledVector(fw2,500),null,1.1,function(){ modIn(n,'rgba(255,255,255,.95)'); }); }); return; }
  var d=p.clone().sub(camP).normalize(); startFly(p.clone().addScaledVector(d,-n.s*.2),p.clone().addScaledVector(d,60),null,red?.4:1.2,function(){ modIn(n); }); }
/* гиперпрыжок: звёздные линии вдоль пути, камера проносится сквозь них */
var HYP=null;
function hyperOn(n,dir){ var N3=mob?220:420, P=new Float32Array(N3*6), Cc=new Float32Array(N3*6), side=V(-dir.z,0,dir.x).normalize(), up=V().crossVectors(side,dir).normalize(), cc=new THREE.Color(n.c), wc=new THREE.Color('#ffffff');
  for(var i=0;i<N3;i++){ var a=Math.random()*6.283, r=6+Math.random()*40, d=20+Math.random()*560, l=25+Math.random()*60, o=camP.clone().addScaledVector(side,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).addScaledVector(dir,d), e=o.clone().addScaledVector(dir,l), col=Math.random()<.5?cc:wc;
    P.set([o.x,o.y,o.z,e.x,e.y,e.z],i*6); Cc.set([col.r,col.g,col.b,0,0,0],i*6); }
  var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(Cc,3));
  HYP=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); S.add(HYP); }
function hyperOff(){ if(!HYP) return; S.remove(HYP); HYP.geometry.dispose(); HYP=null; }
/* экран пилота FPV: рамка и цифры, пока ныряем в здание */
var osdEl=$('osd'), osdT=0;
function osdOn(n){ if(!osdEl) return; osdEl.style.setProperty('--oc',n.c); osdEl.classList.add('on'); document.body.classList.add('osd'); clearInterval(osdT); var bat=96;
  osdT=setInterval(function(){ $('osdA').textContent='ALT '+Math.max(0,Math.round(camP.y-PY))+' м'; $('osdS').textContent='SPD '+Math.round(Math.min(99,speed*.9))+' км/ч'; $('osdB').textContent='BAT '+(bat-=.2).toFixed(0)+'%'; },80); }
function osdOff(){ if(!osdEl) return; osdEl.classList.remove('on'); document.body.classList.remove('osd'); clearInterval(osdT); }

/* ---- окно задания: плоское, читаемое, поверх своего фона ---- */
function bgKind(tid){ var L=K.lib[tid]; if(!L) return 'aur'; var ss=L.steps.map(function(s){ return s.s; });
  if(L.fly||ss.indexOf('fly')>=0) return 'sky'; if(/final|_as$/.test(tid)) return 'neb'; if(/coach|_day$/.test(tid)) return 'shop';
  if(ss.indexOf('game')>=0) return 'grid'; if(/rep$/.test(tid)) return 'neb'; return 'aur'; }
/* live - окно выросло из экрана у зоны: вместо картинки за стеклом живая крыша и космос (если для задания нет своего фона KURS_FONY) */
var LIVE=false; document.body.classList.toggle('mobi',mob);
function setBg(n,live){ var kd=n.kind==='task'?bgKind(n.tid):'aur'; LIVE=!!live&&!(n.tid&&FONY[n.tid]); document.body.classList.toggle('livebg',LIVE); wbg.className='wbg '+(LIVE?'live':'bg-'+kd); win.style.setProperty('--mr',rgb(n.c)); wbg.style.backgroundImage=n.tid&&FONY[n.tid]?'url("'+FONY[n.tid]+'")':'';
  $('winT').textContent=n.kind==='task'?'Модуль '+(mods.find(function(m){ return m.id===n.mid; })||{}).n+' · '+n.n:n.n; }
function openWin(mode,n,from){ winOn=true; winMode=mode; st='win'; cur=n; winTask=n.tid||null; wasDone=n.st==='done'; setBg(n,!!from); hud.classList.remove('on'); backB.classList.remove('on'); guideUI(); win.classList.add('on'); pane.scrollTop=0;
  lvlStars(); if(mode==='task') I.go.task(n.tid); else I.go.home(); brief(mode==='task'?n:null);
  /* окно вырастает из экрана у зоны: стартует ровно на месте экрана и раскрывается */
  var bx=win.querySelector('.wbox'); if(from&&bx.animate&&!red){ var r=bx.getBoundingClientRect(), vh=Math.min(r.height,innerHeight-r.top), sx=from.w/r.width, sy=from.h/Math.max(1,vh);
    bx.animate([{transform:'translate('+(from.l-r.left)+'px,'+(from.t-r.top)+'px) scale('+sx+','+sy+')',transformOrigin:'0 0',opacity:.6},{transform:'none',transformOrigin:'0 0',opacity:1}],{duration:650,easing:'cubic-bezier(.3,0,.2,1)'}); } }
/* передача задания: сверху окна печатается номер, название и план задания, голос читает (engine/golos.js). Пройденное - без голоса */
var bEl=$('brief'), bT=$('bT'), bX=$('bX'), tk=$('t-kurs'), bTm=0, GL=window.GOLOS;
function sndUI(){ $('sndB').textContent=GL&&GL.on?'Звук: вкл':'Звук: выкл'; $('sndB').hidden=!GL||!GL.can(); }
$('sndB').onclick=function(){ if(!GL) return; GL.setOn(!GL.on); sndUI(); if(!GL.on) briefEnd(); };
function briefEnd(){ clearInterval(bTm); if(GL) GL.stop(); if(bEl._full){ bT.textContent=bEl._t; bX.textContent=bEl._x; } bEl.classList.remove('typing','talk'); $('bSkip').hidden=true; tk.classList.remove('hold'); }
$('bSkip').onclick=briefEnd;
function brief(n){ clearInterval(bTm); if(GL) GL.stop(); var T0=n&&K.lib[n.tid]; if(!T0){ bEl.hidden=true; tk.classList.remove('hold'); return; }
  var t='Задание '+n.num+'. '+T0.t, x=(T0.sub?T0.sub.replace(/[.!?]*$/,'. '):'')+'В задании: '+T0.steps.map(function(q){ return ({cards:'материал',game:'тренажёр',quiz:'проверка',fly:'полёт',coach:'занятие с тренером'})[q.s]||q.name||q.s; }).join(', ')+'.';
  bEl._t=t; bEl._x=x; bEl._full=1; bEl.hidden=false; sndUI();
  if(n.st==='done'||red){ briefEnd(); return; }
  bT.textContent=''; bX.textContent=''; bEl.classList.add('typing'); $('bSkip').hidden=false; tk.classList.add('hold');
  var full=t+'. '+x, pos=0, said=0, spoke=GL&&GL.say(full,{onb:function(i){ said=i; },onend:function(){ if(pos<full.length) pos=full.length; }});
  if(spoke) bEl.classList.add('talk');
  bTm=setInterval(function(){ pos=Math.max(pos+1,said); var a=Math.min(pos,t.length); bT.textContent=t.slice(0,a); bX.textContent=pos>t.length+2?x.slice(0,pos-t.length-2):'';
    if(pos>=full.length){ clearInterval(bTm); bEl.classList.remove('typing'); $('bSkip').hidden=!spoke; tk.classList.remove('hold'); if(!spoke) bEl.classList.remove('talk'); } },spoke?55:28);
  if(spoke){ var w0=setInterval(function(){ if(!speechSynthesis.speaking&&pos>=full.length){ clearInterval(w0); bEl.classList.remove('talk'); $('bSkip').hidden=true; } },400); } }
function closeWin(after){ if(!winOn) return; var c=cur?cur.c+'cc':null; clearInterval(bTm); if(GL) GL.stop(); flashOn(c,function(){ win.classList.remove('on'); winOn=false; LIVE=false; document.body.classList.remove('livebg'); hud.classList.add('on'); backB.classList.add('on'); refresh(); lvlStars();
  if(after) after(); else if(cur){ var n=cur, B=viewOf(n); camP.copy(B.p); camL.copy(B.l); arrive(n);
    /* задание только что пройдено - сразу ведём к следующему */
    if(n.kind==='task'&&!wasDone&&n.st==='done'){ burst(n); starFly(n); if(target&&target!==n){ passGate=true; guideSoon(1400); } } }
  else { st='over'; }
  flashOff(); }); }
$('winX').onclick=function(){ closeWin(); };
/* экраны курса внутри окна: следующее задание - узел на карте тоже меняется; "К модулю" и "Все модули" - назад в космос */
document.addEventListener('kurs-view',function(e){ var d=e.detail||{}; if(!winOn) return; pane.scrollTop=0;
  if(d.t){ winMode='task'; var mm=mods.find(function(m){ return m.tasks.indexOf(d.t)>=0; }), L=mm&&LBY[mm.id]; if(!L) return;
    if(L!==curL) setLevel(L); var n=L.by[d.t]; if(n&&n!==cur){ cur=n; winTask=n.tid; wasDone=n.st==='done'; var B=n.scr?scrView(n):viewOf(n); camP.copy(B.p); camL.copy(B.l); setBg(n,LIVE); brief(n); } hud.classList.remove('on'); backB.classList.remove('on'); return; }
  if(d.m){ closeWin(function(){ var L=LBY[d.m]; if(L!==curL) setLevel(L); var c=L.by['c_'+d.m], B=viewOf(c); camP.copy(B.p).add(V(0,4,30)); camL.copy(B.l); flyOver(L,true); }); return; }
  if(winMode!=='prog') closeWin(function(){ setLevel(LK); flyOver(LK,true); }); });
document.addEventListener('kurs-save',function(){ if(!winOn) refresh(); });

/* ---- строка "Дальше" и указатель к следующему узлу ---- */
var gTxt=$('gTxt'), gBtn=$('gBtn');
function guideUI(){ var show=!fly&&!winOn&&curL&&(st==='over'||st==='node'); if($('autoB')&&(!curL||winOn)) $('autoB').hidden=true; topB.classList.toggle('on',!!curL&&!winOn&&st!=='falling'); guide.classList.toggle('on',!!show); if(!show) return;
  $('tourB').hidden=curL!==LK; if($('autoB')) $('autoB').hidden=false;
  if(tour){ gTxt.innerHTML='Знакомство с курсом: <b>что где</b>'; gBtn.textContent='Пропустить'; gBtn.onclick=tourEnd; gBtn.hidden=false; return; }
  var t=target=targetOf(curL);
  if(t&&t!==cur){ gTxt.innerHTML='Дальше: <b>'+esc(t.kind==='mod'?t.n+'. '+t.sub:t.n)+'</b>'; gBtn.textContent='Лететь ›'; gBtn.onclick=function(){ if(!fly) goTo(t); }; gBtn.hidden=false; return; }
  if(t&&t===cur){ gTxt.innerHTML='Ты на месте: <b>'+esc(t.n)+'</b>'; gBtn.textContent=t.kind==='mod'?'Войти ›':'Начать ›'; gBtn.onclick=function(){ if(!fly) enter(t); }; gBtn.hidden=false; return; }
  var nx=I.next();
  if(curL!==LK){ var md=I.mod(curL.mid)==='done', nn=nx?esc((mods.find(function(m){ return m.id===nx.m; })||{}).n):''; gTxt.innerHTML=md?(nx?'Модуль пройден! Дальше: <b>модуль '+nn+'</b>':'<b>Модуль пройден!</b>'):(nx?'Сейчас по курсу: <b>модуль '+nn+'</b>':'Задания откроются по порядку'); gBtn.textContent='К карте курса'; gBtn.onclick=function(){ if(!fly) goUp(); }; gBtn.hidden=false; return; }
  gTxt.innerHTML=mods.every(function(m){ return I.mod(m.id)==='done'; })?'<b>Курс пройден!</b> Ты молодец':'Следующий модуль откроет педагог'; gBtn.hidden=true; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---- вход и выход через портал ---- */
$('goB').onclick=function(){ fall(); };
function fall(){ if(st!=='gate') return; st='falling'; wel.classList.remove('on'); ttl.style.opacity=0;
  startFly(V(0,0,-34),V(0,0,-90),null,red?.5:1.6,function(){
    flashOn(null,function(){ gate.visible=false; setLevel(LK); camP.set(0,46,260); camL.copy(LK.oL); flashOff(); flyOver(LK,true); }); }); }
function exitToGate(){ hideCap(); backB.classList.remove('on'); hud.classList.remove('on'); st='falling';
  flashOn(null,function(){ LV.forEach(function(q){ q.g.visible=false; }); curL=null; cur=null; back=[]; gate.visible=true; mixT=0; rollT=0; bgT.copy(BG_A); galT.set('#ffffff'); camP.set(0,0,-20); camL.set(0,0,-60); gp=0; flashOff(); guideUI();
    startFly(V(0,0,46),V(0,0,-30),null,red?.5:2,function(){ st='gate'; wel.classList.add('on'); ttl.style.opacity=1; }); }); }

/* листание: у портала - приближаемся; на карте вниз - дальше по порядку, вверх - нить тянет назад */
function scrollBy(dy){
  if(st==='gate'){ gp=Math.max(0,Math.min(1,gp+dy*.0011)); wel.classList.toggle('on',gp<.05); ttl.style.opacity=gp<.05?1:0; if(gp>=1) fall(); return; }
  if(st!=='over'&&st!=='node') return;
  acc+=dy; if(acc>260){ acc=0; var o=curL.order, i=cur?o.indexOf(cur.id)+1:0; if(i<o.length) goTo(curL.by[o[i]]); }
  else if(acc<-260){ acc=0; goBack(); } }
addEventListener('wheel',function(e){ if(winOn) return; e.preventDefault(); if(curL&&(st==='over'||st==='node')){ zoomCity(Math.exp(e.deltaY*.0012)); return; } scrollBy(e.deltaY); },{passive:false});
var ty=null, tx=null, moved=0, yaw=0;
cv.addEventListener('pointerdown',function(e){ ty=e.clientY; tx=e.clientX; moved=0; });
addEventListener('pointermove',function(e){ if(ty===null||winOn) return; var dy=ty-e.clientY, dx=e.clientX-tx; ty=e.clientY; tx=e.clientX; moved+=Math.abs(dy)+Math.abs(dx);
  if(curL&&(st==='over'||st==='node')){ if(pts2.length>1) return; turnCity(-dx*.006); tiltCity(-dy*.004); return; }
  scrollBy(dy*2.2); if(curL!==LK&&(st==='over'||st==='node')) yaw=Math.max(-.5,Math.min(.5,yaw+dx*.002)); });
/* поворот города: в обзоре крутится точка обзора, у здания камера облетает центр города */
function turnCity(a){ if(st==='over') spin+=a; else { rotC(camP,a); rotC(camL,a); } }
/* наклон: тянем вверх-вниз - смотрим на город выше или ниже */
function tiltCity(a){ if(st==='over'){ tilt=Math.max(-.9,Math.min(.9,tilt+a)); return; } var o=camP.clone().sub(camL); setElev(o,Math.max(.05,Math.min(1.4,elevOf(o)+a))); camP.copy(camL).add(o); }
/* приближение: колесо мыши или щипок двумя пальцами */
function zoomCity(k){ if(st==='over'){ zoom=Math.max(.4,Math.min(1.9,zoom*k)); return; } var o=camP.clone().sub(camL), d=Math.max(8,Math.min(160,o.length()*k)); camP.copy(camL).add(o.setLength(d)); }
var pts2={}, pinchD=0; pts2.length=0;
cv.addEventListener('pointerdown',function(e){ pts2[e.pointerId]=[e.clientX,e.clientY]; pts2.length=Object.keys(pts2).length-1; pinchD=0; });
addEventListener('pointermove',function(e){ if(!pts2[e.pointerId]) return; pts2[e.pointerId]=[e.clientX,e.clientY]; if(pts2.length<2||!curL||(st!=='over'&&st!=='node')) return;
  var ks=Object.keys(pts2).filter(function(k){ return k!=='length'; }), a=pts2[ks[0]], b=pts2[ks[1]], d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pinchD) zoomCity(pinchD/d); pinchD=d; moved+=20; });
addEventListener('pointerup',function(e){ delete pts2[e.pointerId]; pts2.length=Math.max(0,Object.keys(pts2).length-1); pinchD=0; });
addEventListener('pointercancel',function(e){ delete pts2[e.pointerId]; pts2.length=Math.max(0,Object.keys(pts2).length-1); pinchD=0; });
addEventListener('pointerup',function(e){ var was=moved; ty=null; if(was>=8||e.target!==cv||winOn) return;
  var r=new THREE.Raycaster(), m=new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); r.setFromCamera(m,C);
  if(st==='gate'){ if(r.intersectObject(hit).length) fall(); return; }
  if(!curL) return; var h=r.intersectObjects(curL.hits,false)[0]; if(h) tapNode(h.object.userData.id); });
addEventListener('keydown',function(e){ if(winOn) return; if(e.key==='ArrowDown'||e.key===' '){ e.preventDefault(); scrollBy(300); } if(e.key==='ArrowUp') scrollBy(-300); if(curL&&(e.key==='ArrowLeft'||e.key==='ArrowRight')) turnCity(e.key==='ArrowLeft'?.25:-.25); if(e.key==='Escape'||e.key==='Backspace') goBack(); if(e.key==='Enter'&&st==='gate') fall(); else if(e.key==='Enter'&&cur) tapNode(cur.id); });

/* приветствие: имя ученика, если вошёл по коду (только имя) */
function codeLogin(){ lsS(CFG.meKey+'_guest',null); lsS(VKEY,'plain'); location.href=PLAIN; }
(function(){ var P=ME0; if(P&&P.first) $('welHi').textContent='Привет, '+P.first+'!';
  else { var a=$('codeL'); a.hidden=false; a.onclick=codeLogin; } })();
$('tourB').onclick=function(){ if(tour) return; if(st==='node'||st==='over') tourStart(); };
if($('autoB')){ autoUI(); $('autoB').onclick=function(){ AUTO=!AUTO; lsS(AKEY,AUTO?'1':null); autoUI(); if(AUTO) guideSoon(300); }; }
var ttl=$('ttl'); setTimeout(function(){ ttl.classList.add('on'); },300); setTimeout(function(){ if(st==='gate') wel.classList.add('on'); },1600);

/* ---- кометы: только в покое, на полётах гаснут ---- */
(function(){ var c=$('cm'), x=c.getContext('2d'), list=[], dpr=Math.min(devicePixelRatio||1,mob?1:1.5), fade=1;
  function sz(){ c.width=innerWidth*dpr; c.height=innerHeight*dpr; } sz(); addEventListener('resize',sz);
  function rnd(a,b){ return a+Math.random()*(b-a); }
  function spawn(type){ var ang=(Math.random()<.5?1:-1)*rnd(.25,.9), W=innerWidth, H=innerHeight, m={type:type,vx:Math.sin(ang),vy:Math.cos(ang),age:0};
    if(type==='near'){ m.x=rnd(-.1,1.1)*W; m.y=-30; m.sp=rnd(900,1600); m.len=rnd(150,300); m.w=rnd(1,1.6); m.life=9; }
    else { m.x=rnd(0,1)*W; m.y=rnd(0,.6)*H; m.sp=rnd(500,950); m.len=rnd(40,110); m.w=rnd(.45,.8); m.life=rnd(.35,.8); m.a=rnd(.35,.7); }
    list.push(m); }
  var nNear=4, nFar=1, last=performance.now();
  function line(x0,y0,x1,y1,w,ca,a0,a1){ var g=x.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,'rgba('+ca+','+a0+')'); g.addColorStop(1,'rgba('+ca+','+a1+')'); x.strokeStyle=g; x.lineWidth=w; x.beginPath(); x.moveTo(x0,y0); x.lineTo(x1,y1); x.stroke(); }
  function dot(px,py,r,ca,a){ var g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba('+ca+','+a+')'); g.addColorStop(1,'rgba('+ca+',0)'); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,6.283); x.fill(); }
  function step(now){ var dt=Math.min((now-last)/1000,.05); last=now; var calm=!fly&&(st==='gate'||st==='over'||st==='node');
    fade+=((calm?1:0)-fade)*Math.min(1,dt*(calm?1:6));
    if(calm&&!red){ nNear-=dt; nFar-=dt; if(nNear<=0){ spawn('near'); nNear=rnd(6,13); } if(nFar<=0){ spawn('far'); nFar=rnd(.5,mob?2.2:1.6); } }
    x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,innerWidth,innerHeight); if(fade<.02&&!list.length){ requestAnimationFrame(step); return; }
    var inn=mix>.5, hue=inn?'255,150,225':'200,215,255', head=inn?'255,240,252':'240,245,255'; x.lineCap='round';
    for(var i=list.length-1;i>=0;i--){ var m=list[i]; m.age+=dt; m.x+=m.vx*m.sp*dt; m.y+=m.vy*m.sp*dt;
      if(m.age>m.life*1.25||m.y>innerHeight+340||m.x<-360||m.x>innerWidth+360){ list.splice(i,1); continue; }
      var tx2=m.x-m.vx*m.len, ty2=m.y-m.vy*m.len, f=fade*(m.type==='far'?m.a*Math.min(1,(m.life-m.age)/.2):1);
      if(f<=0) continue;
      if(m.type==='near'){ line(m.x,m.y,tx2,ty2,m.w*5,hue,.22*f,0); dot(m.x,m.y,m.w*6,head,f); }
      line(m.x,m.y,tx2,ty2,m.w,head,.95*f,0); }
    requestAnimationFrame(step); }
  requestAnimationFrame(step); })();

/* ---- кадр ---- */
var GT=V(0,0,0), GT2=V(0,0,0), BURST=[];
function burst(n){ if(red) return; for(var i=0;i<28;i++){ var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(i%3?n.c:'#ffd36e'),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); sp.scale.setScalar(1.2); sp.position.copy(n.g.position); n.L.g.add(sp);
  BURST.push({sp:sp,L:n.L,t:0,v:V((Math.random()-.5)*12,6+Math.random()*10,(Math.random()-.5)*12)}); } }
var fc=0, clock=new THREE.Clock(), tm=0, v=V(0,0,0), fw=V(0,0,0), hc2=new THREE.Color(), pa2=V(0,0,0), pb2=V(0,0,0);
function aimSprite(sp,cvv,t){ cvv.getPoint(Math.max(0,t-.02),pa2).project(C); cvv.getPoint(Math.min(1,t+.02),pb2).project(C); sp.material.rotation=Math.atan2((pb2.y-pa2.y)/innerWidth*innerHeight,pb2.x-pa2.x); }
function hideEl(el){ el.style.opacity=0; el.style.pointerEvents='none'; if(el._ld){ el._ld.style.opacity=0; el._ld._dot.style.opacity=0; } }
/* сноска: тонкая линия от узла к подписи (как у планет в "Иртыше") */
var LEADS=document.getElementById('leads');
function leadOf(n){ if(!n.el._ld&&LEADS){ var pl=document.createElementNS('http://www.w3.org/2000/svg','polyline'); pl.setAttribute('fill','none'); pl.setAttribute('stroke',n.c); pl.setAttribute('stroke-width','1.4'); pl.style.opacity=0; LEADS.appendChild(pl);
    var dt2=document.createElementNS('http://www.w3.org/2000/svg','circle'); dt2.setAttribute('r','3'); dt2.setAttribute('fill',n.c); pl._dot=dt2; LEADS.appendChild(dt2); n.el._ld=pl; } return n.el._ld; }
/* жизнь уровня: огни, вертушки, дроны, роботы, кристалл. Для города вызывается и из модуля - там внизу виден город (cityAround) */
function life(L,dt){
  L.nodes.forEach(function(n){ n.halo.material.rotation=tm*.2; var pulse=n===target?1+.22*Math.sin(tm*4):1; n.halo.scale.setScalar(n.s*n.hk*(5.6+Math.sin(tm*1.4+n.p[0])*.4)*pulse); n.pl.rotation.y+=dt*.25; n.wf.rotation.y+=dt*.15;
    if(n.anim&&n.st!=='lock') for(var ai=0;ai<n.anim.length;ai++) n.anim[ai](tm,dt);
    if(n.anim2&&n.st!=='lock') for(var aj=0;aj<n.anim2.length;aj++) n.anim2[aj](tm,dt); });
  if(L.drones) L.drones.forEach(function(q){ q.a+=dt*q.sp; var y=q.y+Math.sin(tm*.7+q.ph)*2.5; q.g.position.set(Math.sin(q.a)*q.r,y,CZ+Math.cos(q.a)*q.r); q.g.rotation.set(-.22,q.a+(q.sp>0?Math.PI/2:-Math.PI/2),q.sp>0?-.18:.18,'YXZ');
    q.lt.material.opacity=(Math.sin(tm*6+q.ph)>.3)?1:.15; for(var pi=0;pi<q.props.length;pi++) if(pi%2) q.props[pi].rotation.y+=dt*40; });
  if(L.eng) L.eng.forEach(function(e,j){ e.material.opacity=.7+.3*Math.sin(tm*3+j); });
  if(L.rim) L.rim.material.color.setHSL((.5+.08*Math.sin(tm*.4))%1,.9,.7);
  if(L.lamps){ var nl=L.lamps.length, hd2=(tm*14)%nl; for(var lk=0;lk<nl;lk++){ var dd=(hd2-lk+nl)%nl; L.lamps[lk].material.opacity=dd<6?1-dd/7:.18; } }
  if(L.crystal) L.crystal(tm,dt);
  if(L.tick) for(var ti=0;ti<L.tick.length;ti++) L.tick[ti](tm,dt);
  if(L.bots) L.bots.forEach(function(q){ q.t+=dt*q.sp*q.dir; if(q.t>1){ q.t=1; q.dir=-1; } if(q.t<0){ q.t=0; q.dir=1; } q.cv.getPoint(q.t,q.g.position); q.cv.getTangent(q.t,tt); if(q.dir<0) tt.negate();
    q.g.position.addScaledVector(V(-tt.z,0,tt.x).normalize(),.9); q.g.rotation.y=Math.atan2(tt.x,tt.z); q.lamp.material.opacity=Math.sin(tm*7+q.ph)>0?1:.2; });
  if(L.chase){ var cn=L.chase.length, ch=(tm*18)%cn; for(var ci=0;ci<cn;ci++){ var dc2=(ch-ci+cn)%cn; L.chase[ci].material.opacity=dc2<5?1-dc2/6:.15; } }
  if(L.hring){ L.hring.rotation.z=tm*.6; L.hring.scale.setScalar(1+.06*Math.sin(tm*2)); }
  if(L.spin) L.spin.forEach(function(q){ q.o.rotation.y=tm*q.v; });
  if(L.blink) L.blink.forEach(function(q){ q.s.material.opacity=Math.sin(tm*q.f+q.p)>-.2?1:.15; });
}
function frame(){ var dt=Math.min(clock.getDelta(),.05); tm+=dt; fc++;
  if(winOn&&!fly&&(!LIVE||(mob&&fc%2))){ requestAnimationFrame(frame); return; } /* под окном задания космос стоит: бережём батарею; за стеклом экрана - живой, на телефоне через кадр */
  if(fly) stepFly(dt);
  else if(st==='gate'){ camP.lerp(V(0,0,46-gp*62),Math.min(1,dt*4)); camL.set(0,0,-30); speed=Math.abs(46-gp*62-camP.z)*6; }
  else if(st==='over'&&curL){ camP.lerp(spunP(topOn?curL.tP:curL.oP,topOn?curL.tL:curL.oL),Math.min(1,dt*3)); camL.lerp(spun(topOn?curL.tL:curL.oL),Math.min(1,dt*3)); speed*=.9; }
  else speed*=.9;
  mix+=(mixT-mix)*Math.min(1,dt*1.5); roll+=(rollT-roll)*Math.min(1,dt*1.5);
  S.background.lerp(bgT,Math.min(1,dt*1.5)); gal.material.color.lerp(galT,Math.min(1,dt*1.5));
  if(Math.abs(mixT-mix)>.002){ for(var i=0;i<N*3;i++) CC[i]=CA[i]+(CB[i]-CA[i])*mix; sg.attributes.color.needsUpdate=true; dust.material.color.setRGB(.81+.19*mix,.84-.12*mix,1-.04*mix); dust.material.opacity=.55+.3*mix; }
  C.position.copy(camP); C.lookAt(camL.x+yaw*20,camL.y,camL.z); C.rotateZ(roll*Math.sin(tm*.08)+roll*.6); yaw*=.985;
  var sv=Math.min(1,speed/60); streak.material.opacity=sv*.85;
  if(sv>.02){ C.getWorldDirection(fw); for(var k=0;k<M;k++){ var si=k*3%(N*3), X=SP[si],Y=SP[si+1],Z=SP[si+2]; LP[k*6]=X; LP[k*6+1]=Y; LP[k*6+2]=Z;
      var L0=2+sv*14; LP[k*6+3]=X-fw.x*L0; LP[k*6+4]=Y-fw.y*L0; LP[k*6+5]=Z-fw.z*L0; for(var j=0;j<3;j++){ LC[k*6+j]=CC[si+j]; LC[k*6+3+j]=0; } }
    lg.attributes.position.needsUpdate=true; lg.attributes.color.needsUpdate=true; }
  for(var p=0;p<N;p++){ var zi=p*3+2; if(SP[zi]>camP.z+40) SP[zi]-=360; else if(SP[zi]<camP.z-320) SP[zi]+=360; } sg.attributes.position.needsUpdate=true;
  if(gate.visible){ swirl.rotation.z-=dt*(.22+gp*1.6); swirl2.rotation.z+=dt*(.08+gp*.6); if((fc&1)===0){ tint(swirl,tm); tint(swirl2,tm+.5); }
    glowA.material.rotation=tm*.15; glowA.scale.setScalar(24+Math.sin(tm*.9)*2.5+gp*10); glowB.scale.setScalar(12+Math.sin(tm*1.7)*1.2+gp*7); eye.scale.setScalar(5.5+Math.sin(tm*2.6)*.7+gp*4); glowB.material.color.setHSL((tm*.05)%1,.6,.75); }
  /* Млечный путь и галактики висят по направлению взгляда (в городе смотрим во все стороны) */
  C.getWorldDirection(fw); fw.y*=.35; fw.normalize(); var rt=V(-fw.z,0,fw.x);
  function far(sp,d,sx,sy){ sp.position.copy(camP).addScaledVector(fw,d).addScaledVector(rt,sx); sp.position.y+=sy; }
  far(milky,480,40,30); milky.material.opacity=1-mix; far(milkyB,-480,-40,20); milkyB.material.opacity=1-mix; shell.position.copy(camP);
  far(gal,420,-150,70); gal.material.opacity=mix; far(gal2,440,170,-60); gal2.material.opacity=mix*.8; far(milky2,500,-20,-10); milky2.material.opacity=mix; far(milky2B,-500,30,-5); milky2B.material.opacity=mix; far(gal3,-430,130,60); gal3.material.opacity=mix*.9;
  var L=curL;
  if(L){
    /* огоньки бегут по нитям к открытым узлам; к следующему узлу - чаще */
    L.pulses.forEach(function(q){ var ok=q.n.st!=='lock'; if(!ok){ q.sp.visible=false; return; } q.t+=dt/q.dur*(q.n===target?1.6:1); if(q.t>1.4) q.t=q.n===target?-.2:-Math.random()*3; var on=q.t>=0&&q.t<=1; q.sp.visible=on; if(!on) return;
      q.n.curve.getPoint(q.t,q.sp.position); aimSprite(q.sp,q.n.curve,q.t); var kd=Math.min(1,q.sp.position.distanceTo(camP)/30); q.sp.scale.set(q.sx*kd,q.sy*kd,1); /* рядом с камерой капсула не раздувается */ q.sp.material.opacity=Math.min(1,q.t*6,(1-q.t)*6); });
    /* сияние нитей: цвет бежит вдоль нити; нить к закрытому узлу едва видна */
    if((fc&1)===0) L.threads.forEach(function(T){ var col=T.ln.geometry.attributes.color, fd=Math.max(.12,Math.min(1,(420-T.mid.distanceTo(camP))/220))*(T.n.st==='lock'?.22:T.n.st==='done'?1.15:1);
      for(var i=0;i<NP;i++){ var u=i/(NP-1), w=.5+.5*Math.sin(u*9-tm*1.6+T.seed), hue=.33+.42*(.5+.5*Math.sin(u*3.1+tm*.35+T.seed));
        hc2.setHSL(hue%1,.85,.55); hc2.lerp(T.base,.35); var k2=fd*(.35+.65*w); col.array[i*3]=hc2.r*k2; col.array[i*3+1]=hc2.g*k2; col.array[i*3+2]=hc2.b*k2; } col.needsUpdate=true; });
    life(L,dt); if(L.city){ life(LK,dt); syncCity(L); }
    /* дрон-проводник в локации: на полёте летит впереди по нити, у зоны висит рядом */
    if(L.gd){ var q=L.gd, tg=GT; if(fly&&fly.cv){ var u2=fly.rev?1-ease(fly.t):ease(fly.t); fly.cv.getPoint(Math.min(1,Math.max(0,u2+(fly.rev?-.22:.22))),tg); tg.y+=1.2; }
      else if(cur&&cur.scr){ var sv2=scrView(cur); tg.copy(sv2.c).addScaledVector(sv2.nm,4.2); tg.y=sv2.c.y-1.3+Math.sin(tm*1.5)*.35; }
      else if(cur){ tg.set(cur.g.position.x-camP.x,0,cur.g.position.z-camP.z).normalize().multiplyScalar(5).add(cur.g.position); tg.y=PY+5.5+Math.sin(tm*1.5)*.6; } else tg.set(Math.sin(tm*.5)*3,PY+6+Math.sin(tm)*.5,-14);
      var ddx=tg.x-q.g.position.x, ddz=tg.z-q.g.position.z; q.g.position.lerp(tg,Math.min(1,dt*(fly?5:2)));
      if(!fly&&cur&&cur.scr&&ddx*ddx+ddz*ddz<4){ var sc2=cur.scr.getWorldPosition(GT2), ya=Math.atan2(sc2.x-q.g.position.x,sc2.z-q.g.position.z), dy=ya-q.g.rotation.y; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); q.g.rotation.set(q.g.rotation.x*.9,q.g.rotation.y+dy*Math.min(1,dt*3),0,'YXZ'); } /* развернулся к экрану */
      else if(ddx*ddx+ddz*ddz>.02) q.g.rotation.set(Math.min(.35,Math.hypot(ddx,ddz)*.06),Math.atan2(ddx,ddz),0,'YXZ');
      for(var pj=1;pj<q.props.length;pj+=2) q.props[pj].rotation.y+=dt*40; q.lt.material.opacity=Math.sin(tm*6)>.3?1:.2; }
    /* искры: задание пройдено */
    if(HYP) HYP.material.opacity=Math.min(1,HYP.material.opacity+dt*2.5);
    for(var gi=GATES.length-1;gi>=0;gi--){ var ga=GATES[gi]; ga.t+=dt; ga.m.scale.setScalar(Math.min(1,ga.t/.4)); ga.m.material.color.offsetHSL(dt*.15,0,0); ga.m.material.opacity=Math.max(0,Math.min(1,(3.2-ga.t)/.6)); if(ga.t>3.2){ ga.L.g.remove(ga.m); GATES.splice(gi,1); } }
    for(var bi=BURST.length-1;bi>=0;bi--){ var bs=BURST[bi]; bs.t+=dt; bs.sp.position.addScaledVector(bs.v,dt); bs.v.y-=dt*9; bs.sp.material.opacity=Math.max(0,1-bs.t/1.6); if(bs.t>1.6){ bs.L.g.remove(bs.sp); BURST.splice(bi,1); } }
  }
  R.render(S,C);
  /* подписи узлов: кнопки поверх 3D */
  var fpx=innerHeight/2/Math.tan(C.fov*Math.PI/360), cx0=-9, cy0=-9, cr=0, calm=!fly&&(st==='over'||st==='node');
  if(L&&cur&&st==='node'){ cur.g.getWorldPosition(v); var dc=v.distanceTo(C.position); v.project(C); cx0=(v.x*.5+.5)*innerWidth; cy0=(-v.y*.5+.5)*innerHeight; cr=cur.s*1.7/dc*fpx+30; }
  /* подписи не налезают друг на друга: сначала следующий узел, потом ближние; та, что упирается в уже стоящую, прячется.
     у дальних заданий - только номер, полное название - у следующего и у ближних */
  if(L){ var cand=[], used=[];
    L.nodes.forEach(function(n){ var el=n.el; if(!calm){ hideEl(el); return; }
      n.g.getWorldPosition(v); var d=v.distanceTo(C.position); v.project(C); var sx=(v.x*.5+.5)*innerWidth, sy=(-v.y*.5+.5)*innerHeight;
      var op=Math.max(0,Math.min(1,(260-d)/120)), on=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1&&cur!==n&&op>.05&&Math.hypot(sx-cx0,sy-cy0)>cr;
      if(!on){ hideEl(el); return; }
      var full=n.kind!=='task'||n===target||d<38; if(n.full!==full){ n.full=full; el.textContent=full?n.n:n.num; el.classList.toggle('sh',!full); n.w=0; }
      if(!n.w){ n.w=el.offsetWidth; n.h=el.offsetHeight; }
      cand.push({n:n,sx:sx,sy:sy,op:op,k:n===target?-1:d}); });
    cand.sort(function(a,b){ return a.k-b.k; });
    if(cur&&st==='node') used.push([cx0-cr,cy0-cr,cx0+cr,cy0+cr]);
    /* подпись - сноской: вправо-вверх от узла, к узлу тянется тонкая линия с точкой; если справа нет места - влево */
    cand.forEach(function(q){ var n=q.n, el=n.el, gap=n===target?52:30, ly=q.sy-(n===target?40:30), lx=q.sx+gap, left=lx+n.w>innerWidth-8;
      if(left) lx=q.sx-gap-n.w; var r=[lx-4,ly-n.h/2-3,lx+n.w+4,ly+n.h/2+3];
      if(n===target) used.push([q.sx-40,q.sy-110,q.sx+40,q.sy-6]); /* место для указателя "сюда" */
      else if(used.some(function(u){ return r[0]<u[2]&&r[2]>u[0]&&r[1]<u[3]&&r[3]>u[1]; })){ hideEl(el); return; }
      used.push(r); el.style.opacity=q.op; el.style.pointerEvents='auto';
      el.style.transform='translate('+lx+'px,'+ly+'px) translate(0,-50%)';
      var ld=leadOf(n); if(ld){ var ex=left?lx+n.w:lx, mx=q.sx+(ex-q.sx)*.45; ld.setAttribute('points',q.sx+','+q.sy+' '+mx+','+ly+' '+ex+','+ly); ld.style.opacity=q.op*.85; ld._dot.setAttribute('cx',q.sx); ld._dot.setAttribute('cy',q.sy); ld._dot.style.opacity=q.op; } }); }
  /* указатель: над следующим узлом "сюда", а если он за краем экрана - стрелка у края */
  var t=tour?null:target, pOn=false, aOn=false;
  if(calm&&L&&t&&t!==cur){ t.g.getWorldPosition(v); var dd=v.distanceTo(C.position); v.project(C); var behind=v.z>1, x1=v.x, y1=v.y; if(behind){ x1=-x1; y1=-y1; }
    if(!behind&&Math.abs(x1)<.92&&Math.abs(y1)<.88){ pOn=true; ptr.style.transform='translate('+((x1*.5+.5)*innerWidth)+'px,'+((-y1*.5+.5)*innerHeight-Math.min(70,t.s*240/dd)-34)+'px) translate(-50%,0)'; }
    else { aOn=true; var ang=Math.atan2(-y1,x1), ex=Math.cos(ang), ey=Math.sin(ang), sc=Math.min((innerWidth/2-36)/Math.max(.001,Math.abs(ex)),(innerHeight/2-70)/Math.max(.001,Math.abs(ey)));
      arrow.style.transform='translate('+(innerWidth/2+ex*sc)+'px,'+(innerHeight/2+ey*sc)+'px) translate(-50%,-50%) rotate('+ang+'rad)'; } }
  ptr.style.opacity=pOn?1:0; arrow.style.opacity=aOn?1:0; arrow.style.pointerEvents=aOn?'auto':'none';
  requestAnimationFrame(frame); }
refresh();
arrow.onclick=function(){ if(target&&!fly&&(st==='over'||st==='node')) goTo(target); };
frame();
})();
