/* akb-zaryadka.js - урок на зарядке ViFly WhoopStor 3 в модуле 3 (по фото владельца, 09.11.2026).
   Зарядка для 1S-аккумуляторов, как у Mobula 7: 6 портов (в каждом PH2.0 и BT2.0), питание через XT60 от блока 12 В.
   Экран: сверху ток заряда, напряжение питания, до скольки заряжать; ниже 6 клеток - вольты и ток каждого порта.
   Кнопки (слова владельца):
     1 "Start/Stop Current Set": коротко - ток 0,3 ... 1,3 А; удержать - старт заряда или разряда (стоп).
     2 "Voltage Set": коротко - до скольки вольт 3,80 / 4,20 / 4,35; удержать - пищалка вкл/выкл.
   Если АКБ выше заданных вольт - зарядка её разряжает (так делают хранение 3,80 В).
   Уроки: "Завтра полёты" (полный заряд LiHV 4,35 В током 1C) и "Убираем на неделю" (хранение 3,80 В). АКБ - GNB 850 mAh 1S HV, как на фото. */
(function () {
'use strict';
var T = THREE, R = window.AKB_R, B = window.AKB_BENCH, K = window.AKB, ST = window.AKB_STOL, U = window.AKB_PIC.util;
var A = '#ffd36e', GR = '#9dff7c', CY = '#7cf3ff', RD = '#ff5d6c', PU = '#b48cff';
var CFG = window.KURSY || {}, KEY = (CFG.store || 'kursy') + '_m3_zar';
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function kid() { return window.AKB_VER() === 'kid'; }
function n2(v, d) { return v.toFixed(d == null ? 2 : d).replace('.', ','); }
var say = ST.say, buttons = ST.buttons, clearUI = ST.clearUI;
var G = new T.Group(); G.position.set(0, B.y, 0); B.g.add(G); G.rotation.y = -Math.PI / 2; /* локально: +x вдоль стены, +z - в комнату */
function bx(w, h, d, mat, x, y, z, par) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (par || G).add(m); return m; }
var std = K.std, neon = K.neon;
var anims = []; R.frame(function (dt, t) { if (Z.on) anims.slice().forEach(function (f) { f(dt, t); }); });
var Z = { on: false };

/* ---------- зарядка WhoopStor 3 ---------- */
var parts = {}, lcd = R.tex(800, 480, function (c, w, h) { c.fillStyle = '#05070a'; c.fillRect(0, 0, w, h); });
/* порты: 2 ряда по 3 (как на фото), номера в кружках */
var PORTS = [[.02, -.055], [.075, -.07], [.13, -.085], [.02, .035], [.075, .02], [.13, .005]];
(function build() {
  var ch = new T.Group(); ch.position.set(-.3, 0, 0); ch.scale.setScalar(1.25); G.add(ch); parts.charger = ch;
  bx(.36, .045, .24, std('#e9ecf2', .45, .1), 0, .0225, 0, ch);                 /* белый корпус */
  var top = R.tex(1024, 683, function (c, w, h) { c.fillStyle = '#16191c'; c.fillRect(0, 0, w, h);
    c.font = 'italic 900 64px Manrope, sans-serif'; c.fillStyle = '#e8eaf0'; c.fillText('VI', 60, 250); c.fillStyle = '#e53935'; c.fillText('FLY', 125, 250);
    c.font = 'italic 700 46px "Segoe Script", cursive'; c.fillStyle = '#e8eaf0'; c.fillText('WhoopStor 3', 60, 310);
    c.font = '800 30px Manrope, sans-serif'; c.fillStyle = '#e8eaf0'; c.fillText('Start/Stop', 70, 585); c.fillText('Current Set', 70, 620); c.fillText('Voltage Set', 300, 520);
    PORTS.forEach(function (p, i) { var x = (p[0] + .18) / .36 * w, y = (p[1] + .12) / .24 * h + 85; c.strokeStyle = '#e8eaf0'; c.lineWidth = 3; c.beginPath(); c.arc(x + 25, y, 24, 0, 7); c.stroke(); c.textAlign = 'center'; c.fillText(i + 1, x + 25, y + 11); c.textAlign = 'left'; });
    [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]].forEach(function (q) { c.fillStyle = '#000'; c.beginPath(); c.arc(q[0], q[1], 12, 0, 7); c.fill(); }); });
  var tp = new T.Mesh(new T.PlaneGeometry(.35, .233), new T.MeshStandardMaterial({ map: top, roughness: .5, metalness: .1, envMapIntensity: .35 })); tp.rotation.x = -Math.PI / 2; tp.position.y = .0455; ch.add(tp);
  var scr = new T.Mesh(new T.PlaneGeometry(.1, .06), new T.MeshBasicMaterial({ map: lcd, toneMapped: false })); scr.rotation.x = -Math.PI / 2; scr.position.set(-.1, .047, -.015); ch.add(scr); parts.scr = scr;
  parts.portM = PORTS.map(function (p, i) { var g = new T.Group(); g.position.set(p[0], .046, p[1]); ch.add(g);
    bx(.024, .008, .018, std('#f3efe6', .5), 0, .004, 0, g);                  /* PH2.0 - белый */
    bx(.016, .009, .02, std('#f0e2c8', .5), .026, .0045, 0, g);               /* BT2.0 */
    g.userData.port = i; return g; });
  parts.b1 = bx(.022, .01, .022, std('#c9ced8', .2, .9), -.135, .05, .095, ch); parts.b2 = bx(.022, .01, .022, std('#c9ced8', .2, .9), -.065, .05, .065, ch);
  var xt = bx(.03, .02, .035, std('#f2c200', .4), -.195, .022, .03, ch);       /* XT60 сбоку */
  var cord = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.21, .02, .03), new T.Vector3(-.3, .02, .05), new T.Vector3(-.42, .02, -.04)]), 16, .007, 6), std('#c62828', .5)); ch.add(cord);
})();
/* блок питания 12 В */
var ps = new T.Group(); ps.position.set(-.95, 0, -.1); G.add(ps); parts.psu = ps;
bx(.2, .06, .12, std('#22252e', .5, .5), 0, .03, 0, ps); var led = bx(.012, .012, .004, neon('#333'), .07, .045, .062, ps); parts.led = led;
var plab = R.tex(256, 64, function (c, w, h) { c.fillStyle = '#22252e'; c.fillRect(0, 0, w, h); U.txt(c, 'DC 12V 5A', w / 2, h / 2, 30, '#aab'); });
var pl = new T.Mesh(new T.PlaneGeometry(.12, .03), new T.MeshBasicMaterial({ map: plab })); pl.rotation.x = -Math.PI / 2; pl.position.set(0, .061, 0); ps.add(pl);
var c2 = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.1, .02, 0), new T.Vector3(-.25, .05, -.2), new T.Vector3(-.3, .5, -.32)]), 16, .006, 6), std('#111', .5)); ps.add(c2);
bx(.09, .09, .02, std('#eeeeee', .4), -.3, .55, -.34, ps);
/* огнеупорный мешок - рядом, для хранения */
var bag = new T.Group(); bag.position.set(.45, 0, -.02); G.add(bag); parts.bag = bag;
bx(.3, .1, .2, std('#a8561e', .95, 0), 0, .05, 0, bag); bx(.3, .02, .08, std('#7a3a12', .95), 0, .12, -.12, bag).rotation.x = .9;
var bt = R.tex(256, 64, function (c, w, h) { c.fillStyle = '#a8561e'; c.fillRect(0, 0, w, h); U.txt(c, 'LIPO SAFE', w / 2, h / 2, 34, '#ffe0b0'); });
var btm = new T.Mesh(new T.PlaneGeometry(.18, .045), new T.MeshBasicMaterial({ map: bt })); btm.position.set(0, .06, .101); bag.add(btm);

