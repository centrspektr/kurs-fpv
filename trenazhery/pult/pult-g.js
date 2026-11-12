/* pult-g.js - новая графика (11.11.2026, стиль А "тёмная студия", нужен ../studiya.js): тот же тренажёр, перерисованы пульт и сцена.
   pult.js - тренажёр "Пульт RadioMaster Pocket" (модуль 4, по фото владельца 09.11.2026).
   3D-пульт на столе диспетчерской. Три части:
     1) Знакомство - нажимаешь на светящиеся точки, камера подлетает, рассказ о кнопке (стики, триммеры, экран, колесо, кнопки SYS/MDL/TELE/RTN/PAGE, питание, тумблеры, антенна, USB-C).
     2) Стики - двигаешь стики на экране, голограмма дрона над пультом показывает, что он делает (Mode 2).
     3) Тумблеры и Betaflight - взвод (ARM), режимы полёта, и как назначить любую кнопку на любую функцию в Betaflight (вкладка Modes).
   Детский вариант (window.PULT_KID) - короче и проще слова. Когда всё пройдено: window.SBG.st().stage === 'done' (курс так узнаёт, что тренажёр пройден).
   Кнопка "←" = history.back() (тренажёр открывается в окне поверх курса). */
(function () {
'use strict';
var T = THREE, KID = !!window.PULT_KID;
var A = '#7cf3ff', Y = '#ffd36e', GR = '#9dff7c', PK = '#ff7ce0', RD = '#ff5d6c';
var CFG = window.KURSY || {}, KEY = (CFG.store || 'kursy') + '_pult';
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ---------- сцена ---------- */
var cv = document.getElementById('c');
var ren = new T.WebGLRenderer({ canvas: cv, antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.0;
var sc = new T.Scene();
var pm = new T.PMREMGenerator(ren), ENV = pm.fromScene(new T.RoomEnvironment(), .04).texture; /* envMap ставим в каждый материал: в r128 сила envMapIntensity работает только так */
var cam = new T.PerspectiveCamera(42, 1, .05, 100);
function resize() { var w = innerWidth, h = innerHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 58 : 40; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
var STU = STUDIYA(ren, sc, {}); /* общая тёмная студия: фон, пол, свет, тени */
function std(c, r, m, o) { var x = new T.MeshStandardMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r == null ? .5 : r, metalness: m || 0, envMap: ENV, envMapIntensity: .35 }); if (o) Object.assign(x, o); return x; }
function neon(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.5), toneMapped: false }); }
function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; t.redraw = function (d) { (d || draw)(x, w, h); t.needsUpdate = true; }; return t; }
function txt(c, s, x, y, sz, col, al, wt) { c.font = (wt || 800) + ' ' + sz + 'px Manrope, "Segoe UI", sans-serif'; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }

/* ---------- пульт RadioMaster Pocket (по фото владельца: дымчатый корпус, видна плата) ---------- */
var P = new T.Group(); P.position.set(0, .5, 0); P.rotation.x = -1.05; sc.add(P);   /* стоит на ножке, наклонён к нам */
var smoke = new T.MeshPhysicalMaterial({ color: new T.Color('#25211d').convertSRGBToLinear(), roughness: .12, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, transparent: true, opacity: .58, envMap: ENV, envMapIntensity: .55, depthWrite: false });
var black = std('#0b0c10', .42, .1, { envMapIntensity: .6 }), metal = std('#b4bac6', .3, 1, { envMapIntensity: 1 }), dark = std('#15161b', .6, .05), gloss = new T.MeshPhysicalMaterial({ color: new T.Color('#08090c').convertSRGBToLinear(), roughness: .32, clearcoat: .6, clearcoatRoughness: .25, envMap: ENV, envMapIntensity: .3 });
/* корпус: плечи сверху, две ручки снизу, между ними выемка */
var sh = new T.Shape(), W = .86, Hh = .68; /* по фото: корпус почти квадратный, плечи сверху, ручки снизу, снизу посередине выемка */
sh.moveTo(-.62, .68); sh.lineTo(.62, .68); sh.bezierCurveTo(.8, .68, .88, .6, .89, .42); sh.bezierCurveTo(.92, .15, .96, -.2, .95, -.5); sh.bezierCurveTo(.94, -.72, .82, -.82, .62, -.8); sh.bezierCurveTo(.4, -.78, .25, -.7, 0, -.7);
sh.bezierCurveTo(-.25, -.7, -.4, -.78, -.62, -.8); sh.bezierCurveTo(-.82, -.82, -.94, -.72, -.95, -.5); sh.bezierCurveTo(-.96, -.2, -.92, .15, -.89, .42); sh.bezierCurveTo(-.88, .6, -.8, .68, -.62, .68);
var bodyG = new T.ExtrudeGeometry(sh, { depth: .18, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 10, curveSegments: 40 }); bodyG.translate(0, 0, -.09);
var body = new T.Mesh(bodyG, smoke); body.renderOrder = 2; P.add(body);
var backG = new T.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false, curveSegments: 40 }); backG.translate(0, 0, -.1); backG.scale(.985, .985, 1);
P.add(new T.Mesh(backG, std('#0a0b0e', .7, .1)));
/* плата внутри - видна сквозь дымчатый корпус: дорожки, чипы, два аккумулятора */
var pcbT = tex(1024, 832, function (c, w, h) { c.fillStyle = '#191715'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#34302b'; c.lineWidth = 3; for (var i = 0; i < 110; i++) { var x = Math.random() * w, y = Math.random() * h, l = 40 + Math.random() * 160; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.lineTo(x + l + 20, y + 20 * (i % 2 ? 1 : -1)); c.stroke(); }
  c.fillStyle = '#8f7a45'; for (var k = 0; k < 140; k++) c.fillRect(Math.random() * w, Math.random() * h, 4, 4);
  c.fillStyle = '#4a4640'; for (var d = 0; d < 26; d++) { c.beginPath(); c.arc(60 + Math.random() * (w - 120), 60 + Math.random() * (h - 120), 7, 0, 7); c.fill(); }
  [[430, 520, 120, 90], [250, 600, 70, 70], [700, 560, 90, 60], [470, 60, 90, 50], [110, 330, 60, 40], [850, 330, 60, 40]].forEach(function (q) { c.fillStyle = '#0c0c0d'; c.fillRect(q[0], q[1], q[2], q[3]); c.fillStyle = '#77736c'; for (var p = 0; p < q[2]; p += 10) { c.fillRect(q[0] + p, q[1] - 5, 5, 5); c.fillRect(q[0] + p, q[1] + q[3], 5, 5); } });
  /* цветные провода справа, как на фото */
  ['#e07a1e', '#e9c12a', '#b5441f'].forEach(function (col, n) { c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(930 + n * 14, 250); c.bezierCurveTo(985 + n * 8, 330, 900 + n * 16, 430, 950 + n * 10, 560); c.stroke(); }); });
