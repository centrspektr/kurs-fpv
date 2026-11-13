/* Крыши открытых модулей 1, 4, 6 - новая графика (10.11.2026).
   Модуль 1 - "Лётная школа", модуль 4 - "Аэродром", модуль 6 - "Арена аса": у каждой крыши свои декорации, свет и дорога.
   Варианты графики: ?kr=a - гладкий неон (без фото-текстур), ?kr=b - настоящие материалы и тени, ?kr=c - материалы, тени и свечение. ?kr=0 - как было.
   Текстуры покрытий - Poly Haven (CC0), лежат у нас в kryshi/tx. Движок (kosmos-kurs-new.js) зовёт KRYSHI.pt, KRYSHI.floor, KRYSHI.build, KRYSHI.level, KRYSHI.render. */
(function(){
'use strict';
if(!window.THREE) return;
var T=THREE, mq=/[?&]kr=([abc0])/.exec(location.search), VAR=mq?mq[1]:'c'; /* на пробе по умолчанию полный вид; ?kr=0 - как было */
var K={on:VAR!=='0',v:VAR}; window.KRYSHI=K; if(!K.on) return;
var E=null, PY=0, mob=false, SHD=false, TEX=VAR!=='a', BLOOM=VAR==='c';
var W=176, HW=88, UP=new T.Vector3(0,1,0), TL=new T.TextureLoader();
/* какая крыша у модуля (номер с нуля) */
var KIND={0:'shkola',3:'aero',5:'arena'};
var MOOD={
  shkola:{floor:'#114860',tex:'rezina',rep:11,rough:.82,metal:0,sun:'#ffe9c8',sunI:.85,dir:[.55,.75,.5],hemi:['#bfe4ff','#3c5a66',.24],fog:['#182a44',300,1900],glow:'#ff9a5c',glowK:.42,exp:1},
  aero:{floor:'#20232a',tex:'asfalt',rep:13,rough:.9,metal:0,sun:'#cfe0ff',sunI:.75,dir:[-.5,.7,.55],hemi:['#8fb4ff','#20283a',.28],fog:['#0c1a38',280,1800],glow:'#3d8bff',glowK:.36,exp:1.05},
  arena:{floor:'#15122a',tex:'plitka',rep:17,rough:.24,metal:.6,sun:'#d9c8ff',sunI:.55,dir:[.3,.8,.45],hemi:['#b48cff','#1a1030',.26],fog:['#160a30',260,1700],glow:'#ff3dc8',glowK:.5,exp:1.1}
};
/* ---------- помощники ---------- */
function ctex(draw,w,h){ var n=document.createElement('canvas'); n.width=w; n.height=h||w; draw(n.getContext('2d'),n.width,n.height); var t=new T.CanvasTexture(n); t.anisotropy=4; return t; }
function std(col,o){ o=o||{}; var q={color:col,roughness:o.r==null?.5:o.r,metalness:o.m==null?.2:o.m}; if(o.e){ q.emissive=new T.Color(o.e); q.emissiveIntensity=o.ei==null?.6:o.ei; } if(o.map) q.map=o.map; if(o.side) q.side=o.side; if(o.op!=null){ q.transparent=true; q.opacity=o.op; q.depthWrite=false; } if(o.flat) q.flatShading=true; q.envMapIntensity=o.env==null?.5:o.env; return new T.MeshStandardMaterial(q); }
function neon(col,op){ var m=new T.MeshBasicMaterial({color:col,toneMapped:false}); if(op!=null){ m.transparent=true; m.opacity=op; m.depthWrite=false; } return m; }
function M(par,geo,mat,x,y,z,o){ var q=new T.Mesh(geo,mat); q.position.set(x||0,y||0,z||0); if(o){ if(o.rx) q.rotation.x=o.rx; if(o.ry) q.rotation.y=o.ry; if(o.rz) q.rotation.z=o.rz; if(o.s) q.scale.setScalar(o.s); }
  if(SHD&&!(o&&o.ns)&&!mat.transparent&&!mat.isMeshBasicMaterial) q.castShadow=true; par.add(q); return q; }
function box(w,h,d){ return new T.BoxGeometry(w,h,d); }
function cyl(r1,r2,h,s,open){ return new T.CylinderGeometry(r1,r2,h,s||16,1,!!open); }
/* скруглённая коробка: низ на y=0 */
function rr(w,h,d,r){ r=Math.min(r,w/2-.001,d/2-.001); var s=new T.Shape(), x=-w/2, y=-d/2; s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+d-r); s.quadraticCurveTo(x+w,y+d,x+w-r,y+d); s.lineTo(x+r,y+d); s.quadraticCurveTo(x,y+d,x,y+d-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  var bv=Math.min(r*.5,h*.25,.22), g=new T.ExtrudeGeometry(s,{depth:h-2*bv,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:2,curveSegments:5}); g.rotateX(-Math.PI/2); g.translate(0,bv,0); return g; }
var GLOW={}; function gtex(c){ return GLOW[c]||(GLOW[c]=E.glowTex(c)); }
function glow(par,c,s,x,y,z,op){ var sp=new T.Sprite(new T.SpriteMaterial({map:gtex(c),blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:op==null?1:op,toneMapped:false})); sp.scale.setScalar(s); sp.position.set(x,y,z); par.add(sp); return sp; }
/* много огоньков одним объектом: шарики + ореолы точками */
var o3=new T.Object3D();
function lights(par,list,col,r,halo){ var im=new T.InstancedMesh(new T.SphereGeometry(r||.22,8,6),neon(col),list.length); list.forEach(function(p,i){ o3.position.set(p[0],p[1],p[2]); o3.rotation.set(0,0,0); o3.scale.setScalar(1); o3.updateMatrix(); im.setMatrixAt(i,o3.matrix); }); im.frustumCulled=false; par.add(im);
  var P=new Float32Array(list.length*3); list.forEach(function(p,i){ P[i*3]=p[0]; P[i*3+1]=p[1]; P[i*3+2]=p[2]; }); var g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3));
  var pt=new T.Points(g,new T.PointsMaterial({map:gtex(col),size:halo||2.2,sizeAttenuation:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:.9})); pt.frustumCulled=false; par.add(pt); return pt; }
function inst(par,geo,mat,list,cast){ var im=new T.InstancedMesh(geo,mat,list.length); list.forEach(function(p,i){ o3.position.set(p[0],p[1],p[2]); o3.rotation.set(p[6]||0,p[3]||0,p[7]||0); o3.scale.set(p[4]||1,p[5]||p[4]||1,p[8]||p[4]||1); o3.updateMatrix(); im.setMatrixAt(i,o3.matrix); if(p[9]!=null) im.setColorAt(i,new T.Color(p[9])); }); im.frustumCulled=false; if(SHD&&cast!==false) im.castShadow=true; par.add(im); return im; }
/* разметка на покрытии: плоскость чуть выше крыши */
function decal(par,tx,w,d,x,z,ry,op,y){ var m=new T.MeshBasicMaterial({map:tx,transparent:true,opacity:op==null?1:op,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:true}); var q=new T.Mesh(new T.PlaneGeometry(w,d),m); q.rotation.x=-Math.PI/2; if(ry) q.rotation.z=ry; q.position.set(x,y||.045,z); q.renderOrder=1; par.add(q); return q; }
function font(x,px,w){ x.font=(w||'900')+' '+px+'px Unbounded, Manrope, system-ui, sans-serif'; }
function rrect(x,X,Y,w,h,r){ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+w,Y,X+w,Y+h,r); x.arcTo(X+w,Y+h,X,Y+h,r); x.arcTo(X,Y+h,X,Y,r); x.arcTo(X,Y,X+w,Y,r); x.closePath(); }
/* табличка-экран: тёмное стекло, рамка цвета col, надпись (и строка мельче) */
function sign(par,txt,o){ var w=o.w, h=o.h, col=o.col||'#7cf3ff', cw=512, ch=Math.max(64,Math.round(512*h/w));
  var tx=ctex(function(x){ rrect(x,4,4,cw-8,ch-8,ch*.14); x.fillStyle=o.bg||'rgba(8,12,28,.94)'; x.fill(); x.lineWidth=ch*.045; x.strokeStyle=col; x.stroke();
    var fz=ch*(o.sub?.36:.5); do{ font(x,fz); fz-=3; }while(fz>14&&x.measureText(txt).width>cw*.86); x.textAlign='center'; x.textBaseline='middle'; x.shadowColor=col; x.shadowBlur=ch*.16; x.fillStyle=o.fg||'#ffffff'; x.fillText(txt,cw/2,ch*(o.sub?.4:.53)); x.shadowBlur=0;
    if(o.sub){ font(x,ch*.17,'600'); x.fillStyle=col; x.fillText(o.sub,cw/2,ch*.76); } },cw,ch);
  var g=new T.Group(); g.position.set(o.x||0,o.y||0,o.z||0); if(o.ry) g.rotation.y=o.ry; par.add(g);
  M(g,box(w+.3,h+.3,.25),std(0x141a2c,{r:.4,m:.6}),0,0,-.14); var p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx,transparent:true,toneMapped:false})); p.position.z=.01; g.add(p);
  if(o.legs){ var lm=std(0x8a93a8,{r:.35,m:.8}); [-w*.36,w*.36].forEach(function(lx){ M(g,cyl(.12,.14,o.legs,8),lm,lx,-h/2-o.legs/2,-.14); }); }
  return g; }
/* маленький дрон из гладких деталей: sc=1 - размах около 1.6 */
var DG=null;
function drone(col,sc){ if(!DG) DG={body:rr(.62,.2,.9,.12),arm:box(1.5,.07,.16),mot:cyl(.13,.15,.16,12),prop:new T.CircleGeometry(.42,20),cam:new T.SphereGeometry(.11,10,8),bat:rr(.4,.16,.7,.05)};
  var g=new T.Group(), fr=std(0x1b1f2b,{r:.35,m:.6}), ac=std(col,{r:.3,m:.4,e:col,ei:.35}), pm=new T.MeshBasicMaterial({color:0xdfe9ff,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});
  M(g,DG.body,fr,0,.06,0); M(g,DG.bat,ac,0,.26,0); M(g,DG.cam,std(0x0c0e14,{r:.1,m:.9}),0,.2,.48);
  [Math.PI/4,-Math.PI/4].forEach(function(r){ M(g,DG.arm,fr,0,.1,0,{ry:r}); }); g.userData.props=[];
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(q){ var x=q[0]*.53, z=q[1]*.53; M(g,DG.mot,ac,x,.2,z); var p=new T.Mesh(DG.prop,pm); p.rotation.x=-Math.PI/2; p.position.set(x,.3,z); g.add(p); g.userData.props.push(p); });
  g.scale.setScalar(sc||1); return g; }
/* кольцо-ворота для своего полёта: движок сам считает пролёт (L.aerGates), поэтому кладём прямо в уровень */
function flyGate(L,x,y,z,ry,hue,stand){ var gt=new T.Mesh(new T.TorusGeometry(2.8,.22,10,44),new T.MeshBasicMaterial({color:new T.Color().setHSL(hue,.9,.6),toneMapped:false})); gt.position.set(x,PY+y,z); gt.rotation.y=ry||0; L.g.add(gt); L.aerGates.push(gt);
  if(stand!==false){ var sm=std(0x2a3044,{r:.4,m:.7}); M(L.kg,cyl(.1,.14,Math.max(.2,y-2.9),8),sm,x,(y-2.9)/2,z); M(L.kg,cyl(.9,1,.14,20),sm,x,.07,z); } return gt; }
/* покрытие без фото-текстур (вариант а) */
function procFloor(kind){ return ctex(function(x,w){ var i;
  if(kind==='shkola'){ x.fillStyle='#d6dde2'; x.fillRect(0,0,w,w); for(i=0;i<2600;i++){ x.fillStyle='rgba(0,0,0,'+Math.random()*.07+')'; x.fillRect(Math.random()*w,Math.random()*w,2,2); } x.strokeStyle='rgba(0,0,0,.16)'; x.lineWidth=3; x.strokeRect(0,0,w,w); x.strokeStyle='rgba(255,255,255,.2)'; x.lineWidth=1; x.strokeRect(3,3,w-6,w-6); }
  else if(kind==='aero'){ x.fillStyle='#b9bcc2'; x.fillRect(0,0,w,w); for(i=0;i<5200;i++){ x.fillStyle=(Math.random()<.5?'rgba(0,0,0,':'rgba(255,255,255,')+Math.random()*.1+')'; x.fillRect(Math.random()*w,Math.random()*w,2,2); } x.strokeStyle='rgba(0,0,0,.2)'; x.lineWidth=2; x.strokeRect(0,0,w,w); }
  else { x.fillStyle='#c4c2d2'; x.fillRect(0,0,w,w); x.strokeStyle='rgba(0,0,0,.4)'; x.lineWidth=4; var s=w/2, hx=function(cx,cy){ x.beginPath(); for(var k=0;k<6;k++){ var a=k*Math.PI/3; x.lineTo(cx+Math.cos(a)*s*.56,cy+Math.sin(a)*s*.56); } x.closePath(); x.stroke(); }; hx(s*.5,s*.5); hx(s*1.5,s*.5); hx(0,s*1.5); hx(s,s*1.5); hx(w,s*1.5); hx(s*.5,s*2.5); hx(s*1.5,s*2.5); hx(0,-s*.5); hx(s,-s*.5); hx(w,-s*.5); }
  },256); }
/* покрытие крыши: зовёт движок из roof() */
K.floor=function(i,len){ var kd=KIND[i], md=MOOD[kd], t, n=null, an=E.R.capabilities.getMaxAnisotropy?Math.min(8,E.R.capabilities.getMaxAnisotropy()):1;
  if(TEX){ t=TL.load('kryshi/tx/'+md.tex+'.jpg'); n=TL.load('kryshi/tx/'+md.tex+'-n.jpg'); n.wrapS=n.wrapT=T.RepeatWrapping; n.repeat.set(W/md.rep,len/md.rep); n.anisotropy=an; } else t=procFloor(kd);
  t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(W/(TEX?md.rep:8),len/(TEX?md.rep:8)); t.anisotropy=an;
  var m=new T.MeshStandardMaterial({color:md.floor,map:t,roughness:md.rough,metalness:md.metal,envMapIntensity:kd==='arena'?.9:.3}); if(n){ m.normalMap=n; m.normalScale=new T.Vector2(.8,.8); } return m; };
/* путь заданий: у арены аса - широкая змейка трассы, у школы и аэродрома - как в движке */
K.pt=function(i,k){ if(KIND[i]==='arena') return [Math.sin(k*.95+.5)*34,-58-k*26]; return null; };
K.kind=function(i){ return KIND[i]; };
/* 13.11: модули 4 и 6 тоже с экраном и ответами (посадка на площадку, гонка на время) */
var PROBA=!/[?&]kviz=0\b/.test(location.search); /* с 13.11 по "ставь" включено везде; ?kviz=0 - прежние дорожки в модулях 4 и 6 */
K.kviz=function(i){ return KIND[i]==='shkola'||(PROBA&&!!KIND[i]); };
/* лента дороги: у каждой крыши своя */
function roadTex(kd){ var t=ctex(function(x,w,h){
  if(kd==='shkola'){ x.fillStyle='#e9eef3'; x.fillRect(0,0,w,h); x.fillStyle='#35d6e6'; x.fillRect(0,0,5,h); x.fillRect(w-5,0,5,h); x.fillStyle='rgba(20,40,60,.22)'; x.fillRect(w/2-1,0,2,h); x.fillStyle='#2bb673'; x.beginPath(); x.moveTo(w/2,h*.2); x.lineTo(w/2+9,h*.45); x.lineTo(w/2-9,h*.45); x.fill(); }
  else if(kd==='aero'){ x.fillStyle='#1b1e25'; x.fillRect(0,0,w,h); x.fillStyle='#ffd21f'; x.fillRect(w/2-3,0,6,h); x.fillStyle='#ffd21f'; x.fillRect(3,0,2,h); x.fillRect(w-5,0,2,h); }
  else { x.fillStyle='#0a0714'; x.fillRect(0,0,w,h); x.fillStyle='#ff3dc8'; x.fillRect(0,0,4,h); x.fillRect(w-4,0,4,h); x.strokeStyle='#ffd36e'; x.lineWidth=5; x.beginPath(); x.moveTo(w*.22,h*.62); x.lineTo(w/2,h*.3); x.lineTo(w*.78,h*.62); x.stroke(); }
  },64,128); t.wrapT=T.RepeatWrapping; return t; }
