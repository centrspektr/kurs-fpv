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
  pileB: function () { return fit(V(0, 1.2, 2.6), V(.1, 1, .55), 12.5, 15, 40, 1); },
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
var TOTAL = LV === 1 ? 7 : 9, step = 0, err = 0, stage = '';
function top(s, t) { return '<div class="top"><a class="ic" href="javascript:history.back()">←</a><div class="ttl"><small>' + s + '</small><b>' + t + '</b></div><button class="ic" id="snd" title="Голос проводника">' + (sndOn() ? '🔊' : '🔇') + '</button><div class="ic" id="err" title="ошибки">' + err + '</div></div>'; }
/* голос проводника: тот же голос, что в курсе (golos.js, выбор голоса и "выкл" общие с курсом) */
function sndOn() { return !!(window.GOLOS && GOLOS.on); }
var SAID = {}; /* одну и ту же фразу голос не повторяет */
function speak(html, force) { if (!sndOn()) return; var d = document.createElement('div'); d.innerHTML = html; var t = d.textContent.replace(/\s+/g, ' ').trim(); if (!t || (SAID[t] && !force)) return; SAID[t] = 1; t = spoken(t);
  /* длинную фразу не обрываем: следующая ждёт своей очереди (в очереди только самая свежая), ошибка и кнопка звука перебивают сразу */
  var cut = force || stage === 'lesson' || stage === 'quiz' || /^Стоп\./.test(t) || Date.now() - spk.t > 25000; if (spk.on && !cut) { spk.next = t; return; } sayNow(t); }
var spk = { on: false, next: null, t: 0 };
/* как читать вслух: латиница, числа, размеры и единицы - словами, чтобы голос не коверкал (на экране текст остаётся как есть) */
var SPK = [
  [/\b(\d+),(\d)\s*ГГц/g, '$1 и $2 десятых гигагерца'], [/14,8 вольта/g, 'четырнадцать и восемь десятых вольта'], [/ГГц/g, 'гигагерц'],
  [/\bM2\s*x\s*6 мм/g, 'эм два на шесть миллиметров'], [/\bM2\s*x\s*10 мм/g, 'эм два на десять миллиметров'], [/\bM3\s*x\s*8 мм/g, 'эм три на восемь миллиметров'], [/\bM2x6\b/g, 'эм два на шесть'],
  [/\bM2\b/g, 'эм два'], [/\bM3\b/g, 'эм три'], [/2-3 мм/g, 'два-три миллиметра'], [/(\d+) мм(?![а-яё])/g, '$1 миллиметров'],
  [/\b1404\b/g, 'четырнадцать ноль четыре'], [/\b2207\b/g, 'двадцать два ноль семь'], [/, 04 -/g, ', ноль четыре -'],
  [/(\d+)x(\d+)/g, '$1 на $2'], [/ x /g, ' на '], [/4в1/g, 'четыре в одном'],
  [/330-350°/g, 'от трёхсот тридцати до трёхсот пятидесяти градусов'], [/20-30°/g, 'двадцать - тридцать градусов'], [/(\d+)°/g, '$1 градусов'],
  [/\(ESC\)|\(VTX\)|\(RX\)/g, ''], [/TX\/RX/g, 'Ти-Икс и Эр-Икс'], [/\bTX\b/g, 'Ти-Икс'], [/\bRX\b/g, 'Эр-Икс'], [/\bVTX\b/g, 'Ви-Ти-Икс'], [/\bESC\b/g, 'И-Эс-Си'], [/\bCAM\b/g, 'кам'],
  [/u\.FL/g, 'ю-эф-эл'], [/\bXT30\b/g, 'икс-тэ тридцать'], [/LiPo 4S/g, 'липо четыре эс'], [/\b4S\b/g, 'четыре эс'], [/\bAIO\b/g, 'эй-ай-оу'], [/Tinywhoop/g, 'тайни-вупа'], [/из TPU/g, 'из мягкого пластика'],
  [/\b5 В(?![а-яё])/g, 'пять вольт'], [/знаком \+/g, 'знаком плюс'], [/знаком −/g, 'знаком минус'], [/Вопрос (\d) из (\d)/g, function (m, a, b) { return 'Вопрос ' + ['', 'один', 'два', 'три', 'четыре', 'пять'][a] + ' из ' + ['', '', 'двух', 'трёх', 'четырёх', 'пяти'][b]; }], [/\s+-\s+/g, ' - '], [/\s{2,}/g, ' ']];
function spoken(t) { SPK.forEach(function (r) { t = t.replace(r[0], r[1]); }); return t.trim(); }
function sayNow(t) { spk.on = true; spk.t = Date.now(); spk.next = null; var ok = GOLOS.say(t, { onend: function () { spk.on = false; if (spk.next) { var n = spk.next; spk.next = null; sayNow(n); } } }); if (!ok) spk.on = false; }
document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#snd'); if (!b || !window.GOLOS) return; GOLOS.setOn(!GOLOS.on); b.textContent = GOLOS.on ? '🔊' : '🔇'; if (GOLOS.on) { var t = $('#sayT'); speak(t ? t.innerHTML : 'Голос включён', true); } });
function bars() { var o = '<div class="bars">'; for (var i = 0; i < TOTAL; i++) o += '<i class="' + (i < step ? 'd' : i === step ? 'h' : '') + '"></i>'; return o + '</div>'; }
function head(s, t, extra) { ui.innerHTML = top(s, t) + bars() + '<div class="bub glass" id="say"><div id="sayT"></div><div class="qs" id="qs"></div></div><div class="tag" id="tag"></div>' + (extra || ''); }
function say(txt, bad) { var b = $('#say'), t = $('#sayT'); if (!t) return; t.innerHTML = (bad ? '<span class="chip bad">ПОЧЕМУ НЕТ</span> ' : '') + txt; speak((bad ? 'Стоп. ' : '') + txt); b.classList.toggle('bad', !!bad); if (bad) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } }
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
  prop: 'Пропеллер 3"', lipo: 'Аккумулятор 4S', big: 'Мотор 2207', aio: 'Плата AIO 16x16', bigp: 'Пропеллер 5"' };
var PILE = { esc: [-8.5, .06, -10.5, .3], fc: [-3.6, .06, -12, -.2], aio: [1.2, .06, -11, .5], vtx: [5.2, .05, -12, .4], top: [9.4, .02, -10.5, .15],
  m0: [-9, .05, 9.2, 0], m1: [-6, .05, 10.8, 1], m2: [-3, .05, 9.2, 2], m3: [0, .05, 10.8, 3], big: [4, .05, 9.8, 0], cam: [8.6, .05, 9.4, -.8], rx: [10, .08, 11.4, 0], ant: [-7.4, .05, 11.6, .3],
  lipo: [-9.5, .7, 3.5, .35], p0: [-7.6, .35, 9.5, 0], p1: [-2.6, .4, 15.5, .7], p2: [2.6, .35, 9.5, 1.4], p3: [7.6, .4, 15.5, 2.1], bigp: [-5.5, .8, -12, .4] };
var PK = [];
function reg(id, o, kind, x) { var pk = { id: id, o: o, kind: kind, name: NAME[kind === 'x' ? id : kind], state: 'hide', pile: PILE[id] }; for (var k in x) pk[k] = x[k]; o.userData.pk = pk; PK.push(pk); return pk; }
P.motors.forEach(function (m, i) { reg('m' + i, m, 'mot'); });
['esc', 'fc', 'vtx', 'cam', 'top', 'rx', 'ant'].forEach(function (k) { reg(k, P[k], k); });
P.props.forEach(function (p, i) { reg('p' + i, p, 'prop', { idx: i }); });
reg('big', BIG, 'x', { why: 'Это мотор <b>2207</b> для дрона 5 дюймов: он в три раза тяжелее, и его крепёж шире, чем на нашей раме. Для трёх дюймов нужен маленький <b>1404</b> - их на столе четыре.' });
reg('aio', AIO, 'x', { why: 'Это плата <b>AIO 16x16</b> для маленького Tinywhoop: всё в одной плате, но она слабая для моторов 1404, и отверстия не совпадут. На эту раму ставим стек <b>20x20</b>: регулятор и полётник отдельно.' });
reg('bigp', BIGP, 'x', { why: 'Пропеллер <b>5 дюймов</b> заденет раму и соседние пропеллеры. На раму 3 дюйма ставят пропеллеры 3 дюйма.' });
/* аккумулятор: ставят в самом конце, на верхнюю пластину, под ремешок */
function makeLipo() { var g = new T.Group(), wm = new T.MeshStandardMaterial({ roughness: .5, map: A.cTex(256, 384, function (x, w, h) { x.fillStyle = '#1d2a4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd166'; x.fillRect(0, 0, w, 70);
    x.fillStyle = '#1a1300'; x.font = '900 46px sans-serif'; x.textAlign = 'center'; x.fillText('LiPo 4S', w / 2, 52); x.fillStyle = '#e9f0ff'; x.font = '800 40px sans-serif'; x.fillText('650 mAh', w / 2, 170); x.fillText('14,8 V', w / 2, 230);
    x.fillStyle = '#ff5d6c'; x.font = '700 26px sans-serif'; x.fillText('НЕ ПРОКАЛЫВАТЬ', w / 2, 330); }) });
  wm.envMapIntensity = .18; var side = new T.MeshStandardMaterial({ color: lin(0x1d2a4a), roughness: .5 }); side.envMapIntensity = .18;
  var body = new T.Mesh(new T.BoxGeometry(2.3, 1.2, 3.2), [side, side, wm, side, side, side]); body.castShadow = true; g.add(body);
  var strap = new T.Group(); g.add(strap); g.userData.strap = strap; /* ремешок */
  var sm = A.M.chip; [[0, .66, 0, 2.5, .08, .5], [0, -.66, 0, 2.5, .08, .5], [1.24, 0, 0, .08, 1.4, .5], [-1.24, 0, 0, .08, 1.4, .5]].forEach(function (b) { A.mesh(new T.BoxGeometry(b[3], b[4], b[5]), sm, b[0], b[1], b[2], strap); });
  A.mesh(new T.BoxGeometry(.5, .1, .55), new T.MeshStandardMaterial({ color: lin(0xff4f6a), roughness: .5 }), 0, .72, 0, strap); /* пряжка */
  var stub = new T.Group(); g.add(stub); g.userData.stub = stub; /* свой провод с разъёмом, пока лежит на столе */
  A.tube([V(.75, -.2, 1.6), V(.8, -.3, 2.4), V(.5, -.5, 3.0)], .1, A.M.wireR, stub); A.tube([V(.45, -.2, 1.6), V(.5, -.3, 2.4), V(.3, -.5, 3.0)], .1, A.M.wireK, stub);
  A.mesh(new T.BoxGeometry(.9, .55, 1.0), A.M.yellow, .4, -.45, 3.4, stub); return g; }
var LIPO = makeLipo(); D.add(LIPO); X.home.lipo = { p: V(0, 3.82, -.6), r: new T.Euler(0, 0, 0) };
reg('lipo', LIPO, 'lipo');
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
  if (phase === 'A') for (j = 0; j < 4; j++) if (!motorAt[j]) L.push({ k: 'mot', j: j, c: V(MP[j][0], .55, MP[j][1]) });
  if (phase === 'E' && !inst.esc) L.push({ k: 'esc', c: V(0, 1.06, 0), w: 3.4, d: 3.4 });
  if (phase === 'B') { if (!inst.fc) L.push({ k: 'fc', c: V(0, 1.96, 0), w: 3.4, d: 3.4 }); else { if (!inst.vtx) L.push({ k: 'vtx', c: V(0, 2.62, 1.4), w: 2, d: 2 }); if (!inst.cam) L.push({ k: 'cam', c: V(0, 1.6, -3), w: 1.7, d: 1.7 });
      if (inst.vtx && !inst.top) L.push({ k: 'top', c: V(0, 3.1, 0), w: 3.6, d: 6.6 }); if (inst.top) { if (!inst.rx) L.push({ k: 'rx', c: V(0, 3.32, 1.9), w: 1.1, d: 1.3 }); if (!inst.ant) L.push({ k: 'ant', c: V(0, 3.5, 3), w: 1.5, d: 1.3 }); } } }
  if (phase === 'Z' && !inst.lipo) L.push({ k: 'lipo', c: V(0, 3.82, -.6), w: 2.6, d: 3.5 });
  if (phase === 'P') for (j = 0; j < 4; j++) if (!propAt[j]) L.push({ k: 'prop', j: j, c: V(MP[j][0], 2.4, MP[j][1]) });
  return L; }
