/* muzyka.js - фоновая музыка курса и шестерёнка громкости (проба 18.11.2026).
   В городе играет muzyka/gorod.mp3, в модулях (крыши и помещения) - muzyka/modul.mp3. Музыка своя (сделана кодом, без лицензий).
   Где ученик, говорит window.KURS_MESTO() из kosmos-kurs-proba.js: 'gorod' или 'modul'. Нет функции - считаем, что город.
   Файл грузится только когда ученик попал в это место. Играет по кругу без щелчка (Web Audio).
   Пока звучит голос Леры (любой звук <audio> на странице или в комнате-iframe), музыка тише.
   Городская шестерёнка (и кнопка ⚙ в комнатах): ползунки "Голос Леры" (GOLOS.setVol) и "Музыка". Оба помнятся на устройстве. */
(function () {
'use strict';
var TR = {   /* n - длина петли в отсчётах 44100 Гц (без пустоты, которую добавляет mp3) */
  gorod: { f: 'muzyka/gorod.mp3?v=1811', n: 3681391 },
  modul: { f: 'muzyka/modul.mp3?v=1811', n: 3024000 }
};
var KEY = 'kurs_muz_vol', DUCK = 0.3, FADE = 1.6;
function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
var v0 = parseFloat(lsG(KEY)), VOL = isNaN(v0) ? 0.5 : Math.max(0, Math.min(1, v0));
function gainOf(v) { return v * v * 0.55; }   /* ползунок -> громкость: слышно ровнее, чем прямо */

var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null, duck = null;
var cur = null, want = null, loading = {}, buf = {}, speak = false, quietT = 0;

function init() {
  if (ctx || !AC) return;
  try { ctx = new AC(); } catch (e) { ctx = null; return; }
  master = ctx.createGain(); master.gain.value = gainOf(VOL);
  duck = ctx.createGain(); duck.gain.value = 1;
  duck.connect(master); master.connect(ctx.destination);
}
function unlock() { init(); if (ctx && ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(function () {}); tick(); }
['pointerdown', 'keydown', 'touchend'].forEach(function (t) { addEventListener(t, unlock, true); });
document.addEventListener('visibilitychange', function () { if (!ctx) return; if (document.hidden) ctx.suspend().catch(function () {}); else ctx.resume().catch(function () {}); });

function load(id, cb) {
  if (buf[id]) return cb(buf[id]);
  if (loading[id]) { loading[id].push(cb); return; }
  loading[id] = [cb];
  fetch(TR[id].f).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (ab) {
    return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); });
  }).then(function (b) {
    /* держим в памяти только нужную дорожку: расшифрованная музыка весит десятки МБ */
    Object.keys(buf).forEach(function (k) { if (k !== id && (!cur || cur.id !== k)) delete buf[k]; });
    buf[id] = b; var l = loading[id]; loading[id] = null; l.forEach(function (f) { f(b); });
  }).catch(function () { loading[id] = null; });
}
function start(id) {
  load(id, function (b) {
    if (want !== id || (cur && cur.id === id)) return;
    var s = ctx.createBufferSource(), g = ctx.createGain(), sr = b.sampleRate, n = TR[id].n * sr / 44100;
    s.buffer = b; s.loop = true;
    var pad = b.length - n, st = pad >= 1105 * sr / 44100 ? 1105 / 44100 : Math.max(0, pad / 2) / sr;   /* mp3 добавляет ~1105 отсчётов в начало */
    s.loopStart = st; s.loopEnd = st + n / sr;
    g.gain.value = 0; s.connect(g); g.connect(duck);
    var t = ctx.currentTime; s.start(t, st); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + FADE);
    stopCur(); cur = { id: id, s: s, g: g };
  });
}
function stopCur() {
  if (!cur) return; var c = cur, t = ctx.currentTime; cur = null;
  c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(0, t + FADE);
  setTimeout(function () { try { c.s.stop(); c.s.disconnect(); c.g.disconnect(); } catch (e) {} if (!cur || cur.id !== c.id) delete buf[c.id]; }, FADE * 1000 + 200);
}

/* ---- голос играет? Следим за всеми <audio>/new Audio() на странице и в комнатах (iframe того же сайта) ---- */
var media = [];
function hook(w) {
  try {
    var P = w.HTMLMediaElement && w.HTMLMediaElement.prototype; if (!P || P.__muz) return;
    var orig = P.play; P.__muz = 1;
    P.play = function () { if (media.indexOf(this) < 0) { media.push(this); if (media.length > 40) media.shift(); } return orig.apply(this, arguments); };
  } catch (e) {}
}
function frames(w, out) { try { for (var i = 0; i < w.frames.length; i++) { var f = w.frames[i]; f.document; out.push(f); frames(f, out); } } catch (e) {} return out; }
function voiceOn() {
  for (var i = 0; i < media.length; i++) { var a = media[i]; if (!a.paused && !a.ended && !a.muted && a.volume > 0 && !a.error && a.readyState > 1) return true;   /* файла нет (404) - не голос */ }
  try { if (window.speechSynthesis && speechSynthesis.speaking) return true; } catch (e) {}
  return false;
}
hook(window);

function place() { try { return window.KURS_MESTO ? KURS_MESTO() : 'gorod'; } catch (e) { return 'gorod'; } }
function tick() {
  frames(window, []).forEach(hook);
  if (!ctx || ctx.state !== 'running') return;
  var p = VOL > 0 ? place() : null; want = TR[p] ? p : null;
  if (!want) stopCur(); else if (!cur || cur.id !== want) start(want);
  var sp = voiceOn(), t = ctx.currentTime;
  if (sp) quietT = Date.now();
  var on = sp || Date.now() - quietT < 700;   /* между фразами Леры музыка не прыгает */
  if (on !== speak) { speak = on; duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(duck.gain.value, t); duck.gain.linearRampToValueAtTime(on ? DUCK : 1, t + (on ? 0.25 : 1.2)); }
}
setInterval(tick, 300);

