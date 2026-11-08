/* Мастерская "Собери дрон": 3D-сцена (three r128). Единица = 1 см. */
(function () {
'use strict';
var W = window, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

function cTex(w, h, fn, rep) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); fn(x, w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function glowTex(col) { return cTex(128, 128, function (x, w) { var g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(.18, col); g.addColorStop(.55, col + '55'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, w, w); }); }
function glow(col, s, op) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(col), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op == null ? 1 : op })); sp.scale.set(s, s, 1); return sp; }

/* ---------- текстуры ---------- */
var carbon = cTex(256, 256, function (x, w) { x.fillStyle = '#121418'; x.fillRect(0, 0, w, w); var s = 16;
  for (var i = 0; i < w / s; i++) for (var j = 0; j < w / s; j++) { var a = (i + j) % 2; var g = x.createLinearGradient(i * s, j * s, i * s + (a ? s : 0), j * s + (a ? 0 : s)); g.addColorStop(0, '#1d2026'); g.addColorStop(.5, a ? '#2c3038' : '#262a31'); g.addColorStop(1, '#16181d'); x.fillStyle = g; x.fillRect(i * s + .5, j * s + .5, s - 1, s - 1); } }, [.3, .3]);
var mat = cTex(1024, 1024, function (x, w) { x.fillStyle = '#1b2230'; x.fillRect(0, 0, w, w); x.strokeStyle = 'rgba(160,190,230,.10)'; x.lineWidth = 1; for (var i = 0; i <= w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.strokeStyle = 'rgba(160,190,230,.22)'; for (i = 0; i <= w; i += 160) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.fillStyle = 'rgba(200,220,255,.35)'; x.font = '600 20px sans-serif'; x.fillText('ESD SAFE  ·  МАСТЕРСКАЯ ВЗЛЁТ', 24, 40); for (i = 0; i < 30; i++) { x.fillRect(24 + i * 32, w - 40, 1, i % 5 ? 10 : 20); }
  x.strokeStyle = 'rgba(199,125,255,.35)'; x.lineWidth = 3; x.strokeRect(6, 6, w - 12, w - 12); });
var peg = cTex(512, 512, function (x, w) { x.fillStyle = '#1a1530'; x.fillRect(0, 0, w, w); for (var i = 16; i < w; i += 32) for (var j = 16; j < w; j += 32) { x.fillStyle = '#0a0814'; x.beginPath(); x.arc(i, j, 4, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.05)'; x.beginPath(); x.arc(i + 1, j + 1, 4, 0, 7); x.fill(); } }, [6, 3]);
var floorT = cTex(512, 512, function (x, w) { x.fillStyle = '#0d0b18'; x.fillRect(0, 0, w, w); x.strokeStyle = 'rgba(199,125,255,.12)'; x.lineWidth = 2; for (var i = 0; i < w; i += 64) { x.strokeRect(i, 0, 64, w); } }, [8, 8]);
var stars = cTex(512, 512, function (x, w) { var g = x.createRadialGradient(w * .7, w * .8, 10, w * .5, w * .5, w * .8); g.addColorStop(0, '#3a1a6e'); g.addColorStop(.5, '#120a2a'); g.addColorStop(1, '#05040c'); x.fillStyle = g; x.fillRect(0, 0, w, w); for (var i = 0; i < 400; i++) { x.fillStyle = 'rgba(255,255,255,' + Math.random() + ')'; var r = Math.random() * 1.6; x.fillRect(Math.random() * w, Math.random() * w, r, r); }
  for (i = 0; i < 70; i++) { x.fillStyle = ['#7cf3ff', '#ff7ce0', '#ffd36e'][i % 3]; x.globalAlpha = .7; x.fillRect(w * .15 + Math.random() * w * .7, w * .72 + Math.random() * w * .12, 2, 2); } x.globalAlpha = 1;
  x.fillStyle = '#1a1033'; x.beginPath(); x.ellipse(w * .5, w * .86, w * .38, w * .05, 0, 0, 7); x.fill(); });
function screenTex() { return cTex(512, 320, function (x, w, h) { x.fillStyle = '#0b0f1c'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffbb00'; x.fillRect(0, 0, w, 34); x.fillStyle = '#111'; x.font = '700 18px sans-serif'; x.fillText('MOTORS · ПРОВЕРКА', 14, 23);
  for (var i = 0; i < 4; i++) { var bx = 40 + i * 115; x.fillStyle = '#1b2236'; x.fillRect(bx, 70, 60, 200); var v = [.7, .45, .6, .3][i]; var g = x.createLinearGradient(0, 270, 0, 70); g.addColorStop(0, '#2fbf71'); g.addColorStop(1, '#5effc4'); x.fillStyle = g; x.fillRect(bx, 70 + 200 * (1 - v), 60, 200 * v); x.fillStyle = '#cfd6ff'; x.font = '600 16px sans-serif'; x.fillText('M' + (i + 1), bx + 18, 296); } }); }
function silk(title, labels, bg) { return cTex(512, 512, function (x, w) { x.fillStyle = bg; x.fillRect(0, 0, w, w);
  x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 3; for (var i = 0; i < 40; i++) { x.beginPath(); var a = Math.random() * w, b = Math.random() * w; x.moveTo(a, b); x.lineTo(a + (Math.random() - .5) * 160, b); x.lineTo(a + (Math.random() - .5) * 160, b + (Math.random() - .5) * 160); x.stroke(); } /* дорожки */
  x.fillStyle = '#f2f2f2'; x.font = '700 30px monospace'; x.textAlign = 'center'; x.fillText(title, w / 2, w / 2 + 120);
  x.font = '700 24px monospace'; labels.forEach(function (l) { x.fillText(l[0], l[1], l[2]); });
  [[40, 40], [472, 40], [40, 472], [472, 472]].forEach(function (p) { x.strokeStyle = '#d9d9d9'; x.lineWidth = 4; x.beginPath(); x.arc(p[0], p[1], 22, 0, 7); x.stroke(); }); }); }
function stationTex() { return cTex(256, 128, function (x, w, h) { x.fillStyle = '#05140c'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff5a2a'; x.shadowColor = '#ff5a2a'; x.shadowBlur = 16; x.font = '700 78px monospace'; x.fillText('330°', 18, 92); }); }

/* ---------- материалы ---------- */
var M = {
  carbon: new THREE.MeshPhysicalMaterial({ map: carbon, color: 0xffffff, roughness: .38, metalness: .2, clearcoat: 1, clearcoatRoughness: .15 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc77dff, metalness: .9, roughness: .28 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 1, roughness: .22 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1b1d24, metalness: .6, roughness: .45 }),
  bell: new THREE.MeshStandardMaterial({ color: 0xff4f9a, metalness: .85, roughness: .25 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc8743a, metalness: 1, roughness: .3 }),
  pcbK: new THREE.MeshStandardMaterial({ color: 0x14161d, metalness: .2, roughness: .5 }),
  pcbG: new THREE.MeshStandardMaterial({ color: 0x0f4a33, metalness: .2, roughness: .45 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xe6b94a, metalness: 1, roughness: .2 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x0b0b0e, metalness: .3, roughness: .6 }),
  tpu: new THREE.MeshStandardMaterial({ color: 0xff8a1f, metalness: 0, roughness: .6 }),
  wireK: new THREE.MeshStandardMaterial({ color: 0x23252c, roughness: .55 }),
  wireR: new THREE.MeshStandardMaterial({ color: 0xd8262f, roughness: .45 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: .45 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x223355, metalness: .1, roughness: .02, clearcoat: 1 }),
  prop: new THREE.MeshPhysicalMaterial({ color: 0x3ee6ff, metalness: 0, roughness: .2, transparent: true, opacity: .82, clearcoat: 1 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2f6ff, metalness: .1, roughness: .35 }),
  bench: new THREE.MeshStandardMaterial({ color: 0x1c1730, metalness: .3, roughness: .6 }),
  benchEdge: new THREE.MeshStandardMaterial({ color: 0x15111f, metalness: .6, roughness: .4 })
};
function neon(col) { return new THREE.MeshBasicMaterial({ color: col }); }

function mesh(geo, m, x, y, z, par) { var o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; if (par) par.add(o); return o; }
function rrShape(w, h, r) { var s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function plate(w, h, r, t, m) { var g = new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth: t, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, curveSegments: 10 }); g.rotateX(-Math.PI / 2); return new THREE.Mesh(g, m); }
function tube(pts, r, m, par) { var c = new THREE.CatmullRomCurve3(pts); var o = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 8, false), m); o.castShadow = true; if (par) par.add(o); return o; }

/* ---------- детали дрона ---------- */
var ARM = 4.6; /* мотор на (±ARM, ±ARM): диагональ 13 см, рама 3 дюйма */
var MP = [[ARM, -ARM], [-ARM, -ARM], [-ARM, ARM], [ARM, ARM]]; /* 0 перед-право ... (нос к -z) */

var edgeM = new THREE.MeshStandardMaterial({ color: 0x3a3d45, roughness: .8, metalness: .1 }); /* срез карбона - матовый серый */
var holeM = new THREE.MeshBasicMaterial({ color: 0x050507 });
function cplate(w, h, r, t) { var p = plate(w, h, r, t, [M.carbon, edgeM]); p.castShadow = p.receiveShadow = true; return p; }
function frame() { var g = new THREE.Group();
  [45, -45].forEach(function (a) { var p = cplate(2.0, 2 * ARM * 1.414 + 2.2, 1, .4); p.rotation.y = a * Math.PI / 180; g.add(p);
    [-1, 1].forEach(function (s) { var sl = mesh(new THREE.CylinderGeometry(.17, .17, .5, 14), holeM, 0, .2, 0, g); sl.scale.set(1, 1, 4.2); var d = s * 3.1; sl.position.set(Math.sin(a * Math.PI / 180) * d, .2, Math.cos(a * Math.PI / 180) * d); sl.rotation.y = a * Math.PI / 180; }); }); /* облегчающие прорези в лучах */
  var c = cplate(4.2, 7.4, .8, .4); g.add(c);
  MP.forEach(function (q) { for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; mesh(new THREE.CylinderGeometry(.11, .11, .5, 12), holeM, q[0] + Math.cos(a) * .55, .2, q[1] + Math.sin(a) * .55, g); } /* отверстия под винты мотора - видны сверху и снизу */
    mesh(new THREE.CylinderGeometry(.3, .3, .5, 20), holeM, q[0], .2, q[1], g); });
  [[1.5, -2.6], [-1.5, -2.6], [1.5, 2.6], [-1.5, 2.6]].forEach(function (q) { mesh(new THREE.CylinderGeometry(.17, .17, .5, 12), holeM, q[0], .2, q[1], g); });
  return g; }
function topPlate() { var p = plate(3.6, 6.6, .7, .2, [M.carbon, edgeM]); p.castShadow = true; return p; }
function standoffs() { var g = new THREE.Group(), am = new THREE.MeshStandardMaterial({ color: 0x9b6bff, metalness: .85, roughness: .32 });
  [[1.5, -2.6], [-1.5, -2.6], [1.5, 2.6], [-1.5, 2.6]].forEach(function (q) { /* стойка M3: шестигранник с фасками и резьбой внутри */
    var h = mesh(new THREE.CylinderGeometry(.17, .17, 2.44, 6), am, q[0], 1.7, q[1], g); h.rotation.y = Math.PI / 6;
    [.48, 2.92].forEach(function (y) { var f = mesh(new THREE.CylinderGeometry(.15, .17, .08, 6), am, q[0], y, q[1], g); f.rotation.y = Math.PI / 6; if (y > 1) f.rotation.x = Math.PI; });
    mesh(new THREE.CylinderGeometry(.075, .075, .01, 10), holeM, q[0], 2.965, q[1], g); }); return g; }
function motor() { var g = new THREE.Group();
  /* основание с отверстиями под винты M2 */
  mesh(new THREE.CylinderGeometry(.95, 1.0, .18, 32), M.dark, 0, .09, 0, g);
  for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; mesh(new THREE.CylinderGeometry(.09, .09, .02, 10), M.chip, Math.cos(a) * .55, .185, Math.sin(a) * .55, g); }
  /* статор: 12 зубцов с медной обмоткой */
  mesh(new THREE.CylinderGeometry(.28, .28, .55, 16), M.dark, 0, .48, 0, g);
  for (k = 0; k < 12; k++) { var t = new THREE.Group(); t.rotation.y = k * Math.PI / 6; g.add(t);
    mesh(new THREE.BoxGeometry(.42, .44, .17), M.copper, .5, .48, 0, t); mesh(new THREE.BoxGeometry(.08, .5, .26), M.steel, .74, .48, 0, t); }
  /* колокол: магниты внутри, вентиляция сверху */
  var b = new THREE.Group(); b.position.y = .32; g.add(b);
  var side = new THREE.Mesh(new THREE.CylinderGeometry(.92, .92, .7, 40, 1, true), M.bell); side.position.y = .45; side.castShadow = true; b.add(side);
  var inner = new THREE.Mesh(new THREE.CylinderGeometry(.88, .88, .66, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x101114, roughness: .6, side: THREE.DoubleSide })); inner.position.y = .45; b.add(inner);
  mesh(new THREE.TorusGeometry(.9, .035, 8, 40), M.steel, 0, .1, 0, b).rotation.x = Math.PI / 2; /* нижняя кромка */
  mesh(new THREE.TorusGeometry(.8, .12, 10, 40), M.bell, 0, .82, 0, b).rotation.x = Math.PI / 2; /* верхнее кольцо */
  mesh(new THREE.CylinderGeometry(.3, .3, .14, 24), M.bell, 0, .84, 0, b);
  for (k = 0; k < 5; k++) { var sp = mesh(new THREE.BoxGeometry(.16, .1, .55), M.bell, 0, .84, 0, b); sp.rotation.y = k * Math.PI * 2 / 5; sp.position.x = Math.sin(sp.rotation.y) * .52; sp.position.z = Math.cos(sp.rotation.y) * .52; }
  mesh(new THREE.CylinderGeometry(.1, .1, .02, 12), M.steel, 0, .92, 0, b); /* подшипник */
  /* вал с резьбой */
  mesh(new THREE.CylinderGeometry(.09, .09, .9, 12), M.steel, 0, 1.4, 0, g);
  for (k = 0; k < 5; k++) mesh(new THREE.TorusGeometry(.09, .015, 6, 12), M.steel, 0, 1.5 + k * .08, 0, g).rotation.x = Math.PI / 2;
  g.userData.bell = b; return g; }
function chipOn(par, w, d, x, z, y, m) { return mesh(new THREE.BoxGeometry(w, .1, d), m || M.chip, x, y, z, par); }
function esc() { var g = new THREE.Group(); var p = plate(3.4, 3.4, .25, .12, M.pcbK); g.add(p);
  var sk = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), new THREE.MeshStandardMaterial({ map: silk('4in1 ESC 20A', [['M1', 420, 110], ['M2', 92, 110], ['M3', 92, 440], ['M4', 420, 440], ['+', 300, 470], ['-', 210, 470]], '#15171e'), roughness: .5 }));
  sk.rotation.x = -Math.PI / 2; sk.position.y = .165; g.add(sk);
  for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) { var x = -.95 + i * .63, z = -.45 + j * .7; chipOn(g, .42, .34, x, z, .21); for (var k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(.05, .03, .08), M.steel, x - .12 + k * .12, .175, z + .21, g); } /* МОП-транзисторы с ножками */
  chipOn(g, .4, .4, 0, .35, .21); /* микроконтроллер */
  for (i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(.1, .08, .16), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: .6 }), -.75 + i * .3, .2, 1.0, g); /* конденсаторы */
  MP.forEach(function (q) { var sx = Math.sign(q[0]), sz = Math.sign(q[1]); for (var k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(.3, .05, .26), M.gold, sx * 1.38, .19, sz * (1.3 - k * .38), g); });
  mesh(new THREE.BoxGeometry(.55, .06, .44), M.gold, -.5, .19, 1.42, g); mesh(new THREE.BoxGeometry(.55, .06, .44), M.gold, .5, .19, 1.42, g);
  [[1.05, -1.48], [-1.05, -1.48]].forEach(function (q) { mesh(new THREE.CylinderGeometry(.12, .12, .02, 12), M.chip, q[0], .175, q[1], g); }); /* отверстия крепления */
  return g; }
