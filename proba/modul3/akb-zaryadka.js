/* akb-zaryadka.js - урок "Как заряжать АКБ" на зарядной станции модуля 3 (проба 09.11.2026).
   Типовая баланс-зарядка (как большинство: экран, кнопки, порты XT60 и BAL). Когда владелец пришлёт фото своей зарядки,
   меняем вид и названия пунктов меню под неё (массив MENU и модель в build()).
   Два урока: 1) "Завтра полёты" - полный баланс-заряд; 2) "Убираем на неделю" - режим хранения.
   Детям - меньше шагов и проще слова, подробнее - добавлены число банок и выбор LiPo/LiHV по наклейке. */
(function () {
'use strict';
var T = THREE, R = window.AKB_R, B = window.AKB_BENCH, K = window.AKB, ST = window.AKB_STOL, U = window.AKB_PIC.util;
var A = '#ffd36e', GR = '#9dff7c', CY = '#7cf3ff', RD = '#ff5d6c', OR = '#ff9f5a';
var CFG = window.KURSY || {}, KEY = (CFG.store || 'kursy') + '_m3_zar';
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function kid() { return window.AKB_VER() === 'kid'; }
var say = ST.say, buttons = ST.buttons, clearUI = ST.clearUI;
var G = new T.Group(); G.position.set(0, B.y, 0); B.g.add(G); G.rotation.y = -Math.PI / 2; /* локально: +x вдоль стены, +z - в комнату */
function bx(w, h, d, mat, x, y, z, par) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || G).add(m); return m; }
var std = K.std, neon = K.neon;
var anims = []; R.frame(function (dt, t) { if (Z.on) anims.forEach(function (f) { f(dt, t); }); });
var Z = { on: false };

/* ---------- модель станции (строим один раз, видна всегда) ---------- */
var parts = {}, lcd = R.tex(640, 400, function (c, w, h) { c.fillStyle = '#020806'; c.fillRect(0, 0, w, h); });
(function build() {
  /* зарядка */
  var ch = new T.Group(); ch.position.set(-.35, 0, -.05); G.add(ch); parts.charger = ch;
  bx(.32, .1, .24, std('#1b1f36', .35, .6), 0, .05, 0, ch);
  bx(.33, .012, .25, std('#ff9f5a', .4, .4, '#ff9f5a', .4), 0, .006, 0, ch);
  var face = new T.Mesh(new T.PlaneGeometry(.2, .125), new T.MeshBasicMaterial({ map: lcd, toneMapped: false })); face.rotation.x = -Math.PI / 2 + .55; face.position.set(-.03, .108, .04); ch.add(face);
  bx(.22, .14, .02, std('#0a0b16', .3, .6), -.03, .095, .03, ch).rotation.x = -.9;
  parts.btns = []; for (var i = 0; i < 4; i++) { var b = bx(.026, .014, .026, std(i === 3 ? '#ffd36e' : '#5a6090', .4, .5), -.11 + i * .045, .105, .105, ch); parts.btns.push(b); }
  var port = bx(.045, .03, .02, std('#f2c200', .4), .12, .045, .125, ch); parts.portXT = port;
  var portB = bx(.04, .016, .016, std('#f5f5f5', .4), .12, .085, .125, ch); parts.portBAL = portB;
  var lb = R.tex(256, 64, function (c, w, h) { c.fillStyle = '#1b1f36'; c.fillRect(0, 0, w, h); U.txt(c, 'BAL     OUT', w / 2, h / 2, 26, '#ccd'); });
  var lbl = new T.Mesh(new T.PlaneGeometry(.1, .025), new T.MeshBasicMaterial({ map: lb })); lbl.position.set(.12, .02, .1215); ch.add(lbl);
  /* блок питания с проводом в розетку */
  var ps = new T.Group(); ps.position.set(-.85, 0, -.2); G.add(ps); parts.psu = ps;
  bx(.2, .06, .12, std('#22252e', .5, .5), 0, .03, 0, ps); var led = bx(.012, .012, .004, neon('#333'), .07, .045, .062, ps); parts.led = led;
  var cord = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.1, .02, 0), new T.Vector3(.3, .02, .02), new T.Vector3(.48, .03, -.05)]), 16, .007, 6), std('#111', .5)); ps.add(cord);
  var c2 = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.1, .02, 0), new T.Vector3(-.25, .05, -.2), new T.Vector3(-.3, .5, -.32)]), 16, .006, 6), std('#111', .5)); ps.add(c2);
  var sock = bx(.09, .09, .02, std('#eeeeee', .4), -.3, .55, -.34, ps); parts.sock = sock;
  /* огнеупорный мешок (открыт) */
  var bag = new T.Group(); bag.position.set(.35, 0, .05); G.add(bag); parts.bag = bag;
  var bm = std('#a8561e', .95, 0); bx(.36, .12, .24, bm, 0, .06, 0, bag); bx(.36, .02, .1, std('#7a3a12', .95), 0, .14, -.15, bag).rotation.x = .9;
  var bt = R.tex(256, 64, function (c, w, h) { c.fillStyle = '#a8561e'; c.fillRect(0, 0, w, h); U.txt(c, 'LIPO SAFE', w / 2, h / 2, 34, '#ffe0b0'); });
  var btm = new T.Mesh(new T.PlaneGeometry(.2, .05), new T.MeshBasicMaterial({ map: bt })); btm.position.set(0, .07, .121); bag.add(btm);
})();
var batt = null, battLbl = null;
function newBatt(hv) {
  if (batt) G.remove(batt);
  battLbl = R.tex(512, 256, function (c, w, h) { c.fillStyle = '#f1f3ff'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b2147'; c.fillRect(0, 0, w, 70); U.txt(c, 'VZLET', w / 2, 36, 40, A);
    U.txt(c, '1300mAh  4S  100C', w / 2, 120, 44, '#141832'); U.txt(c, hv ? 'LiHV 15.2V' : 'LiPo 14.8V', w / 2, 192, 52, hv ? '#c2185b' : '#141832'); });
  batt = ST.battMesh({ label: battLbl }); batt.scale.setScalar(.75); batt.position.set(-.05, 0, .3); G.add(batt); batt.userData.to = null; }
