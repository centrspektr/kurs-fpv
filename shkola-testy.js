/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* shkola-testy.js - Лётная школа (27.11.2026): тесты.
   1) Картинка к вопросу теста. Раньше картинки были только в карточках, вопрос шёл голым текстом. Теперь над вопросом (на телефоне - сбоку)
      стоит схема по теме вопроса. Правило подбора: картинка показывает, О ЧЁМ вопрос, но не подсказывает ответ. Поэтому нижняя подпись схемы
      в тесте убрана, а ключ с приставкой 'n:' - та же схема совсем без надписей. '-' - вопрос без картинки (счёт, определения, где любая схема была бы подсказкой).
   2) Девять вопросов, где верный ответ был заметно длиннее неверных и этим выдавал себя: ответы выровнены по длине, смысл тот же.
   Работает только в школе (флаг KMN_UL). Файлы zadaniya-new.js и moduli.js не меняются: таблица ниже накладывается поверх, картинка вставляется в готовый вопрос.
   Таблица идёт в порядке вопросов в zadaniya-new.js (pool, потом доп. x). Если число вопросов в задании изменится, картинки этого задания отключатся сами (в консоли будет строка). */
(function () {
'use strict';
if (!window.KMN_UL) return; var K = window.VZ_KURS, kit = window.UROK_KIT; if (!K || !K.lib) return;

/* ---------- нейтральные схемы для вопросов ---------- */
if (kit) { (function () { var S = kit.S, T = kit.T, L = kit.L, rect = kit.rect, circ = kit.circ, dtop = kit.dtop, batt = kit.batt, gate = kit.gate, c = kit.col, U = window.UROK_PIC = window.UROK_PIC || {};
  function w(d) { return '<path d="' + d + '" stroke="' + c.R + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>'; }
  U['u:dron'] = S(dtop(120, 64, 2.5), '');
  U['u:osd35'] = S(rect(34, 12, 172, 106, 14, '#0b1020', c.W, 2) + L(34, 92, 206, 92, c.DIM, 1.5) + gate(106, 56, 28, 36, c.P) + L(112, 66, 128, 66, c.W, 1.6) + L(120, 58, 120, 74, c.W, 1.6) +
    T(48, 36, '3,5 В', { s: 15, w: 800, c: c.Y, a: 'start' }) + T(192, 36, '02:31', { s: 13, w: 700, c: c.W, a: 'end' }) + T(120, 132, 'так видно в очках', { s: 10, c: '#aab4e0', w: 600 }), '');
  U['u:hot'] = S(batt(92, 34, 56, 78, .55, c.Y, '') + w('M70 96 q-8 -12 0 -24 q8 -12 0 -24') + w('M170 96 q8 -12 0 -24 q-8 -12 0 -24') + w('M52 90 q-6 -9 0 -18 q6 -9 0 -18') + w('M188 90 q6 -9 0 -18 q-6 -9 0 -18') +
    circ(120, 20, 3, c.R), '');
  [['u:bq1', 1, c.G], ['u:bq5', .5, c.Y], ['u:bq0', .1, c.R]].forEach(function (a) { U[a[0]] = S(batt(64, 30, 50, 82, a[1], a[2], '') + rect(132, 48, 76, 44, 10, '#0b1020', c.W, 2) + T(170, 78, '? В', { s: 20, w: 900, c: a[2] }) + L(114, 70, 132, 70, c.DIM, 2, '4 3'), ''); });
  U['u:akb'] = S(rect(52, 40, 120, 60, 10, '#1c2444', c.C, 2.4) + L(92, 40, 92, 100, c.DIM, 1.5) + L(132, 40, 132, 100, c.DIM, 1.5) + T(112, 76, 'LiPo', { s: 16, w: 900, c: c.C }) +
    '<path d="M172 58 h22 M172 82 h22" stroke="' + c.R + '" stroke-width="3" stroke-linecap="round"/>' + rect(194, 50, 14, 40, 3, c.Y) + T(112, 124, 'аккумулятор (АКБ)', { s: 10, c: '#aab4e0', w: 600 }), '');
  U['u:zaryadka'] = S(rect(22, 34, 92, 66, 10, '#1c2444', c.W, 2) + rect(34, 46, 68, 26, 5, '#0b1020', c.C, 1.5) + T(68, 64, 'заряд', { s: 11, w: 800, c: c.C }) + circ(44, 86, 4, c.G) + circ(60, 86, 4, c.DIM) + circ(76, 86, 4, c.DIM) +
    L(114, 67, 150, 67, c.R, 3) + batt(154, 32, 48, 74, .6, c.G, '') + T(68, 122, 'зарядка', { s: 10, c: '#aab4e0', w: 600 }), '');
  /* 27.11 (проход 4): десять нейтральных схем для вопросов, которые шли без картинки. Показывают тему и не подсказывают ответ. */
  var man = kit.man, dside = kit.dside, A = kit.A;
  function q(x, y, s, col) { return T(x, y, '?', { s: s || 24, w: 900, c: col || c.Y }); }
  U['u:qkto'] = S(man(64, 92, 1.6, c.C) + man(120, 92, 1.6, c.Y) + man(176, 92, 1.6, c.P) + q(120, 40, 30, c.W) + L(104, 44, 76, 60, c.DIM, 2, '4 4') + L(136, 44, 164, 60, c.DIM, 2, '4 4') + L(120, 48, 120, 60, c.DIM, 2, '4 4'), '');
  U['u:qgolos'] = S(man(62, 100, 1.8, c.C) + rect(104, 26, 112, 54, 16, '#0b1020', c.W, 2.4) + '<path d="M118 78 L98 96 L134 79 Z" fill="#0b1020" stroke="' + c.W + '" stroke-width="2.4" stroke-linejoin="round"/>' + L(119, 78, 132, 78, '#0b1020', 4) +
    circ(134, 53, 5, c.Y) + circ(156, 53, 5, c.Y) + circ(178, 53, 5, c.Y) + T(198, 63, '!', { s: 28, w: 900, c: c.R }), '');
  U['u:qplosh'] = S(rect(34, 20, 172, 100, 12, 'rgba(124,243,255,.05)', c.C, 2) + L(34, 92, 206, 92, c.DIM, 2, '6 5') + dtop(120, 54, 1.25) +
    [[50, 34], [190, 34], [50, 80], [190, 80]].map(function (p) { return '<path d="M' + (p[0] - 6) + ' ' + (p[1] + 6) + 'L' + p[0] + ' ' + (p[1] - 7) + 'L' + (p[0] + 6) + ' ' + (p[1] + 6) + 'Z" fill="' + c.Y + '"/>'; }).join('') + q(120, 114, 18), '');
  U['u:qnad'] = S(dside(120, 36, 1.5) + L(120, 50, 120, 78, c.DIM, 2, '4 4') + L(26, 116, 214, 116, c.DIM, 2.4) + q(120, 108, 28) + L(60, 116, 60, 104, c.DIM, 2) + circ(60, 98, 7, 'none', c.DIM, 2) + rect(166, 102, 28, 14, 3, 'none', c.DIM, 2), '');
  U['u:qmodul'] = S(rect(26, 42, 52, 56, 12, c.BG, c.G, 2.6) + T(52, 80, '1', { s: 26, w: 900, c: c.G }) + A(82, 70, 92, 70, c.DIM, 2) + rect(96, 42, 52, 56, 12, c.BG, c.C, 2.6) + T(122, 80, '2', { s: 26, w: 900, c: c.C }) + A(152, 70, 162, 70, c.DIM, 2) +
    rect(166, 42, 52, 56, 12, c.BG, c.DIM, 2.6) + rect(182, 68, 20, 16, 4, c.W) + '<path d="M186 68 v-6 a6 6 0 0 1 12 0 v6" stroke="' + c.W + '" stroke-width="3" fill="none"/>', '');
  U['u:qschet'] = S(batt(36, 34, 48, 78, .7, c.G, '') + rect(116, 26, 92, 92, 12, '#0b1020', c.W, 2.2) + rect(126, 36, 72, 24, 5, c.BG, c.C, 1.6) + T(190, 54, '= ?', { s: 16, w: 900, c: c.C, a: 'end' }) +
    [0, 1, 2].map(function (i) { return rect(126 + i * 25, 68, 20, 16, 4, c.DIM) + rect(126 + i * 25, 90, 20, 16, 4, i === 2 ? c.Y : c.DIM); }).join('') + L(86, 72, 114, 72, c.DIM, 2, '4 3'), '');
  function nakl(t) { return S(rect(30, 38, 150, 66, 12, '#1c2444', c.C, 2.4) + rect(180, 54, 12, 34, 3, c.Y) + rect(48, 52, 114, 38, 7, c.W) + T(105, 79, t, { s: 21, w: 900, c: '#0b1020' }) + q(212, 80, 28), ''); }
  U['u:qnakl'] = nakl('3,7 В'); U['u:qlihv'] = nakl('LiHV');
  U['u:qlesenka'] = S('<path d="M26 118 h38 v-18 h38 v-18 h38 v-18 h38 v-18 h36" stroke="' + c.W + '" stroke-width="2.6" fill="none" stroke-linejoin="round"/>' + dside(46, 106, .7) + circ(196, 36, 7, c.Y) + L(196, 43, 196, 46, c.Y, 2) +
    A(84, 74, 108, 56, c.G, 2.4) + T(52, 92, '1', { s: 11, w: 800, c: c.DIM }) + T(84, 132, ' ', {}), '');
  U['u:qtimer'] = S(gate(30, 36, 62, 70, c.P) + dside(62, 78, .8) + '<path d="M104 60 q10 12 0 24 M116 52 q16 20 0 40" stroke="' + c.C + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    circ(174, 76, 30, '#0b1020', c.W, 2.6) + rect(168, 36, 12, 9, 2, c.W) + L(174, 76, 174, 56, c.Y, 3) + L(174, 76, 188, 84, c.W, 2.4) + circ(174, 76, 3, c.W), '');
})(); }

/* ---------- картинка по ключу; 'n:ключ' - без надписей ---------- */
var kp = K.pic;
K.pic = function (k) { if (k && k.indexOf('n:') === 0) return String(kp ? kp(k.slice(2)) : '').replace(/<text[^>]*>[^<]*<\/text>/g, ''); return kp ? kp(k) : ''; };

/* ---------- таблица: задание -> [картинки основных вопросов, картинки доп. вопросов] ---------- */
var TAB = {
  m1_hello: ['pultochki - u:qkto u:nabl razmer', 'pultochki u:qmodul u:qmodul u:urovni'],
  m1_rules: ['u:qkto u:qplosh pult pultochki u:dron u:roli vint pult pultochki dron:5 u:zriteli', 'u:dron u:qnad pult u:dron u:nabl u:dron'],
  m1_where: ['u:qplosh u:nelzya u:nelzya u:pogoda u:zakon u:zakon u:zakon u:pogoda u:zakon razmer', 'u:qnad u:pogoda - u:lyudi u:pogoda'],
  m1_power: ['pultochki pult u:qgolos u:dron rx pult rx u:dron rx', 'pultochki pultochki u:qgolos pult vint'],
  m1_check: ['vint u:akb pultochki n:u:check pult kanaly vint u:hot pult vint', 'vint u:qplosh - u:dron'],
  m2_frame: ['rama - vint n:rama - razmer dron:5 motor vint motor motor esc', '- u:dron n:vint dron:5 motor'],
  m2_brain: ['- fc esc pult u:dron fc - fc u:dron fc fc fc', 'motor rx u:dron fc'],
  m2_video: ['pultochki vtx pultochki n:vtx vtx kanaly vtx vtx kamera vtx', 'kamera pultochki kanaly kamera'],
  m2_radio: ['pult pult rx rx pult bind pult u:dron rx rx bind', 'pult pult bind pult'],
  m2_build: ['kamera rx vtx - rx u:dron', 'motor pultochki fc'],
  m2_rep: ['u:nabl u:lyudi pult u:hot pultochki rx vint u:lyudi', 'pult kanaly'],
  akb_inside: ['u:akb u:akb n:u:etazhi u:bq5 u:akb u:akb u:akb u:qschet u:qschet u:akb u:akb u:akb', 'u:akb u:akb u:akb u:akb u:akb u:qschet dron:5'],
  akb_volt: ['u:bq1 u:bq0 u:bq5 u:zaryadka u:bq0 u:qnakl u:bq5 u:zaryadka u:prosadka u:osd35 u:bq0 u:bq1', 'u:osd35 u:bq1 u:bq1 u:qlihv u:bq0 u:zaryadka'],
  akb_cap: ['u:akb u:akb u:banka u:akb u:osd35 u:akb u:mah u:osd35 u:pogoda u:qschet u:qschet u:prosadka', 'u:banka u:akb n:u:prosadka u:akb u:qschet u:akb'],
  akb_care: ['u:zaryadka u:akb u:hot u:pogoda u:vzdutie u:zaryadka u:etazhi u:zaryadka u:bq5 u:etazhi', 'u:hot u:akb u:vzdutie u:zaryadka u:akb u:etazhi'],
  akb_rep: ['pult vint u:nabl pult kamera rx vint', 'pultochki u:qkto pult vtx vint u:dron'],
  m4_sticks: ['pult pult u:dron pult pult n:u:visenie u:dron u:naklon n:u:visenie pult u:dron pult', 'pult pult n:u:visenie u:dron pultochki'],
  m4_modes: ['pult pult u:tumbler u:tumbler - n:u:visenie pult n:fc u:tumbler u:acro u:dron u:acro', 'n:u:angle u:acro u:qkto pult pult'],
  m4_trainer: ['u:sim u:tochka u:tochka u:qlesenka - n:u:visenie n:u:visenie u:sim u:sim u:dron u:dron u:tochka', 'u:tochka u:sim u:qlesenka u:tochka u:dron'],
  m4_moves: ['u:qlesenka - trassa n:u:krug n:u:vosmerka n:u:krug n:vorota n:u:visenie u:dron n:u:krug', '- n:vorota - pult n:vorota'],
  m4_rep: ['pult u:osd35 n:u:prosadka pultochki u:hot vint u:banka u:dron u:banka fc', 'motor razmer u:bq1 razmer n:fc'],
  m5_race: ['trassa pultochki - n:trassa u:etapy zaezd trassa trassa n:u:as zaezd', 'n:trassa n:trassa - - trassa'],
  m5_class: ['n:razmer razmer n:razmer dron:5 razmer razmer zaezd dron:5 razmer zaezd razmer', 'n:razmer n:razmer n:razmer - dron:5'],
  m5_rules: ['n:vorota u:sudya trassa u:zachet n:u:falstart trassa u:zachet u:sudya zaezd u:zachet', '- n:trassa pult u:roli trassa'],
  m5_video: ['kanaly kanaly zaezd pultochki pultochki kanaly n:kanaly pultochki n:kanaly vtx', 'kanaly zaezd vtx kanaly -'],
  m5_roles: ['u:roli u:roli u:roli zaezd u:roli u:roli u:sudya u:roli u:sudya u:roli', 'u:roli u:roli u:roli u:roli zaezd'],
  m5_rep: ['u:roli u:osd35 pult razmer u:tumbler u:tumbler u:qtimer u:hot rx u:tumbler', 'pult u:bq0 u:dron u:tumbler kanaly'],
  m6_track: ['trassa n:vorota - u:dron trassa n:trassa n:u:duga n:u:duga n:vorota u:acro trassa', 'n:vorota trassa u:dron - n:u:duga u:acro'],
  m6_dvr: ['n:zapis zapis zapis zapis zapis n:vorota zapis zapis zapis zapis', 'zapis zapis zapis zapis n:vorota zapis'],
  m6_fix: ['trassa trassa pultochki n:u:cel zapis n:u:rovno u:acro u:sim pult n:u:rovno', 'trassa trassa pult n:u:cel trassa n:u:rovno'],
  m6_as: ['u:tumbler pult pult n:u:as u:acro u:tumbler u:dron fc', 'u:tumbler u:tumbler pult pult u:tumbler n:fc'],
  m6_rep: ['n:u:falstart pult u:osd35 n:razmer pultochki n:u:nabl pultochki u:etazhi u:tumbler u:sudya u:zaryadka', 'n:u:falstart u:qkto u:hot pult n:vtx u:zaryadka']
};

/* ---------- выровненные ответы: вопрос -> [верный, неверный, неверный] ---------- */
var FIX = {
  'Почему нельзя ловить дрон, даже если моторы "почти остановились"?': ['Без дизарма моторы могут раскрутиться снова', 'Можно, если ловить медленно и снизу', 'Можно, если надеть плотную перчатку'],
  'Почему нельзя прокалывать или бить АКБ?': ['Внутри будет замыкание, нагрев и огонь', 'Из неё вытечет заряд, она станет легче', 'Она просто будет держать меньше энергии'],
  'Почему банку нельзя разряжать почти до нуля?': ['Банка портится и теряет ёмкость', 'Банка становится тяжелее', 'Её потом дольше заряжать, и только'],
  'Почему нельзя просто поставить огромную АКБ?': ['Она тяжёлая: дрон станет медленным', 'Она слишком долго заряжается', 'Можно: чем больше АКБ, тем лучше'],
  'Зимой АКБ быстрее "садится". Почему?': ['На холоде банки хуже отдают ток', 'На холоде дрон становится тяжелее', 'Зимой воздух плотнее и тормозит дрон'],
  'Банки 4S после полёта: 3,7 / 3,7 / 3,4 / 3,7 В. Что это значит?': ['Одна банка отстаёт: нужна проверка', 'Всё в порядке, так бывает всегда', 'АКБ не села, можно полетать ещё'],
  'Зачем следить за напряжением каждой банки, а не только всей АКБ?': ['Одна банка может быть переразряжена', 'Так АКБ быстрее заряжается', 'Это не нужно, хватит общей суммы'],
  'Друг хочет поймать заармленный дрон рукой. Ты скажешь...': ['Стоп! Сначала дизарм', 'Лови снизу, он маленький', 'Лови, только в перчатке'],
  'Что такое failsafe?': ['Что делает дрон при потере связи с пультом', 'Режим быстрого полёта для гонок', 'Защита АКБ от слишком сильного разряда']
};

/* 27.11 (проход 4): полная таблица выровненных ответов - в shkola-otvety.js, она главнее девяти строк выше */
var OTV = window.SHKOLA_OTVETY; if (OTV) Object.keys(OTV).forEach(function (k) { FIX[k] = OTV[k]; });
var QP = {}, nfix = 0;
Object.keys(K.lib).forEach(function (tid) { var t = K.lib[tid]; (t.steps || []).forEach(function (st) { if (st.s !== 'quiz') return;
  [st.pool, st.x].forEach(function (pool, pi) { if (!Array.isArray(pool)) return;
    pool.forEach(function (q) { var f = q && FIX[q.q]; if (f && q.a && q.a.length === f.length) { q.a = f.slice(); nfix++; } });
    var row = TAB[tid] && TAB[tid][pi]; if (!row) return; var ks = row.split(' ');
    if (ks.length !== pool.length) { try { console.warn('shkola-testy: ' + tid + (pi ? ' x' : '') + ' - вопросов ' + pool.length + ', картинок ' + ks.length + ', картинки отключены'); } catch (e) {} return; }
    pool.forEach(function (q, i) { if (q && typeof q.q === 'string' && ks[i] !== '-' && !QP[q.q]) QP[q.q] = ks[i]; }); }); }); });
window.SHKOLA_TESTY = { pics: QP, fixed: nfix };

/* ---------- вставка картинки в вопрос ---------- */
var css = document.createElement('style');
css.textContent = '.kr-q{scroll-margin-top:104px}.kq-pic{max-width:270px;margin:0 auto 10px;border:1px solid rgba(124,243,255,.22);border-radius:14px;background:rgba(11,16,32,.55);padding:6px 10px;animation:krSw .35s both}' +
  '.kq-pic svg{display:block;width:100%;height:auto;max-height:150px;margin:0}' +
  '@media (orientation:landscape) and (max-height:560px){.kr-q.kq-side{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,31%);column-gap:14px;align-items:start}.kr-q.kq-side>*{grid-column:1}' +
  '.kr-q.kq-side>.kq-pic{grid-column:2;grid-row:1 / span 5;align-self:center;max-width:none;margin:0;width:100%;box-sizing:border-box}}' +
  '@media (prefers-reduced-motion:reduce){.kq-pic{animation:none}}';
document.head.appendChild(css);
function put(box) { var qq = box.querySelector('.qq'); if (!qq || box.querySelector('.kq-pic')) return; var key = QP[(qq.textContent || '').trim()]; if (!key) return;
  var svg = String(K.pic(key) || '').replace(/<text[^>]*class="kk-t"[^>]*>[^<]*<\/text>/, ''); if (svg.indexOf('<svg') < 0) return;
  var d = document.createElement('div'); d.className = 'kq-pic'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = svg; box.insertBefore(d, qq); box.classList.add('kq-side'); }
/* после неверного ответа окно прокручено к пояснению, и следующий вопрос появлялся наполовину за шапкой окна: возвращаем его в начало */
function top(box) { try { if (box.getBoundingClientRect().top < 70) box.scrollIntoView({ block: 'start' }); } catch (e) {} }
function scan(n) { if (!n || n.nodeType !== 1) return; var b = n.classList.contains('kr-q') ? n : n.querySelector && n.querySelector('.kr-q'); if (b) { put(b); top(b); } }
if (window.MutationObserver) new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var a = ms[i].addedNodes; for (var j = 0; j < a.length; j++) scan(a[j]); } }).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
