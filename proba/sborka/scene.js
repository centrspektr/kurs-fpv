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

function frame() { var g = new THREE.Group();
  [45, -45].forEach(function (a) { var p = plate(2.0, 2 * ARM * 1.414 + 2.2, 1, .4, M.carbon); p.rotation.y = a * Math.PI / 180; p.castShadow = p.receiveShadow = true; g.add(p); });
  var c = plate(4.2, 7.4, .8, .4, M.carbon); c.castShadow = c.receiveShadow = true; g.add(c);
  MP.forEach(function (q) { for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; mesh(new THREE.CylinderGeometry(.12, .12, .06, 10), M.steel, q[0] + Math.cos(a) * .55, .46, q[1] + Math.sin(a) * .55, g); } });
  return g; }
function topPlate() { var p = plate(3.6, 6.6, .7, .2, M.carbon); p.castShadow = true; return p; }
function standoffs() { var g = new THREE.Group(); [[1.5, -2.6], [-1.5, -2.6], [1.5, 2.6], [-1.5, 2.6]].forEach(function (q) { mesh(new THREE.CylinderGeometry(.22, .22, 2.6, 6), M.alu, q[0], 1.7, q[1], g); }); return g; }
function motor() { var g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(.95, 1.0, .22, 28), M.dark, 0, .11, 0, g);
  mesh(new THREE.CylinderGeometry(.74, .74, .55, 24), M.copper, 0, .5, 0, g);
  var b = new THREE.Group(); b.position.y = .32; g.add(b);
  var side = new THREE.Mesh(new THREE.CylinderGeometry(.92, .92, .78, 32, 1, true), M.bell); side.position.y = .45; side.castShadow = true; b.add(side);
  mesh(new THREE.CylinderGeometry(.92, .92, .1, 32), M.bell, 0, .86, 0, b);
  for (var k = 0; k < 6; k++) { var s = mesh(new THREE.BoxGeometry(.32, .22, .02), M.chip, 0, .7, 0, b); var a = k * Math.PI / 3; s.position.x = Math.sin(a) * .925; s.position.z = Math.cos(a) * .925; s.rotation.y = a; }
  for (k = 0; k < 5; k++) { var sp = mesh(new THREE.BoxGeometry(.18, .04, .55), M.chip, 0, .92, 0, b); sp.rotation.y = k * Math.PI * 2 / 5; sp.position.x = Math.sin(sp.rotation.y) * .36; sp.position.z = Math.cos(sp.rotation.y) * .36; }
  mesh(new THREE.CylinderGeometry(.1, .1, .9, 10), M.steel, 0, 1.4, 0, g);
  mesh(new THREE.CylinderGeometry(.24, .24, .2, 6), M.steel, 0, 1.75, 0, g);
  g.userData.bell = b; return g; }
function chipOn(par, w, d, x, z, y, m) { return mesh(new THREE.BoxGeometry(w, .1, d), m || M.chip, x, y, z, par); }
function esc() { var g = new THREE.Group(); var p = plate(3.4, 3.4, .25, .12, M.pcbK); g.add(p);
  for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) chipOn(g, .45, .35, -1 + i * .66, -.4 + j * .8, .2);
  [[1.45, -1.45], [-1.45, -1.45], [-1.45, 1.45], [1.45, 1.45]].forEach(function (q) { for (var k = 0; k < 3; k++) { var o = (k - 1) * .32; var a = Math.abs(q[0]) > 0 ? 1 : 0; mesh(new THREE.BoxGeometry(.24, .05, .24), M.gold, q[0] * .92 + (q[1] > 0 ? o : -o) * .7, .19, q[1] * .92 + o * .7, g); } });
  mesh(new THREE.BoxGeometry(.6, .06, .5), M.gold, -.5, .19, 1.55, g); mesh(new THREE.BoxGeometry(.6, .06, .5), M.gold, .5, .19, 1.55, g);
  return g; }
