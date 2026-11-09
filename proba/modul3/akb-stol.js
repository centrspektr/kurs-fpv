/* akb-stol.js - стол АКБ в модуле 3 (проба 09.11.2026): задания руками в 3D на столе.
   Станции: "Собери АКБ" (банки этажами и рядом, S и P), "Тестер" (по вольтам решить, что делать), "Наклейка" (найти на АКБ главное),
   "Куда положить?" (хранение, остыть, зарядка, тренеру). У каждой два варианта: детям (kid) и подробнее (big), берётся из AKB_VER().
   Нужны akb-komnata.js (AKB, AKB_R, AKB_TABLE). Пройденные станции помнятся на устройстве (ключ <store>_m3_stol). */
(function () {
'use strict';
var T = THREE, R = window.AKB_R, TB = window.AKB_TABLE, K = window.AKB, U = window.AKB_PIC.util;
var A = '#ffd36e', GR = '#9dff7c', CY = '#7cf3ff', RD = '#ff5d6c', OR = '#ff9f5a';
var CFG = window.KURSY || {}, KEY = (CFG.store || 'kursy') + '_m3_stol';
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function doneList() { try { return JSON.parse(lsG(KEY) || '[]'); } catch (e) { return []; } }
function markDone(id) { var d = doneList(); if (d.indexOf(id) < 0) { d.push(id); lsS(KEY, JSON.stringify(d)); } }
var ui = document.getElementById('ui');
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
var bub = el('div', 'g-bub'); bub.hidden = true; ui.appendChild(bub);
var bar = el('div', 'g-bar'); bar.hidden = true; ui.appendChild(bar);
var menu = el('div', 'g-menu'); menu.hidden = true; ui.appendChild(menu);
function say(html, kind, chip) { bub.hidden = false; bub.className = 'g-bub' + (kind ? ' ' + kind : ''); bub.innerHTML = (chip ? '<span class="chip">' + chip + '</span><br>' : '') + html;
  if (window.GOLOS && GOLOS.on) GOLOS.say(bub.textContent.replace(chip || '', '').replace(/(\d),(\d)/g, '$1 и $2 десятых').replace(/\bS\b/g, 'эс')); }
function buttons(list) { bar.hidden = false; bar.innerHTML = ''; list.forEach(function (b) { var x = el('button', b.cls || '', b.t); x.onclick = function () { b.f(x); }; if (b.dis) x.disabled = true; bar.appendChild(x); }); return bar; }
function clearUI() { bub.hidden = true; bar.hidden = true; menu.hidden = true; }
function kid() { return window.AKB_VER() === 'kid'; }
function n2(v) { return String(v).replace('.', ','); }

/* ---------- 3D: общий слой предметов на столе ---------- */
var G = new T.Group(); G.position.y = TB.y; TB.g.add(G);
function std(c, r, m, em) { var x = K.std(c, r, m, em); return x; }
function neon(c, k) { return K.neon(c, k); }
function bx(w, h, d, mat, x, y, z, par) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || G).add(m); return m; }
function clearG() { while (G.children.length) G.remove(G.children[0]); anims.length = 0; }
var anims = [];
R.frame(function (dt, t) { for (var i = 0; i < anims.length; i++) anims[i](dt, t); });
/* банка LiPo: серебристый пакет с лепестками */
var cellMat = std('#c9d0de', .35, .85), tabP = std('#d4a017', .3, .9), tabN = std('#bbbbbb', .3, .9);
function cellMesh() { var g = new T.Group(); bx(.34, .045, .22, cellMat, 0, 0, 0, g);
  bx(.3, .002, .18, std('#e8ecf5', .25, .9), 0, .024, 0, g); bx(.04, .006, .05, tabP, -.07, 0, -.13, g); bx(.04, .006, .05, tabN, .07, 0, -.13, g); return g; }
