/* klassy-g.js - новая графика (11.11.2026, стиль А "тёмная студия", нужен ../studiya.js): тот же тренажёр, перерисованы дроны и сцена.
   klassy.js - тренажёр "Классы дронов: от вупа до пятёрки" (модуль 5, по фото владельца 09.11.2026).
   Три 3D-дрона на подиумах в настоящем соотношении размеров:
     Mobula 7 (вуп 75 мм, 1S) - 3-дюймовый синевуп (как GEPRC CineLog 30, 4S) - 5-дюймовый фристайл/гонка (как GEPRC Mark5, 6S).
   Части: 1) Знакомство - нажми на дрон: размер, винты, банки, вес, где летать; 2) Сравни - вопросы "какой дрон подходит".
   Детский вариант (window.PULT_KID) - короче и проще. Пройдено: window.SBG.st().stage === 'done'. Кнопка "←" = history.back().
   Модели нарисованы кодом по фото (фото магазинов в курс не ставим). */
(function () {
'use strict';
var T = THREE, KID = !!window.PULT_KID;
var A = '#ff9b3d', Y = '#ffd36e', GR = '#9dff7c', BL = '#5ab4ff', PK = '#ff7ce0';
var CFG = window.KURSY || {}, KEY = (CFG.store || 'kursy') + '_klassy';
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ---------- сцена ---------- */
var cv = document.getElementById('c');
var ren = new T.WebGLRenderer({ canvas: cv, antialias: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.05;
var sc = new T.Scene();
var pm = new T.PMREMGenerator(ren), ENV = pm.fromScene(new T.RoomEnvironment(), .04).texture;
var cam = new T.PerspectiveCamera(42, 1, .03, 60);
function resize() { var w = innerWidth, h = innerHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 62 : 40; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
var STU = STUDIYA(ren, sc, { size: 2.2, rimA: '#ff9b3d', rimB: '#5ab4ff', rings: [1.9, 2.3] }); /* общая тёмная студия: фон, пол, свет, тени */
function std(c, r, m, o) { var x = new T.MeshStandardMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r == null ? .5 : r, metalness: m || 0, envMap: ENV, envMapIntensity: .4 }); if (o) Object.assign(x, o); return x; }
function neon(c, k) { return new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k || 1.5), toneMapped: false }); }
function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
function txt(c, s, x, y, sz, col, al, wt) { c.font = (wt || 800) + ' ' + sz + 'px Manrope, "Segoe UI", sans-serif'; c.fillStyle = col; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }
function mesh(g, mat, par, x, y, z) { var m = new T.Mesh(g, mat); m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; }
function mesh(g, mat, par, x, y, z) { var m = new T.Mesh(g, mat); m.position.set(x || 0, y || 0, z || 0); par.add(m); return m; }
function boxB(w, h, d, mat, par, x, y, z) { return mesh(new T.BoxGeometry(w, h, d), mat, par, x, y, z); }
function boxM(w, h, d, mat, par, x, y, z) { return mesh(STUDIYA.plate(w, h, d), mat, par, x, y, z); } /* брусок со скруглёнными углами */
function cylM(r1, r2, h, mat, par, x, y, z, seg) { return mesh(new T.CylinderGeometry(r1, r2, h, Math.max(seg || 20, 24)), mat, par, x, y, z); }
function lathe(pts, seg) { return new T.LatheGeometry(pts.map(function (q) { return new T.Vector2(q[0], q[1]); }), seg || 64); }
function phys(c, r, o) { var x = new T.MeshPhysicalMaterial({ color: new T.Color(c).convertSRGBToLinear(), roughness: r, clearcoat: .7, clearcoatRoughness: .2, envMap: ENV, envMapIntensity: .5 }); if (o) Object.assign(x, o); return x; }
/* защитное кольцо винта: тонкая стенка с загнутыми кромками (r - радиус, h - высота) */
function ductG(r, h) { var t = r * .04; return lathe([[r - t, -h * .1], [r, -h * .2], [r + t, -h * .05], [r + t * 1.3, h * .8], [r + t * .6, h], [r - t * .4, h], [r - t, h * .85], [r - t, -h * .1]], 96); }

/* ---------- материалы дронов ---------- */
var carbonT = tex(256, 256, function (c, w, h) { c.fillStyle = '#131417'; c.fillRect(0, 0, w, h);
  for (var i = 0; i < w; i += 16) for (var j = 0; j < h; j += 16) { var g = c.createLinearGradient(i, j, i + 16, j + 16), a = ((i + j) / 16) % 2; g.addColorStop(0, a ? '#2a2d33' : '#0e0f12'); g.addColorStop(1, a ? '#17181c' : '#1f2126'); c.fillStyle = g; c.fillRect(i, j, 16, 16); } });