/* ---------- общее для всех трёх крыш: бортик со стеклом, свет, небо ---------- */
function common(L,G,kd,c,zMin){ var md=MOOD[kd], z0=60, len=z0-zMin, zc=(z0+zMin)/2, dark=std(0x1a2032,{r:.35,m:.75}), gl=std(0xbfe6ff,{r:.05,m:.9,op:.16,env:1.2}), led=neon(c);
  [[0,z0,W,.5],[0,zMin,W,.5],[-HW,zc,.5,len],[HW,zc,.5,len]].forEach(function(q){ M(G,box(q[2]+.5,1,q[3]+.5),dark,q[0],.5,q[1],{ns:1}); M(G,box(q[2]+.1,.1,q[3]+.1),led,q[0],1.04,q[1]); var g2=new T.Mesh(box(Math.max(.08,q[2]-.3),1.5,Math.max(.08,q[3]-.3)),gl); g2.position.set(q[0],1.85,q[1]); G.add(g2); M(G,box(q[2]+.2,.12,q[3]+.2),dark,q[0],2.65,q[1],{ns:1}); });
  var posts=[]; for(var z=z0;z>=zMin-.1;z-=(len/Math.round(len/11))){ posts.push([-HW,1.85,z]); posts.push([HW,1.85,z]); } for(var x=-HW+11;x<HW;x+=11){ posts.push([x,1.85,z0]); posts.push([x,1.85,zMin]); } inst(G,box(.22,1.7,.22),dark,posts,false);
  /* свет: своё "солнце" (в вариантах b и c - с тенями), небо-полусфера */
  var hm=new T.HemisphereLight(md.hemi[0],md.hemi[1],md.hemi[2]); L.g.add(hm);
  var sun=new T.DirectionalLight(md.sun,md.sunI), dir=new T.Vector3(md.dir[0],md.dir[1],md.dir[2]).normalize(); L.g.add(sun); L.g.add(sun.target);
  if(SHD){ sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); var sc=sun.shadow.camera; sc.left=-120; sc.right=120; sc.top=120; sc.bottom=-120; sc.near=20; sc.far=520; sun.shadow.bias=-.0008; sun.shadow.normalBias=.06; sun.shadow.radius=2.5; }
  var fw=new T.Vector3(); L.tick=L.tick||[]; L.tick.push(function(){ E.C.getWorldDirection(fw); var fx=E.C.position.x+fw.x*70, fz=E.C.position.z+fw.z*70; fx=Math.round(fx/8)*8; fz=Math.round(fz/8)*8; sun.target.position.set(fx,PY,fz); sun.position.set(fx+dir.x*260,PY+dir.y*260,fz+dir.z*260); });
  /* зарево у горизонта: у каждой крыши своего цвета */
  var gt=ctex(function(x,w,h){ var g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.55,'rgba(255,255,255,.28)'); g.addColorStop(.8,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,.2)'); x.fillStyle=g; x.fillRect(0,0,w,h); },4,128);
  var hz=new T.Mesh(new T.CylinderGeometry(1500,1500,900,40,1,true),new T.MeshBasicMaterial({map:gt,color:md.glow,transparent:true,opacity:md.glowK,side:T.BackSide,depthWrite:false,fog:false,blending:T.AdditiveBlending,toneMapped:false})); hz.position.set(0,PY+120,zc); hz.renderOrder=-5; L.g.add(hz);
  L.fog=new T.Fog(new T.Color(md.fog[0]),md.fog[1],md.fog[2]);
  L.roadT=roadTex(kd); L.roadW=kd==='shkola'?2.4:3; L.noLamps=1;
  return {z0:z0,zMin:zMin,len:len,zc:zc,dark:dark}; }
/* мачта освещения */
function mast(L,G,x,z,h,col,ry){ var pm=std(0x9aa3b5,{r:.3,m:.85}); M(G,cyl(.28,.45,h,10),pm,x,h/2,z); M(G,cyl(.9,1.1,.5,16),std(0x2a3044,{r:.5,m:.5}),x,.25,z); var hd=new T.Group(); hd.position.set(x,h,z); hd.rotation.y=ry||0; G.add(hd); M(hd,rr(4.2,.5,1.2,.2),std(0x232838,{r:.4,m:.7}),0,0,0);
  [-1.35,-.45,.45,1.35].forEach(function(lx){ M(hd,box(.7,.08,.8),neon(col),lx,-.05,0); }); glow(hd,col,9,0,-.3,0,.75); }
/* ящик с растениями */
function planters(G,list){ var pm=std(0xe8ebf0,{r:.6,m:.05}), earth=std(0x3a2c20,{r:1,m:0}), b=[], e=[], l1=[], l2=[]; list.forEach(function(p){ b.push([p[0],0,p[1],p[2]||0]); e.push([p[0],1.02,p[1],p[2]||0]);
    for(var k=-1;k<=1;k++){ var dx=Math.cos(p[2]||0)*k*1.5, dz=-Math.sin(p[2]||0)*k*1.5, s=.85+((k*7+p[0]*3)%5+5)%5*.08; (k?l1:l2).push([p[0]+dx,1.55+s*.3,p[1]+dz,k,s*1.05,s*.95,0,0,s*1.05]); } });
  inst(G,rr(5.4,1.1,1.8,.3),pm,b); inst(G,box(4.9,.1,1.3),earth,e,false); var ico=new T.IcosahedronGeometry(1,2); inst(G,ico,std(0x3f9a4c,{r:.85,m:0}),l1); inst(G,ico,std(0x57b85f,{r:.85,m:0}),l2); }
/* щит с фото села */
function photo(G,file,x,z,ry,col){ var g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; G.add(g); var fm=std(0x161b2a,{r:.35,m:.7}); M(g,box(12.8,9.4,.35),fm,0,8.2,-.2); M(g,box(12.8,.14,.4),neon(col),0,3.42,-.18);
  [-4.6,4.6].forEach(function(lx){ M(g,cyl(.16,.2,3.5,8),std(0x8a93a8,{r:.35,m:.8}),lx,1.75,-.2); }); var p=new T.Mesh(new T.PlaneGeometry(12.2,8.8),new T.MeshBasicMaterial({map:TL.load(E.FOTO+file+'.jpg'),toneMapped:false})); p.position.set(0,8.2,.0); g.add(p); }

