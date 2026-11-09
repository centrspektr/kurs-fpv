/* Модуль 2 "Мастерская" - проба помещения от первого лица (09.11.2026).
   Варианты (?v=A|B|C):
   A - "Экраны вдоль стен": большой монитор с теорией на дальней стене, задания - стенды вдоль стен по кругу, в центре сборочный стол.
   B - "Один большой экран": огромный экран во всю стену, на нём по очереди теория и задания; стол и декорации вокруг.
   C - "Отсеки по системам": вдоль стен отсеки Полёт, Мозг, Видео, Управление со своими предметами, в конце зал сборки.
   Управление: нажми на пол - идёшь туда; нажми на экран или стол - подходишь; тяни - осматриваешься; колесо - шаг вперёд/назад.
   ?cam=top - вид сверху (для картинок), ?shot=1 - без подсказок. */
(function () {
'use strict';
var T = THREE, Q = new URLSearchParams(location.search), VAR = (Q.get('v') || 'A').toUpperCase(), SHOT = Q.get('shot') === '1';
var W = 24, D = 17, H = 6.2, EYE = 1.6, TOP = new URLSearchParams(location.search).get('cam') === 'top';

/* ---------- рендер ---------- */
var R = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, SHOT ? 2 : 1.75)); R.setSize(innerWidth, innerHeight);
R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .9;
R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
document.body.prepend(R.domElement);
var S = new T.Scene(); S.background = new T.Color('#05060f'); S.fog = new T.Fog('#070914', 26, 60);
var pm = new T.PMREMGenerator(R); S.environment = pm.fromScene(new T.RoomEnvironment(), .04).texture;
var CAM = new T.PerspectiveCamera(64, innerWidth / innerHeight, .05, 200);
addEventListener('resize', function () { CAM.aspect = innerWidth / innerHeight; CAM.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); });

/* ---------- помощники ---------- */
function cv(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.userData = { c: c, x: x }; return t; }
function M(o) { return new T.MeshStandardMaterial(o); }
function box(w, h, d, m, x, y, z, g) { var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; (g || S).add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, g, seg) { var o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; (g || S).add(o); return o; }
function grp(x, y, z, ry, p) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; (p || S).add(g); return g; }
function glow(col, i) { return new T.MeshBasicMaterial({ color: col, toneMapped: false, transparent: i != null, opacity: i == null ? 1 : i }); }
var TICK = [];
var FONT = '"Manrope","Segoe UI",Roboto,system-ui,sans-serif', MONO = 'ui-monospace,"JetBrains Mono",Menlo,monospace';
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function wrap(x, s, X, Y, maxW, lh) { var w = s.split(' '), line = ''; for (var i = 0; i < w.length; i++) { var t = line ? line + ' ' + w[i] : w[i]; if (x.measureText(t).width > maxW && line) { x.fillText(line, X, Y); Y += lh; line = w[i]; } else line = t; } if (line) x.fillText(line, X, Y); return Y; }

/* цвета модуля и неона */
var C = { cy: '#7cf3ff', pk: '#ff7ce0', ye: '#ffd36e', gr: '#9dff7c', or: '#ff9f5a', vi: '#a78bfa' }, MC = C.pk; /* модуль 2 - розовый */

/* ---------- данные модуля 2 ---------- */
var TASKS = [
  ['Рама, моторы и винты', 'материал · тренажёр · проверка', 'done'],
  ['Мозг дрона', 'материал · тренажёр · проверка', 'done'],
  ['Камера, видеопередатчик и очки', 'материал · тренажёр · проверка', 'now'],
  ['Пульт и приёмник', 'материал · тренажёр · проверка', 'lock'],
  ['Полёт: круг вокруг точки', 'симулятор', 'lock'],
  ['Собери дрон по системам', 'стол сборки · мастерская', 'lock'],
  ['Повторение: безопасность', 'тренажёр · проверка', 'lock'],
  ['На занятии: назови узлы', 'с тренером', 'lock'],
  ['Итог модуля', 'финальная проверка', 'lock']
];
var STC = { done: C.gr, now: C.ye, lock: '#64748b' };

