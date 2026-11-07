/* Игра "Собери дрон" v2. Сцена - scene.js, раскладка - stage.js.
   Сборка: детали лежат кучей на столе, их тянут сами. Пайка: приближение к каждому контакту. */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var LV = (window.SB_LV === 1 || /[?&]lv=1/.test(location.search)) ? 1 : 2; /* 1 - младшие (без пайки), 2 - старшие */
var cv = $('#c'), ui = $('#ui'), T = window.THREE;
var DPR = Math.min(window.devicePixelRatio || 1, 1.6);
var A = SB(cv, innerWidth * DPR, innerHeight * DPR), X = SBStage(A).api, P = A.P, D = A.D, V = A.V, S = A.S, MP = A.MP, cam = A.cam;
function W(p) { return V(p.x, p.y, p.z + 2); } /* координаты дрона -> мир (дрон стоит в 0,0,2) */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function clr(g) { while (g.children.length) g.remove(g.children[0]); }

/* ---------- камера ---------- */
var camL = V(0, 6, -6), view = null, tw = [];
function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function tween(d, fn, done) { var q = { t: 0, d: d, fn: fn, done: done }; tw.push(q); return q; }
function wait(d, fn) { return tween(d, function () {}, fn); }
function fit(c, dir, hw, hh, fov, pad) { /* pad: оставить сверху место под карточку проводника */
  var tv = Math.tan(fov * Math.PI / 360), th = tv * innerWidth / innerHeight, pf = pad ? Math.min(.32, 175 / innerHeight) : 0, d = Math.max(hw / th, hh / (1 - pf) / tv);
  var n = dir.clone().normalize(), p = c.clone().add(n.clone().multiplyScalar(d)), l = c.clone();
  if (pf) { var f = n.clone().negate(), r = V(0, 0, 0).crossVectors(f, V(0, 1, 0)).normalize(), up = V(0, 0, 0).crossVectors(r, f).normalize().multiplyScalar(d * tv * pf); p.add(up); l.add(up); }
  return { p: p, l: l, f: fov }; }
var camTw = null;
function go(vf, dur) { view = vf; var c = vf(), p0 = cam.position.clone(), l0 = camL.clone(), f0 = cam.fov; if (camTw) { var i = tw.indexOf(camTw); if (i >= 0) tw.splice(i, 1); camTw = null; }
  if (!dur) { cam.position.copy(c.p); camL.copy(c.l); cam.fov = c.f; cam.updateProjectionMatrix(); return; }
  camTw = tween(dur, function (e) { cam.position.lerpVectors(p0, c.p, e); camL.lerpVectors(l0, c.l, e); cam.fov = f0 + (c.f - f0) * e; cam.updateProjectionMatrix(); }, function () { camTw = null; }); }
function resize() { A.r.setSize(innerWidth * DPR, innerHeight * DPR, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); if (view && !camTw) go(view, 0); }
addEventListener('resize', resize); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
var VIEW = {
  wide: function () { return fit(V(0, 5, -4), V(.15, .45, 1), 24, 19, 48); },
  pileA: function () { return fit(V(0, 0, 3), V(0, 1, .42), 12.5, 14.5, 40, 1); },
  pileB: function () { return fit(V(0, 1.2, 3), V(.1, 1, .78), 12.5, 13.5, 40, 1); },
  station: function () { return fit(V(19, 4.5, -9), V(-.62, .42, .8), 9, 7, 40); },
  check: function () { return fit(V(0, 2, 2), V(.45, .75, 1), 8.5, 7, 40, 1); },
  props: function () { return fit(V(0, 1, 6), V(0, 1, .5), 12.5, 12.5, 40, 1); },
  done: function () { return fit(V(0, 7.5, 2), V(.3, .5, 1), 12, 10, 36); }
};

/* ---------- цикл ---------- */
var last = performance.now(), ticks = [];
function loop(now) { var dt = Math.min(.05, (now - last) / 1000); last = now;
  for (var i = tw.length - 1; i >= 0; i--) { var q = tw[i]; if (!q) continue; q.t += dt / q.d; var e = ease(Math.min(1, q.t)); q.fn(e, Math.min(1, q.t)); if (q.t >= 1) { var k = tw.indexOf(q); if (k >= 0) tw.splice(k, 1); if (q.done) q.done(); } }
  var t = now / 1000; A.G.position.y += Math.sin(t * 2) * .01; A.G.rotation.z = Math.sin(t * 1.3) * .05;
  for (i = 0; i < ticks.length; i++) ticks[i](dt, t);
  cam.lookAt(camL); A.render(); requestAnimationFrame(loop); }
function scr(w) { var p = w.clone().project(cam); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; }
function dist(a, x, y) { return Math.hypot(a.x - x, a.y - y); }

/* ---------- интерфейс ---------- */
var TOTAL = LV === 1 ? 5 : 8, step = 0, err = 0, stage = '';
function top(s, t) { return '<div class="top"><a class="ic" href="javascript:history.back()">←</a><div class="ttl"><small>' + s + '</small><b>' + t + '</b></div><div class="ic" id="err" title="ошибки">' + err + '</div></div>'; }
function bars() { var o = '<div class="bars">'; for (var i = 0; i < TOTAL; i++) o += '<i class="' + (i < step ? 'd' : i === step ? 'h' : '') + '"></i>'; return o + '</div>'; }
function head(s, t, extra) { ui.innerHTML = top(s, t) + bars() + '<div class="bub glass" id="say"><div id="sayT"></div><div class="qs" id="qs"></div></div><div class="tag" id="tag"></div>' + (extra || ''); }
function say(txt, bad) { var b = $('#say'), t = $('#sayT'); if (!t) return; t.innerHTML = (bad ? '<span class="chip bad">ПОЧЕМУ НЕТ</span> ' : '') + txt; b.classList.toggle('bad', !!bad); if (bad) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } }
function oops(txt) { err++; var e = $('#err'); if (e) e.textContent = err; say(txt, true); if (navigator.vibrate) navigator.vibrate(60); }
function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1700); }
/* компактный вопрос: маленькие кнопки прямо в карточке сверху */
function ask(opts, ok, onOk) { var box = $('#qs'); box.innerHTML = opts.map(function (o, i) { return '<button data-i="' + i + '">' + o[0] + '</button>'; }).join('');
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; if (b.disabled) return;
    if (i === ok) { b.classList.add('ok'); box.querySelectorAll('button').forEach(function (z) { z.disabled = true; }); setTimeout(function () { box.innerHTML = ''; onOk(); }, 650); }
    else { b.classList.add('no'); setTimeout(function () { b.classList.remove('no'); }, 600); oops(opts[i][1]); } }; }); }

/* ---------- ввод: один обработчик на этап ---------- */
var H = {};
cv.addEventListener('pointerdown', function (e) { if (H.down) { e.preventDefault(); H.down(e); } });
addEventListener('pointermove', function (e) { if (H.move) H.move(e); });
addEventListener('pointerup', function (e) { if (H.up) H.up(e); });
addEventListener('pointercancel', function (e) { if (H.up) H.up(e); });
var ray = new T.Raycaster(), ndc = new T.Vector2();
function setRay(e) { var r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam); }
function planeHit(e, y) { setRay(e); var h = V(0, 0, 0); return ray.ray.intersectPlane(new T.Plane(V(0, 1, 0), -y), h) ? h : null; }
function tag(txt, e) { var g = $('#tag'); if (!g) return; if (!txt) { g.style.display = 'none'; return; } g.textContent = txt; g.style.display = 'block'; g.style.left = e.clientX + 'px'; g.style.top = (e.clientY - 58) + 'px'; }

