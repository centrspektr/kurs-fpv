/* Игра "Собери дрон": пробная версия. Сцена - scene.js, раскладка и эффекты - stage.js */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var LV = (window.SB_LV === 1 || /[?&]lv=1/.test(location.search)) ? 1 : 2; /* 1 - младшие (без пайки и проводов), 2 - старшие */
var cv = $('#c'), ui = $('#ui');
var DPR = Math.min(window.devicePixelRatio || 1, 1.6);
var A = SB(cv, innerWidth * DPR, innerHeight * DPR), RUN = SBStage(A), X = RUN.api, P = A.P, V = A.V, THREE = window.THREE;
A.cam.aspect = innerWidth / innerHeight; A.cam.updateProjectionMatrix();
addEventListener('resize', function () { A.r.setSize(innerWidth * DPR, innerHeight * DPR, false); A.cam.aspect = innerWidth / innerHeight; A.cam.updateProjectionMatrix(); });

/* ---------- камера и анимации ---------- */
var CAM = { 1: [[8, 30, 48], [0, 6, -6], 50], 2: [[3, 29, 21], [-1, 0, -1.2], 40], 3: [[-6.5, 6.5, 8], [-1.4, 1.4, .9], 34], 4: [[2, 18, 33], [0, 9.5, 1], 46],
  5: [[-12, 9, 15], [0, 5.6, 1.5], 42], 6: [[14, 22, 44], [0, 7.5, 0], 34], 7: [[12, 20, 30], [0, 2, 1], 40] };
var camL = V(0, 6, -6), tw = [];
function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function tween(dur, fn, done) { tw.push({ t: 0, d: dur, fn: fn, done: done }); }
function camTo(k, dur) { var c = CAM[k], p0 = A.cam.position.clone(), l0 = camL.clone(), f0 = A.cam.fov, p1 = V(c[0][0], c[0][1], c[0][2]), l1 = V(c[1][0], c[1][1], c[1][2]);
  if (!dur) { A.cam.position.copy(p1); camL.copy(l1); A.cam.fov = c[2]; A.cam.updateProjectionMatrix(); return; }
  tween(dur, function (e) { A.cam.position.lerpVectors(p0, p1, e); camL.lerpVectors(l0, l1, e); A.cam.fov = f0 + (c[2] - f0) * e; A.cam.updateProjectionMatrix(); }); }
function drop(o, from, dur, done) { var to = o.position.clone(); o.position.copy(from); tween(dur || .8, function (e) { o.position.lerpVectors(from, to, e); }, done); }
var last = performance.now(), spin = [];
function loop(now) { var dt = Math.min(.05, (now - last) / 1000); last = now;
  for (var i = tw.length - 1; i >= 0; i--) { var q = tw[i]; q.t += dt / q.d; var e = ease(Math.min(1, q.t)); q.fn(e); if (q.t >= 1) { tw.splice(i, 1); if (q.done) q.done(); } }
  var t = now / 1000; A.G.position.y += Math.sin(t * 2) * .01; A.G.rotation.z = Math.sin(t * 1.3) * .05;
  spin.forEach(function (f) { f(dt, t); });
  A.cam.lookAt(camL); A.render(); requestAnimationFrame(loop); }

