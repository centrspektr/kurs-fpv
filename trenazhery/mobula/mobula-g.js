/* mobula-g.js - новая графика (11.11.2026, стиль А "тёмная студия", нужен ../studiya.js): тот же тренажёр, перерисованы дрон и сцена.
   mobula.js - тренажёр "Mobula 7: дрон первых гонок" (модуль 5, по фото владельца 09.11.2026).
   3D-дрон на подиуме в гоночном зале. Три части:
     1) Знакомство - светящиеся точки на дроне: размер 75 мм и защитные кольца, винты, моторы, плата F4 + ELRS, камера и видео 5,8 ГГц, антенна, АКБ GNB 850 1S, вес.
     2) К заезду - готовим дрон сами: найти треснувший винт, выбрать заряженную АКБ, вставить и подключить, поставить видеоканал от судьи, вылет по трассе.
     3) Почему на нём начинают гонки - короткие вопросы.
   Детский вариант (window.PULT_KID) - короче и проще. Пройдено: window.SBG.st().stage === 'done'. Кнопка "←" = history.back(). */
(function () {
'use strict';
var T = THREE, KID = !!window.PULT_KID;
var A = '#ff9b3d', Y = '#ffd36e', GR = '#9dff7c', BL = '#5ab4ff', PK = '#ff7ce0';
var CFG = window.KURSY || {}, KEY = (CFG.store || 'kursy') + '_mobula';
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ---------- сцена ---------- */
var cv = document.getElementById('c');
var ren = new T.WebGLRenderer({ canvas: cv, antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.0;
var sc = new T.Scene();
var pm = new T.PMREMGenerator(ren), ENV = pm.fromScene(new T.RoomEnvironment(), .04).texture; /* envMap в каждом материале: в r128 envMapIntensity работает только так */
var cam = new T.PerspectiveCamera(42, 1, .05, 60);
function resize() { var w = innerWidth, h = innerHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 60 : 40; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
var STU = STUDIYA(ren, sc, { size: 1.5, rimA: '#ff9b3d', rimB: '#5ab4ff', rings: [1.1, 1.5] }); /* общая тёмная студия */
function std(c, r, m, o) { var x = new T.MeshStandardMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r == null ? .5 : r, metalness: m || 0, envMap: ENV, envMapIntensity: .35 }); if (o) Object.assign(x, o); return x; }
function neon(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.5), toneMapped: false }); }
function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; t.redraw = function (d) { (d || draw)(x, w, h); t.needsUpdate = true; }; return t; }
function txt(c, s, x, y, sz, col, al, wt) { c.font = (wt || 800) + ' ' + sz + 'px Manrope, "Segoe UI", sans-serif'; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }

/* ворота: квадратная рамка из светящихся труб на ножках */
var gates = [];
function gate(x, z, ry, col) { var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; sc.add(g); var m = neon(col, 1.3), s = 1.1;
  [[0, s * 2, s * 2.1, .05], [-s, s, .05, s * 2], [s, s, .05, s * 2]].forEach(function (q) { var b = new T.Mesh(new T.BoxGeometry(q[2], q[3], .05), m); b.position.set(q[0], q[1] + .1, 0); g.add(b); });
  [-s, s].forEach(function (xx) { var f = new T.Mesh(new T.BoxGeometry(.25, .04, .25), std('#222', .6)); f.position.set(xx, .02, 0); g.add(f); });
  gates.push(g); return g; }