function whyNot(pk) { if (pk.kind === 'x') return pk.why; var L = openSlots(); for (var i = 0; i < L.length; i++) if (L[i].k === pk.kind) return null; var k = pk.kind;
  if (phase === 'A') { var rest = 'Сначала основа: моторы и регулятор, их потом паяют. Камеру и остальную электронику ставим после.';
    return k === 'esc' ? 'Сначала поставь и прикрути все 4 мотора: винты моторов закручивают снизу, через раму, а регулятор потом закроет центр.' : k === 'fc' ? 'Рано: сначала моторы, потом регулятор. Полётный контроллер ставят сверху стека.' : rest; }
  if (phase === 'E') { return k === 'fc' ? 'Внизу стека стоит <b>регулятор (ESC)</b>: к нему паяют толстые провода моторов и питания. Полётный контроллер ставят над ним.' : 'Сначала основа: регулятор, к нему потом паяют моторы и питание. Камеру и остальную электронику ставим после.'; }
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
  if (pk.kind === 'prop' && pk.idx % 2 !== best.j % 2) { var c = best.j % 2 ? 'розовые' : 'голубые'; oops('Этот пропеллер крутится в другую сторону. Смотри на стрелку над мотором: <b>' + c + '</b> пропеллеры - на ' + c + ' стрелки. Иначе пропеллер будет толкать дрон вниз!'); backToPile(pk); if (++wrong >= 2) hintOn(); return; }
  wrong = 0; install(pk, best); }
/* ---------- тексты: младшим проще, старшим подробнее ---------- */
function K(kid, adult) { return LV === 1 ? kid : adult; }
function DW(p) { D.updateMatrixWorld(true); return D.localToWorld(p.clone()); }
function DWdir(p, d) { return DW(p.clone().add(d)).sub(DW(p)).normalize(); }
function setStep(n) { step = n; var b = document.querySelectorAll('.bars i'); for (var i = 0; i < b.length; i++) b[i].className = i < n ? 'd' : i === n ? 'h' : ''; }
var ST = LV > 1 ? { mot: 0, scr: 1, esc: 2, sold: 3, pow: 4, stack: 5, check: 6, props: 7, lipo: 8 } : { mot: 0, scr: 1, esc: 2, stack: 3, check: 4, props: 5, lipo: 6 };
var DONE_MSG = {
  esc: K('Регулятор на месте! Он раздаёт ток моторам.', 'Верно! <b>Регулятор 4в1</b> управляет всеми четырьмя моторами. Он надет на стойки через резиновые демпферы: они гасят вибрацию.'),
  fc: K('Полётник на месте! Это "мозг" дрона.', '<b>Полётный контроллер</b> - "мозг": гироскоп чувствует наклоны, а процессор тысячи раз в секунду решает, как крутить моторы.'),
  vtx: K('Видеопередатчик стоит. Он шлёт картинку в очки.', '<b>Видеопередатчик (VTX)</b> отправляет картинку с камеры в очки по радио на частоте 5,8 ГГц.'),
  cam: K('Камера на носу: ты увидишь то, что видит она.', 'Камера на носу, в мягком креплении из TPU: оно спасает камеру при ударе.'),
  top: K('Верхняя пластина закрыла электронику.', 'Верхняя пластина закрывает стек, на ней держатся приёмник и антенна.'),
  rx: K('Приёмник ловит команды с пульта.', '<b>Приёмник (RX)</b> ловит команды пульта и передаёт их полётнику.'),
  lipo: K('Аккумулятор лёг на место!', 'Аккумулятор на верхней пластине: так он дальше от пропеллеров и лучше охлаждается в полёте.'),
  ant: K('Антенна сзади, подальше от пропеллеров.', 'Антенна сзади и сверху: так её не заденут пропеллеры, а рама не загородит сигнал.') };
function install(pk, s) { var home; pk.state = 'inst'; H = {};
  if (pk.kind === 'mot') { motorAt[s.j] = pk.o; home = X.home['m' + s.j]; } else if (pk.kind === 'prop') { propAt[s.j] = pk.o; home = X.home['p' + s.j]; } else { inst[pk.kind] = true; home = X.home[pk.kind]; }
  marks(); fly(pk.o, home.p.clone(), home.r, .55, function () { sparkle(W(home.p), 12); toast('✓ ' + pk.name);
    var msg = DONE_MSG[pk.kind]; if (pk.kind === 'mot') msg = nMot() < 4 ? 'Есть! Осталось моторов: <b>' + (4 - nMot()) + '</b>.' : 'Все 4 мотора стоят. Теперь их надо <b>прикрутить</b>.';
    if (pk.kind === 'prop') msg = K('Пропеллер на месте!', 'Пропеллер на месте. Он должен совпасть со стрелкой вращения мотора.');
    if (msg) say(msg);
    var f = EXTRA[pk.kind]; setTimeout(function () { (f || function (p, s2, cb) { cb(); })(pk, s, function () {
      if (onAllIn && onAllIn()) { clr(MK); setTimeout(next, 600); return; }
      if (f) { go(view0, 1); say(K('Что ставим дальше? Тяни следующую деталь.', 'Готово. <b>Что ставим дальше?</b> Тяни следующую деталь.')); }
      marks(); pileMode(); }); }, f ? 900 : 0); }); }
var view0 = null; /* вид этапа, куда камера возвращается после винтов и разъёмов */

/* ---------- отвёртка и винты ---------- */
var SCR = new T.Group(); D.add(SCR); /* винты остаются на дроне */
var TOOL = new T.Group(); S.add(TOOL);
function lin(hex) { return new T.Color(hex).convertSRGBToLinear(); }
function makeDriver(nut) { var g = new T.Group(), hm = new T.MeshStandardMaterial({ color: lin(nut ? 0x3ee6ff : 0xff4f6a), roughness: .45, metalness: .1 }); hm.envMapIntensity = .18;
  if (nut) { var s = A.mesh(new T.CylinderGeometry(.38, .38, .5, 6, 1, true), A.M.steel, 0, .25, 0, g); A.mesh(new T.CylinderGeometry(.2, .2, 2.4, 12), A.M.steel, 0, 1.7, 0, g); }
  else { A.mesh(new T.ConeGeometry(.08, .25, 8), A.M.steel, 0, .12, 0, g).rotation.x = Math.PI; A.mesh(new T.CylinderGeometry(.07, .07, 2.6, 10), A.M.steel, 0, 1.5, 0, g); }
  A.mesh(new T.CylinderGeometry(.42, .5, .5, 16), A.M.dark, 0, 3.0, 0, g); A.mesh(new T.CylinderGeometry(.55, .5, 3.4, 16), hm, 0, 4.9, 0, g);
  for (var i = 0; i < 8; i++) { var r = A.mesh(new T.BoxGeometry(.08, 2.8, .08), A.M.dark, 0, 4.9, 0, g); var a = i / 8 * Math.PI * 2; r.position.x = Math.cos(a) * .55; r.position.z = Math.sin(a) * .55; }
  return g; }
var DRV = {}; /* отвёртки лежат на столе и берутся оттуда */
function getDriver(nut) { var k = nut ? 'n' : 's'; if (DRV[k]) return DRV[k]; var d = makeDriver(nut); TOOL.add(d); d.userData.rest = { p: V(nut ? 10.7 : 9.1, .46, -2.6), q: new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0)) }; /* лежит на столе справа от рамы, ручкой к нам */ d.position.copy(d.userData.rest.p); d.quaternion.copy(d.userData.rest.q); d.scale.setScalar(.8); return (DRV[k] = d); }
function driverHome(d, cb) { var p0 = d.position.clone(), q0 = d.quaternion.clone(), r = d.userData.rest; tween(.45, function (e) { d.position.lerpVectors(p0, r.p, e); d.position.y += Math.sin(e * Math.PI) * 1.2; d.quaternion.copy(q0).slerp(r.q, e); }, cb); }
function screwMesh(nut) { var g = new T.Group();
  if (nut) { A.mesh(new T.CylinderGeometry(.3, .3, .26, 6), A.M.steel, 0, .13, 0, g); A.mesh(new T.CylinderGeometry(.33, .33, .06, 6), A.M.dark, 0, .02, 0, g); }
  else { A.mesh(new T.CylinderGeometry(.2, .2, .12, 16), A.M.steel, 0, .06, 0, g); A.mesh(new T.BoxGeometry(.26, .03, .06), A.M.dark, 0, .12, 0, g); A.mesh(new T.BoxGeometry(.06, .03, .26), A.M.dark, 0, .12, 0, g); /* крестик */ A.mesh(new T.CylinderGeometry(.065, .065, .6, 8), A.M.steel, 0, -.3, 0, g); }
  return g; }
/* o: holes - точки в координатах дрона, out - куда смотрит головка, group - винтов в одной детали (после первой детали - одним нажатием) */
var SCRL = null, SCRN = 0, CONN = null; /* для проверки */
function screwStep(o, done) { H = {}; SCRN++; var list = SCRL = o.holes.map(function (h, i) { var out = o.outs ? o.outs[i] : o.out, m = screwMesh(o.nut);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), out); m.position.copy(h).add(out.clone().multiplyScalar(.75)); m.scale.setScalar(.01); SCR.add(m); var gl = A.glow('#ffd166', o.nut ? 2 : 1.4, .9); gl.position.y = .15; m.add(gl); m.userData.gl = gl;
    tween(.3, function (e) { m.scale.setScalar(Math.max(.01, e)); }); return { h: h, out: out, m: m, done: 0, g: Math.floor(i / (o.group || 1)) }; });
  if (o.view) go(o.view, 1.1); if (o.say) say(o.say); hint(o.hint || K('Нажми на винт - отвёртка закрутит его', 'Нажимай на винты: отвёртка закручивает'));
  var drv = getDriver(o.nut); var busy = false, first = !(o.group > 1) || !o.firstManual, nDone = 0;
  var queue = [];
  H.down = function (e) { var best = null, bd = 70; list.forEach(function (s) { if (s.done || s.q) return; var d = dist(scr(DW(s.m.position)), e.clientX, e.clientY); if (d < bd) { bd = d; best = s; } });
    if (!best) { if (busy || list.some(function (s) { return (s.q || s.done) && dist(scr(DW(s.m.position)), e.clientX, e.clientY) < 90; })) return; say(o.miss || K('Нажми прямо на <b>винт</b>.', 'Нажми прямо на <b>головку винта</b>.')); return; }
    var batch = (o.group > 1 && first) ? list.filter(function (s) { return !s.done && !s.q && s.g === best.g; }) : [best]; batch.forEach(function (s) { s.q = 1; }); queue = queue.concat(batch); if (!busy) { busy = true; run(); } };
  function run() { var s = queue.shift(); if (!s) { busy = false; check(); return; } turn(s, run); } /* нажатия во время работы отвёртки ставятся в очередь */
  function turn(s, cb) { var wout = DWdir(s.h, s.out), head = DW(s.m.position), from = drv.position.clone(), qf = drv.quaternion.clone(), q0 = new T.Quaternion().setFromUnitVectors(V(0, 1, 0), wout), qs = s.m.quaternion.clone(), qr = new T.Quaternion(), far = from.distanceTo(head) > 4;
    tween(far ? .5 : .28, function (e) { drv.position.lerpVectors(from, head, e); if (far) drv.position.y += Math.sin(e * Math.PI) * 1.5; drv.quaternion.copy(qf).slerp(q0, Math.min(1, e * 1.6)); }, function () { var p0 = s.m.position.clone(), p1 = s.h.clone().add(s.out.clone().multiplyScalar(o.nut ? 0 : .01));
      tween(o.fast ? .45 : .75, function (e, l) { s.m.position.lerpVectors(p0, p1, l); qr.setFromAxisAngle(V(0, 1, 0), -l * 14); s.m.quaternion.copy(qs).multiply(qr); drv.position.copy(DW(s.m.position)); drv.quaternion.copy(q0).multiply(qr); },
        function () { s.done = 1; nDone++; if (s.m.userData.gl) { s.m.remove(s.m.userData.gl); s.m.userData.gl = null; } sparkle(DW(s.h), 4); var back = drv.position.clone(), away = back.clone().add(wout.clone().multiplyScalar(2.5));
          if (o.group > 1 && list.filter(function (q) { return q.g === s.g && !q.done; }).length === 0) { if (!first && o.afterFirst) say(o.afterFirst); first = true; }
          tween(.22, function (e) { drv.position.lerpVectors(back, away, e); }, cb); }); }); }
  function check() { if (list.some(function (s) { return !s.done; })) return; H = {}; SCRL = null; toast('✓ ' + (o.doneText || 'Винты закручены')); driverHome(drv, function () { setTimeout(done, 200); }); } }

