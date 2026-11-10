/* grafika.js - графика v3 летающего города "Взлёт" (10.11.2026).
   Отдельный слой поверх мотора kosmos-kurs.js: мотор зовёт его через window.KURS_GFX, без этого файла всё работает как раньше.
   Что даёт:
     - свечение неона (bloom), виньетка, лёгкая цветокоррекция, сглаживание (MSAA) - одним проходом после сцены;
     - мягкие тени от зданий (считаются один раз, телефону почти бесплатно) и тени-контакты под зданиями;
     - новый пол платформы: круговые плиты вместо синей сетки, блики, пятна света от неона;
     - небо-купол и море облаков под островом, отражения в стекле и металле берутся с этого же неба;
     - чистые фасады: окна рядами, а не "шум".
   Вид (палитра) - KURS_GFX_MODE или ?g=a|b|c:  a - ночной неон, b - закат над облаками, c - северное сияние.  ?g=0 - выключить.
   Подключение: после three.min.js и RoomEnvironment.js, до kosmos-kurs.js. Файлы только свои, из сети ничего не берётся. */
(function(){
'use strict';
var T=window.THREE; if(!T) return;
var mm=/[?&]g=([0abc])/.exec(location.search), MODE=mm?mm[1]:(window.KURS_GFX_MODE||'a'); if(MODE==='0') return;
var mob=matchMedia('(pointer:coarse)').matches;
function C3(c){ return new T.Color(c); }
function cv(w,h){ var n=document.createElement('canvas'); n.width=w; n.height=h||w; return n; }
function rnd(s){ return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }

/* ---------- палитры ---------- */
var PALS={
 a:{ name:'Ночной неон',
   sky:{zen:'#03030c',mid:'#0e0a30',hor:'#3d1f86',low:'#05030f',midH:.06,zenH:.28,a0:.0,a1:.16,ak:1,sunC:'#9fb4ff',sunP:90,sunK:.25,disc:1.6,neb:1,cir:0,aur:0},
   sun:{az:-.75,el:.82,c:'#c2d0ff',i:1.7}, hemi:['#7f8ff0','#3a2070',.85], amb:.2, exp:1.05,
   fog:['#1d1250',150,620],
   deck:{base:'#141a40',hi:'#1f2860',joint:'#070917',edge:'#2a3468',acc:'#7cf3ff',acc2:'#ff7ce0',met:.3,rough:.38,em:1.15},
   body:'#1c2348', bodyK:.0, rock:['#3a2a78','#5b2bd6',.35],
   fac:{wall:'#1a2146',wall2:'#27305e',gA:'#0b1230',gB:'#22346a',warm:'#ffcf8a',lit:.3,accent:.35,em:.95},
   cloud:{lit:'#6a55d0',sh:'#150d38',glow:'#8a5cff',a:.92,y:-78},
   post:{bloom:.95,th:.7,knee:.28,sat:1.08,con:1.06,vig:.85,lift:[.012,.006,.03],gain:[1,1,1.02]},
   pool:.5, ao:.55 },
 b:{ name:'Закат над облаками',
   sky:{zen:'#141848',mid:'#a8508e',hor:'#ffa868',low:'#3a2350',midH:.1,zenH:.34,a0:.16,a1:.4,ak:.85,sunC:'#ffb267',sunP:14,sunK:.5,disc:2.2,neb:0,cir:1,aur:0},
   sun:{az:1.02,el:.42,c:'#ffb07a',i:1.9}, hemi:['#8f86e8','#7a4a66',.6], amb:.08, exp:.92,
   fog:['#c98aa6',170,760],
   deck:{base:'#4a4868',hi:'#5d5a80',joint:'#2a2842',edge:'#6a6690',acc:'#7cf3ff',acc2:'#ff7ce0',met:.45,rough:.42,em:.9},
   body:'#b9b0c8', bodyK:1, rock:['#6a4a62','#ff7a50',.08],
   fac:{wall:'#b8aec6',wall2:'#9c92b0',gA:'#232f58',gB:'#6f78ac',warm:'#ffcf86',lit:.24,accent:.2,em:.9},
   cloud:{lit:'#ffc7a8',sh:'#6a4a86',glow:'#ff9a70',a:.96,y:-70},
   post:{bloom:.8,th:.8,knee:.2,sat:1.1,con:1.06,vig:.75,lift:[.02,.008,.02],gain:[1.03,1,.98]},
   pool:.25, ao:.5 },
 c:{ name:'Северное сияние',
   sky:{zen:'#010610',mid:'#04202f',hor:'#0c5a5e',low:'#020a14',midH:.07,zenH:.3,a0:.0,a1:.18,ak:1,sunC:'#d6f4ff',sunP:120,sunK:.3,disc:2.4,neb:0,cir:0,aur:1},
   sun:{az:.7,el:.8,c:'#cfe6ff',i:1.25}, hemi:['#4fd0c0','#102a44',.6], amb:.1, exp:.98,
   fog:['#0a3a4c',160,640],
   deck:{base:'#12293c',hi:'#1c4058',joint:'#050d16',edge:'#24506a',acc:'#5effc4',acc2:'#7cf3ff',met:.7,rough:.28,em:1.1},
   body:'#9fb4c6', bodyK:.85, rock:['#27445c','#19c9b0',.2],
   fac:{wall:'#a9bccc',wall2:'#8aa0b4',gA:'#082033',gB:'#1e5a78',warm:'#c8f7ff',lit:.3,accent:.35,em:1.0},
   cloud:{lit:'#3aa6a0',sh:'#04121c',glow:'#3affc0',a:.85,y:-78},
   post:{bloom:1.0,th:.64,knee:.3,sat:1.1,con:1.06,vig:.85,lift:[.004,.016,.022],gain:[.99,1.01,1.02]},
   pool:.45, ao:.55 }
};
var P=PALS[MODE];
var G=window.KURS_GFX={mode:MODE,name:P.name,pal:P,post:true};
var R,S,CAM,X=null, NOISE=null, NOISE2=null, uT={value:0}, uK={value:0}, kT=0;
function sunDir(){ var s=P.sun; return new T.Vector3(Math.sin(s.az)*Math.cos(s.el),Math.sin(s.el),Math.cos(s.az)*Math.cos(s.el)).normalize(); }

/* ---------- шум для облаков и неба: одна маленькая картинка, повторяется без швов ---------- */
function noiseTex(){ if(NOISE) return NOISE; var n=128, c=cv(n), x=c.getContext('2d'), im=x.createImageData(n,n), r=rnd(11), oct=[[4,.5],[8,.25],[16,.15],[32,.1]], grids=oct.map(function(o){ var g=[]; for(var i=0;i<o[0]*o[0];i++) g.push(r()); return g; });
  function sm(t){ return t*t*(3-2*t); }
  for(var y=0;y<n;y++) for(var xx=0;xx<n;xx++){ var v=0; for(var k=0;k<oct.length;k++){ var p=oct[k][0], g=grids[k], fx=xx/n*p, fy=y/n*p, x0=Math.floor(fx), y0=Math.floor(fy), tx=sm(fx-x0), ty=sm(fy-y0), x1=(x0+1)%p, y1=(y0+1)%p;
      v+=oct[k][1]*((g[y0*p+x0]*(1-tx)+g[y0*p+x1]*tx)*(1-ty)+(g[y1*p+x0]*(1-tx)+g[y1*p+x1]*tx)*ty); }
    var q=(y*n+xx)*4, b=Math.max(0,Math.min(255,Math.round(v*255))); im.data[q]=im.data[q+1]=im.data[q+2]=b; im.data[q+3]=255; }
  x.putImageData(im,0,0); NOISE=new T.CanvasTexture(c); NOISE.wrapS=NOISE.wrapT=T.RepeatWrapping; NOISE2=new T.CanvasTexture(c); NOISE2.wrapS=NOISE2.wrapT=T.RepeatWrapping; NOISE2.generateMipmaps=false; NOISE2.minFilter=T.LinearFilter; return NOISE; }

/* ---------- небо: общий кусок шейдера для купола, облаков и отражений ---------- */
var SKY_GLSL=[
'uniform vec3 uZen,uMid,uHor,uLow,uSun,uSunC; uniform float uMidH,uZenH,uSunP,uSunK,uDisc,uNeb,uCir,uAur,uT; uniform sampler2D tN;',
'vec3 sky(vec3 d){ float h=d.y;',
'  vec3 c=mix(uHor,uMid,smoothstep(0.,uMidH,h)); c=mix(c,uZen,smoothstep(uMidH,uZenH,h)); c=mix(c,uLow,1.-smoothstep(-.4,0.,h));',
'  float s=max(dot(d,uSun),0.); c+=uSunC*(pow(s,uSunP)*uSunK+smoothstep(.9992,.9996,s)*uDisc);',
'  float az=atan(d.x,d.z)/6.2831853;',
'  if(uNeb>0.){ float n=texture2D(tN,vec2(az*2.+uT*.002,h*.9)).r, n2=texture2D(tN,vec2(az*3.-uT*.003,h*1.6+.3)).r; float bnd=smoothstep(-.05,.1,h)*(1.-smoothstep(.1,.55,h));',
'    c+=vec3(.75,.16,.6)*smoothstep(.42,.66,n)*bnd*.42*uNeb; c+=vec3(.08,.42,.62)*smoothstep(.45,.68,n2)*bnd*.36*uNeb; }',
'  if(uCir>0.){ float n=texture2D(tN,vec2(az*3.+uT*.004,h*2.6)).r*.65+texture2D(tN,vec2(az*8.,h*7.)).r*.35; float bnd=smoothstep(.03,.12,h)*(1.-smoothstep(.2,.55,h));',
'    c=mix(c,vec3(1.,.72,.6)+uSunC*.35*pow(s,3.),smoothstep(.5,.78,n)*bnd*.6*uCir); }',
'  if(uAur>0.){ float w=texture2D(tN,vec2(az*2.+uT*.004,.3)).r; float y0=.015+w*.07; float cur=smoothstep(y0-.015,y0+.01,h)*(1.-smoothstep(y0,y0+.16,h));',
'    float st=texture2D(tN,vec2(az*14.+uT*.008,.7)).r*.6+texture2D(tN,vec2(az*37.+uT*.015,.1)).r*.4; float k=cur*(.3+.7*smoothstep(.34,.66,st))*smoothstep(.36,.6,texture2D(tN,vec2(az*4.-uT*.003,.55)).r);',
'    c+=mix(vec3(.2,1.,.62),vec3(.55,.3,1.),smoothstep(y0,y0+.14,h))*k*.85*uAur; }',
'  return c; }'].join('\n');
function skyUni(){ var s=P.sky; return {uZen:{value:C3(s.zen)},uMid:{value:C3(s.mid)},uHor:{value:C3(s.hor)},uLow:{value:C3(s.low)},uSun:{value:sunDir()},uSunC:{value:C3(s.sunC)},
  uMidH:{value:s.midH},uZenH:{value:s.zenH},uSunP:{value:s.sunP},uSunK:{value:s.sunK},uDisc:{value:s.disc},uNeb:{value:s.neb},uCir:{value:s.cir},uAur:{value:s.aur},uT:uT,tN:{value:(noiseTex(),NOISE2)}}; }
function domeMat(env){ var u=skyUni(); u.uA0={value:P.sky.a0}; u.uA1={value:P.sky.a1}; u.uAk={value:env?0:P.sky.ak}; u.uK=env?{value:1}:uK;
  return new T.ShaderMaterial({uniforms:u,side:T.BackSide,depthWrite:false,transparent:!env,fog:false,
    vertexShader:'varying vec3 vD; void main(){ vD=position; vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_Position.z=gl_Position.w*.9999; }',
    fragmentShader:SKY_GLSL+'\nvarying vec3 vD; uniform float uA0,uA1,uAk,uK; void main(){ vec3 d=normalize(vD); vec3 c=sky(d); float a=1.-smoothstep(uA0,uA1,d.y)*uAk; a=max(a,clamp(dot(c,vec3(.5))*1.4-.1,0.,1.)); gl_FragColor=linearToOutputTexel(vec4(c,a*uK)); }'}); }

/* ---------- постобработка: сцена -> свечение (несколько уменьшенных копий) -> сборка с виньеткой и цветом ---------- */
function Post(){ var sz=new T.Vector2(), W=0, H=0, rt=null, mips=[], ups=[], NM=mob?4:5, cam=new T.OrthographicCamera(-1,1,1,-1,0,1), sc=new T.Scene(), quad=new T.Mesh(new T.PlaneGeometry(2,2)); quad.frustumCulled=false; sc.add(quad);
  var VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
  function SM(fs,u){ return new T.ShaderMaterial({vertexShader:VS,fragmentShader:fs,uniforms:u,depthTest:false,depthWrite:false}); }
  var mBright=SM('varying vec2 vUv; uniform sampler2D t; uniform vec2 px; uniform float th,knee; vec3 f(vec2 o){ vec3 c=texture2D(t,vUv+o*px).rgb; float l=max(c.r,max(c.g,c.b)); return c*smoothstep(th,th+knee,l); } void main(){ gl_FragColor=vec4((f(vec2(-1.,-1.))+f(vec2(1.,-1.))+f(vec2(-1.,1.))+f(vec2(1.,1.)))*.25,1.); }',{t:{value:null},px:{value:new T.Vector2()},th:{value:P.post.th},knee:{value:P.post.knee}});
  var mDown=SM('varying vec2 vUv; uniform sampler2D t; uniform vec2 px; void main(){ vec3 c=texture2D(t,vUv).rgb*4.; c+=texture2D(t,vUv+px).rgb+texture2D(t,vUv-px).rgb+texture2D(t,vUv+vec2(px.x,-px.y)).rgb+texture2D(t,vUv+vec2(-px.x,px.y)).rgb; gl_FragColor=vec4(c*.125,1.); }',{t:{value:null},px:{value:new T.Vector2()}});
  var mUp=SM('varying vec2 vUv; uniform sampler2D t,b; uniform vec2 px; uniform float k; void main(){ vec3 c=texture2D(t,vUv+vec2(-2.*px.x,0.)).rgb+texture2D(t,vUv+vec2(2.*px.x,0.)).rgb+texture2D(t,vUv+vec2(0.,-2.*px.y)).rgb+texture2D(t,vUv+vec2(0.,2.*px.y)).rgb; c+=(texture2D(t,vUv+px).rgb+texture2D(t,vUv-px).rgb+texture2D(t,vUv+vec2(px.x,-px.y)).rgb+texture2D(t,vUv+vec2(-px.x,px.y)).rgb)*2.; gl_FragColor=vec4(mix(texture2D(b,vUv).rgb,c/12.,k),1.); }',{t:{value:null},b:{value:null},px:{value:new T.Vector2()},k:{value:.62}});
  var mFin=SM('varying vec2 vUv; uniform sampler2D t,b; uniform float uB,uSat,uCon,uVig; uniform vec3 uLift,uGain; float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }\nvoid main(){ vec3 c=texture2D(t,vUv).rgb; vec3 g=texture2D(b,vUv).rgb; c=c+g*uB-c*g*uB*.35; float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,uSat); c=(c-.5)*uCon+.5; c=c*uGain+uLift*(1.-l); vec2 d=vUv-.5; c*=1.-dot(d,d)*uVig; c+=(hash(gl_FragCoord.xy)-.5)/200.; gl_FragColor=vec4(clamp(c,0.,1.),1.); }',
    {t:{value:null},b:{value:null},uB:{value:P.post.bloom},uSat:{value:P.post.sat},uCon:{value:P.post.con},uVig:{value:P.post.vig},uLift:{value:new T.Vector3().fromArray(P.post.lift)},uGain:{value:new T.Vector3().fromArray(P.post.gain)}});
  function mk(w,h){ return new T.WebGLRenderTarget(Math.max(2,w),Math.max(2,h),{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false,stencilBuffer:false}); }
  function build(w,h){ W=w; H=h; if(rt) rt.dispose(); mips.concat(ups).forEach(function(q){ q.dispose(); }); mips=[]; ups=[];
    var o={minFilter:T.LinearFilter,magFilter:T.LinearFilter,stencilBuffer:true}; /* со стенсилом глубина 24 бита, иначе 16 - плоское на полу рябит полосами */
    if(R.capabilities.isWebGL2&&T.WebGLMultisampleRenderTarget){ rt=new T.WebGLMultisampleRenderTarget(w,h,o); rt.samples=mob?2:4; } else rt=new T.WebGLRenderTarget(w,h,o);
    var mw=w>>1, mh=h>>1; for(var i=0;i<NM;i++){ mips.push(mk(mw,mh)); if(i<NM-1) ups.push(mk(mw,mh)); mw>>=1; mh>>=1; } }
  function pass(m,to){ quad.material=m; R.setRenderTarget(to); R.render(sc,cam); }
  this.render=function(scene,camera){ R.getDrawingBufferSize(sz); if(sz.x!==W||sz.y!==H) build(sz.x,sz.y);
    R.setRenderTarget(rt); R.render(scene,camera);
    var tm0=R.toneMapping; R.toneMapping=T.NoToneMapping; var sa=R.shadowMap.autoUpdate; R.shadowMap.autoUpdate=false;
    mBright.uniforms.t.value=rt.texture; mBright.uniforms.px.value.set(.5/W,.5/H); pass(mBright,mips[0]);
    for(var i=1;i<NM;i++){ mDown.uniforms.t.value=mips[i-1].texture; mDown.uniforms.px.value.set(1/mips[i-1].width,1/mips[i-1].height); pass(mDown,mips[i]); }
    var last=mips[NM-1]; for(i=NM-2;i>=0;i--){ mUp.uniforms.t.value=last.texture; mUp.uniforms.b.value=mips[i].texture; mUp.uniforms.px.value.set(.5/last.width,.5/last.height); pass(mUp,ups[i]); last=ups[i]; }
    mFin.uniforms.t.value=rt.texture; mFin.uniforms.b.value=last.texture; pass(mFin,null);
    R.toneMapping=tm0; R.shadowMap.autoUpdate=sa; };
  this.fin=mFin; this.bright=mBright; }

/* ---------- фасады: окна рядами. Возвращает картинку стен; у неё внутри вторая - только свет окон (горит ночью) ---------- */
function facade(c,style,seed){ var w=mob?128:256, h=w*2, a=cv(w,h), e=cv(w,h), x=a.getContext('2d'), y=e.getContext('2d'), F=P.fac, r=rnd(seed||Math.floor(Math.random()*1e6)+7), k=w/256;
  y.fillStyle='#000'; y.fillRect(0,0,w,h);
  function lit(px,py,pw,ph,col,al){ x.globalAlpha=al; x.fillStyle=col; x.fillRect(px,py,pw,ph); x.globalAlpha=1; y.globalAlpha=al; y.fillStyle=col; y.fillRect(px,py,pw,ph); y.globalAlpha=1; }
  function pick(){ return r()<F.accent?c:F.warm; }
  var g, i, j, fl, cols, fh, cw;
  if(style==='steklo'){ /* сплошное стекло: крупные ячейки, тонкие швы, редкий свет */
    g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,F.gB); g.addColorStop(.45,F.gA); g.addColorStop(.7,F.gB); g.addColorStop(1,F.gA); x.fillStyle=g; x.fillRect(0,0,w,h);
    fl=8; cols=4; fh=h/fl; cw=w/cols;
    for(j=0;j<fl;j++) for(i=0;i<cols;i++){ var q=r(); if(q<F.lit*.55) lit(i*cw+2*k,j*fh+2*k,cw-4*k,fh-4*k,pick(),.35+r()*.5); else if(q<.6){ x.globalAlpha=.08+r()*.1; x.fillStyle='#ffffff'; x.fillRect(i*cw,j*fh,cw,fh); x.globalAlpha=1; } }
    x.fillStyle=F.gA; for(i=0;i<=cols;i++) x.fillRect(i*cw-1*k,0,2*k,h); for(j=0;j<=fl;j++) x.fillRect(0,j*fh-1*k,w,2*k);
    x.globalAlpha=.25; x.fillStyle='#ffffff'; for(j=0;j<=fl;j++) x.fillRect(0,j*fh+1*k,w,1); x.globalAlpha=1; }
  else if(style==='lamel'){ /* вертикальные ламели: узкие окна между рёбрами, свет идёт столбиками */
    x.fillStyle=F.wall; x.fillRect(0,0,w,h); cols=8; cw=w/cols; fl=8; fh=h/fl;
    for(i=0;i<cols;i++){ g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,F.gB); g.addColorStop(1,F.gA); x.fillStyle=g; x.fillRect(i*cw+cw*.3,0,cw*.4,h);
      var on=r()<F.lit, c2=pick(); for(j=0;j<fl;j++){ if(r()<.14) on=!on; if(on&&r()<.8) lit(i*cw+cw*.3,j*fh+3*k,cw*.4,fh-6*k,c2,.5+r()*.5); }
      x.fillStyle=F.wall2; x.fillRect(i*cw,0,cw*.12,h); x.globalAlpha=.3; x.fillStyle='#ffffff'; x.fillRect(i*cw+cw*.12,0,1.5*k,h); x.globalAlpha=1; }
    x.fillStyle=F.wall2; for(j=0;j<fl;j++) x.fillRect(0,j*fh,w,2.5*k); }
  else { /* lenta (школа) и обычные башни: этажи с лентой окон; свет идёт длинными мягкими отрезками, а не вразброс */
    var ribbon=style==='lenta'; fl=8; cols=ribbon?16:8; fh=h/fl; cw=w/cols;
    var wl=C3(F.wall).lerp(C3(c),ribbon?.04:.1).getStyle(); x.fillStyle=wl; x.fillRect(0,0,w,h);
    for(j=0;j<fl;j++){ var y0=j*fh+fh*.34, gh=fh*(ribbon?.4:.46);
      g=x.createLinearGradient(0,y0,0,y0+gh); g.addColorStop(0,F.gB); g.addColorStop(1,F.gA); x.fillStyle=g; x.fillRect(0,y0,w,gh);
      var runs=r()<.25?0:(r()<.6?1:2);
      for(var q2=0;q2<runs;q2++){ if(r()>F.lit*2.2) continue; var st0=Math.floor(r()*cols), ln=2+Math.floor(r()*(ribbon?9:4)), col2=pick(), al=.5+r()*.4;
        for(i=st0;i<st0+ln;i++){ var ii=i%cols, ed=(i===st0||i===st0+ln-1)?.55:1, gg; [x,y].forEach(function(z){ gg=z.createLinearGradient(0,y0,0,y0+gh); gg.addColorStop(0,col2); gg.addColorStop(1,'#ffffff'); z.globalAlpha=al*ed*(.85+r()*.15); z.fillStyle=col2; z.fillRect(ii*cw,y0,cw,gh); z.globalAlpha=al*ed*.25; z.fillStyle=gg; z.fillRect(ii*cw,y0+gh*.55,cw,gh*.45); z.globalAlpha=1; }); } }
      var mw=(ribbon?1.2:2)*k; x.fillStyle=wl; y.fillStyle='#000'; for(i=0;i<cols;i++){ x.fillRect(i*cw-mw/2,y0,mw,gh); y.fillRect(i*cw-mw/2,y0,mw,gh); }
      x.globalAlpha=.16; x.fillStyle='#ffffff'; x.fillRect(0,y0+gh,w,1.5*k); x.globalAlpha=.35; x.fillStyle='#000000'; x.fillRect(0,y0-2*k,w,2*k); x.globalAlpha=1; }
    if(!ribbon&&r()<.6){ var vx=Math.floor(r()*cols)*cw; [x,y].forEach(function(z){ z.globalAlpha=.85; z.fillStyle=c; z.fillRect(vx-1.5*k,0,3*k,h); z.globalAlpha=1; }); } }
  var t=new T.CanvasTexture(a); t.wrapS=t.wrapT=T.RepeatWrapping; a._em=e; aniso(t); return t; }