gate(-3.2, -3.6, .5, A); gate(3.4, -4.2, -.4, BL); gate(4.6, 1.2, -1.4, PK);
var flag = new T.Group(); flag.position.set(-4.4, 0, .6); sc.add(flag);
var pole = new T.Mesh(new T.CylinderGeometry(.03, .03, 2.4, 8), std('#ddd', .3, .6)); pole.position.y = 1.2; flag.add(pole);
var cloth = new T.Mesh(new T.PlaneGeometry(.5, 1.6, 6, 6), new T.MeshStandardMaterial({ color: new T.Color(Y).convertSRGBToLinear(), side: T.DoubleSide, roughness: .8 })); cloth.position.set(.26, 1.5, 0); flag.add(cloth);
/* подиум */
/* подиум: тёмный диск со светящейся кромкой */
var pod = new T.Mesh(new T.LatheGeometry([[0, 0], [1.24, 0], [1.26, .03], [1.2, .26], [1.16, .3], [0, .3]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 96), std('#12101a', .38, .5, { envMapIntensity: .5 })); sc.add(pod);
var podTop = new T.Mesh(new T.CylinderGeometry(1.14, 1.14, .01, 96), new T.MeshStandardMaterial({ map: tex(512, 512, function (c, w, h) { c.fillStyle = '#100d18'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff9b3d3a'; c.lineWidth = 2; for (var r = 40; r < 256; r += 40) { c.beginPath(); c.arc(256, 256, r, 0, 7); c.stroke(); } }), roughness: .97, envMap: ENV, envMapIntensity: .04 })); podTop.position.y = .302; sc.add(podTop);
var podRing = new T.Mesh(new T.TorusGeometry(1.16, .01, 8, 128), neon(A, 1.2)); podRing.rotation.x = Math.PI / 2; podRing.position.y = .3; sc.add(podRing);
pod.castShadow = pod.receiveShadow = true; podTop.receiveShadow = true;
/* ---------- Mobula 7 (по фото: дымчатая рама-кольца, двухлопастные винты, медные обмотки моторов) ---------- */
var M = new T.Group(); M.position.set(0, .42, 0); sc.add(M);
function phys(c, r, o) { var x = new T.MeshPhysicalMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r, clearcoat: .7, clearcoatRoughness: .2, envMap: ENV, envMapIntensity: .5 }); if (o) Object.assign(x, o); return x; }
var plastic = phys('#2c2e35', .4), dark = std('#111115', .5, .1), metal = std('#c9ccd4', .25, .95, { envMapIntensity: 1 }), gold = std('#d9a441', .3, .9), copper = std('#c8743a', .35, .9, { envMapIntensity: .9 });
var frameM = phys('#34373f', .28, { transparent: true, opacity: .86, side: T.DoubleSide });
var MX = .29; /* моторы по углам квадрата: диагональ ~ 75 мм */
var MOT = [[MX, -MX], [-MX, -MX], [MX, MX], [-MX, MX]];
var props = [], crackProp = 3;
var ductG = new T.LatheGeometry([[.226, -.032], [.234, -.04], [.243, -.03], [.246, .06], [.24, .084], [.231, .086], [.227, .07], [.226, -.032]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 96);
var bladeG = (function () { var s = new T.Shape(); s.moveTo(.012, -.014); s.bezierCurveTo(.07, -.07, .16, -.06, .205, -.02); s.bezierCurveTo(.22, 0, .2, .022, .17, .026); s.bezierCurveTo(.1, .04, .05, .03, .012, .014);
  var g = new T.ExtrudeGeometry(s, { depth: .003, bevelEnabled: true, bevelThickness: .0015, bevelSize: .002, bevelSegments: 2, curveSegments: 16 }); g.rotateX(-Math.PI / 2);
  var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), z = p.getZ(i), tw = .5 - x * 1.6; p.setY(i, p.getY(i) - z * Math.sin(tw)); p.setZ(i, z * Math.cos(tw)); } g.computeVertexNormals(); return g; })();
var bellG = new T.LatheGeometry([[0, .012], [.03, .012], [.046, .006], [.049, -.002], [.049, -.012], [.044, -.012], [.044, -.002], [0, .002]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 40);
var coilT = tex(256, 32, function (c, w, h) { for (var i = 0; i < 9; i++) { var g = c.createLinearGradient(i * w / 9, 0, (i + 1) * w / 9, 0); g.addColorStop(0, '#5a2c12'); g.addColorStop(.5, '#e89a55'); g.addColorStop(1, '#5a2c12'); c.fillStyle = g; c.fillRect(i * w / 9, 0, w / 9 - 3, h); c.fillStyle = '#120a06'; c.fillRect((i + 1) * w / 9 - 3, 0, 3, h); } });
MOT.forEach(function (q, i) {
  var g = new T.Group(); g.position.set(q[0], 0, q[1]); M.add(g);
  var duct = new T.Mesh(ductG, frameM); g.add(duct);
  /* три тонкие спицы от мотора к кольцу */
  var a0 = Math.atan2(-q[1], -q[0]);
  for (var k = 0; k < 3; k++) { var sp = new T.Mesh(new T.BoxGeometry(.2, .014, .012), frameM); var a = a0 + k * 2.094; sp.position.set(Math.cos(a) * .135, -.026, Math.sin(a) * .135); sp.rotation.y = -a; g.add(sp); }
  var mnt = new T.Mesh(new T.CylinderGeometry(.052, .056, .014, 32), frameM); mnt.position.y = -.026; g.add(mnt);
  /* мотор: основание, медные обмотки, колокол с прорезями, вал */
  var st = new T.Mesh(new T.CylinderGeometry(.046, .05, .012, 32), dark); st.position.y = -.012; g.add(st);
  var coil = new T.Mesh(new T.CylinderGeometry(.04, .04, .03, 32, 1, true), new T.MeshStandardMaterial({ map: coilT, roughness: .4, metalness: .8, envMap: ENV, envMapIntensity: .8 })); coil.position.y = .008; g.add(coil);
  var bell = new T.Mesh(bellG, std('#26262c', .3, .8, { envMapIntensity: .9 })); bell.position.y = .034; g.add(bell);
  var bring = new T.Mesh(new T.CylinderGeometry(.049, .049, .008, 32, 1, true), std('#26262c', .3, .8, { envMapIntensity: .9, side: T.DoubleSide })); bring.position.y = -.002; g.add(bring);
  var cap = new T.Mesh(new T.CylinderGeometry(.007, .007, .04, 12), metal); cap.position.y = .06; g.add(cap);
  /* провода мотора к центру */
  var wire = new T.Mesh(new T.CylinderGeometry(.005, .005, .2, 8), std('#0c0c0e', .6)); wire.rotation.z = Math.PI / 2; wire.rotation.y = Math.atan2(q[1], -q[0]); wire.position.set(-q[0] * .3, -.012, -q[1] * .3); g.add(wire);
  /* винт 40 мм, две лопасти, полупрозрачный серый */
  var pr = new T.Group(); pr.position.y = .065; g.add(pr);
  var pm2 = phys(i === crackProp ? '#a9a2a0' : '#9aa0a8', .2, { transparent: true, opacity: .62, depthWrite: false, side: T.DoubleSide });
  for (var b = 0; b < 2; b++) { var bl = new T.Mesh(bladeG, pm2); bl.rotation.y = b * Math.PI; pr.add(bl); }
  var hub = new T.Mesh(new T.CylinderGeometry(.02, .024, .022, 24), pm2); pr.add(hub);
  if (i === crackProp) { var crack = new T.Mesh(new T.BoxGeometry(.004, .008, .05), neon('#ff3b4e', 1.6)); crack.position.set(.13, .006, .0); crack.rotation.y = .4; pr.add(crack); pr.userData.crack = crack; }
  props.push(pr);
});
/* рама: перемычки между кольцами и центральная площадка */
[[0, -MX, .13, .03], [0, MX, .13, .03], [-MX, 0, .03, .13], [MX, 0, .03, .13]].forEach(function (q) { var b = new T.Mesh(new T.BoxGeometry(q[2], .05, q[3]), frameM); b.position.set(q[0], .03, q[1]); M.add(b); });
var plate = new T.Mesh(STUDIYA.rbox(.3, .3, .02, .05), frameM); plate.rotation.set(-Math.PI / 2, 0, Math.PI / 4); plate.position.y = -.012; M.add(plate);
MOT.forEach(function (q) { var arm = new T.Mesh(new T.BoxGeometry(.04, .018, .3), frameM); arm.position.set(q[0] / 2, -.012, q[1] / 2); arm.rotation.y = Math.atan2(q[0], q[1]); M.add(arm); });
/* плата AIO: F4 + регуляторы + ELRS (повёрнута ромбом, как на фото) */
var fcT = tex(512, 512, function (c, w, h) { c.fillStyle = '#0d1114'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1f3a2e'; c.lineWidth = 3; for (var j = 0; j < 40; j++) { var x = Math.random() * w, y = Math.random() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y); c.lineTo(x + 80, y + 20); c.stroke(); }
  c.fillStyle = '#23292f'; c.fillRect(150, 150, 212, 212); txt(c, 'F4', 256, 236, 76, '#93a0ad'); txt(c, 'ELRS', 256, 312, 40, '#6f7c88');
  c.fillStyle = '#e0ae4a'; for (var i = 0; i < 4; i++) { var px = i % 2 ? 420 : 44, py = i < 2 ? 44 : 420; c.fillRect(px, py, 48, 48); c.fillStyle = '#e0ae4a'; } c.fillStyle = '#3a4048'; for (var k = 0; k < 8; k++) c.fillRect(60 + k * 50, 470, 30, 18); c.fillStyle = '#c9ccd4'; for (var m = 0; m < 30; m++) c.fillRect(40 + Math.random() * 430, 40 + Math.random() * 430, 8, 5); });
var fc = new T.Mesh(new T.BoxGeometry(.21, .012, .21), [dark, dark, new T.MeshStandardMaterial({ map: fcT, roughness: .45, metalness: .2, envMap: ENV, envMapIntensity: .3 }), dark, dark, dark]); fc.position.y = .02; fc.rotation.y = Math.PI / 4; M.add(fc);
var led = new T.Mesh(new T.BoxGeometry(.02, .012, .02), neon('#222', 1)); led.position.set(.1, .03, 0); M.add(led);
/* канопи и камера: гладкий колпак с вырезом под объектив */
var canopy = new T.Mesh(new T.LatheGeometry([[.118, 0], [.122, .02], [.112, .07], [.085, .112], [.045, .132], [0, .136]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 48), phys('#1a1b20', .32)); canopy.scale.set(1, 1, 1.22); canopy.position.y = .022; M.add(canopy);
var camG = new T.Group(); camG.position.set(0, .088, -.118); camG.rotation.x = .35; M.add(camG);
var hood = new T.Mesh(new T.CylinderGeometry(.048, .052, .06, 32), phys('#1a1b20', .32)); hood.rotation.x = Math.PI / 2; hood.position.z = .01; camG.add(hood);
var lens = new T.Mesh(new T.CylinderGeometry(.032, .036, .05, 32), std('#08080a', .3, .5, { envMapIntensity: .8 })); lens.rotation.x = Math.PI / 2; lens.position.z = -.04; camG.add(lens);
var glass = new T.Mesh(new T.SphereGeometry(.03, 24, 12, 0, Math.PI * 2, 0, .9), new T.MeshPhysicalMaterial({ color: new T.Color('#0a1836').convertSRGBToLinear(), roughness: .02, metalness: .6, clearcoat: 1, clearcoatRoughness: 0, envMap: ENV, envMapIntensity: 2 })); glass.rotation.x = -Math.PI / 2; glass.position.z = -.046; camG.add(glass);
/* антенна сзади */
var antG = new T.Group(); antG.position.set(0, .07, .14); antG.rotation.x = -.7; M.add(antG);
var aw = new T.Mesh(new T.CylinderGeometry(.005, .005, .18, 8), std('#d33', .5)); aw.position.y = .09; antG.add(aw);
var at = new T.Mesh(new T.CylinderGeometry(.011, .011, .06, 12), dark); at.position.y = .2; antG.add(at);
/* АКБ GNB 850 1S: фиолетовая, снизу в держателе */
var batT = tex(512, 128, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#6b2fbf'); g.addColorStop(1, '#b46bff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#fff'; c.fillRect(0, h * .62, w, h * .38); txt(c, 'GNB', 60, h * .32, 44, '#fff', 'center', 900); txt(c, '850', 360, h * .32, 64, '#fff', 'center', 900); txt(c, 'mAh', 450, h * .4, 22, '#fff');
  txt(c, '1S 3.8V HV · LiHV · 60C', w / 2, h * .81, 26, '#3a1a6a', 'center', 800); });
var BAT_IN = new T.Vector3(0, -.075, .02), BAT_OUT = new T.Vector3(.75, -.06, .35);
var bat = new T.Group(); M.add(bat);
var batM = new T.Mesh(new T.BoxGeometry(.13, .07, .42), [std('#5a2aa0', .45), std('#5a2aa0', .45), new T.MeshStandardMaterial({ map: batT, roughness: .45, envMap: ENV, envMapIntensity: .3 }), std('#5a2aa0', .45), std('#7a3ad0', .45), std('#5a2aa0', .45)]);
batM.material[2].map.rotation = Math.PI / 2; batM.material[2].map.center.set(.5, .5); bat.add(batM);
var bw = new T.Mesh(new T.CylinderGeometry(.008, .008, .12, 6), std('#c22', .5)); bw.rotation.x = Math.PI / 2; bw.position.set(-.02, .01, -.26); bat.add(bw);
var bw2 = bw.clone(); bw2.material = std('#111', .5); bw2.position.x = .02; bat.add(bw2);
var plug = new T.Mesh(new T.BoxGeometry(.05, .03, .04), std('#f2f2ea', .5)); plug.position.set(0, .01, -.33); bat.add(plug);
var holder = new T.Mesh(new T.BoxGeometry(.16, .015, .36), dark); holder.position.set(0, -.03, .02); M.add(holder);
/* гнездо на дроне для разъёма */
var sock = new T.Mesh(new T.BoxGeometry(.055, .032, .04), std('#e8e8de', .5)); sock.position.set(0, -.03, -.26); M.add(sock);
var BAT_STATE = { inside: true, plugged: true };
function placeBat(inside) { bat.position.copy(inside ? BAT_IN : BAT_OUT); bat.rotation.set(0, inside ? 0 : .6, 0); BAT_STATE.inside = inside; }
placeBat(true);
STUDIYA.shadows(M);
/* подсветка-кольцо для "нажми сюда" */
var hl = new T.Mesh(new T.RingGeometry(.07, .09, 32), neon(Y, 1.6)); hl.visible = false; hl.renderOrder = 12; hl.material.depthTest = false; sc.add(hl);

/* ---------- камера ---------- */
var orb = { th: .5, ph: .42, r: 2.6, tgt: new T.Vector3(0, .45, 0) }, fly = null, auto = true;
function camPose() { return new T.Vector3(orb.tgt.x + orb.r * Math.sin(orb.th) * Math.cos(orb.ph), orb.tgt.y + orb.r * Math.sin(orb.ph), orb.tgt.z + orb.r * Math.cos(orb.th) * Math.cos(orb.ph)); }
function goCam(th, ph, r, tgt, d) { auto = false; fly = { a: { th: orb.th, ph: orb.ph, r: orb.r, t: orb.tgt.clone() }, b: { th: th, ph: ph, r: r, t: tgt.clone() }, k: 0, d: d || 1 }; }
var down = null;
cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, th: orb.th, ph: orb.ph, m: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
cv.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 6) down.m = true;
  if (down.m && !fly) { auto = false; orb.th = down.th - dx * .006; orb.ph = Math.max(.05, Math.min(1.35, down.ph + dy * .005)); } });
cv.addEventListener('pointerup', function (e) { var d = down; down = null; if (d && !d.m) tap(e.clientX, e.clientY); });
cv.addEventListener('wheel', function (e) { orb.r = Math.max(.9, Math.min(5, orb.r + e.deltaY * .002)); }, { passive: true });

/* ---------- точки-подсказки ---------- */
var HS = KID ? [
  { id: 'duct', p: [MX + .2, .09, -MX], h: 'Защитные кольца', t: 'Винты спрятаны в кольца. Если дрон заденет ворота или человека - винт не поранит. Поэтому на нём можно летать <b>в зале</b>.' },
  { id: 'prop', p: [-MX, .1, MX], h: 'Винты', t: 'Маленькие винты по 4 см. Перед каждым полётом смотрим: нет ли трещин. Треснувший винт меняем.' },
  { id: 'cam', p: [0, .16, -.17], h: 'Камера', t: 'Смотрит вперёд. Картинка летит прямо в очки пилота - пилот видит то, что видит дрон.' },
  { id: 'brain', p: [.06, .1, .06], h: 'Мозг дрона', t: 'Под колпачком плата - полётный контроллер. Он слушает пульт и крутит моторы. Настраивают его в программе Betaflight.' },
  { id: 'bat', p: [0, -.13, .1], h: 'Аккумулятор 1S', t: 'Одна банка (1S), 850 мАч. Полный - 4,35 В. Летает 3-5 минут. Заряжаем на нашей зарядке в модуле 3.' },
  { id: 'kg', p: [-MX - .22, .05, -MX], h: 'Лёгкий', t: 'Весь дрон с аккумулятором - меньше 50 граммов - легче куриного яйца. Поэтому он почти безопасен.' }
] : [
  { id: 'duct', p: [MX + .2, .09, -MX], h: 'Класс tiny whoop, 75 мм', t: '75 мм - расстояние между осями моторов по диагонали. Винты в защитных кольцах (дактах): удар о ворота или человека почти не опасен. Это класс <b>tiny whoop</b> - вупы.' },
  { id: 'prop', p: [-MX, .1, MX], h: 'Винты 40 мм', t: 'Трёхлопастные, около 40 мм. Ставятся на вал мотора с натягом. Перед вылетом осмотр: трещина или скол - заменить, иначе вибрации и дрон "дёргается".' },
  { id: 'mot', p: [MX, .1, MX - .12], h: 'Моторы', t: 'Крошечные бесколлекторные моторы (типоразмер 0702) с очень высокими оборотами. Два крутятся по часовой, два против - иначе дрон закрутит.' },
  { id: 'brain', p: [.06, .1, .06], h: 'Плата "всё в одном"', t: 'На одной плате: полётный контроллер <b>F4</b>, 4 регулятора моторов и приёмник <b>ELRS</b> (связь с пультом). Настраивается в <b>Betaflight</b>: режимы, тумблеры, фильтры.' },
  { id: 'cam', p: [0, .16, -.17], h: 'Камера и видео 5,8 ГГц', t: 'Аналоговая камера с наклоном вверх и видеопередатчик 5,8 ГГц. На гонке <b>канал выдаёт судья</b>: у каждого пилота свой, чтобы не мешать чужому видео.' },
  { id: 'ant', p: [0, .26, .3], h: 'Антенна', t: 'Антенна видеопередатчика. Её не загибаем и не обрезаем: без антенны передатчик перегревается и картинка пропадает.' },
  { id: 'bat', p: [0, -.13, .1], h: 'АКБ GNB 850 мАч 1S HV', t: 'Одна банка LiHV: номинал 3,8 В, полная <b>4,35 В</b>, после полёта не ниже 3,3 В. 850 мАч - это 4-5 минут полёта. Заряд - на зарядке из модуля 3 током до 0,8 А.' },
  { id: 'kg', p: [-MX - .22, .05, -MX], h: 'Около 45 г', t: 'С аккумулятором - меньше 50 граммов. Лёгкий, дешёвый в ремонте, летает в спортзале. Поэтому на вупах проводят гонки начального уровня.' },
  { id: 'cls', p: [0, .3, 0], h: 'Почему для первых гонок', t: 'В классе вупов у всех почти одинаковые дроны: 1S, 75 мм, защита винтов. Побеждает <b>техника пилота</b>, а навыки - ворота, линия, старт - те же, что у больших дронов.' }
];
function dotT(col) { return tex(128, 128, function (c, w, h) { var g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, '#fff'); g.addColorStop(.25, col); g.addColorStop(.6, col + '55'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(0, 0, w, h); }); }
var hsM = HS.map(function (h) { var s = new T.Sprite(new T.SpriteMaterial({ map: dotT(Y), depthTest: false, toneMapped: false })); s.scale.setScalar(.08); s.position.fromArray(h.p); M.add(s); s.userData.hs = h; s.renderOrder = 10; return s; });
var seen = {};
var ray = new T.Raycaster(), v2 = new T.Vector2();
function pickAt(x, y, list) { v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, cam); return ray.intersectObjects(list, true)[0]; }
function tap(x, y) {
  if (MODE === 'learn') { var hit = pickAt(x, y, hsM.filter(function (s) { return s.visible; })); if (hit) showHS(hit.object.userData.hs); return; }
  if (MODE === 'prep' && prep.tapList) { var h2 = pickAt(x, y, prep.tapList.concat(hl.visible ? [hl] : [])); if (h2) prep.onTap(); } }