/* слайды теории на большом мониторе (картинки - рисунки курса из kartinki.js) */
var SLIDES = [
  { h: 'Из чего состоит FPV-дрон', p: 'Четыре системы: полёт, управление, видео и питание. Сегодня разберём каждую.', pic: 'razmer' },
  { h: 'Рама - основа дрона', p: 'Карбон: лёгкий и прочный. Лучи, центральная плита, стойки для плат.', pic: 'rama' },
  { h: 'Бесколлекторный мотор', p: 'Колокол с магнитами крутится вокруг медных катушек. Щёток нет - мотор мощный и живёт долго.', pic: 'motor' },
  { h: 'Винт - вращающееся крыло', p: 'Лопасти отбрасывают воздух вниз, дрон поднимается. Соседние винты крутятся в разные стороны.', pic: 'vint' },
  { h: 'Полётный контроллер', p: 'Плата-мозг с гироскопом. Тысячи раз в секунду поправляет моторы, чтобы дрон держался ровно.', pic: 'fc' },
  { h: 'Регулятор 4 в 1', p: 'Получает команду от контроллера и крутит каждый из четырёх моторов.', pic: 'esc' },
  { h: 'Камера и видеопередатчик', p: 'Камера снимает, видеопередатчик через антенну шлёт картинку в очки пилота.', pic: 'vtx' },
  { h: 'Пульт и приёмник', p: 'Приёмник слушает только свой пульт. Пропала связь - failsafe выключит моторы.', pic: 'rx' },
  { h: 'Размеры дронов', p: 'Вуп 75 мм - для зала. 3 дюйма - быстрее. 5 дюймов - главный гоночный класс.', pic: 'dron:5' }
];
var IMG = {};
/* рисунок SVG -> картинка (стили kartinki.js внутрь SVG, чтобы подписи были видны и в canvas) */
var SVGCSS = '.kk-t{fill:#cbd5ff;font:600 12px system-ui,sans-serif;text-anchor:middle}.kk-tb{fill:#fff;font:800 12px system-ui,sans-serif;text-anchor:middle}.kk-ts{fill:#cbd5ff;font:700 10px system-ui,sans-serif;text-anchor:middle}.kk-m{font-family:ui-monospace,monospace}';
function svgImg(k, cb) {
  if (IMG[k]) { if (IMG[k].complete) cb(IMG[k]); else IMG[k].addEventListener('load', function () { cb(IMG[k]); }); return; }
  var s = (window.VZ_KURS && VZ_KURS.pic && VZ_KURS.pic(k)) || ''; if (!s) return;
  s = s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" ').replace(/class="kpic"/, '').replace('>', '><style>' + SVGCSS + '</style>');
  var im = new Image(); IMG[k] = im; im.onload = function () { cb(im); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}

/* ---------- текстуры помещения ---------- */
var floorTx = cv(1024, 1024, function (x, w) {
  x.fillStyle = '#0a0c18'; x.fillRect(0, 0, w, w);
  for (var i = 0; i < 2600; i++) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * .025) + ')'; x.fillRect(Math.random() * w, Math.random() * w, 2, 2); }
  x.strokeStyle = 'rgba(124,243,255,.10)'; x.lineWidth = 2; for (i = 0; i <= w; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
});
floorTx.wrapS = floorTx.wrapT = T.RepeatWrapping; floorTx.repeat.set(W / 4, D / 4);
var wallTx = cv(512, 512, function (x, w) {
  x.fillStyle = '#0f1226'; x.fillRect(0, 0, w, w);
  x.fillStyle = '#151a33'; for (var i = 0; i < 4; i++) { x.fillRect(8 + i * 128, 8, 112, 496); }
  x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 4; for (i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, w); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.05)'; for (i = 0; i < 4; i++) for (var j = 0; j < 6; j++) { x.beginPath(); x.arc(20 + i * 128, 30 + j * 85, 3, 0, 7); x.fill(); }
});
wallTx.wrapS = wallTx.wrapT = T.RepeatWrapping;
var starTx = cv(2048, 512, function (x, w, h) {
  var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#02030a'); g.addColorStop(1, '#0a0620'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  var n = x.createRadialGradient(w * .7, h * .45, 10, w * .7, h * .45, h * .9); n.addColorStop(0, 'rgba(255,124,224,.30)'); n.addColorStop(.5, 'rgba(124,90,255,.12)'); n.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = n; x.fillRect(0, 0, w, h);
  for (var i = 0; i < 1400; i++) { var r = Math.random(); x.fillStyle = 'rgba(255,255,255,' + (.3 + r * .7) + ')'; x.fillRect(Math.random() * w, Math.random() * h, r > .97 ? 3 : 1.5, r > .97 ? 3 : 1.5); }
  x.fillStyle = '#ffb3e8'; x.beginPath(); x.arc(w * .22, h * .35, 26, 0, 7); x.fill();
});

/* ---------- помещение ---------- */
var mFloor = M({ map: floorTx, roughness: .28, metalness: .5, color: '#ffffff', envMapIntensity: .35 });
var mWall = M({ map: wallTx, roughness: .8, metalness: .2 }), mDark = M({ color: '#0e1224', roughness: .7, metalness: .4 });
var mMetal = M({ color: '#8b93b0', roughness: .35, metalness: .85 }), mSteel = M({ color: '#2a3048', roughness: .45, metalness: .7 });
var mWood = M({ color: '#6b4a32', roughness: .6 }), mMat = M({ color: '#13532f', roughness: .9 }), mCarbon = M({ color: '#1a1d24', roughness: .35, metalness: .3 });
var CLICK = []; /* то, что можно нажать: {o, at:[x,z], look:[x,y,z], cap, act} */

function room() {
  var f = new T.Mesh(new T.PlaneGeometry(W, D), mFloor); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; S.add(f); f.userData.floor = 1; FLOOR = f;
  var c = new T.Mesh(new T.PlaneGeometry(W, D), mDark); c.rotation.x = Math.PI / 2; c.position.y = H; S.add(c); if (TOP) c.visible = false;
  /* стены: левая, правая, дальняя, ближняя (с воротами) */
  function wall(w, x, z, ry, rep) { var t = wallTx.clone(); t.needsUpdate = true; t.repeat.set(rep, 1.6); var m = mWall.clone(); m.map = t; var o = new T.Mesh(new T.PlaneGeometry(w, H), m); o.position.set(x, H / 2, z); o.rotation.y = ry; o.receiveShadow = true; S.add(o); return o; }
  var wl = wall(D, -W / 2, 0, Math.PI / 2, 5); wall(D, W / 2, 0, -Math.PI / 2, 5); wall(W, 0, -D / 2, 0, 7); var wn = wall(W, 0, D / 2, Math.PI, 7); if (TOP) { wl.visible = wn.visible = false; }
  /* окно в космос на правой стене (ангар: окна в космос) */
  var win = new T.Mesh(new T.PlaneGeometry(14, 2.2), new T.MeshBasicMaterial({ map: starTx, toneMapped: false })); win.position.set(W / 2 - .03, 4.1, -1); win.rotation.y = -Math.PI / 2; S.add(win);
  for (var i = 0; i <= 7; i++) box(.12, 2.4, .14, mSteel, W / 2 - .08, 4.1, -8 + i * 2);
  box(.16, .14, 14.2, mSteel, W / 2 - .08, 5.25, -1); box(.16, .14, 14.2, mSteel, W / 2 - .08, 2.95, -1);
  /* плинтус-подсветка по низу стен */
  [[W, 0, -D / 2 + .02, 0], [W, 0, D / 2 - .02, 0, 1], [D, -W / 2 + .02, 0, Math.PI / 2, 1], [D, W / 2 - .02, 0, Math.PI / 2]].forEach(function (s) { if (TOP && s[4]) return; var o = box(s[0], .05, .04, glow(MC), s[1], .12, s[2]); o.rotation.y = s[3]; o.castShadow = false; });
  [[W, 0, -D / 2 + .02, 0], [D, -W / 2 + .02, 0, Math.PI / 2, 1]].forEach(function (s) { if (TOP && s[4]) return; var o = box(s[0], .04, .04, glow(C.cy), s[1], H - .5, s[2]); o.rotation.y = s[3]; o.castShadow = false; });
  /* потолок: фермы и световые панели */
  var CG = new T.Group(); S.add(CG); if (TOP) CG.visible = false;
  for (i = -2; i <= 2; i++) { box(W, .3, .3, mSteel, 0, H - .25, i * 3.6, CG); for (var k = -6; k <= 6; k++) { var d = box(.06, .42, .06, mSteel, k * 2, H - .48, i * 3.6, CG); d.rotation.z = (k % 2 ? 1 : -1) * .7; } }
  for (i = -2; i <= 2; i++) for (k = -1; k <= 1; k++) { var p = box(3.6, .06, .5, glow('#cfd8ff'), k * 7, H - .3, i * 3.6 + 1.8, CG); p.castShadow = false; }
  /* свет */
  S.add(new T.HemisphereLight('#8090ff', '#140a26', .35));
  var key = new T.DirectionalLight('#fff4e8', .9); key.position.set(6, 14, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); var sc = key.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 12; sc.bottom = -12; sc.far = 40; key.shadow.bias = -.0004; S.add(key);
  [[-7, -3], [7, -3], [0, 4]].forEach(function (p) { var l = new T.PointLight('#c7d2ff', .5, 16, 2); l.position.set(p[0], H - .6, p[1]); S.add(l); });
}
var FLOOR;