var pcb = new T.Mesh(new T.PlaneGeometry(1.66, 1.36), new T.MeshStandardMaterial({ map: pcbT, roughness: .75, metalness: 0, envMap: ENV, envMapIntensity: .1 })); pcb.position.set(0, -.06, -.04); P.add(pcb);
var leg = new T.Mesh(STUDIYA.rbox(.5, .07, .52, .03), dark); leg.position.set(0, .2, -.39); P.add(leg);
var FZ = .145, SX = .55, SY = .13; /* лицевая сторона; где стоят стики */
function onFace(m, x, y, z) { m.position.set(x, y, FZ + (z || 0)); P.add(m); return m; }
/* стики: чёрный колодец, купол шарнира, металлическая ручка с насечкой */
var sticks = [], capG = (function () { var p = [[0, 0], [.036, 0], [.046, .008], [.046, .04], [.056, .05], [.056, .066], [.046, .074], [0, .07]].map(function (q) { return new T.Vector2(q[0], q[1]); }); var g = new T.LatheGeometry(p, 40); g.rotateX(Math.PI / 2); return g; })();
[-SX, SX].forEach(function (x, i) {
  onFace(new T.Mesh(new T.CylinderGeometry(.24, .24, .02, 64), gloss), x, SY, .0).rotation.x = Math.PI / 2;
  onFace(new T.Mesh(new T.TorusGeometry(.24, .02, 12, 72), gloss), x, SY, .012);
  onFace(new T.Mesh(STUDIYA.rbox(.27, .27, .02, .04), dark), x, SY, .016);
  var piv = new T.Group(); piv.position.set(x, SY, FZ + .01); P.add(piv);
  var dome = new T.Mesh(new T.SphereGeometry(.085, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), gloss); dome.rotation.x = Math.PI / 2; dome.scale.z = .7; dome.position.z = .012; piv.add(dome);
  var shaft = new T.Mesh(new T.CylinderGeometry(.014, .018, .17, 20), metal); shaft.rotation.x = Math.PI / 2; shaft.position.z = .12; piv.add(shaft);
  var cap = new T.Mesh(capG, metal); cap.position.z = .19; piv.add(cap);
  for (var r = 0; r < 14; r++) { var sp = new T.Mesh(new T.ConeGeometry(.008, .018, 8), metal); var aa = r / 14 * Math.PI * 2; sp.rotation.x = Math.PI / 2; sp.position.set(Math.cos(aa) * .044, Math.sin(aa) * .044, .268); piv.add(sp); }
  sticks.push({ piv: piv, x: 0, y: i === 0 ? -1 : 0, tx: 0, ty: i === 0 ? -1 : 0 });
});
/* экран (EdgeTX): рамка, подсветка, стекло с бликом */
var lcdT = tex(512, 384, function () {});
onFace(new T.Mesh(STUDIYA.rbox(.5, .39, .03, .03), gloss), 0, .2, 0);
var lcd = onFace(new T.Mesh(new T.PlaneGeometry(.44, .33), new T.MeshBasicMaterial({ map: lcdT, toneMapped: false })), 0, .2, .017);
onFace(new T.Mesh(new T.PlaneGeometry(.44, .32), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, clearcoat: 1, transparent: true, opacity: .1, envMap: ENV, envMapIntensity: 1.5, depthWrite: false })), 0, .2, .019);
var lcdGlow = onFace(STUDIYA.glow('#bfe4ff', .9, 0), 0, .2, .05);
var pkT = tex(256, 64, function (c, w, h) { c.clearRect(0, 0, w, h); c.font = 'italic 900 42px Manrope, sans-serif'; c.fillStyle = '#b9b4ab'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('POCKET', w / 2, h / 2 + 2); });
onFace(new T.Mesh(new T.PlaneGeometry(.22, .055), new T.MeshBasicMaterial({ map: pkT, transparent: true, opacity: .8 })), 0, -.045, .004);
/* маленький ползунок под надписью */
onFace(new T.Mesh(STUDIYA.rbox(.16, .05, .02, .02), gloss), 0, -.115, .004); onFace(new T.Mesh(STUDIYA.rbox(.07, .034, .03, .012), black), .02, -.115, .012);
/* колесо прокрутки */
onFace(new T.Mesh(STUDIYA.rbox(.13, .34, .016, .05), gloss), .68, -.45, .0);
var roller = new T.Mesh(new T.CylinderGeometry(.045, .045, .26, 32), std('#1c1d22', .35, .6, { envMapIntensity: .9 })); onFace(roller, .68, -.45, .03);
for (var rr = 0; rr < 16; rr++) { var gr = new T.Mesh(new T.BoxGeometry(.008, .2, .008), black), ga = rr / 16 * Math.PI * 2; gr.position.set(Math.cos(ga) * .046, 0, Math.sin(ga) * .046); gr.rotation.y = -ga; roller.add(gr); }
[-.14, .14].forEach(function (y) { var e = new T.Mesh(new T.CylinderGeometry(.03, .03, .03, 20), metal); e.position.y = y; roller.add(e); });
/* триммеры-крестики и кнопка питания */
var trims = [];
[-.3, .3].forEach(function (x) { var g = new T.Group(); g.position.set(x, -.21, FZ + .012); P.add(g);
  g.add(new T.Mesh(new T.CylinderGeometry(.078, .078, .02, 40), gloss)).rotation.x = Math.PI / 2;
  var b1 = new T.Mesh(STUDIYA.rbox(.1, .028, .03, .012), dark); b1.position.z = .015; g.add(b1); var b2 = new T.Mesh(STUDIYA.rbox(.028, .1, .03, .012), dark); b2.position.z = .015; g.add(b2); trims.push(g); });
var pwT = tex(128, 64, function (c, w, h) { c.clearRect(0, 0, w, h); c.strokeStyle = '#c9ced8'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.arc(w / 2, h / 2 + 2, 15, -1.0, Math.PI + 1.0); c.stroke(); c.beginPath(); c.moveTo(w / 2, h / 2 - 18); c.lineTo(w / 2, h / 2 - 2); c.stroke(); });
var power = onFace(new T.Mesh(STUDIYA.rbox(.2, .1, .03, .04), gloss), 0, -.21, .015);
var pwL = new T.Mesh(new T.PlaneGeometry(.12, .06), new T.MeshBasicMaterial({ map: pwT, transparent: true })); pwL.position.z = .016; power.add(pwL);
/* зелёная рамка вокруг кнопки питания - горит, когда пульт включён */
var pwrRing = onFace(new T.Mesh(STUDIYA.rbox(.235, .135, .012, .055), neon('#2a3a2a', 1)), 0, -.21, .004);
var pwrGlow = onFace(STUDIYA.glow('#39ff6a', .4, 0), 0, -.21, .04);
/* кнопки слева: RTN, PAGE>, PAGE<, TELE; круглые SYS и MDL */
function lblTex(s) { return tex(128, 48, function (c, w, h) { c.clearRect(0, 0, w, h); txt(c, s, w / 2, h / 2 + 1, 26, '#a9aebb', 'center', 800); }); }
var btns = {};
['RTN', 'PAGE>', 'PAGE<', 'TELE'].forEach(function (s, i) { var m = onFace(new T.Mesh(STUDIYA.rbox(.135, .06, .034, .02), black), -.68, -.26 - i * .105, .012);
  var l = new T.Mesh(new T.PlaneGeometry(.12, .045), new T.MeshBasicMaterial({ map: lblTex(s), transparent: true })); l.position.z = .0175; m.add(l); btns[s] = m; });
function roundBtn(s, x, y) { var g = new T.Group(); g.position.set(x, y, FZ + .012); P.add(g); var m = new T.Mesh(new T.CylinderGeometry(.068, .073, .03, 40), black); m.rotation.x = Math.PI / 2; g.add(m);
  var l = new T.Mesh(new T.PlaneGeometry(.08, .03), new T.MeshBasicMaterial({ map: lblTex(s), transparent: true })); l.position.z = .017; g.add(l); btns[s] = g; return g; }
