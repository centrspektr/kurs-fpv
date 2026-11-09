/* pult.js - тренажёр "Пульт RadioMaster Pocket" (модуль 4, по фото владельца 09.11.2026).
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
var sc = new T.Scene(); sc.background = new T.Color('#070914');
var pm = new T.PMREMGenerator(ren), ENV = pm.fromScene(new T.RoomEnvironment(), .04).texture; /* envMap ставим в каждый материал: в r128 сила envMapIntensity работает только так */
var cam = new T.PerspectiveCamera(42, 1, .05, 100);
function resize() { var w = innerWidth, h = innerHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 58 : 40; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
sc.add(new T.HemisphereLight('#a9b8ff', '#1a1020', .3));
var key = new T.DirectionalLight('#ffffff', 1.1); key.position.set(2, 4, 3); sc.add(key);
var rim = new T.DirectionalLight('#7cf3ff', .8); rim.position.set(-3, 2, -2); sc.add(rim);
function std(c, r, m, o) { var x = new T.MeshStandardMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r == null ? .5 : r, metalness: m || 0, envMap: ENV, envMapIntensity: .35 }); if (o) Object.assign(x, o); return x; }
function neon(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.5), toneMapped: false }); }
function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; t.redraw = function (d) { (d || draw)(x, w, h); t.needsUpdate = true; }; return t; }
function txt(c, s, x, y, sz, col, al, wt) { c.font = (wt || 800) + ' ' + sz + 'px Manrope, "Segoe UI", sans-serif'; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }

/* стол-диспетчерская: тёмная столешница с сеткой и светящимся краем */
var deskT = tex(1024, 1024, function (c, w, h) { c.fillStyle = '#10131f'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1d2236'; c.lineWidth = 2; for (var i = 0; i <= w; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
var desk = new T.Mesh(new T.CylinderGeometry(3.2, 3.2, .08, 64), [std('#1a1e30', .4, .5), new T.MeshStandardMaterial({ map: deskT, roughness: .35, metalness: .3, envMap: ENV, envMapIntensity: .25 }), std('#1a1e30')]);
desk.position.y = -.04; sc.add(desk);
var edge = new T.Mesh(new T.TorusGeometry(3.2, .012, 6, 96), neon(A, 1.2)); edge.rotation.x = Math.PI / 2; sc.add(edge);
/* фон: окна диспетчерской с небом аэродрома */
var skyT = tex(2048, 512, function (c, w, h) { var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1a3a'); g.addColorStop(.7, '#2d5a8a'); g.addColorStop(.72, '#1d3a2a'); g.addColorStop(1, '#0d1a12'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (var i = 0; i < 300; i++) { c.fillStyle = 'rgba(255,255,255,' + Math.random() * .6 + ')'; c.fillRect(Math.random() * w, Math.random() * h * .5, 2, 2); }
  c.fillStyle = '#e8e8e8'; for (var k = 0; k < 20; k++) c.fillRect(200 + k * 90, h * .82, 50, 6);
  c.strokeStyle = '#ffd36e'; c.lineWidth = 6; [[500, .62], [1300, .6], [1700, .64]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], h * q[1], 26, 36, 0, 0, 7); c.stroke(); }); });
var sky = new T.Mesh(new T.CylinderGeometry(9, 9, 6, 64, 1, true), new T.MeshBasicMaterial({ map: skyT, side: T.BackSide, toneMapped: false })); sky.position.y = 1.5; sky.rotation.y = Math.PI; sc.add(sky);
for (var wi = 0; wi < 12; wi++) { var post = new T.Mesh(new T.BoxGeometry(.12, 6, .12), std('#141828', .4, .6)); var a = wi / 12 * Math.PI * 2; post.position.set(Math.sin(a) * 8.8, 1.5, Math.cos(a) * 8.8); sc.add(post); }

