/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* pwa.js - курс как приложение на ПК и телефоне (проба 21.11.2026).
   Ставит sw-kurs.js (файлы курса на устройстве), в панель шестерёнки добавляет:
   "Установить как приложение" (Chrome, Edge, Android; на iPhone - подсказка "На экран Домой") и
   "Сохранить курс на устройство" - скачать все файлы по списку fayly.json, чтобы курс открывался без интернета.
   Данные учеников (вход по коду, прогресс) по-прежнему идут на сервер spektr-api, когда есть сеть. */
(function () {
'use strict';
var D = document, W = window, LS = W.localStorage;
function g(k) { try { return LS.getItem(k); } catch (e) { return null; } }
function s(k, v) { try { LS.setItem(k, v); } catch (e) {} }
var NEWP = /\/new\.html$/.test(location.pathname);
/* на пробе (new.html) - только для этой страницы, чтобы не мешать главной; на главной - вся папка */
var reg = null;
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  W.addEventListener('load', function () { navigator.serviceWorker.register('sw-kurs.js', { scope: NEWP ? './new.html' : './' }).then(function (r) { reg = r; }).catch(function () {}); }); }
var inst = null, IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
function standalone() { return (W.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone === true; }
W.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); inst = e; upd(); });
W.addEventListener('appinstalled', function () { inst = null; s('kursy_pwa', '1'); upd(); });

var css = D.createElement('style');
css.textContent = '#pwaR{margin:4px 0 6px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12)}#pwaR button{width:100%;min-height:32px;margin:3px 0;border-radius:10px;border:1px solid rgba(124,243,255,.6);background:rgba(124,243,255,.1);color:#fff;font:700 12px system-ui,sans-serif;cursor:pointer;text-align:left;padding:0 10px}' +
  '#pwaR button.pri{background:#7cf3ff;color:#06101e}#pwaR button[disabled]{opacity:.6;cursor:default}#pwaR small{display:block;font-weight:500;font-size:11px;opacity:.75;line-height:1.3;margin:2px 0}';
(D.head || D.documentElement).appendChild(css);
var row = null, saving = false, LIST = null;
function mb(b) { return Math.round(b / 1e6) + ' МБ'; }
function upd() { if (!row) return; var bi = row.querySelector('[data-a=inst]'), bs = row.querySelector('[data-a=save]'), t = row.querySelector('small');
  bi.hidden = standalone() || (!inst && !IOS); bi.textContent = '📲 Установить как приложение';
  if (!saving) { var ok = g('kursy_offline'); bs.disabled = false; bs.textContent = ok ? '✓ Курс сохранён - обновить файлы' : '💾 Сохранить курс на устройство' + (LIST ? ' (' + mb(LIST.bytes) + ')' : '');
    t.textContent = ok ? 'Курс открывается и без интернета. Вход и прогресс уходят на сервер, когда есть сеть.' : (standalone() ? 'Сохрани файлы - курс будет открываться быстрее и без интернета.' : 'Установи курс значком на рабочий стол или экран телефона.'); } }
function install() { if (inst) { var e = inst; inst = null; try { e.prompt(); e.userChoice.then(upd, upd); } catch (er) {} upd(); return; }
  if (IOS) alertBox('На iPhone: откройте курс в Safari, нажмите "Поделиться" (квадрат со стрелкой) и выберите "На экран Домой".'); }
function alertBox(txt) { var t = row.querySelector('small'); t.textContent = txt; }
function save() { if (saving) return; if (!('serviceWorker' in navigator)) return alertBox('Этот браузер не умеет хранить курс на устройстве.');
  var bs = row.querySelector('[data-a=save]'); saving = true; bs.disabled = true; bs.textContent = '⏳ Готовим список файлов...';
  fetch('fayly.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (L) { LIST = L;
    return (reg ? Promise.resolve(reg) : navigator.serviceWorker.ready).then(function (r) { var sw = r.active || r.waiting || r.installing; if (!sw) throw new Error('нет помощника');
      var base = new URL('./', location.href).href, urls = L.files.map(function (f) { return base + f.split('/').map(encodeURIComponent).join('/'); });
      var onMsg = function (e) { var d = e.data || {}; if (d.total == null) return; var p = Math.round(100 * d.saved / d.total);
        bs.textContent = (d.fin ? '✓ ' : '⏳ Сохраняем курс: ') + (d.fin ? 'Курс сохранён' : p + '%');
        if (d.fin) { navigator.serviceWorker.removeEventListener('message', onMsg); saving = false; if (d.bad < d.total / 10) s('kursy_offline', String(Date.now())); upd();
          if (d.bad) alertBox('Не скачалось файлов: ' + d.bad + '. Можно нажать ещё раз, когда сеть будет лучше.'); } };
      navigator.serviceWorker.addEventListener('message', onMsg);
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
      sw.postMessage({ save: urls, force: !!g('kursy_offline') }); }); })
  .catch(function (e) { saving = false; upd(); alertBox('Не получилось: ' + (e && e.message || e) + '. Нужен интернет и адрес https.'); }); }
function mount() { var pn = D.getElementById('muzP'); if (!pn || row) return !!row;
  row = D.createElement('div'); row.id = 'pwaR';
  row.innerHTML = '<button type="button" class="pri" data-a="inst" hidden></button><button type="button" data-a="save"></button><small></small>';
  pn.appendChild(row); row.querySelector('[data-a=inst]').onclick = install; row.querySelector('[data-a=save]').onclick = save;
  fetch('fayly.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (L) { LIST = L; upd(); }).catch(function () {});
  upd(); return true; }
if (!mount()) { var n = 0, iv = setInterval(function () { if (mount() || ++n > 120) clearInterval(iv); }, 250); }
W.KURS_PWA = { install: install, save: save, get canInstall() { return !!inst; }, standalone: standalone };
})();
