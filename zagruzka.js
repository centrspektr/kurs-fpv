/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* zagruzka.js - экран загрузки при входе в модуль (21.11.2026, просьба Alexandr: "проваливаемся в модуль, идёт загрузка, круг,
   и когда локация подгрузится - спокойно начинается движение").
   KURS_ZAGRUZKA.show({ title, sub, color }) - показать; .step(текст, доля 0..1) - что делаем сейчас; .hide(cb) - плавно убрать.
   KURS_ZAGRUZKA.pending() - сколько файлов (фактуры, модели) ещё грузится через THREE.DefaultLoadingManager.
   KURS_ZAGRUZKA.waitFiles(maxMs) -> Promise - дождаться, пока все файлы догрузятся (не дольше maxMs).
   Круг крутится средствами CSS (transform), поэтому не замирает, даже когда браузер занят сборкой сцены. */
(function () {
'use strict';
var D = document, el = null, bar = null, txt = null, pct = null, shown = false, prog = 0;
/* счётчик файлов в загрузке */
var pend = 0, waiters = [];
function hook() { var T = window.THREE; if (!T || !T.DefaultLoadingManager || T.DefaultLoadingManager.__zg) return !!(T && T.DefaultLoadingManager);
  var M = T.DefaultLoadingManager; M.__zg = 1; var s = M.itemStart, e = M.itemEnd, er = M.itemError;
  M.itemStart = function (u) { pend++; return s.call(this, u); };
  M.itemEnd = function (u) { pend = Math.max(0, pend - 1); if (!pend) { var w = waiters; waiters = []; w.forEach(function (f) { f(); }); } return e.call(this, u); };
  M.itemError = function (u) { return er.call(this, u); };
  return true; }
if (!hook()) { var iv = setInterval(function () { if (hook()) clearInterval(iv); }, 20); setTimeout(function () { clearInterval(iv); }, 30000); }
function waitFiles(ms) { return new Promise(function (res) { if (!pend) return res(true); var done = false, f = function () { if (!done) { done = true; res(true); } }; waiters.push(f); setTimeout(function () { if (!done) { done = true; res(false); } }, ms || 15000); }); }

var css = D.createElement('style');
css.textContent = '#zgr{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(120% 90% at 50% 40%,#141a3c 0%,#070914 60%,#03040a 100%);color:#fff;opacity:0;transition:opacity .45s;pointer-events:none;font:600 14px/1.35 Manrope,system-ui,sans-serif;--zc:#7cf3ff}' +
  '#zgr.on{opacity:1;pointer-events:auto}' +
  '#zgr .zg-k{position:relative;width:min(46vmin,220px);height:min(46vmin,220px)}' +
  '#zgr .zg-k>*{position:absolute;inset:0;border-radius:50%}' +
  '#zgr .zg-a{background:conic-gradient(from 0deg,transparent 0 55%,var(--zc) 92%,#fff 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 7px),#000 calc(100% - 6px));mask:radial-gradient(farthest-side,transparent calc(100% - 7px),#000 calc(100% - 6px));animation:zgR 1.1s linear infinite;filter:drop-shadow(0 0 10px var(--zc))}' +
  '#zgr .zg-b{inset:18px;border:2px dashed rgba(255,255,255,.18);animation:zgR 9s linear infinite reverse}' +
  '#zgr .zg-c{inset:34px;background:conic-gradient(from -90deg,var(--zc) calc(var(--p,0) * 1%),rgba(255,255,255,.07) 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3px));transition:--p .3s}' +
  '#zgr .zg-d{inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}' +
  '#zgr .zg-d svg{width:40%;height:40%;animation:zgF 2.4s ease-in-out infinite}' +
  '#zgr .zg-d svg .pr{transform-box:fill-box;transform-origin:center;animation:zgR .25s linear infinite}' +
  '#zgr .zg-p{font:800 15px/1 Unbounded,"Arial Black",system-ui,sans-serif;color:var(--zc);margin-top:4px;letter-spacing:.04em}' +
  '#zgr .zg-s{font:700 12px/1 Manrope,system-ui,sans-serif;letter-spacing:.24em;color:var(--zc);text-transform:uppercase;opacity:.9}' +
  '#zgr .zg-t{font:800 clamp(20px,4.4vmin,32px)/1.15 Unbounded,"Arial Black",system-ui,sans-serif;text-align:center;max-width:90vw}' +
  '#zgr .zg-x{min-height:20px;opacity:.75;text-align:center;max-width:90vw}' +
  '#zgr .zg-dots i{display:inline-block;width:6px;height:6px;margin:0 3px;border-radius:50%;background:var(--zc);animation:zgD 1s ease-in-out infinite}#zgr .zg-dots i:nth-child(2){animation-delay:.15s}#zgr .zg-dots i:nth-child(3){animation-delay:.3s}' +
  '@keyframes zgR{to{transform:rotate(360deg)}}@keyframes zgF{0%,100%{transform:translateY(-5%)}50%{transform:translateY(5%)}}@keyframes zgD{0%,100%{transform:scale(.5);opacity:.35}50%{transform:scale(1);opacity:1}}' +
  '@media (prefers-reduced-motion:reduce){#zgr .zg-a,#zgr .zg-b,#zgr .zg-d svg{animation-duration:4s}}';
(D.head || D.documentElement).appendChild(css);
/* дрон в центре круга: винты крутятся */
var DRON = '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M27 27 73 73M73 27 27 73"/><rect x="38" y="40" width="24" height="20" rx="6" fill="currentColor" stroke="none"/>' +
  [[22, 22], [78, 22], [22, 78], [78, 78]].map(function (p) { return '<g class="pr"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="16" ry="4" stroke-width="3"/></g>'; }).join('') + '</svg>';
function make() { if (el) return; el = D.createElement('div'); el.id = 'zgr'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="zg-k"><div class="zg-a"></div><div class="zg-b"></div><div class="zg-c"></div><div class="zg-d" style="color:var(--zc)">' + DRON + '<div class="zg-p">0%</div></div></div>' +
    '<div class="zg-s"></div><div class="zg-t"></div><div class="zg-x"></div><div class="zg-dots"><i></i><i></i><i></i></div>';
  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'click'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
  D.body.appendChild(el); bar = el.querySelector('.zg-c'); txt = el.querySelector('.zg-x'); pct = el.querySelector('.zg-p'); }
function show(o) { o = o || {}; make(); prog = 0; set(0); el.style.setProperty('--zc', o.color || '#7cf3ff');
  el.querySelector('.zg-s').textContent = o.sub || ''; el.querySelector('.zg-t').textContent = o.title || ''; txt.textContent = o.text || 'Загружаем локацию';
  el.style.transition = o.instant ? 'none' : ''; el.classList.add('on'); el.offsetWidth; el.style.transition = ''; shown = true; }
function set(p) { prog = Math.max(prog, Math.min(1, p)); var v = Math.round(prog * 100); bar.style.setProperty('--p', v); pct.textContent = v + '%'; }
function step(t, p) { if (!el) return; if (t) txt.textContent = t; if (p != null) set(p); }
/* дать браузеру нарисовать экран (два кадра), потом продолжить */
function paint() { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(r, 0); }); }); }); }
function hide(cb) { if (!el || !shown) { if (cb) cb(); return; } set(1); shown = false; setTimeout(function () { el.classList.remove('on'); if (cb) setTimeout(cb, 0); }, 180); }
window.KURS_ZAGRUZKA = { show: show, step: step, hide: hide, paint: paint, waitFiles: waitFiles, pending: function () { return pend; }, get on() { return shown; } };
})();