carbonT.wrapS = carbonT.wrapT = T.RepeatWrapping; carbonT.repeat.set(26, 26);
var carbon = phys('#ffffff', .38, { map: carbonT, envMapIntensity: .35 }), dark = std('#111115', .5, .1), black = phys('#17181c', .38), plastic = phys('#2c2e35', .4);
var alu = std('#c9ccd4', .26, .95, { envMapIntensity: 1 }), red = std('#c4232b', .28, .8, { envMapIntensity: .9 }), tpu = std('#c6f020', .6, 0), gold = std('#d9a441', .3, .9);
var frameM = phys('#34373f', .28, { transparent: true, opacity: .86, side: T.DoubleSide });
var coilT = tex(256, 32, function (c, w, h) { for (var i = 0; i < 9; i++) { var g = c.createLinearGradient(i * w / 9, 0, (i + 1) * w / 9, 0); g.addColorStop(0, '#5a2c12'); g.addColorStop(.5, '#e89a55'); g.addColorStop(1, '#5a2c12'); c.fillStyle = g; c.fillRect(i * w / 9, 0, w / 9 - 3, h); c.fillStyle = '#120a06'; c.fillRect((i + 1) * w / 9 - 3, 0, 3, h); } });
var coilM = new T.MeshStandardMaterial({ map: coilT, roughness: .4, metalness: .8, envMap: ENV, envMapIntensity: .8 });
function propMat() { return phys('#b4bac2', .2, { transparent: true, opacity: .6, depthWrite: false, side: T.DoubleSide }); }

/* общие детали */
/* мотор: основание, медные обмотки, колокол, вал */
function motor(par, x, z, r, h, bellMat) { var g = new T.Group(); g.position.set(x, 0, z); par.add(g);
  cylM(r * 1.02, r * 1.1, h * .26, dark, g, 0, 0, 0, 32);
  mesh(new T.CylinderGeometry(r * .84, r * .84, h * .5, 32, 1, true), coilM, g, 0, h * .42, 0);
  var bm = bellMat.clone(); bm.side = T.DoubleSide;
  mesh(lathe([[0, h * .96], [r * .5, h * .96], [r * .93, h * .88], [r, h * .76], [r, h * .62], [r * .9, h * .62], [r * .9, h * .76], [0, h * .82]], 40), bm, g);
  mesh(new T.CylinderGeometry(r, r, h * .12, 40, 1, true), bm, g, 0, h * .2, 0);
  cylM(r * .2, r * .2, h * .3, alu, g, 0, h * 1.08, 0, 16); return g; }
/* винт: изогнутые закрученные лопасти */
var bladeCache = {};
function bladeG(len, w) { var k = len + '_' + w; if (bladeCache[k]) return bladeCache[k]; var R = len / 2, s = new T.Shape();
  s.moveTo(R * .06, -w * .28); s.bezierCurveTo(R * .35, -w * 1.25, R * .8, -w * 1.1, R * .98, -w * .3); s.bezierCurveTo(R * 1.04, 0, R * .98, w * .4, R * .85, w * .45); s.bezierCurveTo(R * .5, w * .7, R * .25, w * .5, R * .06, w * .28);
  var g = new T.ExtrudeGeometry(s, { depth: len * .006, bevelEnabled: true, bevelThickness: len * .004, bevelSize: len * .004, bevelSegments: 2, curveSegments: 14 }); g.rotateX(-Math.PI / 2);
  var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var xx = p.getX(i), zz = p.getZ(i), tw = .55 - xx / R * .4; p.setY(i, p.getY(i) - zz * Math.sin(tw)); p.setZ(i, zz * Math.cos(tw)); } g.computeVertexNormals(); return bladeCache[k] = g; }
function prop(par, y, len, blades, w) { var g = new T.Group(); g.position.y = y; par.add(g); var m = propMat();
  for (var b = 0; b < blades; b++) { var bl = new T.Mesh(bladeG(len, w), m); bl.rotation.y = b * Math.PI * 2 / blades; g.add(bl); }
  cylM(len * .055, len * .065, len * .07, m, g, 0, 0, 0, 20); return g; }
function antenna(par, x, z, len, tilt, capCol) { var g = new T.Group(); g.position.set(x, 0, z); g.rotation.x = tilt[0]; g.rotation.z = tilt[1]; par.add(g);
  cylM(len * .025, len * .025, len, std('#1a1a1a', .5), g, 0, len / 2, 0, 8); cylM(len * .09, len * .09, len * .25, std(capCol || '#2a2a2a', .5), g, 0, len, 0, 12); return g; }