function fc() { var g = new THREE.Group(); var p = plate(3.4, 3.4, .25, .12, M.pcbG); g.add(p);
  var sk = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), new THREE.MeshStandardMaterial({ map: silk('F4 FC  ↑ FRONT', [['ESC', 120, 420], ['VTX', 400, 420], ['CAM', 256, 70], ['RX', 440, 260]], '#0f4a33'), roughness: .45 })); sk.rotation.x = -Math.PI / 2; sk.rotation.z = Math.PI; sk.position.y = .165; g.add(sk);
  chipOn(g, .9, .9, 0, 0, .22); chipOn(g, .4, .4, .9, -.8, .22); chipOn(g, .55, .3, -.9, .9, .22); chipOn(g, .3, .3, -.9, -.8, .22);
  mesh(new THREE.BoxGeometry(.7, .32, .5), M.steel, -1.55, .3, .2, g);
  var led1 = mesh(new THREE.BoxGeometry(.14, .08, .14), neon(0x5effc4), .9, .22, .8, g), led2 = mesh(new THREE.BoxGeometry(.14, .08, .14), neon(0x4aa8ff), 1.15, .22, .8, g);
  var gl1 = glow('#5effc4', 1.1, .9); gl1.position.set(.9, .35, .8); g.add(gl1); var gl2 = glow('#4aa8ff', 1.1, .9); gl2.position.set(1.15, .35, .8); g.add(gl2);
  for (var k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(.2, .05, .2), M.gold, 1.45, .19, -1.2 + k * .45, g);
  return g; }