function showHS(h) { seen[h.id] = 1; var s = hsM.find(function (m) { return m.userData.hs === h; }); s.material.map = dotT(GR); s.material.needsUpdate = true;
  var wp = new T.Vector3().fromArray(h.p); M.localToWorld(wp);
  goCam(Math.atan2(wp.x, wp.z + .8) * .8 + .2, .5, 1.25, wp, .9);
  var n = Object.keys(seen).length;
  bubble('<span class="chip">' + n + ' ИЗ ' + HS.length + '</span><br><b>' + h.h + '.</b> ' + h.t, '');
  say(h.h + '. ' + h.t.replace(/<[^>]+>/g, ''));
  actions([{ t: 'Весь дрон', f: function () { goCam(orb.th, .42, 2.6, new T.Vector3(0, .45, 0)); } }].concat(n >= HS.length ? [{ t: 'Дальше: к заезду →', cls: 'pri', f: partPrep }] : []));
  progress(); }

/* ---------- интерфейс ---------- */
var ui = document.getElementById('ui');
function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
var bub = el('div', 'bub glass'); ui.appendChild(bub);
var bar = el('div', 'acts'); ui.appendChild(bar);
var bars = el('div', 'bars'); ui.appendChild(bars);
function bubble(h, cls) { bub.className = 'bub glass' + (cls ? ' ' + cls : ''); bub.innerHTML = h; bub.hidden = false; }
function actions(list) { bar.innerHTML = ''; list.forEach(function (a) { var b = el('button', 'tb' + (a.cls ? ' ' + a.cls : ''), a.t); b.onclick = function () { a.f(b); }; bar.appendChild(b); }); }
function say(s) { if (window.GOLOS && GOLOS.on) GOLOS.say(window.VSLUH ? VSLUH(s) : s.replace(/<[^>]+>/g, '')); } /* VSLUH (../vsluh.js): единицы, дроби и ударения для голоса */
var PARTS = ['Знакомство', 'К заезду', 'Вопросы'], part = 0, MODE = 'learn';
function progress() { bars.innerHTML = PARTS.map(function (p, i) { var k = i < part ? 1 : i > part ? 0 : (part === 0 ? Object.keys(seen).length / HS.length : part === 1 ? prep.i / prep.list.length : qz.i / qz.list.length); return '<i><b style="width:' + Math.round(k * 100) + '%"></b><span>' + p + '</span></i>'; }).join(''); }