/* ---------- дрон 1: Mobula 7 (вуп 75 мм) ---------- */
function buildMobula() { /* общая модель по фото владельца (../mobula-model.js), приведена к размеру сцены: 75 мм */
  var M = new T.Group(), MB = MOBULA({ env: ENV }); MB.g.scale.setScalar(.0265 * 2.5 / MB.MX); M.add(MB.g);
  M.userData.props = MB.props; return M; }
/* ---------- дрон 2: 3-дюймовый синевуп (как GEPRC CineLog 30): чёрная рама, кольца, красные моторы, две антенны ---------- */
function buildCine() { var M = new T.Group(), props = [], WB = .127 * 2.5, R = WB / 2 / Math.SQRT2, duct = .041 * 2.5;
  [[1, -1], [-1, -1], [1, 1], [-1, 1]].forEach(function (q) { var g = new T.Group(); g.position.set(q[0] * R, 0, q[1] * R); M.add(g);
    mesh(ductG(duct, .014 * 2.5), black.clone(), g, 0, -.002 * 2.5, 0).material.side = T.DoubleSide;
    for (var k = 0; k < 3; k++) { var sp = boxB(duct * 2, .002 * 2.5, .003 * 2.5, black, g, 0, -.002 * 2.5, 0); sp.rotation.y = k * Math.PI / 3; }
    motor(g, 0, 0, .0075 * 2.5, .011 * 2.5, red); props.push(prop(g, .012 * 2.5, .076 * 2.5, 3, .009 * 2.5)); });
  /* внешний обвод колец как на фото: кольца соединены дугами */
  var bot = boxM(R * 1.5, .003 * 2.5, R * 1.5, carbon, M, 0, 0, 0); bot.rotation.y = Math.PI / 4;
  [[1, -1], [-1, -1], [1, 1], [-1, 1]].forEach(function (q) { var a = boxM(.012 * 2.5, .003 * 2.5, R * 1.42, carbon, M, q[0] * R / 2, 0, q[1] * R / 2); a.rotation.y = Math.atan2(q[0], q[1]); });
  /* стек: стойки и верхняя пластина, ремешок АКБ */
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) { cylM(.0018 * 2.5, .0018 * 2.5, .02 * 2.5, alu, M, q[0] * .013 * 2.5, .011 * 2.5, q[1] * .013 * 2.5, 8); });
  var top = boxM(.036 * 2.5, .0025 * 2.5, .05 * 2.5, carbon, M, 0, .022 * 2.5, .004 * 2.5);
  var brd = boxM(.026 * 2.5, .006 * 2.5, .026 * 2.5, std('#0e2a1a', .5, .2), M, 0, .009 * 2.5, 0);
  var strap = boxM(.012 * 2.5, .0018 * 2.5, .085 * 2.5, std('#2a2b2e', .8), M, 0, .0245 * 2.5, .006 * 2.5); strap.rotation.z = 0;
  /* камера в сером держателе спереди */
  var cg = new T.Group(); cg.position.set(0, .015 * 2.5, -.032 * 2.5); cg.rotation.x = .25; M.add(cg);
  boxM(.024 * 2.5, .02 * 2.5, .014 * 2.5, std('#4a4d55', .45, .3), cg, 0, 0, 0);
  boxM(.016 * 2.5, .016 * 2.5, .015 * 2.5, black, cg, 0, 0, -.006 * 2.5);
  var ln = cylM(.006 * 2.5, .0065 * 2.5, .008 * 2.5, dark, cg, 0, 0, -.016 * 2.5); ln.rotation.x = Math.PI / 2;
  var gl = mesh(new T.CircleGeometry(.0048 * 2.5, 20), new T.MeshPhysicalMaterial({ color: new T.Color('#0a1836').convertSRGBToLinear(), roughness: .02, metalness: .6, clearcoat: 1, clearcoatRoughness: 0, envMap: ENV, envMapIntensity: 2 }), cg, 0, 0, -.0202 * 2.5); gl.rotation.y = Math.PI;
  /* две антенны сзади, разведены в стороны (как на фото) + антенна приёмника */
  antenna(M, .006 * 2.5, .03 * 2.5, .045 * 2.5, [-.35, -.35]); antenna(M, -.006 * 2.5, .03 * 2.5, .045 * 2.5, [-.35, .35]);
  var rx = boxB(.04 * 2.5, .001 * 2.5, .001 * 2.5, std('#111', .5), M, .03 * 2.5, .014 * 2.5, .03 * 2.5); rx.rotation.y = .6;
  /* АКБ 4S сверху под ремешком */
  var bat = boxB(.03 * 2.5, .018 * 2.5, .07 * 2.5, std('#2b2f3a', .45), M, 0, .033 * 2.5, .006 * 2.5);
  bat.material = [std('#2b2f3a', .45), std('#2b2f3a', .45), std('#ffffff', .45, 0, { map: tex(256, 512, function (c, w, h) { c.fillStyle = '#2b2f3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd36e'; c.fillRect(0, h * .4, w, h * .2); txt(c, '4S', w / 2, h * .25, 90, '#fff', 'center', 900); txt(c, '850', w / 2, h * .5, 70, '#1b1b1b', 'center', 900); txt(c, '14,8V', w / 2, h * .75, 60, '#fff', 'center', 800); }) }), std('#2b2f3a', .45), std('#2b2f3a', .45), std('#2b2f3a', .45)];
  strap.position.y = .043 * 2.5;
  M.userData.props = props; return M; }