/* АКБ в плёнке: корпус, наклейка, провода, XT60, балансир */
function battMesh(o) { o = o || {}; var g = new T.Group(), sw = o.puff || 0;
  var body = new T.Mesh(new T.BoxGeometry(.36, .13, .2, 6, 3, 4), std(o.col || '#262b4a', .5, .2));
  if (sw) { var p = body.geometry.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i); var k = (1 - Math.pow(x / .18, 2)) * (1 - Math.pow(z / .1, 2)); p.setY(i, y + Math.sign(y) * sw * Math.max(0, k)); } body.geometry.computeVertexNormals(); }
  body.position.y = .065; g.add(body);
  if (o.label) { var lb = new T.Mesh(new T.PlaneGeometry(.33, .17), new T.MeshBasicMaterial({ map: o.label })); lb.rotation.x = -Math.PI / 2; lb.position.y = .131 + sw * .9; g.add(lb); }
  var red = std('#d12b2b', .5, .1), blk = std('#151515', .5, .1);
  var c1 = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.18, .05, .03), new T.Vector3(.26, .05, .04), new T.Vector3(.32, .02, .08)]), 12, .009, 6), red); g.add(c1);
  var c2 = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.18, .05, -.01), new T.Vector3(.26, .04, -.0), new T.Vector3(.32, .02, .06)]), 12, .009, 6), blk); g.add(c2);
  var xt = bx(.05, .025, .03, std('#f2c200', .4, .1), .345, .02, .07, g); xt.userData.part = 'xt60';
  var bal = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.18, .09, -.07), new T.Vector3(.24, .09, -.1), new T.Vector3(.28, .01, -.14)]), 12, .005, 5), std('#eeeeee', .6)); g.add(bal);
  var bc = bx(.04, .015, .015, std('#f5f5f5', .5), .3, .01, -.15, g); bc.userData.part = 'bal';
  return g; }
function lcdTex(w, h) { return R.tex(w || 512, h || 256, function (c, W, H) { c.fillStyle = '#041a12'; c.fillRect(0, 0, W, H); }); }
function lcdDraw(tex, lines, col) { var c = tex.userData.x, W = tex.userData.c.width, H = tex.userData.c.height; c.fillStyle = '#041a12'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#9dff7c33'; c.strokeRect(6, 6, W - 12, H - 12);
  lines.forEach(function (l, i) { c.font = (i ? '700 ' : '900 ') + (i ? H / (lines.length + 1.6) : H / (lines.length + .8)) + 'px ui-monospace, Menlo, monospace'; c.fillStyle = (l.c || col || GR); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(l.t != null ? l.t : l, W / 2, H * (i + .75) / (lines.length + .5)); });
  tex.needsUpdate = true; }

/* ---------- фокус на стол ---------- */
var S = { on: false, st: null };
function pose() { var portrait = innerWidth < innerHeight; return portrait ? { pos: [TB.x, 2.45, TB.z + 1.45], look: [TB.x, TB.y - .05, TB.z - .02] } : { pos: [TB.x, 1.72, TB.z + 1.1], look: [TB.x, TB.y, TB.z - .12] }; }
function open(st) { S.on = true; TB.holo.visible = false;
  R.focus(pose(), function () { if (st) start(st); else showMenu(); }); }
function close() { if (window.GOLOS) GOLOS.stop();
  if (S.st) { S.st = null; clearG(); showMenu(); return; }
  S.on = false; clearUI(); clearG(); TB.holo.visible = true; R.onTap = null; R.unfocus(); }
var STATIONS = [
  { id: 'sobrat', e: '🔋', t: 'Собери АКБ из банок', s: 'Ставь банки этажами и рядом. Смотри, как растут вольты и бак.' },
  { id: 'tester', e: '📟', t: 'Тестер: летим или нет?', s: 'Подключи тестер к балансиру и реши, что делать с АКБ.' },
  { id: 'naklejka', e: '🏷', t: 'Читаем наклейку', s: 'Найди на настоящей АКБ ёмкость, банки, тип и разъём.' },
  { id: 'store', e: '🧯', t: 'Куда положить АКБ?', s: 'Горячая, вздутая, полная, на неделю... Реши, куда её.' }];
function showMenu() { clearUI(); R.onTap = null; var d = doneList();
  menu.hidden = false; menu.innerHTML = '<h3>Стол АКБ</h3><p>' + (kid() ? 'Вариант: детям. ' : 'Вариант: подробнее. ') + 'Выбери задание. Назад к комнате - стрелка ← вверху.</p>' +
    STATIONS.map(function (s) { return '<button class="g-st' + (d.indexOf(s.id) >= 0 ? ' done' : '') + '" data-id="' + s.id + '"><i>' + s.e + '</i><span><b>' + s.t + '</b><small>' + s.s + '</small></span></button>'; }).join('') +
    '<p style="margin:10px 0 0">Теорию смотри на большом мониторе. <a href="#" id="gv" style="color:#ffd36e">Сменить вариант: ' + (kid() ? 'подробнее' : 'детям') + '</a></p>';
  menu.querySelectorAll('.g-st').forEach(function (b) { b.onclick = function () { start(b.dataset.id); }; });
  menu.querySelector('#gv').onclick = function (e) { e.preventDefault(); window.AKB_VER(kid() ? 'big' : 'kid'); showMenu(); }; }
