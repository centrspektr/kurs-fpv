/* komnaty.js - модули-помещения в курсе (проба 09.11.2026, план локаций А: модули 1 и 3 проходим пешком).
   Когда ученик входит в модуль из списка KOMNATY, вместо дороги заданий открывается комната от первого лица (iframe поверх города).
   Экраны заданий в комнате открывают настоящее окно задания курса (window.KURS_OPEN_TASK из kosmos-kurs-new.js), оно встаёт поверх комнаты.
   Выход из комнаты - кнопка "←" в комнате, дверь "Выход в город" или "назад" на телефоне.
   Подключать в new.html до kosmos-kurs-new.js. Комнаты лежат каждая в своей папке. */
(function () {
'use strict';
var KOMNATY = { m3: 'proba/modul3/index.html', m5: 'proba/modul3/gonki.html' };   /* 11.11: модуль 5 - гоночный клуб от первого лица */
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
function close(silent) { if (!ov) return; var o = ov, m = cur; ov = null; cur = null;
  if (!silent && window.KURS_KOMNATA_OUT) try { KURS_KOMNATA_OUT(m); } catch (e) {}
  try { var w = o.querySelector('iframe').contentWindow; if (w.GOLOS) w.GOLOS.stop(); } catch (e) {}
  o.classList.remove('on'); setTimeout(function () { o.remove(); }, silent ? 0 : 500);
  if (window.GOLOS && GOLOS.stop) try { GOLOS.stop(); } catch (e) {} }
/* "назад": сначала закрывается окно задания (если открыто), потом комната */
addEventListener('popstate', function () { if (!ov) return; var w = document.getElementById('win'); if (w && w.classList.contains('on')) { try { history.pushState({ komnata: cur }, ''); } catch (e) {} var x = document.getElementById('winX'); if (x) x.click(); return; } close(); });
/* комната просит выйти */
window.KURS_KOMNATA = { has: function (mid) { return !!KOMNATY[mid]; }, open: open,
  close: function () { if (!ov) return; if (history.state && history.state.komnata) history.back(); else close(); },
  task: function (tid) { return window.KURS_OPEN_TASK ? window.KURS_OPEN_TASK(tid) : false; },
  /* окно задания закрылось - назад в комнату: клавиатура снова в комнате, стенды обновляются */
  back: function (tid, fresh) { if (!ov) return; var f = ov.querySelector('iframe'); try { f.focus(); f.contentWindow.focus(); var w = f.contentWindow; if (w.AKB && w.AKB.back) w.AKB.back(tid, fresh); else if (w.AKB && w.AKB.refresh) w.AKB.refresh(); } catch (e) {} },
  get on() { return !!ov; } };
/* клавиши, нажатые, пока фокус остался на странице курса (после кнопки окна задания), передаём в комнату */
function winOn() { var w = document.getElementById('win'); return w && w.classList.contains('on'); }
['keydown', 'keyup'].forEach(function (tp) { addEventListener(tp, function (e) { if (!ov || winOn()) return; var f = ov.querySelector('iframe'); if (!f || document.activeElement === f) return;
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  try { f.focus(); f.contentWindow.focus(); f.contentWindow.dispatchEvent(new KeyboardEvent(tp, { code: e.code, key: e.key, shiftKey: e.shiftKey, repeat: e.repeat, bubbles: true, cancelable: true })); if (/Space|Enter|Arrow/.test(e.code)) e.preventDefault(); } catch (er) {} }); });
})();