/* ---------- дрон 3: 5-дюймовый (как GEPRC Mark5): карбон X, серебристые пластины, зелёный TPU, серые винты ---------- */
function buildMark5(withCam) { var M = new T.Group(), props = [], WB = .225 * 2.5, R = WB / 2 / Math.SQRT2;
  /* лучи true-X */
  [[1, -1], [-1, -1], [1, 1], [-1, 1]].forEach(function (q) { var L = Math.hypot(R, R) * 1.02;
    var a = boxM(.016 * 2.5, .005 * 2.5, L, carbon, M, q[0] * R / 2, 0, q[1] * R / 2); a.rotation.y = Math.atan2(q[0], q[1]);
    var g = new T.Group(); g.position.set(q[0] * R, .0025 * 2.5, q[1] * R); M.add(g);
    var pad = boxM(.026 * 2.5, .004 * 2.5, .026 * 2.5, carbon, g, 0, -.0005, 0); pad.rotation.y = Math.atan2(q[0], q[1]);
    /* зелёный TPU-бампер под мотором */
    var bp = boxM(.022 * 2.5, .006 * 2.5, .016 * 2.5, tpu, g, q[0] * .006 * 2.5, -.005 * 2.5, q[1] * .006 * 2.5); bp.rotation.y = Math.atan2(q[0], q[1]);
    motor(g, 0, 0, .0115 * 2.5, .016 * 2.5, std('#8e9198', .3, .85));
    props.push(prop(g, .017 * 2.5, .13 * 2.5, 3, .015 * 2.5)); });
  /* центр: нижняя пластина, стек, серебристая верхняя и боковые пластины */
  boxM(.04 * 2.5, .004 * 2.5, .11 * 2.5, carbon, M, 0, 0, 0);
  boxM(.03 * 2.5, .006 * 2.5, .03 * 2.5, std('#0f2a1a', .5, .2), M, 0, .008 * 2.5, .004 * 2.5);
  boxM(.03 * 2.5, .005 * 2.5, .03 * 2.5, std('#1a1a40', .5, .2), M, 0, .015 * 2.5, .004 * 2.5);
  var topP = boxM(.04 * 2.5, .003 * 2.5, .1 * 2.5, alu, M, 0, .024 * 2.5, .004 * 2.5);
  [-1, 1].forEach(function (s) { var sp = boxM(.0025 * 2.5, .022 * 2.5, .04 * 2.5, alu, M, s * .02 * 2.5, .013 * 2.5, -.034 * 2.5); });
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) { cylM(.002 * 2.5, .002 * 2.5, .022 * 2.5, alu, M, q[0] * .017 * 2.5, .012 * 2.5, q[1] * .04 * 2.5 + .004, 8); });
  /* камера между боковыми пластинами */
  var cg = new T.Group(); cg.position.set(0, .013 * 2.5, -.04 * 2.5); cg.rotation.x = .3; M.add(cg);
  boxM(.019 * 2.5, .019 * 2.5, .018 * 2.5, black, cg, 0, 0, 0);
  var ln = cylM(.0065 * 2.5, .007 * 2.5, .01 * 2.5, dark, cg, 0, 0, -.013 * 2.5); ln.rotation.x = Math.PI / 2;
  var gl = mesh(new T.CircleGeometry(.0052 * 2.5, 20), new T.MeshPhysicalMaterial({ color: new T.Color('#0a1836').convertSRGBToLinear(), roughness: .02, metalness: .6, clearcoat: 1, clearcoatRoughness: 0, envMap: ENV, envMapIntensity: 2 }), cg, 0, 0, -.0182 * 2.5); gl.rotation.y = Math.PI;
  /* зелёное крепление антенн сзади, две антенны и красно-жёлтый провод XT60 */
  boxM(.02 * 2.5, .012 * 2.5, .012 * 2.5, tpu, M, 0, .03 * 2.5, .05 * 2.5);
  antenna(M, .006 * 2.5, .05 * 2.5, .055 * 2.5, [-.15, -.25]); antenna(M, -.006 * 2.5, .05 * 2.5, .055 * 2.5, [-.15, .25]);
  boxM(.009 * 2.5, .006 * 2.5, .016 * 2.5, std('#e5c100', .4), M, 0, .03 * 2.5, .064 * 2.5);
  /* экшн-камера в зелёном держателе (как на втором фото) */
  var gp = new T.Group(); gp.position.set(0, .043 * 2.5, -.012 * 2.5); gp.rotation.x = -.35; M.add(gp); gp.visible = !!withCam;
  boxM(.046 * 2.5, .034 * 2.5, .022 * 2.5, std('#1b1c1f', .4, .2), gp, 0, 0, 0);
  boxM(.05 * 2.5, .036 * 2.5, .018 * 2.5, std('#7bc61d', .5), gp, 0, -.002, .0035 * 2.5);
  var gl2 = cylM(.008 * 2.5, .008 * 2.5, .006 * 2.5, new T.MeshPhysicalMaterial({ color: new T.Color('#0a1836').convertSRGBToLinear(), roughness: .02, metalness: .6, clearcoat: 1, clearcoatRoughness: 0, envMap: ENV, envMapIntensity: 2 }), gp, -.012 * 2.5, .004 * 2.5, -.012 * 2.5); gl2.rotation.x = Math.PI / 2;
  M.userData.props = props; M.userData.gopro = gp; return M; }

