/* Курс FPV. (c) 2026 Александр Наумов, "Клуб и взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* povorot.js (17.11.2026): на телефоне курс-игра идёт только в горизонтальном положении.
   Телефон в вертикали и идёт игра (город после входа, крыши, комнаты, тренажёры) -
   поверх всего экран "Переверните телефон", игра стоит на паузе:
   замирают анимация и время (requestAnimationFrame, performance.now), голос и звуки.
   Повернули горизонтально - всё продолжается с того же места.
   Компьютер и планшет не трогаем. Экран входа (до "Начать обучение") - в любом положении.
   На Android по касанию ("Начать обучение", "Лететь", первое касание в игре) просим полный экран и блокировку горизонтали (на iPhone такого нет - только экран-просьба).
   Подключать в <head> до three.js и остальных скриптов.
   Проверка на компьютере: адрес ...?povorot=1 (считать устройство телефоном).
   Свой выбор, когда идёт игра: window.POVOROT_GAME = function(){ return true/false; } */
(function () {
  'use strict';
  if (window.POVOROT) return;
  var W = window, D = document, Q = /[?&]povorot=1/.test(location.search);
  var mm = function (q) { return !!(W.matchMedia && W.matchMedia(q).matches); };

  /* телефон: палец - главный способ ввода и короткая сторона экрана до 600 (планшеты от 744) */
  function phone() {
    if (Q) return true;
    var s = Math.min(screen.width || 9999, screen.height || 9999);
    return mm('(pointer:coarse)') && s <= 600;
  }
  function portrait() { return W.innerHeight > W.innerWidth * 1.05; }
  function game() {
    try {
      if (typeof W.POVOROT_GAME === 'function') return !!W.POVOROT_GAME();
      var G = W.KURS_GOROD; if (!G || !G.where) return false;
      var st = String(G.where()).split('|')[1] || '';
      return st !== '' && st !== 'gate';   /* 'gate' - экран входа */
    } catch (e) { return false; }
  }

  /* ---------- пауза времени для окна и его iframe ---------- */
  var realNow = performance.now.bind(performance);
  var S = { hold: false, t0: 0, off: 0 };
  function lost() { return S.off + (S.hold ? realNow() - S.t0 : 0); }   /* сколько всего простояли на паузе */
  var wins = [];
  function install(w) {
    try {
      if (!w || w.__povorot) return; var p = w.performance; if (!p || !w.requestAnimationFrame) return;
      var oNow = p.now.bind(p), oRaf = w.requestAnimationFrame.bind(w), oCan = w.cancelAnimationFrame.bind(w);
      var R = { w: w, wait: [], ids: {}, n: 0, ac: [], media: [] };
      w.__povorot = R; wins.push(R);
      var base = lost();   /* пауза, накопленная до установки, этому окну не нужна */
      p.now = function () { return oNow() - (lost() - base); };
      w.requestAnimationFrame = function (cb) {
        var id = ++R.n;
        var run = function () { delete R.ids[id]; if (S.hold) { R.wait.push([id, cb]); return; } cb(p.now()); };
        if (S.hold) R.wait.push([id, cb]); else R.ids[id] = oRaf(run);
        return id;
      };
      w.cancelAnimationFrame = function (id) {
        if (R.ids[id] != null) { oCan(R.ids[id]); delete R.ids[id]; }
        for (var i = R.wait.length - 1; i >= 0; i--) if (R.wait[i][0] === id) R.wait.splice(i, 1);
      };
      R.go = function () {   /* снять с паузы: запустить отложенные кадры */
        var q = R.wait; R.wait = [];
        q.forEach(function (x) { var id = x[0], cb = x[1]; R.ids[id] = oRaf(function () { delete R.ids[id]; if (S.hold) { R.wait.push([id, cb]); return; } cb(p.now()); }); });
      };
      /* звуки WebAudio (моторы, сигналы): запоминаем созданные, чтобы приостановить */
      ['AudioContext', 'webkitAudioContext'].forEach(function (k) {
        var A = w[k]; if (!A || A.__povorot) return;
        var F = function () { var a = new (Function.prototype.bind.apply(A, [null].concat([].slice.call(arguments))))(); R.ac.push(a); return a; };
        F.prototype = A.prototype; F.__povorot = 1; try { w[k] = F; } catch (e) {}
      });
    } catch (e) {}
  }
  function frames(w, out) {
    out = out || []; out.push(w);
    try { for (var i = 0; i < w.frames.length; i++) { try { if (w.frames[i].document) frames(w.frames[i], out); } catch (e) {} } } catch (e) {}
    return out;
  }
  function pauseAll() {
    if (S.hold) return; S.hold = true; S.t0 = realNow();
    frames(W).forEach(function (w) {
      install(w); var R = w.__povorot; if (!R) return;
      R.media = []; try { [].forEach.call(w.document.querySelectorAll('audio,video'), function (m) { if (!m.paused) { m.pause(); R.media.push(m); } }); } catch (e) {}
      R.acOn = R.ac.filter(function (a) { return a.state === 'running'; }); R.acOn.forEach(function (a) { try { a.suspend(); } catch (e) {} });
      try { if (w.speechSynthesis && w.speechSynthesis.speaking) { w.speechSynthesis.pause(); R.syn = 1; } } catch (e) {}
    });
  }
  function resumeAll() {
    if (!S.hold) return; S.off += realNow() - S.t0; S.hold = false;
    wins.forEach(function (R) {
      try { R.go(); } catch (e) {}
      (R.media || []).forEach(function (m) { try { var p = m.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }); R.media = [];
      (R.acOn || []).forEach(function (a) { try { a.resume(); } catch (e) {} }); R.acOn = [];
      if (R.syn) { try { R.w.speechSynthesis.resume(); } catch (e) {} R.syn = 0; }
    });
  }
  install(W);

  /* ---------- экран "Переверните телефон" ---------- */
  var ov = null;
  function css() {
    var s = D.createElement('style');
    s.textContent = '#povOv{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;' +
      'background:radial-gradient(circle at 50% 38%,#16204a 0,#05060f 70%);color:#f1f3ff;font:600 16px/1.4 Manrope,system-ui,-apple-system,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none}' +
      '#povOv.on{display:flex}' +
      '#povOv .pv-ic{width:120px;height:120px;position:relative}' +
      '#povOv .pv-ph{position:absolute;left:38px;top:14px;width:44px;height:84px;border:4px solid #7cf3ff;border-radius:10px;box-shadow:0 0 18px rgba(124,243,255,.55);animation:povRot 2.4s ease-in-out infinite;transform-origin:50% 50%}' +
      '#povOv .pv-ph:before{content:"";position:absolute;left:50%;bottom:4px;width:12px;height:3px;margin-left:-6px;border-radius:2px;background:#7cf3ff}' +
      '#povOv .pv-ar{position:absolute;inset:0;border:3px dashed rgba(157,255,124,.55);border-radius:50%;border-left-color:transparent;border-bottom-color:transparent;transform:rotate(10deg)}' +
      '#povOv .pv-ar:after{content:"";position:absolute;right:6px;top:22px;border:8px solid transparent;border-top-color:#9dff7c;transform:rotate(40deg)}' +
      '#povOv h2{margin:0;font:700 clamp(20px,6vw,28px)/1.2 Unbounded,"Arial Black",system-ui,sans-serif;letter-spacing:.02em;text-shadow:0 0 18px rgba(124,243,255,.6)}' +
      '#povOv p{margin:0;max-width:320px;color:#a7acd2;font-size:15px}' +
      '#povOv button{min-height:44px;padding:0 20px;border-radius:99px;border:1px solid #7cf3ff;background:rgba(14,18,40,.7);color:#fff;font:700 15px Manrope,system-ui,sans-serif;cursor:pointer}' +
      '#povOv a{color:#a7acd2;font-size:13px;margin-top:6px}' +
      '@keyframes povRot{0%,15%{transform:rotate(0)}45%,75%{transform:rotate(-90deg)}100%{transform:rotate(0)}}' +
      '@media (prefers-reduced-motion:reduce){#povOv .pv-ph{animation:none;transform:rotate(-90deg)}}';
    D.head.appendChild(s);
  }
  function canLock() { return !!(screen.orientation && screen.orientation.lock && (D.documentElement.requestFullscreen || D.documentElement.webkitRequestFullscreen)); }
  function lockLand() {   /* только Android/Chrome: полный экран и горизонталь; на iPhone тихо ничего не делает */
    if (!canLock()) return;
    try {
      var el = D.documentElement, fs = D.fullscreenElement || D.webkitFullscreenElement;
      var go = function () { try { var p = screen.orientation.lock('landscape'); if (p && p.catch) p.catch(function () {}); } catch (e) {} };
      if (fs) { go(); return; }
      var r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
      if (r && r.then) r.then(go, function () {}); else setTimeout(go, 300);
    } catch (e) {}
  }
  function build() {
    if (ov || !D.body) return; css();
    ov = D.createElement('div'); ov.id = 'povOv'; ov.setAttribute('role', 'alertdialog'); ov.setAttribute('aria-live', 'assertive');
    ov.innerHTML = '<div class="pv-ic" aria-hidden="true"><i class="pv-ar"></i><i class="pv-ph"></i></div>' +
      '<h2>Переверните телефон</h2><p>Курс проходится как игра - держите телефон горизонтально. Игра на паузе и продолжится сама.</p>' +
      (canLock() ? '<button type="button" id="povLk">Повернуть экран</button>' : '') +
      (W.PLAIN_URL ? '<a id="povPl" href="' + W.PLAIN_URL + '">Открыть обычную страницу курса</a>' : '');
    ['touchstart', 'touchmove', 'pointerdown', 'wheel', 'keydown'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); if (t === 'touchmove' || t === 'wheel') e.preventDefault(); }, { passive: false }); });
    var b = ov.querySelector('#povLk'); if (b) b.addEventListener('click', function (e) { e.stopPropagation(); lockLand(); });
    D.body.appendChild(ov);
  }

  var on = false, triedLock = false;
  function check() {
    frames(W).forEach(install);   /* комнаты и тренажёры в iframe: пауза времени и звуков и для них */
    var need = phone() && portrait() && game();
    if (need === on) return;
    on = need; build();
    if (ov) ov.classList.toggle('on', on);
    if (on) pauseAll(); else resumeAll();
  }
  /* первое касание в игре на телефоне (уже горизонтально) - просим полный экран и держим горизонталь */
  D.addEventListener('touchend', function () {
    if (triedLock || on || !phone() || !game() || portrait()) return;
    triedLock = true; lockLand();
  }, true);

  /* "Начать обучение" на телефоне: сразу полный экран и горизонталь (Android); касание есть - браузер разрешит */
  D.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('#goB,#flyB,#mbGo');
    if (t && phone()) { triedLock = true; lockLand(); }
  }, true);

  ['resize', 'orientationchange'].forEach(function (t) { W.addEventListener(t, function () { check(); setTimeout(check, 250); }); });
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', function () { setTimeout(check, 50); });
  /* игра начинается и кончается без смены размеров (вход, выход) - проверяем по таймеру (setTimeout не замирает на паузе) */
  setInterval(check, 400);
  /* новые iframe (комнаты, тренажёры): ставим в них паузу времени сразу после загрузки */
  D.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IFRAME') { try { install(t.contentWindow); } catch (x) {} } }, true);
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', check); else check();

  W.POVOROT = { check: check, on: function () { return on; }, phone: phone, lock: lockLand };
})();
