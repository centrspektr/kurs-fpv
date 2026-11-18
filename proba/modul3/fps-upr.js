/* fps-upr.js - управление в помещениях от первого лица "как в игре SCP: Побег" (проба 12.11.2026, просьба Alexandr).
   Компьютер (как в "Побеге", 12.11): водишь пальцем по тачпаду (мышью) без нажатия - камера смотрит следом; щелчок по полу захватывает мышь,
     W A S D - ходить, Shift - бегом, пробел - прыжок, E или щелчок - действие с тем, что в прицеле, Esc - вернуть стрелку.
   Телефон: слева джойстик - ходить, справа води пальцем - смотреть, кнопки БЕГ, ПРЫЖОК и E (действие). Касание предмета - подойти, как раньше.
   Подключение: FPSUPR.create({ canvas, root, walk(): можно ли ходить, look(dx, dy): повернуть (в радианах), act(): действие,
     jump(), lockOk(): можно ли захватывать мышь, noMouse: мышь не трогать }) -> { joy: {f, s, run}, locked(), unlock() }.
   17.11 (только проба new.html, FPSUPR.v2): ещё ближе к "Побегу" - камера по вертикали идёт за пальцем (вверх - смотрим вверх),
     раскладка на телефоне как в игре: джойстик слева внизу, рядом БЕГ (включить/выключить), справа ПРЫЖОК и большая E;
     прыжок и скорость как в игре (FPSUPR.JV, FPSUPR.G, FPSUPR.WALK, FPSUPR.RUN; бег только вперёд). Главная (index.html) - по-старому.
   Копия лежит в proba/modul3/fps-upr.js (для этажей модулей 3 и 5), файлы одинаковые. */
