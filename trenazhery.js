/* Курс FPV: тренажёры (08.11.2026).
   1) Игра "Собери дрон" (3D-мастерская, папка trenazhery/sborka/) встроена в задание модуля 2 "Собери дрон по системам" (m2_build)
      последним шагом "Мастерская": когда дрон собран и взлетел, шаг засчитывается.
   2) Окно "Тренажёры" (киоск на площадке города): все тренажёры просто потренироваться, без заданий.
   Детская версия (mladshie.html) - для 5-6 класса и младше, взрослая (index.html) - с 7 класса. Класс берём из входа ученика,
   нет входа - по умолчанию взрослая, детская рядом второй кнопкой.
   Подключать после zadaniya.js и до moduli.js / kosmos-kurs.js. Сама игра не меняется: окно с игрой лишь смотрит, собран ли дрон (SBG.st().stage). */
(function () {
'use strict';
var K = window.VZ_KURS, CFG = window.KURSY || {};

/* список тренажёров. Новый тренажёр - ещё одна запись (soon: 1 - карточка "скоро") */
var LIST = [
  { id: 'sborka', e: '🛠', t: 'Собери дрон', sub: '3D-мастерская: ставь детали, крути винты, паяй провода, подключай разъёмы и подними дрон в воздух.',
    url: 'trenazhery/sborka/index.html', kid: 'trenazhery/sborka/mladshie.html', best: 'kursy_fpv_sborka' },
  { id: 'pult', e: '🎮', t: 'Пульт RadioMaster', sub: '3D-пульт: что за что отвечает, стики Mode 2 с голограммой дрона, тумблеры, взвод и назначение кнопок в Betaflight.',
    url: 'trenazhery/pult/index.html', kid: 'trenazhery/pult/mladshie.html' },
  { id: 'mobula', e: '🐝', t: 'Mobula 7: дрон первых гонок', sub: '3D-дрон на подиуме: из чего состоит, подготовка к заезду (винт, АКБ, разъём, видеоканал) и круг по трассе в зале.',
    url: 'trenazhery/mobula/index.html', kid: 'trenazhery/mobula/mladshie.html' },
  { id: 'klassy', e: '🚁', t: 'Классы дронов', sub: 'Три дрона в 3D в настоящем размере: вуп Mobula 7, 3-дюймовый синевуп и 5-дюймовый фристайл. Размер, банки, вес, где летать.',
    url: 'trenazhery/klassy/index.html', kid: 'trenazhery/klassy/mladshie.html' }
];

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
/* класс ученика из входа по коду (0 - неизвестно) */
function cls() { try { var P = JSON.parse(lsG(CFG.meKey || 'spk_vzlet') || 'null'); return (P && parseInt(P.cls, 10)) || 0; } catch (e) { return 0; } }
function kidFirst() { var c = cls(); return c > 0 && c <= 6; }

/* ---------- окно с игрой поверх курса ---------- */
var ov = null, poll = 0, onDone = null, onClose = null, fired = false;
var css = document.createElement('style');
css.textContent = '#trOv{position:fixed;inset:0;z-index:9000;background:#0b0816}#trOv iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
  '.tr-list{display:grid;gap:12px}.tr-card{display:flex;gap:14px;align-items:flex-start}.tr-card .tr-e{font-size:38px;line-height:1;flex:none}' +
  '.tr-card h3{margin:0 0 4px}.tr-card p{margin:0 0 10px}.tr-acts{display:flex;flex-wrap:wrap;gap:8px}.tr-card.soon{opacity:.6}.tr-best{margin-top:8px;font-size:13px}';
document.head.appendChild(css);

function close() {
  if (!ov) return; clearInterval(poll); poll = 0;
  try { var w = ov.querySelector('iframe').contentWindow; if (w.GOLOS) w.GOLOS.stop(); } catch (e) {}
  ov.remove(); ov = null; onDone = null; document.documentElement.style.overflow = '';
  var oc = onClose; onClose = null; if (oc) try { oc(fired); } catch (e) {}
  if (window.GOLOS && window.GOLOS.stop) try { window.GOLOS.stop(); } catch (e) {}
}
/* назад (кнопка "←" в игре, кнопка "назад" телефона) закрывает игру и возвращает в курс */
addEventListener('popstate', function () { if (ov) close(); });
addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') history.back(); });

function open(id, kid, cb, closeCb) {
  var tr = LIST.find(function (x) { return x.id === id; }); if (!tr || tr.soon) return;
  close(); fired = false; onDone = cb || null; onClose = closeCb || null;
  if (window.GOLOS && window.GOLOS.stop) try { window.GOLOS.stop(); } catch (e) {}
  ov = document.createElement('div'); ov.id = 'trOv';
  var f = document.createElement('iframe'); f.src = kid ? tr.kid : tr.url; f.title = tr.t; f.allow = 'autoplay; fullscreen';
  ov.appendChild(f); document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden';
  try { history.pushState({ tren: id }, ''); } catch (e) {}
  /* смотрим, собран ли дрон */
  poll = setInterval(function () {
    if (fired) return;
    try { var g = f.contentWindow.SBG, s = g && g.st(); if (s && s.stage === 'done') { fired = true; if (onDone) onDone(s); } } catch (e) {}
  }, 700);
  try { f.focus(); } catch (e) {}
}

/* ---------- шаг задания: { s: 'game', g: 'sborka' } ---------- */
function verBtns(id, extra) {
  var kf = kidFirst(), a = '<button class="kr-btn ' + (kf ? '' : 'pri') + '" data-tr="' + id + '" data-kid="0">' + (extra || '🛠 Собрать дрон') + '</button>',
    b = '<button class="kr-btn ' + (kf ? 'pri' : '') + '" data-tr="' + id + '" data-kid="1">🧒 Для младших (проще)</button>';
  return kf ? b + a : a + b;
}
function bind(root, cb) {
  Array.prototype.forEach.call(root.querySelectorAll('[data-tr]'), function (b) {
    b.onclick = function () { open(b.dataset.tr, b.dataset.kid === '1', cb); };
  });
}
if (K) {
  K.games = K.games || {};
  K.games.sborka = function (stg, st, hint, done) {
    var ok = false;
    stg.innerHTML = '<div class="kr-sec">' + esc(st.h || 'Мастерская') + '</div>' +
      '<div class="tr-card"><div class="tr-e">🛠</div><div><h3>Собери дрон сам</h3>' +
      '<p class="mut">Теперь собери настоящий дрон в 3D-мастерской: детали по системам, винты, пайка, разъёмы и аккумулятор. Когда дрон взлетит, тренажёр засчитается. Вернуться в курс - стрелка "←" вверху игры.</p>' +
      '<div class="tr-acts">' + verBtns('sborka') + '</div></div></div>';
    bind(stg, function (s) {
      if (ok) return; ok = true;
      try { done(1); } catch (e) {}
      var p = document.createElement('p'); p.className = 'mut tr-best';
      p.textContent = 'Дрон собран' + (s && s.err ? ', ошибок: ' + s.err : ' без ошибок') + '. Можно собрать ещё раз - в "Тренажёрах" на площадке.';
      var c = stg.querySelector('.tr-card div:last-child'); if (c) c.appendChild(p);
    });
  };
  /* тренажёры пульта (модуль 4) и Mobula 7 (модуль 5): тот же шаг { s: 'game', g: id } последним в задании */
  function trStep(id, e, h3, p, btn, ok) {
    K.games[id] = function (stg, st, hint, done) {
      var fired = false;
      stg.innerHTML = '<div class="kr-sec">' + esc(st.h || h3) + '</div><div class="tr-card"><div class="tr-e">' + e + '</div><div><h3>' + esc(h3) + '</h3>' +
        '<p class="mut">' + esc(p) + ' Вернуться в курс - стрелка "←" вверху.</p><div class="tr-acts">' + verBtns(id, btn) + '</div></div></div>';
      bind(stg, function () {
        if (fired) return; fired = true; try { done(1); } catch (er) {}
        var q = document.createElement('p'); q.className = 'mut tr-best'; q.textContent = ok;
        var c = stg.querySelector('.tr-card div:last-child'); if (c) c.appendChild(q);
      });
    };
  }
  trStep('pult', '🎮', 'Пульт RadioMaster в 3D', 'Покрути настоящий пульт: что делает каждая кнопка, как стики управляют дроном, какой тумблер взводит и как любую кнопку назначить в Betaflight.', '🎮 Открыть пульт', 'Тренажёр пройден. Повторить можно в "Тренажёрах" на площадке.');
  trStep('mobula', '🐝', 'Mobula 7: дрон первых гонок', 'Посмотри наш гоночный вуп в 3D, подготовь его к заезду сам и пролети круг по трассе в зале.', '🐝 Открыть Mobula 7', 'Тренажёр пройден. Повторить можно в "Тренажёрах" на площадке.');
  trStep('klassy', '🚁', 'Классы дронов в 3D', 'Сравни три дрона в настоящем размере: наш вуп Mobula 7, средний 3-дюймовый и большой 5-дюймовый. Где на каком летают и почему.', '🚁 Открыть классы', 'Тренажёр пройден. Повторить можно в "Тренажёрах" на площадке.');
  [['m4_sticks', 'pult', 'Тренажёр: пульт RadioMaster'], ['m5_class', 'mobula', 'Тренажёр: Mobula 7 в 3D'], ['m5_class', 'klassy', 'Тренажёр: классы дронов']].forEach(function (a) {
    var L2 = K.lib && K.lib[a[0]];
    if (L2 && !L2.steps.some(function (x) { return x.g === a[1]; })) L2.steps.push({ s: 'game', g: a[1], h: a[2], name: a[1] === 'pult' ? 'Пульт' : a[1] === 'klassy' ? 'Классы' : 'Mobula 7' });
  });
  /* шаг "Мастерская" последним в задании 2.6 (в конце, чтобы у тех, кто уже проходил, не сдвинулись шаги) */
  var L = K.lib && K.lib.m2_build;
  if (L && !L.steps.some(function (x) { return x.g === 'sborka'; }))
    L.steps.push({ s: 'game', g: 'sborka', h: 'Мастерская: собери дрон', name: 'Мастерская' });
}

/* ---------- окно "Тренажёры" ---------- */
function mount(box) {
  box.innerHTML = '<div class="kr"><div class="kr-card top"><span style="float:right;font-size:30px">🎮</span><h3>Тренажёры</h3>' +
    '<p class="mut">Просто потренироваться, без заданий и оценок. Тренажёры из заданий тоже живут здесь.</p></div><div class="tr-list">' +
    LIST.map(function (tr) {
      var best = tr.best && +(lsG(tr.best) || 0);
      return '<div class="kr-card tr-card' + (tr.soon ? ' soon' : '') + '"><div class="tr-e">' + tr.e + '</div><div><h3>' + esc(tr.t) + '</h3><p class="mut">' + esc(tr.sub) + '</p>' +
        (tr.soon ? '' : '<div class="tr-acts">' + verBtns(tr.id, '▶ Играть') + '</div>' + (best ? '<div class="mut tr-best">Лучший результат: ' + best + ' очков</div>' : '')) + '</div></div>';
    }).join('') + '</div></div>';
  bind(box, null);
}

window.KURS_TREN = { list: LIST, open: open, close: close, mount: mount };
})();
