/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
/* shkola-menu.js - Лётная школа (27.11.2026, вечер, просьба Alexandr): интерфейс в стиле минимализм.
   1) Вместо шестерёнки - кнопка "две полоски" (как меню клуба Взлёт): по нажатию полоски складываются в крестик, за меню тёмная вуаль,
      под кнопкой справа налево рисуется тонкая золотая линия, пункты проявляются по очереди. Закрыть: вуаль, Esc, снова кнопка.
      Внутри те же настройки, что были (управление, голос, громкость, музыка, графика, весь экран) - их строит muzyka.js и другие файлы.
   2) Подсказки комнат (карточка "Лифт - Вызови лифт", строка подсказки внизу, всплывающие сообщения, "Этажи", "К лифту") - без
      прямоугольника и фона-плашки: текст с тенью и тонкая линия. Кнопка действия - текст с линией.
   Только при window.KMN_UL (ставит shkola.html); ?ul=0 - как было. Свои файлы, без внешних; анимируются только transform и opacity;
   есть prefers-reduced-motion. Зона нажатия у кнопок не меньше 44 точек. */
(function () {
'use strict';
if (!window.KMN_UL) return;
var D = document, RED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var A = '#c8a876', A2 = '#e2c896', E = 'cubic-bezier(.2,.7,.2,1)', SH = '0 1px 2px rgba(0,0,0,.95),0 0 4px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.85),0 0 28px rgba(0,0,0,.7),0 0 48px rgba(0,0,0,.5)';   /* тень только вокруг букв: текст читается и на светлом мраморе, плашки нет */
var LINE = 'linear-gradient(270deg,' + A + ',rgba(200,168,118,.12))';
var css = D.createElement('style');
css.textContent = [
  /* ---------- кнопка "две полоски" ---------- */
  'body.mn-ul #muzG{width:44px;height:44px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.34);background:rgba(6,7,12,.28);color:#ece8e0;font-size:0;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .3s,border-color .3s,background-color .3s;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 0 14px rgba(0,0,0,.35)}',
  'body.mn-ul #muzG:hover,body.mn-ul #muzG[aria-expanded="true"]{color:' + A2 + ';border-color:rgba(200,168,118,.7)}',
  'body.mn-ul #muzG:focus-visible{outline:1px solid ' + A + ';outline-offset:3px}',
  'body.mn-ul #muzG .mn-bars{display:grid;gap:5px;width:16px;pointer-events:none}',
  'body.mn-ul #muzG .mn-bars i{display:block;height:1.5px;background:currentColor;border-radius:1px;transition:transform .45s ' + E + '}',
  'body.mn-ul #muzG[aria-expanded="true"] .mn-bars i:first-child{transform:translateY(3.25px) rotate(45deg)}',
  'body.mn-ul #muzG[aria-expanded="true"] .mn-bars i:last-child{transform:translateY(-3.25px) rotate(-45deg)}',
  /* ---------- вуаль ---------- */
  '#mnVeil{position:fixed;inset:0;z-index:59;background:rgba(6,7,12,.8);opacity:0;pointer-events:none;transition:opacity .45s ' + E + '}',
  '#mnVeil.on{opacity:1;pointer-events:auto}',
  /* ---------- панель меню: без рамки, линия и слова ---------- */
  'body.mn-ul #muzP{width:min(300px,calc(100vw - 32px));padding:0 0 6px;border:0;border-radius:0;background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;text-align:right;color:#ece8e0;font:500 13px/1.35 system-ui,sans-serif;' +
    'transform:none;transition:opacity .3s ease .12s;scrollbar-width:thin}',
  'body.mn-ul #muzP:not(.off){transition:none}',
  'body.mn-ul #muzP.off{transform:none}',
  'body.mn-ul #muzP::before{content:"";display:block;height:1px;margin:0 0 10px;background:' + LINE + ';transform-origin:100% 50%;transform:scaleX(0);transition:transform .35s ' + E + '}',
  'body.mn-ul #muzP:not(.off)::before{transform:scaleX(1);transition:transform .55s ' + E + '}',
  'body.mn-ul #muzP>*{opacity:0;transform:translateY(-6px);transition:opacity .22s ease-in,transform .22s ease-in}',
  'body.mn-ul #muzP:not(.off)>*{opacity:1;transform:none;transition:opacity .5s ' + E + ',transform .5s ' + E + ';transition-delay:calc(var(--k,0) * 60ms + .3s)}',
  'body.mn-ul #muzP .mn-ph{margin:0 0 4px;color:#8a867d;font:600 10px system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase}',
  /* пункты-кнопки: слово и короткая линия справа */
  'body.mn-ul #muzP .kmnG{display:block;margin:0 0 6px}',
  'body.mn-ul #muzP .kmnG button,body.mn-ul #muzP .shFs{all:unset;box-sizing:border-box;display:flex;flex-direction:row-reverse;align-items:center;gap:12px;width:100%;min-height:44px;cursor:pointer;color:#ece8e0;' +
    'font:400 19px/1.15 Georgia,"Times New Roman",serif;text-align:right;text-shadow:' + SH + ';transition:color .3s,transform .45s ' + E + ';-webkit-tap-highlight-color:transparent}',
  'body.mn-ul #muzP .kmnG button::after,body.mn-ul #muzP .shFs::after{content:"";flex:none;width:18px;height:1px;background:currentColor;opacity:.35;transition:width .35s ' + E + ',opacity .3s}',
  'body.mn-ul #muzP .kmnG button:hover,body.mn-ul #muzP .shFs:hover{transform:translateX(-6px);color:' + A2 + '}',
  'body.mn-ul #muzP .kmnG button:hover::after,body.mn-ul #muzP .shFs:hover::after{width:28px;opacity:.9}',
  'body.mn-ul #muzP .kmnG button:focus-visible,body.mn-ul #muzP .shFs:focus-visible,body.mn-ul #muzP #kchR button:focus-visible{outline:1px solid ' + A + ';outline-offset:3px}',
  /* ползунки: подпись, значение золотом, тонкая дорожка */
  'body.mn-ul #muzP label{display:block;margin:4px 0 6px;text-shadow:' + SH + '}',
  'body.mn-ul #muzP label span,body.mn-ul #muzP #kchR>span{display:flex;flex-direction:row-reverse;justify-content:space-between;gap:10px;color:#cfc9bd;font:600 11px system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase}',
  'body.mn-ul #muzP b{color:' + A2 + ';font-weight:600;letter-spacing:.04em}',
  'body.mn-ul #muzP input[type=range]{display:block;width:100%;height:30px;margin:2px 0 0;accent-color:' + A + ';cursor:pointer;background:none}',
  /* графика: четыре слова, выбранное - золотом и подчёркнуто */
  'body.mn-ul #muzP #kchR{margin:8px 0 6px;text-shadow:' + SH + '}',
  'body.mn-ul #muzP #kchR .kch-b{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:2px}',
  'body.mn-ul #muzP #kchR button{all:unset;box-sizing:border-box;min-height:44px;display:grid;place-items:center;cursor:pointer;color:#cfc9bd;font:500 13px system-ui,sans-serif;position:relative;-webkit-tap-highlight-color:transparent;transition:color .3s}',
  'body.mn-ul #muzP #kchR button::after{content:"";position:absolute;left:22%;right:22%;bottom:9px;height:1px;background:currentColor;opacity:0;transform:scaleX(.3);transition:transform .35s ' + E + ',opacity .3s}',
  'body.mn-ul #muzP #kchR button:hover{color:#fff}',
  'body.mn-ul #muzP #kchR button.on{color:' + A2 + ';background:none}',
  'body.mn-ul #muzP #kchR button.on::after{opacity:.9;transform:none}',
  'body.mn-ul #muzP #kchR small{color:#a8a296;opacity:1;text-align:right}',
  'body.mn-ul #muzP #avM{margin-top:6px;color:#8a867d;font:500 11px/1.4 system-ui,sans-serif;text-align:right;text-shadow:none}body.mn-ul #muzP #avM .avL{display:block;margin:2px 0 0 auto;color:#a8a296}',
  'body.mn-ul.mn-open #kmn .k-card,body.mn-ul.mn-open #kmn .k-hint{opacity:0!important;pointer-events:none!important}',
  '@media (max-height:500px){body.mn-ul #muzP #kchR small{display:none}body.mn-ul #muzP .kmnG button,body.mn-ul #muzP .shFs{font-size:17px}}',
  'body.mn-ul #kmn .k-top .k-ic{width:44px;height:44px;border:1px solid rgba(255,255,255,.34);background:rgba(6,7,12,.28);backdrop-filter:none;-webkit-backdrop-filter:none;color:#ece8e0;box-shadow:0 0 14px rgba(0,0,0,.35)}',
  'body.mn-ul #kmn .k-top .k-ic:hover{color:' + A2 + ';border-color:rgba(200,168,118,.7)}',
  /* ---------- подсказки комнат без плашек ---------- */
  'body.mn-ul #kmn .k-ttl{pointer-events:none}',
  'body.mn-ul #kmn .k-card{background:none;border:0;border-radius:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:10px 0 4px;text-align:right;color:#f1ede6;text-shadow:' + SH + '}',
  'body.mn-ul #kmn .k-card::before{content:"";display:block;height:1px;margin:0 0 9px;background:' + LINE + ';transform-origin:100% 50%;transform:scaleX(0);transition:transform .55s ' + E + '}',
  'body.mn-ul #kmn .k-card.on::before{transform:scaleX(1)}',
  'body.mn-ul #kmn .k-card small{color:' + A2 + ';letter-spacing:.2em}',
  'body.mn-ul #kmn .k-card h3{color:#fff;font-weight:600}',
  'body.mn-ul #kmn .k-card p{color:#f4f0e8;font-weight:600}',
  'body.mn-ul #kmn .k-acts{justify-content:flex-end;gap:2px 18px;margin-top:6px}',
  'body.mn-ul #kmn .k-card .k-b{min-height:44px;padding:0;border:0;border-radius:0;background:none;box-shadow:none;color:#ece8e0;font:700 14.5px ' + '"Manrope","Segoe UI",Roboto,system-ui,sans-serif' + ';display:inline-flex;flex-direction:row-reverse;align-items:center;gap:10px;text-shadow:' + SH + ';transition:color .3s,transform .45s ' + E + '}',
  'body.mn-ul #kmn .k-card .k-b::after{content:"";width:16px;height:1px;background:currentColor;opacity:.4;transition:width .35s ' + E + ',opacity .3s}',
  'body.mn-ul #kmn .k-card .k-b.pri{color:' + A2 + ';background:none;box-shadow:none}',
  'body.mn-ul #kmn .k-card .k-b.pri::after{width:26px;opacity:.9}',
  'body.mn-ul #kmn .k-card .k-b:hover{transform:translateX(-5px);color:#fff}',
  'body.mn-ul #kmn .k-card .k-b:focus-visible{outline:1px solid ' + A + ';outline-offset:3px}',
  'body.mn-ul #kmn .k-hint,body.mn-ul #kmn .k-toast,body.mn-ul #toast{background:linear-gradient(90deg,rgba(200,168,118,0),rgba(200,168,118,.75),rgba(200,168,118,0)) 50% 100%/100% 1px no-repeat;border:0;border-radius:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;color:#f1ede6;text-shadow:' + SH + ';padding:8px 16px 9px}',
  'body.mn-ul #kmn .k-toast{color:' + A2 + '}',
  'body.mn-ul #kmn .k-st{background:none;border:0;border-radius:0;backdrop-filter:none;-webkit-backdrop-filter:none;color:' + A2 + ';text-shadow:' + SH + ';min-height:44px;display:inline-flex;align-items:center;padding:0 8px}',
  'body.mn-ul #kmn .k-st::after{content:"";position:absolute;left:8px;right:8px;bottom:9px;height:1px;background:' + LINE + ';opacity:.8}',
  'body.mn-ul #kmn .hl-go{background:none;border:0;border-radius:0;backdrop-filter:none;-webkit-backdrop-filter:none;color:#ece8e0;text-shadow:' + SH + ';min-height:44px}',
  'body.mn-ul #kmn .hl-go::after{content:"";position:absolute;left:18px;right:18px;bottom:8px;height:1px;background:linear-gradient(90deg,rgba(200,168,118,.15),' + A + ')}',
  'body.mn-ul #kmn .hl-go:hover{color:' + A2 + '}',
  /* в кресле: "‹ Встать ›" - слова с тонкой линией */
  'body.mn-ul #kmn .k-up{gap:6px}',
  'body.mn-ul #kmn .k-up .k-b{min-height:44px;min-width:44px;padding:0 14px;border:0;border-radius:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;color:#ece8e0;text-shadow:' + SH + ';font-size:16px;position:relative}',
  'body.mn-ul #kmn .k-up .k-b::after{content:"";position:absolute;left:14px;right:14px;bottom:8px;height:1px;background:currentColor;opacity:.35}',
  'body.mn-ul #kmn .k-up .k-b.pri{color:' + A2 + ';background:none}',
  'body.mn-ul #kmn .k-up .k-b.pri::after{opacity:.9;background:' + LINE + '}',
  'body.mn-ul #kmn .k-up .k-b.k-go{animation:mnGo 1.6s ease-in-out infinite}@keyframes mnGo{50%{color:#fff;transform:translateY(-2px)}}',
  /* начало урока: "Лера рассказывает" / "Читаю сам" */
  'body.mn-ul #ntS .nt-b{gap:28px}',
  'body.mn-ul #ntS .nt-b button{width:auto;height:44px;padding:0 4px;border:0;border-radius:0;background:none;backdrop-filter:none;-webkit-backdrop-filter:none;color:#f1ede6;text-shadow:' + SH + ';position:relative;font-weight:600;font-size:16px}',
  'body.mn-ul #ntS .nt-b button::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:1px;background:linear-gradient(90deg,rgba(200,168,118,.15),' + A + ')}',
  'body.mn-ul #ntS .nt-b button:hover{color:' + A2 + ';background:none}',
  'body.mn-ul #ntS .nt-b button i{width:auto;height:auto;background:none;color:' + A2 + ';font-size:13px}',
  /* лифт: этажи - строки с номером и тонкой линией, без карточек */
  'body.mn-ul.sh-holl .shFl{border:0;border-radius:0;background:none;box-shadow:none;margin:0;padding:8px 2px;border-bottom:1px solid rgba(255,255,255,.1);min-height:52px}',
  'body.mn-ul.sh-holl .shFl .n{width:auto;height:auto;border:0;border-radius:0;min-width:34px;font-size:20px;background:none!important;color:var(--c)}',
  'body.mn-ul.sh-holl .shFl .t{font-weight:600}',
  'body.mn-ul.sh-holl .shFl.done .n{color:var(--c)}',
  'body.mn-ul.sh-holl .shFl.next{box-shadow:none;border-bottom-color:var(--c)}',
  'body.mn-ul.sh-holl .shFl.next .t{color:#fff}',
  'body.mn-ul.sh-holl .shFl:hover .t{color:' + A2 + '}',
  'body.mn-ul.sh-holl #shLiftX{background:none;border:0;border-radius:0;color:#cfc9bd;font-weight:600;min-height:44px;text-decoration:underline;text-decoration-color:rgba(200,168,118,.6);text-underline-offset:6px}',
  '@media (prefers-reduced-motion:reduce){body.mn-ul #muzP::before,body.mn-ul #muzP>*,body.mn-ul #kmn .k-card::before,#mnVeil,body.mn-ul #muzG .mn-bars i{transition:none!important}}'
].join('\n');
D.head.appendChild(css);

function mount() {
  var gb = D.getElementById('muzG'), pn = D.getElementById('muzP');
  if (!gb || !pn) return false;
  D.body.classList.add('mn-ul');
  gb.textContent = ''; var bars = D.createElement('span'); bars.className = 'mn-bars'; bars.setAttribute('aria-hidden', 'true'); bars.innerHTML = '<i></i><i></i>'; gb.appendChild(bars);
  gb.setAttribute('aria-label', 'Меню и настройки'); gb.setAttribute('aria-expanded', 'false'); gb.setAttribute('aria-controls', 'muzP'); gb.title = 'Меню';
  var ph = D.createElement('p'); ph.className = 'mn-ph'; ph.textContent = 'Настройки'; pn.insertBefore(ph, pn.firstChild);
  var veil = D.createElement('div'); veil.id = 'mnVeil'; D.body.appendChild(veil);
  /* меню открыто, когда muzyka.js снимает с панели класс off */
  function isOpen() { return !pn.classList.contains('off'); }
  function sync() { var o = isOpen(); gb.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) { if (pn.firstChild !== ph) pn.insertBefore(ph, pn.firstChild); for (var i = 0, k = 0; i < pn.children.length; i++) pn.children[i].style.setProperty('--k', k++);
      veil.classList.add('on'); D.body.classList.add('mn-open'); }
    else { D.body.classList.remove('mn-open'); if (RED) veil.classList.remove('on'); else setTimeout(function () { if (!isOpen()) veil.classList.remove('on'); }, 200); } }
  new MutationObserver(sync).observe(pn, { attributes: true, attributeFilter: ['class'] });
  /* пункты, которые другие файлы добавляют позже (графика, весь экран), тоже получают свою очередь */
  new MutationObserver(function () { if (isOpen()) sync(); }).observe(pn, { childList: true });
  function close() { if (!isOpen()) return; if (window.MUZYKA && MUZYKA.close) MUZYKA.close(); else pn.classList.add('off'); }
  veil.addEventListener('click', close);
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(); });
  sync();
  /* 28.11 (Alexandr, ПК): открылось меню, список этажей лифта или окно задания - стрелка нужна для выбора, поэтому захват мыши снимаем,
     и картинка стоит (свободная стрелка камеру не крутит). Снова крутить - щелчок по залу. */
  function free() { try { if (D.pointerLockElement) D.exitPointerLock(); } catch (e) {} }
  function watch(id) { var el = D.getElementById(id); if (!el) return false; new MutationObserver(function () { if (el.classList.contains('on')) free(); }).observe(el, { attributes: true, attributeFilter: ['class'] }); return true; }
  new MutationObserver(function () { if (isOpen()) free(); }).observe(pn, { attributes: true, attributeFilter: ['class'] });
  ['shLift', 'win'].forEach(function (id) { (function w(n) { if (!watch(id) && n < 120) setTimeout(function () { w(n + 1); }, 250); })(0); });
  return true;
}
(function wait(n) { if (mount()) return; if (n < 120) setTimeout(function () { wait(n + 1); }, 250); })(0);
})();