/* ---------- интерфейс ---------- */
var TOTAL = LV === 1 ? 6 : 8, step = 0, err = 0;
function top(s, t) { return '<div class="top"><a class="ic" href="javascript:history.back()">←</a><div class="ttl"><small>' + s + '</small><b>' + t + '</b></div><div class="ic" id="err" title="ошибки">' + err + '</div></div>'; }
function bars() { var o = '<div class="bars">'; for (var i = 0; i < TOTAL; i++) o += '<i class="' + (i < step ? 'd' : i === step ? 'h' : '') + '"></i>'; return o + '</div>'; }
var WHO = '<div class="who"><i></i><span>ПРОВОДНИК</span></div>';
function set(html) { ui.innerHTML = html; }
function say(txt, bad) { var b = $('#say'); if (!b) return; b.innerHTML = (bad ? '<span class="chip bad">ОШИБКА</span><br>' : WHO) + txt; b.classList.toggle('bad', !!bad); if (bad) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } }
function oops(txt) { err++; var e = $('#err'); if (e) e.textContent = err; say(txt, true); if (navigator.vibrate) navigator.vibrate(60); }
function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1900); }
function choice(opts, ok, onOk) { /* opts: [[svg, текст, пояснение-ошибки]], ok - номер верного */
  var box = $('#ch'); box.innerHTML = opts.map(function (o, i) { return '<button class="glass" data-i="' + i + '">' + o[0] + '<span>' + o[1] + '</span></button>'; }).join('');
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; if (i === ok) { b.classList.add('ok'); box.querySelectorAll('button').forEach(function (z) { z.disabled = true; }); onOk(); } else { b.classList.add('no'); setTimeout(function () { b.classList.remove('no'); }, 600); oops(opts[i][2]); } }; }); }
var IC = { mot: '<svg viewBox="0 0 40 30"><circle cx="20" cy="15" r="11" fill="#ff4f9a"/><circle cx="20" cy="15" r="3.5" fill="#ddd"/></svg>',
  esc: '<svg viewBox="0 0 40 30"><rect x="6" y="4" width="28" height="22" rx="3" fill="#23252c"/><rect x="9" y="7" width="6" height="4" fill="#e6b94a"/><rect x="25" y="19" width="6" height="4" fill="#e6b94a"/></svg>',
  fc: '<svg viewBox="0 0 40 30"><rect x="6" y="4" width="28" height="22" rx="3" fill="#0f4a33"/><rect x="15" y="10" width="10" height="10" fill="#111"/><circle cx="29" cy="8" r="2" fill="#5effc4"/></svg>',
  prop: '<svg viewBox="0 0 40 30"><path d="M3 15 Q20 3 37 15 Q20 27 3 15Z" fill="#3ee6ff99"/></svg>',
  bat: '<svg viewBox="0 0 40 30"><rect x="5" y="8" width="30" height="14" rx="2" fill="#f2c230"/></svg>',
  cam: '<svg viewBox="0 0 40 30"><rect x="10" y="6" width="18" height="18" rx="3" fill="#2a2d36"/><circle cx="19" cy="15" r="6" fill="#3b5bdb"/></svg>' };

/* ---------- состояние дрона ---------- */
var inst = ['so'];
function lay() { X.layout(inst); }
function has(k) { return inst.indexOf(k) >= 0; }

/* ---------- этапы ---------- */
var S = [];
S.push(function intro() { lay(); X.clearFx(); A.G.position.set(9, 13, -2); camTo(1, 0);
  set(top('МАСТЕРСКАЯ · ' + (LV === 1 ? 'МЛАДШИЕ' : 'ГОНОЧНЫЙ 3"'), 'Собери дрон') + '<div class="bub glass" id="say" style="bottom:100px"></div><button class="btn" id="go">Начать сборку</button>');
  say('Привет, пилот! Сегодня собираем <b>гоночный дрон 3 дюйма</b>. Все детали уже на столе. Начнём с моторов!'); $('#go').onclick = next; });

