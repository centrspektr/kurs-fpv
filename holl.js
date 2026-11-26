/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* holl.js - Лётная школа (проба 24.11.2026): холл - лобби небоскрёба от первого лица (вариант А, выбор Alexandr).
   Слева стекло от пола до потолка с ночным городом (как окно Мастерской), прямо - мраморная стена и лифт в латунной раме
   с табло этажа и кнопкой вызова, справа - стена из тёмных реек и стенд "Мой путь". Глянцевый пол, ресепшен с неоном, растения, кресла у окна.
   Подошёл к лифту - нажал вызов - лифт приехал, двери открылись - меню этажей (shkola.js) - зашёл в кабину - поехали.
   Движок - komnata-new.js (ходьба как в остальных комнатах, шестерёнка, качество графики), графика - набор inter.js (свой стиль "L").
   Всё рисуется кодом: картинок и чужих моделей нет. Подключать после komnata-new.js и до shkola.js.
   Связь с shkola.js: window.SHKOLA_HOLL = { info(), menu(), progress() } (даёт школа), KOMNATA_OKNO.hall.board(i, cb) / .menuClosed() / .toLift() (даёт холл). */
(function () {
'use strict';
var T = window.THREE; if (!T || !window.KOMNATA) return;
var PI = Math.PI, W = 16, D = 14, H = 4.6, NZ = -D / 2, MC = '#7cf3ff', WARM = '#ffd9a0';
var MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
var SMALL = MOB && (navigator.deviceMemory || 4) < 4;   /* слабый телефон: фактуры неба и города меньше */
var DISP = 'ShU,Unbounded,Manrope,system-ui,sans-serif', FONT = 'ShM,Manrope,system-ui,sans-serif';
var CITY = ['#7cf3ff', '#ff7ad9', '#ffd36e', '#b7a4ff'];
function rnd0(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function hexA(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }

/* ---------- свой стиль графики: тёмный глянцевый пол, тёплый свет, латунь ---------- */
if (window.INTER && INTER.STYLES && !INTER.STYLES.L) INTER.STYLES.L = { name: 'Лобби небоскрёба', bg: '#05060d', fog: null,
  wall: '#e9e1d2', wallSeam: 'rgba(0,0,0,.3)', wallKind: 'panel', wallRough: .5,
  feature: 'wood', floorTex: 'tile', floorTint: '#1c1d25', floorTile: 2.4, floorRough: .1, floorMetal: .35, mirror: .2,
  ceil: '#17181e', trim: '#b8904e', trimMetal: .9, frame: '#1b1e27', frameMetal: .8, leaf: 'glass',
  base: '#121319', lmBase: [.29, .28, .27], lamp: '#ffe4bd', lampPow: .42, lampKind: 'none', lampEm: 3.4,
  cove: WARM, coveEm: 2.0, neonEdge: 0, accentK: 2.4,
  hemi: ['#fff0dc', '#3a3144', .22], key: ['#ffe9cc', .42], env: .7, exposure: 1.0, bloom: [.5, .6, 1.0], vignette: .36, tint: [1.02, 1.0, .97],
  signBg: '#101218', signFg: '#f4ead8', dark: true };

/* ---------- фактуры ---------- */
/* мрамор: плиты 1.6 x 3.2 м, на картинке две плиты */
function marbleDraw(x, w, h) { var r = rnd0(23), i, k;
  x.fillStyle = '#e9e1d3'; x.fillRect(0, 0, w, h);
  for (i = 0; i < 70; i++) { var cx = r() * w, cy = r() * h, cr = (.06 + r() * .22) * w, g = x.createRadialGradient(cx, cy, 0, cx, cy, cr); var cc = r() > .5 ? '#ffffff' : '#c9bca8'; g.addColorStop(0, hexA(cc, .10 + r() * .10)); g.addColorStop(1, hexA(cc, 0)); x.fillStyle = g; x.fillRect(cx - cr, cy - cr, cr * 2, cr * 2); }
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (i = 0; i < 26; i++) { var px = r() * w, py = r() * h, a = r() * PI * 2, n = 14 + Math.floor(r() * 40), lw = .5 + r() * r() * 5, col = r() > .35 ? '#8d8474' : '#b89a62';
    x.beginPath(); x.moveTo(px, py); for (k = 0; k < n; k++) { a += (r() - .5) * .9; px += Math.cos(a) * w * .022; py += Math.sin(a) * w * .022; x.lineTo(px, py); }
    x.strokeStyle = hexA(col, .05 + r() * .09); x.lineWidth = lw * 3; x.stroke(); x.strokeStyle = hexA(col, .14 + r() * .25); x.lineWidth = lw * .6; x.stroke(); }
  for (i = 0; i < 2600; i++) { x.fillStyle = 'rgba(' + (r() > .5 ? '255,255,255' : '120,110,95') + ',' + r() * .06 + ')'; x.fillRect(r() * w, r() * h, 2, 2); }
  /* швы между плитами */
  x.fillStyle = 'rgba(70,62,50,.55)'; x.fillRect(0, 0, 2, h); x.fillRect(w / 2 - 1, 0, 2, h); x.fillRect(0, h - 2, w, 2);
  x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(2, 0, 1, h); x.fillRect(w / 2 + 1, 0, 1, h); }
/* стена из вертикальных реек тёмного ореха */
function slatDraw(x, w, h) { var r = rnd0(5), n = 8, sw = w / n, i, k;
  x.fillStyle = '#0c0907'; x.fillRect(0, 0, w, h);
  for (i = 0; i < n; i++) { var x0 = i * sw + sw * .14, ww = sw * .72, g = x.createLinearGradient(x0, 0, x0 + ww, 0), b = .85 + r() * .3;
    function c(v) { return 'rgb(' + Math.round(96 * v * b) + ',' + Math.round(62 * v * b) + ',' + Math.round(38 * v * b) + ')'; }
    g.addColorStop(0, c(.55)); g.addColorStop(.25, c(1.05)); g.addColorStop(.7, c(.9)); g.addColorStop(1, c(.4)); x.fillStyle = g; x.fillRect(x0, 0, ww, h);
    for (k = 0; k < 26; k++) { x.fillStyle = 'rgba(20,10,4,' + (.05 + r() * .14) + ')'; x.fillRect(x0 + r() * ww, 0, 1 + r() * 1.5, h); } } }
/* пол: тёмный полированный камень, плиты 1.2 м (на картинке 2 x 2) */
function floorDraw(x, w, h) { var r = rnd0(41), i, k, j;
  x.fillStyle = '#1b1c24'; x.fillRect(0, 0, w, h);
  for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) { x.fillStyle = 'rgba(' + (r() > .5 ? '255,255,255' : '0,0,0') + ',' + (.015 + r() * .035) + ')'; x.fillRect(i * w / 2, j * h / 2, w / 2, h / 2); }
  x.lineCap = 'round';
  for (i = 0; i < 16; i++) { var px = r() * w, py = r() * h, a = r() * PI * 2, n = 10 + Math.floor(r() * 26);
    x.beginPath(); x.moveTo(px, py); for (k = 0; k < n; k++) { a += (r() - .5) * 1.0; px += Math.cos(a) * w * .025; py += Math.sin(a) * w * .025; x.lineTo(px, py); }
    x.strokeStyle = 'rgba(190,180,200,' + (.03 + r() * .06) + ')'; x.lineWidth = .6 + r() * 2.2; x.stroke(); }
  for (i = 0; i < 2400; i++) { x.fillStyle = 'rgba(255,255,255,' + r() * .035 + ')'; x.fillRect(r() * w, r() * h, 2, 2); }
  x.fillStyle = 'rgba(0,0,0,.7)'; for (i = 0; i < 2; i++) { x.fillRect(i * w / 2 - 2, 0, 4, h); x.fillRect(0, i * h / 2 - 2, w, 4); } x.fillRect(w - 2, 0, 2, h); x.fillRect(0, h - 2, w, 2);
  x.fillStyle = 'rgba(196,154,85,.20)'; for (i = 0; i < 2; i++) { x.fillRect(i * w / 2 + 2, 0, 1, h); x.fillRect(0, i * h / 2 + 2, w, 1); } }
/* шлифованная сталь дверей лифта */
function steelDraw(x, w, h) { var r = rnd0(9), g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#9aa1ad'); g.addColorStop(.3, '#d5dae2'); g.addColorStop(.55, '#aab0bb'); g.addColorStop(.8, '#cdd2da'); g.addColorStop(1, '#8f96a2'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (var i = 0; i < 700; i++) { x.fillStyle = 'rgba(' + (r() > .5 ? '255,255,255' : '40,45,60') + ',' + r() * .05 + ')'; x.fillRect(r() * w, 0, 1, h); }
  /* филёнка: тонкая врезанная рамка */
  x.strokeStyle = 'rgba(30,34,46,.55)'; x.lineWidth = 2; x.strokeRect(w * .14, h * .05, w * .72, h * .86); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1; x.strokeRect(w * .14 + 2, h * .05 + 2, w * .72, h * .86); }
/* ночное небо на дуге: космос, галактика, свечение и силуэты далёкого города (в духе окна Мастерской) */
function skyCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'), r = rnd0(11), i, g, hz = h * .64;
  var SKY = ['#03020c', '#0a0626', '#1d0f4a', '#3b1670', '#6a2a8c'], NEB = ['#ff4fd8', '#5a7dff', '#22e0ff'];
  g = x.createLinearGradient(0, 0, 0, hz); SKY.forEach(function (s, k) { g.addColorStop(k / (SKY.length - 1), s); }); x.fillStyle = g; x.fillRect(0, 0, w, hz);
  g = x.createLinearGradient(0, hz, 0, h); g.addColorStop(0, SKY[4]); g.addColorStop(.25, SKY[2]); g.addColorStop(1, SKY[0]); x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
  x.globalCompositeOperation = 'lighter';
  for (i = 0; i < 26; i++) { var nx = r() * w, ny = r() * hz * .8, nr = (.05 + r() * .16) * w, cc = NEB[i % 3]; g = x.createRadialGradient(nx, ny, 0, nx, ny, nr); g.addColorStop(0, hexA(cc, .10 + r() * .08)); g.addColorStop(1, hexA(cc, 0)); x.fillStyle = g; x.fillRect(nx - nr, ny - nr, nr * 2, nr * 2); }
  x.save(); x.translate(w * .5, hz * .5); x.rotate(-.18);
  for (i = 0; i < (w > 3000 ? 9000 : 4500); i++) { var u = (r() - .5) * w * 1.3, v = gauss(r) * h * .07; x.fillStyle = 'rgba(255,255,255,' + (r() * .35) + ')'; x.fillRect(u, v, 1.2, 1.2); }
  g = x.createLinearGradient(0, -h * .12, 0, h * .12); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, hexA('#ffb3f0', .10)); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(-w, -h * .12, w * 2, h * .24); x.restore();
  for (i = 0; i < (w > 3000 ? 4200 : 2200); i++) { var sy = Math.pow(r(), .8) * hz * .98, a = .35 + r() * .65, sr = (r() < .05 ? 2.6 : r() * 1.6 + .6) * Math.max(.7, w / 4096 * 1.4); x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.fillRect(r() * w, sy, sr, sr); }
  var gx = w * .5, gy = hz * .36, gs = w * .085; x.save(); x.translate(gx, gy); x.scale(1, .42); x.rotate(.5);
  g = x.createRadialGradient(0, 0, 0, 0, 0, gs * 1.6); g.addColorStop(0, hexA('#fff3e0', .9)); g.addColorStop(.12, hexA('#ffb3f0', .5)); g.addColorStop(.5, hexA('#8fd0ff', .12)); g.addColorStop(1, hexA('#8fd0ff', 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, gs * 1.6, 0, 7); x.fill();
  for (var arm = 0; arm < 2; arm++) for (i = 0; i < 2000; i++) { var tt = r() * 3.4, rad = gs * .08 * Math.exp(tt * .62), ang = tt * 1.9 + arm * PI + gauss(r) * .22; x.fillStyle = hexA(r() < .3 ? '#ffb3f0' : r() < .5 ? '#8fd0ff' : '#ffffff', .25 + r() * .5); var sz = r() * 2.2 + .6; x.fillRect(Math.cos(ang) * rad, Math.sin(ang) * rad, sz, sz); }
  x.restore();
  g = x.createLinearGradient(0, hz - h * .16, 0, hz + h * .06); g.addColorStop(0, hexA('#ff5fc8', 0)); g.addColorStop(.8, hexA('#ff5fc8', .45)); g.addColorStop(1, hexA('#ff5fc8', .15)); x.fillStyle = g; x.fillRect(0, hz - h * .16, w, h * .22);
  x.globalCompositeOperation = 'source-over';
  [[.0, '#120b30', .5], [.035, '#0b0822', .8], [.07, '#06051a', 1]].forEach(function (L, li) { var bx = -10; while (bx < w) { var bw = (14 + r() * 46) * w / 4096 * 1.6, bh = (.02 + r() * r() * (.13 - li * .02)) * h, by = hz + L[0] * h - bh;
    x.fillStyle = L[1]; x.fillRect(bx, by, bw, h - by); var cc = CITY[Math.floor(r() * 4)];
    x.globalAlpha = L[2]; x.fillStyle = cc; x.fillRect(bx, by, bw, 2); if (r() > .7) x.fillRect(bx + bw * .5 - 1, by - 18 * r(), 2, 18);
    for (var yy = by + 5; yy < hz + h * .1; yy += 6) for (var xx = bx + 3; xx < bx + bw - 3; xx += 5) if (r() > .62) { x.globalAlpha = L[2] * (.3 + r() * .6); x.fillStyle = r() > .3 ? '#ffe9b0' : cc; x.fillRect(xx, yy, 2, 3); }
    x.globalAlpha = 1; bx += bw + r() * 30; } });
  g = x.createLinearGradient(0, hz, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,8,.65)'); x.fillStyle = g; x.fillRect(0, hz, w, h - hz);
  return c; }
/* окна башен: первый столбик и строка тёмные (туда смотрят крыши) */
function winCanvas() { var c = document.createElement('canvas'); c.width = 128; c.height = 256; var x = c.getContext('2d'), r = rnd0(5), yy, xx; x.fillStyle = '#090a1a'; x.fillRect(0, 0, 128, 256);
  for (yy = 8; yy < 248; yy += 12) { var fl = r(); if (fl < .18) continue;   /* тёмный этаж */
    for (xx = 8; xx < 120; xx += 8) { if ((xx - 8) % 32 === 24) continue;   /* простенок */ if (r() > (fl > .85 ? .15 : .58)) continue; x.fillStyle = r() > .9 ? CITY[Math.floor(r() * 4)] : r() > .5 ? '#ffe7b0' : '#cfe0ff'; x.globalAlpha = .35 + r() * .65; x.fillRect(xx, yy, 5, 7); } }
  x.globalAlpha = 1; return c; }
/* улицы далеко внизу */
function streetCanvas() { var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d'), r = rnd0(17), i; x.fillStyle = '#05040f'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = 'rgba(255,190,120,.22)'; x.fillRect(0, 118, 256, 6); x.fillRect(118, 0, 6, 256);
  for (i = 0; i < 90; i++) { x.fillStyle = hexA(r() > .6 ? CITY[Math.floor(r() * 4)] : '#ffd9a0', .35 + r() * .6); var a = r() > .5; x.fillRect(a ? r() * 256 : 119 + r() * 3, a ? 119 + r() * 3 : r() * 256, 2, 2); }
  for (i = 0; i < 60; i++) { x.fillStyle = hexA(CITY[Math.floor(r() * 4)], .2 + r() * .4); x.fillRect(r() * 256, r() * 256, 3, 2); } return c; }

/* ---------- помощники сборки ---------- */
function kit(X) { var G = X.GX;
  function std(c, ro, me, o) { return G.std(c, ro, me, o); }
  function box(w, h, d, m, x, y, z, p) { var o = G.box(w, h, d, m, x, y, z); p.add(o); return o; }
  function rb(w, h, d, r, m, x, y, z, p) { var o = G.rbox(w, h, d, r, m, x, y, z); p.add(o); return o; }
  function cyl(rt, rbt, h, m, x, y, z, p, seg) { var o = new T.Mesh(new T.CylinderGeometry(rt, rbt, h, seg || 20), m); o.position.set(x, y, z); p.add(o); return o; }
  function sph(r, m, x, y, z, p, seg) { var o = new T.Mesh(new T.SphereGeometry(r, seg || 14, Math.round((seg || 14) * .7)), m); o.position.set(x, y, z); p.add(o); return o; }
  function tor(r, t, m, x, y, z, p, seg) { var o = new T.Mesh(new T.TorusGeometry(r, t, 8, seg || 40), m); o.position.set(x, y, z); p.add(o); return o; }
  function lathe(pts, m, x, y, z, p, seg) { var o = new T.Mesh(new T.LatheGeometry(pts.map(function (q) { return new T.Vector2(q[0], q[1]); }), seg || 20), m); o.position.set(x, y, z); p.add(o); return o; }
  function plane(w, h, m, x, y, z, p) { var o = new T.Mesh(new T.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.userData.noShadow = true; p.add(o); return o; }
  function lit(c, k) { var m = new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.5), toneMapped: false }); return m; }   /* светится */
  function pic(map, o) { return new T.MeshBasicMaterial(Object.assign({ map: map, toneMapped: false }, o || {})); }
  function grp(x, y, z, ry) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; return g; }
  function noSh(o) { o.traverse(function (m) { m.userData.noShadow = true; }); return o; }
  function fitText(x, s, font, size, maxW) { x.font = font.replace('%', size); while (size > 12 && x.measureText(s).width > maxW) { size -= 2; x.font = font.replace('%', size); } return size; }
  return { G: G, std: std, box: box, rb: rb, cyl: cyl, sph: sph, tor: tor, lathe: lathe, plane: plane, lit: lit, pic: pic, grp: grp, noSh: noSh, tex: X.tex, fitText: fitText };
}
/* лист-перо: полоса, которая поднимается и свисает */
function leafGeo(L, lift, droop, wd) { var n = 6, P = [], I = [], i;
  for (i = 0; i <= n; i++) { var t = i / n, r = L * Math.cos(lift) * t * (1 + .25 * t), y = L * (Math.sin(lift) * t - droop * t * t), w = wd * Math.pow(Math.sin(PI * (t * .9 + .06)), .7);
    P.push(r, y + .02 * Math.sin(t * PI), -w, r, y, w); }
  for (i = 0; i < n; i++) { var a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g; }

/* ================================================================= сборка холла */
var ST = null;   /* состояние: лифт, стенд, кнопки */
function build(X) {
  var G = X.GX; if (!G) return null;
  var K = kit(X), r = rnd0(77), i, j;
  var brass = K.std('#c49a55', .26, .95), brassD = K.std('#8a6a35', .4, .9), dark = K.std('#14151b', .45, .5), stone = K.std('#1a1b22', .16, .35), cream = K.std('#d8cdbb', .42, .02), steelM = K.std('#b9c0cc', .3, .9), frameM = K.std('#1b1e27', .35, .8);
  var warmL = K.lit(WARM, 2.0), cyanL = K.lit(MC, 1.7);

  if (G.mat.frost) { G.mat.frost.color.set('#7f95b5').convertSRGBToLinear(); G.mat.frost.opacity = .5; }   /* входные двери - дымчатое стекло */
  /* ---------- пол: свой рисунок камня вместо плитки стиля ---------- */
  var fT = X.tex(SMALL ? 512 : 1024, SMALL ? 512 : 1024, floorDraw); fT.wrapS = fT.wrapT = T.RepeatWrapping;
  G.world.traverse(function (m) { if (m.userData.floor && m.material) { m.material.map = fT; m.material.color.set('#ffffff'); m.material.metalness = .12; m.material.roughness = .2; m.material.envMapIntensity = .42; m.material.needsUpdate = true; } });

  /* ---------- стеклянная стена слева и ночной город за ней ---------- */
  (function glass() {
    var z0 = -D / 2 + .25, z1 = D / 2 - .25, len = z1 - z0, wy = H - .3, n = 7, g = K.grp(-W / 2, 0, 0);
    K.box(.3, .1, len + .2, frameM, 0, .05, 0, g); K.box(.3, .14, len + .2, frameM, 0, wy + .07, 0, g); K.box(.14, .06, len, frameM, .02, 3.05, 0, g);
    for (i = 0; i <= n; i++) { var e = i === 0 || i === n; K.box(e ? .3 : .16, wy, e ? .16 : .07, frameM, 0, wy / 2, z0 + len * i / n, g); }
    K.box(.03, .025, len, K.lit('#b78cff', 1.6), .16, .115, 0, g).userData.noShadow = true;
    G.add(g);
    var gl = new T.Mesh(new T.BoxGeometry(.02, wy, len), new T.MeshPhysicalMaterial({ color: '#bcd6ff', roughness: .05, metalness: 0, transparent: true, opacity: .09, depthWrite: false })); gl.position.set(-W / 2 - .03, wy / 2, 0); gl.userData.noShadow = true; gl.userData.noMirror = true; G.add(gl, { shadow: false, mirror: false });
    X.block(-W / 2 + .1, 0, .25, D / 2);
  })();
  var city = (function () {
    var out = K.grp(0, 0, 0, PI / 2);   /* внутри группы "наружу" - это -z, как у окна Мастерской */
    var B = function (c) { return new T.MeshBasicMaterial({ color: c, fog: false }); };
    var sc = skyCanvas(SMALL ? 1024 : MOB ? 2048 : 4096, SMALL ? 512 : MOB ? 1024 : 2048), st = new T.CanvasTexture(sc); st.encoding = T.sRGBEncoding; st.anisotropy = 4; st.wrapS = T.RepeatWrapping; st.repeat.x = -1;
    var R0 = 110, sky = new T.Mesh(new T.CylinderGeometry(R0, R0, 150, 48, 1, true, PI * .38, PI * 1.24), new T.MeshBasicMaterial({ map: st, side: T.BackSide, fog: false, color: new T.Color(1.25, 1.25, 1.25) })); sky.position.set(0, 30, -3); out.add(sky);
    var cap = new T.Mesh(new T.CircleGeometry(R0, 32), B('#03020c')); cap.rotation.x = PI / 2; cap.position.set(0, 104, -3); out.add(cap);
    var stT = new T.CanvasTexture(streetCanvas()); stT.encoding = T.sRGBEncoding; stT.wrapS = stT.wrapT = T.RepeatWrapping; stT.repeat.set(9, 9);
    var gnd = new T.Mesh(new T.PlaneGeometry(260, 260), new T.MeshBasicMaterial({ map: stT, fog: false })); gnd.rotation.x = -PI / 2; gnd.position.set(0, -44, -70); out.add(gnd);
    /* башни: одна фактура окон на все, повтор окон зашит в координаты - всё склеивается в один предмет */
    var wt = new T.CanvasTexture(winCanvas()); wt.encoding = T.sRGBEncoding; wt.wrapS = wt.wrapT = T.RepeatWrapping; wt.magFilter = T.LinearFilter;
    var wm = new T.MeshBasicMaterial({ map: wt, fog: false, vertexColors: true }), tips = CITY.map(function (c) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(1.5), fog: false, toneMapped: false }); });
    var roofM = B('#07071a');
    function tower(x, z, bw, bd, top) { var y0 = -44, bh = top - y0, g = new T.BoxGeometry(bw, bh, bd), uv = g.attributes.uv, k;
      for (k = 0; k < uv.count; k++) { var f = Math.floor(k / 4); if (f === 2 || f === 3) { uv.setXY(k, .01, .01); continue; } var su = (f < 2 ? bd : bw) / 3.2, sv = bh / 6.4; uv.setXY(k, .02 + uv.getX(k) * Math.max(1, Math.round(su)), .01 + uv.getY(k) * Math.max(1, Math.round(sv))); }
      var far = Math.min(1, Math.max(0, (-z - 36) / 70)), tc = new T.Color(1.25, 1.2, 1.3).lerp(new T.Color(.55, .42, .85), far), ca = new Float32Array(uv.count * 3); for (k = 0; k < uv.count; k++) { ca[k * 3] = tc.r; ca[k * 3 + 1] = tc.g; ca[k * 3 + 2] = tc.b; } g.setAttribute('color', new T.BufferAttribute(ca, 3));   /* дальние башни тусклее и в сиреневой дымке */
      var m = new T.Mesh(g, wm); m.position.set(x, y0 + bh / 2, z); out.add(m);
      var c = Math.floor(r() * 4); var cr = new T.Mesh(new T.BoxGeometry(bw + .12, .22, bd + .12), tips[c]); cr.position.set(x, top - .05, z); out.add(cr);
      var rf = new T.Mesh(new T.BoxGeometry(bw, .3, bd), roofM); rf.position.set(x, top + .02, z); out.add(rf);   /* тёмная крыша: светится только кромка */
      if (r() > .45) { var tp = new T.Mesh(new T.BoxGeometry(.14, 3 + r() * 4, .14), tips[(c + 1) % 4]); tp.position.set(x + (r() - .5) * bw * .5, top + 2, z + (r() - .5) * bd * .5); out.add(tp); } }
    [[-52, -40, 8, 8, 3], [-33, -46, 9, 9, 13], [-19, -38, 7, 7, -5], [-5, -50, 10, 9, 8], [11, -39, 7, 8, -2], [25, -47, 9, 9, 17], [40, -40, 7, 7, 1], [56, -45, 9, 8, 9],
     [-70, -66, 11, 10, 16], [-44, -74, 12, 11, 30], [-22, -70, 10, 10, 11], [2, -78, 11, 10, 24], [26, -72, 10, 10, 9], [48, -76, 12, 11, 34], [74, -64, 10, 10, 15],
     [-58, -100, 13, 12, 26], [-30, -104, 14, 12, 44], [-4, -102, 12, 12, 20], [22, -104, 13, 12, 38], [50, -100, 13, 12, 22], [-84, -90, 12, 12, 34], [84, -92, 12, 12, 30]].forEach(function (t) { tower(t[0], t[1], t[2], t[3], t[4]); });
    /* дроны с огоньками и корабли летят вдоль стекла */
    var glowTx = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
    function spr(col, s) { var m = new T.Sprite(new T.SpriteMaterial({ map: glowTx, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, toneMapped: false })); m.scale.set(s, s, 1); return m; }
    var dm = G.std('#20232c', .5, .5, { fog: false }), pm = new T.MeshBasicMaterial({ color: '#9aa3c0', transparent: true, opacity: .25, fog: false, side: T.DoubleSide }), engC = new T.Color(MC).multiplyScalar(2), redC = new T.Color('#ff3b3b').multiplyScalar(2);
    function drone(s) { var g = new T.Group(); [PI / 4, -PI / 4].forEach(function (a) { var b = new T.Mesh(new T.BoxGeometry(1.4 * s, .06 * s, .12 * s), dm); b.rotation.y = a; g.add(b); });
      g.add(new T.Mesh(new T.BoxGeometry(.4 * s, .16 * s, .5 * s), dm)); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p) { var d = new T.Mesh(new T.CircleGeometry(.36 * s, 12), pm); d.rotation.x = -PI / 2; d.position.set(p[0] * .5 * s, .08 * s, p[1] * .5 * s); g.add(d); });
      var a = spr(redC, .7 * s), b = spr(engC, .7 * s); a.position.set(-.3 * s, 0, 0); b.position.set(.3 * s, 0, 0); g.add(a); g.add(b); g.userData.bl = [a, b]; return g; }
    var hm = G.std('#c7cbe0', .35, .7, { fog: false }), am = G.std('#ff7ce0', .4, .5, { fog: false });
    function ship(s) { var g = new T.Group(), body = new T.Mesh(new T.CylinderGeometry(.35 * s, .6 * s, 3.2 * s, 8), hm); body.rotation.z = -PI / 2; g.add(body);
      var nose = new T.Mesh(new T.ConeGeometry(.35 * s, 1.4 * s, 8), hm); nose.rotation.z = -PI / 2; nose.position.x = 2.3 * s; g.add(nose);
      [-1, 1].forEach(function (k) { var w = new T.Mesh(new T.BoxGeometry(1.8 * s, .08 * s, 2.2 * s), am); w.position.set(-.5 * s, -.05 * s, k * 1.3 * s); w.rotation.y = k * -.35; g.add(w); var f = spr(engC, 1.1 * s); f.position.set(-1.9 * s, 0, k * 1.0 * s); g.add(f); });
      var fin = new T.Mesh(new T.BoxGeometry(1 * s, .9 * s, .07 * s), am); fin.position.set(-1.2 * s, .5 * s, 0); g.add(fin); return g; }
    var LANES = [];
    function lane(o, kind, z, y, sp, dir, ph) { o.userData.L = { z: z, y: y, sp: sp, dir: dir, ph: ph, kind: kind }; out.add(o); LANES.push(o); }
    for (j = 0; j < (MOB ? 5 : 8); j++) lane(drone(.8 + r() * .7), 'drone', -13 - r() * 12, .8 + r() * 5.5, 2.4 + r() * 3, j % 2 ? -1 : 1, r() * 200);
    for (j = 0; j < 3; j++) lane(ship(1 + r() * .8), 'ship', -48 - r() * 30, 8 + r() * 22, 5 + r() * 5, j % 2 ? 1 : -1, r() * 200);
    X.TICK.push(function (t) { for (var k = 0; k < LANES.length; k++) { var o = LANES[k], L = o.userData.L, span = L.kind === 'ship' ? 220 : 120, u = ((t * L.sp + L.ph) % span) - span / 2;
      o.position.set(u * L.dir, L.y + Math.sin(t * .5 + L.ph) * .5, L.z); o.rotation.y = L.dir > 0 ? 0 : PI;
      if (L.kind === 'ship') o.rotation.x = Math.sin(t * .7 + L.ph) * .08; else { o.rotation.z = -.15 * L.dir; var bl = Math.sin(t * 6 + L.ph) > .3; o.userData.bl[0].visible = bl; o.userData.bl[1].visible = !bl; } } });
    var und = new T.Mesh(new T.PlaneGeometry(D + 40, 70), B('#020208')); und.position.set(0, -35.02, -W / 2 - .2); out.add(und);   /* под полом город не должен просвечивать сквозь глянец */
    out.traverse(function (m) { m.userData.noMirror = true; m.userData.noShadow = true; });
    G.add(out, { shadow: false, mirror: false }); return out;
  })();

  /* ---------- лифт: латунная рама, стальные двери, кабина, табло, кнопка вызова ---------- */
  var LW = 2.1, LH = 2.55, leafW = LW / 2;
  var Lf = { st: 'idle', open: 0, want: 0, cab: 3, to: 0, tm: 0, cb: null, lit: false, leaves: [] };
  (function lift() {
    var g = K.grp(0, 0, NZ), jw = .2;
    /* портал */
    [-1, 1].forEach(function (k) { K.rb(jw, LH + jw, .36, .03, brass, k * (LW / 2 + jw / 2), (LH + jw) / 2, .06, g); K.box(.03, LH, .22, brassD, k * (LW / 2 - .015), LH / 2, -.02, g); });
    K.rb(LW + jw * 2, jw, .36, .03, brass, 0, LH + jw / 2, .06, g); K.box(LW, .03, .22, brassD, 0, LH - .015, -.02, g);
    K.box(LW, .016, .5, brass, 0, .008, .03, g);   /* порог */
    K.box(LW + 1.2, .012, .08, brass, 0, .006, 1.0, g); K.box(.08, .012, .78, brass, -(LW / 2 + .56), .006, .62, g); K.box(.08, .012, .78, brass, LW / 2 + .56, .006, .62, g);   /* латунная рамка на полу перед лифтом */
    /* табло этажа */
    K.rb(.9, .34, .09, .03, dark, 0, LH + jw + .3, .05, g); K.rb(.96, .4, .05, .03, brass, 0, LH + jw + .3, .02, g);
    var dT = X.tex(256, 88, function () {}), dM = K.pic(dT); dM.color.setScalar(1.5); dM.userData.noDedup = true; var disp = K.plane(.8, .275, dM, 0, LH + jw + .3, .097, g); disp.userData.noMerge = true;
    /* название над лифтом - латунные буквы */
    var nT = X.tex(1024, 128, function (x, w, h) { x.clearRect(0, 0, w, h); var gr = x.createLinearGradient(0, 20, 0, 110); gr.addColorStop(0, '#b98a3e'); gr.addColorStop(.5, '#8a6126'); gr.addColorStop(1, '#5e4015'); x.fillStyle = gr; x.textAlign = 'center'; x.textBaseline = 'middle';
      var s = 'ЛЁТНАЯ ШКОЛА', fs = 78; x.font = '800 ' + fs + 'px ' + DISP; var sp = 16, tw = 0, k; for (k = 0; k < s.length; k++) tw += x.measureText(s[k]).width + sp; var px = (w - tw + sp) / 2; x.textAlign = 'left';
      for (k = 0; k < s.length; k++) { x.shadowColor = 'rgba(40,25,5,.5)'; x.shadowBlur = 3; x.shadowOffsetY = 3; x.fillText(s[k], px, h / 2 + 4); px += x.measureText(s[k]).width + sp; } });
    K.plane(4.0, .5, K.pic(nT, { transparent: true, depthWrite: false }), 0, 3.9, .02, g);
    /* панель вызова справа */
    var px0 = LW / 2 + jw + .32, py0 = 1.2;
    K.rb(.26, .58, .035, .03, brass, px0, py0, .02, g); K.rb(.18, .48, .02, .02, dark, px0, py0, .035, g);
    var bt = K.cyl(.055, .055, .02, steelM, px0, py0 - .06, .05, g, 20); bt.rotation.x = PI / 2;
    var ringM = K.lit('#ffb347', .35); ringM.userData.noDedup = true; var ring = K.tor(.07, .011, ringM, px0, py0 - .06, .052, g, 28); ring.userData.noMerge = true; ring.userData.noShadow = true;
    var aT = X.tex(64, 64, function (x) { x.clearRect(0, 0, 64, 64); x.fillStyle = '#ffcf7a'; x.beginPath(); x.moveTo(32, 12); x.lineTo(54, 50); x.lineTo(10, 50); x.closePath(); x.fill(); });
    K.plane(.09, .09, K.pic(aT, { transparent: true, depthWrite: false }), px0, py0 + .13, .047, g);
    /* настенные светильники по бокам */
    [-1, 1].forEach(function (k) { var sx = k * 3.55; K.rb(.16, 2.5, .05, .02, brass, sx, 2.15, .03, g); K.box(.055, 2.3, .03, warmL, sx, 2.15, .07, g).userData.noShadow = true; });
    G.add(g);
    [-1, 1].forEach(function (k) { var h = G.halo(WARM, .5, 2.2, 4.2); h.position.set(k * 3.55, 2.15, NZ + .02); h.userData.noMirror = true; G.add(h, { shadow: false, mirror: false }); });
    var fh = G.halo(WARM, .32, 4.6, 3.4); fh.rotation.x = -PI / 2; fh.position.set(0, .012, NZ + 1.5); fh.userData.noMirror = true; G.add(fh, { shadow: false, mirror: false });
    var cone = new T.Mesh(new T.CylinderGeometry(.1, 1.25, H - .1, 24, 1, true), new T.MeshBasicMaterial({ color: '#fff0d4', transparent: true, opacity: .016, depthWrite: false, side: T.DoubleSide })); cone.position.set(0, (H - .1) / 2, NZ + 1.3); cone.userData.noShadow = cone.userData.noMirror = true; G.add(cone, { shadow: false, mirror: false });
    /* двери: каждая створка - отдельный предмет (едет сама, отражение в полу едет следом) */
    var sT = X.tex(256, 512, steelDraw), sM = K.std('#ffffff', .3, .88, { map: sT });
    [-1, 1].forEach(function (k) { var L = K.grp(k * leafW / 2, 0, NZ - .1); L.userData.noMerge = true;
      K.box(leafW - .006, LH, .05, sM, 0, LH / 2, 0, L); K.box(leafW - .006, .14, .056, brassD, 0, .07, 0, L);
      G.add(L, { live: true }); Lf.leaves.push([L, k]); });
    /* кабина за стеной: панели тёмного ореха, зеркало, латунный поручень, тёплый свет сверху.
       Свет нарисован прямо на фактурах (в кабину лампы зала не достают) - телефон это ничем не грузит */
    var c = K.grp(0, 0, NZ - .16), cw = 2.34, cd = 2.3, ch = 2.62;
    function cabWall(mirror) { return X.tex(256, 256, function (x, w, h) { var q = rnd0(mirror ? 31 : 32), k;
      var gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a8774a'); gr.addColorStop(.35, '#7c5230'); gr.addColorStop(1, '#4a2f1a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      for (k = 0; k < 500; k++) { x.fillStyle = 'rgba(' + (q() > .5 ? '255,220,170' : '30,15,5') + ',' + q() * .07 + ')'; x.fillRect(q() * w, 0, 1 + q(), h); }
      for (k = 0; k <= 4; k++) { x.fillStyle = 'rgba(20,10,4,.55)'; x.fillRect(k * w / 4 - 1, 0, 2, h); x.fillStyle = 'rgba(255,225,180,.18)'; x.fillRect(k * w / 4 + 1, 0, 1, h); }
      x.fillStyle = '#3a2413'; x.fillRect(0, h * .62, w, h * .38); gr = x.createLinearGradient(0, h * .62, 0, h); gr.addColorStop(0, 'rgba(120,80,45,.5)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = gr; x.fillRect(0, h * .62, w, h * .38);
      x.fillStyle = '#c49a55'; x.fillRect(0, h * .615, w, 4); x.fillStyle = '#7a5a2a'; x.fillRect(0, h * .615 + 4, w, 2);
      if (mirror) { var mx = w * .12, my = h * .1, mw = w * .76, mh = h * .46; x.fillStyle = '#c49a55'; x.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
        gr = x.createLinearGradient(mx, my, mx + mw, my + mh); gr.addColorStop(0, '#dfe7f1'); gr.addColorStop(.45, '#8f9bb0'); gr.addColorStop(.55, '#b9c4d6'); gr.addColorStop(1, '#5d6880'); x.fillStyle = gr; x.fillRect(mx, my, mw, mh);
        gr = x.createRadialGradient(w / 2, my, 0, w / 2, my, mw * .6); gr.addColorStop(0, 'rgba(255,240,215,.75)'); gr.addColorStop(1, 'rgba(255,240,215,0)'); x.fillStyle = gr; x.fillRect(mx, my, mw, mh);
        x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.moveTo(mx + mw * .18, my); x.lineTo(mx + mw * .34, my); x.lineTo(mx + mw * .1, my + mh); x.lineTo(mx - mw * .06 + mw * .06, my + mh); x.closePath(); x.fill(); } }); }
    var wSide = K.pic(cabWall(false)), wBack = K.pic(cabWall(true)), jamb = K.lit('#5a3a22', 1);
    var cfT = X.tex(128, 128, function (x, w, h) { x.fillStyle = '#17141c'; x.fillRect(0, 0, w, h); var gr = x.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * .7); gr.addColorStop(0, 'rgba(120,95,70,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a6a35'; x.lineWidth = 3; x.strokeRect(8, 8, w - 16, h - 16); });
    var pl; pl = K.plane(cw, cd, K.pic(cfT), 0, .012, -cd / 2, c); pl.rotation.x = -PI / 2;
    [-1, 1].forEach(function (k) { pl = K.plane(cd, ch, wSide, k * cw / 2, ch / 2, -cd / 2, c); pl.rotation.y = -k * PI / 2;
      var hr = K.cyl(.02, .02, cd - .5, brass, k * (cw / 2 - .09), 1.0, -cd / 2, c, 10); hr.rotation.x = PI / 2;
      K.box(.14, ch, .12, jamb, k * (LW / 2 + .07), ch / 2, -.03, c); });   /* простенки у дверей изнутри */
    K.plane(cw, ch, wBack, 0, ch / 2, -cd, c);
    var hb = K.cyl(.02, .02, cw - .5, brass, 0, 1.0, -cd + .09, c, 10); hb.rotation.z = PI / 2;
    pl = K.plane(cw, cd, K.lit('#1a1512', 1), 0, ch, -cd / 2, c); pl.rotation.x = PI / 2; K.box(cw, .12, .12, jamb, 0, LH + .06, -.03, c);
    K.box(1.3, .02, 1.1, K.lit('#fff0d8', 1.5), 0, ch - .02, -cd / 2, c).userData.noShadow = true; K.box(1.4, .03, 1.2, brass, 0, ch - .012, -cd / 2, c);
    var pn = K.rb(.16, .46, .02, .02, brass, cw / 2 - .02, 1.25, -.45, c); pn.rotation.y = -PI / 2;
    c.traverse(function (m) { m.userData.noMirror = true; m.userData.noShadow = true; }); G.add(c, { shadow: false, mirror: false });
    /* невидимая область нажатия на весь лифт с кнопкой */
    var hit = new T.Mesh(new T.BoxGeometry(LW + 1.5, 3.3, .1), new T.MeshBasicMaterial({ visible: false })); hit.position.set(.3, 1.65, NZ + .3); hit.userData.noMirror = hit.userData.noMerge = hit.userData.noShadow = true; G.add(hit, { shadow: false, mirror: false });
    Lf.click = { o: hit, kind: 'q', at: [.35, NZ + 3.0], look: [.35, 1.6, NZ], q: { card: liftCard, act: liftAct } }; X.CLICK.push(Lf.click);
    Lf.disp = dT; Lf.ring = ringM; ST.liftC = function () { return Lf.st === 'idle' || Lf.st === 'open' ? Lf.click : null; };
    /* мигающее кольцо у кнопки: видно издалека, куда нажимать */
    var pulse = G.halo('#ffb347', .9, .5); pulse.position.set(px0, py0 - .06, NZ + .075); pulse.userData.noMirror = pulse.userData.noMerge = true; G.add(pulse, { shadow: false, mirror: false }); Lf.pulse = pulse;
  })();
  function drawDisp(n, arrow) { var x = Lf.disp.userData.x; x.fillStyle = '#07080c'; x.fillRect(0, 0, 256, 88); x.textBaseline = 'middle'; x.shadowColor = '#ff9a2e'; x.shadowBlur = 12; x.fillStyle = '#ffd08a';
    x.font = '800 60px ' + DISP; x.textAlign = 'center'; x.fillText(String(n), arrow ? 160 : 128, 48);
    if (arrow) { x.beginPath(); if (arrow > 0) { x.moveTo(84, 22); x.lineTo(110, 64); x.lineTo(58, 64); } else { x.moveTo(84, 66); x.lineTo(110, 24); x.lineTo(58, 24); } x.closePath(); x.fill(); }
    x.shadowBlur = 0; Lf.disp.needsUpdate = true; }
  function doors(k) { Lf.open = k; var e = k * k * (3 - 2 * k); Lf.leaves.forEach(function (lf) { lf[0].position.x = lf[1] * (leafW / 2 + e * (leafW - .02)); }); }
  function lamp(on) { Lf.lit = on; Lf.ring.color.set('#ffb347').multiplyScalar(on ? 2.4 : .35); }
  function ding() { var Gs = window.GOLOS; if (Gs && Gs.on === false) return; try { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; var ac = ding.ac || (ding.ac = new AC()); if (ac.state === 'suspended') ac.resume();
      var vol = Gs && Gs.vol != null ? Gs.vol : 1; [[880, 0], [659, .22]].forEach(function (n) { var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + n[1]; o.type = 'sine'; o.frequency.value = n[0]; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09 * vol, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + .9); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .95); }); } catch (e) {} }
  function info() { var S = window.SHKOLA_HOLL; try { return S && S.info ? S.info() : null; } catch (e) { return null; } }
  function liftCard() { var st = Lf.st;
    if (st === 'coming') return { sm: 'ЛИФТ', h: 'Лифт едет...', p: 'Подожди пару секунд - двери откроются сами.', acts: '' };
    if (st === 'open' || st === 'menu') return { sm: 'ЛИФТ', h: 'Лифт приехал', p: 'Выбери этаж. Один этаж - один модуль курса.', acts: '<button class="k-b pri" data-a="q:menu">Выбрать этаж</button>' };
    return { sm: 'ЛИФТ', h: 'Вызови лифт', p: 'Лифт отвезёт тебя на этаж урока. Один этаж - один модуль курса.', acts: '<button class="k-b pri" data-a="q:call">Вызвать лифт</button>' }; }
  function liftAct(a) { if (a === 'call') call(); else if (a === 'menu') menu(); }
  function recard() { if (X.sel() === Lf.click) X.recard(); }
  function call() { if (Lf.st === 'open') { menu(); return; } if (Lf.st !== 'idle') return; Lf.st = 'coming'; Lf.tm = 0; lamp(true); drawDisp(Lf.cab, Lf.cab > 1 ? -1 : 0); recard(); }
  function menu() { if (Lf.st !== 'open') return; var S = window.SHKOLA_HOLL; if (!S || !S.menu) return; Lf.st = 'menu'; X.hold(true); X.unsel(); S.menu(); }
  /* каждый кадр: лифт едет, двери, мигание кнопки, кнопка "К лифту" */
  var vT = new T.Vector3(), near = false, goB = null, hinted = false, tOpen = 0;
  X.TICK.push(function (t, dt) {
    if (Lf.st === 'coming') { Lf.tm += dt; if (Lf.tm > .5) { Lf.tm = 0; if (Lf.cab > 1) { Lf.cab--; drawDisp(Lf.cab, Lf.cab > 1 ? -1 : 0); } else { Lf.st = 'opening'; Lf.want = 1; ding(); lamp(false); drawDisp(1, 0); } } }
    if (Lf.open !== Lf.want) { var k = Lf.open + Math.sign(Lf.want - Lf.open) * dt / 1.05; if ((Lf.want - Lf.open) * (Lf.want - k) <= 0) k = Lf.want; doors(k);
      if (k === Lf.want) { if (Lf.st === 'opening') { Lf.st = 'open'; recard(); if (near || X.sel() === Lf.click) menu(); } else if (Lf.st === 'closing') { Lf.st = 'idle'; recard(); } else if (Lf.st === 'board' && Lf.cb) { var f = Lf.cb; Lf.cb = null; Lf.st = 'ride'; setTimeout(f, 260); } } }
    if (Lf.st === 'open' && !near && X.sel() !== Lf.click) { tOpen += dt; if (tOpen > 9) { Lf.st = 'closing'; Lf.want = 0; } } else tOpen = 0;   /* ушёл от открытого лифта - двери закроются сами */
    Lf.pulse.visible = Lf.st === 'idle'; if (Lf.pulse.visible) { var s = 1 + .35 * Math.sin(t * 3.2); Lf.pulse.scale.setScalar(s); Lf.pulse.material.opacity = .55 + .35 * Math.sin(t * 3.2); }
    near = X.pos.distanceTo(vT.set(.35, X.pos.y, NZ + 2.4)) < 2.7;
    if (goB) { var show = !near && !X.anim() && !X.sel() && (Lf.st === 'idle' || Lf.st === 'open'); if (show !== goB._on) { goB._on = show; goB.classList.toggle('on', show); } }
  });

  /* ---------- ресепшен: кремовая стойка с неоновой полосой ---------- */
  var RX = -4.3, RZ = 1.1;
  (function reception() { var g = K.grp(RX, 0, RZ);
    K.rb(3.4, 1.0, .9, .04, cream, 0, .52, 0, g); K.box(3.3, .08, .84, dark, 0, .04, 0, g);
    K.rb(3.64, .06, 1.12, .02, stone, 0, 1.06, 0, g); K.box(3.64, .012, .02, brass, 0, 1.025, .565, g);
    K.box(3.42, .03, .03, cyanL, 0, .985, .465, g).userData.noShadow = true; K.box(3.3, .016, .02, cyanL, 0, .02, .46, g).userData.noShadow = true;
    var name = 'ЛЁТНАЯ ШКОЛА · ' + String((window.KURSY && KURSY.name) || 'Курс FPV').toUpperCase();
    var sT2 = X.tex(1024, 128, function (x, w, h) { x.fillStyle = '#d8cdbb'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2622'; x.textAlign = 'center'; x.textBaseline = 'middle'; K.fitText(x, name, '800 %px ' + DISP, 62, w - 60); x.fillText(name, w / 2, h / 2 + 4); });
    K.plane(2.7, .34, K.std('#ffffff', .5, 0, { map: sT2 }), 0, .56, .453, g);
    /* на стойке: монитор, лампа, звонок, дрон на подставке */
    var mo = K.grp(.95, 1.09, -.12, .35); g.add(mo); K.cyl(.1, .12, .02, dark, 0, .01, 0, mo, 16); K.box(.03, .2, .03, dark, 0, .12, -.02, mo); K.rb(.56, .34, .025, .015, dark, 0, .36, 0, mo);
    var mT = X.tex(256, 160, function (x, w, h) { var gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#101630'); gr.addColorStop(1, '#2a1250'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = MC; x.fillRect(16, 18, 90, 8); x.fillStyle = 'rgba(255,255,255,.75)'; for (var q = 0; q < 5; q++) x.fillRect(16, 44 + q * 20, 120 + (q * 37) % 90, 7); x.fillStyle = '#ffd36e'; x.beginPath(); x.arc(206, 110, 26, 0, 7); x.fill(); });
    K.plane(.52, .3, K.pic(mT), 0, .36, -.014, mo).rotation.y = PI;
    K.cyl(.07, .08, .02, brass, -1.35, 1.1, .1, g, 16); K.cyl(.012, .012, .34, brass, -1.35, 1.27, .1, g, 8); K.sph(.07, K.lit('#ffe2b0', 1.8), -1.35, 1.47, .1, g, 12).userData.noShadow = true;
    K.lathe([[0, 0], [.07, 0], [.065, .03], [.03, .055], [0, .06]], brass, -.5, 1.09, .25, g, 16); K.sph(.012, brass, -.5, 1.158, .25, g, 8);
    K.cyl(.09, .11, .03, dark, .1, 1.105, .1, g, 16); K.cyl(.008, .008, .16, steelM, .1, 1.19, .1, g, 6); var q = X.quad(.3, MC); q.position.set(.1, 1.29, .1); q.rotation.set(.12, .6, 0); g.add(q);
    /* кресло администратора */
    var ch = K.grp(.2, 0, -1.15, .25); g.add(ch); var fab = K.std('#2b3a55', .85, 0); K.cyl(.26, .28, .04, dark, 0, .03, 0, ch, 16); K.cyl(.03, .03, .4, steelM, 0, .25, 0, ch, 8); K.rb(.5, .1, .5, .04, fab, 0, .5, 0, ch); K.rb(.5, .62, .09, .04, fab, 0, .86, -.24, ch);
    G.add(g); X.block(RX, RZ, 1.82, .56); X.block(RX + .2, RZ - 1.15, .3, .3);
    ST.rec = { o: g, kind: 'q', at: [RX, RZ + 1.55], look: [RX, 1.1, RZ], q: { card: function () { var S = window.SHKOLA_HOLL, w = null; try { w = S && S.who ? S.who() : null; } catch (e) {}
        if (!S || !S.login) return { sm: 'РЕСЕПШЕН', h: 'Вход и мой прогресс', p: 'Здесь можно войти по своему коду и посмотреть, что уже пройдено.', acts: '<button class="k-b pri" data-a="q:prog">Открыть</button>' };
        /* 26.11: вход по коду теперь есть прямо здесь (раньше была только надпись) */
        return { sm: 'РЕСЕПШЕН', h: w ? 'Привет, ' + String(w.first || 'ученик').replace(/[<>&"]/g, '') + '!' : 'Вход и мой прогресс', p: w ? 'Ты вошёл по коду. Здесь видно, что уже пройдено.' : 'Войди по коду от педагога - прогресс сохранится. Можно и без кода.',
          acts: w ? '<button class="k-b pri" data-a="q:prog">Мой прогресс</button><button class="k-b" data-a="q:code">Мой вход</button>' : '<button class="k-b pri" data-a="q:code">Войти по коду</button><button class="k-b" data-a="q:prog">Мой прогресс</button>' }; },
      act: function (a) { var S = window.SHKOLA_HOLL; if (a === 'code' && S && S.login) S.login(); else if (S && S.progress) S.progress(); } } }; X.CLICK.push(ST.rec);
  })();

  /* ---------- стенд "Мой путь" на стене из реек ---------- */
  (function stand() { var sx = W / 2 - .05, sz = -1.3, g = K.grp(sx, 2.25, sz, -PI / 2), sw = 3.0, sh = 2.4;
    K.rb(sw + .12, sh + .12, .06, .03, dark, 0, 0, .03, g);
    [[sw + .16, .03, 0, sh / 2 + .065], [sw + .16, .03, 0, -sh / 2 - .065], [.03, sh + .16, sw / 2 + .065, 0], [.03, sh + .16, -sw / 2 - .065, 0]].forEach(function (b) { K.box(b[0], b[1], .03, cyanL, b[2], b[3], .05, g).userData.noShadow = true; });
    var bT = X.tex(800, 640, function () {}), bM = K.pic(bT); bM.userData.noDedup = true; var scr = K.plane(sw, sh, bM, 0, 0, .062, g); scr.userData.noMerge = true;
    G.add(g); var hl = G.halo(MC, .22, 4.6, 3.6); hl.position.set(sx - .03, 2.2, sz); hl.rotation.y = -PI / 2; hl.userData.noMirror = true; G.add(hl, { shadow: false, mirror: false });
    ST.board = bT;
    ST.way = { o: g, kind: 'q', at: [W / 2 - 2.9, sz], look: [W / 2, 2.1, sz], q: { card: function () { var d = info(), n = d ? d.mods.length : 0, nx = d && d.next >= 0 ? d.mods[d.next] : null;
        return { sm: 'МОЙ ПУТЬ', h: d ? 'Пройдено этажей: ' + d.done + ' из ' + n : 'Мой путь', p: nx ? 'Дальше - этаж ' + nx.n + ' "' + nx.t + '". Иди к лифту.' : d && d.done >= n && n ? 'Все этажи пройдены. Ты - ас!' : 'Учёба идёт снизу вверх: этаж за этажом.', acts: '<button class="k-b pri" data-a="q:lift">К лифту</button>' }; },
      act: function () { X.go(Lf.click); } } }; X.CLICK.push(ST.way);
    /* консоль под стендом и скамья дальше по стене */
    var cn = K.grp(sx - .28, 0, sz, -PI / 2); K.rb(1.8, .05, .42, .02, stone, 0, .82, 0, cn); [-.8, .8].forEach(function (x) { K.box(.03, .8, .36, brass, x, .4, 0, cn); }); K.box(1.6, .03, .03, brass, 0, .12, 0, cn);
    K.lathe([[0, 0], [.09, 0], [.12, .16], [.07, .3], [.09, .34], [0, .34]], cream, -.5, .845, 0, cn, 16); G.add(cn); X.block(sx - .28, sz, .3, .95);
    var bn = K.grp(W / 2 - .42, 0, 3.4, -PI / 2), fab = K.std('#2b3a55', .85, 0); K.rb(2.4, .16, .56, .06, fab, 0, .42, 0, bn); K.rb(2.4, .5, .12, .05, fab, 0, .72, -.24, bn); [-1.05, 1.05].forEach(function (x) { [-.2, .2].forEach(function (z) { K.cyl(.022, .018, .34, brass, x, .17, z, bn, 8); }); });
    G.add(bn); X.block(W / 2 - .42, 3.4, .36, 1.25);
    /* две картины с трассами над скамьёй */
    [[2.6, 0, '#46206a'], [4.3, 2, '#1e4a6a']].forEach(function (p) { var a = K.grp(W / 2 - .04, 2.25, p[0], -PI / 2); K.rb(1.32, .92, .05, .02, dark, 0, 0, .02, a); K.box(1.36, .96, .02, brass, 0, 0, .005, a);
      var t = X.tex(512, 340, function (x, w, h) { var gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1030'); gr.addColorStop(1, p[2]); x.fillStyle = gr; x.fillRect(0, 0, w, h);
        x.strokeStyle = '#ffffff22'; for (var q = 0; q < 12; q++) { x.beginPath(); x.moveTo(0, h * .72 + q * 9); x.lineTo(w, h * .62 + q * 14); x.stroke(); }
        for (var k = 0; k < 3; k++) { var cx = w * (.22 + k * .28), cy = h * (.58 - k * .06), rr = h * (.18 - k * .03); x.lineWidth = 10 - k * 2; x.strokeStyle = ['#ff7ce0', '#7cf3ff', '#ffd36e'][(k + p[1]) % 3]; x.beginPath(); x.arc(cx, cy, rr, PI, 0); x.lineTo(cx + rr, cy + rr * .9); x.moveTo(cx - rr, cy); x.lineTo(cx - rr, cy + rr * .9); x.stroke(); }
        x.lineWidth = 4; x.strokeStyle = '#ffffffaa'; x.beginPath(); x.moveTo(w * .05, h * .8); x.bezierCurveTo(w * .3, h * .2, w * .6, h * .9, w * .95, h * .3); x.stroke(); });
      K.plane(1.2, .8, K.std('#ffffff', .6, 0, { map: t }), 0, 0, .05, a); K.box(.7, .02, .03, brass, 0, .58, .12, a); K.box(.64, .008, .02, warmL, 0, .568, .12, a).userData.noShadow = true; G.add(a); });
  })();
  function drawBoard() { var d = info(), x = ST.board.userData.x, w = 800, h = 640, n, k;
    var gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0b1026'); gr.addColorStop(1, '#161040'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = MC; x.font = '800 56px ' + DISP; x.fillText('МОЙ ПУТЬ', 44, 62);
    if (!d || !d.mods.length) { ST.board.needsUpdate = true; return; }
    n = d.mods.length; x.font = '700 26px ' + FONT; x.fillStyle = '#a7acd2'; x.textAlign = 'right'; x.fillText('пройдено ' + d.done + ' из ' + n, w - 44, 66);
    var top = 112, rh = Math.min(84, (h - top - 16) / n);
    for (k = 0; k < n; k++) { var m = d.mods[n - 1 - k], y = top + k * rh + rh / 2, done = m.st === 'done', nx = d.next === n - 1 - k, lock = m.st === 'lock';
      if (nx) { x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(28, y - rh / 2 + 4, w - 56, rh - 8); x.fillStyle = m.c; x.fillRect(28, y - rh / 2 + 4, 6, rh - 8); }
      x.beginPath(); x.arc(84, y, rh * .34, 0, 7); if (done) { x.fillStyle = m.c; x.fill(); } else { x.lineWidth = 4; x.strokeStyle = lock ? '#4a5074' : m.c; x.stroke(); }
      x.textAlign = 'center'; x.font = '800 ' + Math.round(rh * .38) + 'px ' + DISP; x.fillStyle = done ? '#0a0c18' : lock ? '#4a5074' : m.c; x.fillText(String(m.n), 84, y + 2);
      x.textAlign = 'left'; x.fillStyle = done || nx ? '#ffffff' : lock ? '#5a6184' : '#c3c9ea'; K.fitText(x, m.t, (nx ? '800' : '600') + ' %px ' + FONT, Math.round(rh * .42), w - 300); x.fillText(m.t, 134, y + 2);
      x.textAlign = 'right'; x.font = '700 ' + Math.round(rh * .3) + 'px ' + FONT; x.fillStyle = done ? m.c : nx ? '#ffffff' : '#7d84a8'; x.fillText(done ? 'пройден' : nx ? 'сюда дальше' : lock ? 'закрыт' : m.p ? m.p + '%' : '', w - 44, y + 2); }
    ST.board.needsUpdate = true; }

  /* ---------- кресла и столик у окна ---------- */
  (function lounge() { var cx = -5.9, cz = -3.7, fab = K.std('#24424c', .85, 0), g = K.grp(cx, 0, cz);
    var rugT = X.tex(256, 256, function (x, w, h) { x.fillStyle = '#2a2336'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(196,154,85,.55)'; x.lineWidth = 4; x.strokeRect(12, 12, w - 24, h - 24); x.strokeStyle = 'rgba(124,243,255,.25)'; x.lineWidth = 2; x.strokeRect(24, 24, w - 48, h - 48); var q = rnd0(3); for (var k = 0; k < 900; k++) { x.fillStyle = 'rgba(255,255,255,' + q() * .05 + ')'; x.fillRect(q() * w, q() * h, 2, 2); } });
    var rug = K.plane(3.0, 3.6, K.std('#ffffff', .95, 0, { map: rugT }), 0, .012, 0, g); rug.rotation.x = -PI / 2; rug.receiveShadow = true;
    function chair(z, ry) { var c = K.grp(0, 0, z, ry); g.add(c); K.rb(.82, .22, .8, .08, fab, 0, .34, 0, c); K.rb(.82, .62, .18, .08, fab, 0, .72, -.33, c); [-1, 1].forEach(function (k) { K.rb(.14, .4, .8, .06, fab, k * .42, .5, 0, c); [-.3, .3].forEach(function (dz) { K.cyl(.02, .016, .24, brass, k * .34, .12, dz, c, 8); }); }); }
    chair(-1.25, .25); chair(1.25, PI - .25);
    K.cyl(.46, .46, .035, stone, .1, .46, 0, g, 28); K.cyl(.03, .03, .44, brass, .1, .23, 0, g, 10); K.cyl(.26, .28, .02, brass, .1, .01, 0, g, 20);
    K.lathe([[0, 0], [.05, 0], [.08, .1], [.04, .2], [.05, .22], [0, .22]], cream, .22, .478, .1, g, 14);
    G.add(g); X.block(cx, cz - 1.25, .46, .46); X.block(cx, cz + 1.25, .46, .46); X.block(cx + .1, cz, .4, .4);
    /* торшер в углу */
    var lm = K.grp(-W / 2 + .9, 0, NZ + .9); K.cyl(.16, .18, .03, brass, 0, .015, 0, lm, 16); K.cyl(.014, .014, 1.6, brass, 0, .82, 0, lm, 8); K.sph(.16, K.lit('#ffe2b0', 1.7), 0, 1.72, 0, lm, 16).userData.noShadow = true; G.add(lm); X.block(-W / 2 + .9, NZ + .9, .2, .2);
  })();

  /* ---------- растения в кадках ---------- */
  (function plants() { var lf = K.std('#2f8a4c', .55, 0, { side: T.DoubleSide }), lf2 = K.std('#41a862', .55, 0, { side: T.DoubleSide }), pot = K.std('#1d1e26', .35, .3), soil = K.std('#3b2a1e', .95, 0);
    var LG = [leafGeo(1.25, 1.05, .42, .1), leafGeo(1.05, .8, .5, .09), leafGeo(.85, 1.25, .3, .075)];
    function palm(x, z, s, n) { var g = K.grp(x, 0, z); g.scale.setScalar(s);
      K.lathe([[0, 0], [.24, 0], [.3, .08], [.33, .56], [.3, .6], [0, .6]], pot, 0, 0, 0, g, 18); K.tor(.315, .016, brass, 0, .575, 0, g, 24).rotation.x = PI / 2; K.cyl(.29, .29, .02, soil, 0, .585, 0, g, 16);
      for (var k = 0; k < n; k++) { var m = new T.Mesh(LG[k % 3], k % 2 ? lf : lf2); m.position.set(0, .58, 0); m.rotation.y = k / n * PI * 2 * 1.618 + r(); var sc = .85 + r() * .4; m.scale.set(sc, sc * (.9 + r() * .3), sc); m.castShadow = true; g.add(m); }
      G.add(g); X.block(x, z, .34 * s, .34 * s); }
    palm(2.75, NZ + .6, 1.0, 13); palm(-2.75, NZ + .6, 1.0, 13); palm(W / 2 - .75, NZ + .75, 1.2, 15); palm(W / 2 - .8, D / 2 - .8, 1.3, 15); palm(-W / 2 + 1.0, D / 2 - .9, 1.15, 14); palm(-2.6, D / 2 - .7, .9, 12);
  })();

  /* ---------- потолок: световые линии поперёк зала и кольцо-люстра с дронами ---------- */
  (function ceiling() { var g = K.grp(0, 0, 0);
    for (var z = -5.5; z <= 5.6; z += 2.2) { K.box(W - 1.2, .02, .09, warmL, 0, H - .012, z, g); K.box(W - 1.2, .035, .025, brass, 0, H - .018, z - .07, g); K.box(W - 1.2, .035, .025, brass, 0, H - .018, z + .07, g); }
    K.noSh(g); g.traverse(function (m) { m.userData.noMirror = true; }); G.add(g, { shadow: false, mirror: false });
    var c = K.grp(0, 0, -.6); K.tor(1.5, .028, warmL, 0, 3.55, 0, c, 56).rotation.x = PI / 2; K.tor(1.54, .02, brass, 0, 3.585, 0, c, 56).rotation.x = PI / 2; K.tor(.85, .022, warmL, 0, 3.3, 0, c, 40).rotation.x = PI / 2;
    for (var k = 0; k < 3; k++) { var a = k / 3 * PI * 2; K.cyl(.006, .006, H - 3.57, steelM, Math.cos(a) * 1.5, (H + 3.57) / 2, Math.sin(a) * 1.5, c, 5); K.cyl(.006, .006, H - 3.32, steelM, Math.cos(a + 1) * .85, (H + 3.32) / 2, Math.sin(a + 1) * .85, c, 5); }
    K.noSh(c); G.add(c, { shadow: false });
    /* три дрона кружат под кольцом */
    var orb = K.grp(0, 3.0, -.6), qs = []; [0, 1, 2].forEach(function (k) { var q = X.quad(.42, CITY[k]); var a = k / 3 * PI * 2; q.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15); q.rotation.y = -a; q.userData.a = a; orb.add(q); qs.push(q); });
    K.noSh(orb); G.add(orb, { shadow: false, live: true });
    X.TICK.push(function (t, dt) { orb.rotation.y = t * .22; qs.forEach(function (q, k) { q.position.y = Math.sin(t * 1.3 + k * 2.1) * .12; q.rotation.z = Math.sin(t * .9 + k) * .08; q.userData.spin(dt * 30); }); });
  })();

  /* ---------- у входа: коврик и стойки-ограждения ---------- */
  (function entry() { var g = K.grp(0, 0, D / 2 - .9);
    var mt = K.plane(3.0, 1.3, K.std('#15161c', .95, 0), 0, .011, 0, g); mt.rotation.x = -PI / 2; mt.receiveShadow = true; K.box(3.1, .012, .04, brass, 0, .006, -.67, g); K.box(3.1, .012, .04, brass, 0, .006, .67, g);
    G.add(g); })();

  /* ---------- кнопка "К лифту" (для тех, кому неудобно идти самому) ---------- */
  var cs = document.createElement('style'); cs.textContent = '#kmn .hl-go{position:absolute;left:50%;top:calc(62px + env(safe-area-inset-top,0px));transform:translate(-50%,-6px);min-height:40px;padding:0 18px;border-radius:99px;border:1px solid rgba(255,211,110,.55);background:rgba(10,14,32,.66);color:#ffd9a0;font:800 14px ' + FONT + ';cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;pointer-events:none;transition:opacity .4s,transform .4s;z-index:3;white-space:nowrap}#kmn .hl-go.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}@media (max-height:480px){#kmn .hl-go{left:calc(50% + 78px);top:calc(14px + env(safe-area-inset-top,0px));min-height:34px;padding:0 14px;font-size:13px;transform:translate(0,-6px)}#kmn .hl-go.on{transform:none}body.sh-holl #kmn .k-hint{bottom:auto;top:calc(58px + env(safe-area-inset-top,0px));font-size:12px}}'; document.head.appendChild(cs);
  goB = document.createElement('button'); goB.type = 'button'; goB.className = 'hl-go'; goB.textContent = 'К лифту ›'; X.root.appendChild(goB);
  goB.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); goB.addEventListener('click', function () { goB.blur(); X.go(Lf.click); });

  /* ---------- что видит shkola.js ---------- */
  HK.toLift = function () { X.go(Lf.click); };
  HK.state = function () { return Lf.st; };
  HK.hold = function (v) { if (Lf.st !== 'menu') X.hold(!!v); };   /* 26.11: пока открыто окно входа - стоим на месте */
  /* меню этажей закрыли без выбора: двери закрываются, можно ходить дальше */
  HK.menuClosed = function () { X.hold(false); if (Lf.st === 'menu' || Lf.st === 'open') { Lf.st = 'closing'; Lf.want = 0; } };
  /* выбран этаж: заходим в кабину, разворачиваемся, двери закрываются - потом cb (школа показывает поездку) */
  HK.board = function (n, cb) { X.hold(false); Lf.st = 'board'; Lf.cb = cb; Lf.to = n; Lf.cab = n; doors(1); Lf.want = 1;
    X.fly(new T.Vector3(0, 0, NZ - 1.25), new T.Vector3(0, 1.5, 2), 1.5, function () { drawDisp(n, n > 1 ? 1 : 0); if (Lf.st === 'board') Lf.want = 0; });
    setTimeout(function () { if (Lf.st === 'board' && Lf.cb) { var f = Lf.cb; Lf.cb = null; Lf.st = 'ride'; f(); } }, 4500); };   /* страховка: если вкладку свернули, поездка всё равно начнётся */
  HK.refresh = function () { drawBoard(); };
  HK.open = function (opt) { opt = opt || {}; hinted = false; tOpen = 0; Lf.cb = null; drawBoard(); lamp(false);
    if (opt.spawn) { Lf.st = 'open'; Lf.want = 1; doors(1); Lf.cab = 1; drawDisp(1, 0); if (opt.menu) { Lf.st = 'menu'; X.hold(true); var S = window.SHKOLA_HOLL; if (S && S.menu) S.menu(true); } }
    else { Lf.st = 'idle'; Lf.want = 0; doors(0); if (Lf.cab < 2) Lf.cab = 2 + Math.floor(Math.random() * 4); drawDisp(Lf.cab, 0);
      setTimeout(function () { if (!hinted && Lf.st === 'idle' && !near) { hinted = true; X.hint(MOB ? 'Нажми на лифт - подойдёшь сам. Потом нажми "Вызвать лифт".' : 'Иди к лифту (W A S D) или щёлкни по нему. Потом нажми "Вызвать лифт" или клавишу E.', 9000); } }, 4200); } };
  HK.close = function () { if (goB) { goB._on = false; goB.classList.remove('on'); } };
  HK.view = function (p, l) { X.place(new T.Vector3(p[0], p[1], p[2]), new T.Vector3(l[0], l[1], l[2])); };   /* для снимков */
  HK.busy = X.anim; HK.atLift = function () { return X.sel() === Lf.click && X.arrived(); };   /* для проверок */
  drawDisp(Lf.cab, 0); doors(0); drawBoard();
  return null;
}

/* ---------- хук помещения и само помещение ---------- */
var HK = { pre: function (cfg) { cfg.okno = { n: [[-1.05, 1.05, 2.55]], w: [[-D / 2 + .25, D / 2 - .25, H - .3]] }; },
  build: function (X) { ST = {}; return build(X); } };
window.KOMNATA_OKNO = window.KOMNATA_OKNO || {}; window.KOMNATA_OKNO.hall = HK;

var TXC = {};
function wallMarble(G) { var t = TXC.m || (TXC.m = G.ctex(SMALL ? 512 : 1024, SMALL ? 512 : 1024, marbleDraw)); t.wrapS = t.wrapT = T.RepeatWrapping; var m = G.std('#ffffff', .34, .02); m.map = t; m.userData.tile = [3.2, 3.2]; return m; }
function wallSlats(G) { var t = TXC.s || (TXC.s = G.ctex(512, 256, slatDraw)); t.wrapS = t.wrapT = T.RepeatWrapping; var m = G.std('#ffffff', .6, .05); m.map = t; m.userData.tile = [1.1, 3.2]; return m; }
var lamps = [], lx, lz2; for (lz2 = -5.5; lz2 <= 5.6; lz2 += 2.2) for (lx = -5; lx <= 5; lx += 5) lamps.push([lx, lz2, .8, 0]);

var room = KOMNATA.make({ mid: 'hall', n: '', size: [W, D, H], color: MC, title: 'Лётная школа', kicker: 'ХОЛЛ', loadSub: 'Холл', style: 'L', styleFix: true, needGX: true, noExit: true, window: false,
  start: [0, D / 2 - 2.6], look: [0, 1.9, NZ],
  lamps: lamps, walls: { n: wallMarble, s: wallMarble, e: wallSlats, w: wallSlats },
  glows: [[-3.55, NZ + .3, WARM, 2.6, .55], [3.55, NZ + .3, WARM, 2.6, .55], [0, NZ + 1.4, WARM, 2.6, .35], [W / 2 - .4, -1.3, MC, 2.6, .4], [-4.3, 1.9, MC, 2.2, .28],
    [-W / 2 + .8, -4.5, '#8a5cff', 3.2, .3], [-W / 2 + .8, 0, '#b05cff', 3.2, .3], [-W / 2 + .8, 4.5, '#8a5cff', 3.2, .3]],
  hud: function () { var S = window.SHKOLA_HOLL, d = null; try { d = S && S.info ? S.info() : null; } catch (e) {} return d ? 'Этажи ' + d.done + ' / ' + d.mods.length : 'Холл'; },
  guideTo: function () { return ST && ST.liftC ? ST.liftC() : null; } });
window.KURS_HOLL = room;   /* не в KURS_KOMNATY: там только комнаты модулей */
})();