function fc() { var g = new THREE.Group(); var p = plate(3.4, 3.4, .25, .12, M.pcbG); g.add(p);
  chipOn(g, .9, .9, 0, 0, .22); chipOn(g, .4, .4, .9, -.8, .22); chipOn(g, .55, .3, -.9, .9, .22); chipOn(g, .3, .3, -.9, -.8, .22);
  mesh(new THREE.BoxGeometry(.7, .32, .5), M.steel, -1.55, .3, .2, g);
  var led1 = mesh(new THREE.BoxGeometry(.14, .08, .14), neon(0x5effc4), .9, .22, .8, g), led2 = mesh(new THREE.BoxGeometry(.14, .08, .14), neon(0x4aa8ff), 1.15, .22, .8, g);
  var gl1 = glow('#5effc4', 1.1, .9); gl1.position.set(.9, .35, .8); g.add(gl1); var gl2 = glow('#4aa8ff', 1.1, .9); gl2.position.set(1.15, .35, .8); g.add(gl2);
  for (var k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(.2, .05, .2), M.gold, 1.45, .19, -1.2 + k * .45, g);
  return g; }
function vtx() { var g = new THREE.Group(); var p = plate(2.0, 2.0, .2, .1, M.pcbK); g.add(p); chipOn(g, .7, .7, 0, 0, .18, M.steel); mesh(new THREE.CylinderGeometry(.14, .14, .3, 10), M.gold, 0, .25, .85, g); return g; }
function camera() { var g = new THREE.Group();
  [-1, 1].forEach(function (s) { mesh(new THREE.BoxGeometry(.22, 2.3, 2.0), M.tpu, s * .86, 1.15, -.2, g); });
  mesh(new THREE.BoxGeometry(1.45, 1.45, 1.45), M.dark, 0, 1.2, 0, g);
  var l = mesh(new THREE.CylinderGeometry(.55, .6, .7, 24), M.chip, 0, 1.2, -1.0, g); l.rotation.x = Math.PI / 2;
  var gl = mesh(new THREE.CylinderGeometry(.42, .42, .05, 24), M.glass, 0, 1.2, -1.36, g); gl.rotation.x = Math.PI / 2;
  var gs = glow('#7aa8ff', .9, .6); gs.position.set(.15, 1.32, -1.42); g.add(gs);
  return g; }
function antenna() { var g = new THREE.Group(); var tp = plate(1.4, 1.2, .3, .7, M.tpu); g.add(tp);
  tube([V(0, .3, -.2), V(0, 1.2, .3), V(0, 2.2, 1.2), V(0, 2.8, 1.9)], .09, M.wireK, g);
  mesh(new THREE.CylinderGeometry(.42, .42, .5, 20), M.dark, 0, 3.0, 2.1, g).rotation.x = -.6;
  var dome = mesh(new THREE.SphereGeometry(.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.dark, 0, 3.15, 2.25, g); dome.rotation.x = -.6; return g; }
function rx() { var g = new THREE.Group(); var p = plate(1.0, 1.2, .15, .08, M.pcbK); g.add(p); var led = glow('#ff4f6a', .6, .9); led.position.set(.2, .2, .2); g.add(led);
  tube([V(0, .1, .5), V(-1, .3, 1.2), V(-2, .2, 2.4)], .04, M.wireK, g); tube([V(0, .1, .5), V(1, .3, 1.2), V(2, .2, 2.4)], .04, M.wireK, g); return g; }
function battLead() { var g = new THREE.Group(); tube([V(-.5, .2, 1.6), V(-.6, .3, 3), V(-.4, .4, 5), V(-.2, .5, 6.6)], .14, M.wireR, g); tube([V(.5, .2, 1.6), V(.6, .3, 3), V(.5, .4, 5), V(.25, .5, 6.6)], .14, M.wireK, g);
  var cap = mesh(new THREE.CylinderGeometry(.42, .42, 1.6, 20), M.chip, 1.2, .5, 3.4, g); cap.rotation.x = Math.PI / 2; mesh(new THREE.CylinderGeometry(.43, .43, .1, 20), M.steel, 1.2, .5, 2.6, g).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(1.1, .65, 1.3), M.yellow, 0, .5, 7.3, g); return g; }