/* ---------- часть 1 ---------- */
function partLearn() { MODE = 'learn'; part = 0; hsM.forEach(function (s) { s.visible = true; });
  bubble('<span class="chip">MOBULA 7 · 1S · 75 ММ</span><br>' + (KID ? 'Это наш гоночный дрон для зала. Нажимай на <b>жёлтые точки</b> - расскажу, что где.' : 'Вуп Mobula 7 - на таких летают первые гонки в зале. Нажимай на <b>жёлтые точки</b>, крути дрон пальцем.'), '');
  say(KID ? 'Это наш гоночный дрон для зала. Нажимай на жёлтые точки.' : 'Мобула семь - дрон для первых гонок. Нажимай на жёлтые точки.');
  actions([]); progress(); }

/* ---------- часть 2: к заезду ---------- */
var CH = KID ? 'R3' : 'R3';
var prep = { i: 0, tapList: null, onTap: null, list: [
  { id: 'prop', q: KID ? 'Осмотри винты. Один треснул - <b>нажми на него</b>, заменим.' : 'Предполётный осмотр: один винт с трещиной. <b>Найди и нажми</b> - заменим до вылета.',
    tap: function () { return [props[crackProp]]; }, at: function () { var v = new T.Vector3(); props[crackProp].getWorldPosition(v); return v; },
    cam: [Math.PI * .8, .7, 1.4, new T.Vector3(-MX, .45, MX)],
    done: function (next) { var p = props[crackProp], t0 = performance.now(); (function an() { var k = (performance.now() - t0) / 900; p.position.y = .065 + Math.sin(Math.min(1, k) * Math.PI) * .25; if (k > .5 && p.userData.crack) { p.remove(p.userData.crack); p.userData.crack = null; p.children.forEach(function (b) { if (b.material) b.material.color.set('#9aa0a8').convertSRGBToLinear(); }); } if (k < 1) requestAnimationFrame(an); else { p.position.y = .065; next(KID ? 'Новый винт стоит.' : 'Винт заменён: снимается и ставится на вал мотора с натягом.'); } })(); } },
  { id: 'bat', q: KID ? 'Какой аккумулятор взять на заезд?' : 'Возьми АКБ для заезда. Какую?', choose: [
      ['4,35 В - полная, ровная', 1, 'Полная LiHV-банка: 4,35 В.'],
      ['3,45 В - после прошлого полёта', 0, KID ? 'Она почти пустая: дрон быстро сядет.' : 'Почти разряжена: на трассе просядет и дрон сядет на полпути.'],
      ['4,30 В, но вздулась', 0, KID ? 'Вздутую не берём никогда! Отдаём тренеру.' : 'Вздутая АКБ опасна: в работу не берём, отдаём тренеру на утилизацию.']] },
  { id: 'ins', q: KID ? 'Нажми на аккумулятор - вставим его в дрон снизу.' : 'Вставь АКБ в держатель снизу: <b>нажми на неё</b>.', pre: function () { placeBat(false); BAT_STATE.plugged = false; }, tap: function () { return [batM]; }, at: function () { var v = new T.Vector3(); batM.getWorldPosition(v); return v; },
    cam: [.9, .35, 1.8, new T.Vector3(.3, .35, .15)],
    done: function (next) { var a = bat.position.clone(), t0 = performance.now(); (function an() { var k = Math.min(1, (performance.now() - t0) / 900), e = k * k * (3 - 2 * k); bat.position.lerpVectors(a, BAT_IN, e); bat.position.y += Math.sin(k * Math.PI) * .2; bat.rotation.y = .6 * (1 - e); if (k < 1) requestAnimationFrame(an); else { placeBat(true); next('АКБ в держателе.'); } })(); } },
  { id: 'plug', q: KID ? 'Подключи: нажми на белый разъём.' : 'Подключи разъём. Потом <b>3 секунды не трогай</b> дрон: гироскоп калибруется.', tap: function () { return [plug, sock]; }, at: function () { var v = new T.Vector3(); sock.getWorldPosition(v); return v; },
    cam: [-.3, .25, 1.2, new T.Vector3(0, .35, -.25)],
    done: function (next) { BAT_STATE.plugged = true; led.material.color.set(BL).multiplyScalar(1.6); beepT = 1.2; next(KID ? 'Пип-пип! Дрон проснулся. Синий огонёк - всё в порядке.' : 'Пип-пип: регуляторы проснулись, огонёк платы горит. Ждём 3 секунды неподвижно.'); } },
  { id: 'vtx', q: KID ? 'Судья сказал: твой канал <b>R3</b>. Выбери его.' : 'Судья выдал тебе видеоканал <b>R3 (5732 МГц)</b>. Поставь его.', choose: [
      ['R1 · 5658', 0, 'R1 у другого пилота: ты забьёшь ему картинку.'], ['R3 · 5732', 1, 'Твой канал: картинка чистая и никому не мешаешь.'], ['R8 · 5917', 0, 'Не твой канал: на гонке летим только на выданном.']] },
  { id: 'go', q: KID ? 'Всё готово! Нажми "На старт" - дрон пролетит трассу.' : 'Дрон готов: винты, АКБ, канал. <b>"На старт"</b> - пролёт по трассе в зале.', start: 1 }
] };
var beepT = 0, flight = null;
function partPrep() { MODE = 'prep'; part = 1; prep.i = 0; hsM.forEach(function (s) { s.visible = false; }); prepAsk(); progress(); }
function prepAsk() { var s = prep.list[prep.i]; prep.tapList = null; hl.visible = false; if (s.pre) s.pre();
  if (s.cam) goCam(s.cam[0], s.cam[1], s.cam[2], s.cam[3], 1);
  bubble('<span class="chip">ШАГ ' + (prep.i + 1) + ' ИЗ ' + prep.list.length + '</span><br>' + s.q, ''); say(s.q.replace(/<[^>]+>/g, ''));
  if (s.choose) { actions(s.choose.map(function (o) { return { t: o[0], cls: 'w', f: function (b) { if (o[1]) { b.classList.add('ok'); prepNext(o[2]); } else { b.classList.add('no'); bubble('<span class="chip">НЕ ТО</span><br>' + o[2], 'bad'); say(o[2]); } } }; })); return; }
  if (s.start) { actions([{ t: '🏁 На старт', cls: 'pri', f: startFlight }]); return; }
  actions([]); prep.tapList = s.tap(); prep.onTap = function () { prep.tapList = null; hl.visible = false; s.done(prepNext); }; hl.visible = true; }