/* провода от АКБ к зарядке (видны, когда подключены) */
var wXT = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.2, .03, .1), new T.Vector3(0, .05, .2), new T.Vector3(-.23, .045, .09)]), 20, .008, 6), std('#c62828', .5)); wXT.visible = false; G.add(wXT);
var wBAL = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.2, .05, .06), new T.Vector3(0, .1, .16), new T.Vector3(-.23, .085, .09)]), 20, .004, 5), std('#eeeeee', .5)); wBAL.visible = false; G.add(wBAL);
/* подсветка того, что нажать */
var hl = new T.Mesh(new T.RingGeometry(.07, .085, 32), neon(A, 2)); hl.rotation.x = -Math.PI / 2; hl.visible = false; G.add(hl);
anims.push(function (dt, t) { if (hl.visible) { hl.scale.setScalar(1 + .25 * Math.sin(t * 6)); hl.material.opacity = 1; } if (batt && batt.userData.to) batt.position.lerp(batt.userData.to, Math.min(1, dt * 5)); });
function highlight(obj) { if (!obj) { hl.visible = false; return; } var bb = new T.Box3().setFromObject(obj), c = bb.getCenter(new T.Vector3()), top = new T.Vector3(c.x, bb.max.y, c.z); G.worldToLocal(top); hl.position.set(top.x, top.y + .012, top.z); hl.scale.setScalar(1); hl.visible = true; }

