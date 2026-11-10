/* inter.js - набор современной графики помещений курса FPV (модули 2, 3, 5), проба 10.11.2026.
   Что даёт:
   - запечённый мягкий свет на стенах, полу и потолке (рисуется один раз, телефон не грузит);
   - настоящие отражения в полу (зеркальная копия комнаты под полупрозрачным полом);
   - мягкие тени от мебели, свечение ламп и неона (bloom), сглаживание, виньетка;
   - стены без щелей: каждая комната - замкнутая коробка, проёмы закрыты порталами дверей;
   - три стиля: A "Светлый технопарк", B "Неоновая станция", C "Лофт-мастерская".
   Нужны: three.min.js (r128), RoomEnvironment.js, post.js (свои копии).
   var G = INTER.create({ renderer, scene, camera, style:'A', accent:'#ffd36e', quality:'high'|'mid'|'low' }); */
(function () {
'use strict';
var T = window.THREE;

/* ------------------------------------------------------------------ стили */
var STYLES = {
  A: { name: 'Светлый технопарк', bg: '#dfe6f0', fog: null,
    wall: '#eef1f6', wallSeam: 'rgba(120,135,165,.35)', wallKind: 'panel', wallRough: .62,
    feature: 'wood', floorTex: 'tile', floorTint: '#dfe3ea', floorTile: 2.4, floorRough: .22, floorMetal: 0, mirror: .14,
    ceil: '#f6f7fa', trim: '#aeb6c6', trimMetal: .7, frame: '#2b3242', frameMetal: .55, leaf: 'glass',
    base: '#8f98ab', lmBase: [.39, .39, .40], lamp: '#fff1dc', lampPow: .48, lampKind: 'panel', lampEm: 3.2,
    cove: '#ffe9c4', coveEm: 2.2, neonEdge: 0, accentK: 1.9,
    hemi: ['#ffffff', '#b9b3a8', .16], key: ['#fff3dd', .55], env: .32, exposure: 1.0, bloom: [.35, .5, 1.5], vignette: .22, tint: [1.0, 1.0, 1.0],
    signBg: '#ffffff', signFg: '#1a2238', dark: false },
  B: { name: 'Неоновая станция', bg: '#04050c', fog: ['#070a18', .012],
    wall: '#2c3554', wallSeam: 'rgba(0,0,0,.55)', wallKind: 'tech', wallRough: .42,
    feature: 'tech', floorTex: 'smooth_concrete_floor', floorTint: '#39425e', floorTile: 3.2, floorRough: .16, floorMetal: .35, mirror: .25,
    ceil: '#12162a', trim: '#2a3150', trimMetal: .8, frame: '#232a44', frameMetal: .75, leaf: 'metal',
    base: '#0c0f1c', lmBase: [.27, .30, .44], lamp: '#cfe4ff', lampPow: .55, lampKind: 'line', lampEm: 4.2,
    cove: '#7cf3ff', coveEm: 3.0, neonEdge: 1, accentK: 3.2,
    hemi: ['#a9b8ff', '#2a1c48', .46], key: ['#dfe8ff', .6], env: .8, exposure: 1.08, bloom: [.8, .65, 1.0], vignette: .42, tint: [.97, .99, 1.06],
    signBg: '#0b0f20', signFg: '#eaf2ff', dark: true },
  C: { name: 'Лофт-мастерская', bg: '#1a1410', fog: null,
    wall: '#f3eee6', wallSeam: 'rgba(0,0,0,0)', wallKind: 'plaster', wallRough: .85,
    feature: 'brick', floorTex: 'laminate_floor_02', floorTint: '#ffffff', floorTile: 2.6, floorRough: .42, floorMetal: 0, mirror: .10,
    ceil: '#4a443e', trim: '#1c1c1f', trimMetal: .6, frame: '#1b1b1e', frameMetal: .65, leaf: 'loft',
    base: '#1c1c1f', lmBase: [.50, .48, .45], lamp: '#ffe0b4', lampPow: .55, lampKind: 'pendant', lampEm: 4.5,
    cove: '#ffc98a', coveEm: 0, neonEdge: 0, accentK: 2.2,
    hemi: ['#ffeeda', '#5a4a3c', .30], key: ['#ffe2b8', .7], env: .5, exposure: 1.06, bloom: [.5, .6, 1.0], vignette: .34, tint: [1.04, 1.0, .95],
    signBg: '#15151a', signFg: '#fff4e2', dark: true }
};

function create(o) {
  var S = STYLES[o.style || 'A'], ren = o.renderer, sc = o.scene, cam = o.camera;
  var Q = o.quality || 'high', ACC = o.accent || '#ffd36e', TEX = o.tex || 'tex/';
  var G = { S: S, style: o.style || 'A', accent: ACC, quality: Q, mat: {}, frames: [], pairs: [], lamps: [] };
  var world = new T.Group(), mirror = new T.Group(); mirror.scale.y = -1; sc.add(world); sc.add(mirror);
  G.world = world; G.mirrorGroup = mirror;
  var MIRROR = Q !== 'low' && S.mirror > 0, MIR = new WeakMap();
  G.mirrorOf = function (o) { return MIR.get(o) || null; };
  G.show = function (o, on) { o.visible = on; var c = MIR.get(o); if (c) c.visible = on; };

  function col(c) { return new T.Color(c).convertSRGBToLinear(); }
  function ctex(w, h, draw, srgb) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var c = cv.getContext('2d'); draw(c, w, h);
    var t = new T.CanvasTexture(cv); if (srgb !== false) t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.userData = { x: c }; return t; }
  G.col = col; G.ctex = ctex;
  var TL = new T.TextureLoader();
  function ltex(file, srgb) { var t = TL.load(TEX + file); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; if (srgb) t.encoding = T.sRGBEncoding; return t; }
  function pbr(name, tint, rough, metal) { var m = new T.MeshStandardMaterial({ map: ltex(name + '_diff.jpg', true), normalMap: ltex(name + '_nor.jpg'), roughnessMap: ltex(name + '_rough.jpg'),
    color: col(tint || '#fff'), roughness: rough == null ? 1 : rough, metalness: metal || 0 }); m.envMapIntensity = S.env; return m; }
  function std(c, r, m, o2) { var mt = new T.MeshStandardMaterial(Object.assign({ color: col(c), roughness: r == null ? .6 : r, metalness: m || 0 }, o2 || {})); mt.envMapIntensity = S.env; return mt; }
  function glow(c, k) { return new T.MeshBasicMaterial({ color: col(c).multiplyScalar(k || 2) }); }
  G.std = std; G.glow = glow; G.pbr = pbr;

  /* ---------- рендер: тон, окружение, эффекты ---------- */
  ren.outputEncoding = T.sRGBEncoding; ren.physicallyCorrectLights = false;
  ren.shadowMap.enabled = Q !== 'low'; ren.shadowMap.type = T.PCFSoftShadowMap;
  sc.background = col(S.bg); if (S.fog) sc.fog = new T.FogExp2(col(S.fog[0]), S.fog[1]);
  var pm = new T.PMREMGenerator(ren);
  if (T.RoomEnvironment) sc.environment = pm.fromScene(new T.RoomEnvironment(), .04).texture;
  /* окружение из самой комнаты: блики и отражения на предметах повторяют её свет */
  G.bakeEnv = function (x, y, z) { var p = sc.position.clone(), f = sc.fog, bg = sc.background ? sc.background.clone() : null, hid = [], op = [];
    /* прозрачное и светящееся наложением в карту окружения не пишем (иначе в ней мусор) */
    sc.traverse(function (m) { if (!m.isMesh || !m.material || !m.material.transparent || !m.visible) return; if (m.userData.floor) { m.material.transparent = false; op.push(m); } else { m.visible = false; hid.push(m); } });
    sc.fog = null; sc.position.set(-x, -y, -z); sc.updateMatrixWorld(true); mirror.visible = false;
    var e = pm.fromScene(sc, .035, .1, 60).texture; sc.position.copy(p); sc.updateMatrixWorld(true); mirror.visible = true; sc.fog = f; sc.background = bg;
    hid.forEach(function (m) { m.visible = true; }); op.forEach(function (m) { m.material.transparent = true; });
    sc.environment = e; return e; };
  var composer = null, bloom = null, fin = null;
  var gl = ren.getContext(), GL2 = ren.capabilities.isWebGL2;
  var canHDR = GL2 && !!(ren.extensions.get('EXT_color_buffer_float') || ren.extensions.get('EXT_color_buffer_half_float'));
  if (Q !== 'low' && T.EffectComposer && canHDR) {
    var RTC = Q === 'high' && T.WebGLMultisampleRenderTarget ? T.WebGLMultisampleRenderTarget : T.WebGLRenderTarget;
    var rt = new RTC(4, 4, { type: T.HalfFloatType, format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter });
    composer = new T.EffectComposer(ren, rt); composer.addPass(new T.RenderPass(sc, cam));
    bloom = new T.UnrealBloomPass(new T.Vector2(256, 256), S.bloom[0], S.bloom[1], S.bloom[2]); composer.addPass(bloom);
    fin = new T.ShaderPass({ uniforms: { tDiffuse: { value: null }, exposure: { value: S.exposure }, vig: { value: S.vignette }, tint: { value: new T.Vector3(S.tint[0], S.tint[1], S.tint[2]) }, time: { value: 0 }, px: { value: new T.Vector2(1, 1) }, fxaa: { value: RTC === T.WebGLRenderTarget ? 1 : 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform sampler2D tDiffuse; uniform float exposure, vig, time, fxaa; uniform vec3 tint; uniform vec2 px; varying vec2 vUv;',
        'vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }',
        'vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));',
        ' const mat3 O = mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));',
        ' c *= exposure/0.6; c = I*c; c = RRTAndODTFit(c); c = O*c; return clamp(c,0.0,1.0); }',
        'float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }',
        'void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;',
        ' if (fxaa > 0.5) { vec3 n = texture2D(tDiffuse, vUv+vec2(0.0,px.y)).rgb, s = texture2D(tDiffuse, vUv-vec2(0.0,px.y)).rgb, e = texture2D(tDiffuse, vUv+vec2(px.x,0.0)).rgb, w = texture2D(tDiffuse, vUv-vec2(px.x,0.0)).rgb;',
        '  float lc = luma(c), ln = luma(n), ls = luma(s), le = luma(e), lw = luma(w); float rng = max(max(ln,ls),max(le,max(lw,lc))) - min(min(ln,ls),min(le,min(lw,lc)));',
        '  if (rng > 0.08) c = mix(c, (n+s+e+w)*0.25, 0.55); }',
        ' c = aces(c * tint);',
        ' c = mix(c * 12.92, pow(c, vec3(1.0/2.4)) * 1.055 - 0.055, step(0.0031308, c));',
        ' vec2 d = vUv - 0.5; float v = smoothstep(0.35, 0.95, length(d) * 1.25); c *= 1.0 - v * vig;',
        ' float g = fract(sin(dot(vUv * (time + 1.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5; c += g * 0.012;',
        ' gl_FragColor = vec4(c, 1.0); }'].join('\n') });
    composer.addPass(fin);
    ren.toneMapping = T.NoToneMapping;
  } else { ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = S.exposure; }
  G.hdr = !!composer;
  G.resize = function (w, h, dpr) { dpr = Math.min(dpr, dprCap); lastSize = [w, h]; ren.setPixelRatio(dpr); ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); fin.uniforms.px.value.set(1 / (w * dpr), 1 / (h * dpr)); } };
  var tAll = 0;
  G.render = function (dt) { tAll += dt; for (var i = 0; i < G.frames.length; i++) G.frames[i](dt, tAll);
    if (mirror.visible) for (i = 0; i < G.pairs.length; i++) { var p = G.pairs[i]; p[1].position.copy(p[0].position); p[1].rotation.copy(p[0].rotation); p[1].scale.copy(p[0].scale); p[1].visible = p[0].visible; }
    if (composer) { fin.uniforms.time.value = tAll % 10; composer.render(dt); } else ren.render(sc, cam); };
  G.frame = function (f) { G.frames.push(f); };
  /* если телефон не тянет - снимаем эффекты по шагам, без перезагрузки: 1) меньше точек, 2) без свечения, отражений и теней */
  var lowStep = 0, dprCap = 9, lastSize = null; G.dprCap = function () { return dprCap; };
  G.lower = function () { if (lowStep === 0) { dprCap = 1; if (lastSize) G.resize(lastSize[0], lastSize[1], 1); lowStep = 1; return 1; }
    if (lowStep === 1) { lowStep = 2; composer = null; G.hdr = false; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = S.exposure; ren.shadowMap.enabled = false; key.castShadow = false; mirror.visible = false; MIRROR = false;
      sc.traverse(function (m) { if (m.isMesh && m.material) { if (m.userData.floor) { m.material.transparent = false; m.material.opacity = 1; } m.material.needsUpdate = true; } }); G.quality = 'low'; return 2; }
    return 0; };

  /* ---------- добавить предмет (и его отражение в полу) ---------- */
  G.add = function (obj, opt) { opt = opt || {}; world.add(obj);
    if (opt.shadow !== false) obj.traverse(function (m) { if (m.isMesh && !m.userData.noShadow && !(m.material && m.material.transparent)) { m.castShadow = true; m.receiveShadow = true; } });
    if (MIRROR && opt.mirror !== false) { var c = mclone(obj); mirror.add(c); if (opt.live) G.pairs.push([obj, c]); MIR.set(obj, c); }
    return obj; };
  /* копия для отражения: та же геометрия и материалы, без данных и без нажатий */
  function noRay() {}
  function mclone(o) { var c; if (o.isMesh) { c = new T.Mesh(o.geometry, o.material); c.renderOrder = -3; c.raycast = noRay; } else c = new T.Group();
    c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale); c.visible = o.visible;
    for (var i = 0; i < o.children.length; i++) { var k = o.children[i]; if (k.isLight || k.isCamera || k.isLine || k.isPoints || k.isSprite || k.userData.noMirror) { c.add(new T.Group()); continue; } c.add(mclone(k)); }
    return c; }
  /* взять предмет, который сцена добавила сама (не через G.add): тени, отражение, яркость экранов */
  G.adopt = function (obj, opt) { opt = opt || {};
    obj.traverse(function (m) { if (!m.isMesh || !m.material || m.userData.adopted) return; m.userData.adopted = true; var mt = m.material;
      if (mt.isMeshStandardMaterial) { if (!mt.transparent && !m.userData.noShadow) { m.castShadow = true; m.receiveShadow = true; } mt.envMapIntensity = S.env; }
      else if (mt.isMeshBasicMaterial && mt.map && !mt.transparent && !mt.userData.boost && composer) { mt.userData.boost = true; mt.color.multiplyScalar(1.15); } });
    if (MIRROR && opt.mirror !== false && !MIR.get(obj)) { var c = mclone(obj); mirror.add(c); G.pairs.push([obj, c]); MIR.set(obj, c); } };
  function mesh(geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); return m; }
  G.box = function (w, h, d, mat, x, y, z) { return mesh(new T.BoxGeometry(w, h, d), mat, x, y, z); };
  /* коробка со скруглёнными рёбрами */
  G.rbox = function (w, h, d, r, mat, x, y, z) { r = Math.min(r, w / 2 - .001, h / 2 - .001);
    var s = new T.Shape(), a = w / 2 - r, b = h / 2 - r; s.absarc(a, b, r, 0, Math.PI / 2); s.absarc(-a, b, r, Math.PI / 2, Math.PI); s.absarc(-a, -b, r, Math.PI, Math.PI * 1.5); s.absarc(a, -b, r, Math.PI * 1.5, Math.PI * 2);
    var bv = Math.min(r * .5, d * .3, .02), g = new T.ExtrudeGeometry(s, { depth: d - bv * 2, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 3, curveSegments: 8 }); g.translate(0, 0, -(d - bv * 2) / 2);
    return mesh(g, mat, x, y, z); };

  /* ---------- общие материалы ---------- */
  var M = G.mat;
  M.trim = std(S.trim, .35, S.trimMetal); M.frame = std(S.frame, .4, S.frameMetal); M.base = std(S.base, .5, .3);
  M.dark = std('#14161f', .45, .5); M.accent = glow(ACC, S.accentK); M.lamp = glow(S.lamp, S.lampEm); M.cove = glow(S.cove, S.coveEm || 1);
  M.cyan = glow('#7cf3ff', S.accentK); M.white = std('#f2f4f8', .5, 0);
  M.glass = new T.MeshPhysicalMaterial({ color: col(S.dark ? '#9fc4ff' : '#dff0ff'), roughness: .08, metalness: 0, transparent: true, opacity: .22, envMapIntensity: 1.2, depthWrite: false });
  M.frost = new T.MeshPhysicalMaterial({ color: col('#eaf4ff'), roughness: .35, metalness: 0, transparent: true, opacity: .62, envMapIntensity: 1 });
  /* мягкое пятно света (ореол ламп, свет на полу) */
  var spotTex = ctex(128, 128, function (c) { var g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.38)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  G.halo = function (c, k, w, h) { var m = new T.Mesh(new T.PlaneGeometry(w, h || w), new T.MeshBasicMaterial({ map: spotTex, color: col(c).multiplyScalar(k), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); m.userData.noShadow = true; return m; };

  /* фактуры стен */
  var wallTex = {};
  function wallMap(kind) { if (wallTex[kind]) return wallTex[kind]; var t;
    if (kind === 'panel') t = ctex(512, 512, function (c, w, h) { c.fillStyle = S.wall; c.fillRect(0, 0, w, h);
      var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,20,.05)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(96,112,150,.13)'; c.fillRect(0, 352, w, 160); c.fillStyle = S.wallSeam; c.fillRect(0, 0, 3, h); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(3, 0, 2, h); c.fillStyle = ACC; c.fillRect(0, 346, w, 6); c.fillStyle = 'rgba(60,70,95,.35)'; c.fillRect(0, 352, w, 2); });
    else if (kind === 'tech') t = ctex(512, 512, function (c, w, h) { c.fillStyle = S.wall; c.fillRect(0, 0, w, h);
      var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(140,160,255,.07)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, 5, h); c.fillRect(0, 300, w, 5); c.fillStyle = 'rgba(150,170,255,.16)'; c.fillRect(5, 0, 2, h); c.fillRect(0, 305, w, 2);
      c.fillStyle = 'rgba(0,0,0,.35)'; for (var i = 0; i < 6; i++) c.fillRect(60 + i * 26, 330, 14, 4); c.fillStyle = 'rgba(150,170,255,.10)'; c.fillRect(40, 40, 432, 2); c.fillRect(40, 470, 432, 2); });
    wallTex[kind] = t; t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function wallMat(kind) { var m;
    if (kind === 'plaster') { m = std(S.wall, .9, 0); m.normalMap = ltex('white_plaster_02_nor.jpg'); m.normalScale = new T.Vector2(.6, .6); m.userData.tile = [2.4, 2.4]; }
    else if (kind === 'brick') { m = pbr('brick_wall_001', '#f2e6dc', 1); m.userData.tile = [1.6, 1.6]; }
    else if (kind === 'wood') { m = pbr('laminate_floor_02', '#f3e3cc', .9); m.userData.tile = [2.2, 2.2]; m.userData.rot = true; }
    else { m = std('#ffffff', S.wallRough, kind === 'tech' ? .35 : 0); m.map = wallMap(kind); m.userData.tile = kind === 'tech' ? [1.6, 3.2] : [1.2, 3.2]; }
    return m; }
  var floorBase;
  if (S.floorTex === 'tile') { /* крупная светлая плитка: рисуем сами */
    var tl = ctex(1024, 1024, function (c, w, h) { c.fillStyle = S.floorTint; c.fillRect(0, 0, w, h); var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(11);
      for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) { c.fillStyle = 'rgba(' + (rnd() > .5 ? '255,255,255' : '90,100,130') + ',' + (.03 + rnd() * .05) + ')'; c.fillRect(i * 512, j * 512, 512, 512); }
      for (i = 0; i < 2600; i++) { c.fillStyle = 'rgba(' + (rnd() > .5 ? '255,255,255' : '70,80,110') + ',' + rnd() * .10 + ')'; var r = 1 + rnd() * 5; c.beginPath(); c.arc(rnd() * w, rnd() * h, r, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(60,70,95,.55)'; for (i = 0; i < 2; i++) { c.fillRect(i * 512 - 2, 0, 4, h); c.fillRect(0, i * 512 - 2, w, 4); } c.fillRect(w - 2, 0, 2, h); c.fillRect(0, h - 2, w, 2); });
    tl.wrapS = tl.wrapT = T.RepeatWrapping; floorBase = std('#ffffff', S.floorRough, S.floorMetal); floorBase.map = tl; }
  else { floorBase = pbr(S.floorTex, S.floorTint, null, S.floorMetal); floorBase.roughness = S.floorRough * 2.2; } /* карта шероховатости умножается */
  floorBase.envMapIntensity = S.env * 1.2;
  var ceilBase = std(S.ceil, .9, 0);

  /* ---------- геометрия из прямоугольников с двумя наборами координат (фактура и запечённый свет) ---------- */
  function QB() { this.p = []; this.n = []; this.uv = []; this.uv2 = []; this.ix = []; }
  QB.prototype.quad = function (P, N, UV, UV2) { var b = this.p.length / 3; for (var i = 0; i < 4; i++) { this.p.push(P[i][0], P[i][1], P[i][2]); this.n.push(N[0], N[1], N[2]); this.uv.push(UV[i][0], UV[i][1]); this.uv2.push(UV2[i][0], UV2[i][1]); } this.ix.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  QB.prototype.geo = function () { var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2)); g.setAttribute('uv2', new T.Float32BufferAttribute(this.uv2, 2)); g.setIndex(this.ix); return g; };

  /* ---------- запекание света ---------- */
  function rgb(a, k) { return 'rgb(' + Math.round(Math.min(1, a[0] * k) * 255) + ',' + Math.round(Math.min(1, a[1] * k) * 255) + ',' + Math.round(Math.min(1, a[2] * k) * 255) + ')'; }
  function hexA(c, a) { var k = new T.Color(c); return 'rgba(' + Math.round(k.r * 255) + ',' + Math.round(k.g * 255) + ',' + Math.round(k.b * 255) + ',' + a + ')'; }
  function lmTex(w, h, draw) { var t = ctex(w, h, function (c, w2, h2) { draw(c, w2, h2); /* шум против "ступенек" в тёмных переходах */
      var im = c.getImageData(0, 0, w2, h2), d = im.data, sd = 12345; for (var i = 0; i < d.length; i += 4) { sd = (sd * 1103515245 + 12345) & 0x7fffffff; var n = ((sd >> 8) % 500) / 100 - 2.5; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(im, 0, 0); }); t.flipY = false; t.anisotropy = 1; t.generateMipmaps = false; t.minFilter = T.LinearFilter; return t; }
  function pool(c, x, y, r, color, a, sy) { c.save(); c.translate(x, y); c.scale(1, sy || 1); var g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, hexA(color, a)); g.addColorStop(.45, hexA(color, a * .45)); g.addColorStop(1, hexA(color, 0)); c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2); c.restore(); }
  function edge(c, x0, y0, x1, y1, a) { var g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(.4, 'rgba(0,0,0,' + a * .3 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; return g; }

  /* ---------- комната: замкнутая коробка с проёмами ----------
     r: { x0,z0,x1,z1,h, holes:{ n:[[a0,a1,top,bottom]], s, e, w }, walls:{ n:'brick', ... }, lamps:[[x,z,pow]], glowN/S/E/W... }
     сторона n - стена z=z0, s - z=z1, w - x=x0, e - x=x1; a - координата вдоль стены (x или z) */
  G.room = function (r) { var x0 = r.x0, x1 = r.x1, z0 = r.z0, z1 = r.z1, H = r.h || 3.2, W = x1 - x0, D = z1 - z0, lamps = r.lamps || [], holes = r.holes || {}, wk = r.walls || {};
    var PX = 40; /* точек на метр в карте света */
    var grp = new T.Group();
    /* пол */
    var fl = floorBase.clone(); var ft = S.floorTile;
    fl.lightMap = lmTex(Math.max(64, Math.round(W * PX / 2)), Math.max(64, Math.round(D * PX / 2)), function (c, w, h) { var kx = w / W, kz = h / D;
      c.fillStyle = rgb(S.lmBase, .92); c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'lighter';
      lamps.forEach(function (l) { pool(c, (l[0] - x0) * kx, (l[1] - z0) * kz, 3.4 * kx, S.lamp, S.lampPow * (l[2] || 1) * .85, kz / kx); });
      (r.glows || []).forEach(function (g) { pool(c, (g[0] - x0) * kx, (g[1] - z0) * kz, (g[3] || 2.2) * kx, g[2], g[4] || .5, kz / kx); });
      if (S.neonEdge) { c.globalAlpha = .55; [[0, 0, 0, .9 * kz], [0, h, 0, h - .9 * kz]].forEach(function (e) { var g = c.createLinearGradient(e[0], e[1], e[2], e[3]); g.addColorStop(0, hexA(ACC, .8)); g.addColorStop(1, hexA(ACC, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); });
        [[0, 0, .9 * kx, 0], [w, 0, w - .9 * kx, 0]].forEach(function (e) { var g = c.createLinearGradient(e[0], e[1], e[2], e[3]); g.addColorStop(0, hexA(ACC, .8)); g.addColorStop(1, hexA(ACC, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); }); c.globalAlpha = 1; }
      c.globalCompositeOperation = 'source-over'; var e = .7;
      edge(c, 0, 0, e * kx, 0, .42); c.fillRect(0, 0, w, h); edge(c, w, 0, w - e * kx, 0, .42); c.fillRect(0, 0, w, h); edge(c, 0, 0, 0, e * kz, .42); c.fillRect(0, 0, w, h); edge(c, 0, h, 0, h - e * kz, .42); c.fillRect(0, 0, w, h); });
    fl.lightMapIntensity = .62; if (MIRROR) { fl.transparent = true; fl.opacity = 1 - S.mirror; }
    var q = new QB(); q.quad([[x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0]], [0, 1, 0], [[x0 / ft, z1 / ft], [x1 / ft, z1 / ft], [x1 / ft, z0 / ft], [x0 / ft, z0 / ft]], [[0, 1], [1, 1], [1, 0], [0, 0]]);
    var floor = new T.Mesh(q.geo(), fl); floor.receiveShadow = true; floor.userData.floor = true; floor.userData.noMirror = true; floor.userData.noShadow = true; floor.renderOrder = -1; grp.add(floor);
    /* потолок */
    var cl = ceilBase.clone();
    cl.lightMap = lmTex(Math.max(64, Math.round(W * PX / 2)), Math.max(64, Math.round(D * PX / 2)), function (c, w, h) { var kx = w / W, kz = h / D;
      c.fillStyle = rgb(S.lmBase, S.dark ? .8 : 1.0); c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'lighter';
      lamps.forEach(function (l) { pool(c, (l[0] - x0) * kx, (l[1] - z0) * kz, (S.lampKind === 'pendant' ? 1.1 : 1.9) * kx, S.lamp, S.lampPow * (S.lampKind === 'pendant' ? .25 : .5), kz / kx); });
      if (S.coveEm) { c.globalAlpha = .6; var cc = S.neonEdge ? S.cove : S.cove; [[0, 0, 0, .8 * kz], [0, h, 0, h - .8 * kz], [0, 0, .8 * kx, 0], [w, 0, w - .8 * kx, 0]].forEach(function (e) { var g = c.createLinearGradient(e[0], e[1], e[2], e[3]); g.addColorStop(0, hexA(cc, .7)); g.addColorStop(1, hexA(cc, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); }); c.globalAlpha = 1; }
      c.globalCompositeOperation = 'source-over'; });
    q = new QB(); q.quad([[x0, H, z0], [x1, H, z0], [x1, H, z1], [x0, H, z1]], [0, -1, 0], [[0, 0], [W / 2, 0], [W / 2, D / 2], [0, D / 2]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    grp.add(new T.Mesh(q.geo(), cl));
    /* стены */
    var SIDES = { n: { A0: x0, A1: x1, c: z0, ax: 'x', dir: 1 }, s: { A0: x0, A1: x1, c: z1, ax: 'x', dir: -1 }, w: { A0: z0, A1: z1, c: x0, ax: 'z', dir: 1 }, e: { A0: z0, A1: z1, c: x1, ax: 'z', dir: -1 } };
    Object.keys(SIDES).forEach(function (sd) { var s = SIDES[sd], L = s.A1 - s.A0, hs = (holes[sd] || []).slice().sort(function (a, b) { return a[0] - b[0]; });
      var kind = wk[sd] || S.wallKind, m = wallMat(kind), tile = m.userData.tile, rot = m.userData.rot;
      function pt(a, y) { return s.ax === 'x' ? [a, y, s.c] : [s.c, y, a]; }
      function dist(l) { return s.ax === 'x' ? Math.abs(l[1] - s.c) : Math.abs(l[0] - s.c); }
      function along(l) { return s.ax === 'x' ? l[0] : l[1]; }
      m.lightMap = lmTex(Math.max(64, Math.round(L * PX)), Math.round(H * PX), function (c, w, h) { var ka = w / L, ky = h / H;
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgb(S.lmBase, S.lampKind === 'pendant' ? .78 : 1.05)); g.addColorStop(.55, rgb(S.lmBase, .98)); g.addColorStop(1, rgb(S.lmBase, .78)); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = 'lighter';
        lamps.forEach(function (l) { var d = dist(l), k = Math.max(0, 1 - d / 5.5); if (k <= 0) return; var yy = S.lampKind === 'pendant' ? .32 * h : -.05 * h;
          pool(c, (along(l) - s.A0) * ka, yy, (1.5 + d * .75) * ka, S.lamp, S.lampPow * (l[2] || 1) * k * k * 1.05, 1.15); });
        (r.glows || []).forEach(function (gw) { var d = dist(gw), k = Math.max(0, 1 - d / 4); if (k <= 0) return; pool(c, (along(gw) - s.A0) * ka, h * .62, (1.2 + d * .8) * ka, gw[2], (gw[4] || .5) * k * .8, 1); });
        if (S.coveEm) { g = c.createLinearGradient(0, 0, 0, .7 * ky); g.addColorStop(0, hexA(S.cove, S.neonEdge ? .5 : .42)); g.addColorStop(1, hexA(S.cove, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); }
        if (S.neonEdge) { g = c.createLinearGradient(0, h, 0, h - .9 * ky); g.addColorStop(0, hexA(ACC, .55)); g.addColorStop(1, hexA(ACC, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); }
        c.globalCompositeOperation = 'source-over';
        edge(c, 0, h, 0, h - .5 * ky, .38); c.fillRect(0, 0, w, h); edge(c, 0, 0, 0, .3 * ky, S.coveEm ? .0 : .3); c.fillRect(0, 0, w, h);
        edge(c, 0, 0, .55 * ka, 0, .34); c.fillRect(0, 0, w, h); edge(c, w, 0, w - .55 * ka, 0, .34); c.fillRect(0, 0, w, h); });
      var qb = new QB(), N = s.ax === 'x' ? [0, 0, s.dir] : [s.dir, 0, 0];
      function piece(a0, a1, y0, y1) { if (a1 - a0 < .001 || y1 - y0 < .001) return;
        var P = [pt(a0, y0), pt(a1, y0), pt(a1, y1), pt(a0, y1)], U = [[a0, y0], [a1, y0], [a1, y1], [a0, y1]];
        var flip = (s.ax === 'x') ? s.dir < 0 : s.dir > 0; if (flip) { P = [P[1], P[0], P[3], P[2]]; U = [U[1], U[0], U[3], U[2]]; }
        qb.quad(P, N, U.map(function (u) { return rot ? [u[1] / tile[0], u[0] / tile[1]] : [u[0] / tile[0], u[1] / tile[1]]; }), U.map(function (u) { return [(u[0] - s.A0) / L, 1 - u[1] / H]; })); }
      var a = s.A0; hs.forEach(function (hh) { piece(a, hh[0], 0, H); piece(hh[0], hh[1], hh[2], H); if (hh[3]) piece(hh[0], hh[1], 0, hh[3]); a = hh[1]; }); piece(a, s.A1, 0, H);
      grp.add(new T.Mesh(qb.geo(), m));
      /* плинтус и световая линия под потолком - в обход проёмов */
      var segs = [], b = s.A0; hs.forEach(function (hh) { if (!hh[3]) { segs.push([b, hh[0]]); b = hh[1]; } }); segs.push([b, s.A1]);
      segs.forEach(function (sg) { var len = sg[1] - sg[0]; if (len < .05) return; var mid = (sg[0] + sg[1]) / 2, off = s.dir * .012;
        var bb = G.box(s.ax === 'x' ? len : .024, .1, s.ax === 'x' ? .024 : len, M.base, s.ax === 'x' ? mid : s.c + off, .05, s.ax === 'x' ? s.c + off : mid); grp.add(bb);
        if (S.neonEdge) { var nb = G.box(s.ax === 'x' ? len : .03, .028, s.ax === 'x' ? .03 : len, M.accent, s.ax === 'x' ? mid : s.c + off * 2, .125, s.ax === 'x' ? s.c + off * 2 : mid); nb.userData.noShadow = true; grp.add(nb); } });
      if (S.coveEm) { var cs = [], cb = s.A0; hs.forEach(function (hh) { if (hh[2] >= H - .01) { cs.push([cb, hh[0]]); cb = hh[1]; } }); cs.push([cb, s.A1]);
        cs.forEach(function (sg) { var len = sg[1] - sg[0]; if (len < .05) return; var mid = (sg[0] + sg[1]) / 2;
          var cv = G.box(s.ax === 'x' ? len : .03, .03, s.ax === 'x' ? .03 : len, M.cove, s.ax === 'x' ? mid : s.c + s.dir * .04, H - .05, s.ax === 'x' ? s.c + s.dir * .04 : mid); cv.userData.noShadow = true; grp.add(cv);
          var lip = G.box(s.ax === 'x' ? len : .09, .05, s.ax === 'x' ? .09 : len, M.trim, s.ax === 'x' ? mid : s.c + s.dir * .045, H - .1, s.ax === 'x' ? s.c + s.dir * .045 : mid); grp.add(lip); }); }
    });
    if (S.lampKind === 'pendant') { var bm = std('#2b211a', .7, 0), alongX = W >= D, n = Math.max(2, Math.round((alongX ? W : D) / 2.1));
      for (var bi = 0; bi < n; bi++) { var bp = (bi + .5) / n; grp.add(alongX ? G.box(.16, .2, D, bm, x0 + W * bp, H - .1, (z0 + z1) / 2) : G.box(W, .2, .16, bm, (x0 + x1) / 2, H - .1, z0 + D * bp)); } }
    lamps.forEach(function (l) { grp.add(G.lamp(l[0], H, l[1], l[3], true)); });
    grp.traverse(function (m) { if (m.isMesh) m.userData.noShadow = true; });
    G.add(grp, { shadow: false });
    return grp;
  };

  /* ---------- светильники ---------- */
  var loaders = {};
  G.lamp = function (x, H, z, rot, noAdd) { var g = new T.Group(); g.position.set(x, H, z); g.rotation.y = rot || 0;
    if (S.lampKind === 'panel') { var fr = G.rbox(1.36, .76, .04, .08, M.trim); fr.rotation.x = Math.PI / 2; fr.position.y = -.02; g.add(fr);
      var p = G.rbox(1.24, .64, .02, .06, M.lamp); p.rotation.x = Math.PI / 2; p.position.y = -.045; p.userData.noShadow = true; g.add(p); }
    else if (S.lampKind === 'line') { var b = G.box(2.6, .05, .16, M.dark, 0, -.025, 0); g.add(b); var ln = G.box(2.5, .02, .07, M.lamp, 0, -.055, 0); ln.userData.noShadow = true; g.add(ln);
      [-.2, .2].forEach(function (dz) { var a = G.box(2.5, .012, .016, M.accent, 0, -.052, dz * .55); a.userData.noShadow = true; g.add(a); }); }
    else { var cord = new T.Mesh(new T.CylinderGeometry(.008, .008, .7, 6), M.dark); cord.position.y = -.35; g.add(cord);
      var sh = new T.Mesh(new T.CylinderGeometry(.06, .24, .2, 28, 1, true), std('#141416', .45, .7, { side: T.DoubleSide })); sh.position.y = -.78; g.add(sh);
      var cap = new T.Mesh(new T.CylinderGeometry(.03, .06, .06, 16), M.dark); cap.position.y = -.68; g.add(cap);
      var bulb = new T.Mesh(new T.SphereGeometry(.055, 16, 12), M.lamp); bulb.position.y = -.84; bulb.userData.noShadow = true; g.add(bulb);
      var hl = G.halo(S.lamp, .5, .9); hl.position.y = -.86; hl.rotation.x = Math.PI / 2; g.add(hl); }
    g.traverse(function (m) { if (m.isMesh) m.userData.noShadow = true; });
    if (!noAdd) G.add(g, { shadow: false }); return g; };

  /* ---------- свет ---------- */
  var hemi = new T.HemisphereLight(col(S.hemi[0]), col(S.hemi[1]), S.hemi[2]); sc.add(hemi);
  var key = new T.DirectionalLight(col(S.key[0]), S.key[1]); sc.add(key); sc.add(key.target);
  if (Q !== 'low') { key.castShadow = true; var ms = Q === 'high' ? 2048 : 1024; key.shadow.mapSize.set(ms, ms); key.shadow.radius = 5; key.shadow.bias = -.0006; key.shadow.normalBias = .02;
    var kc = key.shadow.camera; kc.left = -6.5; kc.right = 6.5; kc.top = 6.5; kc.bottom = -6.5; kc.near = .5; kc.far = 14; }
  /* ключевой свет стоит над той комнатой, где ученик */
  G.lightRoom = function (cx, cz, H) { key.position.set(cx + 1.2, (H || 3.2) + 5, cz + 1.8); key.target.position.set(cx, 0, cz); key.target.updateMatrixWorld(); };

  /* ---------- дверь: портал, раздвижные створки, табличка ---------- */
  G.door = function (d) { /* d: { x, z, axis:'x'|'z' (вдоль какой оси стена), w, h, th (толщина стены), no, title, state } */
    var w = d.w || 1.6, h = d.h || 2.3, th = (d.th || .24) + .1, g = new T.Group(), MA = d.color ? glow(d.color, S.accentK) : MA; g.userData.locked = !!d.locked; g.position.set(d.x, 0, d.z); if (d.axis === 'z') g.rotation.y = Math.PI / 2;
    var jw = .12; [-1, 1].forEach(function (k) { g.add(G.rbox(jw, h + jw, th, .025, M.frame, k * (w / 2 + jw / 2 - .01), (h + jw) / 2, 0)); });
    g.add(G.rbox(w + jw * 2 - .02, jw + .02, th, .025, M.frame, 0, h + jw / 2, 0));
    g.add(G.box(w, .03, th, M.trim, 0, .008, 0)); /* порог */
    /* световая рамка */
    [-1, 1].forEach(function (f) { [-1, 1].forEach(function (k) { var s = G.box(.022, h - .1, .012, MA, k * (w / 2 + jw / 2 - .01), h / 2, f * (th / 2 + .003)); s.userData.noShadow = true; g.add(s); });
      var t = G.box(w + jw, .022, .012, MA, 0, h + jw / 2, f * (th / 2 + .003)); t.userData.noShadow = true; g.add(t); });
    /* створки */
    var leaves = [], lw = w / 2;
    [-1, 1].forEach(function (k) { var L = new T.Group(); L.position.set(k * lw / 2, 0, 0);
      if (S.leaf === 'glass') { L.add(G.box(lw - .01, h - .02, .03, M.frost, 0, h / 2, 0)); L.add(G.box(lw - .01, .09, .045, M.trim, 0, .045, 0)); L.add(G.box(lw - .01, .06, .045, M.trim, 0, h - .05, 0)); L.add(G.box(.035, h - .02, .045, M.trim, -k * (lw / 2 - .02), h / 2, 0));
        var st = G.box(lw - .16, .05, .036, MA, 0, 1.25, 0); st.userData.noShadow = true; L.add(st); }
      else if (S.leaf === 'metal') { L.add(G.rbox(lw - .01, h - .02, .06, .02, std('#1a2036', .32, .85), 0, h / 2, 0));
        var c1 = G.box(.028, h * .62, .07, MA, -k * (lw / 2 - .09), h / 2, 0); c1.userData.noShadow = true; L.add(c1);
        var wnd = G.box(lw * .5, .34, .066, glow('#7cf3ff', .9), k * .04, 1.62, 0); wnd.userData.noShadow = true; L.add(wnd);
        for (var i = 0; i < 3; i++) { var ch = G.box(lw * .5, .018, .068, M.trim, k * .04, .45 + i * .12, 0); L.add(ch); } }
      else { var fm = std('#17171a', .5, .6); L.add(G.box(lw - .01, .08, .05, fm, 0, .04, 0)); L.add(G.box(lw - .01, .07, .05, fm, 0, h - .05, 0)); L.add(G.box(.06, h - .02, .05, fm, -lw / 2 + .035, h / 2, 0)); L.add(G.box(.06, h - .02, .05, fm, lw / 2 - .035, h / 2, 0));
        [.78, 1.5].forEach(function (y) { L.add(G.box(lw - .01, .035, .05, fm, 0, y, 0)); }); L.add(G.box(.03, h - .02, .05, fm, 0, h / 2, 0)); L.add(G.box(lw - .08, h - .1, .012, M.glass, 0, h / 2, 0));
        var kick = G.box(lw - .12, .7, .03, pbr('laminate_floor_02', '#d9b98c', .8), 0, .42, 0); L.add(kick); }
      g.add(L); leaves.push([L, k]); });
    /* табличка над дверью */
    var sg = null;
    if (d.no != null || d.title) { var tx = ctex(768, 176, function () {}); sg = new T.Group();
      var plate = G.rbox(1.56, .36, .05, .06, M.frame); sg.add(plate);
      var face = new T.Mesh(new T.PlaneGeometry(1.5, .3), new T.MeshBasicMaterial({ map: tx })); face.position.z = .028; face.userData.noShadow = true; sg.add(face);
      sg.position.set(0, h + jw + .3, (d.face || 1) * (th / 2 + .02)); if ((d.face || 1) < 0) sg.rotation.y = Math.PI; g.add(sg);
      var draw = function (state, sub) { if (sub != null) d.sub = sub; var c = tx.userData.x, W = 768, Hh = 176, colr = d.color || (state === 'done' ? '#7dffb0' : state === 'lock' ? '#8a93b4' : ACC);
        c.fillStyle = S.signBg; c.fillRect(0, 0, W, Hh); c.fillStyle = colr; c.fillRect(0, 0, 150, Hh); c.fillStyle = S.dark ? '#0a0d1a' : '#10162a'; c.font = '900 118px Manrope,Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.no == null ? '•' : d.no, 75, Hh / 2 + 6);
        c.fillStyle = S.signFg; c.textAlign = 'left'; var fs = 64; c.font = '800 ' + fs + 'px Manrope,Arial'; while (fs > 30 && c.measureText(d.title || '').width > W - 200) { fs -= 3; c.font = '800 ' + fs + 'px Manrope,Arial'; } c.fillText(d.title || '', 178, d.sub ? 66 : Hh / 2 + 4);
        if (d.sub) { c.font = '700 34px Manrope,Arial'; c.fillStyle = colr; c.fillText(d.sub, 180, 130); } tx.needsUpdate = true; };
      draw(d.state || 'open'); g.userData.sign = draw; g.userData.signObj = sg; }
    G.add(g, { live: false }); var mg = MIR.get(g);
    var open = 0, want = 0; g.userData.setOpen = function (v) { want = v; };
    G.frame(function (dt) { if (d.auto !== false) { var p = cam.position; want = !g.userData.locked && Math.hypot(p.x - d.x, p.z - d.z) < 2.6 ? 1 : 0; }
      if (open === want) return; open += Math.sign(want - open) * dt * 2.2; open = Math.max(0, Math.min(1, open)); if (Math.abs(open - want) < .02) open = want;
      var e = open * open * (3 - 2 * open); leaves.forEach(function (lf, i) { var px = lf[1] * (lw / 2 + e * (lw - .04)); lf[0].position.x = px; if (mg) mg.children[g.children.indexOf(lf[0])].position.x = px; }); });
    return g; };

  /* ---------- экран на стене ---------- */
  G.screen = function (o) { /* { x,y,z,ry,w,h, draw(c,w,h), px } */
    var g = new T.Group(); g.position.set(o.x, o.y, o.z); g.rotation.y = o.ry || 0;
    g.add(G.rbox(o.w + .1, o.h + .1, .05, .03, std('#0c0e16', .3, .6), 0, 0, .025));
    var tx = ctex(o.px || 1280, Math.round((o.px || 1280) * o.h / o.w), o.draw || function () {});
    var m = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshBasicMaterial({ map: tx, color: new T.Color(1.15, 1.15, 1.15) })); m.position.z = .052; m.userData.noShadow = true; g.add(m);
    var hl = G.halo(o.glow || ACC, .22, o.w * 1.9, o.h * 2.0); hl.position.z = .012; g.add(hl);
    g.userData.tex = tx; G.add(g); return g; };

  /* ---------- стойка задания ---------- */
  G.kiosk = function (o) { /* { x,z,ry, no, title, state } */
    var g = new T.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = o.ry || 0; var body = std(S.dark ? '#1a1f33' : '#f1f3f7', .35, S.dark ? .7 : .15);
    var base = new T.Mesh(new T.CylinderGeometry(.3, .34, .05, 40), body); base.position.y = .025; g.add(base);
    var ring = new T.Mesh(new T.TorusGeometry(.305, .012, 8, 48), M.accent); ring.rotation.x = Math.PI / 2; ring.position.y = .052; ring.userData.noShadow = true; g.add(ring);
    var stem = G.rbox(.12, 1.0, .05, .02, body, 0, .55, 0); g.add(stem);
    var head = new T.Group(); head.position.set(0, 1.12, .02); head.rotation.x = -.42; g.add(head);
    head.add(G.rbox(.78, .5, .045, .04, std('#0c0e16', .3, .6)));
    var tx = ctex(768, 480, function (c, w, h) { var gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#101630'); gr.addColorStop(1, '#1b1140'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = ACC; c.fillRect(0, 0, w, 10); c.font = '800 34px Manrope,Arial'; c.fillStyle = ACC; c.fillText('ЗАДАНИЕ ' + (o.no || ''), 40, 78);
      c.fillStyle = '#fff'; var fs = 62; c.font = '800 ' + fs + 'px Manrope,Arial'; var words = (o.title || '').split(' '), line = '', y = 170; words.forEach(function (wd) { if (c.measureText(line + wd).width > w - 80) { c.fillText(line, 40, y); y += 72; line = ''; } line += wd + ' '; }); c.fillText(line, 40, y);
      c.fillStyle = ACC; var bw = 300; c.beginPath(); if (c.roundRect) c.roundRect(40, h - 120, bw, 76, 38); else c.rect(40, h - 120, bw, 76); c.fill(); c.fillStyle = '#16100a'; c.font = '900 38px Manrope,Arial'; c.fillText('Начать', 110, h - 68); });
    var scr = new T.Mesh(new T.PlaneGeometry(.72, .45), new T.MeshBasicMaterial({ map: tx, color: new T.Color(1.15, 1.15, 1.15) })); scr.position.z = .026; scr.userData.noShadow = true; head.add(scr);
    /* кольцо на полу */
    var fr = new T.Mesh(new T.RingGeometry(.62, .68, 64), new T.MeshBasicMaterial({ color: col(ACC).multiplyScalar(S.accentK * .8), transparent: true, opacity: .9, depthWrite: false })); fr.rotation.x = -Math.PI / 2; fr.position.set(0, .006, .55); fr.userData.noShadow = true; g.add(fr);
    var fh = G.halo(ACC, .35, 2.0); fh.rotation.x = -Math.PI / 2; fh.position.set(0, .008, .55); g.add(fh);
    G.add(g); return g; };

  /* ---------- картина (фото села) с подсветкой ---------- */
  G.picture = function (o) { /* { file, x,y,z,ry,w,h,title } */
    var g = new T.Group(); g.position.set(o.x, o.y, o.z); g.rotation.y = o.ry || 0;
    g.add(G.rbox(o.w + .12, o.h + .12, .04, .012, S.style === 'C' ? std('#1a1a1c', .5, .5) : std(S.dark ? '#262c44' : '#ffffff', .4, S.dark ? .7 : .05), 0, 0, .02));
    var t = TL.load(o.file); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    var p = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshBasicMaterial({ map: t, color: new T.Color(S.dark ? .95 : .9, S.dark ? .95 : .9, S.dark ? .95 : .9) })); p.position.z = .042; p.userData.noShadow = true; g.add(p);
    /* лампа-подсветка над картиной */
    var arm = G.box(o.w * .5, .025, .03, M.trim, 0, o.h / 2 + .16, .1); g.add(arm); var gl2 = G.box(o.w * .46, .008, .018, M.lamp, 0, o.h / 2 + .146, .1); gl2.userData.noShadow = true; g.add(gl2);
    var hl = G.halo(S.lamp, S.dark ? .22 : .10, o.w * 1.8, o.h * 1.6); hl.position.set(0, .1, .046); g.add(hl);
    if (o.title) { var tt = ctex(512, 80, function (c, w, h) { c.fillStyle = S.signBg; c.fillRect(0, 0, w, h); c.fillStyle = S.signFg; var fs = 40; c.font = '700 40px Manrope,Arial'; while (fs > 18 && c.measureText(o.title).width > w - 30) { fs -= 2; c.font = '700 ' + fs + 'px Manrope,Arial'; } c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.title, w / 2, h / 2 + 2); });
      var lb = new T.Mesh(new T.PlaneGeometry(.8, .125), new T.MeshBasicMaterial({ map: tt })); lb.position.set(0, -o.h / 2 - .16, .012); lb.userData.noShadow = true; g.add(lb); }
    G.add(g); return g; };

  /* ---------- окно с видом на летающий город ---------- */
  var cityTex = null;
  function cityMap() { if (cityTex) return cityTex; cityTex = ctex(2048, 1024, function (c, w, h) {
      var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05041a'); g.addColorStop(.45, '#1c1150'); g.addColorStop(.72, '#7a2f9c'); g.addColorStop(.86, '#ff7eb6'); g.addColorStop(1, '#ffc48a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(7);
      for (var i = 0; i < 500; i++) { c.fillStyle = 'rgba(255,255,255,' + (.2 + rnd() * .8) + ')'; var r = rnd() * 1.6; c.fillRect(rnd() * w, rnd() * h * .55, r, r); }
      [[.62, '#2a1a5e', .45, 60], [.74, '#1a1240', .7, 46], [.86, '#0c0a24', 1, 34]].forEach(function (L, li) { var x = -20; while (x < w) { var bw = 40 + rnd() * 110, bh = (.12 + rnd() * rnd() * (.55 - li * .12)) * h, y = h * (L[0] + .14) - bh + li * 40;
        c.fillStyle = L[1]; c.fillRect(x, y, bw, h - y); var cc = ['#7cf3ff', '#ff7ad9', '#ffd36e', '#b7a4ff'][Math.floor(rnd() * 4)];
        c.fillStyle = cc; c.globalAlpha = L[2] * .9; c.fillRect(x, y, bw, 3); if (rnd() > .5) c.fillRect(x + bw * .5 - 1, y - 30 * rnd(), 2, 30);
        for (var yy = y + 10; yy < h; yy += 13) for (var xx = x + 6; xx < x + bw - 6; xx += 10) if (rnd() > .52) { c.globalAlpha = L[2] * (.35 + rnd() * .6); c.fillStyle = rnd() > .3 ? '#ffe9b0' : cc; c.fillRect(xx, yy, 5, 7); }
        c.globalAlpha = 1; x += bw + rnd() * L[3]; } });
      g = c.createLinearGradient(0, h * .7, 0, h); g.addColorStop(0, 'rgba(255,120,200,0)'); g.addColorStop(1, 'rgba(255,150,210,.35)'); c.fillStyle = g; c.fillRect(0, h * .7, w, h * .3); }); return cityTex; }
  G.window = function (o) { /* { x,z,axis, a0,a1 (вдоль стены), y0,y1, out:+1|-1 (куда наружу), th } */
    var len = o.a1 - o.a0, hh = o.y1 - o.y0, mid = (o.a0 + o.a1) / 2, th = (o.th || .24), g = new T.Group();
    g.position.set(o.axis === 'x' ? mid : o.c, (o.y0 + o.y1) / 2, o.axis === 'x' ? o.c : mid); g.rotation.y = o.axis === 'x' ? (o.out > 0 ? 0 : Math.PI) : (o.out > 0 ? Math.PI / 2 : -Math.PI / 2);
    /* откосы и рама (наружу - по +z группы) */
    var fw = .07, dep = th + .1; g.add(G.box(len + fw * 2, fw, dep, M.frame, 0, hh / 2 + fw / 2, dep / 2 - .05)); g.add(G.box(len + fw * 2, fw, dep + .08, M.frame, 0, -hh / 2 - fw / 2, dep / 2 - .09));
    [-1, 1].forEach(function (k) { g.add(G.box(fw, hh + fw * 2, dep, M.frame, k * (len / 2 + fw / 2), 0, dep / 2 - .05)); });
    var n = Math.max(1, Math.round(len / 1.5)); for (var i = 1; i < n; i++) g.add(G.box(.045, hh, .06, M.frame, -len / 2 + i * len / n, 0, dep / 2));
    var gl = G.box(len, hh, .012, M.glass, 0, 0, dep / 2); gl.userData.noShadow = true; g.add(gl);
    var sky = new T.Mesh(new T.PlaneGeometry(150, 60), new T.MeshBasicMaterial({ map: cityMap(), color: new T.Color(1.5, 1.5, 1.5), fog: false })); sky.position.set(0, 14, 46); sky.rotation.y = Math.PI; sky.userData.noShadow = true; g.add(sky);
    G.add(g, { shadow: false }); return g; };

  /* ---------- большая цифра на стене у двери ---------- */
  G.number = function (o) { /* { x,y,z,ry, n, size } */
    var t = ctex(256, 256, function (c, w, h) { c.clearRect(0, 0, w, h); c.font = '900 230px Manrope,Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(o.n, w / 2, h / 2 + 14); });
    var cc = S.dark ? col(ACC).multiplyScalar(S.neonEdge ? 1.6 : .9) : col('#2b3242');
    var m = new T.Mesh(new T.PlaneGeometry(o.size || 1, o.size || 1), new T.MeshBasicMaterial({ map: t, color: cc, transparent: true, opacity: S.dark ? .9 : .82, depthWrite: false })); m.position.set(o.x, o.y, o.z); m.rotation.y = o.ry || 0; m.userData.noShadow = true;
    G.add(m, { shadow: false }); return m; };
  /* ---------- светящаяся линия на полу: ведёт к следующему заданию ---------- */
  G.guide = function (pts) { var g = new T.Group(), mt = glow(ACC, S.accentK * .9);
    for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ang = Math.atan2(dx, dz), n = Math.floor(len / .5);
      for (var k = 0; k < n; k++) { var f = (k + .5) / n, ch = new T.Group(); ch.position.set(a[0] + dx * f, .006, a[1] + dz * f); ch.rotation.y = ang;
        [-1, 1].forEach(function (sd) { var q = new T.Mesh(new T.PlaneGeometry(.035, .17), mt); q.rotation.set(-Math.PI / 2, 0, sd * .78, 'YXZ'); q.rotation.x = -Math.PI / 2; q.rotation.z = sd * .78; q.position.x = sd * .055; q.userData.noShadow = true; ch.add(q); }); g.add(ch); } }
    G.add(g, { shadow: false, mirror: false }); return g; };
  G.remove = function (o) { if (!o) return; world.remove(o); var c = MIR.get(o); if (c) mirror.remove(c); };

  /* ---------- готовые модели (Poly Haven, CC0) ---------- */
  var GL = T.GLTFLoader ? new T.GLTFLoader() : null, cache = {}, pend = 0, onAll = [];
  G.model = function (url, x, y, z, ry, s, cb) { var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; if (s) g.scale.setScalar(s);
    function ready(src) { var m = src.clone(); m.traverse(function (k) { if (k.isMesh) { k.castShadow = true; k.receiveShadow = true; } }); g.add(m); if (cb) cb(m, g); G.add(g); }
    if (cache[url] && cache[url].s) ready(cache[url].s); else if (cache[url]) cache[url].q.push(ready);
    else { cache[url] = { q: [ready] }; pend++; GL.load(url, function (r) { r.scene.traverse(function (k) { if (k.isMesh && k.material) k.material.envMapIntensity = S.env; }); cache[url].s = r.scene; cache[url].q.forEach(function (f) { f(r.scene); }); done(); }, null, function () { console.log('нет модели ' + url); done(); }); }
    return g; };
  function done() { if (--pend === 0) onAll.forEach(function (f) { f(); }); }
  G.whenLoaded = function (f) { if (pend === 0) setTimeout(f, 0); else onAll.push(f); };
  return G;
}
window.INTER = { create: create, STYLES: STYLES };
})();
