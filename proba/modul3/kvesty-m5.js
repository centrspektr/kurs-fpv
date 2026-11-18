/* kvesty-m5.js - мини-квест модуля 5 "Гоночный клуб" (проба new.html, 18.11.2026, просьба Alexandr: больше взаимодействия с предметами).
   Перед заездом на время пилот готовится сам:
     1. Бокс 5 "Видеоканалы": открыть шкафчик "ОЧКИ ПИЛОТОВ", взять FPV-очки -> положить на стойку пилота в зале с трассой.
     2. Бокс 6 "Брифинг": открыть ящик LiPo, взять заряженный аккумулятор -> вставить в гоночный дрон на стартовой площадке.
   Пока очки и аккумулятор не на месте, заезд не начинается. В руках один предмет, E (на телефоне кнопка E) - взять или положить.
   Сделанное помнится (localStorage kursy_m5_kvest). Нужны: gonki-etazh.js (window.AKB), predmety.js. Подключается из gonki.html только в пробе курса. */
(function () {
'use strict';
var K = window.AKB, P = window.PREDMETY; if (!K || !P || !K.R || !K.race) return;
var T = THREE, R = K.R, PI = Math.PI, RW = 8, CZ0 = 7, CZ1 = 10.2;
var KEY = ((window.KURSY || {}).store || 'kursy') + '_m5_kvest', st = P.load(KEY);
var H = P.ruki({ camera: R.camera, scene: R.scene, root: document.body });
function room(id) { for (var i = 0; i < K.rooms.length; i++) if (K.rooms[i].id === id) return K.rooms[i]; return null; }
function Pt(r, u, v) { return r.south ? [r.ox + RW - u, CZ1 + v] : [r.ox + u, CZ0 - v]; }
function RY(r, a) { return (a || 0) + (r.south ? PI : 0); }
var E = P.etazh({ R: R, H: H, Pt: Pt, RY: RY });
function save() { P.save(KEY, st); }
function inside(L, it) { L.setInside(it); }

var raceIt = E.findItem('Заезд на время'), r5 = room('N2'), r6 = room('S2');
if (!raceIt || !r5 || !r6) return;

/* 1. очки в шкафчике бокса "Видеоканалы" (у правой стены, у входа) */
var L1 = E.locker({ r: r5, u: 7.7, v: 2.0, a: -PI / 2, w: .9, h: 1.5, d: .5, col: '#1e1b4b', door: '#312e81', label: 'ОЧКИ ПИЛОТОВ', labelBg: '#7cf3ff', name: 'Шкафчик "Очки пилотов"', kicker: 'Видеоканалы', sub: 'Здесь хранят FPV-очки. Открой дверцу.' }), och = null;
if (!st.ochki) { var p1 = L1.g.localPt(0, L1.g.userData.shelfY, .02); och = E.pickable({ id: 'ochki', kind: 'ochki', name: 'FPV-очки', sub: 'В очках пилот видит полёт глазами дрона. Перед заездом выбери в очках свой видеоканал, чтобы не мешать другим. Отнеси на стойку пилота в зал с трассой.', where: 'на стойку пилота в зале с трассой', pos: p1, ry: L1.ry, s: 1.6, at: L1.it.at, reg: r5.id, hidden: true }); }
inside(L1, och);

/* 2. заряженный аккумулятор в ящике LiPo бокса "Брифинг" (у правой стены, в глубине) */
var L2 = E.locker({ r: r6, u: 7.7, v: 5.7, a: -PI / 2, w: .8, h: .7, d: .5, col: '#713f12', door: '#a16207', label: 'LiPo', labelBg: '#facc15', name: 'Ящик LiPo', kicker: 'Брифинг', sub: 'Огнестойкий ящик с заряженными аккумуляторами. Открой.' }), akb = null;
if (!st.akb) { var p2 = L2.g.localPt(0, L2.g.userData.shelfY, .02); akb = E.pickable({ id: 'akb', kind: 'akb', name: 'Заряженный аккумулятор', sub: 'Аккумулятор для гоночного дрона, заряжен перед заездом. Вставь его в дрон на стартовой площадке в зале. Подключают перед самым взлётом.', where: 'в гоночный дрон на старте в зале с трассой', pos: p2, ry: L2.ry, s: 1.8, at: L2.it.at, reg: r6.id, hidden: true }); }
inside(L2, akb);

/* на стойке пилота - очки */
var pilot = raceIt.obj;
function ochOn() { var m = P.model('ochki'); m.scale.setScalar(1.3); m.position.set(0, 1.0, -.12); m.rotation.y = PI; pilot.add(m); }
if (st.ochki) ochOn();
/* дрон на старте: сюда вставляем аккумулятор (дрон и площадка - из gonki-etazh.js, K.race) */
var S0 = [36.6, 13.6], pad = new T.Group(); pad.position.set(S0[0], 0, S0[1]); R.scene.add(pad);
var hit = new T.Mesh(new T.CylinderGeometry(.5, .5, .4, 16), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); hit.position.y = .2; pad.add(hit);
function akbOn() { var m = P.model('akb'); m.scale.setScalar(1.2); m.position.set(0, .14, 0); m.rotation.y = PI / 2; pad.add(m); }
if (st.akb) akbOn();
function ready() { return !!(st.ochki && st.akb); }
var padIt = R.item({ obj: pad, name: 'Гоночный дрон', kicker: 'Стартовая площадка', sub: 'Дрон ждёт заезда. Аккумулятор подключают последним, перед самым взлётом.', at: [S0[0] - 1.2, S0[1] - .9], look: [S0[0], .2, S0[1]], tagY: .9, tagFar: 8, actLabel: '⬇ Вставить аккумулятор',
  act: function () { if (st.akb) { H.say('Аккумулятор уже в дроне. ' + (st.ochki ? 'Иди к стойке пилота - заезд!' : 'Осталось принести очки на стойку пилота.'), 3500); return; }
    if (H.o && H.o.id === 'akb') { H.put(); st.akb = 1; save(); akbOn(); padIt.noTag = true; H.say('Аккумулятор в дроне. ' + (st.ochki ? 'Всё готово - к стойке пилота!' : 'Теперь принеси очки на стойку пилота.'), 4000); return; }
    H.say('В дроне нет аккумулятора. Заряженные лежат в ящике LiPo в боксе 6 "Брифинг".', 4000); } });
padIt.reg = 'Z'; padIt.at3 = [S0[0], 0, S0[1]]; if (st.akb) padIt.noTag = true;

/* стойка пилота: заезд только когда всё готово */
E.target(raceIt, { need: 'ochki', ok: ready, lockLabel: '🔒 Сначала подготовься',
  lock: 'Перед заездом нужны FPV-очки (шкафчик в боксе 5 "Видеоканалы") и заряженный аккумулятор в дроне (ящик LiPo в боксе 6 "Брифинг").',
  put: function () { st.ochki = 1; save(); ochOn(); H.say(st.akb ? 'Очки на стойке, дрон заряжен. Нажми E - заезд!' : 'Очки на стойке. Теперь вставь аккумулятор в дрон на старте.', 4000); } });
/* если очки уже на стойке, а аккумулятора нет - подсказка про дрон */
var a1 = raceIt.act; raceIt.act = function (x) { if (st.ochki && !st.akb && !(H.o && H.o.id === 'ochki')) { H.say('Очки на месте. В дроне на старте нет аккумулятора - он в ящике LiPo в боксе 6 "Брифинг".', 4500); return; } a1(x); };

/* ---------- 18.11: что искать и куда идти: список в углу и маяк над следующим местом ---------- */
(function () {
  var LS = P.spisok(document.body), b1 = P.beacon(R.scene, '#7cf3ff'), b2 = P.beacon(R.scene, '#ffd36e'), pp = pilot.position;
  function gp(o) { return [o.position.x, o.position.z]; }
  function upd() {
    var h1 = H.o && H.o.id === 'ochki', h2 = H.o && H.o.id === 'akb';
    if (st.ochki) b1.off(); else if (h1) b1.at(pp.x, 1.0, pp.z); else if (H.o || !och || och.taken) b1.off(); else { var a = gp(L1.g); b1.at(a[0], 1.5, a[1]); }
    if (st.akb) b2.off(); else if (h2) b2.at(S0[0], .15, S0[1]); else if (H.o || !akb || akb.taken) b2.off(); else { var c = gp(L2.g); b2.at(c[0], .7, c[1]); }
    if (ready()) LS.hide(); else LS.set('ПЕРЕД ЗАЕЗДОМ', [{ ok: !!st.ochki, t: 'FPV-очки - на стойку пилота', w: h1 ? 'неси в зал с трассой' : 'шкафчик в боксе 5 "Видеоканалы"' },
      { ok: !!st.akb, t: 'Аккумулятор - в дрон на старте', w: h2 ? 'неси в зал, на стартовую площадку' : 'ящик LiPo в боксе 6 "Брифинг"' }]);
    var busy = false; try { busy = R.mode !== 'walk' || (R.busy && R.busy()); } catch (e) {} LS.el.style.visibility = busy ? 'hidden' : '';
  }
  upd(); setInterval(upd, 400);
})();
})();