S.push(function motors() { camTo(2, 1.4); A.G.position.set(6, 12, -7);
  set(top('ВИД СВЕРХУ', 'Рама и моторы') + bars() + '<div class="bub glass" id="say" style="top:88px"></div><div class="tray glass"><div class="l">ДЕТАЛИ НА СТОЛЕ · ТЯНИ ПАЛЬЦЕМ</div><div class="parts">' +
    '<div class="pt go" data-k="mot">' + IC.mot + '<span id="mc">Мотор ×4</span></div><div class="pt" data-k="esc">' + IC.esc + 'Регулятор</div><div class="pt" data-k="prop">' + IC.prop + 'Пропеллеры</div></div></div>');
  say('Поставь <b>моторы</b> на лучи рамы. Тяни мотор из лотка на светящееся место.');
  var slots = A.MP.map(function (q, j) { return { j: j, w: X.W(V(q[0], .5, q[1])) }; });
  function rings() { X.clearFx(); slots.forEach(function (s) { if (!has('m' + s.j)) X.ring(s.w, 0xc77dff, 1.3); }); }
  rings();
  var ghost = null, ray = new THREE.Raycaster(), pl = new THREE.Plane(V(0, 1, 0), -4), hit = V(0, 0, 0);
  function at(e) { var r = cv.getBoundingClientRect(); ray.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, A.cam); ray.ray.intersectPlane(pl, hit); return hit; }
  function scr(w) { var p = w.clone().project(A.cam); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; }
  document.querySelectorAll('.pt').forEach(function (el) { el.onpointerdown = function (e) { e.preventDefault(); var k = el.dataset.k;
    if (k === 'esc') { oops('Регулятор ставим после моторов: к нему потом паяем провода моторов.'); return; }
    if (k === 'prop') { oops('Пропеллеры - в самом конце, после проверки на столе. Иначе дрон может раскрутить винты прямо в руках!'); return; }
    ghost = A.motor(); A.S.add(ghost); ghost.scale.setScalar(1.15); ghost.position.copy(at(e)); el.classList.add('drag');
    function mv(ev) { ghost.position.copy(at(ev)); var best = null, bd = 1e9; slots.forEach(function (s) { if (has('m' + s.j)) return; var p = scr(s.w), d = Math.hypot(p.x - ev.clientX, p.y - ev.clientY); if (d < bd) { bd = d; best = s; } }); ghost.userData.near = bd < 70 ? best : null; ghost.position.y = ghost.userData.near ? 2.5 : 4; }
    function up(ev) { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); el.classList.remove('drag'); var s = ghost.userData.near; A.S.remove(ghost); ghost = null; if (step !== 1) return;
      if (!s) { say('Чуть-чуть мимо. Отпусти мотор прямо над <b>светящимся кругом</b>.'); return; }
      inst.push('m' + s.j); lay(); rings(); var m = P.motors[s.j]; drop(m, m.position.clone().add(V(0, 3, 0)), .35);
      var left = 4 - inst.filter(function (k) { return /^m\d/.test(k); }).length; $('#mc').textContent = 'Мотор ×' + left; toast('✓ Мотор на месте');
      if (!left) { document.querySelectorAll('.pt').forEach(function (z) { z.onpointerdown = null; }); X.clearFx(); say('Все 4 мотора стоят! Отлично.'); setTimeout(next, 900); } else say('Есть! Осталось моторов: <b>' + left + '</b>.'); }
    addEventListener('pointermove', mv); addEventListener('pointerup', up); }; }); });

S.push(function escStep() { camTo(5, 1.3); A.G.position.set(-7, 11, -4); X.clearFx();
  set(top('ВИД СБОКУ', 'Стек плат') + bars() + '<div class="bub glass" id="say" style="top:88px"></div><div class="ch" id="ch"></div>');
  say('Моторы стоят. <b>Какую плату ставим на стойки первой</b>, в самый низ?');
  choice([[IC.fc, 'Полётный контроллер', 'Полётник ставим сверху: к нижней плате идут толстые провода моторов и питания, это регулятор.'], [IC.esc, 'Регулятор (ESC)'], [IC.prop, 'Пропеллеры', 'Пропеллеры ставим только в самом конце.']], 1,
    function () { inst.push('esc'); lay(); drop(P.esc, P.esc.position.clone().add(V(0, 5, 0)), .9, function () { toast('✓ Регулятор на месте'); setTimeout(next, 500); }); say('Верно! Регулятор управляет моторами, к нему идут толстые провода.'); }); });