/* переворачиваем раму: винты стоек и моторов закручивают снизу */
var parked = [];
function pileOut() { parked = PK.filter(function (pk) { return pk.state === 'pile' || pk.state === 'hide'; }); parked.forEach(function (pk) { S.attach(pk.o); }); }
function pileIn() { parked.forEach(function (pk) { D.attach(pk.o); }); parked = []; }
VIEW.flip = function () { return fit(V(0, 3.1, 2), V(0, 1, .4), 7.8, 7.8, 40, 1); };
function screwStage() { setStep(ST.scr); stage = 'screw'; H = {}; clr(MK); pileOut();
  head('ОТВЁРТКА · ВИД СНИЗУ', 'Винты рамы и моторов', '<div class="hint" id="hint"></div>'); setStep(ST.scr);
  say(K('Переворачиваем раму: винты закручивают <b>снизу</b>.', 'Переворачиваем раму: и стойки, и моторы крепят винтами <b>снизу, через раму</b>. Так винты не мешают электронике сверху.'));
  go(VIEW.flip, 1.4); tween(1.3, function (e) { D.rotation.z = Math.PI * e; D.position.y = 3.05 * e + Math.sin(e * Math.PI) * 3; }, function () {
    var so = [[1.5, -2.6], [-1.5, -2.6], [1.5, 2.6], [-1.5, 2.6]].map(function (q) { return V(q[0], 0, q[1]); });
    screwStep({ holes: so, out: V(0, -1, 0), say: K('Сначала 4 винта держат <b>стойки</b> - на них потом встанет электроника.', 'Сначала 4 винта M3 держат <b>стойки</b>: на них потом наденут регулятор и полётник. Затягиваем крепко, но без силы - резьба в алюминии мягкая.'), doneText: 'Стойки прикручены' }, motorsScrews); }); }
function motorsScrews() { var holes = [];
  MP.forEach(function (q) { for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; holes.push(V(q[0] + Math.cos(a) * .55, 0, q[1] + Math.sin(a) * .55)); } });
  function go2() { screwStep({ holes: holes, out: V(0, -1, 0), group: 4, firstManual: true,
    say: K('Теперь <b>моторы</b>: по 4 винта на каждый. Первый мотор закрути сам по одному винту.', 'Теперь <b>моторы</b>: по 4 винта M2x6 на мотор. Первый мотор - по одному винту, <b>крест-накрест</b>: так мотор прижимается ровно.'),
    afterFirst: K('Отлично! Остальные моторы - одним нажатием на любой винт мотора.', 'Отлично! Остальные моторы закручу быстрее: нажми на любой винт мотора, и все четыре закрутятся крест-накрест.'), doneText: 'Моторы прикручены' }, flipBack); }
  if (LV > 1) { say('Какие винты берём для моторов 1404?'); hint('Выбери ответ в карточке сверху');
    ask([['M2 x 6 мм'], ['M2 x 10 мм', 'Слишком длинный! Винт пройдёт сквозь луч и <b>упрётся в обмотки</b> мотора: провод обмотки замкнёт, и мотор сгорит. Длина винта = толщина луча + 2-3 мм.'], ['M3 x 8 мм', 'M3 толще: у моторов 1404 резьба под <b>M2</b>, такой винт не войдёт и сорвёт резьбу.']], 0, go2); }
  else go2(); }
function flipBack() { say(K('Переворачиваем раму обратно.', 'Рама и моторы прикручены. Переворачиваем обратно.'));
  tween(1.3, function (e) { D.rotation.z = Math.PI * (1 - e); D.position.y = 3.05 * (1 - e) + Math.sin(e * Math.PI) * 3; }, function () { D.rotation.set(0, 0, 0); D.position.set(0, 0, 2); pileIn(); escStage(); }); }
function escStage() { setStep(ST.esc); stage = 'E'; phase = 'E'; view0 = VIEW.pileA; go(VIEW.pileA, 1.2);
  head('СБОРКА · ВИД СВЕРХУ', 'Регулятор', '<div class="hint" id="hint">Тяни деталь со стола на раму</div>'); setStep(ST.esc);
  say(K('Моторы держатся крепко. <b>Что ставим в центр рамы, в самый низ?</b>', 'Моторы прикручены. <b>Какая плата ставится на стойки первой</b>, в самый низ стека?')); marks(); pileMode();
  onAllIn = function () { return !!inst.esc; }; next = function () { onAllIn = null; if (LV > 1) solderStage(); else autoWires(); }; }

/* ---------- разъёмы ---------- */
var SOCK = { ESC: { p: V(-1.18, 2.08, 1.3), f: K('регулятора', 'регулятора (питание полётника, сигналы моторов, датчик тока)') }, VTX: { p: V(1.18, 2.08, 1.3), f: 'видеопередатчика' },
  CAM: { p: V(0, 2.08, -1.42), f: 'камеры' }, RX: { p: V(1.42, 2.08, -.45), f: 'приёмника' }, 'u.FL': { p: V(0, 2.84, 2.25), f: 'антенны', small: 1 } };
var SOCKG = new T.Group(); D.add(SOCKG); SOCKG.visible = false;
function labSprite(t) { var tx = A.cTex(256, 96, function (x) { x.fillStyle = 'rgba(10,6,24,.82)'; x.fillRect(4, 14, 248, 68); x.strokeStyle = '#7cf3ff'; x.lineWidth = 4; x.strokeRect(4, 14, 248, 68); x.font = '800 48px sans-serif'; x.textAlign = 'center'; x.fillStyle = '#e9fbff'; x.fillText(t, 128, 66); });
  var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, depthTest: false })); sp.scale.set(.9, .34, 1); sp.renderOrder = 5; return sp; }
(function () { var bm = new T.MeshStandardMaterial({ color: lin(0xefe6d2), roughness: .6 }); bm.envMapIntensity = .18;
  Object.keys(SOCK).forEach(function (k) { var s = SOCK[k]; if (!s.small) { var b = A.mesh(new T.BoxGeometry(.46, .16, .24), bm, s.p.x, s.p.y, s.p.z, SOCKG); A.mesh(new T.BoxGeometry(.36, .06, .14), A.M.chip, s.p.x, s.p.y + .07, s.p.z, SOCKG); }
    var l = labSprite(k); l.position.copy(s.p).add(V(0, .45, 0)); SOCKG.add(l); s.lab = l; }); })();
var CAB = {
  fc: { s: 'ESC', a: V(-1.15, 1.25, 1.3), b: V(-1.9, 1.6, 1.9), rest: V(-2.3, 2.5, 1.7), col: 0xeeeeee, dir: V(-.55, 1, .9),
    ok: K('Регулятор и полётник соединены кабелем.', 'Кабель на 8 проводов: по нему полётник получает питание от регулятора и отдаёт ему команды для моторов.') },
  vtx: { s: 'VTX', a: V(.85, 2.62, 1.7), b: V(1.7, 2.9, 2.1), rest: V(2.3, 2.7, 1.1), col: 0xeeeeee, dir: V(.6, 1, .9),
    ok: K('Видеопередатчик подключён.', 'По этому кабелю идёт картинка от полётника (с цифрами на экране) и питание видеопередатчика.') },
  cam: { s: 'CAM', a: V(0, 1.35, -2.35), b: V(-.4, 2.0, -2.1), rest: V(-1.2, 2.6, -2.4), col: 0xeeeeee, dir: V(.4, 1, -.9),
    ok: K('Камера подключена.', 'Камера отдаёт видео полётнику: он рисует на картинке напряжение и время полёта, а потом передаёт её в видеопередатчик.') },
  rx: { s: 'RX', a: V(.25, 3.32, 1.85), b: V(1.9, 3.2, 1.0), rest: V(2.5, 2.7, -.2), col: 0xeeeeee, dir: V(.7, 1, .35),
    ok: K('Приёмник подключён.', 'Приёмник подключён: 4 провода - питание 5 В, земля и пара TX/RX для команд.') },
  ant: { s: 'u.FL', a: V(0, 3.4, 2.75), b: V(.5, 3.5, 2.55), rest: V(.95, 3.3, 2.05), col: 0x23252c, thin: 1, dir: V(.35, 1, .7),
    ok: K('Антенна защёлкнута.', 'Разъём u.FL маленький и нежный: защёлкивают прямо сверху, без перекоса. <b>Без антенны видеопередатчик включать нельзя</b> - он сгорит.') } };
var plugM = new T.MeshStandardMaterial({ color: lin(0xf4efe4), roughness: .5 }); plugM.envMapIntensity = .18;
/* "рентген": кабель, штекер и нужный разъём видны и сквозь платы - провод не пропадает в плоскостях */
var xrM = new T.MeshBasicMaterial({ color: 0x7cf3ff, transparent: true, opacity: .5, depthTest: false, depthWrite: false });
var xrS = new T.MeshBasicMaterial({ color: 0x5effc4, transparent: true, opacity: .6, depthTest: false, depthWrite: false });
function xr(o, m) { o.material = m || xrM; o.renderOrder = 4; o.castShadow = false; return o; }
/* крышка (верхняя пластина) на время подключения становится прозрачной */
var GHM = {};
function ghost(o, on) { o.traverse(function (n) { if (!n.isMesh) return;
  if (on) { if (n.userData.m0) return; var m = n.material, k = m.uuid; n.userData.m0 = m; if (!GHM[k]) { GHM[k] = m.clone(); GHM[k].transparent = true; GHM[k].opacity = .2; GHM[k].depthWrite = false; } n.material = GHM[k]; }
  else if (n.userData.m0) { n.material = n.userData.m0; delete n.userData.m0; } }); }
function lid(on) { if (!inst.top) return; ghost(P.top, on); if (inst.rx) ghost(P.rx, on); if (inst.ant) ghost(P.ant, on); }
function connectStep(kind, done) { var c = CAB[kind], tip = c.rest.clone(), cab = null, cabX = null, plug = new T.Group(), dr = false, sk = SOCK[c.s]; CONN = { tip: tip, s: c.s };
  var pg = new T.BoxGeometry(c.thin ? .16 : .4, .12, c.thin ? .16 : .2); A.mesh(pg, c.thin ? A.M.gold : plugM, 0, 0, 0, plug); plug.add(xr(new T.Mesh(pg)));
  var pgl = A.glow('#7cf3ff', c.thin ? .9 : 1.2, .8); pgl.material.depthTest = false; pgl.renderOrder = 5; plug.add(pgl); SF.add(plug); /* штекер светится - его легко найти */
  var hole = new T.Group(); hole.position.copy(sk.p); SOCKG.add(hole); hole.add(xr(new T.Mesh(new T.BoxGeometry(sk.small ? .24 : .5, .2, sk.small ? .24 : .28)), xrS));
  var hgl = A.glow('#5effc4', sk.small ? 1.1 : 1.4, .7); hgl.material.depthTest = false; hgl.renderOrder = 5; hole.add(hgl); /* куда подключать - тоже светится */
  var pulse = function (dt, t) { var a = .5 + Math.sin(t * 6) * .35; pgl.material.opacity = dr ? .35 : a; hgl.material.opacity = a; }; ticks.push(pulse);
  function draw() { if (cab) { SF.remove(cab); SF.remove(cabX); cab.geometry.dispose(); } var m = V(0, 0, 0).lerpVectors(c.b, tip, .5); m.y += .3; var pts = [c.a, c.b, m, tip.clone().add(V(0, .1, 0))];
    cab = A.tube(pts, c.thin ? .03 : .055, c.col === 0x23252c ? A.M.wireK : plugM, SF); cabX = xr(new T.Mesh(cab.geometry)); SF.add(cabX); plug.position.copy(tip); }
  draw(); SOCKG.visible = true; Object.keys(SOCK).forEach(function (k) { SOCK[k].lab.visible = k !== 'u.FL' || !!inst.vtx; }); lid(true);
  go(function () { var ctr = V(0, 0, 0).lerpVectors(sk.p, c.rest, .5); return fit(W(ctr), c.dir, 2.3, 2.3, 40, 1); }, 1.1);
  hint(K('Тяни светящийся штекер к зелёному разъёму', 'Тяни светящийся штекер к нужному разъёму'));
  if (inst.top) toast(K('Крышка прозрачная - видно провода', 'Пластина стала прозрачной - видно разъёмы'));
  H.down = function (e) { if (dist(scr(W(tip)), e.clientX, e.clientY) < 70) dr = true; else say(K('Тяни <b>штекер</b> - светящуюся коробочку на конце провода.', 'Тяни <b>штекер</b> на конце кабеля - он светится.')); };
  H.move = function (e) { if (!dr) return; var h = planeHit(e, sk.p.y + .5); if (h) { tip.set(h.x, sk.p.y + .5, h.z - 2); draw(); } };
  H.up = function (e) { if (!dr) return; dr = false; var best = null, bd = 60;
    Object.keys(SOCK).forEach(function (k) { if (!SOCK[k].lab.visible) return; var d = dist(scr(W(SOCK[k].p)), e.clientX, e.clientY); if (d < bd) { bd = d; best = k; } });
    if (!best) { back(); say(K('Отпусти штекер прямо над <b>разъёмом</b> с надписью.', 'Отпусти штекер прямо над <b>разъёмом</b> - у каждого есть надпись.')); return; }
    if (best !== c.s) { back(); oops('Это разъём <b>' + best + '</b> - для ' + SOCK[best].f + '. ' + K('Ищи надпись <b>' + c.s + '</b>.', 'Этому кабелю нужен разъём <b>' + c.s + '</b>: перепутаешь - устройство не заработает, а по питанию можно и сжечь.')); return; }
    H = {}; var t0 = tip.clone(), t1 = sk.p.clone().add(V(0, sk.small ? .05 : .1, 0)); tween(.35, function (e2) { tip.lerpVectors(t0, t1, e2); draw(); }, function () {
      ticks.splice(ticks.indexOf(pulse), 1); plug.remove(pgl); SOCKG.remove(hole);
      sparkle(W(sk.p), 8); toast('✓ Щёлк! ' + c.s); say(c.ok); setTimeout(function () { SOCKG.visible = false; SF.remove(cabX); plug.children.slice(1).forEach(function (o) { plug.remove(o); }); lid(false); done(); }, 1500); }); };
  function back() { var t0 = tip.clone(); tween(.35, function (e) { tip.lerpVectors(t0, c.rest, e); draw(); }); } }

