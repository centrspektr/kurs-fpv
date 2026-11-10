/* Крыши открытых модулей 1, 4, 6 - новая графика (10.11.2026).
   Модуль 1 - "Лётная школа", модуль 4 - "Аэродром", модуль 6 - "Арена аса": у каждой крыши свои декорации, свет и дорога.
   Варианты графики: ?kr=a - гладкий неон (без фото-текстур), ?kr=b - настоящие материалы и тени, ?kr=c - материалы, тени и свечение. ?kr=0 - как было.
   Текстуры покрытий - Poly Haven (CC0), лежат у нас в kryshi/tx. Движок (kosmos-kurs-new.js) зовёт KRYSHI.pt, KRYSHI.floor, KRYSHI.build, KRYSHI.level, KRYSHI.render. */
(function(){
'use strict';
if(!window.THREE) return;
var T=THREE, mq=/[?&]kr=([abc0])/.exec(location.search), VAR=mq?mq[1]:'0';
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
function shkola(L,G,c,B){ var zMin=B.zMin, i, wh=std(0xf2f4f8,{r:.5,m:.1}), dk=B.dark, tube=std(0xdfe5ee,{r:.3,m:.85});
  /* полосы безопасности вдоль бортика */
  var hz=ctex(function(x,w,h){ x.fillStyle='#ffd21f'; x.fillRect(0,0,w,h); x.fillStyle='#1a1d24'; for(var k=-2;k<6;k++){ x.beginPath(); x.moveTo(k*32,h); x.lineTo(k*32+16,h); x.lineTo(k*32+48,0); x.lineTo(k*32+32,0); x.fill(); } },64,32); hz.wrapS=T.RepeatWrapping;
  [[-HW+2.2,B.zc,B.len-2,1],[HW-2.2,B.zc,B.len-2,1],[0,B.z0-2.2,W-6,0],[0,zMin+2.2,W-6,0]].forEach(function(q){ var t=hz.clone(); t.needsUpdate=true; t.repeat.set(q[2]/4,1); decal(G,t,q[2],1.4,q[0],q[1],q[3]?Math.PI/2:0,.9); });
  function zone(x,z,w,d,col,txt){ decal(G,ctex(function(xx,cw,ch){ rrect(xx,6,6,cw-12,ch-12,26); xx.fillStyle=col; xx.globalAlpha=.5; xx.fill(); xx.globalAlpha=1; xx.strokeStyle='#ffffff'; xx.lineWidth=7; xx.stroke(); font(xx,ch*.075); xx.fillStyle='#ffffff'; xx.textAlign='center'; xx.fillText(txt,cw/2,ch*.965); },512,Math.round(512*d/w)),w,d,x,z,0,.95,.03); }
  zone(-50,-88,56,72,'#0e4f66','ЗОНА ПОЛЁТОВ'); zone(52,-82,46,46,'#0e4f66','КЛАСС'); zone(-56,-178,40,34,'#7a1f2a','БЕЗОПАСНОСТЬ'); zone(54,-186,34,30,'#0e4f66','ПРОВЕРКА');
  /* стартовая площадка: круги и надпись по дуге */
  decal(G,ctex(function(x,w){ var cc=w/2; x.strokeStyle='#ffffff'; x.lineWidth=w*.012; x.beginPath(); x.arc(cc,cc,w*.47,0,6.283); x.stroke(); x.strokeStyle='rgba(255,255,255,.55)'; x.lineWidth=w*.006; x.beginPath(); x.arc(cc,cc,w*.36,0,6.283); x.stroke();
    for(var k=0;k<48;k++){ var a=k/48*6.283, r1=w*(k%4?.445:.42); x.beginPath(); x.moveTo(cc+Math.cos(a)*r1,cc+Math.sin(a)*r1); x.lineTo(cc+Math.cos(a)*w*.465,cc+Math.sin(a)*w*.465); x.stroke(); }
    font(x,w*.05); x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle'; var s='ШКОЛА FPV · СТАРТ · ШКОЛА FPV · СТАРТ · '; for(var j=0;j<s.length;j++){ var a2=-Math.PI/2+(j-s.length/2)*.165; x.save(); x.translate(cc+Math.cos(a2)*w*.395,cc+Math.sin(a2)*w*.395); x.rotate(a2+Math.PI/2); x.fillText(s[j],0,0); x.restore(); } },1024),40,40,0,-28,0,.95);
  /* --- клетка для первых полётов (слева): каркас, сетка, 6 площадок --- */
  var cx=-50, cz=-92, cw=40, cl=52, chh=13, cg=new T.Group(); cg.position.set(cx,0,cz); G.add(cg);
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
  L.aerGates=[]; flyGate(L,cx-6,4.2,cz+6,.5,.45); flyGate(L,cx+8,6,cz-8,-.7,.12); flyGate(L,cx-4,5,cz-18,.1,.82);
  var cn=[]; for(i=0;i<5;i++) cn.push([cx+10,0,cz+16-i*5]); inst(G,new T.ConeGeometry(.5,1.3,14).translate(0,.65,0),std(0xff7a1a,{r:.5,m:0,e:'#ff7a1a',ei:.25}),cn);
  L.freeP=new T.Vector3(cx-.24*cw,PY+1.2,cz+cl*.5-4);
  /* --- класс под навесом (справа): перголы, лавки, экран с правилами --- */
  var kx=52, kz=-84, kg=new T.Group(); kg.position.set(kx,0,kz); G.add(kg);
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
  [[-34,-262],[36,-250],[-52,-296]].forEach(function(q){ decal(G,hp,13,13,q[0],q[1],0,1); var pl=[]; for(var k=0;k<10;k++) pl.push([q[0]+Math.cos(k*.628)*6.9,.15,q[1]+Math.sin(k*.628)*6.9]); lights(G,pl,'#ffd36e',.16,1.6); });
  var sl=[]; for(i=0;i<7;i++) [0,1].forEach(function(r){ sl.push([-45+i*15,2.1,zMin+12+r*9,0,1,1,-.5]); }); inst(G,box(12,.25,6),std(0x1b3a7a,{r:.12,m:.85,env:1.4}),sl); var sl2=[]; sl.forEach(function(p){ sl2.push([p[0],1,p[2]+.8]); }); inst(G,box(.4,2,.4),dk,sl2,false);
  /* мачты света, растения, фото села */
  [[-80,20],[80,20],[-80,-130],[80,-130],[-80,-250],[80,-250]].forEach(function(q){ mast(L,G,q[0],q[1],24,'#fff3d6',q[0]<0?.5:-.5); });
  planters(G,[[-80,-20,Math.PI/2],[-80,-40,Math.PI/2],[80,-20,Math.PI/2],[80,-40,Math.PI/2],[-28,44,0],[28,44,0],[-80,-150,Math.PI/2],[80,-150,Math.PI/2],[80,-215,Math.PI/2],[-80,-215,Math.PI/2],[18,-130,.4],[-22,-225,-.3]]);
  photo(G,'02-spektr',80,-108,-Math.PI/2,c); photo(G,'01-selo-sverhu',-80,-232,Math.PI/2,c); photo(G,'05-zakat',0,zMin+30,0,c);
  /* аллея флажков у старта */
  var fp=[], FC=['#7cf3ff','#ffd36e','#ff8fd8','#9dff7c']; for(i=0;i<5;i++) [-1,1].forEach(function(sx){ fp.push([sx*(9+i*3.2),3.4,-8-i*1.5]); }); inst(G,cyl(.07,.1,6.8,6),tube,fp);
  fp.forEach(function(q,k){ var f=new T.Mesh(new T.PlaneGeometry(1.5,4.6),new T.MeshBasicMaterial({color:FC[k%4],side:T.DoubleSide,toneMapped:false})); f.position.set(q[0]+(q[0]>0?.8:-.8),4.4,q[2]); G.add(f); L.tick.push(function(t){ f.rotation.y=Math.sin(t*2+k)*.3; }); });
  /* ветроуказатель */
  windsock(L,G,26,-224);
}
function windsock(L,G,x,z){ var ws=new T.Group(); ws.position.set(x,0,z); G.add(ws); M(ws,cyl(.14,.2,10,8),std(0xe6e9ef,{r:.3,m:.8}),0,5,0); M(ws,cyl(.8,1,.3,16),std(0x2a3044,{r:.5,m:.5}),0,.15,0);
  var st=ctex(function(x,w,h){ for(var k=0;k<5;k++){ x.fillStyle=k%2?'#ffffff':'#ff6a1a'; x.fillRect(0,k*h/5,w,h/5+1); } },8,64), sock=new T.Group(); sock.position.y=9.6; ws.add(sock);
  var sk=new T.Mesh(cyl(.85,.3,4.4,14,true),std(0xffffff,{map:st,r:.8,m:0,side:T.DoubleSide,e:'#ff6a1a',ei:.15})); sk.position.x=2.3; sk.rotation.z=Math.PI/2; sock.add(sk); L.tick.push(function(t){ sock.rotation.y=.6+Math.sin(t*.4)*.5; sk.rotation.x=Math.sin(t*3)*.08; }); }

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
  L.aerGates=[]; flyGate(L,-12,4,AZ-8,.5,.0); flyGate(L,12,5.5,AZ+6,-.9,.22); flyGate(L,0,7,AZ+16,0,.44); flyGate(L,-6,4.5,AZ-18,1.2,.66);
  var fl=[]; [[-20,AZ+12],[20,AZ-14],[-18,AZ-20],[18,AZ+18]].forEach(function(q){ fl.push([q[0],2.6,q[1]]); }); inst(G,cyl(.07,.09,5.2,6),met,fl); fl.forEach(function(p,k){ var f=new T.Mesh(new T.PlaneGeometry(1,3.6),new T.MeshBasicMaterial({color:['#ff8fd8','#ffd36e','#7cf3ff','#9dff7c'][k],side:T.DoubleSide,toneMapped:false})); f.position.set(p[0]+.55,3.3,p[2]); G.add(f); L.tick.push(function(t){ f.rotation.y=Math.sin(t*2.2+k)*.35; }); });
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
  L.aerGates=[]; flyGate(L,-14,5,-40,.6,.86); flyGate(L,14,7,-62,-.5,.13); flyGate(L,-6,9,-92,.2,.52); flyGate(L,10,5,-118,-.9,.75);
  L.freeP=new T.Vector3(0,PY+1.2,6);
  photo(G,'05-zakat',-30,zMin+7,0,c); photo(G,'07-hram',10,zMin+7,0,c);
}
/* ---------- вход из движка ---------- */
K.build=function(e,L,i,pts,c){ E=e; PY=e.PY; mob=e.mob; var kd=KIND[i]; if(!kd) return; var zMin=Math.min.apply(0,pts.map(function(q){ return q[1]; }))-55;
  var G=new T.Group(); G.position.y=PY; L.g.add(G); L.kg=G; L.kr=MOOD[kd]; L.tick=L.tick||[]; L.blink=L.blink||[]; L.spin=L.spin||[];
  var B=common(L,G,kd,c,zMin); (kd==='shkola'?shkola:kd==='aero'?aero:arena)(L,G,c,B); };
K.init=function(e){ E=e; PY=e.PY; mob=e.mob; SHD=(VAR==='b'||VAR==='c')&&!mob; if(SHD){ e.R.shadowMap.enabled=true; e.R.shadowMap.type=T.PCFSoftShadowMap; } };
/* вошли в уровень: свет и тени */
var SUN0=null, EXP0=null;
K.level=function(L){ if(!E) return; if(SUN0==null){ SUN0=E.sun.intensity; EXP0=E.R.toneMappingExposure; } var kr=L&&L.kr; E.sun.intensity=kr?0:SUN0; E.R.toneMappingExposure=kr?kr.exp:EXP0; K.cur=kr?L:null;
  if(kr&&SHD&&!L.krSh){ L.krSh=1; L.g.traverse(function(o){ if(o.isMesh) o.receiveShadow=true; }); if(L.city) L.city.traverse(function(o){ if(o.isMesh){ o.receiveShadow=false; o.castShadow=false; } }); L.nodes.forEach(function(n){ n.g.traverse(function(o){ if(o.isMesh&&o.material&&!o.material.transparent&&!o.material.isMeshBasicMaterial) o.castShadow=true; }); }); } };
/* кадр: в варианте c - со свечением ярких огней */
var CMP=null, CW=0, CH=0, v2=new T.Vector2();
K.render=function(R,S,C){ if(!BLOOM||!K.cur||mob||!T.EffectComposer||!T.UnrealBloomPass) return false; R.getDrawingBufferSize(v2);
  if(!CMP||CW!==v2.x||CH!==v2.y){ CW=v2.x; CH=v2.y; var rt=R.capabilities.isWebGL2&&T.WebGLMultisampleRenderTarget?new T.WebGLMultisampleRenderTarget(CW,CH,{format:T.RGBAFormat}):new T.WebGLRenderTarget(CW,CH,{format:T.RGBAFormat});
    CMP=new T.EffectComposer(R,rt); CMP.setPixelRatio(1); CMP.setSize(CW,CH); CMP.addPass(new T.RenderPass(S,C)); CMP.addPass(new T.UnrealBloomPass(new T.Vector2(CW,CH),.45,.5,.88)); }
  CMP.render(); return true; };
})();