if (LV > 1) S.push(function solder() { camTo(3, 1.5); A.G.visible = false; inst = inst.concat(['w0', 'w2', 'w3']); lay(); P.wires[1].visible = true;
  set(top('КРУПНО · ПАЙКА', 'Провод мотора') + bars() + '<div class="bub glass" id="say" style="top:88px"></div><div class="heat glass" id="heat"><div class="hl0">НАГРЕВ</div><div class="hb"><i id="hm" style="left:0"></i></div><div class="hl"><span>мало - холодная</span><span>в самый раз</span><span>перегрев</span></div></div><button class="hold" id="hold">Нанести флюс</button>');
  var pad = X.W(V(-1.33, 1.25, -1.33)), ph = 0, h = 0, holding = false, blob = null;
  function scene() { X.clearFx(); if (ph >= 1 && ph <= 3) X.iron(pad, V(.75, 1.1, -.7)); if (ph === 1 && holding) X.smoke(pad); if (ph === 2) A.tube([V(pad.x - 5, pad.y + 5, pad.z + 2), V(pad.x - 2.2, pad.y + 1.8, pad.z + 1), V(pad.x + .25, pad.y + .15, pad.z + .3)], .07, A.M.steel, X.fx);
    if (ph >= 3) { blob = A.mesh(new THREE.SphereGeometry(.22, 16, 10), A.M.steel, pad.x, pad.y - .02, pad.z, X.fx); blob.scale.set(1, .55, 1); } }
  var hold = $('#hold'), hm = $('#hm');
  say('Паяем провод мотора к площадке регулятора. Сначала <b>флюс</b>: он очищает металл, и припой растекается ровно.');
  hold.onclick = function () { if (ph === 0) { ph = 1; scene(); hold.textContent = 'Держи - греем'; hold.classList.add('y'); say('Прижми жало к площадке и проводу. <b>Держи кнопку</b> и отпусти, когда полоса в зелёной зоне.'); return; }
    if (ph === 2) { ph = 3; scene(); hold.textContent = 'Убрать жало'; say('Припой растёкся. Теперь <b>убери жало</b> и не шевели провод пару секунд.'); return; }
    if (ph === 3) { ph = 4; scene(); hold.disabled = true; say('Пайка блестит и лежит конусом - <b>отлично!</b> Остальные 11 проводов припаяны так же.'); toast('✓ Пайка готова'); setTimeout(function () { A.G.visible = true; inst.push('w1'); next(); }, 1600); } };
  function heatOn(e) { if (ph !== 1) return; e.preventDefault(); holding = true; h = 0; scene(); }
  function heatOff() { if (ph !== 1 || !holding) return; holding = false; scene();
    if (h < .34) { hm.style.left = '0'; oops('Мало прогрел: получится <b>холодная пайка</b> - матовый шарик, провод отвалится. Держи дольше.'); return; }
    if (h > .68) { hm.style.left = '0'; oops('Перегрев! Площадка может отслоиться от платы. Отпускай раньше, в зелёной зоне.'); return; }
    ph = 2; scene(); hold.textContent = 'Подать припой'; say('Нагрел как надо! Теперь <b>подай припой</b> к площадке, а не на жало.'); }
  hold.addEventListener('pointerdown', heatOn); hold.addEventListener('pointerup', heatOff); hold.addEventListener('pointerleave', heatOff);
  spin.push(function (dt) { if (ph === 1 && holding) { h = Math.min(1.05, h + dt / 2.6); hm.style.left = Math.min(100, h * 100) + '%'; if (h > 1) heatOff(); } }); });