function start(id) { clearUI(); clearG(); S.st = id; GAMES[id](); }
function finish(id, text) { markDone(id); clearG(); say(text, 'ok', 'ГОТОВО'); buttons([{ t: 'К заданиям стола', cls: 'pri', f: function () { S.st = null; showMenu(); } }]);
  if (window.AKB_TOAST) AKB_TOAST('Задание стола пройдено'); }
/* нажатие по столу во время игры */
var ray = new T.Raycaster(), v2 = new T.Vector2();
function hit(x, y, list) { v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, R.camera); return ray.intersectObjects(list, true)[0] || null; }

var GAMES = {};
/* ================= 1. Собери АКБ ================= */
GAMES.sobrat = function () {
  var goals = kid() ? [
    { s: 1, p: 1, q: 'Собери АКБ для маленького <b>Mobula 7</b>: ему нужна <b>одна банка</b>.' },
    { s: 4, p: 1, q: 'Гоночному 5-дюймовому дрону нужно <b>4S</b>: четыре банки <b>этажами</b>.' },
    { s: 1, p: 2, q: 'Хотим летать дольше: поставь <b>две банки рядом</b> (2P). Бак станет больше.' }
  ] : [
    { s: 3, p: 1, q: 'Полностью заряженная АКБ показывает <b>12,6 В</b>. Сколько банок этажами? Собери её.' },
    { s: 6, p: 1, q: 'На наклейке номинал <b>22,2 В</b>. Собери такую АКБ.' },
    { s: 1, p: 3, q: 'Нужен бак <b>1350 mAh</b> из банок по 450 mAh, вольты как у одной банки.' },
    { s: 4, p: 2, q: 'Собери <b>4S2P</b>: 4 этажа, на каждом по 2 банки рядом.' }];
  var gi = 0, ns = 1, np = 1, cells = [];
  /* лоток с запасными банками слева */
  var tray = bx(.5, .02, .7, std('#1b1f3a', .6, .3), -1.6, .01, 0); for (var i = 0; i < 6; i++) { var sp = cellMesh(); sp.position.set(-1.6, .035 + i * .05, -.05); sp.rotation.y = .05 * i; G.add(sp); }
  /* место сборки - светящаяся площадка */
  var pad = new T.Mesh(new T.RingGeometry(.55, .58, 48), neon(A, 1.4)); pad.rotation.x = -Math.PI / 2; pad.position.set(0, .004, 0); G.add(pad);
  /* табло */
  var lt = lcdTex(512, 300), lst = new T.Group(); lst.position.set(1.0, 0, -.5); lst.rotation.y = -.3; lst.scale.setScalar(.8); G.add(lst);
  bx(.06, .3, .06, std('#3a3f66', .4, .7), 0, .15, 0, lst); bx(.62, .38, .04, std('#0a0b16', .3, .7), 0, .45, 0, lst);
  var lm = new T.Mesh(new T.PlaneGeometry(.58, .34), new T.MeshBasicMaterial({ map: lt, toneMapped: false })); lm.position.set(0, .45, .021); lst.add(lm);
  function layout() { var need = ns * np;
    while (cells.length < need) { var c = cellMesh(); c.position.set(-1.6, .3, -.05); G.add(c); cells.push(c); }
    while (cells.length > need) { var c2 = cells.pop(); G.remove(c2); }
    var k = 0; for (var si = 0; si < ns; si++) for (var pj = 0; pj < np; pj++) { cells[k].userData.to = new T.Vector3((pj - (np - 1) / 2) * .4, .03 + si * .055, 0); k++; }
    var v = 3.7 * ns, full = 4.2 * ns, cap = 450 * np;
    lcdDraw(lt, [ns + 'S' + np + 'P', { t: n2(v.toFixed(1)) + ' В  (полная ' + n2(full.toFixed(1)) + ')', c: CY }, { t: cap + ' mAh', c: A }]);
    btns(); }
  anims.push(function (dt) { cells.forEach(function (c) { if (c.userData.to) c.position.lerp(c.userData.to, Math.min(1, dt * 9)); }); });
  function btns() { buttons([
    { t: '− этаж', dis: ns <= 1, f: function () { ns--; layout(); } }, { t: '+ этаж (S)', dis: ns >= 6 || ns * np >= 8, f: function () { ns++; layout(); } },
    { t: '− ряд', dis: np <= 1, f: function () { np--; layout(); } }, { t: '+ ряд (P)', dis: np >= 3 || ns * np >= 8, f: function () { np++; layout(); } },
    { t: 'Готово', cls: 'pri', f: check }]); }
  function check() { var g = goals[gi];
    if (ns === g.s && np === g.p) { gi++;
      if (gi >= goals.length) return finish('sobrat', kid() ? 'Запомни: <b>этажами</b> - вольты растут, <b>рядом</b> - растёт бак. 1S - одна банка, 4S - четыре этажами.' :
        'Формула: банок этажами = вольты : 3,7 (номинал) или : 4,2 (полная). P складывает ёмкость. 4S2P = 14,8 В и 900 mAh.');
      say('Верно! ' + ns + 'S' + np + 'P: ' + n2((3.7 * ns).toFixed(1)) + ' В и ' + 450 * np + ' mAh.', 'ok', 'ВЕРНО');
      setTimeout(function () { if (S.st === 'sobrat') { ns = 1; np = 1; layout(); ask(); } }, 1800); return; }
    var h = ns !== g.s ? (kid() ? 'Посчитай этажи: каждая банка этажом добавляет 3,7 В.' : (g.s > 1 ? 'Раздели вольты на ' + (g.q.indexOf('Полностью') >= 0 ? '4,2 (полная банка)' : '3,7 (номинал)') + '.' : 'Вольты как у одной банки - значит, один этаж.'))
      : (kid() ? 'Вольты верно, а бак? Банки рядом делают бак больше.' : 'Вольты верно. Ёмкость: раздели нужные mAh на 450.');
    say('Пока не то. ' + h, 'bad', 'ПОДСКАЗКА'); }
  function ask() { say(goals[gi].q, '', 'ЦЕЛЬ ' + (gi + 1) + ' ИЗ ' + goals.length); }
  layout(); ask();
};

