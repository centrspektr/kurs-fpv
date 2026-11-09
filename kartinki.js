/* Курс FPV: свои картинки карточек (09.11.2026). Рисунки кодом (SVG), вместо эмодзи, которые не совпадали с текстом
   (кость вместо рамы, плавательные очки вместо FPV-очков, дверь вместо гоночных ворот...).
   В карточке: pic: 'rama', 'motor', 'vint', 'fc', 'esc', 'rx', 'bind', 'failsafe', 'kamera', 'vtx', 'kanaly', 'analog',
   'pult', 'pult:osi' (с подписями осей), 'pultochki', 'razmer', 'dron:3', 'dron:5', 'zaezd', 'vorota', 'trassa', 'zapis'.
   Движок (moduli.js) берёт их через K.pic. Подключать после zadaniya.js. */
(function () {
'use strict';
var K = window.VZ_KURS; if (!K) return;

var css = document.createElement('style');
css.textContent = '.kk-spin{transform-box:fill-box;transform-origin:center;animation:kkSpin .45s linear infinite}.kk-spin.r{animation-direction:reverse}' +
  '.kk-slow{transform-box:fill-box;transform-origin:center;animation:kkSpin 6s linear infinite}' +
  '.kk-fly{animation:kkHover 2.8s ease-in-out infinite}.kk-blink{animation:kkBlink 1.1s ease-in-out infinite}' +
  '.kk-dash{stroke-dasharray:6 6;animation:kkDash 1.6s linear infinite}.kk-wave{animation:kkWave 1.6s ease-out infinite}' +
  '.kk-noise{animation:kkNoise .25s steps(2) infinite}.kk-fall{animation:kkFall 2.4s ease-in infinite}' +
  '@keyframes kkSpin{to{transform:rotate(360deg)}}@keyframes kkHover{50%{transform:translateY(-5px)}}@keyframes kkBlink{50%{opacity:.25}}' +
  '@keyframes kkDash{to{stroke-dashoffset:-24}}@keyframes kkWave{0%{opacity:0}30%{opacity:1}100%{opacity:0}}' +
  '@keyframes kkNoise{50%{transform:translateY(3px)}}@keyframes kkFall{0%,30%{transform:translateY(0)}90%,100%{transform:translateY(34px);opacity:.25}}' +
  '.kk-t{fill:#cbd5ff;font:600 12px system-ui,sans-serif;text-anchor:middle}.kk-tb{fill:#fff;font:800 12px system-ui,sans-serif;text-anchor:middle}' +
  '.kk-ts{fill:#cbd5ff;font:700 10px system-ui,sans-serif;text-anchor:middle}.kk-m{font-family:ui-monospace,Menlo,monospace}' +
  '@media (prefers-reduced-motion:reduce){.kk-spin,.kk-slow,.kk-fly,.kk-blink,.kk-dash,.kk-wave,.kk-noise,.kk-fall{animation:none}}';
document.head.appendChild(css);

/* общий холст 240x140 и подпись снизу */
function S(body, cap, defs) {
  return '<svg viewBox="0 0 240 140" class="kpic" aria-hidden="true">' + (defs ? '<defs>' + defs + '</defs>' : '') + body +
    (cap ? '<text x="120" y="134" class="kk-t">' + cap + '</text>' : '') + '</svg>';
}
var CARBON = '<pattern id="kk-cb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#1f2937"/><rect width="3" height="6" fill="#2b3647"/></pattern>';

/* квадрокоптер сверху: центр, радиус до мотора, винты (d - диаметр в долях), защита винтов */
function quad(cx, cy, r, o) {
  o = o || {}; var d = o.d || .9, a = r * .7071, P = [[-a, -a], [a, -a], [-a, a], [a, a]], s = '', pr = r * d * .62;
  s += '<path d="M' + (cx - a) + ' ' + (cy - a) + 'L' + (cx + a) + ' ' + (cy + a) + 'M' + (cx + a) + ' ' + (cy - a) + 'L' + (cx - a) + ' ' + (cy + a) + '" stroke="' + (o.arm || '#111827') + '" stroke-width="' + Math.max(3, r * .2) + '" stroke-linecap="round"/>';
  P.forEach(function (p, i) {
    var x = cx + p[0], y = cy + p[1];
    if (o.duct) s += '<circle cx="' + x + '" cy="' + y + '" r="' + (pr + 2) + '" fill="rgba(148,163,184,.10)" stroke="#64748b" stroke-width="' + Math.max(2, r * .09) + '"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="' + Math.max(2.5, r * .16) + '" fill="#475569" stroke="#cbd5e1" stroke-width="1"/>';
    if (!o.stop) s += '<circle cx="' + x + '" cy="' + y + '" r="' + pr + '" fill="' + (i === 0 || i === 1 ? '#38bdf8' : '#a78bfa') + '" opacity=".13"/>';
    if (!o.stop) s += '<g class="kk-spin' + (i === 0 || i === 3 ? '' : ' r') + '"><path d="M' + (x - pr) + ' ' + y + 'Q' + x + ' ' + (y - pr * .28) + ' ' + (x + pr) + ' ' + y + 'Q' + x + ' ' + (y + pr * .28) + ' ' + (x - pr) + ' ' + y + 'Z" fill="' + (i === 0 || i === 1 ? '#38bdf8' : '#a78bfa') + '" opacity=".75"/></g>';
    else s += '<path d="M' + (x - pr) + ' ' + y + 'Q' + x + ' ' + (y - pr * .28) + ' ' + (x + pr) + ' ' + y + 'Q' + x + ' ' + (y + pr * .28) + ' ' + (x - pr) + ' ' + y + 'Z" fill="' + (i === 0 || i === 1 ? '#38bdf8' : '#a78bfa') + '" opacity=".75" transform="rotate(' + (25 + i * 40) + ' ' + x + ' ' + y + ')"/>';
  });
  var b = r * .34;
  s += '<rect x="' + (cx - b * .7) + '" y="' + (cy - b) + '" width="' + b * 1.4 + '" height="' + b * 2 + '" rx="' + b * .3 + '" fill="' + (o.body || '#334155') + '" stroke="#94a3b8" stroke-width="1"/>';
  s += '<circle cx="' + cx + '" cy="' + (cy - b * .7) + '" r="' + b * .32 + '" fill="#0f172a" stroke="#e2e8f0" stroke-width="1"/>';
  return s;
}

/* пульт: x,y - левый верхний угол, s - масштаб */
function pult(x, y, s, osi) {
  var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">';
  g += '<path d="M14 30 Q12 10 40 10 L120 10 Q148 10 146 30 L150 74 Q152 92 132 92 L28 92 Q8 92 10 74Z" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>';
  g += '<rect x="66" y="0" width="28" height="12" rx="4" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>';
  g += '<path d="M24 12 L20 2 M136 12 L140 2" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>';
  g += '<rect x="64" y="24" width="32" height="20" rx="3" fill="#0b1220" stroke="#475569"/><rect x="68" y="28" width="16" height="3" rx="1" fill="#4ade80"/><rect x="68" y="34" width="22" height="3" rx="1" fill="#38bdf8" opacity=".7"/>';
  [[44, 56], [116, 56]].forEach(function (c, i) {
    g += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="22" fill="#0f172a" stroke="#64748b" stroke-width="2"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="15" fill="none" stroke="#334155" stroke-width="1.5"/>';
    g += '<g><circle cx="' + c[0] + '" cy="' + c[1] + '" r="6.5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"><animate attributeName="cx" values="' + c[0] + ';' + (c[0] + (i ? 8 : 0)) + ';' + c[0] + ';' + (c[0] - (i ? 0 : 8)) + ';' + c[0] + '" dur="4s" repeatCount="indefinite"/><animate attributeName="cy" values="' + c[1] + ';' + (c[1] - (i ? 0 : 8)) + ';' + c[1] + ';' + (c[1] + (i ? 8 : 0)) + ';' + c[1] + '" dur="4s" repeatCount="indefinite"/></circle></g>';
  });
  g += '<circle cx="80" cy="74" r="4" fill="#f87171" class="kk-blink"/>';
  if (osi) {
    g += '<text x="44" y="108" class="kk-ts" style="font-size:11px">газ + поворот</text><text x="116" y="108" class="kk-ts" style="font-size:11px">наклоны</text>';
    g += '<path d="M44 30v-6M44 82v6M18 56h-6M70 56h6" stroke="#facc15" stroke-width="2" stroke-linecap="round"/><path d="M116 30v-6M116 82v6M90 56h-6M142 56h6" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>';
  }
  return g + '</g>';
}
/* FPV-очки коробкой с антеннами (маленькие) */
function ochki(x, y, s) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
    '<path d="M-6 40 Q-8 26 12 28 L12 46 Q-2 48 -6 40Z M106 40 Q108 26 88 28 L88 46 Q102 48 106 40Z" fill="#7c3aed"/>' +
    '<path d="M24 14 L18 0 M76 14 L84 0" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/><rect x="12" y="-6" width="12" height="9" rx="3" fill="#334155" stroke="#94a3b8"/><ellipse cx="85" cy="-2" rx="7" ry="4" fill="#334155" stroke="#94a3b8"/>' +
    '<rect x="8" y="12" width="84" height="44" rx="12" fill="#475569" stroke="#cbd5e1" stroke-width="2"/><rect x="15" y="18" width="70" height="28" rx="7" fill="#0b1220"/><rect x="22" y="40" width="56" height="2.5" rx="1" fill="#00d4ff"/>' +
    '<path d="M40 56 Q50 48 60 56Z" fill="#0f172a"/></g>';
}
/* волны радиосигнала от точки (x,y) в сторону dir (1 вправо, -1 влево) */
function waves(x, y, dir, col, n) {
  var s = '';
  for (var i = 0; i < (n || 3); i++) { var r = 10 + i * 9;
    s += '<path d="M' + (x + dir * r * .7) + ' ' + (y - r * .7) + 'A' + r + ' ' + r + ' 0 0 ' + (dir > 0 ? 1 : 0) + ' ' + (x + dir * r * .7) + ' ' + (y + r * .7) + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linecap="round" class="kk-wave" style="animation-delay:' + i * .25 + 's"/>'; }
  return s;
}

var P = {};

/* рама: карбоновый X сверху, отверстия под моторы и стек, стойки */
P.rama = function () {
  var s = '<g class="kk-fly">', C = [120, 66], L = 50;
  [[-1, -1], [1, 1], [1, -1], [-1, 1]].forEach(function (d) {
    var x = C[0] + d[0] * L, y = C[1] + d[1] * L * .9, ang = Math.atan2(d[1] * .9, d[0]) * 180 / Math.PI;
    s += '<rect x="' + (C[0]) + '" y="' + (C[1] - 7) + '" width="' + (L * 1.3) + '" height="14" rx="7" fill="url(#kk-cb)" stroke="#64748b" stroke-width="1.5" transform="rotate(' + ang + ' ' + C[0] + ' ' + C[1] + ')"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="13" fill="url(#kk-cb)" stroke="#64748b" stroke-width="1.5"/><circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#0b1020"/>';
    for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; s += '<circle cx="' + (x + Math.cos(a) * 7.5) + '" cy="' + (y + Math.sin(a) * 7.5) + '" r="1.6" fill="#0b1020"/>'; }
  });
  s += '<rect x="' + (C[0] - 24) + '" y="' + (C[1] - 22) + '" width="48" height="44" rx="8" fill="url(#kk-cb)" stroke="#94a3b8" stroke-width="1.5"/>';
  [[-10, -10], [10, -10], [-10, 10], [10, 10]].forEach(function (o) { s += '<circle cx="' + (C[0] + o[0]) + '" cy="' + (C[1] + o[1]) + '" r="2.4" fill="#0b1020" stroke="#475569"/>'; });
  [[-19, -17], [19, -17], [-19, 17], [19, 17]].forEach(function (o) { s += '<circle cx="' + (C[0] + o[0]) + '" cy="' + (C[1] + o[1]) + '" r="3.2" fill="#a855f7" stroke="#e9d5ff" stroke-width="1"/>'; });
  s += '<text x="' + C[0] + '" y="' + (C[1] + 3) + '" class="kk-ts" style="fill:#94a3b8;font-size:8px">карбон</text></g>';
  s += '<path d="M28 18 L60 24" stroke="#cbd5ff" stroke-width="1" opacity=".6"/><text x="26" y="15" class="kk-ts" style="text-anchor:start">луч</text>';
  s += '<path d="M206 18 L180 28" stroke="#cbd5ff" stroke-width="1" opacity=".6"/><text x="212" y="15" class="kk-ts">стойка</text>';
  return S(s, 'карбоновая рама, вид сверху', CARBON);
};

/* размер: Mobula 7, 3 дюйма, 5 дюймов рядом, в одном масштабе */
P.razmer = function () {
  var s = quad(34, 70, 13, { duct: 1, d: 1, body: '#ea580c' }) + quad(100, 66, 24, { d: .95 }) + quad(186, 64, 34, { d: .95 });
  s += '<path d="M25 79 L43 61" stroke="#facc15" stroke-width="1.6" stroke-dasharray="3 3"/>';
  s += '<text x="34" y="104" class="kk-tb">75 мм</text><text x="34" y="117" class="kk-ts">Mobula 7</text>';
  s += '<text x="100" y="104" class="kk-tb">3 дюйма</text><text x="186" y="117" class="kk-tb">5 дюймов</text>';
  return S(s, 'размер по диагонали или по винтам');
};

/* бесколлекторный мотор: колокол с магнитами вокруг медных катушек */
P.motor = function () {
  var s = '<defs><linearGradient id="kk-bell" x1="0" x2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset=".45" stop-color="#c4b5fd"/><stop offset="1" stop-color="#5b21b6"/></linearGradient>' +
    '<linearGradient id="kk-cu" x1="0" x2="1"><stop offset="0" stop-color="#b45309"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#92400e"/></linearGradient></defs>';
  s += '<rect x="58" y="88" width="64" height="12" rx="3" fill="#475569" stroke="#94a3b8"/>';
  s += '<rect x="62" y="42" width="56" height="48" rx="6" fill="url(#kk-bell)" stroke="#ddd6fe" stroke-width="1.5"/>';
  for (var i = 0; i < 4; i++) s += '<rect x="' + (68 + i * 12.5) + '" y="52" width="7" height="26" rx="2" fill="url(#kk-cu)"/>';
  s += '<ellipse cx="90" cy="42" rx="28" ry="7" fill="#a78bfa" stroke="#ddd6fe"/><rect x="86" y="18" width="8" height="26" rx="2" fill="#cbd5e1" stroke="#64748b"/><rect x="84" y="24" width="12" height="4" fill="#94a3b8"/>';
  s += '<path d="M70 100 C70 116 40 112 30 118 M90 100 C90 118 60 118 46 124 M110 100 C110 120 80 122 62 128" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round" opacity=".85"/>';
  /* справа: вид сверху - магниты по кругу, катушки внутри */
  var cx = 186, cy = 62; s += '<circle cx="' + cx + '" cy="' + cy + '" r="36" fill="#1e1b4b" stroke="#a78bfa" stroke-width="3"/>';
  s += '<g class="kk-slow">'; for (i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += '<rect x="' + (cx - 4) + '" y="' + (cy - 33) + '" width="8" height="7" rx="1.5" fill="' + (i % 2 ? '#ef4444' : '#3b82f6') + '" transform="rotate(' + (i * 30) + ' ' + cx + ' ' + cy + ')"/>'; } s += '</g>';
  for (i = 0; i < 9; i++) s += '<rect x="' + (cx - 3.5) + '" y="' + (cy - 24) + '" width="7" height="16" rx="2" fill="url(#kk-cu)" transform="rotate(' + (i * 40) + ' ' + cx + ' ' + cy + ')"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#cbd5e1"/>';
  s += '<text x="186" y="114" class="kk-ts">магниты крутятся</text><text x="186" y="125" class="kk-ts">вокруг катушек</text>';
  s += '<text x="150" y="30" class="kk-ts" style="text-anchor:end">колокол</text>';
  return S(s, '');
};

/* винт: сверху крутится, сбоку - лопасть как крыло, воздух вниз, дрон вверх */
P.vint = function () {
  var s = '<g class="kk-spin" style="animation-duration:1.4s">';
  for (var i = 0; i < 3; i++) s += '<path d="M60 62 C66 52 84 30 98 26 C102 25 104 28 101 32 C92 44 74 58 60 62Z" fill="#38bdf8" opacity=".85" stroke="#bae6fd" stroke-width="1" transform="rotate(' + (i * 120) + ' 60 62)"/>';
  s += '</g><circle cx="60" cy="62" r="8" fill="#334155" stroke="#cbd5e1" stroke-width="1.5"/><circle cx="60" cy="62" r="3" fill="#94a3b8"/>';
  s += '<path d="M150 50 Q175 34 214 46 Q178 50 150 54Z" fill="#38bdf8" stroke="#bae6fd" stroke-width="1"/>';
  for (i = 0; i < 4; i++) s += '<path d="M' + (160 + i * 14) + ' 66 v26" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round" class="kk-dash"/><path d="M' + (155 + i * 14) + ' 88 l5 7 l5 -7" fill="none" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"/>';
  s += '<path d="M182 34 v-20 M176 20 l6 -7 l6 7" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>';
  s += '<text x="210" y="22" class="kk-ts" style="fill:#4ade80">тяга</text><text x="182" y="112" class="kk-ts">воздух вниз</text><text x="60" y="124" class="kk-ts">лопасти - как крылья</text>';
  return S(s, '');
};

/* полётный контроллер: плата, процессор, гироскоп, площадки */
P.fc = function () {
  var s = '<g class="kk-fly"><rect x="70" y="16" width="100" height="100" rx="10" fill="#0f3d2e" stroke="#34d399" stroke-width="2"/>';
  [[80, 26], [160, 26], [80, 106], [160, 106]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#0b1020" stroke="#fbbf24" stroke-width="2"/>'; });
  for (var i = 0; i < 6; i++) { s += '<rect x="' + (93 + i * 9) + '" y="20" width="5" height="7" rx="1" fill="#fbbf24"/><rect x="' + (93 + i * 9) + '" y="105" width="5" height="7" rx="1" fill="#fbbf24"/>'; }
  s += '<path d="M120 66 H150 M120 60 H100 V40 M126 72 V96" stroke="#34d399" stroke-width="1.2" opacity=".6" fill="none"/>';
  s += '<rect x="102" y="48" width="36" height="36" rx="3" fill="#111827" stroke="#64748b"/>';
  for (i = 0; i < 7; i++) { s += '<rect x="' + (105 + i * 4.5) + '" y="44" width="2" height="4" fill="#cbd5e1"/><rect x="' + (105 + i * 4.5) + '" y="84" width="2" height="4" fill="#cbd5e1"/><rect x="98" y="' + (51 + i * 4.5) + '" width="4" height="2" fill="#cbd5e1"/><rect x="138" y="' + (51 + i * 4.5) + '" width="4" height="2" fill="#cbd5e1"/>'; }
  s += '<text x="120" y="70" class="kk-ts kk-m" style="fill:#94a3b8;font-size:8px">MCU</text>';
  s += '<rect x="146" y="40" width="14" height="14" rx="2" fill="#1f2937" stroke="#f472b6" stroke-width="1.5"/><circle cx="153" cy="47" r="2" fill="#f472b6" class="kk-blink"/>';
  s += '<rect x="80" y="86" width="12" height="8" rx="2" fill="#94a3b8"/><circle cx="154" cy="96" r="3" fill="#22c55e" class="kk-blink"/><circle cx="146" cy="96" r="3" fill="#3b82f6"/></g>';
  s += '<path d="M168 47 L194 40" stroke="#f472b6" stroke-width="1.2"/><text x="208" y="38" class="kk-ts" style="fill:#f9a8d4">гироскоп</text>';
  s += '<path d="M100 66 L50 52" stroke="#cbd5ff" stroke-width="1" opacity=".7"/><text x="34" y="50" class="kk-ts">процессор</text>';
  return S(s, 'полётный контроллер - плата-мозг');
};

/* регулятор 4 в 1: четыре группы транзисторов, площадки моторов, питание */
P.esc = function () {
  var s = '<rect x="64" y="14" width="112" height="104" rx="10" fill="#111827" stroke="#60a5fa" stroke-width="2"/>';
  [[76, 26, 'M1'], [140, 26, 'M2'], [76, 92, 'M3'], [140, 92, 'M4']].forEach(function (q) {
    for (var i = 0; i < 3; i++) s += '<rect x="' + (q[0] + i * 8) + '" y="' + q[1] + '" width="6" height="12" rx="1" fill="#0b0f19" stroke="#475569"/>';
    var px = q[0] < 100 ? 58 : 182; s += '<rect x="' + (px - 6) + '" y="' + (q[1] - 2) + '" width="12" height="16" rx="3" fill="#fbbf24"/>';
    s += '<text x="' + (q[0] < 100 ? 36 : 204) + '" y="' + (q[1] + 10) + '" class="kk-tb">' + q[2] + '</text>';
  });
  s += '<rect x="104" y="52" width="32" height="28" rx="3" fill="#1e293b" stroke="#64748b"/><text x="120" y="70" class="kk-ts kk-m" style="font-size:8px;fill:#94a3b8">ESC</text>';
  s += '<path d="M120 118 v10" stroke="#ef4444" stroke-width="5"/><path d="M110 118 v10" stroke="#111" stroke-width="5"/>';
  return S(s, '4 в 1: регулятор на каждый мотор');
};

/* приёмник с антенной, ловит пульт */
P.rx = function () {
  var s = pult(12, 30, .46) + waves(90, 52, 1, '#38bdf8', 3);
  s += '<g class="kk-fly"><rect x="146" y="52" width="40" height="28" rx="4" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/><rect x="152" y="58" width="16" height="12" rx="2" fill="#111827"/>';
  s += '<circle cx="178" cy="62" r="3" fill="#22c55e" class="kk-blink"/><path d="M186 66 C200 66 204 52 214 40 M214 40 L224 34" stroke="#e2e8f0" stroke-width="2" fill="none"/><rect x="210" y="34" width="10" height="6" rx="1" fill="#e2e8f0" transform="rotate(-30 215 37)"/>';
  for (var i = 0; i < 4; i++) s += '<rect x="' + (150 + i * 9) + '" y="80" width="5" height="6" fill="#fbbf24"/>';
  s += '</g><text x="166" y="102" class="kk-tb">приёмник</text><text x="48" y="102" class="kk-tb">пульт</text>';
  return S(s, 'приёмник слушает только свой пульт');
};

/* бинд: пульт и приёмник знакомятся, замок-цепочка */
P.bind = function () {
  var s = pult(8, 30, .46) + '<rect x="166" y="50" width="40" height="28" rx="4" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/><circle cx="196" cy="60" r="3" fill="#22c55e" class="kk-blink"/>';
  s += '<path d="M206 64 C218 62 220 48 226 40" stroke="#e2e8f0" stroke-width="2" fill="none"/>';
  s += '<path d="M84 64 H160" stroke="#facc15" stroke-width="2" class="kk-dash"/>';
  s += '<g transform="translate(122 64)"><rect x="-17" y="-8" width="20" height="16" rx="8" fill="none" stroke="#facc15" stroke-width="4"/><rect x="-3" y="-8" width="20" height="16" rx="8" fill="none" stroke="#fde68a" stroke-width="4"/></g>';
  s += '<text x="44" y="102" class="kk-tb">мой пульт</text><text x="186" y="98" class="kk-tb">мой приёмник</text>';
  return S(s, 'бинд - один раз, с тренером');
};

/* failsafe: связь пропала - моторы стоп, дрон опускается на месте */
P.failsafe = function () {
  var s = pult(8, 30, .42) + '<path d="M82 52 q10 12 0 24 M92 46 q14 18 0 36" fill="none" stroke="#64748b" stroke-width="2.5"/>';
  s += '<path d="M102 50 L118 66 M118 50 L102 66" stroke="#f87171" stroke-width="4" stroke-linecap="round"/>';
  s += '<g class="kk-fall">' + quad(180, 52, 20, { stop: 1 }) + '</g>';
  s += '<path d="M150 112 H210" stroke="#64748b" stroke-width="3" stroke-linecap="round"/><text x="180" y="124" class="kk-ts">моторы выключены</text>';
  s += '<text x="110" y="88" class="kk-tb" style="fill:#fca5a5">нет связи</text>';
  return S(s, '');
};

/* камера FPV: корпус, объектив, крепление */
P.kamera = function () {
  var s = '<defs><radialGradient id="kk-ln" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#60a5fa"/><stop offset=".45" stop-color="#1e3a8a"/><stop offset="1" stop-color="#020617"/></radialGradient></defs>';
  s += '<g class="kk-fly"><rect x="52" y="30" width="18" height="66" rx="4" fill="#475569" stroke="#94a3b8"/><rect x="170" y="30" width="18" height="66" rx="4" fill="#475569" stroke="#94a3b8"/>';
  s += '<circle cx="61" cy="63" r="4" fill="#cbd5e1"/><circle cx="179" cy="63" r="4" fill="#cbd5e1"/>';
  s += '<rect x="68" y="24" width="104" height="78" rx="10" fill="#1f2937" stroke="#cbd5e1" stroke-width="2"/>';
  s += '<circle cx="120" cy="63" r="30" fill="#0f172a" stroke="#64748b" stroke-width="3"/><circle cx="120" cy="63" r="22" fill="url(#kk-ln)"/><circle cx="112" cy="55" r="5" fill="#fff" opacity=".55"/><circle cx="127" cy="70" r="2" fill="#fff" opacity=".35"/>';
  s += '<circle cx="158" cy="34" r="2.5" fill="#f87171" class="kk-blink"/></g>';
  return S(s, 'камера FPV: маленькая, стоит на носу');
};

/* видеопередатчик с антенной и мощностью */
P.vtx = function () {
  var s = '<rect x="40" y="58" width="56" height="40" rx="5" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/><rect x="48" y="66" width="18" height="14" rx="2" fill="#0b0f19"/>';
  s += '<text x="68" y="92" class="kk-ts kk-m" style="font-size:8px;fill:#c4b5fd">VTX</text><rect x="86" y="70" width="14" height="10" rx="2" fill="#fbbf24"/>';
  s += '<path d="M100 75 C114 75 116 60 116 44" stroke="#e2e8f0" stroke-width="2.5" fill="none"/><rect x="111" y="22" width="10" height="24" rx="4" fill="#ef4444" stroke="#fecaca"/>';
  s += waves(116, 34, 1, '#a78bfa', 3) + waves(116, 34, -1, '#a78bfa', 2);
  [[25, 'зал', '#4ade80', 18], [200, 'больше - мешаешь', '#f97316', 34]].forEach(function (b, i) {
    s += '<rect x="' + (172 - 8 + i * 30) + '" y="' + (100 - b[3] * 1.6) + '" width="18" height="' + b[3] * 1.6 + '" rx="3" fill="' + b[2] + '"/>';
    s += '<text x="' + (173 + i * 30) + '" y="112" class="kk-ts kk-m">' + b[0] + '</text>';
  });
  s += '<text x="188" y="22" class="kk-ts">мощность, mW</text>';
  return S(s, 'видеопередатчик и антенна');
};

/* каналы 5,8 ГГц: у каждого пилота свой */
P.kanaly = function () {
  var col = ['#38bdf8', '#64748b', '#64748b', '#a78bfa', '#64748b', '#64748b', '#64748b', '#f97316'], s = '';
  for (var i = 0; i < 8; i++) {
    s += '<rect x="' + (24 + i * 24.5) + '" y="58" width="20" height="22" rx="4" fill="' + col[i] + '" opacity="' + (col[i] === '#64748b' ? .45 : 1) + '"/>';
    s += '<text x="' + (34 + i * 24.5) + '" y="73" class="kk-ts kk-m" style="fill:#0b1020">R' + (i + 1) + '</text>';
  }
  s += '<text x="120" y="48" class="kk-ts">5,8 ГГц</text>';
  [[34, '#38bdf8', 'пилот 1'], [107.5, '#a78bfa', 'пилот 2'], [205.5, '#f97316', 'пилот 3']].forEach(function (p) {
    s += '<path d="M' + p[0] + ' 84 v10" stroke="' + p[1] + '" stroke-width="2"/>' + ochki(p[0] - 16, 96, .32) + '<text x="' + p[0] + '" y="128" class="kk-ts" style="fill:' + p[1] + '">' + p[2] + '</text>';
  });
  return S(s, '');
};

/* аналог и цифра: та же картинка, рябь и чёткость */
P.analog = function () {
  var scene = function (x, id) {
    return '<clipPath id="' + id + '"><rect x="' + x + '" y="18" width="96" height="70" rx="8"/></clipPath><g clip-path="url(#' + id + ')"><rect x="' + x + '" y="18" width="96" height="70" fill="#38bdf8"/>' +
      '<path d="M' + x + ' 64 Q' + (x + 48) + ' 58 ' + (x + 96) + ' 62 V88 H' + x + 'Z" fill="#16a34a"/><path d="M' + (x + 30) + ' 70 V44 Q' + (x + 48) + ' 30 ' + (x + 66) + ' 44 V70" fill="none" stroke="#f97316" stroke-width="5" stroke-linecap="round"/>';
  };
  var s = scene(16, 'kk-a1') + '<g class="kk-noise">';
  for (var i = 0; i < 14; i++) s += '<rect x="16" y="' + (20 + i * 5) + '" width="96" height="1.5" fill="#fff" opacity="' + (.12 + (i % 3) * .08) + '"/>';
  s += '<rect x="16" y="46" width="96" height="6" fill="#fff" opacity=".18"/></g></g><rect x="16" y="18" width="96" height="70" rx="8" fill="none" stroke="#cbd5e1" stroke-width="2"/>';
  s += scene(128, 'kk-a2') + '</g><rect x="128" y="18" width="96" height="70" rx="8" fill="none" stroke="#cbd5e1" stroke-width="2"/>';
  s += '<text x="64" y="104" class="kk-tb">аналог</text><text x="64" y="118" class="kk-ts">рябит, но быстро</text><text x="176" y="104" class="kk-tb">цифра</text><text x="176" y="118" class="kk-ts">чётко</text>';
  return S(s, '');
};

P.pult = function (osi) { return S(pult(40, 8, 1, osi), osi ? '' : 'пульт: два стика'); };
P.pultochki = function () { return S(pult(10, 22, .62) + ochki(130, 40, .9), 'пульт заряжен, очки заряжены'); };

/* дроны 3 и 5 дюймов */
P.dron = function (n) {
  if (n === '5') return S('<g class="kk-fly">' + quad(120, 66, 40, { d: .95 }) + '</g><path d="M20 50 H54 M14 62 H48 M22 74 H56" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round" class="kk-dash"/><text x="214" y="30" class="kk-tb">100+</text><text x="214" y="44" class="kk-ts">км/ч</text>', '5 дюймов: главный гоночный класс');
  return S('<g class="kk-fly">' + quad(120, 64, 32, { d: .95 }) + '</g>' + quad(40, 96, 10, { duct: 1, d: 1, body: '#ea580c' }) + '<text x="40" y="122" class="kk-ts">вуп</text>', '2-3 дюйма: быстрее и сильнее вупа');
};

/* заезды: четыре дрона на старте, следующий заезд ждёт */
P.zaezd = function () {
  var s = '<rect x="10" y="22" width="220" height="62" rx="10" fill="rgba(56,189,248,.06)" stroke="#334155"/><path d="M20 76 H220" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="8 6"/>';
  for (var i = 0; i < 4; i++) s += quad(46 + i * 50, 52, 13, {}) + '<text x="' + (46 + i * 50) + '" y="34" class="kk-tb">' + (i + 1) + '</text>';
  s += '<text x="120" y="16" class="kk-ts">заезд 1 в воздухе</text>';
  for (i = 0; i < 4; i++) s += '<g opacity=".45">' + quad(70 + i * 33, 104, 8, { stop: 1 }) + '</g>';
  s += '<text x="120" y="128" class="kk-ts">заезд 2 готовится</text>';
  return S(s, '');
};

/* гоночные ворота в перспективе, дрон пролетает */
P.vorota = function () {
  var s = '<path d="M20 120 L220 120" stroke="#334155" stroke-width="2"/>';
  s += '<path d="M150 116 V38 H210 V116" fill="none" stroke="#f97316" stroke-width="9" stroke-linejoin="round"/><path d="M150 116 V38 H210 V116" fill="none" stroke="#fdba74" stroke-width="2"/>';
  s += '<path d="M52 116 V58 H96 V116" fill="none" stroke="#f97316" stroke-width="6" opacity=".55"/>';
  s += '<path d="M122 118 V44" stroke="#e2e8f0" stroke-width="2.5"/><path d="M122 44 L140 51 L122 58Z" fill="#22c55e"/>';
  s += '<path d="M14 92 Q70 70 120 82 Q160 92 230 70" fill="none" stroke="#38bdf8" stroke-width="2.5" class="kk-dash"/>';
  s += '<g class="kk-fly">' + quad(180, 76, 12, {}) + '</g>';
  s += '<text x="74" y="50" class="kk-ts">ворота</text><text x="122" y="38" class="kk-ts">флаг</text>';
  return S(s, 'сквозь ворота - прямо, флаг - облетаем');
};

/* трасса сверху: старт, ворота, флаги-змейка, ныряние */
P.trassa = function () {
  var s = '<rect x="8" y="10" width="224" height="110" rx="12" fill="rgba(34,197,94,.08)" stroke="#334155"/>';
  s += '<path d="M30 100 C30 60 60 40 90 40 C110 40 112 62 130 62 C148 62 150 40 168 40 C186 40 210 50 210 76 C210 100 170 104 120 104 C80 104 60 100 30 100" fill="none" stroke="#38bdf8" stroke-width="2.5" class="kk-dash"/>';
  s += '<rect x="20" y="96" width="20" height="8" fill="#e2e8f0"/><rect x="20" y="96" width="5" height="4" fill="#111"/><rect x="30" y="96" width="5" height="4" fill="#111"/><rect x="25" y="100" width="5" height="4" fill="#111"/><rect x="35" y="100" width="5" height="4" fill="#111"/>';
  [[60, 47, 35], [200, 64, 90], [150, 104, 0]].forEach(function (g) { s += '<rect x="-12" y="-3" width="24" height="6" rx="2" fill="#f97316" transform="translate(' + g[0] + ' ' + g[1] + ') rotate(' + g[2] + ')"/>'; });
  [[112, 54], [150, 50], [186, 46]].forEach(function (f, i) { s += '<path d="M' + f[0] + ' ' + f[1] + ' l0 -12 l9 4 l-9 4" fill="' + (i % 2 ? '#facc15' : '#22c55e') + '" stroke="#e2e8f0" stroke-width="1"/>'; });
  s += '<text x="30" y="90" class="kk-ts">старт</text><text x="150" y="30" class="kk-ts">змейка</text><text x="60" y="34" class="kk-ts">ворота</text>';
  s += '<g class="kk-fly">' + quad(96, 104, 7, {}) + '</g>';
  return S(s, '');
};

/* запись полёта: очки пишут видео (DVR) */
P.zapis = function () {
  var s = ochki(20, 46, .8) + '<path d="M104 70 H124" stroke="#cbd5ff" stroke-width="2" stroke-dasharray="4 3"/>';
  s += '<clipPath id="kk-zp"><rect x="128" y="22" width="96" height="70" rx="8"/></clipPath><g clip-path="url(#kk-zp)"><rect x="128" y="22" width="96" height="70" fill="#38bdf8"/><path d="M128 70 Q176 62 224 68 V92 H128Z" fill="#16a34a"/><path d="M160 74 V50 Q176 38 192 50 V74" fill="none" stroke="#f97316" stroke-width="4"/></g>';
  s += '<rect x="128" y="22" width="96" height="70" rx="8" fill="none" stroke="#cbd5e1" stroke-width="2"/><circle cx="140" cy="33" r="4" fill="#ef4444" class="kk-blink"/><text x="148" y="37" style="fill:#fff;font:800 10px ui-monospace,monospace">REC</text>';
  s += '<rect x="134" y="98" width="84" height="5" rx="2.5" fill="#334155"/><rect x="134" y="98" width="52" height="5" rx="2.5" fill="#38bdf8"/><circle cx="186" cy="100.5" r="5" fill="#e2e8f0"/>';
  return S(s, 'запись (DVR) - как повтор в футболе');
};

K.pic = function (k) {
  if (!k) return '';
  var a = String(k).split(':'), f = P[a[0]];
  if (!f) return '';
  if (a[0] === 'pult') return f(a[1] === 'osi');
  return f(a[1]);
};
})();