if (LV > 1) S.push(function wires() { camTo(4, 1.5); A.G.position.set(-11, 15, 0); inst.push('fc', 'batt'); lay(); P.fc.visible = false;
  set(top('ГОЛОГРАММА · СХЕМА', 'Провода питания') + bars() + '<div class="bub glass" id="say" style="bottom:20px"></div><div id="pads"></div>');
  var st = { r: 0, k: 0 }, tex, plane;
  var PADS = [['M1', 360, 190], ['M2', 640, 190], ['M3', 360, 470], ['M4', 640, 470], ['VBAT', 450, 490], ['GND', 560, 490]];
  function draw() { if (plane) X.fx.remove(plane); tex = A.cTex(1024, 640, function (x, w, h) {
      x.fillStyle = 'rgba(10,40,80,.35)'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(124,243,255,.15)'; x.lineWidth = 1; for (var i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
      x.strokeStyle = '#7cf3ff'; x.lineWidth = 4; x.strokeRect(6, 6, w - 12, h - 12); x.shadowColor = '#7cf3ff'; x.shadowBlur = 14;
      x.fillStyle = 'rgba(30,120,90,.45)'; x.strokeStyle = '#5effc4'; x.lineWidth = 3; x.fillRect(330, 150, 360, 360); x.strokeRect(330, 150, 360, 360);
      x.font = '700 30px monospace'; x.fillStyle = '#e9fff6'; x.fillText('РЕГУЛЯТОР (ESC)', 380, 130);
      PADS.forEach(function (p) { x.fillStyle = '#e6b94a'; x.fillRect(p[1] - 26, p[2] - 20, 52, 34); x.fillStyle = '#e9fff6'; x.font = '700 22px monospace'; x.fillText(p[0], p[1] - 26, p[2] + (p[2] > 300 ? -28 : 48)); });
      function wire(c, a, dash) { x.strokeStyle = c; x.shadowColor = c; x.lineWidth = 9; x.setLineDash(dash ? [14, 12] : []); x.beginPath(); x.moveTo(a[0], a[1]); x.bezierCurveTo(a[2], a[3], a[4], a[5], a[6], a[7]); x.stroke(); x.setLineDash([]); }
      wire('#ff3b4a', st.r ? [950, 600, 800, 600, 470, 600, 450, 505] : [950, 600, 900, 600, 860, 600, 840, 600], !st.r);
      wire('#bfc6d8', st.k ? [950, 560, 760, 560, 600, 560, 560, 505] : [950, 560, 900, 560, 860, 560, 840, 560], !st.k);
      x.fillStyle = '#ff3b4a'; x.beginPath(); x.arc(950, 600, 16, 0, 7); x.fill(); x.fillStyle = '#20232c'; x.strokeStyle = '#bfc6d8'; x.lineWidth = 3; x.beginPath(); x.arc(950, 560, 16, 0, 7); x.fill(); x.stroke();
      x.font = '800 26px sans-serif'; x.fillStyle = '#ff8a92'; x.fillText('+ ПЛЮС', 860, 640); x.fillStyle = '#e9fff6'; x.fillText('− МИНУС', 820, 545);
      if (st.r) { x.strokeStyle = '#5effc4'; x.lineWidth = 5; x.beginPath(); x.arc(450, 490, 36, 0, 7); x.stroke(); }
      if (st.k) { x.strokeStyle = '#5effc4'; x.lineWidth = 5; x.beginPath(); x.arc(560, 490, 36, 0, 7); x.stroke(); } });
    plane = new THREE.Mesh(new THREE.PlaneGeometry(22, 13.75), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); plane.position.set(0, 13.5, 0); plane.rotation.x = -.42; X.fx.add(plane); }
  X.clearFx(); draw();
  var cone = new THREE.Mesh(new THREE.CylinderGeometry(9, 1.4, 10, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x3fd8ff, transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(0, 8, 2); X.fx.add(cone);
  var pg = A.glow('#7cf3ff', 7, .7); pg.position.set(0, 3.2, 2); X.fx.add(pg);
  say('Голограмма показывает плату. <b>Нажми площадку</b>, куда паяем <b>красный провод (плюс)</b> от аккумулятора.');
  function place() { var box = $('#pads'); if (!box) return; plane.updateMatrixWorld(true); box.innerHTML = PADS.map(function (p, i) { var w = V((p[1] / 1024 - .5) * 22, (.5 - p[2] / 640) * 13.75, 0).applyMatrix4(plane.matrixWorld).project(A.cam);
      return '<button class="pad" data-i="' + i + '" style="left:' + ((w.x + 1) / 2 * innerWidth) + 'px;top:' + ((1 - w.y) / 2 * innerHeight) + 'px"></button>'; }).join('');
    box.querySelectorAll('.pad').forEach(function (b) { b.onclick = function () { var n = PADS[+b.dataset.i][0];
      if (!st.r) { if (n === 'VBAT') { st.r = 1; draw(); toast('✓ Плюс на VBAT'); say('Верно! Теперь <b>чёрный провод (минус)</b> - куда его?'); } else oops(n === 'GND' ? 'GND - это минус ("земля"). Красный провод - плюс, ему нужна площадка VBAT.' : 'На ' + n + ' идут провода мотора. Плюс аккумулятора на ' + n + ' сожжёт регулятор! Ищи VBAT.'); return; }
      if (!st.k) { if (n === 'GND') { st.k = 1; draw(); toast('✓ Минус на GND'); say('Питание подключено! Плюс на VBAT, минус на GND.'); setTimeout(next, 1300); } else oops(n === 'VBAT' ? 'VBAT уже занят плюсом. Минус - это GND ("земля").' : n + ' - это площадка мотора. Минус идёт на GND.'); } }; }); }
  place(); var me = step; spin.push(function () { if (step !== me) return; var box = $('#pads'); if (!box) return; plane.updateMatrixWorld(true); box.querySelectorAll('.pad').forEach(function (bt) { var p = PADS[+bt.dataset.i], w = V((p[1] / 1024 - .5) * 22, (.5 - (p[2] - 4) / 640) * 13.75, 0).applyMatrix4(plane.matrixWorld).project(A.cam); bt.style.left = ((w.x + 1) / 2 * innerWidth) + 'px'; bt.style.top = ((1 - w.y) / 2 * innerHeight) + 'px'; }); }); });

S.push(function fcStep() { camTo(5, 1.3); A.G.position.set(-7, 11, -4); X.clearFx(); if (!has('esc')) inst.push('esc'); if (LV === 1) inst.push('w0', 'w1', 'w2', 'w3', 'batt'); if (!has('fc')) inst.push('fc'); lay(); P.fc.visible = false;
  set(top('ВИД СБОКУ', 'Стек плат') + bars() + '<div class="bub glass" id="say" style="top:88px"></div><div class="ch" id="ch"></div>');
  say('Регулятор подключён. <b>Что ставим на стойки сверху?</b>');
  choice([[IC.fc, 'Полётный контроллер'], [IC.prop, 'Пропеллеры', 'Пропеллеры - в самом конце, после проверки.'], [IC.bat, 'Аккумулятор', 'Аккумулятор подключаем только для проверки, через смоук-стоппер.']], 0,
    function () { P.fc.visible = true; drop(P.fc, P.fc.position.clone().add(V(0, 5, 0)), .9, function () { toast('✓ Полётник на месте'); setTimeout(next, 500); }); say('Верно! Полётник - "мозг" дрона, у него гироскоп. Стрелка на плате смотрит к носу.'); }); });

S.push(function camStep() { camTo(7, 1.4); A.G.position.set(9, 13, -2); X.clearFx();
  set(top('МАСТЕРСКАЯ', 'Камера и антенна') + bars() + '<div class="bub glass" id="say" style="top:88px"></div><div class="ch" id="ch"></div>');
  say('Пора поставить <b>камеру</b>. Куда её крепим?');
  choice([[IC.cam, 'Сзади, над аккумулятором', 'Сзади камера будет смотреть назад. Пилот видит то, что видит камера - её ставят на нос.'], [IC.cam, 'Спереди, на нос'], [IC.cam, 'Снизу, под раму', 'Снизу камера будет смотреть в пол и первой ударится при посадке.']], 1,
    function () { ['cam', 'vtx', 'rx', 'top', 'ant'].forEach(function (k) { inst.push(k); }); lay(); drop(P.cam, P.cam.position.clone().add(V(0, 4, -3)), .8); drop(P.top, P.top.position.clone().add(V(0, 5, 0)), 1); drop(P.ant, P.ant.position.clone().add(V(0, 5, 3)), 1.1, function () { toast('✓ Камера, видео и антенна'); setTimeout(next, 600); });
      say('Точно! Камера на носу, сзади видеопередатчик и антенна.'); }); });

S.push(function check() { camTo(7, .8); X.clearFx();
  var items = LV === 1 ? [['Проверить, что пропеллеров нет'], ['Подключить аккумулятор через смоук-стоппер'], ['Поставить пропеллеры']] :
    [['Проверить, что пропеллеров нет'], ['Подключить аккумулятор через смоук-стоппер'], ['Проверить направление моторов'], ['Поставить пропеллеры']];
  set(top('ПРОВЕРКА НА СТОЛЕ', 'Первое включение') + bars() + '<div class="bub glass" id="say" style="top:88px"></div><div class="ch" id="ch"></div>');
  say('Последний этап! Нажимай шаги <b>в правильном порядке</b>.');
  var order = items.map(function (x, i) { return i; }).sort(function () { return Math.random() - .5; }), k = 0, box = $('#ch');
  box.innerHTML = order.map(function (i) { return '<button class="glass" data-i="' + i + '"><b class="num"></b><span>' + items[i][0] + '</span></button>'; }).join('');
  var WHY = ['Сначала убедись, что пропеллеров нет: при первом включении моторы могут резко крутануться.', 'Аккумулятор - только через смоук-стоппер: если где-то замыкание, он не даст сгореть плате.', 'Сначала проверь, куда крутятся моторы. Если не туда - меняем в настройках.', 'Пропеллеры - самый последний шаг, когда всё проверено.'];
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; if (b.disabled) return;
    if (i === k) { b.disabled = true; b.classList.add('ok'); b.querySelector('.num').textContent = (k + 1); k++; if (i === 1) spinMotors(); if (k === items.length) { inst.push('props'); lay(); toast('✓ Всё проверено'); setTimeout(next, 900); } else say('Верно! Дальше?'); }
    else oops(WHY[k]); }; }); });