/* ================= 2. Тестер ================= */
GAMES.tester = function () {
  var ANS = [['fly', '✈️ Можно лететь'], ['charge', '🔌 Сначала зарядить'], ['store', '🧳 Так и храним'], ['bad', '⛔ Опасно: к тренеру']];
  var list = kid() ? [
    { v: [4.19, 4.20, 4.19, 4.20], q: 'Утро, собираемся на полёты.', a: 'fly', e: 'Все банки около 4,2 В - АКБ полная. Можно лететь!' },
    { v: [3.51, 3.50, 3.49, 3.50], q: 'Хотим взлететь ещё раз.', a: 'charge', e: '3,5 В - пора садиться, а не взлетать. Сначала зарядить.' },
    { v: [3.82, 3.81, 3.82, 3.83], q: 'Неделю не будет полётов.', a: 'store', e: '3,8 В - то, что нужно для хранения. Кладём в мешок.' },
    { v: [4.18, 4.19, 3.10, 4.18], q: 'Перед полётом.', a: 'bad', e: 'Одна банка 3,1 В, а остальные полные. С этой АКБ что-то не так - отдаём тренеру.' },
    { v: [4.10, 4.11, 4.10, 4.11], q: 'Перед полётом. Но АКБ стала пухлой!', puff: .03, a: 'bad', e: 'Вздулась - не летаем и не заряжаем, даже если вольты хорошие. Отдаём тренеру.' }
  ] : [
    { v: [4.19, 4.20, 4.19, 4.20], q: 'LiPo, утро перед полётами.', a: 'fly', e: '4,2 В на банку, разница 0,01 В - полная и ровная. Летим.' },
    { v: [4.34, 4.35, 4.34, 4.35], q: 'На наклейке <b>LiHV</b>, перед полётом.', hv: 1, a: 'fly', e: 'Для LiHV 4,35 В - это полная банка. Летим.' },
    { v: [4.34, 4.35, 4.35, 4.34], q: 'На наклейке <b>LiPo</b>. Кто-то зарядил в режиме LiHV.', a: 'bad', e: 'LiPo выше 4,2 В - перезаряд. Банки могли повредиться: не летаем, к тренеру.' },
    { v: [3.71, 3.70, 3.72, 3.70], q: 'Только что сели, АКБ отдохнула 5 минут.', a: 'charge', e: 'После отдыха 3,7 - нормально после полёта (в полёте было около 3,5). Остудить и зарядить.' },
    { v: [3.84, 3.83, 3.84, 3.85], q: 'Полётов не будет две недели.', a: 'store', e: '3,80-3,85 В - напряжение хранения. Кладём в мешок или ящик.' },
    { v: [3.92, 3.90, 3.78, 3.91], q: 'Перед полётом, после зарядки.', a: 'bad', e: 'Разница 0,14 В - разбаланс. АКБ изношена или повреждена: к тренеру.' },
    { v: [3.21, 3.20, 3.22, 3.19], q: 'АКБ забыли в дроне на месяц.', a: 'bad', e: 'Ниже 3,3 В в покое - переразряд. Заряжать такую решает тренер, часто её уже утилизируют.' }];
  var i = 0, ok = 0, lt = lcdTex(512, 320), batt = null;
  /* тестер-пищалка */
  var ck = new T.Group(); ck.position.set(.45, 0, .05); ck.rotation.y = -.25; G.add(ck);
  bx(.22, .05, .14, std('#1d2340', .4, .4), 0, .025, 0, ck);
  var cm = new T.Mesh(new T.PlaneGeometry(.18, .11), new T.MeshBasicMaterial({ map: lt, toneMapped: false })); cm.rotation.x = -Math.PI / 2 + .25; cm.position.set(0, .056, .005); ck.add(cm);
  var labelTex = function (hv) { return R.tex(512, 256, function (c, w, h) { c.fillStyle = '#f1f3ff'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b2147'; c.fillRect(0, 0, w, 70); U.txt(c, 'VZLET', w / 2, 36, 40, A); U.txt(c, '1300mAh  4S  100C', w / 2, 120, 44, '#141832'); U.txt(c, hv ? 'LiHV 15.2V' : 'LiPo 14.8V', w / 2, 190, 48, hv ? '#c2185b' : '#141832'); }); };
  function show() { var sc = list[i]; if (batt) G.remove(batt);
    batt = battMesh({ label: labelTex(sc.hv || /LiPo/.test(sc.q) && 0), puff: sc.puff }); batt.position.set(-.2, 0, 0); G.add(batt);
    var mx = Math.max.apply(null, sc.v), mn = Math.min.apply(null, sc.v), tot = sc.v.reduce(function (a, b) { return a + b; }, 0);
    lcdDraw(lt, [{ t: 'ВСЕГО ' + tot.toFixed(2) + 'V', c: '#fff' }, sc.v.slice(0, 2).map(function (v, k) { return (k + 1) + ':' + v.toFixed(2); }).join('  '), sc.v.slice(2).map(function (v, k) { return (k + 3) + ':' + v.toFixed(2); }).join('  '), { t: 'РАЗН ' + (mx - mn).toFixed(2), c: (mx - mn) > .05 ? RD : CY }]);
    say(sc.q + ' Посмотри на тестер. Что делаем?', '', 'АКБ ' + (i + 1) + ' ИЗ ' + list.length);
    buttons(ANS.map(function (a) { return { t: a[1], f: function (b) { answer(a[0], b); } }; })); }
  var lock = false;
  function answer(a, b) { if (lock) return; var sc = list[i]; if (a === sc.a) { ok++; b.classList.add('ok'); } else b.classList.add('no');
    lock = true; say((a === sc.a ? 'Верно! ' : 'Не так. ') + sc.e, a === sc.a ? 'ok' : 'bad', a === sc.a ? 'ВЕРНО' : 'РАЗБЕРЁМ');
    buttons([{ t: i < list.length - 1 ? 'Следующая АКБ →' : 'Итог', cls: 'pri', f: function () { lock = false; i++; if (i < list.length) show(); else end(); } }]); }
  function end() { var p = Math.round(ok / list.length * 100);
    if (p >= 70) finish('tester', 'Верно ' + ok + ' из ' + list.length + '. ' + (kid() ? 'Помни: 4,2 - полная, 3,5 - садимся, 3,8 - хранение. Пухлая или странная банка - к тренеру.' : 'Тестер смотрим перед каждым полётом: напряжение банок и разницу между ними.'));
    else { clearG(); say('Верно ' + ok + ' из ' + list.length + '. Нужно 70%. Посмотри лекцию на мониторе и попробуй ещё раз.', 'bad', 'ЕЩЁ РАЗ'); buttons([{ t: 'Ещё раз', cls: 'pri', f: function () { start('tester'); } }, { t: 'К заданиям стола', f: function () { S.st = null; showMenu(); } }]); } }
  show();
};

/* ================= 3. Наклейка ================= */
GAMES.naklejka = function () {
  /* зоны наклейки в долях (x0,y0,x1,y1) */
  var Z = { cap: [.05, .3, .5, .55], s: [.52, .3, .74, .55], c: [.76, .3, .97, .55], type: [.05, .62, .45, .9], volt: [.5, .62, .95, .9] };
  var lab = R.tex(1024, 512, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#1b2147'); g.addColorStop(1, '#3a1d4f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = A; c.fillRect(0, 0, w, 120); U.txt(c, 'VZLET RACING', w / 2, 62, 70, '#1b1300', 'center', 900);
    function zone(z, s, col, sz) { U.txt(c, s, (z[0] + z[2]) / 2 * w, (z[1] + z[3]) / 2 * h, sz, col); }
    zone(Z.cap, '1300mAh', '#fff', 92); zone(Z.s, '4S', A, 110); zone(Z.c, '100C', '#ff7ce0', 84); zone(Z.type, 'LiPo', CY, 92); zone(Z.volt, '14.8V', GR, 92);
    c.strokeStyle = '#ffffff22'; c.lineWidth = 3; c.strokeRect(10, 10, w - 20, h - 20); });
  var big = battMesh({ label: lab }); big.scale.setScalar(2.3); big.position.set(-.3, 0, -.1); G.add(big);
  var labelMesh = big.children[1];
  var qs = [
    { z: 'cap', q: 'Нажми, где написана <b>ёмкость</b> - размер бака.', e: '1300mAh - ёмкость, миллиампер-часы. Чем больше, тем дольше летаем, но АКБ тяжелее.' },
    { z: 's', q: 'Нажми, где написано, <b>сколько банок</b> этажами.', e: '4S - четыре банки последовательно.' },
    { z: 'type', q: 'Нажми, где написан <b>тип банок</b>.', e: 'LiPo - обычные банки, полная 4,2 В. Заряжаем в режиме LiPo.' },
    { part: 'xt60', q: 'Нажми на <b>силовой разъём</b> - через него идёт ток к дрону.', e: 'Жёлтый XT60 - силовой разъём. Тонкий белый - балансир, он для зарядки.' }];
  if (!kid()) qs.splice(3, 0,
    { z: 'volt', q: 'Нажми на <b>номинальное напряжение</b>.', e: '14,8 В = 4 × 3,7 В. Полная будет 16,8 В.' },
    { z: 'c', q: 'Нажми на <b>токоотдачу</b> (C-рейтинг).', e: '100C: ток может быть в 100 раз больше ёмкости.' },
    { calc: 1, q: 'Посчитай: какой <b>максимальный ток</b> по наклейке? 1300 mAh = 1,3 А·ч, 100C.', opts: ['13 А', '130 А', '1300 А'], a: 1, e: '1,3 × 100 = 130 А. На деле честных ампер обычно меньше.' },
    { calc: 1, q: 'Каким током <b>заряжать</b> по правилу 1C?', opts: ['0,13 А', '1,3 А', '13 А'], a: 1, e: '1C = ёмкость: 1300 mAh → 1,3 А.' });
  var i = 0, ok = 0, tries = 0;
  function ask() { var q = qs[i]; tries = 0; say(q.q, '', 'ВОПРОС ' + (i + 1) + ' ИЗ ' + qs.length);
    if (q.calc) buttons(q.opts.map(function (o, k) { return { t: o, f: function (b) { if (k === q.a) { b.classList.add('ok'); good(); } else { b.classList.add('no'); tries++; say('Не так. Умножь ёмкость в ампер-часах на число C (или на 1 для зарядки).', 'bad', 'ПОДСКАЗКА'); } } }; }));
    else bar.hidden = true;
    R.onTap = q.calc ? null : function (x, y) { var h = hit(x, y, [big]); if (!h) return; var o = h.object, right = false;
      if (q.part) right = o.userData.part === q.part;
      else if (o === labelMesh && h.uv) { var u = h.uv.x, v = 1 - h.uv.y, z = Z[q.z]; right = u >= z[0] && u <= z[2] && v >= z[1] && v <= z[3]; }
      if (right) good(); else { tries++; say('Не здесь. ' + (tries > 1 ? 'Подсказка: ' + q.e.split(' - ')[0].split('.')[0] + '.' : 'Посмотри внимательнее.'), 'bad', 'ЕЩЁ РАЗ'); } }; }
  function good() { if (!tries) ok++; R.onTap = null; say('Верно! ' + qs[i].e, 'ok', 'ВЕРНО'); buttons([{ t: i < qs.length - 1 ? 'Дальше →' : 'Итог', cls: 'pri', f: function () { i++; if (i < qs.length) ask(); else finish('naklejka', 'С первого раза: ' + ok + ' из ' + qs.length + '. Наклейку читаем перед зарядкой: тип, банки и ёмкость нужны, чтобы правильно настроить зарядку.'); } }]); }
  anims.push(function (dt, t) { big.rotation.y = Math.sin(t * .5) * .08; });
  ask();
};

/* ================= 4. Куда положить? ================= */
GAMES.store = function () {
  var SP = [['wait', 'Подождать', 'остыть или согреться', '#4a90d9', -1.45], ['charge', 'На зарядку', 'зарядка с балансиром', GR, -.5], ['store', 'Хранение', 'огнеупорный мешок', OR, .5], ['coach', 'Тренеру', 'вздутые и битые', RD, 1.45]];
  var spots = SP.map(function (s) { var g = new T.Group(); g.position.set(s[4], 0, -.35); G.add(g); g.userData.id = s[0];
    if (s[0] === 'store') { bx(.42, .22, .3, std('#8a4a22', .9, 0), 0, .11, 0, g); bx(.42, .02, .3, std('#5a2e14', .9), 0, .225, 0, g); }
    else if (s[0] === 'coach') { bx(.42, .25, .32, std('#8a1c1c', .5, .3), 0, .125, 0, g); bx(.44, .02, .34, std('#e6b800', .6), 0, .26, 0, g); }
    else if (s[0] === 'charge') { bx(.36, .1, .26, std('#1c2038', .4, .4), 0, .05, 0, g); var z = new T.Mesh(new T.PlaneGeometry(.22, .06), new T.MeshBasicMaterial({ color: '#063', toneMapped: false })); z.rotation.x = -Math.PI / 2; z.position.set(0, .101, -.04); g.add(z); }
    else { bx(.4, .03, .3, std('#2a4a7a', .4, .5), 0, .015, 0, g); for (var k = 0; k < 4; k++) bx(.02, .06, .28, std('#9ab', .3, .8), -.15 + k * .1, .05, 0, g); }
    var tt = R.tex(512, 160, function (c, w, h) { c.fillStyle = '#0b0d1e'; c.fillRect(0, 0, w, h); U.txt(c, s[1], w / 2, 58, 56, s[3]); U.txt(c, s[2], w / 2, 120, 34, '#ccd', 'center', 700); });
    var sg = new T.Mesh(new T.PlaneGeometry(.42, .13), new T.MeshBasicMaterial({ map: tt, toneMapped: false })); sg.position.set(0, .42, -.05); g.add(sg);
    var ring = new T.Mesh(new T.RingGeometry(.26, .28, 40), neon(s[3], 1.2)); ring.rotation.x = -Math.PI / 2; ring.position.y = .003; g.add(ring); return g; });
  var list = kid() ? [
    { q: 'Только что прилетели. АКБ <b>горячая</b>.', hot: 1, a: 'wait', e: 'Горячую не заряжаем и не прячем - сначала пусть остынет.' },
    { q: 'АКБ остыла, на тестере 3,6 В. Завтра снова полёты.', a: 'charge', e: 'Остывшую разряженную АКБ ставим на зарядку под присмотром взрослого.' },
    { q: 'На тестере 3,8 В. Полётов не будет неделю.', a: 'store', e: '3,8 В - для хранения. Кладём в огнеупорный мешок.' },
    { q: 'АКБ стала <b>пухлой</b> и мягкой.', puff: .03, a: 'coach', e: 'Вздутую не заряжаем и не храним с остальными - отдаём тренеру.' },
    { q: 'АКБ упала, плёнка порвана, видна вмятина.', dent: 1, a: 'coach', e: 'Повреждённую АКБ отдаём тренеру. Внутри может быть замыкание.' }
  ] : [
    { q: 'Только что сели после трёх полётов подряд. АКБ <b>горячая</b>.', hot: 1, a: 'wait', e: 'Горячую не заряжаем: даём остыть до комнатной температуры.' },
    { q: 'Принесли с мороза, нужно зарядить к вечеру.', cold: 1, a: 'wait', e: 'Холодную не заряжаем: литий на холоде оседает и портит банку. Сначала согреть до комнатной.' },
    { q: 'АКБ полная (4,2 В), а полёты отменили на неделю.', a: 'charge', e: 'Полной неделю не храним. На зарядке режим STORAGE разрядит до 3,8 В, потом в мешок.' },
    { q: 'После зарядки в режиме хранения: 3,84 В.', a: 'store', e: 'Готово к хранению: мешок или ящик, 15-25 градусов, разъёмы закрыты.' },
    { q: 'Банки 3,9 / 3,9 / 3,7 / 3,9 и АКБ слегка <b>вздулась</b>.', puff: .02, a: 'coach', e: 'Вздутие и разбаланс - АКБ отслужила. Тренер разрядит её и сдаст на утилизацию.' },
    { q: 'Остывшая АКБ после полётов, 3,7 В. Завтра соревнования.', a: 'charge', e: 'Заряжаем в режиме баланса током 1C, под присмотром, в мешке.' },
    { q: 'АКБ лежит на зарядке и стала горячей, хотя зарядка идёт током 1C.', hot: 1, a: 'coach', e: 'Греется на зарядке - признак неисправности. Отключить зарядку от розетки, отдать тренеру, не оставлять без присмотра.' }];
  var i = 0, ok = 0, batt = null, lock = false;
  function show() { var sc = list[i]; if (batt) G.remove(batt); lock = false;
    batt = battMesh({ puff: sc.puff, col: sc.dent ? '#3a2a2a' : '#262b4a' }); batt.position.set(0, 0, .45); batt.userData.home = batt.position.clone(); G.add(batt);
    if (sc.dent) batt.rotation.z = .08;
    batt.userData.hot = sc.hot; batt.userData.cold = sc.cold;
    say(sc.q + ' Нажми, куда её.', '', 'АКБ ' + (i + 1) + ' ИЗ ' + list.length);
    buttons(SP.map(function (s) { return { t: s[1], f: function () { answer(s[0]); } }; }));
    R.onTap = function (x, y) { var h = hit(x, y, spots); if (!h) return; var o = h.object; while (o && !o.userData.id) o = o.parent; if (o) answer(o.userData.id); }; }
  anims.push(function (dt, t) { if (!batt) return; var b = batt.children[0]; if (batt.userData.hot) { b.material.emissive.set('#ff3300'); b.material.emissiveIntensity = .25 + .2 * Math.sin(t * 5); }
    else if (batt.userData.cold) { b.material.emissive.set('#3399ff'); b.material.emissiveIntensity = .25; }
    if (batt.userData.to) batt.position.lerp(batt.userData.to, Math.min(1, dt * 6)); });
  function answer(a) { if (lock) return; lock = true; var sc = list[i], right = a === sc.a; if (right) ok++;
    var sp = spots.find(function (s) { return s.userData.id === a; }); batt.userData.to = new T.Vector3(sp.position.x, .26, sp.position.z);
    if (!right) setTimeout(function () { if (batt) batt.userData.to = batt.userData.home.clone(); }, 700);
    say((right ? 'Верно! ' : 'Не так. ') + sc.e, right ? 'ok' : 'bad', right ? 'ВЕРНО' : 'РАЗБЕРЁМ'); R.onTap = null;
    buttons([{ t: i < list.length - 1 ? 'Следующая АКБ →' : 'Итог', cls: 'pri', f: function () { i++; if (i < list.length) show(); else end(); } }]); }
  function end() { var p = ok / list.length; if (p >= .7) finish('store', 'Верно ' + ok + ' из ' + list.length + '. Горячую и холодную - подождать, разряженную - на зарядку, 3,8 В - в мешок, вздутую и битую - тренеру.');
    else { clearG(); say('Верно ' + ok + ' из ' + list.length + '. Нужно 70%. Попробуй ещё раз.', 'bad', 'ЕЩЁ РАЗ'); buttons([{ t: 'Ещё раз', cls: 'pri', f: function () { start('store'); } }]); } }
  show();
};

window.AKB_STOL = { open: open, close: close, get on() { return S.on; }, start: start, battMesh: battMesh, cellMesh: cellMesh, lcdTex: lcdTex, lcdDraw: lcdDraw, say: say, buttons: buttons, clearUI: clearUI };
})();