/* ================= модуль 1: "Лётная школа" ================= */
function shkola(L,G,c,B){ var mk=1, zMin=B.zMin, i, wh=std(0xf2f4f8,{r:.5,m:.1}), dk=B.dark, tube=std(0xdfe5ee,{r:.3,m:.85});
  /* полосы безопасности вдоль бортика */
  var hz=ctex(function(x,w,h){ x.fillStyle='#ffd21f'; x.fillRect(0,0,w,h); x.fillStyle='#1a1d24'; for(var k=-2;k<6;k++){ x.beginPath(); x.moveTo(k*32,h); x.lineTo(k*32+16,h); x.lineTo(k*32+48,0); x.lineTo(k*32+32,0); x.fill(); } },64,32); hz.wrapS=T.RepeatWrapping;
  [[-HW+2.2,B.zc,B.len-2,1],[HW-2.2,B.zc,B.len-2,1],[0,B.z0-2.2,W-6,0],[0,zMin+2.2,W-6,0]].forEach(function(q){ var t=hz.clone(); t.needsUpdate=true; t.repeat.set(q[2]/4,1); decal(G,t,q[2],1.4,q[0],q[1],q[3]?Math.PI/2:0,.9); });
  function zone(x,z,w,d,col,txt){ decal(G,ctex(function(xx,cw,ch){ rrect(xx,6,6,cw-12,ch-12,26); xx.fillStyle=col; xx.globalAlpha=.5; xx.fill(); xx.globalAlpha=1; xx.strokeStyle='#ffffff'; xx.lineWidth=7; xx.stroke(); font(xx,ch*.075); xx.fillStyle='#ffffff'; xx.textAlign='center'; xx.fillText(txt,cw/2,ch*.965); },512,Math.round(512*d/w)),w,d,x,z,0,.95,.03); }
  zone(mk?-59:-50,-88,56,72,'#0e4f66','ЗОНА ПОЛЁТОВ'); zone(mk?61:52,-82,46,46,'#0e4f66','КЛАСС'); zone(-56,-178,40,34,'#7a1f2a','БЕЗОПАСНОСТЬ'); zone(54,-186,34,30,'#0e4f66','ПРОВЕРКА');
  /* стартовая площадка: круги и надпись по дуге */
  decal(G,ctex(function(x,w){ var cc=w/2; x.strokeStyle='#ffffff'; x.lineWidth=w*.012; x.beginPath(); x.arc(cc,cc,w*.47,0,6.283); x.stroke(); x.strokeStyle='rgba(255,255,255,.55)'; x.lineWidth=w*.006; x.beginPath(); x.arc(cc,cc,w*.36,0,6.283); x.stroke();
    for(var k=0;k<48;k++){ var a=k/48*6.283, r1=w*(k%4?.445:.42); x.beginPath(); x.moveTo(cc+Math.cos(a)*r1,cc+Math.sin(a)*r1); x.lineTo(cc+Math.cos(a)*w*.465,cc+Math.sin(a)*w*.465); x.stroke(); }
    font(x,w*.05); x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle'; var s='ШКОЛА FPV · СТАРТ · ШКОЛА FPV · СТАРТ · '; for(var j=0;j<s.length;j++){ var a2=-Math.PI/2+(j-s.length/2)*.165; x.save(); x.translate(cc+Math.cos(a2)*w*.395,cc+Math.sin(a2)*w*.395); x.rotate(a2+Math.PI/2); x.fillText(s[j],0,0); x.restore(); } },1024),40,40,0,-28,0,.95);
  /* --- клетка для первых полётов (слева): каркас, сетка, 6 площадок --- */
  var cx=mk?-59:-50, cz=-92, cw=40, cl=52, chh=13, cg=new T.Group(); cg.position.set(cx,0,cz); G.add(cg);
  var court=ctex(function(x,w,h){ rrect(x,6,6,w-12,h-12,30); x.fillStyle='#1e7d59'; x.fill(); x.strokeStyle='#ffffff'; x.lineWidth=8; x.stroke(); x.lineWidth=5; x.strokeStyle='rgba(255,255,255,.7)'; x.beginPath(); x.moveTo(w/2,14); x.lineTo(w/2,h-14); x.stroke();
    for(var k=0;k<6;k++){ var px=w*(k%2?.74:.26), py=h*(.19+Math.floor(k/2)*.31); x.fillStyle='#14263a'; x.beginPath(); x.arc(px,py,w*.14,0,6.283); x.fill(); x.strokeStyle=k<2?'#7cf3ff':k<4?'#ffd36e':'#ff8fd8'; x.lineWidth=9; x.stroke(); font(x,w*.13); x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(k+1),px,py+4); } },512,666);
  decal(cg,court,cw-2,cl-2,0,0,0,1);
  var posts=[]; [-1,1].forEach(function(sx){ [-1,-.33,.33,1].forEach(function(sz){ posts.push([sx*cw/2,chh/2,sz*cl/2,0,1,1]); }); }); [-.33,.33].forEach(function(sx){ posts.push([sx*cw/2,chh/2,-cl/2]); posts.push([sx*cw/2,chh/2,cl/2]); }); inst(cg,cyl(.2,.2,chh,10),tube,posts);
  [[0,-cl/2,cw,.3,.3],[0,cl/2,cw,.3,.3],[-cw/2,0,.3,.3,cl],[cw/2,0,.3,.3,cl],[0,0,.22,.22,cl],[0,0,cw,.22,.22]].forEach(function(q){ M(cg,box(q[2],q[3],q[4]),tube,q[0],chh,q[1]); });
  var nt=ctex(function(x,w){ x.clearRect(0,0,w,w); x.strokeStyle='rgba(235,245,255,.75)'; x.lineWidth=2; x.strokeRect(0,0,w,w); x.beginPath(); x.moveTo(0,0); x.lineTo(w,w); x.moveTo(w,0); x.lineTo(0,w); x.stroke(); },32); nt.wrapS=nt.wrapT=T.RepeatWrapping;
  function net(w,h,x,y,z,rx,ry){ var t=nt.clone(); t.needsUpdate=true; t.repeat.set(w/1.3,h/1.3); var q=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false})); q.position.set(x,y,z); q.rotation.set(rx||0,ry||0,0); cg.add(q); }
  net(cw,chh,0,chh/2,-cl/2); net(cl,chh,-cw/2,chh/2,0,0,Math.PI/2); net(cl,chh,cw/2,chh/2,0,0,Math.PI/2); net(cw,cl,0,chh,0,Math.PI/2); net(cw*.3,chh,-cw*.35,chh/2,cl/2); net(cw*.3,chh,cw*.35,chh/2,cl/2);
  sign(cg,'ЗОНА ПОЛЁТОВ',{w:15,h:3,x:0,y:chh+2.1,z:cl/2,col:'#4ade80',sub:'первые полёты под сеткой'});
  for(i=0;i<6;i++){ var dx=(i%2?.24:-.24)*cw, dz=(-.31+Math.floor(i/2)*.31)*cl; if(i!==2){ var d=drone(i<2?'#7cf3ff':i<4?'#ffd36e':'#ff8fd8',1.5); d.position.set(dx,.1,dz); d.rotation.y=i; cg.add(d); } }
  L.aerGates=[]; flyGate(L,cx-6,4.2,cz+6,.5,.45); flyGate(L,cx+8,6,cz-8,-.7,.12); flyGate(L,cx-4,5,cz-18,.1,.82); L.aerGates=[];
  var cn=[]; for(i=0;i<5;i++) cn.push([cx+10,0,cz+16-i*5]); inst(G,new T.ConeGeometry(.5,1.3,14).translate(0,.65,0),std(0xff7a1a,{r:.5,m:0,e:'#ff7a1a',ei:.25}),cn);
  L.freeP=new T.Vector3(0,PY+1.4,-30);
  /* --- класс под навесом (справа): перголы, лавки, экран с правилами --- */
  var kx=mk?61:52, kz=-84, kg=new T.Group(); kg.position.set(kx,0,kz); G.add(kg);
  decal(kg,ctex(function(x,w,h){ x.fillStyle='#b98a5a'; x.fillRect(0,0,w,h); for(var k=0;k<16;k++){ x.fillStyle='rgba(60,35,15,'+(.08+Math.random()*.16)+')'; x.fillRect(k*w/16,0,w/16-2,h); x.fillStyle='rgba(40,20,5,.5)'; x.fillRect(k*w/16-1,0,2,h); } },256,256),34,30,0,0,0,1);
  var cols=[]; [-15,15].forEach(function(x){ [-12,12].forEach(function(z){ cols.push([x,5,z]); }); }); inst(kg,cyl(.3,.34,10,12),wh,cols);
  var roofG=new T.CylinderGeometry(26,26,34,24,1,true,-.42,.84); roofG.rotateZ(Math.PI/2); roofG.rotateX(-Math.PI/2); M(kg,roofG,std(0xffffff,{r:.6,m:0,side:T.DoubleSide,e:'#fff4dd',ei:.18}),0,-14.3,0);
  [-15,15].forEach(function(x){ M(kg,box(.3,.3,26),wh,x,10,0); }); M(kg,box(30,.12,.12),neon('#ffe9b8'),0,9.7,-10); M(kg,box(30,.12,.12),neon('#ffe9b8'),0,9.7,10);
  var bn=[]; for(i=0;i<3;i++) [-7,7].forEach(function(x){ bn.push([x,.9,2+i*4.2]); }); inst(kg,rr(9.5,.5,1.5,.2),std(0xe0a060,{r:.6,m:0}),bn); var bl=[]; bn.forEach(function(p){ bl.push([p[0]-3.6,.45,p[2]]); bl.push([p[0]+3.6,.45,p[2]]); }); inst(kg,box(.3,.9,1.2),dk,bl);
  var rules=ctex(function(x,w,h){ x.fillStyle='#0b1326'; x.fillRect(0,0,w,h); font(x,h*.085); x.fillStyle='#7cf3ff'; x.textAlign='center'; x.fillText('ЗОЛОТЫЕ ПРАВИЛА',w/2,h*.14); var R2=[['#4ade80','Очки и пульт проверь до взлёта'],['#ffd36e','До людей - не ближе 5 метров'],['#ff8fd8','Винты крутятся - руки убери'],['#7cf3ff','Сел - сначала выключи моторы']];
    R2.forEach(function(r,k){ var y=h*(.3+k*.17); x.fillStyle=r[0]; x.beginPath(); x.arc(w*.1,y-h*.02,h*.045,0,6.283); x.fill(); x.fillStyle='#0b1326'; font(x,h*.06); x.textAlign='center'; x.fillText(String(k+1),w*.1,y); x.fillStyle='#ffffff'; font(x,h*.058,'700'); x.textAlign='left'; x.fillText(r[1],w*.17,y); }); },1024,512);
  var sc=new T.Group(); sc.position.set(0,5.6,-12.6); kg.add(sc); M(sc,rr(21,.5,.5,.2),dk,0,-4.9,0); M(sc,box(20.6,8.6,.4),std(0x10151f,{r:.3,m:.7}),0,0,-.22); var sp=new T.Mesh(new T.PlaneGeometry(20,8),new T.MeshBasicMaterial({map:rules,toneMapped:false})); sc.add(sp);
  [-9,9].forEach(function(x){ M(sc,cyl(.18,.2,1.6,8),tube,x,-5.1,0); }); sign(kg,'КЛАСС',{w:8,h:2.2,x:0,y:11.6,z:12.4,col:'#ffd36e'});
  /* --- уголок безопасности (слева дальше): огнетушители, шкаф для АКБ, аптечка, песок --- */
  var sx=-56, sz=-178, sg=new T.Group(); sg.position.set(sx,0,sz); sg.rotation.y=.35; G.add(sg);
  decal(sg,ctex(function(x,w){ x.fillStyle='#c53030'; rrect(x,4,4,w-8,w-8,20); x.fill(); x.strokeStyle='#ffffff'; x.lineWidth=10; x.stroke(); x.save(); x.clip(); x.fillStyle='rgba(255,255,255,.14)'; for(var k=-8;k<16;k++){ x.beginPath(); x.moveTo(k*40,w); x.lineTo(k*40+20,w); x.lineTo(k*40+w+20,0); x.lineTo(k*40+w,0); x.fill(); } x.restore(); },256),22,16,0,0,0,.95);
  var red=std(0xd9342b,{r:.35,m:.3}); M(sg,rr(6,6.5,2.4,.3),red,-4.5,0,-4); sign(sg,'ШКАФ АКБ',{w:5,h:1.3,x:-4.5,y:5.2,z:-2.75,col:'#ffd36e'}); M(sg,box(5,.1,.1),neon('#ffb020'),-4.5,3.9,-2.75);
  [0,1].forEach(function(k){ var ex=new T.Group(); ex.position.set(1.5+k*1.8,0,-4); sg.add(ex); M(ex,cyl(.5,.5,2,16),red,0,1.2,0); M(ex,new T.SphereGeometry(.5,16,8,0,6.283,0,1.57),red,0,2.2,0); M(ex,cyl(.14,.14,.5,8),dk,0,2.8,0); M(ex,box(.9,.12,.14),dk,.3,3,0); M(ex,cyl(.52,.52,.5,16),std(0xf2f4f8,{r:.5}),0,1.4,0); });
  M(sg,rr(3.2,3.2,1,.2),wh,7.5,1.8,-4.3); var cr=neon('#22c55e'); M(sg,box(1.8,.55,.1),cr,7.5,3.4,-3.75); M(sg,box(.55,1.8,.1),cr,7.5,3.4,-3.75); M(sg,rr(3.4,1.8,2.2,.2),std(0xe0a44a,{r:.8,m:0}),-9.5,0,0); M(sg,box(3,.1,1.8),std(0xd9c089,{r:1,m:0}),-9.5,1.76,0);
  sign(sg,'БЕЗОПАСНОСТЬ',{w:13,h:2.6,x:0,y:9.2,z:-4.6,col:'#ff5a5a',sub:'огонь, АКБ, аптечка',legs:2.2});
  /* --- стол предполётной проверки (справа дальше) --- */
  var px=54, pz=-186, pg=new T.Group(); pg.position.set(px,0,pz); pg.rotation.y=-.3; G.add(pg);
  M(pg,rr(11,.35,4.6,.3),std(0xe9edf3,{r:.4,m:.2}),0,2.6,0); [[-4.6,-1.7],[4.6,-1.7],[-4.6,1.7],[4.6,1.7]].forEach(function(q){ M(pg,cyl(.16,.16,2.6,8),tube,q[0],1.3,q[1]); });
  var td=drone('#7cf3ff',2.2); td.position.set(-2,3.05,0); td.rotation.y=.5; pg.add(td); M(pg,rr(2.4,.5,1.5,.2),std(0x23262e,{r:.4,m:.5}),2.6,2.95,.2); M(pg,box(.9,.06,.5),neon('#39ff6a'),2.6,3.48,.2); [0,1,2].forEach(function(k){ M(pg,rr(.7,.4,1.3,.1),std(['#ffd36e','#ff8fd8','#7cf3ff'][k],{r:.4,m:.2}),4.3,2.95,-1.4+k*.95,{ry:.2}); });
  var chk=ctex(function(x,w,h){ x.fillStyle='#0b1326'; x.fillRect(0,0,w,h); font(x,h*.075); x.fillStyle='#ffd36e'; x.textAlign='center'; x.fillText('ПРОВЕРКА ПЕРЕД ВЗЛЁТОМ',w/2,h*.11); ['Винты целые и затянуты','АКБ заряжена и закреплена','Пульт включён первым','Вокруг никого ближе 5 м','Очки видят картинку'].forEach(function(s,k){ var y=h*(.26+k*.14); x.strokeStyle='#4ade80'; x.lineWidth=5; x.strokeRect(w*.07,y-h*.05,h*.07,h*.07); x.beginPath(); x.moveTo(w*.075,y-h*.02); x.lineTo(w*.09,y+h*.01); x.lineTo(w*.115,y-h*.055); x.stroke(); x.fillStyle='#ffffff'; font(x,h*.058,'700'); x.textAlign='left'; x.fillText(s,w*.15,y+h*.005); }); },768,640);
  var cb=new T.Group(); cb.position.set(0,6.6,-4.2); pg.add(cb); M(cb,box(10.4,8.7,.4),std(0x10151f,{r:.3,m:.7}),0,0,-.22); var cp=new T.Mesh(new T.PlaneGeometry(10,8.3),new T.MeshBasicMaterial({map:chk,toneMapped:false})); cb.add(cp); [-4.2,4.2].forEach(function(x){ M(cb,cyl(.16,.2,2.4,8),tube,x,-5.5,-.2); });
  /* --- посадочные площадки и солнечные панели в конце крыши --- */
  var hp=ctex(function(x,w){ var cc=w/2; x.fillStyle='#14263a'; x.beginPath(); x.arc(cc,cc,w*.47,0,6.283); x.fill(); x.strokeStyle='#ffd21f'; x.lineWidth=w*.04; x.stroke(); x.strokeStyle='#ffffff'; x.lineWidth=w*.07; x.beginPath(); x.moveTo(cc-w*.14,cc-w*.2); x.lineTo(cc-w*.14,cc+w*.2); x.moveTo(cc+w*.14,cc-w*.2); x.lineTo(cc+w*.14,cc+w*.2); x.moveTo(cc-w*.14,cc); x.lineTo(cc+w*.14,cc); x.stroke(); },256);
  (mk?[]:[[-34,-262],[36,-250],[-52,-296]]).forEach(function(q){ decal(G,hp,13,13,q[0],q[1],0,1); var pl=[]; for(var k=0;k<10;k++) pl.push([q[0]+Math.cos(k*.628)*6.9,.15,q[1]+Math.sin(k*.628)*6.9]); lights(G,pl,'#ffd36e',.16,1.6); });
  var sl=[]; for(i=0;i<7;i++) [0,1].forEach(function(r){ sl.push([-45+i*15,2.1,zMin+12+r*9,0,1,1,-.5]); }); inst(G,box(12,.25,6),std(0x1b3a7a,{r:.12,m:.85,env:1.4}),sl); var sl2=[]; sl.forEach(function(p){ sl2.push([p[0],1,p[2]+.8]); }); inst(G,box(.4,2,.4),dk,sl2,false);
  /* мачты света, растения, фото села */
  [[-80,20],[80,20],[-80,-130],[80,-130],[-80,-250],[80,-250]].forEach(function(q){ mast(L,G,q[0],q[1],24,'#fff3d6',q[0]<0?.5:-.5); });
  planters(G,[[-80,-20,Math.PI/2],[-80,-40,Math.PI/2],[80,-20,Math.PI/2],[80,-40,Math.PI/2],[-28,44,0],[28,44,0],[-80,-150,Math.PI/2],[80,-150,Math.PI/2],[80,-215,Math.PI/2],[-80,-215,Math.PI/2]].concat(mk?[]:[[18,-130,.4],[-22,-225,-.3]]));
  photo(G,'02-spektr',80,-108,-Math.PI/2,c); photo(G,'01-selo-sverhu',-80,-232,Math.PI/2,c); photo(G,'05-zakat',0,zMin+30,0,c);
  /* аллея флажков у старта */
  var fp=[], FC=['#7cf3ff','#ffd36e','#ff8fd8','#9dff7c']; for(i=0;i<5;i++) [-1,1].forEach(function(sx){ fp.push([sx*(9+i*3.2),3.4,-8-i*1.5]); }); inst(G,cyl(.07,.1,6.8,6),tube,fp);
  fp.forEach(function(q,k){ var f=new T.Mesh(new T.PlaneGeometry(1.5,4.6),new T.MeshBasicMaterial({color:FC[k%4],side:T.DoubleSide,toneMapped:false})); f.position.set(q[0]+(q[0]>0?.8:-.8),4.4,q[2]); G.add(f); L.tick.push(function(t){ f.rotation.y=Math.sin(t*2+k)*.3; }); });
  /* ветроуказатель */
  windsock(L,G,78,-224); arenaKviz(L,G,c,B);
}
function windsock(L,G,x,z){ var ws=new T.Group(); ws.position.set(x,0,z); G.add(ws); M(ws,cyl(.14,.2,10,8),std(0xe6e9ef,{r:.3,m:.8}),0,5,0); M(ws,cyl(.8,1,.3,16),std(0x2a3044,{r:.5,m:.5}),0,.15,0);
  var st=ctex(function(x,w,h){ for(var k=0;k<5;k++){ x.fillStyle=k%2?'#ffffff':'#ff6a1a'; x.fillRect(0,k*h/5,w,h/5+1); } },8,64), sock=new T.Group(); sock.position.y=9.6; ws.add(sock);
  var sk=new T.Mesh(cyl(.85,.3,4.4,14,true),std(0xffffff,{map:st,r:.8,m:0,side:T.DoubleSide,e:'#ff6a1a',ei:.15})); sk.position.x=2.3; sk.rotation.z=Math.PI/2; sock.add(sk); L.tick.push(function(t){ sock.rotation.y=.6+Math.sin(t*.4)*.5; sk.rotation.x=Math.sin(t*3)*.08; }); }

/* ================= модуль 1 (12.11.2026, вариант А): большой экран читает вопрос, трое ворот с ответами, влетаешь дроном в правильные =================
   Материал задания экран показывает и читает голосом, потом идут вопросы. Вопросы и ответы - из заданий модуля (zadaniya), зачёт шага - через VZ_KURS_INFO.step.
   Управление - как в свободном полёте: клавиатура, пульт RadioMaster по USB, стики на телефоне. */