function vtx() { var g = new THREE.Group(); var p = plate(2.0, 2.0, .2, .1, M.pcbK); g.add(p); chipOn(g, .7, .7, 0, 0, .18, M.steel); mesh(new THREE.CylinderGeometry(.14, .14, .3, 10), M.gold, 0, .25, .85, g); return g; }
function camera() { var g = new THREE.Group();
  var body = plate(1.45, 1.45, .18, 1.3, M.dark); body.rotation.x = 0; body.geometry.rotateX(Math.PI / 2); body.geometry.translate(0, 0, -.65); body.position.set(0, 1.2, 0); g.add(body); /* корпус со скруглёнными углами */
  mesh(new THREE.BoxGeometry(1.25, 1.25, .08), M.chip, 0, 1.2, -.7, g); /* лицевая рамка */
  var l = mesh(new THREE.CylinderGeometry(.5, .56, .5, 28), M.chip, 0, 1.2, -.95, g); l.rotation.x = Math.PI / 2;
  for (var k = 0; k < 4; k++) { var r = mesh(new THREE.TorusGeometry(.5, .025, 6, 28), M.dark, 0, 1.2, -.8 - k * .1, g); } /* резьба объектива */
  var rim = mesh(new THREE.TorusGeometry(.44, .06, 8, 28), M.steel, 0, 1.2, -1.2, g);
  var gl = mesh(new THREE.CylinderGeometry(.42, .42, .04, 28), M.glass, 0, 1.2, -1.22, g); gl.rotation.x = Math.PI / 2;
  var ir = mesh(new THREE.CircleGeometry(.2, 20), new THREE.MeshBasicMaterial({ color: 0x3a2a7a }), 0, 1.2, -1.245, g); ir.rotation.y = Math.PI;
  var gs = glow('#7aa8ff', .8, .55); gs.position.set(.15, 1.32, -1.3); g.add(gs);
  mesh(new THREE.BoxGeometry(1.3, 1.3, .08), M.pcbG, 0, 1.2, .7, g); mesh(new THREE.BoxGeometry(.5, .2, .12), M.white, 0, .8, .76, g); /* плата сзади и разъём */
  [-1, 1].forEach(function (s) { mesh(new THREE.CylinderGeometry(.12, .12, .04, 12), M.steel, s * .74, 1.15, -.2, g).rotation.z = Math.PI / 2; }); /* резьбовые отверстия по бокам */
  return g; }
