/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* teoriya-okno.js - модуль 2 "Мастерская": теория у большого окна (проба new.html, 18.11.2026).
   Идея Alexandr: во всю дальнюю стену окно от пола до потолка, перед ним большой монитор с колонками по бокам и кресло посередине.
   Ученик садится в кресло - начинается теория (голос Леры). За окном летающий город и космос, летают корабли и дроны;
   пока ученик сидит, взгляд сам плавно поворачивается за пролетающим кораблём и возвращается к экрану.
   Подключается через хук window.KOMNATA_OKNO.m2 в komnata-new.js (без этого файла комната как раньше).
   Всё рисуется кодом, своих картинок и моделей нет. Вид за окном: ?okno=A (галактика над городом), B (закат и планета), V (над облаками). */
(function () {
'use strict';
var VAR = ((/[?&]okno=([ABV])/.exec(location.search) || [])[1]) || 'A';
var PI = Math.PI;

var PAL = {
  A: { sky: ['#03020c', '#0a0626', '#1d0f4a', '#3b1670', '#6a2a8c'], gal: ['#fff3e0', '#ffb3f0', '#8fd0ff'], neb: ['#ff4fd8', '#5a7dff', '#22e0ff'], haze: '#ff5fc8', city: ['#7cf3ff', '#ff7ad9', '#ffd36e', '#b7a4ff'],
       planet: null, chair: ['#16161c', '#ff7ce0'], spk: '#141418', eng: '#7cf3ff', clouds: 0 },
  B: { sky: ['#040318', '#1a0f45', '#5a2378', '#d4537a', '#ffb066'], gal: ['#fff7ea', '#ffd0a8', '#b0c8ff'], neb: ['#ff8a5c', '#a24cff', '#ff4f8b'], haze: '#ffb46b', city: ['#ffd36e', '#ff9f5a', '#ff7ad9', '#ffe9b0'],
       planet: { x: .58, y: .58, r: .10, c1: '#ffcf9a', c2: '#a0466e', ring: '#ffe2c0' }, chair: ['#e9e1d4', '#c8a27a'], spk: '#2b2118', eng: '#ffb46b', clouds: 0 },
  V: { sky: ['#000006', '#03031a', '#0b0a34', '#16135a', '#262a7a'], gal: ['#ffffff', '#c9b8ff', '#7cf3ff'], neb: ['#7c5cff', '#22c6ff', '#ff4fd8'], haze: '#7cb8ff', city: ['#7cf3ff', '#ffe9b0', '#9dff7c', '#b7a4ff'],
       planet: { x: .37, y: .52, r: .045, c1: '#cfe8ff', c2: '#3a4a9a', ring: null }, chair: ['#f2f4f8', '#7cf3ff'], spk: '#e9ecf2', eng: '#9dff7c', clouds: 1 }
}[VAR];

function rnd0(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

/* ---------- небо: панорама на дуге за окном (космос, галактика, туманности, далёкий город внизу) ---------- */
function skyCanvas(w, h) {
  var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), r = rnd0(11), i;
  var hz = h * .64; /* линия горизонта */
  var g = x.createLinearGradient(0, 0, 0, hz); PAL.sky.forEach(function (s, k) { g.addColorStop(k / (PAL.sky.length - 1), s); }); x.fillStyle = g; x.fillRect(0, 0, w, hz);
  g = x.createLinearGradient(0, hz, 0, h); g.addColorStop(0, PAL.sky[4]); g.addColorStop(.25, PAL.sky[2]); g.addColorStop(1, PAL.sky[0]); x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
  /* туманности */
  x.globalCompositeOperation = 'lighter';
  for (i = 0; i < 26; i++) { var nx = r() * w, ny = r() * hz * .8, nr = (.05 + r() * .16) * w, cc = PAL.neb[i % 3]; g = x.createRadialGradient(nx, ny, 0, nx, ny, nr);
    g.addColorStop(0, hexA(cc, .10 + r() * .08)); g.addColorStop(1, hexA(cc, 0)); x.fillStyle = g; x.fillRect(nx - nr, ny - nr, nr * 2, nr * 2); }
  /* млечный путь - наклонная полоса */
  x.save(); x.translate(w * .5, hz * .5); x.rotate(-.18);
  for (i = 0; i < 9000; i++) { var u = (r() - .5) * w * 1.3, v = gauss(r) * h * .07; x.fillStyle = 'rgba(255,255,255,' + (r() * .35) + ')'; x.fillRect(u, v, 1.2, 1.2); }
  g = x.createLinearGradient(0, -h * .12, 0, h * .12); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, hexA(PAL.gal[1], .10)); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(-w, -h * .12, w * 2, h * .24);
  x.restore();
  /* звёзды */
  for (i = 0; i < (w > 3000 ? 4200 : 2200); i++) { var sy = Math.pow(r(), .8) * hz * .98, a = .35 + r() * .65, sr = (r() < .05 ? 2.6 : r() * 1.6 + .6) * w / 4096 * 1.4; x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.fillRect(r() * w, sy, sr, sr);
    if (sr > 2) { x.fillStyle = hexA(PAL.gal[2], .25); x.fillRect(r() * w, sy, 1, 1); } }
  /* спиральная галактика */
  var gx = w * (VAR === 'B' ? .40 : VAR === 'V' ? .52 : .44), gy = hz * (VAR === 'V' ? .40 : .43), gs = w * (VAR === 'V' ? .12 : .095);
  x.save(); x.translate(gx, gy); x.scale(1, .42); x.rotate(.5);
  g = x.createRadialGradient(0, 0, 0, 0, 0, gs * 1.6); g.addColorStop(0, hexA(PAL.gal[0], .9)); g.addColorStop(.12, hexA(PAL.gal[1], .5)); g.addColorStop(.5, hexA(PAL.gal[2], .12)); g.addColorStop(1, hexA(PAL.gal[2], 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, gs * 1.6, 0, 7); x.fill();
  for (var arm = 0; arm < 2; arm++) for (i = 0; i < 2600; i++) { var tt = r() * 3.4, rad = gs * .08 * Math.exp(tt * .62), ang = tt * 1.9 + arm * PI + gauss(r) * .22, px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
    x.fillStyle = hexA(r() < .3 ? PAL.gal[1] : r() < .5 ? PAL.gal[2] : '#ffffff', .25 + r() * .5); var sz = r() * 2.2 + .6; x.fillRect(px, py, sz, sz); }
  x.restore();
  /* планета */
  if (PAL.planet) { var P = PAL.planet, px0 = w * P.x, py0 = hz * P.y, pr = h * P.r;
    g = x.createRadialGradient(px0, py0, pr * .9, px0, py0, pr * 1.9); g.addColorStop(0, hexA(P.c1, .35)); g.addColorStop(1, hexA(P.c1, 0)); x.fillStyle = g; x.beginPath(); x.arc(px0, py0, pr * 1.9, 0, 7); x.fill();
    x.globalCompositeOperation = 'source-over';
    g = x.createRadialGradient(px0 - pr * .4, py0 - pr * .4, pr * .1, px0, py0, pr); g.addColorStop(0, P.c1); g.addColorStop(1, P.c2); x.fillStyle = g; x.beginPath(); x.arc(px0, py0, pr, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = pr * .06; for (i = -3; i <= 3; i++) { x.beginPath(); x.ellipse(px0, py0 + i * pr * .22, pr * Math.sqrt(1 - Math.pow(i * .22, 2)), pr * .05, 0, 0, 7); x.stroke(); }
    if (P.ring) { x.strokeStyle = hexA(P.ring, .55); x.lineWidth = pr * .08; x.beginPath(); x.ellipse(px0, py0, pr * 1.9, pr * .42, -.25, 0, 7); x.stroke(); x.strokeStyle = hexA(P.ring, .25); x.lineWidth = pr * .2; x.beginPath(); x.ellipse(px0, py0, pr * 1.6, pr * .34, -.25, 0, 7); x.stroke(); }
    x.globalCompositeOperation = 'lighter'; }
  /* свечение города у горизонта */
  g = x.createLinearGradient(0, hz - h * .16, 0, hz + h * .06); g.addColorStop(0, hexA(PAL.haze, 0)); g.addColorStop(.8, hexA(PAL.haze, .45)); g.addColorStop(1, hexA(PAL.haze, .15)); x.fillStyle = g; x.fillRect(0, hz - h * .16, w, h * .22);
  x.globalCompositeOperation = 'source-over';
  /* далёкий город: силуэты с окнами, внизу - огни в дымке */
  [[.0, '#120b30', .5], [.035, '#0b0822', .8], [.07, '#06051a', 1]].forEach(function (L, li) { var bx = -10; while (bx < w) { var bw = 14 + r() * 46, bh = (.02 + r() * r() * (.13 - li * .02)) * h, by = hz + L[0] * h - bh;
    x.fillStyle = L[1]; x.fillRect(bx, by, bw, h - by); var cc = PAL.city[Math.floor(r() * 4)];
    x.globalAlpha = L[2]; x.fillStyle = cc; x.fillRect(bx, by, bw, 2); if (r() > .7) { x.fillRect(bx + bw * .5 - 1, by - 18 * r(), 2, 18); }
    for (var yy = by + 5; yy < hz + h * .1; yy += 6) for (var xx = bx + 3; xx < bx + bw - 3; xx += 5) if (r() > .62) { x.globalAlpha = L[2] * (.3 + r() * .6); x.fillStyle = r() > .3 ? '#ffe9b0' : cc; x.fillRect(xx, yy, 2, 3); }
    x.globalAlpha = 1; bx += bw + r() * 30; } });
  if (PAL.clouds) { /* вариант V: мастерская над облаками, город светится сквозь них */
    for (i = 0; i < 260; i++) { var cx = r() * w, cy = hz - h * .02 + Math.pow(r(), .7) * h * .3, cr = (20 + r() * 90) * (cy / hz); g = x.createRadialGradient(cx, cy, 0, cx, cy, cr); g.addColorStop(0, 'rgba(150,170,255,' + (.18 + r() * .2) + ')'); g.addColorStop(1, 'rgba(60,70,160,0)'); x.fillStyle = g; x.fillRect(cx - cr, cy - cr, cr * 2, cr * 2); }
    x.globalCompositeOperation = 'lighter'; for (i = 0; i < 700; i++) { x.fillStyle = hexA(PAL.city[i % 4], .25 + r() * .4); x.fillRect(r() * w, hz + h * .04 + r() * h * .3, 2, 2); } x.globalCompositeOperation = 'source-over'; }
  g = x.createLinearGradient(0, hz, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,8,.65)'); x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
  return c;
}
function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }
function hexA(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

/* окна башен: одна общая текстура на все башни */
function winCanvas() { var c = document.createElement('canvas'); c.width = 128; c.height = 256; var x = c.getContext('2d'), r = rnd0(5); x.fillStyle = '#0a0a1c'; x.fillRect(0, 0, 128, 256);
  for (var yy = 4; yy < 256; yy += 10) for (var xx = 4; xx < 128; xx += 9) if (r() > .45) { x.fillStyle = r() > .75 ? PAL.city[Math.floor(r() * 4)] : '#ffe7b0'; x.globalAlpha = .45 + r() * .55; x.fillRect(xx, yy, 5, 6); }
  x.globalAlpha = 1; return c; }

function make(X) {
  var T = X.T, GX = X.GX, W = X.W, D = X.D, H = X.H, MOB = X.MOB, NZ = -D / 2;
  if (!GX) return null;
  var add = function (o) { o.traverse(function (m) { m.userData.noMirror = true; m.userData.noShadow = true; }); GX.add(o, { shadow: false, mirror: false }); return o; };
  var B = function (c) { return new T.MeshBasicMaterial({ color: c, fog: false }); };
  var root = new T.Group(); add(root);

  /* ---------- окно во всю стену ---------- */
  var fr = GX.std('#1b1e27', .35, .8), x0 = -W / 2 + .3, x1 = W / 2 - .3, wy = H - .35, n = 8, i;
  var wg = new T.Group(); wg.position.set(0, 0, NZ);
  [[x1 - x0 + .2, .14, (wy) + .07], [x1 - x0 + .2, .1, .05]].forEach(function (b) { var m = GX.box(b[0], b[1], .3, fr, 0, b[2], 0); wg.add(m); });
  for (i = 0; i <= n; i++) { var mx = x0 + (x1 - x0) * i / n; wg.add(GX.box(i === 0 || i === n ? .16 : .08, wy, i === 0 || i === n ? .3 : .16, fr, mx, wy / 2, 0)); }
  var glass = GX.box(x1 - x0, wy, .02, new T.MeshPhysicalMaterial({ color: '#bcd6ff', roughness: .05, metalness: 0, transparent: true, opacity: .08, depthWrite: false }), 0, wy / 2, -.02); wg.add(glass);
  var led = new T.Mesh(new T.BoxGeometry(x1 - x0, .025, .03), new T.MeshBasicMaterial({ color: new T.Color(PAL.eng).multiplyScalar(1.6), toneMapped: false })); led.position.set(0, .11, .14); wg.add(led);
  GX.add(wg, { mirror: true });

  /* ---------- панорама неба на дуге ---------- */
  var sc = skyCanvas(MOB ? 2048 : 4096, MOB ? 1024 : 2048), st = new T.CanvasTexture(sc); st.encoding = T.sRGBEncoding; st.anisotropy = 4; st.wrapS = T.RepeatWrapping; st.repeat.x = -1;   /* дуга по центру окна, изнутри без зеркала */
  var R0 = 90, sky = new T.Mesh(new T.CylinderGeometry(R0, R0, 120, 64, 1, true, PI * .38, PI * 1.24), new T.MeshBasicMaterial({ map: st, side: T.BackSide, fog: false, color: new T.Color(1.25, 1.25, 1.25) }));
  sky.position.set(0, 26, -3); root.add(sky);
  /* сверху и снизу дуги - заливка, чтобы не было края */
  var cap = new T.Mesh(new T.CircleGeometry(R0, 48), B(PAL.sky[0])); cap.rotation.x = PI / 2; cap.position.set(0, 86, -3); root.add(cap);
  var bot = new T.Mesh(new T.CircleGeometry(R0, 48), B('#02020a')); bot.rotation.x = -PI / 2; bot.position.set(0, -34, -3); root.add(bot);

  /* ---------- летающий город: острова с башнями ---------- */
  var wt = new T.CanvasTexture(winCanvas()); wt.encoding = T.sRGBEncoding; wt.wrapS = wt.wrapT = T.RepeatWrapping;
  var rock = GX.std(VAR === 'B' ? '#3a2433' : '#1c1a33', .9, .1), top = B(VAR === 'B' ? '#2a1830' : '#11122a'), r = rnd0(3), isl = [];
  [[-36, -9, -42, 6], [-14, -4, -64, 8], [8, -12, -40, 5], [28, -6, -56, 7], [46, -10, -40, 5], [-52, -2, -66, 7], [18, 2, -80, 8], [-4, -17, -50, 6]].forEach(function (p, k) {
    var g = new T.Group(); g.position.set(p[0], p[1], p[2]); var s = p[3];
    var cone = new T.Mesh(new T.ConeGeometry(s, s * 1.5, 7), rock); cone.rotation.x = PI; cone.position.y = -s * .75; g.add(cone);
    var disc = new T.Mesh(new T.CylinderGeometry(s, s * .96, .6, 18), top); g.add(disc);
    var ringC = new T.Color(PAL.city[k % 4]).multiplyScalar(1.4), rg = new T.Mesh(new T.TorusGeometry(s * .98, .12, 6, 40), new T.MeshBasicMaterial({ color: ringC, fog: false, toneMapped: false })); rg.rotation.x = PI / 2; rg.position.y = .2; g.add(rg);
    var nb = 4 + Math.floor(r() * 5); for (var j = 0; j < nb; j++) { var a = r() * PI * 2, d = r() * s * .7, bw = 1.2 + r() * 2, bh = 2.5 + r() * r() * s * 2.2, t2 = wt.clone(); t2.needsUpdate = true; t2.repeat.set(bw / 3, bh / 6);
      var tw = new T.Mesh(new T.BoxGeometry(bw, bh, bw), new T.MeshBasicMaterial({ map: t2, fog: false })); tw.position.set(Math.cos(a) * d, bh / 2 + .3, Math.sin(a) * d); g.add(tw);
      if (r() > .5) { var tip = new T.Mesh(new T.BoxGeometry(.15, 1.6, .15), new T.MeshBasicMaterial({ color: new T.Color(PAL.city[j % 4]).multiplyScalar(1.5), fog: false, toneMapped: false })); tip.position.set(tw.position.x, bh + 1.1, tw.position.z); g.add(tip); } }
    g.userData.y0 = p[1]; g.userData.ph = r() * 6; root.add(g); isl.push(g); });

  /* ---------- корабли и дроны ---------- */
  var engC = new T.Color(PAL.eng).multiplyScalar(2);
  var glowTx = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  function spr(col, s) { var m = new T.Sprite(new T.SpriteMaterial({ map: glowTx, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, toneMapped: false })); m.scale.set(s, s, 1); return m; }
  function ship(s, hull, acc) { var g = new T.Group(), mh = GX.std(hull, .35, .7, { fog: false }), ma = GX.std(acc, .4, .5, { fog: false });
    var body = new T.Mesh(new T.CylinderGeometry(.35 * s, .6 * s, 3.2 * s, 10), mh); body.rotation.z = -PI / 2; g.add(body);
    var nose = new T.Mesh(new T.ConeGeometry(.35 * s, 1.4 * s, 10), mh); nose.rotation.z = -PI / 2; nose.position.x = 2.3 * s; g.add(nose);
    var cab = new T.Mesh(new T.SphereGeometry(.42 * s, 14, 10), new T.MeshBasicMaterial({ color: new T.Color(PAL.eng).multiplyScalar(.9), fog: false })); cab.scale.set(1.6, .7, .8); cab.position.set(1.0 * s, .35 * s, 0); g.add(cab);
    [-1, 1].forEach(function (k) { var w = new T.Mesh(new T.BoxGeometry(1.8 * s, .08 * s, 2.2 * s), ma); w.position.set(-.5 * s, -.05 * s, k * 1.3 * s); w.rotation.y = k * -.35; g.add(w);
      var e = new T.Mesh(new T.CylinderGeometry(.28 * s, .3 * s, 1.4 * s, 10), mh); e.rotation.z = -PI / 2; e.position.set(-1.3 * s, 0, k * 1.1 * s); g.add(e);
      var f = spr(engC, .9 * s); f.position.set(-2.05 * s, 0, k * 1.1 * s); g.add(f);
      var tl = new T.Mesh(new T.PlaneGeometry(4 * s, .35 * s), new T.MeshBasicMaterial({ map: trailTx(), color: engC, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, side: T.DoubleSide, toneMapped: false })); tl.position.set(-4.1 * s, 0, k * 1.1 * s); g.add(tl);
      var nl = spr(new T.Color(k > 0 ? '#ff3b3b' : '#3bff6a').multiplyScalar(2), .5 * s); nl.position.set(-.8 * s, 0, k * 2.3 * s); g.add(nl); });
    var fin = new T.Mesh(new T.BoxGeometry(1 * s, .9 * s, .07 * s), ma); fin.position.set(-1.2 * s, .5 * s, 0); g.add(fin);
    return g; }
  var trailT = null; function trailTx() { if (trailT) return trailT; var c = document.createElement('canvas'); c.width = 128; c.height = 16; var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.8)'); x.fillStyle = g; x.fillRect(0, 0, 128, 16); var g2 = x.createLinearGradient(0, 0, 0, 16); x.globalCompositeOperation = 'destination-in'; g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.5, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, 128, 16); trailT = new T.CanvasTexture(c); return trailT; }
  function drone(s) { var g = new T.Group(), m = GX.std('#20232c', .5, .5, { fog: false }); [PI / 4, -PI / 4].forEach(function (a) { var b = new T.Mesh(new T.BoxGeometry(1.4 * s, .06 * s, .12 * s), m); b.rotation.y = a; g.add(b); });
    g.add(new T.Mesh(new T.BoxGeometry(.4 * s, .16 * s, .5 * s), m)); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p) { var d = new T.Mesh(new T.CircleGeometry(.36 * s, 16), new T.MeshBasicMaterial({ color: '#9aa3c0', transparent: true, opacity: .25, fog: false, side: T.DoubleSide })); d.rotation.x = -PI / 2; d.position.set(p[0] * .5 * s, .08 * s, p[1] * .5 * s); g.add(d); });
    var a = spr(new T.Color('#ff3b3b').multiplyScalar(2), .6 * s), b = spr(new T.Color(PAL.eng).multiplyScalar(2), .6 * s); a.position.set(-.3 * s, 0, 0); b.position.set(.3 * s, 0, 0); g.add(a); g.add(b); g.userData.bl = [a, b]; return g; }
  var HUL = VAR === 'B' ? ['#d9d2c6', '#ff8a5c'] : VAR === 'V' ? ['#e8ecf5', '#7cf3ff'] : ['#c7cbe0', '#ff7ce0'];
  /* движение: полосы через всё окно, у каждого свой уровень, дальность и скорость */
  var LANES = [], j;
  function lane(o, kind, z, y, sp, dir, ph, s) { o.userData.L = { z: z, y: y, sp: sp, dir: dir, ph: ph, kind: kind }; root.add(o); LANES.push(o); }
  for (j = 0; j < 6; j++) lane(ship(.9 + r() * .8, HUL[0], HUL[1]), 'ship', -30 - r() * 40, 2 + r() * 22, 5 + r() * 6, j % 2 ? 1 : -1, r() * 200, 1);
  for (j = 0; j < (MOB ? 5 : 9); j++) lane(drone(.8 + r() * .6), 'drone', -14 - r() * 18, 1 + r() * 9, 3 + r() * 3, j % 2 ? -1 : 1, r() * 200, 1);
  /* главный корабль: каждые ~30 с близко пролетает слева направо - за ним сидя поворачивается голова */
  var hero = ship(2.1, HUL[0], HUL[1]); root.add(hero); var HP = 30, HD = 15, HX = 80, hT0 = 6, heroOn = false;
  var vT = new T.Vector3();

  X.TICK.push(function (t, dt) { NOW = t;
    for (var k = 0; k < LANES.length; k++) { var o = LANES[k], L = o.userData.L, span = 180, u = ((t * L.sp + L.ph) % span) - span / 2;
      o.position.set(u * L.dir, L.y + Math.sin(t * .5 + L.ph) * .8, L.z); o.rotation.y = L.dir > 0 ? 0 : PI;
      if (L.kind === 'ship') o.rotation.x = Math.sin(t * .7 + L.ph) * .08; else { o.rotation.z = -.15 * L.dir; var bl = Math.sin(t * 6 + L.ph) > .3; o.userData.bl[0].visible = bl; o.userData.bl[1].visible = !bl; } }
    var ht = (t - hT0) % HP; heroOn = t > hT0 && ht < HD;
    if (heroOn) { var e = ht / HD; hero.visible = true; hero.position.set(-HX + 2 * HX * e, 7 + Math.sin(e * PI) * 3, -24 - Math.sin(e * PI) * 2); hero.rotation.set(Math.sin(e * PI * 2) * .1, 0, Math.cos(e * PI) * .12); }
    else hero.visible = false;
    for (k = 0; k < isl.length; k++) { var g = isl[k]; g.position.y = g.userData.y0 + Math.sin(t * .25 + g.userData.ph) * .6; }
    spk.forEach(function (s) { var a = X.MON && X.MON.talk ? .6 + Math.abs(Math.sin(t * 9 + s.ph)) * .9 : .35; s.ring.material.color.copy(s.c).multiplyScalar(a); });
    if (!X.sitting() && !hinted && X.pos.distanceTo(vT.set(SEAT.x, X.pos.y, SEAT.z)) < 3.4) { hinted = true; X.hint('Садись в кресло - начнётся теория', 4000); }
  });
  var hinted = false, NOW = 0; window.KOMNATA_OKNO.m2.heroNow = function () { hT0 = NOW + .5; };   /* для проверок */

  /* ---------- монитор на подставке, колонки, кресло ---------- */
  var mo = X.MON, dark = GX.std('#121318', .5, .6), mtl = GX.std('#3a3d48', .3, .9);
  if (mo) { var my = mo.g.position.y, mh = mo.list ? 0 : 0, bh2 = X.monH / 2;
    var stand = new T.Group(); stand.position.set(mo.g.position.x, 0, mo.g.position.z);
    stand.add(GX.box(.18, my - bh2 + .1, .12, mtl, 0, (my - bh2) / 2, -.08)); stand.add(GX.box(1.6, .05, .7, mtl, 0, .025, 0));
    /* низкая тумба с подсветкой */
    stand.add(GX.box(4.6, .42, .55, dark, 0, .21, .55)); var ls = new T.Mesh(new T.BoxGeometry(4.4, .02, .02), new T.MeshBasicMaterial({ color: new T.Color(X.MC).multiplyScalar(1.6), toneMapped: false })); ls.position.set(0, .03, .84); stand.add(ls);
    GX.add(stand); X.block(mo.g.position.x, mo.g.position.z + .4, 2.4, .5, 0); }
  var spk = [];
  [-1, 1].forEach(function (k) { var g = new T.Group(), sx = k * (X.monW / 2 + .75); g.position.set(sx, 0, (mo ? mo.g.position.z : NZ + 1.5) + .45); g.rotation.y = -k * .18;
    var cab = GX.std(PAL.spk, .45, .2); g.add(GX.rbox ? GX.rbox(.62, 1.75, .5, .05, cab, 0, .875 + .06, 0) : GX.box(.62, 1.75, .5, cab, 0, .935, 0));
    [[.35, .25], [.85, .25], [1.38, .12]].forEach(function (d, q) { var dr = new T.Mesh(new T.CylinderGeometry(d[1], d[1] * .9, .05, 28), GX.std('#0b0b0e', .7, .2)); dr.rotation.x = PI / 2; dr.position.set(0, d[0] + .2, .26); g.add(dr);
      var cn = new T.Mesh(new T.CylinderGeometry(d[1] * .35, d[1] * .2, .04, 20), mtl); cn.rotation.x = PI / 2; cn.position.set(0, d[0] + .2, .29); g.add(cn); });
    var c = new T.Color(X.MC), ring = new T.Mesh(new T.TorusGeometry(.27, .012, 6, 40), new T.MeshBasicMaterial({ color: c.clone(), toneMapped: false })); ring.position.set(0, .55, .29); g.add(ring);
    [-.24, .24].forEach(function (f) { g.add(GX.box(.04, .06, .04, mtl, f, .03, f)); });
    GX.add(g); spk.push({ ring: ring, c: c, ph: k }); X.block(sx, g.position.z, .4, .4, 0); });

  var SEAT = { x: 0, z: -2.3, eye: 1.22, ux: 1.1, uz: .5 };
  var ch = new T.Group(); ch.position.set(SEAT.x, 0, SEAT.z);
  var cm = GX.std(PAL.chair[0], .55, .05), ca = GX.std(PAL.chair[1], .5, .1), rb = function (w, h, d, rr, m, x, y, z) { var o = GX.rbox ? GX.rbox(w, h, d, rr, m, x, y, z) : GX.box(w, h, d, m, x, y, z); ch.add(o); return o; };
  for (i = 0; i < 5; i++) { var leg = GX.box(.42, .05, .07, mtl, 0, .08, 0), a5 = i / 5 * PI * 2; leg.position.set(Math.cos(a5) * .2, .08, Math.sin(a5) * .2); leg.rotation.y = -a5; ch.add(leg);
    var wh = new T.Mesh(new T.SphereGeometry(.045, 10, 8), dark); wh.position.set(Math.cos(a5) * .4, .045, Math.sin(a5) * .4); ch.add(wh); }
  var col = new T.Mesh(new T.CylinderGeometry(.04, .05, .36, 14), mtl); col.position.y = .28; ch.add(col);
  rb(.66, .14, .62, .06, cm, 0, .52, 0); rb(.6, .05, .5, .02, ca, 0, .6, -.02);
  var back = new T.Group(); back.position.set(0, .58, .3); back.rotation.x = .16; ch.add(back);
  var bk = GX.rbox ? GX.rbox(.62, .9, .13, .06, cm, 0, .48, 0) : GX.box(.62, .9, .13, cm, 0, .48, 0); back.add(bk);
  back.add(GX.rbox ? GX.rbox(.18, .74, .02, .01, ca, 0, .5, -.07) : GX.box(.18, .74, .02, ca, 0, .5, -.07));
  back.add(GX.rbox ? GX.rbox(.42, .2, .14, .06, cm, 0, 1.06, -.01) : GX.box(.42, .2, .14, cm, 0, 1.06, -.01));
  [-1, 1].forEach(function (k) { ch.add(GX.box(.05, .24, .05, mtl, k * .34, .7, .05)); rb(.09, .05, .36, .02, cm, k * .34, .83, 0); });
  GX.add(ch); X.block(SEAT.x, SEAT.z, .45, .45, 0); X.ring(SEAT.x, SEAT.z, .95, PAL.chair[1]);
  X.CLICK.push({ o: ch, kind: 'seat', at: [SEAT.x + .9, SEAT.z + .8], look: [SEAT.x, 1.0, SEAT.z] });

  var LOOK = new T.Vector3(mo ? mo.g.position.x : 0, mo ? mo.g.position.y - .15 : 2.2, mo ? mo.g.position.z : NZ);
  return { seat: SEAT, look: function () { return LOOK; },
    /* куда смотреть сидя: на главный корабль, пока он за окном и не дальше 65 градусов от экрана */
    focus: function (p) { if (!heroOn) return null; var dx = hero.position.x - p.x, dz = hero.position.z - p.z, a = Math.atan2(dx, -dz); if (Math.abs(a) > 1.13) return null; return hero.position; },
    sat: function () {} };
}

window.KOMNATA_OKNO = window.KOMNATA_OKNO || {};
var MW = 5.6, MH = 3.15;
window.KOMNATA_OKNO.m2 = {
  /* перестановка в зале под окно: монитор отходит от стены на подставку, стенды 4 и 5 - в стороны, диван убираем (вместо него кресло) */
  pre: function (cfg) { var W = cfg.size[0], D = cfg.size[1], H = cfg.size[2];
    cfg.okno = { n: [[-W / 2 + .3, W / 2 - .3, H - .35]] };
    if (cfg.monitor) { cfg.monitor.x = 0; cfg.monitor.y = 2.25; cfg.monitor.z = -D / 2 + 1.1; cfg.monitor.w = MW; cfg.monitor.h = MH; }
    (cfg.stands || []).forEach(function (s) { if (s.task === 'm2_radio') s.x = -8.6; if (s.task === 'm2_fly') s.x = 8.9; });
    cfg.decor = (cfg.decor || []).filter(function (d) { return d.t !== 'sofa'; });
    cfg.look = [0, 2.4, -D / 2];
  },
  build: function (X) { X.monW = MW; X.monH = MH; this.sit = X.sit; this.busy = X.anim; this.view = function (a, b) { X.view(new X.T.Vector3(a[0], a[1], a[2]), new X.T.Vector3(b[0], b[1], b[2])); }; return make(X); }   /* sit - для проверок: KOMNATA_OKNO.m2.sit() */
};
})();