/* ---------- детали: настоящие и лишние ---------- */
function linNew(root) { var seen = []; root.traverse(function (o) { var m = o.material; if (!m || seen.indexOf(m) >= 0) return; seen.push(m); if (m.isMeshBasicMaterial && m.color && !m.map) m.color.convertSRGBToLinear(); }); }
var BIG = A.motor(); BIG.scale.setScalar(1.6); D.add(BIG);
var BIGP = A.prop('#ffb020'); BIGP.scale.setScalar(1.55); BIGP.children[0].material.color.convertSRGBToLinear(); D.add(BIGP);
var AIO = A.fc(); AIO.scale.set(.7, 1, .7); linNew(AIO); D.add(AIO);
var NAME = { mot: 'Мотор 1404', esc: 'Регулятор 4в1 (ESC) 20x20', fc: 'Полётный контроллер 20x20', vtx: 'Видеопередатчик (VTX)', cam: 'Камера', top: 'Верхняя пластина рамы', rx: 'Приёмник (RX)', ant: 'Антенна видео',
  prop: 'Пропеллер 3"', big: 'Мотор 2207', aio: 'Плата AIO 16x16', bigp: 'Пропеллер 5"' };
var PILE = { esc: [-8.5, .06, -10.5, .3], fc: [-3.6, .06, -12, -.2], aio: [1.2, .06, -11, .5], vtx: [5.2, .05, -12, .4], top: [9.4, .02, -10.5, .15],
  m0: [-9, .05, 9.2, 0], m1: [-6, .05, 10.8, 1], m2: [-3, .05, 9.2, 2], m3: [0, .05, 10.8, 3], big: [4, .05, 9.8, 0], cam: [8.6, .05, 9.4, -.8], rx: [9.2, .08, 14, 0], ant: [-9.4, .05, 13.2, .3],
  p0: [-7.6, .35, 9.5, 0], p1: [-2.6, .4, 15.5, .7], p2: [2.6, .35, 9.5, 1.4], p3: [7.6, .4, 15.5, 2.1], bigp: [-5.5, .8, -12, .4] };
var PK = [];
function reg(id, o, kind, x) { var pk = { id: id, o: o, kind: kind, name: NAME[kind === 'x' ? id : kind], state: 'hide', pile: PILE[id] }; for (var k in x) pk[k] = x[k]; o.userData.pk = pk; PK.push(pk); return pk; }
P.motors.forEach(function (m, i) { reg('m' + i, m, 'mot'); });
['esc', 'fc', 'vtx', 'cam', 'top', 'rx', 'ant'].forEach(function (k) { reg(k, P[k], k); });
P.props.forEach(function (p, i) { reg('p' + i, p, 'prop', { idx: i }); });
reg('big', BIG, 'x', { why: 'Это мотор <b>2207</b> для дрона 5 дюймов: он в 3 раза тяжелее, и его крепёж шире, чем на нашей раме. Для 3 дюймов нужен маленький <b>1404</b> - их на столе четыре.' });
reg('aio', AIO, 'x', { why: 'Это плата <b>AIO 16x16</b> для маленького Tinywhoop: всё в одной плате, но она слабая для моторов 1404, и отверстия не совпадут. На эту раму ставим стек <b>20x20</b>: регулятор и полётник отдельно.' });
reg('bigp', BIGP, 'x', { why: 'Пропеллер <b>5 дюймов</b> заденет раму и соседние винты. На раму 3 дюйма ставят пропеллеры 3 дюйма.' });
function byId(id) { for (var i = 0; i < PK.length; i++) if (PK[i].id === id) return PK[i]; }
function toPile(pk) { var s = pk.pile; pk.state = 'pile'; pk.o.visible = true; pk.o.position.set(s[0], s[1], s[2]); pk.o.rotation.set(0, s[3], 0); }
function fly(o, p1, r1, dur, done) { var p0 = o.position.clone(), r0 = o.rotation.clone();
  tween(dur, function (e) { o.position.lerpVectors(p0, p1, e); o.position.y += Math.sin(e * Math.PI) * 1.6; o.rotation.set(r0.x + (r1.x - r0.x) * e, r0.y + (r1.y - r0.y) * e, r0.z + (r1.z - r0.z) * e); }, done); }
function backToPile(pk) { var s = pk.pile; pk.state = 'fly'; fly(pk.o, V(s[0], s[1], s[2]), new T.Euler(0, s[3], 0), .5, function () { pk.state = 'pile'; }); }

/* начальная раскладка: рама со стойками, всё остальное кучей на столе */
P.frame.visible = true; P.so.visible = true; P.batt.visible = false; P.wires.forEach(function (w) { w.visible = false; });
PK.forEach(function (pk) { pk.o.visible = false; pk.state = 'hide'; });
['m0', 'm1', 'm2', 'm3', 'big', 'esc', 'fc', 'vtx', 'top', 'cam', 'rx', 'ant'].concat(LV > 1 ? ['aio'] : []).forEach(function (id) { toPile(byId(id)); });

/* ---------- места установки и правила порядка ---------- */
var inst = {}, motorAt = [null, null, null, null], propAt = [null, null, null, null], phase = '';
var MK = new T.Group(); S.add(MK); /* светящиеся места */
var FX = new T.Group(); S.add(FX); /* искры, подсказки */
function nMot() { return motorAt.filter(Boolean).length; }
function nProp() { return propAt.filter(Boolean).length; }
function openSlots() { var L = [], j;
  if (phase === 'A') { if (nMot() < 4) { for (j = 0; j < 4; j++) if (!motorAt[j]) L.push({ k: 'mot', j: j, c: V(MP[j][0], .55, MP[j][1]) }); } else if (!inst.esc) L.push({ k: 'esc', c: V(0, 1.06, 0), w: 3.4, d: 3.4 }); }
  if (phase === 'B') { if (!inst.fc) L.push({ k: 'fc', c: V(0, 1.96, 0), w: 3.4, d: 3.4 }); else { if (!inst.vtx) L.push({ k: 'vtx', c: V(0, 2.62, 1.4), w: 2, d: 2 }); if (!inst.cam) L.push({ k: 'cam', c: V(0, 1.6, -3), w: 1.7, d: 1.7 });
      if (inst.vtx && !inst.top) L.push({ k: 'top', c: V(0, 3.1, 0), w: 3.6, d: 6.6 }); if (inst.top) { if (!inst.rx) L.push({ k: 'rx', c: V(0, 3.32, 1.9), w: 1.1, d: 1.3 }); if (!inst.ant) L.push({ k: 'ant', c: V(0, 3.5, 3), w: 1.5, d: 1.3 }); } } }
  if (phase === 'P') for (j = 0; j < 4; j++) if (!propAt[j]) L.push({ k: 'prop', j: j, c: V(MP[j][0], 2.4, MP[j][1]) });
  return L; }