/* светящееся кольцо на полу */
function ring(x, z, r, col, g) { var o = new T.Mesh(new T.RingGeometry(r * .86, r, 64), glow(col, .85)); o.rotation.x = -Math.PI / 2; o.position.set(x, .012, z); (g || S).add(o);
  var o2 = new T.Mesh(new T.CircleGeometry(r * .86, 48), glow(col, .07)); o2.rotation.x = -Math.PI / 2; o2.position.set(x, .011, z); (g || S).add(o2);
  TICK.push(function (t) { o.material.opacity = .55 + Math.sin(t * 2.4 + x) * .3; }); return o; }

/* надпись-табличка (спрайт) */
function label(txt, sub, col, x, y, z, s) {
  var t = cv(1024, 256, function (c, w, h) { c.font = '900 92px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = 40; c.fillStyle = col; c.fillText(txt, w / 2, sub ? 96 : h / 2); c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillText(txt, w / 2, sub ? 96 : h / 2);
    if (sub) { c.shadowBlur = 0; c.font = '700 44px ' + FONT; c.fillStyle = '#dbe3ff'; c.fillText(sub, w / 2, 200); } });
  var sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false })); sp.scale.set(4 * (s || 1), 1 * (s || 1), 1); sp.position.set(x, y, z); S.add(sp); return sp;
}

/* ---------- стенд задания ---------- */
function screenTx(n, t, sub, st) {
  return cv(768, 480, function (x, w, h) {
    var col = STC[st]; x.fillStyle = '#060a18'; x.fillRect(0, 0, w, h);
    var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,124,224,.18)'); g.addColorStop(1, 'rgba(124,243,255,.10)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = MC; x.fillRect(0, 0, w, 74); x.fillStyle = '#14051f'; x.font = '900 40px ' + MONO; x.textBaseline = 'middle'; x.fillText('ЗАДАНИЕ ' + n, 30, 38);
    x.textAlign = 'right'; x.fillText(st === 'done' ? '✓' : st === 'now' ? '▶' : '🔒', w - 30, 40); x.textAlign = 'left';
    x.fillStyle = '#fff'; x.font = '800 54px ' + FONT; x.textBaseline = 'top'; var y = wrap(x, t, 30, 110, w - 60, 62);
    x.fillStyle = '#b9c3ef'; x.font = '600 32px ' + FONT; x.fillText(sub, 30, y + 78);
    x.fillStyle = col; rr(x, 30, h - 84, 260, 52, 26); x.fill(); x.fillStyle = '#0b1020'; x.font = '800 28px ' + FONT; x.textBaseline = 'middle';
    x.fillText(st === 'done' ? 'Пройдено' : st === 'now' ? 'Сейчас - начни' : 'Откроется позже', 50, h - 57);
    x.strokeStyle = 'rgba(255,255,255,.06)'; for (var i = 0; i < h; i += 4) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  });
}
function stand(n, x, z, ry) {
  var tk = TASKS[n - 1], st = tk[2], g = grp(x, 0, z, ry);
  box(1.5, .1, .8, mSteel, 0, .05, 0, g); box(.14, 1.2, .14, mMetal, -.5, .65, 0, g); box(.14, 1.2, .14, mMetal, .5, .65, 0, g);
  var fr = grp(0, 1.65, 0, 0, g); fr.rotation.x = -.18;
  box(1.86, 1.2, .1, mDark, 0, 0, 0, fr);
  var sc = new T.Mesh(new T.PlaneGeometry(1.7, 1.06), new T.MeshBasicMaterial({ map: screenTx(n, tk[0], tk[1], st), toneMapped: false })); sc.position.z = .056; fr.add(sc);
  var edge = box(1.92, 1.26, .04, glow(st === 'lock' ? '#334155' : MC), 0, 0, -.04, fr); edge.castShadow = false;
  /* антенна с огоньком и номером */
  box(.04, .5, .04, mMetal, 0, .85, 0, fr); var bulb = new T.Mesh(new T.SphereGeometry(.06, 16, 12), glow(STC[st])); bulb.position.set(0, 1.12, 0); fr.add(bulb);
  TICK.push(function (t) { bulb.visible = st !== 'now' || Math.sin(t * 6) > -.3; });
  ring(0, .9, .7, STC[st], g).position.set(0, .012, .95);
  var at = new T.Vector3(0, 0, 2.2).applyAxisAngle(new T.Vector3(0, 1, 0), ry).add(new T.Vector3(x, 0, z));
  CLICK.push({ o: g, at: [at.x, at.z], look: [x, 1.6, z], cap: '<b>Задание ' + n + '. ' + tk[0] + '</b>' + (st === 'lock' ? 'Откроется после предыдущего задания' : st === 'done' ? 'Пройдено. Нажми ещё раз - повторить' : 'Нажми ещё раз - начать') });
  return g;
}