/* что делаем после установки детали */
var EXTRA = {
  fc: function (pk, s, cb) { connectStep('fc', function () { if (LV === 1) return cb(); go(view0, .8); say('<b>Куда должна смотреть стрелка</b> на полётнике?'); hint('Выбери ответ в карточке сверху');
    ask([['Вперёд, к камере'], ['Назад', 'Если стрелка смотрит назад, полётник перепутает наклоны, и дрон <b>кувыркнётся при взлёте</b>. Стрелку ставят к носу (или поворачивают в настройках).'], ['Неважно', 'Важно! Гироскоп должен знать, где у дрона нос, иначе при взлёте дрон перевернётся.']], 0, function () { say('Верно: стрелка - к носу, туда же, куда смотрит камера.'); setTimeout(cb, 1200); }); }); },
  vtx: function (pk, s, cb) { connectStep('vtx', cb); },
  cam: function (pk, s, cb) { screwStep({ holes: [V(.97, 1.55, -3.2), V(-.97, 1.55, -3.2)], outs: [V(1, 0, 0), V(-1, 0, 0)], view: function () { return fit(W(V(0, 1.5, -3.2)), V(.35, .55, -1), 2.4, 2.2, 40, 1); },
    say: K('Прикрути камеру двумя винтами по бокам.', 'Камера держится на двух боковых винтах: ими же выставляют <b>угол наклона</b> - для гонок камеру наклоняют назад на 20-30°.'), doneText: 'Камера прикручена' }, function () { connectStep('cam', cb); }); },
  top: function (pk, s, cb) { screwStep({ holes: [V(1.5, 3.2, -2.6), V(-1.5, 3.2, -2.6), V(1.5, 3.2, 2.6), V(-1.5, 3.2, 2.6)], out: V(0, 1, 0), view: function () { return fit(W(V(0, 3, 0)), V(.2, 1, .6), 3.6, 4.4, 40, 1); },
    say: K('Прикрути верхнюю пластину четырьмя винтами.', 'Верхняя пластина садится на стойки, 4 винта M3. Не перетягивай: карбон может треснуть.'), doneText: 'Пластина прикручена' }, cb); },
  rx: function (pk, s, cb) { function c2() { connectStep('rx', cb); }
    if (LV === 1) return c2(); say('Провод <b>TX</b> приёмника идёт на...'); hint('Выбери ответ в карточке сверху');
    ask([['RX полётника'], ['TX полётника', 'TX - это "передаю", RX - "принимаю". Передатчик одного соединяют с приёмником другого: <b>TX к RX, крест-накрест</b>. TX к TX работать не будет.']], 0, function () { say('Верно: TX к RX, крест-накрест. В нашем кабеле это уже сделано.'); setTimeout(c2, 1300); }); },
  ant: function (pk, s, cb) { connectStep('ant', cb); },
  lipo: function (pk, s, cb) { lipoStep(cb); },
  prop: function (pk, s, cb) { screwStep({ holes: [V(MP[s.j][0], 2.7, MP[s.j][1])], out: V(0, 1, 0), nut: true, fast: true, say: K('Закрути гайку пропеллера.', 'Закрути гайку: придерживай колокол мотора, чтобы он не проворачивался.'),
    hint: 'Нажми на гайку', miss: 'Нажми на <b>гайку</b> на моторе.', doneText: 'Гайка затянута' }, cb); } };

/* ---------- пайка ---------- */
var SF = new T.Group(); D.add(SF); /* провода, капли припоя, флюс, кабели - остаются на дроне */
var IF = new T.Group(); S.add(IF); /* паяльник, пруток припоя, дым */
function padM(j, k) { var q = MP[j]; return V(Math.sign(q[0]) * 1.38, 1.215, Math.sign(q[1]) * (1.3 - k * .38)); }
var PADV = [V(-.5, 1.225, 1.42), V(.5, 1.225, 1.42)]; /* + и - питания */
var BAND = [0xffd23a, 0xf2f6ff, 0x3b8bff].map(function (c) { var m = new T.MeshStandardMaterial({ color: lin(c), roughness: .4 }); m.envMapIntensity = .18; return m; });
function drawWire(w) { if (w.mesh) { SF.remove(w.mesh); w.mesh.geometry.dispose(); } var m1 = V(0, 0, 0).lerpVectors(w.b, w.tip, .55); m1.y += .25;
  w.mesh = A.tube([w.a, w.b, m1, w.tip], w.r, w.m, SF); A.mesh(new T.SphereGeometry(w.r * 1.15, 10, 8), A.M.steel, w.tip.x, w.tip.y, w.tip.z, w.mesh);
  if (w.k != null) { var bp = V(0, 0, 0).lerpVectors(m1, w.tip, .82); A.mesh(new T.SphereGeometry(w.r * 1.45, 10, 8), BAND[w.k], bp.x, bp.y, bp.z, w.mesh); } }
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
var IRON = null, SOLD = null, SMOKE = [], DRIPS = [], GR = [], gi = -1, cur = null, heat = { on: false, h: 0 }, feed = 0, said3 = false;
var G1 = .5, G2 = .86; /* зелёная зона нагрева */
function solderStage() { setStep(ST.sold); stage = 'temp'; H = {}; A.G.visible = false; go(VIEW.station, 1.4);
  head('ПАЯЛЬНАЯ СТАНЦИЯ', 'Подготовка к пайке', '<div class="hint" id="hint">Выбери ответ в карточке сверху</div>'); setStep(ST.sold);
  say('Регулятор стоит. Пора паять к нему провода моторов. <b>Какую температуру ставим на паяльнике?</b>');
  ask([['250°', '250° - мало: припой плавится долго, плата успеет перегреться, а пайка выйдет холодной.'], ['330°'], ['450°', '450° - слишком горячо: флюс сгорает сразу, площадки на плате могут отслоиться. Для таких плат хватает 330-350°.']], 1, function () {
    say('Верно, <b>330°</b>. Станция уже нагрета. Летим к регулятору!'); setTimeout(startGroups, 1100); }); }
function startGroups() { IRON = makeIron(); IF.add(IRON); IRON.visible = false;
  for (var j = 0; j < 4; j++) GR.push({ j: j, manual: j < 2, rate: 2.4, pads: [0, 1, 2].map(function (k) { return { p: padM(j, k), done: 0, r: .17, k: k }; }), wires: [0, 1, 2].map(function (k) { return mWire(j, k); }) });
  GR.push({ power: true, manual: true, rate: 3.8, pads: [{ p: PADV[0], done: 0, r: .27, pol: 0 }, { p: PADV[1], done: 0, r: .27, pol: 1 }], wires: [pWire(0), pWire(1)] });
  var lp = txtSprite('+', '#ff5a64', .6); lp.position.copy(PADV[0]).add(V(0, .3, -.5)); SF.add(lp); var lm = txtSprite('−', '#e9f0ff', .6); lm.position.copy(PADV[1]).add(V(0, .25, -.5)); SF.add(lm); lp.visible = lm.visible = false; GR[4].labels = [lp, lm];
  for (var i = 0; i < 14; i++) { var s = A.glow('#d8d2ff', .4, 0); s.userData.life = 0; IF.add(s); SMOKE.push(s); }
  var dm = new T.MeshStandardMaterial({ color: lin(0xe8ecf2), metalness: 1, roughness: .12, emissive: new T.Color(0xff6a00), emissiveIntensity: .9 });
  for (i = 0; i < 6; i++) { var d = new T.Mesh(new T.SphereGeometry(.05, 10, 8), dm); d.visible = false; d.userData.life = 0; IF.add(d); DRIPS.push(d); }
  ticks.push(solderTick); nextGroup(); }
function gView(g) { return function () { if (g.power) return fit(W(V(0, 1.22, 2.0)), V(0, 1, .85), 1.8, 2.4, 40, 1); var q = MP[g.j], sx = Math.sign(q[0]), sz = Math.sign(q[1]); return fit(W(V(sx * 1.7, 1.22, sz * 1.05)), V(-sx * .72, 1, sz * .16), 1.6, 2.3, 40, 1); }; }
function tView(g) { return function () { var q = MP[g.j], sx = Math.sign(q[0]), sz = Math.sign(q[1]); return fit(W(V(sx * 3.5, 1.2, sz * 3.2)), V(-sx * .45, 1, sz * .35), 4, 3.8, 40, 1); }; }
function camDir() { var c = view(), f = c.l.clone().sub(c.p).normalize(), r = V(0, 0, 0).crossVectors(f, V(0, 1, 0)).normalize(); return { f: f, r: r }; }
var TOOLS = '<div class="hr" id="hr"><i></i></div><div class="tools"><button class="tb" id="flux"><b>💧</b>Флюс</button><button class="tb hold" id="hold"><b>🔥</b>Держать жало</button><button class="tb hold" id="test" style="display:none"><b>⚡</b>Проверить мотор</button></div>';
function nextGroup() { gi++; if (gi >= GR.length) return solderDone(); cur = GR[gi]; var g = cur, power = !!g.power;
  head(power ? 'КРУПНО · ПИТАНИЕ' : 'КРУПНО · МОТОР ' + (g.j + 1) + ' ИЗ 4', power ? 'Провода аккумулятора' : 'Пайка проводов мотора', TOOLS); setStep(power ? ST.pow : ST.sold);
  go(gView(g), 1.3); if (g.labels) g.labels.forEach(function (l) { l.visible = true; });
  g.wires.forEach(function (w) { w.tip = w.rest.clone(); drawWire(w); });
  g.st = 'flux'; heat.on = false; $('#flux').classList.add('go');
  var d = camDir(); g.dir = d.r.clone().add(V(0, .55, 0)).add(d.f.clone().multiplyScalar(.55)).normalize(); g.left = d.r.clone().negate();
  IRON.visible = true; IRON.quaternion.setFromUnitVectors(V(0, 1, 0), g.dir); var park = W(g.pads[0].p).add(g.dir.clone().multiplyScalar(1.5)).add(V(0, .5, 0));
  if (gi === 0) IRON.position.copy(park); else { var p0 = IRON.position.clone(); tween(1.2, function (e) { IRON.position.lerpVectors(p0, park, e); }); }
  makeSolderWire(g);
  if (power) say('Теперь питание. Толстые провода от аккумулятора: <b>красный - плюс</b>, чёрный - минус. Здесь полярность важна. Сначала <b>флюс</b> на площадки.');
  else if (g.j === 0) say('У мотора <b>три провода - три обмотки</b>. Плюса и минуса тут нет: регулятор по очереди подаёт ток на обмотки, и магниты колокола бегут за ним по кругу. <b>От порядка проводов зависит, куда крутится мотор.</b> Начнём с <b>флюса</b>.');
  else if (g.manual) say('Мотор 2. Повтори сам: <b>флюс</b>, провода на площадки, пайка каждого контакта, проверка вращения.');
  else say('Мотор ' + (g.j + 1) + '. Провода положу я, а ты <b>пропаяй каждый контакт</b>. Начни с флюса.');
  hint(power ? 'Флюс, потом провода и пайка' : 'Флюс → провода → пайка → проверка');
  $('#flux').onclick = fluxTap; var hb = $('#hold'); hb.addEventListener('pointerdown', function (e) { e.preventDefault(); heatDown(); }); hb.addEventListener('pointerup', heatUp); hb.addEventListener('pointerleave', heatUp);
  $('#test').onclick = function () { testMotor(cur); };
  H.down = function (e) { if (cur.st === 'wire') wireDown(e); else if (cur.st === 'heat') heatDown(); else if (cur.st === 'desolder') pickDesolder(e); else if (cur.st === 'flux') oops('Сначала <b>флюс</b>: без него припой скатывается шариком и не держится на площадке.'); };
  H.move = function (e) { if (cur.dragW) wireMove(e); };
  H.up = function (e) { if (cur.dragW) wireUp(e); else heatUp(); }; }