function prepNext(msg) { prep.i++; progress(); bubble('<span class="chip">ВЕРНО</span><br>' + msg, 'ok'); say(msg); actions([]); setTimeout(prepAsk, 1400); }
/* пролёт: старт с подиума, три ворот, флаг, посадка */
var path = new T.CatmullRomCurve3([new T.Vector3(0, .42, 0), new T.Vector3(-1.2, 1.1, -1.8), new T.Vector3(-3.2, 1.2, -3.6), new T.Vector3(0, 1.1, -5), new T.Vector3(3.4, 1.2, -4.2),
  new T.Vector3(5.2, 1.1, -1.4), new T.Vector3(4.6, 1.2, 1.2), new T.Vector3(1, 1.4, 3.2), new T.Vector3(-4, 1, 2.2), new T.Vector3(-4.8, 1, -.2), new T.Vector3(-2, 1, -.4), new T.Vector3(0, .42, 0)]);
function startFlight() { actions([]); MODE = 'fly'; flight = { k: 0 }; bubble('<span class="chip">ЗАЕЗД</span><br>' + (KID ? 'Летим через ворота и вокруг флага!' : 'Ворота, ворота, ворота, облёт флага - и финиш. Так выглядит круг вуп-гонки.'), ''); say(KID ? 'Летим!' : 'Три, два, один, старт!'); }
function endFlight() { flight = null; MODE = 'prep'; M.position.set(0, .42, 0); M.rotation.set(0, 0, 0); prep.i = prep.list.length; progress(); goCam(.5, .42, 2.6, new T.Vector3(0, .45, 0), 1.2);
  bubble('<span class="chip">ФИНИШ</span><br>' + (KID ? 'Круг пройден! Дрон сел на подиум.' : 'Чистый круг. Дрон на подиуме: отключаем АКБ сразу после посадки.'), 'ok');
  actions([{ t: 'Дальше: вопросы →', cls: 'pri', f: partQuiz }]); }