function whyNot(pk) { if (pk.kind === 'x') return pk.why; var L = openSlots(); for (var i = 0; i < L.length; i++) if (L[i].k === pk.kind) return null; var k = pk.kind;
  if (phase === 'A') { var rest = 'Сначала основа: моторы и регулятор, их потом паяют. Камеру и остальную электронику ставим после.';
    if (nMot() < 4) return k === 'esc' ? 'Сначала поставь все 4 мотора. Регулятор закроет центр рамы, а провода моторов потом паяют к нему.' : k === 'fc' ? 'Рано: сначала моторы, потом регулятор. Полётный контроллер ставят сверху стека.' : rest;
    return k === 'fc' ? 'Внизу стека стоит <b>регулятор (ESC)</b>: к нему паяют толстые провода моторов и питания. Полётный контроллер ставят над ним.' : rest; }
  if (phase === 'B') { if (!inst.fc) return 'Сначала <b>полётный контроллер</b>: он встаёт на стойки над регулятором, к нему подключают всё остальное.';
    if (k === 'top') return 'Верхняя пластина закроет стек. Сначала поставь под неё <b>видеопередатчик</b>.';
    if (k === 'rx') return 'Приёмник крепится сверху на верхнюю пластину. Сначала поставь пластину.';
    if (k === 'ant') return 'Антенна крепится к верхней пластине сзади. Сначала пластина.'; }
  return 'Эта деталь пока не нужна.'; }
function marks() { clr(MK);
  openSlots().forEach(function (s) { var g = new T.Group(); g.position.copy(W(s.c)); MK.add(g);
    if (s.k === 'mot' || s.k === 'prop') { var col = s.k === 'prop' ? (s.j % 2 ? 0xff4fd8 : 0x3ee6ff) : 0xc77dff; var r = new T.Mesh(new T.TorusGeometry(s.k === 'prop' ? .7 : 1.3, .07, 8, 48), A.neon(col)); r.rotation.x = Math.PI / 2; g.add(r); g.add(A.glow('#' + new T.Color(col).getHexString(), 5, .5)); }
    else { g.add(new T.Mesh(new T.BoxGeometry(s.w, .14, s.d), new T.MeshBasicMaterial({ color: 0xc77dff, transparent: true, opacity: .22, depthWrite: false })));
      g.add(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(s.w, .14, s.d)), new T.LineBasicMaterial({ color: 0xe3c8ff }))); g.add(A.glow('#c77dff', Math.max(s.w, s.d) * 1.8, .35)); } }); }
ticks.push(function (dt, t) { var a = .55 + Math.sin(t * 5) * .35; MK.children.forEach(function (g) { g.children.forEach(function (o) { if (o.isSprite) o.material.opacity = a * .6; }); g.scale.setScalar(1 + Math.sin(t * 5) * .04); }); });
function sparkle(w, n) { for (var i = 0; i < (n || 10); i++) { (function (i) { var s = A.glow(['#ffd166', '#c77dff', '#5effc4', '#7cf3ff'][i % 4], .5 + Math.random() * .5, 1), a = Math.random() * 6.28, sp = 1.5 + Math.random() * 2;
    s.position.copy(w); FX.add(s); var v = V(Math.cos(a) * sp, 2 + Math.random() * 2, Math.sin(a) * sp); tween(.7, function (e, l) { s.position.set(w.x + v.x * l, w.y + v.y * l - 3 * l * l, w.z + v.z * l); s.material.opacity = 1 - l; }, function () { FX.remove(s); }); })(i); } }

/* подсказка после двух ошибок подряд: подсвечиваем нужную деталь */
var wrong = 0, hintSp = null;
function hintOff() { if (hintSp) { FX.remove(hintSp); hintSp = null; } }
function hintOn() { hintOff(); var c = PK.filter(function (pk) { return pk.state === 'pile' && !whyNot(pk); })[0]; if (!c) return; hintSp = A.glow('#ffd166', 4.5, .9); c.o.getWorldPosition(hintSp.position); hintSp.position.y += 1; FX.add(hintSp); }
ticks.push(function (dt, t) { if (hintSp) hintSp.material.opacity = .5 + Math.sin(t * 6) * .4; });

/* ---------- перетаскивание деталей из кучи ---------- */
var drag = null, onAllIn = null, next = function () {};
function pick(e) { setRay(e); var roots = PK.filter(function (p) { return p.state === 'pile' && p.o.visible; }).map(function (p) { return p.o; });
  var hits = ray.intersectObjects(roots, true);
  for (var i = 0; i < hits.length; i++) { var o = hits[i].object; if (o.isSprite) continue; while (o && !o.userData.pk) o = o.parent; if (o) return o.userData.pk; }
  var best = null, bd = 40; roots.forEach(function (o) { var d = dist(scr(o.getWorldPosition(V(0, 0, 0))), e.clientX, e.clientY); if (d < bd) { bd = d; best = o.userData.pk; } }); return best; }
function droneHit(x, y) { var c = scr(W(V(0, 1, 0))), r = Math.max(80, dist(scr(W(V(8.5, 1, 0))), c.x, c.y)); if (dist(c, x, y) < r) return true;
  return openSlots().some(function (s) { return dist(scr(W(s.c)), x, y) < 70; }); }
function pileMode() {
  H.down = function (e) { var pk = pick(e); if (!pk) return; hintOff(); drag = { pk: pk }; pk.state = 'drag'; H.move(e); };
  H.move = function (e) { if (!drag) { if (e.pointerType === 'mouse') { var pk = pick(e); cv.style.cursor = pk ? 'grab' : 'default'; tag(pk ? pk.name : null, e); } return; }
    cv.style.cursor = 'grabbing'; var h = planeHit(e, 3.2); if (h) drag.pk.o.position.set(h.x, 2.6, h.z - 2); drag.pk.o.rotation.x = 0; tag(drag.pk.name, e); };
  H.up = function (e) { if (!drag) return; var pk = drag.pk; drag = null; tag(null); cv.style.cursor = 'default'; drop(pk, e); }; }
function drop(pk, e) {
  if (!droneHit(e.clientX, e.clientY)) { /* положили обратно на стол */ var s = pk.pile, h = planeHit(e, .1); pk.state = 'pile';
    if (h) pk.o.position.set(clamp(h.x, -25, 25), s[1], clamp(h.z - 2, -19, 19)); else backToPile(pk); return; }
  var w = whyNot(pk); if (w) { oops(w); backToPile(pk); if (++wrong >= 2) hintOn(); return; }
  var L = openSlots().filter(function (s) { return s.k === pk.kind; }), best = L[0], bd = 1e9;
  if (L.length > 1) { L.forEach(function (s) { var d = dist(scr(W(s.c)), e.clientX, e.clientY); if (d < bd) { bd = d; best = s; } });
    if (bd > 80) { say('Чуть мимо. Отпусти деталь прямо над <b>светящимся кругом</b>.'); backToPile(pk); return; } }
  if (pk.kind === 'prop' && pk.idx % 2 !== best.j % 2) { var c = best.j % 2 ? 'розовые' : 'голубые'; oops('Этот винт крутится в другую сторону. Смотри на стрелку над мотором: <b>' + c + '</b> винты - на ' + c + ' стрелки. Иначе винт будет толкать дрон вниз!'); backToPile(pk); if (++wrong >= 2) hintOn(); return; }
  wrong = 0; install(pk, best); }