/* ---------- экран зарядки ---------- */
var scr = { mode: 'off' };
function drawLCD() { var c = lcd.userData.x, w = 640, h = 400; c.fillStyle = '#020806'; c.fillRect(0, 0, w, h);
  if (scr.mode === 'off') { lcd.needsUpdate = true; return; }
  c.fillStyle = '#0a3020'; c.fillRect(0, 0, w, 64); c.font = '800 34px ui-monospace, Menlo, monospace'; c.fillStyle = GR; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(scr.head || 'READY', 18, 34); c.textAlign = 'right'; c.fillText(scr.vin || 'IN 24.0V', w - 18, 34);
  if (scr.menu) { scr.menu.forEach(function (m, i) { var y = 110 + i * 64; if (i === scr.sel) { c.fillStyle = '#1d5a3a'; c.fillRect(10, y - 28, w - 20, 56); }
      c.textAlign = 'left'; c.fillStyle = i === scr.sel ? '#fff' : GR; c.font = '800 38px ui-monospace, Menlo, monospace'; c.fillText((i === scr.sel ? '▶ ' : '  ') + m, 20, y); }); }
  if (scr.cells) { scr.cells.forEach(function (v, i) { var x = 30 + i * 150, bh = Math.max(0, (v - 3.3) / (4.4 - 3.3)) * 170;
      c.fillStyle = '#0d2a1d'; c.fillRect(x, 110, 110, 180); c.fillStyle = v >= 4.19 ? GR : CY; c.fillRect(x, 290 - bh, 110, bh);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '800 30px ui-monospace, Menlo, monospace'; c.fillText(v.toFixed(2), x + 55, 320); });
    c.textAlign = 'left'; c.fillStyle = A; c.font = '800 32px ui-monospace, Menlo, monospace'; c.fillText(scr.foot || '', 20, 372); }
  if (scr.big) { c.textAlign = 'center'; c.fillStyle = scr.bigc || GR; c.font = '900 64px ui-monospace, Menlo, monospace'; c.fillText(scr.big, w / 2, 220); }
  lcd.needsUpdate = true; }

/* ---------- урок ---------- */
var raycast = new T.Raycaster(), v2 = new T.Vector2();
function tapOn(list, cb) { bar.hidden = true; R.onTap = function (x, y) { v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); raycast.setFromCamera(v2, R.camera);
  var h = raycast.intersectObjects(list.concat(hl.visible ? [hl] : []), true)[0]; if (h) { R.onTap = null; highlight(null); cb(); } else say('Нажми на подсвеченный предмет.', 'bad', 'ПОДСКАЗКА'); }; }
function pose() { var p = innerWidth < innerHeight; var x = B.x, z = B.z; return p ? { pos: [x - 1.35, 1.85, z], look: [x - .2, B.y, z] } : { pos: [x - .9, 1.42, z], look: [x - .12, B.y + .04, z] }; }
function open() { Z.on = true; R.focus(pose(), menu); }
function close() { if (window.GOLOS) GOLOS.stop(); clearUI(); highlight(null); R.onTap = null; Z.on = false; R.unfocus(); }
function menu() { clearUI(); R.onTap = null; reset();
  say('Урок на зарядке. Выбери, что делаем с АКБ. ' + (kid() ? 'Заряжаем только вместе со взрослым!' : ''), '', 'ЗАРЯДНАЯ СТАНЦИЯ');
  buttons([{ t: '⚡ Завтра полёты: зарядить', cls: 'pri', f: function () { lesson('full'); } }, { t: '🧳 Убираем на неделю: хранение', f: function () { lesson('store'); } }]); }
function reset() { newBatt(false); wXT.visible = wBAL.visible = false; scr = { mode: 'off' }; drawLCD(); parts.led.material = neon('#333'); }