/* ---------- подиумы ---------- */
var DR = [
  { id: 'mob', name: 'Mobula 7', cls: 'Вуп 75 мм', x: -2.2, build: buildMobula, col: A, ph: .5, r: .75,
    kid: 'Маленький вуп для зала. <b>1 банка</b>, винты по 4 см спрятаны в кольца. Весит меньше 50 граммов - легче яйца. С него начинают все.',
    big: '<b>75 мм</b> по диагонали, винты 40 мм в защитных кольцах. АКБ <b>1S</b> LiHV (полная 4,35 В), около <b>45 г</b> с АКБ, 4-5 минут полёта. Летает в спортзале: класс первых гонок и тренировок.',
    s: { size: 75, cells: 1, mass: 45, speed: 30, where: 'зал' } },
  { id: 'cine', name: '3" синевуп', cls: 'Как GEPRC CineLog 30', x: 0, build: buildCine, col: BL, ph: .5, r: 1.05,
    kid: 'Средний класс. Винты по 3 дюйма тоже в кольцах, но дрон тяжелее и сильнее: <b>4 банки</b>. На нём снимают видео и учатся летать на улице.',
    big: 'Рама <b>127 мм</b>, винты 3" (76 мм) в кольцах, АКБ <b>4S</b> (14,8 В), около <b>300 г</b> с АКБ, 4-6 минут. Плавно летает и снимает: съёмка, первые полёты на улице. Тяжелее 150 г - дрон ставят на учёт.',
    s: { size: 127, cells: 4, mass: 300, speed: 70, where: 'улица, съёмка' } },
  { id: 'mark5', name: '5" фристайл', cls: 'Как GEPRC Mark5', x: 2.6, build: function () { return buildMark5(false); }, col: GR, ph: .55, r: 1.5,
    kid: 'Высокий класс. Большие открытые винты по 5 дюймов и <b>6 банок</b>. Очень быстрый - больше 100 км/ч. Летают только на улице, в поле, далеко от людей и со взрослым тренером.',
    big: 'Рама <b>225 мм</b>, винты 5" (127 мм) без защиты, АКБ <b>6S</b> (22,2 В), <b>550-700 г</b> с АКБ, скорость больше 120 км/ч, 3-5 минут. Фристайл и гонки на открытых трассах. Только в поле, далеко от людей; дрон на учёте, полёт там, где разрешено.',
    s: { size: 225, cells: 6, mass: 650, speed: 130, where: 'поле, трасса' } }];
DR.forEach(function (d) { var g = new T.Group(); g.position.set(d.x, 0, 0); sc.add(g); d.g = g;
  var pod = mesh(lathe([[0, 0], [.68, 0], [.69, .02], [.65, .21], [.62, .24], [0, .24]], 80), std('#12101a', .38, .5, { envMapIntensity: .5 }), g, 0, 0, 0); pod.castShadow = pod.receiveShadow = true;
  var podTop = cylM(.61, .61, .006, std('#0d0b14', .97, 0, { envMapIntensity: .04 }), g, 0, .241, 0, 64); podTop.receiveShadow = true; podTop.userData.drone = d;
  var ring = mesh(new T.TorusGeometry(.62, .008, 8, 96), neon(d.col, 1.2), g, 0, .24, 0); ring.rotation.x = Math.PI / 2; d.ring = ring;
  var lab = tex(512, 128, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); c.fillStyle = d.col; c.fillRect(0, h - 10, w, 10); txt(c, d.name, w / 2, 48, 40, '#fff', 'center', 900); txt(c, d.cls, w / 2, 96, 28, d.col, 'center', 800); });
  var lm = mesh(new T.PlaneGeometry(1.1, .275), new T.MeshBasicMaterial({ map: lab, toneMapped: false }), g, 0, .12, .67); lm.rotation.x = -.2;
  var m = d.build(); m.position.y = .38; g.add(m); d.m = m; STUDIYA.shadows(m);
  m.traverse(function (o) { o.userData.drone = d; }); pod.userData.drone = d; lm.userData.drone = d;
  /* линейка размера под дроном */
  var rl = boxB(d.s.size / 1000 * 2.5, .004, .01, neon(Y, 1.1), g, 0, .245, .45); d.rule = rl; rl.visible = false; });