/* ---------- большой монитор с теорией ---------- */
function monitor(w, h, x, y, z, ry, opts) {
  opts = opts || {};
  var g = grp(x, y, z, ry); box(w + .3, h + .3, .2, mDark, 0, 0, -.1, g); var e = box(w + .36, h + .36, .05, glow(MC), 0, 0, -.2, g); e.castShadow = false;
  var tx = cv(1600, Math.round(1600 * h / w), function () {}), cx = tx.userData.x, cw = tx.userData.c.width, ch = tx.userData.c.height;
  var sc = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, toneMapped: false })); sc.position.z = .01; g.add(sc);
  var k = 0, t0 = 0, list = opts.list || SLIDES;
  function draw(i, a) {
    var s = list[i % list.length]; cx.globalAlpha = 1; cx.fillStyle = '#050816'; cx.fillRect(0, 0, cw, ch);
    var gr = cx.createRadialGradient(cw * .2, ch * .1, 10, cw * .2, ch * .1, cw * .9); gr.addColorStop(0, 'rgba(255,124,224,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, cw, ch);
    cx.globalAlpha = a;
    cx.fillStyle = MC; cx.font = '800 30px ' + MONO; cx.textBaseline = 'top'; cx.fillText(opts.tag || 'МАСТЕРСКАЯ · ТЕОРИЯ ' + ((i % list.length) + 1) + '/' + list.length, 60, 46);
    cx.fillStyle = '#fff'; cx.font = '900 76px ' + FONT; wrap(cx, s.h, 60, 100, cw * .5, 84);
    cx.fillStyle = '#cfd7ff'; cx.font = '600 40px ' + FONT; wrap(cx, s.p, 60, ch * .5, cw * .44, 52);
    if (s.pic) svgImg(s.pic, function (im) { if (list[k % list.length] !== s) return; cx.globalAlpha = a; var iw = cw * .44, ih = iw * 420 / 720; cx.drawImage(im, cw * .53, (ch - ih) / 2 + 10, iw, ih); tx.needsUpdate = true; });
    if (s.list) { cx.font = '700 38px ' + FONT; s.list.forEach(function (r, j) { var y = 140 + j * 62, col = STC[r[2]]; cx.fillStyle = col; rr(cx, cw * .55, y, 18, 18, 9); cx.fill(); cx.fillStyle = r[2] === 'lock' ? '#7b86ad' : '#fff'; cx.fillText((j + 1) + '. ' + r[0], cw * .55 + 36, y - 10); }); }
    /* полоска прогресса слайдов */
    cx.globalAlpha = 1; for (var j = 0; j < list.length; j++) { cx.fillStyle = j === i % list.length ? MC : 'rgba(255,255,255,.18)'; cx.fillRect(60 + j * 64, ch - 54, 52, 8); }
    cx.strokeStyle = 'rgba(255,255,255,.035)'; for (j = 0; j < ch; j += 4) { cx.beginPath(); cx.moveTo(0, j); cx.lineTo(cw, j); cx.stroke(); }
    tx.needsUpdate = true;
  }
  draw(0, 1);
  if (!SHOT) TICK.push(function (t) { if (!t0) t0 = t; var u = t - t0; if (u > 7) { k++; t0 = t; draw(k, .15); } else if (u < .6) draw(k, Math.min(1, .15 + u * 1.5)); });
  var L = new T.RectAreaLight ? null : null; /* свет от экрана */
  var pl = new T.PointLight(MC, .6, 9, 2); pl.position.set(0, 0, 1.5); g.add(pl);
  return g;
}