var DONE_MSG = { esc: 'Верно! <b>Регулятор</b> управляет моторами: к нему паяют провода моторов и питание.', fc: 'Да! <b>Полётный контроллер</b> - "мозг" дрона, у него гироскоп. Стрелка на плате смотрит к носу.',
  vtx: 'Видеопередатчик стоит. Он отправляет картинку с камеры в очки.', cam: 'Камера на носу: пилот видит то, что видит камера.', top: 'Верхняя пластина закрыла стек.', rx: 'Приёмник ловит команды с пульта.', ant: 'Антенна сзади, чтобы её не задело винтами.' };
function install(pk, s) { var home; pk.state = 'inst';
  if (pk.kind === 'mot') { motorAt[s.j] = pk.o; home = X.home['m' + s.j]; } else if (pk.kind === 'prop') { propAt[s.j] = pk.o; home = X.home['p' + s.j]; } else { inst[pk.kind] = true; home = X.home[pk.kind]; }
  var fin = onAllIn && onAllIn(); if (fin) H = {};
  marks(); fly(pk.o, home.p.clone(), home.r, .55, function () { sparkle(W(home.p), 12); toast('✓ ' + pk.name);
    var msg = DONE_MSG[pk.kind]; if (pk.kind === 'mot') msg = nMot() < 4 ? 'Есть! Осталось моторов: <b>' + (4 - nMot()) + '</b>.' : 'Все 4 мотора на месте! <b>Что ставим в центр рамы</b>, в самый низ стека?';
    if (pk.kind === 'prop') msg = nProp() < 4 ? 'Верно! Осталось винтов: <b>' + (4 - nProp()) + '</b>.' : 'Все винты на месте!';
    if (msg) say(msg); if (fin) setTimeout(next, 1000); }); }

/* ---------- пайка ---------- */
var SF = new T.Group(); D.add(SF); /* провода, капли припоя, флюс - остаются на дроне */
var IF = new T.Group(); S.add(IF); /* паяльник, пруток припоя, дым */
function padM(j, k) { var q = MP[j]; return V(Math.sign(q[0]) * 1.38, 1.215, Math.sign(q[1]) * (1.3 - k * .38)); }
var PADV = [V(-.5, 1.225, 1.42), V(.5, 1.225, 1.42)]; /* + и - питания */
function lin(hex) { return new T.Color(hex).convertSRGBToLinear(); }
function drawWire(w) { if (w.mesh) { SF.remove(w.mesh); w.mesh.geometry.dispose(); } var m1 = V(0, 0, 0).lerpVectors(w.b, w.tip, .55); m1.y += .25;
  w.mesh = A.tube([w.a, w.b, m1, w.tip], w.r, w.m, SF); A.mesh(new T.SphereGeometry(w.r * 1.15, 10, 8), A.M.steel, w.tip.x, w.tip.y, w.tip.z, w.mesh); }
function mWire(j, k) { var q = MP[j], sx = Math.sign(q[0]), sz = Math.sign(q[1]); return { a: V(q[0] - sx * .55, .55, q[1] - sz * .55 + (1 - k) * .12 * sz), b: V(sx * 3.0, .85, sz * (2.6 - k * .25)), rest: V(sx * 2.25, 1.55, sz * (1.75 - k * .5)), r: .055, m: A.M.wireK, k: k }; }
function pWire(i) { var s = i ? 1 : -1; return { a: V(i ? .25 : -.2, .5, 6.6), b: V(s * .55, .5, 4.2), rest: V(s * 1.15, 1.0, 2.7), r: .12, m: i ? A.M.wireK : A.M.wireR, pol: i }; }
function txtSprite(t, col, s) { var tx = A.cTex(128, 128, function (x) { x.font = '900 96px sans-serif'; x.textAlign = 'center'; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 12; x.fillText(t, 64, 98); });
  var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); sp.scale.set(s, s, 1); return sp; }
function makeIron() { var g = new T.Group(), M = A.M, grip = new T.MeshStandardMaterial({ color: lin(0x8b3dff), roughness: .5, metalness: .2 }); grip.envMapIntensity = .18;
  var tip = A.mesh(new T.ConeGeometry(.15, 1.1, 16), M.steel, 0, .55, 0, g); tip.rotation.x = Math.PI;
  A.mesh(new T.CylinderGeometry(.23, .23, 4, 16), M.steel, 0, 3.1, 0, g); A.mesh(new T.CylinderGeometry(.58, .5, 2.4, 20), M.dark, 0, 6.3, 0, g);
  A.mesh(new T.CylinderGeometry(.72, .72, 7, 20), grip, 0, 11, 0, g); for (var i = 0; i < 6; i++) A.mesh(new T.TorusGeometry(.74, .06, 6, 20), M.dark, 0, 8.4 + i * 1, 0, g).rotation.x = Math.PI / 2;
  A.tube([V(0, 14.4, 0), V(0, 17, 0), V(1.5, 19, 2), V(5, 20, 6)], .28, M.wireK, g);
  var h1 = A.glow('#ff7a2a', 1.3, 0), h2 = A.glow('#ffd166', .55, 0); g.add(h1, h2); g.userData.hot = [h1, h2]; return g; }
var IRON = null, SOLD = null, SMOKE = [], GR = [], gi = -1, cur = null, heat = { on: false, h: 0 };
function solderStage() { step = 2; stage = 'temp'; H = {}; A.G.visible = false; go(VIEW.station, 1.4);
  head('ПАЯЛЬНАЯ СТАНЦИЯ', 'Подготовка к пайке', '<div class="hint" id="hint">Выбери ответ в карточке сверху</div>');
  say('Пора паять провода моторов к регулятору. <b>Какую температуру ставим на паяльнике?</b>');
  ask([['250°', '250° - мало: припой плавится долго, плата успеет перегреться, а пайка выйдет холодной.'], ['330°'], ['450°', '450° - слишком горячо: флюс сгорает сразу, площадки на плате могут отслоиться. Для таких плат хватает 330-350°.']], 1, function () {
    say('Верно, <b>330°</b>. Станция уже нагрета. Летим к регулятору!'); setTimeout(startGroups, 1100); }); }
function startGroups() { step = 3; IRON = makeIron(); IF.add(IRON); IRON.visible = false;
  for (var j = 0; j < 4; j++) GR.push({ j: j, manual: j < 2, rate: 2.6, pads: [0, 1, 2].map(function (k) { return { p: padM(j, k), done: 0, r: .17, k: k }; }), wires: [0, 1, 2].map(function (k) { return mWire(j, k); }) });
  GR.push({ power: true, manual: true, rate: 4.2, pads: [{ p: PADV[0], done: 0, r: .27, pol: 0 }, { p: PADV[1], done: 0, r: .27, pol: 1 }], wires: [pWire(0), pWire(1)] });
  var lp = txtSprite('+', '#ff5a64', .6); lp.position.copy(PADV[0]).add(V(0, .3, -.5)); SF.add(lp); var lm = txtSprite('−', '#e9f0ff', .6); lm.position.copy(PADV[1]).add(V(0, .25, -.5)); SF.add(lm); lp.visible = lm.visible = false; GR[4].labels = [lp, lm];
  for (var i = 0; i < 14; i++) { var s = A.glow('#d8d2ff', .4, 0); s.userData.life = 0; IF.add(s); SMOKE.push(s); }
  ticks.push(solderTick); nextGroup(); }
