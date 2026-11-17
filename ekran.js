/* ekran.js - кнопка "На весь экран" для телефона (проба 17.11.2026, только new.html).
   Зачем: в браузере телефона сверху и снизу остаются полосы (адрес, панели, во встроенном браузере Telegram/VK - голубая шапка).
   - Android (Chrome, Яндекс, Samsung): кнопка включает полный экран и горизонталь. Если браузер разрешает установку - ещё и кнопка "Установить".
   - iPhone: полного экрана для страниц нет - кнопка показывает, как добавить курс на экран "Домой" (оттуда он открывается без полос).
   - Встроенный браузер мессенджера: полный экран обычно запрещён - кнопка подсказывает открыть курс в обычном браузере.
   Курс, запущенный с экрана "Домой" (как приложение), кнопку не показывает: там полос и так нет.
   Только свои файлы, без внешних подключений. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.top !== W) return;   /* только на главной странице курса, не в окнах модулей */
  var touch = W.matchMedia && W.matchMedia('(pointer:coarse)').matches;
  if (!touch && !/[?&]ekran=1/.test(location.search)) return;   /* ?ekran=1 - показать и на компьютере (для проверки) */
  var UA = navigator.userAgent || '';
  var IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var INAPP = /Telegram|FBAN|FBAV|Instagram|VKClient|vkontakte|OKApp|MicroMessenger|Line\/|WhatsApp|YaApp_Android.*Mail|; wv\)/i.test(UA);
  function standalone() { return (W.matchMedia && (W.matchMedia('(display-mode: fullscreen)').matches || W.matchMedia('(display-mode: standalone)').matches)) || navigator.standalone === true; }
  function fsEl() { return D.fullscreenElement || D.webkitFullscreenElement; }
  function canFs() { var e = D.documentElement; return !!(e.requestFullscreen || e.webkitRequestFullscreen) && D.fullscreenEnabled !== false && D.webkitFullscreenEnabled !== false; }
  if (standalone()) return;

  var css = D.createElement('style');
  css.textContent =
    '#ekB{position:fixed;z-index:2147483000;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:36px;padding:0 14px;border-radius:99px;border:1px solid rgba(124,243,255,.75);background:rgba(8,12,30,.72);color:#e9fbff;font:700 13px Manrope,system-ui,sans-serif;letter-spacing:.01em;box-shadow:0 0 14px rgba(124,243,255,.35);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .3s,padding .3s}' +
    '#ekB i{font-style:normal;font-size:16px;line-height:1}' +
    '#ekB .ek-t{display:inline!important;font:inherit;color:inherit;white-space:nowrap}#ekB.mal{padding:0 10px}#ekB.mal .ek-t{display:none!important}' +
    '#ekB[hidden]{display:none}' +
    '#ekT{position:fixed;z-index:2147483001;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,5,14,.78)}' +
    '#ekT[hidden]{display:none}' +
    '#ekT>div{max-width:420px;max-height:100%;overflow:auto;padding:18px 20px;border-radius:16px;border:1px solid rgba(124,243,255,.6);background:#0d1330;color:#e9ecff;font:15px/1.45 Manrope,system-ui,sans-serif}' +
    '#ekT h3{margin:0 0 8px;font:700 17px Unbounded,"Arial Black",system-ui,sans-serif;color:#7cf3ff}' +
    '#ekT ol{margin:6px 0 10px;padding-left:22px}#ekT li{margin:4px 0}#ekT p{margin:6px 0}' +
    '#ekT .bt{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
    '#ekT button{min-height:40px;padding:0 16px;border-radius:99px;border:1px solid #7cf3ff;background:rgba(14,18,40,.7);color:#fff;font:700 14px Manrope,system-ui,sans-serif;cursor:pointer}' +
    '#ekT button.pri{background:#7cf3ff;color:#06101e}' +
    '#ekT b{color:#fff}';
  (D.head || D.documentElement).appendChild(css);

  var btn, tip, inst = null;
  W.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); inst = e; });   /* Android: можно установить курс как приложение */

  function hideTip() { if (tip) tip.hidden = true; }
  function showTip(html) {
    if (!tip) { tip = D.createElement('div'); tip.id = 'ekT'; tip.setAttribute('role', 'dialog'); D.body.appendChild(tip);
      ['touchstart', 'pointerdown', 'keydown', 'wheel'].forEach(function (t) { tip.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
      tip.addEventListener('click', function (e) { if (e.target === tip) hideTip(); }); }
    tip.innerHTML = '<div>' + html + '</div>'; tip.hidden = false;
    var x = tip.querySelector('[data-a=x]'); if (x) x.onclick = hideTip;
    var i = tip.querySelector('[data-a=inst]'); if (i) i.onclick = install;
    var c = tip.querySelector('[data-a=copy]'); if (c) c.onclick = function () { var u = location.href.split('#')[0];
      try { navigator.clipboard.writeText(u).then(function () { c.textContent = 'Скопировано'; }, function () { c.textContent = u; }); } catch (e) { c.textContent = u; } };
  }
  function install() { if (!inst) return; var e = inst; inst = null; hideTip(); try { e.prompt(); } catch (er) {} }

  function tipIOS() {
    showTip('<h3>На весь экран на iPhone</h3><p>В Safari полный экран для сайтов не включается. Курс можно поставить на экран "Домой" - оттуда он открывается без адресной строки и полос.</p>' +
      '<ol><li>Откройте курс в <b>Safari</b>.</li><li>Нажмите <b>Поделиться</b> (квадрат со стрелкой вверх).</li><li>Выберите <b>На экран "Домой"</b> и нажмите <b>Добавить</b>.</li><li>Запускайте курс значком <b>Курс FPV</b> на экране.</li></ol>' +
      '<div class="bt"><button type="button" data-a="x" class="pri">Понятно</button></div>');
  }
  function tipInApp() {
    showTip('<h3>Голубая полоса сверху</h3><p>Курс открыт во встроенном браузере мессенджера - он не даёт включить полный экран.</p>' +
      '<ol><li>Нажмите <b>⋮</b> или <b>...</b> в углу и выберите <b>Открыть в браузере</b> (Chrome, Яндекс' + (IOS ? ', Safari' : '') + ').</li>' +
      (IOS ? '<li>В Safari: <b>Поделиться</b> - <b>На экран "Домой"</b>.</li>' : '<li>В браузере нажмите <b>На весь экран</b> или <b>⋮</b> - <b>Добавить на главный экран</b>.</li>') +
      '<li>Дальше запускайте курс значком <b>Курс FPV</b> - без полос.</li></ol>' +
      '<div class="bt"><button type="button" data-a="copy">Скопировать адрес</button><button type="button" data-a="x" class="pri">Понятно</button></div>');
  }
  function tipAndroid() {
    showTip('<h3>Полный экран не включился</h3><p>Этот браузер не разрешил полный экран. Можно поставить курс на главный экран - он будет открываться как приложение, без полос.</p>' +
      '<ol><li>Нажмите <b>⋮</b> в углу браузера.</li><li>Выберите <b>Добавить на главный экран</b> или <b>Установить приложение</b>.</li><li>Запускайте курс значком <b>Курс FPV</b>.</li></ol>' +
      '<div class="bt">' + (inst ? '<button type="button" data-a="inst" class="pri">Установить</button>' : '') + '<button type="button" data-a="x"' + (inst ? '' : ' class="pri"') + '>Понятно</button></div>');
  }
  function lockLand() { try { if (screen.orientation && screen.orientation.lock) { var p = screen.orientation.lock('landscape'); if (p && p.catch) p.catch(function () {}); } } catch (e) {} }
  function go() {
    if (fsEl()) { try { (D.exitFullscreen || D.webkitExitFullscreen).call(D); } catch (e) {} return; }
    if (INAPP) { tipInApp(); return; }
    if (IOS || !canFs()) { IOS ? tipIOS() : tipAndroid(); return; }
    var e = D.documentElement, r;
    try { r = (e.requestFullscreen || e.webkitRequestFullscreen).call(e, { navigationUI: 'hide' }); } catch (er) { tipAndroid(); return; }
    if (r && r.then) r.then(lockLand, function () { tipAndroid(); }); else setTimeout(function () { if (fsEl()) lockLand(); else tipAndroid(); }, 400);
  }
  function upd() {
    if (!btn) return; var on = !!fsEl();
    btn.innerHTML = on ? '<i aria-hidden="true">✕</i><b class="ek-t">Выйти из полного экрана</b>' : '<i aria-hidden="true">⛶</i><b class="ek-t">На весь экран</b>';
    btn.setAttribute('aria-label', on ? 'Выйти из полного экрана' : 'На весь экран');
    /* в полном экране кнопка - маленький значок, чтобы не мешать игре; без полного экрана - с надписью */
    btn.classList.toggle('mal', on);
  }
  function build() {
    if (btn || !D.body) return;
    btn = D.createElement('button'); btn.type = 'button'; btn.id = 'ekB';
    ['touchstart', 'pointerdown'].forEach(function (t) { btn.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(); });
    D.body.appendChild(btn); upd();
  }
  D.addEventListener('fullscreenchange', upd); D.addEventListener('webkitfullscreenchange', upd);
  if (D.body) build(); else D.addEventListener('DOMContentLoaded', build);
  W.KURS_EKRAN = { go: go, ios: tipIOS, inapp: tipInApp };
})();