function wrapL(x,t,mw){ var ws=String(t).split(' '), ln='', L2=[]; ws.forEach(function(w){ var tt=ln?ln+' '+w:w; if(x.measureText(tt).width>mw&&ln){ L2.push(ln); ln=w; } else ln=tt; }); L2.push(ln); return L2; }
/* текст в рамку: подбираем кегль, чтобы влез */
function fitText(x,t,cx,cy,mw,mh,max,min,wt){ var fs=max, L2; for(;fs>=min;fs-=3){ font(x,fs,wt); L2=wrapL(x,t,mw); if(L2.length*fs*1.24<=mh) break; } var lh=fs*1.24, y=cy-(L2.length-1)*lh/2; L2.forEach(function(l,i){ x.fillText(l,cx,y+i*lh); }); return fs; }
/* дрон для своего полёта: карбоновая рама, моторы с колоколами, трёхлопастные винты, камера, АКБ с ремешком, антенны, огни */
function droneHQ(col,sc){ var g=new T.Group(), b=new T.Group(); g.add(b); b.scale.setScalar(sc||1);
  var wv=ctex(function(x,w){ x.fillStyle='#17191f'; x.fillRect(0,0,w,w); for(var i=0;i<8;i++) for(var j=0;j<8;j++){ x.fillStyle=(i+j)%2?'rgba(255,255,255,.07)':'rgba(0,0,0,.25)'; x.fillRect(i*w/8,j*w/8,w/8,w/8); } },64); wv.wrapS=wv.wrapT=T.RepeatWrapping; wv.repeat.set(3,3);
  var cb=new T.MeshStandardMaterial({color:0x8d939e,map:wv,roughness:.42,metalness:.3,envMapIntensity:.55}), al=std(col,{r:.3,m:.65,env:.8,e:col,ei:.3}), blk=std(0x0c0d11,{r:.5,m:.25}), stl=std(0xc9ced8,{r:.25,m:.95,env:1.3}), tpu=std(col,{r:.7,m:0,e:col,ei:.1});
  M(b,rr(.62,.05,1.5,.16),cb,0,0,0); M(b,rr(.56,.05,1.22,.16),cb,0,.31,0); M(b,rr(.4,.04,.5,.08),cb,0,.05,0);
  var props=[], MP=[[1,1],[1,-1],[-1,1],[-1,-1]], bladeG=box(.62,.012,.14); bladeG.translate(.36,0,0);
  var disc=ctex(function(x,s){ var c=s/2, gr=x.createRadialGradient(c,c,c*.12,c,c,c); gr.addColorStop(0,'rgba(220,235,255,.02)'); gr.addColorStop(.7,'rgba(220,235,255,.2)'); gr.addColorStop(.96,'rgba(220,235,255,.1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=gr; x.beginPath(); x.arc(c,c,c,0,6.283); x.fill(); },64);
  MP.forEach(function(q,k){ var x=q[0]*.95, z=q[1]*.95, a=Math.atan2(q[0],q[1]);
    M(b,box(.2,.07,1.36),cb,x/2,.0,z/2,{ry:a}); M(b,cyl(.2,.2,.07,18),cb,x,0,z); M(b,box(.05,.02,.9),neon(k<2?col:'#ff3b4e'),x/2,-.045,z/2,{ry:a,ns:1});
    M(b,cyl(.17,.18,.07,18),blk,x,.07,z); M(b,cyl(.19,.19,.15,22),std(0x2b2f3a,{r:.3,m:.9,env:1}),x,.18,z); M(b,cyl(.195,.195,.035,22),al,x,.14,z); M(b,cyl(.11,.17,.05,18),blk,x,.28,z); M(b,cyl(.03,.03,.14,8),stl,x,.36,z); M(b,cyl(.07,.09,.06,10),tpu,x,-.07,z);
    var pg=new T.Group(); pg.position.set(x,.41,z); b.add(pg); M(pg,cyl(.06,.05,.07,10),stl,0,0,0); var pm=std(col,{r:.4,m:0,env:.4,e:col,ei:.25,op:.9});
    [0,1,2].forEach(function(j){ var bl=new T.Mesh(bladeG,pm); bl.rotation.set(.28*(k%3?1:-1),j*2.094,0,'YXZ'); pg.add(bl); });
    var dc=new T.Mesh(new T.CircleGeometry(.7,24),new T.MeshBasicMaterial({map:disc,transparent:true,depthWrite:false,side:T.DoubleSide})); dc.rotation.x=-Math.PI/2; dc.position.y=.01; pg.add(dc); props.push(dc,pg); });
  [[.23,-.52],[-.23,-.52],[.23,.0],[-.23,.0],[.23,.5],[-.23,.5]].forEach(function(q){ M(b,cyl(.034,.034,.27,8),al,q[0],.165,q[1]); });
  M(b,rr(.34,.05,.34,.04),std(0x1c5a3a,{r:.5,m:.2}),0,.09,-.05); M(b,rr(.34,.05,.34,.04),std(0x1a1d24,{r:.4,m:.3}),0,.17,-.05); M(b,cyl(.055,.055,.2,10),blk,0,.2,-.42,{rz:Math.PI/2});
  /* камера впереди в боковых пластинах */
  [-1,1].forEach(function(sx){ M(b,box(.03,.3,.34),al,sx*.17,.19,.7); }); var cam=new T.Group(); cam.position.set(0,.2,.74); cam.rotation.x=-.45; b.add(cam); M(cam,rr(.27,.24,.2,.04),blk,0,-.12,0); M(cam,cyl(.09,.1,.12,16),blk,0,0,.14,{rx:Math.PI/2}); M(cam,new T.SphereGeometry(.075,16,12),std(0x1b2c55,{r:.02,m:1,env:2.2}),0,0,.19);
  /* аккумулятор сверху с ремешком и наклейкой */
  var lb=ctex(function(x,w,h){ x.fillStyle='#16181d'; x.fillRect(0,0,w,h); x.fillStyle='#ffd21f'; x.fillRect(0,h*.14,w,h*.3); font(x,h*.22); x.fillStyle='#16181d'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('LiPo 4S 850',w/2,h*.3); x.fillStyle='#ffffff'; font(x,h*.16,'700'); x.fillText('ВЗЛЁТ',w/2,h*.72); },128,256);
  var bat=M(b,rr(.42,.3,.98,.07),[blk,blk,new T.MeshStandardMaterial({map:lb,roughness:.45,metalness:.1}),blk,blk,blk][0],0,.36,-.04); var bl2=new T.Mesh(new T.PlaneGeometry(.36,.9),new T.MeshStandardMaterial({map:lb,roughness:.45,metalness:.1})); bl2.rotation.x=-Math.PI/2; bl2.position.set(0,.665,-.04); b.add(bl2);
  M(b,box(.46,.32,.17),std(0x24262c,{r:.8,m:0}),0,.36,.02); M(b,box(.2,.02,.175),neon(col),0,.675,.02); M(b,rr(.13,.1,.18,.02),std(0xffc21a,{r:.5,m:0}),0,.34,-.66); M(b,cyl(.025,.025,.2,6),std(0xc22a2a,{r:.6}),.04,.42,-.56,{rx:.9}); M(b,cyl(.025,.025,.2,6),blk,-.04,.42,-.56,{rx:.9});
  /* антенны и огни */
  M(b,cyl(.018,.018,.5,6),blk,0,.5,-.86,{rx:-.7}); M(b,cyl(.07,.07,.13,14),std(0xf2f4f8,{r:.4,m:.05}),0,.7,-1.03,{rx:-.7}); [-1,1].forEach(function(sx){ M(b,cyl(.01,.01,.34,5),blk,sx*.36,.12,-.74,{rz:sx*.9,rx:-.5}); });
  M(b,box(.42,.05,.03),neon('#ff3b4e'),0,.14,-.77,{ns:1}); M(b,box(.1,.03,.03),neon('#ffffff'),.14,.08,.76,{ns:1}); M(b,box(.1,.03,.03),neon('#ffffff'),-.14,.08,.76,{ns:1});
  var lt=glow(b,'#ff3b4e',.9,0,.14,-.84,.9); glow(b,'#ffffff',.6,0,.1,.82,.6);
  return {g:g,props:props,lt:lt,body:b}; }
K.flyDrone=function(){ var d=droneHQ('#7cf3ff',1.45); if(SHD) d.g.traverse(function(o){ if(o.isMesh&&o.castShadow) o.receiveShadow=false; }); return d; };
/* --- арена: экран, ворота, разметка --- */
var KV=null; /* всё про арену и текущий полёт */
var GZ=-104, GX=[-20,0,20], GW=14, GH=9.5, LINE=-58, PR=7.6, LET=['А','Б','В'], GCOL=['#ff8fd8','#7cf3ff','#ffd36e'];
function arenaKviz(L,G,c,B,o){ o=o||{}; var MODE=o.mode||'gate', AC=o.col||'#7cf3ff'; GZ=o.GZ||-104; GX=o.GX||[-20,0,20]; LINE=o.LINE||-58; var fr=std(0x12151e,{r:.3,m:.8}), dk=B.dark, i;
  if(MODE==='gate'){
  /* разметка поля */
  decal(G,ctex(function(x,w,h){ x.strokeStyle='#ffffff'; x.lineWidth=7; rrect(x,6,6,w-12,h-12,30); x.stroke(); x.lineWidth=5; x.setLineDash([20,14]); var ly=h*((LINE+150)/118); x.beginPath(); x.moveTo(10,ly); x.lineTo(w-10,ly); x.stroke(); x.setLineDash([]); font(x,h*.022); x.fillStyle='#ffffff'; x.textAlign='center'; x.fillText('ЛИНИЯ СТАРТА - ЗДЕСЬ СЛУШАЕМ ВОПРОС',w/2,ly+h*.032); },512,944),64,118,0,-91,0,.85,.035);
  }
  if(MODE!=='land') GX.forEach(function(gx,k){ decal(G,ctex(function(x,w,h){ var g2=x.createLinearGradient(0,0,0,h); g2.addColorStop(0,GCOL[k]); g2.addColorStop(1,'rgba(0,0,0,0)'); x.globalAlpha=.5; x.fillStyle=g2; x.fillRect(0,0,w,h); x.globalAlpha=1; font(x,w*.6); x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(LET[k],w/2,h*.22); x.fillStyle='rgba(255,255,255,.7)'; for(var j=0;j<3;j++){ x.beginPath(); x.moveTo(w/2,h*(.44+j*.16)); x.lineTo(w*.72,h*(.54+j*.16)); x.lineTo(w*.28,h*(.54+j*.16)); x.fill(); } },128,384),GW-2,36,gx,GZ+21,0,.85,.04); });
  if(MODE==='gate'){
  /* оформление поля: бортики с огнями и надписями, огни по краю, взлётная площадка, конусы у линии, осевые огни */
  var eL=[], cL=[], z; for(z=-34;z>=-148;z-=6){ eL.push([-32,.18,z],[32,.18,z]); } for(z=-40;z>=GZ+8;z-=8) if(Math.abs(z-LINE)>3) cL.push([0,.1,z]); lights(G,eL,'#7cf3ff',.2); lights(G,cL,'#ffffff',.14);
  var bm=std(0x161b2a,{r:.35,m:.7}), BT=['ШКОЛА FPV','ВЗЛЁТ','ЛЕТАЙ БЕЗОПАСНО','СЛУШАЙ ВОПРОС','ВЫБИРАЙ ВОРОТА'];
  [-1,1].forEach(function(sx){ for(var j=0;j<5;j++){ var bz=-44-j*22, bx=sx*36.5; M(G,rr(.7,2.3,18,.3),bm,bx,0,bz); M(G,box(.12,.12,18),neon(GCOL[j%3]),bx-sx*.42,2.32,bz); sign(G,BT[(j+(sx>0?2:0))%5],{w:16.4,h:1.7,x:bx-sx*.44,y:1.2,z:bz,ry:-sx*Math.PI/2,col:GCOL[j%3]}); M(G,cyl(.16,.16,2.6,8),bm,bx,1.3,bz+10.4); glow(G,GCOL[j%3],1.6,bx,2.9,bz+10.4,.8); } });
  var padG=new T.Group(); padG.position.set(0,0,-30); G.add(padG); M(padG,cyl(4.2,4.6,.3,6),std(0x1a2030,{r:.45,m:.6}),0,0,0); M(padG,new T.TorusGeometry(3.6,.1,6,48),neon('#ffd36e'),0,.37,0,{rx:Math.PI/2}); M(padG,new T.TorusGeometry(2.1,.07,6,40),neon('#7cf3ff'),0,.37,0,{rx:Math.PI/2}); for(i=0;i<6;i++){ var pa=i*Math.PI/3+Math.PI/6; M(padG,cyl(.18,.26,.4,8),bm,Math.cos(pa)*4.4,.1,Math.sin(pa)*4.4); glow(padG,'#ffd36e',.7,Math.cos(pa)*4.4,.6,Math.sin(pa)*4.4,.6); }
  var cn0=[]; for(i=-30;i<=30;i+=6) if(i) cn0.push([i,0,LINE,0,1]); inst(G,cyl(.08,.5,1.3,10),std(0xff6a2a,{r:.6,m:0}),cn0.map(function(q){ return [q[0],.65,q[2]]; })); inst(G,cyl(.22,.28,.14,10),std(0xf4f6fa,{r:.6,m:0}),cn0.map(function(q){ return [q[0],.78,q[2]]; }),false);
  [[-36.5,-30],[36.5,-30],[-36.5,-152],[36.5,-152]].forEach(function(q){ mast(L,G,q[0],q[1],17,'#fff3d6',q[0]<0?.7:-.7); });
  }
  if(MODE==='race'){ var rl=[], rc=[]; for(var rz=(o.SZ||-43)-6;rz>=GZ-10;rz-=6){ rl.push([-32,.18,rz],[32,.18,rz]); if(rz>GZ+40) rc.push([0,.1,rz]); } lights(G,rl,AC,.2); lights(G,rc,'#ffffff',.14);
    [-1,1].forEach(function(sx){ for(var j=0;j<3;j++){ var bz=-62-j*22, bx=sx*36.5; M(G,rr(.7,2.3,18,.3),fr,bx,0,bz); M(G,box(.12,.12,18),neon(GCOL[j%3]),bx-sx*.42,2.32,bz); sign(G,['ВРЕМЯ ИДЁТ','АРЕНА АСА','ОШИБКА +5 СЕК'][(j+(sx>0?1:0))%3],{w:16.4,h:1.7,x:bx-sx*.44,y:1.2,z:bz,ry:-sx*Math.PI/2,col:GCOL[j%3]}); } }); }
  /* большой экран на двух опорах, по бокам колонки */
  var TW=o.TW||64, TH=TW*28/64, TY=o.TY||33, TZ=o.TZ||-152, tvG=new T.Group(); tvG.position.set(0,TY,TZ); G.add(tvG);
  var cn=document.createElement('canvas'); cn.width=1280; cn.height=556; var tx=new T.CanvasTexture(cn); tx.anisotropy=8;
  M(tvG,rr(TW+2.4,TH+2.4,1.8,.6),fr,0,-TH/2-1.2,-1.1); var sp=new T.Mesh(new T.PlaneGeometry(TW,TH),new T.MeshBasicMaterial({map:tx,toneMapped:false})); sp.position.z=.06; tvG.add(sp);
  M(tvG,box(TW+2.6,.22,.22),neon(AC),0,-TH/2-1.05,.1); M(tvG,box(TW+2.6,.22,.22),neon(AC),0,TH/2+1.05,.1);
  [-1,1].forEach(function(sx){ var cx=sx*(TW/2+3.4); M(tvG,rr(3.4,TH,1.8,.5),fr,cx,-TH/2,-1); for(var j=0;j<5;j++){ M(tvG,cyl(1.1,1.1,.3,24),std(0x2a2f3d,{r:.5,m:.4}),cx,-TH/2+2.4+j*(TH-4.8)/4,-.02,{rx:Math.PI/2}); M(tvG,new T.TorusGeometry(1.12,.07,6,28),neon(GCOL[(j+1)%3]),cx,-TH/2+2.4+j*(TH-4.8)/4,.14); M(tvG,cyl(.45,.45,.34,16),std(0x0c0d11,{r:.3,m:.6}),cx,-TH/2+2.4+j*(TH-4.8)/4,.0,{rx:Math.PI/2}); }
    M(G,rr(2.6,TY-TH/2-.8,2.6,.5),fr,sx*22,0,TZ-1.4); M(G,box(.2,TY-TH/2-1.6,.2),neon(AC),sx*22,(TY-TH/2-.8)/2,TZ-.02); M(G,rr(8,.7,8,.8),dk,sx*22,0,TZ-1.4); M(G,box(1.2,TY*.9,1.2),fr,sx*22,TY*.36,TZ-7.4,{rx:.42}); });
  for(i=0;i<9;i++){ M(tvG,rr(1.6,.9,1.3,.25),fr,(-28+i*7)*TW/64,TH/2+1.5,.3); M(tvG,box(1.1,.5,.06),neon('#fff3d6'),(-28+i*7)*TW/64,TH/2+1.95,1); }
  glow(tvG,AC,70,0,0,4,.14); sign(G,o.name||'ШКОЛА FPV',{w:20,h:3.6,x:0,y:TY+TH/2+6,z:TZ+.4,col:'#ffd36e'});
  /* посадочные площадки с табло ответа (модуль 4) */
  var gates=MODE==='land'?GX.map(function(gx,k){ var g=new T.Group(); g.position.set(gx,0,GZ); G.add(g); var nm=neon(GCOL[k]);
    decal(g,ctex(function(x,w){ var cc=w/2; x.fillStyle='rgba(12,16,26,.96)'; x.beginPath(); x.arc(cc,cc,w*.49,0,6.283); x.fill(); x.strokeStyle=GCOL[k]; x.lineWidth=w*.035; x.beginPath(); x.arc(cc,cc,w*.45,0,6.283); x.stroke(); x.strokeStyle='#ffffff'; x.lineWidth=w*.012; x.setLineDash([w*.05,w*.035]); x.beginPath(); x.arc(cc,cc,w*.36,0,6.283); x.stroke(); x.setLineDash([]); font(x,w*.42); x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(LET[k],cc,cc*1.06); },256),PR*2+1.4,PR*2+1.4,0,0,0,1,.14).renderOrder=3;
    var port=new T.Mesh(new T.CircleGeometry(PR,40),new T.MeshBasicMaterial({color:GCOL[k],transparent:true,opacity:.12,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending})); port.rotation.x=-Math.PI/2; port.position.y=.2; port.renderOrder=4; g.add(port);
    var pl=[]; for(var j=0;j<12;j++){ var a2=j/12*6.283; pl.push([Math.cos(a2)*(PR+.5),.2,Math.sin(a2)*(PR+.5)]); } lights(g,pl,GCOL[k],.2);
    var lc=document.createElement('canvas'); lc.width=768; lc.height=Math.round(768*3.9/(GW+2.2)); var lt=new T.CanvasTexture(lc); lt.anisotropy=8;
    var bd=new T.Group(); bd.position.set(0,7.4,-PR-4); bd.rotation.x=.12; g.add(bd); M(bd,rr(GW+3,4.6,.8,.3),fr,0,-2.3,-.5); var lp=new T.Mesh(new T.PlaneGeometry(GW+2.2,3.9),new T.MeshBasicMaterial({map:lt,toneMapped:false})); lp.position.z=.42; bd.add(lp); M(bd,box(GW+3,.14,.14),nm,0,2.36,.4);
    [-1,1].forEach(function(sx){ M(g,cyl(.22,.3,6,10),fr,sx*(GW/2-1),3,-PR-4.6); M(g,rr(2,.4,2,.4),dk,sx*(GW/2-1),0,-PR-4.6); });
    return {g:g,port:port,pt:{offset:{y:0}},cv:lc,tex:lt,col:GCOL[k],fx:0,fc:null,o0:.12}; }):
  /* трое ворот с табло ответа */
  GX.map(function(gx,k){ var g=new T.Group(); g.position.set(gx,0,GZ); G.add(g); var nm=neon(GCOL[k]);
    [-1,1].forEach(function(sx){ M(g,rr(1.3,GH+.9,1.3,.4),fr,sx*(GW/2+.65),0,0); M(g,rr(3.2,.45,3.2,.5),dk,sx*(GW/2+.65),0,0); [-1,1].forEach(function(sz){ M(g,box(.14,GH,.14),nm,sx*(GW/2-.12),GH/2+.1,sz*.75,{ns:1}); }); glow(g,GCOL[k],3.4,sx*(GW/2+.65),GH+5.3,0,.9); M(g,cyl(.12,.16,.6,8),fr,sx*(GW/2+.65),GH+4.9,0); });
    M(g,rr(GW+2.6,4.4,1.5,.4),fr,0,GH+.3,0); [-1,1].forEach(function(sz){ M(g,box(GW,.14,.14),nm,0,GH+.12,sz*.75,{ns:1}); });
    var pt=ctex(function(x,w,h){ x.clearRect(0,0,w,h); for(var y=0;y<h;y+=8){ x.fillStyle='rgba(255,255,255,'+(.18+.5*(y%32===0))+')'; x.fillRect(0,y,w,2); } },8,64); pt.wrapT=T.RepeatWrapping; pt.repeat.set(1,3);
    var port=new T.Mesh(new T.PlaneGeometry(GW-.3,GH),new T.MeshBasicMaterial({map:pt,color:GCOL[k],transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending})); port.position.y=GH/2+.1; g.add(port);
    var lc=document.createElement('canvas'); lc.width=768; lc.height=Math.round(768*3.9/(GW+2.2)); var lt=new T.CanvasTexture(lc); lt.anisotropy=8;
    [1,-1].forEach(function(sz){ var p=new T.Mesh(new T.PlaneGeometry(GW+2.2,3.9),new T.MeshBasicMaterial({map:lt,toneMapped:false})); p.position.set(0,GH+2.5,sz*1.0); if(sz<0) p.rotation.y=Math.PI; g.add(p); });
    return {g:g,port:port,pt:pt,cv:lc,tex:lt,col:GCOL[k],fx:0,fc:null}; });
  L.tick.push(function(t,dt){ gates.forEach(function(q,k){ q.pt.offset.y=-t*.25; if(q.fx>0){ q.fx-=dt; q.port.material.color.set(q.fc); q.port.material.opacity=.25+.55*Math.max(0,q.fx/1.4); if(q.fx<=0){ q.port.material.color.set(q.col); q.port.material.opacity=q.o0||.22; } } }); });
  var W=MODE==='land'?{how:'садись на площадку с правильным ответом',foot:'Сядь на площадку с правильным ответом или просто нажми на неё',back:'Взлетай и вернись на старт',nm:'Площадка ',miss:'Мимо площадки'}:MODE==='race'?{how:'пролетай стартовую арку и влетай в ворота с правильным ответом. Время идёт!',foot:'Через арку - и в ворота с ответом. Или просто нажми на ворота',back:'Вернись за стартовую арку',nm:'Ворота ',miss:'Мимо ворот'}:{how:'влетай в ворота с правильным ответом.',foot:'Лети в ворота с правильным ответом или просто нажми на них',back:'Развернись и вернись за линию старта',nm:'Ворота ',miss:'Мимо ворот'};
  if(o.start) L.freeP=new T.Vector3(o.start[0],PY+1.4,o.start[1]);
  KV=L.kv={L:L,cn:cn,tx:tx,gates:gates,s:null,mode:MODE,GZ:GZ,GX:GX,LINE:LINE,SZ:o.SZ,W:W,col:AC,name:o.name||'ШКОЛА FPV'}; tvDraw({head:KV.name,title:'Привет, пилот!',text:'Выбери задание слева или нажми "Лететь". Экран расскажет материал и задаст вопросы, а ты '+W.how,foot:'Клавиатура, пульт RadioMaster по USB или стики на телефоне'}); gateText(['','',''],null); L.kviz=1; }
function tvDraw(o){ if(!KV) return; var c=KV.cn.getContext('2d'), w=KV.cn.width, h=KV.cn.height, col=o.col||KV.col||'#7cf3ff', gr=c.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#0c1d40'); gr.addColorStop(1,'#060d1f'); c.fillStyle=gr; c.fillRect(0,0,w,h);
  c.fillStyle=col; c.fillRect(0,0,w,h*.14); font(c,h*.075); c.fillStyle='#061022'; c.textBaseline='middle'; c.textAlign='left'; var hd=o.head||'', mx=w*.93-(o.right?c.measureText(o.right).width:0); if(c.measureText(hd).width>mx){ while(hd.length>4&&c.measureText(hd+'...').width>mx) hd=hd.slice(0,-1); hd=hd.replace(/[\s·-]+$/,'')+'...'; } c.fillText(hd,w*.025,h*.075); c.textAlign='right'; c.fillText(o.right||'',w*.975,h*.075);
  c.textAlign='center'; var top=h*.18, bot=h*(o.foot?.86:.96); if(o.title){ c.fillStyle='#ffd36e'; var fs=fitText(c,o.title,w/2,top+h*.075,w*.92,h*.15,h*.105,h*.06); top+=h*.16; }
  c.fillStyle='#ffffff'; if(o.text) fitText(c,o.text,w/2,(top+bot)/2,w*.92,bot-top-h*.02,o.title?h*.1:h*.145,h*.05,o.title?'700':'900');
  if(o.foot){ c.fillStyle=o.footCol||'#9fe8ff'; font(c,h*.058,'700'); c.fillText(o.foot,w/2,h*.925); } KV.tx.needsUpdate=true; var qe=$('kvQ'); if(qe){ qe.textContent=KV.s?(o.title?o.title+(o.text?(/[.!?]$/.test(o.title)?' ':'. '):''):'')+(o.text||''):''; qe.classList.toggle('on',!!(KV.s&&(E.mob||innerWidth<900))); } }
/* табло над воротами: state[k] - 'ok' зелёное, 'bad' красное, 'off' ворота не участвуют */
function gateText(txt,state){ if(!KV) return; KV.gates.forEach(function(q,k){ var c=q.cv.getContext('2d'), w=q.cv.width, h=q.cv.height, s=state&&state[k], col=s==='ok'?'#39ff8a':s==='bad'?'#ff5a5a':q.col, off=s==='off'||!txt[k];
    c.fillStyle=s==='ok'?'#0b3a22':s==='bad'?'#3a0f14':'#0a1124'; c.fillRect(0,0,w,h); c.globalAlpha=off?.25:1; c.fillStyle=col; c.fillRect(0,0,h,h); font(c,h*.66); c.fillStyle='#0a1124'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(LET[k],h/2,h*.55);
    c.fillStyle='#ffffff'; if(txt[k]) fitText(c,txt[k],h+(w-h)/2,h*.52,(w-h)*.92,h*.9,h*.3,h*.15,'800'); c.globalAlpha=1; q.tex.needsUpdate=true; q.g.visible=true; q.port.visible=!off; }); }
/* звук ответа */
var AC=null; function beep(ok){ try{ if(E.GL&&E.GL.on===false) return; AC=AC||new (window.AudioContext||window.webkitAudioContext)(); var t=AC.currentTime; (ok?[660,880,1320]:[220,165]).forEach(function(f,i){ var o=AC.createOscillator(), g=AC.createGain(); o.type=ok?'sine':'sawtooth'; o.frequency.value=f; g.gain.setValueAtTime(.0001,t+i*.11); g.gain.exponentialRampToValueAtTime(.12,t+i*.11+.02); g.gain.exponentialRampToValueAtTime(.0001,t+i*.11+.22); o.connect(g); g.connect(AC.destination); o.start(t+i*.11); o.stop(t+i*.11+.25); }); }catch(e){} }
function say(t,cb){ var GL=window.GOLOS, done=false, fin=function(){ if(done) return; done=true; cb&&cb(); }; if(GL&&GL.say&&GL.on!==false){ try{ if(GL.say(t,{onend:fin})===false) setTimeout(fin,Math.min(9000,1500+t.length*55)); }catch(e){ setTimeout(fin,1500); } } else setTimeout(fin,Math.min(9000,1800+t.length*60)); }
function hush(){ var GL=window.GOLOS; try{ if(GL&&GL.stop) GL.stop(); }catch(e){} }
function shuf(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function $(id){ return document.getElementById(id); }
function lvl(mid){ try{ var S=window.VZ_KURS_STATE(); return (S.lvl&&S.lvl[mid])||1; }catch(e){ return 1; } }
function lvT(p,lv){ if(p&&typeof p==='object'){ for(var k=lv;k>=1;k--) if(p[k]) return p[k]; for(var q in p) return p[q]; } return p||''; }
function stepDone(tid,i){ try{ var t=window.VZ_KURS_STATE().t[tid]; return !!(t&&t.s&&t.s[i]&&t.s[i].ok); }catch(e){ return false; } }
function modTasks(){ var m=E.K.mods.find(function(x){ return x.id===KV.L.mid; }); return m?m.tasks.filter(function(t){ return E.K.lib[t]; }):[]; }
function taskDone(tid){ return E.I.task(tid)==='done'; }
function pickTask(){ var ts=modTasks(), nx=E.I.next&&E.I.next(); if(nx&&ts.indexOf(nx.t)>=0&&!taskDone(nx.t)) return nx.t; for(var i=0;i<ts.length;i++) if(!taskDone(ts[i])) return ts[i]; return ts[0]; }
/* список заданий слева и кнопки */
function kvUI(){ if($('kvList')) return; var st=document.createElement('style'); st.textContent=
  '#kvList{position:fixed;left:max(16px,env(safe-area-inset-left,0px));top:calc(164px + env(safe-area-inset-top,0px));z-index:5;width:min(300px,62vw);max-height:calc(100vh - 260px);overflow:auto;display:none;padding:10px;border-radius:18px;background:rgba(8,12,28,.82);border:1px solid rgba(124,243,255,.35);backdrop-filter:blur(8px);font:600 14px Manrope,system-ui,sans-serif;color:#fff}'+
  'body.kviz:not(.free) #kvList{display:block} #kvList h3{margin:2px 6px 8px;font:800 13px Manrope,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7cf3ff}'+
  '#kvList button{display:flex;gap:8px;align-items:center;width:100%;min-height:40px;margin:4px 0;padding:6px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:inherit;text-align:left;cursor:pointer}'+
  '#kvList button:hover{background:rgba(124,243,255,.18)} #kvList button.d{border-color:rgba(74,222,128,.6)} #kvList button.n{border-color:#ffd36e;background:rgba(255,211,110,.14)} #kvList b{flex:none;width:22px;height:22px;border-radius:50%;background:#7cf3ff;color:#061022;display:grid;place-items:center;font-size:12px} #kvList button.d b{background:#4ade80}'+
  'body.kviz #labels,body.kviz #leads,body.kviz #guide,body.kviz #arrow,body.kviz #ptr,body.kviz #cap,body.kviz #mb,body.kviz #autoB{opacity:0!important;pointer-events:none!important}'+
  '#kvPick{position:fixed;left:50%;bottom:calc(176px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:7;display:none;gap:10px;align-items:center;flex-direction:row;padding:8px 12px;border-radius:99px;background:rgba(8,14,30,.78);border:1px solid rgba(124,243,255,.3)} body.free #kvPick.on{display:flex} #kvPick span{order:-1;color:#cfe;font:600 12.5px Manrope,system-ui,sans-serif;padding:0 4px}'+
  '#kvPick button{width:52px;height:44px;border-radius:14px;border:0;color:#0a1124;font:900 20px Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)} #kvPick button:active{transform:scale(.94)}'+
  '@media (pointer:coarse){ #kvPick{bottom:calc(58px + env(safe-area-inset-bottom,0px));padding:6px 10px} #kvPick span{display:none} #kvPick button{width:56px;height:42px} }'+
  '#kvQ{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:6;display:none;max-width:min(760px,62vw);padding:9px 18px;border-radius:14px;border:1px solid rgba(124,243,255,.3);background:rgba(8,14,30,.82);color:#fff;font:700 15px/1.3 Manrope,system-ui,sans-serif;text-align:center;pointer-events:none} body.free #kvQ.on{display:block}'+
  '#kvNext{position:fixed;left:calc(50% + 300px);bottom:calc(40px + env(safe-area-inset-bottom,0px));z-index:7;display:none;min-height:46px;padding:0 22px;border-radius:99px;border:0;background:#ffd36e;color:#1a1300;font:800 16px Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(255,211,110,.35)} body.free #kvNext.on{display:block}'+
  '@media (max-width:1040px){ #kvNext{left:50%;transform:translateX(-50%);bottom:calc(176px + env(safe-area-inset-bottom,0px))} }'+
  '@media (pointer:coarse){ #kvNext{bottom:auto;left:auto;transform:none;right:max(12px,env(safe-area-inset-right,0px));top:calc(64px + env(safe-area-inset-top,0px));min-height:42px;padding:0 16px;font-size:14px} #kvQ{top:auto;bottom:calc(8px + env(safe-area-inset-bottom,0px));max-width:44vw;font-size:12px} }';
  document.head.appendChild(st); var d=document.createElement('div'); d.id='kvList'; document.body.appendChild(d); var nb=document.createElement('button'); nb.id='kvNext'; nb.type='button'; nb.textContent='Дальше ▶'; document.body.appendChild(nb); nb.onclick=function(){ kvKey(); }; var qe=document.createElement('div'); qe.id='kvQ'; document.body.appendChild(qe); var pk=document.createElement('div'); pk.id='kvPick'; pk.innerHTML='<span>Не хочешь лететь сам? Нажми ответ:</span>'; LET.forEach(function(l,k){ var b=document.createElement('button'); b.type='button'; b.textContent=l; b.style.background=GCOL[k]; b.onclick=function(){ K.pick(k); b.blur(); }; pk.insertBefore(b,pk.lastChild); }); document.body.appendChild(pk); kvTap();
  addEventListener('keydown',function(e){ if(KV&&KV.s&&(e.code==='Enter'||e.code==='Space')){ e.preventDefault(); kvKey(); } else if(KV&&KV.s&&/^(Digit|Numpad)[123]$/.test(e.code)) K.pick(+e.code.slice(-1)-1); },true); }
function kvList(){ var d=$('kvList'); if(!d||!KV) return; var ts=modTasks(), nx=pickTask(); d.innerHTML='<h3>Задания модуля</h3>'; ts.forEach(function(tid,k){ var b=document.createElement('button'), dn=taskDone(tid); b.className=dn?'d':tid===nx?'n':''; b.innerHTML='<b>'+(dn?'✓':(k+1))+'</b><span></span>'; b.lastChild.textContent=E.K.lib[tid].t+(tid===nx&&!dn?' - лететь':''); b.onclick=function(){ KV.want=tid; E.free.start(); }; d.appendChild(b); }); }
function kvLevel(L){ if(L&&L.kv){ KV=L.kv; GZ=KV.GZ; GX=KV.GX; LINE=KV.LINE; } if(!KV) return; var on=!!(L&&L.kviz); document.body.classList.toggle('kviz',on); if(!on) return; kvUI(); kvList(); var fb=$('flyB'); if(fb) fb.textContent='🚁 Лететь отвечать';
  if(!L.kvHid){ L.kvHid=1; L.threads.forEach(function(q){ q.ln.visible=false; }); L.pulses.forEach(function(q){ q.sx=q.sy=0; q.sp.scale.set(0,0,0); }); if(L.gd) L.gd.g.visible=false; L.tick.push(function(){ for(var i=0;i<L.nodes.length;i++){ var n=L.nodes[i]; if(n.g.visible){ for(var k in n){ var o=n[k]; if(o&&o.isObject3D&&o!==L.g) o.visible=false; } } } }); } }
/* --- ход полёта --- */
function kvHud(t){ var e=$('fhG'); if(e) e.textContent=t||''; }
function kvNextBtn(on,txt){ var b=$('kvNext'); if(!b) return; b.classList.toggle('on',!!on); if(txt) b.textContent=txt; }
K.flyStart=function(L,f){ if(!L||!L.kviz||!KV) return; var tid=KV.want||pickTask(); KV.want=null; KV.s={tid:tid,i:-1,z0:f.p.z,ph:''}; var h=document.querySelector('#fh b'); if(h){ KV.h0=h.textContent; h.textContent='Полёт с вопросами'; } kvStep(); };
K.flyStop=function(L){ if(!KV||!KV.s) return; KV.s=null; var pk0=$('kvPick'); if(pk0){ pk0._on=false; pk0.classList.remove('on'); } hush(); kvNextBtn(false); kvHud(''); var h=document.querySelector('#fh b'); if(h&&KV.h0) h.textContent=KV.h0; gateText(['','',''],null); tvDraw({head:KV.name,title:'Отдохни и возвращайся',text:'Выбери задание слева или нажми "Лететь отвечать".'}); try{ E.refresh(); }catch(e){} kvList(); if(KV.after){ var a=KV.after; KV.after=null; setTimeout(a,900); } };
/* следующий шаг задания */
function kvStep(){ var s=KV.s; if(!s) return; var T0=E.K.lib[s.tid], n=modTasks().indexOf(s.tid)+1; s.i++; while(s.i<T0.steps.length&&stepDone(s.tid,s.i)&&!s.again) s.i++;
  if(s.i>=T0.steps.length){ kvTaskEnd(); return; } var st=T0.steps[s.i], lv=lvl(KV.L.mid); s.head='ЗАДАНИЕ '+n+' · '+T0.t; s.st=st; s.q=null; s.armed=false; s.wait=false; kvNextBtn(false);
  if(st.s==='cards'){ s.ph='cards'; s.c=0; gateText(['','',''],null); kvCard(); }
  else if(st.s==='quiz'){ s.ph='quiz'; var qs=[]; try{ qs=window.VZ_KURS_GEN.buildQs(st,false,lv)||[]; }catch(e){} s.items=qs.map(function(q){ var o=shuf(q.a.map(function(a,k){ return {a:a,ok:k===0}; })).slice(0,3); return {q:q.q,e:q.e,o:o,tr:0}; }); s.n=s.items.length; s.ok=0; if(!s.n){ E.I.step(s.tid,s.i,{}); kvStep(); return; } kvAsk(); }
  else if(st.s==='game'&&st.g==='sort'&&st.cats&&st.cats.length<=3){ s.ph='sort'; var it=st.items.filter(function(x){ return x[0]<=lv; }); if(!it.length) it=st.items; it=shuf(it).slice(0,8); var pos=st.cats.length===2?[0,2]:[0,1,2];
    s.cats=st.cats; s.items=it.map(function(x){ var o=[null,null,null]; st.cats.forEach(function(c2,k){ o[pos[k]]={a:c2[0]+' '+c2[1],ok:k===x[2]}; }); return {q:x[1],e:x[3],o:o,tr:0,sort:1}; }); s.n=s.items.length; s.ok=0; kvAsk(); }
  else { /* шаг не для полёта (порядок действий, рассказ с ошибками, запись результата, тренер) - в обычном окне задания */ s.ph='win'; gateText(['','',''],null); var tid=s.tid; tvDraw({head:s.head,title:st.h||'Следующий шаг',text:'Этот шаг делаем в окне задания. Сейчас оно откроется.'}); KV.after=function(){ if(window.KURS_OPEN_TASK) window.KURS_OPEN_TASK(tid); }; setTimeout(function(){ if(KV.s&&KV.s.ph==='win') E.free.stop(); },1600); } }
function kvCard(){ var s=KV.s, cs=s.st.cards, cd=cs[s.c], lv=lvl(KV.L.mid), p=lvT(cd.p,lv); s.wait=true; tvDraw({head:s.head,right:'Материал '+(s.c+1)+' из '+cs.length,title:cd.h,text:p,foot:'Послушай. Дальше - кнопка "Дальше" или Enter. Пока можно полетать'}); kvHud('Материал '+(s.c+1)+' из '+cs.length); kvNextBtn(true,s.c<cs.length-1?'Дальше ▶':'Понятно, к вопросам ▶'); var c0=s.c, tid=s.tid; say(cd.h+'. '+p,function(){}); }
function kvKey(){ var s=KV&&KV.s; if(!s) return; if(s.ph==='cards'){ hush(); s.c++; if(s.c>=s.st.cards.length){ E.I.step(s.tid,s.i,{}); kvStep(); } else kvCard(); } else if(s.ph==='end'&&s.nextT){ var t=s.nextT; KV.s={tid:t,i:-1,ph:''}; kvStep(); } }
function kvAsk(){ var s=KV.s; if(!s) return; if(!s.items.length){ E.I.step(s.tid,s.i,{lv:lvl(KV.L.mid)}); beep(true); kvStep(); return; } var q=s.items[0]; s.q=q; s.armed=false; s.ready=true; kvHud((s.ph==='sort'?'Тренажёр ':'Вопрос ')+(s.n-s.items.length+1)+' из '+s.n);
  tvDraw({head:s.head,right:(s.ph==='sort'?'Тренажёр ':'Вопрос ')+(s.n-s.items.length+1)+' из '+s.n,title:s.ph==='sort'?(s.st.h||'Куда это?'):'',text:q.q,foot:KV.W.foot}); gateText(q.o.map(function(o){ return o?o.a:''; }),q.o.map(function(o){ return o?null:'off'; }));
  var txt=q.q+' '+q.o.map(function(o,k){ return o?KV.W.nm+LET[k]+': '+o.a.replace(/^[^\wа-яё]+/i,'')+'.':''; }).join(' '); hush(); say(txt,function(){}); }
function kvAnswer(k){ var s=KV.s, q=s.q, o=q.o[k]; if(!o) return; hush(); s.armed=false; s.ready=false; s.back=true; var g=KV.gates[k], st=q.o.map(function(x,j){ return !x?'off':x.ok?'ok':j===k?'bad':null; });
  var tm=''; if(KV.mode==='race'&&s.t0){ var sec=(performance.now()-s.t0)/1000+(o.ok?0:5); s.time=(s.time||0)+sec; s.t0=null; tm=' Время: '+sec.toFixed(1).replace('.',',')+' с'+(o.ok?'.':' (штраф 5 с).'); }
  g.fx=1.4; g.fc=o.ok?'#39ff8a':'#ff4d4d'; beep(o.ok); gateText(q.o.map(function(x){ return x?x.a:''; }),st); s.items.shift();
  if(o.ok){ s.ok++; tvDraw({head:s.head,col:'#39ff8a',title:'Верно!',text:(q.e||'Так держать.')+tm,foot:KV.W.back,footCol:'#b9ffd6'}); say('Верно! '+(q.e||''),function(){}); }
  else { q.tr++; s.items.push(q); q.o=q.sort?q.o:shuf(q.o); tvDraw({head:s.head,col:'#ff6b6b',title:'Не так',text:(q.e||'Правильный ответ горит зелёным.')+tm,foot:KV.W.back+' - вопрос будет ещё раз',footCol:'#ffd0d0'}); say('Не так. '+(q.e||''),function(){}); } }
function kvTaskEnd(){ var s=KV.s, ts=modTasks(), nx=null; try{ E.refresh(); }catch(e){} kvList(); for(var i=0;i<ts.length;i++) if(!taskDone(ts[i])&&ts[i]!==s.tid){ nx=ts[i]; break; } s.ph='end'; s.nextT=nx; gateText(['','',''],null); beep(true);
  var rc=''; if(KV.mode==='race'&&s.time){ var bk='kursy_fpv_krug_'+s.tid, best=0; try{ best=+localStorage.getItem(bk)||0; if(!best||s.time<best){ localStorage.setItem(bk,String(s.time)); rc=' Новый рекорд!'; } }catch(e){} rc='Твоё время: '+s.time.toFixed(1).replace('.',',')+' с.'+(best&&!rc?' Рекорд: '+best.toFixed(1).replace('.',',')+' с.':rc)+' '; }
  var dn=taskDone(s.tid); tvDraw({head:s.head,col:'#ffd36e',title:dn?'Задание пройдено! ★':'Шаг пройден',text:rc+(nx?'Следующее: '+E.K.lib[nx].t:'Все задания модуля пройдены. Ты молодец!'),foot:nx?'Кнопка "Следующее задание" или Enter':'Esc - выйти из полёта'}); kvHud(dn?'Задание пройдено':''); kvNextBtn(!!nx,'Следующее задание ▶'); say(dn?'Задание пройдено! Отлично.':'Шаг пройден.',function(){}); }
/* каждый кадр полёта: пересёк ли дрон ворота, вернулся ли за линию */
K.flyStep=function(L,f,dt){ var s=KV&&KV.s; if(!s||L!==KV.L) return; var z=f.p.z, z0=s.z0==null?z:s.z0; s.z0=z;
  var pk=$('kvPick'); if(pk){ var po=!!(s.ready&&!s.auto&&(s.ph==='quiz'||s.ph==='sort')); if(pk._on!==po){ pk._on=po; pk.classList.toggle('on',po); } if(po&&pk._q!==s.q){ pk._q=s.q; for(var pi=0;pi<3;pi++) pk.children[pi].style.visibility=s.q.o[pi]?'visible':'hidden'; } }
  if(s.auto){ kvAuto(f,dt); return; }
  if(s.ph!=='quiz'&&s.ph!=='sort') return;
  if(s.back){ if(z>LINE){ s.back=false; kvAsk(); } return; }
  if(KV.mode==='land'){ if(!s.ready) return; var yl=f.p.y-PY, hp=-1; for(var k2=0;k2<3;k2++) if(Math.hypot(f.p.x-GX[k2],z-GZ)<PR) hp=k2; if(hp>=0&&yl<.8&&f.v.length()<3){ s.lt=(s.lt||0)+dt; if(s.lt>.35){ s.lt=0; if(s.q.o[hp]) kvAnswer(hp); } } else s.lt=0; return; }
  if(KV.mode==='race'){ if(s.ready&&!s.t0&&z0>KV.SZ&&z<=KV.SZ) s.t0=performance.now(); if(s.t0&&s.ready){ s.hud=(s.hud||0)+dt; if(s.hud>.1){ s.hud=0; kvHud('Время: '+((performance.now()-s.t0)/1000).toFixed(1).replace('.',',')+' с'); } } }
  if(s.ready&&!s.armed&&z>GZ+3) s.armed=true;
  if(s.armed&&z0>GZ&&z<=GZ){ var y=f.p.y-PY, hit=-1; for(var k=0;k<3;k++) if(Math.abs(f.p.x-GX[k])<GW/2+.2&&y<GH+.6) hit=k; if(hit>=0&&s.q.o[hit]) kvAnswer(hit); else { s.armed=false; s.back=true; s.t0=null; tvDraw({head:s.head,col:'#ffd36e',title:KV.W.miss,text:s.q.q,foot:KV.W.back+' и попробуй ещё раз'}); } } };

/* быстрый режим (13.11): нажал на ворота, площадку или кнопку А/Б/В - дрон сам резко летит туда с бочкой и возвращается сальто назад */
K.pick=function(k){ var s=KV&&KV.s; if(!s||!s.ready||s.auto||(s.ph!=='quiz'&&s.ph!=='sort')||!s.q||!s.q.o[k]) return false; var f=E.free.get(); if(!f) return false;
  if(KV.mode==='race'&&!s.t0) s.t0=performance.now(); s.auto={k:k,t:0,ph:1,p0:f.p.clone(),h0:f.h}; return true; };
function kvAuto(f,dt){ var s=KV.s, a=s.auto, land=KV.mode==='land', ez=function(u){ return u*u*(3-2*u); }, u, e, rx=0, rz=0;
  var T1=land?new T.Vector3(GX[a.k],PY+.56,GZ):new T.Vector3(GX[a.k],PY+4.6,GZ-7), H=new T.Vector3(0,PY+3,LINE+12); a.t+=dt;
  if(a.ph===1){ u=Math.min(1,a.t/1); e=ez(u); f.p.lerpVectors(a.p0,T1,e); if(land) f.p.y+=Math.sin(Math.PI*u)*7; rz=Math.PI*2*e; rx=.55*Math.sin(Math.PI*u); if(u>=1){ a.ph=2; a.t=0; kvAnswer(a.k); a.ok=s.q&&s.q.o[a.k]&&s.q.o[a.k].ok; } }
  else if(a.ph===2){ u=Math.min(1,a.t/1.1); e=ez(u); f.p.lerpVectors(T1,H,e); f.p.y+=Math.sin(Math.PI*u)*(land?9:17); rx=-Math.PI*2*e; if(u>=1){ a.ph=3; a.t=0; } }
  else { f.p.copy(H); f.p.y+=Math.sin(a.t*3)*.15; if(a.t>(a.ok?1.5:3.2)){ s.auto=null; } }
  var dh=Math.PI-f.h; dh=Math.atan2(Math.sin(dh),Math.cos(dh)); f.h+=dh*Math.min(1,dt*8); f.v.set(0,0,0); f.tilt[0]=f.tilt[1]=0;
  var g=f.d.g; g.position.copy(f.p); g.rotation.set(0,f.h,0); g.rotateX(rx); g.rotateZ(rz); }
function kvTap(){ var cv=E.R.domElement, d0=null, rc=new T.Raycaster(), v2=new T.Vector2();
  cv.addEventListener('pointerdown',function(e){ d0=[e.clientX,e.clientY,performance.now()]; });
  cv.addEventListener('pointerup',function(e){ if(!d0||!KV||!KV.s||!KV.s.ready||KV.s.auto) return; if(Math.hypot(e.clientX-d0[0],e.clientY-d0[1])>12||performance.now()-d0[2]>600) return; var r=cv.getBoundingClientRect(); v2.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)); rc.setFromCamera(v2,E.C);
    var best=-1, bd=1e9; KV.gates.forEach(function(q,k){ var h=rc.intersectObject(q.g,true); if(h.length&&h[0].distance<bd){ bd=h[0].distance; best=k; } }); if(best>=0) K.pick(best); }); }

/* ================= модуль 4: "Аэродром" ================= */
function aero(L,G,c,B){ var AZ=-112, AR=40, zMin=B.zMin, i, a, dk=B.dark, wh=std(0xeef1f6,{r:.45,m:.15}), met=std(0x9aa3b5,{r:.3,m:.85});
  /* вертолётный круг и кольцо рулёжки */
  decal(G,ctex(function(x,w){ var cc=w/2, u=w/100; x.fillStyle='rgba(18,20,26,.9)'; x.beginPath(); x.arc(cc,cc,46*u,0,6.283); x.arc(cc,cc,34*u,0,6.283,true); x.fill();
    x.setLineDash([3*u,2.2*u]); x.strokeStyle='#ffd21f'; x.lineWidth=.5*u; x.beginPath(); x.arc(cc,cc,40*u,0,6.283); x.stroke(); x.setLineDash([]);
    x.fillStyle='rgba(32,48,66,.92)'; x.beginPath(); x.arc(cc,cc,31*u,0,6.283); x.fill(); x.strokeStyle='#ffffff'; x.lineWidth=.9*u; x.beginPath(); x.arc(cc,cc,29.5*u,0,6.283); x.stroke();
    x.strokeStyle='#ffd21f'; x.lineWidth=.6*u; x.beginPath(); x.arc(cc,cc,17*u,0,6.283); x.stroke(); x.strokeStyle='#ffffff'; x.lineWidth=3.2*u; x.lineCap='butt'; x.beginPath(); x.moveTo(cc-7*u,cc-10*u); x.lineTo(cc-7*u,cc+10*u); x.moveTo(cc+7*u,cc-10*u); x.lineTo(cc+7*u,cc+10*u); x.moveTo(cc-7*u,cc); x.lineTo(cc+7*u,cc); x.stroke();
    x.fillStyle='#ffd21f'; [0,1,2,3].forEach(function(k){ x.save(); x.translate(cc,cc); x.rotate(k*Math.PI/2+Math.PI/4); x.beginPath(); x.moveTo(0,-27.5*u); x.lineTo(2*u,-23.5*u); x.lineTo(-2*u,-23.5*u); x.fill(); x.restore(); }); },1024),100,100,0,AZ,0,1);
  decal(G,ctex(function(x,w,h){ font(x,h*.62); x.fillStyle='#f4f6fa'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('АЭРОДРОМ',w/2,h/2); x.fillStyle='#ffd21f'; x.fillRect(w*.04,h*.9,w*.92,h*.05); },1024,160),58,9,-46,-36,0,.92);
  decal(G,ctex(function(x,w){ var cc=w/2; x.strokeStyle='#f4f6fa'; x.lineWidth=w*.012; x.beginPath(); x.arc(cc,cc,w*.46,0,6.283); x.stroke(); for(var k=0;k<36;k++){ var a=k/36*6.283, r1=w*(k%9?(k%3?.43:.41):.36); x.beginPath(); x.moveTo(cc+Math.cos(a)*r1,cc+Math.sin(a)*r1); x.lineTo(cc+Math.cos(a)*w*.46,cc+Math.sin(a)*w*.46); x.stroke(); }
    x.fillStyle='#ffd21f'; [0,1,2,3].forEach(function(k){ x.save(); x.translate(cc,cc); x.rotate(k*Math.PI/2); x.beginPath(); x.moveTo(0,-w*.34); x.lineTo(w*.045,0); x.lineTo(-w*.045,0); x.fill(); x.restore(); }); font(x,w*.09); x.fillStyle='#f4f6fa'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('С',cc,w*.1); x.fillText('Ю',cc,w*.9); x.fillText('В',w*.9,cc); x.fillText('З',w*.1,cc); },512),30,30,46,-14,0,.9);
  var gl=[], bl=[]; for(i=0;i<28;i++){ a=i/28*6.283; gl.push([Math.cos(a)*31.6,.2,AZ+Math.sin(a)*31.6]); } for(i=0;i<40;i++){ a=i/40*6.283; bl.push([Math.cos(a)*46.6,.2,AZ+Math.sin(a)*46.6]); } lights(G,gl,'#39ff8a',.2,2.4); lights(G,bl,'#3d8bff',.18,2);
  /* взлётная полоса справа */
  var RX=66, RWd=20, rz0=50, rz1=zMin+10, rl=rz0-rz1, rzc=(rz0+rz1)/2;
  decal(G,ctex(function(x,w,h){ var u=w/RWd, v=h/rl, k; x.fillStyle='rgba(14,15,19,.93)'; x.fillRect(0,0,w,h); x.fillStyle='#f4f6fa'; x.fillRect(u*.5,0,u*.4,h); x.fillRect(w-u*.9,0,u*.4,h);
    for(k=0;k<8;k++){ x.fillRect(u*(1.8+k*2.15),v*3,u*1.3,v*11); x.fillRect(u*(1.8+k*2.15),h-v*14,u*1.3,v*11); }
    for(var z=38;z<rl-38;z+=14) x.fillRect(w/2-u*.22,v*z,u*.44,v*8);
    [48,h/v-58].forEach(function(zz){ x.fillRect(u*4,v*zz,u*3,v*10); x.fillRect(w-u*7,v*zz,u*3,v*10); });
    font(x,u*7); x.textAlign='center'; x.textBaseline='middle'; x.save(); x.translate(w/2,v*24); x.scale(1,v/u*1.9); x.fillText('04',0,0); x.restore(); x.save(); x.translate(w/2,h-v*24); x.rotate(Math.PI); x.scale(1,v/u*1.9); x.fillText('22',0,0); x.restore(); },256,2048),RWd,rl,RX,rzc,0,1);
  var el=[], th=[], en=[]; for(var z=rz0;z>=rz1;z-=10.5){ el.push([RX-RWd/2-.6,.2,z]); el.push([RX+RWd/2+.6,.2,z]); } for(i=0;i<9;i++){ th.push([RX-8+i*2,.2,rz0+1]); en.push([RX-8+i*2,.2,rz1-1]); } lights(G,el,'#ffffff',.2,2.6); lights(G,th,'#39ff8a',.22,2.6); lights(G,en,'#ff4d4d',.22,2.6);
  var run=glow(G,'#ffffff',5,RX,.4,rz0); L.tick.push(function(t){ var u=(t*.35)%1; run.position.z=rz0-u*rl; run.material.opacity=Math.sin(u*Math.PI); });
  /* огни PAPI слева от полосы */
  ['#ffffff','#ffffff','#ff4d4d','#ff4d4d'].forEach(function(col,k){ var px=RX-RWd/2-3.5-k*2.2; M(G,rr(1.5,.9,1.2,.15),dk,px,.5,rz0-34); M(G,box(1,.4,.06),neon(col),px,.95,rz0-33.38); glow(G,col,3,px,.95,rz0-33.2,.8); });
  /* жёлтые линии рулёжки: от кольца к полосе и к ангарам */
  var yl=ctex(function(x,w,h){ x.fillStyle='rgba(18,20,26,.9)'; x.fillRect(0,0,w,h); x.fillStyle='#ffd21f'; x.fillRect(0,h/2-3,w,6); x.fillRect(0,2,w,2); x.fillRect(0,h-4,w,2); },64,64);
  decal(G,yl,RX-RWd/2-46,6,(46+RX-RWd/2)/2,AZ,0,1); decal(G,yl,10,6,-51,AZ,0,1);
  /* диспетчерская вышка */
  var tw=new T.Group(); tw.position.set(-66,0,-58); G.add(tw); M(tw,rr(13,5,13,1.2),std(0xdfe4ec,{r:.55,m:.1}),0,0,0); M(tw,box(13.2,.14,13.2),neon(c),0,4.2,0);
  M(tw,cyl(2.7,3.5,24,24),wh,0,17,0); [9,15,21].forEach(function(y){ M(tw,cyl(3.5-(y-5)/24*.8+.07,3.5-(y-5)/24*.8+.07,.3,24),neon('#3d8bff'),0,y,0); });
  var cabP=[[4.6,0],[6.8,5.2]].map(function(p){ return new T.Vector2(p[0],p[1]); }); M(tw,cyl(5,3,1.6,24),std(0x2a3044,{r:.4,m:.7}),0,29.4,0);
  var cab=new T.Mesh(new T.LatheGeometry(cabP,28),std(0x9fd8ff,{r:.03,m:.9,op:.32,side:T.DoubleSide,env:1.6})); cab.position.y=30.2; tw.add(cab);
  for(i=0;i<10;i++){ a=i/10*6.283; var ml=M(tw,box(.16,5.5,.16),dk,Math.cos(a)*5.7,32.8,Math.sin(a)*5.7); ml.rotation.y=-a; ml.rotation.z=-.4; ml.rotation.order='YXZ'; }
  M(tw,cyl(4.5,4.5,.2,24),std(0x3a4152,{r:.6,m:.3}),0,30.3,0); M(tw,cyl(7.4,7,.6,28),std(0x2a3044,{r:.4,m:.7}),0,35.7,0); M(tw,cyl(7.45,7.45,.12,28),neon(c),0,35.42,0);
  M(tw,cyl(3,3,.12,20),neon('#ffe7b0',.85),0,35.3,0); glow(tw,'#ffe7b0',16,0,33,0,.5); M(tw,cyl(3.2,3.4,1.1,20),std(0x232838,{r:.4,m:.6}),0,30.9,0); M(tw,cyl(3.25,3.25,.08,20),neon('#39ff8a',.9),0,31.5,0);
  var rad=new T.Group(); rad.position.y=37.4; tw.add(rad); M(tw,cyl(.3,.4,1.6,8),met,0,36.8,0); M(rad,rr(7,1.5,.5,.2),std(0xe9edf3,{r:.3,m:.6}),0,0,0); L.spin=L.spin||[]; L.spin.push({o:rad,v:1.1});
  M(tw,cyl(.06,.1,5,6),met,3.5,38.4,2); M(tw,cyl(.06,.1,3.4,6),met,-3,37.6,-3); var bc=glow(tw,'#ff4d6d',5,3.5,41,2); L.blink=L.blink||[]; L.blink.push({s:bc,f:2.4,p:0});
  /* луч маяка: зелёный и белый по очереди */
  var bm=new T.Group(); bm.position.y=39.6; tw.add(bm); [['#eaffff',0],['#59ff9a',Math.PI]].forEach(function(q){ var cg=new T.CylinderGeometry(.3,3.2,90,16,1,true); cg.translate(0,-45,0); cg.rotateZ(Math.PI/2); var cm=new T.Mesh(cg,new T.MeshBasicMaterial({color:q[0],transparent:true,opacity:.05,blending:T.AdditiveBlending,depthWrite:false,side:T.FrontSide,fog:false,toneMapped:false})); cm.rotation.y=q[1]; cm.rotation.z=-.06; bm.add(cm); }); L.spin.push({o:bm,v:.5});
  sign(tw,'ДИСПЕТЧЕРСКАЯ',{w:11,h:2.2,x:0,y:2.6,z:6.7,col:'#8fd3ff'}); sign(tw,'ДИСПЕТЧЕРСКАЯ',{w:11,h:2.2,x:6.7,y:2.6,z:0,ry:Math.PI/2,col:'#8fd3ff'});
  /* два ангара со сводом, внутри дроны */
  var rib=ctex(function(x,w,h){ x.fillStyle='#e8ecf2'; x.fillRect(0,0,w,h); for(var k=0;k<8;k++){ x.fillStyle='rgba(0,0,0,.12)'; x.fillRect(k*w/8,0,2,h); x.fillStyle='rgba(255,255,255,.5)'; x.fillRect(k*w/8+3,0,2,h); } },64,8); rib.wrapS=T.RepeatWrapping; rib.repeat.set(1,1);
  [[-66,-118,'01','#7cf3ff'],[-66,-166,'02','#ffd36e']].forEach(function(q,k){ var hg=new T.Group(); hg.position.set(q[0],0,q[1]); G.add(hg); var Rr=12, Ln=24;
    var sg=new T.CylinderGeometry(Rr,Rr,Ln,28,1,true,0,Math.PI); sg.rotateZ(Math.PI/2); sg.rotateX(-Math.PI/2); var t=rib.clone(); t.needsUpdate=true; t.wrapT=T.RepeatWrapping; t.repeat.set(1,12); M(hg,sg,std(0xffffff,{map:t,r:.4,m:.6,side:T.DoubleSide}),0,0,0);
    var bw=new T.Mesh(new T.CircleGeometry(Rr,28,0,Math.PI),std(0xcfd6e0,{r:.5,m:.4,side:T.DoubleSide})); bw.rotation.y=Math.PI/2; bw.position.x=-Ln/2; hg.add(bw);
    var ar=M(hg,new T.TorusGeometry(Rr,.5,10,32,Math.PI),dk,Ln/2,0,0,{ry:Math.PI/2}); var ar2=new T.Mesh(new T.TorusGeometry(Rr-.6,.12,6,32,Math.PI),neon(q[3])); ar2.rotation.y=Math.PI/2; ar2.position.x=Ln/2+.2; hg.add(ar2);
    decal(hg,ctex(function(x,w,h){ x.fillStyle='rgba(206,212,222,.95)'; x.fillRect(0,0,w,h); x.strokeStyle='#ffd21f'; x.lineWidth=8; x.strokeRect(10,10,w-20,h-20); },128,128),Ln+8,Rr*2-2,4,0,0,.9);
    M(hg,box(Ln-4,.15,.5),neon('#fff0cc',.9),0,Rr-.4,0); glow(hg,'#ffe7b0',22,2,6,0,.4);
    sign(hg,'АНГАР '+q[2],{w:9,h:2.4,x:Ln/2+.5,y:Rr+2.2,z:0,ry:Math.PI/2,col:q[3]});
    var d=drone(q[3],k?4.6:3.4); d.position.set(4,1.5,0); d.rotation.y=Math.PI/2+.3; hg.add(d); M(hg,cyl(1.6,1.9,1.4,20),std(0x2a3044,{r:.4,m:.6}),4,0.7,0); });
  /* стоянки с дронами разного размера у ангаров */
  [['#ff8fd8',1.6,-44,-146,'ВУП'],['#7cf3ff',2.6,-46,-190,'3"'],['#ffd36e',3.4,-30,-196,'5"']].forEach(function(q){ decal(G,ctex(function(x,w){ x.strokeStyle='#ffd21f'; x.lineWidth=8; x.beginPath(); x.arc(w/2,w/2,w*.44,0,6.283); x.stroke(); x.beginPath(); x.moveTo(w/2,w*.1); x.lineTo(w/2,w*.9); x.moveTo(w*.25,w*.3); x.lineTo(w*.75,w*.3); x.stroke(); },128),9,9,q[2],q[3],0,.9); var d=drone(q[0],q[1]); d.position.set(q[2],.12,q[3]); d.rotation.y=1; G.add(d); sign(G,q[4],{w:3,h:1.3,x:q[2]-5,y:1.6,z:q[3]+3,ry:.7,col:q[0],legs:.9}); });
  /* указатели рулёжки, как на настоящем аэродроме */
  function tsign(txt,x,z,ry,red){ var g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry; G.add(g); var tx=ctex(function(xx,w,h){ xx.fillStyle=red?'#d02626':'#ffd21f'; xx.fillRect(0,0,w,h); xx.strokeStyle='#111'; xx.lineWidth=6; xx.strokeRect(3,3,w-6,h-6); font(xx,h*.62); xx.fillStyle=red?'#ffffff':'#111111'; xx.textAlign='center'; xx.textBaseline='middle'; xx.fillText(txt,w/2,h/2+3); },256,96);
    M(g,box(4.3,1.7,.5),dk,0,1.45,0); var p=new T.Mesh(new T.PlaneGeometry(4,1.4),new T.MeshBasicMaterial({map:tx,toneMapped:false})); p.position.set(0,1.45,.26); g.add(p); [-1.4,1.4].forEach(function(lx){ M(g,box(.2,.6,.2),dk,lx,.3,0); }); }
  tsign('A →',16,-58,-.35,0); tsign('04-22',RX-RWd/2-5,AZ+6,-Math.PI/2,1); tsign('← B',-48,AZ+7,Math.PI/2,0); tsign('H',30,-70,-.9,0); tsign('04',RX-RWd/2-4,rz0-12,-Math.PI/2+.3,1);
  /* ворота и флажки на поле для своего полёта */
  L.aerGates=[]; if(!PROBA){
  flyGate(L,-12,4,AZ-8,.5,.0); flyGate(L,12,5.5,AZ+6,-.9,.22); flyGate(L,0,7,AZ+16,0,.44); flyGate(L,-6,4.5,AZ-18,1.2,.66);
  var fl=[]; [[-20,AZ+12],[20,AZ-14],[-18,AZ-20],[18,AZ+18]].forEach(function(q){ fl.push([q[0],2.6,q[1]]); }); inst(G,cyl(.07,.09,5.2,6),met,fl); fl.forEach(function(p,k){ var f=new T.Mesh(new T.PlaneGeometry(1,3.6),new T.MeshBasicMaterial({color:['#ff8fd8','#ffd36e','#7cf3ff','#9dff7c'][k],side:T.DoubleSide,toneMapped:false})); f.position.set(p[0]+.55,3.3,p[2]); G.add(f); L.tick.push(function(t){ f.rotation.y=Math.sin(t*2.2+k)*.35; }); });
  }
  L.freeP=new T.Vector3(0,PY+1.2,AZ+20);
  windsock(L,G,22,-46);
  /* зарядная станция */
  var zs=new T.Group(); zs.position.set(34,0,zMin+26); zs.rotation.y=-.25; G.add(zs); M(zs,rr(14,.5,7,.4),std(0xe9edf3,{r:.4,m:.3}),0,6,0); M(zs,box(14.2,.12,7.2),neon('#39ff8a'),0,5.95,0); [-5.6,5.6].forEach(function(x){ M(zs,cyl(.3,.34,6,10),wh,x,3,-2); });
  [-3.4,0,3.4].forEach(function(x,k){ M(zs,rr(2,3.4,1.4,.25),std(0x232838,{r:.4,m:.6}),x,0,-1.5); M(zs,box(1.2,.9,.05),neon(['#39ff8a','#ffd36e','#39ff8a'][k]),x,2.4,-.78); }); sign(zs,'ЗАРЯДКА',{w:8,h:1.8,x:0,y:7.6,z:2,col:'#39ff8a'});
  /* мачты и фото села */
  [[-82,30],[36,30],[-82,-200],[38,zMin+6]].forEach(function(q){ mast(L,G,q[0],q[1],22,'#d9e6ff',.4); });
  ['01-selo-sverhu','05-zakat','07-hram'].forEach(function(f,k){ photo(G,f,-28+k*20-(k===0?10:0)+(k===2?10:0),zMin+7,0,c); });
  photo(G,'08-gorodok',-82,-10,Math.PI/2,c); photo(G,'02-spektr',-82,12,Math.PI/2,c);
  L.aer=1;
  if(PROBA) arenaKviz(L,G,c,B,{mode:'land',GZ:AZ,GX:[-21,0,21],LINE:-74,start:[0,-56],TZ:-174,TW:56,TY:32,name:'ДИСПЕТЧЕР',col:'#8fd3ff'});
}

/* ================= модуль 6: "Арена аса" ================= */
function arena(L,G,c,B){ var zMin=B.zMin, i, dk=std(0x14121f,{r:.3,m:.8}), carbon=std(0x1d1a2b,{r:.25,m:.85}), COL=['#ff3dc8','#ffd36e','#58e6ff'];
  /* неоновые линии на полу вдоль крыши */
  var ln=ctex(function(x,w,h){ x.clearRect(0,0,w,h); var g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,'rgba(255,61,200,0)'); g.addColorStop(.5,'rgba(255,61,200,1)'); g.addColorStop(1,'rgba(255,61,200,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); x.fillStyle='#fff'; x.fillRect(w/2-1,0,2,h); },32,8);
  [-76,-58,58,76].forEach(function(x,k){ var d=decal(G,ln,1.6,B.len-8,x,B.zc,0,k%3?.8:.55); d.material.toneMapped=false; d.material.blending=T.AdditiveBlending; });
  /* стартовая решётка */
  decal(G,ctex(function(x,w,h){ x.clearRect(0,0,w,h); for(var r=0;r<3;r++) for(var k=0;k<12;k++){ x.fillStyle=(r+k)%2?'#ffffff':'rgba(10,8,20,.9)'; x.fillRect(k*w/12,h*.08+r*h*.07,w/12,h*.07); }
    x.strokeStyle='#ffffff'; x.lineWidth=6; for(var j=0;j<6;j++){ var px=w*(.2+(j%2)*.6-.0), py=h*(.42+Math.floor(j/2)*.2); x.strokeRect(px-w*.1+(j%2?-w*.2:0)+w*.1,py,w*.2,h*.12); font(x,h*.07); x.fillStyle='#ffd36e'; x.textAlign='center'; x.fillText(String(j+1),px+(j%2?-w*.2:0)+w*.1,py+h*.09); } },512,512),30,30,0,-12,0,.95);
  /* стартовая арка со светофором */
  var ga=new T.Group(); ga.position.set(0,0,-43); G.add(ga); [-19,19].forEach(function(x){ M(ga,rr(1.8,19,1.8,.4),carbon,x,0,0); M(ga,box(.18,18,.18),neon(COL[0]),x*(1-.92/19),9.4,.94); }); M(ga,rr(40,2.8,1.8,.4),carbon,0,18.4,0); M(ga,box(38,.16,.16),neon(COL[1]),0,18.5,.96);
  var lamps=[]; for(i=0;i<5;i++){ M(ga,cyl(.95,.95,.3,20),dk,-8+i*4,19.8,.95,{rx:Math.PI/2}); var lp=new T.Mesh(new T.CircleGeometry(.78,20),neon('#ff3030')); lp.position.set(-8+i*4,19.8,1.12); ga.add(lp); lamps.push(lp); }
  L.tick.push(function(t){ var u=t%9, n=u<5?Math.floor(u)+1:0, green=u>=5&&u<7.5; lamps.forEach(function(lp,k){ lp.material.color.set(green?'#39ff6a':k<n?'#ff3030':'#2a1420'); }); });
  sign(ga,'ЗАЧЁТ АСА',{w:16,h:3.2,x:0,y:23.2,z:.4,col:COL[1]});
  /* воздушная трасса: замкнутая линия над крышей, ворота разных видов, по ней летят дроны */
  var zf=zMin+26, P=[[-34,6,-8],[-64,10,-44],[-70,17,-104],[-46,23,-150],[-68,12,-204],[-62,8,-268],[-24,15,zf],[30,21,zf-2],[68,10,-282],[58,19,-222],[70,8,-162],[44,25,-120],[68,14,-66],[56,7,-26],[16,8,-4]].map(function(p){ return new T.Vector3(p[0],p[1],p[2]); });
  var cv=new T.CatmullRomCurve3(P,true,'catmullrom',.5); L.track=cv;
  var tb=new T.Mesh(new T.TubeGeometry(cv,360,.2,6,true),neon(COL[0],.8)); G.add(tb);
  function gate(type,col,p,tg){ var g=new T.Group(), GS=1.7; g.scale.setScalar(GS); p={x:p.x,y:p.y/GS,z:p.z}; g.position.set(p.x,0,p.z); g.rotation.y=Math.atan2(tg.x,tg.z); G.add(g); var y=p.y, nm=neon(col);
    function legs(xs,top){ xs.forEach(function(x){ M(g,cyl(.14,.2,top,8),carbon,x,top/2,0); M(g,cyl(.7,.8,.16,14),carbon,x,.08,0); }); }
    if(type==='sq'){ var s=3.4; [[0,s,2*s+1,1],[0,-s,2*s+1,1],[-s,0,1,2*s+1],[s,0,1,2*s+1]].forEach(function(q){ M(g,box(q[2],q[3],.5),carbon,q[0],y+q[1],0); }); [[0,s-.56,2*s-.2,.12],[0,-s+.56,2*s-.2,.12],[-s+.56,0,.12,2*s-.2],[s-.56,0,.12,2*s-.2]].forEach(function(q){ M(g,box(q[2],q[3],.56),nm,q[0],y+q[1],0); }); legs([-s,s],y-s); }
    else if(type==='ring'){ M(g,new T.TorusGeometry(3.5,.42,10,40),carbon,0,y,0); M(g,new T.TorusGeometry(3.14,.11,6,40),nm,0,y,.12); M(g,new T.TorusGeometry(3.14,.11,6,40),nm,0,y,-.12); legs([0],y-3.9); }
    else if(type==='tower'){ [-5.2,0,5.2].forEach(function(dy,k){ if(y+dy<3.6) return; M(g,new T.TorusGeometry(2.5,.3,8,32),carbon,0,y+dy,0); M(g,new T.TorusGeometry(2.24,.09,6,32),neon(COL[k]),0,y+dy,.1); }); legs([-3,3],y+7.4); M(g,box(6.4,.3,.3),carbon,0,y+7.4,0); }
    else if(type==='dive'){ var r=M(g,new T.TorusGeometry(3.6,.4,10,40),carbon,0,y,0,{rx:Math.PI/2}); M(g,new T.TorusGeometry(3.24,.11,6,40),nm,0,y-.1,0,{rx:Math.PI/2}); [0,1,2].forEach(function(k){ var a=k*2.094; M(g,cyl(.14,.2,y,8),carbon,Math.cos(a)*3.6,y/2,Math.sin(a)*3.6); }); }
    else if(type==='flags'){ [-4,4].forEach(function(x,k){ M(g,cyl(.08,.1,y+3,6),carbon,x,(y+3)/2,0); var f=new T.Mesh(new T.PlaneGeometry(1.3,Math.min(7,y+1.5)),new T.MeshBasicMaterial({color:col,side:T.DoubleSide,toneMapped:false})); f.position.set(x+(k?-.75:.75),y+3-Math.min(7,y+1.5)/2,0); g.add(f); L.tick.push(function(t){ f.rotation.y=Math.sin(t*2.4+x)*.3; }); }); }
    return g; }
  var TY=['sq','ring','flags','tower','sq','dive','ring','sq','flags','ring','tower','sq','ring','dive','sq','ring'], tg=new T.Vector3(), pp=new T.Vector3();
  for(i=0;i<TY.length;i++){ var u=(i+.35)/TY.length; cv.getPointAt(u,pp); cv.getTangentAt(u,tg); if(pp.z<-14) gate(TY[i],COL[i%3],pp,tg); }
  /* гоночные дроны на трассе со светящимся следом */
  var racers=[0,.33,.66].map(function(u0,k){ var d=drone(COL[k],3.6); G.add(d); var tr=[]; for(var j=0;j<(mob?4:7);j++) tr.push(glow(G,COL[k],2.2-j*.22,0,0,0,.7-j*.09)); return {d:d,u:u0,sp:.022+k*.003,tr:tr}; });
  var nx=new T.Vector3(); L.tick.push(function(t,dt){ racers.forEach(function(q){ q.u=(q.u+dt*q.sp)%1; cv.getPointAt(q.u,q.d.position); cv.getPointAt((q.u+.004)%1,nx); q.d.lookAt(nx.x,nx.y+PY,nx.z); q.d.userData.props.forEach(function(p){ p.rotation.z+=dt*40; }); q.tr.forEach(function(s,j){ cv.getPointAt((q.u-.004*(j+1)+1)%1,s.position); }); }); });
  /* трибуны по бокам у старта */
  function tribuna(x,z,ry){ var g=new T.Group(); g.position.set(x,0,z); g.rotation.y=ry; G.add(g); var st=std(0x2a2740,{r:.5,m:.4}), seats=[], cl=['#ff3dc8','#ffd36e','#58e6ff','#a78bfa'];
    for(var r=0;r<5;r++){ M(g,box(44,1.3,3),st,0,.65+r*1.3,-r*3); M(g,box(44,.08,.1),neon(r%2?COL[0]:COL[2],.9),0,1.31+r*1.3,1.5-r*3); for(var k=0;k<20;k++) seats.push([-20.9+k*2.2,1.3+r*1.3,-r*3-.3,0,1,1,0,0,1,cl[(k*3+r*5)%4]]); }
    inst(g,rr(1.6,1.1,1.4,.3),new T.MeshStandardMaterial({color:0xffffff,roughness:.5,metalness:.1}),seats,false);
    [-21,21].forEach(function(px){ M(g,cyl(.3,.3,15,10),carbon,px,7.5,-15.5); }); var cn=M(g,box(46,.4,15),carbon,0,14.6,-8.5,{rx:.12}); M(g,box(46,.14,.14),neon(COL[1]),0,13.75,-1.1); }
  tribuna(-74,-74,Math.PI/2); tribuna(74,-74,-Math.PI/2);
  /* большой экран с таблицей */
  var scr=new T.Group(); scr.position.set(-44,0,-196); scr.rotation.y=.55; G.add(scr); [-11,11].forEach(function(x){ M(scr,rr(1.4,8,1.4,.3),carbon,x,0,0); }); M(scr,box(32.6,17.6,1),carbon,0,16.6,-.3);
  var tb2=ctex(function(x,w,h){ x.fillStyle='#0a0618'; x.fillRect(0,0,w,h); var g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,'#ff3dc8'); g.addColorStop(1,'#ffd36e'); x.fillStyle=g; x.fillRect(0,0,w,h*.17); font(x,h*.1); x.fillStyle='#0a0618'; x.textAlign='left'; x.textBaseline='middle'; x.fillText('ЗАЧЁТНЫЙ КРУГ',w*.04,h*.09);
    [['1','Ас','00:41.8','#ffd36e'],['2','Пилот','00:44.2','#ffffff'],['3','Ты?','--:--.-','#58e6ff'],['4','Новичок','00:52.7','#ffffff']].forEach(function(r,k){ var y=h*(.3+k*.17); x.fillStyle=k%2?'rgba(255,255,255,.05)':'rgba(255,255,255,.1)'; x.fillRect(w*.03,y-h*.07,w*.94,h*.14); font(x,h*.085); x.fillStyle=r[3]; x.textAlign='left'; x.fillText(r[0],w*.06,y); x.fillText(r[1],w*.17,y); x.textAlign='right'; x.fillText(r[2],w*.95,y); }); },1024,560);
  var sp=new T.Mesh(new T.PlaneGeometry(32,17),new T.MeshBasicMaterial({map:tb2,toneMapped:false})); sp.position.set(0,16.6,.22); scr.add(sp); glow(scr,COL[0],40,0,16,3,.25);
  /* пьедестал с кубком у финиша */
  var pd=new T.Group(); pd.position.set(46,0,zMin+44); pd.rotation.y=-.5; G.add(pd); [[0,3.2,'1'],[-4.4,2.2,'2'],[4.4,1.5,'3']].forEach(function(q){ M(pd,rr(4.2,q[1],4.2,.4),std(0x2a2740,{r:.3,m:.7}),q[0],0,0); M(pd,box(4.3,.12,4.3),neon(COL[1]),q[0],q[1]-.3,0); sign(pd,q[2],{w:1.6,h:1.4,x:q[0],y:q[1]*.5,z:2.14,col:COL[1]}); });
  var cup=new T.Group(); cup.position.y=3.3; pd.add(cup); var gold=std(0xffc94a,{r:.18,m:1,env:1.6,e:'#7a5200',ei:.5}); M(cup,new T.LatheGeometry([[0,0],[1,0],[1,.25],[.3,.5],[.22,1.4],[.5,1.7],[1.25,3.4],[1.1,3.4],[.3,1.9],[0,1.9]].map(function(p){ return new T.Vector2(p[0],p[1]); }),24),gold,0,0,0);
  [-1,1].forEach(function(s){ M(cup,new T.TorusGeometry(.55,.1,8,18,Math.PI),gold,s*1.15,2.6,0,{rz:s>0?-Math.PI/2:Math.PI/2}); }); L.spin=L.spin||[]; L.spin.push({o:cup,v:.8}); glow(pd,'#ffd36e',14,0,5,0,.5);
  /* прожекторы по углам: лучи качаются */
  [[-80,40,1],[80,40,-1],[-80,zMin+18,1],[80,zMin+18,-1],[-80,-170,1],[80,-150,-1]].forEach(function(q,k){ var b=new T.Group(); b.position.set(q[0],0,q[1]); G.add(b); M(b,cyl(1.1,1.4,1.6,16),carbon,0,.8,0); var h=new T.Group(); h.position.y=2; b.add(h); M(h,cyl(.9,.6,1.6,16),carbon,0,.4,0);
    var cg=new T.CylinderGeometry(9,.5,150,18,1,true); cg.translate(0,75.6,0); var cm=new T.Mesh(cg,new T.MeshBasicMaterial({color:COL[k%3],transparent:true,opacity:.075,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false,toneMapped:false})); h.add(cm); glow(h,COL[k%3],6,0,1.4,0);
    L.tick.push(function(t){ h.rotation.z=q[2]*(.35+Math.sin(t*.5+k*1.7)*.3); h.rotation.x=Math.sin(t*.37+k)*.35; }); });
  /* боксы команд */
  [[-60,22],[60,22]].forEach(function(q,k){ var bx=new T.Group(); bx.position.set(q[0],0,q[1]); G.add(bx); M(bx,rr(22,.4,11,.5),carbon,0,6.5,0); M(bx,box(22.2,.12,11.2),neon(COL[k?2:0]),0,6.46,0); [[-10,-4.5],[10,-4.5],[-10,4.5],[10,4.5]].forEach(function(p){ M(bx,cyl(.22,.22,6.5,8),carbon,p[0],3.25,p[1]); });
    [-6,0,6].forEach(function(x,j){ M(bx,rr(4.4,2.2,2,.3),std(0x2a2740,{r:.4,m:.6}),x,0,-2.5); var d=drone(COL[(j+k)%3],2); d.position.set(x,2.3,-2.5); d.rotation.y=j; bx.add(d); }); sign(bx,k?'БОКС 2':'БОКС 1',{w:7,h:1.7,x:0,y:7.9,z:5.5,col:COL[k?2:0]}); });
  /* ворота для своего полёта у старта */
  L.aerGates=[]; if(!PROBA){ flyGate(L,-14,5,-40,.6,.86); flyGate(L,14,7,-62,-.5,.13); flyGate(L,-6,9,-92,.2,.52); flyGate(L,10,5,-118,-.9,.75); }
  L.freeP=new T.Vector3(0,PY+1.2,6);
  photo(G,'05-zakat',-30,zMin+7,0,c); photo(G,'07-hram',10,zMin+7,0,c);
  if(PROBA) arenaKviz(L,G,c,B,{mode:'race',GZ:-124,LINE:-34,SZ:-43,start:[0,-14],TZ:-182,TW:64,TY:34,name:'АРЕНА АСА',col:'#ff3dc8'});
}
/* ---------- вход из движка ---------- */
K.build=function(e,L,i,pts,c){ E=e; PY=e.PY; mob=e.mob; var kd=KIND[i]; if(!kd) return; var zMin=Math.min.apply(0,pts.map(function(q){ return q[1]; }))-55;
  var G=new T.Group(); G.position.y=PY; L.g.add(G); L.kg=G; L.kr=MOOD[kd]; L.tick=L.tick||[]; L.blink=L.blink||[]; L.spin=L.spin||[];
  var B=common(L,G,kd,c,zMin); (kd==='shkola'?shkola:kd==='aero'?aero:arena)(L,G,c,B); };
K.init=function(e){ E=e; PY=e.PY; mob=e.mob; SHD=(VAR==='b'||VAR==='c')&&!mob; if(SHD){ e.R.shadowMap.enabled=true; e.R.shadowMap.type=T.PCFSoftShadowMap; } };
/* вошли в уровень: свет и тени */
var SUN0=null, EXP0=null;
K.level=function(L){ if(!E) return; if(SUN0==null){ SUN0=E.sun.intensity; EXP0=E.R.toneMappingExposure; } var kr=L&&L.kr; E.sun.intensity=kr?0:SUN0; E.R.toneMappingExposure=kr?kr.exp:EXP0; K.cur=kr?L:null;
  kvLevel(L);
  if(kr&&SHD&&!L.krSh){ L.krSh=1; L.g.traverse(function(o){ if(o.isMesh) o.receiveShadow=true; }); if(L.city) L.city.traverse(function(o){ if(o.isMesh){ o.receiveShadow=false; o.castShadow=false; } }); L.nodes.forEach(function(n){ n.g.traverse(function(o){ if(o.isMesh&&o.material&&!o.material.transparent&&!o.material.isMeshBasicMaterial) o.castShadow=true; }); }); } };
/* кадр: в варианте c - со свечением ярких огней */
var CMP=null, CW=0, CH=0, v2=new T.Vector2();
K.render=function(R,S,C){ if(!BLOOM||!K.cur||mob||!T.EffectComposer||!T.UnrealBloomPass) return false; R.getDrawingBufferSize(v2);
  if(!CMP||CW!==v2.x||CH!==v2.y){ CW=v2.x; CH=v2.y; var rt=R.capabilities.isWebGL2&&T.WebGLMultisampleRenderTarget?new T.WebGLMultisampleRenderTarget(CW,CH,{format:T.RGBAFormat}):new T.WebGLRenderTarget(CW,CH,{format:T.RGBAFormat});
    CMP=new T.EffectComposer(R,rt); CMP.setPixelRatio(1); CMP.setSize(CW,CH); CMP.addPass(new T.RenderPass(S,C)); CMP.addPass(new T.UnrealBloomPass(new T.Vector2(CW,CH),.45,.5,.88)); }
  CMP.render(); return true; };
K._kv=function(){ return KV; }; K._f=function(){ return E.free.get(); };
})();
