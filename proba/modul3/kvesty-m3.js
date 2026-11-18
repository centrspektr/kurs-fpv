/* kvesty-m3.js - мини-квесты модуля 3 "Аккумуляторная" (проба new.html, 18.11.2026, просьба Alexandr: взять в одной комнате, принести в другую).
   1. Склад АКБ (комната 4): открыть шкафчик "РАЗРЯЖЕННЫЕ", взять аккумулятор -> отнести в Зарядную (комната 5) на зарядную станцию.
      Пока аккумулятор не принесён, урок на зарядке не открывается.
   2. Устройство АКБ (комната 1): открыть ящик с инструментами, взять тестер банок -> отнести на стол АКБ в Лабораторию (комната 2).
      Пока тестера нет, стол АКБ не открывается.
   3. Полётный зал (комната 6): вздутый аккумулятор -> в ведро с песком в Зарядной (комната 5). Ничего не закрывает, это урок безопасности.
   В руках один предмет: E (на телефоне кнопка E) - взять или положить. Сделанное помнится (localStorage kursy_m3_kvest).
   Нужны: akb-etazh-g.js (window.AKB), predmety.js. Подключается из index.html только в пробе курса. */
(function () {
'use strict';
var K = window.AKB, P = window.PREDMETY; if (!K || !P || !K.R) return;
var T = THREE, R = K.R, PI = Math.PI, LX = 8, RW = 8, CZ0 = 7, CZ1 = 10.2;
var KEY = ((window.KURSY || {}).store || 'kursy') + '_m3_kvest', st = P.load(KEY);
var H = P.ruki({ camera: R.camera, scene: R.scene, root: document.body });
function room(id) { for (var i = 0; i < K.rooms.length; i++) if (K.rooms[i].id === id) return K.rooms[i]; return null; }
function Pt(r, u, v) { return r.south ? [r.ox + RW - u, CZ1 + v] : [r.ox + u, CZ0 - v]; }
function RY(r, a) { return (a || 0) + (r.south ? PI : 0); }
var E = P.etazh({ R: R, H: H, Pt: Pt, RY: RY }), findItem = E.findItem, hideIt = E.hideIt, showIt = E.showIt, pickable = E.pickable, locker = E.locker, target = E.target;
function save() { P.save(KEY, st); }

/* ---------- 1. Разряженный аккумулятор: склад -> зарядная ---------- */
var r4 = room('S1'), r5 = room('N2'), B = window.AKB_BENCH;
var bench = findItem('Зарядная станция');
if (r4 && r5 && B && bench) {
  var akbIt = null;
  var L1 = locker({ r: r4, u: 1.7, v: 6.66, a: 0, w: .9, h: 1.5, d: .5, col: '#334155', door: '#475569', label: 'РАЗРЯЖЕННЫЕ', labelBg: '#fca5a5', name: 'Шкафчик "Разряженные"', kicker: 'Склад АКБ', sub: 'Здесь лежат аккумуляторы, которые пора зарядить. Открой дверцу.' });
  if (!st.akb) { var pa = L1.g.localPt(0, L1.g.userData.shelfY, .02); akbIt = pickable({ id: 'akb', kind: 'akb_razr', name: 'Разряженный аккумулятор', sub: 'Аккумулятор 4S после полётов: на банке около 3,5 вольта. Его надо зарядить. Отнеси на зарядную станцию в комнату 5.', where: 'на зарядную станцию в комнате 5 "Зарядная"', pos: pa, ry: L1.ry, s: 1.8, at: L1.it.at, reg: r4.id, hidden: true });
    L1.it.sub = 'Здесь лежат аккумуляторы, которые пора зарядить. Открой дверцу и возьми один.'; }
  L1.setInside(akbIt);

  var onBench = function () { var m = P.model('akb_razr'); m.scale.setScalar(1.8); m.position.set(-.12, B.y - B.g.position.y, 1.05); m.rotation.y = -PI / 2; B.g.add(m); };
  if (st.akb) onBench();
  target(bench, { need: 'akb', ok: function () { return !!st.akb; }, lock: 'Зарядке нужен аккумулятор. Разряженные лежат в шкафчике на складе (комната 4) - принеси один.',
    put: function () { st.akb = 1; save(); onBench(); H.say('Аккумулятор на зарядке. Теперь можно учиться заряжать!', 4000); } });
}

/* ---------- 2. Тестер: устройство АКБ -> стол в лаборатории ---------- */
var r1 = room('N0'), table = findItem('Стол АКБ'), TB = window.AKB_TABLE;
if (r1 && table && TB) {
  var tesIt = null;
  var L2 = locker({ r: r1, u: 1.0, v: 6.66, a: 0, w: .7, h: .9, d: .4, y: 0, col: '#9a3412', door: '#c2410c', label: 'ИНСТРУМЕНТ', labelBg: '#fde68a', name: 'Ящик с инструментами', kicker: 'Устройство АКБ', sub: 'Здесь тестер банок и другие приборы. Открой дверцу.' });
  if (!st.tester) { var pt = L2.g.localPt(0, L2.g.userData.shelfY, .02); tesIt = pickable({ id: 'tester', kind: 'tester', name: 'Тестер банок', sub: 'Показывает напряжение каждой банки аккумулятора. Без него в лаборатории не проверить АКБ. Отнеси на стол в комнату 2.', where: 'на стол АКБ в комнате 2 "Лаборатория"', pos: pt, ry: L2.ry, s: 2.0, at: L2.it.at, reg: r1.id, hidden: true }); }
  L2.setInside(tesIt);

  var onTable = function () { var m = P.model('tester'); m.scale.setScalar(2.2); m.position.set(TB.w / 2 - .45, TB.y - TB.g.position.y, TB.d / 2 - .3); m.rotation.y = .3; TB.g.add(m); };
  if (st.tester) onTable();
  target(table, { need: 'tester', ok: function () { return !!st.tester; }, lock: 'На столе нет тестера банок. Он в ящике с инструментами в комнате 1 "Устройство АКБ" - принеси.',
    put: function () { st.tester = 1; save(); onTable(); H.say('Тестер на столе. Можно проверять аккумуляторы!', 4000); } });
}

/* ---------- 3. Вздутый аккумулятор: полётный зал -> ведро с песком ---------- */
var r6 = room('S2');
if (r6 && r5 && !st.vzdut) {
  var pv = Pt(r6, 2.4, 4.9), vz = pickable({ id: 'vzdut', kind: 'akb_vzdut', name: 'Вздутый аккумулятор!', sub: 'Аккумулятор раздулся, как подушка. Так бывает после удара или перезаряда. Летать на нём и заряжать его нельзя - он может загореться. Отнеси в ведро с песком в комнату 5.',
    where: 'в ведро с песком в комнате 5 "Зарядная"', pos: [pv[0], 0, pv[1]], ry: .4, s: 2.4, at: Pt(r6, 2.4, 3.6), reg: r6.id });
  var ring = new T.Mesh(new T.RingGeometry(.22, .27, 32), new T.MeshBasicMaterial({ color: new T.Color('#ff5d6c').multiplyScalar(1.4), transparent: true, toneMapped: false })); ring.rotation.x = -PI / 2; ring.position.set(pv[0], .012, pv[1]); R.scene.add(ring);
  R.frame(function (dt, t) { ring.visible = !vz.hidden; ring.material.opacity = .5 + Math.sin(t * 4) * .4; });
  /* ведро с песком в зарядной (из akb-etazh-g.js: x = комната + 0.5, z = 3.6) */
  var bx = r5.ox + .5, bz = 3.6, bucket = new T.Group(); bucket.position.set(bx, 0, bz); R.scene.add(bucket);
  var hit = new T.Mesh(new T.CylinderGeometry(.24, .24, .4, 12), new T.MeshBasicMaterial({ visible: false })); hit.position.y = .2; bucket.add(hit); hit.visible = true; hit.material.colorWrite = false; hit.material.depthWrite = false;
  var bIt = R.item({ obj: bucket, name: 'Ведро с песком', kicker: 'Зарядная', sub: 'Если аккумулятор вздулся или задымил - его кладут в песок. Песок не даёт огню разгореться.', at: [bx + 1.3, bz], look: [bx, .3, bz], tagY: .9, tagFar: 6, actLabel: '⬇ Положить',
    act: function () { if (!(H.o && H.o.id === 'vzdut')) { H.say('Ведро с песком - для вздутых и горячих аккумуляторов. Такой лежит в полётном зале (комната 6).', 4000); return; }
      H.put(); st.vzdut = 1; save(); var m = P.model('akb_vzdut'); m.scale.setScalar(1.6); m.position.set(0, .3, 0); m.rotation.set(.3, .5, 0); bucket.add(m); bIt.noTag = true;
      H.say('Правильно! Вздутый аккумулятор - только в песок, потом его сдают на переработку.', 5000); } });
  bIt.reg = r5.id; bIt.at3 = [bx, 0, bz];
}

/* ---------- 18.11: что искать и куда идти (Alexandr не мог найти предметы): список в углу и маяк над следующим местом ---------- */
(function () {
  var LS = P.spisok(document.body), BC = [P.beacon(R.scene, '#ffd36e'), P.beacon(R.scene, '#7cf3ff'), P.beacon(R.scene, '#ff8a8a')];
  function gp(o) { return o.position ? [o.position.x, o.position.z] : o; }
  function step(n, ok, item, src, srcY, dst, dstY, need) { var b = BC[n]; if (ok || !item && !src) { b.off(); return; }
    if (H.o && H.o.id === need) b.at(dst[0], dstY, dst[1]); else if (H.o || !item || item.taken) b.off(); else b.at(src[0], srcY, src[1]); }
  function upd() {
    var rows = [];
    if (typeof L1 !== 'undefined' && L1) { var c1 = !!st.akb, h1 = H.o && H.o.id === 'akb'; rows.push({ ok: c1, t: 'Аккумулятор - на зарядку', w: h1 ? 'неси в комнату 5 "Зарядная"' : 'шкафчик на складе, комната 4' });
      step(0, c1, akbIt, gp(L1.g), 1.5, [B.x, B.z], B.y, 'akb'); }
    if (typeof L2 !== 'undefined' && L2) { var c2 = !!st.tester, h2 = H.o && H.o.id === 'tester'; rows.push({ ok: c2, t: 'Тестер - на стол лаборатории', w: h2 ? 'неси в комнату 2 "Лаборатория"' : 'ящик в комнате 1' });
      step(1, c2, tesIt, gp(L2.g), .9, [TB.x, TB.z], TB.y, 'tester'); }
    if (r6 && r5) { var c3 = !!st.vzdut, h3 = H.o && H.o.id === 'vzdut'; rows.push({ ok: c3, t: 'Вздутый аккумулятор - в песок', w: h3 ? 'ведро в комнате 5 "Зарядная"' : 'полётный зал, комната 6' });
      if (!c3 && typeof vz !== 'undefined') step(2, c3, vz, [pv[0], pv[1]], .1, [bx, bz], .4, 'vzdut'); else BC[2].off(); }
    if (rows.length && rows.some(function (r) { return !r.ok; })) LS.set('ЗАДАНИЯ С ПРЕДМЕТАМИ', rows); else LS.hide();
    var busy = false; try { busy = R.mode !== 'walk' || (R.busy && R.busy()); } catch (e) {} LS.el.style.visibility = busy ? 'hidden' : '';
  }
  upd(); setInterval(upd, 400);
})();
})();