function aniso(t){ if(R&&t) t.anisotropy=Math.min(mob?4:8,R.capabilities.getMaxAnisotropy()); return t; }
G.winTex=function(c){ return facade(c,'grid'); };
G.facTex=function(c,k){ return facade(c,k,k==='lenta'?31:k==='steklo'?47:59); };

/* ---------- пол платформы: круговые плиты со швами, светящиеся кольца, кромка ---------- */
function deckTex(RI){ var w=mob?1024:2048, a=cv(w), e=cv(w), x=a.getContext('2d'), y=e.getContext('2d'), D=P.deck, c=w/2, u=w/(2*RI), r=rnd(5), i, j;
  x.fillStyle=D.base; x.fillRect(0,0,w,w); y.fillStyle='#000'; y.fillRect(0,0,w,w);
  var rings=[0,5,9.5,14.5,19.5,25,30.5,36,41.5,47,52.5,57.5,RI+1];
  for(i=0;i<rings.length-1;i++){ var r0=rings[i]*u, r1=rings[i+1]*u, n=i?Math.max(6,Math.round(6.283*(rings[i]+rings[i+1])/2/7.5)):1, off=r()*6.283;
    for(j=0;j<n;j++){ var a0=off+j/n*6.283, a1=off+(j+1)/n*6.283, q=r();
      x.beginPath(); x.arc(c,c,r1,a0,a1); x.arc(c,c,r0,a1,a0,true); x.closePath();
      x.globalAlpha=q<.5?q*.5:0; x.fillStyle=D.hi; x.fill(); x.globalAlpha=q>.86?.22:0; x.fillStyle=D.joint; x.fill(); x.globalAlpha=1;
      if(n>1){ x.strokeStyle=D.joint; x.lineWidth=Math.max(1.2,u*.11); x.beginPath(); x.moveTo(c+Math.cos(a0)*r0,c+Math.sin(a0)*r0); x.lineTo(c+Math.cos(a0)*r1,c+Math.sin(a0)*r1); x.stroke(); } }
    x.strokeStyle=D.joint; x.lineWidth=Math.max(1.4,u*.13); x.beginPath(); x.arc(c,c,r1,0,6.283); x.stroke();
    x.strokeStyle='rgba(255,255,255,.07)'; x.lineWidth=1; x.beginPath(); x.arc(c,c,r1-Math.max(1.5,u*.12),0,6.283); x.stroke(); }
  /* мягкий свет от центра и затемнение к краю */
  var g=x.createRadialGradient(c,c,0,c,c,c); g.addColorStop(0,'rgba(255,255,255,.10)'); g.addColorStop(.35,'rgba(255,255,255,.03)'); g.addColorStop(.8,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.28)'); x.fillStyle=g; x.fillRect(0,0,w,w);
  /* кромка платформы: светлая полоса и насечки */
  x.strokeStyle=D.edge; x.lineWidth=u*2.2; x.beginPath(); x.arc(c,c,(RI-1.3)*u,0,6.283); x.stroke();
  x.strokeStyle=D.joint; x.lineWidth=Math.max(1,u*.1); for(i=0;i<120;i++){ var an=i/120*6.283; x.beginPath(); x.moveTo(c+Math.cos(an)*(RI-2.3)*u,c+Math.sin(an)*(RI-2.3)*u); x.lineTo(c+Math.cos(an)*(RI-.3)*u,c+Math.sin(an)*(RI-.3)*u); x.stroke(); }
  /* светящиеся кольца (как были: на .3 и .62 радиуса) и тонкая линия у кромки; огоньки на стыках */
  function neon(rad,col,lw,al){ [x,y].forEach(function(z,k){ z.save(); z.globalAlpha=al*(k?1:.9); z.strokeStyle=col; z.shadowColor=col; z.shadowBlur=u*.9; z.lineWidth=lw*u; z.beginPath(); z.arc(c,c,rad*u,0,6.283); z.stroke(); z.restore(); }); }
  neon(RI*.3,D.acc2,.16,.9); neon(RI*.62,D.acc2,.16,.75); neon(RI-2.6,D.acc,.12,.8);
  for(i=0;i<(mob?60:110);i++){ var rr=rings[2+Math.floor(r()*9)]*u, an2=r()*6.283, col=r()<.5?D.acc:'#ffe7a8', px=c+Math.cos(an2)*rr, py=c+Math.sin(an2)*rr; [x,y].forEach(function(z){ z.save(); z.fillStyle=col; z.shadowColor=col; z.shadowBlur=u*.5; z.globalAlpha=.9; z.beginPath(); z.arc(px,py,Math.max(1.2,u*.09),0,6.283); z.fill(); z.restore(); }); }
  var t=new T.CanvasTexture(a), te=new T.CanvasTexture(e); aniso(t); aniso(te); return [t,te]; }
