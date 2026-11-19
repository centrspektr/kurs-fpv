/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* masterskaya-kvest.js - мини-квест модуля 2 "Мастерская" (проба new.html, 18.11.2026, просьба Alexandr).
   Прежде чем собирать дрон, ученик готовит рабочее место: приносит на стол сборки 4 вещи.
     1. Паяльная станция и 2. кейс с отвёртками - в шкафу инструментов у правой стены (дверцу надо открыть).
     3. Коробка с деталями - у стеллажа деталей (левая стена).
     4. Аккумулятор - в шкафу аккумуляторов (дверцу надо открыть).
   Взять - E (на телефоне кнопка E) или нажать на предмет; положить - подойти к столу и E. В руках один предмет.
   Пока на столе не всё, стол не пускает в "Собери дрон" (задание с теорией открывается как раньше).
   Сделанное помнится (localStorage kursy_m2_kvest). Движок - komnata-new.js (window.KOMNATA_KVEST.m2), предметы - predmety.js. */
(function () {
'use strict';
if (!window.PREDMETY) return;
var KEY = ((window.KURSY || {}).store || 'kursy') + '_m2_kvest';
window.KOMNATA_KVEST = window.KOMNATA_KVEST || {};
window.KOMNATA_KVEST.m2 = function (X) {
  var T = X.T, P = window.PREDMETY, D = 17, W = 24, PI = Math.PI;
  var st = P.load(KEY), H = P.ruki({ camera: X.CAM, scene: X.S, root: X.root });
  /* 18.11: сообщения квеста читает Лера; первая подсказка (soft) не перебивает экран-монитор */
  function hint(t, ms, soft) { X.hint(t, ms); if (P.golos) P.golos(t, soft); }
  var TB = X.TABLE; if (!TB) return null;

  /* что приносим: где лежит и куда ложится на столе (координаты стола: x вправо, z к ученику) */
  var ITEMS = [
    { id: 'payalnik', kind: 'payalnik', name: 'Паяльная станция', sub: 'Паяльник греется до 330 градусов. Им припаивают провода моторов и аккумулятора. Брать за ручку, жало не трогать.', spot: [.48, -.28, -.6], s: 1.5 },
    { id: 'otvertki', kind: 'otvertki', name: 'Отвёртки и шестигранники', sub: 'Шестигранники крутят винты рамы и моторов, отвёртки - мелкие винты плат. Каждый размер - под свой винт.', spot: [-1.15, -.32, .25], s: 1.5 },
    { id: 'detali', kind: 'detali', name: 'Коробка с деталями', sub: 'Рама, четыре мотора, регулятор, полётный контроллер, камера, видеопередатчик и приёмник. Всё, из чего соберём дрон.', spot: [-1.05, .3, -.15], s: 1.3 },
    { id: 'akb', kind: 'akb', name: 'Аккумулятор 4S', sub: 'Заряженный LiPo для проверки дрона в конце сборки. Его подключают последним, когда всё уже спаяно и проверено.', spot: [1.15, .32, .2], s: 1.8 }];
  var BYID = {}; ITEMS.forEach(function (it) { BYID[it.id] = it; });
  function done() { return ITEMS.every(function (it) { return st[it.id]; }); }
  var TOP = .95; /* высота столешницы */
  /* на столе из "Собери дрон" (SBStol) уже стоит паяльная станция: прячем её, пока ученик не принесёт свою */
  var STN = null; TB.g.children.forEach(function (c) { if (Math.abs(c.scale.x - .02) < 1e-4) c.traverse(function (o) { if (!STN && o.isGroup && o.position.x === 24 && o.position.z === -14) STN = o; }); });
  if (STN && !st.payalnik) STN.visible = false;
  function onTable(it) { if (it.id === 'payalnik' && STN) { STN.visible = true; if (it.ghost) it.ghost.visible = false; return; } var m = P.model(it.kind); m.scale.setScalar(it.s); m.position.set(it.spot[0], TOP, it.spot[1]); m.rotation.y = it.spot[2]; TB.g.add(m); it.placed = m; if (it.ghost) it.ghost.visible = false; }

  /* силуэты на столе: где чего не хватает */
  ITEMS.forEach(function (it) { if (st[it.id]) return;
    var g = new T.Group(), m = P.model(it.kind), bb = new T.Box3().setFromObject(m), sz = bb.getSize(new T.Vector3());
    var e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(sz.x * it.s, sz.y * it.s, sz.z * it.s)), new T.LineBasicMaterial({ color: '#7cf3ff', transparent: true, opacity: .8, toneMapped: false }));
    e.position.y = sz.y * it.s / 2; g.add(e); g.position.set(it.spot[0], TOP, it.spot[1]); g.rotation.y = it.spot[2]; TB.g.add(g); it.ghost = g; });
  X.TICK.push(function (t) { ITEMS.forEach(function (it) { if (it.ghost && it.ghost.visible) it.ghost.children[0].material.opacity = .45 + Math.sin(t * 3) * .35; }); });
  ITEMS.forEach(function (it) { if (st[it.id]) onTable(it); });

  /* предмет, который можно взять */
  function pickable(it, mesh, at, look) { it.mesh = mesh; X.S.add(mesh); P.proxy(mesh, .55 / (mesh.scale.x || 1)); /* 18.11: большая зона нажатия */
    it.c = { o: mesh, kind: 'q', at: at, look: look, q: { card: function () {
      var busy = H.o && H.o !== it;
      return { sm: 'ПРЕДМЕТ · ДЛЯ СТОЛА СБОРКИ', h: it.name, p: it.sub, acts: busy ? '<button class="k-b dis" data-a="lock">Руки заняты: ' + H.o.name + '</button>' : '<button class="k-b pri" data-a="q:take">✋ Взять</button>' }; } }, item: it };
    if (it.open !== false) X.CLICK.push(it.c); }
  function take(it) { if (H.o) return; var i = X.CLICK.indexOf(it.c); if (i >= 0) X.CLICK.splice(i, 1); X.S.remove(it.mesh);
    it.where = 'на стол сборки в центре зала'; H.take(it, P.model(it.kind)); X.unsel(); hint('Взял: ' + it.name + '. Отнеси на стол сборки в центре и нажми E.', 4500); }

  /* 18.11: в открытом шкафу кнопка "Взять" сразу в карточке шкафа - E берёт предмет, а не закрывает дверцу */
  function takeBtns(ids) { if (H.o) return '<button class="k-b dis" data-a="lock">Руки заняты: ' + H.o.name + '</button>';
    return ids.filter(function (k) { var it = BYID[k]; return !st[k] && it.mesh && it.mesh.parent; }).map(function (k, i) { return '<button class="k-b' + (i ? '' : ' pri') + '" data-a="q:takeid:' + k + '">✋ Взять: ' + BYID[k].name + '</button>'; }).join(''); }
  /* шкаф инструментов у правой стены: паяльная станция на нижней полке, кейс с отвёртками на верхней */
  var SX = W / 2 - .34, SZ = -5.6, sh = P.shkaf({ w: 1.2, h: 1.7, d: .56, col: '#7f1d1d', door: '#991b1b', label: 'ИНСТРУМЕНТ', labelBg: '#f5f5f5' });
  sh.position.set(SX, 0, SZ); sh.rotation.y = -PI / 2; X.S.add(sh); X.block(SX, SZ, .3, .6, 0); sh.updateMatrixWorld(true);
  /* локальная точка шкафа -> мир (шкаф повёрнут лицом к центру зала, -x) */
  function shW(lx, ly, lz) { var v = new T.Vector3(lx, ly, lz); sh.localToWorld(v); return v; }
  [['payalnik', sh.userData.floorY, -.12, 1.3], ['otvertki', sh.userData.shelfY, .05, 1.3]].forEach(function (q) { var it = BYID[q[0]]; if (st[it.id]) return;
    var m = P.model(it.kind); m.scale.setScalar(q[3]); var p = shW(q[2], q[1], 0); m.position.copy(p); m.rotation.y = -PI / 2; it.open = false;
    pickable(it, m, [SX - 1.9, SZ], [p.x, p.y + .1, p.z]); });
  var shC = { o: sh, kind: 'q', at: [SX - 2.3, SZ], look: [SX, 1.0, SZ], q: { card: function () { var o = sh.userData.open, left = ['payalnik', 'otvertki'].filter(function (k) { return !st[k] && !(H.o && H.o.id === k) && BYID[k].c && X.CLICK.indexOf(BYID[k].c) < 0; });
      return { sm: 'ШКАФ ИНСТРУМЕНТОВ', h: o ? 'Шкаф открыт' : 'Шкаф с инструментами', p: o ? 'Возьми, что нужно для стола сборки: нажми на предмет внутри.' : 'Здесь паяльная станция и отвёртки. Открой дверцу.',
        acts: o ? takeBtns(['payalnik', 'otvertki']) + '<button class="k-b" data-a="q:close">Закрыть</button>' : '<button class="k-b pri" data-a="q:open">🚪 Открыть</button>' }; },
    act: function (a) { sh.userData.toggle(a === 'open', function () { ['payalnik', 'otvertki'].forEach(function (k) { var it = BYID[k]; if (!it.c || st[k] || (H.o && H.o.id === k) || !it.mesh.parent) return; var i = X.CLICK.indexOf(it.c); if (a === 'open' && i < 0) X.CLICK.push(it.c); if (a !== 'open' && i >= 0) X.CLICK.splice(i, 1); }); X.recard(); }); } } };
  X.CLICK.push(shC);

  /* коробка с деталями у стеллажа деталей */
  (function () { var it = BYID.detali; if (st.detali) return; var m = P.model('detali'); m.scale.setScalar(1.6); m.position.set(-W / 2 + 1.2, 0, -5.9); m.rotation.y = PI / 2 + .15; X.block(-W / 2 + 1.2, -5.9, .25, .25, 0);
    pickable(it, m, [-W / 2 + 2.6, -5.5], [-W / 2 + 1.2, .3, -5.9]); })();

  /* дверца шкафа аккумуляторов (шкаф из masterskaya.js: x -6.2, у дальней стены) */
  var BX = -6.2, BZ = -D / 2 + .5, bh = new T.Group(); bh.position.set(BX - .8, 0, BZ + .37); X.S.add(bh);
  var glass = new T.MeshStandardMaterial({ color: '#5a7a99', roughness: .1, metalness: .3, transparent: true, opacity: .35 }), fr = new T.MeshStandardMaterial({ color: '#2a2a2e', roughness: .4, metalness: .7 });
  [[.8, .04, 1.6, .04, 2.16], [.8, .04, 1.6, .04, .04]].forEach(function (q) { var b = new T.Mesh(new T.BoxGeometry(q[2], q[3], .03), fr); b.position.set(q[0], q[4], .015); bh.add(b); });
  [[.02], [1.58]].forEach(function (q) { var b = new T.Mesh(new T.BoxGeometry(.04, 2.16, .03), fr); b.position.set(q[0], 1.1, .015); bh.add(b); });
  var gp = new T.Mesh(new T.BoxGeometry(1.52, 2.08, .01), glass); gp.position.set(.8, 1.1, .015); bh.add(gp);
  var hd = new T.Mesh(new T.BoxGeometry(.03, .3, .04), new T.MeshStandardMaterial({ color: '#ddd', roughness: .2, metalness: .9 })); hd.position.set(1.48, 1.1, .05); bh.add(hd);
  var bOpen = false;
  (function () { var it = BYID.akb; if (st.akb) return; var m = P.model('akb'); m.scale.setScalar(1.9); m.position.set(BX + .05, 1.27, BZ + .26); m.rotation.y = .2; it.open = false;
    pickable(it, m, [BX, BZ + 2.0], [BX, 1.3, BZ + .26]); })();
  var bC = { o: bh, kind: 'q', at: [BX + .3, BZ + 2.1], look: [BX, 1.1, BZ], q: { card: function () {
      return { sm: 'ШКАФ АККУМУЛЯТОРОВ', h: bOpen ? 'Шкаф открыт' : 'Шкаф с аккумуляторами', p: bOpen ? (st.akb || H.o === BYID.akb ? 'Огнестойкий шкаф: аккумуляторы хранят здесь, а не на столе. Закрой дверцу.' : 'Возьми аккумулятор с красными проводами - он заряжен и готов.') : 'Аккумуляторы LiPo хранят в огнестойком шкафу. Открой дверцу.',
        acts: bOpen ? takeBtns(['akb']) + '<button class="k-b" data-a="q:close">Закрыть</button>' : '<button class="k-b pri" data-a="q:open">🚪 Открыть</button>' }; },
    act: function (a) { var on = a === 'open'; if (on === bOpen) return; bOpen = on; var a0 = bh.rotation.y, a1 = on ? -1.9 : 0;
      P.anim(.6, function (u) { bh.rotation.y = a0 + (a1 - a0) * u; }, function () { var it = BYID.akb; if (it.c && !st.akb && it.mesh.parent) { var i = X.CLICK.indexOf(it.c); if (on && i < 0) X.CLICK.push(it.c); if (!on && i >= 0) X.CLICK.splice(i, 1); } X.recard(); }); } } };
  X.CLICK.push(bC);
  if (st.akb) { bh.rotation.y = 0; }

  /* стол: пока не всё принесено - карточка "подготовь рабочее место" */
  function list() { return ITEMS.map(function (it) { return (st[it.id] ? '✓ ' : '○ ') + it.name; }).join('   '); }
  function where() { if (!st.payalnik || !st.otvertki) return 'Паяльник и отвёртки - в красном шкафу у правой стены. '; if (!st.detali) return 'Коробка с деталями - у стеллажа деталей слева. '; if (!st.akb) return 'Аккумулятор - в шкафу аккумуляторов у дальней стены. '; return ''; }
  var Q = {
    table: function () { if (done()) return null;
      var n = ITEMS.filter(function (it) { return st[it.id]; }).length;
      return { sm: 'СТОЛ СБОРКИ · ПОДГОТОВЬ МЕСТО ' + n + ' / 4', h: H.o ? 'Положи на стол: ' + H.o.name : 'Сначала принеси инструменты',
        p: (H.o ? '' : 'Перед сборкой на столе должно быть всё нужное. ' + where()) + list(),
        acts: H.o ? '<button class="k-b pri" data-a="q:put">⬇ Положить на стол</button>' : '<button class="k-b dis" data-a="lock">🔒 Собрать дрон: принеси 4 вещи</button>' }; },
    act: function (a, c) {
      if (a === 'take' && c.item) { take(c.item); return; }
      if (a.indexOf('takeid:') === 0) { var ti = BYID[a.slice(7)]; if (ti && !st[ti.id] && ti.mesh && ti.mesh.parent) take(ti); return; }
      if (a === 'put' && H.o) { var it = H.put(); st[it.id] = 1; P.save(KEY, st); onTable(it);
        if (done()) { X.toast('Рабочее место готово! Теперь собирай дрон.'); X.hint('Всё на столе. Нажми E у стола - начнём сборку.', 5000); if (P.golos) P.golos('Рабочее место готово! Теперь собирай дрон. Всё на столе. Нажми E у стола - начнём сборку.'); }
        else { var left = ITEMS.filter(function (q) { return !st[q.id]; }).length; X.toast('На столе: ' + it.name + '. Ещё ' + left + '.'); if (P.golos) P.golos('На столе: ' + it.name + '. ' + (left === 1 ? 'Осталась одна вещь.' : 'Осталось ' + (left === 2 ? 'две' : 'три') + ' вещи.')); }
        X.recard(); return; }
      if (c && c.q && c.q.act) c.q.act(a, c);
    }
  };
  /* первая подсказка: когда ученик впервые подходит к столу или через 25 секунд после входа */
  if (!done()) { var said = false, t0 = null; X.TICK.push(function (t) { if (said) return; if (t0 == null) t0 = t; if (t - t0 > 25) { said = true; hint('Перед сборкой дрона подготовь рабочее место: принеси на стол 4 вещи. ' + where(), 7000, true); } }); }
  /* 18.11: что найти и куда идти (Alexandr не мог найти 2-й и 3-й предмет): список в углу и маяк над местом */
  var LS = P.spisok(X.root), BC = P.beacon(X.S, '#ffd36e');
  var SRC = { payalnik: [SX - .1, 1.75, SZ, 'красный шкаф у правой стены'], otvertki: [SX - .1, 1.75, SZ, 'красный шкаф у правой стены'], detali: [-W / 2 + 1.2, .5, -5.9, 'у стеллажа деталей, слева'], akb: [BX, 2.3, BZ + .3, 'шкаф аккумуляторов у дальней стены'] };
  X.TICK.push(function () { if (done()) { LS.hide(); BC.off(); return; }
    LS.set('ПОДГОТОВЬ СТОЛ СБОРКИ', ITEMS.map(function (it) { return { ok: !!st[it.id], t: it.name, w: H.o === it ? 'неси на стол в центре' : SRC[it.id][3] }; }));
    if (H.o) { BC.at(TB.g.position.x, 1.1, TB.g.position.z); return; }
    var nx = null; ITEMS.forEach(function (it) { if (!nx && !st[it.id]) nx = it; }); if (nx) { var q = SRC[nx.id]; BC.at(q[0], q[1], q[2]); } });
  return Q;
};
})();