function setVol(v) {
  VOL = Math.max(0, Math.min(1, +v || 0)); lsS(KEY, String(VOL));
  if (master) { var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(gainOf(VOL), t, 0.05); }
  tick();
}
function voiceVol() { var w = [window].concat(frames(window, [])).reverse().filter(function (x) { try { return x.GOLOS && x.GOLOS.vol != null; } catch (e) { return false; } })[0]; return w ? w.GOLOS.vol : 1; }   /* в комнате - её голос */
function setVoice(v) {
  [window].concat(frames(window, [])).forEach(function (w) { try { if (w.GOLOS && w.GOLOS.setVol) w.GOLOS.setVol(v); var r = w.document.getElementById('vol'); if (w !== window && r) r.value = Math.round(v * 100); } catch (e) {} });
}

/* ---- ползунки "Голос Леры" и "Музыка" ----
   В городе и модулях - в меню городской шестерёнки (#cityG, под кнопками "Обычный вид" и др.).
   В комнатах (модули 3 и 5) - кнопка ⚙ в верхней полосе комнаты зовёт MUZYKA.toggle(). Нет #cityG - своя кнопка ⚙. */
var css = document.createElement('style');
css.textContent = '#muzP{position:fixed;top:calc(64px + env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));z-index:60;width:230px;padding:10px 14px 8px;border-radius:16px;background:rgba(10,14,30,.9);border:1px solid rgba(255,255,255,.22);color:#fff;font:600 13px/1.3 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:opacity .25s,transform .3s}' +
  '#muzP.off{opacity:0;pointer-events:none;transform:translateY(-14px) scale(.92)}#muzP label{display:block;margin:2px 0 8px}#muzP span{display:flex;justify-content:space-between}#muzP b{color:#7cf3ff;font-weight:700}' +
  'body.intro #muzP.g,body.osd #muzP.g{opacity:0;pointer-events:none}#muzP input{width:100%;margin:6px 0 0;accent-color:#7cf3ff;height:22px}' +
  '#muzG{position:fixed;top:calc(14px + env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));z-index:60;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(10,14,30,.7);color:#fff;font:21px/1 system-ui;cursor:pointer}';
document.head.appendChild(css);
var pn = document.createElement('div'); pn.id = 'muzP'; pn.className = 'off';
pn.innerHTML = '<label><span>🎙 Голос Леры <b id="muzVv"></b></span><input id="muzV" type="range" min="0" max="100" step="5" aria-label="Громкость голоса Леры"></label>' +
  '<label><span>🎵 Музыка <b id="muzMv"></b></span><input id="muzM" type="range" min="0" max="100" step="5" aria-label="Громкость музыки"></label>';
function ui() {
  var v = Math.round(voiceVol() * 100), m = Math.round(VOL * 100);
  pn.querySelector('#muzV').value = v; pn.querySelector('#muzVv').textContent = v ? v + '%' : 'выкл';
  pn.querySelector('#muzM').value = m; pn.querySelector('#muzMv').textContent = m ? m + '%' : 'выкл';
}
var mode = null;   /* null - закрыто, 'gear' - в меню городской шестерёнки, 'free' - открыто кнопкой */
function show(m, top) {
  mode = m; if (!m) { pn.classList.add('off'); return; }
  ui(); pn.style.top = top ? top + 'px' : ''; pn.classList.remove('off'); pn.classList.toggle('g', m === 'gear');
}
function underGear() {   /* под последней видимой кнопкой меню шестерёнки (кнопки fixed, у них offsetParent пустой) */
  var y = 0; ['plainB', 'tourB', 'autoB'].forEach(function (id) { var e = document.getElementById(id); if (!e || e.hidden || getComputedStyle(e).display === 'none') return;
    var top = parseFloat(getComputedStyle(e).top) || 0; y = Math.max(y, top + e.offsetHeight); });
  return y ? Math.round(y + 10) : 0;
}
function mount() {
  document.body.appendChild(pn);
  pn.querySelector('#muzV').oninput = function () { setVoice(this.value / 100); ui(); };
  pn.querySelector('#muzM').oninput = function () { unlock(); setVol(this.value / 100); ui(); };
  var cg = document.getElementById('cityG');
  if (cg) {
    new MutationObserver(function () { var on = document.body.classList.contains('gear');
      if (on && mode !== 'gear') setTimeout(function () { if (document.body.classList.contains('gear')) show('gear', underGear()); }, 30);
      else if (!on && mode === 'gear') show(null); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  } else {
    var gb = document.createElement('button'); gb.id = 'muzG'; gb.type = 'button'; gb.textContent = '⚙'; gb.setAttribute('aria-label', 'Громкость голоса и музыки');
    document.body.appendChild(gb); gb.onclick = function () { show(mode ? null : 'free'); };
  }
  document.addEventListener('pointerdown', function (e) { if (mode === 'free' && !pn.contains(e.target) && e.target.id !== 'muzG') show(null); }, true);
}
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

window.MUZYKA = { setVol: setVol, toggle: function () { show(mode === 'free' ? null : 'free'); }, close: function () { if (mode === 'free') show(null); }, ui: function () { if (mode) ui(); }, get vol() { return VOL; }, get place() { return want; }, get tishe() { return speak; }, get mode() { return mode; }, get playing() { return cur ? cur.id : null; } };
})();