function radial(stops){ var c=cv(128), x=c.getContext('2d'), g=x.createRadialGradient(64,64,0,64,64,64); stops.forEach(function(s){ g.addColorStop(s[0],s[1]); }); x.fillStyle=g; x.fillRect(0,0,128,128); return new T.CanvasTexture(c); }

/* ---------- запуск: свет, небо, облака, отражения, постобработка ---------- */
G.init=function(o){ R=o.R; S=o.S; CAM=o.C; X=o;
  R.toneMapping=T.ACESFilmicToneMapping; R.toneMappingExposure=P.exp;
  R.shadowMap.enabled=true; R.shadowMap.type=T.PCFSoftShadowMap; R.shadowMap.autoUpdate=false;
  var sd=sunDir(), cen=new T.Vector3(0,o.PY,o.CZ), sun=o.sun;
  sun.color.set(P.sun.c); sun.intensity=P.sun.i; sun.position.copy(cen).addScaledVector(sd,240); sun.target.position.copy(cen); S.add(sun.target);
  sun.castShadow=true; var sh=sun.shadow, B=o.RI+10; sh.mapSize.set(mob?1024:2048,mob?1024:2048); sh.camera.left=-B; sh.camera.right=B; sh.camera.top=B; sh.camera.bottom=-B; sh.camera.near=40; sh.camera.far=420; sh.camera.updateProjectionMatrix(); sh.bias=-.0015; sh.normalBias=.12; sh.radius=mob?2:3;
  if(o.amb) o.amb.intensity=P.amb;
  G.hemi=new T.HemisphereLight(C3(P.hemi[0]),C3(P.hemi[1]),P.hemi[2]); S.add(G.hemi);
  /* отражения: то же небо, только в маленькую карту окружения */
  try{ var es=new T.Scene(), em=domeMat(true); es.add(new T.Mesh(new T.SphereGeometry(50,32,16),em));
    var pm=new T.PMREMGenerator(R); S.environment=pm.fromScene(es,.03).texture; pm.dispose(); }catch(e){}
  /* купол неба и море облаков: идут за камерой, рисуются после звёзд и до города */
  (o.bg||[]).forEach(function(q){ if(q){ q.renderOrder=-10; if(q.material) q.material.fog=false; } });
  G.dome=new T.Mesh(new T.SphereGeometry(2000,48,24),domeMat(false)); G.dome.renderOrder=-6; G.dome.frustumCulled=false; S.add(G.dome);
  var cu=skyUni(), cl=P.cloud; cu.tC={value:NOISE}; cu.cLit={value:C3(cl.lit)}; cu.cSh={value:C3(cl.sh)}; cu.cGlow={value:C3(cl.glow)}; cu.uA={value:cl.a}; cu.uK=uK; cu.uCen={value:new T.Vector3(0,0,o.CZ)}; cu.uSc={value:1};
  G.clouds=new T.Mesh(new T.CircleGeometry(2300,64),new T.ShaderMaterial({uniforms:cu,transparent:true,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vW; void main(){ vec4 p=modelMatrix*vec4(position,1.); vW=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
    fragmentShader:SKY_GLSL+'\nvarying vec3 vW; uniform vec3 cLit,cSh,cGlow,uCen; uniform float uA,uK,uSc; uniform sampler2D tC;\nvoid main(){ vec2 p=(vW.xz-uCen.xz)/uSc; float n=texture2D(tC,p*.0016+vec2(uT*.0022,0.)).r*.55+texture2D(tC,p*.0046-vec2(0.,uT*.0035)).r*.3+texture2D(tC,p*.0131+vec2(uT*.006)).r*.15;'
      +' float d=smoothstep(.4,.62,n); float dist=length(p); float far=smoothstep(700.,2100.,dist); vec3 v=normalize(vW-cameraPosition); float s=pow(max(dot(normalize(vec3(v.x,0.,v.z)),normalize(vec3(uSun.x,0.,uSun.z))),0.),5.);'
      +' vec3 col=mix(cSh,cLit,smoothstep(.42,.7,n)); col+=uSunC*s*.35*smoothstep(.4,.8,n); col+=cGlow*exp(-dist*dist/26000.)*.55*(.4+n);'
      +' vec3 hz=sky(normalize(vec3(v.x,.0,v.z))); col=mix(col,hz,far); float a=mix(d*uA,1.,far); gl_FragColor=vec4(col,a*uK); }'}));
  G.clouds.rotation.x=-Math.PI/2; G.clouds.position.set(0,o.PY+cl.y,o.CZ); G.clouds.renderOrder=-5; G.clouds.frustumCulled=false; S.add(G.clouds);
  try{ G.pp=new Post(); }catch(e){ G.pp=null; } };

/* ---------- город: пол, материалы, пятна света, тени. Зовётся один раз, когда город собран ---------- */
G.city=function(LK,o){ if(LK.g.userData.gfx) return; LK.g.userData.gfx=1; var PY=X.PY, CZ=X.CZ, RI=X.RI, grp=LK.g, D=P.deck;
  LK.fog=new T.Fog(C3(P.fog[0]),P.fog[1],P.fog[2]);
  /* пол */
  if(LK.deck){ var dt=deckTex(RI), ms=LK.deck.material; ms[1]=new T.MeshStandardMaterial({map:dt[0],emissive:0xffffff,emissiveMap:dt[1],emissiveIntensity:D.em,metalness:D.met,roughness:D.rough,envMapIntensity:.85});
    ms[0]=new T.MeshStandardMaterial({color:C3(D.edge),metalness:.8,roughness:.35,emissive:C3(D.acc),emissiveIntensity:.05}); LK.deck.receiveShadow=true; }
  if(LK.rock){ var rm=LK.rock.material; rm.color.set(P.rock[0]); rm.emissive.set(P.rock[1]); rm.emissiveIntensity=P.rock[2]; rm.roughness=.85; rm.metalness=.05; }
  /* материалы: свет окон отдельной картой, тёмно-синие корпуса - в цвет палитры, сглаживание картинок под углом */
  var seen=new Set(), body=C3(P.body), hs={};
  grp.traverse(function(q){ var ml=q.material; if(!ml) return; (Array.isArray(ml)?ml:[ml]).forEach(function(m){ if(seen.has(m)) return; seen.add(m);
    if(m.map) aniso(m.map);
    if(m.map&&m.map.image&&m.map.image._em&&m.isMeshStandardMaterial){ var im=m.map.image; if(!im._et){ im._et=new T.CanvasTexture(im._em); im._et.wrapS=im._et.wrapT=T.RepeatWrapping; aniso(im._et); }
      m.emissiveMap=im._et; m.color.set(0xffffff); m.emissive.set(0xffffff); m.emissiveIntensity=P.fac.em; if(m.e0!=null) m.e0=P.fac.em; m.metalness=.35; m.roughness=.4; m.envMapIntensity=.55; m.needsUpdate=true; return; }
    if(P.bodyK&&m.isMeshStandardMaterial&&!m.isMeshPhysicalMaterial&&!m.map&&!m.transparent&&m!==LK.rock.material){ m.color.getHSL(hs); if(hs.l<.24&&hs.h>.55&&hs.h<.75){ m.color.lerp(body,P.bodyK); m.roughness=Math.max(m.roughness,.45); m.metalness=Math.min(m.metalness,.3); } } }); });
  /* тени-контакты и пятна света от неона под каждым зданием */
  var aoT=radial([[0,'rgba(0,0,0,.9)'],[.45,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]), plT=radial([[0,'rgba(255,255,255,.75)'],[.3,'rgba(255,255,255,.3)'],[1,'rgba(255,255,255,0)']]);
  var aoM=new T.MeshBasicMaterial({map:aoT,transparent:true,depthWrite:false,opacity:P.ao,toneMapped:false}), geo=new T.PlaneGeometry(1,1);
  function decal(m,x,z,sx,sz,y,ry){ var d=new T.Mesh(geo,m); d.rotation.x=-Math.PI/2; d.rotation.z=ry||0; d.position.set(x,PY+y,z); d.scale.set(sx,sz,1); d.renderOrder=-2; grp.add(d); return d; }
  LK.nodes.forEach(function(n){ if(!n.city) return; var r=n.rb?15:n.kind==='mod'?13:8, ry=n.rb?Math.atan2(n.p[0],n.p[2]-CZ):0;
    decal(aoM,n.p[0],n.p[2],n.rb?r*1.05:r,n.rb?r*1.75:r,.025,ry);
    decal(new T.MeshBasicMaterial({map:plT,color:C3(n.c),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:P.pool,toneMapped:false}),n.p[0],n.p[2],r*2.1,r*2.1,.035); });
  decal(new T.MeshBasicMaterial({map:plT,color:C3('#9fe8ff'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:P.pool*.7,toneMapped:false}),0,CZ,30,30,.035);
  /* тени: всё неподвижное в городе бросает и принимает тень; карта теней считается один раз */
  var mv=o&&o.moving?o.moving():new Set();
  (function walk(q,skip){ skip=skip||mv.has(q); if(q.isMesh&&!skip){ var m=Array.isArray(q.material)?q.material[0]:q.material; if(m&&(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial)&&!(m.transparent&&m.opacity<.7)){ var gb=q.geometry.boundingBox||(q.geometry.computeBoundingBox(),q.geometry.boundingBox), hgt=(gb.max.y-gb.min.y)*(q.isInstancedMesh?Math.hypot(q.instanceMatrix.array[4],q.instanceMatrix.array[5],q.instanceMatrix.array[6]):Math.abs(q.scale.y)), flat=hgt<.45&&Math.abs(q.rotation.x)<.2&&Math.abs(q.rotation.z)<.2; q.castShadow=q!==LK.deck&&q!==LK.rock&&!flat; q.receiveShadow=!flat||q===LK.deck; } }
    for(var i=0;i<q.children.length;i++) walk(q.children[i],skip); })(grp,false);
  G.shadows(); };
G.shadows=function(){ if(R) R.shadowMap.needsUpdate=true; };
/* копия города под крышей открытого модуля: тени туда не идут (иначе лягут не на свои места) */
G.noShadow=function(g){ g.traverse(function(q){ q.castShadow=false; q.receiveShadow=false; }); };
/* смена уровня: облака и туман стоят под тем городом, который сейчас виден */
G.level=function(L,LK){ if(!G.clouds) return; var u=G.clouds.material.uniforms, cl=P.cloud;
  if(L&&L.open&&L.city){ var k=L.city.scale.x; G.clouds.position.set(L.city.position.x,L.city.position.y+cl.y*k,L.city.position.z); G.clouds.scale.setScalar(Math.min(k,1)); u.uCen.value.copy(L.city.position); u.uSc.value=k; G.clouds.visible=true; kT=1; G.inCity=false; }
  else if(L===LK){ G.clouds.position.set(0,X.PY+cl.y,X.CZ); G.clouds.scale.setScalar(1); u.uCen.value.set(0,0,X.CZ); u.uSc.value=1; G.clouds.visible=true; G.inCity=true; if(R) R.shadowMap.needsUpdate=true; }
  else { G.inCity=false; kT=L&&L.loc?0:kT; G.clouds.visible=false; }
  G.lv=L; };
var cc=new T.Vector3();
G.frame=function(dt,tm,camP,gate){ uT.value=tm; if(G.inCity){ cc.set(0,X.PY,X.CZ); var d=camP.distanceTo(cc); kT=1-Math.min(1,Math.max(0,(d-380)/700)); } if(gate) kT=0;
  uK.value+=(kT-uK.value)*Math.min(1,dt*2.5); if(G.dome){ G.dome.position.copy(camP); G.dome.visible=uK.value>.01; if(G.clouds&&uK.value<=.01) G.clouds.visible=false; else if(G.clouds&&(G.inCity||(G.lv&&G.lv.open))) G.clouds.visible=true; } };
G.render=function(sc,cam){ if(G.post&&G.pp){ try{ G.pp.render(sc,cam); return; }catch(e){ G.post=false; G.err=String(e&&e.stack||e); R.setRenderTarget(null); } } R.render(sc,cam); };
/* слабый телефон: выключаем постобработку (свечение и сглаживание), тени и пол остаются - они почти бесплатные */
G.lite=function(){ if(/[?&]gq=1/.test(location.search)) return; /* ?gq=1 - не упрощать (для снимков) */ G.post=false; if(R) R.setRenderTarget(null); };
})();