/* ---------- пульт RadioMaster Pocket ---------- */
var P = new T.Group(); P.position.set(0, .32, 0); P.rotation.x = -1.05; sc.add(P);   /* лежит на подставке, наклонён к нам */
var smoke = std('#2a2d35', .3, .1, { transparent: true, opacity: .9, envMapIntensity: .6 });
var black = std('#0d0e12', .55, .1), metal = std('#d6dae2', .25, .95, { envMapIntensity: 1 }), dark = std('#141519', .65, .05);
/* корпус: скруглённый прямоугольник с "ручками" внизу */
var sh = new T.Shape(), W = .86, Hh = .58;
sh.moveTo(-W + .18, -Hh); sh.lineTo(W - .18, -Hh); sh.quadraticCurveTo(W + .04, -Hh, W + .02, -Hh + .26); sh.lineTo(W - .02, Hh - .2); sh.quadraticCurveTo(W - .04, Hh, W - .26, Hh);
sh.lineTo(-W + .26, Hh); sh.quadraticCurveTo(-W + .04, Hh, -W + .02, Hh - .2); sh.lineTo(-W - .02, -Hh + .26); sh.quadraticCurveTo(-W - .04, -Hh, -W + .18, -Hh);
var bodyG = new T.ExtrudeGeometry(sh, { depth: .2, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 4, curveSegments: 20 }); bodyG.translate(0, 0, -.1);
var body = new T.Mesh(bodyG, smoke); P.add(body);
/* плата внутри - видна сквозь дымчатый корпус */
var pcb = new T.Mesh(new T.PlaneGeometry(1.5, 1.0), std('#16301f', .6, .3)); pcb.position.z = .02; P.add(pcb);
var FZ = .145; /* лицевая сторона */
function onFace(m, x, y, z) { m.position.set(x, y, FZ + (z || 0)); P.add(m); return m; }
/* стики */
var sticks = [];
[-.5, .5].forEach(function (x, i) {
  onFace(new T.Mesh(new T.CylinderGeometry(.27, .27, .02, 48), black), x, .2, .0).rotation.x = Math.PI / 2;
  var ring = onFace(new T.Mesh(new T.TorusGeometry(.27, .02, 8, 48), std('#0c0d10', .3, .4)), x, .2, .01);
  var piv = new T.Group(); piv.position.set(x, .2, FZ + .01); P.add(piv);
  var gimb = new T.Mesh(new T.BoxGeometry(.16, .22, .03), dark); gimb.position.z = .01; piv.add(gimb);
  var shaft = new T.Mesh(new T.CylinderGeometry(.018, .022, .2, 16), metal); shaft.rotation.x = Math.PI / 2; shaft.position.z = .11; piv.add(shaft);
  var cap = new T.Mesh(new T.CylinderGeometry(.058, .058, .07, 18), metal); cap.rotation.x = Math.PI / 2; cap.position.z = .22; piv.add(cap);
  for (var r = 0; r < 12; r++) { var rib = new T.Mesh(new T.BoxGeometry(.012, .012, .07), metal); var aa = r / 12 * Math.PI * 2; rib.position.set(Math.cos(aa) * .06, Math.sin(aa) * .06, .22); piv.add(rib); }
  sticks.push({ piv: piv, x: 0, y: i === 0 ? -1 : 0, tx: 0, ty: i === 0 ? -1 : 0 });
});
/* экран (EdgeTX) */
var lcdT = tex(512, 384, function () {});
onFace(new T.Mesh(new T.BoxGeometry(.46, .34, .02), black), 0, .26, 0);
var lcd = onFace(new T.Mesh(new T.PlaneGeometry(.42, .3), new T.MeshBasicMaterial({ map: lcdT, toneMapped: false })), 0, .26, .012);
var pkT = tex(256, 64, function (c, w, h) { c.fillStyle = '#3a3c44'; c.fillRect(0, 0, w, h); txt(c, 'POCKET', w / 2, h / 2 + 2, 40, '#15161b', 'center', 900); });
onFace(new T.Mesh(new T.PlaneGeometry(.26, .065), new T.MeshStandardMaterial({ map: pkT, roughness: .5 })), 0, .055, .005);
/* колесо прокрутки */
var roller = new T.Mesh(new T.CylinderGeometry(.035, .035, .2, 20), std('#202127', .7)); roller.rotation.z = Math.PI / 2; onFace(roller, 0, -.015, .02);
/* триммеры-крестики и кнопка питания */
var trims = [];
[-.24, .24].forEach(function (x) { var g = new T.Group(); g.position.set(x, -.1, FZ + .012); P.add(g);
  g.add(new T.Mesh(new T.CylinderGeometry(.065, .065, .02, 24), black)).rotation.x = Math.PI / 2;
  var b1 = new T.Mesh(new T.BoxGeometry(.1, .025, .025), dark); b1.position.z = .015; g.add(b1); var b2 = new T.Mesh(new T.BoxGeometry(.025, .1, .025), dark); b2.position.z = .015; g.add(b2); trims.push(g); });