/* крепление камеры из TPU: стоит на раме спереди, камера встаёт между щёк, винты идут сквозь щёки в камеру */
function camMount() { var g = new THREE.Group();
  mesh(new THREE.BoxGeometry(2.1, .2, 1.8), M.tpu, 0, .5, -.2, g);
  [-1, 1].forEach(function (s) { var w = mesh(new THREE.BoxGeometry(.2, 1.7, 1.6), M.tpu, s * .86, 1.35, -.2, g); mesh(new THREE.CylinderGeometry(.16, .16, .22, 12), M.chip, s * .86, 1.55, -.2, g).rotation.z = Math.PI / 2; });
  [-.7, .7].forEach(function (x) { mesh(new THREE.CylinderGeometry(.14, .14, .06, 10), M.steel, x, .62, .4, g); }); /* винты крепления к раме */
  return g; }
function antenna() { var g = new THREE.Group(); var tp = plate(1.4, 1.2, .3, .7, M.tpu); g.add(tp);
  tube([V(0, .3, -.2), V(0, 1.2, .3), V(0, 2.2, 1.2), V(0, 2.8, 1.9)], .09, M.wireK, g);
  mesh(new THREE.CylinderGeometry(.42, .42, .5, 20), M.dark, 0, 3.0, 2.1, g).rotation.x = -.6;
  var dome = mesh(new THREE.SphereGeometry(.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.dark, 0, 3.15, 2.25, g); dome.rotation.x = -.6; return g; }
function rx() { var g = new THREE.Group(); var p = plate(1.0, 1.2, .15, .08, M.pcbK); g.add(p); var led = glow('#ff4f6a', .6, .9); led.position.set(.2, .2, .2); g.add(led);
  [-1, 1].forEach(function (s) { tube([V(0, .12, .5), V(s * .9, .35, 1.2), V(s * 1.9, .4, 2.3)], .045, M.wireK, g); var tp = mesh(new THREE.CylinderGeometry(.07, .07, .7, 10), M.white, s * 2.15, .42, 2.62, g); tp.rotation.x = Math.PI / 2; tp.rotation.z = s * .55; });
  chipOn(g, .4, .4, -.1, -.1, .1); return g; }
/* разъём XT30: жёлтый корпус со скошенными углами (вставляется только одной стороной), латунные контакты, пайка в термоусадке сзади.
   Лицом к +z. male - штыри, иначе гнёзда; redX - где красный провод (x) */
function xt30(male, redX) { var g = new THREE.Group(), w = 1.0, h = .52, c = .15, sh = new THREE.Shape();
  sh.moveTo(-w / 2, -h / 2); sh.lineTo(w / 2, -h / 2); sh.lineTo(w / 2, h / 2 - c); sh.lineTo(w / 2 - c, h / 2); sh.lineTo(-w / 2 + c, h / 2); sh.lineTo(-w / 2, h / 2 - c); sh.lineTo(-w / 2, -h / 2);
  var geo = new THREE.ExtrudeGeometry(sh, { depth: .9, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2 }); geo.translate(0, 0, -.45);
  var ym = new THREE.MeshStandardMaterial({ color: 0xf0b820, roughness: .5 }); var b = new THREE.Mesh(geo, ym); b.castShadow = true; g.add(b);
  var brass = M.gold, hole = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
  [-.22, .22].forEach(function (x) {
    if (male) { var pin = mesh(new THREE.CylinderGeometry(.075, .075, .36, 12), brass, x, -.02, .62, g); pin.rotation.x = Math.PI / 2; mesh(new THREE.BoxGeometry(.012, .15, .3), hole, x, -.02, .64, g); }
    else { var hl = mesh(new THREE.CylinderGeometry(.11, .11, .04, 14), hole, x, -.02, .47, g); hl.rotation.x = Math.PI / 2; var rim = mesh(new THREE.TorusGeometry(.1, .02, 6, 14), brass, x, -.02, .475, g); }
    var cup = mesh(new THREE.CylinderGeometry(.09, .09, .2, 10), brass, x, -.02, -.55, g); cup.rotation.x = Math.PI / 2;
    var hs = mesh(new THREE.CylinderGeometry(.14, .14, .45, 14), new THREE.MeshStandardMaterial({ color: Math.abs(x - redX) < .01 ? 0xc0222b : 0x1a1a1f, roughness: .6 }), x, -.02, -.82, g); hs.rotation.x = Math.PI / 2; }); /* термоусадка */
  return g; }
function battLead() { var g = new THREE.Group(); tube([V(-.5, 1.25, 1.42), V(-.55, .9, 2.6), V(-.45, .5, 4.6), V(-.22, .48, 6.4)], .11, M.wireR, g); tube([V(.5, 1.25, 1.42), V(.55, .9, 2.6), V(.5, .5, 4.6), V(.22, .48, 6.4)], .11, M.wireK, g);
  /* конденсатор 35 В 470 мкФ: синяя гильза с полосой минуса, алюминиевый торец с насечкой, ножки к проводам питания */
  var cap = new THREE.Group(); cap.position.set(0, 1.3, 3.7); g.add(cap); g.userData.cap = cap;
  var sl = mesh(new THREE.CylinderGeometry(.4, .4, 1.5, 28), new THREE.MeshStandardMaterial({ color: 0x1d2f6a, roughness: .35, metalness: .1 }), 0, 0, 0, cap); sl.rotation.x = Math.PI / 2;
  var stp = mesh(new THREE.CylinderGeometry(.405, .405, 1.3, 28, 1, true, -.5, 1), new THREE.MeshStandardMaterial({ color: 0xc8d0dc, roughness: .5 }), 0, 0, 0, cap); stp.rotation.x = Math.PI / 2;
  var tp = mesh(new THREE.CylinderGeometry(.36, .36, .04, 28), M.steel, 0, 0, .76, cap); tp.rotation.x = Math.PI / 2;
  [0, Math.PI / 2].forEach(function (r) { var l = mesh(new THREE.BoxGeometry(.5, .02, .03), M.dark, 0, 0, .785, cap); l.rotation.z = r; });
  mesh(new THREE.TorusGeometry(.39, .03, 8, 28), M.dark, 0, 0, -.55, cap);
  tube([V(-.15, 0, -.76), V(-.2, -.1, -1.0), V(-.5, -.42, -1.0)], .035, M.steel, cap); tube([V(.15, 0, -.76), V(.2, -.1, -1.0), V(.5, -.42, -1.0)], .035, M.steel, cap);
  var xm = xt30(true, -.22); xm.position.set(0, .5, 7.4); g.add(xm); return g; }
function prop(col) { var g = new THREE.Group(), m = M.prop.clone(); m.color = new THREE.Color(col);
  for (var k = 0; k < 3; k++) { var s = new THREE.Shape(); s.moveTo(0, -.18); s.bezierCurveTo(1.2, -.55, 2.6, -.5, 3.8, -.18); s.bezierCurveTo(3.9, .05, 3.7, .3, 3.4, .32); s.bezierCurveTo(2.2, .5, 1, .4, 0, .2); s.lineTo(0, -.18);
    var geo = new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1 }); geo.rotateX(-Math.PI / 2 + .25);
    var b = new THREE.Mesh(geo, m); b.rotation.y = k * Math.PI * 2 / 3; b.castShadow = true; g.add(b); }
  mesh(new THREE.CylinderGeometry(.45, .5, .55, 20), m, 0, 0, 0, g); return g; }