roundBtn('SYS', -.43, -.47); roundBtn('MDL', .43, -.47);
/* динамик */
var spk = onFace(new T.Mesh(new T.CylinderGeometry(.16, .16, .015, 8), std('#3a3631', .5, 0, { transparent: true, opacity: .75 })), 0, -.5, .005); spk.rotation.x = Math.PI / 2; spk.rotation.y = Math.PI / 8;
for (var hy = -2; hy <= 2; hy++) for (var hx = -3; hx <= 3; hx++) if (Math.abs(hx) + Math.abs(hy) * 1.2 < 4.4) onFace(new T.Mesh(new T.CircleGeometry(.011, 12), neon('#000', 1)), hx * .038 + (hy % 2 ? .019 : 0), -.5 + hy * .045, .014);
/* гнездо снизу посередине */
onFace(new T.Mesh(STUDIYA.rbox(.36, .05, .02, .02), gloss), 0, -.645, .0);
/* верхняя кромка: тумблеры SA SB (слева), SC SD (справа), USB-C, складная антенна */
var TOPY = Hh + .03, sw = {};
function toggle(name, x, pos3) { var g = new T.Group(); g.position.set(x, TOPY, .0); P.add(g);
  var base = new T.Mesh(STUDIYA.rbox(.09, .05, .12, .015), black); g.add(base);
  var lev = new T.Group(); lev.position.y = .02; g.add(lev); var l = new T.Mesh(new T.CylinderGeometry(.014, .018, .14, 12), metal); l.position.y = .07; lev.add(l);
  var tip = new T.Mesh(new T.SphereGeometry(.022, 12, 10), metal); tip.position.y = .14; lev.add(tip);
  sw[name] = { g: g, lev: lev, pos: 0, n: pos3 ? 3 : 2 }; setSw(name, 0); return g; }