var DM = DR.map(function (d) { return d.g; });
/* выключатель экшн-камеры на 5" */
var mark = DR[2];

/* ---------- камера ---------- */
var orb = { th: .25, ph: .38, r: 6.2, tgt: new T.Vector3(.2, .45, 0) }, fly = null, auto = false;
function camPose() { return new T.Vector3(orb.tgt.x + orb.r * Math.sin(orb.th) * Math.cos(orb.ph), orb.tgt.y + orb.r * Math.sin(orb.ph), orb.tgt.z + orb.r * Math.cos(orb.th) * Math.cos(orb.ph)); }
function goCam(th, ph, r, tgt, d) { fly = { a: { th: orb.th, ph: orb.ph, r: orb.r, t: orb.tgt.clone() }, b: { th: th, ph: ph, r: r, t: tgt.clone() }, k: 0, d: d || 1 }; }
function wide() { var p = innerWidth < innerHeight; goCam(.25, .38, p ? 10.5 : 6.2, new T.Vector3(.2, .45, 0), 1); }
var down = null;
cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, th: orb.th, ph: orb.ph, m: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
cv.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 6) down.m = true;
  if (down.m && !fly) { orb.th = down.th - dx * .006; orb.ph = Math.max(.05, Math.min(1.35, down.ph + dy * .005)); } });
cv.addEventListener('pointerup', function (e) { var d = down; down = null; if (d && !d.m) tap(e.clientX, e.clientY); });
cv.addEventListener('wheel', function (e) { orb.r = Math.max(.5, Math.min(12, orb.r + e.deltaY * .003)); }, { passive: true });
var ray = new T.Raycaster(), v2 = new T.Vector2();
function pickDrone(x, y) { v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, cam); var h = ray.intersectObjects(DM, true)[0]; return h && h.object.userData.drone; }
function tap(x, y) { var d = pickDrone(x, y); if (!d) return; if (MODE === 'learn') show(d); else if (MODE === 'quiz') answer(d.id); }

/* ---------- интерфейс ---------- */
var ui = document.getElementById('ui');
function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
var bub = el('div', 'bub glass'); ui.appendChild(bub);
var bar = el('div', 'acts'); ui.appendChild(bar);
var bars = el('div', 'bars'); ui.appendChild(bars);
var cmp = el('div', 'bf glass'); cmp.hidden = true; ui.appendChild(cmp);
var cmpCss = document.createElement('style'); cmpCss.textContent = '@media (max-width:759px){.bf{top:auto!important;bottom:72px;transform:translateX(-50%)!important;padding:8px 10px}}'; document.head.appendChild(cmpCss);
function bubble(h, cls) { bub.className = 'bub glass' + (cls ? ' ' + cls : ''); bub.innerHTML = h; bub.hidden = false; }
function actions(list) { bar.innerHTML = ''; list.forEach(function (a) { var b = el('button', 'tb' + (a.cls ? ' ' + a.cls : ''), a.t); b.onclick = function () { a.f(b); }; bar.appendChild(b); }); }
function say(s) { if (window.GOLOS && GOLOS.on) GOLOS.say(window.VSLUH ? VSLUH(s) : s.replace(/<[^>]+>/g, '')); } /* VSLUH (../vsluh.js): единицы, дроби и ударения для голоса */
var PARTS = ['Знакомство', 'Сравни'], part = 0, MODE = 'learn', seen = {};
function progress() { bars.innerHTML = PARTS.map(function (p, i) { var k = i < part ? 1 : i > part ? 0 : (part === 0 ? Object.keys(seen).length / DR.length : qz.i / qz.list.length);
  return '<i><b style="width:' + Math.round(k * 100) + '%"></b><span>' + p + '</span></i>'; }).join(''); }