/* ---------- сборочный стол ---------- */
function quadModel(s, col) {
  var g = new T.Group(), arm = M({ color: '#16181e', roughness: .4, metalness: .3 });
  [Math.PI / 4, -Math.PI / 4].forEach(function (a) { var b = box(1.3 * s, .03 * s, .14 * s, arm, 0, 0, 0, g); b.rotation.y = a; });
  box(.34 * s, .05 * s, .34 * s, arm, 0, .02 * s, 0, g); box(.26 * s, .12 * s, .3 * s, M({ color: col || '#333a52', roughness: .5 }), 0, .1 * s, 0, g);
  var props = [];
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p, i) { var x = p[0] * .46 * s, z = p[1] * .46 * s;
    cyl(.07 * s, .07 * s, .09 * s, M({ color: '#a855f7', roughness: .3, metalness: .6 }), x, .06 * s, z, g);
    var pr = new T.Mesh(new T.BoxGeometry(.62 * s, .006 * s, .06 * s), M({ color: i % 3 ? '#38bdf8' : '#ff7ce0', transparent: true, opacity: .85 })); pr.position.set(x, .12 * s, z); g.add(pr); props.push([pr, i % 3 ? 1 : -1]); });
  g.userData.props = props; return g;
}
function bench(x, z, ry, big) {
  var g = grp(x, 0, z, ry);
  box(3.4, .1, 1.6, mWood, 0, .92, 0, g); box(3.2, .02, 1.4, mMat, 0, .98, 0, g);
  [[-1.55, -.7], [1.55, -.7], [-1.55, .7], [1.55, .7]].forEach(function (p) { box(.1, .9, .1, mSteel, p[0], .45, p[1], g); });
  box(3.2, .06, 1.4, mSteel, 0, .25, 0, g);
  /* рама на столе и детали */
  var q = quadModel(1.1); q.position.set(0, 1.0, 0); g.add(q); q.userData.props.forEach(function (p) { p[0].visible = false; });
  for (var i = 0; i < 4; i++) cyl(.07, .07, .09, M({ color: '#a855f7', metalness: .6, roughness: .3 }), -1.25 + i * .2, 1.04, .45, g);
  box(.36, .02, .36, M({ color: '#0f5132', roughness: .6 }), .9, 1.0, .35, g); box(.12, .03, .12, M({ color: '#111' }), .9, 1.02, .35, g);
  box(.3, .02, .3, M({ color: '#1e3a8a', roughness: .6 }), 1.25, 1.0, -.1, g);
  var cam = box(.1, .1, .1, M({ color: '#222' }), -1.1, 1.04, -.35, g); cyl(.035, .035, .05, M({ color: '#1e3a8a', metalness: .8, roughness: .1 }), -1.1, 1.04, -.4, g).rotation.x = Math.PI / 2;
  /* паяльная станция с цифрами */
  var ps = box(.5, .28, .36, M({ color: '#1f2433', roughness: .5 }), 1.25, 1.12, -.5, g);
  var dsp = new T.Mesh(new T.PlaneGeometry(.3, .12), new T.MeshBasicMaterial({ map: cv(256, 100, function (c) { c.fillStyle = '#100'; c.fillRect(0, 0, 256, 100); c.fillStyle = '#ff5a3c'; c.font = '900 72px ' + MONO; c.fillText('330°', 26, 78); }), toneMapped: false })); dsp.position.set(1.25, 1.14, -.315); g.add(dsp);
  /* лампа на кронштейне */
  box(.05, .9, .05, mMetal, -1.5, 1.4, -.6, g); var arm2 = box(.05, .05, .9, mMetal, -1.5, 1.85, -.2, g); var head = cyl(.18, .1, .16, mDark, -1.5, 1.78, .22, g); var bl = new T.Mesh(new T.CircleGeometry(.16, 24), glow('#fff6dc')); bl.rotation.x = Math.PI / 2; bl.position.set(-1.5, 1.69, .22); g.add(bl);
  var sl = new T.SpotLight('#fff1d6', 1.6, 5, .7, .5, 1.5); sl.position.set(-1.5, 1.7, .22); sl.target.position.set(0, 1, 0); g.add(sl); g.add(sl.target);
  /* голограмма над столом */
  var holo = quadModel(.9, '#ff7ce0'); holo.position.set(0, 2.25, 0); holo.traverse(function (o) { if (o.material) { o.material = new T.MeshBasicMaterial({ color: C.cy, wireframe: true, transparent: true, opacity: .55, toneMapped: false }); } }); g.add(holo);
  var cone = new T.Mesh(new T.ConeGeometry(.9, 1.1, 32, 1, true), glow(C.cy, .08)); cone.position.set(0, 1.62, 0); cone.rotation.x = Math.PI; g.add(cone);
  TICK.push(function (t) { holo.rotation.y = t * .6; holo.position.y = 2.25 + Math.sin(t * 1.6) * .06; });
  ring(0, 0, 2.4, C.cy, g);
  label('СОБЕРИ ДРОН', big ? 'задание 6 · подойди к столу' : 'стол сборки', C.cy, x, 2.95, z, .7);
  var at = new T.Vector3(0, 0, 1.9).applyAxisAngle(new T.Vector3(0, 1, 0), ry).add(new T.Vector3(x, 0, z));
  CLICK.push({ o: g, at: [at.x, at.z], look: [x, 1.0, z], cap: '<b>Стол сборки</b>Нажми ещё раз - и ты внутри мастерской "Собери дрон"', act: 'sborka' });
  return g;
}