function gView(g) { return function () { if (g.power) return fit(W(V(0, 1.22, 2.0)), V(0, 1, .85), 1.8, 2.4, 40, 1); var q = MP[g.j], sx = Math.sign(q[0]), sz = Math.sign(q[1]); return fit(W(V(sx * 1.7, 1.22, sz * 1.05)), V(-sx * .72, 1, sz * .16), 1.6, 2.3, 40, 1); }; }
function camDir() { var c = view(), f = c.l.clone().sub(c.p).normalize(), r = V(0, 0, 0).crossVectors(f, V(0, 1, 0)).normalize(); return { f: f, r: r }; }
function nextGroup() { gi++; if (gi >= GR.length) return solderDone(); cur = GR[gi]; var g = cur, power = !!g.power;
  step = power ? 4 : 3;
  head(power ? 'КРУПНО · ПИТАНИЕ' : 'КРУПНО · МОТОР ' + (g.j + 1) + ' ИЗ 4', power ? 'Провода аккумулятора' : 'Пайка проводов мотора',
    '<div class="hr" id="hr"><i></i></div><div class="tools"><button class="tb" id="flux"><b>💧</b>Флюс</button><button class="tb hold" id="hold"><b>🔥</b>Держать жало</button></div>');
  go(gView(g), 1.3); if (g.labels) g.labels.forEach(function (l) { l.visible = true; });
  g.wires.forEach(function (w) { w.tip = w.rest.clone(); drawWire(w); });
  g.st = 'flux'; heat.on = false; $('#flux').classList.add('go');
  var d = camDir(); g.dir = d.r.clone().add(V(0, .55, 0)).add(d.f.clone().multiplyScalar(.55)).normalize(); g.left = d.r.clone().negate();
  IRON.visible = true; IRON.quaternion.setFromUnitVectors(V(0, 1, 0), g.dir); var park = W(g.pads[0].p).add(g.dir.clone().multiplyScalar(1.5)).add(V(0, .5, 0));
  if (gi === 0) IRON.position.copy(park); else { var p0 = IRON.position.clone(); tween(1.2, function (e) { IRON.position.lerpVectors(p0, park, e); }); }
  makeSolderWire(g);
  if (power) say('Теперь питание. Толстые провода от аккумулятора: <b>красный - плюс</b>, чёрный - минус. Сначала <b>флюс</b> на площадки.');
  else if (g.j === 0) say('Это угол регулятора: <b>3 площадки</b> для 3 проводов мотора. Сначала нанеси <b>флюс</b>: он очищает металл, и припой растекается ровно.');
  else if (g.manual) say('Мотор 2. Повтори сам: <b>флюс</b>, провод на площадку, прогрев.');
  else say('Мотор ' + (g.j + 1) + '. Провода положу я, а ты <b>пропаяй каждый контакт</b>. Начни с флюса.');
  $('#flux').onclick = fluxTap; var hb = $('#hold'); hb.addEventListener('pointerdown', function (e) { e.preventDefault(); heatDown(); }); hb.addEventListener('pointerup', heatUp); hb.addEventListener('pointerleave', heatUp);
  H.down = function (e) { if (cur.st === 'wire') wireDown(e); else if (cur.st === 'heat') heatDown(); else if (cur.st === 'flux') oops('Сначала <b>флюс</b>: без него припой скатывается шариком и не держится на площадке.'); };
  H.move = function (e) { if (cur.dragW) wireMove(e); };
  H.up = function (e) { if (cur.dragW) wireUp(e); else heatUp(); }; }
function makePen() { var g = new T.Group(), body = new T.MeshPhysicalMaterial({ color: lin(0xffc23a), transparent: true, opacity: .75, roughness: .1, clearcoat: 1 });
  A.mesh(new T.CylinderGeometry(.025, .025, .6, 10), A.M.steel, 0, .3, 0, g); A.mesh(new T.CylinderGeometry(.09, .16, .4, 16), A.M.white, 0, .8, 0, g);
  A.mesh(new T.CylinderGeometry(.32, .32, 3.2, 20), body, 0, 2.6, 0, g); A.mesh(new T.CylinderGeometry(.34, .34, .3, 20), A.M.white, 0, 4.3, 0, g);
  var lb = A.mesh(new T.CylinderGeometry(.33, .33, 1.2, 20, 1, true), new T.MeshStandardMaterial({ color: lin(0xff4f6a), roughness: .5 }), 0, 2.6, 0, g); return g; }
function fluxTap() { var g = cur; if (g.st !== 'flux') { if (g.st !== 'busy') say('Флюс уже есть. ' + (g.st === 'wire' ? 'Теперь положи провод на площадку.' : 'Прижми жало и держи.')); return; } g.st = 'busy'; $('#flux').classList.remove('go');
  say('Шприц с флюсом: капаем <b>по капле на каждую площадку</b>. Флюс снимает окисел, и припой растечётся ровно.');
  var d = camDir(), pd = g.left.clone().multiplyScalar(.45).add(V(0, 1, 0)).add(d.f.clone().multiplyScalar(-.15)).normalize(), pen = makePen(); pen.quaternion.setFromUnitVectors(V(0, 1, 0), pd); IF.add(pen);
  var start = W(g.pads[0].p).add(pd.clone().multiplyScalar(4)), T0 = 0; pen.position.copy(start);
  function mv(to, dur, at) { wait(at, function () { var f = pen.position.clone(); tween(dur, function (e) { pen.position.lerpVectors(f, to, e); }); }); }
  g.pads.forEach(function (p, i) { var above = W(p.p).add(pd.clone().multiplyScalar(.9)), touch = W(p.p).add(pd.clone().multiplyScalar(.12));
    mv(above, .45, T0); mv(touch, .25, T0 + .5); mv(above, .3, T0 + 1.35);
    var m = new T.Mesh(new T.SphereGeometry(p.r * 1.05, 20, 12), new T.MeshPhysicalMaterial({ color: lin(0xffb52e), transparent: true, opacity: .8, roughness: .02, metalness: 0, clearcoat: 1, emissive: lin(0x5a3000) }));
    m.position.copy(p.p).add(V(0, .01, 0)); m.scale.set(.01, .01, .01); m.visible = false; SF.add(m); p.flux = m;
    wait(T0 + .75, function () { m.visible = true; tween(.55, function (e) { m.scale.set(e, .38 * e, e); }); });
    T0 += 1.7; });
  mv(start, .5, T0); wait(T0 + .55, function () { IF.remove(pen); toast('✓ Флюс на площадках');
    if (g.manual) { g.st = 'wire'; say(g.power ? 'Флюс есть. Тяни <b>красный провод</b> на площадку плюса, чёрный - на минус.' : 'Флюс есть. Теперь <b>тяни серебристый кончик провода</b> на площадку. Каждый провод - на площадку <b>напротив него</b>, по порядку, без перекрещивания.'); }
    else autoLay(); }); }
