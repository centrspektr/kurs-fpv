/* komnaty.js - модули-помещения в курсе (проба 09.11.2026, план локаций А: модули 1 и 3 проходим пешком).
   Когда ученик входит в модуль из списка KOMNATY, вместо дороги заданий открывается комната от первого лица (iframe поверх города).
   Экраны заданий в комнате открывают настоящее окно задания курса (window.KURS_OPEN_TASK из kosmos-kurs-new.js), оно встаёт поверх комнаты.
   Выход из комнаты - кнопка "←" в комнате, дверь "Выход в город" или "назад" на телефоне.
   Подключать в new.html до kosmos-kurs-new.js. Комнаты лежат каждая в своей папке. */
(function () {
'use strict';
var KOMNATY = { m3: 'proba/modul3/index.html' };
var ov = null, cur = null;
var css = document.createElement('style');
css.textContent = '#komOv{position:fixed;inset:0;z-index:15;background:#05060d;opacity:0;transition:opacity .5s}#komOv.on{opacity:1}#komOv iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}';
document.head.appendChild(css);
function open(mid, ready) {
  if (!KOMNATY[mid]) return false; close(true); cur = mid;
  ov = document.createElement('div'); ov.id = 'komOv';
  var f = document.createElement('iframe'); f.src = KOMNATY[mid]; f.title = 'Модуль'; f.allow = 'autoplay; fullscreen';
  f.onload = function () { ov.classList.add('on'); if (ready) setTimeout(ready, 400); try { f.contentWindow.focus(); } catch (e) {} };
  ov.appendChild(f); document.body.appendChild(ov);
  try { history.pushState({ komnata: mid }, ''); } catch (e) {}
  return true;
}
function close(silent) { if (!ov) return; var o = ov; ov = null; cur = null;
  try { var w = o.querySelector('iframe').contentWindow; if (w.GOLOS) w.GOLOS.stop(); } catch (e) {}
  o.classList.remove('on'); setTimeout(function () { o.remove(); }, silent ? 0 : 500);
  if (window.GOLOS && GOLOS.stop) try { GOLOS.stop(); } catch (e) {} }
/* "назад": сначала закрывается окно задания (если открыто), потом комната */
addEventListener('popstate', function () { if (!ov) return; var w = document.getElementById('win'); if (w && w.classList.contains('on')) { try { history.pushState({ komnata: cur }, ''); } catch (e) {} return; } close(); });
/* комната просит выйти */
window.KURS_KOMNATA = { has: function (mid) { return !!KOMNATY[mid]; }, open: open,
  close: function () { if (!ov) return; if (history.state && history.state.komnata) history.back(); else close(); },
  task: function (tid) { return window.KURS_OPEN_TASK ? window.KURS_OPEN_TASK(tid) : false; },
  get on() { return !!ov; } };
})();