/* ---------- АКБ GNB 850 mAh 1S HV (как на фото) ---------- */
var gnbTex = R.tex(1024, 256, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#e9e9f0'); g.addColorStop(.35, '#8e5bd6'); g.addColorStop(1, '#6b3fb5'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.font = 'italic 900 84px Manrope, sans-serif'; c.fillStyle = '#d81b60'; c.fillText('GNB', 30, 110); c.font = '800 30px Manrope, sans-serif'; c.fillStyle = '#222'; c.fillText('POWER LIPO', 30, 150); c.fillText('HV 4.35V', 30, 200);
  c.fillStyle = '#fff'; c.font = '900 120px Manrope, sans-serif'; c.fillText('850', 560, 150); c.font = '800 34px Manrope, sans-serif'; c.fillText('mAh', 800, 150);
  c.font = '800 32px Manrope, sans-serif'; c.fillText('60C/120C  1S1P 3.8V 3.23Wh', 470, 215); });
function gnb() { var g = new T.Group(), sc = 2.2;
  var body = new T.Mesh(new T.BoxGeometry(.065 * sc, .012 * sc, .02 * sc), [std('#ddd', .4, .6), std('#ddd', .4, .6), new T.MeshStandardMaterial({ map: gnbTex, roughness: .5, envMapIntensity: .35 }), std('#333', .5), std('#7a4bc7', .5), std('#7a4bc7', .5)]);
  body.position.y = .006 * sc; g.add(body); g.userData.body = body;
  var lead = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.0325 * sc, .008, 0), new T.Vector3(.05 * sc, .01, .005), new T.Vector3(.07 * sc, .006, -.005)]), 10, .0035, 5), std('#c62828', .5)); g.add(lead); g.userData.lead = lead;
  var plug = bx(.018, .009, .012, std('#f3efe6', .5), .072 * sc, .006, -.005, g); g.userData.plug = plug;
  return g; }