var power = onFace(new T.Mesh(T.CapsuleGeometry ? new T.CapsuleGeometry(.03, .08, 4, 12) : new T.CylinderGeometry(.03, .03, .14, 16), black), 0, -.1, .015); power.rotation.z = Math.PI / 2;
/* кнопки слева: RTN, PAGE>, PAGE<, TELE; круглые SYS и MDL */
function lblTex(s) { return tex(128, 48, function (c, w, h) { c.fillStyle = '#16171c'; c.fillRect(0, 0, w, h); txt(c, s, w / 2, h / 2 + 1, 26, '#8a8e9c', 'center', 800); }); }
var btns = {};
['RTN', 'PAGE>', 'PAGE<', 'TELE'].forEach(function (s, i) { var m = onFace(new T.Mesh(new T.BoxGeometry(.13, .055, .03), [black, black, black, black, new T.MeshStandardMaterial({ map: lblTex(s), roughness: .5 }), black]), -.66, -.06 - i * .1, .012); btns[s] = m; });
function roundBtn(s, x, y) { var g = new T.Group(); g.position.set(x, y, FZ + .012); P.add(g); var m = new T.Mesh(new T.CylinderGeometry(.055, .055, .03, 24), black); m.rotation.x = Math.PI / 2; g.add(m);
  var l = new T.Mesh(new T.PlaneGeometry(.08, .03), new T.MeshBasicMaterial({ map: lblTex(s), transparent: true })); l.position.z = .017; g.add(l); btns[s] = g; return g; }
roundBtn('SYS', -.42, -.26); roundBtn('MDL', .44, -.3);
/* динамик */
var spk = onFace(new T.Mesh(new T.CylinderGeometry(.14, .14, .015, 32), std('#1d1e24', .7)), .02, -.33, .005); spk.rotation.x = Math.PI / 2;
for (var hy = -2; hy <= 2; hy++) for (var hx = -3; hx <= 3; hx++) if (hx * hx + hy * hy * 2.4 < 11) onFace(new T.Mesh(new T.CircleGeometry(.008, 8), neon('#000', 1)), .02 + hx * .03, -.33 + hy * .045, .014);
/* верхняя кромка: тумблеры SA SB (слева), SC SD (справа), USB-C, складная антенна */
var TOPY = Hh + .03, sw = {};
function toggle(name, x, pos3) { var g = new T.Group(); g.position.set(x, TOPY, .0); P.add(g);
  var base = new T.Mesh(new T.BoxGeometry(.09, .05, .12), black); g.add(base);
  var lev = new T.Group(); lev.position.y = .02; g.add(lev); var l = new T.Mesh(new T.CylinderGeometry(.014, .018, .14, 12), metal); l.position.y = .07; lev.add(l);
  var tip = new T.Mesh(new T.SphereGeometry(.022, 12, 10), metal); tip.position.y = .14; lev.add(tip);
  sw[name] = { g: g, lev: lev, pos: 0, n: pos3 ? 3 : 2 }; setSw(name, 0); return g; }