function hint(t) { var h = $('#hint'); if (h) h.textContent = t; }
function makePen() { var g = new T.Group(), body = new T.MeshPhysicalMaterial({ color: lin(0xffc23a), transparent: true, opacity: .75, roughness: .1, clearcoat: 1 });
  A.mesh(new T.CylinderGeometry(.025, .025, .6, 10), A.M.steel, 0, .3, 0, g); A.mesh(new T.CylinderGeometry(.09, .16, .4, 16), A.M.white, 0, .8, 0, g);
  A.mesh(new T.CylinderGeometry(.32, .32, 3.2, 20), body, 0, 2.6, 0, g); A.mesh(new T.CylinderGeometry(.34, .34, .3, 20), A.M.white, 0, 4.3, 0, g);
  A.mesh(new T.CylinderGeometry(.33, .33, 1.2, 20, 1, true), new T.MeshStandardMaterial({ color: lin(0xff4f6a), roughness: .5 }), 0, 2.6, 0, g); return g; }
function fluxTap() { var g = cur; if (g.st !== 'flux') { if (g.st !== 'busy') say('Флюс уже есть. ' + (g.st === 'wire' ? 'Теперь положи провод на площадку.' : 'Прижми жало и держи.')); return; } g.st = 'busy'; $('#flux').classList.remove('go');
  say('Шприц с флюсом: капаем <b>по капле на каждую площадку</b>. Флюс снимает окисел, и припой растечётся ровно.');
  var d = camDir(), pd = g.left.clone().multiplyScalar(.45).add(V(0, 1, 0)).add(d.f.clone().multiplyScalar(-.15)).normalize(), pen = makePen(); pen.quaternion.setFromUnitVectors(V(0, 1, 0), pd); IF.add(pen);
  var start = W(g.pads[0].p).add(pd.clone().multiplyScalar(4)), T0 = 0; pen.position.copy(start);
  function mv(to, dur, at) { wait(at, function () { var f = pen.position.clone(); tween(dur, function (e) { pen.position.lerpVectors(f, to, e); }); }); }
  g.pads.forEach(function (p) { var above = W(p.p).add(pd.clone().multiplyScalar(.9)), touch = W(p.p).add(pd.clone().multiplyScalar(.12));
    mv(above, .45, T0); mv(touch, .25, T0 + .5); mv(above, .3, T0 + 1.35);
    var m = new T.Mesh(new T.SphereGeometry(p.r * 1.05, 20, 12), new T.MeshPhysicalMaterial({ color: lin(0xffb52e), transparent: true, opacity: .8, roughness: .02, metalness: 0, clearcoat: 1, emissive: lin(0x5a3000) }));
    m.position.copy(p.p).add(V(0, .01, 0)); m.scale.set(.01, .01, .01); m.visible = false; SF.add(m); p.flux = m;
    wait(T0 + .75, function () { m.visible = true; tween(.55, function (e) { m.scale.set(e, .38 * e, e); }); });
    T0 += 1.7; });
  mv(start, .5, T0); wait(T0 + .55, function () { IF.remove(pen); toast('✓ Флюс на площадках');
    if (g.manual) { g.st = 'wire'; say(g.power ? 'Флюс есть. Тяни <b>красный провод</b> на площадку плюса, чёрный - на минус.' : 'Флюс есть. Тяни <b>кончики проводов</b> на площадки. Провода помечены цветом: жёлтый, белый, синий. Положи <b>по порядку</b>, потом проверим, куда крутится мотор.'); }
    else autoLay(); }); }
function autoLay() { var g = cur; g.wires.forEach(function (w, k) { var p = g.pads[k], t0 = w.tip.clone(), t1 = p.p.clone().add(V(0, .03, 0)); wait(k * .3, function () { tween(.4, function (e) { w.tip.lerpVectors(t0, t1, e); drawWire(w); }); }); w.pad = p; p.wire = w; });
  wait(1.4, function () { activate(g.pads[0]); say('Провода на месте. <b>Держи жало</b> на площадке: припой подойдёт сам. Отпусти, когда стрелка в <b>зелёной</b> зоне.'); }); }
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
  w.tip.copy(best.p).add(V(0, .03, 0)); drawWire(w); w.pad = best; best.wire = w; activate(best);
  say(g.power ? 'Провод на площадке. Толстый провод забирает много тепла - <b>греть придётся дольше</b>. Держи жало до зелёной зоны.' : 'Провод лежит на площадке. <b>Держи жало</b> (кнопка или палец на экране): площадка прогреется, подойдёт припой. Отпусти, когда стрелка в <b>зелёной</b> зоне.'); }
/* пруток припоя: подаётся сверху сбоку к площадке, плавится каплями */
function makeSolderWire(g) { if (SOLD) IF.remove(SOLD); var ax = g.left.clone().multiplyScalar(.8).add(V(0, .75, 0)).add(camDir().f.multiplyScalar(-.3)).normalize(); g.ax = ax;
  SOLD = A.tube([ax.clone().multiplyScalar(7).add(V(0, .8, 0)), ax.clone().multiplyScalar(3.5).add(V(0, .2, 0)), V(0, 0, 0)], .05, A.M.steel, IF); SOLD.visible = false; }
function solderTip(p, f) { return W(p.p).add(cur.left.clone().multiplyScalar(.16)).add(V(0, .12, 0)).add(cur.ax.clone().multiplyScalar((1 - f) * 1.8)); }
function placeSolder(p, f) { feed = f; SOLD.visible = f > .02; SOLD.position.copy(solderTip(p, f)); }
function retract(p, dur) { var f0 = feed; tween(dur || .6, function (e) { placeSolder(p, f0 * (1 - e)); }); }
function heatDown() { var g = cur; if (!g || heat.on) return;
  if (g.st === 'flux') { oops('Сначала <b>флюс</b>: без него припой скатывается шариком и не держится на площадке.'); return; }
  if (g.st === 'wire') { say('Сначала положи <b>провод</b> на площадку: тяни его серебристый кончик.'); return; }
  if (g.st === 'desolder') { say('Сначала нажми на <b>пайку</b>, которую хочешь расплавить.'); return; }
  if (g.st !== 'heat' && g.st !== 'melt') return; var p = g.act; heat.on = true; heat.h = 0; var sb = $('#say'); if (sb && sb.classList.contains('bad')) say(g.st === 'melt' ? 'Плавим пайку... держи жало.' : 'Ещё раз: греем и отпускаем в <b>зелёной зоне</b>.'); var t0 = IRON.position.clone();
  var to = W(p.p).add(V(0, .04, 0)); tween(.3, function (e) { if (heat.on) IRON.position.lerpVectors(t0, to, e); });
  if (!p.blob) { var bm = new T.MeshStandardMaterial({ color: lin(0xd8dde6), metalness: 1, roughness: .16, emissive: new T.Color(0xff5a00), emissiveIntensity: 0 }); bm.envMapIntensity = .55;
    p.blob = new T.Mesh(new T.SphereGeometry(p.r, 20, 12), bm); p.blob.position.copy(p.p).add(V(0, .02, 0)); p.blob.scale.set(.01, .01, .01); SF.add(p.blob); p.base = 0; } }
function heatUp() { if (!heat.on) return; heat.on = false; var g = cur, p = g.act, h = heat.h;
  if (g.st === 'melt') return meltDone(p, h); g.st = 'busy';
  if (h < G1) return cold(p); if (h > G2) return bridge(p); good(p); }
function ironLift(p, dur, delay, done) { wait(delay || 0, function () { var from = IRON.position.clone(), park = W(p.p).add(cur.dir.clone().multiplyScalar(1.5)).add(V(0, .5, 0));
  /* жало уходит плавно: сначала чуть вверх, потом в сторону */
  tween(dur, function (e, l) { var up = Math.min(1, l * 3); IRON.position.lerpVectors(from, park, e); IRON.position.y += Math.sin(up * Math.PI / 2) * .5 * (1 - e); }, done); }); }
function good(p) { var g = cur; p.done = 1; var bm = p.blob.material; if (p.flux) { var fm = p.flux; p.flux = null; tween(.6, function (e) { fm.material.opacity = .8 * (1 - e); fm.scale.y = .38 * (1 - e * .7); }, function () { SF.remove(fm); }); }
  p.blob.scale.set(1, .5, 1); retract(p, .6); ironLift(p, 1.3, .45); /* сначала убираем припой, потом жало */
  tween(2, function (e) { bm.emissiveIntensity = 1.4 * (1 - e); }, function () { toast(g.power ? '✓ ' + (p.pol ? 'Минус' : 'Плюс') + ' припаян' : '✓ Контакт припаян'); sparkle(W(p.p), 6); after(); });
  say(['Отлично! Сначала убираем <b>припой</b>, потом <b>жало</b>. Пайка блестит конусом. Не шевели провод, пока припой застывает.', 'Ровная блестящая пайка - так и надо!', 'Есть! Припой застывает - провод не трогаем.'][g.pads.filter(function (q) { return q.done; }).length % 3]);
  function after() { var left = g.pads.filter(function (q) { return !q.done; });
    if (!left.length) { $('#hr').style.display = 'none'; if (g.power) { g.labels.forEach(function (l) { l.visible = false; }); toast('✓ Питание подключено'); setTimeout(nextGroup, 700); } else testReady(g); return; }
    if (g.wires.some(function (w) { return !w.pad; })) { g.st = 'wire'; $('#hr').style.display = 'none'; say(g.power ? 'Теперь второй провод.' : 'Следующий провод: тяни его кончик на свободную площадку.'); }
    else { activate(left[0]); say('Следующий контакт. <b>Держи жало</b> до зелёной зоны.'); } } }
function cold(p) { var bm = p.blob.material; bm.color = lin(0x7c818b); bm.roughness = .85; bm.metalness = .4; bm.emissiveIntensity = 0; p.blob.scale.set(.6, .5, .6); retract(p, .5); ironLift(p, .9, .35);
  oops('<b>Холодная пайка</b>: припой не успел растечься, получился серый матовый шарик. От вибрации провод отвалится в полёте. Держи жало дольше - до зелёной зоны.');
  wait(2, function () { bm.color = lin(0xd8dde6); bm.roughness = .16; bm.metalness = 1; p.blob.scale.set(.01, .01, .01); p.base = 0; cur.st = 'heat'; }); }
function bridge(p) { var g = cur, bm = p.blob.material; p.blob.scale.set(1.5, .8, 1.5); retract(p, .5); ironLift(p, .9, .35);
  var nb = g.pads.filter(function (q) { return q !== p; }).sort(function (a, b) { return a.p.distanceTo(p.p) - b.p.distanceTo(p.p); })[0], br = null;
  if (nb) { var len = nb.p.distanceTo(p.p); br = new T.Mesh(new T.CylinderGeometry(.09, .09, len, 10), bm); br.position.lerpVectors(p.p, nb.p, .5).add(V(0, .04, 0)); br.quaternion.setFromUnitVectors(V(0, 1, 0), nb.p.clone().sub(p.p).normalize()); SF.add(br); }
  oops('Перегрев и <b>лишний припой</b>: капля растеклась и перемкнула соседний контакт! Это замыкание - регулятор сгорит. Лишнее убирают оплёткой. Отпускай раньше, в зелёной зоне.');
  tween(2.2, function (e) { bm.emissiveIntensity = 1.4 * (1 - e); }, function () { p.blob.scale.set(.01, .01, .01); p.base = 0; if (br) SF.remove(br); cur.st = 'heat'; }); }