function autoLay() { var g = cur; g.wires.forEach(function (w, k) { var p = g.pads[k], t0 = w.tip.clone(), t1 = p.p.clone().add(V(0, .03, 0)); wait(k * .3, function () { tween(.4, function (e) { w.tip.lerpVectors(t0, t1, e); drawWire(w); }); }); w.pad = p; p.wire = w; });
  wait(1.4, function () { activate(g.pads[0]); say('Провода на месте. <b>Держи жало</b> на площадке и отпусти, когда стрелка в <b>зелёной</b> зоне.'); }); }
function activate(p) { var g = cur; g.act = p; g.st = 'heat'; $('#hr').style.display = 'block'; }
/* перетаскивание кончика провода */
function wireDown(e) { var g = cur, best = null, bd = 60; g.wires.forEach(function (w) { if (w.pad) return; var d = dist(scr(W(w.tip)), e.clientX, e.clientY); if (d < bd) { bd = d; best = w; } });
  if (!best) { say('Тяни <b>серебристый кончик провода</b> - он сбоку от площадок.'); return; } g.dragW = best; }
function wireMove(e) { var w = cur.dragW, h = planeHit(e, 1.55); if (!h) return; w.tip.set(h.x, 1.55, h.z - 2); drawWire(w); }
function wireUp(e) { var g = cur, w = g.dragW; g.dragW = null; var best = null, bd = 55;
  g.pads.forEach(function (p) { if (p.wire) return; var d = dist(scr(W(p.p)), e.clientX, e.clientY); if (d < bd) { bd = d; best = p; } });
  function back() { var t0 = w.tip.clone(); tween(.35, function (e2) { w.tip.lerpVectors(t0, w.rest, e2); drawWire(w); }); }
  if (!best) { back(); say('Отпусти кончик провода <b>прямо на золотую площадку</b>.'); return; }
  if (g.power && best.pol !== w.pol) { back(); oops(w.pol === 0 ? '<b>Красный провод - плюс</b> аккумулятора. Его паяют на площадку со знаком <b>+</b>. Перепутаешь - регулятор сгорит при первом включении!' : 'Чёрный провод - <b>минус</b>, ему нужна площадка со знаком <b>−</b>. Плюс и минус путать нельзя!'); return; }
  if (!g.power && best.k !== w.k) { back(); oops('Провода не перекрещивают: каждый провод идёт на площадку <b>напротив него</b>, по порядку. Перекрещенные провода натягиваются, трутся о раму и могут замкнуть.'); return; }
  w.tip.copy(best.p).add(V(0, .03, 0)); drawWire(w); w.pad = best; best.wire = w; activate(best);
  say(g.power ? 'Провод на площадке. Толстый провод забирает много тепла - <b>греть придётся дольше</b>. Держи жало до зелёной зоны.' : 'Провод лежит на площадке. Теперь <b>держи жало</b> (кнопка или палец на экране) и отпусти, когда стрелка в <b>зелёной</b> зоне.'); }
/* пруток припоя: подаётся сбоку к площадке */
function makeSolderWire(g) { if (SOLD) IF.remove(SOLD); var ax = g.left.clone().multiplyScalar(.8).add(V(0, .75, 0)).add(camDir().f.multiplyScalar(-.3)).normalize(); g.ax = ax;
  SOLD = A.tube([ax.clone().multiplyScalar(7).add(V(0, .8, 0)), ax.clone().multiplyScalar(3.5).add(V(0, .2, 0)), V(0, 0, 0)], .05, A.M.steel, IF); SOLD.visible = false; }
function placeSolder(p, feed) { SOLD.visible = feed > 0; SOLD.position.copy(W(p.p)).add(cur.left.clone().multiplyScalar(.15)).add(V(0, .06, 0)).add(cur.ax.clone().multiplyScalar((1 - feed) * 1.6)); }
function heatDown() { var g = cur; if (!g || heat.on) return;
  if (g.st === 'flux') { oops('Сначала <b>флюс</b>: без него припой скатывается шариком и не держится на площадке.'); return; }
  if (g.st === 'wire') { say('Сначала положи <b>провод</b> на площадку: тяни его серебристый кончик.'); return; }
  if (g.st !== 'heat') return; var p = g.act; heat.on = true; heat.h = 0; var t0 = IRON.position.clone();
  var to = W(p.p).add(V(0, .04, 0)); tween(.3, function (e) { if (heat.on) IRON.position.lerpVectors(t0, to, e); });
  if (!p.blob) { var bm = new T.MeshStandardMaterial({ color: lin(0xd8dde6), metalness: 1, roughness: .16, emissive: new T.Color(0xff5a00), emissiveIntensity: 0 }); bm.envMapIntensity = .55;
    p.blob = new T.Mesh(new T.SphereGeometry(p.r, 20, 12), bm); p.blob.position.copy(p.p).add(V(0, .02, 0)); p.blob.scale.set(.01, .01, .01); SF.add(p.blob); } }
function heatUp() { if (!heat.on) return; heat.on = false; var g = cur, p = g.act, h = heat.h; g.st = 'busy';
  if (h < .38) return cold(p); if (h > .82) return bridge(p); good(p); }
function ironLift(p, dur, done) { var from = IRON.position.clone(), park = W(p.p).add(cur.dir.clone().multiplyScalar(1.5)).add(V(0, .5, 0));
  /* жало уходит плавно: сначала чуть вверх, потом в сторону */
  tween(dur, function (e, l) { var up = Math.min(1, l * 3); IRON.position.lerpVectors(from, park, e); IRON.position.y += Math.sin(up * Math.PI / 2) * .5 * (1 - e); }, done); }
function good(p) { var g = cur; p.done = 1; var bm = p.blob.material; if (p.flux) { var fm = p.flux; tween(.6, function (e) { fm.material.opacity = .8 * (1 - e); fm.scale.y = .38 * (1 - e * .7); }, function () { SF.remove(fm); }); }
  p.blob.scale.set(1, .5, 1); placeSolder(p, 0); ironLift(p, 1.4);
  tween(1.6, function (e) { bm.emissiveIntensity = 1.4 * (1 - e); }, function () { toast(g.power ? '✓ ' + (p.pol ? 'Минус' : 'Плюс') + ' припаян' : '✓ Контакт припаян'); sparkle(W(p.p), 6); after(); });
  say(['Отлично: припой растёкся и лёг <b>блестящим конусом</b>. Не шевели провод, пока припой застывает.', 'Ровная блестящая пайка - так и надо!', 'Есть! Припой застывает - провод не трогаем.'][g.pads.filter(function (q) { return q.done; }).length % 3]);
  function after() { var left = g.pads.filter(function (q) { return !q.done; });
    if (!left.length) { $('#hr').style.display = 'none'; if (g.labels) g.labels.forEach(function (l) { l.visible = false; }); toast(g.power ? '✓ Питание подключено' : '✓ Мотор ' + (g.j + 1) + ' подключён'); setTimeout(nextGroup, 700); return; }
    if (g.manual && g.wires.some(function (w) { return !w.pad; })) { g.st = 'wire'; $('#hr').style.display = 'none'; say(g.power ? 'Теперь второй провод.' : 'Следующий провод: тяни его кончик на свободную площадку.'); }
    else { activate(left[0]); say('Следующий контакт. <b>Держи жало</b> до зелёной зоны.'); } } }