/* таблица сравнения: полоски размера, банок, веса, скорости */
function compare(cur) { var rows = [['Размер', 'size', ' мм'], ['Банок', 'cells', 'S'], ['Вес', 'mass', ' г'], ['Скорость', 'speed', ' км/ч']];
  function val(d, r) { if (!(seen[d.id] || d === cur)) return '?'; var v = d.s[r[1]]; if (d.id === 'mark5' && r[1] === 'mass') v = '550-700'; if (d.id === 'mark5' && r[1] === 'speed') v = '120+'; return v + r[2]; }
  cmp.innerHTML = '<div class="bf-h">СРАВНИ КЛАССЫ</div><div style="display:grid;grid-template-columns:auto 1fr 1fr 1fr;gap:5px 8px;font-size:11.5px;align-items:center">' +
    '<span></span>' + DR.map(function (d) { return '<b style="color:' + d.col + ';font-size:11px">' + d.name + '</b>'; }).join('') +
    rows.map(function (r) { return '<span style="color:#b9c6e6;font-weight:700">' + r[0] + '</span>' + DR.map(function (d) { return '<b' + (d === cur ? ' style="color:#fff;text-decoration:underline"' : ' style="color:#dfe6ff"') + '>' + val(d, r) + '</b>'; }).join(''); }).join('') + '</div>';
  cmp.hidden = false; }

/* ---------- часть 1: знакомство ---------- */
function partLearn() { MODE = 'learn'; part = 0; wide(); cmp.hidden = true;
  bubble('<span class="chip">ТРИ КЛАССА</span><br>' + (KID ? 'Слева наш вуп Mobula 7, в середине средний дрон, справа большой. Они стоят в настоящем размере. <b>Нажми на каждый</b>.' : 'Mobula 7, 3-дюймовый синевуп и 5-дюймовый фристайл - в настоящем соотношении размеров. <b>Нажми на каждый дрон</b>: размер, банки, вес и где на нём летают.'), '');
  say(KID ? 'Здесь три дрона: маленький, средний и большой. Нажми на каждый.' : 'Три класса дронов. Нажми на каждый.');
  actions(DR.map(function (d) { return { t: d.name, f: function () { show(d); } }; })); progress(); }
function show(d) { seen[d.id] = 1; var p = innerWidth < innerHeight;
  goCam(.35, d.ph + (p ? .3 : 0), d.r * (p ? 1.45 : 1), new T.Vector3(d.x, p ? .3 : .42, 0), 1);
  DR.forEach(function (x) { x.rule.visible = x === d; });
  var n = Object.keys(seen).length;
  bubble('<span class="chip">' + d.name.toUpperCase() + '</span><br>' + (KID ? d.kid : d.big), '');
  say(d.name + '. ' + (KID ? d.kid : d.big));
  var acts = [{ t: '← Все три', f: function () { DR.forEach(function (x) { x.rule.visible = false; }); wide(); } }];
  if (d.id === 'mark5') acts.push({ t: mark.m.userData.gopro.visible ? 'Снять экшн-камеру' : 'Поставить экшн-камеру', f: function (b) { var g = mark.m.userData.gopro; g.visible = !g.visible; b.textContent = g.visible ? 'Снять экшн-камеру' : 'Поставить экшн-камеру';
    if (g.visible) bubble('<span class="chip">ЭКШН-КАМЕРА</span><br>' + (KID ? 'На большой дрон ставят камеру для красивого видео. Пилот смотрит в свою маленькую камеру, а эта снимает.' : 'На 5" сверху ставят экшн-камеру для чистого видео в 4K. Пилот летит по своей FPV-камере, экшн-камера только пишет. Она добавляет 100-150 г.'), ''); } });
  if (n >= DR.length) acts.push({ t: 'Дальше: сравни →', cls: 'pri', f: partQuiz });
  actions(acts); compare(d); progress(); cmp.style.bottom = innerWidth < 760 ? (bar.offsetHeight + 26) + 'px' : ''; }