/* ---------- часть 3: вопросы ---------- */
var qz = { i: 0, list: KID ? [
  { q: 'Почему на Mobula 7 можно летать в зале?', o: ['Он лёгкий, а винты в защитных кольцах', 'Он очень быстрый', 'У него большие винты'], a: 0, e: 'Лёгкий и винты в кольцах - почти безопасно.' },
  { q: 'Сколько банок в его аккумуляторе?', o: ['Одна (1S)', 'Четыре (4S)', 'Шесть (6S)'], a: 0, e: '1S - одна банка.' },
  { q: 'Что делаем перед каждым полётом?', o: ['Осматриваем винты и заряд', 'Ничего, сразу летим', 'Моем дрон водой'], a: 0, e: 'Осмотр перед вылетом - всегда.' }
] : [
  { q: 'Почему вупы вроде Mobula 7 - класс начальных гонок?', o: ['Лёгкие, в защите, летают в зале, у всех почти одинаковые - решает пилот', 'Самые быстрые дроны в мире', 'Им не нужен пульт'], a: 0, e: 'Безопасно, недорого, равная техника - побеждает навык.' },
  { q: 'Полная банка LiHV у GNB 850 1S HV - это...', o: ['4,35 В', '4,20 В', '3,80 В'], a: 0, e: 'LiHV заряжается до 4,35 В; 3,8 В - номинал и напряжение хранения.' },
  { q: 'Кто на гонке решает, на каком видеоканале ты летишь?', o: ['Судья (организатор)', 'Пилот сам, любой свободный', 'Тот, кто быстрее включился'], a: 0, e: 'Каналы раздаёт судья, чтобы видео пилотов не мешали друг другу.' },
  { q: 'Что на одной плате у Mobula 7?', o: ['Полётный контроллер F4, регуляторы и приёмник ELRS', 'Только камера', 'Аккумулятор и зарядка'], a: 0, e: 'Плата AIO: F4 + 4 регулятора + ELRS. Настраивается в Betaflight.' }
] };
function partQuiz() { MODE = 'quiz'; part = 2; qz.i = 0; qzAsk(); progress(); }
function qzAsk() { var q = qz.list[qz.i]; bubble('<span class="chip">ВОПРОС ' + (qz.i + 1) + ' ИЗ ' + qz.list.length + '</span><br>' + q.q, ''); say(q.q);
  var order = q.o.map(function (_, k) { return k; }).sort(function () { return Math.random() - .5; });
  actions(order.map(function (k) { return { t: q.o[k], cls: 'w', f: function (b) { if (k === q.a) { b.classList.add('ok'); qz.i++; progress(); bubble('<span class="chip">ВЕРНО</span><br>' + q.e, 'ok'); say(q.e); actions([]); setTimeout(qz.i >= qz.list.length ? finish : qzAsk, 1500); } else { b.classList.add('no'); bubble('<span class="chip">НЕ ТАК</span><br>' + q.q + '<br><small>Подумай ещё.</small>', 'bad'); } } }; })); }
