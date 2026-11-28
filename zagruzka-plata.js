/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* zagruzka-plata.js - загрузка "микросхема" для Лётной школы (28.11.2026, образец Alexandr: видео zagruzka.mp4).
   В центре микросхема с надписью "Загрузка", от её ножек расходятся тонкие дорожки, по дорожкам от краёв к микросхеме бегут цветные огоньки.
   Только при KMN_UL (shkola.html; ?ul=0 - как было). Всё своё: SVG и CSS, без картинок и чужих файлов.
   Где показывается: первый экран школы (#shLoad), лифт (#shRide), сборка комнаты (#zgr из zagruzka.js), комнаты-iframe (#komOv из komnaty.js).
   Подключать сразу после <div id="shLoad"> (без defer): первый экран меняется до первой отрисовки.
   PLATA.svg(текст) - разметка анимации; PLATA.mount(элемент, текст) - вставить в элемент. */
(function () {
'use strict';
if (!window.KMN_UL) return;
var D = document;
/* дорожки: от дальнего конца к ножке микросхемы (огонёк бежит по направлению пути) и цвет огонька */
var LEFT = [['M40 40H115V82H155', '#a855f7'], ['M28 62H100V94H155', '#38bdf8'], ['M18 112H80V106H155', '#facc15'], ['M40 160H115V118H155', '#22c55e']];
var RIGHT = [['M372 30H290V82H245', '#38bdf8'], ['M386 52H305V94H245', '#22c55e'], ['M382 106H245', '#ef4444'], ['M366 152H300V118H245', '#facc15']];
var DUR = [2.2, 1.9, 2.5, 2.05, 2.35, 1.8, 2.15, 2.6], DEL = [0, .55, 1.1, .3, .8, .15, 1.3, .65];
var CSS = "@font-face{font-family:MnU;font-weight:200 900;font-display:swap;src:url(trenazhery/shrifty/unbounded-kir.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}" +
  "@font-face{font-family:MnU;font-weight:200 900;font-display:swap;src:url(trenazhery/shrifty/unbounded-lat.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F}" +
  '.pl-w{display:flex;flex-direction:column;align-items:center;gap:14px;width:min(88vw,520px)}' +
  '.pl-w svg{width:100%;height:auto;display:block;overflow:visible}' +
  '.pl-t{fill:none;stroke:#2c2c2e;stroke-width:1}' +
  '.pl-g{fill:none;stroke-width:1.6;stroke-linecap:round;stroke-dasharray:9 120;stroke-dashoffset:9;animation:plRun var(--d,2s) cubic-bezier(.45,.05,.55,.95) var(--l,0s) infinite}' +
  '.pl-h{stroke-width:5;opacity:.28}' +
  '.pl-n{fill:#8d8d92}' +
  '.pl-x{font:300 13px MnU,Unbounded,"Segoe UI",system-ui,sans-serif;letter-spacing:.06em;fill:#d6d6da}' +
  '@keyframes plRun{0%{stroke-dashoffset:9}100%{stroke-dashoffset:-104}}' +
  '@media (prefers-reduced-motion:reduce){.pl-g{animation-duration:calc(var(--d,2s) * 3)}}' +
  /* первый экран */
  '#shLoad.pl-on{background:#0b0b0c!important;font:300 13px MnU,Unbounded,system-ui,sans-serif!important;color:#9a9aa0!important}' +
  /* сборка комнаты (zagruzka.js): вместо круга - микросхема, текст тонкий и мелкий */
  '#zgr.pl-on{background:#0b0b0c;gap:10px}' +
  '#zgr.pl-on .zg-k{width:auto;height:auto}#zgr.pl-on .zg-k>.zg-a,#zgr.pl-on .zg-k>.zg-b,#zgr.pl-on .zg-k>.zg-c,#zgr.pl-on .zg-d,#zgr.pl-on .zg-dots{display:none}' +
  '#zgr.pl-on .zg-k>.pl-w{position:static;border-radius:0}' +
  '#zgr.pl-on .zg-s{font:300 10px/1 MnU,Unbounded,system-ui,sans-serif;letter-spacing:.24em;color:#8a867d;margin-top:6px}' +
  '#zgr.pl-on .zg-t{font:300 clamp(15px,3.6vmin,20px)/1.25 MnU,Unbounded,system-ui,sans-serif;color:#ece8e0;letter-spacing:.02em}' +
  '#zgr.pl-on .zg-x{font:300 12px/1.4 MnU,Unbounded,system-ui,sans-serif;color:#8a867d;min-height:17px}' +
  /* лифт */
  'body.sh-rd #shRide.pl-on{background:#0b0b0c}' +
  '#shRide.pl-on #shRideN,#shRide.pl-on #shRideT,#shRide.pl-on #shRideF{display:none!important}' +
  '#shRide.pl-on .bar{width:min(60vw,240px);height:1px;border-radius:0;background:#2c2c2e!important;margin-top:18px}#shRide.pl-on .bar i{background:#c8c8cc;border-radius:0}' +
  '#shRide.pl-on #shRideX{font:300 12px/1.4 MnU,Unbounded,system-ui,sans-serif;color:#8a867d;margin-top:12px}' +
  /* комнаты-iframe: пока комната не готова, видна микросхема */
  '#komOv .pl-k{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0b0b0c;transition:opacity .45s}' +
  '#komOv .pl-k.gone{opacity:0;pointer-events:none}#komOv.pl-wait iframe{opacity:0}#komOv iframe{transition:opacity .45s}';
function svg(text) {
  var s = '<svg viewBox="0 0 400 200" aria-hidden="true"><defs><linearGradient id="plC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232325"/><stop offset="1" stop-color="#121213"/></linearGradient></defs>';
  var all = LEFT.concat(RIGHT), i;
  for (i = 0; i < all.length; i++) s += '<path class="pl-t" d="' + all[i][0] + '"/>';
  for (i = 0; i < all.length; i++) { var st = 'style="--d:' + DUR[i] + 's;--l:' + DEL[i] + 's;stroke:' + all[i][1] + '"';
    s += '<path class="pl-g pl-h" pathLength="100" d="' + all[i][0] + '" ' + st + '/><path class="pl-g" pathLength="100" d="' + all[i][0] + '" ' + st + '/>'; }
  s += '<rect x="155" y="68" width="90" height="64" rx="11" fill="url(#plC)" stroke="#2f2f32"/>';
  [82, 94, 106, 118].forEach(function (y) { s += '<rect class="pl-n" x="151" y="' + (y - 2.2) + '" width="5" height="4.4" rx="1"/><rect class="pl-n" x="244" y="' + (y - 2.2) + '" width="5" height="4.4" rx="1"/>'; });
  s += '<text class="pl-x" x="200" y="104.5" text-anchor="middle">' + (text || 'Загрузка') + '</text></svg>';
  return '<div class="pl-w">' + s + '</div>'; }
function mount(el, text) { if (!el || el.querySelector('.pl-w')) return; var w = D.createElement('div'); w.innerHTML = svg(text); el.insertBefore(w.firstChild, el.firstChild); el.classList.add('pl-on'); }
var st = D.createElement('style'); st.textContent = CSS; (D.head || D.documentElement).appendChild(st);
window.PLATA = { svg: svg, mount: mount };

/* 1. первый экран: подпись "Открываем лётную школу..." уходит под микросхему */
var sl = D.getElementById('shLoad');
if (sl) { var cap = sl.textContent; sl.textContent = ''; sl.style.flexDirection = 'column'; mount(sl); var c = D.createElement('div'); c.textContent = cap; c.style.marginTop = '12px'; sl.appendChild(c); }

/* 2-4. после загрузки страницы: экран сборки, лифт, комнаты-iframe */
function later() {
  var Z = window.KURS_ZAGRUZKA;
  if (Z && !Z.__pl) { Z.__pl = 1; var sh = Z.show; Z.show = function (o) { var r = sh.apply(this, arguments); mount(D.getElementById('zgr')); return r; }; }
  mount(D.getElementById('shRide'));
  /* комнаты-iframe (komnaty.js): микросхема поверх, пока внутри комнаты виден её экран "ЗАГРУЗКА" */
  new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.id === 'komOv') room(n); }); }); }).observe(D.body, { childList: true });
}
function room(ov) { var f = ov.querySelector('iframe'); if (!f || ov.querySelector('.pl-k')) return;
  var k = D.createElement('div'); k.className = 'pl-k'; k.innerHTML = svg(); ov.appendChild(k); ov.classList.add('pl-wait', 'on');   /* сразу видно: komnaty.js показывает слой только после загрузки страницы комнаты */
  var t0 = Date.now(), iv = setInterval(function () { var ready = false;
    try { var d = f.contentDocument; ready = !!(d && d.readyState === 'complete' && !d.getElementById('load')); } catch (e) { ready = true; }
    if (!ov.parentNode) { clearInterval(iv); return; }
    if (ready || Date.now() - t0 > 60000) { clearInterval(iv); ov.classList.remove('pl-wait'); k.classList.add('gone'); setTimeout(function () { if (k.parentNode) k.remove(); }, 500); } }, 120); }
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', later); else later();
})();