function cold(p) { var bm = p.blob.material; bm.color = lin(0x7c818b); bm.roughness = .85; bm.metalness = .4; bm.emissiveIntensity = 0; p.blob.scale.set(.6, .5, .6); placeSolder(p, 0); ironLift(p, .9);
  oops('<b>Холодная пайка</b>: припой не растёкся, получился серый матовый шарик. От вибрации провод отвалится в полёте. Держи жало дольше - до зелёной зоны.');
  wait(1.8, function () { SF.remove(p.blob); p.blob = null; cur.st = 'heat'; }); }
function bridge(p) { var g = cur, bm = p.blob.material; p.blob.scale.set(1.5, .8, 1.5); placeSolder(p, 0); ironLift(p, .9);
  var nb = g.pads.filter(function (q) { return q !== p; }).sort(function (a, b) { return a.p.distanceTo(p.p) - b.p.distanceTo(p.p); })[0], br = null;
  if (nb) { var len = nb.p.distanceTo(p.p); br = new T.Mesh(new T.CylinderGeometry(.09, .09, len, 10), bm); br.position.lerpVectors(p.p, nb.p, .5).add(V(0, .04, 0)); br.quaternion.setFromUnitVectors(V(0, 1, 0), nb.p.clone().sub(p.p).normalize()); SF.add(br); }
  oops('Перегрев и <b>лишний припой</b>: капля растеклась и перемкнула соседний контакт! Это замыкание - регулятор сгорит. Лишнее убирают оплёткой. Отпускай раньше, в зелёной зоне.');
  tween(2.2, function (e) { bm.emissiveIntensity = 1.4 * (1 - e); }, function () { SF.remove(p.blob); p.blob = null; if (br) SF.remove(br); cur.st = 'heat'; }); }
function solderTick(dt, t) { var g = cur; if (!g || !IRON) return; var hot = IRON.userData.hot, hr = $('#hr');
  if (heat.on) { heat.h += dt / g.rate; var p = g.act, h = heat.h, s = clamp((h - .36) / .32, 0, 1.25);
    if (p.blob) { p.blob.scale.set(Math.max(.01, s), Math.max(.01, s * .5), Math.max(.01, s)); p.blob.material.emissiveIntensity = 1.4 * Math.min(1, h * 2); }
    placeSolder(p, h > .3 ? clamp((h - .3) / .45, 0, 1) : 0);
    if (h > .25 && Math.random() < dt * 14) { for (var i = 0; i < SMOKE.length; i++) if (SMOKE[i].userData.life <= 0) { var sm = SMOKE[i]; sm.userData.life = 1; sm.position.copy(W(p.p)).add(V((Math.random() - .5) * .3, .2, (Math.random() - .5) * .3)); break; } }
    if (h >= 1) heatUp(); }
  var on = heat.on ? 1 : (g.st === 'busy' ? .4 : 0); hot[0].material.opacity += (on * .95 - hot[0].material.opacity) * .2; hot[1].material.opacity = hot[0].material.opacity;
  SMOKE.forEach(function (sm) { var u = sm.userData; if (u.life <= 0) { sm.material.opacity = 0; return; } u.life -= dt * .7; sm.position.y += dt * 1.3; sm.position.x += Math.sin(t * 3 + sm.id) * dt * .3; sm.scale.setScalar(.3 + (1 - u.life) * 1.6); sm.material.opacity = .32 * u.life; });
  if (hr && g.act && hr.style.display === 'block') { var sp = scr(W(g.act.p)); hr.style.left = sp.x + 'px'; hr.style.top = sp.y + 'px'; hr.style.setProperty('--h', heat.on ? Math.min(1, heat.h) : 0); hr.classList.toggle('on', heat.on); } }
function solderDone() { cur = null; ticks.splice(ticks.indexOf(solderTick), 1); H = {}; clr(IF); IRON = null;
  P.batt.visible = true; P.batt.children[0].visible = P.batt.children[1].visible = false; stackStage(); }

/* ---------- этапы ---------- */
function intro() { stage = 'intro'; A.G.position.set(9, 13, -2); go(VIEW.wide, 0);
  ui.innerHTML = top('МАСТЕРСКАЯ · ' + (LV === 1 ? 'МЛАДШИЕ' : 'ГОНОЧНЫЙ 3"'), 'Собери дрон') + '<div class="bub glass" id="say"><div id="sayT"></div></div><button class="btn" id="go">Начать сборку</button>';
  say('Привет, пилот! Собираем <b>гоночный дрон 3 дюйма</b>. Все детали лежат на столе' + (LV > 1 ? ', но там есть и <b>лишние</b> - от других дронов' : '') + '. Выбирай нужную и тяни её на раму сам.'); $('#go').onclick = assembleA; }
function assembleA() { step = 0; stage = 'A'; phase = 'A'; A.G.visible = false; go(VIEW.pileA, 1.4);
  head('СБОРКА · ВИД СВЕРХУ', 'Рама и моторы', '<div class="hint" id="hint">Тяни деталь со стола на раму</div>');
  say('На раме уже стоят стойки. <b>Найди моторы</b> и поставь их на концы лучей - на светящиеся круги.'); marks(); pileMode();
  onAllIn = function () { if (nMot() === 4 && step === 0) { step = 1; var b = document.querySelectorAll('.bars i'); if (b[0]) { b[0].className = 'd'; b[1].className = 'h'; } var tt = document.querySelector('.ttl b'); if (tt) tt.textContent = 'Регулятор'; }
    return nMot() === 4 && inst.esc; };
  next = function () { onAllIn = null; clr(MK); if (LV > 1) solderStage(); else autoWires(); }; }
function autoWires() { P.wires.forEach(function (w) { w.visible = true; }); P.batt.visible = true; sparkle(W(V(0, 1.3, 0)), 24);
  say('Провода моторов и питания паяет мастер: у старших это отдельный этап с паяльником. Готово!'); setTimeout(stackStage, 2200); }
function stackStage() { step = LV > 1 ? 5 : 2; stage = 'B'; phase = 'B'; go(VIEW.pileB, 1.4);
  head('СБОРКА · СТЕК', 'Электроника и камера', '<div class="hint" id="hint">Тяни деталь со стола на дрон</div>');
  say(LV > 1 ? 'Регулятор подключён. Дальше электроника. <b>Что идёт на стойки над регулятором?</b>' : 'Моторы подключены. <b>Что ставим на стойки над регулятором?</b>'); marks(); pileMode();
  onAllIn = function () { return inst.fc && inst.vtx && inst.cam && inst.top && inst.rx && inst.ant; };
  next = function () { onAllIn = null; clr(MK); checkStage(); }; }
var ARW = new T.Group(); S.add(ARW);
function arrows() { clr(ARW);
  MP.forEach(function (q, j) { var g = new T.Group(), col = j % 2 ? 0xff4fd8 : 0x3ee6ff, sg = j % 2 ? 1 : -1, r = 1.9, arc = 4.4, pts = []; /* 0,2 - против часовой, 1,3 - по часовой */
    for (var i = 0; i <= 24; i++) { var a = i / 24 * arc; pts.push(V(r * Math.cos(a), 0, sg * r * Math.sin(a))); }
    A.tube(pts, .08, A.neon(col), g); var tg = V(-Math.sin(arc), 0, sg * Math.cos(arc)).normalize();
    var cn = new T.Mesh(new T.ConeGeometry(.28, .7, 12), A.neon(col)); cn.position.copy(pts[24]).add(tg.clone().multiplyScalar(.3)); cn.quaternion.setFromUnitVectors(V(0, 1, 0), tg); g.add(cn);
    g.position.copy(W(V(q[0], 2.9, q[1]))); ARW.add(g); }); }