/* ---------- декорации ---------- */
function shelf(x, z, ry) {
  var g = grp(x, 0, z, ry), cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  [-1, 1].forEach(function (s) { box(.08, 3.2, .6, mSteel, s * 1.5, 1.6, 0, g); });
  for (var i = 0; i < 5; i++) { box(3.1, .05, .6, mSteel, 0, .3 + i * .7, 0, g);
    for (var j = 0; j < 5; j++) { var c = cols[(i + j * 2) % cols.length]; var b = box(.48, .3, .45, M({ color: c, roughness: .55 }), -1.15 + j * .58, .48 + i * .7, .02, g); box(.3, .06, .01, M({ color: '#fff', roughness: .9 }), -1.15 + j * .58, .5 + i * .7, .25, g); } }
  return g;
}
function droneWall(x, z, ry) {
  var g = grp(x, 0, z, ry), pb = M({ color: '#2a2f45', roughness: .8 });
  box(4.2, 2.2, .06, pb, 0, 2.6, 0, g);
  for (var i = 0; i < 3; i++) { var q = quadModel(.75, ['#ff7ce0', '#7cf3ff', '#ffd36e'][i]); q.rotation.x = Math.PI / 2; q.position.set(-1.35 + i * 1.35, 2.6, .12); g.add(q); }
  var t = cv(512, 64, function (c) { c.fillStyle = '#fff'; c.font = '800 34px ' + FONT; c.fillText('Вуп 75 мм · 3 дюйма · 5 дюймов', 20, 44); });
  var p = new T.Mesh(new T.PlaneGeometry(3.2, .4), new T.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); p.position.set(0, 1.7, .05); g.add(p);
  return g;
}
function cage(x, z) {
  var g = grp(x, 0, z), s = 3.4, h = 2.8;
  var e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(s, h, s)), new T.LineBasicMaterial({ color: C.gr })); e.position.y = h / 2; g.add(e);
  var net = cv(256, 256, function (c) { c.strokeStyle = 'rgba(157,255,124,.45)'; c.lineWidth = 2; for (var i = 0; i <= 256; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); } });
  net.wrapS = net.wrapT = T.RepeatWrapping; net.repeat.set(3, 3);
  var nm = new T.MeshBasicMaterial({ map: net, transparent: true, side: T.DoubleSide, depthWrite: false, toneMapped: false });
  [[0, h / 2, s / 2, 0], [0, h / 2, -s / 2, 0], [s / 2, h / 2, 0, Math.PI / 2], [-s / 2, h / 2, 0, Math.PI / 2]].forEach(function (p) { var o = new T.Mesh(new T.PlaneGeometry(s, h), nm); o.position.set(p[0], p[1], p[2]); o.rotation.y = p[3]; g.add(o); });
  for (var i = 0; i < 2; i++) { var gate = new T.Mesh(new T.TorusGeometry(.42, .04, 8, 32), glow(C.or)); gate.position.set(i ? .8 : -.8, 1.1, 0); gate.rotation.y = Math.PI / 2; g.add(gate); }
  var q = quadModel(.32, '#ea580c'); g.add(q);
  TICK.push(function (t) { q.position.set(Math.sin(t * .9) * .9, 1.1 + Math.sin(t * 1.7) * .25, Math.cos(t * .9) * .9); q.rotation.y = -t * .9; q.rotation.z = Math.sin(t * .9) * .2; q.userData.props.forEach(function (p) { p[0].rotation.y += .9 * p[1]; }); });
  label('ПОЛЁТНАЯ КЛЕТКА', 'вуп в зале', C.gr, x, 3.4, z, .7);
  return g;
}
function battCab(x, z, ry) {
  var g = grp(x, 0, z, ry); box(1.6, 2.2, .7, M({ color: '#3a2a12', roughness: .5, metalness: .4 }), 0, 1.1, 0, g);
  for (var i = 0; i < 3; i++) for (var j = 0; j < 4; j++) { box(.3, .14, .3, M({ color: '#facc15', roughness: .5 }), -.54 + j * .36, .55 + i * .55, .25, g); var l = box(.05, .05, .01, glow(j % 3 ? C.gr : C.ye), -.54 + j * .36, .55 + i * .55, .41, g); l.castShadow = false; }
  var t = cv(512, 96, function (c) { c.fillStyle = '#facc15'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#1a1300'; c.font = '900 52px ' + FONT; c.fillText('⚡ LiPo', 150, 66); });
  var p = new T.Mesh(new T.PlaneGeometry(1.4, .26), new T.MeshBasicMaterial({ map: t, toneMapped: false })); p.position.set(0, 2.0, .36); g.add(p);
  return g;
}
function poster(k, x, y, z, ry, w) {
  w = w || 2.2; var t = cv(720, 420, function (c, cw, ch) { c.fillStyle = '#0b1028'; c.fillRect(0, 0, cw, ch); });
  svgImg(k, function (im) { t.userData.x.drawImage(im, 0, 0, 720, 420); t.needsUpdate = true; });
  var g = grp(x, y, z, ry); box(w + .12, w * .58 + .12, .04, mDark, 0, 0, -.03, g);
  var p = new T.Mesh(new T.PlaneGeometry(w, w * .58), new T.MeshBasicMaterial({ map: t, toneMapped: false })); g.add(p); return g;
}
function crate(x, z, s, ry) { var g = grp(x, 0, z, ry || 0); box(s, s * .7, s * .8, M({ color: '#4b5563', roughness: .7 }), 0, s * .35, 0, g); box(s * 1.02, .06, s * .82, M({ color: '#f59e0b' }), 0, s * .5, 0, g); return g; }
function desk(x, z, ry, what) {
  var g = grp(x, 0, z, ry); box(2.4, .08, 1, mSteel, 0, .9, 0, g); [[-1.1, -.4], [1.1, -.4], [-1.1, .4], [1.1, .4]].forEach(function (p) { box(.07, .9, .07, mMetal, p[0], .45, p[1], g); });
  if (what === 'brain') { box(.5, .02, .5, M({ color: '#0f5132' }), -.4, .95, 0, g); box(.5, .02, .5, M({ color: '#1e3a8a' }), .4, .95, 0, g); box(.6, .4, .05, mDark, 0, 1.25, -.35, g); }
  if (what === 'video') { var gg = grp(-.4, 1.02, 0, 0, g); box(.5, .22, .22, M({ color: '#475569', roughness: .4 }), 0, 0, 0, gg); box(.42, .14, .02, glow(C.cy), 0, 0, .12, gg); box(.12, .12, .12, M({ color: '#222' }), .5, .02, 0, g); }
  if (what === 'radio') { var pp = grp(0, 1.0, 0, 0, g); box(.9, .14, .5, M({ color: '#1e293b', roughness: .5 }), 0, 0, 0, pp); cyl(.12, .12, .02, mDark, -.24, .08, 0, pp); cyl(.12, .12, .02, mDark, .24, .08, 0, pp); cyl(.02, .02, .14, mMetal, -.24, .15, 0, pp); cyl(.02, .02, .14, mMetal, .24, .15, 0, pp); }
  if (what === 'frame') { var q = quadModel(.9); q.position.set(-.3, .96, 0); g.add(q); for (var i = 0; i < 4; i++) cyl(.08, .08, .1, M({ color: '#a855f7', metalness: .6 }), .5 + (i % 2) * .22, 1.0, -.15 + (i > 1 ? .25 : 0), g); }
  return g;
}

/* дрон-проводник */
function guide(x, z) { var q = quadModel(.5, '#ff7ce0'); q.position.set(x, 2.2, z); S.add(q); var gl = new T.PointLight(MC, .7, 4, 2); q.add(gl);
  TICK.push(function (t) { q.position.y = 2.2 + Math.sin(t * 2) * .12; q.rotation.y = Math.sin(t * .7) * .4; q.userData.props.forEach(function (p) { p[0].rotation.y += .8 * p[1]; }); }); return q; }

/* ---------- раскладки ---------- */
room();
var START = [0, D / 2 - 2.2], LOOK0 = [0, 1.7, -D / 2];
if (VAR === 'A') {
  monitor(8.6, 4.2, 0, 3.4, -D / 2 + .12, 0);
  /* стенды по часовой: левая стена 1-4, дальняя - 5 справа от монитора, правая стена 7-8, 9 у выхода; 6 - стол в центре */
  stand(1, -W / 2 + 1.3, 5.2, Math.PI / 2); stand(2, -W / 2 + 1.3, 1.4, Math.PI / 2); stand(3, -W / 2 + 1.3, -2.4, Math.PI / 2); stand(4, -W / 2 + 3.6, -D / 2 + 1.4, 0);
  stand(5, W / 2 - 3.6, -D / 2 + 1.4, 0); stand(7, W / 2 - 1.3, -2.4, -Math.PI / 2); stand(8, W / 2 - 1.3, 1.4, -Math.PI / 2); stand(9, W / 2 - 1.3, 5.2, -Math.PI / 2);
  bench(0, 0.2, 0, 1);
  cage(W / 2 - 3.6, -D / 2 + 4.6); shelf(-W / 2 + .5, -D / 2 + 4.2, Math.PI / 2); battCab(-W / 2 + 6.2, -D / 2 + .5, 0);
  droneWall(-6.5, D / 2 - .1, Math.PI); poster('motor', 6.5, 2.6, D / 2 - .06, Math.PI); poster('fc', 9.6, 2.6, D / 2 - .06, Math.PI);
  crate(-8, 6.8, .9, .3); crate(-7.1, 7.2, .7, -.2); crate(8.6, 7, .8, .5);
  guide(-W / 2 + 3.4, -2.4);
} else if (VAR === 'B') {
  /* огромный изогнутый экран во всю дальнюю стену: теория и задания по очереди */
  var LIST = [{ h: 'Модуль 2: устройство дрона', p: 'Смотри экран: здесь по очереди теория и задания. Нажми на экран - начать текущее задание.', list: TASKS }].concat(SLIDES.slice(1, 5));
  monitor(13, 4.8, 0, 3.3, -D / 2 + .12, 0, { list: LIST, tag: 'МАСТЕРСКАЯ · ЭКРАН' });
  [-1, 1].forEach(function (s) { var g = monitor(4.4, 3.2, s * 9.2, 3.0, -D / 2 + 1.6, -s * .55, { list: s < 0 ? [SLIDES[6], SLIDES[2]] : [SLIDES[7], SLIDES[4]], tag: s < 0 ? 'СИСТЕМА: ВИДЕО' : 'СИСТЕМА: УПРАВЛЕНИЕ' }); });
  var pod = cyl(2.2, 2.4, .25, mSteel, 0, .12, -2.2); ring(0, -2.2, 2.6, MC);
  CLICK.push({ o: pod, at: [0, -1.4], look: [0, 3.2, -D / 2], cap: '<b>Задание 3. Камера, видеопередатчик и очки</b>Нажми на экран - начать' });
  bench(-5.6, -1.4, .5, 1); cage(5.6, 1.8); shelf(-W / 2 + .5, -1.5, Math.PI / 2); battCab(W / 2 - .5, -5.5, -Math.PI / 2);
  droneWall(0, D / 2 - .1, Math.PI); crate(-9.5, 7, .9, .2); crate(10, 6.6, .8, -.3);
  poster('kamera', W / 2 - .06, 2.4, 6.4, -Math.PI / 2); poster('pult', -W / 2 + .06, 2.4, 5.5, Math.PI / 2);
  guide(0, -3.4); START = [0, D / 2 - 2.6];
} else {
  /* C: отсеки по системам вдоль стен, у каждого цвет, стенд-задание и свои предметы; зал сборки в конце */
  var BAYS = [['ПОЛЁТ', 'рама · моторы · винты', C.cy, -1, 3.6, 1, 'frame'], ['МОЗГ', 'контроллер · регулятор', C.gr, -1, -2.6, 2, 'brain'],
    ['ВИДЕО', 'камера · передатчик · очки', C.vi, 1, -2.6, 3, 'video'], ['УПРАВЛЕНИЕ', 'пульт · приёмник', C.ye, 1, 3.6, 4, 'radio']];
  BAYS.forEach(function (b) { var sx = b[3], z = b[4], x = sx * (W / 2 - 3.2);
    var fz = new T.Mesh(new T.PlaneGeometry(6.2, 5.4), glow(b[2], .06)); fz.rotation.x = -Math.PI / 2; fz.position.set(sx * (W / 2 - 3.1), .013, z); S.add(fz);
    [-2.7, 2.7].forEach(function (dz) { box(4.2, 1.3, .12, mSteel, sx * (W / 2 - 2.1), .65, z + dz); var st = box(4.2, .05, .14, glow(b[2]), sx * (W / 2 - 2.1), 1.32, z + dz); st.castShadow = false; });
    label(b[0], b[1], b[2], sx * (W / 2 - .4), 4.9, z, .9);
    desk(sx * (W / 2 - 1.2), z - 1, sx * -Math.PI / 2, b[6]);
    stand(b[5], sx * (W / 2 - 4.6), z + .6, -sx * Math.PI / 2); });
  monitor(7.4, 3.6, 0, 3.6, -D / 2 + .12, 0);
  bench(0, -4.6, 0, 1); stand(5, -3.2, 1.2, .35); cage(4.6, 1.4);
  stand(7, -8.8, D / 2 - 2.2, Math.PI * .85); stand(8, 8.8, D / 2 - 2.2, -Math.PI * .85); stand(9, 3.4, -6.4, -.25);
  label('ЗАЛ СБОРКИ', 'финал модуля', C.cy, 0, 5.9, -D / 2 + .4, 1);
  guide(-W / 2 + 6.4, 4.2);
}

S.traverse(function (o) { if (o.material && o.material.isMeshStandardMaterial && o.material.envMapIntensity === 1) o.material.envMapIntensity = .4; });
/* ---------- камера от первого лица: ходьба по нажатию ---------- */
var pos = new T.Vector3(START[0], EYE, START[1]), yaw = 0, pitch = -.06, target = null, lookAt = null;
(function () { var d = new T.Vector3(LOOK0[0] - pos.x, 0, LOOK0[2] - pos.z); yaw = Math.atan2(-d.x, -d.z); })();
if (Q.get('cam') === 'top') { CAM.fov = 52; CAM.updateProjectionMatrix(); }
var capEl = document.getElementById('cap'), tipEl = document.getElementById('tip'), varsEl = document.getElementById('vars');
['A', 'B', 'C'].forEach(function (v) { var a = document.createElement('a'); a.textContent = v; a.href = '?v=' + v; if (v === VAR) a.className = 'on'; varsEl.appendChild(a); });
if (SHOT) { tipEl.style.display = 'none'; document.getElementById('hud').style.display = 'none'; }
var ray = new T.Raycaster(), mp = new T.Vector2(), drag = null, sel = null;
R.domElement.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch, moved: false }; });
addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; if (drag.moved) { yaw = drag.yaw + dx * .005; pitch = Math.max(-1, Math.min(.8, drag.pitch + dy * .004)); lookAt = null; } });
addEventListener('pointerup', function (e) { var d = drag; drag = null; if (!d || d.moved) return; tap(e.clientX, e.clientY); });
R.domElement.addEventListener('wheel', function (e) { var f = new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); target = pos.clone().addScaledVector(f, e.deltaY < 0 ? 1.5 : -1.5); clampP(target); }, { passive: true });
addEventListener('keydown', function (e) { var f = new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new T.Vector3(-f.z, 0, f.x), k = e.key.toLowerCase(), v = null;
  if (k === 'w' || k === 'arrowup' || k === 'ц') v = f; if (k === 's' || k === 'arrowdown' || k === 'ы') v = f.clone().negate(); if (k === 'a' || k === 'ф') v = r.clone().negate(); if (k === 'd' || k === 'в') v = r;
  if (k === 'arrowleft') yaw += .12; if (k === 'arrowright') yaw -= .12; if (v) { target = pos.clone().addScaledVector(v, 1.2); clampP(target); } });
