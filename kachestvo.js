/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* kachestvo.js - качество графики (21.11.2026, тред "Ускорить курс на слабых устройствах").
   Сам подбирает качество под устройство (видеокарта, память, ядра) и снижает его, если кадры долгие.
   В шестерёнке - ручной выбор: Авто / Низкое / Среднее / Высокое. Ручной выбор курс сам не меняет.
   Хранится на устройстве: kursy_grafika (low|mid|high - его читают помещения модулей 2, 3, 5), kursy_grafika_ruchn = 1 - выбрано вручную.
   KACHESTVO.level - 'low'|'mid'|'high'; .manual; .set('auto'|'low'|'mid'|'high'); .slow() - "кадры долгие" (только в авто: на ступень ниже);
   .on(fn) - позвать fn(level) при смене; .gpu - название видеокарты; .auto - что выбрал бы авто. ?q=low|mid|high в адресе - на один раз. */
(function () {
'use strict';
var LS = window.localStorage, K = 'kursy_grafika', KR = 'kursy_grafika_ruchn', KA = 'kursy_grafika_avto';
function g(k) { try { return LS.getItem(k); } catch (e) { return null; } }
function s(k, v) { try { if (v == null) LS.removeItem(k); else LS.setItem(k, v); } catch (e) {} }
var ORD = ['low', 'mid', 'high'];
var MOB = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

/* видеокарта: название из WebGL (без него - только память и ядра) */
var GPU = '';
try { var cv = document.createElement('canvas'), gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
  if (gl) { var ext = gl.getExtension('WEBGL_debug_renderer_info'); GPU = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } } catch (e) {}
function guess() {
  var mem = navigator.deviceMemory || 4, cpu = navigator.hardwareConcurrency || 4, G = GPU.toLowerCase(), lvl;
  if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(G)) lvl = 'low';
  else if (/mali-[t4]|mali-g(31|51|52|57)|adreno.*\b[2-5]\d\d\b|powervr|sgx|videocore|intel.*(hd graphics( [2-5]\d\d\d?)?($|[^0-9])|gma)|bay ?trail|atom/.test(G)) lvl = 'low';
  else if (/intel|uhd|iris|adreno.*\b6\d\d\b|mali-g|apple gpu|vivante/.test(G)) lvl = 'mid';
  else if (/nvidia|geforce|rtx|gtx|quadro|radeon|amd|apple m\d|adreno.*\b[7-9]\d\d\b|arc/.test(G)) lvl = 'high';
  else lvl = MOB ? 'mid' : 'high';
  if (mem <= 2 || cpu <= 2) lvl = 'low';
  else if ((mem <= 4 || cpu <= 4) && lvl === 'high') lvl = 'mid';
  if (MOB && lvl === 'high') lvl = 'mid';
  return lvl; }
var AUTO = guess();
/* авто: если раньше уже снижали из-за долгих кадров - помним это (kursy_grafika_avto) */
var saved = g(KA); if (saved && ORD.indexOf(saved) >= 0 && ORD.indexOf(saved) < ORD.indexOf(AUTO)) AUTO = saved;
var qp = (/[?&]q=(low|mid|high)\b/.exec(location.search) || [])[1];
var manual = g(KR) === '1' && ORD.indexOf(g(K)) >= 0;
var level = qp || (manual ? g(K) : AUTO);
if (!qp && !manual) s(K, level);   /* помещения модулей читают kursy_grafika */
var subs = [];
function emit() { subs.forEach(function (f) { try { f(level); } catch (e) {} }); upd(); }
var Q = window.KACHESTVO = {
  get level() { return level; }, get manual() { return manual; }, get auto() { return AUTO; }, gpu: GPU, mob: MOB,
  on: function (f) { subs.push(f); },
  set: function (v) { if (v === 'auto') { manual = false; s(KR, null); s(KA, null); AUTO = guess(); level = AUTO; s(K, level); }
    else if (ORD.indexOf(v) >= 0) { manual = true; s(KR, '1'); level = v; s(K, v); } emit(); },
  /* кадры долгие: в авто - на ступень ниже (запоминаем), вручную - ничего не делаем */
  slow: function () { if (manual || qp) return false; var i = ORD.indexOf(level); if (i <= 0) return false; level = ORD[i - 1]; AUTO = level; s(KA, level); s(K, level); emit(); return true; },
  /* предел резкости для сцены: город, крыши */
  dpr: function (mob) { var d = window.devicePixelRatio || 1; return level === 'low' ? Math.min(d, mob ? .9 : 1) : level === 'mid' ? Math.min(d, mob ? 1.1 : 1.25) : Math.min(d, mob ? 1.25 : 1.75); }
};

/* ---- строка "Графика" в панели шестерёнки (#muzP из muzyka.js) ---- */
var NM = { auto: 'Авто', low: 'Низкая', mid: 'Средняя', high: 'Высокая' }, row = null;
var css = document.createElement('style');
css.textContent = '#kchR{margin:2px 0 8px}#kchR>span{display:flex;justify-content:space-between}#kchR b{color:#7cf3ff;font-weight:700}' +
  '#kchR .kch-b{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px}#kchR button{min-height:30px;padding:0 2px;border-radius:9px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;font:700 11px system-ui,sans-serif;cursor:pointer}' +
  '#kchR button.on{background:#7cf3ff;color:#06101e;border-color:#7cf3ff}#kchR small{display:block;margin-top:5px;font-weight:500;font-size:11px;opacity:.7;line-height:1.3}';
(document.head || document.documentElement).appendChild(css);
function upd() { if (!row) return; var cur = manual ? level : 'auto';
  row.querySelector('b').textContent = manual ? NM[level] : 'авто - ' + NM[level].toLowerCase();
  [].forEach.call(row.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.dataset.q === cur); }); }
function mount() { var pn = document.getElementById('muzP'); if (!pn || row) return !!row;
  row = document.createElement('div'); row.id = 'kchR';
  row.innerHTML = '<span>🖥 Графика <b></b></span><div class="kch-b">' + ['auto', 'low', 'mid', 'high'].map(function (k) { return '<button type="button" data-q="' + k + '">' + NM[k] + '</button>'; }).join('') + '</div>' +
    '<small>Тормозит - выбери "Низкая". В модулях-помещениях новое качество - со следующего входа.</small>';
  pn.appendChild(row); row.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) Q.set(b.dataset.q); });
  upd(); return true; }
if (!mount()) { var n = 0, iv = setInterval(function () { if (mount() || ++n > 120) clearInterval(iv); }, 250); }
})();