/* полный дрон: части по ключам, можно показывать по одной */
function drone() { var D = new THREE.Group(), P = {};
  P.frame = frame(); D.add(P.frame); var cm = camMount(); cm.position.set(0, 0, -3.0); P.frame.add(cm); P.camMount = cm;
  P.motors = MP.map(function (q, i) { var m = motor(); m.position.set(q[0], .46, q[1]); D.add(m); return m; });
  P.esc = esc(); P.esc.position.y = 1.0; D.add(P.esc);
  P.fc = fc(); P.fc.position.y = 1.9; D.add(P.fc);
  P.vtx = vtx(); P.vtx.position.set(0, 2.55, 1.4); D.add(P.vtx);
  P.so = standoffs(); D.add(P.so);
  P.top = topPlate(); P.top.position.y = 3.0; D.add(P.top);
  P.cam = camera(); P.cam.position.set(0, .4, -3.0); D.add(P.cam);
  P.ant = antenna(); P.ant.position.set(0, 3.2, 3.0); D.add(P.ant);
  P.rx = rx(); P.rx.position.set(0, 3.25, 1.9); D.add(P.rx);
  P.batt = battLead(); D.add(P.batt);
  P.wires = MP.map(function (q) { var g = new THREE.Group(), sx = Math.sign(q[0]), sz = Math.sign(q[1]); [0, 1, 2].forEach(function (k) {
      tube([V(q[0] - sx * .55, .55, q[1] - sz * .55 + (1 - k) * .12 * sz), V(sx * 3.0, .85, sz * (2.6 - k * .25)), V(sx * 2.0, 1.3, sz * (1.33 - k * .38)), V(sx * 1.38, 1.24, sz * (1.3 - k * .38))], .055, M.wireK, g); }); D.add(g); return g; });
  P.props = MP.map(function (q, i) { var p = prop(i % 2 ? '#ff4fd8' : '#3ee6ff'); p.position.set(q[0], 2.4, q[1]); D.add(p); return p; });
  D.userData.P = P; return D; }