/* ---------- часть 2: вопросы ---------- */
var qz = { i: 0, list: KID ? [
  { q: 'На каком дроне учиться летать в спортзале?', a: 'mob', e: 'Mobula 7: лёгкий и винты в кольцах.' },
  { q: 'У какого дрона 6 банок и самая большая скорость?', a: 'mark5', e: 'У 5-дюймового: 6 банок, больше 100 км/ч.' },
  { q: 'Какой дрон средний: снимает видео и летает на улице?', a: 'cine', e: '3-дюймовый синевуп.' }
] : [
  { q: 'Первые тренировки и гонки в спортзале - какой класс?', a: 'mob', e: 'Вуп 75 мм: 1S, около 45 г, винты в защите.' },
  { q: 'Нужно плавно снять видео рядом со зданием, винты должны быть в защите. Какой дрон?', a: 'cine', e: '3" синевуп: кольца защищают винты, 4S даёт запас тяги на камеру.' },
  { q: 'Какой дрон летает на 6S и разгоняется больше 120 км/ч?', a: 'mark5', e: '5" фристайл/гонка: 6S, открытые винты 5".' },
  { q: 'Какой дрон точно нельзя запускать в зале и рядом с людьми?', a: 'mark5', e: '5": открытые большие винты и скорость - только поле, далеко от людей.' },
  { q: 'Какой дрон легче 150 г и не требует постановки на учёт?', a: 'mob', e: 'Mobula 7 весит около 45 г. Дроны от 150 г ставят на учёт.' }
] };
function partQuiz() { MODE = 'quiz'; part = 1; qz.i = 0; cmp.hidden = true; DR.forEach(function (x) { x.rule.visible = false; }); wide(); qzAsk(); progress(); }
function qzAsk() { var q = qz.list[qz.i];
  bubble('<span class="chip">ВОПРОС ' + (qz.i + 1) + ' ИЗ ' + qz.list.length + '</span><br>' + q.q + '<br><small style="color:#b9c6e6">Нажми на дрон или на кнопку.</small>', ''); say(q.q);
  actions(DR.map(function (d) { return { t: d.name, cls: 'w', f: function (b) { answer(d.id, b); } }; })); }
function answer(id, b) { var q = qz.list[qz.i]; if (!q) return;
  if (id === q.a) { if (b) b.classList.add('ok'); var d = DR.find(function (x) { return x.id === id; }); d.ring.scale.setScalar(1.15); setTimeout(function () { d.ring.scale.setScalar(1); }, 600);
    qz.i++; progress(); bubble('<span class="chip">ВЕРНО</span><br>' + q.e, 'ok'); say(q.e); actions([]); setTimeout(qz.i >= qz.list.length ? finish : qzAsk, 1500); }
  else { if (b) b.classList.add('no'); bubble('<span class="chip">НЕ ТО</span><br>' + q.q + '<br><small style="color:#ffb3b8">Подумай про размер, банки и где летает.</small>', 'bad'); } }
function finish() { MODE = 'done'; part = 2; progress(); lsS(KEY, '1'); try { localStorage.setItem(KEY + '_best', '100'); } catch (e) {}
  bubble('<span class="chip">ТРЕНАЖЁР ПРОЙДЕН</span><br>' + (KID ? 'Ты знаешь три класса дронов: маленький для зала, средний для съёмки и большой для поля.' : 'Классы изучены: вуп 1S для зала, 3" 4S для съёмки, 5" 6S для фристайла и гонок в поле.'), 'ok');
  say('Тренажёр пройден!'); auto = true; actions([{ t: 'Ещё раз', f: function () { location.reload(); } }, { t: 'Назад в курс', cls: 'pri', f: function () { history.back(); } }]); }

window.SBG = { st: function () { return { stage: MODE === 'done' ? 'done' : MODE }; }, qz: qz, DR: DR, sc: sc,
  jump: function (p) { if (p === 'quiz') partQuiz(); else if (p === 'learn') partLearn(); else if (p === 'all') DR.forEach(function (d) { seen[d.id] = 1; }); },
  show: function (i) { show(DR[i]); }, answer: function (id) { answer(id); } };

/* ---------- кадр ---------- */
var clock = new T.Clock();
function loop() { requestAnimationFrame(loop); var dt = Math.min(clock.getDelta(), .1), t = clock.elapsedTime;
  if (fly) { fly.k = Math.min(1, fly.k + dt / fly.d); var k = fly.k < .5 ? 4 * fly.k * fly.k * fly.k : 1 - Math.pow(-2 * fly.k + 2, 3) / 2;
    orb.th = fly.a.th + (fly.b.th - fly.a.th) * k; orb.ph = fly.a.ph + (fly.b.ph - fly.a.ph) * k; orb.r = fly.a.r + (fly.b.r - fly.a.r) * k; orb.tgt.lerpVectors(fly.a.t, fly.b.t, k); if (fly.k >= 1) fly = null; }
  if (auto && !down && !fly) orb.th += dt * .12;
  cam.position.copy(camPose()); cam.lookAt(orb.tgt);
  DR.forEach(function (d, i) { d.m.rotation.y = Math.sin(t * .4 + i) * .5 + .3; d.m.position.y = .38 + Math.sin(t * 1.6 + i) * .015;
    d.ring.material.color.copy(new T.Color(d.col)).multiplyScalar(1 + .25 * Math.sin(t * 2 + i)); });
  ren.render(sc, cam); }
partLearn(); loop();
document.getElementById('back').onclick = function () { history.back(); };
var sb = document.getElementById('snd'); if (window.GOLOS) { sb.textContent = GOLOS.on ? '🔊' : '🔇'; sb.onclick = function () { GOLOS.setOn(!GOLOS.on); sb.textContent = GOLOS.on ? '🔊' : '🔇'; }; }
})();