function clampP(p) { p.x = Math.max(-W / 2 + .8, Math.min(W / 2 - .8, p.x)); p.z = Math.max(-D / 2 + .8, Math.min(D / 2 - .8, p.z)); p.y = EYE; }
function tap(cx, cy) {
  mp.set(cx / innerWidth * 2 - 1, -cy / innerHeight * 2 + 1); ray.setFromCamera(mp, CAM);
  var objs = CLICK.map(function (c) { return c.o; }).concat([FLOOR]), hit = ray.intersectObjects(objs, true)[0]; if (!hit) return;
  var o = hit.object, c = null; while (o && !c) { c = CLICK.find(function (z) { return z.o === o; }); o = o.parent; }
  if (c) { if (sel === c) { act(c); return; } sel = c; target = new T.Vector3(c.at[0], EYE, c.at[1]); lookAt = new T.Vector3(c.look[0], c.look[1], c.look[2]); capEl.innerHTML = c.cap; capEl.style.display = 'block'; return; }
  sel = null; capEl.style.display = 'none'; target = hit.point.clone(); clampP(target);
}
function act(c) { if (c.act === 'sborka') { capEl.innerHTML = '<b>Проваливаемся в мастерскую...</b>В курсе здесь откроется игра "Собери дрон"'; dive = 1; } else capEl.innerHTML = c.cap.replace(/Нажми ещё раз - [^<]*/, 'В курсе здесь откроется задание'); }
var dive = 0;