function finish() { MODE = 'done'; part = 3; progress(); lsS(KEY, '1'); try { localStorage.setItem(KEY + '_best', '100'); } catch (e) {}
  bubble('<span class="chip">ТРЕНАЖЁР ПРОЙДЕН</span><br>' + (KID ? 'Ты знаешь наш гоночный дрон и умеешь готовить его к заезду!' : 'Mobula 7 изучен: устройство, подготовка к заезду и почему с вупов начинают гонки.'), 'ok');
  say('Тренажёр пройден!'); auto = true; actions([{ t: 'Ещё раз', f: function () { location.reload(); } }, { t: 'Назад в курс', cls: 'pri', f: function () { history.back(); } }]); }

window.SBG = { st: function () { return { stage: MODE === 'done' ? 'done' : MODE }; }, prep: prep, qz: qz, HS: HS, sc: sc,
  jump: function (p) { if (p === 'prep') partPrep(); else if (p === 'quiz') partQuiz(); else if (p === 'learn') partLearn(); else if (p === 'all') HS.forEach(function (h) { seen[h.id] = 1; }); },
  showHS: function (i) { showHS(HS[i]); }, tapNow: function () { if (prep.onTap && prep.tapList) prep.onTap(); }, flyNow: startFlight };

/* ---------- кадр ---------- */
var clock = new T.Clock();
function loop() { requestAnimationFrame(loop); var dt = Math.min(clock.getDelta(), .1), t = clock.elapsedTime;
  if (fly) { fly.k = Math.min(1, fly.k + dt / fly.d); var k = fly.k < .5 ? 4 * fly.k * fly.k * fly.k : 1 - Math.pow(-2 * fly.k + 2, 3) / 2;
    orb.th = fly.a.th + (fly.b.th - fly.a.th) * k; orb.ph = fly.a.ph + (fly.b.ph - fly.a.ph) * k; orb.r = fly.a.r + (fly.b.r - fly.a.r) * k; orb.tgt.lerpVectors(fly.a.t, fly.b.t, k); if (fly.k >= 1) fly = null; }
  if (auto && !down && !fly) orb.th += dt * .15;
  /* полёт по трассе */
  if (flight) { flight.k += dt / 9; var u = Math.min(1, flight.k), p = path.getPointAt(u), tn = path.getTangentAt(Math.min(.999, u + .002));
    M.position.copy(p); M.rotation.set(0, Math.atan2(-tn.x, -tn.z), 0); M.rotateX(-.35 * Math.min(1, u * 8) * Math.min(1, (1 - u) * 8)); M.rotateZ(Math.sin(u * 30) * .08);
    orb.tgt.lerp(p, Math.min(1, dt * 3)); var back = p.clone().addScaledVector(tn, -2.2); back.y += .9; cam.position.lerp(back, Math.min(1, dt * 2.5)); cam.lookAt(orb.tgt);
    if (u >= 1) endFlight(); }
  else { cam.position.copy(camPose()); cam.lookAt(orb.tgt); }
  /* винты крутятся, когда АКБ подключена и дрон летит */
  var spin = flight ? 60 : 0;
  props.forEach(function (pr, i) { pr.rotation.y += (i % 3 === 0 ? 1 : -1) * spin * dt; });
  if (hl.visible && prep.list[prep.i] && prep.list[prep.i].at) { hl.position.copy(prep.list[prep.i].at()); hl.lookAt(cam.position); hl.scale.setScalar(1 + .25 * Math.sin(t * 5)); }
  hsM.forEach(function (s, i) { if (s.visible) s.scale.setScalar(.07 + .018 * Math.sin(t * 4 + i)); });
  if (beepT > 0) { beepT -= dt; led.visible = Math.sin(t * 20) > -.3 || beepT <= 0; }
  cloth.rotation.y = Math.sin(t * 1.3) * .15;
  podRing.material.color.setHSL(.08, 1, .5 + .1 * Math.sin(t * 2));
  ren.render(sc, cam); }
partLearn(); loop();
document.getElementById('back').onclick = function () { history.back(); };
var sb = document.getElementById('snd'); if (window.GOLOS) { sb.textContent = GOLOS.on ? '🔊' : '🔇'; sb.onclick = function () { GOLOS.setOn(!GOLOS.on); sb.textContent = GOLOS.on ? '🔊' : '🔇'; }; }
})();