var batt = gnb(); batt.position.set(.0, 0, .2); G.add(batt);
/* провод в порт (виден, когда подключена) */
var wire = null;
function connectWire(on) { if (wire) { G.remove(wire); wire = null; } batt.userData.lead.visible = batt.userData.plug.visible = !on; if (!on) return;
  var p = new T.Vector3(); parts.portM[0].getWorldPosition(p); G.worldToLocal(p); var s = new T.Vector3(); batt.getWorldPosition(s); G.worldToLocal(s); s.x += .072;
  wire = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([s.clone().setY(.015), new T.Vector3((s.x + p.x) / 2, .07, (s.z + p.z) / 2), p.clone().setY(p.y + .01)]), 16, .0035, 5), std('#c62828', .5)); G.add(wire);
  bx(.03, .012, .022, std('#f3efe6', .5), p.x, p.y + .006, p.z, wire); }

/* ---------- экран и логика зарядки ---------- */
var CUR = [.3, .4, .5, .6, .7, .8, .9, 1.0, 1.1, 1.2, 1.3], VOLT = [3.80, 4.20, 4.35];
var S = { power: false, ci: 4, vi: 2, beep: true, run: 0, v: [0, 0, 0, 0, 0, 0], a: [0, 0, 0, 0, 0, 0], msg: '' };
function drawLCD() { var c = lcd.userData.x, w = 800, h = 480; c.fillStyle = '#05070a'; c.fillRect(0, 0, w, h); if (!S.power) { lcd.needsUpdate = true; return; }
  c.fillStyle = '#f4f4f8'; c.fillRect(8, 8, w - 16, h - 16);
  var top = [[n2(CUR[S.ci], 1) + 'A', '#cfd2dc', '#666'], ['12.2V', '#9b6bff', '#fff'], [n2(VOLT[S.vi]) + 'V', '#c9b8ff', '#5b3fb5']];
  top.forEach(function (q, i) { var x = 14 + i * 258; c.fillStyle = q[1]; c.fillRect(x, 14, 252, 92); c.fillStyle = q[2]; c.font = '800 54px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(q[0].replace(',', '.'), x + 126, 62); });
  var COL = ['#e53935', '#e53935', '#e53935', '#e53935', '#e53935', '#e53935'], NC = ['#43a047', '#e53935', '#1e88e5', '#e53935', '#43a047', '#1e88e5'];
  for (var i = 0; i < 6; i++) { var x = 14 + (i % 3) * 258, y = 118 + Math.floor(i / 3) * 172; c.fillStyle = '#fff'; c.fillRect(x, y, 252, 164); c.strokeStyle = '#ccd'; c.strokeRect(x, y, 252, 164);
    var on = S.v[i] > 0; c.fillStyle = on ? (S.run && i === 0 ? '#1b5e20' : COL[i]) : '#e57373'; c.font = '800 50px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.fillText(n2(S.v[i]).replace(',', '.') + 'V', x + 140, y + 54);
    c.fillStyle = NC[i]; c.beginPath(); c.arc(x + 30, y + 118, 22, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '800 28px Manrope, sans-serif'; c.fillText(i + 1, x + 30, y + 120);
    c.fillStyle = '#e57373'; c.font = '700 38px ui-monospace, Menlo, monospace'; c.fillText((S.a[i] < 0 ? '-' : '') + Math.abs(S.a[i]).toFixed(1) + 'A', x + 150, y + 120); }
  if (S.msg) { c.fillStyle = 'rgba(20,10,40,.88)'; c.fillRect(120, 180, w - 240, 120); c.fillStyle = '#fff'; c.font = '900 52px Manrope, sans-serif'; c.textAlign = 'center'; c.fillText(S.msg, w / 2, 240); }
  lcd.needsUpdate = true; }
var msgT = 0; function flashMsg(s) { S.msg = s; drawLCD(); clearTimeout(msgT); msgT = setTimeout(function () { S.msg = ''; drawLCD(); }, 1200); }
function beep(n) { if (!S.beep) return; try { var ac = new (window.AudioContext || window.webkitAudioContext)(); for (var k = 0; k < (n || 1); k++) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 2400; o.connect(g); g.connect(ac.destination); g.gain.value = .04; o.start(ac.currentTime + k * .18); o.stop(ac.currentTime + k * .18 + .1); } } catch (e) {} }
/* кнопки: на экране две большие круглые, как на зарядке. Коротко / удержать (0,8 с) */
var onBtn = null; /* (кнопка 1|2, 'short'|'long') - что ждёт урок */
function press(b, kind) { if (!S.power) { say('Зарядка выключена: сначала подключи питание.', 'bad', 'ПОДСКАЗКА'); return; }
  var m = b === 1 ? parts.b1 : parts.b2; m.position.y = .045; setTimeout(function () { m.position.y = .05; }, 150);
  if (b === 1 && kind === 'short') { if (S.run) { flashMsg('STOP'); return stop(); } S.ci = (S.ci + 1) % CUR.length; beep(); drawLCD(); }
  else if (b === 2 && kind === 'short') { if (S.run) return; S.vi = (S.vi + 1) % VOLT.length; beep(); drawLCD(); }
  else if (b === 1 && kind === 'long') { if (S.run) { flashMsg('STOP'); stop(); } else start(); }
  else if (b === 2 && kind === 'long') { S.beep = !S.beep; flashMsg(S.beep ? 'BEEP ON' : 'BEEP OFF'); if (S.beep) beep(2); }
  if (onBtn) onBtn(b, kind); }
function btnBar(extra) { var bar = buttons([{ t: '① Ток · Старт', f: function () {} }, { t: '② Вольты', f: function () {} }].concat(extra || []));
  [].slice.call(bar.children, 0, 2).forEach(function (el, i) { var t0 = 0, tm = 0, long = false; el.classList.add('hw');
    el.onclick = null;
    el.onpointerdown = function (e) { e.preventDefault(); t0 = performance.now(); long = false; el.classList.add('down'); tm = setTimeout(function () { long = true; el.classList.remove('down'); el.classList.add('held'); setTimeout(function () { el.classList.remove('held'); }, 400); press(i + 1, 'long'); }, 800); };
    el.onpointerup = el.onpointerleave = function () { if (!t0) return; clearTimeout(tm); el.classList.remove('down'); if (!long) press(i + 1, 'short'); t0 = 0; }; });
  return bar; }
function start() { if (!S.v[0]) { flashMsg('NO BATT'); return; } var tgt = VOLT[S.vi]; S.run = S.v[0] < tgt ? 1 : -1; beep(); drawLCD();
  if (S.onStart) S.onStart(S.run, tgt, CUR[S.ci]); }
function stop() { S.run = 0; S.a[0] = 0; drawLCD(); }

/* ---------- урок ---------- */
var raycast = new T.Raycaster(), v2 = new T.Vector2();
var hl = new T.Mesh(new T.RingGeometry(.06, .075, 32), neon(A, 2)); hl.rotation.x = -Math.PI / 2; hl.visible = false; G.add(hl);
anims.push(function (dt, t) { if (hl.visible) hl.scale.setScalar(1 + .25 * Math.sin(t * 6)); });
function highlight(obj) { if (!obj) { hl.visible = false; return; } var bb = new T.Box3().setFromObject(obj), c = bb.getCenter(new T.Vector3()), top = new T.Vector3(c.x, bb.max.y, c.z); G.worldToLocal(top); hl.position.set(top.x, top.y + .012, top.z); hl.visible = true; }
function tapOn(list, cb) { document.querySelector('.g-bar').hidden = true; R.onTap = function (x, y) { v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); raycast.setFromCamera(v2, R.camera);
  var h = raycast.intersectObjects(list.concat(hl.visible ? [hl] : []), true)[0]; if (h) { R.onTap = null; highlight(null); cb(); } else say('Нажми на подсвеченный предмет.', 'bad', 'ПОДСКАЗКА'); }; }
function pose() { var p = innerWidth < innerHeight, c = new T.Vector3(); parts.charger.getWorldPosition(c);
  return p ? { pos: [c.x - .75, c.y + .95, c.z + .12], look: [c.x - .05, c.y, c.z + .12] } : { pos: [c.x - .62, c.y + .62, c.z + .2], look: [c.x, c.y, c.z + .18] }; }
/* крупная копия экрана зарядки в углу, чтобы цифры читались */
var big = document.createElement('div'); big.className = 'zar-lcd'; big.hidden = true; big.appendChild(lcd.userData.c); document.getElementById('ui').appendChild(big);
function open() { Z.on = true; R.focus(pose(), function () { big.hidden = false; menu(); }); }
function close() { big.hidden = true; if (window.GOLOS) GOLOS.stop(); clearUI(); highlight(null); R.onTap = null; onBtn = null; S.onStart = null; Z.on = false; R.unfocus(); }
function reset(v0) { S.power = false; S.ci = 4; S.vi = 2; S.run = 0; S.v = [0, 0, 0, 0, 0, 0]; S.a = [0, 0, 0, 0, 0, 0]; S.msg = ''; S.v0 = v0; connectWire(false); parts.led.material = neon('#333'); drawLCD(); anims.length = 1; }
function menu() { clearUI(); R.onTap = null; onBtn = null; reset(3.6);
  say('Это зарядка <b>ViFly WhoopStor 3</b> - для маленьких АКБ на одну банку (1S), как у Mobula 7. Шесть портов: можно заряжать шесть АКБ сразу. Выбери урок.' + (kid() ? ' Заряжаем только вместе со взрослым!' : ''), '', 'ЗАРЯДНАЯ СТАНЦИЯ');
  buttons([{ t: '⚡ Завтра полёты: зарядить', cls: 'pri', f: function () { lesson('full'); } }, { t: '🧳 Убираем на неделю: хранение', f: function () { lesson('store'); } }]); }

function lesson(kind) {
  var v0 = kind === 'full' ? 3.62 : 4.33, tgt = kind === 'full' ? 4.35 : 3.80; reset(v0);
  var steps = [];
  steps.push(function (next) { say('Шаг 1. Осмотри АКБ: целая, не вздутая, провод цел? Нажми на АКБ. На наклейке: <b>GNB 850 mAh, 1S, HV</b> - значит LiHV, полная 4,35 В.', '', 'ОСМОТР'); highlight(batt.userData.body);
    tapOn([batt], function () { next(); }); });
  steps.push(function (next) { say('Шаг 2. Включи блок питания 12 В: нажми на него. Провод от блока идёт в жёлтый XT60 сбоку зарядки.', '', 'ПИТАНИЕ'); highlight(ps.children[0]);
    tapOn([ps], function () { S.power = true; parts.led.material = neon(GR, 2); beep(); drawLCD(); next(); }); });
  steps.push(function (next) { say('Шаг 3. На экране сверху три числа: <b>ток</b>, <b>питание 12,2 В</b> и <b>до скольки вольт</b> заряжать. Подключи АКБ в порт 1 - в белый разъём PH2.0.', '', 'ПОРТ 1'); highlight(parts.portM[0]);
    tapOn([parts.portM[0], parts.charger, batt], function () { connectWire(true); S.v[0] = v0; drawLCD(); beep(); next(); }); });
  steps.push(function (next) { var need = VOLT.indexOf(tgt);
    say(kind === 'full' ? 'Шаг 4. Кнопка ② <b>Voltage Set</b>: коротко - меняет, до скольки вольт заряжать: 3,80 → 4,20 → 4,35. У нас LiHV - нужно <b>4,35</b>. ' + (kid() ? '' : 'Обычной LiPo ставим 4,20: на 4,35 её перезарядит.')
      : 'Шаг 4. Убираем АКБ на неделю - нужно напряжение хранения. Нажимай ② <b>Voltage Set</b>, пока не будет <b>3,80</b>.', '', 'ВОЛЬТЫ');
    S.vi = kind === 'full' ? 0 : 2; drawLCD(); btnBar();
    onBtn = function (b, k) { if (b === 2 && k === 'short' && S.vi === need) { onBtn = null; setTimeout(next, 600); } else if (b === 1 && k === 'long') say('Рано стартовать: сначала выставь вольты кнопкой ② коротко.', 'bad', 'ПОДСКАЗКА'); }; });
  if (kind === 'full') steps.push(function (next) { say('Шаг 5. Кнопка ① коротко - <b>ток</b> от 0,3 до 1,3 А. Правило 1C: ёмкость 850 mAh, значит не больше 0,85 А. Поставь <b>0,8 А</b>.' + (kid() ? '' : ' Больше - АКБ греется и быстрее стареет.'), '', 'ТОК');
    S.ci = 0; drawLCD(); btnBar(); var tm = 0;
    onBtn = function (b, k) { clearTimeout(tm); if (b !== 1 || k !== 'short') { if (b === 1 && k === 'long') { stop(); say('Сначала ток: кнопка ① коротко, до 0,8 А.', 'bad', 'ПОДСКАЗКА'); } return; }
      var a = CUR[S.ci]; if (Math.abs(a - .8) < .01) { onBtn = null; next(); } else if (a > .85) tm = setTimeout(function () { say(n2(a, 1) + ' А - больше 1C для 850 mAh. Жми ещё: после 1,3 ток снова станет 0,3.', 'bad', 'МНОГО'); }, 900); }; });
  steps.push(function (next) { say('Шаг ' + (kind === 'full' ? 6 : 5) + '. Пищалка: <b>удержи ②</b> - звук включается или выключается. Пусть будет включён: зарядка пискнет в конце. Удержи ② и посмотри, что на экране.', '', 'ПИЩАЛКА');
    btnBar(); var n = 0; onBtn = function (b, k) { if (b === 2 && k === 'long') { n++; if (S.beep) { onBtn = null; setTimeout(next, 900); } else say('Пищалка выключена (BEEP OFF). Удержи ② ещё раз, чтобы включить.', '', 'ПИЩАЛКА'); } }; });
  steps.push(function (next) { say('Шаг ' + (kind === 'full' ? 7 : 6) + '. <b>Удержи ①</b> - старт. ' + (kind === 'full' ? 'АКБ ниже 4,35 В - зарядка будет заряжать.' : 'АКБ 4,33 В выше 3,80 - зарядка будет <b>разряжать</b> до хранения.') + ' Повторное удержание - стоп.', '', 'СТАРТ');
    btnBar(); onBtn = null;
    S.onStart = function (dir) { S.onStart = null; run(dir, next); }; });
  steps.push(function (next) { say(kind === 'full' ? 'Готово: <b>4,35 В</b>, ток упал до нуля, зарядка пискнула. Отключи АКБ - нажми на неё. Летим завтра!' : 'Готово: <b>3,80 В</b>. Отключи АКБ (нажми на неё) и убери в огнеупорный мешок.', 'ok', 'ГОТОВО');
    highlight(batt.userData.body); tapOn([batt, wire].filter(Boolean), function () { connectWire(false); S.v[0] = 0; S.a[0] = 0; drawLCD(); if (kind === 'store') batt.position.set(.45, .1, -.02); next(); }); });
  var si = 0; function nx() { if (si >= steps.length) return done(kind); steps[si++](nx); } nx();

  function run(dir, next) { var a = CUR[S.ci], t = 0, dur = 7; btnBar();
    say(dir > 0 ? 'Идёт заряд. Сначала ток ровный ' + n2(a, 1) + ' А, а у самого конца падает: зарядка "доливает" банку. В жизни это около часа - не уходим.' : 'Идёт разряд до 3,80 В: ток со знаком минус, зарядка забирает энергию у АКБ.', '', 'ИДЁТ');
    var f = function (dt) { if (!S.run) { anims.splice(anims.indexOf(f), 1); say('Остановлено. Удержи ①, чтобы продолжить.', '', 'СТОП'); S.onStart = function (d2) { S.onStart = null; run(d2, next); }; return; }
      t += dt; var k = Math.min(1, t / dur), v = v0 + (tgt - v0) * (1 - Math.pow(1 - k, 1.6)); S.v[0] = v;
      S.a[0] = dir > 0 ? (k < .7 ? a : a * (1 - (k - .7) / .3)) : -Math.min(.5, a); drawLCD();
      if (k >= 1) { anims.splice(anims.indexOf(f), 1); S.run = 0; S.a[0] = 0; S.v[0] = tgt; flashMsg(dir > 0 ? 'FULL' : 'DONE'); beep(3); setTimeout(next, 900); } };
    anims.push(f); }
}
function done(kind) { lsS(KEY + '_' + kind, '1'); highlight(null); onBtn = null;
  say(kind === 'full' ? 'Урок пройден! Порядок: осмотр → питание → порт → ② вольты (LiHV 4,35, LiPo 4,20) → ① ток не больше 1C → удержать ① старт. Всё время рядом.' : 'Урок пройден! Не летаем больше пары дней - ② на 3,80 В, удержать ①, и в мешок.', 'ok', 'УРОК ПРОЙДЕН');
  buttons([{ t: 'Другой урок', f: menu }, { t: 'Вернуться в комнату', cls: 'pri', f: close }]); if (window.AKB_TOAST) AKB_TOAST('Урок на зарядке пройден'); }
/* стиль кнопок-"железок" */
var css = document.createElement('style'); css.textContent = '.g-bar button.hw{width:116px;height:116px;border-radius:50%;padding:0;background:radial-gradient(circle at 35% 30%,#f2f4f8,#9aa1b0 60%,#5c6270);color:#1a1d28;border:4px solid #2a2e3a;font-size:13px;font-weight:900;box-shadow:0 6px 0 #1a1d28,0 0 0 6px #ffffff14;touch-action:none;user-select:none}.g-bar button.hw.down{transform:translateY(4px);box-shadow:0 2px 0 #1a1d28}.g-bar button.hw.held{box-shadow:0 0 0 8px #ffd36e88,0 0 30px #ffd36e}@media (max-width:500px){.g-bar button.hw{width:96px;height:96px}}.zar-lcd{position:absolute;right:12px;top:150px;width:min(42vw,300px);padding:6px;border-radius:12px;background:#0b0d1ee8;border:1px solid #ffffff30;z-index:6}.zar-lcd canvas{display:block;width:100%;height:auto;border-radius:6px}.zar-lcd::before{content:"ЭКРАН ЗАРЯДКИ";display:block;font:800 10px/1 Manrope,sans-serif;letter-spacing:.14em;color:#ffd36e;margin:2px 4px 6px}@media (orientation:portrait){.zar-lcd{top:auto;bottom:150px;right:50%;transform:translateX(50%);width:min(70vw,300px)}}';
document.head.appendChild(css);
reset(3.6);
var esc0 = R.onEsc; R.onEsc = function () { if (Z.on) close(); else esc0(); };
window.AKB_ZAR = { open: open, close: close, get on() { return Z.on; }, press: press, S: S };
})();
