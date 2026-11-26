/* Курс FPV. (c) 2026 Александр Наумов, клуб "Взлёт". Все права защищены.
   avtor.js (18.11.2026): авторство курса - одно место для подписи и условий использования.
   Подпись меняется только здесь (AVTOR ниже), все страницы берут её отсюда.
   Что показывает:
   - экран входа: строка "Автор курса: ..." под кнопками;
   - меню шестерёнки (в городе и в комнатах): строка автора и кнопка "Условия использования";
   - подвал окна модуля и обычной страницы: "(c) 2026 ..., все права защищены" и ссылка на условия;
   - экран "Модуль пройден": значок (c) с именем автора;
   - окно "Условия использования" (тот же текст - на странице usloviya.html);
   - скрытые метки: window.KURS_AVTOR, meta author/copyright, строка в консоли. */
(function () {
  'use strict';
  var AVTOR = {
    imya: 'Александр Наумов',
    klub: 'клуб "Взлёт"',
    god: 2026,
    kurs: 'Курс FPV',
    znak: 'KFPV-AN-2026'   /* метка авторства: ищется в коде и данных курса */
  };
  AVTOR.podpis = AVTOR.imya + ', ' + AVTOR.klub;
  AVTOR.stroka = 'Автор курса: ' + AVTOR.podpis + ', ' + AVTOR.god;
  AVTOR.copy = '© ' + AVTOR.god + ' ' + AVTOR.podpis + '. Все права защищены.';
  /* условия использования: заголовок, абзацы; строка с "- " в начале - пункт списка */
  AVTOR.usloviya = [
    'Условия использования курса',
    AVTOR.kurs + ' - авторская работа. ' + AVTOR.stroka + '.',
    'Автору принадлежат тексты, задания и вопросы, сценарий и порядок модулей, рисунки, летающий город и комнаты, тренажёры, озвучка и код курса.',
    'Можно:',
    '- проходить курс и смотреть материалы;',
    '- заниматься по коду, который выдал педагог;',
    '- делиться ссылкой на курс.',
    'Нельзя без письменного разрешения автора:',
    '- копировать курс целиком или по частям (тексты, задания, картинки, озвучку, код);',
    '- переделывать курс и выкладывать его у себя;',
    '- выдавать курс или его части за свои, убирать имя автора;',
    '- продавать курс или доступ к нему.',
    'Хотите взять курс для своей школы или кружка - напишите автору, договоримся.',
    'Сторонние части остаются под своими лицензиями: библиотека three.js (MIT), 3D-модели и текстуры Kenney, Poly Haven, Quaternius (CC0). Это касается только этих файлов, а не курса.',
    'История создания курса с датами каждой правки хранится в репозитории автора.'
  ];
  window.KURS_AVTOR = AVTOR;

  function usloviyaHtml() {
    var h = '<h2>' + AVTOR.usloviya[0] + '</h2>', ul = false;
    AVTOR.usloviya.slice(1).forEach(function (s) {
      if (s.indexOf('- ') === 0) { if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + s.slice(2) + '</li>'; return; }
      if (ul) { h += '</ul>'; ul = false; }
      h += '<p>' + s + '</p>';
    });
    if (ul) h += '</ul>';
    return h + '<p class="avS">' + AVTOR.copy + '</p>';
  }
  AVTOR.html = usloviyaHtml;

  var css = document.createElement('style');
  css.textContent =
    '.avL{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}' +
    '#avW{position:absolute;left:0;right:0;top:100%;margin-top:10px;color:var(--dim,#a7acd2);font:600 12px/1.4 var(--body,system-ui,sans-serif);opacity:.85}' +
    '#avM{margin:6px 0 2px;padding-top:8px;border-top:1px solid rgba(255,255,255,.16);color:#c9cde8;font:600 11.5px/1.35 system-ui,sans-serif}' +
    '#avM .avL{display:block;margin-top:4px;color:#7cf3ff}' +
    '.avF{margin:14px 4px 0;text-align:center;color:var(--dim,#8b98a5);font:600 11.5px/1.4 system-ui,sans-serif;opacity:.8}' +
    /* 26.11 (проба): на телефоне круглая кнопка "дальше" закрывала конец строки автора в окне задания */
    '@media (pointer:coarse) and (max-height:560px){.ul #win .avF{padding:0 84px}}' +
    '.avD{margin:8px 0 0;text-align:center;color:var(--dim,#a7acd2);font:600 12px/1.4 system-ui,sans-serif}' +
    '#avU{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,4,12,.72)}' +
    '#avU[hidden]{display:none}' +
    '#avU .avB,#avPage{max-width:620px;max-height:calc(100vh - 32px);overflow:auto;padding:18px 20px 16px;border-radius:18px;background:#0d1226;border:1px solid rgba(170,180,255,.3);color:#eef0ff;font:500 14.5px/1.5 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
    '#avPage{margin:24px auto;max-height:none}' +
    '#avU h2,#avPage h2{margin:0 0 10px;font-size:19px}#avU p,#avPage p{margin:8px 0}#avU ul,#avPage ul{margin:4px 0 8px;padding-left:22px}' +
    '#avU .avS,#avPage .avS{color:#a7acd2;font-size:12.5px}' +
    '#avX{display:block;margin:12px auto 0;min-height:38px;padding:0 22px;border-radius:99px;border:1px solid rgba(124,243,255,.6);background:none;color:#7cf3ff;font:700 14px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(css);

  /* метки в заголовке страницы (если их там ещё нет) */
  [['author', AVTOR.podpis], ['copyright', AVTOR.copy]].forEach(function (m) {
    if (document.querySelector('meta[name="' + m[0] + '"]')) return;
    var e = document.createElement('meta'); e.name = m[0]; e.content = m[1]; document.head.appendChild(e);
  });

  function okno() {
    var u = document.getElementById('avU');
    if (!u) {
      u = document.createElement('div'); u.id = 'avU'; u.setAttribute('role', 'dialog'); u.setAttribute('aria-modal', 'true');
      u.innerHTML = '<div class="avB">' + usloviyaHtml() + '<button id="avX" type="button">Понятно</button></div>';
      u.addEventListener('click', function (e) { if (e.target === u || e.target.id === 'avX') u.hidden = true; });
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { u.addEventListener(t, function (e) { e.stopPropagation(); }); });
      document.body.appendChild(u);
    }
    u.hidden = false;
  }
  AVTOR.okno = okno;
  function knopka(txt) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'avL'; b.textContent = txt;
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); okno(); });
    return b;
  }
  function podval() {
    var f = document.createElement('div'); f.className = 'avF';
    f.appendChild(document.createTextNode(AVTOR.copy + ' '));
    f.appendChild(knopka('Условия использования'));
    return f;
  }

  function start() {
    /* отдельная страница условий */
    var pg = document.getElementById('avPage');
    if (pg) { pg.innerHTML = usloviyaHtml(); return; }

    /* экран входа */
    var wel = document.getElementById('wel');
    if (wel && !document.getElementById('avW')) {
      var w = document.createElement('div'); w.id = 'avW';
      w.appendChild(document.createTextNode(AVTOR.stroka + '. '));
      w.appendChild(knopka('Условия'));
      wel.appendChild(w);
    }
    /* подвал окна модуля (карта) или страницы (обычный вид) */
    var box = document.querySelector('#win .wbox');
    if (box) box.appendChild(podval());
    else if (!wel) document.body.insertBefore(podval(), document.body.querySelector('script'));

    /* меню шестерёнки: панель "Голос Леры / Музыка" появляется из muzyka.js */
    function vMenu() {
      var p = document.getElementById('muzP');
      if (!p || document.getElementById('avM')) return !!p;
      var m = document.createElement('div'); m.id = 'avM';
      m.appendChild(document.createTextNode(AVTOR.stroka));
      m.appendChild(knopka('Условия использования'));
      p.appendChild(m);
      return true;
    }
    /* значок (c) на экране "Модуль пройден" */
    function vFinal() {
      var d = document.querySelectorAll('.kr-done');
      for (var i = 0; i < d.length; i++) {
        var e = d[i];
        if (e.getAttribute('data-av') || !/пройден/i.test(e.textContent)) continue;
        e.setAttribute('data-av', '1');
        var c = document.createElement('div'); c.className = 'avD'; c.textContent = '© ' + AVTOR.god + ' ' + AVTOR.podpis;
        e.parentNode.insertBefore(c, e.nextSibling);
      }
    }
    vMenu(); vFinal();
    var t = 0;
    new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = 0; vMenu(); vFinal(); }, 300); })
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  try { console.info('%c' + AVTOR.kurs + ' - ' + AVTOR.copy, 'color:#7cf3ff'); } catch (e) {}
})();
