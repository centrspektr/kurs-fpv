/* fps-upr.js - управление в помещениях от первого лица "как в игре SCP: Побег" (проба 12.11.2026, просьба Alexandr).
   Компьютер (как в "Побеге", 12.11): водишь пальцем по тачпаду (мышью) без нажатия - камера смотрит следом; щелчок по полу захватывает мышь,
     W A S D - ходить, Shift - бегом, пробел - прыжок, E или щелчок - действие с тем, что в прицеле, Esc - вернуть стрелку.
   Телефон: слева джойстик - ходить, справа води пальцем - смотреть, кнопки БЕГ, ПРЫЖОК и E (действие). Касание предмета - подойти, как раньше.
   Подключение: FPSUPR.create({ canvas, root, walk(): можно ли ходить, look(dx, dy): повернуть (в радианах), act(): действие,
     jump(), lockOk(): можно ли захватывать мышь, noMouse: мышь не трогать }) -> { joy: {f, s, run}, locked(), unlock() }.
   Копия лежит в proba/modul3/fps-upr.js (для этажей модулей 3 и 5), файлы одинаковые. */
(function () {
'use strict';
var TOUCH = matchMedia('(pointer:coarse)').matches && 'ontouchstart' in window;
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
    'body.fps-walk.fps-touch .fpsj, body.fps-walk.fps-touch .fpsb{display:flex}';
  document.head.appendChild(st);
  var cross = document.createElement('div'); cross.className = 'fpsx'; document.body.appendChild(cross);
  document.body.classList.toggle('fps-touch', TOUCH);
  document.addEventListener('pointerlockchange', function () { document.body.classList.toggle('fps-lock', U.locked()); });
  /* мышь в захвате: поворот как в игре */
  if (!o.noMouse) addEventListener('mousemove', function (e) { if (!o.walk() || TOUCH) return; if (!U.locked() && (e.buttons || e.target !== cv)) return; var mx = e.movementX || 0, my = e.movementY || 0;
    if (Math.abs(mx) > 250 || Math.abs(my) > 250) return; /* браузер иногда присылает ложный рывок */ o.look(-mx * .0022, -my * .0022); });
  /* следим, чтобы захват снимался, когда открыто окно задания или нельзя ходить */
  setInterval(function () { var w = o.walk(); document.body.classList.toggle('fps-walk', !!w); if (!o.noMouse && (!w || (o.lockOk && !o.lockOk()))) U.unlock(); }, 200);
  if (TOUCH) {
    /* джойстик слева */
    var J = document.createElement('div'); J.className = 'fpsj'; J.innerHTML = '<i></i>'; root.appendChild(J); var kn = J.firstChild, jid = null, jc = null;
    function jset(x, y) { var dx = x - jc.x, dy = y - jc.y, L = Math.hypot(dx, dy), R = 50; if (L > R) { dx *= R / L; dy *= R / L; }
      kn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; U.joy.s = dx / R; U.joy.f = -dy / R; }
    J.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); var t = e.changedTouches[0]; jid = t.identifier; var r = J.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; jset(t.clientX, t.clientY); }, { passive: false });
    J.addEventListener('touchmove', function (e) { e.preventDefault(); e.stopPropagation(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) jset(e.changedTouches[i].clientX, e.changedTouches[i].clientY); }, { passive: false });
    function jend(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) { jid = null; U.joy.f = U.joy.s = 0; kn.style.transform = ''; } }
    J.addEventListener('touchend', jend); J.addEventListener('touchcancel', jend);
    /* кнопки справа */
    var B = document.createElement('div'); B.className = 'fpsb'; B.style.bottom = '26px';
    B.innerHTML = '<button type="button" data-k="act">E</button><button type="button" data-k="jump">ПРЫЖОК</button><button type="button" data-k="run">БЕГ</button>'; root.appendChild(B);
    B.addEventListener('touchstart', function (e) { var b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); var k = b.dataset.k;
      if (k === 'run') { U.joy.run = !U.joy.run; b.classList.toggle('on', U.joy.run); } else if (k === 'jump') o.jump(); else o.act(); }, { passive: false });
  }
  return U;
}
window.FPSUPR = { create: create, touch: TOUCH };
})();
