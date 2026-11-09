/* akb-teoriya.js - теория об аккумуляторах для большого монитора модуля 3 (проба 09.11.2026).
   Два варианта: kid - проще, для детей (5-6 класс и младше); big - подробнее, для старших и взрослых.
   Слайд: { h: заголовок, p: текст (голос читает его же), pic: рисунок (рисует AKB_PIC), k: короткая подпись-цифра }.
   Числа те же, что в заданиях модуля 3 (fpv/zadaniya.js): 4,2 полная, 3,7 номинал, 3,5 садимся, ниже 3,3 вредно, 3,8 хранение, LiHV 4,35. */
(function () {
'use strict';
var kid = [
  { h: 'Аккумулятор - бак с энергией', pic: 'tank', k: 'АКБ',
    p: 'АКБ - это аккумулятор. Он как бак с топливом: зарядили - бак полный, полетали - бак пустеет. Без АКБ дрон не взлетит.' },
  { h: 'Какие бывают аккумуляторы', pic: 'types',
    p: 'В дронах - плоские мягкие LiPo, они отдают много силы сразу. В фонарике и дальних дронах - круглые банки Li-ion. В старых пультах - пальчиковые. Мы учимся на LiPo.' },
  { h: 'Что внутри', pic: 'rulet',
    p: 'Внутри свёрнуты тонкие слои, как рулет. Если банку проколоть, ударить или сжать, слои соприкоснутся - будет огонь. Поэтому АКБ не роняем и не режем.' },
  { h: 'Банка и этажи: 1S, 2S, 4S', pic: 'stack', k: '1S = 3,7 В',
    p: 'Одна банка даёт около 3,7 вольта. Банки ставят этажами, и вольты складываются. Буква S - сколько этажей. 1S - одна банка, как у Мобулы. 4S - четыре банки, как у гоночного дрона.' },
  { h: 'LiPo и LiHV', pic: 'hv', k: '4,2 и 4,35',
    p: 'LiPo - обычная банка, полная 4,2 вольта. LiHV - банка с запасом, полная 4,35 вольта. На зарядке у каждой свой режим. Что у тебя - написано на наклейке.' },
  { h: 'Главные числа банки', pic: 'scale',
    p: '4,2 - бак полный. 3,7 - середина. 3,5 - пора садиться. Ниже 3,3 - банке плохо, она портится. 3,8 - так оставляем на хранение.' },
  { h: 'Заряжаем со взрослым', pic: 'charge',
    p: 'Заряжаем только своей зарядкой и только когда рядом взрослый. АКБ кладём в огнеупорный мешок. Не уходим и не заряжаем на ночь.' },
  { h: 'Как храним', pic: 'store', k: '3,8 В',
    p: 'Если не летаем несколько дней - оставляем 3,8 вольта на банку. Храним в мешке или железном ящике. Не на солнце, не на батарее, не в машине.' },
  { h: 'Вздулась - не летаем', pic: 'swell',
    p: 'Если АКБ стала пухлой, мягкой или помятой - на ней нельзя летать и нельзя заряжать. Отдаём тренеру. В мусор не выбрасываем.' },
  { h: 'Если задымилась', pic: 'smoke',
    p: 'Руками не трогаем. Уходим из комнаты, закрываем дверь и зовём взрослого. Дым от АКБ ядовитый. Если огонь не гаснет - звоним 112.' }
];
var big = [
  { h: 'Что такое АКБ дрона', pic: 'tank', k: 'В · mAh · Вт·ч',
    p: 'Аккумулятор собран из одинаковых ячеек - банок. Главные числа: напряжение в вольтах (сила толчка), ёмкость в миллиампер-часах (размер бака) и энергия: вольты умножить на ампер-часы. 4S 1300 mAh: 14,8 В умножить на 1,3 Ач = около 19 Вт·ч.' },
  { h: 'Химия и типы банок', pic: 'types',
    p: 'LiPo - литий-полимер, мягкий корпус, огромная токоотдача: для гонок и фристайла. LiHV - тот же LiPo, но заряжается до 4,35 В. Li-ion (18650, 21700) - большая ёмкость, но слабый ток: для дальних полётов. LiFePO4 - 3,2 В, очень безопасные, в пультах. NiMH - 1,2 В, старые пульты.' },
  { h: 'Устройство банки и почему она горит', pic: 'rulet',
    p: 'Внутри - слои анода и катода, между ними тонкий сепаратор и электролит. Прокол, удар, перезаряд или короткое замыкание пробивают сепаратор: банка греется сама собой - это тепловой разгон. Газ раздувает корпус, дальше - огонь, который трудно потушить.' },
  { h: 'S и P: как соединяют банки', pic: 'stack', k: '4S2P',
    p: 'S - последовательно: плюс к минусу, вольты складываются. 4S LiPo: полная 16,8 В, номинал 14,8 В. 6S: 25,2 и 22,2 В. P - параллельно: ёмкость складывается, вольты как у одной банки. 4S2P - восемь банок: вольты как у 4S, бак вдвое больше.' },
  { h: 'LiPo против LiHV', pic: 'hv', k: '+5% энергии',
    p: 'LiHV: полная 4,35 В, номинал 3,8 В, энергии примерно на 5 процентов больше, в начале полёта дрон бодрее. Но полные LiHV быстрее стареют - после занятия сразу в хранение. LiHV в режиме LiPo зарядить можно: будет недозаряд. LiPo в режиме LiHV - нельзя: перезаряд до 4,35 В, нагрев, вздутие, пожар.' },
  { h: 'Напряжение под нагрузкой', pic: 'sag', k: '3,5 В в полёте',
    p: 'На полном газу напряжение проседает - это просадка. Ориентир - 3,5 В на банку в спокойном полёте: разворачиваемся и садимся. После посадки банки отдыхают и показывают 3,7 - это нормально. Ниже 3,3 под отдыхом - переразряд, ниже 3,0 - банка повреждена необратимо. Напряжение видно в очках, в OSD.' },
  { h: 'Ёмкость и C-рейтинг', pic: 'crate', k: '1,3 Ач × 100C = 130 А',
    p: 'C - во сколько раз ток может превышать ёмкость. 1300 mAh 100C: 1,3 А умножить на 100 - до 130 А. Честных C на наклейке обычно меньше, поэтому смотрят ещё на вес и отзывы. Заряжаем током 1C: для 1300 mAh - 1,3 А. Быстрее - только если разрешает производитель.' },
  { h: 'Балансир и баланс-зарядка', pic: 'balance', k: 'разница ≤ 0,05 В',
    p: 'Тонкий разъём с несколькими проводами - балансир. Через него зарядка видит каждую банку и выравнивает их. Заряжаем АКБ от 2S только в режиме баланса. Если банки разошлись больше чем на 0,05-0,1 В - АКБ изношена или повреждена, показываем тренеру.' },
  { h: 'Хранение', pic: 'store', k: '3,80-3,85 В',
    p: 'Не летаем больше пары дней - переводим АКБ в режим хранения на зарядке: 3,80-3,85 В на банку. Полной не держим дольше суток-двух: банки стареют и пухнут. Храним при 15-25 градусах, в огнеупорном мешке или железном ящике, разъёмы закрыты.' },
  { h: 'Безопасность при зарядке', pic: 'charge',
    p: 'Заряжаем на негорючей поверхности, в мешке или ящике, под присмотром. Горячую после полёта АКБ сначала остужаем, холодную с мороза - согреваем до комнатной. Проверяем режим: LiPo или LiHV, число банок и ток. Не уходим и не заряжаем на ночь.' },
  { h: 'Вздутие и утилизация', pic: 'swell',
    p: 'Вздулась, помялась, пробита, греется без нагрузки - больше не летаем и не заряжаем. Отдаём тренеру: он разрядит АКБ безопасно и сдаст в пункт приёма батареек. В обычный мусор нельзя - она может загореться в мусоровозе.' },
  { h: 'Если АКБ задымилась', pic: 'smoke',
    p: 'Не трогаем руками и не дышим дымом. Если это безопасно - выдёргиваем зарядку из розетки. Уходим, закрываем дверь, зовём взрослых. Если огонь не гаснет - 112. Маленькую горящую АКБ тренер может засыпать песком из ведра - поэтому ведро с песком стоит рядом с зарядкой.' }
];
window.AKB_TEORIYA = { kid: kid, big: big };

/* ---------- рисунки слайдов (холст): AKB_PIC(ctx, x, y, w, h, имя, t) ---------- */
var Y = '#ffd36e', C = '#7cf3ff', P = '#ff7ce0', G = '#9dff7c', O = '#ff9f5a', V = '#a78bfa', R = '#ff5d6c', WH = '#eef1ff';
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function glow(c, col, b) { c.shadowColor = col; c.shadowBlur = b || 18; }
function noGlow(c) { c.shadowBlur = 0; }
function txt(c, s, x, y, sz, col, al, wt) { c.font = (wt || 800) + ' ' + sz + 'px Manrope, "Segoe UI", sans-serif'; c.fillStyle = col || WH; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }
/* банка LiPo: серебристый пакет */
function pouch(c, x, y, w, h, fill, lbl) { var g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#dfe5f2'); g.addColorStop(.5, '#9aa4b8'); g.addColorStop(1, '#cfd6e6');
  c.fillStyle = g; rr(c, x, y, w, h, 6); c.fill(); c.strokeStyle = '#ffffff55'; c.lineWidth = 2; c.stroke();
  if (fill != null) { c.fillStyle = '#0006'; rr(c, x + w * .18, y + h * .2, w * .64, h * .6, 4); c.fill(); var fh = h * .6 * fill;
    c.fillStyle = fill > .5 ? G : fill > .25 ? Y : R; glow(c, c.fillStyle, 10); rr(c, x + w * .18, y + h * .8 - fh, w * .64, fh, 4); c.fill(); noGlow(c); }
  if (lbl) txt(c, lbl, x + w / 2, y + h + 22, 22, WH, 'center', 700); }
function batt(c, x, y, w, h, col, lbl, fill) { /* АКБ в плёнке с проводами */
  c.fillStyle = col || '#2a2f4a'; rr(c, x, y, w, h, 12); c.fill(); c.strokeStyle = '#ffffff40'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#ffffffd0'; rr(c, x + w * .08, y + h * .25, w * .84, h * .5, 6); c.fill();
  if (lbl) txt(c, lbl, x + w / 2, y + h / 2, Math.min(h * .26, 34), '#141832', 'center', 900);
  c.strokeStyle = R; c.lineWidth = 6; c.beginPath(); c.moveTo(x + w, y + h * .35); c.bezierCurveTo(x + w + 40, y + h * .35, x + w + 30, y - 10, x + w + 60, y - 18); c.stroke();
  c.strokeStyle = '#222'; c.beginPath(); c.moveTo(x + w, y + h * .55); c.bezierCurveTo(x + w + 50, y + h * .55, x + w + 50, y - 4, x + w + 72, y - 8); c.stroke();
  c.fillStyle = Y; c.fillRect(x + w + 56, y - 34, 30, 22); }

var PICS = {
  tank: function (c, x, y, w, h, t) { var bw = w * .34, bh = h * .62, bx = x + w * .5 - bw / 2, by = y + h * .16;
    var f = .5 + .45 * Math.sin(t * .8);
    pouch(c, bx, by, bw, bh, f); txt(c, Math.round(f * 100) + '%', x + w * .5, by + bh + 30, 30, f > .5 ? G : f > .25 ? Y : R);
    txt(c, '⚡', bx - 60, by + bh * .3, 50, Y); txt(c, '⛽', bx + bw + 60, by + bh * .3, 50, C); },
  types: function (c, x, y, w, h) { var cx = x + w / 2, by = y + h * .55;
    batt(c, cx - w * .44, by - 50, w * .26, 100, '#2b3358', 'LiPo'); txt(c, 'дрон', cx - w * .31, by + 80, 24, Y);
    var g = c.createLinearGradient(0, by - 80, 0, by + 70); g.addColorStop(0, '#4cc9f0'); g.addColorStop(1, '#2a6f97');
    for (var i = 0; i < 2; i++) { c.fillStyle = g; rr(c, cx - 30 + i * 58, by - 80, 48, 150, 18); c.fill(); c.fillStyle = '#ccc'; c.fillRect(cx - 18 + i * 58, by - 90, 24, 10); }
    txt(c, '18650', cx + 25, by - 105, 22, C); txt(c, 'Li-ion: дальние', cx + 25, by + 100, 24, C);
    for (var j = 0; j < 4; j++) { c.fillStyle = j % 2 ? '#3a8f4a' : '#4caf50'; rr(c, cx + w * .26 + j * 30, by - 50, 24, 110, 8); c.fill(); }
    txt(c, 'пульт', cx + w * .26 + 55, by + 80, 24, G); },
  rulet: function (c, x, y, w, h, t) { var cx = x + w * .4, cy = y + h * .52, cols = [O, '#ddd', '#444', '#ddd'];
    for (var r = 130; r > 10; r -= 12) { c.strokeStyle = cols[(r / 12 | 0) % 4]; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 1.9); c.stroke(); }
    txt(c, 'анод', cx + 200, cy - 70, 26, O, 'left'); txt(c, 'сепаратор', cx + 200, cy - 20, 26, '#ddd', 'left'); txt(c, 'катод', cx + 200, cy + 30, 26, '#aaa', 'left');
    var a = (Math.sin(t * 2) + 1) / 2; c.strokeStyle = R; c.lineWidth = 8; glow(c, R, 20 * a); c.beginPath(); c.moveTo(cx + 160, cy + 110); c.lineTo(cx + 70, cy + 40); c.stroke(); noGlow(c);
    txt(c, 'прокол = огонь', cx + 200, cy + 100, 26, R, 'left'); },
  stack: function (c, x, y, w, h, t) { var n = 1 + (Math.floor(t / 1.6) % 4), bw = 160, bh = 46, cx = x + w * .36, by = y + h * .86;
    for (var i = 0; i < n; i++) pouch(c, cx - bw / 2, by - (i + 1) * (bh + 8), bw, bh);
    txt(c, n + 'S', cx + bw / 2 + 90, by - 60, 70, Y); txt(c, (3.7 * n).toFixed(1).replace('.', ',') + ' В', cx + bw / 2 + 90, by - 130, 46, C);
    txt(c, n === 1 ? 'Mobula 7' : n === 4 ? 'гоночный 5"' : '', cx + bw / 2 + 90, by - 10, 26, WH); },
  hv: function (c, x, y, w, h) { function gauge(gx, lbl, max, col) { var gh = h * .62, gy = y + h * .16;
      c.fillStyle = '#0008'; rr(c, gx, gy, 90, gh, 14); c.fill(); var f = (max - 3.0) / (4.4 - 3.0);
      c.fillStyle = col; glow(c, col, 16); rr(c, gx + 10, gy + gh - gh * f, 70, gh * f - 10, 10); c.fill(); noGlow(c);
      txt(c, String(max).replace('.', ',') + ' В', gx + 45, gy - 26, 34, col); txt(c, lbl, gx + 45, gy + gh + 34, 34, WH); }
    gauge(x + w * .25 - 45, 'LiPo', 4.2, C); gauge(x + w * .62 - 45, 'LiHV', 4.35, P); txt(c, 'полная банка', x + w / 2, y + h * .96, 24, '#aab'); },
  scale: function (c, x, y, w, h) { var x0 = x + 60, x1 = x + w - 60, yy = y + h * .5;
    function X(v) { return x0 + (v - 3.0) / (4.4 - 3.0) * (x1 - x0); }
    var g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, R); g.addColorStop(.25, R); g.addColorStop(.36, Y); g.addColorStop(.5, C); g.addColorStop(.85, G); g.addColorStop(1, G);
    c.fillStyle = g; rr(c, x0, yy - 16, x1 - x0, 32, 16); c.fill();
    [[3.3, 'вредно', R], [3.5, 'садимся', Y], [3.7, 'середина', C], [3.8, 'хранение', V], [4.2, 'полная', G]].forEach(function (m, i) {
      var mx = X(m[0]); c.fillStyle = WH; c.fillRect(mx - 2, yy - 30, 4, 60);
      txt(c, String(m[0]).replace('.', ','), mx, i % 2 ? yy + 60 : yy - 60, 34, m[2]); txt(c, m[1], mx, i % 2 ? yy + 96 : yy - 96, 22, WH, 'center', 700); }); },
  charge: function (c, x, y, w, h, t) { var cx = x + w * .3, cy = y + h * .5;
    c.fillStyle = '#1c2038'; rr(c, cx - 110, cy - 70, 220, 140, 16); c.fill(); c.strokeStyle = Y; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#0a2a20'; rr(c, cx - 80, cy - 46, 160, 60, 8); c.fill(); txt(c, 'BAL 4S 1.3A', cx, cy - 16, 22, G);
    var p = (t * .25) % 1; c.fillStyle = G; c.fillRect(cx - 80, cy + 30, 160 * p, 12);
    c.fillStyle = '#7a3b1e'; rr(c, x + w * .58, cy - 80, 170, 170, 20); c.fill(); c.strokeStyle = O; c.stroke(); txt(c, 'мешок', x + w * .58 + 85, cy + 120, 24, O);
    batt(c, x + w * .58 + 30, cy - 30, 100, 60, '#2b3358', '4S'); },
  store: function (c, x, y, w, h) { var cx = x + w * .25, cy = y + h * .5;
    c.fillStyle = '#7a3b1e'; rr(c, cx - 90, cy - 90, 180, 180, 20); c.fill(); batt(c, cx - 60, cy - 30, 100, 60, '#2b3358', '3,8');
    txt(c, '✓', cx, cy - 130, 60, G);
    function no(sx, emo, lbl) { txt(c, emo, sx, cy - 10, 80); c.strokeStyle = R; c.lineWidth = 8; c.beginPath(); c.arc(sx, cy - 10, 62, 0, 7); c.moveTo(sx - 44, cy - 54); c.lineTo(sx + 44, cy + 34); c.stroke(); txt(c, lbl, sx, cy + 90, 22, WH, 'center', 700); }
    no(x + w * .55, '☀️', 'солнце'); no(x + w * .82, '🚗', 'машина'); },
  swell: function (c, x, y, w, h, t) { var cx = x + w * .5, cy = y + h * .5, s = 1 + .08 * Math.sin(t * 3);
    c.save(); c.translate(cx, cy); c.scale(1, s); c.fillStyle = '#3a3f5c'; c.beginPath(); c.ellipse(0, 0, 170, 80, 0, 0, 7); c.fill(); c.strokeStyle = R; c.lineWidth = 4; glow(c, R, 16); c.stroke(); noGlow(c); c.restore();
    txt(c, 'ВЗДУЛАСЬ', cx, cy, 40, R); txt(c, 'не летаем · не заряжаем · тренеру', cx, cy + 130, 26, WH, 'center', 700); },
  smoke: function (c, x, y, w, h, t) { var cx = x + w * .3, cy = y + h * .62;
    batt(c, cx - 70, cy - 20, 140, 60, '#3a2a2a', '!');
    for (var i = 0; i < 5; i++) { var k = ((t * .5 + i * .2) % 1); c.fillStyle = 'rgba(160,160,170,' + (0.5 * (1 - k)) + ')'; c.beginPath(); c.arc(cx + Math.sin(k * 6 + i) * 20, cy - 40 - k * 160, 22 + k * 30, 0, 7); c.fill(); }
    var dx = x + w * .68; c.fillStyle = '#5a3b22'; c.fillRect(dx, cy - 170, 110, 210); c.fillStyle = Y; c.beginPath(); c.arc(dx + 90, cy - 60, 7, 0, 7); c.fill();
    txt(c, 'выйти · закрыть · позвать', dx + 55, cy + 80, 22, WH, 'center', 700); txt(c, '112', dx + 55, cy - 200, 40, R); },
  sag: function (c, x, y, w, h, t) { var x0 = x + 50, x1 = x + w - 40, y0 = y + 40, y1 = y + h - 50;
    function Yv(v) { return y1 - (v - 3.2) / (4.3 - 3.2) * (y1 - y0); }
    c.strokeStyle = '#ffffff30'; c.lineWidth = 1; [3.5, 3.7, 4.2].forEach(function (v) { c.beginPath(); c.moveTo(x0, Yv(v)); c.lineTo(x1, Yv(v)); c.stroke(); txt(c, String(v).replace('.', ','), x0 - 10, Yv(v), 20, '#aab', 'right'); });
    c.strokeStyle = C; c.lineWidth = 4; glow(c, C, 10); c.beginPath();
    for (var i = 0; i <= 100; i++) { var k = i / 100, v = 4.2 - k * .65 - (Math.sin(k * 40) > .6 ? .18 : 0); if (k > .82) v = 3.55 + (k - .82) * .9; c[i ? 'lineTo' : 'moveTo'](x0 + k * (x1 - x0), Yv(v)); } c.stroke(); noGlow(c);
    txt(c, 'газ - просадка', x0 + (x1 - x0) * .4, Yv(3.38), 22, Y); txt(c, 'отдых', x0 + (x1 - x0) * .92, Yv(3.86), 22, G); },
  crate: function (c, x, y, w, h) { batt(c, x + w * .12, y + h * .3, w * .4, h * .4, '#2b3358', '1300 mAh 100C');
    txt(c, '1,3 А × 100', x + w * .78, y + h * .4, 40, Y); txt(c, '= 130 А', x + w * .78, y + h * .58, 50, P); txt(c, 'зарядка 1C = 1,3 А', x + w * .5, y + h * .9, 28, G); },
  balance: function (c, x, y, w, h) { var bars = [3.81, 3.82, 3.80, 3.71], x0 = x + w * .18;
    bars.forEach(function (v, i) { var bh = (v - 3.5) / .5 * h * .55; c.fillStyle = i === 3 ? O : G; glow(c, c.fillStyle, 10); rr(c, x0 + i * 110, y + h * .78 - bh, 70, bh, 8); c.fill(); noGlow(c);
      txt(c, String(v).replace('.', ','), x0 + i * 110 + 35, y + h * .78 - bh - 24, 24, WH); txt(c, 'B' + (i + 1), x0 + i * 110 + 35, y + h * .86, 22, '#aab'); });
    txt(c, 'разница 0,11 В - к тренеру', x0 + 210, y + h * .1, 26, O); }
};
window.AKB_PIC = function (c, x, y, w, h, name, t) { var f = PICS[name]; if (f) { c.save(); f(c, x, y, w, h, t || 0); c.restore(); } };
window.AKB_PIC.util = { rr: rr, txt: txt, glow: glow, noGlow: noGlow, pouch: pouch, batt: batt };
})();
