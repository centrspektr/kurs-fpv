/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* shkola-viktorina.js - тест как телевикторина на экране ТВ (28.11.2026, план этажа, шаг 3; просьба Alexandr).
   Когда в комнате урока открывается проверка (вопросы с ответами) или тренажёр с выбором ответа, ученик садится в кресло,
   а вопрос и ответы появляются прямо на экране телевизора: вопрос сверху в вытянутом шестиугольнике, ответы A-D ромбом - по два слева и справа.
   Счёт, очки и прохождение - прежние (moduli.js): меняется только вид окна задания. Закончилась проверка - окно снова обычное.
   Только при KMN_UL (shkola.html), только в комнате с ТВ (komnata-new.js даёт window.KMN_TV). */
(function () {
'use strict';
if (!window.KMN_UL) return;
var D = document, cols = [], ON = false, WAIT = false, FAIL = false, off = [], raf = 0, last = '';
var HEX = 'polygon(14px 0,calc(100% - 14px) 0,100% 50%,calc(100% - 14px) 100%,14px 100%,0 50%)';
var A = '#c8a876', A2 = '#e2c896', F = 'MnU,Unbounded,"Segoe UI",system-ui,sans-serif';
var css = D.createElement('style');
css.textContent =
  'body.sh-tvq #win .wbg{display:none}body.sh-tvq.kmn-win #kmn canvas{filter:none!important}' +
  'body.sh-tvq .tvq-off{display:none!important}' +
  'body.sh-tvq #wpane{position:fixed;inset:auto;left:var(--tx);top:var(--ty);width:var(--tw);height:var(--th);padding:calc(var(--th) * .045) calc(var(--tw) * .035);overflow:auto;scrollbar-width:none;' +
    'background:radial-gradient(120% 90% at 50% 0%,#141b44 0%,#070a1c 60%,#04060f 100%);transition:opacity .35s;font-family:' + F + ';--fs:clamp(11px,calc(var(--th) * .043),21px)}' +
  'body.sh-tvq #wpane::-webkit-scrollbar{display:none}body.sh-tvq.tvq-wait #wpane{opacity:0;pointer-events:none}' +
  'body.sh-tvq #wpane .wbox{max-width:none;background:none;border:0;box-shadow:none;padding:0;margin:0;min-height:100%;display:flex;flex-direction:column;backdrop-filter:none;-webkit-backdrop-filter:none}' +
  'body.sh-tvq #wpane .wtop{position:fixed;left:calc(12px + env(safe-area-inset-left,0px));top:calc(12px + env(safe-area-inset-top,0px));margin:0;padding:0;background:none;border:0}body.sh-tvq #winT{display:none}' +
  'body.sh-tvq #krStage{background:none;border:0;box-shadow:none;padding:0;margin:auto 0;flex:1;display:flex;flex-direction:column;justify-content:center}' +
  /* вопрос */
  'body.sh-tvq .kr-q{display:flex;flex-direction:column;align-items:stretch;gap:calc(var(--th) * .035)}body.sh-tvq .kr-q .kr-sec,body.sh-tvq .kr-q .kr-hint{display:none}' +
  'body.sh-tvq .kr-q .top{justify-content:center;gap:1.2em;margin:0;font:400 calc(var(--fs) * .62)/1 ' + F + ';letter-spacing:.24em;text-transform:uppercase;color:' + A2 + ';opacity:1}' +
  'body.sh-tvq .kr-q .pr{height:1px;margin:0 18%;border-radius:0;background:rgba(200,168,118,.2)}body.sh-tvq .kr-q .pr i{background:' + A + '}' +
  'body.sh-tvq .kr-q>.kq-pic,body.sh-tvq .kr-q.kq-side>.kq-pic{max-width:none;width:auto;align-self:center;height:calc(var(--th) * .2);margin:0 auto;border:0;background:none;padding:0}body.sh-tvq .kq-pic svg,body.sh-tvq .kq-pic img{height:100%;width:auto;max-height:none}' +
  'body.sh-tvq.tvq-small .kq-pic{display:none}body.sh-tvq .kr-q.kq-side{display:flex}' +
  'body.sh-tvq .kr-q .qq,body.sh-tvq .kg-item{position:relative;isolation:isolate;margin:0;padding:.75em 2.2em;text-align:center;font:400 var(--fs)/1.3 ' + F + ';color:#fff;border:0;border-radius:0;background:linear-gradient(90deg,rgba(124,243,255,.55),rgba(200,168,118,.8),rgba(124,243,255,.55));clip-path:' + HEX + '}' +
  'body.sh-tvq .kr-q .qq::before,body.sh-tvq .kg-item::before{content:"";position:absolute;inset:1.5px;z-index:-1;clip-path:' + HEX + ';background:linear-gradient(180deg,#1b2456,#0b1030)}' +
  /* ответы ромбом */
  'body.sh-tvq .kr-q .qa,body.sh-tvq .kg-opts{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--th) * .03) calc(var(--tw) * .025);counter-reset:tq}' +
  'body.sh-tvq .kr-q .qa button,body.sh-tvq .kg-opts .kr-opt{position:relative;isolation:isolate;counter-increment:tq;display:flex;align-items:center;gap:.6em;min-height:calc(var(--th) * .13);padding:.45em 1.6em;border:0;border-radius:0;text-align:left;' +
    'font:300 calc(var(--fs) * .86)/1.25 ' + F + ';color:#eef0ff;background:rgba(124,243,255,.45);clip-path:' + HEX + ';transition:background .25s,color .25s;animation:tvqIn .45s both}' +
  'body.sh-tvq .kr-q .qa button::before,body.sh-tvq .kg-opts .kr-opt::before{content:"";position:absolute;inset:1.5px;z-index:-1;clip-path:' + HEX + ';background:linear-gradient(180deg,#141b44,#0a0e26);transition:background .25s}' +
  'body.sh-tvq .kr-q .qa button::after,body.sh-tvq .kg-opts .kr-opt::after{content:counter(tq,upper-latin);order:-1;flex:none;font:400 calc(var(--fs) * .8)/1 ' + F + ';color:' + A2 + '}' +
  'body.sh-tvq .kr-q .qa button:nth-child(2),body.sh-tvq .kg-opts .kr-opt:nth-child(2){animation-delay:.12s}body.sh-tvq .kr-q .qa button:nth-child(3),body.sh-tvq .kg-opts .kr-opt:nth-child(3){animation-delay:.24s}body.sh-tvq .kr-q .qa button:nth-child(4),body.sh-tvq .kg-opts .kr-opt:nth-child(4){animation-delay:.36s}' +
  'body.sh-tvq .kr-q .qa button:nth-child(3):last-child,body.sh-tvq .kg-opts .kr-opt:nth-child(3):last-child,body.sh-tvq .kg-opts .kr-opt:nth-child(1):last-child{grid-column:1 / span 2;justify-self:center;width:calc(50% - var(--tw) * .0125)}' +
  'body.sh-tvq .kr-q .qa button:not([disabled]):hover,body.sh-tvq .kg-opts .kr-opt:not([disabled]):hover,body.sh-tvq .kr-q .qa button:focus-visible,body.sh-tvq .kg-opts .kr-opt:focus-visible{background:' + A + ';outline:0}' +
  'body.sh-tvq .kr-q .qa button:not([disabled]):hover::before,body.sh-tvq .kg-opts .kr-opt:not([disabled]):hover::before{background:linear-gradient(180deg,#2a2440,#141024)}' +
  'body.sh-tvq .kr-q .qa button.y,body.sh-tvq .kg-opts .kr-opt.y{background:#5ee08f;color:#fff}body.sh-tvq .kr-q .qa button.y::before,body.sh-tvq .kg-opts .kr-opt.y::before{background:linear-gradient(180deg,#1d7a45,#0f4a2a)}' +
  'body.sh-tvq .kr-q .qa button.n,body.sh-tvq .kg-opts .kr-opt.n{background:#ff9a5a}body.sh-tvq .kr-q .qa button.n::before,body.sh-tvq .kg-opts .kr-opt.n::before{background:linear-gradient(180deg,#8a3a14,#4a1c08)}' +
  'body.sh-tvq .kr-q .qa button[disabled],body.sh-tvq .kg-opts .kr-opt[disabled]{opacity:1;cursor:default}' +
  'body.sh-tvq .kr-q .qa button:active,body.sh-tvq .kr-opt:active{transform:none}' +
  /* пояснение после ошибки и итог: тихо, по центру */
  'body.sh-tvq .kr-why{margin:calc(var(--th) * .02) auto 0;max-width:86%;padding:0;border:0;background:none;text-align:center;font:300 calc(var(--fs) * .72)/1.4 ' + F + ';color:#cfd3ee}' +
  'body.sh-tvq .kr-why b{display:inline;margin-right:.5em;font-weight:400;color:#ff9a5a}body.sh-tvq .kr-why.ok b{color:#5ee08f}' +
  'body.sh-tvq .kr-btn{min-height:40px;padding:.5em 1.6em;border:0;border-radius:0;background:none;color:' + A2 + ';font:400 calc(var(--fs) * .78)/1 ' + F + ';position:relative;cursor:pointer;box-shadow:none}' +
  'body.sh-tvq .kr-btn::after{content:"";position:absolute;left:1.6em;right:1.6em;bottom:.35em;height:1px;background:currentColor;opacity:.55;transform-origin:left;transition:transform .3s,opacity .3s}' +
  'body.sh-tvq .kr-btn:hover::after,body.sh-tvq .kr-btn:focus-visible::after{opacity:1}body.sh-tvq .kr-why .kr-btn{width:auto;margin:.4em auto 0;display:block}' +
  'body.sh-tvq .kr-end{font-family:' + F + ';color:#eef0ff}body.sh-tvq .kr-end .big{font:300 calc(var(--fs) * 2.2)/1 ' + F + ';color:' + A2 + ';background:none;-webkit-text-fill-color:currentColor}' +
  'body.sh-tvq .kr-end p,body.sh-tvq .kr-end details{font:300 calc(var(--fs) * .7)/1.45 ' + F + '}body.sh-tvq .kr-end>div:first-child{display:none}' +
  'body.sh-tvq .kr-x{background:none;border:0;padding:0}body.sh-tvq .kr-err{text-align:left;max-height:calc(var(--th) * .3);overflow:auto}' +
  'body.sh-tvq .tvq-col{display:flex!important;flex-direction:column;flex:1 0 auto;padding:0!important;margin:0!important;min-height:0!important}' +
  'body.sh-tvq #kmn .k-up,body.sh-tvq #kmn .k-st{opacity:0!important;pointer-events:none!important}' +
  'body.sh-tvq .kr-q:has(.kr-why) .kq-pic{display:none}body.sh-tvq .kr-btn:focus,body.sh-tvq .kr-btn:focus-visible{outline:0!important;box-shadow:none!important}body.sh-tvq .kr-btn:focus-visible::after{opacity:1;height:2px}' +
  '@keyframes tvqIn{from{opacity:0;transform:translateY(6px)}}' +
  '@media (prefers-reduced-motion:reduce){body.sh-tvq .kr-q .qa button,body.sh-tvq .kg-opts .kr-opt{animation:none}}';
(D.head || D.documentElement).appendChild(css);

function stage() { var w = D.getElementById('win'); return w && w.classList.contains('on') ? D.getElementById('krStage') : null; }
/* что на экране похоже на вопрос с ответами */
function quizLike(s) { return !!(s && s.querySelector('.kr-q .qa, .kg-opts .kr-opt, .kr-end, .kr-why')); }
function want() { var s = stage(), tv = window.KMN_TV; return !!(s && tv && tv.ok && !FAIL && D.body.classList.contains('kmn-on') && (quizLike(s) || (ON && s.querySelector('.kr-why, .kr-end')))); }
function hideAround(s) { var n = s, box = D.querySelector('#wpane .wbox'); while (n && n !== box && n.parentNode) { if (n !== s && !n.classList.contains('tvq-col')) { n.classList.add('tvq-col'); cols.push(n); } [].forEach.call(n.parentNode.children, function (c) { if (c !== n && !c.classList.contains('wtop') && !c.classList.contains('tvq-off')) { c.classList.add('tvq-off'); off.push(c); } }); n = n.parentNode; } }
function place() { var tv = window.KMN_TV, r = tv && tv.rect(); if (!r) return false; var p = D.getElementById('win');
  var k = r.w + 'x' + r.h + '@' + r.x + ',' + r.y; if (k !== last) { last = k; p.style.setProperty('--tx', r.x + 'px'); p.style.setProperty('--ty', r.y + 'px'); p.style.setProperty('--tw', r.w + 'px'); p.style.setProperty('--th', r.h + 'px'); D.body.classList.toggle('tvq-small', r.h < 300); }
  return true; }
function start() { ON = true; WAIT = true; last = ''; var tv = window.KMN_TV; D.body.classList.add('sh-tvq', 'tvq-wait'); if (window.GOLOS && GOLOS.stop) try { GOLOS.stop(); } catch (e) {}
  tv.sit(); var t0 = Date.now();
  (function w() { if (!ON) return; if ((tv.sitting || Date.now() - t0 > 2500) && place()) { WAIT = false; D.body.classList.remove('tvq-wait'); return; } if (Date.now() - t0 > 4000) { FAIL = true; stop(); return; } raf = requestAnimationFrame(w); })(); }
function stop() { ON = false; WAIT = false; cancelAnimationFrame(raf); D.body.classList.remove('sh-tvq', 'tvq-wait', 'tvq-small'); off.forEach(function (c) { c.classList.remove('tvq-off'); }); off = []; cols.forEach(function (c) { c.classList.remove('tvq-col'); }); cols = []; }
function check() { if (!stage()) FAIL = false; var w = want();
  if (w && !ON) start(); else if (!w && ON) stop();
  if (ON) { var s = stage(); if (s) hideAround(s); } }
var mo = new MutationObserver(function () { check(); });
function mount() { var w = D.getElementById('win'); if (!w) return; mo.observe(w, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true }); check(); }
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', mount); else mount();
addEventListener('resize', function () { if (!ON) return; setTimeout(function () { var tv = window.KMN_TV; if (tv) tv.draw(); place(); }, 80); });
window.SHKOLA_VIKTORINA = { get on() { return ON && !WAIT; } };
})();