/* проверка вращения и перепайка двух проводов */
var TA = new T.Group(); S.add(TA);
function arrowFor(j, col) { var g = new T.Group(), sg = j % 2 ? 1 : -1, r = 1.9, arc = 4.4, pts = [];
  for (var i = 0; i <= 24; i++) { var a = i / 24 * arc; pts.push(V(r * Math.cos(a), 0, sg * r * Math.sin(a))); }
  A.tube(pts, .08, A.neon(col), g); var tg = V(-Math.sin(arc), 0, sg * Math.cos(arc)).normalize();
  var cn = new T.Mesh(new T.ConeGeometry(.28, .7, 12), A.neon(col)); cn.position.copy(pts[24]).add(tg.clone().multiplyScalar(.3)); cn.quaternion.setFromUnitVectors(V(0, 1, 0), tg); g.add(cn);
  g.position.copy(W(V(MP[j][0], 2.9, MP[j][1]))); return g; }
function parity(g) { var a = g.wires.map(function (w) { return w.pad.k; }), inv = 0; for (var i = 0; i < 3; i++) for (var k = i + 1; k < 3; k++) if (a[i] > a[k]) inv++; return inv % 2; }
function needDir(j) { return j % 2 ? -1 : 1; } /* +1 - против часовой (вид сверху) */
function actualDir(g) { return needDir(g.j) * (g.j === 0 ? -1 : 1) * (parity(g) ? -1 : 1); } /* у первого мотора обмотки идут наоборот - так бывает */
function testReady(g) { g.st = 'test'; $('#flux').style.display = $('#hold').style.display = 'none'; $('#test').style.display = 'flex';
  hint('Нажми "Проверить мотор"');
  say(g.tested ? 'Провода перепаяны. <b>Проверим ещё раз.</b>' : 'Все три провода припаяны. <b>Проверим, куда крутится мотор</b>: подключаем аккумулятор через смоук-стоппер и коротко включаем мотор.'); }
function testMotor(g) { if (g.st !== 'test') return; g.st = 'busy'; g.tested = 1; $('#test').style.display = 'none'; go(tView(g), 1);
  var nd = needDir(g.j), ad = actualDir(g), ar = arrowFor(g.j, g.j % 2 ? 0xff4fd8 : 0x3ee6ff); TA.add(ar);
  say('Стрелка показывает, куда <b>должен</b> крутиться этот мотор. Смотри на колокол...');
  var b = motorAt[g.j].userData.bell, sp = 0; var f = function (dt) { sp = Math.min(30, sp + dt * 40); b.rotation.y += dt * sp * ad; }; ticks.push(f);
  wait(2.6, function () { ticks.splice(ticks.indexOf(f), 1);
    if (ad === nd) { toast('✓ Крутится правильно'); say(g.j === 0 || g.fixed ? '<b>Теперь правильно!</b> Мотор крутится по стрелке.' : 'Мотор крутится <b>по стрелке</b> - правильно.'); setTimeout(function () { clr(TA); nextGroup(); }, 1500); return; }
    say('<b>Мотор крутится против стрелки!</b> Так бывает часто. Исправляют просто: <b>меняют местами любые два провода</b> из трёх. Выпаяй два провода: нажми на пайку и держи жало, пока припой не расплавится.');
    hint('Нажми на пайку, которую расплавить'); g.fixed = 1; g.st = 'desolder'; g.freed = 0; go(gView(g), 1); $('#hold').style.display = 'flex'; setTimeout(function () { clr(TA); }, 800); }); }
function pickDesolder(e) { var g = cur, best = null, bd = 60; g.pads.forEach(function (p) { if (!p.wire) return; var d = dist(scr(W(p.p)), e.clientX, e.clientY); if (d < bd) { bd = d; best = p; } });
  if (!best) { say('Нажми прямо на <b>пайку</b> одного из проводов.'); return; } g.act = best; g.st = 'melt'; $('#hr').style.display = 'block'; heatDown(); }
function meltDone(p, h) { var g = cur;
  if (h < .45) { retract(p, .3); ironLift(p, .6, 0); say('Припой ещё не расплавился - <b>держи жало дольше</b>.'); g.st = 'desolder'; return; }
  var w = p.wire, t0 = w.tip.clone(); p.wire = null; w.pad = null; p.done = 0; p.base = .55; p.blob.scale.set(.55, .28, .55); retract(p, .3); ironLift(p, .8, .1);
  tween(.45, function (e) { w.tip.lerpVectors(t0, w.rest, e); drawWire(w); }); g.freed++; $('#hr').style.display = 'none';
  if (g.freed < 2) { g.st = 'desolder'; say('Провод снят! Теперь <b>второй провод</b>: расплавь его пайку.'); }
  else { g.st = 'wire'; $('#hold').style.display = 'flex'; say('Оба провода сняты. Теперь <b>поменяй их местами</b>: положи каждый на площадку, где был другой, и пропаяй.'); hint('Положи провода наоборот и пропаяй'); } }
function solderTick(dt, t) { var g = cur; if (!g || !IRON) return; var hot = IRON.userData.hot, hr = $('#hr');
  if (heat.on) { heat.h += dt / (g.st === 'melt' ? 1.6 : g.rate); var p = g.act, h = heat.h;
    if (g.st !== 'melt') { var f = clamp(h / .25, 0, 1), s = Math.max(p.base || 0, clamp((h - .22) / .36, 0, 1.25)); placeSolder(p, f);
      if (p.blob) { p.blob.scale.set(Math.max(.01, s), Math.max(.01, s * .5), Math.max(.01, s)); p.blob.material.emissiveIntensity = 1.4 * Math.min(1, h * 2); }
      if (h > .22 && h < .62 && Math.random() < dt * 9) { for (var i = 0; i < DRIPS.length; i++) if (DRIPS[i].userData.life <= 0) { var dr = DRIPS[i]; dr.userData.life = 1; dr.userData.from = solderTip(p, 1); dr.userData.to = W(p.p).add(V(0, .05, 0)); dr.visible = true; break; } } }
    else if (p.blob) p.blob.material.emissiveIntensity = 1.4 * Math.min(1, h * 2);
    if (h > .25 && Math.random() < dt * 14) { for (i = 0; i < SMOKE.length; i++) if (SMOKE[i].userData.life <= 0) { var sm = SMOKE[i]; sm.userData.life = 1; sm.position.copy(W(p.p)).add(V((Math.random() - .5) * .3, .2, (Math.random() - .5) * .3)); break; } }
    if (h >= 1) heatUp(); }
  DRIPS.forEach(function (d) { var u = d.userData; if (u.life <= 0) { d.visible = false; return; } u.life -= dt * 4; var l = 1 - u.life; d.position.lerpVectors(u.from, u.to, l * l); d.scale.set(1, 1 + l * .8, 1); });
  var on = heat.on ? 1 : (g.st === 'busy' ? .4 : 0); hot[0].material.opacity += (on * .95 - hot[0].material.opacity) * .2; hot[1].material.opacity = hot[0].material.opacity;
  SMOKE.forEach(function (sm) { var u = sm.userData; if (u.life <= 0) { sm.material.opacity = 0; return; } u.life -= dt * .7; sm.position.y += dt * 1.3; sm.position.x += Math.sin(t * 3 + sm.id) * dt * .3; sm.scale.setScalar(.3 + (1 - u.life) * 1.6); sm.material.opacity = .32 * u.life; });
  if (hr && g.act && hr.style.display === 'block') { var spp = scr(W(g.act.p)); hr.style.left = spp.x + 'px'; hr.style.top = spp.y + 'px'; hr.style.setProperty('--h', heat.on ? Math.min(1, heat.h) : 0); hr.classList.toggle('on', heat.on); hr.classList.toggle('melt', g.st === 'melt' || g.st === 'desolder'); } }
function solderDone() { cur = null; ticks.splice(ticks.indexOf(solderTick), 1); H = {}; clr(IF); IRON = null;
  P.batt.visible = true; P.batt.children[0].visible = P.batt.children[1].visible = false;
  say('Питание подключено. Чёрный бочонок у разъёма - <b>конденсатор</b>: он гасит скачки напряжения, без него в видео будут помехи.'); setTimeout(stackStage, 2600); }

/* ---------- этапы ---------- */
function intro() { stage = 'intro'; getDriver(false); getDriver(true); A.G.position.set(9, 13, -2); go(VIEW.wide, 0);
  ui.innerHTML = top('МАСТЕРСКАЯ · ' + (LV === 1 ? 'МЛАДШИЕ' : 'ГОНОЧНЫЙ 3"'), 'Собери дрон') + '<div class="bub glass" id="say"><div id="sayT"></div></div><button class="btn" id="go">Начать сборку</button>';
  say(K('Привет, пилот! Собираем <b>гоночный дрон</b>, как в настоящей мастерской: ставим детали, крутим винты, подключаем провода. Все детали лежат на столе.',
    'Привет, пилот! Собираем <b>гоночный дрон 3 дюйма</b> от начала до конца, как в настоящей мастерской: детали, винты, пайка, разъёмы и проверка. На столе есть и <b>лишние</b> детали - от других дронов.')); $('#go').onclick = lesson; }
/* ---------- урок, тест и показ сборки перед своей сборкой ---------- */
var LESSON = [
  [['frame'], K('Это <b>рама</b> из карбона - скелет дрона. На ней уже стоят <b>стойки</b>: на них сядет электроника.', 'Это <b>рама 3 дюйма</b> из карбона: лёгкая и прочная. Четыре <b>стойки</b> M3 держат стек электроники, сверху его закроет <b>верхняя пластина</b>.')],
  [['m0', 'm1', 'm2', 'm3'], K('<b>Моторы</b> ставят на концы лучей. У мотора <b>три провода</b>. Два мотора крутятся в одну сторону, два - в другую.', '<b>Моторы 1404</b>: 14 мм - диаметр, 04 - высота статора. У мотора <b>три провода</b> - три обмотки, <b>плюса и минуса нет</b>. Направление вращения зависит от порядка проводов: поменяешь любые два - мотор закрутится наоборот. Крепятся четырьмя винтами <b>M2</b> снизу через луч.')],
  [['esc'], K('<b>Регулятор</b> раздаёт ток моторам. Он стоит в самом низу, к нему припаивают провода моторов и аккумулятора.', '<b>Регулятор 4в1 (ESC) 20x20</b> - нижняя плата стека. Он управляет всеми четырьмя моторами: к нему <b>паяют</b> по три провода каждого мотора и толстые провода питания. Конденсатор на питании гасит скачки напряжения.')],
  [['fc'], K('<b>Полётный контроллер</b> - мозг дрона. Он ставится над регулятором, к нему подключают всё остальное.', '<b>Полётный контроллер 20x20</b> - мозг: гироскоп чувствует наклоны, процессор управляет моторами. Ставится над регулятором <b>стрелкой к носу</b>, соединяется с ним кабелем. К нему же подключают камеру, видеопередатчик и приёмник - <b>разъёмами</b>.')],
  [['cam'], K('<b>Камера</b> стоит спереди и смотрит вперёд - через неё пилот видит полёт.', '<b>Камера</b> стоит спереди на двух винтах: ими выставляют угол наклона. Видео идёт в полётник, он накладывает на картинку цифры: напряжение, время.')],
  [['vtx', 'ant'], K('<b>Видеопередатчик</b> с <b>антенной</b> отправляет картинку в очки.', '<b>Видеопередатчик (VTX)</b> отправляет картинку в очки на 5,8 ГГц через <b>антенну</b> с разъёмом u.FL. Без антенны VTX включать нельзя - сгорит.')],
  [['rx'], K('<b>Приёмник</b> ловит команды с пульта.', '<b>Приёмник (RX)</b> ловит команды пульта и по проводам TX/RX передаёт их полётнику. Крепится сверху, на верхнюю пластину.')],
  [['p0', 'p1', 'p2', 'p3'], K('<b>Пропеллеры</b> ставят в самом конце. Пропеллер ставят на мотор со стрелкой <b>того же цвета</b>.', '<b>Пропеллеры 3 дюйма</b> - последний шаг, только без аккумулятора. Лопасти изогнуты в разные стороны: пропеллер ставят на мотор с тем же направлением вращения и затягивают гайкой.')],
  [['lipo'], K('<b>Аккумулятор</b> - батарейка дрона. Его ставят в самом конце, перед полётом, и крепят ремешком.', '<b>Аккумулятор LiPo 4S</b>: 4 банки, 14,8 вольта, 650 миллиампер-часов. Ставится на верхнюю пластину под ремешок, подключается разъёмом <b>XT30</b> - только перед полётом.')],
  [['frame'], K('Порядок такой: моторы и винты, регулятор, электроника с разъёмами, проверка, пропеллеры и аккумулятор.', 'Порядок сборки: моторы и винты, регулятор, <b>пайка</b> моторов и питания с проверкой вращения, стек и <b>разъёмы</b>, проверка через смоук-стоппер, пропеллеры и в самом конце <b>аккумулятор</b>. Сначала проверим, что ты запомнил.')] ];