var spinOn = false;
ticks.push(function (dt) { if (!spinOn) return; motorAt.forEach(function (m, j) { var b = m && m.userData.bell; if (b) b.rotation.y += dt * 30 * (j % 2 ? -1 : 1); }); });
function checkStage() { step = LV > 1 ? 6 : 3; stage = 'check'; H = {}; go(VIEW.check, 1.2);
  head('ПРОВЕРКА НА СТОЛЕ', 'Первое включение', '<div class="hint" id="hint">Нажимай шаги по порядку</div>');
  say('Дрон собран, винтов ещё нет. <b>Что делаем по порядку?</b>');
  var items = ['Убедиться, что пропеллеров нет', 'Подключить аккумулятор через смоук-стоппер', 'Проверить, куда крутятся моторы'];
  var WHY = ['Сначала убедись, что <b>пропеллеров нет</b>: при первом включении моторы могут резко крутануться.', 'Аккумулятор - только через <b>смоук-стоппер</b>: если где-то замыкание, он не даст сгореть плате.', 'Сначала проверь, куда крутятся моторы. Если не туда - меняем в настройках.'];
  var order = [0, 1, 2].sort(function () { return Math.random() - .5; }), k = 0, box = $('#qs');
  box.innerHTML = order.map(function (i) { return '<button class="w" data-i="' + i + '"><b class="num"></b>' + items[i] + '</button>'; }).join('');
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; if (b.disabled) return;
    if (i !== k) { oops(WHY[k]); return; } b.disabled = true; b.classList.add('ok'); b.querySelector('.num').textContent = k + 1; k++;
    if (i === 0) say('Винтов нет - можно включать. Дальше?');
    if (i === 1) { spinOn = true; say('Смоук-стоппер не загорелся - замыкания нет. Моторы пищат и готовы. Дальше?'); }
    if (i === 2) { arrows(); say('Стрелки показывают, куда крутится каждый мотор: <b>голубые и розовые</b> - в разные стороны.'); setTimeout(propsStage, 2400); } }; }); }
function propsStage() { step = LV > 1 ? 7 : 4; stage = 'P'; phase = 'P'; spinOn = false; go(VIEW.props, 1.3);
  head('ПОСЛЕДНИЙ ШАГ', 'Пропеллеры', '<div class="hint" id="hint">Тяни винт на мотор со стрелкой того же цвета</div>');
  byId('big').pile = [6, .05, -12, 0]; BIG.position.set(6, .05, -12); ['p0', 'p1', 'p2', 'p3', 'bigp'].forEach(function (id) { var pk = byId(id); toPile(pk); var y = pk.o.position.y; pk.o.position.y = y + 8; pk.state = 'fly'; tween(.6, function (e) { pk.o.position.y = y + 8 * (1 - e); }, function () { pk.state = 'pile'; }); });
  say('Моторы проверены, аккумулятор отключён. Ставим <b>пропеллеры</b>: каждый винт на мотор со стрелкой <b>своего цвета</b>.'); marks(); pileMode();
  onAllIn = function () { return nProp() === 4; }; next = function () { onAllIn = null; done(); }; }
function done() { step = TOTAL; stage = 'done'; H = {}; clr(MK); clr(ARW); hintOff();
  PK.forEach(function (pk) { if (pk.state !== 'inst') pk.o.visible = false; });
  for (var j = 0; j < 4; j++) { P.motors[j] = motorAt[j]; P.props[j] = propAt[j]; }
  A.G.visible = true; A.G.position.set(-9, 14, -5); go(VIEW.done, 1.6); spinOn = true;
  tween(1.8, function (e) { D.position.y = e * 9; D.rotation.set(.08 * e, .5 * e, -.06 * e); }, function () {
    D.updateMatrixWorld(true); propAt.forEach(function (p) { p.visible = false; }); motorAt.forEach(function (m, i) { var w = V(0, 0, 0); m.localToWorld(w.set(0, 2.0, 0)); X.blur(w, i % 2 ? '#ff4fd8' : '#3ee6ff'); }); X.sparks(V(0, 10, 2), 40, 16); });
  ticks.push(function (dt, t) { if (D.position.y > 8.9) D.position.y = 9 + Math.sin(t * 2.2) * .35; });
  var pts = Math.max(30, 100 - err * 5), best = +(localStorage.getItem('kursy_fpv_sborka') || 0); if (pts > best) localStorage.setItem('kursy_fpv_sborka', pts);
  ui.innerHTML = top('МАСТЕРСКАЯ', 'Сборка завершена') + '<div class="big"><b>ДРОН СОБРАН!</b><span>' + (LV === 1 ? 'Ты собрал дрон по порядку' : 'Гоночный 3 дюйма · 14 контактов пропаяно') + '</span><br><div class="stats"><span>ошибок: ' + err + '</span><span style="color:#5effc4">+' + pts + ' "Сборка"</span></div></div>' +
    '<div class="bub glass end" id="say"><div id="sayT"></div></div><button class="next" id="again" title="Ещё раз">↻</button>';
  say(err ? 'Дрон летает! Ошибок было: ' + err + '. Попробуй ещё раз без ошибок - очков будет больше.' : 'Без единой ошибки! <b>Ты собрал гоночный дрон</b> как настоящий техник.'); $('#again').onclick = function () { location.reload(); }; }

intro(); requestAnimationFrame(loop);
/* для проверки в браузере */
window.SBG = { iron: function () { return IRON; }, A: A, PK: PK, byId: byId, scr: scr, W: W, MP: MP, openSlots: openSlots, padM: padM, PADV: PADV, GR: GR, heat: heat,
  st: function () { return { stage: stage, phase: phase, err: err, cur: cur && { st: cur.st, gi: gi, dragW: !!cur.dragW } }; },
  jump: function (n) { /* только для проверки: сразу к этапу */
    for (var j = 0; j < 4; j++) { var pk = byId('m' + j); pk.state = 'inst'; motorAt[j] = pk.o; pk.o.position.copy(X.home['m' + j].p); pk.o.rotation.copy(X.home['m' + j].r); }
    inst.esc = true; var e = byId('esc'); e.state = 'inst'; e.o.position.copy(X.home.esc.p); e.o.rotation.copy(X.home.esc.r); clr(MK);
    if (n === 'solder') { phase = ''; solderStage(); return; }
    P.wires.forEach(function (w) { w.visible = true; }); P.batt.visible = true;
    if (n === 'B') { stackStage(); return; }
    ['fc', 'vtx', 'cam', 'top', 'rx', 'ant'].forEach(function (k) { var pk = byId(k); pk.state = 'inst'; inst[k] = true; pk.o.position.copy(X.home[k].p); pk.o.rotation.copy(X.home[k].r); });
    if (n === 'check') checkStage(); else propsStage(); } };
})();