function prop(col) { var g = new THREE.Group(), m = M.prop.clone(); m.color = new THREE.Color(col);
  for (var k = 0; k < 3; k++) { var s = new THREE.Shape(); s.moveTo(0, -.18); s.bezierCurveTo(1.2, -.55, 2.6, -.5, 3.8, -.18); s.bezierCurveTo(3.9, .05, 3.7, .3, 3.4, .32); s.bezierCurveTo(2.2, .5, 1, .4, 0, .2); s.lineTo(0, -.18);
    var geo = new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 1 }); geo.rotateX(-Math.PI / 2 + .25);
    var b = new THREE.Mesh(geo, m); b.rotation.y = k * Math.PI * 2 / 3; b.castShadow = true; g.add(b); }
  mesh(new THREE.CylinderGeometry(.45, .5, .55, 20), m, 0, 0, 0, g); return g; }

/* полный дрон: части по ключам, можно показывать по одной */
function drone() { var D = new THREE.Group(), P = {};
  P.frame = frame(); D.add(P.frame);
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
  P.wires = MP.map(function (q) { var g = new THREE.Group(), dx = Math.sign(q[0]), dz = Math.sign(q[1]); [-1, 0, 1].forEach(function (o, k) {
      var px = 1.45 * .92 * dx, pz = 1.45 * .92 * dz; tube([V(q[0] - dx * .3 + o * .15, .55, q[1] - dz * .3 - o * .15), V(q[0] * .6 + o * .12, .7, q[1] * .6 - o * .12), V(px * 1.3 + o * .2, 1.0, pz * 1.3 - o * .2), V(px + o * .22 * dz, 1.2, pz - o * .22 * dx)], .055, [M.wireK, M.wireK, M.wireK][k], g); }); D.add(g); return g; });
  P.props = MP.map(function (q, i) { var p = prop(i % 2 ? '#ff4fd8' : '#3ee6ff'); p.position.set(q[0], 2.4, q[1]); D.add(p); return p; });
  D.userData.P = P; return D; }