function setSw(name, p) { var s = sw[name]; s.pos = p; var ang = s.n === 3 ? [-.5, 0, .5][p] : [-.5, .5][p]; s.lev.rotation.x = ang; }
toggle('SA', -.66, false); toggle('SB', -.46, true); toggle('SC', .46, true); toggle('SD', .66, false);
['SA', 'SB', 'SC', 'SD'].forEach(function (n) { var lt = tex(128, 64, function (c, w, h) { txt(c, n, w / 2, h / 2, 46, '#e8f6ff', 'center', 900); }); var sp = new T.Sprite(new T.SpriteMaterial({ map: lt, transparent: true, depthTest: false })); sp.scale.set(.12, .06, 1); sp.position.set(sw[n].g.position.x, TOPY + .02, .14); sp.renderOrder = 9; P.add(sp); });
var usb = new T.Mesh(new T.BoxGeometry(.09, .03, .035), std('#050505', .4)); usb.position.set(-.12, TOPY - .005, .03); P.add(usb);
var ant = new T.Group(); ant.position.set(.12, TOPY + .02, -.06); P.add(ant);
var hinge = new T.Mesh(new T.BoxGeometry(.12, .06, .06), black); ant.add(hinge); var antArm = new T.Group(); ant.add(antArm);
var stem = new T.Mesh(new T.BoxGeometry(.06, .3, .04), black); stem.position.y = .17; antArm.add(stem);
var bar = new T.Mesh(new T.BoxGeometry(.7, .06, .04), black); bar.position.y = .34; antArm.add(bar);
var rmT = tex(512, 64, function (c, w, h) { c.fillStyle = '#121318'; c.fillRect(0, 0, w, h); txt(c, 'RADIOMASTER', w / 2, h / 2 + 2, 44, '#d8dbe4', 'center', 900); });
var barL = new T.Mesh(new T.PlaneGeometry(.6, .05), new T.MeshBasicMaterial({ map: rmT })); barL.position.set(0, .34, .021); antArm.add(barL);
antArm.rotation.x = -1.35; /* сложена */
/* надпись сбоку */
var rmV = new T.Mesh(new T.PlaneGeometry(.5, .07), new T.MeshBasicMaterial({ map: rmT, transparent: true })); rmV.position.set(.74, .02, FZ + .003); rmV.rotation.z = Math.PI / 2; P.add(rmV);