(function () {
'use strict';
var TOUCH = matchMedia('(pointer:coarse)').matches && 'ontouchstart' in window;
var V2 = !/[?&]pobeg=0\b/.test(location.search);   /* 17.11 вечер по "ставь": новое управление везде; ?pobeg=0 - прежнее (откат otkat/fps-upr-1711.js) */
/* 17.11 ночь (проба new.html, ?zahvat=1 - проверить в другом месте): камера на тачпаде упиралась в край экрана вместе со стрелкой.
   Как в "Побеге": щелчок по сцене или первая клавиша ходьбы захватывает курсор - камера крутится без края, Esc возвращает стрелку;
   когда стрелка подходит к краю - подсказка. При "ставь" убрать условие V3. */
var V3 = !/[?&]zahvat=0\b/.test(location.search);   /* 18.11 по "ставь": захват мыши везде; ?zahvat=0 - без него (откат otkat/fps-upr-1811s.js) */
function mouseHelp(h) {   /* h: { canvas, locked(), lock(), walk() } */
  if (!V3 || TOUCH || !h.canvas.requestPointerLock) return;
  var tip = document.createElement('div'), tipT = 0, tipLast = -1e9;
  tip.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);max-width:min(92vw,520px);padding:10px 16px;border-radius:14px;background:rgba(8,11,28,.88);border:1px solid rgba(124,243,255,.5);color:#fff;font:600 14px/1.35 system-ui,sans-serif;text-align:center;z-index:60;pointer-events:none;display:none';
  tip.textContent = 'Щёлкни по комнате - камера будет поворачиваться без края экрана. Esc - вернуть стрелку.';
  document.body.appendChild(tip);
  function show() { var n = performance.now(); if (n - tipLast < 15000) return; tipLast = n; tip.style.display = 'block'; clearTimeout(tipT); tipT = setTimeout(function () { tip.style.display = 'none'; }, 3500); }
  document.addEventListener('pointerlockchange', function () { if (h.locked()) { tip.style.display = 'none'; } });
  /* 18.11 (Alexandr: стрелка упирается в край - камера встаёт): если курсор не захвачен и стоит у края экрана, камера сама доворачивает в ту сторону */
  var mx = -1, my = -1, edT = 0; document.addEventListener('mouseleave', function () { mx = my = -1; }); addEventListener('blur', function () { mx = my = -1; });
  addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
  if (h.look) (function ed(t) { requestAnimationFrame(ed); var dt = edT ? Math.min(.1, (t - edT) / 1000) : .016; edT = t;
    if (mx < 0 || h.locked() || !h.walk()) return; var m = Math.max(28, innerWidth * .04), sx = 0, sy = 0;
    if (mx < m) sx = 1 - mx / m; else if (mx > innerWidth - m) sx = -(1 - (innerWidth - mx) / m);
    if (my < m * .8) sy = (1 - my / (m * .8)) * .6; else if (my > innerHeight - m * .8) sy = -(1 - (innerHeight - my) / (m * .8)) * .6;
    if (sx || sy) h.look(sx * 2.2 * dt, sy * 1.2 * dt); })(0);
  addEventListener('mousemove', function (e) { if (h.locked() || e.buttons || !h.walk()) return; var m = 24;
    if (e.clientX < m || e.clientY < m || e.clientX > innerWidth - m || e.clientY > innerHeight - m) show(); });
  addEventListener('keydown', function (e) { if (h.locked() || e.repeat || !h.walk()) return; if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (/^(Key[WASD]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Space)$/.test(e.code) && e.isTrusted) h.lock(); });
}
function create(o) {
  var cv = o.canvas, root = o.root || document.body, U = { joy: { f: 0, s: 0, run: false }, touch: TOUCH };
  var canLock = o.lock !== false && !TOUCH && !o.noMouse && !!cv.requestPointerLock; /* 12.11 вечер: щелчок по полу захватывает мышь; камера идёт за пальцем по тачпаду и без захвата */ /* noMouse: мышью управляет сама комната (модуль 2), отсюда только телефон */
  U.locked = function () { return document.pointerLockElement === cv; };
  U.unlock = function () { if (U.locked()) try { document.exitPointerLock(); } catch (e) {} };
  U.lock = function () { if (!canLock || U.locked() || (o.lockOk && !o.lockOk())) return; try { var r = cv.requestPointerLock(); if (r && r.catch) r.catch(function () {}); } catch (e) {} };
  var st = document.createElement('style');
  st.textContent = '.fpsx{position:fixed;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.45),0 0 10px #7cf3ff;pointer-events:none;z-index:40;display:none}' +
    'body.fps-lock .fpsx{display:block}' +
    '.fpsj{position:fixed;left:22px;bottom:26px;width:132px;height:132px;border-radius:50%;background:rgba(10,14,30,.35);border:2px solid rgba(255,255,255,.25);z-index:40;touch-action:none;display:none}' +
    '.fpsj i{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6)}' +
    '.fpsb{position:fixed;right:18px;z-index:40;display:none;gap:10px;flex-direction:column;align-items:flex-end}' +
    '.fpsb button{width:68px;height:68px;border-radius:50%;border:2px solid rgba(255,255,255,.45);background:rgba(10,14,30,.45);color:#fff;font:800 11px system-ui,sans-serif;letter-spacing:-.02em;padding:0;touch-action:none}' +
    '.fpsb button.on{background:rgba(124,243,255,.45)}' +
    'body.fps-walk.fps-touch .fpsj, body.fps-walk.fps-touch .fpsb{display:flex}' +
    /* 17.11: раскладка как в "Побеге" (телефон): джойстик 104 слева внизу, БЕГ рядом, справа E (большая) и ПРЫЖОК над ней */
    (V2 ? '.fpsj.v2{left:calc(18px + env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:104px;height:104px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18)}' +
    '.fpsj.v2 i{width:38px;height:38px;margin:-19px;background:rgba(242,194,48,.45);border:0}' +
    '.fpsb .fpsv{position:fixed;z-index:40;display:none;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(20,24,28,.38);color:#fff;font:800 8px system-ui,sans-serif;letter-spacing:0;padding:0;touch-action:none;place-items:center}' +
    '.fpsb .fpsv.on{background:rgba(242,194,48,.5)}' +
    '.fpsb .fpsv-run{left:calc(132px + env(safe-area-inset-left,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px))}' +
    '.fpsb .fpsv-act{right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:62px;height:62px;font-size:16px;background:rgba(124,243,255,.3)}' +
    '.fpsb .fpsv-jump{right:calc(20px + env(safe-area-inset-right,0px));bottom:calc(90px + env(safe-area-inset-bottom,0px))}' +
    'body.fps-walk.fps-touch .fpsb .fpsv{display:grid}' +
    /* строка "Дальше" не должна закрывать джойстик и БЕГ - сдвигаем её между ними и кнопками справа */
    'body.fps-walk.fps-touch #nextb{left:calc(188px + env(safe-area-inset-left,0px));max-width:calc(100vw - 290px)}body.fps-walk.fps-touch #nextb b{max-width:calc(100vw - 480px)}' : '');
  document.head.appendChild(st);
  var cross = document.createElement('div'); cross.className = 'fpsx'; document.body.appendChild(cross);
  document.body.classList.toggle('fps-touch', TOUCH);
  document.addEventListener('pointerlockchange', function () { document.body.classList.toggle('fps-lock', U.locked()); });
  /* мышь в захвате: поворот как в игре */
  if (!o.noMouse) addEventListener('mousemove', function (e) { if (!o.walk() || TOUCH) return; if (!U.locked() && (e.buttons || e.target !== cv)) return; var mx = e.movementX || 0, my = e.movementY || 0;
    if (Math.abs(mx) > 250 || Math.abs(my) > 250) return; /* браузер иногда присылает ложный рывок */ U.ax -= mx * .0022; U.ay -= my * .0022; });
  /* 13.11: тачпад присылает движение неровно - копим и отдаём камере плавно, по кадрам (без заиканий) */
  U.ax = 0; U.ay = 0; var smT = 0; (function sm(t) { requestAnimationFrame(sm); var dt = smT ? Math.min(.1, (t - smT) / 1000) : .016; smT = t; if (Math.abs(U.ax) + Math.abs(U.ay) < 1e-5) { U.ax = U.ay = 0; return; } var k = 1 - Math.exp(-dt * 22), x = U.ax * k, y = U.ay * k; U.ax -= x; U.ay -= y; if (o.walk()) o.look(x, y); else U.ax = U.ay = 0; })(0);
  /* следим, чтобы захват снимался, когда открыто окно задания или нельзя ходить */
  if (canLock) mouseHelp({ canvas: cv, locked: U.locked, lock: U.lock, walk: o.walk, look: o.look });
  setInterval(function () { var w = o.walk(); document.body.classList.toggle('fps-walk', !!w); if (!o.noMouse && (!w || (o.lockOk && !o.lockOk()))) U.unlock(); }, 200);
  if (TOUCH) {
    /* джойстик слева */
    var J = document.createElement('div'); J.className = 'fpsj' + (V2 ? ' v2' : ''); J.innerHTML = '<i></i>'; root.appendChild(J); var kn = J.firstChild, jid = null, jc = null;
    function jset(x, y) { var dx = x - jc.x, dy = y - jc.y, L = Math.hypot(dx, dy), R = 50; if (L > R) { dx *= R / L; dy *= R / L; }
      kn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; U.joy.s = dx / R; U.joy.f = -dy / R; }
    J.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); var t = e.changedTouches[0]; jid = t.identifier; var r = J.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; jset(t.clientX, t.clientY); }, { passive: false });
    J.addEventListener('touchmove', function (e) { e.preventDefault(); e.stopPropagation(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) jset(e.changedTouches[i].clientX, e.changedTouches[i].clientY); }, { passive: false });
    function jend(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) { jid = null; U.joy.f = U.joy.s = 0; kn.style.transform = ''; } }
    J.addEventListener('touchend', jend); J.addEventListener('touchcancel', jend);
    /* кнопки справа */
    var B = document.createElement('div'); B.className = 'fpsb'; B.style.bottom = '26px';
    if (V2) { B.style.display = 'contents'; B.innerHTML = '<button type="button" class="fpsv fpsv-run" data-k="run">БЕГ</button><button type="button" class="fpsv fpsv-jump" data-k="jump">ПРЫЖОК</button><button type="button" class="fpsv fpsv-act" data-k="act">E</button>'; }
    else B.innerHTML = '<button type="button" data-k="act">E</button><button type="button" data-k="jump">ПРЫЖОК</button><button type="button" data-k="run">БЕГ</button>';
    root.appendChild(B);
    B.addEventListener('touchstart', function (e) { var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var k = b.dataset.k;
      if (k === 'run') { U.joy.run = !U.joy.run; b.classList.toggle('on', U.joy.run); } else if (k === 'jump') o.jump(); else o.act(); }, { passive: false });
  }
  return U;
}
/* 17.11 (v2): прыжок, тяжесть, скорость шага и бега - как в "Побеге"; на главной прежние числа */
window.FPSUPR = { create: create, mouseHelp: mouseHelp, touch: TOUCH, v2: V2, v3: V3, JV: V2 ? 6.5 : 3.6, G: V2 ? 22 : 11, WALK: V2 ? 4.4 : 2.6, RUN: V2 ? 7.4 : 5.2,
  /* поворот перетаскиванием (палец или мышь с нажатой кнопкой): как в "Побеге" камера идёт за пальцем и по горизонтали, и по вертикали */
  dragK: V2 ? .005 : 0, pitchSign: V2 ? -1 : 1 };
})();