function spinMotors() { spin.push(function (dt, t) { P.motors.forEach(function (m, i) { var b = m.userData.bell; if (b) b.rotation.y += dt * 30 * (i % 2 ? 1 : -1); }); }); }

S.push(function done() { X.clearFx(); camTo(6, 1.6); inst = X.all8.slice(); lay(); var D = A.D; P.props.forEach(function (p) { p.visible = false; });
  var y0 = 0; tween(1.8, function (e) { D.position.y = e * 9; D.rotation.set(.08 * e, .5 * e, -.06 * e); }, function () {
    D.updateMatrixWorld(true); P.motors.forEach(function (m, i) { var w = V(0, 0, 0); m.localToWorld(w.set(0, 2.0, 0)); X.blur(w, i % 2 ? '#ff4fd8' : '#3ee6ff'); }); X.sparks(V(0, 10, 2), 40, 16); });
  spin.push(function (dt, t) { if (D.position.y > 8.9) { D.position.y = 9 + Math.sin(t * 2.2) * .35; } });
  var pts = Math.max(20, 50 - err * 5), best = +(localStorage.getItem('kursy_fpv_sborka') || 0); if (pts > best) localStorage.setItem('kursy_fpv_sborka', pts);
  set(top('МАСТЕРСКАЯ', 'Сборка завершена') + '<div class="big"><b>ДРОН СОБРАН!</b><span>' + (LV === 1 ? 'Ты собрал дрон по порядку' : 'Гоночный 3 дюйма · проверка пройдена') + '</span><br><div class="stats"><span>' + TOTAL + ' шагов</span><span>ошибок: ' + err + '</span><span style="color:#5effc4">+' + pts + ' "Сборка"</span></div></div>' +
    '<div class="bub glass" id="say" style="bottom:20px;right:96px"></div><button class="next" id="again" title="Ещё раз">↻</button>');
  say(err ? 'Дрон летает! Ошибок было: ' + err + '. Попробуй ещё раз без ошибок - очков будет больше.' : 'Без единой ошибки! <b>Ты собрал гоночный дрон</b> как настоящий техник.'); $('#again').onclick = function () { location.reload(); }; });

function next() { step++; S[step](); }
S[0](); requestAnimationFrame(loop);
window.SBG = { go: function (n) { step = n; S[n](); }, A: A };
})();