/* экран EdgeTX: рисуем по состоянию */
var ST = { on: false, armed: false, mode: 'ANGLE', page: 0, msg: '' };
function drawLCD() { lcdT.redraw(function (c, w, h) { var bg = ST.on ? '#b9d9a8' : '#3c4a3a'; c.fillStyle = bg; c.fillRect(0, 0, w, h); if (!ST.on) return;
  c.fillStyle = '#1b2a14'; c.font = '800 30px ui-monospace, Menlo, monospace'; c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillText('Mobula7', 16, 12); c.textAlign = 'right'; c.fillText('7.6V', w - 16, 12); c.fillRect(0, 52, w, 3);
  c.textAlign = 'left'; c.font = '900 50px ui-monospace, Menlo, monospace'; c.fillText(ST.armed ? 'ARMED' : 'DISARM', 16, 74);
  c.font = '800 34px ui-monospace, Menlo, monospace'; c.fillText(ST.mode, 16, 140); c.fillText('00:' + (ST.armed ? '12' : '00'), w - 150, 140);
  for (var i = 0; i < 4; i++) { var v = i === 0 ? sticks[0].y : i === 1 ? sticks[0].x : i === 2 ? sticks[1].y : sticks[1].x; c.fillStyle = '#1b2a14';
    c.fillRect(16, 200 + i * 42, w - 32, 4); c.fillRect(16 + (v + 1) / 2 * (w - 40), 188 + i * 42, 10, 28); c.font = '700 22px ui-monospace, Menlo, monospace'; c.fillText(['THR', 'RUD', 'ELE', 'AIL'][i], w - 70, 172 + i * 42); }
  if (ST.msg) { c.fillStyle = '#1b2a14'; c.fillRect(40, 140, w - 80, 80); c.fillStyle = bg; c.font = '900 40px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.fillText(ST.msg, w / 2, 160); } }); }
drawLCD();

/* ---------- голограмма дрона ---------- */
var D = new T.Group(); D.position.set(0, 1.25, -.2); sc.add(D); D.visible = false;
var hm = neon(A, 1.6), props = [];
[[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) { var arm = new T.Mesh(new T.BoxGeometry(.03, .02, .42), hm); arm.position.set(q[0] * .1, 0, q[1] * .1); arm.rotation.y = Math.atan2(q[0], q[1]); D.add(arm);
  var duct = new T.Mesh(new T.TorusGeometry(.12, .008, 6, 32), hm); duct.rotation.x = Math.PI / 2; duct.position.set(q[0] * .2, 0, q[1] * .2); D.add(duct);
  var pr = new T.Mesh(new T.BoxGeometry(.2, .004, .025), neon(PK, 1.4)); pr.position.copy(duct.position); D.add(pr); props.push(pr); });
var dbody = new T.Mesh(new T.BoxGeometry(.13, .05, .17), hm); D.add(dbody); var camM = new T.Mesh(new T.BoxGeometry(.05, .05, .04), neon(Y, 1.4)); camM.position.set(0, .03, -.1); D.add(camM);
var pad = new T.Mesh(new T.RingGeometry(.32, .34, 48), neon(A, 1)); pad.rotation.x = -Math.PI / 2; pad.position.set(0, .9, -.2); sc.add(pad); pad.visible = false;
var beam = new T.Mesh(new T.CylinderGeometry(.33, .05, .9, 32, 1, true), new T.MeshBasicMaterial({ color: A, transparent: true, opacity: .06, side: T.DoubleSide, depthWrite: false })); beam.position.set(0, .45, -.2); sc.add(beam); beam.visible = false;
var DS = { h: 0, yaw: 0, px: 0, pz: 0, tiltX: 0, tiltZ: 0 };

/* ---------- камера: облёт пальцем и подлёт к деталям ---------- */
function RR(r) { return innerWidth < innerHeight ? r * 1.55 : r; } /* на телефоне стоя камера дальше, чтобы пульт влез по ширине */
var orb = { th: 0, ph: .42, r: RR(2.7), tgt: new T.Vector3(0, .35, 0) }, fly = null;
function camPose() { var p = new T.Vector3(orb.tgt.x + orb.r * Math.sin(orb.th) * Math.cos(orb.ph), orb.tgt.y + orb.r * Math.sin(orb.ph), orb.tgt.z + orb.r * Math.cos(orb.th) * Math.cos(orb.ph)); return p; }
function goCam(th, ph, r, tgt, d) { fly = { a: { th: orb.th, ph: orb.ph, r: orb.r, t: orb.tgt.clone() }, b: { th: th, ph: ph, r: r, t: tgt.clone() }, k: 0, d: d || 1 }; }
var down = null;
cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, th: orb.th, ph: orb.ph, m: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
cv.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 6) down.m = true;
  if (down.m && !fly) { orb.th = Math.max(-1.3, Math.min(1.3, down.th - dx * .006)); orb.ph = Math.max(.08, Math.min(1.25, down.ph + dy * .005)); } });
cv.addEventListener('pointerup', function (e) { var d = down; down = null; if (d && !d.m) tap(e.clientX, e.clientY); });
cv.addEventListener('wheel', function (e) { orb.r = Math.max(1.0, Math.min(6, orb.r + e.deltaY * .002)); }, { passive: true });

/* ---------- точки-подсказки ---------- */
var HS = KID ? [
  { id: 'lst', p: [-.5, .2, .25], h: 'Левый стик', t: 'Вверх-вниз - <b>газ</b>: дрон поднимается и опускается. Влево-вправо - дрон <b>поворачивается</b> на месте. Газ не возвращается в центр сам.' },
  { id: 'rst', p: [.5, .2, .25], h: 'Правый стик', t: 'Вперёд-назад - дрон <b>летит вперёд или назад</b>. Влево-вправо - <b>наклоняется вбок</b> и летит туда. Отпустил - стик сам встаёт в центр.' },
  { id: 'lcd', p: [0, .26, .05], h: 'Экран', t: 'Показывает, какой дрон выбран, заряд пульта, таймер и взведён ли дрон.' },
  { id: 'pwr', p: [0, -.1, .06], h: 'Кнопка питания', t: '<b>Удержи</b> - пульт включается или выключается. Сначала включаем пульт, потом дрон. Выключаем наоборот.' },
  { id: 'sw', p: [-.56, .62, .1], h: 'Тумблеры SA, SB, SC, SD', t: 'Четыре тумблера сверху. Одним <b>взводим</b> дрон (моторы готовы крутиться), другим меняем режим полёта.' },
  { id: 'ant', p: [.12, .66, -.05], h: 'Антенна', t: 'Складная антенна. Перед полётом раскладываем - так связь с дроном лучше.' },
  { id: 'trim', p: [.24, -.1, .06], h: 'Триммеры', t: 'Маленькие крестики. На FPV-дронах их не трогаем: если трогал - покажи тренеру.' },
  { id: 'menu', p: [-.55, -.2, .06], h: 'Кнопки меню', t: 'SYS, MDL, TELE, RTN, PAGE и колесо - для настройки пульта. Ими занимается тренер, в полёте не нужны.' }
] : [
  { id: 'lst', p: [-.5, .2, .25], h: 'Левый стик (Mode 2)', t: 'Вверх-вниз - <b>газ</b> (throttle): тяга всех моторов. Не пружинит, остаётся где оставил. Влево-вправо - <b>рыскание</b> (yaw): поворот вокруг вертикали.' },
  { id: 'rst', p: [.5, .2, .25], h: 'Правый стик', t: 'Вперёд-назад - <b>тангаж</b> (pitch): наклон носом вниз и полёт вперёд. Влево-вправо - <b>крен</b> (roll). Пружинит в центр. Стики на холловских датчиках - не изнашиваются.' },
  { id: 'trim', p: [-.24, -.1, .06], h: 'Триммеры (крестики)', t: 'Сдвигают центр стиков. На FPV-дронах держим в нуле: центр и подстройку делает полётный контроллер (Betaflight). Сбитые триммеры = дрон "тянет".' },
  { id: 'lcd', p: [0, .26, .05], h: 'Экран EdgeTX', t: 'Пульт работает на прошивке EdgeTX. На главном экране: модель, напряжение АКБ пульта, таймеры, положения стиков и триммеров.' },
  { id: 'roll', p: [0, -.015, .06], h: 'Колесо прокрутки', t: 'Крутим - листаем меню и меняем значения. <b>Нажатие</b> колеса - ввод (ENTER).' },
  { id: 'pwr', p: [0, -.1, .06], h: 'Питание', t: '<b>Удержать</b> - включить или выключить. Порядок: пульт → дрон, выключение: дрон → пульт. Иначе дрон может остаться без сигнала.' },
  { id: 'menu', p: [-.62, -.2, .06], h: 'RTN, PAGE, TELE', t: 'RTN - назад. PAGE &lt; &gt; - листать страницы. TELE - телеметрия: что дрон шлёт обратно (сигнал RSSI/LQ, напряжение).' },
  { id: 'sys', p: [-.42, -.26, .06], h: 'SYS и MDL', t: 'SYS - системное меню пульта (звук, яркость, скрипт ELRS для настройки связи). MDL - модели: у каждого дрона своя модель с миксами и тумблерами.' },
  { id: 'sw', p: [-.56, .62, .1], h: 'Тумблеры SA, SB, SC, SD', t: 'SA и SD - на 2 положения, SB и SC - на 3. Каждый тумблер пульт передаёт на дрон отдельным каналом AUX. Что он делает - решаем мы (дальше покажу).' },
  { id: 'ant', p: [.12, .66, -.05], h: 'Антенна ELRS', t: 'Встроенный передатчик ExpressLRS 2,4 ГГц. Антенну раскладываем и не направляем кончиком на дрон: сильнее всего сигнал идёт вбок от антенны.' },
  { id: 'usb', p: [-.12, .62, .08], h: 'USB-C', t: 'Зарядка аккумуляторов пульта и подключение к компьютеру: пульт становится джойстиком для симулятора, через него же обновляют прошивку.' }
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
  actions([{ t: 'Весь пульт', f: function () { goCam(0, .42, RR(2.7), new T.Vector3(0, .35, 0)); } }].concat(n >= HS.length ? [{ t: 'Дальше: стики →', cls: 'pri', f: partSticks }] : []));
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
function say(s) { if (window.GOLOS && GOLOS.on) GOLOS.say(s.replace(/(\d),(\d)/g, '$1 и $2 десятых')); }
var PARTS = ['Знакомство', 'Стики', 'Тумблеры'], part = 0;
function progress() { bars.innerHTML = PARTS.map(function (p, i) { var k = i < part ? 1 : i > part ? 0 : (part === 0 ? Object.keys(seen).length / HS.length : part === 1 ? stk.i / stk.list.length : sws.i / sws.list.length); return '<i><b style="width:' + Math.round(k * 100) + '%"></b><span>' + p + '</span></i>'; }).join(''); }
var MODE = 'learn';

/* ---------- часть 1: знакомство ---------- */
function partLearn() { MODE = 'learn'; part = 0; D.visible = pad.visible = beam.visible = false; padsEl.hidden = true;
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
function partSticks() { pad.position.set(0, .9, -.2); MODE = 'sticks'; part = 1; stk.i = 0; ST.on = true; drawLCD(); D.visible = pad.visible = beam.visible = true; DS.h = 0; DS.yaw = 0; DS.px = DS.pz = 0;
  hsM.forEach(function (s) { s.visible = false; }); padsEl.hidden = false; goCam(0, .55, innerWidth < innerHeight ? 3.7 : 3.0, new T.Vector3(0, .62, -.1), 1.2);
  bubble('<span class="chip">СТИКИ · MODE 2</span><br>Двигай стики пальцами внизу экрана. Голограмма над пультом - это дрон. ' + stk.list[0].q, ''); say('Двигай стики внизу экрана. ' + stk.list[0].q.replace(/<[^>]+>/g, '')); actions([]); progress(); }
function stickTick() { if (MODE !== 'sticks') return; var g = stk.list[stk.i]; if (g && g.ok()) { stk.i++; progress();
    if (stk.i >= stk.list.length) { bubble('<span class="chip">ГОТОВО</span><br>' + (KID ? 'Левый стик - вверх-вниз и поворот, правый - куда лететь.' : 'Левый: газ и рыскание. Правый: тангаж и крен. Это Mode 2 - так летает большинство пилотов.'), 'ok'); padsEl.hidden = true; actions([{ t: 'Дальше: тумблеры →', cls: 'pri', f: partSwitches }]); MODE = 'sticks-done'; return; }
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
function partSwitches() { MODE = 'sw'; part = 2; sws.i = 0; padsEl.hidden = true; sticks[0].tx = 0; sticks[0].ty = -1; sticks[1].tx = sticks[1].ty = 0;
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
window.SBG = { sc: sc, ren: ren, P: P, st: function () { return { stage: MODE === 'done' ? 'done' : MODE }; }, jump: function (p) { if (p === 'sticks') partSticks(); else if (p === 'sw') partSwitches(); else if (p === 'learn') partLearn(); else if (p === 'all') HS.forEach(function (h) { seen[h.id] = 1; }); }, stk: stk, sws: sws, sticks: sticks, DS: DS, flip: flip, showHS: function (i) { showHS(HS[i]); }, HS: HS };

/* ---------- кадр ---------- */
var clock = new T.Clock(), lcdAcc = 0;
function loop() { requestAnimationFrame(loop); var dt = Math.min(clock.getDelta(), .1), t = clock.elapsedTime;
  if (fly) { fly.k = Math.min(1, fly.k + dt / fly.d); var k = fly.k < .5 ? 4 * fly.k * fly.k * fly.k : 1 - Math.pow(-2 * fly.k + 2, 3) / 2;
    orb.th = fly.a.th + (fly.b.th - fly.a.th) * k; orb.ph = fly.a.ph + (fly.b.ph - fly.a.ph) * k; orb.r = fly.a.r + (fly.b.r - fly.a.r) * k; orb.tgt.lerpVectors(fly.a.t, fly.b.t, k); if (fly.k >= 1) fly = null; }
  cam.position.copy(camPose()); cam.lookAt(orb.tgt);
  /* стики плавно к цели */
  sticks.forEach(function (s, i) { s.x += (s.tx - s.x) * Math.min(1, dt * 14); s.y += (s.ty - s.y) * Math.min(1, dt * 14); s.piv.rotation.y = s.x * .35; s.piv.rotation.x = -s.y * .35;
    var kn = padsEl.querySelectorAll('.pad i')[i]; if (kn) kn.style.transform = 'translate(' + (s.x * 50) + '%,' + (-s.y * 50) + '%)'; });
  /* голограмма дрона: Mode 2 */
  if (D.visible) { var thr = (sticks[0].y + 1) / 2, lift = (thr - .5) * 1.6; DS.h = Math.max(0, Math.min(1.1, DS.h + lift * dt)); if (thr < .08) DS.h = Math.max(0, DS.h - dt * .8);
    var air = DS.h > .02; if (air) DS.yaw -= sticks[0].x * dt * 1.6;
    DS.tiltX += ((air ? -sticks[1].y * .45 : 0) - DS.tiltX) * Math.min(1, dt * 6); DS.tiltZ += ((air ? -sticks[1].x * .45 : 0) - DS.tiltZ) * Math.min(1, dt * 6);
    var fx = -Math.sin(DS.yaw), fz = -Math.cos(DS.yaw), rx = Math.cos(DS.yaw), rz = -Math.sin(DS.yaw);
    if (air) { DS.px += (fx * sticks[1].y + rx * sticks[1].x) * dt * .5; DS.pz += (fz * sticks[1].y + rz * sticks[1].x) * dt * .5; }
    DS.px *= Math.pow(.6, dt); DS.pz *= Math.pow(.6, dt); DS.px = Math.max(-.6, Math.min(.6, DS.px)); DS.pz = Math.max(-.6, Math.min(.6, DS.pz));
    D.position.set(DS.px, .95 + DS.h, -.2 + DS.pz); D.rotation.set(0, 0, 0); D.rotateY(DS.yaw); D.rotateX(DS.tiltX); D.rotateZ(DS.tiltZ);
    var spin = ST.armed || air ? (10 + thr * 40) : 0; props.forEach(function (p, i) { p.rotation.y += (i % 2 ? 1 : -1) * spin * dt; });
    stickTick(); }
  else if (ST.armed) props.forEach(function (p) { p.rotation.y += dt * 12; });
  if (MODE === 'sw' || MODE === 'done') { pad.position.set(0, .02, -.95); D.rotation.set(0, 0, 0); }
  if (MODE === 'sw' && ST.armed) { D.visible = pad.visible = true; D.position.set(0, .14 + .02 * Math.sin(t * 6), -.95); props.forEach(function (p, i) { p.rotation.y += (i % 2 ? 1 : -1) * 14 * dt; }); }
  else if (MODE === 'sw' || MODE === 'done') { D.visible = pad.visible = true; D.position.set(0, .06, -.95); }
  if (swMark.visible) swMark.scale.setScalar(.1 + .03 * Math.sin(t * 5));
  antArm.rotation.x += ((antOpen ? 0 : -1.35) - antArm.rotation.x) * Math.min(1, dt * 4);
  hsM.forEach(function (s, i) { if (s.visible) s.scale.setScalar(.075 + .02 * Math.sin(t * 4 + i)); });
  lcdAcc += dt; if (lcdAcc > .15 && ST.on) { lcdAcc = 0; drawLCD(); }
  edge.material.color.setHSL(.52, 1, .5 + .1 * Math.sin(t * 2));
  ren.render(sc, cam); }
partLearn(); loop();
document.getElementById('back').onclick = function () { history.back(); };
var sb = document.getElementById('snd'); if (window.GOLOS) { sb.textContent = GOLOS.on ? '🔊' : '🔇'; sb.onclick = function () { GOLOS.setOn(!GOLOS.on); sb.textContent = GOLOS.on ? '🔊' : '🔇'; }; }
})();