/* ---------- мастерская ---------- */
function workshop(S) { var R = new THREE.Group(); S.add(R);
  var fl = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: floorT, roughness: .8 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -80; fl.receiveShadow = true; R.add(fl);
  /* стол */
  var top = mesh(new THREE.BoxGeometry(150, 3, 70), M.bench, 0, -1.6, 0, R); top.receiveShadow = true;
  mesh(new THREE.BoxGeometry(150.4, .8, 70.4), M.benchEdge, 0, -.4 - .1, 0, R).receiveShadow = true;
  var neonEdge = mesh(new THREE.BoxGeometry(150, .25, .25), neon(0xc77dff), 0, -.6, 35.3, R);
  var mt = new THREE.Mesh(new THREE.PlaneGeometry(56, 40), new THREE.MeshStandardMaterial({ map: mat, roughness: .85 })); mt.rotation.x = -Math.PI / 2; mt.position.set(0, .02, 2); mt.receiveShadow = true; R.add(mt);
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
  /* паяльная станция */
  var st = new THREE.Group(); mesh(new THREE.BoxGeometry(13, 8, 11), new THREE.MeshStandardMaterial({ color: 0x1d1a2c, metalness: .4, roughness: .5 }), 0, 4, 0, st);
  var disp = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshBasicMaterial({ map: stationTex() })); disp.position.set(0, 5.2, 5.55); st.add(disp);
  var kn = mesh(new THREE.CylinderGeometry(1.1, 1.1, .8, 20), M.steel, 3.6, 2.4, 5.6, st); kn.rotation.x = Math.PI / 2;
  var sg = glow('#ff5a2a', 6, .5); sg.position.set(0, 5.2, 6); st.add(sg);
  /* подставка со спиралью */
  var pts = []; for (var i = 0; i < 120; i++) { var a = i / 120 * Math.PI * 14; pts.push(V(Math.cos(a) * 1.4, i / 120 * 7, Math.sin(a) * 1.4)); }
  var sp = new THREE.Group(); mesh(new THREE.CylinderGeometry(4, 4.5, 1.2, 24), M.benchEdge, 0, .6, 0, sp); tube(pts, .12, M.steel, sp).position.y = 1.2; mesh(new THREE.CylinderGeometry(2.4, 2.4, .8, 24), M.gold, 2.6, 1.3, 2.4, sp);
  sp.position.set(18, 0, -2); st.add(sp); st.position.set(24, 0, -14); st.rotation.y = -.6; R.add(st);
  /* катушка припоя, флюс */
  var sl = mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.4, 28), new THREE.MeshStandardMaterial({ color: 0x9aa3b5, metalness: .9, roughness: .3 }), 19, 1.2, 16, R); mesh(new THREE.CylinderGeometry(3.2, 3.2, .3, 28), M.benchEdge, 19, 2.5, 16, R); mesh(new THREE.CylinderGeometry(3.2, 3.2, .3, 28), M.benchEdge, 19, 0, 16, R);
  var fx = mesh(new THREE.CylinderGeometry(1.6, 1.6, 6, 20), new THREE.MeshStandardMaterial({ color: 0xffd166, transparent: true, opacity: .75, roughness: .1 }), -19, 3, -4, R); mesh(new THREE.CylinderGeometry(.6, 1.2, 2.2, 16), new THREE.MeshStandardMaterial({ color: 0xff4f6a }), -19, 7, -4, R);
  /* органайзер с деталями */
  var org = new THREE.Group(); mesh(new THREE.BoxGeometry(20, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x241f38, roughness: .5 }), 0, .8, 0, org);
  for (var c = 0; c < 4; c++) for (var r = 0; r < 2; r++) { mesh(new THREE.BoxGeometry(.3, 2, 12), M.benchEdge, -10 + c * 5, 1.4, 0, org); var cnt = [0xc77dff, 0xffd166, 0x5effc4, 0xff4fd8][c]; for (var k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(.45, 10, 8), new THREE.MeshStandardMaterial({ color: cnt, metalness: .6, roughness: .3 }), -7.5 + c * 5 + (k % 2) * 1.2 - .6, 1.9, -3 + r * 6 + (k > 1 ? 1 : -1), org); }
  org.position.set(-14, 0, 17); org.rotation.y = .35; R.add(org);
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
  var key = new THREE.SpotLight(0xffe2c0, 2.2, 160, .55, .6, 1); key.position.set(-18, 34, 6); key.target.position.set(2, 0, 2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.radius = 4; S.add(key, key.target);
  var rim = new THREE.PointLight(0xc77dff, 1.4, 120); rim.position.set(20, 30, -30); S.add(rim);
  var fill = new THREE.PointLight(0x4ad6ff, .8, 120); fill.position.set(30, 14, 30); S.add(fill);
  workshop(S);
  var D = drone(); D.position.set(0, 0, 2); S.add(D);
  var G = guideDrone(); G.position.set(14, 16, -4); S.add(G);
  W.SBlin = function (root) { var seen = new Set(); root.traverse(function (o) { var m = o.material; if (!m || seen.has(m)) return; seen.add(m); if (m.color && !m.map) m.color.convertSRGBToLinear(); if (m.isMeshStandardMaterial) m.envMapIntensity = m.metalness > .5 ? .55 : .18; }); };
  W.SBlin(S);
  var cam = new THREE.PerspectiveCamera(38, w / h, .1, 800);
  return { r: r, S: S, D: D, P: D.userData.P, G: G, cam: cam, key: key, glow: glow, mesh: mesh, tube: tube, M: M, V: V, cTex: cTex, motor: motor, prop: prop, fc: fc, neon: neon, MP: MP,
    render: function () { r.render(S, cam); } };
};
})();
