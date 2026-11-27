/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* nachalo-teorii.js - Лётная школа (проба 24.11.2026): начало теории у телевизора.
   Идея Alexandr: без серого окна. Название темы печатается по буквам с тихим звуком печати, ниже так же печатается "8 слайдов · ~4 минуты",
   потом буквы рассыпаются слева направо и появляются две аккуратные кнопки: "Лера рассказывает" и "Читаю сам".
   Использование: NACHALO_TEORII.show({ title: 'Из чего состоит дрон', info: '8 слайдов · ~4 минуты', lera: function(){}, sam: function(){} }); NACHALO_TEORII.hide();
   Звук печати - короткие щелчки WebAudio, без файлов; молчит, если звук курса выключен (GOLOS.on === false). */
(function () {
'use strict';
var D = document, RED = matchMedia('(prefers-reduced-motion:reduce)').matches;
var css = D.createElement('style');
css.textContent = [
'#ntS{position:fixed;left:0;right:0;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:12;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;font-family:ShM,Manrope,system-ui,sans-serif;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.75)}',
'#ntS[hidden]{display:none}',
'#ntS .nt-t{font:800 clamp(20px,4.4vw,30px)/1.2 ShU,Unbounded,Manrope,system-ui,sans-serif;letter-spacing:.01em;min-height:1.2em;text-align:center;padding:0 16px}',
'#ntS .nt-i{font-weight:600;font-size:clamp(13px,2.6vw,16px);color:#c9d2ff;min-height:1.3em}',
'#ntS .nt-c{display:inline-block;white-space:pre;transition:transform .55s cubic-bezier(.3,.6,.4,1),opacity .55s,filter .55s}',
'#ntS .nt-c.go{transform:translate(42px,-14px) rotate(14deg);opacity:0;filter:blur(3px)}',
'#ntS .nt-k{display:inline-block;width:.55em;height:1em;margin-left:2px;vertical-align:-.12em;background:#7cf3ff;animation:ntK .8s steps(1) infinite}',
'@keyframes ntK{50%{opacity:0}}',
'#ntS .nt-b{display:flex;gap:12px;margin-top:2px;pointer-events:auto}',
'#ntS .nt-b button{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:min(42vw,220px);height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(9,11,26,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;font:700 15px ShM,Manrope,system-ui,sans-serif;cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity .45s,transform .45s,border-color .15s,background .15s}',
'#ntS .nt-b button.on{opacity:1;transform:none}',
'#ntS .nt-b button:hover{border-color:rgba(124,243,255,.7);background:rgba(20,26,52,.75)}',
'#ntS .nt-b button i{font-style:normal;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;background:rgba(124,243,255,.16);color:#7cf3ff}'
].join('');
D.head.appendChild(css);

var box, tEl, iEl, bEl, timers = [], AC = null;
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clear() { timers.forEach(clearTimeout); timers = []; }
function soundOn() { var G = window.GOLOS; return !(G && G.on === false); }
function tick(big) {   /* тихий щелчок клавиши: короткий шум через фильтр */
  if (!soundOn()) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    var n = Math.floor(AC.sampleRate * .018), buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = (big ? 1400 : 2400) + Math.random() * 600; f.Q.value = 1.2;
    var vol = (window.GOLOS && GOLOS.vol != null ? GOLOS.vol : 1) * (big ? .05 : .035); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); } catch (e) {}
}
function build() { if (box) return; box = D.createElement('div'); box.id = 'ntS'; box.hidden = true;
  box.innerHTML = '<div class="nt-t"></div><div class="nt-i"></div><div class="nt-b"><button type="button" data-a="lera"><i>▶</i>Лера рассказывает</button><button type="button" data-a="sam"><i>✎</i>Читаю сам</button></div>';
  D.body.appendChild(box); tEl = box.querySelector('.nt-t'); iEl = box.querySelector('.nt-i'); bEl = box.querySelector('.nt-b'); }
function chars(el, text) { el.innerHTML = ''; return text.split('').map(function (ch) { var s = D.createElement('span'); s.className = 'nt-c'; s.textContent = ch; s.style.visibility = 'hidden'; el.appendChild(s); return s; }); }
function type(list, step, done, at) { var k = D.createElement('span'); k.className = 'nt-k'; var par = list.length ? list[0].parentNode : null; if (par) par.appendChild(k);
  list.forEach(function (s, i) { later(function () { s.style.visibility = ''; if (par) par.insertBefore(k, s.nextSibling); if (s.textContent !== ' ') tick(i === 0); }, at + i * step); });
  later(function () { if (k.parentNode) k.parentNode.removeChild(k); if (done) done(); }, at + list.length * step + 60); return at + list.length * step; }

var API = window.NACHALO_TEORII = {
  show: function (o) { build(); clear(); o = o || {}; box.hidden = false;
    [].forEach.call(bEl.children, function (b) { b.classList.remove('on'); b.onclick = function () { var f = o[b.dataset.a]; API.hide(); if (f) f(); }; });
    var A = chars(tEl, o.title || 'Теория'), B = chars(iEl, o.info || ''), sp = RED ? 0 : 55;
    var t1 = type(A, sp, null, 250), t2 = type(B, RED ? 0 : 32, null, t1 + 350), all = A.concat(B);
    var tScatter = t2 + (RED ? 300 : 1300);
    later(function () { all.forEach(function (s, i) { later(function () { s.classList.add('go'); }, RED ? 0 : i * 14); }); }, tScatter);   /* рассыпаются слева направо */
    var tBtn = tScatter + (RED ? 100 : all.length * 14 + 350);
    later(function () { tEl.innerHTML = ''; iEl.innerHTML = ''; [].forEach.call(bEl.children, function (b, i) { later(function () { b.classList.add('on'); }, i * 120); }); }, tBtn);
  },
  hide: function () { clear(); if (box) box.hidden = true; }
};
})();