function setSw(name, p) { var s = sw[name]; s.pos = p; var ang = s.n === 3 ? [-.5, 0, .5][p] : [-.5, .5][p]; s.lev.rotation.x = ang; }
toggle('SA', -.66, false); toggle('SB', -.46, true); toggle('SC', .46, true); toggle('SD', .66, false);
['SA', 'SB', 'SC', 'SD'].forEach(function (n) { var lt = tex(128, 64, function (c, w, h) { txt(c, n, w / 2, h / 2, 46, '#e8f6ff', 'center', 900); }); var sp = new T.Sprite(new T.SpriteMaterial({ map: lt, transparent: true, depthTest: false })); sp.scale.set(.12, .06, 1); sp.position.set(sw[n].g.position.x, TOPY + .02, .14); sp.renderOrder = 9; P.add(sp); });
var usb = new T.Mesh(new T.BoxGeometry(.09, .03, .035), std('#050505', .4)); usb.position.set(-.26, TOPY - .005, .03); P.add(usb);
var ant = new T.Group(); ant.position.set(0, TOPY + .02, -.06); P.add(ant);
var hinge = new T.Mesh(STUDIYA.rbox(.3, .08, .08, .02), black); ant.add(hinge); var antArm = new T.Group(); ant.add(antArm);
var stemSh = new T.Shape(); stemSh.moveTo(-.13, 0); stemSh.lineTo(.13, 0); stemSh.bezierCurveTo(.1, .1, .09, .18, .1, .25); stemSh.lineTo(-.1, .25); stemSh.bezierCurveTo(-.09, .18, -.1, .1, -.13, 0);
var stem = new T.Mesh(new T.ExtrudeGeometry(stemSh, { depth: .03, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2 }), black); stem.position.set(0, .02, -.025); antArm.add(stem);
var bar = new T.Mesh(STUDIYA.rbox(1.16, .085, .06, .04), black); bar.position.y = .3; antArm.add(bar);
antArm.rotation.x = -1.35; /* сложена */
/* выпуклая надпись RADIOMASTER сверху, как на фото */
var rmT = tex(1024, 128, function (c, w, h) { c.clearRect(0, 0, w, h); c.font = 'italic 900 104px Manrope, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillText('RADIOMASTER', w / 2 + 4, h / 2 + 9); c.fillStyle = '#a8a49c'; c.fillText('RADIOMASTER', w / 2, h / 2 + 4); });
var rmV = new T.Mesh(new T.PlaneGeometry(1.0, .125), new T.MeshBasicMaterial({ map: rmT, transparent: true, depthWrite: false })); rmV.position.set(0, .51, FZ + .004); rmV.renderOrder = 3; P.add(rmV);

/* экран EdgeTX: рисуем по состоянию */
var ST = { on: false, armed: false, mode: 'ANGLE', page: 0, msg: '' };
function drawLCD() { pwrRing.material.color.set(ST.on ? '#39ff6a' : '#1a2a1a').multiplyScalar(ST.on ? 1.6 : 1); pwrGlow.material.opacity = ST.on ? .7 : 0; lcdGlow.material.opacity = ST.on ? .16 : 0; lcdT.redraw(function (c, w, h) { var bg = ST.on ? '#d9e8ee' : '#93a4aa'; c.fillStyle = bg; c.fillRect(0, 0, w, h); if (!ST.on) return;
  c.fillStyle = '#10202e'; c.font = '800 30px ui-monospace, Menlo, monospace'; c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillText('Mobula7', 16, 12); c.textAlign = 'right'; c.fillText('7.6V', w - 16, 12); c.fillRect(0, 52, w, 3);
  c.textAlign = 'left'; c.font = '900 50px ui-monospace, Menlo, monospace'; c.fillText(ST.armed ? 'ARMED' : 'DISARM', 16, 74);
  c.font = '800 34px ui-monospace, Menlo, monospace'; c.fillText(ST.mode, 16, 140); c.fillText('00:' + (ST.armed ? '12' : '00'), w - 150, 140);
  for (var i = 0; i < 4; i++) { var v = i === 0 ? sticks[0].y : i === 1 ? sticks[0].x : i === 2 ? sticks[1].y : sticks[1].x; c.fillStyle = '#10202e';
    c.fillRect(16, 200 + i * 42, w - 32, 4); c.fillRect(16 + (v + 1) / 2 * (w - 40), 188 + i * 42, 10, 28); c.font = '700 22px ui-monospace, Menlo, monospace'; c.fillText(['THR', 'RUD', 'ELE', 'AIL'][i], w - 70, 172 + i * 42); }
  if (ST.msg) { c.fillStyle = '#10202e'; c.fillRect(40, 140, w - 80, 80); c.fillStyle = bg; c.font = '900 40px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.fillText(ST.msg, w / 2, 160); } }); }
drawLCD();

STUDIYA.shadows(P); body.castShadow = true;
/* ---------- дрон за пультом: настоящая модель (вуп), отвечает на стики ---------- */
var D = new T.Group(); D.position.set(0, .05, -1.6); sc.add(D); D.visible = false;
var props = [], discs = [], rpm = 0;
(function () { var M = new T.Group(); M.scale.setScalar(1.45); M.position.y = .155; D.add(M);
  /* общая модель Mobula 7 по фото (../mobula-model.js) */
  var MB = MOBULA({ env: ENV }); M.add(MB.g);
  MB.props.forEach(function (pr, i) { props.push(pr);
    /* размытый круг: чем быстрее мотор, тем заметнее */
    var dk = new T.Mesh(new T.CircleGeometry(.235, 40), new T.MeshBasicMaterial({ color: new T.Color(i < 2 ? A : '#ffffff'), transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })); dk.rotation.x = -Math.PI / 2; dk.position.y = MB.propY + .004; pr.parent.add(dk); discs.push(dk); });
  /* два ярких огонька спереди, сзади красный - чтобы было видно, где перёд */
  [-.08, .08].forEach(function (x) { var l = new T.Mesh(new T.SphereGeometry(.014, 12, 8), neon(A, 1.8)); l.position.set(x, .03, -.2); M.add(l); var gw = STUDIYA.glow(A, .16, .7); gw.position.copy(l.position); M.add(gw); });
  var rl = new T.Mesh(new T.SphereGeometry(.014, 12, 8), neon(RD, 1.8)); rl.position.set(0, .05, .17); M.add(rl); var rg = STUDIYA.glow(RD, .16, .7); rg.position.copy(rl.position); M.add(rg);
  STUDIYA.shadows(M); })();
var pad = new T.Mesh(new T.RingGeometry(.86, .885, 64), neon(A, 1)); pad.rotation.x = -Math.PI / 2; pad.position.set(0, .012, -1.6); sc.add(pad); pad.visible = false;
/* подиум за пультом: дрон стоит выше пульта, его хорошо видно (в части "Стики") */
var beam = new T.Group(); sc.add(beam); beam.visible = false; var GY = .9, GZ = -1.9;
(function () { var pd = new T.Mesh(new T.LatheGeometry([[0, 0], [1.02, 0], [1.04, .03], [.98, GY - .04], [.94, GY], [0, GY]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 80), std('#12101a', .38, .5, { envMapIntensity: .5 })); pd.castShadow = pd.receiveShadow = true; beam.add(pd);
  var tp = new T.Mesh(new T.CylinderGeometry(.93, .93, .008, 64), std('#0d0b14', .97, 0, { envMapIntensity: .04 })); tp.position.y = GY + .002; tp.receiveShadow = true; beam.add(tp);
  var rg = new T.Mesh(new T.TorusGeometry(.95, .009, 8, 96), neon(A, 1.2)); rg.rotation.x = Math.PI / 2; rg.position.y = GY; beam.add(rg); beam.position.z = GZ; beam.scale.set(1.3, 1, 1.3); })();
/* кольца-подсказки вокруг стиков и невидимые зоны захвата */
var grabZ = [], grabRing = [];
[-SX, SX].forEach(function (x, i) { var z = new T.Mesh(new T.SphereGeometry(.26, 12, 8), new T.MeshBasicMaterial({ visible: false })); z.position.set(x, SY, FZ + .12); P.add(z); z.userData.stick = i; grabZ.push(z);
  var r = new T.Mesh(new T.TorusGeometry(.245, .008, 8, 64), neon(i ? PK : A, 1.5)); r.position.set(x, .2, FZ + .03); P.add(r); r.visible = false; grabRing.push(r); });
/* звук моторов: тихий гул, выше газ - выше тон (слушается кнопки звука и громкости) */
var AU = null;
function motorSnd() { if (AU || !(window.AudioContext || window.webkitAudioContext)) return; try { var ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o.start(); o2.start(); AU = { ac: ac, o: o, o2: o2, g: g }; } catch (e) {} }
var DS = { h: 0, yaw: 0, px: 0, pz: 0, tiltX: 0, tiltZ: 0 };

/* ---------- камера: облёт пальцем и подлёт к деталям ---------- */
function RR(r) { return innerWidth < innerHeight ? r * 1.55 : r; } /* на телефоне стоя камера дальше, чтобы пульт влез по ширине */
var orb = { th: 0, ph: .5, r: RR(3.35), tgt: new T.Vector3(0, .78, 0) }, fly = null;
function camPose() { var p = new T.Vector3(orb.tgt.x + orb.r * Math.sin(orb.th) * Math.cos(orb.ph), orb.tgt.y + orb.r * Math.sin(orb.ph), orb.tgt.z + orb.r * Math.cos(orb.th) * Math.cos(orb.ph)); return p; }
function goCam(th, ph, r, tgt, d) { fly = { a: { th: orb.th, ph: orb.ph, r: orb.r, t: orb.tgt.clone() }, b: { th: th, ph: ph, r: r, t: tgt.clone() }, k: 0, d: d || 1 }; }
var down = null, grabs = {};
function stickPx(i) { var a = new T.Vector3(), b = new T.Vector3(); grabZ[i].getWorldPosition(a); b.copy(a); a.project(cam); b.x += .2; b.project(cam); return Math.max(34, Math.abs(b.x - a.x) * innerWidth / 2 * 1.1); } /* сколько пикселей - полный ход стика */
function grabAt(e) { if (MODE !== 'sticks') return null; var m = new T.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), rc = new T.Raycaster(); rc.setFromCamera(m, cam); var h = rc.intersectObjects(grabZ)[0]; return h ? h.object.userData.stick : null; }
cv.addEventListener('pointerdown', function (e) { var gi = grabAt(e); if (gi != null) { motorSnd(); grabs[e.pointerId] = { i: gi, x: e.clientX, y: e.clientY, sx: sticks[gi].tx, sy: sticks[gi].ty, k: stickPx(gi) }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} cv.style.cursor = 'grabbing'; return; }
  down = { x: e.clientX, y: e.clientY, th: orb.th, ph: orb.ph, m: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
cv.addEventListener('pointermove', function (e) { var gr = grabs[e.pointerId]; if (gr) { var st = sticks[gr.i]; st.tx = Math.max(-1, Math.min(1, gr.sx + (e.clientX - gr.x) / gr.k)); st.ty = Math.max(-1, Math.min(1, gr.sy - (e.clientY - gr.y) / gr.k)); return; }
  if (MODE === 'sticks' && !down) cv.style.cursor = grabAt(e) != null ? 'grab' : '';
  if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 6) down.m = true;
  if (down.m && !fly) { orb.th = Math.max(-1.3, Math.min(1.3, down.th - dx * .006)); orb.ph = Math.max(.08, Math.min(1.25, down.ph + dy * .005)); } });
function dropStick(e) { var gr = grabs[e.pointerId]; if (!gr) return false; delete grabs[e.pointerId]; sticks[gr.i].tx = 0; if (gr.i === 1) sticks[gr.i].ty = 0; cv.style.cursor = ''; return true; } /* газ (левый, вверх-вниз) остаётся где оставили, остальное пружинит в центр */
cv.addEventListener('pointercancel', dropStick);
cv.addEventListener('pointerup', function (e) { if (dropStick(e)) return; var d = down; down = null; if (d && !d.m) tap(e.clientX, e.clientY); });
cv.addEventListener('wheel', function (e) { orb.r = Math.max(1.0, Math.min(10, orb.r + e.deltaY * .002)); }, { passive: true });

/* ---------- точки-подсказки ---------- */
var HS = KID ? [
  { id: 'lst', p: [-.55, .13, .25], h: 'Левый стик', t: 'Вверх-вниз - <b>газ</b>: дрон поднимается и опускается. Влево-вправо - дрон <b>поворачивается</b> на месте. Газ не возвращается в центр сам.' },
  { id: 'rst', p: [.55, .13, .25], h: 'Правый стик', t: 'Вперёд-назад - дрон <b>летит вперёд или назад</b>. Влево-вправо - <b>наклоняется вбок</b> и летит туда. Отпустил - стик сам встаёт в центр.' },
  { id: 'lcd', p: [0, .2, .05], h: 'Экран', t: 'Показывает, какой дрон выбран, заряд пульта, таймер и взведён ли дрон.' },
  { id: 'pwr', p: [0, -.21, .06], h: 'Кнопка питания', t: '<b>Удержи</b> - пульт включается или выключается. Сначала включаем пульт, потом дрон. Выключаем наоборот.' },
  { id: 'sw', p: [-.56, .72, .1], h: 'Тумблеры SA, SB, SC, SD', t: 'Четыре тумблера сверху. Одним <b>взводим</b> дрон (моторы готовы крутиться), другим меняем режим полёта.' },
  { id: 'ant', p: [0, .76, -.05], h: 'Антенна', t: 'Складная антенна. Перед полётом раскладываем - так связь с дроном лучше.' },
  { id: 'trim', p: [.3, -.21, .06], h: 'Триммеры', t: 'Маленькие крестики. На FPV-дронах их не трогаем: если трогал - покажи тренеру.' },
  { id: 'menu', p: [-.6, -.42, .06], h: 'Кнопки меню', t: 'SYS, MDL, TELE, RTN, PAGE и колесо - для настройки пульта. Ими занимается тренер, в полёте не нужны.' }
] : [
  { id: 'lst', p: [-.55, .13, .25], h: 'Левый стик (Mode 2)', t: 'Вверх-вниз - <b>газ</b> (throttle): тяга всех моторов. Не пружинит, остаётся где оставил. Влево-вправо - <b>рыскание</b> (yaw): поворот вокруг вертикали.' },
  { id: 'rst', p: [.55, .13, .25], h: 'Правый стик', t: 'Вперёд-назад - <b>тангаж</b> (pitch): наклон носом вниз и полёт вперёд. Влево-вправо - <b>крен</b> (roll). Пружинит в центр. Стики на холловских датчиках - не изнашиваются.' },
  { id: 'trim', p: [-.3, -.21, .06], h: 'Триммеры (крестики)', t: 'Сдвигают центр стиков. На FPV-дронах держим в нуле: центр и подстройку делает полётный контроллер (Betaflight). Сбитые триммеры = дрон "тянет".' },
  { id: 'lcd', p: [0, .2, .05], h: 'Экран EdgeTX', t: 'Пульт работает на прошивке EdgeTX. На главном экране: модель, напряжение АКБ пульта, таймеры, положения стиков и триммеров.' },
  { id: 'roll', p: [.68, -.45, .1], h: 'Колесо прокрутки', t: 'Крутим - листаем меню и меняем значения. <b>Нажатие</b> колеса - ввод (ENTER).' },
  { id: 'pwr', p: [0, -.21, .06], h: 'Питание', t: '<b>Удержать</b> - включить или выключить. Порядок: пульт → дрон, выключение: дрон → пульт. Иначе дрон может остаться без сигнала.' },
  { id: 'menu', p: [-.68, -.37, .06], h: 'RTN, PAGE, TELE', t: 'RTN - назад. PAGE &lt; &gt; - листать страницы. TELE - телеметрия: что дрон шлёт обратно (сигнал RSSI/LQ, напряжение).' },
  { id: 'sys', p: [-.43, -.47, .06], h: 'SYS и MDL', t: 'SYS - системное меню пульта (звук, яркость, скрипт ELRS для настройки связи). MDL - модели: у каждого дрона своя модель с миксами и тумблерами.' },
  { id: 'sw', p: [-.56, .72, .1], h: 'Тумблеры SA, SB, SC, SD', t: 'SA и SD - на 2 положения, SB и SC - на 3. Каждый тумблер пульт передаёт на дрон отдельным каналом AUX. Что он делает - решаем мы (дальше покажу).' },
  { id: 'ant', p: [0, .76, -.05], h: 'Антенна ELRS', t: 'Встроенный передатчик ExpressLRS 2,4 ГГц. Антенну раскладываем и не направляем кончиком на дрон: сильнее всего сигнал идёт вбок от антенны.' },
  { id: 'usb', p: [-.26, .72, .08], h: 'USB-C', t: 'Зарядка аккумуляторов пульта и подключение к компьютеру: пульт становится джойстиком для симулятора, через него же обновляют прошивку.' }
];
var hsM = HS.map(function (h) { var s = new T.Sprite(new T.SpriteMaterial({ map: dotT(Y), depthTest: false, toneMapped: false })); s.scale.setScalar(.09); s.position.fromArray(h.p); P.add(s); s.userData.hs = h; s.renderOrder = 10; return s; });
function dotT(col) { return tex(128, 128, function (c, w, h) { var g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, '#fff'); g.addColorStop(.25, col); g.addColorStop(.6, col + '55'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(0, 0, w, h); }); }
var seen = {};
var ray = new T.Raycaster(), v2 = new T.Vector2();
function tap(x, y) { if (MODE !== 'learn') return; v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, cam);
  var hit = ray.intersectObjects(hsM.filter(function (s) { return s.visible; }))[0]; if (hit) showHS(hit.object.userData.hs); }
function showHS(h) { seen[h.id] = 1; var s = hsM.find(function (m) { return m.userData.hs === h; }); s.material.map = dotT(GR); s.material.needsUpdate = true;
  var wp = new T.Vector3().fromArray(h.p); P.localToWorld(wp);
  goCam(Math.atan2(wp.x * .6, 1) * .6, .55, 1.35, wp, .9);
  var n = Object.keys(seen).length;
  bubble('<span class="chip">' + n + ' ИЗ ' + HS.length + '</span><br><b>' + h.h + '.</b> ' + h.t, '');
  if (h.id === 'pwr' && !ST.on) { ST.on = true; ST.msg = 'HELLO'; drawLCD(); setTimeout(function () { ST.msg = ''; drawLCD(); }, 1200); }
  if (h.id === 'ant') antOpen = true;
  if (h.id === 'sw') { setSw('SB', 1); setTimeout(function () { setSw('SB', 0); }, 700); }
  say(h.h + '. ' + h.t.replace(/<[^>]+>/g, ''));
  actions([{ t: 'Весь пульт', f: function () { goCam(0, .42, RR(3.2), new T.Vector3(0, .62, 0)); } }].concat(n >= HS.length ? [{ t: 'Дальше: стики →', cls: 'pri', f: partSticks }] : []));
  progress(); }
var antOpen = false;

/* ---------- интерфейс ---------- */
var ui = document.getElementById('ui');
function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
var bub = el('div', 'bub glass'); ui.appendChild(bub);
var bar = el('div', 'acts'); ui.appendChild(bar);
var bars = el('div', 'bars'); ui.appendChild(bars);
function bubble(h, cls) { bub.className = 'bub glass' + (cls ? ' ' + cls : ''); bub.innerHTML = h; bub.hidden = false; }
function actions(list) { bar.innerHTML = ''; list.forEach(function (a) { var b = el('button', 'tb' + (a.cls ? ' ' + a.cls : ''), a.t); b.onclick = function () { a.f(b); }; bar.appendChild(b); }); }
function say(s) { if (window.GOLOS && GOLOS.on) GOLOS.say(window.VSLUH ? VSLUH(s) : s.replace(/<[^>]+>/g, '')); } /* VSLUH (../vsluh.js): единицы, дроби и ударения для голоса */
var PARTS = ['Знакомство', 'Стики', 'Тумблеры'], part = 0;
function progress() { bars.innerHTML = PARTS.map(function (p, i) { var k = i < part ? 1 : i > part ? 0 : (part === 0 ? Object.keys(seen).length / HS.length : part === 1 ? stk.i / stk.list.length : sws.i / sws.list.length); return '<i><b style="width:' + Math.round(k * 100) + '%"></b><span>' + p + '</span></i>'; }).join(''); }
var MODE = 'learn';

/* ---------- часть 1: знакомство ---------- */
function partLearn() { document.body.classList.remove('sticks'); MODE = 'learn'; part = 0; D.visible = pad.visible = beam.visible = false; padsEl.hidden = true; grabRing.forEach(function (r) { r.visible = false; });
  bubble('<span class="chip">ПУЛЬТ RADIOMASTER POCKET</span><br>' + (KID ? 'Это пульт, которым управляют дроном. Нажимай на <b>жёлтые точки</b> - расскажу, что где.' : 'Компактный пульт на EdgeTX со встроенным ExpressLRS. Нажимай на <b>жёлтые точки</b>: камера подлетит и расскажет про каждую часть. Крути пульт пальцем.'), '');
  say(KID ? 'Это пульт, которым управляют дроном. Нажимай на жёлтые точки.' : 'Пульт РадиоМастер Покет. Нажимай на жёлтые точки, чтобы узнать, что где.');
  actions([]); progress(); }

/* ---------- часть 2: стики ---------- */
var stk = { i: 0, list: KID ? [
  { q: 'Подними дрон: <b>левый стик вверх</b> (газ).', ok: function () { return sticks[0].y > .4; } },
  { q: 'Поверни дрон <b>влево</b>: левый стик влево.', ok: function () { return sticks[0].x < -.5; } },
  { q: 'Лети <b>вперёд</b>: правый стик вперёд (вверх).', ok: function () { return sticks[1].y > .5; } },
  { q: 'Лети <b>вправо</b>: правый стик вправо.', ok: function () { return sticks[1].x > .5; } },
  { q: 'Посади дрон: <b>газ вниз</b>.', ok: function () { return sticks[0].y < -.85 && DS.h < .05; } }
] : [
  { q: 'Газ: подними дрон на полметра - <b>левый стик вверх</b>, потом держи чуть выше середины, чтобы висел.', ok: function () { return DS.h > .45; } },
  { q: 'Рыскание: разверни дрон <b>на 90° вправо</b> (левый стик вправо).', ok: function () { return DS.yaw < -1.4; } },
  { q: 'Тангаж: <b>правый стик вперёд</b> - дрон наклоняет нос и летит вперёд.', ok: function () { return sticks[1].y > .5 && Math.abs(DS.tiltX) > .25; } },
  { q: 'Крен: <b>правый стик влево</b> - дрон кренится и смещается вбок.', ok: function () { return sticks[1].x < -.5 && Math.abs(DS.tiltZ) > .25; } },
  { q: 'Посадка: плавно <b>убери газ в ноль</b>. В Mode 2 газ всегда левый стик.', ok: function () { return sticks[0].y < -.85 && DS.h < .05; } }
] };
var padsEl = el('div', 'pads'); padsEl.innerHTML = '<div class="pad" data-i="0"><i></i><small>газ · поворот</small></div><div class="pad" data-i="1"><i></i><small>вперёд · вбок</small></div>'; ui.appendChild(padsEl); padsEl.hidden = true;
[].forEach.call(padsEl.querySelectorAll('.pad'), function (pd) { var i = +pd.dataset.i, kn = pd.querySelector('i'), id = null;
  function upd(e) { var r = pd.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 2 - 1, y = -(((e.clientY - r.top) / r.height) * 2 - 1); x = Math.max(-1, Math.min(1, x)); y = Math.max(-1, Math.min(1, y)); sticks[i].tx = x; sticks[i].ty = y; }
  pd.addEventListener('pointerdown', function (e) { id = e.pointerId; pd.setPointerCapture(id); upd(e); });
  pd.addEventListener('pointermove', function (e) { if (e.pointerId === id) upd(e); });
  pd.addEventListener('pointerup', function () { id = null; sticks[i].tx = 0; if (i === 1) sticks[i].ty = 0; });
  pd.knob = kn; });
function partSticks() { D.scale.setScalar(1); pad.scale.setScalar(1); pad.position.set(0, GY + .012, GZ); MODE = 'sticks'; part = 1; stk.i = 0; ST.on = true; drawLCD(); D.visible = pad.visible = beam.visible = true; DS.h = 0; DS.yaw = 0; DS.px = DS.pz = 0;
  hsM.forEach(function (s) { s.visible = false; }); padsEl.hidden = true; grabRing.forEach(function (r) { r.visible = true; }); sticks[0].tx = 0; sticks[0].ty = -1; sticks[1].tx = sticks[1].ty = 0;
  goCam(0, .44, innerWidth < innerHeight ? 9.6 : 6.3, new T.Vector3(0, 1.3, -.9), 1.4); document.body.classList.add('sticks'); /* пульт отъезжает вниз, за ним виден дрон */
  bubble('<span class="chip">СТИКИ · MODE 2</span><br>Двигай стики <b>прямо на пульте</b> - мышкой или пальцем. За пультом стоит дрон: смотри, как он отвечает. ' + stk.list[0].q, ''); say('Двигай стики прямо на пульте, мышкой или пальцем, и смотри на дрон. ' + stk.list[0].q.replace(/<[^>]+>/g, '')); actions([]); progress(); }
function stickTick() { if (MODE !== 'sticks') return; var g = stk.list[stk.i]; if (g && g.ok()) { stk.i++; progress();
    if (stk.i >= stk.list.length) { bubble('<span class="chip">ГОТОВО</span><br>' + (KID ? 'Левый стик - вверх-вниз и поворот, правый - куда лететь.' : 'Левый: газ и рыскание. Правый: тангаж и крен. Это Mode 2 - так летает большинство пилотов.'), 'ok'); padsEl.hidden = true; grabRing.forEach(function (r) { r.visible = false; }); actions([{ t: 'Дальше: тумблеры →', cls: 'pri', f: partSwitches }]); MODE = 'sticks-done'; return; }
    bubble('<span class="chip">ВЕРНО · ' + stk.i + ' ИЗ ' + stk.list.length + '</span><br>' + stk.list[stk.i].q, 'ok'); say(stk.list[stk.i].q.replace(/<[^>]+>/g, '')); } }

/* ---------- часть 3: тумблеры и Betaflight ---------- */
var bfEl = el('div', 'bf glass'); bfEl.hidden = true; ui.appendChild(bfEl);
var sws = { i: 0, list: [] };
sws.list = KID ? [
  { q: 'Взведи дрон: переключи тумблер <b>SA</b>. Взводим, только когда дрон стоит на земле и все отошли!', sw: 'SA', want: 1, then: function () { ST.armed = true; } },
  { q: 'Тумблер <b>SB</b> меняет режим полёта. Переключи его в среднее положение - режим <b>HORIZON</b>.', sw: 'SB', want: 1, then: function () { ST.mode = 'HORIZON'; } },
  { q: 'Верни <b>SB</b> назад в ANGLE - самый спокойный режим, дрон сам выравнивается.', sw: 'SB', want: 0, then: function () { ST.mode = 'ANGLE'; } },
  { q: 'Сними взвод: <b>SA</b> назад. Моторы остановятся.', sw: 'SA', want: 0, then: function () { ST.armed = false; } },
  { bf: 1, q: 'Какой тумблер что делает - <b>можно поменять</b>. Это делают в программе <b>Betaflight</b> на компьютере, вкладка <b>Modes</b>. Хочешь, чтобы дрон пищал тумблером SD (искать после падения)? Где это сделать?',
    opts: ['В Betaflight, вкладка Modes', 'Перепаять провода', 'Купить другой пульт'], a: 0, e: 'Верно: в Betaflight на вкладке Modes выбираем BEEPER и тумблер. Так можно назначить любую кнопку.' }
] : [
  { q: '<b>ARM</b> (взвод) обычно на тумблере <b>SA</b>. Взведи: моторы начнут крутиться на холостых. Правило: газ в нуле, дрон на земле, люди отошли.', sw: 'SA', want: 1, then: function () { ST.armed = true; } },
  { q: '<b>SB</b> на 3 положения - режимы полёта. Поставь среднее - <b>HORIZON</b>: выравнивается, но даёт делать флипы на краю стика.', sw: 'SB', want: 1, then: function () { ST.mode = 'HORIZON'; } },
  { q: 'Нижнее положение <b>SB</b> - <b>ACRO</b>: дрон держит угол, сам не выравнивается. На нём летают гонщики. Переключи.', sw: 'SB', want: 2, then: function () { ST.mode = 'ACRO'; } },
  { q: 'Верни <b>SB</b> в <b>ANGLE</b> и сними взвод <b>SA</b>. Сначала SB.', sw: 'SB', want: 0, then: function () { ST.mode = 'ANGLE'; } },
  { q: 'Теперь <b>SA</b> вниз - DISARM. Моторы стоп.', sw: 'SA', want: 0, then: function () { ST.armed = false; } },
  { bf: 1, q: 'Тумблеры - просто каналы AUX1...AUX4. Что они делают, задаём в <b>Betaflight → Modes</b>: функция + канал + диапазон. Хочу <b>TURTLE</b> (перевернуть упавший дрон) на <b>SC</b>. Что делаем?',
    opts: ['В Betaflight Modes: FLIP OVER AFTER CRASH на AUX3, диапазон верхнего положения SC', 'Ничего: TURTLE включается сам', 'Меняем прошивку пульта'], a: 0, e: 'Верно. Любой тумблер или кнопку можно назначить на любую функцию: в пульте (EdgeTX, миксер канала) и в Betaflight (вкладка Modes). Главное - проверить на вкладке Receiver, что канал двигается.' }
];
function partSwitches() { beam.visible = false; grabRing.forEach(function (r) { r.visible = false; }); D.scale.setScalar(.5); document.body.classList.remove('sticks'); MODE = 'sw'; part = 2; sws.i = 0; padsEl.hidden = true; sticks[0].tx = 0; sticks[0].ty = -1; sticks[1].tx = sticks[1].ty = 0;
  hsM.forEach(function (h) { h.visible = false; }); ST.on = true; drawLCD(); goCam(0, 1.18, (innerWidth < innerHeight ? 2.9 : 1.75), new T.Vector3(0, .55, -.55), 1.1); swAsk(); progress(); }
var swMark = new T.Sprite(new T.SpriteMaterial({ map: dotT(Y), depthTest: false, toneMapped: false })); swMark.renderOrder = 11; swMark.visible = false; P.add(swMark);
function swAsk() { var q = sws.list[sws.i]; bfEl.hidden = !q.bf; swMark.visible = !q.bf && !!q.sw; if (q.sw) swMark.position.set(sw[q.sw].g.position.x, TOPY + .2, .02);
  if (q.bf) { bfEl.innerHTML = '<div class="bf-h">Betaflight · Modes</div>' + [['ARM', 'AUX1', 'SA', 70, 100], ['ANGLE', 'AUX2', 'SB', 0, 33], ['HORIZON', 'AUX2', 'SB', 34, 66], ['BEEPER', 'AUX4', 'SD', 70, 100], ['FLIP OVER AFTER CRASH', 'AUX3', '?', 0, 0]].map(function (r) { return '<div class="bf-r"><b>' + r[0] + '</b><span>' + r[1] + (r[2] ? ' · ' + r[2] : '') + '</span><i><u style="left:' + r[3] + '%;width:' + (r[4] - r[3]) + '%"></u></i></div>'; }).join('');
    bubble('<span class="chip">BETAFLIGHT</span><br>' + q.q, ''); say(q.q.replace(/<[^>]+>/g, ''));
    actions(q.opts.map(function (o, k) { return { t: o, cls: 'w', f: function (b) { if (k === q.a) { b.classList.add('ok'); bubble('<span class="chip">ВЕРНО</span><br>' + q.e, 'ok'); actions([{ t: 'Завершить', cls: 'pri', f: finish }]); } else { b.classList.add('no'); bubble('<span class="chip">НЕ ТАК</span><br>Подсказка: всё про тумблеры решает полётный контроллер, а его настраивают в Betaflight.', 'bad'); } } }; })); return; }
  bubble('<span class="chip">ТУМБЛЕР ' + q.sw + '</span><br>' + q.q, ''); say(q.q.replace(/<[^>]+>/g, ''));
  var s = sw[q.sw]; actions(['SA', 'SB', 'SC', 'SD'].map(function (n) { return { t: n + ' ' + ['▲', '●', '▼'].slice(0, sw[n].n === 3 ? 3 : 1)[0], f: function () { flip(n); } }; }).map(function (a, i) { a.t = ['SA', 'SB', 'SC', 'SD'][i] + ' · ' + posName(['SA', 'SB', 'SC', 'SD'][i]); return a; })); }
function posName(n) { var s = sw[n]; return s.n === 3 ? ['верх', 'середина', 'низ'][s.pos] : ['верх', 'низ'][s.pos]; }
function flip(n) { var s = sw[n]; setSw(n, (s.pos + 1) % s.n); var q = sws.list[sws.i];
  if (q.sw === n && s.pos === q.want) { q.then(); drawLCD(); sws.i++; progress(); setTimeout(swAsk, 700); bubble('<span class="chip">ВЕРНО</span><br>' + (ST.armed ? 'ARMED - моторы крутятся.' : 'Режим: ' + ST.mode + (ST.armed ? '' : ', DISARM')), 'ok'); }
  else { swAsk(); if (q.sw !== n) bar.querySelectorAll('.tb')[['SA', 'SB', 'SC', 'SD'].indexOf(n)].classList.add('no'); else bubble('<span class="chip">ТУМБЛЕР ' + n + ' · ' + posName(n).toUpperCase() + '</span><br>' + q.q + '<br><small>Нажми ещё раз - тумблер переключится дальше.</small>', ''); }
  drawLCD(); }
function finish() { swMark.visible = false; MODE = 'done'; part = 3; progress(); bfEl.hidden = true; lsS(KEY, '1'); try { localStorage.setItem(KEY + '_best', '100'); } catch (e) {}
  bubble('<span class="chip">ТРЕНАЖЁР ПРОЙДЕН</span><br>' + (KID ? 'Ты знаешь пульт: стики, взвод, режимы. Дальше - полёты!' : 'Пульт изучен: стики Mode 2, взвод, режимы, и что любой тумблер назначается в Betaflight → Modes.'), 'ok');
  say('Тренажёр пройден!'); actions([{ t: 'Ещё раз', f: function () { location.reload(); } }, { t: 'Назад в курс', cls: 'pri', f: function () { history.back(); } }]); }
window.SBG = { sc: sc, ren: ren, P: P, cam: cam, DS: DS, sticks: sticks, st: function () { return { stage: MODE === 'done' ? 'done' : MODE }; }, jump: function (p) { if (p === 'sticks') partSticks(); else if (p === 'sw') partSwitches(); else if (p === 'learn') partLearn(); else if (p === 'all') HS.forEach(function (h) { seen[h.id] = 1; }); }, stk: stk, sws: sws, sticks: sticks, DS: DS, flip: flip, showHS: function (i) { showHS(HS[i]); }, HS: HS };

/* ---------- кадр ---------- */
var clock = new T.Clock(), lcdAcc = 0;
function loop() { requestAnimationFrame(loop); var dt = Math.min(clock.getDelta(), .1), t = clock.elapsedTime;
  if (fly) { fly.k = Math.min(1, fly.k + dt / fly.d); var k = fly.k < .5 ? 4 * fly.k * fly.k * fly.k : 1 - Math.pow(-2 * fly.k + 2, 3) / 2;
    orb.th = fly.a.th + (fly.b.th - fly.a.th) * k; orb.ph = fly.a.ph + (fly.b.ph - fly.a.ph) * k; orb.r = fly.a.r + (fly.b.r - fly.a.r) * k; orb.tgt.lerpVectors(fly.a.t, fly.b.t, k); if (fly.k >= 1) fly = null; }
  cam.position.copy(camPose()); cam.lookAt(orb.tgt);
  /* стики плавно к цели */
  sticks.forEach(function (s, i) { s.x += (s.tx - s.x) * Math.min(1, dt * 14); s.y += (s.ty - s.y) * Math.min(1, dt * 14); s.piv.rotation.y = s.x * .42; s.piv.rotation.x = -s.y * .42;
    var kn = padsEl.querySelectorAll('.pad i')[i]; if (kn) kn.style.transform = 'translate(' + (s.x * 50) + '%,' + (-s.y * 50) + '%)'; });
  /* голограмма дрона: Mode 2 */
  if (D.visible) { var thr = (sticks[0].y + 1) / 2, lift = (thr - .5) * 1.6; DS.h = Math.max(0, Math.min(1.1, DS.h + lift * dt)); if (thr < .08) DS.h = Math.max(0, DS.h - dt * .8);
    var air = DS.h > .02; if (air) DS.yaw -= sticks[0].x * dt * 1.6;
    var tk = air ? .5 : thr > .03 ? .16 : 0; /* в воздухе наклон полный, на земле с газом - чуть заметный */
    DS.tiltX += (-sticks[1].y * tk - DS.tiltX) * Math.min(1, dt * 6); DS.tiltZ += (-sticks[1].x * tk - DS.tiltZ) * Math.min(1, dt * 6);
    var fx = -Math.sin(DS.yaw), fz = -Math.cos(DS.yaw), rx = Math.cos(DS.yaw), rz = -Math.sin(DS.yaw);
    if (air) { DS.px += (fx * sticks[1].y + rx * sticks[1].x) * dt * .5; DS.pz += (fz * sticks[1].y + rz * sticks[1].x) * dt * .5; }
    DS.px *= Math.pow(.6, dt); DS.pz *= Math.pow(.6, dt); DS.px = Math.max(-.8, Math.min(.8, DS.px)); DS.pz = Math.max(-.6, Math.min(.6, DS.pz));
    D.position.set(DS.px, GY + .05 + DS.h, GZ + DS.pz); D.rotation.set(0, 0, 0); D.rotateY(DS.yaw); D.rotateX(DS.tiltX); D.rotateZ(DS.tiltZ);
    /* моторы: раскручиваются и затихают плавно, вместе с газом */
    var want = (ST.armed || air || thr > .03) ? 10 + thr * 46 : 0; rpm += (want - rpm) * Math.min(1, dt * (want > rpm ? 5 : 2.2)); props.forEach(function (p, i) { p.rotation.y += (i % 2 ? 1 : -1) * rpm * dt; });
    discs.forEach(function (d) { d.material.opacity = Math.min(.3, rpm / 56 * .3); });
    if (!air && rpm > 2) { D.position.x += Math.sin(t * 61) * .002 * thr; D.rotation.z += Math.sin(t * 47) * .006 * thr; } /* на земле дрон дрожит от моторов */
    stickTick(); }
  else if (ST.armed) props.forEach(function (p) { p.rotation.y += dt * 12; });
  if (MODE === 'sw' || MODE === 'done') { pad.position.set(0, .02, -1.45); pad.scale.setScalar(.5); D.rotation.set(0, 0, 0); }
  if (MODE === 'sw' && ST.armed) { D.visible = pad.visible = true; D.position.set(0, .14 + .02 * Math.sin(t * 6), -1.45); props.forEach(function (p, i) { p.rotation.y += (i % 2 ? 1 : -1) * 14 * dt; }); }
  else if (MODE === 'sw' || MODE === 'done') { D.visible = pad.visible = true; D.position.set(0, .06, -1.45); }
  if (swMark.visible) swMark.scale.setScalar(.1 + .03 * Math.sin(t * 5));
  antArm.rotation.x += ((antOpen ? 0 : -1.35) - antArm.rotation.x) * Math.min(1, dt * 4);
  hsM.forEach(function (s, i) { if (s.visible) s.scale.setScalar(.075 + .02 * Math.sin(t * 4 + i)); });
  lcdAcc += dt; if (lcdAcc > .15 && ST.on) { lcdAcc = 0; drawLCD(); }
  grabRing.forEach(function (r, i) { if (r.visible) r.scale.setScalar(1 + .04 * Math.sin(t * 4 + i * 2)); });
  if (AU) { var on = MODE === 'sticks' && D.visible && window.GOLOS ? GOLOS.on : MODE === 'sticks' && D.visible, vol = on ? (window.GOLOS && GOLOS.vol != null ? GOLOS.vol : 1) : 0, now = AU.ac.currentTime; AU.g.gain.setTargetAtTime(rpm > 1 ? .035 * vol * Math.min(1, rpm / 20) : 0, now, .06); AU.o.frequency.setTargetAtTime(70 + rpm * 5.5, now, .05); AU.o2.frequency.setTargetAtTime((70 + rpm * 5.5) * 2.02, now, .05); }
  ren.render(sc, cam); }
partLearn(); loop();
document.getElementById('back').onclick = function () { history.back(); };
var sb = document.getElementById('snd'); if (window.GOLOS) { sb.textContent = GOLOS.on ? '🔊' : '🔇'; sb.onclick = function () { GOLOS.setOn(!GOLOS.on); sb.textContent = GOLOS.on ? '🔊' : '🔇'; }; }
})();