var QUIZ = LV > 1 ? [
  ['Сколько проводов у мотора и где у него плюс?', [['3 провода, плюса и минуса нет'], ['2 провода: плюс и минус', 'У бесколлекторного мотора <b>три</b> провода - три обмотки. Плюса и минуса у него нет.'], ['4 провода, плюс красный', 'У мотора <b>три</b> провода, и полярности у них нет: регулятор сам по очереди подаёт ток на обмотки.']]],
  ['Мотор крутится не в ту сторону. Что делаем?', [['Меняем местами два провода'], ['Меняем мотор', 'Мотор исправен! Достаточно <b>поменять местами любые два провода</b> - он закрутится наоборот.'], ['Ставим пропеллер наоборот', 'Пропеллер вверх ногами будет толкать дрон вниз. Направление меняют проводами: <b>любые два местами</b>.']]],
  ['Что ставят на стойки первым, в самый низ?', [['Регулятор (ESC)'], ['Полётный контроллер', 'Полётник ставят <b>над</b> регулятором: внизу толстые провода питания и моторов идут к регулятору.'], ['Видеопередатчик', 'Видеопередатчик ставят выше. Внизу - <b>регулятор</b>: к нему паяют моторы и питание.']]] ] : [
  ['Куда ставят моторы?', [['На концы лучей'], ['В центр рамы', 'В центре стоит электроника. Моторы - <b>на концах лучей</b>.']]],
  ['Какой пропеллер на какой мотор?', [['Со стрелкой того же цвета'], ['Любой на любой', 'Пропеллеры изогнуты в разные стороны. Ставь на мотор со стрелкой <b>того же цвета</b>.']]] ];
var lessonSp = [], tmpShown = [];
function cloneBare(o) { var keep = []; o.traverse(function (n) { keep.push([n, n.userData]); n.userData = {}; }); var c = o.clone(); keep.forEach(function (k) { k[0].userData = k[1]; }); return c; } /* userData деталей ссылается само на себя - копию делаем без него */
function showTmp(pk) { if (pk.state !== 'hide' || pk.o.visible) return; var p = pk.pile; pk.o.position.set(p[0], p[1], p[2]); pk.o.rotation.set(0, p[3], 0); pk.o.visible = true; tmpShown.push(pk); }
function hideTmp() { tmpShown.forEach(function (pk) { pk.o.visible = false; }); tmpShown = []; }
function lessonGlow(ids) { lessonSp.forEach(function (g) { FX.remove(g); }); lessonSp = []; var c = V(0, 0, 0), n = 0;
  ids.forEach(function (id) { var p = V(0, 0, 0); if (id === 'frame') p = W(V(0, 1, 0)); else { showTmp(byId(id)); byId(id).o.getWorldPosition(p); } c.add(p); n++; if (id !== 'frame') { var g = A.glow('#ffd166', 4, .85); g.position.copy(p).add(V(0, 1, 0)); g.userData.p = p; FX.add(g); lessonSp.push(g); } });
  c.multiplyScalar(1 / n); var spread = ids[0] === 'frame' ? 6 : 3.6; lessonSp.forEach(function (g) { spread = Math.max(spread, Math.abs(g.position.x - c.x) + 2.5, Math.abs(g.position.z - c.z) * 1.2 + 2.5); }); go(function () { return fit(c, V(.15, 1, .75), spread, spread, 40, 1); }, 1.1); }
function lesson() { stage = 'lesson'; A.G.visible = false; H = {}; var i = 0;
  head('УРОК · ДЕТАЛИ ДРОНА', 'Из чего собираем', '<div class="tools"><button class="tb" id="skip">Пропустить</button><button class="tb hold" id="nx">Дальше ›</button></div>');
  function show() { var L = LESSON[i]; lessonGlow(L[0]); say(L[1]); hint(''); $('#nx').innerHTML = i < LESSON.length - 1 ? 'Дальше ›' : 'К тесту ›'; }
  $('#nx').onclick = function () { i++; if (i < LESSON.length) show(); else quiz(); }; $('#skip').onclick = function () { if (window.GOLOS) GOLOS.stop(); lessonGlow([]); hideTmp(); assembleA(); }; show(); }
function quiz() { stage = 'quiz'; var i = 0; lessonGlow(['frame']); head('ТЕСТ ПЕРЕД СБОРКОЙ', 'Проверь себя', '');
  function q() { if (i >= QUIZ.length) return demo(); say('<b>Вопрос ' + (i + 1) + ' из ' + QUIZ.length + '.</b> ' + QUIZ[i][0]); ask(QUIZ[i][1], 0, function () { toast('✓ Верно'); i++; setTimeout(q, 400); }); }
  q(); }
/* показ: копии деталей сами встают на места, потом исчезают - собирать будешь сам */
function demo() { stage = 'demo'; H = {}; lessonGlow([]); go(VIEW.pileB, 1.2); head('ПОКАЗ СБОРКИ', 'Смотри, как собирают', '<div class="tools"><button class="tb" id="skip">Пропустить показ</button></div>');
  var seq = [['m0', 'm1', 'm2', 'm3'], ['esc'], ['fc'], ['vtx'], ['cam'], ['top'], ['rx', 'ant'], ['p0', 'p1', 'p2', 'p3'], ['lipo']];
  var cap = [K('Сначала моторы - на концы лучей, и прикручиваем винтами.', 'Моторы на лучи, 16 винтов M2 снизу.'), K('Регулятор - на стойки, в самый низ.', 'Регулятор на стойки, паяем моторы и питание.'), K('Полётный контроллер - над регулятором.', 'Полётник над регулятором, стрелкой к носу, кабель к регулятору.'),
    K('Видеопередатчик.', 'Видеопередатчик на стек, разъём к полётнику.'), K('Камера спереди.', 'Камера на два винта, разъём к полётнику.'), K('Верхняя пластина закрывает стек.', 'Верхняя пластина на 4 винта.'), K('Приёмник и антенна сверху.', 'Приёмник и антенна, разъёмы.'), K('Пропеллеры.', 'Проверка, потом пропеллеры.'), K('И аккумулятор. Готово!', 'Аккумулятор на пластину, разъём XT30. Готово!')];
  var clones = [], k = 0, stop = false;
  function home(id) { return id[0] === 'm' && id.length === 2 ? X.home[id] : id[0] === 'p' && id.length === 2 ? X.home[id] : X.home[id]; }
  function stepD() { if (stop) return; if (k >= seq.length) return wait(1.6, finish); say(cap[k]);
    seq[k].forEach(function (id, n) { var pk = byId(id); showTmp(pk); var c = cloneBare(pk.o); c.visible = true; pk.o.parent.add(c); pk.o.visible = false; clones.push([pk, c]); var h = home(id); wait(n * .15, function () { if (!stop) fly(c, h.p.clone(), h.r, .7); }); });
    k++; wait(2.4, stepD); }
  function finish() { if (stop) return; stop = true; say(K('Вот так! <b>Теперь собери сам.</b>', 'Вот и вся сборка. <b>Теперь собери сам</b> - с винтами, пайкой и разъёмами.'));
    tween(.5, function (e) { clones.forEach(function (q) { q[1].scale.setScalar(Math.max(.01, 1 - e)); }); }, function () { clones.forEach(function (q) { q[1].parent.remove(q[1]); q[0].o.visible = true; }); clones = []; hideTmp(); wait(1.2, assembleA); }); }
  $('#skip').onclick = function () { if (stop) return; if (window.GOLOS) GOLOS.stop(); finish(); }; wait(1.2, stepD); }
function assembleA() { stage = 'A'; phase = 'A'; A.G.visible = false; view0 = VIEW.pileA; go(VIEW.pileA, 1.4);
  head('СБОРКА · ВИД СВЕРХУ', 'Рама и моторы', '<div class="hint" id="hint">Тяни деталь со стола на раму</div>'); setStep(ST.mot);
  say('На раме уже стоят стойки. <b>Найди моторы</b> и поставь их на концы лучей - на светящиеся круги.'); marks(); pileMode();
  onAllIn = function () { return nMot() === 4; }; next = function () { onAllIn = null; screwStage(); }; }
function autoWires() { P.wires.forEach(function (w) { w.visible = true; }); P.batt.visible = true; sparkle(W(V(0, 1.3, 0)), 24);
  say('Провода моторов и питания паяет мастер: у старших это отдельный этап с паяльником. У мотора <b>три провода</b>: от того, как их припаять, зависит, в какую сторону он крутится.'); setTimeout(stackStage, 3600); }
function stackStage() { stage = 'B'; phase = 'B'; view0 = VIEW.pileB; go(VIEW.pileB, 1.4);
  head('СБОРКА · СТЕК И РАЗЪЁМЫ', 'Электроника и камера', '<div class="hint" id="hint">Тяни деталь со стола на дрон</div>'); setStep(ST.stack);
  say(K('Моторы подключены. <b>Что ставим на стойки над регулятором?</b>', 'Регулятор подключён. Дальше электроника: каждую деталь ставим и <b>подключаем разъёмом</b>. <b>Что идёт на стойки над регулятором?</b>')); marks(); pileMode();
  onAllIn = function () { return inst.fc && inst.vtx && inst.cam && inst.top && inst.rx && inst.ant; };
  next = function () { onAllIn = null; clr(MK); checkStage(); }; }
var ARW = new T.Group(); S.add(ARW);
function arrows() { clr(ARW); MP.forEach(function (q, j) { ARW.add(arrowFor(j, j % 2 ? 0xff4fd8 : 0x3ee6ff)); }); }
var spinOn = false;
ticks.push(function (dt) { if (!spinOn) return; motorAt.forEach(function (m, j) { var b = m && m.userData.bell; if (b) b.rotation.y += dt * 30 * needDir(j); }); });
function checkStage() { stage = 'check'; H = {}; go(VIEW.check, 1.2);
  head('ПРОВЕРКА НА СТОЛЕ', 'Первое включение', '<div class="hint" id="hint">Нажимай шаги по порядку</div>'); setStep(ST.check);
  say('Дрон собран, пропеллеров ещё нет. <b>Что делаем по порядку?</b>');
  var items = ['Убедиться, что пропеллеров нет', 'Подключить аккумулятор через смоук-стоппер', 'Проверить, куда крутятся моторы'];
  var WHY = ['Сначала убедись, что <b>пропеллеров нет</b>: при первом включении моторы могут резко крутануться.', 'Аккумулятор - только через <b>смоук-стоппер</b>: если где-то замыкание, он не даст сгореть плате.', 'Сначала проверь, куда крутятся моторы. Если не туда - меняют местами два провода или настройку в программе.'];
  var order = [0, 1, 2].sort(function () { return Math.random() - .5; }), k = 0, box = $('#qs');
  box.innerHTML = order.map(function (i) { return '<button class="w" data-i="' + i + '"><b class="num"></b>' + items[i] + '</button>'; }).join('');
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; if (b.disabled) return;
    if (i !== k) { oops(WHY[k]); return; } b.disabled = true; b.classList.add('ok'); b.querySelector('.num').textContent = k + 1; k++;
    if (i === 0) say('Пропеллеров нет - можно включать. Дальше?');
    if (i === 1) { spinOn = true; say('Смоук-стоппер не загорелся - замыкания нет. Моторы пищат и готовы. Дальше?'); }
    if (i === 2) { arrows(); say('Все моторы крутятся по стрелкам: <b>голубые и розовые</b> - в разные стороны. Так дрон не закручивается вокруг себя.'); setTimeout(propsStage, 2600); } }; }); }
function propsStage() { stage = 'P'; phase = 'P'; spinOn = false; view0 = VIEW.props; go(VIEW.props, 1.3);
  head('СБОРКА · ПРОПЕЛЛЕРЫ', 'Пропеллеры', '<div class="hint" id="hint">Тяни пропеллер на мотор со стрелкой того же цвета</div>'); setStep(ST.props);
  byId('big').pile = [6, .05, -12, 0]; BIG.position.set(6, .05, -12); ['p0', 'p1', 'p2', 'p3', 'bigp'].forEach(function (id) { var pk = byId(id); toPile(pk); var y = pk.o.position.y; pk.o.position.y = y + 8; pk.state = 'fly'; tween(.6, function (e) { pk.o.position.y = y + 8 * (1 - e); }, function () { pk.state = 'pile'; }); });
  say(K('Аккумулятор отключили. Ставим <b>пропеллеры</b>: каждый пропеллер на мотор со стрелкой <b>своего цвета</b>.', 'Аккумулятор отключён - пропеллеры ставят только без питания. Каждый пропеллер - на мотор со стрелкой <b>своего цвета</b>: лопасти у пропеллеров изогнуты в разные стороны.')); marks(); pileMode();
  onAllIn = function () { return nProp() === 4; }; next = function () { onAllIn = null; lipoStage(); }; }