/* ---------- мастерская ---------- */
function workshop(S) { var R = new THREE.Group(); S.add(R);
  var fl = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: floorT, roughness: .8 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -80; fl.receiveShadow = true; R.add(fl);
  /* стол */
  var top = mesh(new THREE.BoxGeometry(150, 3, 70), M.bench, 0, -1.6, 0, R); top.receiveShadow = true;
  mesh(new THREE.BoxGeometry(150.4, .8, 70.4), M.benchEdge, 0, -.7, 0, R).receiveShadow = true; /* верх кромки ниже столешницы - без мерцания */
  var neonEdge = mesh(new THREE.BoxGeometry(150, .25, .25), neon(0xc77dff), 0, -.6, 35.3, R);
  var mt = new THREE.Mesh(new THREE.PlaneGeometry(56, 40), new THREE.MeshStandardMaterial({ map: mat, roughness: .85 })); mt.rotation.x = -Math.PI / 2; mt.position.set(0, .05, 2); mt.receiveShadow = true; R.add(mt);
  [-70, 70].forEach(function (x) { mesh(new THREE.BoxGeometry(4, 80, 4), M.benchEdge, x, -42, 30, R); mesh(new THREE.BoxGeometry(4, 80, 4), M.benchEdge, x, -42, -30, R); });
  /* стена с перфорацией */
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), new THREE.MeshStandardMaterial({ map: peg, roughness: .9 })); wall.position.set(0, 40, -36); wall.receiveShadow = true; R.add(wall);
  var wl = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), new THREE.MeshStandardMaterial({ color: 0x0e0b1c, roughness: 1 })); wl.position.set(0, 40, -37); R.add(wl);
  [[0xc77dff, 40], [0xff4fd8, 43]].forEach(function (q) { var n = mesh(new THREE.CylinderGeometry(.35, .35, 200, 10), neon(q[0]), 0, q[1], -34.5, R); n.rotation.z = Math.PI / 2; for (var i = -90; i <= 90; i += 30) { var g = glow(q[0] === 0xc77dff ? '#c77dff' : '#ff4fd8', 26, .35); g.position.set(i, q[1], -33); R.add(g); } });
  /* инструменты на стене */
  function tool(x, y, col, len, rot) { var g = new THREE.Group(); mesh(new THREE.CylinderGeometry(.9, .9, len * .45, 12), new THREE.MeshStandardMaterial({ color: col, roughness: .4 }), 0, 0, 0, g); mesh(new THREE.CylinderGeometry(.22, .22, len * .6, 8), M.steel, 0, -len * .5, 0, g); g.position.set(x, y, -34.6); g.rotation.z = rot || 0; R.add(g); }
  tool(-22, 30, 0xff4f6a, 14); tool(-17, 30, 0xffd166, 12); tool(-12, 31, 0x5effc4, 15); tool(-7, 30, 0x4aa8ff, 11);
  [22, 27].forEach(function (x, i) { var g = new THREE.Group(); var h1 = mesh(new THREE.BoxGeometry(1.2, 10, .8), new THREE.MeshStandardMaterial({ color: i ? 0xff8a1f : 0xc77dff }), -1, -3, 0, g); h1.rotation.z = .12; var h2 = mesh(new THREE.BoxGeometry(1.2, 10, .8), new THREE.MeshStandardMaterial({ color: i ? 0xff8a1f : 0xc77dff }), 1, -3, 0, g); h2.rotation.z = -.12; mesh(new THREE.BoxGeometry(1.4, 4, .6), M.steel, 0, 3.5, 0, g); g.position.set(x, 31, -34.6); R.add(g); });
  /* полка с коробками */
  mesh(new THREE.BoxGeometry(60, 1.2, 12), M.benchEdge, 40, 50, -30, R);
  [[22, 0xff7ce0, 8], [32, 0x7cf3ff, 10], [44, 0xffd36e, 7], [54, 0x9dff7c, 9]].forEach(function (q) { mesh(new THREE.BoxGeometry(8, q[2], 8), new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: .7 }), q[0], 50.6 + q[2] / 2, -30, R); mesh(new THREE.BoxGeometry(8.1, 1, 8.1), neon(q[1]), q[0], 50.6 + q[2] * .7, -30, R); });
  /* иллюминатор */
  var win = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ map: stars })); win.position.set(-6, 56, -35.8); R.add(win);
  var ring = mesh(new THREE.TorusGeometry(16.5, 1.4, 12, 48), M.steel, -6, 56, -35.5, R);
  var wg = glow('#7c5cff', 46, .25); wg.position.set(-6, 56, -34); R.add(wg);
  /* монитор */
  var mon = new THREE.Group(); mesh(new THREE.BoxGeometry(34, 21, 1.4), M.benchEdge, 0, 0, 0, mon); var sc = new THREE.Mesh(new THREE.PlaneGeometry(32, 19), new THREE.MeshBasicMaterial({ map: screenTex() })); sc.position.z = .75; mon.add(sc);
  mesh(new THREE.BoxGeometry(2, 10, 2), M.benchEdge, 0, -14, -1, mon); mesh(new THREE.BoxGeometry(12, .8, 8), M.benchEdge, 0, -19, 0, mon); mon.position.set(17, 13, -30); mon.rotation.y = -.3; mon.scale.setScalar(.6); R.add(mon); var mg = glow('#ffbb00', 40, .12); mg.position.set(17, 13, -27); R.add(mg);
  /* паяльная станция: корпус с наклонной панелью, дисплей, ручка регулировки, выключатель, гнездо паяльника */
  var st = new THREE.Group(), stM = new THREE.MeshStandardMaterial({ color: 0x23202f, metalness: .5, roughness: .4 }), panM = new THREE.MeshStandardMaterial({ color: 0x15131d, metalness: .2, roughness: .6 });
  mesh(new THREE.BoxGeometry(13, 7, 11), stM, 0, 3.5, 0, st); var pan = mesh(new THREE.BoxGeometry(12.4, 6.2, .5), panM, 0, 4.0, 5.6, st); pan.rotation.x = -.18;
  for (var i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(.25, 4, 9), panM, -5.2 + i * 1.3, 7.05, -.5, st); /* вентиляция сверху */
  [[-6, -5], [6, -5], [-6, 5], [6, 5]].forEach(function (q) { mesh(new THREE.CylinderGeometry(.6, .6, .3, 12), M.chip, q[0], .15, q[1], st); });
  var disp = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: stationTex() })); disp.position.set(-1.6, 5.1, 6.06); disp.rotation.x = -.18; st.add(disp);
  mesh(new THREE.BoxGeometry(6.4, 3.4, .1), M.chip, -1.6, 5.1, 5.93, st).rotation.x = -.18;
  var kn = new THREE.Group(); kn.position.set(3.6, 4.3, 6.1); kn.rotation.x = Math.PI / 2 - .18; st.add(kn); /* ручка: юбка, рифлёный цилиндр, крышка с риской */
  mesh(new THREE.CylinderGeometry(1.45, 1.5, .25, 32), M.steel, 0, .1, 0, kn); var kb = mesh(new THREE.CylinderGeometry(1.1, 1.2, 1.1, 32), M.chip, 0, .7, 0, kn);
  for (i = 0; i < 18; i++) { var rb = mesh(new THREE.BoxGeometry(.12, 1.0, .14), M.dark, 0, .7, 0, kn); var a = i / 18 * Math.PI * 2; rb.position.x = Math.cos(a) * 1.15; rb.position.z = Math.sin(a) * 1.15; rb.rotation.y = -a; }
  mesh(new THREE.CylinderGeometry(.95, 1.05, .12, 32), M.steel, 0, 1.3, 0, kn); mesh(new THREE.BoxGeometry(.14, .06, .8), neon(0xff5a2a), 0, 1.37, -.45, kn);
  for (i = 0; i < 11; i++) { var tk = mesh(new THREE.BoxGeometry(.06, .3, .02), neon(0xbfc6d8), 0, 0, 0, st); var ang = -2.4 + i * .48; tk.position.set(3.6 + Math.sin(ang) * 1.85, 4.3 + Math.cos(ang) * 1.85 * .98, 6.05); tk.rotation.z = -ang; tk.rotation.x = -.18; } /* шкала */
  var swt = mesh(new THREE.BoxGeometry(.9, 1.4, .5), new THREE.MeshStandardMaterial({ color: 0xd8262f, roughness: .4 }), -4.9, 2.0, 6.1, st); swt.rotation.x = -.18; /* выключатель */
  var sock = mesh(new THREE.CylinderGeometry(.75, .75, .6, 20), M.steel, 3.6, 1.4, 6.0, st); sock.rotation.x = Math.PI / 2; mesh(new THREE.CylinderGeometry(.5, .5, .62, 20), M.chip, 3.6, 1.4, 6.02, st).rotation.x = Math.PI / 2; /* гнездо */
  var sg = glow('#ff5a2a', 5, .45); sg.position.set(-1.6, 5.1, 6.3); st.add(sg);
  /* подставка со спиралью, губка и латунная стружка */
  var pts = []; for (i = 0; i < 120; i++) { var a2 = i / 120 * Math.PI * 14; pts.push(V(Math.cos(a2) * 1.4, i / 120 * 7, Math.sin(a2) * 1.4)); }
  var sp = new THREE.Group(); mesh(new THREE.CylinderGeometry(4, 4.5, 1.2, 24), M.benchEdge, 0, .6, 0, sp); tube(pts, .12, M.steel, sp).position.y = 1.2;
  mesh(new THREE.CylinderGeometry(2.4, 2.4, .8, 24), M.gold, 2.6, 1.3, 2.4, sp); mesh(new THREE.BoxGeometry(2.6, .6, 2.2), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 1 }), -2.4, 1.4, 2.2, sp);
  /* паяльник лежит в спирали, провод идёт к гнезду станции */
  var ir = new THREE.Group(), grip = new THREE.MeshStandardMaterial({ color: 0x8b3dff, roughness: .5, metalness: .2 });
  var tp = mesh(new THREE.ConeGeometry(.15, 1.1, 16), M.steel, 0, .55, 0, ir); tp.rotation.x = Math.PI; mesh(new THREE.CylinderGeometry(.23, .23, 4, 16), M.steel, 0, 3.1, 0, ir);
  mesh(new THREE.CylinderGeometry(.58, .5, 2.4, 20), M.dark, 0, 6.3, 0, ir); mesh(new THREE.CylinderGeometry(.72, .72, 7, 20), grip, 0, 11, 0, ir);
  for (i = 0; i < 6; i++) mesh(new THREE.TorusGeometry(.74, .06, 6, 20), M.dark, 0, 8.4 + i, 0, ir).rotation.x = Math.PI / 2;
  ir.position.set(0, 2.4, 0); ir.rotation.set(-.55, 0, 0); sp.add(ir); ir.scale.setScalar(.75);
  sp.position.set(18, 0, -2); st.add(sp);
  sp.updateMatrixWorld(true); var cEnd = V(0, 14.6, 0).applyMatrix4(new THREE.Matrix4().compose(V(0, 2.4, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.55, 0, 0)), V(.75, .75, .75))).add(V(18, 0, -2));
  tube([V(3.6, 1.4, 6.4), V(6, .5, 9), V(11, .4, 8), V(16, 2, 6), cEnd.clone().add(V(0, 1.5, 2.5)), cEnd], .28, M.wireK, st);
  st.position.set(24, 0, -14); st.rotation.y = -.6; R.add(st);
  /* мультиметр и пинцет на столе */
  var mm = new THREE.Group(); mesh(new THREE.BoxGeometry(7, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: .6 }), 0, .8, 0, mm); mesh(new THREE.BoxGeometry(5.6, .2, 3), new THREE.MeshStandardMaterial({ color: 0x9fd8a8, roughness: .3 }), 0, 1.65, -3.3, mm);
  var mk = mesh(new THREE.CylinderGeometry(1.6, 1.6, .5, 24), M.chip, 0, 1.8, 1.2, mm); [[-1.8, 0xd8262f], [1.8, 0x111111]].forEach(function (q) { mesh(new THREE.CylinderGeometry(.35, .35, .4, 12), M.steel, q[0], 1.8, 4.6, mm); tube([V(q[0], 1.9, 4.6), V(q[0] * 1.5, 2.5, 8), V(q[0] * 3, .4, 11), V(q[0] * 4, .4, 15)], .14, new THREE.MeshStandardMaterial({ color: q[1], roughness: .5 }), mm); });
  mm.position.set(-30, 0, -6); mm.rotation.y = .4; R.add(mm);
  var tw = new THREE.Group(); [-1, 1].forEach(function (s2) { var arm = mesh(new THREE.BoxGeometry(.35, .2, 11), M.steel, s2 * .35, .2, 0, tw); arm.rotation.y = s2 * .05; }); tw.position.set(-22, 0, 4); tw.rotation.y = -.9; R.add(tw);
  /* катушка припоя, флюс */
  var sl = mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.4, 28), new THREE.MeshStandardMaterial({ color: 0x9aa3b5, metalness: .9, roughness: .3 }), 24, 1.2, 12, R); mesh(new THREE.CylinderGeometry(3.2, 3.2, .3, 28), M.benchEdge, 24, 2.5, 12, R); mesh(new THREE.CylinderGeometry(3.2, 3.2, .3, 28), M.benchEdge, 24, 0, 12, R);
  var fx = mesh(new THREE.CylinderGeometry(1.6, 1.6, 6, 20), new THREE.MeshStandardMaterial({ color: 0xffd166, transparent: true, opacity: .75, roughness: .1 }), -19, 3, -4, R); mesh(new THREE.CylinderGeometry(.6, 1.2, 2.2, 16), new THREE.MeshStandardMaterial({ color: 0xff4f6a }), -19, 7, -4, R);
  /* органайзер с деталями */
  var org = new THREE.Group(); mesh(new THREE.BoxGeometry(20, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x241f38, roughness: .5 }), 0, .8, 0, org);
  for (var c = 0; c < 4; c++) for (var r = 0; r < 2; r++) { mesh(new THREE.BoxGeometry(.3, 2, 12), M.benchEdge, -10 + c * 5, 1.4, 0, org); var cnt = [0xc77dff, 0xffd166, 0x5effc4, 0xff4fd8][c]; for (var k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(.45, 10, 8), new THREE.MeshStandardMaterial({ color: cnt, metalness: .6, roughness: .3 }), -7.5 + c * 5 + (k % 2) * 1.2 - .6, 1.9, -3 + r * 6 + (k > 1 ? 1 : -1), org); }
  org.position.set(-25, 0, 13); org.rotation.y = .5; R.add(org);
  /* лампа на кронштейне */
  var lp = new THREE.Group(); mesh(new THREE.CylinderGeometry(3.5, 4, 1.2, 24), M.benchEdge, 0, .6, 0, lp);
  var a1 = mesh(new THREE.CylinderGeometry(.45, .45, 26, 10), M.steel, 0, 13, 0, lp); a1.rotation.z = .35; a1.position.x = -4.4;
  var a2 = mesh(new THREE.CylinderGeometry(.45, .45, 22, 10), M.steel, 0, 0, 0, lp); a2.rotation.z = -1.25; a2.position.set(1.3, 27, 0);
  var head = new THREE.Group(); mesh(new THREE.CylinderGeometry(2.2, 4.2, 4, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xc77dff, metalness: .7, roughness: .3, side: THREE.DoubleSide }), 0, 0, 0, head); mesh(new THREE.CircleGeometry(3.9, 24), neon(0xfff1d6), 0, -1.9, 0, head).rotation.x = Math.PI / 2;
  head.position.set(11.5, 30, 0); head.rotation.z = .5; lp.add(head); var hg = glow('#ffe9c4', 16, .55); hg.position.set(12.5, 28, 0); lp.add(hg);
  lp.position.set(-22, 0, -16); R.add(lp);
  return R; }