/* вид сверху для картинок */
var TOPP = { A: [[-15, 15, 16], [0, 0, -1]], B: [[-15, 15, 16], [0, 0, -1]], C: [[-15, 15, 16], [0, 0, -1]] };

var clock = new T.Clock();
function loop() {
  var dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
  TICK.forEach(function (f) { f(t); });
  if (target) { var d = target.clone().sub(pos); d.y = 0; var L = d.length(); if (L < .03) target = null; else pos.addScaledVector(d, Math.min(1, dt * 2.6)); }
  if (lookAt) { var dd = lookAt.clone().sub(pos), ty = Math.atan2(-dd.x, -dd.z), tp = Math.atan2(dd.y, Math.hypot(dd.x, dd.z)); var dy = ((ty - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; yaw += dy * Math.min(1, dt * 3); pitch += (tp - pitch) * Math.min(1, dt * 3); }
  if (dive) { dive += dt; pitch += (-1.1 - pitch) * dt * 2; CAM.fov = 64 - Math.min(30, dive * 25); CAM.updateProjectionMatrix(); if (dive > 2.2) { dive = 0; CAM.fov = 64; CAM.updateProjectionMatrix(); pitch = -.06; } }
  if (Q.get('cam') === 'top') { var tp2 = TOPP[VAR]; CAM.position.set(tp2[0][0], tp2[0][1], tp2[0][2]); CAM.lookAt(tp2[1][0], tp2[1][1], tp2[1][2]); }
  else { CAM.position.copy(pos); CAM.rotation.set(0, 0, 0, 'YXZ'); CAM.rotation.order = 'YXZ'; CAM.rotation.y = yaw; CAM.rotation.x = pitch; }
  R.render(S, CAM); requestAnimationFrame(loop);
}
loop();
window.M2 = { go: function (x, z, lx, ly, lz) { pos.set(x, EYE, z); var d = new T.Vector3(lx - x, ly - EYE, lz - z); yaw = Math.atan2(-d.x, -d.z); pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); target = null; lookAt = null; } };
})();