/* ---------- последний шаг: аккумулятор ---------- */
VIEW.lipo = function () { return fit(W(V(-4, 1.8, 2.5)), V(.1, 1, .7), 9.5, 8.5, 40, 1); };
function lipoStage() { stage = 'Z'; phase = 'Z'; view0 = VIEW.lipo; go(VIEW.lipo, 1.3);
  head('ПОСЛЕДНИЙ ШАГ', 'Аккумулятор', '<div class="hint" id="hint">Тяни аккумулятор на верхнюю пластину</div>'); setStep(ST.lipo);
  var pk = byId('lipo'); toPile(pk); var y = pk.o.position.y; pk.o.position.y = y + 8; pk.state = 'fly'; tween(.6, function (e) { pk.o.position.y = y + 8 * (1 - e); }, function () { pk.state = 'pile'; });
  say(K('Остался <b>аккумулятор</b> - это батарейка дрона. Положи его сверху на дрон.', 'Последний шаг - <b>аккумулятор</b>. Его ставят на верхнюю пластину и крепят ремешком. Пропеллеры уже стоят: дальше всё делаем аккуратно.')); marks(); pileMode();
  onAllIn = function () { return !!inst.lipo; }; next = function () { onAllIn = null; done(); }; }
/* ремешок, вопрос о порядке включения, разъём XT30 */
var XT = { a: V(.9, 3.6, 1.0), b: V(2.1, 3.0, 2.2), rest: V(2.5, 1.0, 6.2), to: V(0, .5, 8.55), male: V(0, .5, 7.3) };
function lipoStep(cb) { var st = LIPO.userData.strap; go(function () { return fit(W(V(0, 3.6, -.4)), V(.6, .9, .9), 2.6, 2.6, 40, 1); }, 1);
  st.scale.set(1.25, 1.6, 1); st.position.y = .35;
  wait(1.2, function () { say(K('Затягиваем <b>ремешок</b>: он держит аккумулятор, чтобы тот не слетел в полёте.', 'Затягиваем <b>ремешок</b> туго: снизу резиновая накладка, аккумулятор не должен ёрзать. Слетит в полёте - дрон упадёт.'));
    tween(.9, function (e) { st.scale.set(1.25 - .25 * e, 1.6 - .6 * e, 1); st.position.y = .35 * (1 - e); }, function () { toast('✓ Ремешок затянут'); setTimeout(LV > 1 ? askOrder : plugXT, 1200); }); });
  function askOrder() { say('Перед тем как подключить аккумулятор, <b>что включают первым?</b>'); hint('Выбери ответ в карточке сверху');
    ask([['Пульт, потом очки, потом аккумулятор'], ['Сначала аккумулятор дрона', 'Если дрон включится раньше пульта, он не услышит команд. Порядок: <b>пульт, очки, аккумулятор</b>. Выключают наоборот: сначала отключают аккумулятор.'], ['Неважно', 'Важно! Сначала <b>пульт</b>, чтобы дрон сразу слушался команд, потом <b>очки</b>, и только потом <b>аккумулятор</b>.']], 0,
      function () { say('Верно: пульт, очки, аккумулятор. Пульт и очки уже включены.'); setTimeout(plugXT, 1300); }); }
  function plugXT() { var stub = LIPO.userData.stub; stub.visible = false; var tip = XT.rest.clone(), dr = false, cab = [], cabX = [];
    var plug = new T.Group(); A.mesh(new T.BoxGeometry(.9, .55, 1.0), A.M.yellow, 0, 0, 0, plug); plug.add(xr(new T.Mesh(new T.BoxGeometry(.9, .55, 1.0)))); SF.add(plug);
    var pgl = A.glow('#7cf3ff', 1.6, .8); pgl.material.depthTest = false; pgl.renderOrder = 5; plug.add(pgl);
    var hole = A.glow('#5effc4', 2, .7); hole.material.depthTest = false; hole.renderOrder = 5; hole.position.copy(XT.male).add(V(0, .3, .7)); SF.add(hole);
    var lb = labSprite('XT30'); lb.position.copy(XT.male).add(V(0, 1.0, 0)); SF.add(lb);
    var pulse = function (dt, t) { var a = .5 + Math.sin(t * 6) * .35; pgl.material.opacity = dr ? .3 : a; hole.material.opacity = a; }; ticks.push(pulse);
    function draw() { cab.forEach(function (m) { SF.remove(m); m.geometry.dispose(); }); cabX.forEach(function (m) { SF.remove(m); }); cab = []; cabX = [];
      [[0, A.M.wireR], [-.3, A.M.wireK]].forEach(function (q) { var o = V(q[0], 0, 0), end = tip.clone().add(V(q[0] + .15, 0, -.5)), m = V(0, 0, 0).lerpVectors(XT.b, end, .5); m.y += .4;
        var t = A.tube([XT.a.clone().add(o), XT.b.clone().add(o), m, end], .1, q[1], SF); cab.push(t); var x = xr(new T.Mesh(t.geometry)); SF.add(x); cabX.push(x); }); plug.position.copy(tip); }
    draw(); go(function () { return fit(W(V(1.1, 1.4, 5.6)), V(.55, 1.15, .9), 4.2, 3.6, 40, 1); }, 1.1);
    say(K('Теперь <b>подключи аккумулятор</b>: тяни жёлтый разъём к такому же жёлтому разъёму сзади дрона.', 'Подключаем разъём <b>XT30</b>: он вставляется только одной стороной - скошенные углы должны совпасть. Тяни жёлтый разъём к разъёму на проводах питания сзади.'));
    hint(K('Тяни жёлтый разъём к зелёному кружку', 'Тяни разъём аккумулятора к разъёму XT30'));
    H.down = function (e) { if (dist(scr(W(tip)), e.clientX, e.clientY) < 75) dr = true; else say(K('Тяни <b>жёлтый разъём</b> на проводе аккумулятора - он светится.', 'Тяни <b>разъём аккумулятора</b> - светящуюся жёлтую коробочку.')); };
    H.move = function (e) { if (!dr) return; var h = planeHit(e, 1.0); if (h) { tip.set(h.x, 1.0, h.z - 2); draw(); } };
    H.up = function (e) { if (!dr) return; dr = false;
      if (dist(scr(W(XT.male)), e.clientX, e.clientY) > 80) { var t0 = tip.clone(); tween(.35, function (e2) { tip.lerpVectors(t0, XT.rest, e2); draw(); }); say(K('Отпусти разъём прямо у <b>зелёного кружка</b>.', 'Отпусти разъём прямо у разъёма <b>XT30</b> сзади дрона.')); return; }
      H = {}; var t0 = tip.clone(); tween(.45, function (e2) { tip.lerpVectors(t0, XT.to, e2); draw(); }, function () {
        ticks.splice(ticks.indexOf(pulse), 1); plug.remove(pgl); SF.remove(hole); SF.remove(lb); cabX.forEach(function (m) { SF.remove(m); }); plug.remove(plug.children[1]);
        sparkle(W(XT.male), 14); toast('♪ Пик-пик-пик! Аккумулятор подключён');
        var led = A.glow('#5effc4', 1.2, .95); led.position.copy(W(V(.9, 2.15, -1.2))); FX.add(led);
        say(K('Дрон пискнул - он <b>проснулся</b> и готов к полёту! Отходим подальше от пропеллеров.', 'Регуляторы пропищали мелодию, на полётнике загорелся огонёк - <b>всё работает</b>. Дрон на землю, сами отходим подальше от пропеллеров.'));
        setTimeout(function () { FX.remove(led); cb(); }, 2800); }); }; } }
function done() { step = TOTAL; stage = 'done'; H = {}; clr(MK); clr(ARW); hintOff();
  PK.forEach(function (pk) { if (pk.state !== 'inst') pk.o.visible = false; });
  for (var j = 0; j < 4; j++) { P.motors[j] = motorAt[j]; P.props[j] = propAt[j]; }
  A.G.visible = true; A.G.position.set(-9, 14, -5); go(VIEW.done, 1.6); spinOn = true;
  tween(1.8, function (e) { D.position.y = e * 9; D.rotation.set(.08 * e, .5 * e, -.06 * e); }, function () {
    D.updateMatrixWorld(true); propAt.forEach(function (p) { p.visible = false; }); SCR.children.forEach(function (s) { if (s.position.y > 2.6) s.visible = false; });
    motorAt.forEach(function (m, i) { var w = V(0, 0, 0); m.localToWorld(w.set(0, 2.0, 0)); X.blur(w, i % 2 ? '#ff4fd8' : '#3ee6ff'); }); X.sparks(V(0, 10, 2), 40, 16); });
  ticks.push(function (dt, t) { if (D.position.y > 8.9) D.position.y = 9 + Math.sin(t * 2.2) * .35; });
  var pts = Math.max(30, 100 - err * 4), best = +(localStorage.getItem('kursy_fpv_sborka') || 0); if (pts > best) localStorage.setItem('kursy_fpv_sborka', pts);
  ui.innerHTML = top('МАСТЕРСКАЯ', 'Сборка завершена') + '<div class="big"><b>ДРОН СОБРАН!</b><span>' + K('Ты собрал дрон: детали, винты, разъёмы и аккумулятор', 'Гоночный 3 дюйма · 14 паек · 30 винтов · 6 разъёмов') + '</span><br><div class="stats"><span>ошибок: ' + err + '</span><span style="color:#5effc4">+' + pts + ' "Сборка"</span></div></div>' +
    '<div class="bub glass end" id="say"><div id="sayT"></div></div><button class="next" id="again" title="Ещё раз">↻</button>';
  say(err ? 'Дрон летает! Ошибок было: ' + err + '. Попробуй ещё раз без ошибок - очков будет больше.' : 'Без единой ошибки! <b>Ты собрал гоночный дрон</b> как настоящий техник.'); $('#again').onclick = function () { location.reload(); }; }

intro(); requestAnimationFrame(loop);
/* для проверки в браузере */
window.SBG = { iron: function () { return IRON; }, A: A, PK: PK, byId: byId, scr: scr, W: W, DW: DW, MP: MP, openSlots: openSlots, padM: padM, PADV: PADV, GR: GR, heat: heat, SOCK: SOCK, SCR: SCR,
  scrl: function () { return SCRL; }, scrn: function () { return SCRN; }, conn: function () { return CONN; }, DW2: DW,
  st: function () { return { stage: stage, phase: phase, err: err, step: step, ready: !!H.down, cam: !!camTw, cur: cur && { st: cur.st, gi: gi, dragW: !!cur.dragW, freed: cur.freed } }; },
  jump: function (n) { /* только для проверки: сразу к этапу */
    for (var j = 0; j < 4; j++) { var pk = byId('m' + j); pk.state = 'inst'; motorAt[j] = pk.o; pk.o.position.copy(X.home['m' + j].p); pk.o.rotation.copy(X.home['m' + j].r); }
    clr(MK); if (n === 'screw') { screwStage(); return; }
    inst.esc = true; var e = byId('esc'); e.state = 'inst'; e.o.position.copy(X.home.esc.p); e.o.rotation.copy(X.home.esc.r);
    if (n === 'solder') { phase = ''; solderStage(); return; }
    P.wires.forEach(function (w) { w.visible = true; }); P.batt.visible = true;
    if (n === 'R') ['fc', 'vtx', 'cam', 'top'].forEach(function (k) { var pk = byId(k); pk.state = 'inst'; inst[k] = true; pk.o.position.copy(X.home[k].p); pk.o.rotation.copy(X.home[k].r); });
    if (n === 'B' || n === 'R') { stackStage(); return; }
    ['fc', 'vtx', 'cam', 'top', 'rx', 'ant'].forEach(function (k) { var pk = byId(k); pk.state = 'inst'; inst[k] = true; pk.o.position.copy(X.home[k].p); pk.o.rotation.copy(X.home[k].r); });
    if (n === 'Z') { for (j = 0; j < 4; j++) { var pp = byId('p' + j); pp.state = 'inst'; propAt[j] = pp.o; pp.o.visible = true; pp.o.position.copy(X.home['p' + j].p); pp.o.rotation.copy(X.home['p' + j].r); } lipoStage(); return; }
    if (n === 'check') checkStage(); else propsStage(); } };
})();