function guideDrone() { var g = new THREE.Group(); var body = mesh(new THREE.SphereGeometry(1.6, 24, 16), M.white, 0, 0, 0, g); body.scale.set(1.2, .7, 1);
  var eye = mesh(new THREE.SphereGeometry(.55, 16, 10), neon(0x00d4ff), 0, .05, -1.45, g); var eg = glow('#00d4ff', 3, .9); eg.position.set(0, .05, -1.7); g.add(eg);
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { var arm = mesh(new THREE.BoxGeometry(.25, .2, 2), M.white, q[0] * 1.6, 0, q[1] * 1.2, g); arm.rotation.y = q[0] * q[1] * .8;
    var rr = mesh(new THREE.TorusGeometry(1, .08, 8, 24), neon(0x7cf3ff), q[0] * 2.3, .25, q[1] * 1.9, g); rr.rotation.x = Math.PI / 2; var rg = glow('#7cf3ff', 3.2, .35); rg.position.set(q[0] * 2.3, .25, q[1] * 1.9); g.add(rg); });
  return g; }

/* ---------- запуск ---------- */
W.SB = function (canvas, w, h) {
  var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true }); r.setSize(w, h, false); r.setPixelRatio(1);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .95; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  var S = new THREE.Scene(); S.background = new THREE.Color(0x0b0816); S.fog = new THREE.Fog(0x0b0816, 120, 320);
  var pm = new THREE.PMREMGenerator(r); S.environment = pm.fromScene(new THREE.RoomEnvironment(), .04).texture;
  S.add(new THREE.HemisphereLight(0x8a7cff, 0x1a0f2a, .5));
  var key = new THREE.SpotLight(0xffe2c0, 2.2, 160, .55, .6, 1); key.position.set(-18, 34, 6); key.target.position.set(2, 0, 2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 4; S.add(key, key.target);
  var rim = new THREE.PointLight(0xc77dff, 1.4, 120); rim.position.set(20, 30, -30); S.add(rim);
  var fill = new THREE.PointLight(0x4ad6ff, .8, 120); fill.position.set(30, 14, 30); S.add(fill);
  workshop(S);
  var D = drone(); D.position.set(0, 0, 2); S.add(D);
  var G = guideDrone(); G.position.set(14, 16, -4); S.add(G);
  W.SBlin = function (root) { var seen = new Set(); root.traverse(function (o) { var m = o.material; if (!m || seen.has(m)) return; seen.add(m); if (m.color && !m.map) m.color.convertSRGBToLinear(); if (m.isMeshStandardMaterial) m.envMapIntensity = m.metalness > .5 ? .55 : .18; }); };
  W.SBlin(S);
  var cam = new THREE.PerspectiveCamera(38, w / h, .3, 800);
  return { r: r, S: S, D: D, P: D.userData.P, G: G, cam: cam, key: key, glow: glow, mesh: mesh, tube: tube, M: M, V: V, cTex: cTex, motor: motor, prop: prop, xt30: xt30, fc: fc, neon: neon, MP: MP,
    render: function () { r.render(S, cam); } };
};
})();
