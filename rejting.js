/* Курс FPV: рейтинг курса по площадкам (промт 31, 09.11.2026). С 09.11 на главной (index.html, prosto.html) и на пробе.
   Площадки клуба: Иртыш irtysh, Черлак cherlak, Соляное solyanoe, Елизаветинка elizavetinka (в коде сервера - selo).
   Два вида рейтинга: "Теория" (th - очки за задания курса, без полётных) и "Сборка" (sb - лучший результат игры "Собери дрон").
   Очки на сервер шлёт moduli.js в ksync (поля th, te, sb), когда подключён этот файл (window.KURS_REJT).
   Рейтинг берётся с сервера: { op: 'srate', club, selo: id | 'all', kind: 'th' | 'sb', code | token }.
   Гостю без кода сервер рейтинг не отдаёт. Пустая площадка = Иртыш.
   Подключать до moduli.js / kosmos-kurs.js. */
(function () {
'use strict';
var CFG = window.KURSY || {}, CLUB = CFG.club || 'vzlet', API = CFG.api || 'https://functions.yandexcloud.net/d4e4vhndceg7scc0mh3b';
var SELO_KEY = (CFG.meKey || 'kursy_fpv_me') + '_selo';   // площадка ученика из последнего ответа сервера
var SB_KEY = 'kursy_fpv_sborka';                          // лучший результат "Собери дрон" (пишет сама игра)
var SELA0 = [{ id: 'irtysh', name: 'Иртыш' }, { id: 'cherlak', name: 'Черлак' }, { id: 'solyanoe', name: 'Соляное' }, { id: 'elizavetinka', name: 'Елизаветинка' }];

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function call(q) { return fetch(API, { method: 'POST', body: JSON.stringify(q) }).then(function (r) { return r.json(); }); }
function me() { try { var P = JSON.parse(lsG(CFG.meKey || 'kursy_fpv_me') || 'null'); return P && P.code && P.status === 'принят' ? P : null; } catch (e) { return null; } }

/* площадка ученика: { id, name } или null (ещё не знаем) */
function mySelo() { try { var s = JSON.parse(lsG(SELO_KEY) || 'null'); if (s && s.id) return s; } catch (e) {} var P = me(); return P && P.selo ? { id: P.selo, name: P.seloName || nameOf(P.selo) } : null; }
function setSelo(id, name) { if (!id) return; var o = mySelo(); if (o && o.id === id && o.name === name) return; lsS(SELO_KEY, JSON.stringify({ id: id, name: name || nameOf(id) })); }
var SELA = SELA0.slice();
function nameOf(id) { var s = SELA.find(function (x) { return x.id === (id || 'irtysh'); }); return s ? s.name : (id || 'Иртыш'); }
function setSela(list) { if (Array.isArray(list) && list.length) SELA = list.filter(function (x) { return x && x.id; }).map(function (x) { return { id: x.id, name: x.name || x.id }; }); }

/* очки сборки с телефона (игра хранит лучший результат) */
function sbPts() { var v = parseInt(lsG(SB_KEY), 10); return v > 0 ? Math.min(100000, v) : 0; }

/* ---------- окно рейтинга ---------- */
var css = document.createElement('style');
css.textContent = '.rj-seg{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.rj-seg button{flex:1 1 auto;min-height:40px;border-radius:12px;border:1px solid rgba(160,170,255,.35);background:rgba(127,127,160,.12);color:inherit;font:600 14px system-ui;padding:6px 10px;cursor:pointer}' +
  '.rj-seg button.on{background:#00d4ff;color:#04111c;border-color:#00d4ff}.rj-seg select{flex:1 1 auto;min-height:40px;border-radius:12px;padding:6px 10px;font:600 14px system-ui}' +
  '.rj-me{margin:8px 0;padding:10px 12px;border-radius:12px;background:rgba(0,212,255,.12);font-weight:600}.rj-list{list-style:none;margin:6px 0 0;padding:0}' +
  '.rj-list li{display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid rgba(160,170,255,.15)}.rj-list li.mine{background:rgba(250,204,21,.14);border-radius:10px}' +
  '.rj-list i{font-style:normal;min-width:28px;text-align:center;font-weight:800}.rj-list span{flex:1}.rj-list small{opacity:.7}.rj-list b{white-space:nowrap}.rj-note{opacity:.8;margin:8px 0}';
(document.head || document.documentElement).appendChild(css);

var CACHE = {};   // ключ запроса -> { at, j }
var MEDAL = ['🥇', '🥈', '🥉'];

/* el - куда рисовать; opt: { token, scope: ['cherlak'] | null } для педагога; без opt - ученик по своему коду */
function mount(el, opt) {
  if (!el) return; opt = opt || {};
  var coach = !!opt.token, P = coach ? null : me();
  var st = el._rj || (el._rj = { kind: 'th', selo: null });
  var own = coach ? (opt.scope && opt.scope.length === 1 ? { id: opt.scope[0], name: nameOf(opt.scope[0]) } : null) : mySelo();
  var admin = coach && !(opt.scope && opt.scope.length);
  if (!st.selo) st.selo = own ? own.id : 'all';

  var head = '<h3>🏆 Рейтинг курса</h3>';
  if (!coach && !P) { el.innerHTML = '<div class="kr-card rj">' + head + '<p class="rj-note">Рейтинг видят ученики клуба по своему коду. Код даёт педагог: кнопка "Вход по коду".</p></div>'; return; }

  var seloSeg;
  if (admin) {
    seloSeg = '<div class="rj-seg"><select data-rj="selo" aria-label="Площадка"><option value="all"' + (st.selo === 'all' ? ' selected' : '') + '>🌍 Все площадки</option>' +
      SELA.map(function (s) { return '<option value="' + esc(s.id) + '"' + (st.selo === s.id ? ' selected' : '') + '>🏠 ' + esc(s.name) + '</option>'; }).join('') + '</select></div>';
  } else {
    seloSeg = '<div class="rj-seg" role="group" aria-label="Площадка">' +
      (own ? '<button data-rj="selo" data-v="' + esc(own.id) + '" class="' + (st.selo === own.id ? 'on' : '') + '">🏠 ' + esc(own.name) + '</button>' : '') +
      '<button data-rj="selo" data-v="all" class="' + (st.selo === 'all' ? 'on' : '') + '">🌍 Все площадки</button></div>';
  }
  var kindSeg = '<div class="rj-seg" role="group" aria-label="Вид рейтинга"><button data-rj="kind" data-v="th" class="' + (st.kind === 'th' ? 'on' : '') + '">📚 Теория</button>' +
    '<button data-rj="kind" data-v="sb" class="' + (st.kind === 'sb' ? 'on' : '') + '">🛠 Сборка</button></div>';
  var hint = st.kind === 'th' ? 'Очки за задания курса (полёты в теорию не идут).' : 'Лучший результат в игре "Собери дрон" (до 100 очков).';
  el.innerHTML = '<div class="kr-card rj">' + head + seloSeg + kindSeg + '<p class="mut rj-note" style="font-size:13px">' + esc(hint) + '</p><div class="rj-body"><p class="rj-note">⏳ Загружаю...</p></div></div>';

  Array.prototype.forEach.call(el.querySelectorAll('[data-rj]'), function (b) {
    var ev = b.tagName === 'SELECT' ? 'onchange' : 'onclick';
    b[ev] = function () { st[b.dataset.rj] = b.tagName === 'SELECT' ? b.value : b.dataset.v; mount(el, opt); };
  });

  var q = { op: 'srate', club: CLUB, selo: st.selo, kind: st.kind };
  if (coach) q.token = opt.token; else q.code = P.code;
  var key = JSON.stringify(q), c = CACHE[key], body = el.querySelector('.rj-body');
  var draw = function (j) {
    if (!body.isConnected && !el.contains(body)) return;
    if (!j || !j.ok) {
      body.innerHTML = '<p class="rj-note">' + esc(j && j.auth ? (coach ? 'Вход педагога устарел - войдите по PIN заново.' : 'Рейтинг видят ученики клуба по своему коду.') : (j && j.error) || 'Рейтинг сейчас недоступен') + '</p>';
      return;
    }
    if (j.me && j.me.selo && !coach) setSelo(j.me.selo, j.me.seloName);
    var mine = !coach && j.me && j.me.rank ? j.me.rank : 0, top = j.top || [], all = st.selo === 'all';
    var h = '';
    if (!coach) h += '<div class="rj-me">' + (mine ? 'Твоё место: ' + mine + (j.total ? ' из ' + j.total : '') + ' · ' + (j.me.pts || 0) + ' очков' :
      'Тебя пока нет в этом рейтинге' + (st.kind === 'sb' ? ' - собери дрон в "Тренажёрах".' : ' - пройди задание, и очки появятся.')) + '</div>';
    if (!top.length) h += '<p class="rj-note">Пока никого нет. Первые очки появятся, когда ученики начнут ' + (st.kind === 'sb' ? 'собирать дрон.' : 'проходить задания.') + '</p>';
    else h += '<ol class="rj-list">' + top.map(function (x, i) {
      var r = i + 1;
      return '<li class="' + (r === mine ? 'mine' : '') + '"><i>' + (MEDAL[i] || r) + '</i><span>' + esc(x.n) + (x.c ? ' <small>' + esc(x.c) + '</small>' : '') +
        (all || admin ? ' <small>· ' + esc(x.sn || nameOf(x.s)) + '</small>' : '') + '</span><b>⭐ ' + (+x.p || 0) + '</b></li>';
    }).join('') + '</ol>';
    body.innerHTML = h;
  };
  if (c && Date.now() - c.at < 60000) { draw(c.j); return; }
  call(q).then(function (j) { if (j && j.ok) CACHE[key] = { at: Date.now(), j: j }; draw(j); })
    .catch(function () { draw({ ok: false, error: 'Нет связи с сервером' }); });
}

/* список площадок с сервера (для фильтра владельца и подписей) */
call({ op: 'sela' }).then(function (j) { if (j && j.ok) setSela(j.sela); }).catch(function () {});

window.KURS_REJT = { mount: mount, sbPts: sbPts, mySelo: mySelo, setSelo: setSelo, nameOf: nameOf, setSela: setSela, sela: function () { return SELA; }, clear: function () { CACHE = {}; } };
})();