function lesson(kind) {
  var hv = !kid() && kind === 'full', v0 = kind === 'full' ? 3.62 : 4.18, target = kind === 'store' ? 3.80 : hv ? 4.35 : 4.20;
  newBatt(hv); var steps = [];
  steps.push(function (next) { say('Шаг 1. Зарядку ставим на негорючую плиту, АКБ - в <b>огнеупорный мешок</b>. Нажми на мешок.', '', 'БЕЗОПАСНОСТЬ'); highlight(parts.bag.children[0]);
    tapOn([parts.bag, batt], function () { batt.userData.to = new T.Vector3(.35, .07, .05); next(); }); });
  steps.push(function (next) { say('Шаг 2. Включи зарядку: нажми на <b>блок питания</b>, вилка уже в розетке.', '', 'ПИТАНИЕ'); highlight(parts.psu.children[0]);
    tapOn([parts.psu, parts.sock], function () { parts.led.material = neon(GR, 2); scr = { mode: 'on', head: 'READY', big: 'ПРИВЕТ' }; drawLCD(); next(); }); });
  steps.push(function (next) { say('Шаг 3. Подключи <b>силовой разъём</b> АКБ (жёлтый XT60) к выходу зарядки.', '', 'РАЗЪЁМЫ'); highlight(parts.portXT);
    tapOn([parts.portXT, parts.charger, batt], function () { wXT.visible = true; cab(false); scr.big = 'BATT'; drawLCD(); next(); }); });
  steps.push(function (next) { say('Шаг 4. Подключи <b>балансир</b> (белый разъём) в порт BAL. ' + (kid() ? 'Так зарядка видит каждую банку.' : 'Без балансира АКБ от 2S не заряжаем: зарядка не увидит банки.'), '', 'РАЗЪЁМЫ'); highlight(parts.portBAL);
    tapOn([parts.portBAL, parts.charger, batt], function () { wBAL.visible = true; scr.big = null; scr.cells = [v0, v0 + .01, v0 - .01, v0]; scr.foot = '4S  ' + (v0 * 4).toFixed(2) + 'V'; scr.head = 'BATT 4S'; drawLCD(); next(); }); });
  steps.push(function (next) { choice('Шаг 5. Какой <b>тип</b> АКБ выбрать? Посмотри на наклейку.', 'ТИП', ['LiPo', 'LiHV', 'LiFe', 'NiMH'], hv ? 1 : 0, function (i) {
      return i === (hv ? 0 : 1) ? (hv ? 'На наклейке LiHV. В режиме LiPo она зарядится не до конца (4,2 вместо 4,35). Безопасно, но выбери свой тип.' : 'Нельзя! LiPo в режиме LiHV зарядится до 4,35 В - перезаряд, нагрев, вздутие.') : 'Не тот тип: LiFe и NiMH - совсем другие банки, их числа другие. Смотри на наклейку.'; }, next); });
  if (kind === 'full') steps.push(function (next) { choice(kid() ? 'Шаг 6. Выбери режим: заряжаем с балансиром.' : 'Шаг 6. Какой <b>режим</b>? АКБ 4S, завтра полёты.', 'РЕЖИМ', kid() ? ['BALANCE (заряд)', 'STORAGE (хранение)', 'DISCHARGE (разряд)'] : ['CHARGE', 'BALANCE', 'STORAGE', 'FAST', 'DISCHARGE'], kid() ? 0 : 1, function (i) {
      return kid() ? 'Хранение и разряд нужны, когда не летаем. Сейчас заряжаем: BALANCE.' : (i === 0 ? 'CHARGE заряжает без выравнивания банок: для 2S и больше берём BALANCE.' : i === 3 ? 'FAST быстрее, но банки выравниваются хуже. Для обычной зарядки - BALANCE.' : 'STORAGE и DISCHARGE нужны, когда убираем АКБ. Сейчас - BALANCE.'); }, next); });
  else steps.push(function (next) { choice('Шаг 6. Какой режим, чтобы <b>убрать на неделю</b>?', 'РЕЖИМ', ['BALANCE', 'STORAGE', 'DISCHARGE'], 1, function (i) {
      return i === 0 ? 'BALANCE зарядит до полной. Полной неделю не храним.' : 'DISCHARGE разрядит слишком сильно. Для хранения есть STORAGE: 3,8 В на банку.'; }, next); });
  if (!kid()) steps.push(function (next) { choice('Шаг 7. Зарядка увидела <b>4 банки</b>. Сверь с наклейкой и подтверди число банок.', 'БАНКИ', ['3S', '4S', '6S'], 1, function () { return 'На наклейке 4S, и зарядка видит 4 банки. Если числа не совпадают - стоп, что-то не так с АКБ или балансиром.'; }, next); });
  if (kind === 'full') steps.push(function (next) { choice((kid() ? 'Шаг 7.' : 'Шаг 8.') + ' <b>Ток</b> заряда: правило 1C. На наклейке 1300 mAh.', 'ТОК', ['0.5A', '1.3A', '6.0A'], 1, function (i) {
      return i === 0 ? 'Можно, но очень долго. По правилу 1C: 1300 mAh = 1,3 А.' : '6 А - это почти 5C! АКБ будет греться и быстро испортится. 1C = 1,3 А.'; }, next); });
  steps.push(function (next) { say('Всё настроено: ' + (hv ? 'LiHV' : 'LiPo') + ' ' + (kind === 'full' ? 'BALANCE 1.3A' : 'STORAGE') + ', 4S. Нажми <b>Старт</b> и оставайся рядом.', '', 'СТАРТ');
    buttons([{ t: '▶ Старт', cls: 'pri', f: function () { run(next); } }]); });
  steps.push(function (next) { say(kind === 'full' ? 'Готово, зарядка пищит: <b>FULL</b>. ' + (hv ? '4,35 В на банку - полная LiHV.' : '4,2 В на банку - полная LiPo.') + ' Теперь отключи: сначала АКБ (нажми на неё), потом зарядку из сети.' :
      'Готово: <b>3,80 В</b> на банку. Отключи АКБ (нажми на неё) и убери в мешок или ящик.', 'ok', 'ГОТОВО'); highlight(batt.children[0]);
    tapOn([batt], function () { wXT.visible = wBAL.visible = false; cab(true); scr.cells = null; scr.big = 'BYE'; drawLCD(); next(); }); });

  var si = 0; function nx() { if (si >= steps.length) return done(kind); steps[si++](nx); } nx();
  function choice(q, chip, opts, right, why, next) { scr.head = chip; scr.menu = opts; scr.sel = 0; var cells = scr.cells; scr.cells = null; drawLCD();
    say(q, '', chip); buttons(opts.map(function (o, i) { return { t: o, f: function (b) { scr.sel = i; drawLCD();
      if (i === right) { b.classList.add('ok'); setTimeout(function () { scr.menu = null; scr.cells = cells; scr.head = opts[i]; drawLCD(); next(); }, 700); }
      else { b.classList.add('no'); say(why(i), 'bad', 'НЕ ТАК'); } } }; })); }
  function run(next) { bar.hidden = true; var t0 = 0, dur = 6; scr.menu = null; scr.cells = scr.cells || [v0, v0, v0, v0]; var st0 = scr.cells.slice();
    say(kind === 'full' ? 'Идёт зарядка. В жизни это около часа. Не уходим из комнаты и не накрываем зарядку.' : 'Зарядка доводит банки до 3,8 В. Смотри, как выравниваются столбики.', '', 'ИДЁТ');
    var f = function (dt) { t0 += dt; var k = Math.min(1, t0 / dur); scr.cells = st0.map(function (v, i) { return v + (target - v) * Math.min(1, k * (1 + i * .05)); });
      scr.head = (kind === 'full' ? 'BAL 1.3A ' : 'STORE ') + Math.round(k * 100) + '%'; scr.foot = Math.round(k * 52) + ' мин   ' + Math.round(k * (kind === 'full' ? 820 : 470)) + ' mAh'; drawLCD();
      if (k >= 1) { anims.splice(anims.indexOf(f), 1); scr.head = kind === 'full' ? 'FULL' : 'STORAGE OK'; drawLCD(); beep(); next(); } };
    anims.push(f); }
}
var bar = document.querySelector('.g-bar');
function cab(on) { if (batt) for (var i = 2; i < batt.children.length; i++) batt.children[i].visible = on; } /* свои провода АКБ прячем, когда она подключена к зарядке */
function done(kind) { lsS(KEY + '_' + kind, '1'); highlight(null);
  say(kind === 'full' ? 'Урок пройден! Порядок: мешок → питание → XT60 → балансир → тип → режим → ток → старт, и всё время рядом.' : 'Урок пройден! Не летаем больше пары дней - режим STORAGE, 3,8 В, и в мешок.', 'ok', 'УРОК ПРОЙДЕН');
  buttons([{ t: 'Другой урок', f: menu }, { t: 'Вернуться в комнату', cls: 'pri', f: close }]); if (window.AKB_TOAST) AKB_TOAST('Урок на зарядке пройден'); }
function beep() { try { var ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 2200; o.connect(g); g.connect(ac.destination); g.gain.value = .05; o.start(); o.stop(ac.currentTime + .25); } catch (e) {} }
newBatt(false); drawLCD();
var esc0 = R.onEsc; R.onEsc = function () { if (Z.on) close(); else esc0(); };
window.AKB_ZAR = { open: open, close: close, get on() { return Z.on; } };
})();
